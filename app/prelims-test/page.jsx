// app/prelims-test/page.jsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TEST_OPTIONS = [20, 30, 50, 75, 100];
const MARKS_PER_QUESTION = 2;
const NEGATIVE_MARKS = 2 / 3;
const FULL_TEST_SECONDS = 2 * 60 * 60;
const ACTIVE_KEY = "sambhav-prelims-active-v3";
const HISTORY_KEY = "sambhav-prelims-history";
const DAILY_KEY = "sambhav-prelims-daily-v3";

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLabel(type) {
  return {
    full: "Full UPSC Simulator",
    original: "Original Paper",
    custom: "Custom Test",
    daily: "Daily 20 PYQ",
  }[type] || "Prelims Test";
}

function normalizeAnswer(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (value >= 1 && value <= 4 && Number.isInteger(value)) return value - 1;
    return value;
  }
  const text = String(value).trim().toUpperCase();
  const letters = { A: 0, B: 1, C: 2, D: 3 };
  if (Object.prototype.hasOwnProperty.call(letters, text)) return letters[text];
  const numeric = Number(text);
  if (!Number.isNaN(numeric)) return numeric >= 1 && numeric <= 4 ? numeric - 1 : numeric;
  return null;
}

function normalizeOptions(q) {
  if (Array.isArray(q?.options)) return q.options.filter(Boolean).map(String).slice(0, 4);
  if (typeof q?.options === "string") {
    try {
      const parsed = JSON.parse(q.options);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String).slice(0, 4);
    } catch {}
  }
  return [q?.option_a, q?.option_b, q?.option_c, q?.option_d]
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(String)
    .slice(0, 4);
}

export default function PrelimsTestPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("home");

  const [mode, setMode] = useState("full");
  const [year, setYear] = useState("all");
  const [subject, setSubject] = useState("all");
  const [topic, setTopic] = useState("all");
  const [questionCount, setQuestionCount] = useState(100);

  const [testQuestions, setTestQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({});
  const [remaining, setRemaining] = useState(FULL_TEST_SECONDS);
  const [startedAt, setStartedAt] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyAttempt, setHistoryAttempt] = useState(null);

  const [language, setLanguage] = useState("en");
  const [translation, setTranslation] = useState(null);
  const [translationQuestionId, setTranslationQuestionId] = useState(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");

  const [theme, setTheme] = useState("light");
  const [isMobile, setIsMobile] = useState(false);
  const submittingRef = useRef(false);
  const answersRef = useRef({});
  const remainingRef = useRef(FULL_TEST_SECONDS);
  const testQuestionsRef = useRef([]);
  const screenRef = useRef("home");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sambhavTheme = theme;
    try { localStorage.setItem("sambhav-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 900);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { testQuestionsRef.current = testQuestions; }, [testQuestions]);

  const colors = theme === "dark"
    ? {
        page: "#0a0a0a", surface: "#141414", surface2: "#1b1b1b", surface3: "#222",
        text: "#f7f4ec", muted: "#a7a39b", border: "#303030", gold: "#d7bd77", goldText: "#16120b",
        green: "#8ed09f", red: "#ef9a9a", blue: "#9ebdff", shadow: "0 18px 50px rgba(0,0,0,.28)",
      }
    : {
        page: "#f5f2eb", surface: "#fffdf9", surface2: "#f8f4eb", surface3: "#eee9de",
        text: "#111111", muted: "#706d66", border: "#ded9ce", gold: "#caa95b", goldText: "#151109",
        green: "#24733e", red: "#b23a3a", blue: "#315caa", shadow: "0 12px 35px rgba(35,30,20,.07)",
      };

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const auth = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const authData = await auth.json().catch(() => ({}));
        if (!auth.ok || !authData?.user) { router.replace("/login"); return; }
        if (!alive) return;
        setUser(authData.user);

        const response = await fetch("/api/pyq/prelims", { credentials: "include", cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Unable to load Prelims PYQs.");
        const rows = Array.isArray(data?.pyqs) ? data.pyqs : Array.isArray(data?.questions) ? data.questions : [];
        const mapped = rows.map((q, index) => ({
          ...q,
          id: q?.id ?? `prelims-${q?.year ?? "x"}-${index + 1}`,
          year: Number(q?.year) || q?.year || "",
          subject: q?.subject || "General Studies",
          topic: q?.topic || "General",
          question: q?.question || "",
          options: normalizeOptions(q),
          answer: normalizeAnswer(q?.correct_option ?? q?.answer),
          explanation_en: q?.explanation_en || q?.explanation || "",
          explanation_hi: q?.explanation_hi || "",
        })).filter((q) => q.question && q.options.length >= 2 && q.answer !== null);
        if (alive) setQuestions(mapped);
      } catch (e) {
        if (alive) setError(e?.message || "Unable to load Prelims questions.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(Array.isArray(saved) ? saved : []);
    } catch { setHistory([]); }
  }, []);

  const years = useMemo(() => {
    const set = new Set(questions.map((q) => String(q.year)).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [questions]);

  const subjects = useMemo(() => {
    const set = new Set(questions.map((q) => String(q.subject)).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [questions]);

  const topics = useMemo(() => {
    const base = questions.filter((q) => subject === "all" || String(q.subject) === subject);
    const set = new Set(base.map((q) => String(q.topic)).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [questions, subject]);

  const customPool = useMemo(() => questions.filter((q) =>
    (year === "all" || String(q.year) === year) &&
    (subject === "all" || String(q.subject) === subject) &&
    (topic === "all" || String(q.topic) === topic)
  ), [questions, year, subject, topic]);

  const currentQuestion = testQuestions[current];
  const answeredCount = useMemo(() => Object.values(answers).filter((v) => v !== null && v !== undefined).length, [answers]);
  const markedCount = useMemo(() => Object.values(marked).filter(Boolean).length, [marked]);

  const result = useMemo(() => {
    let correct = 0; let wrong = 0;
    testQuestions.forEach((q) => {
      const chosen = answers[q.id];
      if (chosen === undefined || chosen === null) return;
      if (Number(chosen) === Number(q.answer)) correct += 1; else wrong += 1;
    });
    const unanswered = testQuestions.length - correct - wrong;
    const positive = correct * MARKS_PER_QUESTION;
    const negative = wrong * NEGATIVE_MARKS;
    const score = positive - negative;
    const attempted = correct + wrong;
    return { correct, wrong, unanswered, positive, negative, score, accuracy: attempted ? (correct / attempted) * 100 : 0 };
  }, [testQuestions, answers]);

  const clearActiveAttempt = useCallback(() => {
    try { localStorage.removeItem(ACTIVE_KEY); } catch {}
  }, []);

  const persistAttempt = useCallback((override = {}) => {
    if (screenRef.current !== "test") return;
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify({
        mode, year, subject, topic, questionCount, language,
        testQuestions: testQuestionsRef.current,
        current,
        answers: answersRef.current,
        marked,
        visited,
        remaining: remainingRef.current,
        startedAt,
        savedAt: Date.now(),
        ...override,
      }));
    } catch {}
  }, [mode, year, subject, topic, questionCount, language, current, marked, visited, startedAt]);

  useEffect(() => {
    if (screen !== "test") return;
    persistAttempt();
  }, [screen, current, answers, marked, visited, remaining, language, persistAttempt]);

  useEffect(() => {
    if (screen !== "test") return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen === "test" && remaining <= 0) submitTest(true);
  }, [remaining, screen]);

  useEffect(() => {
    if (loading) return;
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved?.testQuestions) || !saved.testQuestions.length) return;
      if (saved.remaining <= 0) { localStorage.removeItem(ACTIVE_KEY); return; }
      const restore = window.confirm("A previous unfinished Prelims test was found. Resume it?");
      if (!restore) { localStorage.removeItem(ACTIVE_KEY); return; }
      setMode(saved.mode || "full"); setYear(saved.year || "all"); setSubject(saved.subject || "all"); setTopic(saved.topic || "all");
      setQuestionCount(Number(saved.questionCount) || 100); setLanguage(saved.language || "en");
      setTestQuestions(saved.testQuestions); setCurrent(Math.min(Number(saved.current) || 0, saved.testQuestions.length - 1));
      setAnswers(saved.answers || {}); setMarked(saved.marked || {}); setVisited(saved.visited || {});
      setRemaining(Number(saved.remaining) || FULL_TEST_SECONDS); setStartedAt(saved.startedAt || Date.now()); setScreen("test");
    } catch { try { localStorage.removeItem(ACTIVE_KEY); } catch {} }
  }, [loading]);

  function startTest() {
    setError("");
    let eligible = [];
    let selectedMode = mode;

    if (mode === "original") {
      if (year === "all") { setError("Original Paper ke liye pehle year select karein."); return; }
      eligible = questions.filter((q) => String(q.year) === String(year));
      if (eligible.length < 100) {
        setError(`${year} Original Paper ke liye ${eligible.length} questions available hain; complete 100-question paper available nahi hai.`);
        return;
      }
      eligible = [...eligible].sort((a, b) => Number(a.id) - Number(b.id));
    } else if (mode === "daily") {
      const key = todayKey();
      const seedPool = [...questions].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const offset = Array.from(key).reduce((sum, c) => sum + c.charCodeAt(0), 0) % Math.max(seedPool.length, 1);
      eligible = seedPool.length ? [...seedPool.slice(offset), ...seedPool.slice(0, offset)] : [];
      selectedMode = "daily";
    } else if (mode === "custom") {
      eligible = customPool;
    } else {
      eligible = questions;
    }

    if (!eligible.length) { setError("Selected mode ke liye questions available nahi hain."); return; }
    const count = mode === "full" ? 100 : mode === "original" ? 100 : mode === "daily" ? Math.min(20, eligible.length) : Math.min(Number(questionCount), eligible.length);
    if (eligible.length < count) { setError(`${count} questions available nahi hain. Available: ${eligible.length}.`); return; }

    const selected = mode === "original" ? eligible.slice(0, 100) : mode === "daily" ? eligible.slice(0, 20) : shuffle(eligible).slice(0, count);
    const firstId = selected[0]?.id;
    setTestQuestions(selected); setCurrent(0); setAnswers({}); setMarked({}); setVisited(firstId ? { [firstId]: true } : {});
    setRemaining(FULL_TEST_SECONDS); remainingRef.current = FULL_TEST_SECONDS;
    setStartedAt(Date.now()); setAutoSubmitted(false); setLanguage("en"); setTranslation(null); setTranslationQuestionId(null); setTranslationError("");
    submittingRef.current = false; clearActiveAttempt(); setScreen("test");
    try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayKey(), attempted: mode === "daily" ? false : undefined })); } catch {}
  }

  function submitTest(forced = false) {
    if (submittingRef.current || screenRef.current !== "test") return;
    submittingRef.current = true;
    const qs = testQuestionsRef.current;
    const currentAnswers = answersRef.current;
    let correct = 0; let wrong = 0;
    qs.forEach((q) => {
      const chosen = currentAnswers[q.id];
      if (chosen === undefined || chosen === null) return;
      if (Number(chosen) === Number(q.answer)) correct += 1; else wrong += 1;
    });
    const unanswered = qs.length - correct - wrong;
    const score = correct * MARKS_PER_QUESTION - wrong * NEGATIVE_MARKS;
    const accuracy = correct + wrong ? (correct / (correct + wrong)) * 100 : 0;
    const entry = {
      id: Date.now(), date: new Date().toISOString(), type: mode, year, subject, topic,
      total: qs.length, correct, wrong, unanswered, score: Number(score.toFixed(2)), accuracy: Number(accuracy.toFixed(1)),
      timeUsed: FULL_TEST_SECONDS - remainingRef.current, questionIds: qs.map((q) => q.id), answers: currentAnswers,
    };
    try {
      const old = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const next = [entry, ...(Array.isArray(old) ? old : [])].slice(0, 25);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setHistory(next);
      if (mode === "daily") localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayKey(), attempted: true, result: entry }));
    } catch {}
    clearActiveAttempt(); setAutoSubmitted(Boolean(forced)); setScreen("result"); screenRef.current = "result";
  }

  function chooseAnswer(index) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }));
  }

  function goToQuestion(index) {
    if (index < 0 || index >= testQuestions.length) return;
    const q = testQuestions[index]; setCurrent(index);
    if (q?.id !== undefined) setVisited((prev) => ({ ...prev, [q.id]: true }));
    setTranslation(null); setTranslationQuestionId(null); setTranslationError("");
  }

  function clearResponse() {
    if (!currentQuestion) return;
    setAnswers((prev) => { const next = { ...prev }; delete next[currentQuestion.id]; return next; });
  }

  function toggleMark() {
    if (!currentQuestion) return;
    setMarked((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  }

  function leaveTest() {
    if (window.confirm("Test abhi complete nahi hua. Test chhodna hai? Progress auto-saved rahega.")) setScreen("home");
  }

  function resetToHome() {
    clearActiveAttempt(); submittingRef.current = false; setTestQuestions([]); setAnswers({}); setMarked({}); setVisited({}); setCurrent(0); setRemaining(FULL_TEST_SECONDS); setStartedAt(null); setScreen("home");
  }

  async function translateCurrentQuestion() {
    const q = currentQuestion;
    if (!q) return;
    setTranslationError("");
    if (translationQuestionId === q.id && translation) { setLanguage("hi"); return; }
    const cacheKey = `sambhav_translation_v3_${q.id}`;
    try {
      setTranslationLoading(true);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.question_hi && Array.isArray(parsed?.options_hi)) { setTranslation(parsed); setTranslationQuestionId(q.id); setLanguage("hi"); return; }
      }
      const response = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ question: q.question || "", options: q.options || [], explanation: q.explanation_en || "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !data?.translation) throw new Error(data?.error || "Translation failed.");
      setTranslation(data.translation); setTranslationQuestionId(q.id); setLanguage("hi");
      try { localStorage.setItem(cacheKey, JSON.stringify(data.translation)); } catch {}
    } catch (e) { setTranslationError(e?.message || "Translation failed."); }
    finally { setTranslationLoading(false); }
  }

  function questionText(q) {
    if (language === "hi" && translationQuestionId === q?.id && translation?.question_hi) return translation.question_hi;
    return q?.question || "";
  }

  function optionText(q, index) {
    if (language === "hi" && translationQuestionId === q?.id && translation?.options_hi?.[index]) return translation.options_hi[index];
    return q?.options?.[index] || "";
  }

  function openHistory(item) {
    if (!Array.isArray(item?.questionIds) || !item.questionIds.length) return;
    const map = new Map(questions.map((q) => [String(q.id), q]));
    const qs = item.questionIds.map((id) => map.get(String(id))).filter(Boolean);
    if (!qs.length) { setError("Is old test ke questions current PYQ data mein available nahi hain."); return; }
    setHistoryAttempt(item); setTestQuestions(qs); setAnswers(item.answers || {}); setCurrent(0); setScreen("historyReview");
  }

  if (loading) return <Loading colors={colors} />;
  if (error && !questions.length) return <ErrorScreen colors={colors} error={error} onRetry={() => window.location.reload()} />;

  if (screen === "test" && currentQuestion) return (
    <main style={page(colors)}>
      <div style={testHeader(colors, isMobile)}>
        <button style={ghostButton(colors)} onClick={leaveTest}>← Test Center</button>
        <div style={{ textAlign: "center", minWidth: 0 }}>
          <div style={eyebrow(colors)}>{getLabel(mode)}</div>
          <strong style={{ fontSize: 14 }}>Question {current + 1} / {testQuestions.length}</strong>
        </div>
        <div style={{ ...timer(colors), color: remaining <= 300 ? colors.red : colors.text }}>{formatTime(remaining)}</div>
      </div>

      <div style={testLayout(isMobile)}>
        <section style={card(colors)}>
          <div style={meta(colors)}>
            <span>{currentQuestion.year || "PYQ"}</span><span>{currentQuestion.subject}</span><span>+2 / −0.66</span>
          </div>
          <div style={qBadge(colors)}>Q{current + 1}</div>
          <h1 style={question(colors)}>{questionText(currentQuestion)}</h1>
          <div style={langBar}>
            <button style={language === "en" ? activeSmall(colors) : smallButton(colors)} onClick={() => { setLanguage("en"); setTranslationError(""); }}>English</button>
            <button style={language === "hi" ? activeSmall(colors) : smallButton(colors)} onClick={translateCurrentQuestion} disabled={translationLoading}>{translationLoading ? "Translating…" : "हिंदी"}</button>
            {translationError && <span style={{ color: colors.red, fontSize: 12 }}>{translationError}</span>}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {currentQuestion.options.map((_, index) => {
              const selected = Number(answers[currentQuestion.id]) === index;
              return <button key={index} onClick={() => chooseAnswer(index)} style={{ ...option(colors), ...(selected ? { borderColor: colors.gold, background: colors.gold, color: colors.goldText } : {}) }}>
                <span style={{ ...letter(colors), ...(selected ? { background: "#111", color: "#fff" } : {}) }}>{String.fromCharCode(65 + index)}</span>
                <span style={{ textAlign: "left", flex: 1 }}>{optionText(currentQuestion, index)}</span>
              </button>;
            })}
          </div>

          <div style={actionRow}>
            <button style={secondary(colors)} onClick={clearResponse}>Clear Response</button>
            <button style={secondary(colors)} onClick={toggleMark}>{marked[currentQuestion.id] ? "★ Marked" : "☆ Mark for Review"}</button>
            <span style={{ flex: 1 }} />
            <button style={secondary(colors)} disabled={current === 0} onClick={() => goToQuestion(current - 1)}>Previous</button>
            {current === testQuestions.length - 1 ? <button style={primary(colors)} onClick={() => window.confirm("Test submit karein? Aapke answers final ho jayenge.") && submitTest(false)}>Submit Test</button> : <button style={primary(colors)} onClick={() => goToQuestion(current + 1)}>Next</button>}
          </div>
        </section>

        <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <div style={card(colors)}>
            <div style={eyebrow(colors)}>TEST SUMMARY</div>
            <div style={summaryGrid}>
              <Mini colors={colors} value={answeredCount} label="Answered" />
              <Mini colors={colors} value={testQuestions.length - answeredCount} label="Left" />
              <Mini colors={colors} value={markedCount} label="Review" />
            </div>
          </div>
          <div style={card(colors)}>
            <div style={eyebrow(colors)}>QUESTION PALETTE</div>
            <div style={palette}>
              {testQuestions.map((q, index) => {
                const answered = answers[q.id] !== undefined && answers[q.id] !== null;
                const active = index === current;
                const review = Boolean(marked[q.id]);
                return <button key={q.id ?? index} onClick={() => goToQuestion(index)} style={{ ...paletteButton(colors), ...(answered ? { background: colors.gold, color: colors.goldText, borderColor: colors.gold } : {}), ...(review && !answered ? { borderColor: colors.blue, color: colors.blue } : {}), ...(active ? { boxShadow: `inset 0 0 0 2px ${colors.text}` } : {}) }}>{index + 1}</button>;
              })}
            </div>
          </div>
          <div style={card(colors)}>
            <div style={eyebrow(colors)}>LANGUAGE</div>
            <p style={{ color: colors.muted, fontSize: 12, lineHeight: 1.55 }}>English default hai. Hindi par tap karke current question translate karein.</p>
            <button style={{ ...primary(colors), width: "100%" }} onClick={translateCurrentQuestion} disabled={translationLoading}>{translationLoading ? "Translating…" : "Translate Current Question"}</button>
          </div>
        </aside>
      </div>
    </main>
  );

  if (screen === "result") return (
    <main style={page(colors)}><Header colors={colors} router={router} theme={theme} setTheme={setTheme} user={user} />
      <div style={container}>
        <section style={card(colors)}>
          <div style={eyebrow(colors)}>TEST COMPLETED</div>
          <h1 style={pageTitle}>{autoSubmitted ? "Time Up" : "Test Result"}</h1>
          <p style={{ color: colors.muted }}>{testQuestions.length} questions • {formatTime(FULL_TEST_SECONDS - remaining)} used</p>
          <div style={resultHero}><div><strong style={bigScore}>{result.score.toFixed(2)}</strong><span style={muted}>Score</span></div><div><strong style={smallScore}>{result.accuracy.toFixed(1)}%</strong><span style={muted}>Accuracy</span></div></div>
          <div style={resultGrid}><Result colors={colors} label="Correct" value={result.correct} /><Result colors={colors} label="Wrong" value={result.wrong} /><Result colors={colors} label="Unattempted" value={result.unanswered} /><Result colors={colors} label="Negative" value={`−${result.negative.toFixed(2)}`} /></div>
          <div style={actionRow}><button style={secondary(colors)} onClick={resetToHome}>Test Center</button><button style={primary(colors)} onClick={startTest}>Retake Test</button></div>
        </section>
        <section style={card(colors)}><div style={eyebrow(colors)}>QUESTION-WISE REVIEW</div><div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {testQuestions.map((q, index) => { const chosen = answers[q.id]; const attempted = chosen !== undefined && chosen !== null; const correct = attempted && Number(chosen) === Number(q.answer); return <button key={q.id ?? index} onClick={() => { setCurrent(index); setScreen("review"); }} style={reviewRow(colors)}><span style={reviewNo(colors)}>{index + 1}</span><span style={{ flex: 1, textAlign: "left" }}><strong>{correct ? "Correct" : attempted ? "Wrong" : "Unanswered"}</strong><small>{q.subject} • {q.year}</small></span><b style={{ color: correct ? colors.green : attempted ? colors.red : colors.muted }}>{correct ? "✓" : attempted ? "×" : "—"}</b></button>; })}
        </div></section>
      </div>
    </main>
  );

  if ((screen === "review" || screen === "historyReview") && currentQuestion) return (
    <main style={page(colors)}><Header colors={colors} router={router} theme={theme} setTheme={setTheme} user={user} />
      <div style={container}><section style={card(colors)}>
        <div style={reviewTop}><button style={ghostButton(colors)} onClick={() => setScreen(screen === "historyReview" ? "home" : "result")}>← {screen === "historyReview" ? "Test Center" : "Results"}</button><span style={eyebrow(colors)}>QUESTION {current + 1}</span></div>
        <h1 style={question(colors)}>{currentQuestion.question}</h1>
        <div style={{ display: "grid", gap: 9 }}>{currentQuestion.options.map((text, index) => { const correct = Number(currentQuestion.answer) === index; const chosen = Number(answers[currentQuestion.id]) === index; return <div key={index} style={{ ...option(colors), cursor: "default", borderColor: correct ? colors.green : chosen ? colors.red : colors.border, background: correct ? (theme === "dark" ? "#17351f" : "#edf8ef") : chosen ? (theme === "dark" ? "#381b1b" : "#fff0f0") : colors.surface }}><span style={letter(colors)}>{String.fromCharCode(65 + index)}</span><span style={{ textAlign: "left" }}>{text}</span>{correct && <b style={{ color: colors.green }}>Correct</b>}{chosen && !correct && <b style={{ color: colors.red }}>Your answer</b>}</div>; })}</div>
        {(currentQuestion.explanation_en || currentQuestion.explanation) && <div style={explanation(colors)}><div style={eyebrow(colors)}>EXPLANATION</div><p style={{ margin: "7px 0 0", lineHeight: 1.7 }}>{currentQuestion.explanation_en || currentQuestion.explanation}</p></div>}
        <div style={actionRow}><button style={secondary(colors)} disabled={current === 0} onClick={() => setCurrent((v) => Math.max(0, v - 1))}>Previous</button><button style={primary(colors)} disabled={current === testQuestions.length - 1} onClick={() => setCurrent((v) => Math.min(testQuestions.length - 1, v + 1))}>Next</button></div>
      </section></div>
    </main>
  );

  const dailyDone = (() => { try { const x = JSON.parse(localStorage.getItem(DAILY_KEY) || "null"); return x?.date === todayKey() && x?.attempted; } catch { return false; } })();

  return <main style={page(colors)}><Header colors={colors} router={router} theme={theme} setTheme={setTheme} user={user} />
    <div style={container}>
      {error && <div style={notice(colors)}>{error}<button style={noticeButton(colors)} onClick={() => setError("")}>×</button></div>}
      <section style={hero(colors)}><div><div style={eyebrow(colors)}>SAMBHAV UPSC • PRELIMS</div><h1 style={heroTitle}>Prelims Test Simulator</h1><p style={{ ...muted, maxWidth: 760 }}>UPSC-style PYQ testing with the same clean SAMBHAV interface. Full paper, original paper, custom practice and daily 20 — sab ek hi flow mein.</p></div><div style={heroMark(colors)}><strong>+2</strong><span>−0.66</span></div></section>

      <section style={card(colors)}><div style={sectionHead}><div><div style={eyebrow(colors)}>01 • MAIN TEST</div><h2 style={sectionTitle}>Full UPSC Simulator</h2><p style={muted}>100 questions • 120 minutes • question palette • review • auto-submit</p></div><span style={pill(colors)}>100 Q</span></div><button style={{ ...primary(colors), width: "100%", minHeight: 54, marginTop: 8 }} onClick={() => { setMode("full"); startTest(); }}>Start Full Prelims Test →</button></section>

      <section style={card(colors)}><div style={sectionHead}><div><div style={eyebrow(colors)}>02 • CUSTOM</div><h2 style={sectionTitle}>Year • Subject • Topic</h2><p style={muted}>Apni exact practice build karein.</p></div></div>
        <div style={filterGrid}><Select label="Year" value={year} options={years} onChange={setYear} colors={colors} /><Select label="Subject" value={subject} options={subjects} onChange={(v) => { setSubject(v); setTopic("all"); }} colors={colors} /><Select label="Topic" value={topic} options={topics} onChange={setTopic} colors={colors} /><div><div style={eyebrow(colors)}>QUESTIONS</div><div style={countGrid}>{TEST_OPTIONS.map((n) => <button key={n} style={{ ...countButton(colors), ...(questionCount === n ? { background: colors.gold, color: colors.goldText, borderColor: colors.gold } : {}) }} onClick={() => setQuestionCount(n)}>{n}</button>)}</div></div></div>
        <div style={{ ...infoStrip(colors), marginTop: 14 }}><span>{customPool.length} eligible questions</span><span>{year === "all" ? "All years" : year} • {subject === "all" ? "All subjects" : subject} • {topic === "all" ? "All topics" : topic}</span></div>
        <button style={{ ...secondary(colors), width: "100%", marginTop: 12, minHeight: 50 }} onClick={() => { setMode("custom"); startTest(); }}>Start Custom Test →</button>
      </section>

      <section style={card(colors)}><div style={sectionHead}><div><div style={eyebrow(colors)}>03 • ORIGINAL PAPER</div><h2 style={sectionTitle}>Year-wise UPSC Paper</h2><p style={muted}>2015 सहित available year ka complete 100-question paper.</p></div><span style={pill(colors)}>100 Q</span></div><div style={{ marginTop: 12 }}><Select label="Paper Year" value={year} options={years} onChange={setYear} colors={colors} /></div><button style={{ ...primary(colors), width: "100%", marginTop: 12 }} onClick={() => { setMode("original"); startTest(); }}>Start Original Paper →</button></section>

      <section style={card(colors)}><div style={dailyCard(colors)}><div><div style={eyebrow(colors)}>04 • QUICK PRACTICE</div><h2 style={sectionTitle}>Daily 20 PYQ</h2><p style={muted}>Roz 20 PYQs. Small secondary practice — main simulator se separate.</p></div><div style={{ textAlign: "right" }}><strong style={{ fontSize: 28 }}>20</strong><span style={muted}> PYQ</span></div></div><button style={{ ...secondary(colors), width: "100%", marginTop: 12 }} onClick={() => { setMode("daily"); startTest(); }}>{dailyDone ? "Practice Again →" : "Start Today’s 20 PYQ →"}</button></section>

      <section style={card(colors)}><div style={sectionHead}><div><div style={eyebrow(colors)}>05 • PERFORMANCE</div><h2 style={sectionTitle}>Previous Tests</h2><p style={muted}>Score, accuracy aur old attempts.</p></div><span style={pill(colors)}>{history.length}</span></div>{history.length ? <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{history.slice(0, 8).map((item) => <button key={item.id} style={historyRow(colors)} onClick={() => openHistory(item)}><span style={{ flex: 1, textAlign: "left" }}><strong>{getLabel(item.type)}</strong><small>{item.total} Q • {item.accuracy}% accuracy • {formatDate(item.date)}</small></span><b>{item.score}</b><span>→</span></button>)}</div> : <div style={empty(colors)}>Abhi koi test attempt nahi hua.</div>}</section>

      <section style={card(colors)}><div style={eyebrow(colors)}>TEST RULES</div><div style={rulesGrid}><Rule colors={colors} n="120 min" t="Full test duration" /><Rule colors={colors} n="+2" t="Correct answer" /><Rule colors={colors} n="−0.66" t="Wrong answer" /><Rule colors={colors} n="0" t="Unattempted" /></div></section>
    </div>
  </main>;
}

function Header({ colors, theme, setTheme, user, router }) {
  const initial = String(user?.name || user?.email || "S").trim().charAt(0).toUpperCase();
  return <header style={header(colors)}><button style={brandButton(colors)} onClick={() => router.push("/premium/home")}><div style={{ fontSize: 20, fontWeight: 950 }}>SAMBHAV <span style={{ color: colors.gold }}>UPSC</span></div><div style={{ color: colors.muted, fontSize: 9, letterSpacing: "1.2px", marginTop: 3 }}>INTELLIGENCE • PREPARATION • PERFORMANCE</div></button><div style={{ display: "flex", gap: 8 }}><button style={themeButton(colors)} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀" : "☾"}</button><button style={avatar(colors)} onClick={() => router.push("/premium/home")}>{initial}</button></div></header>;
}

function Select({ colors, label, value, options, onChange }) { return <label style={{ display: "grid", gap: 7 }}><span style={eyebrow(colors)}>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} style={select(colors)}>{options.map((o) => <option key={o} value={o}>{o === "all" ? `All ${label}s` : o}</option>)}</select></label>; }
function Mini({ colors, value, label }) { return <div style={mini(colors)}><strong>{value}</strong><small>{label}</small></div>; }
function Result({ colors, value, label }) { return <div style={result(colors)}><strong>{value}</strong><small>{label}</small></div>; }
function Rule({ colors, n, t }) { return <div style={rule(colors)}><strong>{n}</strong><span>{t}</span></div>; }
function Loading({ colors }) { return <main style={{ ...page(colors), display: "grid", placeItems: "center" }}><div style={card(colors)}><div style={eyebrow(colors)}>SAMBHAV UPSC</div><h2 style={{ margin: "8px 0 0" }}>Loading Prelims Test…</h2></div></main>; }
function ErrorScreen({ colors, error, onRetry }) { return <main style={{ ...page(colors), display: "grid", placeItems: "center", padding: 20 }}><div style={card(colors)}><div style={eyebrow(colors)}>PRELIMS TEST</div><h2>Unable to load test</h2><p style={muted}>{error}</p><button style={primary(colors)} onClick={onRetry}>Retry</button></div></main>; }

const page = (c) => ({ minHeight: "100vh", background: c.page, color: c.text, fontFamily: "Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" });
const header = (c) => ({ minHeight: 72, padding: "12px clamp(14px,3vw,36px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${c.border}`, position: "sticky", top: 0, zIndex: 30, background: c.page });
const brandButton = (c) => ({ border: 0, background: "transparent", color: c.text, padding: 0, cursor: "pointer", textAlign: "left" });
const themeButton = (c) => ({ width: 38, height: 38, borderRadius: 11, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", fontSize: 17 });
const avatar = (c) => ({ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", fontWeight: 900 });
const container = { width: "min(1080px,calc(100% - 28px))", margin: "0 auto", padding: "22px 0 50px", display: "grid", gap: 16 };
const card = (c) => ({ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 22, padding: "clamp(16px,3vw,28px)", boxShadow: c.shadow });
const hero = (c) => ({ ...card(c), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, background: c.surface2 });
const heroTitle = { margin: "7px 0 8px", fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.02, letterSpacing: "-.055em" };
const pageTitle = { margin: "8px 0", fontSize: "clamp(28px,5vw,42px)", letterSpacing: "-.04em" };
const muted = { color: "var(--muted, #706d66)", lineHeight: 1.6, margin: 0 };
const heroMark = (c) => ({ minWidth: 78, padding: 14, borderRadius: 17, border: `1px solid ${c.border}`, background: c.surface, display: "grid", textAlign: "center" });
const eyebrow = (c) => ({ color: c.muted, fontSize: 9, fontWeight: 950, letterSpacing: "1.25px", textTransform: "uppercase" });
const sectionHead = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 };
const sectionTitle = { margin: "5px 0 0", fontSize: 23, letterSpacing: "-.03em" };
const pill = (c) => ({ border: `1px solid ${c.border}`, background: c.surface2, borderRadius: 999, padding: "7px 10px", fontSize: 10, fontWeight: 900 });
const filterGrid = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 11 };
const select = (c) => ({ width: "100%", minHeight: 46, borderRadius: 12, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, padding: "0 11px", outline: "none" });
const countGrid = { display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 6, marginTop: 7 };
const countButton = (c) => ({ minHeight: 40, borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", fontWeight: 850 });
const primary = (c) => ({ minHeight: 45, borderRadius: 12, border: `1px solid ${c.gold}`, background: c.gold, color: c.goldText, cursor: "pointer", fontWeight: 950, padding: "0 16px" });
const secondary = (c) => ({ minHeight: 45, borderRadius: 12, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, cursor: "pointer", fontWeight: 850, padding: "0 15px" });
const ghostButton = (c) => ({ border: 0, background: "transparent", color: c.text, cursor: "pointer", fontWeight: 850, padding: 0 });
const infoStrip = (c) => ({ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "10px 12px", border: `1px solid ${c.border}`, borderRadius: 12, background: c.surface2, color: c.muted, fontSize: 11 });
const dailyCard = (c) => ({ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", padding: 14, borderRadius: 16, border: `1px solid ${c.border}`, background: c.surface2 });
const historyRow = (c) => ({ width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 58, borderRadius: 13, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, padding: "8px 11px", cursor: "pointer" });
const empty = (c) => ({ padding: 18, border: `1px dashed ${c.border}`, borderRadius: 13, color: c.muted, textAlign: "center" });
const rulesGrid = { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginTop: 12 };
const rule = (c) => ({ border: `1px solid ${c.border}`, borderRadius: 12, padding: 12, background: c.surface2, display: "grid", gap: 4 });
const notice = (c) => ({ position: "relative", padding: "11px 40px 11px 13px", border: `1px solid ${c.red}`, background: c.red + "12", color: c.red, borderRadius: 12, fontSize: 12 });
const noticeButton = (c) => ({ position: "absolute", right: 7, top: 5, border: 0, background: "transparent", color: c.red, cursor: "pointer", fontSize: 20 });
const testHeader = (c,mobile) => ({ minHeight: 68, padding: "9px 14px", display: "grid", gridTemplateColumns: mobile ? "auto 1fr auto" : "1fr auto 1fr", alignItems: "center", gap: 10, borderBottom: `1px solid ${c.border}`, position: "sticky", top: 0, zIndex: 30, background: c.page });
const timer = (c) => ({ justifySelf: "end", fontWeight: 950, fontVariantNumeric: "tabular-nums", fontSize: 16 });
const testLayout = (mobile) => ({ width: mobile ? "calc(100% - 20px)" : "min(1240px,calc(100% - 28px))", margin: "18px auto 40px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,1fr) 300px", gap: 16 });
const meta = (c) => ({ display: "flex", flexWrap: "wrap", gap: 7, color: c.muted, fontSize: 11, marginBottom: 16 });
const qBadge = (c) => ({ display: "inline-grid", placeItems: "center", minWidth: 40, height: 29, borderRadius: 9, background: c.gold, color: c.goldText, fontWeight: 950, fontSize: 11 });
const question = (c) => ({ margin: "14px 0 21px", fontSize: "clamp(20px,3vw,29px)", lineHeight: 1.48, letterSpacing: "-.02em" });
const langBar = { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 16 };
const smallButton = (c) => ({ minHeight: 35, borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, cursor: "pointer", padding: "0 12px", fontWeight: 850, fontSize: 11 });
const activeSmall = (c) => ({ ...smallButton(c), background: c.gold, borderColor: c.gold, color: c.goldText });
const option = (c) => ({ width: "100%", minHeight: 58, borderRadius: 14, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", fontSize: 14, lineHeight: 1.5 });
const letter = (c) => ({ width: 32, height: 32, flex: "0 0 32px", borderRadius: "50%", background: c.surface3, color: c.text, display: "grid", placeItems: "center", fontWeight: 950 });
const actionRow = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 22 };
const summaryGrid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 10 };
const mini = (c) => ({ border: `1px solid ${c.border}`, borderRadius: 11, padding: 10, textAlign: "center", display: "grid", gap: 3 });
const palette = { display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 6, marginTop: 10 };
const paletteButton = (c) => ({ minHeight: 35, borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", fontWeight: 850 });
const resultHero = { display: "flex", gap: 50, alignItems: "center", margin: "24px 0" };
const bigScore = { display: "block", fontSize: 54, lineHeight: 1, letterSpacing: "-.06em" };
const smallScore = { display: "block", fontSize: 34, lineHeight: 1, letterSpacing: "-.05em" };
const resultGrid = { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 };
const result = (c) => ({ border: `1px solid ${c.border}`, borderRadius: 12, padding: 13, background: c.surface2, display: "grid", gap: 4 });
const reviewRow = (c) => ({ width: "100%", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${c.border}`, borderRadius: 12, background: c.surface2, color: c.text, padding: "9px 10px", cursor: "pointer" });
const reviewNo = (c) => ({ width: 31, height: 31, display: "grid", placeItems: "center", borderRadius: 8, background: c.surface3, fontWeight: 900 });
const reviewTop = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 };
const explanation = (c) => ({ marginTop: 18, padding: 15, borderRadius: 14, border: `1px solid ${c.border}`, background: c.surface2 });

if (typeof window !== "undefined") {
  // Keep the existing SAMBHAV theme attribute compatible with the rest of the app.
  document.documentElement.style.setProperty("--sambhav-prelims-ready", "1");
}
