"use client";

import { useEffect, useMemo, useState } from "react";

const API = "/api/ai-evaluation-benchmark";

const DIMENSIONS = [
  ["content", "Content quality"],
  ["structure", "Structure"],
  ["examples", "Examples and evidence"],
  ["relevance", "Question relevance"],
  ["analysis", "Analytical depth"],
];

const GOLD = "#c6a45c";

function dateLabel(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function list(value) {
  if (Array.isArray(value)) {
    return value.filter(
      (item) => typeof item === "string" && item.trim()
    );
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function feedbackList(source, key) {
  if (!source || typeof source !== "object") return [];

  const aliases = {
    strengths: ["strengths", "positive_points"],
    weaknesses: ["weaknesses", "improvement_suggestions"],
    comments: ["comments", "feedback", "summary"],
    demand: ["question_demand", "demand_analysis"],
  };

  for (const field of aliases[key] || [key]) {
    const result = list(source[field]);
    if (result.length) return result;
  }

  return [];
}

/**
 * Normalize dimension data without inventing scores.
 *
 * Supports:
 * - Plain objects: { content: 4 }
 * - Numeric strings: { content: "4" }
 * - Score objects: { content: { score: 4 } }
 * - JSON strings containing objects or arrays
 * - Array entries: [{ dimension: "Content quality", score: 4 }]
 * - Alternate dimension names such as content_quality and examples_evidence
 */
function parseDimensionSource(source) {
  if (source == null) return null;

  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) return null;

    try {
      return parseDimensionSource(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const name =
          item.key ??
          item.dimension ??
          item.dimension_key ??
          item.name ??
          item.label ??
          item.title ??
          item.criterion;

        if (name == null) return null;

        return {
          key: normalizeDimensionKey(name),
          value: item,
        };
      })
      .filter(Boolean);
  }

  if (typeof source === "object") {
    return source;
  }

  return null;
}

function normalizeDimensionKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

const DIMENSION_ALIASES = {
  content: [
    "content",
    "contentquality",
    "qualityofcontent",
    "answercontent",
    "subjectknowledge",
    "knowledge",
    "coverage",
    "contentcoverage",
  ],
  structure: [
    "structure",
    "answerstructure",
    "structuring",
    "organization",
    "organisation",
    "presentation",
    "logicalstructure",
  ],
  examples: [
    "examples",
    "example",
    "evidence",
    "examplesandevidence",
    "examplesanddata",
    "data",
    "facts",
    "factsandfigures",
    "supportingevidence",
  ],
  relevance: [
    "relevance",
    "questionrelevance",
    "relevancetoquestion",
    "questiondemand",
    "demand",
    "adherencetoquestion",
    "answerrelevance",
  ],
  analysis: [
    "analysis",
    "analyticaldepth",
    "analysisanddepth",
    "criticalanalysis",
    "criticalthinking",
    "depthofanalysis",
    "analyticalability",
  ],
};

function dimensionValue(source, key) {
  const parsed = parseDimensionSource(source);
  if (!parsed) return null;

  const aliases = DIMENSION_ALIASES[key] || [key];
  const acceptedKeys = new Set(aliases.map(normalizeDimensionKey));
  const scoreKeys = [
    "score",
    "marks",
    "value",
    "obtained_marks",
    "obtainedMarks",
    "rating",
    "total",
  ];
  const containerKeys = [
    "dimensions",
    "dimension_scores",
    "dimensionScores",
    "scores",
    "rubric_scores",
    "rubricScores",
    "criteria",
    "summary",
    "evaluation",
    "feedback",
    "result",
    "details",
  ];

  function numericScore(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const scoreKey of scoreKeys) {
        if (value[scoreKey] == null) continue;
        const result = numericScore(value[scoreKey]);
        if (result != null) return result;
      }
    }

    return null;
  }

  function findDimension(node, depth = 0) {
    if (node == null || depth > 8) return null;

    const normalized = parseDimensionSource(node);
    if (!normalized) return null;

    if (Array.isArray(normalized)) {
      for (const entry of normalized) {
        if (!entry) continue;
        if (acceptedKeys.has(entry.key)) {
          const score = numericScore(entry.value);
          if (score != null) return score;
        }
        const nested = findDimension(entry.value, depth + 1);
        if (nested != null) return nested;
      }
      return null;
    }

    if (typeof normalized !== "object") return null;

    // First check matching dimension names at this level.
    for (const candidate of Object.keys(normalized)) {
      if (!acceptedKeys.has(normalizeDimensionKey(candidate))) continue;
      const score = numericScore(normalized[candidate]);
      if (score != null) return score;
    }

    // Then search known wrapper fields used by evaluation APIs.
    for (const field of containerKeys) {
      if (normalized[field] == null) continue;
      const nested = findDimension(normalized[field], depth + 1);
      if (nested != null) return nested;
    }

    return null;
  }

  return findDimension(parsed);
}

function average(rows, key) {
  if (!rows.length) return null;

  return rows.reduce(
    (sum, row) => sum + Number(row[key]),
    0
  ) / rows.length;
}

function percentage(value) {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${value.toFixed(1)}%`;
}

function formatMarks(value, maximum) {
  if (
    !Number.isFinite(Number(value)) ||
    !Number.isFinite(Number(maximum))
  ) {
    return "Not available";
  }

  return `${Number(value).toFixed(2)} / ${Number(maximum).toFixed(2)}`;
}

function imageList(value) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];

  return values
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item.url === "string") return item.url.trim();
      return "";
    })
    .filter((url) => /^https?:\/\//i.test(url));
}

function Panel({ children, style = {}, ...props }) {
  return (
    <section
      {...props}
      style={{
        minWidth: 0,
        padding: 18,
        border: "1px solid var(--line)",
        borderRadius: 20,
        background: "var(--surface)",
        boxShadow: "0 8px 28px rgba(0,0,0,.08)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 850,
        letterSpacing: "1.15px",
        lineHeight: 1.5,
        textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      {children}
    </div>
  );
}

function Heading({ children, note }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2
        style={{
          margin: "6px 0",
          fontSize: "clamp(18px, 3vw, 23px)",
          letterSpacing: "-.55px",
          lineHeight: 1.25,
        }}
      >
        {children}
      </h2>

      {note && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.75,
            color: "var(--muted)",
          }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, detail, icon }) {
  return (
    <Panel
      style={{
        padding: 15,
        background:
          "linear-gradient(145deg, var(--surface), var(--surface-alt))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Eyebrow>{label}</Eyebrow>

        <span
          aria-hidden="true"
          style={{ color: GOLD, fontSize: 19, fontWeight: 800 }}
        >
          {icon}
        </span>
      </div>

      <div
        style={{
          fontSize: "clamp(25px, 4vw, 34px)",
          fontWeight: 900,
          letterSpacing: "-1px",
          margin: "13px 0 5px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 10,
          lineHeight: 1.7,
          color: "var(--muted)",
        }}
      >
        {detail}
      </div>
    </Panel>
  );
}

function FeedbackBlock({ title, items, empty = "No feedback supplied." }) {
  return (
    <div style={{ marginTop: 15 }}>
      <div style={{ fontSize: 12, fontWeight: 850, marginBottom: 7 }}>
        {title}
      </div>

      {items.length ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 12,
            lineHeight: 1.8,
            color: "var(--text)",
          }}
        >
          {items.map((item, index) => (
            <li key={`${title}-${index}`} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: 1.7,
            color: "var(--muted)",
          }}
        >
          {empty}
        </p>
      )}
    </div>
  );
}

function CopyPanel({ title, subtitle, images, empty }) {
  const [failed, setFailed] = useState({});

  const urls = imageList(images);

  return (
    <Panel style={{ padding: 13 }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 13,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--line)",
            borderRadius: 11,
            background: "var(--surface-alt)",
            color: GOLD,
            fontWeight: 900,
          }}
        >
          ▧
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 850, lineHeight: 1.5 }}>
            {title}
          </div>

          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              lineHeight: 1.6,
              marginTop: 3,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {urls.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
            gap: 10,
          }}
        >
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              style={{
                overflow: "hidden",
                border: "1px solid var(--line)",
                borderRadius: 13,
                background: "var(--image-bg)",
              }}
            >
              {!failed[index] ? (
                <a href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`${title}, page ${index + 1}`}
                    loading="lazy"
                    onError={() =>
                      setFailed((previous) => ({
                        ...previous,
                        [index]: true,
                      }))
                    }
                    style={{
                      width: "100%",
                      height: 290,
                      display: "block",
                      objectFit: "contain",
                      background: "var(--image-bg)",
                    }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    minHeight: 160,
                    display: "grid",
                    placeItems: "center",
                    padding: 16,
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--muted)",
                  }}
                >
                  Image could not load. The image URL may have expired.
                </div>
              )}

              <div
                style={{
                  padding: "10px 11px",
                  fontSize: 10,
                  fontWeight: 800,
                  borderTop: "1px solid var(--line)",
                }}
              >
                Page {index + 1}
                {!failed[index] && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      float: "right",
                      color: "var(--gold)",
                      textDecoration: "none",
                    }}
                  >
                    Open ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            minHeight: 170,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 9,
            border: "1px dashed var(--line)",
            borderRadius: 14,
            background: "var(--image-bg)",
          }}
        >
          <span style={{ fontSize: 30, color: GOLD }}>▧</span>

          <strong style={{ fontSize: 12 }}>{empty}</strong>

          <p
            style={{
              margin: 0,
              maxWidth: 270,
              fontSize: 10,
              lineHeight: 1.7,
              color: "var(--muted)",
            }}
          >
            Images are displayed only when eligible image URLs are supplied
            by the benchmark API.
          </p>
        </div>
      )}
    </Panel>
  );
}

export default function AIEvaluationBenchmarkPage() {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("sambhav-theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(API, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error || "Could not load benchmark records."
          );
        }

        const safeRows = Array.isArray(data.records)
          ? data.records.filter(
              (record) =>
                record &&
                record.id != null &&
                Number.isFinite(Number(record.ai_score)) &&
                Number.isFinite(Number(record.human_score)) &&
                Number(record.maximum_marks) > 0 &&
                typeof record.candidate_answer === "string" &&
                record.candidate_answer.trim()
            )
          : [];

        if (!cancelled) {
          setRecords(safeRows);
          setSelectedId((previous) => {
            if (safeRows.some((r) => String(r.id) === String(previous))) {
              return previous;
            }

            return safeRows[0]?.id != null
              ? String(safeRows[0].id)
              : "";
          });
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Benchmark service unavailable.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const n = records.length;

    const differences = records.map((record) =>
      Math.abs(Number(record.ai_score) - Number(record.human_score))
    );

    const exactCount = differences.filter((value) => value === 0).length;
    const withinOneCount = differences.filter((value) => value <= 1).length;

    return {
      n,
      aiAverage: average(records, "ai_score"),
      humanAverage: average(records, "human_score"),
      mae: n
        ? differences.reduce((sum, value) => sum + value, 0) / n
        : null,
      exact: n ? (exactCount / n) * 100 : null,
      withinOne: n ? (withinOneCount / n) * 100 : null,
      exactCount,
      withinOneCount,
    };
  }, [records]);

  const selected =
    records.find((record) => String(record.id) === String(selectedId)) ||
    records[0] ||
    null;

  const latest = records.reduce((latestDate, record) => {
    const value = record.published_at || record.evaluated_at;

    if (!value) return latestDate;

    return !latestDate || new Date(value) > new Date(latestDate)
      ? value
      : latestDate;
  }, null);

  const grid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
    gap: 13,
  };

  const metricGrid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    gap: 11,
  };

  const rootStyle = {
    "--page": theme === "dark" ? "#101214" : "#f5f2eb",
    "--surface": theme === "dark" ? "#191c1f" : "#fffdf9",
    "--surface-alt": theme === "dark" ? "#22262a" : "#efebe2",
    "--text": theme === "dark" ? "#f4f1e9" : "#171717",
    "--muted": theme === "dark" ? "#a7adb3" : "#77736b",
    "--line": theme === "dark" ? "#33383d" : "#e5e1d8",
    "--image-bg": theme === "dark" ? "#101214" : "#f5f2eb",
    "--gold": GOLD,
    minHeight: "100vh",
    background: "var(--page)",
    color: "var(--text)",
    padding: "20px 13px 55px",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    colorScheme: theme,
    transition: "background .2s ease, color .2s ease",
  };

  return (
    <main style={rootStyle}>
      <style>{`
        * { box-sizing: border-box; }
        .benchmark-shell { width: 100%; max-width: 1060px; margin: 0 auto; }
        .benchmark-link:hover { opacity: .8; }
        .benchmark-button { transition: transform .15s ease, border-color .15s ease; }
        .benchmark-button:hover { transform: translateY(-1px); border-color: var(--gold) !important; }
        .benchmark-record:hover { border-color: var(--gold) !important; }
        .benchmark-copy-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
        @media (max-width: 560px) {
          .benchmark-copy-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <div className="benchmark-shell">
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 26,
          }}
        >
          <a
            className="benchmark-link"
            href="/premium/home"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            ← Back to dashboard
          </a>

          <button
            className="benchmark-button"
            type="button"
            onClick={() =>
              setTheme((current) =>
                current === "dark" ? "light" : "dark"
              )
            }
            style={{
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "10px 13px",
              background: "var(--surface)",
              color: "var(--text)",
              fontWeight: 800,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
          </button>
        </nav>

        <header style={{ marginBottom: 25 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--gold)",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "1.6px",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--gold)",
              }}
            />
            SAMBHAV UPSC · Trust & Transparency
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 5.5vw, 47px)",
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              margin: "12px 0",
              fontWeight: 900,
            }}
          >
            AI Evaluation
            <br />
            <span style={{ color: "var(--gold)" }}>Benchmark</span>
          </h1>

          <p
            style={{
              maxWidth: 720,
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.85,
              margin: 0,
            }}
          >
            We test SAMBHAV AI against consent-based human evaluations of the
            same UPSC Mains answers. Human scores are a reference, not
            infallible ground truth.
          </p>
        </header>

        <Panel
          style={{
            marginBottom: 20,
            padding: "20px 18px",
            background:
              "linear-gradient(135deg, var(--surface), var(--surface-alt))",
            borderColor: "color-mix(in srgb, var(--gold) 40%, var(--line))",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div style={{ maxWidth: 680 }}>
              <Eyebrow>Live validation status</Eyebrow>

              <h2
                style={{
                  fontSize: "clamp(19px, 3vw, 25px)",
                  letterSpacing: "-.5px",
                  margin: "9px 0",
                }}
              >
                {loading
                  ? "Loading verified records…"
                  : error
                    ? "Benchmark temporarily unavailable"
                    : records.length
                      ? "Verified benchmark results"
                      : "Benchmark data being collected"}
              </h2>

              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                {loading
                  ? "Retrieving eligible, published and consented evaluations."
                  : error
                    ? "The data service could not be reached."
                    : records.length
                      ? "The metrics below are calculated from eligible records returned by the benchmark service."
                      : "No published records currently meet verification, consent and score-completeness requirements. No unsupported accuracy claims are presented."}
              </p>
            </div>

            <span
              style={{
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "8px 11px",
                color: "var(--gold)",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".6px",
                whiteSpace: "nowrap",
              }}
            >
              {error
                ? "SERVICE ISSUE"
                : loading
                  ? "LOADING"
                  : records.length
                    ? "VERIFIED DATA"
                    : "AWAITING DATA"}
            </span>
          </div>
        </Panel>

        {error && (
          <Panel style={{ borderColor: "#ba514b", marginBottom: 18 }}>
            <strong>Could not load benchmark</strong>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>{error}</p>

            <button
              className="benchmark-button"
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--line)",
                borderRadius: 10,
                background: "var(--surface-alt)",
                color: "var(--text)",
                fontWeight: 800,
              }}
            >
              Retry
            </button>
          </Panel>
        )}

        <div style={{ marginBottom: 11 }}>
          <Eyebrow>Trust overview</Eyebrow>
        </div>

        <div style={metricGrid}>
          <Metric
            label="Verified answers"
            value={loading ? "…" : metrics.n}
            detail="Eligible published evaluation pairs"
            icon="◎"
          />

          <Metric
            label="Mean absolute error"
            value={metrics.mae == null ? "—" : metrics.mae.toFixed(2)}
            detail="Average absolute marks difference; lower is closer"
            icon="↔"
          />

          <Metric
            label="Exact agreement"
            value={percentage(metrics.exact)}
            detail={
              records.length
                ? `${metrics.exactCount} of ${metrics.n} pairs have identical marks`
                : "Awaiting eligible paired records"
            }
            icon="="
          />

          <Metric
            label="Within 1 mark"
            value={percentage(metrics.withinOne)}
            detail={
              records.length
                ? `${metrics.withinOneCount} of ${metrics.n} pairs differ by at most 1 mark`
                : "Awaiting eligible paired records"
            }
            icon="±"
          />
        </div>

        {!records.length && !loading && !error && (
          <p
            style={{
              color: "var(--muted)",
              fontSize: 10,
              lineHeight: 1.7,
              margin: "10px 2px 20px",
            }}
          >
            Metrics remain blank until eligible verified data exists. No
            illustrative numbers are used.
          </p>
        )}

        <div style={{ marginTop: 25, marginBottom: 11 }}>
          <Eyebrow>Evidence library</Eyebrow>
        </div>

        <Panel style={{ marginBottom: 17 }}>
          <Heading note="Review the original handwritten answer alongside the reference-checked copy. Only consented images from eligible records are displayed.">
            Copy Image Comparison
          </Heading>

          <div className="benchmark-copy-grid">
            <CopyPanel
              title="Original answer copy"
              subtitle="Student's submitted handwritten answer"
              images={selected?.candidate_copy_images}
              empty="Original answer image not available."
            />

            <CopyPanel
              title="Institute / human-checked copy"
              subtitle="Reference evaluator's checked answer"
              images={selected?.institute_copy_images}
              empty="Checked answer image not available."
            />
          </div>

          <p
            style={{
              fontSize: 10,
              lineHeight: 1.7,
              color: "var(--muted)",
              margin: "13px 0 0",
            }}
          >
            For privacy, only images explicitly approved for public benchmark
            display should be published.
          </p>
        </Panel>

        {records.length > 0 && selected && (
          <>
            <div style={{ marginTop: 25, marginBottom: 11 }}>
              <Eyebrow>Evaluation results</Eyebrow>
            </div>

            <div style={metricGrid}>
              <Metric
                label="Human average"
                value={
                  metrics.humanAverage == null
                    ? "—"
                    : metrics.humanAverage.toFixed(2)
                }
                detail="Average recorded human marks"
                icon="H"
              />

              <Metric
                label="SAMBHAV AI average"
                value={
                  metrics.aiAverage == null
                    ? "—"
                    : metrics.aiAverage.toFixed(2)
                }
                detail="Average recorded AI marks"
                icon="AI"
              />
            </div>

            <Panel style={{ marginTop: 17 }}>
              <Heading note="Both evaluations should refer to the same question and original answer.">
                AI vs Human
              </Heading>

              <label
                htmlFor="benchmark-record"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 850,
                  marginBottom: 7,
                }}
              >
                Published benchmark record
              </label>

              <select
                id="benchmark-record"
                value={String(selected.id)}
                onChange={(event) => setSelectedId(event.target.value)}
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: 12,
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  background: "var(--surface-alt)",
                  color: "var(--text)",
                  fontSize: 12,
                }}
              >
                {records.map((record) => (
                  <option key={record.id} value={String(record.id)}>
                    {`${record.subject || "UPSC"} · ${String(
                      record.question || "Question"
                    ).slice(0, 100)}`}
                  </option>
                ))}
              </select>

              <div
                style={{
                  padding: 15,
                  marginTop: 13,
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  background: "var(--surface-alt)",
                }}
              >
                <Eyebrow>
                  {selected.subject || "UPSC"} ·{" "}
                  {selected.question_type || "Question type not specified"}
                </Eyebrow>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    lineHeight: 1.85,
                    marginTop: 8,
                    overflowWrap: "anywhere",
                  }}
                >
                  {selected.question || "Question not supplied."}
                </div>
              </div>

              <div style={{ ...grid, marginTop: 14 }}>
                <Panel style={{ padding: 15 }}>
                  <Eyebrow>Human reference evaluation</Eyebrow>

                  <div
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      margin: "11px 0 5px",
                    }}
                  >
                    {formatMarks(
                      selected.human_score,
                      selected.maximum_marks
                    )}
                  </div>

                  <div style={{ fontSize: 10, color: "var(--muted)" }}>
                    Recorded human score
                  </div>

                  <FeedbackBlock
                    title="Evaluator comments"
                    items={feedbackList(selected.human_feedback, "comments")}
                  />

                  <FeedbackBlock
                    title="Strengths"
                    items={feedbackList(selected.human_feedback, "strengths")}
                  />

                  <FeedbackBlock
                    title="Areas to improve"
                    items={feedbackList(selected.human_feedback, "weaknesses")}
                  />
                </Panel>

                <Panel style={{ padding: 15 }}>
                  <Eyebrow>SAMBHAV AI evaluation</Eyebrow>

                  <div
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      margin: "11px 0 5px",
                    }}
                  >
                    {formatMarks(
                      selected.ai_score,
                      selected.maximum_marks
                    )}
                  </div>

                  <div style={{ fontSize: 10, color: "var(--muted)" }}>
                    Recorded AI score
                  </div>

                  <FeedbackBlock
                    title="Question-demand analysis"
                    items={feedbackList(selected.ai_feedback, "demand")}
                  />

                  <FeedbackBlock
                    title="Strengths"
                    items={feedbackList(selected.ai_feedback, "strengths")}
                  />

                  <FeedbackBlock
                    title="Weaknesses and improvements"
                    items={feedbackList(selected.ai_feedback, "weaknesses")}
                  />
                </Panel>
              </div>

              <Panel
                style={{
                  marginTop: 13,
                  padding: 15,
                  background: "var(--surface-alt)",
                }}
              >
                <Eyebrow>Score difference · AI minus Human</Eyebrow>

                <div
                  style={{
                    fontSize: 25,
                    fontWeight: 900,
                    color: "var(--gold)",
                    marginTop: 7,
                  }}
                >
                  {Number(selected.ai_score) - Number(selected.human_score) > 0
                    ? "+"
                    : ""}
                  {(
                    Number(selected.ai_score) - Number(selected.human_score)
                  ).toFixed(2)}{" "}
                  marks
                </div>

                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 10,
                    lineHeight: 1.8,
                    marginTop: 8,
                  }}
                >
                  Rubric: {selected.rubric_version || "Not specified"}
                  {" · "}
                  Model: {selected.ai_model_version || "Not specified"}
                  {" · "}
                  Published: {dateLabel(selected.published_at)}
                </div>
              </Panel>

              <div style={{ marginTop: 22 }}>
                <Heading note="Missing dimension scores remain unavailable; they are not treated as zero.">
                  Dimension-wise comparison
                </Heading>

                <div style={{ display: "grid", gap: 10 }}>
                  {DIMENSIONS.map(([key, title]) => {
                    const human =
                      dimensionValue(selected.human_dimensions, key) ??
                      dimensionValue(selected.human_feedback, key);

                    const ai =
                      dimensionValue(selected.ai_dimensions, key) ??
                      dimensionValue(selected.ai_feedback, key);

                    const values = [human, ai].filter(
                      (value) => value != null
                    );

                    const maximum = Math.max(
                      ...values.map((value) => Math.abs(value)),
                      1
                    );

                    return (
                      <Panel
                        key={key}
                        style={{ padding: 13, boxShadow: "none" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            gap: 8,
                            fontSize: 11,
                            fontWeight: 850,
                          }}
                        >
                          <span>{title}</span>
                          <span style={{ color: "var(--muted)" }}>
                            Human {human ?? "—"} · AI {ai ?? "—"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: 8,
                            marginTop: 12,
                          }}
                        >
                          {[
                            ["Human", human, GOLD],
                            ["AI", ai, "#8794a3"],
                          ].map(([label, value, color]) => (
                            <div
                              key={label}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "42px minmax(0, 1fr)",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "var(--muted)",
                                }}
                              >
                                {label}
                              </span>

                              <div
                                style={{
                                  height: 8,
                                  borderRadius: 99,
                                  background: "var(--surface-alt)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width:
                                      value == null
                                        ? "0%"
                                        : `${Math.min(
                                            100,
                                            Math.max(0, value) /
                                              maximum *
                                              100
                                          )}%`,
                                    background: color,
                                    borderRadius: 99,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    );
                  })}
                </div>

                <p
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    lineHeight: 1.7,
                  }}
                >
                  Gold represents the human reference; blue-grey represents
                  SAMBHAV AI. Bars are scaled within each dimension.
                </p>
              </div>
            </Panel>

            <Panel style={{ marginTop: 17 }}>
              <Heading note="Select a published record to inspect its recorded scores.">
                Published evaluation records
              </Heading>

              <div style={{ display: "grid", gap: 9 }}>
                {records.map((record) => {
                  const active =
                    String(record.id) === String(selected.id);

                  const difference = Math.abs(
                    Number(record.ai_score) - Number(record.human_score)
                  );

                  return (
                    <button
                      className="benchmark-record"
                      key={record.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(String(record.id));

                        document
                          .getElementById("benchmark-record")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 14,
                        border: "1px solid var(--line)",
                        borderRadius: 14,
                        background: active
                          ? "var(--surface-alt)"
                          : "var(--surface)",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: 9,
                        }}
                      >
                        <strong style={{ fontSize: 12 }}>
                          {record.subject || "UPSC"} ·{" "}
                          {record.question_type || "Question"}
                        </strong>

                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--muted)",
                          }}
                        >
                          {dateLabel(record.published_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.75,
                          marginTop: 8,
                        }}
                      >
                        {String(
                          record.question || "Question not supplied"
                        ).slice(0, 220)}
                        {String(record.question || "").length > 220
                          ? "…"
                          : ""}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 850,
                          color: "var(--gold)",
                          marginTop: 9,
                        }}
                      >
                        Human {formatMarks(
                          record.human_score,
                          record.maximum_marks
                        )}
                        {" · "}
                        AI {formatMarks(
                          record.ai_score,
                          record.maximum_marks
                        )}
                        {" · "}
                        Difference {difference.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </>
        )}

        <Panel style={{ marginTop: 19 }}>
          <Eyebrow>Method & data provenance</Eyebrow>

          <h2
            style={{
              fontSize: "clamp(21px, 4vw, 27px)",
              letterSpacing: "-.7px",
              margin: "8px 0 14px",
            }}
          >
            How We Test Our AI
          </h2>

          <ol
            style={{
              paddingLeft: 20,
              margin: 0,
              fontSize: 12,
              lineHeight: 1.9,
              color: "var(--text)",
            }}
          >
            <li>The same question and answer must be used for both evaluations.</li>
            <li>
              Human and AI evaluations should be performed independently.
            </li>
            <li>
              Where practical, evaluators should be blinded to candidate
              identity and other evaluators' scores.
            </li>
            <li>
              The dataset should cover multiple GS subjects, question types
              and answer-quality levels.
            </li>
            <li>
              Rubric version, maximum marks, model version and scoring
              criteria should be recorded.
            </li>
            <li>
              Metrics should be recalculated after a material model or rubric
              change.
            </li>
            <li>
              Only verified, public and consented records are included.
              Human marks are a reference, not unquestionable ground truth.
            </li>
          </ol>

          <div
            style={{
              marginTop: 15,
              padding: 14,
              border: "1px solid var(--line)",
              borderRadius: 13,
              background: "var(--surface-alt)",
              fontSize: 11,
              lineHeight: 1.85,
            }}
          >
            <strong>Metric definitions</strong>
            <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>
              MAE = mean of absolute AI-minus-human score differences. Exact
              agreement means identical marks. Within-1-mark agreement means
              the absolute difference is at most one mark.
            </p>
          </div>

          <p
            style={{
              margin: "13px 0 0",
              color: "var(--muted)",
              fontSize: 10,
              lineHeight: 1.8,
            }}
          >
            Last updated: {dateLabel(latest)}. This is a benchmark, not an
            official UPSC assessment. Published records require verification
            and explicit public consent. AI outputs can be wrong and should
            not replace human judgement.
          </p>
        </Panel>

        <footer
          style={{
            textAlign: "center",
            padding: "24px 5px 0",
            color: "var(--muted)",
            fontSize: 10,
            lineHeight: 1.8,
          }}
        >
          SAMBHAV UPSC · AI Evaluation Benchmark
          <br />
          Evidence-led evaluation · Transparency · Responsible AI
        </footer>
      </div>
    </main>
  );
}
