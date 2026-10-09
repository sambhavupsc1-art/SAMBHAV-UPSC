
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const status = showResolved ? "resolved" : "active";
      const params = new URLSearchParams({ status });

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
        throw new Error(mistakeData.error || "Could not load mistakes.");
      }

      if (!analyticsResponse.ok) {
        throw new Error(analyticsData.error || "Could not load analytics.");
      }

      setMistakes(mistakeData.mistakes || []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || "Unable to load your learning dashboard.");
    } finally {
      setLoading(false);
    }
  }, [filterSubject, showResolved]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subjects = [
    ...new Set(
      (analytics?.subjects || []).map((item) => item.subject).filter(Boolean)
    ),
  ];

  const colors = {
    green: "#16835f",
    yellow: "#b77912",
    red: "#c64747",
  };

  const masteryStyle = (level) => ({
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 9px",
    fontSize: 11,
    fontWeight: 800,
    color: colors[level] || "#64748b",
    background:
      level === "green"
        ? "#e6f6ee"
        : level === "yellow"
        ? "#fff4d9"
        : "#fdeaea",
  });

  const panelStyle = {
    border: "1px solid var(--border, #e5e7eb)",
    borderRadius: 16,
    padding: 18,
    background: "var(--card, #ffffff)",
    color: "var(--text, #111827)",
    minWidth: 0,
  };

  if (loading) {
    return (
      <section style={panelStyle}>
        <p style={{ margin: 0 }}>Loading your learning analytics…</p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 16, marginTop: 20 }}>
      <div style={panelStyle}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, opacity: 0.7 }}>
          SMART QUIZ ANALYTICS
        </div>

        <h2 style={{ margin: "7px 0", fontSize: 22 }}>
          Your learning dashboard
        </h2>

        <p style={{ margin: "0 0 16px", fontSize: 13, opacity: 0.72 }}>
          Track accuracy, identify weak topics and revisit mistakes.
        </p>

        {error ? (
          <div
            role="alert"
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#fdeaea",
              color: "#a32626",
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
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
                padding: 13,
                borderRadius: 12,
                background: "var(--muted-card, #f7f8fa)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
              <div style={{ fontSize: 23, fontWeight: 800, marginTop: 5 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={panelStyle}>
        <h3 style={{ margin: "0 0 5px", fontSize: 18 }}>
          Memory Heatmap
        </h3>

        <p style={{ margin: "0 0 14px", fontSize: 12, opacity: 0.7 }}>
          Green: above 70% · Yellow: 40–70% · Red: below 40%
        </p>

        {!analytics?.subjects?.length && !analytics?.topics?.length ? (
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            Your mastery map will appear after your first quiz is saved.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {(analytics?.subjects || []).map((item) => (
              <div
                key={item.subject}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {item.subject}
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "#e5e7eb",
                      borderRadius: 99,
                      marginTop: 7,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, item.accuracy)}%`,
                        background: colors[item.mastery],
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    {item.accuracy}%
                  </div>
                  <span style={masteryStyle(item.mastery)}>
                    {item.mastery.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {(analytics?.topics || []).length > 0 ? (
          <>
            <h4 style={{ margin: "20px 0 10px", fontSize: 14 }}>
              Topic mastery
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
                gap: 9,
              }}
            >
              {analytics.topics.map((item, index) => (
                <div
                  key={`${item.subject}-${item.topic}-${index}`}
                  style={{
                    border: "1px solid var(--border, #e5e7eb)",
                    borderRadius: 11,
                    padding: 11,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    {item.topic}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>
                    {item.subject}
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 800, margin: "7px 0" }}>
                    {item.accuracy}%
                  </div>
                  <span style={masteryStyle(item.mastery)}>
                    {item.mastery.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Mistake Notebook</h3>
            <p style={{ margin: "5px 0 0", fontSize: 12, opacity: 0.7 }}>
              Review incorrect answers and their explanations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResolved((value) => !value)}
            style={{
              border: "1px solid var(--border, #d1d5db)",
              background: "transparent",
              color: "inherit",
              borderRadius: 9,
              padding: "9px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {showResolved ? "View active mistakes" : "View resolved"}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
            Filter by subject
          </label>
          <select
            value={filterSubject}
            onChange={(event) => setFilterSubject(event.target.value)}
            style={{
              width: "100%",
              maxWidth: 320,
              padding: 10,
              borderRadius: 9,
              border: "1px solid var(--border, #d1d5db)",
              background: "var(--card, #ffffff)",
              color: "inherit",
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

        {mistakes.length === 0 ? (
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 16 }}>
            {showResolved
              ? "No resolved mistakes found yet."
              : "No active mistakes found. Saved incorrect answers will appear here."}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {mistakes.map((item) => {
              const isExpanded = Boolean(expanded[item.id]);

              return (
                <article
                  key={item.id}
                  style={{
                    border: "1px solid var(--border, #e5e7eb)",
                    borderRadius: 12,
                    padding: 13,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={masteryStyle(item.is_resolved ? "green" : "red")}>
                      {item.is_resolved ? "RESOLVED" : "REVISE"}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.7, paddingTop: 4 }}>
                      {item.subject} · {item.topic}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.7, paddingTop: 4 }}>
                      Attempts: {item.attempt_count}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, lineHeight: 1.6, margin: "12px 0" }}>
                    {item.question}
                  </p>

                  {isExpanded ? (
                    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 700, marginBottom: 5 }}>
                        Options
                      </div>
                      {item.options?.map((option, index) => (
                        <div key={index}>
                          {String.fromCharCode(65 + index)}. {option}
                        </div>
                      ))}
                      <p>
                        <strong>Your answer: </strong>
                        {item.selected_option === null ||
                        item.selected_option === undefined
                          ? "Not attempted"
                          : String.fromCharCode(65 + item.selected_option)}
                      </p>
                      <p>
                        <strong>Correct answer: </strong>
                        {item.correct_option === null ||
                        item.correct_option === undefined
                          ? "Unavailable"
                          : String.fromCharCode(65 + item.correct_option)}
                      </p>
                      {item.explanation ? (
                        <p>
                          <strong>Explanation: </strong>
                          {item.explanation}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((previous) => ({
                        ...previous,
                        [item.id]: !previous[item.id],
                      }))
                    }
                    style={{
                      marginTop: 8,
                      border: "1px solid var(--border, #d1d5db)",
                      background: "transparent",
                      color: "inherit",
                      borderRadius: 8,
                      padding: "8px 10px",
                      cursor: "pointer",
                      fontWeight: 700,
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
            marginTop: 15,
            border: "1px solid var(--border, #d1d5db)",
            background: "transparent",
            color: "inherit",
            borderRadius: 9,
            padding: "9px 12px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Refresh analytics
        </button>
      </div>
    </section>
  );
}
