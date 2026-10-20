"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const PAPER_OPTIONS = ["All", "GS1", "GS2", "GS3", "GS4"];

export default function PyqIntelligencePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paper, setPaper] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/pyq/intelligence", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "PYQ analysis load nahi ho saka.");
      setData(json);
    } catch (e) { setError(e.message || "Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const themes = useMemo(() => (data?.themes || []).filter((theme) => {
    const matchesPaper = paper === "All" || (theme.papers?.[paper] || 0) > 0;
    const matchesQuery = !query || theme.name.toLowerCase().includes(query.toLowerCase());
    return matchesPaper && matchesQuery;
  }).sort((a, b) => {
    if (paper !== "All") return (b.papers?.[paper] || 0) - (a.papers?.[paper] || 0);
    return b.count - a.count;
  }), [data, paper, query]);

  const styles = {
    page: { minHeight: "100vh", background: "var(--background, #f6f7fb)", color: "var(--foreground, #151923)", padding: "clamp(16px, 3vw, 32px)", fontFamily: "Arial, sans-serif" },
    wrap: { maxWidth: 1120, margin: "0 auto" },
    muted: { color: "var(--muted-foreground, #687083)" },
    panel: { background: "var(--card, #fff)", border: "1px solid var(--border, #e3e6ee)", borderRadius: 16, padding: 18 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12, margin: "20px 0" },
    metric: { background: "var(--card, #fff)", border: "1px solid var(--border, #e3e6ee)", borderRadius: 14, padding: 16 },
    input: { width: "100%", minWidth: 0, padding: "11px 12px", borderRadius: 10, border: "1px solid var(--border, #d8dce5)", background: "var(--card, #fff)", color: "inherit", fontSize: 14 },
    button: { border: "1px solid var(--border, #d8dce5)", background: "var(--card, #fff)", color: "inherit", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontWeight: 600 },
  };

  return <main style={styles.page}><div style={styles.wrap}>
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, ...styles.muted }}>SAMBHAV UPSC · SMART UPSC</div><h1 style={{ margin: "8px 0", fontSize: "clamp(26px, 4vw, 36px)" }}>PYQ Intelligence</h1><p style={{ margin: 0, ...styles.muted }}>Mains PYQs mein recurring themes aur paper-wise distribution.</p></div>
      <button style={styles.button} onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh analysis"}</button>
    </div>

    {error && <div role="alert" style={{ ...styles.panel, marginTop: 18, borderColor: "#dc7777", color: "#a52323" }}>{error}<div style={{ marginTop: 10 }}><button style={styles.button} onClick={load}>Retry</button></div></div>}
    {loading && !data && <div style={{ ...styles.panel, marginTop: 20 }}>GitHub CSV files load aur analyse ho rahi hain…</div>}
    {data && <>
      <div style={styles.grid}>
        <div style={styles.metric}><div style={{ fontSize: 13, ...styles.muted }}>Loaded questions</div><div style={{ fontSize: 29, fontWeight: 800, marginTop: 8 }}>{data.totalQuestions}</div></div>
        <div style={styles.metric}><div style={{ fontSize: 13, ...styles.muted }}>Matched themes</div><div style={{ fontSize: 29, fontWeight: 800, marginTop: 8 }}>{data.themes.length}</div></div>
        <div style={styles.metric}><div style={{ fontSize: 13, ...styles.muted }}>Year range</div><div style={{ fontSize: 25, fontWeight: 800, marginTop: 8 }}>{data.yearRange ? `${data.yearRange.from}–${data.yearRange.to}` : "—"}</div></div>
        <div style={styles.metric}><div style={{ fontSize: 13, ...styles.muted }}>Unclassified topic field</div><div style={{ fontSize: 29, fontWeight: 800, marginTop: 8 }}>{data.unclassifiedCount}</div></div>
      </div>

      <section style={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 12 }}><h2 style={{ margin: 0, fontSize: 20 }}>Theme frequency</h2><span style={{ fontSize: 12, ...styles.muted }}>Keyword-based estimate</span></div>
        <p style={{ fontSize: 13, lineHeight: 1.6, ...styles.muted }}>Ek question ek se zyada themes se match ho sakta hai. Isliye theme counts ko total questions se add karna valid nahi hai. Ye keyword analysis hai, semantic AI classification nahi.</p>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 140px", gap: 10, margin: "16px 0" }}>
          <input style={styles.input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Theme search…" aria-label="Search themes" />
          <select style={styles.input} value={paper} onChange={(e) => setPaper(e.target.value)} aria-label="Filter by paper">{PAPER_OPTIONS.map((p) => <option key={p}>{p}</option>)}</select>
        </div>
        {themes.length === 0 && <p style={styles.muted}>Is filter ke liye theme nahi mili.</p>}
        <div style={{ display: "grid", gap: 10 }}>
          {themes.map((theme, index) => {
            const count = paper === "All" ? theme.count : (theme.papers?.[paper] || 0);
            const max = Math.max(1, ...themes.map((t) => paper === "All" ? t.count : (t.papers?.[paper] || 0)));
            const isOpen = expanded === theme.name;
            return <div key={theme.name} style={{ border: "1px solid var(--border, #e7e9ef)", borderRadius: 12, padding: 13 }}>
              <button onClick={() => setExpanded(isOpen ? "" : theme.name)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: 0, background: "transparent", color: "inherit", padding: 0, cursor: "pointer" }} aria-expanded={isOpen}>
                <span style={{ width: 28, height: 28, flex: "0 0 28px", display: "grid", placeItems: "center", borderRadius: 8, background: "var(--background, #f0f2f8)", fontSize: 12, fontWeight: 800 }}>{index + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontWeight: 700 }}>{theme.name}</span><span style={{ display: "block", height: 6, borderRadius: 8, background: "var(--background, #edf0f5)", marginTop: 8, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${(count / max) * 100}%`, background: "var(--primary, #5266d8)", borderRadius: 8 }} /></span></span>
                <strong style={{ minWidth: 34, textAlign: "right", fontSize: 20 }}>{count}</strong><span aria-hidden="true" style={styles.muted}>{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <div style={{ margin: "14px 0 0 40px" }}><div style={{ fontSize: 13, ...styles.muted }}>Paper distribution: {Object.entries(theme.papers || {}).map(([p, n]) => `${p}: ${n}`).join(" · ") || "No matches"}</div>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>{theme.examples.map((example, i) => <article key={`${example.paper}-${example.year}-${i}`} style={{ padding: 12, borderRadius: 10, background: "var(--background, #f7f8fb)" }}><div style={{ fontSize: 12, fontWeight: 700, ...styles.muted }}>{example.year || "Year unavailable"} · {example.paper} · {example.topic}</div><p style={{ margin: "7px 0 0", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{example.question}</p></article>)}</div>
              </div>}
            </div>;
          })}
        </div>
      </section>
      {data.failedSources?.length > 0 && <section style={{ ...styles.panel, marginTop: 16 }}><h3 style={{ marginTop: 0 }}>Some CSV sources failed</h3><ul>{data.failedSources.map((s) => <li key={s.file}>{s.file}: {s.error}</li>)}</ul></section>}
      <p style={{ fontSize: 12, marginTop: 14, ...styles.muted }}>Updated: {data.generatedAt ? new Date(data.generatedAt).toLocaleString("en-IN") : "—"}. Counts are generated from the available source CSV files.</p>
    </>}
  </div></main>;
}
