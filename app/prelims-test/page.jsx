// app/prelims-test/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const QUESTION_COUNTS = [20, 30, 50, 75, 100];
const FULL_TEST_COUNT = 100;
const FULL_TEST_SECONDS = 120 * 60;
const DAILY_COUNT = 20;
const MARKS_PER_QUESTION = 2;
const NEGATIVE_MARKS = 2 / 3;
const ACTIVE_ATTEMPT_KEY = "sambhav-prelims-active-v3";
const HISTORY_KEY = "sambhav-prelims-history-v3";
const DAILY_KEY = "sambhav-prelims-daily-v3";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function seededShuffle(arr, seed) {
  const copy = [...arr];
  let value = Math.abs(Number(seed) || 1) % 2147483647;
  if (value === 0) value = 1;
  const random = () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
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

function dateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getScore(questions, answers) {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  questions.forEach((q) => {
    const has = Object.prototype.hasOwnProperty.call(answers, q.id);
    if (!has) unanswered += 1;
    else if (Number(answers[q.id]) === Number(q.answer)) correct += 1;
    else wrong += 1;
  });
  const score = correct * MARKS_PER_QUESTION - wrong * NEGATIVE_MARKS;
  const attempted = correct + wrong;
  return {
    correct,
    wrong,
    unanswered,
    attempted,
    score,
    accuracy: attempted ? (correct / attempted) * 100 : 0,
  };
}

function normalizeRows(rows) {
  return rows.map((q, index) => {
    let answer = q?.answer;
    if ((answer === null || answer === undefined || answer === "") && q?.correct_option != null) {
      const n = Number(q.correct_option);
      answer = n >= 1 && n <= 4 ? n - 1 : n;
    } else if (typeof answer === "string") {
      const normalized = answer.trim().toUpperCase();
      const map = { A: 0, B: 1, C: 2, D: 3 };
      if (Object.prototype.hasOwnProperty.call(map, normalized)) answer = map[normalized];
      else if (normalized !== "" && !Number.isNaN(Number(normalized))) answer = Number(normalized);
    }

    let options = [];
    if (Array.isArray(q?.options)) options = q.options;
    else if (typeof q?.options === "string") {
      try {
        const parsed = JSON.parse(q.options);
        options = Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    if (!options.length) {
      options = [q?.option_a, q?.option_b, q?.option_c, q?.option_d].filter(
        (x) => x !== null && x !== undefined && String(x).trim() !== ""
      );
    }

    return {
      ...q,
      id: q?.id ?? `prelims-${q?.year ?? "unknown"}-${index + 1}`,
      year: Number(q?.year) || 0,
      subject: q?.subject || "General Studies",
      topic: q?.topic || "General",
      question: q?.question || "",
      options,
      answer,
      explanation: q?.explanation || "",
      explanation_en: q?.explanation_en || q?.explanation || "",
      explanation_hi: q?.explanation_hi || "",
    };
  }).filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2);
}

export default function PrelimsTestPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("center");
  const [mode, setMode] = useState("full");
  const [year, setYear] = useState("all");
  const [subject, setSubject] = useState("all");
  const [topic, setTopic] = useState("all");
  const [questionCount, setQuestionCount] = useState(50);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");
  const [history, setHistory] = useState([]);
  const [activeHistory, setActiveHistory] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({});
  const [remaining, setRemaining] = useState(FULL_TEST_SECONDS);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [translationQuestionId, setTranslationQuestionId] = useState(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [dailyTime, setDailyTime] = useState("18:00");
  const [dailySaving, setDailySaving] = useState(false);
  const [notice, setNotice] = useState("");
  const submittingRef = useRef(false);
  const answersRef = useRef({});
  const testQuestionsRef = useRef([]);
  const remainingRef = useRef(FULL_TEST_SECONDS);
  const screenRef = useRef("center");

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { testQuestionsRef.current = testQuestions; }, [testQuestions]);
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("sambhav-theme", theme); } catch {}
    document.documentElement.dataset.sambhavTheme = theme;
  }, [theme]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(saved)) setHistory(saved);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const auth = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const authData = await auth.json().catch(() => ({}));
        if (!auth.ok || !authData?.user) {
          router.replace("/login");
          return;
        }
        if (!alive) return;
        setUser(authData.user);

        const response = await fetch("/api/pyq/prelims", { credentials: "include", cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Unable to load prelims questions.");
        const rows = Array.isArray(data?.pyqs) ? data.pyqs : Array.isArray(data?.questions) ? data.questions : [];
        setQuestions(normalizeRows(rows));
      } catch (e) {
        if (alive) setError(e?.message || "Unable to load the test.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [router]);

  const colors = theme === "dark" ? {
    page: "#0b0b0b", card: "#151515", card2: "#1b1b1b", text: "#f5f2eb", muted: "#aaa49a",
    border: "#2b2b2b", gold: "#dfc477", goldText: "#16120a", soft: "#222", green: "#91cfa3", red: "#e89a9a", blue: "#9ebdff",
  } : {
    page: "#f5f2eb", card: "#fffdf9", card2: "#f8f4eb", text: "#111", muted: "#716e67",
    border: "#e3ded2", gold: "#dfc477", goldText: "#17130b", soft: "#f0ece3", green: "#287442", red: "#b33434", blue: "#315caa",
  };

  const years = useMemo(() => [...new Set(questions.map((q) => q.year).filter(Boolean))].sort((a, b) => b - a), [questions]);
  const subjects = useMemo(() => [...new Set(questions.map((q) => q.subject).filter(Boolean))].sort(), [questions]);
  const availableTopics = useMemo(() => {
    const base = subject === "all" ? questions : questions.filter((q) => q.subject === subject);
    return [...new Set(base.map((q) => q.topic).filter(Boolean))].sort();
  }, [questions, subject]);
  const filteredQuestions = useMemo(() => questions.filter((q) =>
    (year === "all" || String(q.year) === String(year)) &&
    (subject === "all" || q.subject === subject) &&
    (topic === "all" || q.topic === topic)
  ), [questions, year, subject, topic]);
  const currentQuestion = testQuestions[current];
  const result = useMemo(() => getScore(testQuestions, answers), [testQuestions, answers]);
  const progress = testQuestions.length ? ((current + 1) / testQuestions.length) * 100 : 0;

  useEffect(() => {
    if (topic !== "all" && !availableTopics.includes(topic)) setTopic("all");
  }, [availableTopics, topic]);

  useEffect(() => {
    if (screen !== "test" || !testQuestions.length) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          clearInterval(interval);
          setAutoSubmitted(true);
          setTimeout(() => submitTest(true), 0);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, testQuestions.length]);

  useEffect(() => {
    if (screen !== "test" || !testQuestions.length) return;
    try {
      localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify({
        mode, year, subject, topic, questionCount, language, testQuestions, current, answers, marked, visited,
        remaining: remainingRef.current, startedAt,
        savedAt: Date.now(),
      }));
    } catch {}
  }, [screen, mode, year, subject, topic, questionCount, language, testQuestions, current, answers, marked, visited, startedAt, remaining]);

  useEffect(() => {
    if (!questions.length) return;
    try {
      const raw = localStorage.getItem(ACTIVE_ATTEMPT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.testQuestions?.length || !saved?.savedAt) return;
      if (Date.now() - Number(saved.savedAt) > 24 * 60 * 60 * 1000) return;
      const validIds = new Set(questions.map((q) => String(q.id)));
      const restored = saved.testQuestions.filter((q) => validIds.has(String(q.id)));
      if (!restored.length) return;
      setTestQuestions(restored);
      setMode(saved.mode || "full");
      setYear(saved.year || "all");
      setSubject(saved.subject || "all");
      setTopic(saved.topic || "all");
      setQuestionCount(saved.questionCount || restored.length);
      setLanguage(saved.language === "hi" ? "hi" : "en");
      setCurrent(Math.min(Number(saved.current) || 0, restored.length - 1));
      setAnswers(saved.answers || {});
      setMarked(saved.marked || {});
      setVisited(saved.visited || {});
      setRemaining(Math.max(1, Number(saved.remaining) || FULL_TEST_SECONDS));
      setStartedAt(saved.startedAt || Date.now());
      setScreen("test");
      setNotice("Unfinished test restored.");
    } catch {}
  }, [questions]);

  const clearActive = () => { try { localStorage.removeItem(ACTIVE_ATTEMPT_KEY); } catch {} };

  const startTest = (requestedMode = mode) => {
    setNotice("");
    let pool = filteredQuestions;
    let count = questionCount;
    let nextMode = requestedMode;

    if (requestedMode === "full") {
      pool = questions;
      count = FULL_TEST_COUNT;
    } else if (requestedMode === "original") {
      pool = questions.filter((q) => String(q.year) === String(year));
      count = FULL_TEST_COUNT;
      if (year === "all") { setNotice("Original Paper ke liye pehle year select karein."); return; }
      if (pool.length < FULL_TEST_COUNT) { setNotice(`Original ${year} paper ke liye ${FULL_TEST_COUNT} questions available nahi hain.`); return; }
    } else if (requestedMode === "daily") {
      pool = questions;
      count = DAILY_COUNT;
    } else {
      if (requestedMode === "subject" && subject === "all") { setNotice("Subject Test ke liye subject select karein."); return; }
      if (requestedMode === "topic" && topic === "all") { setNotice("Topic Test ke liye topic select karein."); return; }
    }

    if (pool.length < count) {
      setNotice(`Selected test ke liye ${count} questions available nahi hain. Available: ${pool.length}.`);
      return;
    }

    const picked = requestedMode === "original" ? pool.slice(0, count) : shuffle(pool).slice(0, count);
    setMode(nextMode);
    setTestQuestions(picked);
    setCurrent(0);
    setAnswers({});
    setMarked({});
    setVisited({ [picked[0]?.id]: true });
    setRemaining(requestedMode === "daily" ? 40 * 60 : FULL_TEST_SECONDS);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setShowSubmitConfirm(false);
    setScreen("test");
  };

  const startDaily = () => {
    const key = dateKey();
    let seed = Number(key.replaceAll("-", ""));
    try {
      const saved = JSON.parse(localStorage.getItem(DAILY_KEY) || "{}");
      if (saved?.date === key && saved?.questionIds?.length === DAILY_COUNT) {
        const byId = new Map(questions.map((q) => [String(q.id), q]));
        const restored = saved.questionIds.map((id) => byId.get(String(id))).filter(Boolean);
        if (restored.length === DAILY_COUNT) {
          setMode("daily"); setTestQuestions(restored); setCurrent(0); setAnswers({}); setMarked({}); setVisited({ [restored[0].id]: true });
          setRemaining(40 * 60); setStartedAt(Date.now()); setFinishedAt(null); setAutoSubmitted(false); setScreen("test"); return;
        }
      }
    } catch {}
    const picked = seededShuffle(questions, seed).slice(0, DAILY_COUNT);
    if (picked.length < DAILY_COUNT) { setNotice("Daily 20 ke liye question bank me kam se kam 20 questions chahiye."); return; }
    try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: key, questionIds: picked.map((q) => q.id) })); } catch {}
    setMode("daily"); setTestQuestions(picked); setCurrent(0); setAnswers({}); setMarked({}); setVisited({ [picked[0].id]: true });
    setRemaining(40 * 60); setStartedAt(Date.now()); setFinishedAt(null); setAutoSubmitted(false); setScreen("test");
  };

  const submitTest = (forced = false) => {
    if (submittingRef.current || !testQuestionsRef.current.length) return;
    submittingRef.current = true;
    const qs = testQuestionsRef.current;
    const ans = answersRef.current;
    const stats = getScore(qs, ans);
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(), mode, year, subject, topic,
      total: qs.length, questionIds: qs.map((q) => q.id), answers: ans,
      marked, ...stats, timeUsed: Math.max(0, (mode === "daily" ? 40 * 60 : FULL_TEST_SECONDS) - remainingRef.current),
      duration: mode === "daily" ? 40 * 60 : FULL_TEST_SECONDS,
      autoSubmitted: forced || autoSubmitted,
    };
    try {
      const next = [item, ...history].slice(0, 30);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
      localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    } catch {}
    setFinishedAt(Date.now());
    setShowSubmitConfirm(false);
    setScreen("result");
    submittingRef.current = false;
  };

  const chooseAnswer = (index) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }));
  };
  const goToQuestion = (index) => {
    if (index < 0 || index >= testQuestions.length) return;
    setCurrent(index);
    const q = testQuestions[index];
    setVisited((prev) => ({ ...prev, [q.id]: true }));
    setTranslation(null); setTranslationQuestionId(null); setTranslationError("");
  };
  const clearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => { const next = { ...prev }; delete next[currentQuestion.id]; return next; });
  };
  const toggleMark = () => {
    if (!currentQuestion) return;
    setMarked((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  };

  const translateCurrentQuestion = async () => {
    if (!currentQuestion) return;
    if (translationQuestionId === currentQuestion.id && translation) { setLanguage("hi"); return; }
    setTranslationError(""); setTranslationLoading(true);
    const cacheKey = `sambhav_translation_v2_${currentQuestion.id}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.question_hi && Array.isArray(parsed?.options_hi)) { setTranslation(parsed); setTranslationQuestionId(currentQuestion.id); setLanguage("hi"); return; }
      }
      const response = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ question: currentQuestion.question, options: currentQuestion.options, explanation: currentQuestion.explanation_en || currentQuestion.explanation || "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.translation) throw new Error(data?.error || "Translation failed.");
      setTranslation(data.translation); setTranslationQuestionId(currentQuestion.id); setLanguage("hi");
      try { localStorage.setItem(cacheKey, JSON.stringify(data.translation)); } catch {}
    } catch (e) { setTranslationError(e?.message || "Translation failed."); }
    finally { setTranslationLoading(false); }
  };

  const questionText = language === "hi" && translationQuestionId === currentQuestion?.id && translation?.question_hi
    ? translation.question_hi : currentQuestion?.question || "";
  const optionText = (index) => language === "hi" && translationQuestionId === currentQuestion?.id && translation?.options_hi?.[index]
    ? translation.options_hi[index] : currentQuestion?.options?.[index] || "";

  const saveDailyNotification = async () => {
    if (!user) return;
    setDailySaving(true); setNotice("");
    try {
      const response = await fetch("/api/current-affairs/notifications", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, enabled: dailyEnabled, language, notification_time: dailyTime }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Notification setting save nahi hua.");
      setNotice(dailyEnabled ? `Daily 20 notification ${dailyTime} par set hai.` : "Daily 20 notification off kar diya gaya.");
    } catch (e) { setNotice(e?.message || "Notification setting save nahi hua."); }
    finally { setDailySaving(false); }
  };

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetch(`/api/current-affairs/notifications?user_id=${encodeURIComponent(user.id)}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (!alive) return;
        const item = data?.notification || data?.settings || data;
        if (item && typeof item === "object") {
          if (typeof item.enabled === "boolean") setDailyEnabled(item.enabled);
          if (item.notification_time) setDailyTime(String(item.notification_time).slice(0, 5));
        }
      }).catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const openHistory = (item) => {
    const byId = new Map(questions.map((q) => [String(q.id), q]));
    const qs = (item.questionIds || []).map((id) => byId.get(String(id))).filter(Boolean);
    if (!qs.length) { setActiveHistory(item); setScreen("historyDetail"); return; }
    setTestQuestions(qs); setAnswers(item.answers || {}); setMarked(item.marked || {}); setCurrent(0); setLanguage("en"); setActiveHistory(item); setScreen("historyDetail");
  };

  const restart = () => {
    clearActive(); setTestQuestions([]); setAnswers({}); setMarked({}); setVisited({}); setCurrent(0); setRemaining(FULL_TEST_SECONDS); setStartedAt(null); setFinishedAt(null); setAutoSubmitted(false); setTranslation(null); setTranslationQuestionId(null); setScreen("center");
  };

  const filteredHistory = history.slice(0, 6);

  if (loading) return <main style={styles.page(colors)}><div style={styles.centerLoad}>Loading Prelims Test Center…</div></main>;
  if (error) return <main style={styles.page(colors)}><Header colors={colors} theme={theme} setTheme={setTheme} user={user} router={router}/><div style={styles.container}><Panel colors={colors}><div style={styles.eyebrow(colors)}>PRELIMS TEST</div><h1 style={styles.h1(colors)}>Unable to load questions</h1><p style={styles.muted(colors)}>{error}</p><button style={styles.primary(colors)} onClick={() => window.location.reload()}>Retry</button></Panel></div></main>;

  if (screen === "test" && currentQuestion) {
    return <TestScreen {...{colors, theme, setTheme, user, router, currentQuestion, current, testQuestions, answers, marked, visited, remaining, language, setLanguage, questionText, optionText, chooseAnswer, goToQuestion, clearResponse, toggleMark, translateCurrentQuestion, translationLoading, translationError, progress, setShowSubmitConfirm, setShowExitConfirm, autoSubmitted, mode}} />;
  }

  if (screen === "result") {
    return <ResultScreen colors={colors} theme={theme} setTheme={setTheme} user={user} router={router} result={result} testQuestions={testQuestions} answers={answers} autoSubmitted={autoSubmitted} restart={restart} startRetake={() => startTest(mode)} goReview={(i) => { setCurrent(i); setScreen("historyDetail"); }} />;
  }

  if (screen === "historyDetail") {
    const detailResult = getScore(testQuestions, answers);
    return <ReviewScreen colors={colors} theme={theme} setTheme={setTheme} user={user} router={router} testQuestions={testQuestions} answers={answers} current={current} setCurrent={setCurrent} goToQuestion={goToQuestion} result={detailResult} back={() => setScreen(activeHistory ? "history" : "result")} />;
  }

  if (screen === "history") {
    return <HistoryScreen colors={colors} theme={theme} setTheme={setTheme} user={user} router={router} history={history} openHistory={openHistory} back={() => setScreen("center")} />;
  }

  return <>
    <main style={styles.page(colors)}>
      <div style={styles.container}>
        <Header colors={colors} theme={theme} setTheme={setTheme} user={user} router={router}/>

        <section style={styles.hero(colors)}>
          <div style={styles.eyebrow(colors)}>SAMBHAV UPSC • PRELIMS TEST CENTER</div>
          <h1 style={styles.heroTitle(colors)}>UPSC Prelims<br/><span>Simulator</span></h1>
          <p style={styles.heroText(colors)}>Full-length exam simulation, custom PYQ tests and performance intelligence — built from the existing Prelims PYQ bank.</p>
          <div style={styles.heroStats}>
            <Stat colors={colors} value="100" label="Full Test Qs"/><Stat colors={colors} value="120 min" label="Exam Time"/><Stat colors={colors} value="+2 / −0.66" label="UPSC Marking"/>
          </div>
        </section>

        {notice ? <div style={styles.notice(colors)}>{notice}</div> : null}

        <section style={styles.sectionHeader(colors)}><div><div style={styles.eyebrow(colors)}>PRIMARY ENGINE</div><h2 style={styles.h2(colors)}>Choose your test</h2></div><div style={styles.badge(colors)}>{questions.length} PYQs</div></section>
        <div style={styles.grid(colors)}>
          <FeatureCard colors={colors} featured icon="◎" title="Full UPSC Prelims Simulator" text="100 questions • 120 minutes • question palette • review flags • auto-save • UPSC marking." onClick={() => startTest("full")} />
          <FeatureCard colors={colors} icon="◇" title="Custom Test" text="Combine year, subject and topic filters. Choose 20 / 30 / 50 / 75 / 100 questions." onClick={() => setMode("custom" + "") } />
          <FeatureCard colors={colors} icon="▣" title="Original Paper" text="Attempt a complete year-wise paper from the existing PYQ data." onClick={() => { setMode("original"); if (year === "all") setNotice("Year select karke Original Paper start karein."); else startTest("original"); }} />
          <FeatureCard colors={colors} icon="◌" title="Previous Tests" text="Review scores, accuracy, attempts, time and question-wise performance." onClick={() => setScreen("history")} />
        </div>

        <section style={styles.customPanel(colors)}>
          <div style={styles.sectionHeader(colors)}><div><div style={styles.eyebrow(colors)}>CUSTOM TEST BUILDER</div><h2 style={styles.h2(colors)}>Year • Subject • Topic</h2></div><button style={styles.linkButton(colors)} onClick={() => {setYear("all");setSubject("all");setTopic("all");}}>Reset</button></div>
          <div style={styles.filterGrid}>
            <Select label="Year" value={year} onChange={setYear} options={["all", ...years.map(String)]} colors={colors}/>
            <Select label="Subject" value={subject} onChange={(v) => {setSubject(v);setTopic("all");}} options={["all", ...subjects]} colors={colors}/>
            <Select label="Topic" value={topic} onChange={setTopic} options={["all", ...availableTopics]} colors={colors}/>
            <Select label="Questions" value={String(questionCount)} onChange={(v) => setQuestionCount(Number(v))} options={QUESTION_COUNTS.map(String)} colors={colors}/>
          </div>
          <div style={styles.selectionLine(colors)}><span>{filteredQuestions.length} questions match</span><button style={styles.primary(colors)} onClick={() => { setMode("custom"); startTest("custom"); }}>Start Custom Test →</button></div>
        </section>

        <section style={styles.dailyCard(colors)}>
          <div style={{flex:1}}><div style={styles.eyebrow(colors)}>QUICK PRACTICE</div><h2 style={styles.h2(colors)}>Daily 20 PYQ</h2><p style={styles.muted(colors)}>A separate 20-question daily practice set. Same set remains fixed for the day.</p><button style={styles.secondary(colors)} onClick={startDaily}>Start Today’s 20 →</button></div>
          <div style={styles.dailyMini(colors)}><strong>20</strong><span>PYQs</span><small>40 min</small></div>
        </section>

        <section style={styles.notificationCard(colors)}>
          <div><div style={styles.eyebrow(colors)}>DAILY REMINDER</div><h2 style={styles.h2(colors)}>Evening Daily 20 notification</h2><p style={styles.muted(colors)}>Existing SAMBHAV notification system ka use karke Daily 20 reminder set karein.</p></div>
          <div style={styles.notificationControls}>
            <label style={styles.switchRow(colors)}><input type="checkbox" checked={dailyEnabled} onChange={(e) => setDailyEnabled(e.target.checked)} /><span>{dailyEnabled ? "ON" : "OFF"}</span></label>
            <input type="time" value={dailyTime} onChange={(e) => setDailyTime(e.target.value)} style={styles.timeInput(colors)} />
            <button style={styles.primary(colors)} disabled={dailySaving} onClick={saveDailyNotification}>{dailySaving ? "Saving…" : "Save Reminder"}</button>
          </div>
        </section>

        <section style={styles.performance(colors)}>
          <div><div style={styles.eyebrow(colors)}>PERFORMANCE</div><h2 style={styles.h2(colors)}>Your recent tests</h2></div>
          <button style={styles.linkButton(colors)} onClick={() => setScreen("history")}>View all →</button>
          <div style={styles.historyGrid}>{filteredHistory.length ? filteredHistory.slice(0,3).map((item) => <HistoryMini key={item.id} colors={colors} item={item} onClick={() => openHistory(item)}/>) : <div style={styles.empty(colors)}>No test attempt yet. Start the Full Simulator first.</div>}</div>
        </section>

        <section style={styles.rules(colors)}><div style={styles.eyebrow(colors)}>EXAM ENGINE</div><div style={styles.ruleGrid}><Rule colors={colors} title="Auto-save" text="Reload ke baad unfinished attempt resume."/><Rule colors={colors} title="Palette" text="Answered, marked, visited aur unanswered status."/><Rule colors={colors} title="Language" text="English / Hindi translation mode."/><Rule colors={colors} title="Analysis" text="Score, accuracy, subject/topic/year insights."/></div></section>
      </div>
    </main>
    {showSubmitConfirm ? <ConfirmModal colors={colors} title="Submit test?" text={`${result.attempted} attempted • ${result.unanswered} unanswered`} onCancel={() => setShowSubmitConfirm(false)} onConfirm={() => submitTest(false)} confirm="Submit Test"/> : null}
    {showExitConfirm ? <ConfirmModal colors={colors} title="Exit test?" text="Your current attempt auto-save ho chuka hai. You can resume it later." onCancel={() => setShowExitConfirm(false)} onConfirm={() => {setShowExitConfirm(false);setScreen("center");}} confirm="Exit & Save"/> : null}
  </>;
}

function Header({ colors, theme, setTheme, user, router }) {
  const name = user?.first_name || user?.firstName || user?.name || "Aspirant";
  return <header style={styles.header(colors)}><button style={styles.brandButton(colors)} onClick={() => router.push("/premium/home")}><strong>SAMBHAV <span>UPSC</span></strong><small>PRELIMS TEST CENTER</small></button><div style={styles.headerActions}><button style={styles.theme(colors)} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀ LIGHT" : "☾ DARK"}</button><button style={styles.avatar(colors)} onClick={() => router.push("/premium/home")} aria-label={name}>{name.charAt(0).toUpperCase()}</button></div></header>;
}

function TestScreen(p) {
  const { colors, theme, setTheme, user, router, currentQuestion, current, testQuestions, answers, marked, visited, remaining, language, setLanguage, questionText, optionText, chooseAnswer, goToQuestion, clearResponse, toggleMark, translateCurrentQuestion, translationLoading, translationError, progress, setShowSubmitConfirm, setShowExitConfirm, autoSubmitted, mode } = p;
  return <main style={styles.page(colors)}><div style={styles.container}><Header {...{colors,theme,setTheme,user,router}}/><div style={styles.testTop(colors)}><button style={styles.secondary(colors)} onClick={() => setShowExitConfirm(true)}>← Test Center</button><div style={styles.testTitle(colors)}><div style={styles.eyebrow(colors)}>{mode === "daily" ? "DAILY 20" : "UPSC PRELIMS SIMULATOR"}</div><strong>Q{current + 1} / {testQuestions.length}</strong></div><div style={{...styles.timer(colors), ...(remaining <= 300 ? {color: colors.red} : {})}}>{formatTime(remaining)}</div></div><div style={styles.progressTrack(colors)}><div style={{...styles.progressFill(colors),width:`${progress}%`}}/></div>{autoSubmitted ? <div style={styles.notice(colors)}>Time over — test auto-submitted.</div> : null}<div style={styles.testLayout}><section style={styles.questionCard(colors)}><div style={styles.metaRow(colors)}><span>{currentQuestion.year || "PYQ"}</span><span>{currentQuestion.subject}</span><span>+2 / −0.66</span>{currentQuestion.topic ? <span>{currentQuestion.topic}</span> : null}</div><h1 style={styles.questionTitle(colors)}>{questionText}</h1><div style={styles.langBar(colors)}><button style={language === "en" ? styles.smallActive(colors) : styles.smallButton(colors)} onClick={() => setLanguage("en")}>English</button><button style={language === "hi" ? styles.smallActive(colors) : styles.smallButton(colors)} onClick={translateCurrentQuestion} disabled={translationLoading}>{translationLoading ? "Translating…" : "हिंदी"}</button>{translationError ? <span style={{color:colors.red,fontSize:12}}>{translationError}</span> : null}</div><div style={styles.options}>{currentQuestion.options.map((_,i) => { const selected = answers[currentQuestion.id] === i; return <button key={i} onClick={() => chooseAnswer(i)} style={{...styles.option(colors),...(selected ? styles.optionSelected(colors):{})}}><span style={styles.optionKey(colors)}>{String.fromCharCode(65+i)}</span><span>{optionText(i)}</span></button>;})}</div><div style={styles.actionRow}><button style={styles.secondary(colors)} onClick={clearResponse}>Clear Response</button><button style={marked[currentQuestion.id] ? styles.markActive(colors) : styles.secondary(colors)} onClick={toggleMark}>{marked[currentQuestion.id] ? "★ Marked" : "☆ Mark for Review"}</button></div><div style={styles.navRow}><button style={styles.secondary(colors)} disabled={current===0} onClick={() => goToQuestion(current-1)}>← Previous</button><button style={styles.primary(colors)} onClick={() => current === testQuestions.length-1 ? setShowSubmitConfirm(true) : goToQuestion(current+1)}>{current === testQuestions.length-1 ? "Submit Test" : "Next →"}</button></div></section><aside style={styles.paletteCard(colors)}><div style={styles.paletteTitle(colors)}>Question Palette</div><div style={styles.paletteLegend(colors)}><span>● Answered</span><span>☆ Marked</span><span>○ Unanswered</span></div><div style={styles.palette}>{testQuestions.map((q,i)=>{const answered=Object.prototype.hasOwnProperty.call(answers,q.id);return <button key={q.id} onClick={()=>goToQuestion(i)} style={{...styles.paletteItem(colors),...(i===current?styles.paletteCurrent(colors):{}),...(answered?styles.paletteAnswered(colors):{}),...(marked[q.id]?styles.paletteMarked(colors):{}),...(!visited[q.id]&&!answered?{opacity:.62}: {})}}>{i+1}</button>})}</div><div style={styles.sideStats}><div><strong>{Object.keys(answers).length}</strong><span>Answered</span></div><div><strong>{Object.keys(marked).filter(k=>marked[k]).length}</strong><span>Marked</span></div><div><strong>{testQuestions.length-Object.keys(answers).length}</strong><span>Left</span></div></div></aside></div></div></main>;
}

function ResultScreen({ colors, theme, setTheme, user, router, result, testQuestions, answers, autoSubmitted, restart, startRetake, goReview }) {
  const subjectStats = useMemo(() => aggregateStats(testQuestions, answers, "subject"), [testQuestions, answers]);
  const topicStats = useMemo(() => aggregateStats(testQuestions, answers, "topic"), [testQuestions, answers]);
  return <main style={styles.page(colors)}><div style={styles.container}><Header {...{colors,theme,setTheme,user,router}}/><section style={styles.resultHero(colors)}><div style={styles.eyebrow(colors)}>TEST RESULT {autoSubmitted ? "• AUTO SUBMITTED" : ""}</div><div style={styles.score}>{result.score.toFixed(2)}</div><div style={styles.scoreSub}>out of {testQuestions.length * 2}</div><div style={styles.resultStats}><Stat colors={colors} value={result.correct} label="Correct"/><Stat colors={colors} value={result.wrong} label="Wrong"/><Stat colors={colors} value={result.unanswered} label="Unattempted"/><Stat colors={colors} value={`${result.accuracy.toFixed(1)}%`} label="Accuracy"/></div></section><div style={styles.resultActions}><button style={styles.secondary(colors)} onClick={restart}>Test Center</button><button style={styles.primary(colors)} onClick={startRetake}>Retake Test</button></div><AnalysisBlock colors={colors} title="Subject analysis" rows={subjectStats}/><AnalysisBlock colors={colors} title="Topic analysis" rows={topicStats}/><section style={styles.reviewCard(colors)}><div style={styles.sectionHeader(colors)}><div><div style={styles.eyebrow(colors)}>QUESTION REVIEW</div><h2 style={styles.h2(colors)}>Review answers</h2></div></div>{testQuestions.map((q,i)=>{const a=answers[q.id];const state= a===undefined?"unanswered":Number(a)===Number(q.answer)?"correct":"wrong";return <button key={q.id} onClick={()=>goReview(i)} style={styles.reviewRow(colors)}><span style={{...styles.reviewDot(colors),background:state==="correct"?colors.green:state==="wrong"?colors.red:colors.muted}}>{i+1}</span><span style={styles.reviewText(colors)}>{q.question}</span><span style={{color:state==="correct"?colors.green:state==="wrong"?colors.red:colors.muted,fontWeight:800}}>{state}</span></button>})}</section></div></main>;
}

function ReviewScreen({ colors, theme, setTheme, user, router, testQuestions, answers, current, setCurrent, goToQuestion, result, back }) {
  const q = testQuestions[current]; const chosen = q ? answers[q.id] : undefined;
  return <main style={styles.page(colors)}><div style={styles.container}><Header {...{colors,theme,setTheme,user,router}}/><button style={styles.secondary(colors)} onClick={back}>← Back</button>{q ? <section style={styles.questionCard(colors)}><div style={styles.metaRow(colors)}><span>Q{current+1} / {testQuestions.length}</span><span>{q.year}</span><span>{q.subject}</span></div><h1 style={styles.questionTitle(colors)}>{q.question}</h1><div style={styles.options}>{q.options.map((opt,i)=>{const isCorrect=i===q.answer;const isChosen=i===chosen;return <div key={i} style={{...styles.reviewOption(colors),...(isCorrect?{borderColor:colors.green,background:colors.green+"14"}:{}),...(isChosen&&!isCorrect?{borderColor:colors.red,background:colors.red+"12"}:{})}}><b>{String.fromCharCode(65+i)}</b><span>{opt}</span><small>{isCorrect?"Correct":isChosen?"Your answer":""}</small></div>})}</div><div style={styles.explanation(colors)}><div style={styles.eyebrow(colors)}>EXPLANATION</div><p>{q.explanation_en || q.explanation || "Explanation not available in the PYQ data."}</p></div><div style={styles.navRow}><button style={styles.secondary(colors)} disabled={current===0} onClick={()=>setCurrent((x)=>Math.max(0,x-1))}>← Previous</button><button style={styles.primary(colors)} disabled={current===testQuestions.length-1} onClick={()=>setCurrent((x)=>Math.min(testQuestions.length-1,x+1))}>Next →</button></div></section>:<Panel colors={colors}><h2 style={styles.h2(colors)}>Review unavailable</h2><p style={styles.muted(colors)}>The original question data is no longer available in the current PYQ response.</p></Panel>}<div style={styles.compactStats(colors)}><span>Score {result.score.toFixed(2)}</span><span>Accuracy {result.accuracy.toFixed(1)}%</span></div></div></main>;
}

function HistoryScreen({ colors, theme, setTheme, user, router, history, openHistory, back }) {
  return <main style={styles.page(colors)}><div style={styles.container}><Header {...{colors,theme,setTheme,user,router}}/><button style={styles.secondary(colors)} onClick={back}>← Test Center</button><section style={styles.sectionHeader(colors)}><div><div style={styles.eyebrow(colors)}>PERFORMANCE</div><h1 style={styles.h2(colors)}>Previous Tests</h1></div></section>{history.length ? history.map((item)=><button key={item.id} style={styles.historyFull(colors)} onClick={()=>openHistory(item)}><div><strong>{labelMode(item.mode)}</strong><small>{new Date(item.date).toLocaleString()}</small></div><div style={styles.historyNumbers}><b>{Number(item.score||0).toFixed(2)}</b><span>{item.correct}/{item.total} correct</span><span>{Number(item.accuracy||0).toFixed(1)}% accuracy</span></div><span>→</span></button>) : <Panel colors={colors}><p style={styles.muted(colors)}>No previous test yet.</p></Panel>}</div></main>;
}

function aggregateStats(questions, answers, field) {
  const map = new Map();
  questions.forEach((q)=>{const key=q[field]||"General";const row=map.get(key)||{name:key,total:0,correct:0,attempted:0,score:0};row.total++;const has=Object.prototype.hasOwnProperty.call(answers,q.id);if(has){row.attempted++;if(Number(answers[q.id])===Number(q.answer)){row.correct++;row.score+=2;}else row.score-=2/3;}map.set(key,row);});
  return [...map.values()].sort((a,b)=>b.total-a.total).slice(0,12);
}

function AnalysisBlock({ colors, title, rows }) { return <section style={styles.analysis(colors)}><div style={styles.eyebrow(colors)}>{title.toUpperCase()}</div>{rows.length?rows.map(r=><div key={r.name} style={styles.analysisRow(colors)}><span>{r.name}</span><span>{r.correct}/{r.total}</span><span>{r.total?((r.correct/r.total)*100).toFixed(0):0}%</span><b>{r.score.toFixed(2)}</b></div>):<p style={styles.muted(colors)}>No analysis data.</p>}</section>; }
function FeatureCard({ colors, title, text, icon, onClick, featured }) { return <button style={{...styles.featureCard(colors),...(featured?styles.featureFeatured(colors):{})}} onClick={onClick}><div style={styles.featureIcon(colors)}>{icon}</div><div><div style={styles.featureTitle(colors)}>{title}</div><div style={styles.featureText(colors)}>{text}</div></div><span style={styles.arrow(colors)}>→</span></button>; }
function HistoryMini({ colors, item, onClick }) { return <button style={styles.historyMini(colors)} onClick={onClick}><b>{Number(item.score||0).toFixed(1)}</b><span>{labelMode(item.mode)}</span><small>{item.correct}/{item.total} correct</small></button>; }
function Rule({ colors, title, text }) { return <div style={styles.rule(colors)}><b>{title}</b><span>{text}</span></div>; }
function Select({ colors, label, value, onChange, options }) { return <label style={styles.selectWrap(colors)}><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map((o)=><option key={o} value={o}>{o === "all" ? "All" : o}</option>)}</select></label>; }
function Stat({ colors, value, label }) { return <div style={styles.stat(colors)}><strong>{value}</strong><span>{label}</span></div>; }
function Panel({ colors, children }) { return <section style={styles.panel(colors)}>{children}</section>; }
function ConfirmModal({ colors, title, text, onCancel, onConfirm, confirm }) { return <div style={styles.overlay}><div style={styles.modal(colors)}><div style={styles.eyebrow(colors)}>CONFIRMATION</div><h2 style={styles.h2(colors)}>{title}</h2><p style={styles.muted(colors)}>{text}</p><div style={styles.modalActions}><button style={styles.secondary(colors)} onClick={onCancel}>Cancel</button><button style={styles.primary(colors)} onClick={onConfirm}>{confirm}</button></div></div></div>; }
function labelMode(mode) { return ({full:"Full Simulator",custom:"Custom Test",subject:"Subject Test",topic:"Topic Test",original:"Original Paper",daily:"Daily 20"}[mode] || "Prelims Test"); }

const styles = {
  page:(c)=>({minHeight:"100vh",background:c.page,color:c.text,fontFamily:"Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",transition:"background .2s,color .2s",paddingBottom:50}),
  container:{width:"100%",maxWidth:1100,margin:"0 auto",padding:"18px 16px 50px",boxSizing:"border-box"},
  centerLoad:{minHeight:"100vh",display:"grid",placeItems:"center",fontWeight:800},
  header:(c)=>({display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:18}),
  brandButton:(c)=>({border:0,background:"transparent",color:c.text,textAlign:"left",cursor:"pointer",padding:0}),
  brandSub:{fontSize:9,color:"#8b8b8b",marginTop:4,letterSpacing:1.3,fontWeight:700},
  headerActions:{display:"flex",alignItems:"center",gap:8},
  theme:(c)=>({border:`1px solid ${c.border}`,background:c.card,color:c.text,borderRadius:999,padding:"9px 12px",fontSize:9,fontWeight:900,cursor:"pointer"}),
  avatar:(c)=>({width:40,height:40,borderRadius:"50%",border:0,background:c.text,color:c.card,fontWeight:900,cursor:"pointer"}),
  hero:(c)=>({background:c.text,color:c.card,borderRadius:28,padding:"30px 28px",marginBottom:18,boxShadow:"0 18px 50px rgba(0,0,0,.12)"}),
  eyebrow:(c)=>({fontSize:9,fontWeight:950,letterSpacing:1.5,color:c.gold}),
  heroTitle:(c)=>({fontSize:"clamp(36px,6vw,64px)",lineHeight:.98,letterSpacing:-2,margin:"12px 0 12px",fontWeight:950}),
  heroText:(c)=>({maxWidth:680,color:c.muted,fontSize:14,lineHeight:1.6,margin:0}),
  heroStats:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:24,maxWidth:650},
  stat:(c)=>({border:`1px solid ${c.border}`,background:c.card2,borderRadius:15,padding:"13px 12px",display:"flex",flexDirection:"column",gap:4}),
  sectionHeader:(c)=>({display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,margin:"24px 0 12px"}),
  h1:(c)=>({fontSize:34,margin:"8px 0 10px",fontWeight:950}),
  h2:(c)=>({fontSize:22,margin:"6px 0 0",fontWeight:950,letterSpacing:-.4}),
  muted:(c)=>({color:c.muted,fontSize:12,lineHeight:1.6}),
  badge:(c)=>({border:`1px solid ${c.border}`,background:c.card,padding:"8px 11px",borderRadius:999,fontSize:10,fontWeight:900}),
  grid:(c)=>({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}),
  featureCard:(c)=>({width:"100%",boxSizing:"border-box",border:`1px solid ${c.border}`,background:c.card,color:c.text,borderRadius:20,padding:18,textAlign:"left",display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer",boxShadow:"0 8px 24px rgba(0,0,0,.04)"}),
  featureFeatured:(c)=>({gridColumn:"span 2",background:c.text,color:c.card,borderColor:c.text,minHeight:150}),
  featureIcon:(c)=>({width:42,height:42,borderRadius:14,background:c.soft,color:c.gold,display:"grid",placeItems:"center",fontSize:20,fontWeight:900,flexShrink:0}),
  featureTitle:(c)=>({fontSize:16,fontWeight:950,marginBottom:5}),
  featureText:(c)=>({fontSize:11,lineHeight:1.55,color:c.muted}),
  arrow:(c)=>({marginLeft:"auto",fontSize:18,color:c.gold}),
  customPanel:(c)=>({marginTop:18,border:`1px solid ${c.border}`,background:c.card,borderRadius:22,padding:20}),
  filterGrid:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10},
  selectWrap:(c)=>({display:"flex",flexDirection:"column",gap:6,fontSize:10,fontWeight:850,color:c.muted}),
  select:{},
  selectionLine:(c)=>({marginTop:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,fontSize:11,color:c.muted}),
  primary:(c)=>({border:0,background:c.text,color:c.card,borderRadius:12,padding:"11px 15px",fontWeight:900,fontSize:11,cursor:"pointer"}),
  secondary:(c)=>({border:`1px solid ${c.border}`,background:c.card,color:c.text,borderRadius:12,padding:"10px 14px",fontWeight:850,fontSize:11,cursor:"pointer"}),
  linkButton:(c)=>({border:0,background:"transparent",color:c.gold,fontWeight:900,fontSize:11,cursor:"pointer"}),
  dailyCard:(c)=>({marginTop:18,border:`1px solid ${c.border}`,background:c.card2,borderRadius:22,padding:18,display:"flex",gap:18,alignItems:"center"}),
  dailyMini:(c)=>({width:95,height:95,borderRadius:22,background:c.text,color:c.card,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}),
  notificationCard:(c)=>({marginTop:12,border:`1px solid ${c.border}`,background:c.card,borderRadius:22,padding:18,display:"flex",justifyContent:"space-between",gap:18,alignItems:"center"}),
  notificationControls:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"},
  switchRow:(c)=>({display:"flex",alignItems:"center",gap:7,fontSize:10,fontWeight:900}),
  timeInput:(c)=>({border:`1px solid ${c.border}`,background:c.card2,color:c.text,borderRadius:10,padding:"9px 10px"}),
  performance:(c)=>({marginTop:24}),
  historyGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10},
  historyMini:(c)=>({border:`1px solid ${c.border}`,background:c.card,color:c.text,borderRadius:16,padding:14,textAlign:"left",display:"flex",flexDirection:"column",gap:4,cursor:"pointer"}),
  historyFull:(c)=>({width:"100%",border:`1px solid ${c.border}`,background:c.card,color:c.text,borderRadius:16,padding:15,marginBottom:9,display:"grid",gridTemplateColumns:"1fr auto auto",gap:15,alignItems:"center",textAlign:"left",cursor:"pointer"}),
  historyNumbers:{display:"flex",gap:12,alignItems:"center",fontSize:11},
  rules:(c)=>({marginTop:24,border:`1px solid ${c.border}`,background:c.card,borderRadius:22,padding:18}),
  ruleGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:12},
  rule:(c)=>({border:`1px solid ${c.border}`,borderRadius:14,padding:12,display:"flex",flexDirection:"column",gap:5}),
  notice:(c)=>({margin:"10px 0",padding:"11px 13px",borderRadius:12,background:c.gold+"25",border:`1px solid ${c.gold}55`,fontSize:11,fontWeight:800}),
  testTop:(c)=>({display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:12,marginBottom:10}),
  testTitle:(c)=>({textAlign:"center",display:"flex",flexDirection:"column",gap:4}),
  timer:(c)=>({justifySelf:"end",fontVariantNumeric:"tabular-nums",fontWeight:950,fontSize:20}),
  progressTrack:(c)=>({height:4,borderRadius:99,background:c.soft,overflow:"hidden",marginBottom:16}),
  progressFill:(c)=>({height:"100%",background:c.gold,borderRadius:99,transition:"width .2s"}),
  testLayout:{display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:14},
  questionCard:(c)=>({border:`1px solid ${c.border}`,background:c.card,borderRadius:22,padding:22}),
  metaRow:(c)=>({display:"flex",gap:7,flexWrap:"wrap",marginBottom:18}),
  metaPill:(c)=>({}),
  questionTitle:(c)=>({fontSize:"clamp(20px,3vw,29px)",lineHeight:1.45,margin:"10px 0 18px",fontWeight:800}),
  langBar:(c)=>({display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:14}),
  smallButton:(c)=>({border:`1px solid ${c.border}`,background:c.card2,color:c.text,borderRadius:999,padding:"7px 10px",fontSize:10,fontWeight:900,cursor:"pointer"}),
  smallActive:(c)=>({border:`1px solid ${c.gold}`,background:c.gold,color:c.goldText,borderRadius:999,padding:"7px 10px",fontSize:10,fontWeight:900,cursor:"pointer"}),
  options:{display:"flex",flexDirection:"column",gap:9},
  option:(c)=>({display:"flex",alignItems:"flex-start",gap:12,width:"100%",padding:"14px",border:`1px solid ${c.border}`,background:c.card2,color:c.text,borderRadius:14,textAlign:"left",cursor:"pointer",fontSize:13,lineHeight:1.5}),
  optionSelected:(c)=>({borderColor:c.gold,background:c.gold+"18",boxShadow:`inset 0 0 0 1px ${c.gold}`}),
  optionKey:(c)=>({width:27,height:27,borderRadius:9,background:c.soft,display:"grid",placeItems:"center",fontWeight:950,flexShrink:0}),
  actionRow:(c)=>({display:"flex",gap:8,justifyContent:"flex-end",marginTop:15,flexWrap:"wrap"}),
  markActive:(c)=>({border:`1px solid ${c.gold}`,background:c.gold+"22",color:c.text,borderRadius:12,padding:"10px 14px",fontWeight:900,fontSize:11,cursor:"pointer"}),
  navRow:(c)=>({display:"flex",justifyContent:"space-between",gap:10,marginTop:20}),
  paletteCard:(c)=>({border:`1px solid ${c.border}`,background:c.card,borderRadius:22,padding:17,height:"fit-content",position:"sticky",top:15}),
  paletteTitle:(c)=>({fontWeight:950,fontSize:14}),
  paletteLegend:(c)=>({display:"flex",flexWrap:"wrap",gap:8,color:c.muted,fontSize:9,margin:"9px 0 13px"}),
  palette:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7},
  paletteItem:(c)=>({height:34,border:`1px solid ${c.border}`,background:c.card2,color:c.text,borderRadius:9,fontSize:10,fontWeight:900,cursor:"pointer"}),
  paletteCurrent:(c)=>({boxShadow:`0 0 0 2px ${c.gold}`}),
  paletteAnswered:(c)=>({background:c.green,color:"white",borderColor:c.green}),
  paletteMarked:(c)=>({borderColor:c.gold,boxShadow:`inset 0 0 0 2px ${c.gold}`}),
  sideStats:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginTop:14},
  resultHero:(c)=>({background:c.text,color:c.card,borderRadius:24,padding:28,textAlign:"center"}),
  score:{fontSize:64,fontWeight:950,lineHeight:1,marginTop:12},
  scoreSub:{fontSize:11,color:c=>c.muted},
  resultStats:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:22,textAlign:"left"},
  resultActions:{display:"flex",justifyContent:"center",gap:8,margin:"15px 0"},
  analysis:(c)=>({border:`1px solid ${c.border}`,background:c.card,borderRadius:20,padding:17,marginTop:12}),
  analysisRow:(c)=>({display:"grid",gridTemplateColumns:"1fr 70px 70px 80px",gap:8,padding:"10px 0",borderBottom:`1px solid ${c.border}`,fontSize:11,alignItems:"center"}),
  reviewCard:(c)=>({border:`1px solid ${c.border}`,background:c.card,borderRadius:20,padding:17,marginTop:12}),
  reviewRow:(c)=>({width:"100%",border:0,borderBottom:`1px solid ${c.border}`,background:"transparent",color:c.text,padding:"11px 0",display:"grid",gridTemplateColumns:"30px 1fr auto",gap:9,alignItems:"center",textAlign:"left",cursor:"pointer"}),
  reviewDot:(c)=>({width:26,height:26,borderRadius:"50%",color:"white",display:"grid",placeItems:"center",fontSize:10,fontWeight:900}),
  reviewText:(c)=>({fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}),
  reviewOption:(c)=>({display:"grid",gridTemplateColumns:"28px 1fr auto",gap:10,alignItems:"center",padding:13,border:`1px solid ${c.border}`,borderRadius:13,marginBottom:8,fontSize:12}),
  explanation:(c)=>({marginTop:18,padding:16,borderRadius:15,background:c.card2,border:`1px solid ${c.border}`,fontSize:12,lineHeight:1.7}),
  compactStats:(c)=>({display:"flex",justifyContent:"center",gap:20,color:c.muted,fontSize:11,marginTop:15}),
  empty:(c)=>({padding:18,border:`1px dashed ${c.border}`,borderRadius:14,color:c.muted,fontSize:11}),
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"grid",placeItems:"center",zIndex:1000,padding:16},
  modal:(c)=>({width:"100%",maxWidth:430,background:c.card,color:c.text,border:`1px solid ${c.border}`,borderRadius:22,padding:22,boxShadow:"0 25px 80px rgba(0,0,0,.35)"}),
  modalActions:{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18},
};
