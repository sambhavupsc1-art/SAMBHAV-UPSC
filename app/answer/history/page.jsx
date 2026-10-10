"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const getInitialTheme = () => "light";

function humanizeKey(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function EvaluationSection({ title, value, theme }) {
  if (value === null || value === undefined || value === "") return null;
  const items = Array.isArray(value) ? value : null;
  const object = !items && typeof value === "object" ? value : null;
  const palette = theme.palette;

  if (!items && !object) {
    return (
      <section style={{ ...styles.detailSection, borderColor: palette.border }}>
        <h4 style={{ ...styles.detailHeading, color: palette.text }}>{title}</h4>
        <p style={{ ...styles.detailText, color: palette.muted }}>{String(value)}</p>
      </section>
    );
  }

  const entries = object
    ? Object.entries(object).filter(([, item]) => item !== null && item !== undefined && item !== "")
    : items.map((item, index) => [String(index + 1), item]);

  return (
    <section style={{ ...styles.detailSection, borderColor: palette.border }}>
      <h4 style={{ ...styles.detailHeading, color: palette.text }}>{title}</h4>
      <div style={styles.detailList}>
        {entries.map(([key, item], index) => {
          const itemObject = item && typeof item === "object" && !Array.isArray(item);
          return (
            <div key={`${key}-${index}`} style={{ ...styles.detailItem, background: palette.soft }}>
              {items && <div style={{ ...styles.detailIndex, background: palette.accentSoft, color: palette.accent }}>{index + 1}</div>}
              <div style={{ minWidth: 0, flex: 1 }}>
                {!items && <div style={{ ...styles.detailLabel, color: palette.muted }}>{humanizeKey(key)}</div>}
                {itemObject ? (
                  <div style={styles.nestedFields}>
                    {Object.entries(item).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([subKey, subValue]) => (
                      <div key={subKey} style={styles.nestedRow}>
                        <span style={{ ...styles.nestedLabel, color: palette.muted }}>{humanizeKey(subKey)}</span>
                        <span style={{ ...styles.nestedValue, color: palette.text }}>{formatValue(subValue)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...styles.detailText, color: palette.text }}>{formatValue(item)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function EvaluatedAnswerHistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paperFilter, setPaperFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [openId, setOpenId] = useState(null);
  const [themeMode, setThemeMode] = useState(getInitialTheme);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") setThemeMode(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      document.documentElement.dataset.sambhavTheme = themeMode;
      document.documentElement.style.colorScheme = themeMode;
      localStorage.setItem("sambhav-theme", themeMode);
    } catch {}
  }, [themeMode]);

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
      return [
        record.question, record.paper, record.section, record.topic,
        record.candidate_answer_transcription, record.pyq_year,
        record.evaluation?.examiner_summary, record.evaluation?.overall_assessment,
      ].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [records, search, paperFilter, yearFilter]);

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(date);
  };

  const totalScore = records.reduce((sum, record) => sum + (Number(record.score) || 0), 0);
  const averageScore = records.length ? (totalScore / records.length).toFixed(1) : "—";
  const theme = useMemo(() => {
    const dark = themeMode === "dark";
    return {
      dark,
      palette: dark ? {
        page: "#0b0b0b", surface: "#151515", card: "#181817", soft: "#20201e",
        text: "#f5f2eb", muted: "#aaa59a", border: "rgba(255,255,255,.10)",
        accent: "#dfc477", accentSoft: "rgba(223,196,119,.12)", hero: "#101010",
        input: "#171716", shadow: "0 14px 38px rgba(0,0,0,.22)", navBorder: "rgba(223,196,119,.2)",
        success: "#9bd5a7", successSoft: "rgba(57,150,80,.14)", warning: "#dfc477",
        warningSoft: "rgba(223,196,119,.12)", danger: "#f1a19a", dangerSoft: "rgba(220,80,70,.12)",
      } : {
        page: "#f5f2eb", surface: "#fffdf9", card: "#ffffff", soft: "#f8f7f2",
        text: "#171715", muted: "#77736b", border: "rgba(16,16,16,.09)",
        accent: "#b89445", accentSoft: "rgba(184,148,69,.12)", hero: "#101010",
        input: "#ffffff", shadow: "0 12px 32px rgba(16,16,16,.055)", navBorder: "rgba(184,148,69,.25)",
        success: "#246334", successSoft: "#eaf5ec", warning: "#76602b",
        warningSoft: "#f6f0df", danger: "#a6342b", dangerSoft: "#faeae8",
      },
    };
  }, [themeMode]);
  const p = theme.palette;

  return (
    <main style={{ ...styles.page, background: p.page, color: p.text }}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button type="button" onClick={() => router.push("/answer")} style={{ ...styles.backButton, background: p.surface, borderColor: p.border, color: p.text }} aria-label="Back to answer writing">←</button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...styles.brand, color: p.text }}>SAMBHAV UPSC</div>
            <div style={{ ...styles.subtitle, color: p.muted }}>MAINS ANSWER WRITING · YOUR PROGRESS</div>
          </div>
          <button type="button" onClick={() => setThemeMode((old) => old === "dark" ? "light" : "dark")} style={{ ...styles.themeButton, background: p.surface, borderColor: p.border, color: p.text }} aria-label="Toggle light and dark theme" title="Toggle theme">
            {themeMode === "dark" ? "☀" : "☾"}
          </button>
          <button type="button" onClick={() => router.push("/answer")} style={{ ...styles.primaryButton, background: p.hero }}>Write Answer <span aria-hidden="true">↗</span></button>
        </header>

        <section style={{ ...styles.hero, background: p.hero, boxShadow: theme.palette.shadow }}>
          <div style={styles.heroGlow} />
          <div style={styles.eyebrow}>PERSONAL EXAMINER DASHBOARD</div>
          <h1 style={styles.title}>My Evaluated Answers</h1>
          <p style={styles.heroDescription}>Har evaluated answer ka score, original question, transcription aur examiner feedback ek jagah. PYQ verification sirf source data ke verified record par dikhayi jaati hai.</p>
          <div style={styles.statsRow}>
            <div style={styles.stat}><span style={styles.statLabel}>TOTAL EVALUATIONS</span><strong style={styles.statValue}>{records.length}</strong><span style={styles.statFoot}>Saved attempts</span></div>
            <div style={styles.stat}><span style={styles.statLabel}>PAPERS COVERED</span><strong style={styles.statValue}>{new Set(records.map((r) => r.paper).filter(Boolean)).size}</strong><span style={styles.statFoot}>Across your history</span></div>
            <div style={styles.stat}><span style={styles.statLabel}>AVERAGE SCORE</span><strong style={styles.statValue}>{averageScore}</strong><span style={styles.statFoot}>Marks per evaluation</span></div>
          </div>
        </section>

        <section style={{ ...styles.filters, background: p.surface, borderColor: p.border }}>
          <div style={styles.filterHeading}>
            <div>
              <h2 style={{ ...styles.filterTitle, color: p.text }}>Find an evaluation</h2>
              <p style={{ ...styles.filterSub, color: p.muted }}>Search by question, topic, paper or transcribed answer.</p>
            </div>
            <span style={{ ...styles.resultCount, background: p.accentSoft, color: p.accent }}>{filtered.length} results</span>
          </div>
          <div style={styles.filterGrid}>
            <label style={styles.field}>
              <span style={{ ...styles.fieldLabel, color: p.muted }}>SEARCH HISTORY</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Question, topic ya answer search karein…" style={{ ...styles.search, background: p.input, borderColor: p.border, color: p.text }} />
            </label>
            <label style={styles.field}>
              <span style={{ ...styles.fieldLabel, color: p.muted }}>PAPER</span>
              <select value={paperFilter} onChange={(e) => setPaperFilter(e.target.value)} style={{ ...styles.select, background: p.input, borderColor: p.border, color: p.text }}>
                <option value="All">All papers</option>
                {papers.map((paper) => <option key={paper} value={paper}>{paper}</option>)}
              </select>
            </label>
            <label style={styles.field}>
              <span style={{ ...styles.fieldLabel, color: p.muted }}>PYQ YEAR</span>
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ ...styles.select, background: p.input, borderColor: p.border, color: p.text }}>
                <option value="All">All years</option>
                {years.map((year) => <option key={year} value={String(year)}>{year}</option>)}
              </select>
            </label>
          </div>
        </section>

        {loading && <div style={{ ...styles.message, background: p.surface, borderColor: p.border, color: p.muted }}><span style={styles.loadingDot} /> Loading your evaluated answers…</div>}
        {!loading && error && (
          <div style={{ ...styles.message, background: p.surface, borderColor: p.border, color: p.text }}>
            <div style={styles.messageIcon}>!</div><strong>History unavailable</strong>
            <p style={{ margin: "8px 0 14px", color: p.muted }}>{error}</p>
            <button type="button" onClick={() => router.push("/login")} style={{ ...styles.primaryButton, marginLeft: 0, background: p.hero }}>Sign in</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ ...styles.empty, background: p.surface, borderColor: p.border }}>
            <div style={{ ...styles.emptyIcon, background: p.accentSoft, color: p.accent }}>▤</div>
            <h2 style={{ ...styles.emptyTitle, color: p.text }}>{records.length ? "No matching answers" : "Your history starts here"}</h2>
            <p style={{ ...styles.emptyDescription, color: p.muted }}>{records.length ? "Search ya filters badal kar dekhein." : "Mains answer evaluate karne ke baad, sign-in session ke saath result yahan save ho jayega."}</p>
            <button type="button" onClick={() => router.push("/answer")} style={{ ...styles.primaryButton, marginLeft: 0, background: p.hero }}>Evaluate an Answer ↗</button>
          </div>
        )}

        <div style={styles.list}>
          {filtered.map((record) => {
            const expanded = openId === record.id;
            const score = Number(record.score);
            const max = Number(record.maximum_marks) || Number(record.marks) || 15;
            const evaluation = record.evaluation && typeof record.evaluation === "object" ? record.evaluation : {};
            const summary = evaluation.examiner_summary || evaluation.overall_assessment || evaluation.summary;
            const demand = evaluation.demand_fulfilment || evaluation.demand_fulfillment || {};
            const quality = evaluation.quality_level || evaluation.overall_quality || "—";
            const demandScore = demand.score ?? evaluation.demand_fulfilment_score;
            const demandMax = demand.maximum ?? demand.max_score ?? evaluation.demand_fulfilment_maximum;
            const verified = record.pyq_verified === true;
            const scorePercent = Number.isFinite(score) && max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;

            return (
              <article key={record.id} style={{ ...styles.card, background: p.card, borderColor: p.border, boxShadow: p.shadow }}>
                <div style={styles.cardTop}>
                  <div style={styles.metaWrap}>
                    <span style={{ ...styles.paperBadge, background: p.soft, color: p.text, borderColor: p.border }}>{record.paper || "GS"}</span>
                    {verified ? <span style={{ ...styles.verifiedBadge, background: p.successSoft, color: p.success }}>✓ Source verified</span> : <span style={{ ...styles.unverifiedBadge, background: p.warningSoft, color: p.warning }}>{record.question_source === "Custom Question" ? "Custom question" : "PYQ unverified"}</span>}
                    {record.pyq_year && <span style={{ ...styles.metaText, color: p.muted }}>UPSC Mains {record.pyq_year}</span>}
                    {record.pyq_question_number && <span style={{ ...styles.metaText, color: p.muted }}>Q. {record.pyq_question_number}</span>}
                  </div>
                  <div style={{ ...styles.scorePanel, background: p.hero }}>
                    <span style={styles.scoreLabel}>YOUR SCORE</span>
                    <strong style={styles.scoreValue}>{Number.isFinite(score) ? score : "—"}<span>/{max}</span></strong>
                    <div style={styles.scoreTrack}><div style={{ ...styles.scoreFill, width: `${scorePercent}%` }} /></div>
                  </div>
                </div>
                <h2 style={{ ...styles.question, color: p.text }}>{record.question}</h2>
                <div style={styles.detailsLine}>
                  {record.topic && <span style={{ ...styles.detailPill, background: p.soft, color: p.muted }}>◈ {record.topic}</span>}
                  {record.section && <span style={{ ...styles.detailPill, background: p.soft, color: p.muted }}>{record.section}</span>}
                  <span style={{ ...styles.dateText, color: p.muted }}>◷ {formatDate(record.created_at)}</span>
                </div>
                <div style={styles.cardActions}>
                  <button type="button" onClick={() => setOpenId(expanded ? null : record.id)} style={{ ...styles.secondaryButton, background: expanded ? p.accentSoft : p.surface, borderColor: expanded ? p.navBorder : p.border, color: expanded ? p.accent : p.text }}>
                    {expanded ? "− Hide examiner report" : "+ View examiner report"}
                  </button>
                  <span style={{ ...styles.dateText, color: p.muted }}>{record.marks || max} marks question</span>
                </div>

                {expanded && (
                  <div style={{ ...styles.expanded, borderColor: p.border }}>
                    <div style={styles.reportHeader}>
                      <div>
                        <div style={{ ...styles.reportEyebrow, color: p.accent }}>STRUCTURED FEEDBACK</div>
                        <h3 style={{ ...styles.reportTitle, color: p.text }}>Examiner&apos;s report</h3>
                      </div>
                      <span style={{ ...styles.qualityBadge, background: p.accentSoft, color: p.accent }}>{String(quality)}</span>
                    </div>

                    <div style={styles.overviewGrid}>
                      <div style={{ ...styles.overviewCard, background: p.soft, borderColor: p.border }}>
                        <span style={{ ...styles.overviewLabel, color: p.muted }}>DEMAND FULFILMENT</span>
                        <strong style={{ ...styles.overviewValue, color: p.text }}>{demandScore ?? "—"}<span>/{demandMax ?? "—"}</span></strong>
                        <span style={{ ...styles.overviewHint, color: p.muted }}>Coverage of the question&apos;s requirements</span>
                      </div>
                      <div style={{ ...styles.overviewCard, background: p.soft, borderColor: p.border }}>
                        <span style={{ ...styles.overviewLabel, color: p.muted }}>OVERALL SCORE</span>
                        <strong style={{ ...styles.overviewValue, color: p.text }}>{Number.isFinite(score) ? score : "—"}<span>/{max}</span></strong>
                        <span style={{ ...styles.overviewHint, color: p.muted }}>Recorded evaluation result</span>
                      </div>
                    </div>

                    <section style={{ ...styles.reportSection, borderColor: p.border }}>
                      <h4 style={{ ...styles.reportSectionTitle, color: p.text }}><span style={{ ...styles.sectionIcon, background: p.accentSoft, color: p.accent }}>✦</span> Examiner summary</h4>
                      <p style={{ ...styles.summary, color: p.muted }}>{summary || "Examiner summary is not available in this saved record."}</p>
                    </section>

                    <section style={{ ...styles.reportSection, borderColor: p.border }}>
                      <h4 style={{ ...styles.reportSectionTitle, color: p.text }}><span style={{ ...styles.sectionIcon, background: p.accentSoft, color: p.accent }}>✎</span> Your answer transcription</h4>
                      <div style={{ ...styles.transcript, background: p.soft, borderColor: p.border, color: p.text }}>{record.candidate_answer_transcription || "Transcription was not available for this saved evaluation."}</div>
                    </section>

                    <section style={{ ...styles.reportSection, borderColor: p.border }}>
                      <h4 style={{ ...styles.reportSectionTitle, color: p.text }}><span style={{ ...styles.sectionIcon, background: p.accentSoft, color: p.accent }}>◎</span> Detailed evaluation</h4>
                      <div style={styles.evaluationGrid}>
                        <div style={{ ...styles.miniCard, background: p.surface, borderColor: p.border }}>
                          <span style={{ ...styles.miniLabel, color: p.muted }}>Quality level</span>
                          <strong style={{ ...styles.miniValue, color: p.text }}>{String(quality)}</strong>
                        </div>
                        <div style={{ ...styles.miniCard, background: p.surface, borderColor: p.border }}>
                          <span style={{ ...styles.miniLabel, color: p.muted }}>Marks awarded</span>
                          <strong style={{ ...styles.miniValue, color: p.text }}>{Number.isFinite(score) ? score : "—"} / {max}</strong>
                        </div>
                      </div>
                      {Object.entries(evaluation)
                        .filter(([key]) => !["examiner_summary", "overall_assessment", "summary", "quality_level", "overall_quality", "demand_fulfilment", "demand_fulfillment", "demand_fulfilment_score", "demand_fulfilment_maximum"].includes(key))
                        .map(([key, value]) => <EvaluationSection key={key} title={humanizeKey(key)} value={value} theme={theme} />)}
                      <details style={{ ...styles.rawDetails, borderColor: p.border }}>
                        <summary style={{ ...styles.summaryToggle, color: p.muted }}>View raw evaluation data</summary>
                        <pre style={{ ...styles.rawJson, background: p.soft, color: p.text, borderColor: p.border }}>{JSON.stringify(evaluation, null, 2)}</pre>
                      </details>
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <footer style={{ ...styles.footer, color: p.muted }}>Saved to your SAMBHAV UPSC account <span style={{ color: p.accent }}>•</span> Maximum 100 recent evaluations shown</footer>
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: "22px 14px 44px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", transition: "background .2s ease, color .2s ease" },
  container: { width: "100%", maxWidth: "920px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" },
  backButton: { width: "42px", height: "42px", border: "1px solid", borderRadius: "14px", fontSize: "20px", cursor: "pointer", flexShrink: 0 },
  brand: { fontSize: "17px", fontWeight: 950, letterSpacing: "-.5px" },
  subtitle: { fontSize: "9px", marginTop: "4px", letterSpacing: "1px", fontWeight: 800 },
  themeButton: { width: "39px", height: "39px", border: "1px solid", borderRadius: "13px", cursor: "pointer", fontSize: "17px", flexShrink: 0 },
  primaryButton: { border: 0, borderRadius: "12px", padding: "12px 14px", color: "#fff", fontWeight: 850, fontSize: "11px", cursor: "pointer", marginLeft: "auto", flexShrink: 0, boxShadow: "0 6px 16px rgba(0,0,0,.12)" },
  hero: { position: "relative", isolation: "isolate", overflow: "hidden", color: "#fff", borderRadius: "25px", padding: "23px", marginBottom: "14px", border: "1px solid rgba(223,196,119,.17)" },
  heroGlow: { position: "absolute", width: "230px", height: "230px", borderRadius: "50%", right: "-95px", top: "-135px", background: "rgba(223,196,119,.12)", zIndex: -1, pointerEvents: "none" },
  eyebrow: { fontSize: "9px", fontWeight: 900, letterSpacing: "1.5px", color: "#dfc477", marginBottom: "10px" },
  title: { fontSize: "clamp(25px, 5vw, 36px)", letterSpacing: "-1.1px", margin: "0 0 9px", lineHeight: 1.08, fontWeight: 950 },
  heroDescription: { color: "#c4c4c4", fontSize: "12px", lineHeight: 1.65, maxWidth: "660px", margin: "0 0 20px" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "9px" },
  stat: { border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.055)", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 },
  statLabel: { color: "#b9b9b9", fontSize: "8px", fontWeight: 850, letterSpacing: ".7px" },
  statValue: { color: "#dfc477", fontSize: "23px", lineHeight: 1.1, fontWeight: 950 },
  statFoot: { color: "#999", fontSize: "9px" },
  filters: { border: "1px solid", borderRadius: "21px", padding: "17px", marginBottom: "14px" },
  filterHeading: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" },
  filterTitle: { margin: 0, fontSize: "15px", fontWeight: 900 },
  filterSub: { margin: "5px 0 0", fontSize: "10px", lineHeight: 1.5 },
  resultCount: { borderRadius: "999px", padding: "7px 10px", fontSize: "9px", fontWeight: 900, whiteSpace: "nowrap" },
  filterGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) repeat(2, minmax(0, 1fr))", gap: "9px" },
  field: { display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 },
  fieldLabel: { fontSize: "8px", fontWeight: 900, letterSpacing: ".8px" },
  search: { width: "100%", minWidth: 0, boxSizing: "border-box", border: "1px solid", borderRadius: "12px", padding: "12px", fontSize: "11px", outline: "none" },
  select: { width: "100%", minWidth: 0, boxSizing: "border-box", border: "1px solid", borderRadius: "12px", padding: "12px 10px", fontSize: "11px" },
  message: { padding: "23px", border: "1px solid", borderRadius: "17px", fontSize: "12px", lineHeight: 1.6, marginBottom: "12px" },
  messageIcon: { display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "11px", background: "rgba(220,80,70,.12)", color: "#c55", fontWeight: 900, marginBottom: "10px" },
  loadingDot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#b89445", marginRight: "9px" },
  empty: { textAlign: "center", padding: "42px 20px", border: "1px dashed", borderRadius: "20px", marginBottom: "15px" },
  emptyIcon: { display: "grid", placeItems: "center", width: "54px", height: "54px", borderRadius: "17px", fontSize: "27px", margin: "0 auto 13px" },
  emptyTitle: { fontSize: "18px", margin: "0 0 9px", fontWeight: 900 },
  emptyDescription: { fontSize: "12px", lineHeight: 1.6, margin: "0 auto 17px", maxWidth: "460px" },
  list: { display: "grid", gap: "13px" },
  card: { border: "1px solid", borderRadius: "21px", padding: "17px", minWidth: 0, transition: "box-shadow .2s ease" },
  cardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" },
  metaWrap: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", minWidth: 0, paddingTop: "2px" },
  paperBadge: { padding: "6px 8px", border: "1px solid", borderRadius: "8px", fontSize: "9px", fontWeight: 900 },
  verifiedBadge: { padding: "6px 8px", borderRadius: "8px", fontSize: "9px", fontWeight: 850 },
  unverifiedBadge: { padding: "6px 8px", borderRadius: "8px", fontSize: "9px", fontWeight: 850 },
  metaText: { fontSize: "10px" },
  scorePanel: { flexShrink: 0, color: "#fff", minWidth: "94px", borderRadius: "13px", padding: "10px 11px", border: "1px solid rgba(223,196,119,.18)" },
  scoreLabel: { display: "block", color: "#c4c4c4", fontSize: "7px", fontWeight: 900, letterSpacing: ".8px", marginBottom: "4px" },
  scoreValue: { display: "block", color: "#dfc477", fontSize: "19px", fontWeight: 950, lineHeight: 1.2 },
  scoreTrack: { height: "4px", background: "rgba(255,255,255,.15)", borderRadius: "99px", overflow: "hidden", marginTop: "8px" },
  scoreFill: { height: "100%", background: "#dfc477", borderRadius: "99px" },
  question: { fontSize: "15px", lineHeight: 1.6, margin: "14px 0 11px", fontWeight: 850, letterSpacing: "-.2px", overflowWrap: "anywhere" },
  detailsLine: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "7px" },
  detailPill: { borderRadius: "999px", padding: "6px 9px", fontSize: "9px", maxWidth: "100%", overflowWrap: "anywhere" },
  dateText: { fontSize: "9px" },
  cardActions: { display: "flex", alignItems: "center", gap: "10px", marginTop: "15px", flexWrap: "wrap" },
  secondaryButton: { border: "1px solid", borderRadius: "11px", padding: "10px 12px", fontWeight: 850, fontSize: "10px", cursor: "pointer" },
  expanded: { borderTop: "1px solid", marginTop: "17px", paddingTop: "17px", minWidth: 0 },
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" },
  reportEyebrow: { fontSize: "8px", fontWeight: 950, letterSpacing: "1.2px", marginBottom: "5px" },
  reportTitle: { margin: 0, fontSize: "20px", letterSpacing: "-.5px", fontWeight: 950 },
  qualityBadge: { borderRadius: "999px", padding: "7px 10px", fontSize: "9px", fontWeight: 900, maxWidth: "45%", textAlign: "center" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "9px", marginBottom: "13px" },
  overviewCard: { border: "1px solid", borderRadius: "15px", padding: "14px", minWidth: 0 },
  overviewLabel: { display: "block", fontSize: "8px", fontWeight: 900, letterSpacing: ".7px", marginBottom: "8px" },
  overviewValue: { display: "block", fontSize: "24px", fontWeight: 950, lineHeight: 1.1 },
  overviewHint: { display: "block", fontSize: "9px", marginTop: "7px", lineHeight: 1.45 },
  reportSection: { borderTop: "1px solid", paddingTop: "15px", marginTop: "15px" },
  reportSectionTitle: { display: "flex", alignItems: "center", gap: "8px", margin: "0 0 10px", fontSize: "12px", fontWeight: 950 },
  sectionIcon: { display: "grid", placeItems: "center", width: "27px", height: "27px", borderRadius: "9px", fontSize: "13px", flexShrink: 0 },
  summary: { margin: 0, fontSize: "12px", lineHeight: 1.8, whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
  transcript: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", border: "1px solid", borderRadius: "13px", padding: "14px", fontSize: "12px", lineHeight: 1.8, maxHeight: "360px", overflow: "auto" },
  evaluationGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "9px", marginBottom: "12px" },
  miniCard: { border: "1px solid", borderRadius: "13px", padding: "12px", display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 },
  miniLabel: { fontSize: "9px" },
  miniValue: { fontSize: "13px", fontWeight: 900, overflowWrap: "anywhere" },
  detailSection: { border: "1px solid", borderRadius: "14px", padding: "13px", marginTop: "10px", minWidth: 0 },
  detailHeading: { margin: "0 0 10px", fontSize: "11px", fontWeight: 950 },
  detailList: { display: "grid", gap: "8px" },
  detailItem: { display: "flex", alignItems: "flex-start", gap: "10px", borderRadius: "10px", padding: "11px", minWidth: 0 },
  detailIndex: { display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "8px", fontSize: "10px", fontWeight: 950, flexShrink: 0 },
  detailLabel: { fontSize: "9px", fontWeight: 850, marginBottom: "5px" },
  detailText: { fontSize: "11px", lineHeight: 1.7, overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
  nestedFields: { display: "grid", gap: "9px" },
  nestedRow: { display: "grid", gridTemplateColumns: "minmax(90px, .7fr) minmax(0, 1.3fr)", gap: "10px", alignItems: "start" },
  nestedLabel: { fontSize: "9px", fontWeight: 800, lineHeight: 1.5 },
  nestedValue: { fontSize: "10px", lineHeight: 1.6, overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
  rawDetails: { marginTop: "13px", border: "1px solid", borderRadius: "12px", padding: "12px" },
  summaryToggle: { fontSize: "10px", fontWeight: 850, cursor: "pointer" },
  rawJson: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: "420px", overflow: "auto", border: "1px solid", padding: "12px", borderRadius: "10px", fontSize: "10px", lineHeight: 1.6, marginTop: "10px" },
  footer: { textAlign: "center", fontSize: "9px", lineHeight: 1.6, marginTop: "20px", padding: "0 10px" },
};

