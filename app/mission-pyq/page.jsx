
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ART_CULTURE_SUBJECT } from "../mains-roadmap/data/art-culture";

const GOLD = "#dfc477";

const DEFAULT_THEME = {
  page: "#f4f1ea",
  card: "#fffefa",
  text: "#161616",
  muted: "#77736b",
  border: "rgba(16,16,16,.10)",
  dark: "#101010",
  track: "#e7e2d9",
};

function topicName(q, type) {
  return String(
    q?.topic ||
      q?.subject ||
      q?.paper ||
      (type === "prelims" ? "General Studies" : "Mains GS")
  ).trim() || "General Studies";
}

function priorityFor(q, type, counts) {
  const key = `${type}:${topicName(q, type).toLowerCase()}`;
  const n = counts[key] || 1;

  if (n >= 5) return "P1";
  if (n >= 3) return "P2";
  return "P3";
}

function normalizeThemeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGSOne(paper) {
  const value = normalizeThemeText(paper).replace(/\s+/g, "");

  return [
    "gsi",
    "gspaper1",
    "gs1",
    "generalstudies1",
    "generalstudiespaper1",
  ].includes(value);
}

function matchesArtCultureTheme(question, theme) {
  if (question._type !== "mains" || !isGSOne(question.paper)) {
    return false;
  }

  const exactTopics = (theme?.match?.topics || []).map(normalizeThemeText);
  const keywords = (theme?.match?.keywords || []).map(normalizeThemeText);

  const topic = normalizeThemeText(question.topic);
  const text = normalizeThemeText(
    `${question.question || ""} ${question.question_hi || ""} ${
      question.topic || ""
    } ${question.subject || ""}`
  );

  if (topic && exactTopics.includes(topic)) return true;

  return keywords.some(
    (keyword) => keyword.length >= 5 && text.includes(keyword)
  );
}

function getThemeById(themeId) {
  return ART_CULTURE_SUBJECT.themes.find(
    (item) => item.id === themeId
  );
}

export default function MissionPYQPage() {
  const router = useRouter();

  const deepLinkHandled = useRef(false);

  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [prelims, setPrelims] = useState([]);
  const [mains, setMains] = useState([]);
  const [progress, setProgress] = useState([]);

  const [section, setSection] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [roadmapFilter, setRoadmapFilter] = useState(null);

  // Read Roadmap deep-link parameters without useSearchParams,
  // so the page does not introduce a useSearchParams Suspense requirement.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      const themeId = params.get("theme") || "";
      const themeTitle = params.get("themeTitle") || "";
      const questionId = params.get("q") || "";
      const requestedSection = params.get("section") || "";
      const requestedPaper = params.get("paper") || "";

      if (themeId || questionId) {
        setRoadmapFilter({
          themeId,
          themeTitle,
          questionId,
          paper: requestedPaper,
        });

        setSection(requestedSection === "mains" || themeId || questionId
          ? "mains"
          : "all");

        deepLinkHandled.current = false;
      }
    } catch {
      // Ignore malformed URL parameters and keep normal Mission PYQ mode.
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sambhav-theme", theme);
      document.documentElement.dataset.sambhavTheme = theme;
    } catch {}
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [authRes, preRes, mainRes, progressRes] =
          await Promise.all([
            fetch("/api/auth/me", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/pyq/prelims", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/pyq/mains", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/pyq/progress", {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        const [auth, preData, mainData, progressData] =
          await Promise.all([
            authRes.json().catch(() => ({})),
            preRes.json().catch(() => ({})),
            mainRes.json().catch(() => ({})),
            progressRes.json().catch(() => ({})),
          ]);

        if (!authRes.ok || !auth?.user) {
          router.replace("/login");
          return;
        }

        if (!preRes.ok) {
          throw new Error(
            preData?.error || "Prelims PYQs load nahi hue."
          );
        }

        if (!mainRes.ok) {
          throw new Error(
            mainData?.error || "Mains PYQs load nahi hue."
          );
        }

        const prelimRows = Array.isArray(preData?.pyqs)
          ? preData.pyqs.map((q, i) => ({
              ...q,
              id: String(q.id ?? `prelims-${q.year ?? "x"}-${i}`),
              _type: "prelims",
              question: q.question || "",
              options: Array.isArray(q.options) ? q.options : [],
              subject:
                q.subject || q.category || "General Studies",
              topic: q.topic || q.subject || "General Studies",
            }))
          : [];

        const mainsRows = Array.isArray(mainData?.pyqs)
          ? mainData.pyqs.map((q, i) => ({
              ...q,
              id: String(q.id ?? `mains-${q.year ?? "x"}-${i}`),
              _type: "mains",
              question: q.question || "",
              topic: q.topic || q.paper || "Mains GS",
            }))
          : [];

        if (!cancelled) {
          setPrelims(prelimRows);
          setMains(mainsRows);
          setProgress(
            Array.isArray(progressData?.progress)
              ? progressData.progress
              : []
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.message || "Mission PYQ load nahi ho paya."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const allQuestions = useMemo(
    () => [...prelims, ...mains],
    [prelims, mains]
  );

  const activeRoadmapTheme = useMemo(
    () =>
      roadmapFilter?.themeId
        ? getThemeById(roadmapFilter.themeId)
        : null,
    [roadmapFilter]
  );

  const topicCounts = useMemo(() => {
    const counts = {};

    allQuestions.forEach((q) => {
      const key = `${q._type}:${topicName(
        q,
        q._type
      ).toLowerCase()}`;

      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [allQuestions]);

  const progressMap = useMemo(() => {
    const map = new Map();

    progress.forEach((p) => {
      map.set(`${p.pyq_type}:${p.pyq_id}`, p);
    });

    return map;
  }, [progress]);

  const questions = useMemo(() => {
    let rows = allQuestions.map((q) => ({
      ...q,
      _priority: priorityFor(q, q._type, topicCounts),
      _progress: progressMap.get(`${q._type}:${q.id}`),
    }));

    // When a Roadmap theme is provided, show only the questions
    // mapped to that theme. Do not fall back to the full question bank.
    if (roadmapFilter?.themeId) {
      if (activeRoadmapTheme) {
        rows = rows.filter((q) =>
          matchesArtCultureTheme(q, activeRoadmapTheme)
        );
      } else {
        rows = [];
      }
    }

    if (roadmapFilter?.questionId && roadmapFilter?.themeId) {
      rows = rows.filter((q) => q._type === "mains");
    } else {
      rows = rows.filter(
        (q) => section === "all" || q._type === section
      );
    }

    // A single question link still respects its theme mapping.
    // The q parameter only controls automatic opening below.
    rows = rows
      .filter(
        (q) => priority === "all" || q._priority === priority
      )
      .filter(
        (q) =>
          !search ||
          `${q.question} ${q.question_hi || ""} ${q.topic} ${
            q.subject || ""
          } ${q.paper || ""} ${q.year || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          ({ P1: 0, P2: 1, P3: 2 }[a._priority] -
            { P1: 0, P2: 1, P3: 2 }[b._priority]) ||
          Number(b.year || 0) - Number(a.year || 0)
      );

    return rows;
  }, [
    allQuestions,
    topicCounts,
    progressMap,
    section,
    priority,
    search,
    roadmapFilter,
    activeRoadmapTheme,
  ]);

  // Open the exact linked question after data and theme mapping are ready.
  useEffect(() => {
    if (
      loading ||
      !roadmapFilter?.questionId ||
      deepLinkHandled.current
    ) {
      return;
    }

    const exactQuestion = questions.find(
      (q) => String(q.id) === String(roadmapFilter.questionId)
    );

    if (exactQuestion) {
      setSelected(exactQuestion);
      setAnswerText("");
      setNotice("");
      deepLinkHandled.current = true;
    } else if (allQuestions.length > 0) {
      // Keep the theme-filtered list visible if the requested ID
      // is absent from the current API response or mapping.
      deepLinkHandled.current = true;
      setNotice(
        "Linked question current theme mapping mein nahi mila. Neeche available mapped questions dikh rahe hain."
      );
    }
  }, [loading, roadmapFilter, questions, allQuestions]);

  // Keep the selected question's progress fields current after a save.
  useEffect(() => {
    if (!selected) return;

    const refreshed = allQuestions.find(
      (q) =>
        q._type === selected._type &&
        String(q.id) === String(selected.id)
    );

    if (refreshed) {
      const updated = {
        ...refreshed,
        _priority: priorityFor(
          refreshed,
          refreshed._type,
          topicCounts
        ),
        _progress: progressMap.get(
          `${refreshed._type}:${refreshed.id}`
        ),
      };

      setSelected((current) => {
        if (
          !current ||
          current._type !== updated._type ||
          String(current.id) !== String(updated.id)
        ) {
          return current;
        }

        return updated;
      });
    }
    // Intentionally update only when saved progress or source data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressMap, allQuestions, topicCounts]);

  const attemptedCount = progress.filter(
    (p) => p.attempted
  ).length;

  const masteredCount = progress.filter(
    (p) => p.status === "mastered"
  ).length;

  const dueCount = progress.filter(
    (p) =>
      p.status === "revise" ||
      (p.revision_due_at &&
        new Date(p.revision_due_at) <= new Date())
  ).length;

  async function saveProgress(q, updates = {}) {
    const old =
      progressMap.get(`${q._type}:${q.id}`) || {};

    const payload = {
      pyq_id: String(q.id),
      pyq_type: q._type,
      status: updates.status ?? old.status ?? "new",
      bookmarked:
        updates.bookmarked ?? old.bookmarked ?? false,
      attempted:
        updates.attempted ?? old.attempted ?? false,
      attempt_count:
        updates.attempt_count ?? old.attempt_count ?? 0,
      correct_count:
        updates.correct_count ?? old.correct_count ?? 0,
      wrong_count:
        updates.wrong_count ?? old.wrong_count ?? 0,
      revision_due_at:
        updates.revision_due_at ??
        old.revision_due_at ??
        null,
    };

    setSaving(true);
    setNotice("");

    try {
      const res = await fetch("/api/pyq/progress", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || "Progress save nahi hua."
        );
      }

      setProgress((prev) => {
        const key = `${q._type}:${q.id}`;

        return [
          ...prev.filter(
            (p) => `${p.pyq_type}:${p.pyq_id}` !== key
          ),
          data.progress || { ...old, ...payload },
        ];
      });

      setNotice("Progress save ho gayi.");
    } catch (e) {
      setNotice(e.message || "Progress save nahi hui.");
    } finally {
      setSaving(false);
    }
  }

  async function markAttempted() {
    if (!selected) return;

    const old =
      progressMap.get(`${selected._type}:${selected.id}`) ||
      {};

    await saveProgress(selected, {
      attempted: true,
      attempt_count: Number(old.attempt_count || 0) + 1,
      status: "revise",
      revision_due_at: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  function clearRoadmapFilter() {
    setRoadmapFilter(null);
    setSelected(null);
    setAnswerText("");
    setNotice("");
    setSection("all");
    setPriority("all");

    try {
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    } catch {}
  }

  const colors =
    theme === "dark"
      ? {
          page: "#0b0b0b",
          card: "#151515",
          text: "#f5f2eb",
          muted: "#aaa59a",
          border: "rgba(255,255,255,.12)",
          track: "#2b2b2b",
        }
      : DEFAULT_THEME;

  const css = {
    minHeight: "100vh",
    background: colors.page,
    color: colors.text,
    padding: "18px 14px 100px",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  };

  const button = {
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "10px 12px",
    background: colors.card,
    color: colors.text,
    fontWeight: 800,
    cursor: "pointer",
  };

  const goldButton = {
    ...button,
    background: GOLD,
    color: "#17130b",
    borderColor: GOLD,
  };

  if (loading) {
    return (
      <main
        style={{
          ...css,
          display: "grid",
          placeItems: "center",
        }}
      >
        Mission PYQ load ho raha hai…
      </main>
    );
  }

  if (error) {
    return (
      <main style={css}>
        <div
          style={{
            maxWidth: 760,
            margin: "30px auto",
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            padding: 22,
          }}
        >
          <h2>Mission PYQ</h2>
          <p>{error}</p>
          <button
            style={button}
            onClick={() => router.push("/premium/home")}
          >
            Dashboard par wapas jao
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={css}>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible,
        select:focus-visible {
          outline: 2px solid #dfc477;
          outline-offset: 2px;
        }

        @media (max-width: 520px) {
          .mission-header {
            align-items: flex-start !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header
          className="mission-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <button
              style={{ ...button, marginBottom: 12 }}
              onClick={() => router.push("/premium/home")}
            >
              ← Dashboard
            </button>

            <div
              style={{
                color: GOLD,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              SAMBHAV UPSC • MISSION MODE
            </div>

            <h1
              style={{
                margin: "5px 0",
                fontSize: "clamp(25px,5vw,36px)",
                letterSpacing: -1,
              }}
            >
              Mission PYQ
            </h1>

            <div
              style={{
                color: colors.muted,
                fontSize: 13,
              }}
            >
              Prelims GS + Mains GS I–IV • Topic-wise practice and revision
            </div>
          </div>

          <button
            style={button}
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </header>

        {roadmapFilter?.themeId && (
          <section
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 15,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              ROADMAP THEME FILTER
            </div>

            <h2 style={{ fontSize: 17, margin: "7px 0" }}>
              {activeRoadmapTheme?.title ||
                roadmapFilter.themeTitle ||
                "Selected theme"}
            </h2>

            <p
              style={{
                color: colors.muted,
                fontSize: 12,
                lineHeight: 1.6,
                margin: "0 0 12px",
              }}
            >
              {questions.length} mapped question(s) available in the
              current question bank. Mapping uses the theme topic tags
              and keywords; please review matches before relying on
              them as a definitive syllabus classification.
            </p>

            <button
              style={button}
              onClick={clearRoadmapFilter}
            >
              Clear theme filter
            </button>
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 9,
            marginBottom: 18,
          }}
        >
          {[
            [
              roadmapFilter?.themeId
                ? questions.length
                : allQuestions.length,
              roadmapFilter?.themeId
                ? "MAPPED PYQs"
                : "PYQs LOADED",
            ],
            [attemptedCount, "ATTEMPTED"],
            [dueCount, "REVISION DUE"],
          ].map(([value, label]) => (
            <div
              key={label}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: "14px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                {value}
              </div>
              <div
                style={{
                  color: colors.muted,
                  fontSize: 9,
                  fontWeight: 800,
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "#101010",
            color: "white",
            borderRadius: 20,
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              color: GOLD,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1.1,
            }}
          >
            YOUR STUDY ORDER
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 9,
              marginTop: 12,
            }}
          >
            {[
              ["P1", "Highly repeated", "#dfc477"],
              ["P2", "Repeated", "#c6c6c6"],
              ["P3", "Normal recurrence", "#9b9b9b"],
            ].map(([p, title, color]) => (
              <div
                key={p}
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.09)",
                  borderRadius: 13,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    color,
                    fontSize: 19,
                    fontWeight: 900,
                  }}
                >
                  {p}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    marginTop: 3,
                  }}
                >
                  {title}
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              color: "#bdbdbd",
              fontSize: 10,
              lineHeight: 1.5,
              marginBottom: 0,
            }}
          >
            Priority loaded question bank mein topic recurrence par
            based estimate hai; ye official UPSC prediction nahi hai.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 9,
            marginBottom: 10,
          }}
        >
          <button
            style={section === "all" ? goldButton : button}
            onClick={() => {
              setSection("all");
              setSelected(null);
            }}
            disabled={!!roadmapFilter?.themeId}
          >
            All PYQs
          </button>

          <button
            style={section === "prelims" ? goldButton : button}
            onClick={() => {
              setSection("prelims");
              setSelected(null);
            }}
            disabled={!!roadmapFilter?.themeId}
          >
            Prelims GS
          </button>

          <button
            style={section === "mains" ? goldButton : button}
            onClick={() => {
              setSection("mains");
              setSelected(null);
            }}
          >
            Mains GS I–IV
          </button>

          <button
            style={priority === "P1" ? goldButton : button}
            onClick={() =>
              setPriority(priority === "P1" ? "all" : "P1")
            }
          >
            Only P1 Topics
          </button>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 9,
            marginBottom: 18,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topic, question, paper or year…"
            style={{
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: 13,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
            }}
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{
              maxWidth: 120,
              padding: 10,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
            }}
          >
            <option value="all">All P-levels</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </div>

        {notice && (
          <div
            role="status"
            style={{
              marginBottom: 12,
              padding: 11,
              borderRadius: 12,
              background: colors.card,
              border: `1px solid ${colors.border}`,
              fontSize: 12,
            }}
          >
            {notice}
          </div>
        )}

        {selected ? (
          <section
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 20,
              padding: 18,
            }}
          >
            <button
              style={{ ...button, marginBottom: 15 }}
              onClick={() => {
                setSelected(null);
                setAnswerText("");
                setNotice("");
              }}
            >
              ← Question list
            </button>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  ...button,
                  padding: "6px 9px",
                  fontSize: 10,
                  background: "#101010",
                  color: GOLD,
                }}
              >
                {selected._priority}
              </span>

              <span
                style={{
                  ...button,
                  padding: "6px 9px",
                  fontSize: 10,
                }}
              >
                {selected._type === "prelims"
                  ? "PRELIMS GS"
                  : selected.paper || "MAINS GS"}
              </span>

              <span
                style={{
                  ...button,
                  padding: "6px 9px",
                  fontSize: 10,
                }}
              >
                {selected.year || "Year N/A"}
              </span>
            </div>

            <h2
              style={{
                fontSize: 19,
                lineHeight: 1.5,
                marginTop: 0,
              }}
            >
              {selected.question}
            </h2>

            {selected._type === "prelims" &&
              selected.options?.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                    margin: "15px 0",
                  }}
                >
                  {selected.options.map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      {String.fromCharCode(65 + i)}. {String(opt)}
                    </div>
                  ))}
                </div>
              )}

            {selected._type === "mains" ? (
              <>
                <div
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    margin: "8px 0 12px",
                  }}
                >
                  Marks: {selected.marks ?? "—"} • Word limit:{" "}
                  {selected.word_limit ??
                    (Number(selected.marks) === 10
                      ? 150
                      : Number(selected.marks) === 15
                        ? 250
                        : "—")}
                </div>

                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 7,
                  }}
                >
                  Answer notes / planning (optional)
                </label>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={5}
                  placeholder="Yahan apna answer draft ya key points likh sakte ho. Handwritten answer ki AI evaluation existing Answer Writing module se karein."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.page,
                    color: colors.text,
                    resize: "vertical",
                  }}
                />

                <p
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    lineHeight: 1.5,
                  }}
                >
                  Handwritten pages upload aur AI evaluation ke liye
                  existing Mains Answer Writing module use hoga.
                </p>

                <button
                  style={button}
                  onClick={() => {
                    // Pass the exact selected PYQ to the existing Answer Writing page.
                    // This prevents the manual-question form from appearing for a mapped PYQ.
                    const marksValue = Number(selected.marks || 15);
                    const wordLimitValue = Number(
                      selected.word_limit || selected.words || (marksValue <= 10 ? 150 : 250)
                    );
                    const answerQuestion = {
                      id: String(selected.id),
                      pyq_id: String(selected.id),
                      year: selected.year ?? "",
                      paper: selected.paper || "GS I",
                      section: "Mains",
                      topic: selected.topic || activeRoadmapTheme?.title || "Art & Culture",
                      question: selected.question || "",
                      question_hi: selected.question_hi || "",
                      question_number: selected.question_number ?? selected.question_no ?? null,
                      marks: marksValue,
                      word_limit: wordLimitValue,
                      words: wordLimitValue,
                      verified: true,
                      source: selected.source || "UPSC Official",
                      theme_id: roadmapFilter?.themeId || "",
                      theme_title: activeRoadmapTheme?.title || roadmapFilter?.themeTitle || "",
                    };

                    try {
                      sessionStorage.setItem(
                        "sambhav_answer_question",
                        JSON.stringify(answerQuestion)
                      );
                    } catch {
                      setNotice("Question transfer nahi ho saka. Browser storage allow karke dobara try karein.");
                      return;
                    }

                    router.push("/answer");
                  }}
                >
                  Open Answer Writing & AI Evaluation →
                </button>
              </>
            ) : (
              <p
                style={{
                  color: colors.muted,
                  fontSize: 12,
                }}
              >
                Is question ko attempt karne ke baad progress mark
                karo. Source mein available explanation fields hi
                dikhaye ja sakte hain.
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 9,
                marginTop: 16,
              }}
            >
              <button
                disabled={saving}
                style={goldButton}
                onClick={markAttempted}
              >
                {saving
                  ? "Saving…"
                  : "Attempted • Revision tomorrow"}
              </button>

              <button
                disabled={saving}
                style={button}
                onClick={() =>
                  saveProgress(selected, {
                    bookmarked: !(
                      progressMap.get(
                        `${selected._type}:${selected.id}`
                      )?.bookmarked
                    ),
                    status: "important",
                  })
                }
              >
                {progressMap.get(
                  `${selected._type}:${selected.id}`
                )?.bookmarked
                  ? "★ Saved"
                  : "☆ Bookmark"}
              </button>

              <button
                disabled={saving}
                style={button}
                onClick={() =>
                  saveProgress(selected, { status: "mastered" })
                }
              >
                Mark mastered
              </button>
            </div>
          </section>
        ) : (
          <section style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                color: colors.muted,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {questions.length} QUESTIONS • P1 → P2 → P3
            </div>

            {questions.slice(0, 250).map((q) => (
              <button
                key={`${q._type}:${q.id}`}
                onClick={() => {
                  setSelected(q);
                  setNotice("");
                }}
                style={{
                  textAlign: "left",
                  background: colors.card,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: 15,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      background: "#101010",
                      color: GOLD,
                      padding: "4px 7px",
                      borderRadius: 7,
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {q._priority}
                  </span>

                  <span
                    style={{
                      color: colors.muted,
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {q._type === "prelims"
                      ? "PRELIMS"
                      : q.paper || "MAINS"}
                  </span>

                  <span
                    style={{
                      color: colors.muted,
                      fontSize: 10,
                    }}
                  >
                    {q.year || "Year N/A"}
                  </span>

                  <span
                    style={{
                      marginLeft: "auto",
                      color:
                        q._progress?.status === "mastered"
                          ? "#39824a"
                          : colors.muted,
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {q._progress?.status === "mastered"
                      ? "MASTERED"
                      : q._progress?.attempted
                        ? "ATTEMPTED"
                        : "NOT STARTED"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontWeight: 750,
                  }}
                >
                  {q.question || "Question text unavailable"}
                </div>

                <div
                  style={{
                    color: colors.muted,
                    fontSize: 10,
                    marginTop: 8,
                  }}
                >
                  Topic: {topicName(q, q._type)} · Open mission →
                </div>
              </button>
            ))}

            {questions.length > 250 && (
              <p
                style={{
                  color: colors.muted,
                  fontSize: 11,
                }}
              >
                Search/filter karke baaki questions dekhein. Mobile
                performance ke liye pehle 250 matching questions
                render kiye gaye hain.
              </p>
            )}

            {questions.length === 0 && (
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                {roadmapFilter?.themeId
                  ? "Is theme ke liye current Mains question bank mein matching question nahi mila. Theme mapping aur question paper metadata verify karein."
                  : "Is filter ke liye question nahi mila."}
              </div>
            )}
          </section>
        )}

        <footer
          style={{
            color: colors.muted,
            fontSize: 10,
            lineHeight: 1.6,
            marginTop: 24,
          }}
        >
          Mission progress existing <code>pyq_user_progress</code> API
          mein user-wise save hoti hai. Topic priority loaded PYQ
          metadata par based estimate hai, official UPSC forecast nahi.
          Theme mapping topic tags aur keywords par based hai; har
          match ko official topic classification nahi maana jana chahiye.
        </footer>
      </div>
    </main>
  );
}
