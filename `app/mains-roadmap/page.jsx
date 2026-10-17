"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PAPERS = ["GS I", "GS II", "GS III", "GS IV"];
const TOPICS = {
  "GS I": [
    { name: "भारतीय समाज की विशेषताएँ", subject: "Indian Society", keywords: ["society", "caste", "women", "population", "communal", "secular", "social"] },
    { name: "विश्व इतिहास", subject: "World History", keywords: ["world history", "industrial revolution", "world war", "colonial"] },
    { name: "भारतीय कला एवं संस्कृति", subject: "Art and Culture", keywords: ["culture", "art", "architecture", "temple", "literature", "heritage"] },
    { name: "आधुनिक भारतीय इतिहास", subject: "Modern History", keywords: ["freedom", "national movement", "british", "independence", "modern history"] },
    { name: "भूगोल एवं संसाधन", subject: "Geography", keywords: ["geography", "monsoon", "river", "resource", "climate", "urbanization", "agriculture"] },
  ],
  "GS II": [
    { name: "भारतीय संविधान की आधारभूत विशेषताएँ", subject: "Constitution", keywords: ["constitution", "constitutional", "basic structure", "amendment", "preamble"] },
    { name: "संसद और संसदीय संप्रभुता", subject: "Parliament", keywords: ["parliament", "parliamentary", "speaker", "legislature", "bill", "privilege"] },
    { name: "राज्य विधानमंडल", subject: "State Legislature", keywords: ["state legislature", "legislative council", "governor", "state assembly"] },
    { name: "कार्यपालिका — राष्ट्रपति", subject: "President", keywords: ["president", "ordinance", "pardon", "executive"] },
    { name: "कार्यपालिका — प्रधानमंत्री और मंत्रिपरिषद", subject: "Prime Minister and Council of Ministers", keywords: ["prime minister", "council of ministers", "cabinet", "collective responsibility"] },
    { name: "न्यायपालिका एवं न्यायिक समीक्षा", subject: "Judiciary", keywords: ["judiciary", "judicial review", "supreme court", "high court", "judicial activism"] },
    { name: "संघवाद एवं केंद्र-राज्य संबंध", subject: "Federalism", keywords: ["federal", "centre-state", "inter-state", "governor", "fiscal federalism"] },
    { name: "संवैधानिक एवं वैधानिक निकाय", subject: "Constitutional Bodies", keywords: ["election commission", "cag", "upsc", "finance commission", "constitutional body"] },
    { name: "शासन, पारदर्शिता और जवाबदेही", subject: "Governance", keywords: ["governance", "transparency", "accountability", "citizen charter", "e-governance", "social audit"] },
    { name: "कल्याणकारी योजनाएँ एवं सामाजिक न्याय", subject: "Social Justice", keywords: ["welfare", "social justice", "health", "education", "scheme", "vulnerable"] },
    { name: "भारत की विदेश नीति", subject: "International Relations", keywords: ["international", "foreign policy", "india and", "bilateral", "multilateral", "neighbourhood"] },
  ],
  "GS III": [
    { name: "भारतीय अर्थव्यवस्था एवं समावेशी विकास", subject: "Economy", keywords: ["economy", "economic", "growth", "inflation", "fiscal", "inclusive", "gdp", "banking"] },
    { name: "कृषि एवं खाद्य सुरक्षा", subject: "Agriculture", keywords: ["agriculture", "farmer", "irrigation", "food security", "cropping", "minimum support price"] },
    { name: "विज्ञान एवं प्रौद्योगिकी", subject: "Science and Technology", keywords: ["science", "technology", "space", "biotechnology", "artificial intelligence", "nanotechnology"] },
    { name: "पर्यावरण एवं जैव विविधता", subject: "Environment", keywords: ["environment", "biodiversity", "pollution", "climate change", "conservation", "forest"] },
    { name: "आंतरिक सुरक्षा", subject: "Internal Security", keywords: ["internal security", "terrorism", "left wing extremism", "cyber", "border", "insurgency"] },
    { name: "आपदा प्रबंधन", subject: "Disaster Management", keywords: ["disaster", "flood", "earthquake", "cyclone", "risk reduction", "resilience"] },
    { name: "अवसंरचना एवं निवेश", subject: "Infrastructure", keywords: ["infrastructure", "investment", "transport", "energy", "logistics"] },
  ],
  "GS IV": [
    { name: "नैतिकता और मानवीय मूल्य", subject: "Ethics and Human Values", keywords: ["ethics", "values", "human values", "integrity", "honesty"] },
    { name: "अभिवृत्ति एवं भावनात्मक बुद्धिमत्ता", subject: "Attitude and Emotional Intelligence", keywords: ["attitude", "emotional intelligence", "empathy", "aptitude"] },
    { name: "लोक सेवा के मूल मूल्य", subject: "Public Service Values", keywords: ["public service", "impartiality", "objectivity", "non-partisanship", "compassion"] },
    { name: "शासन में नैतिकता एवं जवाबदेही", subject: "Ethics in Governance", keywords: ["governance", "corruption", "accountability", "transparency", "code of conduct"] },
    { name: "केस स्टडी", subject: "Case Studies", keywords: ["case study", "stakeholder", "ethical dilemma", "course of action"] },
  ],
};
const DAYS = ["Topic Preparation", "Revision & PYQ", "Answer Writing", "Evaluation & Next Steps"];
const TASKS = {
  0: ["Topic ka basic meaning aur syllabus demand samjhein", "Key dimensions aur subtopics ke notes banayein", "Mind map / flowchart taiyar karein", "Examples, committee/reports aur relevant schemes jodein", "Topic ko related syllabus areas se link karein", "Short revision notes complete karein"],
  1: ["Quick notes revise karein", "Mapped actual PYQs solve karein", "Har PYQ ki directive aur demand identify karein", "Question ke dimensions aur examples note karein"],
  2: ["10-marker: lagbhag 150 words mein answer likhein", "15-marker: lagbhag 250 words mein answer likhein", "Introduction-body-conclusion structure check karein"],
  3: ["Existing AI Evaluation / answer feedback complete karein", "Feedback ke mutabik answer improve karein", "Weak points ko mistake notebook mein add karein", "Spaced revision date confirm karein"],
};

function normalize(v) { return String(v ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function questionText(q) { return `${q.question || ""} ${q.topic || ""} ${q.subject || ""} ${q.paper || ""}`; }
function matchTopic(q, topic) {
  const text = normalize(questionText(q));
  return topic.keywords.some((kw) => text.includes(normalize(kw))) || normalize(q.topic) === normalize(topic.name) || normalize(q.topic) === normalize(topic.subject);
}
function dateKey() { return new Date().toISOString().slice(0, 10); }

export default function MainsRoadmapPage() {
  const router = useRouter();
  const [paper, setPaper] = useState("GS II");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [day, setDay] = useState(0);
  const [completed, setCompleted] = useState({});
  const [planDays, setPlanDays] = useState(180);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sambhav-mains-roadmap-v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.completed && typeof parsed.completed === "object") setCompleted(parsed.completed);
        if (PAPERS.includes(parsed.paper)) setPaper(parsed.paper);
        if (Number.isFinite(parsed.planDays)) setPlanDays(parsed.planDays);
        if (parsed.activeTopic) setActiveTopic(parsed.activeTopic);
        if (Number.isInteger(parsed.day) && parsed.day >= 0 && parsed.day < 4) setDay(parsed.day);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("sambhav-mains-roadmap-v1", JSON.stringify({ completed, paper, planDays, activeTopic, day })); } catch {}
  }, [completed, paper, planDays, activeTopic, day]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const [authRes, mainsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include", cache: "no-store" }),
          fetch("/api/pyq/mains", { credentials: "include", cache: "no-store" }),
        ]);
        const [auth, data] = await Promise.all([authRes.json().catch(() => ({})), mainsRes.json().catch(() => ({}))]);
        if (!authRes.ok || !auth?.user) { router.replace("/login"); return; }
        if (!mainsRes.ok) throw new Error(data?.error || "Mains PYQs load nahi hue.");
        const rows = Array.isArray(data?.pyqs) ? data.pyqs.map((q, i) => ({ ...q, id: String(q.id ?? `${q.year ?? "x"}-${i}`), question: q.question || "" })) : [];
        if (!cancelled) setQuestions(rows);
      } catch (e) { if (!cancelled) setError(e?.message || "Roadmap load nahi hua."); }
      finally { if (!cancelled) setLoading(false); }
    }
    load(); return () => { cancelled = true; };
  }, [router]);

  const topics = TOPICS[paper] || [];
  const topicStats = useMemo(() => topics.map((topic) => {
    const mapped = questions.filter((q) => matchTopic(q, topic));
    const years = [...new Set(mapped.map((q) => Number(q.year)).filter(Number.isFinite))].sort((a, b) => b - a);
    // Heuristic based only on matched loaded questions. It is not an official UPSC prediction.
    const priority = mapped.length >= 6 ? "P1" : mapped.length >= 3 ? "P2" : "P3";
    const key = `${paper}:${topic.subject}`;
    const done = (TASKS[0] || []).filter((_, i) => completed[`${key}:0:${i}`]).length;
    return { ...topic, key, mapped, years, priority, done, total: TASKS[0].length };
  }), [topics, questions, paper, completed]);
  const visibleTopics = topicStats.filter((t) => !search || normalize(`${t.name} ${t.subject} ${t.mapped.map(questionText).join(" ")}`).includes(normalize(search)));
  const current = topicStats.find((t) => t.subject === activeTopic) || topicStats[0];
  const currentKey = current ? `${paper}:${current.subject}` : "";
  const allTopicCount = topicStats.length;
  const p1Count = topicStats.filter((t) => t.priority === "P1").length;
  const p2Count = topicStats.filter((t) => t.priority === "P2").length;
  const p3Count = topicStats.filter((t) => t.priority === "P3").length;
  const allTasks = topicStats.reduce((n, t) => n + TASKS[0].length, 0);
  const doneTasks = topicStats.reduce((n, t) => n + TASKS[0].filter((_, i) => completed[`${t.key}:0:${i}`]).length, 0);
  const topicTasks = TASKS[day] || TASKS[0];
  const topicDone = topicTasks.filter((_, i) => completed[`${currentKey}:${day}:${i}`]).length;

  function toggleTask(i) {
    if (!current) return;
    const k = `${currentKey}:${day}:${i}`;
    setCompleted((prev) => ({ ...prev, [k]: !prev[k] }));
  }
  function chooseTopic(topic) { setActiveTopic(topic.subject); setDay(0); setNotice(""); }

  const styles = {
    page: { minHeight: "100vh", background: "#f4f6f8", color: "#17202b", fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif", padding: "16px 12px 48px" },
    shell: { maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(280px, .9fr)", gap: 16 },
    card: { background: "#fff", border: "1px solid #e4e8ed", borderRadius: 16, padding: 18, boxShadow: "0 2px 8px rgba(20,30,50,.025)" },
    btn: { border: "1px solid #d8dfe7", borderRadius: 10, padding: "9px 12px", background: "#fff", color: "#1b2734", cursor: "pointer", fontWeight: 750 },
    primary: { border: "1px solid #2854e8", borderRadius: 10, padding: "11px 14px", background: "#3158ed", color: "white", cursor: "pointer", fontWeight: 800 },
  };

  if (loading) return <main style={styles.page}>Mains Roadmap load ho raha hai…</main>;
  if (error) return <main style={styles.page}><section style={{ ...styles.card, maxWidth: 720, margin: "30px auto" }}><h1>Mains Roadmap</h1><p>{error}</p><button style={styles.btn} onClick={() => router.push("/mission-pyq")}>Mission PYQ kholen</button></section></main>;

  return <main style={styles.page}>
    <style jsx global>{`*{box-sizing:border-box}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #3158ed;outline-offset:2px}@media(max-width:850px){.roadmap-shell{grid-template-columns:1fr!important}.roadmap-side{order:-1}.roadmap-topics{grid-template-columns:1fr!important}.roadmap-header{align-items:flex-start!important;flex-direction:column!important}}`}</style>
    <header className="roadmap-header" style={{ maxWidth: 1280, margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
      <div><button style={styles.btn} onClick={() => router.push("/premium/home")}>← Dashboard</button><div style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>Mains Roadmap　›　{paper}　›　{current?.subject || "Topics"}</div><h1 style={{ margin: "8px 0 4px", fontSize: "clamp(25px,4vw,34px)" }}>Mains Roadmap — {paper}</h1><p style={{ margin: 0, color: "#64748b" }}>Priority-wise, adaptive and PYQ-focused preparation</p></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input aria-label="Search topics and PYQs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics, PYQs…" style={{ minWidth: 180, padding: 11, border: "1px solid #d8dfe7", borderRadius: 10, background: "white" }} /><button style={styles.btn} onClick={() => setNotice("Roadmap flow: Topic Preparation → Revision & PYQ → Answer Writing → Evaluation & Next Steps.")}>ⓘ How it works?</button></div>
    </header>
    <div className="roadmap-shell" style={styles.shell}>
      <section style={{ display: "grid", gap: 14, alignContent: "start" }}>
        <section style={styles.card}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{PAPERS.map((p) => <button key={p} style={{ ...styles.btn, background: p === paper ? "#3158ed" : "white", color: p === paper ? "white" : "#1b2734", borderColor: p === paper ? "#3158ed" : "#d8dfe7" }} onClick={() => { setPaper(p); setActiveTopic(""); setDay(0); }}>{p}</button>)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
            {[{ p: "P1", label: "Highly Repeated", n: p1Count, color: "#07824e", bg: "#e4f7ed" }, { p: "P2", label: "Repeated", n: p2Count, color: "#9a6500", bg: "#fff1cf" }, { p: "P3", label: "Remaining", n: p3Count, color: "#475569", bg: "#edf1f5" }].map((x) => <div key={x.p} style={{ border: "1px solid #e4e8ed", borderRadius: 12, padding: 12, background: x.bg }}><div style={{ fontSize: 22, fontWeight: 900, color: x.color }}>{x.p}</div><strong style={{ fontSize: 12 }}>{x.label}</strong><div style={{ color: "#64748b", fontSize: 11, marginTop: 5 }}>{x.n}/{allTopicCount} topics</div></div>)}
          </div>
          <p style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5, marginBottom: 0 }}>Priority is an estimate from the number of loaded PYQs matched to each topic. It is not an official UPSC prediction. Review topic mappings before treating counts as exact.</p>
        </section>
        {current && <section style={{ ...styles.card, background: "#effaf4", borderColor: "#d3efdf" }}><div style={{ display: "flex", gap: 14, alignItems: "center" }}><div style={{ borderRadius: 10, background: current.priority === "P1" ? "#07824e" : current.priority === "P2" ? "#dba72b" : "#64748b", color: "white", padding: "12px 15px", fontSize: 19, fontWeight: 900 }}>{current.priority}</div><div style={{ flex: 1 }}><div style={{ color: "#438260", fontSize: 12 }}>Current Topic</div><h2 style={{ margin: "4px 0", fontSize: 23 }}>{current.name}</h2><div style={{ color: "#64748b", fontSize: 12 }}>{paper}　›　{current.subject}</div></div><div style={{ minWidth: 105, fontSize: 11, color: "#64748b" }}><strong style={{ color: "#17202b" }}>Topic Progress</strong><div style={{ height: 8, background: "#d9e3e8", borderRadius: 8, marginTop: 7, overflow: "hidden" }}><div style={{ width: `${Math.round(topicDone / Math.max(topicTasks.length, 1) * 100)}%`, height: "100%", background: "#07824e" }} /></div>{topicDone}/{topicTasks.length} tasks</div></div></section>}
        {current && <section style={styles.card}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 7 }}>{DAYS.map((d, i) => <button key={d} onClick={() => setDay(i)} style={{ ...styles.btn, background: day === i ? "#e7efff" : "#f7f9fb", borderColor: day === i ? "#3158ed" : "#e4e8ed", textAlign: "left", padding: 10 }}><span style={{ display: "block", fontWeight: 900, color: day === i ? "#3158ed" : "#64748b" }}>{i + 1}</span><span style={{ display: "block", fontSize: 11, marginTop: 4 }}>{d}</span><span style={{ display: "block", color: "#64748b", fontSize: 10 }}>{i === 0 ? "Today" : `Day ${i + 1}`}</span></button>)}</div>
          <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}><div><h2 style={{ margin: 0 }}>Day {day + 1} — {DAYS[day]}</h2><p style={{ color: "#64748b", fontSize: 12, marginBottom: 0 }}>Topic ke tasks complete karein; progress isi browser mein save hoti hai.</p></div><strong style={{ fontSize: 12, color: "#64748b" }}>{topicDone}/{topicTasks.length} complete</strong></div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {day === 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}><div style={{ border: "1px solid #e4e8ed", borderRadius: 12, padding: 14, background: "#fffbeb" }}><strong>Study Resources</strong><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{["Quick Notes", "Key Dimensions", "Mind Map", "Sources"].map((x) => <span key={x} style={{ background: "#e7efff", color: "#3158ed", borderRadius: 7, padding: "6px 8px", fontSize: 11 }}>{x}</span>)}</div><h3 style={{ fontSize: 15 }}>{current.name} — Quick Notes</h3><p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>Is topic ke liye syllabus demand, core concepts, dimensions, examples aur way forward par apne notes banayein. Yahan generic placeholder ko actual source-based notes samajhkar use na karein.</p></div><div style={{ border: "1px solid #e4e8ed", borderRadius: 12, padding: 14 }}><strong>Preparation Checklist</strong>{TASKS[0].map((t, i) => <label key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 13, fontSize: 12, lineHeight: 1.45 }}><input type="checkbox" checked={!!completed[`${currentKey}:0:${i}`]} onChange={() => toggleTask(i)} />{t}</label>)}</div></div>}
            {day !== 0 && topicTasks.map((t, i) => <label key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid #e4e8ed", borderRadius: 10, padding: 12, fontSize: 13 }}><input type="checkbox" checked={!!completed[`${currentKey}:${day}:${i}`]} onChange={() => toggleTask(i)} />{t}</label>)}
          </div>
          {day === 1 && <div style={{ marginTop: 16 }}><h3>Mapped PYQs for this topic ({current.mapped.length})</h3>{current.mapped.slice(0, 20).map((q) => <button key={q.id} onClick={() => router.push("/mission-pyq")} style={{ ...styles.btn, display: "block", textAlign: "left", width: "100%", marginTop: 8, lineHeight: 1.5 }}><strong>UPSC Mains {q.year || "Year N/A"}</strong><div style={{ fontSize: 12, fontWeight: 500 }}>{q.question}</div><small style={{ color: "#64748b" }}>{q.paper || paper} • {q.marks ? `${q.marks} Marks` : "Marks not listed"}　→ Open Mission PYQ</small></button>)}{current.mapped.length === 0 && <p style={{ color: "#64748b", fontSize: 12 }}>Current keyword mapping se koi PYQ match nahi hua. Topic tags/keywords ko actual dataset ke saath refine karna hoga.</p>}</div>}
          {day === 2 && <div style={{ marginTop: 14, padding: 14, background: "#f7f9fb", borderRadius: 12 }}><strong>Answer Writing</strong><p style={{ color: "#64748b", fontSize: 12 }}>Existing answer-writing/evaluation workflow ko use karein. Is page par AI evaluation API ko duplicate ya replace nahi kiya gaya.</p><button style={styles.primary} onClick={() => router.push("/answer")}>Open Answer Writing →</button></div>}
          {day === 3 && <div style={{ marginTop: 14, padding: 14, background: "#f7f9fb", borderRadius: 12 }}><strong>Evaluation & Next Steps</strong><p style={{ color: "#64748b", fontSize: 12 }}>AI Evaluation page kholkar feedback review karein. Is roadmap ki checklist browser-local hai; backend progress ya official schedule ka claim nahi hai.</p><button style={styles.primary} onClick={() => router.push("/ai-evaluation")}>Open AI Evaluation →</button></div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}><button style={styles.primary} onClick={() => { if (day < 3) setDay(day + 1); else { const idx = topicStats.findIndex((t) => t.subject === current.subject); const next = topicStats[idx + 1]; if (next) { setActiveTopic(next.subject); setDay(0); } else setNotice("Is paper ke listed topics complete/last topic tak pahunch gaye."); } }}> {day < 3 ? "Continue to next step →" : "Next topic →"}</button><button style={styles.btn} onClick={() => { setCompleted((prev) => { const next = { ...prev }; Object.keys(next).forEach((k) => { if (k.startsWith(`${currentKey}:`)) delete next[k]; }); return next; }) }}>Reset this topic checklist</button></div>
        </section>}
        {notice && <div role="status" style={{ ...styles.card, background: "#fff8e7", fontSize: 12 }}>{notice}</div>}
      </section>
      <aside className="roadmap-side" style={{ display: "grid", gap: 14, alignContent: "start" }}>
        <section style={styles.card}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><h3 style={{ margin: 0 }}>Your Roadmap</h3><select value={planDays} onChange={(e) => setPlanDays(Number(e.target.value))} aria-label="Plan duration" style={{ border: "1px solid #d8dfe7", borderRadius: 8, padding: 6, background: "white" }}><option value={90}>90-day plan</option><option value={180}>180-day plan</option><option value={365}>365-day plan</option></select></div><div style={{ color: "#64748b", fontSize: 11, margin: "8px 0 12px" }}>Day 1 of {planDays} • Plan duration preference</div><div style={{ display: "grid", gap: 6 }}>{visibleTopics.map((t, i) => <button key={t.subject} onClick={() => chooseTopic(t)} style={{ ...styles.btn, display: "flex", gap: 9, textAlign: "left", alignItems: "flex-start", background: current?.subject === t.subject ? "#eaf0ff" : "white", borderColor: current?.subject === t.subject ? "#b9c9ff" : "#e4e8ed" }}><span style={{ color: t.priority === "P1" ? "#07824e" : t.priority === "P2" ? "#a36b00" : "#64748b", fontWeight: 900 }}>{i + 1}.</span><span style={{ flex: 1, fontSize: 12 }}>{t.name}<small style={{ display: "block", marginTop: 4, color: "#64748b" }}>{t.priority} • {t.mapped.length} mapped PYQs</small></span><span>{current?.subject === t.subject ? "●" : "○"}</span></button>)}</div><p style={{ color: "#64748b", fontSize: 10, lineHeight: 1.5 }}>Topic order is a starter roadmap, not a personalized prediction. Change or reorder topics based on your syllabus coverage.</p></section>
        {current && <section style={{ ...styles.card, background: "#fff9e8", borderColor: "#f4e7bd" }}><h3 style={{ marginTop: 0 }}>Why this topic now?</h3><ul style={{ paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}><li>{current.mapped.length} loaded PYQs matched by topic keywords</li><li>{current.priority === "P1" ? "High recurrence within the current mapped dataset (P1 heuristic)" : current.priority === "P2" ? "Moderate recurrence within the current mapped dataset (P2 heuristic)" : "Remaining topic / limited keyword matches (P3 heuristic)"}</li><li>Core {paper} syllabus area</li><li>Topic linkage can be expanded after checking actual PYQ metadata</li></ul></section>}
        {current && <section style={styles.card}><h3 style={{ marginTop: 0 }}>Mapped PYQs for this topic</h3><p style={{ color: "#64748b", fontSize: 12 }}>{current.mapped.length} question(s) matched</p>{current.mapped.slice(0, 3).map((q) => <div key={q.id} style={{ border: "1px solid #e4e8ed", borderRadius: 10, padding: 10, marginTop: 8 }}><strong style={{ fontSize: 11 }}>UPSC Mains {q.year || "Year N/A"}</strong><p style={{ fontSize: 12, lineHeight: 1.5, margin: "6px 0" }}>{q.question}</p><button style={{ ...styles.btn, width: "100%" }} onClick={() => router.push("/mission-pyq")}>View in Mission PYQ →</button></div>)}{current.mapped.length > 3 && <button style={{ ...styles.btn, width: "100%", marginTop: 8 }} onClick={() => { setDay(1); setNotice("Revision & PYQ step mein mapped questions ki list khol di hai."); }}>View all related PYQs ({current.mapped.length}) →</button>}</section>}
        <section style={styles.card}><h3 style={{ marginTop: 0 }}>Next Schedule</h3>{[{ d: "Day 2", text: "Revision + PYQ solve", when: "Next" }, { d: "Day 3", text: "Answer upload / writing", when: "After revision" }, { d: "Day 4", text: "Evaluation & feedback", when: "After submission" }, { d: "Spaced", text: "Topic revision", when: "In 5 days" }].map((x) => <div key={x.text} style={{ display: "flex", justifyContent: "space-between", gap: 8, borderBottom: "1px solid #edf0f3", padding: "10px 0", fontSize: 11 }}><span><strong>{x.d}</strong>　{x.text}</span><span style={{ color: "#64748b", textAlign: "right" }}>{x.when}</span></div>)}<p style={{ color: "#64748b", fontSize: 10, lineHeight: 1.5 }}>Schedule labels are guidance only in this version; no reminders are sent automatically.</p></section>
        <section style={styles.card}><h3 style={{ marginTop: 0 }}>Overall Progress</h3><div style={{ height: 9, background: "#e8edf2", borderRadius: 9, overflow: "hidden" }}><div style={{ width: `${allTasks ? doneTasks / allTasks * 100 : 0}%`, height: "100%", background: "#07824e" }} /></div><p style={{ color: "#64748b", fontSize: 12 }}>{doneTasks}/{allTasks} topic-preparation checklist tasks complete</p><button style={{ ...styles.btn, width: "100%" }} onClick={() => router.push("/mission-pyq")}>Open Mission PYQ →</button></section>
      </aside>
    </div>
  </main>;
}
