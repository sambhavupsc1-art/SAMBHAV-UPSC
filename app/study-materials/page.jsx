"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const subjects = ["All Subjects", "Polity", "Economy", "Geography", "History", "Environment", "Science & Technology", "Internal Security", "International Relations", "Society", "Ethics", "Essay", "Hindi Optional", "Other"];
const exams = ["All", "Prelims", "Mains", "Prelims & Mains"];
const languages = ["All", "Hindi", "English", "Bilingual"];

export default function StudyMaterialsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [exam, setExam] = useState("All");
  const [language, setLanguage] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (subject !== "All Subjects") params.set("subject", subject);
      if (exam !== "All") params.set("exam", exam);
      if (language !== "All") params.set("language", language);
      const response = await fetch(`/api/study-materials?${params.toString()}`, { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Study materials could not be loaded.");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) { setError(e.message || "Something went wrong."); setItems([]); }
    finally { setLoading(false); }
  }, [q, subject, exam, language]);

  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const counts = useMemo(() => new Set(items.map(x => x.subject).filter(Boolean)).size, [items]);

  const styles = {
    page: { minHeight: "100vh", background: "var(--sambhav-page, #f5f2eb)", color: "var(--sambhav-text, #101010)", padding: "22px 16px 45px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
    wrap: { maxWidth: 1050, margin: "0 auto" },
    card: { background: "var(--sambhav-surface, #fffdf9)", border: "1px solid var(--sambhav-border, rgba(16,16,16,.08))", borderRadius: 18, padding: 16 },
    input: { width: "100%", minWidth: 0, padding: "13px 14px", borderRadius: 12, border: "1px solid var(--sambhav-border, #ddd)", background: "var(--sambhav-surface, #fffdf9)", color: "var(--sambhav-text, #101010)", fontSize: 14, boxSizing: "border-box" },
    select: { width: "100%", padding: "12px 10px", borderRadius: 12, border: "1px solid var(--sambhav-border, #ddd)", background: "var(--sambhav-surface, #fffdf9)", color: "var(--sambhav-text, #101010)", fontSize: 13 },
    button: { border: 0, borderRadius: 11, background: "#101010", color: "#dfc477", padding: "11px 14px", fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 },
  };

  return <main style={styles.page}><div style={styles.wrap}>
    <a href="/premium" style={{ color: "inherit", textDecoration: "none", fontSize: 12, fontWeight: 800 }}>← Back to Premium Home</a>
    <header style={{ margin: "22px 0 20px" }}>
      <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 900, color: "#9b7930" }}>SAMBHAV UPSC • LEARNING LIBRARY</div>
      <h1 style={{ fontSize: "clamp(27px, 5vw, 40px)", letterSpacing: -1.2, lineHeight: 1.1, margin: "9px 0" }}>Study Material</h1>
      <p style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>Find notes by subject, topic, language and exam stage. Search in Hindi or English.</p>
    </header>

    <section style={{ ...styles.card, marginBottom: 18 }}>
      <label htmlFor="study-search" style={{ display: "block", fontSize: 12, fontWeight: 850, marginBottom: 8 }}>Search notes and topics</label>
      <input id="study-search" style={styles.input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search e.g. LWE, मौद्रिक नीति, Parliament, biodiversity…" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginTop: 12 }}>
        <div><label style={{ display: "block", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Subject</label><select style={styles.select} value={subject} onChange={e => setSubject(e.target.value)}>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label style={{ display: "block", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Exam stage</label><select style={styles.select} value={exam} onChange={e => setExam(e.target.value)}>{exams.map(s => <option key={s} value={s === "All" ? "All" : s}>{s}</option>)}</select></div>
        <div><label style={{ display: "block", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Language</label><select style={styles.select} value={language} onChange={e => setLanguage(e.target.value)}>{languages.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
    </section>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, margin: "0 2px 12px", flexWrap: "wrap" }}>
      <div><div style={{ fontWeight: 900, fontSize: 17 }}>Your notes</div><div style={{ fontSize: 11, color: "var(--sambhav-muted, #77736b)", marginTop: 3 }}>{loading ? "Updating library…" : `${items.length} notes • ${counts} subjects represented`}</div></div>
      <button style={styles.button} onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
    </div>

    {error && <div role="alert" style={{ ...styles.card, borderColor: "#d66", color: "#b52b22", marginBottom: 12 }}><strong>Library could not load</strong><p style={{ fontSize: 13, lineHeight: 1.5 }}>{error}</p><button style={styles.button} onClick={load}>Try again</button></div>}
    {!error && !loading && items.length === 0 && <div style={{ ...styles.card, textAlign: "center", padding: "38px 18px" }}><div style={{ fontSize: 34 }}>📚</div><h2 style={{ margin: "12px 0 7px", fontSize: 18 }}>No notes found</h2><p style={{ color: "var(--sambhav-muted, #77736b)", fontSize: 13, lineHeight: 1.6, margin: "0 auto", maxWidth: 420 }}>Try another keyword or filter. New notes will appear here after they are uploaded and published by the admin.</p><button style={{ ...styles.button, marginTop: 15 }} onClick={() => { setQ(""); setSubject("All Subjects"); setExam("All"); setLanguage("All"); }}>Clear filters</button></div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: 12 }}>
      {items.map(item => <article key={item.id} style={{ ...styles.card, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><div style={{ width: 42, height: 48, flexShrink: 0, borderRadius: 11, background: "#101010", color: "#dfc477", display: "grid", placeItems: "center", fontSize: 21 }}>PDF</div><div style={{ minWidth: 0, flex: 1 }}><h2 style={{ fontSize: 15, lineHeight: 1.4, margin: "0 0 5px", overflowWrap: "anywhere" }}>{item.title}</h2><div style={{ fontSize: 11, color: "var(--sambhav-muted, #77736b)" }}>{[item.subject, item.topic].filter(Boolean).join(" • ") || item.category || "Study Material"}</div></div></div>
        {item.description && <p style={{ fontSize: 12, lineHeight: 1.55, color: "var(--sambhav-muted, #77736b)", margin: 0 }}>{item.description}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{[item.exam_type, item.language, item.category].filter(Boolean).map((tag, i) => <span key={`${tag}-${i}`} style={{ fontSize: 10, fontWeight: 750, border: "1px solid var(--sambhav-border, #ddd)", borderRadius: 99, padding: "5px 8px" }}>{tag}</span>)}</div>
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 5 }}>{item.fileUrl ? <><a href={item.fileUrl} target="_blank" rel="noreferrer" style={styles.button}>Open PDF ↗</a><a href={item.fileUrl} download style={{ ...styles.button, background: "transparent", color: "var(--sambhav-text, #101010)", border: "1px solid var(--sambhav-border, #ddd)" }}>Download</a></> : <span style={{ fontSize: 11, color: "#b52b22" }}>File link unavailable — contact admin.</span>}</div>
      </article>)}
    </div>
    <footer style={{ marginTop: 28, fontSize: 10, color: "var(--sambhav-muted, #77736b)", lineHeight: 1.6 }}>Search currently covers the title, subject, topic and description stored in the library metadata. Searching the full text inside a PDF requires a separate text-extraction/indexing step.</footer>
  </div></main>;
}
