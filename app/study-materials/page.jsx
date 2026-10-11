"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const subjects = ["All Subjects", "Polity", "Economy", "Geography", "History", "Environment", "Science & Technology", "Internal Security", "International Relations", "Society", "Ethics", "Essay", "Hindi Optional", "Other"];
const exams = ["All", "Prelims", "Mains", "Prelims & Mains"];
const languages = ["All", "Hindi", "English", "Bilingual"];

const theme = {
  page: "var(--sambhav-page, #f5f2eb)",
  surface: "var(--sambhav-surface, #fffdf9)",
  text: "var(--sambhav-text, #101010)",
  muted: "var(--sambhav-muted, #77736b)",
  border: "var(--sambhav-border, rgba(16,16,16,.10))",
  gold: "var(--sambhav-gold, #a07d32)",
  ink: "#101010",
  goldLight: "#dfc477",
};

export default function StudyMaterialsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [exam, setExam] = useState("All");
  const [language, setLanguage] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastLoaded, setLastLoaded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (subject !== "All Subjects") params.set("subject", subject);
      if (exam !== "All") params.set("exam", exam);
      if (language !== "All") params.set("language", language);
      const response = await fetch(`/api/study-materials?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Study materials could not be loaded.");
      setItems(Array.isArray(data.items) ? data.items : []);
      setLastLoaded(new Date());
    } catch (e) {
      setError(e?.message || "Something went wrong.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, subject, exam, language]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const counts = useMemo(() => new Set(items.map((x) => x.subject).filter(Boolean)).size, [items]);
  const activeFilters = (q.trim() ? 1 : 0) + (subject !== "All Subjects" ? 1 : 0) + (exam !== "All" ? 1 : 0) + (language !== "All" ? 1 : 0);
  const clearFilters = () => {
    setQ("");
    setSubject("All Subjects");
    setExam("All");
    setLanguage("All");
  };

  const styles = {
    page: { minHeight: "100vh", background: theme.page, color: theme.text, padding: "22px 16px 48px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    wrap: { maxWidth: 1120, margin: "0 auto" },
    card: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 18, boxShadow: "0 8px 28px rgba(16,16,16,.035)" },
    input: { width: "100%", minWidth: 0, padding: "14px 14px 14px 42px", borderRadius: 13, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 14, boxSizing: "border-box", outlineOffset: 2 },
    select: { width: "100%", padding: "12px 11px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 13, minHeight: 44 },
    primary: { border: `1px solid ${theme.ink}`, borderRadius: 12, background: theme.ink, color: theme.goldLight, padding: "11px 15px", fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, minHeight: 40, boxSizing: "border-box" },
    secondary: { border: `1px solid ${theme.border}`, borderRadius: 12, background: "transparent", color: theme.text, padding: "10px 13px", fontWeight: 750, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, minHeight: 40, boxSizing: "border-box" },
    label: { display: "block", fontSize: 11, fontWeight: 850, marginBottom: 7, color: theme.muted, letterSpacing: ".04em", textTransform: "uppercase" },
  };

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <a href="/premium" style={{ color: theme.muted, textDecoration: "none", fontSize: 12, fontWeight: 800, display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span aria-hidden="true">←</span> Back to Premium Home
        </a>

        <header style={{ margin: "24px 0 22px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${theme.border}`, borderRadius: 99, padding: "7px 11px", color: theme.gold, fontSize: 10, letterSpacing: 1.6, fontWeight: 900, background: theme.surface }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: theme.gold, display: "inline-block" }} />
            SAMBHAV UPSC · LEARNING LIBRARY
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
            <div style={{ maxWidth: 680 }}>
              <h1 style={{ fontSize: "clamp(30px, 5vw, 48px)", letterSpacing: "-1.8px", lineHeight: 1.03, margin: "0 0 11px", fontWeight: 900 }}>Study <span style={{ color: theme.gold }}>Material.</span></h1>
              <p style={{ color: theme.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>A focused library for UPSC Prelims and Mains. Find notes by subject, topic, language and exam stage.</p>
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <div style={{ ...styles.card, padding: "12px 15px", minWidth: 108, borderRadius: 15, boxShadow: "none" }}>
                <div style={{ fontSize: 23, lineHeight: 1.1, fontWeight: 900 }}>{loading ? "—" : items.length}</div>
                <div style={{ color: theme.muted, fontSize: 10, fontWeight: 800, marginTop: 5 }}>AVAILABLE NOTES</div>
              </div>
              <div style={{ ...styles.card, padding: "12px 15px", minWidth: 108, borderRadius: 15, boxShadow: "none" }}>
                <div style={{ fontSize: 23, lineHeight: 1.1, fontWeight: 900 }}>{loading ? "—" : counts}</div>
                <div style={{ color: theme.muted, fontSize: 10, fontWeight: 800, marginTop: 5 }}>SUBJECT AREAS</div>
              </div>
            </div>
          </div>
        </header>

        <section style={{ ...styles.card, marginBottom: 22, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 13 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>Find your next revision resource</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>Search works with Hindi or English metadata.</div>
            </div>
            {activeFilters > 0 && <button type="button" style={{ ...styles.secondary, minHeight: 34, padding: "7px 10px" }} onClick={clearFilters}>Clear filters · {activeFilters}</button>}
          </div>
          <div style={{ position: "relative" }}>
            <span aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.muted, fontSize: 18 }}>⌕</span>
            <input id="study-search" style={styles.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search LWE, मौद्रिक नीति, Parliament, biodiversity…" aria-label="Search notes and topics" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 11, marginTop: 13 }}>
            <div><label style={styles.label} htmlFor="study-subject">Subject</label><select id="study-subject" style={styles.select} value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={styles.label} htmlFor="study-exam">Exam stage</label><select id="study-exam" style={styles.select} value={exam} onChange={(e) => setExam(e.target.value)}>{exams.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={styles.label} htmlFor="study-language">Language</label><select id="study-language" style={styles.select} value={language} onChange={(e) => setLanguage(e.target.value)}>{languages.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
        </section>

        <section aria-labelledby="library-results-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, margin: "0 2px 14px", flexWrap: "wrap" }}>
            <div>
              <h2 id="library-results-heading" style={{ fontWeight: 900, fontSize: 19, margin: 0, letterSpacing: "-.4px" }}>Library resources</h2>
              <div aria-live="polite" style={{ fontSize: 11, color: theme.muted, marginTop: 5 }}>
                {loading ? "Updating library…" : `${items.length} ${items.length === 1 ? "resource" : "resources"} found${counts ? ` across ${counts} subjects` : ""}`}
                {lastLoaded && !loading ? ` · Updated ${lastLoaded.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
              </div>
            </div>
            <button type="button" style={{ ...styles.secondary, opacity: loading ? .65 : 1 }} onClick={load} disabled={loading} aria-busy={loading}>
              <span aria-hidden="true">↻</span> {loading ? "Loading…" : "Refresh library"}
            </button>
          </div>

          {error && <div role="alert" style={{ ...styles.card, borderColor: "rgba(181,43,34,.35)", marginBottom: 14 }}>
            <div style={{ fontWeight: 900, color: "#b52b22" }}>Library could not load</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: theme.muted, margin: "7px 0 13px" }}>{error}</p>
            <button type="button" style={styles.primary} onClick={load}>Try again</button>
          </div>}

          {loading && !items.length && !error && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: 12 }}>
            {[1, 2, 3].map((n) => <div key={n} style={{ ...styles.card, minHeight: 150, opacity: .7 }}>
              <div style={{ height: 12, width: "34%", background: theme.border, borderRadius: 8, marginBottom: 18 }} />
              <div style={{ height: 18, width: "78%", background: theme.border, borderRadius: 8, marginBottom: 12 }} />
              <div style={{ height: 10, width: "92%", background: theme.border, borderRadius: 8, marginBottom: 7 }} />
              <div style={{ height: 10, width: "63%", background: theme.border, borderRadius: 8 }} />
            </div>)}
          </div>}

          {!error && !loading && items.length === 0 && <div style={{ ...styles.card, textAlign: "center", padding: "46px 20px" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, margin: "0 auto", background: theme.ink, color: theme.goldLight, display: "grid", placeItems: "center", fontSize: 25 }}>PDF</div>
            <h3 style={{ margin: "16px 0 7px", fontSize: 19, fontWeight: 900 }}>No resources found</h3>
            <p style={{ color: theme.muted, fontSize: 13, lineHeight: 1.7, margin: "0 auto", maxWidth: 440 }}>Try a broader keyword or reset the filters. Published resources will appear here when they are available in the library.</p>
            <button type="button" style={{ ...styles.primary, marginTop: 17 }} onClick={clearFilters}>Clear all filters</button>
          </div>}

          {!error && items.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 13 }}>
            {items.map((item) => (
              <article key={item.id} style={{ ...styles.card, padding: 17, display: "flex", flexDirection: "column", gap: 13, transition: "transform .18s ease, box-shadow .18s ease", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div aria-hidden="true" style={{ width: 48, height: 54, flexShrink: 0, borderRadius: 13, background: theme.ink, color: theme.goldLight, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 950, letterSpacing: ".5px" }}>PDF</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: 15, lineHeight: 1.45, margin: "0 0 6px", overflowWrap: "anywhere", fontWeight: 900 }}>{item.title || "Untitled resource"}</h3>
                    <div style={{ fontSize: 11, lineHeight: 1.55, color: theme.muted }}>{[item.subject, item.topic].filter(Boolean).join(" · ") || item.category || "Study Material"}</div>
                  </div>
                </div>
                {item.description && <p style={{ fontSize: 12, lineHeight: 1.65, color: theme.muted, margin: 0, overflowWrap: "anywhere" }}>{item.description}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[item.exam_type, item.language, item.category].filter(Boolean).map((tag, i) => <span key={`${tag}-${i}`} style={{ fontSize: 10, fontWeight: 800, color: theme.muted, border: `1px solid ${theme.border}`, borderRadius: 99, padding: "5px 8px", background: "rgba(127,127,127,.035)" }}>{tag}</span>)}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 3, flexWrap: "wrap" }}>
                  {item.fileUrl ? <>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" style={styles.primary}>Open PDF <span aria-hidden="true">↗</span></a>
                    <a href={item.fileUrl} download style={styles.secondary}>Download ↓</a>
                  </> : <span style={{ fontSize: 11, color: "#b52b22", lineHeight: 1.5 }}>File link unavailable — contact admin.</span>}
                </div>
              </article>
            ))}
          </div>}
        </section>

        <footer style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${theme.border}`, fontSize: 10, color: theme.muted, lineHeight: 1.7 }}>
          Search covers title, subject, topic and description stored in library metadata. Searching the text inside a PDF requires a separate text-extraction and indexing workflow.
        </footer>
      </div>
    </main>
  );
}
