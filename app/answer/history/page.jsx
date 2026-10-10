"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function EvaluatedAnswerHistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paperFilter, setPaperFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/mains/history", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Apni evaluated answers history dekhne ke liye pehle SAMBHAV UPSC mein sign in karein."
              : data.error || "History load nahi ho saki."
          );
        }
        if (active) setRecords(Array.isArray(data.records) ? data.records : []);
      } catch (err) {
        if (active) setError(err.message || "History load nahi ho saki.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const papers = useMemo(
    () => [...new Set(records.map((r) => r.paper).filter(Boolean))].sort(),
    [records]
  );
  const years = useMemo(
    () => [...new Set(records.map((r) => r.pyq_year).filter(Boolean))].sort((a, b) => b - a),
    [records]
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((record) => {
      if (paperFilter !== "All" && record.paper !== paperFilter) return false;
      if (yearFilter !== "All" && String(record.pyq_year || "") !== yearFilter) return false;
      if (!q) return true;
      return [record.question, record.paper, record.section, record.topic,
        record.candidate_answer_transcription, record.pyq_year]
        .some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [records, search, paperFilter, yearFilter]);

  const formatDate = (value) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium", timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return "Date unavailable";
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button type="button" onClick={() => router.push("/answer")} style={styles.backButton} aria-label="Back to answer writing">←</button>
          <div style={{ minWidth: 0 }}>
            <div style={styles.brand}>SAMBHAV UPSC</div>
            <div style={styles.subtitle}>Mains Answer Writing · Evaluation History</div>
          </div>
          <button type="button" onClick={() => router.push("/answer")} style={styles.primaryButton}>Write Answer</button>
        </header>

        <section style={styles.hero}>
          <div style={styles.eyebrow}>YOUR PERSONAL RECORD</div>
          <h1 style={styles.title}>My Evaluated Answers</h1>
          <p style={styles.description}>Har evaluated answer, uska score, original question aur examiner feedback ek jagah. PYQ details wahi verified hongi jo source data mein available hain.</p>
          <div style={styles.statsRow}>
            <div style={styles.stat}><strong>{records.length}</strong><span>Total evaluations</span></div>
            <div style={styles.stat}><strong>{new Set(records.map((r) => r.paper)).size}</strong><span>Papers covered</span></div>
            <div style={styles.stat}><strong>{records.length ? (records.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / records.length).toFixed(1) : "—"}</strong><span>Average score</span></div>
          </div>
        </section>

        <section style={styles.filters}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Question, topic ya answer search karein…" style={styles.search} />
          <select value={paperFilter} onChange={(e) => setPaperFilter(e.target.value)} style={styles.select}>
            <option value="All">All subjects / papers</option>
            {papers.map((paper) => <option key={paper} value={paper}>{paper}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={styles.select}>
            <option value="All">All PYQ years</option>
            {years.map((year) => <option key={year} value={String(year)}>{year}</option>)}
          </select>
        </section>

        {loading && <div style={styles.message}>Loading your evaluated answers…</div>}
        {!loading && error && (
          <div style={styles.message}>
            <strong>History unavailable</strong>
            <p style={{ margin: "8px 0 14px" }}>{error}</p>
            <button type="button" onClick={() => router.push("/login")} style={styles.primaryButton}>Sign in</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>▤</div>
            <h2 style={styles.emptyTitle}>{records.length ? "No matching answers" : "Abhi koi saved evaluation nahi hai"}</h2>
            <p style={styles.description}>{records.length ? "Search ya filters badal kar dekhein." : "Mains answer evaluate karne ke baad, sign-in session ke saath result yahan save ho jayega."}</p>
            <button type="button" onClick={() => router.push("/answer")} style={styles.primaryButton}>Evaluate an Answer</button>
          </div>
        )}

        <div style={styles.list}>
          {filtered.map((record) => {
            const expanded = openId === record.id;
            const score = Number(record.score);
            const max = Number(record.maximum_marks) || Number(record.marks) || 15;
            return (
              <article key={record.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.metaWrap}>
                    <span style={styles.paperBadge}>{record.paper || "GS"}</span>
                    {record.pyq_verified ? <span style={styles.verifiedBadge}>Source verified</span> : <span style={styles.unverifiedBadge}>{record.question_source === "Custom Question" ? "Custom question" : "PYQ unverified"}</span>}
                    {record.pyq_year && <span style={styles.metaText}>UPSC Mains {record.pyq_year}</span>}
                    {record.pyq_question_number && <span style={styles.metaText}>Q. {record.pyq_question_number}</span>}
                  </div>
                  <div style={styles.scoreChip}>{Number.isFinite(score) ? score : "—"}<span>/{max}</span></div>
                </div>
                <h2 style={styles.question}>{record.question}</h2>
                <div style={styles.detailsLine}>
                  {record.topic && <span>{record.topic}</span>}
                  {record.section && <span>{record.section}</span>}
                  <span>{formatDate(record.created_at)}</span>
                </div>
                <div style={styles.cardActions}>
                  <button type="button" onClick={() => setOpenId(expanded ? null : record.id)} style={styles.secondaryButton}>{expanded ? "Hide evaluation" : "View full evaluation"}</button>
                  <span style={styles.dateText}>{record.marks || max} marks question</span>
                </div>
                {expanded && (
                  <div style={styles.expanded}>
                    <h3 style={styles.sectionTitle}>Your answer transcription</h3>
                    <div style={styles.transcript}>{record.candidate_answer_transcription || "Transcription was not available for this saved evaluation."}</div>
                    <h3 style={styles.sectionTitle}>Examiner summary</h3>
                    <p style={styles.summary}>{record.evaluation?.examiner_summary || record.evaluation?.overall_assessment || "Summary unavailable."}</p>
                    <h3 style={styles.sectionTitle}>Detailed evaluation</h3>
                    <div style={styles.evaluationGrid}>
                      <div style={styles.miniCard}><span>Demand fulfilment</span><strong>{record.evaluation?.demand_fulfilment?.score ?? "—"}/{record.evaluation?.demand_fulfilment?.maximum ?? "—"}</strong></div>
                      <div style={styles.miniCard}><span>Quality level</span><strong>{record.evaluation?.quality_level || "—"}</strong></div>
                    </div>
                    <details style={styles.rawDetails}>
                      <summary style={styles.summaryToggle}>Open complete examiner feedback</summary>
                      <pre style={styles.rawJson}>{JSON.stringify(record.evaluation, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <footer style={styles.footer}>Saved to your SAMBHAV UPSC account · Maximum 100 recent evaluations shown</footer>
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f6f6f3", color: "#171715", padding: "22px 14px 44px", fontFamily: "Arial, Helvetica, sans-serif" },
  container: { width: "100%", maxWidth: "920px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" },
  backButton: { width: "42px", height: "42px", border: "1px solid #deded9", borderRadius: "12px", background: "#fff", fontSize: "20px", cursor: "pointer", flexShrink: 0 },
  brand: { fontSize: "17px", fontWeight: 900, letterSpacing: "-0.4px" },
  subtitle: { color: "#777", fontSize: "11px", marginTop: "4px" },
  primaryButton: { border: 0, borderRadius: "10px", padding: "11px 13px", background: "#151515", color: "#fff", fontWeight: 800, fontSize: "11px", cursor: "pointer", marginLeft: "auto", flexShrink: 0 },
  hero: { background: "#fff", border: "1px solid #e4e4df", borderRadius: "18px", padding: "22px", marginBottom: "14px" },
  eyebrow: { fontSize: "9px", fontWeight: 900, letterSpacing: "1.2px", color: "#777", marginBottom: "9px" },
  title: { fontSize: "clamp(24px, 5vw, 34px)", letterSpacing: "-1px", margin: "0 0 8px", lineHeight: 1.1 },
  description: { color: "#66665f", fontSize: "12px", lineHeight: 1.6, margin: "0 0 15px" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" },
  stat: { border: "1px solid #e9e9e5", background: "#fafaf8", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" },
  statStrong: { fontSize: "20px" },
  filters: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", marginBottom: "12px" },
  search: { minWidth: 0, border: "1px solid #deded9", borderRadius: "11px", background: "#fff", padding: "12px", fontSize: "12px", outline: "none" },
  select: { minWidth: 0, border: "1px solid #deded9", borderRadius: "11px", background: "#fff", padding: "12px", fontSize: "11px", color: "#333" },
  message: { padding: "22px", border: "1px solid #e4e4df", borderRadius: "14px", background: "#fff", fontSize: "12px", color: "#555", lineHeight: 1.6 },
  empty: { textAlign: "center", padding: "40px 20px", background: "#fff", border: "1px dashed #d8d8d1", borderRadius: "16px" },
  emptyIcon: { fontSize: "34px", color: "#777", marginBottom: "8px" },
  emptyTitle: { fontSize: "17px", margin: "0 0 9px" },
  list: { display: "grid", gap: "11px" },
  card: { background: "#fff", border: "1px solid #e4e4df", borderRadius: "15px", padding: "16px" },
  cardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" },
  metaWrap: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" },
  paperBadge: { padding: "5px 7px", borderRadius: "7px", background: "#eeeeea", fontSize: "10px", fontWeight: 900 },
  verifiedBadge: { padding: "5px 7px", borderRadius: "7px", background: "#eaf5ec", color: "#246334", fontSize: "9px", fontWeight: 800 },
  unverifiedBadge: { padding: "5px 7px", borderRadius: "7px", background: "#f2f0e8", color: "#6a5c36", fontSize: "9px", fontWeight: 800 },
  metaText: { fontSize: "10px", color: "#666" },
  scoreChip: { whiteSpace: "nowrap", background: "#171715", color: "#fff", borderRadius: "9px", padding: "8px 10px", fontSize: "15px", fontWeight: 900 },
  question: { fontSize: "15px", lineHeight: 1.55, margin: "13px 0 10px", fontWeight: 800 },
  detailsLine: { display: "flex", flexWrap: "wrap", gap: "7px 12px", color: "#777", fontSize: "10px" },
  cardActions: { display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", flexWrap: "wrap" },
  secondaryButton: { border: "1px solid #dcdcd6", background: "#fff", borderRadius: "9px", padding: "9px 11px", fontWeight: 800, fontSize: "10px", cursor: "pointer" },
  dateText: { color: "#777", fontSize: "10px" },
  expanded: { borderTop: "1px solid #ecece7", marginTop: "15px", paddingTop: "15px" },
  sectionTitle: { fontSize: "12px", margin: "15px 0 8px", fontWeight: 900 },
  transcript: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", borderRadius: "10px", padding: "13px", background: "#f7f7f4", fontSize: "12px", lineHeight: 1.7, color: "#343430" },
  summary: { fontSize: "12px", lineHeight: 1.65, color: "#555" },
  evaluationGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" },
  miniCard: { border: "1px solid #e7e7e1", borderRadius: "10px", padding: "11px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px", color: "#777" },
  rawDetails: { marginTop: "12px", border: "1px solid #e5e5df", borderRadius: "10px", padding: "11px" },
  summaryToggle: { fontSize: "11px", fontWeight: 800, cursor: "pointer" },
  rawJson: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: "520px", overflow: "auto", background: "#f7f7f4", padding: "12px", borderRadius: "8px", fontSize: "10px", lineHeight: 1.5 },
  footer: { textAlign: "center", color: "#888", fontSize: "10px", marginTop: "18px" },
};
