// app/prelims-test/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SmartQuizInsights from "./SmartQuizInsights";

const TEST_OPTIONS = [20, 30, 50, 75, 100];
const MARKS_PER_QUESTION = 2;
const NEGATIVE_MARKS = 2 / 3;
const TOTAL_SECONDS = 2 * 60 * 60;
const DAILY_SECONDS = 30 * 60;
const ACTIVE_ATTEMPT_KEY = "sambhav-prelims-active-attempt-v2";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
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

export default function PrelimsTestPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  const [screen, setScreen] = useState("center");
  const [testType, setTestType] = useState("full");
  const [year, setYear] = useState("all");
  const [subject, setSubject] = useState("all");
  const [topic, setTopic] = useState("all");
  const [questionCount, setQuestionCount] = useState(20);
  const [history, setHistory] = useState([]);
  const [language, setLanguageState] = useState("en");

  const setLanguage = (value) => {
    const next = value === "hi" ? "hi" : "en";
    setLanguageState(next);
    try { localStorage.setItem("sambhav-prelims-language", next); } catch {}
  };
  const [translation, setTranslation] = useState(null);
  const [translationQuestionId, setTranslationQuestionId] = useState(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");

  const [testQuestions, setTestQuestions] = useState([]);
  const [smartQuizSessionId, setSmartQuizSessionId] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({});
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(TOTAL_SECONDS);
  const [resumeCandidate, setResumeCandidate] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [dailyNotification, setDailyNotification] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);

  const [theme, setTheme] = useState("light");
  const [isMobile, setIsMobile] = useState(false);
  const submittingRef = useRef(false);
  const answersRef = useRef({});
  const remainingRef = useRef(TOTAL_SECONDS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sambhav-theme", theme);
    } catch {}
    document.documentElement.dataset.sambhavTheme = theme;
  }, [theme]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isPaidOrDemoUser = useMemo(() => {
    const u = user || {};
    const values = [
      u.plan, u.plan_type, u.subscription_type, u.subscription_plan,
      u.premium_plan, u.premiumPlan, u.access_type, u.accessType,
      u.subscription?.plan, u.subscription?.type, u.subscription?.status,
      u.premium?.plan, u.premium?.type, u.premium?.status,
    ].filter(Boolean).map((v) => String(v).toLowerCase());
    return Boolean(
      u.isPremium || u.is_premium || u.premium === true ||
      values.some((v) => v.includes("paid") || v.includes("premium") || v.includes("demo") || v.includes("pro"))
    );
  }, [user]);

  useEffect(() => {
    if (!user?.id || !isPaidOrDemoUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/current-affairs/notifications?user_id=${encodeURIComponent(user.id)}`, {
          credentials: "include", cache: "no-store"
        });
        const data = await res.json().catch(() => ({}));
        const item = Array.isArray(data?.notifications) ? data.notifications[0] : data?.notification;
        if (!cancelled && item) setDailyNotification(Boolean(item.enabled));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user, isPaidOrDemoUser]);

  const toggleDailyNotification = async () => {
    if (!user?.id || !isPaidOrDemoUser || notificationSaving) return;
    const next = !dailyNotification;
    setNotificationSaving(true);
    try {
      const res = await fetch("/api/current-affairs/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          enabled: next,
          language,
          notification_time: "18:00",
          notification_type: "prelims_daily_20",
          module: "prelims",
          content_type: "daily_20_pyq",
        }),
      });
      if (!res.ok) throw new Error("notification save failed");
      setDailyNotification(next);
    } catch (e) {
      console.error("Daily Prelims notification error:", e);
      setError("Daily 20 notification save nahi ho payi.");
    } finally {
      setNotificationSaving(false);
    }
  };

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.user) {
          router.replace("/login");
          return;
        }

        if (!alive) return;
        setUser(data.user);

        const pyqRes = await fetch("/api/pyq/prelims", {
          credentials: "include",
          cache: "no-store",
        });
        const pyqData = await pyqRes.json().catch(() => ({}));

        if (!pyqRes.ok) {
          throw new Error(pyqData?.error || "Unable to load prelims questions.");
        }

        const rows = Array.isArray(pyqData?.pyqs)
          ? pyqData.pyqs
          : Array.isArray(pyqData?.questions)
          ? pyqData.questions
          : [];

        // Use the existing Supabase prelims_pyqs data.
        // Supabase stores options in option_a/option_b/option_c/option_d
        // and the answer in correct_option (1=A, 2=B, 3=C, 4=D).
        const mappedRows = rows.map((q, index) => {
          let answer = q?.answer;

          if (
            (answer === null ||
              answer === undefined ||
              answer === "") &&
            q?.correct_option !== null &&
            q?.correct_option !== undefined
          ) {
            const numericAnswer = Number(q.correct_option);

            answer =
              numericAnswer >= 1 && numericAnswer <= 4
                ? numericAnswer - 1
                : numericAnswer;
          } else if (typeof answer === "string") {
            const normalized = answer.trim().toUpperCase();
            const answerMap = { A: 0, B: 1, C: 2, D: 3 };

            if (
              Object.prototype.hasOwnProperty.call(
                answerMap,
                normalized
              )
            ) {
              answer = answerMap[normalized];
            } else if (
              normalized !== "" &&
              !Number.isNaN(Number(normalized))
            ) {
              answer = Number(normalized);
            }
          }

          let options = [];

          if (Array.isArray(q?.options)) {
            options = q.options;
          } else if (typeof q?.options === "string") {
            try {
              const parsed = JSON.parse(q.options);
              options = Array.isArray(parsed) ? parsed : [];
            } catch {
              options = [];
            }
          }

          if (
            options.length === 0 &&
            (
              q?.option_a ||
              q?.option_b ||
              q?.option_c ||
              q?.option_d
            )
          ) {
            options = [
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d,
            ].filter(
              (option) =>
                option !== null &&
                option !== undefined &&
                String(option).trim() !== ""
            );
          }

          return {
            ...q,
            id:
              q?.id ??
              `prelims-${q?.year ?? "unknown"}-${index + 1}`,
            year: Number(q?.year),
            subject: q?.subject || "General",
            topic: q?.topic || "General",
            question: q?.question || "",
            options,
            answer,
            explanation: q?.explanation || "",
            explanation_en:
              q?.explanation ||
              q?.explanation_en ||
              "",
            explanation_hi: q?.explanation_hi || "",
          };
        });

        setQuestions(
          mappedRows.filter(
            (q) =>
              Array.isArray(q?.options) &&
              q.options.length > 0
          )
        );
      } catch (e) {
        if (alive) setError(e?.message || "Unable to load the test.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const colors =
    theme === "dark"
      ? {
          page: "#0b0b0b",
          card: "#151515",
          card2: "#1b1b1b",
          text: "#f5f2eb",
          muted: "#aaa49a",
          border: "#2b2b2b",
          gold: "#dfc477",
          goldText: "#16120a",
          soft: "#222",
          green: "#91cfa3",
          red: "#e89a9a",
          blue: "#9ebdff",
        }
      : {
          page: "#f4f1ea",
          card: "#ffffff",
          card2: "#fbf8f1",
          text: "#161616",
          muted: "#5f5b54",
          border: "#d9d3c7",
          gold: "#c7a84e",
          goldText: "#17130b",
          soft: "#eee9df",
          green: "#216b3a",
          red: "#a92f2f",
          blue: "#2d5aa3",
        };

  const years = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      if (q?.year !== undefined && q?.year !== null && String(q.year).trim()) {
        set.add(String(q.year));
      }
    });
    return ["all", ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [questions]);

  const subjects = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      const value = q?.subject || q?.category;
      if (value) set.add(String(value));
    });
    return ["all", ...Array.from(set).sort()];
  }, [questions]);

  const topics = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      const qSubject = String(q?.subject || q?.category || "");
      if (subject !== "all" && qSubject !== subject) return;
      const value = q?.topic;
      if (value) set.add(String(value));
    });
    return ["all", ...Array.from(set).sort()];
  }, [questions, subject]);

  useEffect(() => {
    if (testType === "paper" && year === "all" && years.includes("2015")) {
      setYear("2015");
    }
  }, [testType, years]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sambhav-prelims-history") || "[]");
      setHistory(Array.isArray(saved) ? saved : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (loading || !questions.length || screen !== "center") return;

    try {
      const raw = localStorage.getItem(ACTIVE_ATTEMPT_KEY);
      if (!raw) {
        setResumeCandidate(null);
        return;
      }

      const saved = JSON.parse(raw);
      if (!saved?.testQuestions?.length || !saved?.savedAt) {
        localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
        setResumeCandidate(null);
        return;
      }

      const savedAt = Number(saved.savedAt);
      const savedRemaining = Number(saved.remaining);
      const elapsedSinceSave = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
      const liveRemaining = Math.max(0, savedRemaining - elapsedSinceSave);

      if (!Number.isFinite(liveRemaining) || liveRemaining <= 0) {
        localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
        setResumeCandidate(null);
        return;
      }

      setResumeCandidate({ ...saved, remaining: liveRemaining });
    } catch {
      try {
        localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
      } catch {}
      setResumeCandidate(null);
    }
  }, [loading, questions.length, screen]);

  useEffect(() => {
    if (screen !== "test" || !testQuestions.length || !startedAt) return;

    try {
      localStorage.setItem(
        ACTIVE_ATTEMPT_KEY,
        JSON.stringify({
          version: 2,
          savedAt: Date.now(),
          testType,
          year,
          subject,
          topic,
          questionCount,
          language,
          durationSeconds,
          remaining: remainingRef.current,
          current,
          answers: answersRef.current,
          marked,
          visited,
          startedAt,
          testQuestions,
        })
      );
    } catch {}
  }, [
    screen,
    testQuestions,
    current,
    marked,
    visited,
    language,
    durationSeconds,
    startedAt,
    remaining,
    testType,
    year,
    subject,
    topic,
    questionCount,
  ]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const qYear = String(q?.year ?? "");
      const qSubject = String(q?.subject || q?.category || "");
      const qTopic = String(q?.topic || "");

      const yearOk = year === "all" || qYear === year;
      const subjectOk = subject === "all" || qSubject === subject;
      const topicOk = topic === "all" || qTopic === topic;

      if (testType === "subject" && subject === "all") return false;
      if (testType === "topic" && topic === "all") return false;

      return yearOk && subjectOk && topicOk;
    });
  }, [questions, year, subject, topic, testType]);

  const currentQuestion = testQuestions[current];

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((id) => answers[id] !== null && answers[id] !== undefined).length,
    [answers]
  );

  const markedCount = useMemo(
    () => Object.values(marked).filter(Boolean).length,
    [marked]
  );

  const elapsed = startedAt
    ? Math.max(0, durationSeconds - remaining)
    : 0;

  const result = useMemo(() => {
    if (!testQuestions.length) {
      return {
        correct: 0,
        wrong: 0,
        unanswered: 0,
        positive: 0,
        negative: 0,
        score: 0,
        accuracy: 0,
        analysis: { subject: [], topic: [], year: [] },
      };
    }

    let correct = 0;
    let wrong = 0;

    testQuestions.forEach((q) => {
      const chosen = answers[q.id];
      if (chosen === undefined || chosen === null) return;

      if (Number(chosen) === Number(q.answer)) correct += 1;
      else wrong += 1;
    });

    const unanswered = testQuestions.length - correct - wrong;
    const positive = correct * MARKS_PER_QUESTION;
    const negative = wrong * NEGATIVE_MARKS;
    const score = positive - negative;
    const accuracy =
      correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0;

    const buildAnalysis = (key) => {
      const groups = {};
      testQuestions.forEach((q) => {
        const label = String(q?.[key] || (key === "year" ? "Unknown" : "General"));
        if (!groups[label]) groups[label] = { label, total: 0, correct: 0, wrong: 0, attempted: 0 };
        groups[label].total += 1;
        const chosen = answers[q.id];
        if (chosen === undefined || chosen === null) return;
        groups[label].attempted += 1;
        if (Number(chosen) === Number(q.answer)) groups[label].correct += 1;
        else groups[label].wrong += 1;
      });
      return Object.values(groups)
        .map((g) => ({ ...g, accuracy: g.attempted ? (g.correct / g.attempted) * 100 : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
    };

    return {
      correct,
      wrong,
      unanswered,
      positive,
      negative,
      score,
      accuracy,
      analysis: {
        subject: buildAnalysis("subject"),
        topic: buildAnalysis("topic"),
        year: buildAnalysis("year"),
      },
    };
  }, [answers, testQuestions]);

  const createSmartQuizSession = async (selectedQuestions) => {
    if (
      !Array.isArray(selectedQuestions) ||
      selectedQuestions.length === 0 ||
      selectedQuestions.some((q) => String(q?.id ?? "").startsWith("prelims-"))
    ) {
      setSmartQuizSessionId(null);
      return null;
    }

    try {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: selectedQuestions.length,
          questionIds: selectedQuestions.map((q) => String(q.id)),
          subject: "all",
          topic: "all",
          year: "all",
          mode: "practice",
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.sessionId) {
        throw new Error(data?.error || "Smart Quiz session could not be created.");
      }

      const sessionId = String(data.sessionId);
      setSmartQuizSessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error("Smart Quiz session creation failed:", error);
      setSmartQuizSessionId(null);
      setError(
        "Smart Quiz analytics connection failed: " +
          (error?.message || "Unknown error")
      );
      return null;
    }
  };

  const startTest = async () => {
    let eligible = (
      testType === "daily" ? questions : filteredQuestions
    ).filter(
      (q) => Array.isArray(q.options) && q.options.length >= 2
    );

    if (testType === "subject" && subject === "all") {
      setError("Please select a subject for Subject Test.");
      return;
    }

    if (testType === "topic" && topic === "all") {
      setError("Please select a topic for Topic Test.");
      return;
    }

    if (testType === "paper" && year === "all") {
      setError("Please select a year for the Original Paper.");
      return;
    }

    if (testType === "paper") {
      eligible = eligible.filter((q) => String(q.year) === String(year));
    }

    if (!eligible.length) {
      setError("No questions are available for the selected filters.");
      return;
    }

    const forcedCount =
      testType === "full" || testType === "paper"
        ? 100
        : testType === "daily"
        ? 20
        : Number(questionCount);

    if (testType === "paper" && eligible.length < 100) {
      setError(
        `${year} Original Paper needs 100 questions. Only ${eligible.length} are available in the current PYQ data.`
      );
      return;
    }

    if (eligible.length < forcedCount) {
      setError(
        `Only ${eligible.length} questions are available for this selection.`
      );
      return;
    }

    const selected =
      testType === "paper"
        ? [...eligible]
            .sort((a, b) => {
              const an = Number(a?.question_number ?? a?.question_no ?? a?.qno);
              const bn = Number(b?.question_number ?? b?.question_no ?? b?.qno);
              if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
              if (Number.isFinite(an)) return -1;
              if (Number.isFinite(bn)) return 1;
              return 0;
            })
            .slice(0, 100)
        : shuffle(eligible).slice(0, forcedCount);

    const selectedDuration =
      testType === "daily" ? DAILY_SECONDS : TOTAL_SECONDS;

    setSmartQuizSessionId(null);
    await createSmartQuizSession(selected);

    const initialVisited = {};
    if (selected[0]?.id !== undefined) initialVisited[selected[0].id] = true;

    setError("");
    setTestQuestions(selected);
    setCurrent(0);
    setAnswers({});
    answersRef.current = {};
    setMarked({});
    setVisited(initialVisited);
    setDurationSeconds(selectedDuration);
    setRemaining(selectedDuration);
    remainingRef.current = selectedDuration;
    setStartedAt(Date.now());
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    submittingRef.current = false;
    setScreen("test");
  };

  const startTestForDaily = async () => {
    const eligible = questions.filter(
      (q) => Array.isArray(q.options) && q.options.length >= 2
    );

    if (eligible.length < 20) {
      setError(`Daily 20 needs at least 20 questions. ${eligible.length} are currently available.`);
      return;
    }

    const selected = shuffle(eligible).slice(0, 20);
    setSmartQuizSessionId(null);
    await createSmartQuizSession(selected);
    const initialVisited = {};
    if (selected[0]?.id !== undefined) initialVisited[selected[0].id] = true;

    setError("");
    setTestQuestions(selected);
    setCurrent(0);
    setAnswers({});
    answersRef.current = {};
    setMarked({});
    setVisited(initialVisited);
    setDurationSeconds(DAILY_SECONDS);
    setRemaining(DAILY_SECONDS);
    remainingRef.current = DAILY_SECONDS;
    setStartedAt(Date.now());
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    submittingRef.current = false;
    setScreen("test");
  };


  const resumeTest = () => {
    if (!resumeCandidate?.testQuestions?.length) return;

    const liveRemaining = Number(resumeCandidate.remaining);
    if (!Number.isFinite(liveRemaining) || liveRemaining <= 0) {
      try {
        localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
      } catch {}
      setResumeCandidate(null);
      return;
    }

    setTestType(resumeCandidate.testType || "full");
    setYear(resumeCandidate.year || "all");
    setSubject(resumeCandidate.subject || "all");
    setTopic(resumeCandidate.topic || "all");
    setQuestionCount(Number(resumeCandidate.questionCount) || 20);
    setLanguage(resumeCandidate.language === "hi" ? "hi" : "en");
    setDurationSeconds(Number(resumeCandidate.durationSeconds) || TOTAL_SECONDS);
    setTestQuestions(resumeCandidate.testQuestions);
    setCurrent(Math.min(Number(resumeCandidate.current) || 0, resumeCandidate.testQuestions.length - 1));
    setAnswers(resumeCandidate.answers || {});
    answersRef.current = resumeCandidate.answers || {};
    setMarked(resumeCandidate.marked || {});
    setVisited(resumeCandidate.visited || {});
    setRemaining(liveRemaining);
    remainingRef.current = liveRemaining;
    setStartedAt(Number(resumeCandidate.startedAt) || Date.now());
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setShowSubmitConfirm(false);
    setShowQuestionPalette(false);
    setResumeCandidate(null);
    setError("");
    submittingRef.current = false;
    setScreen("test");
  };

  const submitTest = async (forced = false) => {
    if (submittingRef.current || screen !== "test") return;

    submittingRef.current = true;
    setAutoSubmitted(Boolean(forced));
    setFinishedAt(Date.now());
    setScreen("result");

    const liveAnswers = answersRef.current;
    let liveCorrect = 0;
    let liveWrong = 0;

    testQuestions.forEach((q) => {
      const chosen = liveAnswers[q.id];
      if (chosen === undefined || chosen === null) return;
      if (Number(chosen) === Number(q.answer)) liveCorrect += 1;
      else liveWrong += 1;
    });

    const liveUnanswered = testQuestions.length - liveCorrect - liveWrong;
    const liveScore = liveCorrect * MARKS_PER_QUESTION - liveWrong * NEGATIVE_MARKS;
    const liveAccuracy = liveCorrect + liveWrong > 0
      ? (liveCorrect / (liveCorrect + liveWrong)) * 100
      : 0;
    const timeUsed = Math.max(0, durationSeconds - remainingRef.current);

    // Preserve the existing local result history.
    try {
      const history = JSON.parse(localStorage.getItem("sambhav-prelims-history") || "[]");
      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: testType,
        year,
        subject,
        topic,
        total: testQuestions.length,
        correct: liveCorrect,
        wrong: liveWrong,
        unanswered: liveUnanswered,
        score: Number(liveScore.toFixed(2)),
        accuracy: Number(liveAccuracy.toFixed(1)),
        timeUsed,
        durationSeconds,
        questionIds: testQuestions.map((q) => q.id),
      };
      const nextHistory = [entry, ...history].slice(0, 20);
      localStorage.setItem("sambhav-prelims-history", JSON.stringify(nextHistory));
      setHistory(nextHistory);
    } catch (error) {
      console.error("Local quiz history save failed:", error);
    }

    try { localStorage.removeItem(ACTIVE_ATTEMPT_KEY); } catch {}
    setShowSubmitConfirm(false);

    // Save the same questions and answers to Smart Quiz analytics.
    let sessionId = smartQuizSessionId;
    if (!sessionId) sessionId = await createSmartQuizSession(testQuestions);

    if (!sessionId) {
      setError("Test result is saved locally, but Smart Quiz analytics could not be connected. Check question IDs and the API response.");
      return;
    }

    try {
      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          timeTakenSeconds: timeUsed,
          answers: testQuestions.map((q) => {
            const chosen = liveAnswers[q.id];
            return {
              questionId: String(q.id),
              selectedOption: chosen === undefined || chosen === null ? null : Number(chosen),
              isBookmarked: Boolean(marked[q.id]),
              timeTakenSeconds: 0,
            };
          }),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save Smart Quiz analytics.");
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("smart-quiz-updated"));
      }
    } catch (error) {
      console.error("Smart Quiz submission failed:", error);
      setError("Test result is saved locally, but Smart Quiz analytics could not be saved: " + (error?.message || "Unknown error"));
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-prelims-language");
      if (saved === "hi" || saved === "en") setLanguageState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (screen !== "test") return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        remainingRef.current = next;

        if (next === 0) {
          clearInterval(timer);
          setTimeout(() => submitTest(true), 0);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  const chooseAnswer = (index) => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: index };
      answersRef.current = next;
      return next;
    });
  };

  const goToQuestion = (index) => {
    if (index < 0 || index >= testQuestions.length) return;

    const q = testQuestions[index];
    setCurrent(index);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setShowQuestionPalette(false);

    if (q?.id !== undefined) {
      setVisited((prev) => ({
        ...prev,
        [q.id]: true,
      }));
    }
  };

  const toggleMark = () => {
    if (!currentQuestion) return;

    setMarked((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const clearResponse = () => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      answersRef.current = next;
      return next;
    });
  };

  const restart = () => {
    setScreen("center");
    setTestQuestions([]);
    setCurrent(0);
    setAnswers({});
    answersRef.current = {};
    setMarked({});
    setVisited({});
    setDurationSeconds(TOTAL_SECONDS);
    setRemaining(TOTAL_SECONDS);
    remainingRef.current = TOTAL_SECONDS;
    setStartedAt(null);
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setShowSubmitConfirm(false);
    setShowQuestionPalette(false);
    setResumeCandidate(null);
    submittingRef.current = false;
    try {
      localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    } catch {}
  };

  const translateCurrentQuestion = async () => {
    const question = currentQuestion;
    if (!question) return;

    setTranslationError("");

    if (translationQuestionId === question.id && translation) {
      setLanguage("hi");
      return;
    }

    const cacheKey = `sambhav_prelims_translation_v4_${question.id}`;

    try {
      setTranslationLoading(true);

      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.question_hi && Array.isArray(parsed?.options_hi)) {
            setTranslation(parsed);
            setTranslationQuestionId(question.id);
            setLanguage("hi");
            return;
          }
        }
      } catch {}

      const response = await fetch("/api/prelims-translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          question: question.question || "",
          options: question.options || [],
          explanation: question.explanation_en || question.explanation || "",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success || !data?.translation) {
        throw new Error(data?.error || "Translation failed. Please try again.");
      }

      const translated = data.translation;
      setTranslation(translated);
      setTranslationQuestionId(question.id);
      setLanguage("hi");

      try {
        localStorage.setItem(cacheKey, JSON.stringify(translated));
      } catch {}
    } catch (err) {
      setTranslationError(err?.message || "Translation failed. Please try again.");
    } finally {
      setTranslationLoading(false);
    }
  };

  const showEnglish = () => {
    setLanguage("en");
    setTranslationError("");
  };

  useEffect(() => {
    if (screen !== "test" || language !== "hi" || !currentQuestion) return;
    if (translationQuestionId === currentQuestion.id && translation) return;
    translateCurrentQuestion();
  }, [screen, language, currentQuestion?.id, translationQuestionId]);

  const optionText = (q, index) => {
    if (language === "hi" && translationQuestionId === q?.id && translation?.options_hi?.[index]) {
      return translation.options_hi[index];
    }
    if (language === "hi" && Array.isArray(q?.options_hi) && q.options_hi[index]) {
      return q.options_hi[index];
    }
    return q?.options?.[index] ?? "";
  };

  const questionText =
    language === "hi" && translationQuestionId === currentQuestion?.id && translation?.question_hi
      ? translation.question_hi
      : language === "hi" && currentQuestion?.question_hi
      ? currentQuestion.question_hi
      : currentQuestion?.question || "";

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: colors.page,
          color: colors.text,
          display: "grid",
          placeItems: "center",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        Loading Prelims Practice...
      </main>
    );
  }

  if (error && screen === "center") {
    return (
      <main style={pageStyle(colors)}>
        <Header
          colors={colors}
          theme={theme}
          setTheme={setTheme}
          user={user}
          router={router}
        />
        <div style={containerStyle}>
          <div style={cardStyle(colors)}>
            <div style={eyebrow(colors)}>SAMBHAV UPSC • ADVANCED EXAM MODE</div>
            <h1 style={titleStyle(colors)}>Unable to load test</h1>
            <p style={mutedStyle(colors)}>{error}</p>
            <button style={primaryButton(colors)} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "test" && currentQuestion) {
    return (
      <main style={pageStyle(colors)}>
        <div style={testHeaderStyle(colors, isMobile)}>
          <button
            style={backButton(colors)}
            onClick={() => {
              if (window.confirm("Leave this test? Your current attempt will remain saved so you can resume it later.")) {
                setScreen("center");
              }
            }}
          >
            ← Test Center
          </button>

          <div style={{ textAlign: "center" }}>
            <div style={eyebrow(colors)}>PRELIMS TEST</div>
            <strong>
              Question {current + 1} / {testQuestions.length}
            </strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            <div
              style={{
                ...timerStyle(colors),
                ...(remaining <= 300 ? { color: colors.red } : {}),
              }}
            >
              {formatTime(remaining)}
            </div>
          </div>
        </div>

        <div style={testLayoutStyle(colors, isMobile)}>
          <section style={{ ...cardStyle(colors), position: "relative", padding: "18px" }}>
            <div style={questionMetaStyle(colors)}>
              <span>{currentQuestion.year || "PYQ"}</span>
              <span>{currentQuestion.subject || currentQuestion.category || "General Studies"}</span>
              <span>+2 / -0.66</span>
            </div>

            <div style={questionPaletteCorner(colors)}>
              <button
                type="button"
                aria-label="Open question grid"
                onClick={() => setShowQuestionPalette((v) => !v)}
                style={gridToggleButton(colors, showQuestionPalette)}
              >
                ▦ {showQuestionPalette ? "Close" : "Grid"}
              </button>

              {showQuestionPalette ? (
                <div style={questionPalettePopover(colors)}>
                  <div style={eyebrow(colors)}>QUESTION GRID</div>
                  <div style={{ marginTop: 5, color: colors.muted, fontSize: 9, lineHeight: 1.4 }}>
                    Gold = answered • Blue = review • Outline = current
                  </div>
                  <div style={paletteGrid}>
                    {testQuestions.map((q, index) => {
                      const answered = answers[q.id] !== undefined && answers[q.id] !== null;
                      const isMarked = Boolean(marked[q.id]);
                      const active = index === current;
                      return (
                        <button
                          key={q.id ?? index}
                          onClick={() => goToQuestion(index)}
                          style={{
                            ...paletteButton(colors),
                            minHeight: 31,
                            fontSize: 10,
                            ...(answered ? { background: colors.gold, color: colors.goldText } : {}),
                            ...(isMarked && !answered ? { borderColor: colors.blue, color: colors.blue } : {}),
                            ...(active ? { boxShadow: `inset 0 0 0 2px ${colors.text}` } : {}),
                          }}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={questionNumberStyle(colors)}>
              Q{current + 1}
            </div>

            <h1 style={questionStyle(colors)}>{questionText}</h1>

            <div style={translationBar(colors, isMobile)}>
              <button
                style={language === "en" ? smallActiveButton(colors) : smallSecondaryButton(colors)}
                onClick={showEnglish}
              >
                English
              </button>
              <button
                style={language === "hi" ? smallActiveButton(colors) : smallSecondaryButton(colors)}
                onClick={translateCurrentQuestion}
                disabled={translationLoading}
              >
                {translationLoading ? "Translating…" : "हिंदी / Translate"}
              </button>
            </div>

            {translationError ? (
              <div style={translationErrorStyle(colors)}>{translationError}</div>
            ) : null}

            <div style={optionsGridStyle(isMobile)}>
              {(currentQuestion.options || []).map((_, index) => {
                const selected = answers[currentQuestion.id] === index;
                const letter = String.fromCharCode(65 + index);

                return (
                  <button
                    key={index}
                    onClick={() => chooseAnswer(index)}
                    style={{
                      ...optionButton(colors),
                      ...(selected
                        ? {
                            borderColor: colors.gold,
                            background: colors.gold,
                            color: colors.goldText,
                          }
                        : {}),
                    }}
                  >
                    <span style={optionLetter(colors, selected)}>{letter}</span>
                    <span style={{ textAlign: "left", flex: 1 }}>
                      {optionText(currentQuestion, index)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={actionRow}>
              <button style={secondaryButton(colors)} onClick={clearResponse}>
                Clear Response
              </button>

              <button style={secondaryButton(colors)} onClick={toggleMark}>
                {marked[currentQuestion.id] ? "★ Marked" : "☆ Mark for Review"}
              </button>

              <div style={{ flex: 1 }} />

              <button
                style={secondaryButton(colors)}
                disabled={current === 0}
                onClick={() => goToQuestion(current - 1)}
              >
                Previous
              </button>

              {current === testQuestions.length - 1 ? (
                <button style={primaryButton(colors)} onClick={() => setShowSubmitConfirm(true)}>
                  Submit Test
                </button>
              ) : (
                <button
                  style={primaryButton(colors)}
                  onClick={() => goToQuestion(current + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </section>

          <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <div style={cardStyle(colors)}>
              <div style={eyebrow(colors)}>TEST SUMMARY</div>
              <div style={miniStatsGrid}>
                <MiniStat colors={colors} value={answeredCount} label="Answered" />
                <MiniStat colors={colors} value={testQuestions.length - answeredCount} label="Unanswered" />
                <MiniStat colors={colors} value={markedCount} label="Review" />
              </div>
            </div>

            <div style={cardStyle(colors)}>
              <div style={eyebrow(colors)}>LANGUAGE</div>
              <p style={{ margin: "8px 0 0", color: colors.muted, fontSize: 12, lineHeight: 1.55 }}>
                English aur Hindi mode poore question, options aur explanation par apply hota hai.
              </p>
              {translationLoading ? (
                <div style={{ marginTop: 10, color: colors.gold, fontSize: 11, fontWeight: 800 }}>Hindi translation loading…</div>
              ) : null}
            </div>
          </aside>
        </div>

        {showSubmitConfirm ? (
          <div style={modalBackdropStyle}>
            <div style={modalStyle(colors)}>
              <div style={eyebrow(colors)}>SUBMIT TEST</div>
              <h2 style={{ margin: "7px 0 0", fontSize: 21 }}>Submit your test?</h2>
              <p style={{ margin: "8px 0 0", color: colors.muted, lineHeight: 1.6, fontSize: 12 }}>
                {testQuestions.length - answeredCount} questions are unanswered. Once submitted, the current attempt will move to results.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="button" style={{ ...secondaryButton(colors), flex: 1 }} onClick={() => setShowSubmitConfirm(false)}>
                  Continue Test
                </button>
                <button type="button" style={{ ...primaryButton(colors), flex: 1 }} onClick={() => submitTest(false)}>
                  Submit Now
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  if (screen === "result") {
    return (
      <main style={pageStyle(colors)}>
        <Header
          colors={colors}
          theme={theme}
          setTheme={setTheme}
          user={user}
          router={router}
        />

        <div style={containerStyle}>
          <div style={cardStyle(colors)}>
            <div style={eyebrow(colors)}>TEST COMPLETED</div>

            <h1 style={titleStyle(colors)}>
              {autoSubmitted ? "Time Up" : "Test Result"}
            </h1>

            <p style={mutedStyle(colors)}>
              {testQuestions.length} questions • {formatTime(durationSeconds - remaining)} used
            </p>

            <div style={resultHero}>
              <div>
                <div style={resultScore}>{result.score.toFixed(2)}</div>
                <div style={mutedStyle(colors)}>Score</div>
              </div>
              <div>
                <div style={resultScoreSmall}>{result.accuracy.toFixed(1)}%</div>
                <div style={mutedStyle(colors)}>Accuracy</div>
              </div>
            </div>

            <div style={resultGrid}>
              <ResultStat colors={colors} label="Correct" value={result.correct} />
              <ResultStat colors={colors} label="Wrong" value={result.wrong} />
              <ResultStat colors={colors} label="Unanswered" value={result.unanswered} />
              <ResultStat colors={colors} label="Negative Marks" value={`-${result.negative.toFixed(2)}`} />
            </div>

            <div style={{ ...analysisGrid, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
              {result.analysis.subject.length ? (
                <AnalysisCard colors={colors} title="Subject Analysis" items={result.analysis.subject} />
              ) : null}
              {result.analysis.topic.length ? (
                <AnalysisCard colors={colors} title="Topic Analysis" items={result.analysis.topic} />
              ) : null}
              {result.analysis.year.length ? (
                <AnalysisCard colors={colors} title="Year Analysis" items={result.analysis.year} />
              ) : null}
            </div>

            <div style={actionRow}>
              <button style={secondaryButton(colors)} onClick={restart}>
                Test Center
              </button>
              <button style={primaryButton(colors)} onClick={startTest}>
                Retake Test
              </button>
            </div>
          </div>

          <div style={cardStyle(colors)}>
            <div style={eyebrow(colors)}>QUESTION-WISE REVIEW</div>

            <div style={{ display: "grid", gap: 10 }}>
              {testQuestions.map((q, index) => {
                const chosen = answers[q.id];
                const attempted = chosen !== undefined && chosen !== null;
                const correct = attempted && Number(chosen) === Number(q.answer);

                return (
                  <button
                    key={q.id ?? index}
                    onClick={() => {
                      setCurrent(index);
                      setScreen("review");
                    }}
                    style={reviewRow(colors)}
                  >
                    <span style={reviewNumber(colors)}>{index + 1}</span>
                    <span style={{ flex: 1, textAlign: "left" }}>
                      <strong>
                        {correct ? "Correct" : attempted ? "Wrong" : "Unanswered"}
                      </strong>
                      <span style={{ display: "block", color: colors.muted, fontSize: 13 }}>
                        {q.subject || q.category || "General Studies"} • {q.year || "PYQ"}
                      </span>
                    </span>
                    <span>{correct ? "✓" : attempted ? "×" : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "review" && currentQuestion) {
    const chosen = answers[currentQuestion.id];
    const correct = Number(chosen) === Number(currentQuestion.answer);

    return (
      <main style={pageStyle(colors)}>
        <Header
          colors={colors}
          theme={theme}
          setTheme={setTheme}
          user={user}
          router={router}
        />

        <div style={containerStyle}>
          <div style={cardStyle(colors)}>
            <div style={eyebrow(colors)}>QUESTION REVIEW</div>

            <div style={reviewTop}>
              <button style={backButton(colors)} onClick={() => setScreen("result")}>
                ← Results
              </button>
              <span style={{ color: correct ? colors.green : colors.red, fontWeight: 800 }}>
                {chosen === undefined || chosen === null
                  ? "Unanswered"
                  : correct
                  ? "Correct"
                  : "Wrong"}
              </span>
            </div>

            <h1 style={questionStyle(colors)}>
              {currentQuestion.question || ""}
            </h1>

            <div style={{ display: "grid", gap: 10 }}>
              {(currentQuestion.options || []).map((option, index) => {
                const isCorrect = Number(currentQuestion.answer) === index;
                const isChosen = Number(chosen) === index;

                return (
                  <div
                    key={index}
                    style={{
                      ...optionButton(colors),
                      cursor: "default",
                      borderColor: isCorrect
                        ? colors.green
                        : isChosen
                        ? colors.red
                        : colors.border,
                      background: isCorrect
                        ? theme === "dark"
                          ? "#16321e"
                          : "#edf7ef"
                        : isChosen
                        ? theme === "dark"
                          ? "#351919"
                          : "#fff0f0"
                        : colors.card,
                    }}
                  >
                    <span style={optionLetter(colors, isCorrect)}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span style={{ textAlign: "left" }}>{option}</span>
                  </div>
                );
              })}
            </div>

            <DetailedExplanation
              colors={colors}
              question={currentQuestion}
              chosen={chosen}
              language={language}
              translation={translationQuestionId === currentQuestion.id ? translation : null}
            />

            <div style={actionRow}>
              <button
                style={secondaryButton(colors)}
                disabled={current === 0}
                onClick={() => setCurrent((v) => Math.max(0, v - 1))}
              >
                Previous
              </button>
              <button
                style={primaryButton(colors)}
                disabled={current === testQuestions.length - 1}
                onClick={() =>
                  setCurrent((v) => Math.min(testQuestions.length - 1, v + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle(colors)}>
      <Header
        colors={colors}
        theme={theme}
        setTheme={setTheme}
        user={user}
        router={router}
      />

      <div style={minimalContainerStyle}>
        <section style={minimalHeroStyle(colors)}>
          <div style={{ display: "grid", gap: 14, minWidth: 0, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <div style={eyebrow(colors)}>UPSC PRELIMS</div>
                <h1 style={minimalHeroTitle(colors)}>Prelims Practice</h1>
                <p style={minimalHeroSub(colors)}>
                  Real UPSC PYQs, full-length practice, custom tests and performance analysis.
                </p>
                <div style={{ marginTop: 8, color: colors.gold, fontSize: 12, fontWeight: 800, letterSpacing: "0.01em" }}>
                  All the best 👍
                </div>
              </div>

            </div>

            {isPaidOrDemoUser ? (
              <div style={notificationInlineStyle(colors)}>
                <div style={{ minWidth: 0 }}>
                  <div style={eyebrow(colors)}>DAILY 20 • 6 PM</div>
                  <strong style={{ display: "block", marginTop: 3, fontSize: 13 }}>
                    Evening practice reminder
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={toggleDailyNotification}
                  disabled={notificationSaving}
                  style={dailyNotification ? primaryButton(colors) : secondaryButton(colors)}
                >
                  {notificationSaving ? "Saving…" : dailyNotification ? "Enabled" : "Enable"}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <div style={topControlRow}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrow(colors)}>TEST LANGUAGE</div>
            <div style={{ marginTop: 5, color: colors.muted, fontSize: 11 }}>
              Choose your preferred question language.
            </div>
          </div>

          <div style={segmentedStyle(colors)}>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              style={language === "en" ? segmentActiveStyle(colors) : segmentStyle(colors)}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage("hi");
                if (currentQuestion) translateCurrentQuestion();
              }}
              style={language === "hi" ? segmentActiveStyle(colors) : segmentStyle(colors)}
            >
              हिंदी
            </button>
          </div>
        </div>

        {resumeCandidate ? (
          <section style={resumeCardStyle(colors)}>
            <div>
              <div style={eyebrow(colors)}>UNFINISHED TEST</div>
              <h2 style={{ margin: "5px 0 0", fontSize: 18, letterSpacing: "-.025em" }}>
                Resume your Prelims test
              </h2>
              <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: 11, lineHeight: 1.5 }}>
                {resumeCandidate.testQuestions?.length || 0} questions • {formatTime(resumeCandidate.remaining)} remaining
              </p>
            </div>
            <button type="button" style={primaryButton(colors)} onClick={resumeTest}>
              Resume →
            </button>
          </section>
        ) : null}

        <section style={minimalSectionStyle(colors)}>
          <div style={minimalSectionHead}>
            <div>
              <div style={eyebrow(colors)}>TEST SERIES</div>
              <h2 style={minimalSectionTitle(colors)}>Choose a test</h2>
            </div>
            <span style={{ color: colors.muted, fontSize: 11 }}>
              {questions.length} PYQs
            </span>
          </div>

          <div style={testChoiceGrid(isMobile)}>
            <button
              type="button"
              onClick={() => {
                setTestType("full");
                setError("");
              }}
              style={{
                ...minimalChoiceStyle(colors),
                ...(testType === "full" ? minimalChoiceActiveStyle(colors) : {}),
              }}
            >
              <span style={choiceIconStyle(colors)}>01</span>
              <span style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 15 }}>
                  Full UPSC Practice
                </strong>
                <small style={{ display: "block", marginTop: 3, color: colors.muted }}>
                  100 questions • 2 hours • complete exam practice
                </small>
              </span>
              <span style={choiceArrowStyle(colors)}>›</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTestType("paper");
                setError("");
                if (years.includes("2015")) setYear("2015");
              }}
              style={{
                ...minimalChoiceStyle(colors),
                ...(testType === "paper" ? minimalChoiceActiveStyle(colors) : {}),
              }}
            >
              <span style={choiceIconStyle(colors)}>02</span>
              <span style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 15 }}>
                  Original PYQ Paper
                </strong>
                <small style={{ display: "block", marginTop: 3, color: colors.muted }}>
                  Attempt the complete paper year-wise from the existing PYQ bank
                </small>
              </span>
              <span style={choiceArrowStyle(colors)}>›</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTestType("custom");
                setError("");
              }}
              style={{
                ...minimalChoiceStyle(colors),
                ...(testType === "custom" ? minimalChoiceActiveStyle(colors) : {}),
              }}
            >
              <span style={choiceIconStyle(colors)}>03</span>
              <span style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 15 }}>
                  Custom Test
                </strong>
                <small style={{ display: "block", marginTop: 3, color: colors.muted }}>
                  Year • Subject • Topic • question count
                </small>
              </span>
              <span style={choiceArrowStyle(colors)}>›</span>
            </button>
          </div>

          {testType === "paper" && (
            <div style={compactConfigStyle(colors)}>
              <SelectBox
                colors={colors}
                label="Paper Year"
                value={year}
                onChange={setYear}
                options={years}
              />
              <div style={{ color: colors.muted, fontSize: 11, lineHeight: 1.5 }}>
                <strong style={{ color: colors.text }}>2015</strong> is available here when its
                100 questions are present in the existing Supabase PYQ data.
              </div>
            </div>
          )}

          {testType === "custom" && (
            <div style={customConfigGrid}>
              <SelectBox
                colors={colors}
                label="Year"
                value={year}
                onChange={setYear}
                options={years}
              />
              <SelectBox
                colors={colors}
                label="Subject"
                value={subject}
                onChange={(value) => {
                  setSubject(value);
                  setTopic("all");
                }}
                options={subjects}
              />
              <SelectBox
                colors={colors}
                label="Topic"
                value={topic}
                onChange={setTopic}
                options={topics}
              />

              <div>
                <div style={eyebrow(colors)}>QUESTIONS</div>
                <div style={compactCountGrid}>
                  {TEST_OPTIONS.map((count) => (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      style={{
                        ...compactCountStyle(colors),
                        ...(questionCount === count
                          ? {
                              background: colors.gold,
                              color: colors.goldText,
                              borderColor: colors.gold,
                            }
                          : {}),
                      }}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={testSummaryLine(colors)}>
            <span>
              {testType === "full"
                ? "100 questions • 120 minutes"
                : testType === "paper"
                ? `${year === "all" ? "Select a year" : `${year} paper`} • 100 questions`
                : testType === "custom"
                ? `${questionCount} questions • 120 minutes`
                : "20 questions • quick practice"}
            </span>
            <span>+2 / −0.66</span>
          </div>

          <button
            type="button"
            style={{ ...primaryButton(colors), width: "100%", minHeight: 50, marginTop: 12 }}
            onClick={startTest}
          >
            {testType === "paper"
              ? `Start ${year === "all" ? "Original Paper" : year + " Paper"} →`
              : testType === "custom"
              ? "Start Custom Test →"
              : "Start Full Practice →"}
          </button>

          {error ? (
            <div style={{ ...compactErrorStyle(colors), marginTop: 10 }}>
              {error}
            </div>
          ) : null}
        </section>

        <section style={quickSectionStyle(colors)}>
          <div style={minimalSectionHead}>
            <div>
              <div style={eyebrow(colors)}>PRACTICE & HISTORY</div>
              <h2 style={minimalSectionTitle(colors)}>Daily practice & previous tests</h2>
            </div>
          </div>

          <div style={quickGrid}>
            <button
              type="button"
              onClick={() => {
                setTestType("daily");
                setError("");
                startTestForDaily();
              }}
              style={quickItemStyle(colors)}
            >
              <span style={quickIconStyle(colors)}>20</span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <strong style={{ display: "block", fontSize: 14 }}>Daily 20 PYQ</strong>
                <small style={{ display: "block", marginTop: 3, color: colors.muted }}>
                  Daily 20 • 40 min
                </small>
              </span>
              <span style={choiceArrowStyle(colors)}>›</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = document.getElementById("prelims-history");
                target?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={quickItemStyle(colors)}
            >
              <span style={quickIconStyle(colors)}>↺</span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <strong style={{ display: "block", fontSize: 14 }}>Previous Tests</strong>
                <small style={{ display: "block", marginTop: 3, color: colors.muted }}>
                  Score, accuracy and performance
                </small>
              </span>
              <span style={choiceArrowStyle(colors)}>›</span>
            </button>
          </div>
        </section>

        <section id="prelims-history" style={minimalSectionStyle(colors)}>
          <div style={minimalSectionHead}>
            <div>
              <div style={eyebrow(colors)}>PERFORMANCE</div>
              <h2 style={minimalSectionTitle(colors)}>Previous Tests</h2>
            </div>
            <span style={{ color: colors.muted, fontSize: 11 }}>
              {history.length} saved
            </span>
          </div>

          {history.length === 0 ? (
            <div style={minimalEmptyStyle(colors)}>
              Your completed tests will appear here.
            </div>
          ) : (
            <div style={historyGridStyle}>
              {history.slice(0, 6).map((item) => (
                <div key={item.id} style={minimalHistoryRow(colors)}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 13 }}>
                      {getTestLabel(item.type)}
                    </strong>
                    <span style={{ display: "block", marginTop: 3, color: colors.muted, fontSize: 10 }}>
                      {item.year !== "all" && item.year ? `${item.year} • ` : ""}
                      {item.total} Questions • {item.accuracy}% Accuracy
                    </span>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <strong style={{ fontSize: 14 }}>{item.score}</strong>
                    <span style={{ display: "block", marginTop: 3, color: colors.muted, fontSize: 9 }}>
                      {formatHistoryDate(item.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <SmartQuizInsights />

      </div>
    </main>
  );

}

function DetailedExplanation({ colors, question, chosen, language, translation }) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const correctIndex = Number(question?.answer);
  const chosenIndex = chosen === undefined || chosen === null ? null : Number(chosen);
  const explanation = language === "hi"
    ? translation?.explanation_hi || question?.explanation_hi || question?.explanation_en || question?.explanation || ""
    : question?.explanation_en || question?.explanation || "";

  const optionExplanation = (index) => {
    const candidates = [
      question?.option_explanations?.[index],
      question?.optionExplanations?.[index],
      question?.explanations?.[index],
      question?.option_explanation?.[index],
      question?.[`explanation_${String.fromCharCode(97 + index)}`],
      question?.[`option_explanation_${String.fromCharCode(97 + index)}`],
      question?.[`explanation_${String.fromCharCode(65 + index)}`],
    ];
    return candidates.find((value) => value !== undefined && value !== null && String(value).trim()) || "";
  };

  const correctText = options[correctIndex] || "Correct option";
  const selectedText = chosenIndex !== null ? options[chosenIndex] || "Selected option" : "";
  const keywords = Array.from(new Set([
    question?.subject,
    question?.topic,
    ...(Array.isArray(question?.keywords) ? question.keywords : []),
    ...(typeof question?.keywords === "string" ? question.keywords.split(",") : []),
  ].filter(Boolean).map((v) => String(v).trim()).filter(Boolean)));

  const section = (title, body) => (
    <div style={explanationSectionStyle(colors)}>
      <div style={explanationSectionTitle(colors)}>{title}</div>
      <div style={explanationSectionBody(colors)}>{body}</div>
    </div>
  );

  return (
    <div style={detailedExplanationStyle(colors)}>
      <div style={eyebrow(colors)}>DETAILED EXPLANATION</div>
      {section(language === "hi" ? "क्या पूछा गया है" : "What is being asked", explanation || "Source explanation is not available in the current PYQ record.")}
      {section(
        language === "hi" ? "सही उत्तर क्यों?" : "Why is the correct answer correct?",
        <>
          <strong>{String.fromCharCode(65 + correctIndex)}. {correctText}</strong>
          <div style={{ marginTop: 5 }}>{explanation || "The current PYQ record does not contain a separate correct-answer rationale."}</div>
        </>
      )}
      {chosenIndex !== null && chosenIndex !== correctIndex ? section(
        language === "hi" ? "आपका उत्तर गलत क्यों है?" : "Why is the selected answer incorrect?",
        <>
          <strong>{String.fromCharCode(65 + chosenIndex)}. {selectedText}</strong>
          <div style={{ marginTop: 5 }}>
            {optionExplanation(chosenIndex) || (language === "hi"
              ? "इस विकल्प के लिए अलग option-level explanation वर्तमान PYQ data में उपलब्ध नहीं है।"
              : "A separate option-level rationale is not present in the current PYQ data.")}
          </div>
        </>
      ) : null}
      {section(language === "hi" ? "चारों विकल्पों का विश्लेषण" : "Why each option is correct or incorrect", (
        <div style={{ display: "grid", gap: 8 }}>
          {options.map((option, index) => {
            const isCorrect = index === correctIndex;
            const detail = optionExplanation(index);
            return (
              <div key={index} style={optionExplanationRow(colors, isCorrect)}>
                <strong>{String.fromCharCode(65 + index)}. {isCorrect ? (language === "hi" ? "सही" : "Correct") : (language === "hi" ? "गलत" : "Incorrect")}</strong>
                <span>{option}</span>
                <small>
                  {detail || (isCorrect
                    ? (language === "hi" ? explanation || "स्रोत में सामान्य explanation उपलब्ध है।" : explanation || "The source provides the general explanation above.")
                    : (language === "hi" ? "अलग option-level कारण वर्तमान PYQ data में उपलब्ध नहीं है।" : "No separate option-level rationale is present in the current PYQ data."))}
                </small>
              </div>
            );
          })}
        </div>
      ))}
      {section(language === "hi" ? "मुख्य Keywords" : "Key Keywords", (
        <div style={keywordListStyle}>
          {(keywords.length ? keywords : ["UPSC Prelims PYQ"]).map((keyword) => (
            <span key={keyword} style={keywordChipStyle(colors)}>{keyword}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Header({ colors, theme, setTheme, user, router }) {
  const initial = String(user?.name || user?.email || "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header style={headerStyle(colors)}>
      <button
        onClick={() => router.push("/premium/home")}
        style={brandButton(colors)}
      >
        <div style={brand(colors)}>
          SAMBHAV <span style={{ color: colors.gold }}>UPSC</span>
        </div>
        <div style={brandSub(colors)}>Intelligence • Preparation • Performance</div>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={themeButton(colors)}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>

        <button
          onClick={() => router.push("/premium/home")}
          style={avatarButton(colors)}
          aria-label="Open profile"
        >
          {initial}
        </button>
      </div>
    </header>
  );
}

function TestTypeCard({ colors, active, title, subtitle, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...testTypeCard(colors),
        ...(active
          ? {
              borderColor: colors.gold,
              boxShadow: `0 0 0 1px ${colors.gold}`,
            }
          : {}),
      }}
    >
      <span style={typeIcon}>{icon}</span>
      <span style={{ textAlign: "left" }}>
        <strong style={{ display: "block", fontSize: 16 }}>{title}</strong>
        <small style={{ display: "block", color: colors.muted, marginTop: 5 }}>
          {subtitle}
        </small>
      </span>
    </button>
  );
}

function SelectBox({ colors, label, value, onChange, options }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={eyebrow(colors)}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle(colors)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? `All ${label}s` : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AnalysisCard({ colors, title, items }) {
  return (
    <div style={analysisCardStyle(colors)}>
      <div style={eyebrow(colors)}>{title}</div>
      <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
        {items.map((item) => (
          <div key={item.label} style={analysisRowStyle(colors)}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
            <span style={{ color: colors.muted, whiteSpace: "nowrap" }}>
              {item.correct}/{item.total} • {item.accuracy.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ colors, value, label }) {
  return (
    <div style={miniStatStyle(colors)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ResultStat({ colors, label, value }) {
  return (
    <div style={resultStatStyle(colors)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InfoItem({ colors, label, value }) {
  return (
    <div style={infoItemStyle(colors)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HowItem({ colors, number, title, text }) {
  return (
    <div style={howItemStyle(colors)}>
      <div style={howNumber(colors)}>{number}</div>
      <div>
        <strong>{title}</strong>
        <p style={{ margin: "5px 0 0", color: colors.muted, lineHeight: 1.55 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function getTestLabel(type) {
  const labels = {
    pyq: "PYQ Test",
    full: "Full Length Test",
    subject: "Subject Test",
    topic: "Topic Test",
    mock: "Mock Test",
    paper: "Original PYQ Paper",
    daily: "Daily 20 PYQ",
  };
  return labels[type] || "Prelims Test";
}

function formatHistoryDate(value) {
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

const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  background: "rgba(0,0,0,.48)",
  display: "grid",
  placeItems: "center",
  padding: 18,
};

const modalStyle = (c) => ({
  width: "min(100%, 430px)",
  background: c.card,
  color: c.text,
  border: `1px solid ${c.border}`,
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 24px 70px rgba(0,0,0,.28)",
});

const resumeCardStyle = (c) => ({
  ...cardStyle(c),
  padding: "16px 17px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 10,
  borderColor: c.gold,
});

const analysisGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 14,
};

const analysisCardStyle = (c) => ({
  border: `1px solid ${c.border}`,
  background: c.card2,
  borderRadius: 14,
  padding: 12,
  minWidth: 0,
});

const analysisRowStyle = (c) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 10,
  lineHeight: 1.35,
});

const pageStyle = (c) => ({
  minHeight: "100vh",
  background: c.page,
  color: c.text,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  transition: "background .2s ease, color .2s ease",
});

const headerStyle = (c) => ({
  minHeight: 76,
  padding: "14px clamp(16px, 4vw, 42px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: `1px solid ${c.border}`,
  background: c.page,
  position: "sticky",
  top: 0,
  zIndex: 20,
  backdropFilter: "blur(14px)",
});

const brandButton = (c) => ({
  border: 0,
  background: "transparent",
  padding: 0,
  color: c.text,
  cursor: "pointer",
  textAlign: "left",
});

const brand = (c) => ({
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: "-0.04em",
});

const brandSub = (c) => ({
  marginTop: 3,
  color: c.muted,
  fontSize: 11,
  letterSpacing: ".04em",
});

const themeButton = (c) => ({
  width: 38,
  height: 38,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontSize: 18,
});

const avatarButton = (c) => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontWeight: 900,
});

const containerStyle = {
  width: "min(1180px, calc(100% - 28px))",
  margin: "0 auto",
  padding: "28px 0 48px",
  display: "grid",
  gap: 18,
};

const cardStyle = (c) => ({
  background: c.card,
  border: `1px solid ${c.border}`,
  borderRadius: 22,
  padding: "clamp(18px, 3vw, 30px)",
  boxShadow: c.page === "#0b0b0b"
    ? "0 18px 50px rgba(0,0,0,.28)"
    : "0 12px 36px rgba(16,16,16,.06)",
  overflow: "hidden",
});

const heroCard = (c) => ({
  ...cardStyle(c),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  background: c.card2,
});

const heroTitle = (c) => ({
  margin: "7px 0 8px",
  fontSize: "clamp(30px, 5vw, 48px)",
  lineHeight: 1,
  letterSpacing: "-.05em",
});

const heroSub = (c) => ({
  margin: 0,
  color: c.muted,
  maxWidth: 680,
  lineHeight: 1.6,
});

const heroBadge = (c) => ({
  minWidth: 82,
  padding: 15,
  borderRadius: 18,
  border: `1px solid ${c.border}`,
  background: c.card,
  textAlign: "center",
  display: "grid",
  gap: 2,
});

const eyebrow = (c) => ({
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: ".12em",
  color: c.muted,
  textTransform: "uppercase",
});

const titleStyle = (c) => ({
  margin: "8px 0",
  fontSize: "clamp(28px, 5vw, 42px)",
  letterSpacing: "-.04em",
});

const sectionHeading = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "end",
  marginBottom: 18,
};

const sectionTitle = (c) => ({
  margin: "5px 0 0",
  fontSize: 24,
  letterSpacing: "-.03em",
});

const mutedStyle = (c) => ({
  color: c.muted,
  lineHeight: 1.55,
});

const typeGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const testTypeCard = (c) => ({
  minHeight: 100,
  borderRadius: 16,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  padding: 16,
  display: "flex",
  alignItems: "center",
  gap: 14,
  cursor: "pointer",
});

const typeIcon = {
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  borderRadius: 13,
  background: "#dfc47722",
  fontSize: 20,
};

const filterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 18,
};

const selectStyle = (c) => ({
  width: "100%",
  minHeight: 46,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  padding: "0 12px",
  outline: "none",
});

const countGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 9,
};

const countButton = (c) => ({
  minHeight: 44,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontWeight: 800,
});

const testInfoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
  marginTop: 20,
};

const infoItemStyle = (c) => ({
  border: `1px solid ${c.border}`,
  borderRadius: 13,
  padding: 12,
  background: c.card2,
  display: "grid",
  gap: 5,
});

const filterInfo = (c) => ({
  minHeight: 46,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card2,
  padding: "9px 12px",
  display: "grid",
  gap: 2,
  alignContent: "center",
});

const historyRow = (c) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  minHeight: 58,
  padding: "9px 12px",
  borderRadius: 13,
  border: `1px solid ${c.border}`,
  background: c.card2,
});

const emptyHistory = (c) => ({
  padding: 18,
  borderRadius: 14,
  border: `1px dashed ${c.border}`,
  color: c.muted,
  textAlign: "center",
});

const howGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  marginTop: 16,
};

const howItemStyle = (c) => ({
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
});

const howNumber = (c) => ({
  minWidth: 38,
  height: 38,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: c.gold,
  color: c.goldText,
  fontWeight: 900,
  fontSize: 12,
});

const primaryButton = (c) => ({
  minHeight: 44,
  padding: "0 18px",
  borderRadius: 12,
  border: `1px solid ${c.gold}`,
  background: c.gold,
  color: c.goldText,
  cursor: "pointer",
  fontWeight: 900,
});

const secondaryButton = (c) => ({
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontWeight: 800,
});

const backButton = (c) => ({
  border: 0,
  background: "transparent",
  color: c.text,
  cursor: "pointer",
  fontWeight: 800,
  padding: 0,
});

const testHeaderStyle = (c, mobile = false) => ({
  minHeight: 68,
  padding: "10px clamp(14px, 3vw, 32px)",
  display: "grid",
  gridTemplateColumns: mobile ? "auto minmax(0, 1fr) auto" : "1fr auto 1fr",
  alignItems: "center",
  gap: 12,
  borderBottom: `1px solid ${c.border}`,
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: c.page,
});

const timerStyle = (c) => ({
  justifySelf: "end",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 900,
  fontSize: 17,
});

const testLayoutStyle = (c, mobile = false) => ({
  width: mobile ? "calc(100% - 24px)" : "min(1280px, calc(100% - 28px))",
  margin: mobile ? "12px auto 28px" : "20px auto 40px",
  display: "grid",
  gridTemplateColumns: mobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) 310px",
  gap: mobile ? 12 : 18,
});

const translationBar = (c, mobile = false) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  margin: mobile ? "-8px 0 18px" : "-10px 0 20px",
});

const smallActiveButton = (c) => ({
  minHeight: 36,
  padding: "0 13px",
  borderRadius: 10,
  border: `1px solid ${c.gold}`,
  background: c.gold,
  color: c.goldText,
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 12,
});

const smallSecondaryButton = (c) => ({
  minHeight: 36,
  padding: "0 13px",
  borderRadius: 10,
  border: `1px solid ${c.border}`,
  background: c.card2,
  color: c.text,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
});

const translationErrorStyle = (c) => ({
  margin: "-8px 0 18px",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${c.red}`,
  background: c.red + "12",
  color: c.red,
  fontSize: 12,
  lineHeight: 1.5,
});

const questionMetaStyle = (c) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  color: c.muted,
  fontSize: 12,
  marginBottom: 22,
});

const questionNumberStyle = (c) => ({
  display: "inline-grid",
  placeItems: "center",
  minWidth: 42,
  height: 30,
  padding: "0 10px",
  borderRadius: 10,
  background: c.gold,
  color: c.goldText,
  fontSize: 12,
  fontWeight: 900,
});

const questionStyle = (c) => ({
  margin: "12px 0 16px",
  fontSize: "clamp(17px, 2.4vw, 23px)",
  lineHeight: 1.48,
  letterSpacing: "-.02em",
});

const optionButton = (c) => ({
  width: "100%",
  minHeight: 48,
  padding: "8px 10px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1.42,
});

const optionLetter = (c, active = false) => ({
  width: 32,
  height: 32,
  flex: "0 0 32px",
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: active ? "#111" : c.soft,
  color: active ? "#fff" : c.text,
  fontWeight: 900,
});

const actionRow = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 9,
  marginTop: 24,
};

const miniStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginTop: 12,
};

const miniStatStyle = (c) => ({
  border: `1px solid ${c.border}`,
  borderRadius: 12,
  padding: 12,
  textAlign: "center",
  display: "grid",
  gap: 4,
});

const gridToggleButton = (c, active = false) => ({
  minHeight: 34,
  padding: "0 10px",
  borderRadius: 10,
  border: `1px solid ${active ? c.gold : c.border}`,
  background: active ? c.goldSoft : c.card2,
  color: active ? c.gold : c.text,
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 11,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
});

const optionsGridStyle = (mobile = false) => ({
  display: "grid",
  gridTemplateColumns: mobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  gap: 10,
});

const testChoiceGrid = (mobile = false) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
});

const notificationInlineStyle = (c) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "9px 10px",
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card,
});

const historyGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const questionPaletteCorner = (c) => ({
  position: "absolute",
  top: 14,
  right: 14,
  zIndex: 5,
});

const questionPalettePopover = (c) => ({
  position: "absolute",
  top: 40,
  right: 0,
  width: "min(330px, calc(100vw - 44px))",
  padding: 11,
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card,
  boxShadow: "0 18px 50px rgba(0,0,0,.24)",
  zIndex: 30,
});

const detailedExplanationStyle = (c) => ({
  marginTop: 14,
  padding: 13,
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card2,
  display: "grid",
  gap: 9,
});

const explanationSectionStyle = (c) => ({
  padding: "10px 11px",
  borderRadius: 11,
  border: `1px solid ${c.border}`,
  background: c.card,
  display: "grid",
  gap: 5,
});

const explanationSectionTitle = (c) => ({
  fontSize: 11,
  fontWeight: 900,
  color: c.gold,
  letterSpacing: ".02em",
});

const explanationSectionBody = (c) => ({
  color: c.text,
  fontSize: 12,
  lineHeight: 1.65,
});

const optionExplanationRow = (c, correct) => ({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "3px 8px",
  padding: "8px 9px",
  borderRadius: 10,
  border: `1px solid ${correct ? c.green : c.border}`,
  background: correct ? (c.page === "#0b0b0b" ? "#16321e" : "#edf7ef") : c.card2,
  color: c.text,
  fontSize: 11,
});

const keywordListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const keywordChipStyle = (c) => ({
  padding: "5px 8px",
  borderRadius: 999,
  border: `1px solid ${c.border}`,
  background: c.soft,
  color: c.text,
  fontSize: 10,
  fontWeight: 800,
});


const paletteGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
  gap: 7,
  marginTop: 12,
};

const paletteButton = (c) => ({
  minHeight: 36,
  borderRadius: 9,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontWeight: 800,
});

const resultHero = {
  display: "flex",
  alignItems: "center",
  gap: 55,
  margin: "26px 0",
};

const resultScore = {
  fontSize: 56,
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-.06em",
};

const resultScoreSmall = {
  fontSize: 36,
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-.05em",
};

const resultGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const resultStatStyle = (c) => ({
  border: `1px solid ${c.border}`,
  borderRadius: 14,
  padding: 15,
  display: "grid",
  gap: 5,
  background: c.card2,
});

const reviewRow = (c) => ({
  width: "100%",
  minHeight: 58,
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: `1px solid ${c.border}`,
  borderRadius: 13,
  background: c.card,
  color: c.text,
  padding: "8px 11px",
  cursor: "pointer",
});

const reviewNumber = (c) => ({
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  borderRadius: 9,
  background: c.soft,
  fontWeight: 900,
});

const reviewTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 15,
};


const minimalContainerStyle = {
  width: "min(920px, calc(100% - 28px))",
  margin: "0 auto",
  padding: "22px 0 90px",
  display: "grid",
  gap: 14,
};

const minimalHeroStyle = (c) => ({
  ...cardStyle(c),
  padding: "18px",
  display: "block",
  background: c.card2,
});

const minimalHeroTitle = (c) => ({
  margin: "6px 0 5px",
  fontSize: "clamp(28px, 7vw, 38px)",
  lineHeight: 1.02,
  letterSpacing: "-.045em",
});

const minimalHeroSub = (c) => ({
  margin: 0,
  color: c.muted,
  fontSize: 12,
  lineHeight: 1.5,
  maxWidth: 520,
});

const markBadgeStyle = (c) => ({
  flex: "0 0 auto",
  minWidth: 70,
  padding: "11px 10px",
  borderRadius: 16,
  border: `1px solid ${c.border}`,
  background: c.card,
  display: "grid",
  gap: 2,
  textAlign: "center",
  fontSize: 13,
});

const topControlRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "2px 3px",
};

const segmentedStyle = (c) => ({
  display: "flex",
  gap: 3,
  padding: 3,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  background: c.card2,
  flexShrink: 0,
});

const segmentStyle = (c) => ({
  border: 0,
  background: "transparent",
  color: c.muted,
  minHeight: 32,
  padding: "0 11px",
  borderRadius: 9,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 800,
});

const segmentActiveStyle = (c) => ({
  ...segmentStyle(c),
  background: c.gold,
  color: c.goldText,
});

const minimalSectionStyle = (c) => ({
  ...cardStyle(c),
  padding: "18px",
});

const quickSectionStyle = (c) => ({
  ...cardStyle(c),
  padding: "16px",
  background: c.card2,
});

const minimalSectionHead = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 13,
};

const minimalSectionTitle = (c) => ({
  margin: "5px 0 0",
  fontSize: 21,
  letterSpacing: "-.035em",
});

const minimalChoiceStyle = (c) => ({
  width: "100%",
  minHeight: 70,
  padding: "10px 12px",
  borderRadius: 15,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  display: "flex",
  alignItems: "center",
  gap: 11,
  cursor: "pointer",
  textAlign: "left",
});

const minimalChoiceActiveStyle = (c) => ({
  borderColor: c.gold,
  boxShadow: `inset 0 0 0 1px ${c.gold}`,
});

const choiceIconStyle = (c) => ({
  width: 32,
  height: 32,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: c.soft,
  color: c.text,
  fontSize: 9,
  fontWeight: 900,
  flexShrink: 0,
});

const choiceArrowStyle = (c) => ({
  color: c.gold,
  fontSize: 22,
  lineHeight: 1,
  flexShrink: 0,
});

const compactConfigStyle = (c) => ({
  marginTop: 11,
  padding: 12,
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card2,
  display: "grid",
  gap: 10,
});

const customConfigGrid = {
  marginTop: 11,
  padding: 12,
  borderRadius: 14,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  background: "transparent",
};

const compactCountGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 5,
  marginTop: 7,
};

const compactCountStyle = (c) => ({
  minHeight: 39,
  borderRadius: 10,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 850,
});

const testSummaryLine = (c) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 13,
  paddingTop: 12,
  borderTop: `1px solid ${c.border}`,
  color: c.muted,
  fontSize: 10,
  fontWeight: 750,
});

const compactErrorStyle = (c) => ({
  padding: "10px 12px",
  borderRadius: 11,
  border: `1px solid ${c.red}`,
  background: c.red + "12",
  color: c.red,
  fontSize: 11,
  lineHeight: 1.45,
});

const quickGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const quickItemStyle = (c) => ({
  minHeight: 62,
  padding: "9px 11px",
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
});

const quickIconStyle = (c) => ({
  width: 32,
  height: 32,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: c.soft,
  color: c.text,
  fontSize: 10,
  fontWeight: 900,
  flexShrink: 0,
});

const minimalEmptyStyle = (c) => ({
  padding: "16px 12px",
  borderRadius: 13,
  border: `1px dashed ${c.border}`,
  color: c.muted,
  textAlign: "center",
  fontSize: 11,
});

const minimalHistoryRow = (c) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  minHeight: 57,
  padding: "8px 11px",
  borderRadius: 13,
  border: `1px solid ${c.border}`,
  background: c.card2,
});


export const dynamic = "force-dynamic";
