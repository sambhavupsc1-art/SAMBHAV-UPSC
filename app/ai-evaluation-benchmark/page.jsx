"use client";

import { useEffect, useMemo, useState } from "react";

const dimensions = [
  ["content", "Content quality"],
  ["structure", "Structure"],
  ["examples", "Examples and evidence"],
  ["relevance", "Question relevance"],
  ["analysis", "Analytical depth"],
];

function asList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim());
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function dimensionValue(source, key) {
  const value = source && typeof source === "object" ? source[key] : null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && Number.isFinite(Number(value.score))) return Number(value.score);
  return null;
}

function displayDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function meanAbsoluteError(rows) {
  return rows.length ? rows.reduce((sum, row) => sum + Math.abs(Number(row.ai_score) - Number(row.human_score)), 0) / rows.length : null;
}

function exactAgreement(rows) {
  return rows.length ? rows.filter((row) => Number(row.ai_score) === Number(row.human_score)).length / rows.length * 100 : null;
}

function withinOneAgreement(rows) {
  return rows.length ? rows.filter((row) => Math.abs(Number(row.ai_score) - Number(row.human_score)) <= 1).length / rows.length * 100 : null;
}

function mean(rows, key) {
  return rows.length ? rows.reduce((sum, row) => sum + Number(row[key]), 0) / rows.length : null;
}

function pct(value) {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function score(value, maximum) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} / ${Number(maximum).toFixed(1)}` : "Not available";
}

function feedbackList(feedback, key) {
  if (feedback && typeof feedback === "object" && !Array.isArray(feedback)) {
    return asList(feedback[key] || feedback[key === "strengths" ? "positive_points" : "improvement_suggestions"]);
  }
  return [];
}

function FeedbackSection({ title, items, emptyText }) {
  return (
    <section style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 850, marginBottom: 7 }}>{title}</div>
      {items.length ? (
        <ul style={{ margin: 0, paddingLeft: 19, fontSize: 12, lineHeight: 1.65 }}>
          {items.map((item, index) => <li key={`${title}-${index}`} style={{ marginBottom: 4 }}>{item}</li>)}
        </ul>
      ) : <p style={{ margin: 0, color: "var(--sambhav-muted)", fontSize: 12 }}>{emptyText}</p>}
    </section>
  );
}

export default function AIEvaluationBenchmarkPage() {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-evaluation-benchmark", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load benchmark.");
        if (!cancelled) {
          const rows = Array.isArray(data.records) ? data.records : [];
          setRecords(rows);
          setSelectedId(rows[0]?.id || "");
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load benchmark."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const metrics = useMemo(() => ({
    count: records.length,
    aiAverage: mean(records, "ai_score"),
    humanAverage: mean(records, "human_score"),
    mae: meanAbsoluteError(records),
    exact: exactAgreement(records),
    withinOne: withinOneAgreement(records),
    exactCount: records.filter((row) => Number(row.ai_score) === Number(row.human_score)).length,
    withinOneCount: records.filter((row) => Math.abs(Number(row.ai_score) - Number(row.human_score)) <= 1).length,
  }), [records]);

  const selected = records.find((row) => row.id === selectedId) || records[0] || null;
  const card = {
    background: "var(--sambhav-surface, #fffdf9)",
    border: "1px solid var(--sambhav-border, #e5e1d8)",
    borderRadius: 20,
    padding: 18,
    minWidth: 0,
  };
  const label = { color: "var(--sambhav-muted, #77736b)", fontSize: 10, fontWeight: 800, letterSpacing: ".7px", textTransform: "uppercase" };
  const title = { fontSize: 14, fontWeight: 900, margin: "0 0 12px" };
  const page = { minHeight: "100vh", background: "var(--sambhav-page, #f5f2eb)", color: "var(--sambhav-text, #101010)", padding: "22px 15px 50px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };

  return (
    <main style={page}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <a href="/premium/home" style={{ display: "inline-block", color: "var(--sambhav-muted, #77736b)", fontSize: 12, fontWeight: 800, textDecoration: "none", marginBottom: 18 }}>← Back to dashboard</a>
        <header style={{ marginBottom: 22 }}>
          <div style={{ ...label, color: "#a07d32" }}>SAMBHAV UPSC · TRUST & TRANSPARENCY</div>
          <h1 style={{ fontSize: "clamp(27px, 5vw, 39px)", lineHeight: 1.08, letterSpacing: "-1.1px", margin: "9px 0" }}>AI Evaluation Benchmark</h1>
          <p style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 13, lineHeight: 1.65, maxWidth: 720, margin: 0 }}>A transparent comparison of SAMBHAV AI evaluations and consent-based human evaluations on the same UPSC Mains answers. Human scores are a reference, not infallible ground truth.</p>
        </header>

        {loading && <section style={card} role="status">Loading verified benchmark records…</section>}
        {error && <section style={{ ...card, borderColor: "#b52b22" }} role="alert"><strong>Benchmark unavailable</strong><p style={{ marginBottom: 0 }}>{error}</p></section>}

        {!loading && !error && records.length === 0 && (
          <section style={{ ...card, padding: "25px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 24, marginBottom: 9 }}>◎</div>
            <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Benchmark data being collected</h2>
            <p style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 13, lineHeight: 1.65, margin: 0 }}>No published records currently meet the verification, public-consent and score-completeness requirements. No accuracy or agreement claim is being made yet.</p>
          </section>
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <div style={{ ...label, marginBottom: 9 }}>Verified sample · n = {metrics.count}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginBottom: 18 }}>
              {[
                ["Verified answers", String(metrics.count), "Published, consented records"],
                ["Human average", metrics.humanAverage.toFixed(2), `Out of ${records[0]?.maximum_marks ?? "—"} marks*`],
                ["AI average", metrics.aiAverage.toFixed(2), `Out of ${records[0]?.maximum_marks ?? "—"} marks*`],
                ["Mean absolute error", metrics.mae.toFixed(2), "Marks · lower means closer"],
                ["Exact agreement", pct(metrics.exact), `${metrics.exactCount} / ${metrics.count} answers`],
                ["Within 1 mark", pct(metrics.withinOne), `${metrics.withinOneCount} / ${metrics.count} answers`],
              ].map(([name, value, note]) => (
                <article key={name} style={{ ...card, padding: 14 }}>
                  <div style={label}>{name}</div>
                  <div style={{ fontSize: 25, fontWeight: 900, letterSpacing: "-.7px", margin: "8px 0 4px" }}>{value}</div>
                  <div style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 10, lineHeight: 1.45 }}>{note}</div>
                </article>
              ))}
            </div>
            <p style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 10, lineHeight: 1.5, margin: "-7px 0 18px" }}>* Averages are raw marks; when the dataset includes different maximum-mark scales, interpret them alongside each answer’s own scale. Exact agreement uses identical numeric marks. Within-1-mark agreement uses an absolute difference of at most 1 mark.</p>

            <section style={{ ...card, marginBottom: 18 }}>
              <h2 style={title}>Compare the same answer</h2>
              <label htmlFor="benchmark-answer" style={{ ...label, display: "block", marginBottom: 7 }}>Published benchmark record</label>
              <select id="benchmark-answer" value={selected?.id || ""} onChange={(event) => setSelectedId(event.target.value)} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--sambhav-border, #ddd)", background: "var(--sambhav-page, #fff)", color: "var(--sambhav-text, #111)", fontSize: 12 }}>
                {records.map((row) => <option key={row.id} value={row.id}>{`${row.subject || "UPSC"} · ${String(row.question || "").slice(0, 90)}`}</option>)}
              </select>
              {selected && (
                <>
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--sambhav-page, #f5f2eb)", fontSize: 12, lineHeight: 1.65 }}>
                    <div style={label}>Question · {selected.subject || "Subject not specified"} · {selected.question_type || "Question type not specified"}</div>
                    <div style={{ marginTop: 7, fontWeight: 750 }}>{selected.question}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12, marginTop: 12 }}>
                    <article style={{ ...card, padding: 15 }}>
                      <div style={{ ...label, color: "#8b6a27" }}>HUMAN EVALUATION · ANONYMIZED</div>
                      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>{score(selected.human_score, selected.maximum_marks)}</div>
                      <div style={{ fontSize: 10, color: "var(--sambhav-muted, #77736b)" }}>Marks awarded · {selected.maximum_marks} maximum</div>
                      <h3 style={{ ...title, marginTop: 17 }}>Original answer</h3>
                      <div style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected.candidate_answer}</div>
                      <FeedbackSection title="Evaluator feedback" items={asList(selected.human_feedback?.comments || selected.human_feedback?.feedback)} emptyText="No comment was supplied in this published record." />
                      <FeedbackSection title="Strengths" items={feedbackList(selected.human_feedback, "strengths")} emptyText="Not supplied." />
                      <FeedbackSection title="Areas to improve" items={feedbackList(selected.human_feedback, "weaknesses")} emptyText="Not supplied." />
                    </article>
                    <article style={{ ...card, padding: 15 }}>
                      <div style={{ ...label, color: "#8b6a27" }}>SAMBHAV AI EVALUATION</div>
                      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>{score(selected.ai_score, selected.maximum_marks)}</div>
                      <div style={{ fontSize: 10, color: "var(--sambhav-muted, #77736b)" }}>Marks awarded · {selected.maximum_marks} maximum</div>
                      <h3 style={{ ...title, marginTop: 17 }}>Same original answer</h3>
                      <div style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected.candidate_answer}</div>
                      <FeedbackSection title="Question demand analysis" items={asList(selected.ai_feedback?.question_demand || selected.ai_feedback?.demand_analysis)} emptyText="Not supplied." />
                      <FeedbackSection title="Strengths" items={feedbackList(selected.ai_feedback, "strengths")} emptyText="Not supplied." />
                      <FeedbackSection title="Weaknesses and improvements" items={feedbackList(selected.ai_feedback, "weaknesses")} emptyText="Not supplied." />
                    </article>
                  </div>
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid var(--sambhav-border, #ddd)" }}>
                    <div style={{ fontSize: 12, fontWeight: 900 }}>Score difference</div>
                    <div style={{ fontSize: 21, fontWeight: 900, marginTop: 5 }}>{(Number(selected.ai_score) - Number(selected.human_score) > 0 ? "+" : "") + (Number(selected.ai_score) - Number(selected.human_score)).toFixed(1)} marks (AI − human)</div>
                    <div style={{ marginTop: 5, color: "var(--sambhav-muted, #77736b)", fontSize: 10 }}>Rubric: {selected.rubric_version || "Not specified"} · AI model: {selected.ai_model_version || "Not specified"} · Published: {displayDate(selected.published_at)}</div>
                  </div>
                  <section style={{ marginTop: 16 }}>
                    <h3 style={title}>Dimension-wise comparison</h3>
                    <div style={{ display: "grid", gap: 10 }}>
                      {dimensions.map(([key, name]) => {
                        const human = dimensionValue(selected.human_dimensions, key);
                        const ai = dimensionValue(selected.ai_dimensions, key);
                        const max = Math.max(Number(human) || 0, Number(ai) || 0, 1);
                        return (
                          <div key={key} style={{ ...card, padding: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, fontWeight: 800 }}>
                              <span>{name}</span><span>Human {human ?? "—"} · AI {ai ?? "—"}</span>
                            </div>
                            <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                              <div style={{ height: 7, background: "var(--sambhav-track, #e7e2d9)", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (Number(human) || 0) / max * 100)}%`, background: "#9a7a34" }} /></div>
                              <div style={{ height: 7, background: "var(--sambhav-track, #e7e2d9)", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (Number(ai) || 0) / max * 100)}%`, background: "#555" }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 10, marginTop: 8 }}>Bars are scaled to the larger of the two ratings for each dimension. Missing dimension ratings are shown as — and are not treated as zero.</div>
                  </section>
                </>
              )}
            </section>
          </>
        )}

        <section id="methodology" style={{ ...card, marginTop: 18 }}>
          <div style={{ ...label, color: "#a07d32" }}>METHOD & DATA PROVENANCE</div>
          <h2 style={{ fontSize: 21, margin: "8px 0 12px" }}>How We Test Our AI</h2>
          <ol style={{ paddingLeft: 20, margin: 0, fontSize: 12, lineHeight: 1.75 }}>
            <li>The same question and answer must be used for both evaluations.</li>
            <li>Human and AI evaluations should be performed independently; human evaluators must not see AI marks in advance.</li>
            <li>Where practical, evaluators are blinded to candidate identity and other evaluators’ scores.</li>
            <li>The dataset should cover multiple GS subjects, question types and answer-quality levels.</li>
            <li>Rubric version, maximum marks, model version, sample size and scoring criteria should be recorded.</li>
            <li>Benchmark metrics must be recalculated after a material model or rubric change.</li>
            <li>Only records marked verified, public and consented are included. The human score is a comparison reference, not unquestionable ground truth.</li>
          </ol>
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "var(--sambhav-page, #f5f2eb)", fontSize: 11, lineHeight: 1.6 }}>
            <strong>Metric definitions</strong><br />
            MAE = average of |AI marks − human marks|. Exact agreement = identical marks / eligible paired answers. Within-1-mark agreement = pairs with an absolute difference ≤ 1 / eligible paired answers. Each percentage uses the displayed verified sample size; no synthetic data is used.
          </div>
          <div style={{ marginTop: 12, color: "var(--sambhav-muted, #77736b)", fontSize: 10, lineHeight: 1.55 }}>Last updated: {displayDate(records.reduce((latest, row) => !latest || new Date(row.published_at || 0) > new Date(latest) ? row.published_at : latest, null))}. Data is not considered validated until real records pass the verification and consent process.</div>
        </section>
      </div>
    </main>
  );
}
