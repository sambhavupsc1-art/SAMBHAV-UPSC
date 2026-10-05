// app/prelims-test/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TEST_OPTIONS = [20, 30, 50, 75, 100];
const MARKS_PER_QUESTION = 2;
const NEGATIVE_MARKS = 2 / 3;
const TOTAL_SECONDS = 2 * 60 * 60;

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
  const [testType, setTestType] = useState("pyq");
  const [advancedMode, setAdvancedMode] = useState(true);
  const [year, setYear] = useState("all");
  const [subject, setSubject] = useState("all");
  const [topic, setTopic] = useState("all");
  const [questionCount, setQuestionCount] = useState(25);
  const [history, setHistory] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [dailyNotification, setDailyNotification] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [language, setLanguage] = useState("en");

  const [testQuestions, setTestQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({});
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const [theme, setTheme] = useState("light");
  const [isMobile, setIsMobile] = useState(false);
  const submittingRef = useRef(false);
  const submitTestRef = useRef(null);

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
          page: "#f5f2eb",
          card: "#fffdf9",
          card2: "#f8f4eb",
          text: "#111",
          muted: "#716e67",
          border: "#e3ded2",
          gold: "#dfc477",
          goldText: "#17130b",
          soft: "#f0ece3",
          green: "#287442",
          red: "#b33434",
          blue: "#315caa",
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
    try {
      const saved = JSON.parse(localStorage.getItem("sambhav-prelims-history") || "[]");
      setHistory(Array.isArray(saved) ? saved : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/current-affairs/notifications?user_id=${encodeURIComponent(user.id)}`, { credentials: "include", cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const item = Array.isArray(data?.notifications) ? data.notifications[0] : data?.notification;
        if (item) setDailyNotification(Boolean(item.enabled));
      } catch {}
    })();
  }, [user]);

  const toggleDailyNotification = async () => {
    if (!user?.id || notificationSaving) return;
    const next = !dailyNotification;
    setNotificationSaving(true);
    try {
      const res = await fetch("/api/current-affairs/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, enabled: next, language, notification_time: "18:00" }),
      });
      if (!res.ok) throw new Error("notification save failed");
      setDailyNotification(next);
    } catch (e) {
      console.error("Daily PYQ notification error:", e);
    } finally {
      setNotificationSaving(false);
    }
  };

  useEffect(() => {
    try { setHasResume(Boolean(localStorage.getItem("sambhav-prelims-active"))); } catch { setHasResume(false); }
  }, [screen]);

  // Restore an unfinished exam attempt after the question bank is loaded.
  useEffect(() => {
    if (!questions.length || screen !== "center") return;
    try {
      const raw = localStorage.getItem("sambhav-prelims-active");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.testQuestions?.length) return;
      const ids = new Set(questions.map((q) => String(q.id)));
      const valid = saved.testQuestions.every((q) => ids.has(String(q.id)));
      if (!valid || Number(saved.remaining) <= 0) return;
      setTestQuestions(saved.testQuestions);
      setCurrent(Math.min(Number(saved.current) || 0, saved.testQuestions.length - 1));
      setAnswers(saved.answers || {});
      setMarked(saved.marked || {});
      setVisited(saved.visited || {});
      setRemaining(Number(saved.remaining) || TOTAL_SECONDS);
      setStartedAt(saved.startedAt || Date.now());
      setFinishedAt(null);
      setAutoSubmitted(false);
      setTestType(saved.testType || "pyq");
      setYear(saved.year || "all");
      setSubject(saved.subject || "all");
      setTopic(saved.topic || "all");
      setQuestionCount(Number(saved.questionCount) || 20);
      setLanguage(saved.language === "hi" ? "hi" : "en");
      setScreen("test");
      setHasResume(false);
    } catch {}
  }, [questions, screen]);

  // Persist the current exam so refresh/reopen does not destroy progress.
  useEffect(() => {
    if (screen !== "test" || !testQuestions.length) return;
    try {
      localStorage.setItem(
        "sambhav-prelims-active",
        JSON.stringify({
          testQuestions, current, answers, marked, visited, remaining, startedAt,
          testType, year, subject, topic, questionCount, language,
        })
      );
    } catch {}
  }, [screen, testQuestions, current, answers, marked, visited, remaining, startedAt, testType, year, subject, topic, questionCount, language]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const qYear = String(q?.year ?? "");
      const qSubject = String(q?.subject || q?.category || "");
      const qTopic = String(q?.topic || "");

      const yearOk = year === "all" || qYear === year;
      const subjectOk = subject === "all" || qSubject === subject;
      const topicOk = topic === "all" || qTopic === topic;

      if (testType === "custom" && year === "all" && subject === "all" && topic === "all") return false;

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
    ? Math.max(0, TOTAL_SECONDS - remaining)
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

    return {
      correct,
      wrong,
      unanswered,
      positive,
      negative,
      score,
      accuracy,
    };
  }, [answers, testQuestions]);

  const resultAnalysis = useMemo(() => {
    const build = (key) => {
      const map = {};
      testQuestions.forEach((q) => {
        const name = String(q?.[key] || "General");
        if (!map[name]) map[name] = { name, total: 0, correct: 0, wrong: 0 };
        map[name].total += 1;
        const chosen = answers[q.id];
        if (chosen !== undefined && chosen !== null) {
          if (Number(chosen) === Number(q.answer)) map[name].correct += 1;
          else map[name].wrong += 1;
        }
      });
      return Object.values(map).sort((a, b) => b.total - a.total);
    };
    return { subject: build("subject"), topic: build("topic"), year: build("year") };
  }, [testQuestions, answers]);

  const startTest = () => {
    if (testType === "custom" && year === "all" && subject === "all" && topic === "all") {
      setError("Please select at least one Year, Subject or Topic for Custom Test.");
      return;
    }

    if (testType === "topic" && topic === "all") {
      setError("Please select a topic for Topic Test.");
      return;
    }

    if ((testType === "pyq" || testType === "original") && year === "all") {
      setError("Please select a year for the selected PYQ mode.");
      return;
    }

    if (!filteredQuestions.length) {
      setError("No questions are available for the selected filters.");
      return;
    }

    const sourceQuestions =
      testType === "full" || testType === "mock" || testType === "daily"
        ? questions
        : testType === "original"
        ? questions.filter((q) => String(q?.year ?? "") === String(year))
        : filteredQuestions;

    const eligible = sourceQuestions.filter(
      (q) => Array.isArray(q.options) && q.options.length >= 4
    );

    if (!eligible.length) {
      setError("No complete MCQ records are available for this selection.");
      return;
    }

    let selected = [];

    if (testType === "original") {
      // Original Paper preserves the database order for the selected year.
      selected = [...eligible];
      if (selected.length < 100) {
        setError(`Selected year has only ${selected.length} complete questions available. A full UPSC paper needs 100.`);
        return;
      }
      selected = selected.slice(0, 100);
    } else if (testType === "daily") {
      // Stable daily set: same 20 questions for the same date, different on a new date.
      const dateKey = new Date().toISOString().slice(0, 10);
      let seed = Array.from(dateKey).reduce((acc, ch) => ((acc * 31) + ch.charCodeAt(0)) >>> 0, 2166136261);
      const seeded = [...eligible].sort((a, b) => {
        const hash = (id) => {
          let h = seed;
          for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
          return h;
        };
        return hash(a.id) - hash(b.id);
      });
      selected = seeded.slice(0, Math.min(20, seeded.length));
    } else {
      const count =
        testType === "full" || testType === "mock"
          ? Math.min(100, eligible.length)
          : Math.min(Number(questionCount), eligible.length);
      selected = shuffle(eligible).slice(0, count);
    }

    if (selected.length === 0) {
      setError("No questions are available for this test.");
      return;
    }

    const initialVisited = {};
    if (selected[0]?.id !== undefined) initialVisited[selected[0].id] = true;

    setError("");
    setTestQuestions(selected);
    setCurrent(0);
    setAnswers({});
    setMarked({});
    setVisited(initialVisited);
    setRemaining(testType === "daily" ? 30 * 60 : TOTAL_SECONDS);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setLanguage("en");
    submittingRef.current = false;
    setScreen("test");
  };

  const submitTest = (forced = false) => {
    if (submittingRef.current || screen !== "test") return;
    if (!forced && !window.confirm("Submit this test now? Unanswered questions will remain unattempted.")) return;

    submittingRef.current = true;
    setAutoSubmitted(Boolean(forced));
    setFinishedAt(Date.now());
    setScreen("result");

    try {
      const history = JSON.parse(localStorage.getItem("sambhav-prelims-history") || "[]");

      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: testType,
        year,
        subject,
        total: testQuestions.length,
        correct: result.correct,
        wrong: result.wrong,
        unanswered: result.unanswered,
        score: Number(result.score.toFixed(2)),
        accuracy: Number(result.accuracy.toFixed(1)),
        timeUsed: TOTAL_SECONDS - remaining,
      };

      localStorage.setItem(
        "sambhav-prelims-history",
        JSON.stringify([entry, ...history].slice(0, 20))
      );
      localStorage.removeItem("sambhav-prelims-active");
    } catch {}
  };

  submitTestRef.current = submitTest;

  useEffect(() => {
    if (screen !== "test") return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => submitTestRef.current?.(true), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  const chooseAnswer = (index) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: index,
    }));
  };

  const goToQuestion = (index) => {
    if (index < 0 || index >= testQuestions.length) return;

    const q = testQuestions[index];
    setCurrent(index);

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
      return next;
    });
  };

  const restart = () => {
    try { localStorage.removeItem("sambhav-prelims-active"); } catch {}
    setScreen("center");
    setTestQuestions([]);
    setCurrent(0);
    setAnswers({});
    setMarked({});
    setVisited({});
    setRemaining(TOTAL_SECONDS);
    setStartedAt(null);
    setFinishedAt(null);
    setAutoSubmitted(false);
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setLanguage("en");
    submittingRef.current = false;
  };

  const translateCurrentQuestion = async () => {
    const question = currentQuestion;
    if (!question) return;

    setTranslationError("");

    if (translationQuestionId === question.id && translation) {
      setLanguage("hi");
      return;
    }

    const cacheKey = `sambhav_translation_v2_${question.id}`;

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

      const response = await fetch("/api/translate", {
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
              if (window.confirm("Exit this test? Your current progress will be saved and can be resumed.")) setScreen("center");
            }}
          >
            ← Test Center
          </button>

          <div style={{ textAlign: "center" }}>
            <div style={eyebrow(colors)}>PRELIMS PRACTICE</div>
            <strong>
              Question {current + 1} / {testQuestions.length}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
            <button type="button" onClick={() => setLanguage("en")} style={language === "en" ? smallActiveButton(colors) : smallSecondaryButton(colors)}>EN</button>
            <button type="button" onClick={translateCurrentQuestion} disabled={translationLoading} style={language === "hi" ? smallActiveButton(colors) : smallSecondaryButton(colors)}>HI</button>
          </div>

          <div
            style={{
              ...timerStyle(colors),
              ...(remaining <= 300 ? { color: colors.red } : {}),
            }}
          >
            {formatTime(remaining)}
          </div>
        </div>

        <div style={testLayoutStyle(colors, isMobile)}>
          <section style={cardStyle(colors)}>
            <div style={questionMetaStyle(colors)}>
              <span>{currentQuestion.year || "PYQ"}</span>
              <span>{currentQuestion.subject || currentQuestion.category || "General Studies"}</span>
              <span>+2 / -0.66</span>
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

            <div style={{ display: "grid", gap: 12 }}>
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
                <button style={primaryButton(colors)} onClick={() => submitTest(false)}>
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
              <div style={eyebrow(colors)}>QUESTION PALETTE</div>
              <div style={paletteGrid}>
                {testQuestions.map((q, index) => {
                  const answered =
                    answers[q.id] !== undefined && answers[q.id] !== null;
                  const isMarked = Boolean(marked[q.id]);
                  const active = index === current;

                  return (
                    <button
                      key={q.id ?? index}
                      onClick={() => goToQuestion(index)}
                      style={{
                        ...paletteButton(colors),
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

            <div style={cardStyle(colors)}>
              <div style={eyebrow(colors)}>LANGUAGE</div>
              <p style={{ margin: "8px 0 0", color: colors.muted, fontSize: 13, lineHeight: 1.55 }}>
                Translate the current UPSC question and options into exam-standard Hindi.
              </p>
              <button
                style={{ ...primaryButton(colors), width: "100%", marginTop: 12 }}
                onClick={translateCurrentQuestion}
                disabled={translationLoading}
              >
                {translationLoading ? "Translating…" : language === "hi" ? "Hindi Translation Active" : "Translate to Hindi"}
              </button>
            </div>
          </aside>
        </div>
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
              {testQuestions.length} questions • {formatTime(TOTAL_SECONDS - remaining)} used
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
            <div style={eyebrow(colors)}>PERFORMANCE ANALYSIS</div>
            <h2 style={sectionTitle(colors)}>Subject / Topic / Year breakdown</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {resultAnalysis.subject.map((item) => (
                <div key={item.name} style={historyRow(colors)}>
                  <div><strong>{item.name}</strong><span style={{ display: "block", color: colors.muted, fontSize: 11 }}>{item.total} Questions • {item.correct} Correct • {item.wrong} Wrong</span></div>
                  <strong>{item.total ? Math.round((item.correct / item.total) * 100) : 0}%</strong>
                </div>
              ))}
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

            {(currentQuestion.explanation_en || currentQuestion.explanation) && (
              <div style={explanationBox(colors)}>
                <div style={eyebrow(colors)}>EXPLANATION</div>
                <p style={{ margin: 0, lineHeight: 1.7 }}>
                  {currentQuestion.explanation_en || currentQuestion.explanation}
                </p>
              </div>
            )}

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

      <div style={containerStyle}>
        <section style={heroCard(colors)}>
          <div>
            <div style={eyebrow(colors)}>SAMBHAV UPSC • PRELIMS</div>
            <h1 style={heroTitle(colors)}>Prelims Practice</h1>
            <p style={heroSub(colors)}>
              PYQ-based practice, exam-style tests and focused performance analysis.
            </p>
          </div>

          <div style={heroBadge(colors)}>
            <strong>+2</strong>
            <span>−0.66</span>
          </div>
        </section>

        <section style={cardStyle(colors)}>
          <div style={sectionHeading}>
            <div>
              <div style={eyebrow(colors)}>TEST CENTER</div>
              <h2 style={sectionTitle(colors)}>Build your test</h2>
            </div>
            <div style={mutedStyle(colors)}>
              {filteredQuestions.length} questions available
            </div>
          </div>

          <div style={typeGrid}>
            <TestTypeCard
              colors={colors}
              active={testType === "full"}
              title="Full UPSC Prelims Simulator"
              subtitle="100 questions • 120 minutes • real exam flow"
              icon="🎯"
              onClick={() => setTestType("full")}
            />
            <TestTypeCard
              colors={colors}
              active={testType === "pyq"}
              title="PYQ Test"
              subtitle="Year-wise UPSC Prelims PYQs"
              icon="📚"
              onClick={() => setTestType("pyq")}
            />
            <TestTypeCard
              colors={colors}
              active={testType === "original"}
              title="Original Paper"
              subtitle="100 questions in database order for a selected year"
              icon="📝"
              onClick={() => setTestType("original")}
            />
            <TestTypeCard
              colors={colors}
              active={testType === "custom"}
              title="Custom Test"
              subtitle="Combine Year + Subject + Topic filters"
              icon="⚙"
              onClick={() => setTestType("custom")}
            />
            <TestTypeCard
              colors={colors}
              active={testType === "topic"}
              title="Topic Test"
              subtitle="Focused practice by topic"
              icon="🔎"
              onClick={() => setTestType("topic")}
            />
            <TestTypeCard
              colors={colors}
              active={testType === "mock"}
              title="Mixed Mock"
              subtitle="Random mixed PYQs for simulation"
              icon="🏆"
              onClick={() => setTestType("mock")}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <TestTypeCard
              colors={colors}
              active={testType === "daily"}
              title="Daily 20 PYQ"
              subtitle="Small daily practice set • separate from the full simulator"
              icon="◷"
              onClick={() => setTestType("daily")}
            />
            <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 13, border: `1px solid ${colors.border}`, background: colors.card2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <strong style={{ fontSize: 12 }}>Daily evening notification</strong>
                <span style={{ display: "block", color: colors.muted, fontSize: 10, marginTop: 2 }}>Existing notification system • 6:00 PM</span>
              </div>
              <button type="button" onClick={toggleDailyNotification} disabled={notificationSaving} style={dailyNotification ? primaryButton(colors) : secondaryButton(colors)}>
                {notificationSaving ? "Saving…" : dailyNotification ? "Enabled" : "Enable"}
              </button>
            </div>
          </div>

          <div style={filterGrid}>
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
              onChange={setSubject}
              options={subjects}
            />

            <SelectBox
              colors={colors}
              label="Topic"
              value={topic}
              onChange={setTopic}
              options={topics}
            />

            <div style={filterInfo(colors)}>
              <span style={eyebrow(colors)}>SELECTED MODE</span>
              <strong>
                {testType === "full"
                  ? "100Q Full Simulator"
                  : testType === "original"
                  ? "Original Year Paper"
                  : testType === "daily"
                  ? "Daily 20 PYQ"
                  : testType === "custom"
                  ? "Custom Year / Subject / Topic Test"
                  : testType === "topic"
                  ? "Topic Test"
                  : testType === "mock"
                  ? "Mixed Mock Test"
                  : "Year-wise PYQ Test"}
              </strong>
              <small>Year, subject and topic can be combined where applicable.</small>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={eyebrow(colors)}>QUESTIONS</div>
            <div style={countGrid}>
              {TEST_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  disabled={testType === "full" || testType === "mock" || testType === "original" || testType === "daily"}
                  style={{
                    ...countButton(colors),
                    ...(questionCount === count
                      ? {
                          background: colors.gold,
                          color: colors.goldText,
                          borderColor: colors.gold,
                        }
                      : {}),
                    ...(testType === "full" || testType === "mock" || testType === "original" || testType === "daily" ? { opacity: 0.45 } : {}),
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 15,
              borderRadius: 18,
              border: `1px solid ${colors.border}`,
              background: colors.card2,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <div>
              <div style={eyebrow(colors)}>ADVANCED ENGINE</div>
              <strong style={{ display: "block", marginTop: 5 }}>
                UPSC-style simulation
              </strong>
              <span style={{ display: "block", marginTop: 4, color: colors.muted, fontSize: 12 }}>
                Timer • Palette • Review • Auto-submit
              </span>
            </div>
            <div>
              <div style={eyebrow(colors)}>PERFORMANCE</div>
              <strong style={{ display: "block", marginTop: 5 }}>
                Detailed analysis
              </strong>
              <span style={{ display: "block", marginTop: 4, color: colors.muted, fontSize: 12 }}>
                Accuracy • Negative marks • Time • Review
              </span>
            </div>
          </div>

          <div style={testInfoGrid}>
            <InfoItem colors={colors} label="Duration" value="2 Hours" />
            <InfoItem colors={colors} label="Marking" value="+2 / −0.66" />
            <InfoItem colors={colors} label="Mode" value="Exam Style" />
            <InfoItem colors={colors} label="Language" value="English / Hindi" />
          </div>

          <button
            style={{ ...primaryButton(colors), width: "100%", marginTop: 20, minHeight: 52 }}
            onClick={startTest}
          >
            Start Test →
          </button>
        </section>

        {hasResume ? (
          <section style={cardStyle(colors)}>
            <div style={sectionHeading}>
              <div>
                <div style={eyebrow(colors)}>RESUME TEST</div>
                <h2 style={sectionTitle(colors)}>Unfinished test saved</h2>
              </div>
              <button style={primaryButton(colors)} onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem("sambhav-prelims-active") || "null");
                  if (saved?.testQuestions?.length) {
                    setTestQuestions(saved.testQuestions); setCurrent(saved.current || 0); setAnswers(saved.answers || {}); setMarked(saved.marked || {}); setVisited(saved.visited || {}); setRemaining(saved.remaining || TOTAL_SECONDS); setStartedAt(saved.startedAt || Date.now()); setTestType(saved.testType || "pyq"); setYear(saved.year || "all"); setSubject(saved.subject || "all"); setTopic(saved.topic || "all"); setQuestionCount(saved.questionCount || 20); setLanguage(saved.language === "hi" ? "hi" : "en"); setScreen("test"); setHasResume(false);
                  }
                } catch {}
              }}>Resume</button>
            </div>
            <p style={mutedStyle(colors)}>Your answers, timer, marks and current question were saved automatically.</p>
          </section>
        ) : null}

        <section style={cardStyle(colors)}>
          <div style={sectionHeading}>
            <div>
              <div style={eyebrow(colors)}>PERFORMANCE</div>
              <h2 style={sectionTitle(colors)}>Previous Tests & Analysis</h2>
            </div>
            <span style={mutedStyle(colors)}>{history.length} saved</span>
          </div>
          <div style={miniStatsGrid}>
            <MiniStat colors={colors} value={history.length} label="Tests" />
            <MiniStat colors={colors} value={history.length ? Math.round(history.reduce((a, b) => a + Number(b.accuracy || 0), 0) / history.length) + "%" : "—"} label="Avg Accuracy" />
            <MiniStat colors={colors} value={history.length ? Math.max(...history.map((h) => Number(h.score || 0))).toFixed(2) : "—"} label="Best Score" />
          </div>
        </section>

        <section style={cardStyle(colors)}>
          <div style={sectionHeading}>
            <div>
              <div style={eyebrow(colors)}>TEST HISTORY</div>
              <h2 style={sectionTitle(colors)}>Your recent tests</h2>
            </div>
            <span style={mutedStyle(colors)}>
              {history.length} saved
            </span>
          </div>

          {history.length === 0 ? (
            <div style={emptyHistory(colors)}>
              No test attempted yet. Start your first test above.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 9 }}>
              {history.slice(0, 5).map((item) => (
                <div key={item.id} style={historyRow(colors)}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block" }}>
                      {getTestLabel(item.type)}
                    </strong>
                    <span style={{ color: colors.muted, fontSize: 12 }}>
                      {item.total} Questions • {item.accuracy}% Accuracy
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{item.score}</strong>
                    <span style={{ display: "block", color: colors.muted, fontSize: 11 }}>
                      {formatHistoryDate(item.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={cardStyle(colors)}>
          <div style={eyebrow(colors)}>SAMBHAV SYSTEM</div>
          <div style={{ marginTop: 7, fontSize: 18, fontWeight: 900 }}>
            One platform. One preparation system.
          </div>
          <div style={{ marginTop: 6, color: colors.muted, fontSize: 12, lineHeight: 1.5 }}>
            Prelims testing stays inside the same SAMBHAV design language across mobile and desktop.
          </div>
        </section>

        <section style={cardStyle(colors)}>
          <div style={eyebrow(colors)}>HOW IT WORKS</div>

          <div style={howGrid}>
            <HowItem colors={colors} number="01" title="Choose" text="Select PYQ, year, subject and question count." />
            <HowItem colors={colors} number="02" title="Practice" text="Solve questions with timer and review tools." />
            <HowItem colors={colors} number="03" title="Analyse" text="See score, accuracy, negative marks and review." />
          </div>
        </section>
      </div>
    </main>
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
    custom: "Custom Test",
    mock: "Mock Test",
    original: "Original Paper",
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
  gridTemplateColumns: mobile ? "auto minmax(0, 1fr) auto auto" : "1fr auto auto auto",
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
  margin: "16px 0 24px",
  fontSize: "clamp(20px, 3vw, 28px)",
  lineHeight: 1.5,
  letterSpacing: "-.02em",
});

const optionButton = (c) => ({
  width: "100%",
  minHeight: 58,
  padding: "10px 13px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card,
  color: c.text,
  cursor: "pointer",
  fontSize: 15,
  lineHeight: 1.5,
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

const paletteGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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

const explanationBox = (c) => ({
  marginTop: 22,
  padding: 16,
  borderRadius: 14,
  border: `1px solid ${c.border}`,
  background: c.card2,
  display: "grid",
  gap: 8,
});

export const dynamic = "force-dynamic";
