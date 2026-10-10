"use client";

import { useEffect, useMemo, useState } from "react";

const DIMENSIONS = [
  ["content", "Content quality"],
  ["structure", "Structure"],
  ["examples", "Examples and evidence"],
  ["relevance", "Question relevance"],
  ["analysis", "Analytical depth"],
];

const palette = {
  page: "var(--sambhav-page, #f5f2eb)",
  surface: "var(--sambhav-surface, #fffdf9)",
  text: "var(--sambhav-text, #171717)",
  muted: "var(--sambhav-muted, #77736b)",
  border: "var(--sambhav-border, #e5e1d8)",
  gold: "#a07d32",
};

function fmtDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function asList(value) {
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string" && x.trim());
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}
function feedbackItems(source, key) {
  if (!source || typeof source !== "object") return [];
  const fallback = key === "strengths" ? "positive_points" : "improvement_suggestions";
  return asList(source[key] || source[fallback]);
}
function dimValue(source, key) {
  const value = source && typeof source === "object" ? source[key] : null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && Number.isFinite(Number(value.score))) return Number(value.score);
  return null;
}
function avg(rows, key) {
  return rows.length ? rows.reduce((s, r) => s + Number(r[key]), 0) / rows.length : null;
}
function pct(value) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}%`;
}
function marks(value, maximum) {
  return Number.isFinite(Number(value)) && Number.isFinite(Number(maximum))
    ? `${Number(value).toFixed(1)} / ${Number(maximum).toFixed(1)}`
    : "Not available";
}

function Card({ children, style = {}, ...props }) {
  return (
    <section {...props} style={{
      background: palette.surface, border: `1px solid ${palette.border}`,
      borderRadius: 20, padding: 18, minWidth: 0, ...style,
    }}>{children}</section>
  );
}
function Eyebrow({ children }) {
  return <div style={{ color: palette.muted, fontSize: 10, fontWeight: 850, letterSpacing: ".8px", textTransform: "uppercase" }}>{children}</div>;
}
function SectionTitle({ children, note }) {
  return <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontSize: 19, letterSpacing: "-.4px", margin: "6px 0 4px" }}>{children}</h2>
    {note && <p style={{ color: palette.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{note}</p>}
  </div>;
}
function Feedback({ title, items, empty = "Not supplied in this published record." }) {
  return <div style={{ marginTop: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 850, marginBottom: 6 }}>{title}</div>
    {items.length ? <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
      {items.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}
    </ul> : <p style={{ margin: 0, color: palette.muted, fontSize: 11 }}>{empty}</p>}
  </div>;
}
function Metric({ label, value, detail, icon }) {
  return <Card style={{ padding: 15 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
      <Eyebrow>{label}</Eyebrow><span aria-hidden="true" style={{ fontSize: 17, color: palette.gold }}>{icon}</span>
    </div>
    <div style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-.8px", margin: "11px 0 4px" }}>{value}</div>
    <div style={{ color: palette.muted, fontSize: 10, lineHeight: 1.5 }}>{detail}</div>
  </Card>;
}

export default function AIEvaluationBenchmarkPage() {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-evaluation-benchmark", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load benchmark records.");
        if (!cancelled) {
          const safeRows = Array.isArray(data.records) ? data.records.filter((r) =>
            r && r.id != null &&
            Number.isFinite(Number(r.ai_score)) &&
            Number.isFinite(Number(r.human_score)) &&
            Number(r.maximum_marks) > 0 &&
            typeof r.candidate_answer === "string" &&
            r.candidate_answer.trim()
          ) : [];
          setRecords(safeRows);
          setSelectedId(safeRows[0]?.id ? String(safeRows[0].id) : "");
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message || "Benchmark service unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const metrics = useMemo(() => {
    const n = records.length;
    const diffs = records.map((r) => Math.abs(Number(r.ai_score) - Number(r.human_score)));
    const exactCount = diffs.filter((d) => d === 0).length;
    const withinOneCount = diffs.filter((d) => d <= 1).length;
    return {
      n, aiAvg: avg(records, "ai_score"), humanAvg: avg(records, "human_score"),
      mae: n ? diffs.reduce((s, d) => s + d, 0) / n : null,
      exact: n ? exactCount / n * 100 : null,
      withinOne: n ? withinOneCount / n * 100 : null,
      exactCount, withinOneCount,
    };
  }, [records]);

  const selected = records.find((r) => String(r.id) === String(selectedId)) || records[0] || null;
  const latest = records.reduce((value, row) => {
    const date = row.published_at || row.evaluated_at;
    return date && (!value || new Date(date) > new Date(value)) ? date : value;
  }, null);

  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 };
  const smallGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))", gap: 10 };
  const mutedText = { color: palette.muted, fontSize: 12, lineHeight: 1.65 };

  return (
    <main style={{ minHeight: "100vh", background: palette.page, color: palette.text, padding: "22px 14px 54px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <a href="/premium/home" style={{ display: "inline-block", color: palette.muted, fontSize: 12, fontWeight: 800, textDecoration: "none", marginBottom: 22 }}>← Back to dashboard</a>

        <header style={{ marginBottom: 22 }}>
          <Eyebrow><span style={{ color: palette.gold }}>SAMBHAV UPSC · TRUST & TRANSPARENCY</span></Eyebrow>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 44px)", lineHeight: 1.08, letterSpacing: "-1.3px", margin: "10px 0" }}>AI Evaluation Benchmark</h1>
          <p style={{ ...mutedText, maxWidth: 760, fontSize: 13, margin: 0 }}>We don't ask you to trust our AI blindly. We test it against consent-based human evaluations of the same UPSC Mains answers. Human scores are a reference—not infallible ground truth.</p>
        </header>

        <Card style={{ marginBottom: 16, padding: 18, background: "linear-gradient(135deg, var(--sambhav-surface, #fffdf9), var(--sambhav-page, #f5f2eb))" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ maxWidth: 620 }}>
              <Eyebrow>LIVE VALIDATION STATUS</Eyebrow>
              <h2 style={{ fontSize: 20, margin: "8px 0" }}>{loading ? "Loading verified records…" : error ? "Benchmark temporarily unavailable" : records.length ? "Verified benchmark results" : "Benchmark data being collected"}</h2>
              <p style={{ ...mutedText, margin: 0 }}>{loading ? "Retrieving eligible, public and consented evaluation pairs." : error ? "The data service could not be reached. Please retry later." : records.length ? "Metrics below are calculated from eligible paired records returned by the benchmark service." : "No published records currently meet the verification, public-consent and score-completeness requirements. We are not publishing an accuracy or agreement claim without evidence."}</p>
            </div>
            <span style={{ border: `1px solid ${palette.border}`, borderRadius: 999, padding: "7px 10px", fontSize: 10, fontWeight: 850, whiteSpace: "nowrap" }}>{error ? "SERVICE ISSUE" : loading ? "LOADING" : records.length ? "VERIFIED DATA" : "AWAITING DATA"}</span>
          </div>
        </Card>

        {error && <Card role="alert" style={{ borderColor: "#b52b22", marginBottom: 16 }}>
          <strong>Could not load benchmark</strong><p style={{ ...mutedText, marginBottom: 0 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: "10px 13px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.surface, color: palette.text, fontWeight: 800 }}>Retry</button>
        </Card>}

        <div style={{ marginBottom: 10 }}><Eyebrow>TRUST OVERVIEW</Eyebrow></div>
        <div style={smallGrid}>
          <Metric label="Verified answers" value={loading ? "…" : metrics.n} detail={records.length ? "Eligible published paired records" : "Only verified, public, consented records count"} icon="◎" />
          <Metric label="Mean absolute error" value={metrics.mae == null ? "—" : metrics.mae.toFixed(2)} detail="Average marks difference · lower is closer" icon="↔" />
          <Metric label="Exact agreement" value={pct(metrics.exact)} detail={records.length ? `${metrics.exactCount} of ${metrics.n} pairs have identical marks` : "Awaiting enough eligible paired records"} icon="=" />
          <Metric label="Within 1 mark" value={pct(metrics.withinOne)} detail={records.length ? `${metrics.withinOneCount} of ${metrics.n} pairs differ by at most 1 mark` : "Awaiting enough eligible paired records"} icon="±" />
        </div>
        {!records.length && !loading && !error && <p style={{ ...mutedText, fontSize: 10, margin: "8px 2px 20px" }}>Metric cards are intentionally blank until verified data exists. No synthetic or illustrative numbers are presented as results.</p>}

        {records.length > 0 && selected && <>
          <div style={{ marginTop: 22, marginBottom: 10 }}><Eyebrow>AGGREGATE SCORE SNAPSHOT</Eyebrow></div>
          <div style={smallGrid}>
            <Metric label="Human average" value={metrics.humanAvg == null ? "—" : metrics.humanAvg.toFixed(2)} detail="Raw marks; interpret with each answer's maximum" icon="H" />
            <Metric label="SAMBHAV AI average" value={metrics.aiAvg == null ? "—" : metrics.aiAvg.toFixed(2)} detail="Raw marks; not an accuracy measure" icon="AI" />
          </div>

          <Card style={{ marginTop: 16 }}>
            <SectionTitle note="Select an eligible published record to inspect the two evaluations on the same original answer.">AI vs Human · Same-answer comparison</SectionTitle>
            <label htmlFor="benchmark-record" style={{ display: "block", fontSize: 11, fontWeight: 800, marginBottom: 7 }}>Published benchmark record</label>
            <select id="benchmark-record" value={String(selected.id)} onChange={(e) => setSelectedId(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${palette.border}`, background: palette.surface, color: palette.text, fontSize: 12 }}>
              {records.map((r) => <option key={r.id} value={String(r.id)}>{`${r.subject || "UPSC"} · ${String(r.question || "Question not supplied").slice(0, 90)}`}</option>)}
            </select>
            <div style={{ background: palette.page, borderRadius: 14, padding: 14, marginTop: 13 }}>
              <Eyebrow>QUESTION · {selected.subject || "Subject not specified"} · {selected.question_type || "Type not specified"}</Eyebrow>
              <div style={{ fontSize: 13, lineHeight: 1.7, fontWeight: 750, marginTop: 7 }}>{selected.question || "Question not supplied in this record."}</div>
            </div>
            <div style={{ ...grid, marginTop: 12 }}>
              <Card style={{ padding: 15 }}>
                <Eyebrow>HUMAN REFERENCE EVALUATION</Eyebrow>
                <div style={{ fontSize: 27, fontWeight: 900, margin: "9px 0 3px" }}>{marks(selected.human_score, selected.maximum_marks)}</div>
                <div style={mutedText}>Marks awarded · {selected.maximum_marks} maximum</div>
                <Feedback title="Evaluator comments" items={asList(selected.human_feedback?.comments || selected.human_feedback?.feedback)} />
                <Feedback title="Strengths" items={feedbackItems(selected.human_feedback, "strengths")} />
                <Feedback title="Areas to improve" items={feedbackItems(selected.human_feedback, "weaknesses")} />
              </Card>
              <Card style={{ padding: 15 }}>
                <Eyebrow>SAMBHAV AI EVALUATION</Eyebrow>
                <div style={{ fontSize: 27, fontWeight: 900, margin: "9px 0 3px" }}>{marks(selected.ai_score, selected.maximum_marks)}</div>
                <div style={mutedText}>Marks awarded · {selected.maximum_marks} maximum</div>
                <Feedback title="Question-demand analysis" items={asList(selected.ai_feedback?.question_demand || selected.ai_feedback?.demand_analysis)} />
                <Feedback title="Strengths" items={feedbackItems(selected.ai_feedback, "strengths")} />
                <Feedback title="Weaknesses and improvements" items={feedbackItems(selected.ai_feedback, "weaknesses")} />
              </Card>
            </div>
            <div style={{ border: `1px solid ${palette.border}`, borderRadius: 14, padding: 14, marginTop: 12 }}>
              <Eyebrow>SCORE DIFFERENCE · AI MINUS HUMAN</Eyebrow>
              <div style={{ fontSize: 23, fontWeight: 900, marginTop: 7 }}>{(Number(selected.ai_score) - Number(selected.human_score) > 0 ? "+" : "") + (Number(selected.ai_score) - Number(selected.human_score)).toFixed(1)} marks</div>
              <p style={{ ...mutedText, margin: "6px 0 0" }}>Rubric: {selected.rubric_version || "Not specified"} · Model: {selected.ai_model_version || "Not specified"} · Published: {fmtDate(selected.published_at)}</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <SectionTitle note="Missing dimension scores are shown as unavailable and are not treated as zero.">Dimension-wise comparison</SectionTitle>
              <div style={{ display: "grid", gap: 9 }}>
                {DIMENSIONS.map(([key, name]) => {
                  const human = dimValue(selected.human_dimensions, key);
                  const ai = dimValue(selected.ai_dimensions, key);
                  const max = Math.max(Number(human) || 0, Number(ai) || 0, 1);
                  return <div key={key} style={{ border: `1px solid ${palette.border}`, borderRadius: 13, padding: 12 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 11, fontWeight: 800 }}>
                      <span>{name}</span><span>Human {human ?? "—"} · AI {ai ?? "—"}</span>
                    </div>
                    <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                      <div style={{ height: 7, background: "#e7e2d9", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: human == null ? "0%" : `${Math.min(100, Math.max(0, human) / max * 100)}%`, background: palette.gold }} /></div>
                      <div style={{ height: 7, background: "#e7e2d9", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: ai == null ? "0%" : `${Math.min(100, Math.max(0, ai) / max * 100)}%`, background: "#555" }} /></div>
                    </div>
                  </div>;
                })}
              </div>
              <p style={{ ...mutedText, fontSize: 10 }}>Gold bar = human reference; dark bar = SAMBHAV AI. Bar lengths are scaled per dimension for visual comparison.</p>
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <SectionTitle note="Records shown here are restricted to the API's eligible published dataset.">Published evaluation records</SectionTitle>
            <div style={{ display: "grid", gap: 8 }}>
              {records.map((r, index) => <button key={r.id} onClick={() => { setSelectedId(String(r.id)); document.getElementById("benchmark-record")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} style={{ width: "100%", textAlign: "left", border: `1px solid ${palette.border}`, background: String(r.id) === String(selected.id) ? palette.page : palette.surface, borderRadius: 13, padding: 12, color: palette.text, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 12 }}>{r.subject || "UPSC"} · {r.question_type || "Question"}</strong>
                  <span style={{ fontSize: 10, color: palette.muted }}>{fmtDate(r.published_at)}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{String(r.question || "Question not supplied").slice(0, 180)}{String(r.question || "").length > 180 ? "…" : ""}</div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 7 }}>Human {marks(r.human_score, r.maximum_marks)} · AI {marks(r.ai_score, r.maximum_marks)} · Difference {Math.abs(Number(r.ai_score) - Number(r.human_score)).toFixed(1)}</div>
              </button>)}
            </div>
          </Card>
        </>}

        <Card style={{ marginTop: 18 }}>
          <Eyebrow><span style={{ color: palette.gold }}>METHOD & DATA PROVENANCE</span></Eyebrow>
          <h2 style={{ fontSize: 22, margin: "8px 0 12px" }}>How We Test Our AI</h2>
          <ol style={{ paddingLeft: 20, margin: 0, fontSize: 12, lineHeight: 1.8 }}>
            <li>The same question and answer must be used for both evaluations.</li>
            <li>Human and AI evaluations should be performed independently; human evaluators must not see AI marks in advance.</li>
            <li>Where practical, evaluators are blinded to candidate identity and other evaluators' scores.</li>
            <li>The dataset should cover multiple GS subjects, question types and answer-quality levels.</li>
            <li>Rubric version, maximum marks, model version, sample size and scoring criteria should be recorded.</li>
            <li>Benchmark metrics must be recalculated after a material model or rubric change.</li>
            <li>Only records marked verified, public and consented are included. Human marks are a comparison reference, not unquestionable ground truth.</li>
          </ol>
          <div style={{ marginTop: 14, padding: 13, borderRadius: 12, background: palette.page, fontSize: 11, lineHeight: 1.7 }}>
            <strong>Metric definitions</strong><br />
            MAE = mean of |AI marks − human marks|. Exact agreement = identical marks divided by eligible pairs. Within-1-mark agreement = pairs with an absolute difference ≤ 1 divided by eligible pairs. Scores are compared on the same answer and maximum-mark scale.
          </div>
          <div style={{ ...mutedText, fontSize: 10, marginTop: 12 }}>Last updated: {fmtDate(latest)}. This is an independent benchmark, not an official UPSC assessment. Published records require verification and explicit public consent. AI outputs can be wrong and should not replace human judgement.</div>
        </Card>
      </div>
    </main>
  );
}
