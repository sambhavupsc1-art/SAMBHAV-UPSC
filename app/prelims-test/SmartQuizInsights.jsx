
"use client";

import { useCallback, useEffect, useState } from "react";

export default function SmartQuizInsights() {
  const [mistakes, setMistakes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filterSubject, setFilterSubject] = useState("all");
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [retestQuestions, setRetestQuestions] = useState([]);
  const [retestSessionId, setRetestSessionId] = useState("");
  const [retestAnswers, setRetestAnswers] = useState({});
  const [retestBookmarks, setRetestBookmarks] = useState({});
  const [retestLoading, setRetestLoading] = useState(false);
  const [retestSubmitting, setRetestSubmitting] = useState(false);
  const [retestError, setRetestError] = useState("");
  const [retestResult, setRetestResult] = useState(null);
  const [retestStartedAt, setRetestStartedAt] = useState(0);

  // Follow the existing SAMBHAV UPSC theme toggle.
  useEffect(() => {
    const syncTheme = () => {
      const saved = document.documentElement.dataset.sambhavTheme;
      setTheme(saved === "dark" ? "dark" : "light");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-sambhav-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const dark = theme === "dark";

  const ui = {
    page: dark ? "#101010" : "#ffffff",
    card: dark ? "#191919" : "#ffffff",
    muted: dark ? "#232323" : "#f5f6f8",
    border: dark ? "#353535" : "#e2e4e8",
    text: dark ? "#f5f5f5" : "#171923",
    secondary: dark ? "#b8b8b8" : "#626775",
    gold: dark ? "#e6ca79" : "#a98222",
    track: dark ? "#393939" : "#e5e7eb",
    input: dark ? "#202020" : "#ffffff",
    buttonText: dark ? "#f5f5f5" : "#252525",
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status: showResolved ? "resolved" : "active",
      });

      if (filterSubject !== "all") {
        params.set("subject", filterSubject);
      }

      const [mistakeResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/mistakes?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/analytics/heatmap", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const mistakeData = await mistakeResponse.json();
      const analyticsData = await analyticsResponse.json();

      if (!mistakeResponse.ok) {
        throw new Error(
          mistakeData.error || "Could not load mistakes."
        );
      }

      if (!analyticsResponse.ok) {
        throw new Error(
          analyticsData.error || "Could not load analytics."
        );
      }

      setMistakes(mistakeData.mistakes || []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(
        err.message || "Unable to load your learning dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [filterSubject, showResolved]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startMistakeRetest = async () => {
    setRetestLoading(true);
    setRetestError("");
    setRetestResult(null);
    setRetestQuestions([]);
    setRetestAnswers({});
    setRetestBookmarks({});
    setRetestSessionId("");

    try {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mistake_retest",
          subject: filterSubject,
          topic: "all",
          count: Math.max(1, Math.min(100, mistakes.length)),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.sessionId || !Array.isArray(data.questions)) {
        throw new Error(data.error || "Could not start a mistake retest.");
      }
      if (!data.questions.length) {
        throw new Error("No active mistakes are available for retesting.");
      }
      setRetestSessionId(String(data.sessionId));
      setRetestQuestions(data.questions);
      setRetestStartedAt(Date.now());
    } catch (err) {
      setRetestError(err.message || "Unable to start mistake retest.");
    } finally {
      setRetestLoading(false);
    }
  };

  const submitMistakeRetest = async () => {
    if (!retestSessionId || !retestQuestions.length) return;
    setRetestSubmitting(true);
    setRetestError("");

    try {
      const answers = retestQuestions.map((question) => ({
        questionId: String(question.id),
        selectedOption: Object.prototype.hasOwnProperty.call(retestAnswers, String(question.id))
          ? retestAnswers[String(question.id)]
          : null,
        isBookmarked: Boolean(retestBookmarks[String(question.id)]),
        timeTakenSeconds: 0,
      }));

      const response = await fetch("/api/mistakes/retest", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mistake_retest",
          sessionId: retestSessionId,
          answers,
          timeTakenSeconds: Math.max(0, Math.round((Date.now() - retestStartedAt) / 1000)),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not submit mistake retest.");
      }
      setRetestResult(data.summary || {});
      setRetestQuestions([]);
      setRetestSessionId("");
      await loadData();
    } catch (err) {
      setRetestError(err.message || "Unable to submit mistake retest.");
    } finally {
      setRetestSubmitting(false);
    }
  };

  const subjects = [
    ...new Set(
      (analytics?.subjects || [])
        .map((item) => item.subject)
        .filter(Boolean)
    ),
  ];

  const masteryColors = {
    green: {
      text: dark ? "#75e0b2" : "#126b4c",
      bg: dark ? "#173d30" : "#e1f5eb",
    },
    yellow: {
      text: dark ? "#f0d17b" : "#8b6410",
      bg: dark ? "#40351c" : "#fff2ce",
    },
    red: {
      text: dark ? "#ffaaaa" : "#a62e2e",
      bg: dark ? "#452323" : "#fde8e8",
    },
  };

  const masteryStyle = (level) => {
    const color = masteryColors[level] || {
      text: ui.secondary,
      bg: ui.muted,
    };

    return {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "4px 9px",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 0.4,
      color: color.text,
      background: color.bg,
    };
  };

  const panelStyle = {
    border: `1px solid ${ui.border}`,
    borderRadius: 20,
    padding: "clamp(16px, 3vw, 24px)",
    background: ui.card,
    color: ui.text,
    minWidth: 0,
    boxShadow: dark
      ? "0 8px 28px rgba(0,0,0,0.12)"
      : "0 5px 22px rgba(20,25,35,0.035)",
    transition:
      "background 180ms ease, color 180ms ease, border-color 180ms ease",
  };

  const buttonStyle = {
    border: `1px solid ${ui.border}`,
    background: dark ? "#222222" : "#ffffff",
    color: ui.buttonText,
    borderRadius: 11,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    minHeight: 40,
  };

  const labelStyle = {
    color: ui.secondary,
    fontSize: 12,
    lineHeight: 1.6,
  };

  const renderError = error ? (
    <div
      role="alert"
      style={{
        padding: 13,
        borderRadius: 12,
        border: `1px solid ${dark ? "#643333" : "#f3caca"}`,
        background: dark ? "#321e1e" : "#fff0f0",
        color: dark ? "#ffb8b8" : "#a32626",
        marginBottom: 14,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {error}
    </div>
  ) : null;

  if (loading) {
    return (
      <section style={{ ...panelStyle, marginTop: 20 }}>
        <div
          style={{
            color: ui.gold,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            marginBottom: 8,
          }}
        >
          SMART QUIZ ANALYTICS
        </div>
        <p style={{ margin: 0, color: ui.secondary }}>
          Loading your learning analytics…
        </p>
      </section>
    );
  }

  return (
    <section
      data-smart-quiz-insights
      style={{
        display: "grid",
        gap: 16,
        marginTop: 20,
        color: ui.text,
        colorScheme: theme,
        minWidth: 0,
      }}
    >
      {/* Learning dashboard */}
      <div style={panelStyle}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.7,
            color: ui.gold,
          }}
        >
          SMART QUIZ ANALYTICS
        </div>

        <h2
          style={{
            margin: "9px 0 7px",
            fontSize: "clamp(21px, 4vw, 27px)",
            lineHeight: 1.25,
            letterSpacing: "-0.5px",
            color: ui.text,
          }}
        >
          Your learning dashboard
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            fontSize: 13,
            lineHeight: 1.7,
            color: ui.secondary,
          }}
        >
          Track accuracy, identify weak topics and revisit mistakes.
        </p>

        {renderError}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 125px), 1fr))",
            gap: 10,
          }}
        >
          {[
            ["Attempted", analytics?.summary?.attempted ?? 0],
            ["Correct", analytics?.summary?.correct ?? 0],
            ["Wrong", analytics?.summary?.wrong ?? 0],
            ["Accuracy", `${analytics?.summary?.accuracy ?? 0}%`],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "15px 14px",
                borderRadius: 15,
                border: `1px solid ${ui.border}`,
                borderTop: `2px solid ${ui.gold}`,
                background: ui.muted,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: ui.secondary,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "clamp(22px, 4vw, 28px)",
                  fontWeight: 850,
                  marginTop: 7,
                  letterSpacing: "-0.5px",
                  color: ui.text,
                  overflowWrap: "anywhere",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory heatmap */}
      <div style={panelStyle}>
        <div
          style={{
            fontSize: 10,
            color: ui.gold,
            fontWeight: 800,
            letterSpacing: 1.5,
            marginBottom: 7,
          }}
        >
          MASTERY TRACKER
        </div>

        <h3
          style={{
            margin: "0 0 7px",
            fontSize: 20,
            color: ui.text,
          }}
        >
          Memory Heatmap
        </h3>

        <p style={{ ...labelStyle, margin: "0 0 18px" }}>
          Green: above 70% · Yellow: 40–70% · Red: below 40%
        </p>

        {!analytics?.subjects?.length &&
        !analytics?.topics?.length ? (
          <div
            style={{
              border: `1px dashed ${ui.border}`,
              borderRadius: 13,
              padding: 18,
              background: ui.muted,
              color: ui.secondary,
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Your mastery map will appear after your first quiz is saved.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 17 }}>
            {(analytics?.subjects || []).map((item) => (
              <div
                key={item.subject}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                      color: ui.text,
                    }}
                  >
                    {item.subject}
                  </div>

                  <div
                    style={{
                      height: 7,
                      background: ui.track,
                      borderRadius: 99,
                      marginTop: 9,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(
                          100,
                          Math.max(0, Number(item.accuracy) || 0)
                        )}%`,
                        background:
                          masteryColors[item.mastery]?.text || ui.gold,
                        borderRadius: 99,
                        transition: "width 250ms ease",
                      }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: ui.text,
                      marginBottom: 5,
                    }}
                  >
                    {item.accuracy}%
                  </div>
                  <span style={masteryStyle(item.mastery)}>
                    {String(item.mastery || "unknown").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {(analytics?.topics || []).length > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: ui.border,
                margin: "22px 0 17px",
              }}
            />
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: ui.text,
              }}
            >
              Topic mastery
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
                gap: 10,
              }}
            >
              {analytics.topics.map((item, index) => (
                <div
                  key={`${item.subject}-${item.topic}-${index}`}
                  style={{
                    border: `1px solid ${ui.border}`,
                    borderRadius: 13,
                    padding: 13,
                    background: ui.muted,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 750,
                      lineHeight: 1.5,
                      color: ui.text,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.topic}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: ui.secondary,
                      marginTop: 4,
                    }}
                  >
                    {item.subject}
                  </div>

                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 850,
                      margin: "10px 0",
                      color: ui.text,
                    }}
                  >
                    {item.accuracy}%
                  </div>

                  <span style={masteryStyle(item.mastery)}>
                    {String(item.mastery || "unknown").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mistake notebook */}
      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                color: ui.gold,
                fontWeight: 800,
                letterSpacing: 1.5,
                marginBottom: 7,
              }}
            >
              REVISION CENTRE
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 20,
                color: ui.text,
              }}
            >
              Mistake Notebook
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                lineHeight: 1.6,
                color: ui.secondary,
              }}
            >
              Review incorrect answers and their explanations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResolved((value) => !value)}
            style={buttonStyle}
          >
            {showResolved ? "View active mistakes" : "View resolved"}
          </button>
        </div>

        <div style={{ marginTop: 19 }}>
          <label
            htmlFor="smart-quiz-subject-filter"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 650,
              color: ui.secondary,
              marginBottom: 8,
            }}
          >
            Filter by subject
          </label>

          <select
            id="smart-quiz-subject-filter"
            value={filterSubject}
            onChange={(event) => setFilterSubject(event.target.value)}
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "12px 13px",
              borderRadius: 11,
              border: `1px solid ${ui.border}`,
              background: ui.input,
              color: ui.text,
              fontSize: 13,
              outlineColor: ui.gold,
              colorScheme: theme,
            }}
          >
            <option value="all">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {!showResolved && (
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={startMistakeRetest}
              disabled={retestLoading || mistakes.length === 0}
              style={{
                ...buttonStyle,
                borderColor: ui.gold,
                background: dark ? "#292416" : "#fff8e5",
                color: dark ? "#f0d88f" : "#765719",
                opacity: retestLoading || mistakes.length === 0 ? 0.6 : 1,
                cursor: retestLoading || mistakes.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {retestLoading ? "Preparing retest…" : "Start Mistake Retest"}
            </button>
            <span style={labelStyle}>{mistakes.length} active mistake{mistakes.length === 1 ? "" : "s"}</span>
          </div>
        )}

        {retestError && (
          <div role="alert" style={{ marginTop: 12, padding: 12, borderRadius: 10, border: `1px solid ${dark ? "#643333" : "#f3caca"}`, background: dark ? "#321e1e" : "#fff0f0", color: dark ? "#ffb8b8" : "#a32626", fontSize: 13, lineHeight: 1.6 }}>
            {retestError}
          </div>
        )}

        {retestResult && (
          <div role="status" style={{ marginTop: 12, padding: 14, borderRadius: 12, border: `1px solid ${ui.border}`, background: ui.muted, color: ui.text }}>
            <strong>Mistake retest submitted</strong>
            <div style={{ marginTop: 6, fontSize: 13, color: ui.secondary }}>
              Correct: {retestResult.correct ?? 0} · Wrong: {retestResult.wrong ?? 0} · Accuracy: {retestResult.accuracy ?? 0}%
            </div>
            <button type="button" onClick={() => { setRetestResult(null); loadData(); }} style={{ ...buttonStyle, marginTop: 10 }}>Refresh notebook</button>
          </div>
        )}

        {retestQuestions.length > 0 && (
          <div style={{ ...panelStyle, marginTop: 14, background: ui.muted }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <h4 style={{ margin: 0, color: ui.text, fontSize: 17 }}>Mistake Retest</h4>
                <p style={{ margin: "5px 0 0", ...labelStyle }}>{retestQuestions.length} questions · Correct answers resolve active mistakes</p>
              </div>
              <button type="button" onClick={() => { setRetestQuestions([]); setRetestSessionId(""); setRetestAnswers({}); setRetestBookmarks({}); setRetestError(""); }} style={buttonStyle}>Cancel</button>
            </div>
            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              {retestQuestions.map((question, index) => (
                <article key={question.id} style={{ border: `1px solid ${ui.border}`, borderRadius: 12, padding: 14, background: ui.card }}>
                  <div style={{ fontSize: 11, color: ui.gold, fontWeight: 800, marginBottom: 8 }}>QUESTION {index + 1} OF {retestQuestions.length}</div>
                  <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.7, color: ui.text }}>{question.question}</p>
                  <div style={{ display: "grid", gap: 8 }}>
                    {(question.options || []).map((option, optionIndex) => (
                      <label key={optionIndex} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: 10, border: `1px solid ${retestAnswers[String(question.id)] === optionIndex ? ui.gold : ui.border}`, borderRadius: 10, cursor: "pointer", color: ui.text, background: retestAnswers[String(question.id)] === optionIndex ? (dark ? "#292416" : "#fff8e5") : ui.card }}>
                        <input type="radio" name={`retest-${question.id}`} checked={retestAnswers[String(question.id)] === optionIndex} onChange={() => setRetestAnswers((previous) => ({ ...previous, [String(question.id)]: optionIndex }))} />
                        <span>{String.fromCharCode(65 + optionIndex)}. {option}</span>
                      </label>
                    ))}
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, color: ui.secondary, fontSize: 12 }}>
                    <input type="checkbox" checked={Boolean(retestBookmarks[String(question.id)])} onChange={(event) => setRetestBookmarks((previous) => ({ ...previous, [String(question.id)]: event.target.checked }))} />
                    Bookmark this question
                  </label>
                </article>
              ))}
            </div>
            <button type="button" disabled={retestSubmitting} onClick={submitMistakeRetest} style={{ ...buttonStyle, marginTop: 16, borderColor: ui.gold, background: dark ? "#292416" : "#fff8e5", color: dark ? "#f0d88f" : "#765719", opacity: retestSubmitting ? 0.6 : 1 }}>
              {retestSubmitting ? "Submitting…" : "Submit Mistake Retest"}
            </button>
          </div>
        )}

        {mistakes.length === 0 ? (
          <div
            style={{
              marginTop: 17,
              border: `1px dashed ${ui.border}`,
              borderRadius: 13,
              padding: 17,
              background: ui.muted,
              fontSize: 13,
              lineHeight: 1.7,
              color: ui.secondary,
            }}
          >
            {showResolved
              ? "No resolved mistakes found yet."
              : "No active mistakes found. Saved incorrect answers will appear here."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 11, marginTop: 17 }}>
            {mistakes.map((item) => {
              const isExpanded = Boolean(expanded[item.id]);

              return (
                <article
                  key={item.id}
                  style={{
                    border: `1px solid ${ui.border}`,
                    borderRadius: 14,
                    padding: "15px",
                    background: ui.muted,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={masteryStyle(
                        item.is_resolved ? "green" : "red"
                      )}
                    >
                      {item.is_resolved ? "RESOLVED" : "REVISE"}
                    </span>

                    <span style={{ ...labelStyle, overflowWrap: "anywhere" }}>
                      {item.subject} · {item.topic}
                    </span>

                    <span style={labelStyle}>
                      Attempts: {item.attempt_count}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      margin: "14px 0",
                      color: ui.text,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.question}
                  </p>

                  {isExpanded && (
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.8,
                        color: ui.secondary,
                        overflowWrap: "anywhere",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          color: ui.text,
                          marginBottom: 6,
                        }}
                      >
                        Options
                      </div>

                      {item.options?.map((option, index) => (
                        <div key={index}>
                          {String.fromCharCode(65 + index)}. {option}
                        </div>
                      ))}

                      <p>
                        <strong style={{ color: ui.text }}>
                          Your answer:{" "}
                        </strong>
                        {item.selected_option == null
                          ? "Not attempted"
                          : String.fromCharCode(65 + item.selected_option)}
                      </p>

                      <p>
                        <strong style={{ color: ui.text }}>
                          Correct answer:{" "}
                        </strong>
                        {item.correct_option == null
                          ? "Unavailable"
                          : String.fromCharCode(65 + item.correct_option)}
                      </p>

                      {item.explanation && (
                        <p>
                          <strong style={{ color: ui.text }}>
                            Explanation:{" "}
                          </strong>
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((previous) => ({
                        ...previous,
                        [item.id]: !previous[item.id],
                      }))
                    }
                    style={{
                      ...buttonStyle,
                      marginTop: 8,
                      borderColor: dark ? "#4a4230" : "#e1d4ad",
                    }}
                  >
                    {isExpanded ? "Hide explanation" : "Review answer"}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={loadData}
          style={{
            ...buttonStyle,
            marginTop: 17,
            borderColor: ui.gold,
            background: dark ? "#292416" : "#fff8e5",
            color: dark ? "#f0d88f" : "#765719",
          }}
        >
          Refresh analytics
        </button>
      </div>
    </section>
  );
}
