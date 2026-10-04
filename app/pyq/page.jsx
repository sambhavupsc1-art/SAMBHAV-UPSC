"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const prelimsSubjects = [
  "All",
  "Polity",
  "Economy",
  "History",
  "Geography",
  "Environment",
  "Science & Technology",
  "International Relations",
  "Art & Culture",
];

const mainsPapers = [
  "All",
  "GS Paper 1",
  "GS Paper 2",
  "GS Paper 3",
  "GS Paper 4",
  "Essay",
];

export default function PYQPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [section, setSection] = useState("prelims");

  const [prelimsSubject, setPrelimsSubject] = useState("All");
  const [prelimsYear, setPrelimsYear] = useState("All");

  const [mainsPaper, setMainsPaper] = useState("All");
  const [mainsYear, setMainsYear] = useState("All");
  const [gs4Section, setGs4Section] = useState("Theory");

  const [prelimsPYQs, setPrelimsPYQs] = useState([]);
  const [prelimsLoading, setPrelimsLoading] = useState(false);
  const [prelimsError, setPrelimsError] = useState("");

  const [mainsPYQs, setMainsPYQs] = useState([]);
  const [mainsLoading, setMainsLoading] = useState(false);
  const [mainsError, setMainsError] = useState("");

  const [mode, setMode] = useState("browse");

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  /* ---------------- PRACTICE CONTROLS ---------------- */

  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);

  /* ---------------- TRANSLATION ---------------- */

  const [language, setLanguage] = useState("en");
  const [translation, setTranslation] = useState(null);
  const [translationQuestionId, setTranslationQuestionId] = useState(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");

  /* ---------------- SMART FILTERS ---------------- */

  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [showRevise, setShowRevise] = useState(false);

  /* ---------------- PREMIUM ---------------- */

  const [showPremiumTopics, setShowPremiumTopics] = useState(false);
  const [selectedPremiumTopic, setSelectedPremiumTopic] =
    useState(null);

  /* ---------------- PROGRESS ---------------- */

  const [pyqProgress, setPyqProgress] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    let stopped = false;

    const authenticate = async () => {
      try {
        // WEBSITE / EMAIL SESSION — PRIMARY
        const sessionResponse = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const sessionData =
          await sessionResponse.json().catch(() => ({}));

        if (sessionResponse.ok && sessionData?.user) {
          if (stopped) return;

          setUser(sessionData.user);
          setLoading(false);
          return;
        }

        // TELEGRAM — FALLBACK
        const webApp = window.Telegram?.WebApp;

        if (webApp?.initData) {
          webApp.ready();
          webApp.expand();

          if (stopped) return;

          const telegramResponse = await fetch(
            "/api/auth/me",
            {
              method: "GET",
              headers: {
                Authorization: `tma ${webApp.initData}`,
                "Cache-Control": "no-cache",
              },
              cache: "no-store",
            }
          );

          const telegramData = await telegramResponse.json();

          if (!telegramResponse.ok) {
            throw new Error(
              telegramData.error || "Authentication failed"
            );
          }

          if (!telegramData?.user) {
            throw new Error("User information nahi mili.");
          }

          if (stopped) return;

          setUser(telegramData.user);
          setLoading(false);
          return;
        }

        if (stopped) return;

        setError(
          "Authentication required. Please login first."
        );
        setLoading(false);
      } catch (err) {
        if (stopped) return;

        console.error("PYQ authentication error:", err);

        setError(
          err.message || "Authentication failed."
        );

        setLoading(false);
      }
    };

    authenticate();

    return () => {
      stopped = true;
    };
  }, []);

  /* ---------------- LOAD PRELIMS ---------------- */

  useEffect(() => {
    let cancelled = false;

    const loadPrelimsPYQs = async () => {
      setPrelimsLoading(true);
      setPrelimsError("");

      try {
        const response = await fetch("/api/pyq/prelims", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Prelims PYQ fetch failed"
          );
        }

        const rows = Array.isArray(data.pyqs)
          ? data.pyqs
          : [];

        const mapped = rows.map((q, index) => {
          let answer = q.answer;

          if (
            (answer === null ||
              answer === undefined ||
              answer === "") &&
            q.correct_option !== null &&
            q.correct_option !== undefined
          ) {
            const numericAnswer = Number(q.correct_option);

            // Supabase 2015 data stores correct_option as A=1, B=2, C=3, D=4.
            // The UI uses zero-based indexes, so convert 1-4 to 0-3.
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

          if (Array.isArray(q.options)) {
            options = q.options;
          } else if (typeof q.options === "string") {
            try {
              const parsed = JSON.parse(q.options);
              options = Array.isArray(parsed) ? parsed : [];
            } catch {
              options = [];
            }
          }

          if (
            options.length === 0 &&
            (q.option_a ||
              q.option_b ||
              q.option_c ||
              q.option_d)
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
              q.id ??
              `prelims-${q.year ?? "unknown"}-${index + 1}`,
            year: Number(q.year),
            subject: q.subject || "General",
            topic: q.topic || "General",
            question: q.question || "",
            options,
            answer,
            explanation: q.explanation || "",
            explanation_en:
              q.explanation ||
              q.explanation_en ||
              "",
            explanation_hi: q.explanation_hi || "",
          };
        });

        if (!cancelled) {
          setPrelimsPYQs(mapped);
        }
      } catch (err) {
        console.error("Prelims PYQ load error:", err);

        if (!cancelled) {
          setPrelimsError(
            err.message || "Prelims PYQ load failed."
          );
        }
      } finally {
        if (!cancelled) {
          setPrelimsLoading(false);
        }
      }
    };

    loadPrelimsPYQs();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- LOAD MAINS ---------------- */

  useEffect(() => {
    let cancelled = false;

    const loadMainsPYQs = async () => {
      setMainsLoading(true);
      setMainsError("");

      try {
        const response = await fetch("/api/pyq/mains", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Mains PYQ fetch failed"
          );
        }

        const rows = Array.isArray(data.pyqs)
          ? data.pyqs
          : [];

        const mapped = rows.map((q) => ({
          ...q,

          paper:
            q.paper === "GS1"
              ? "GS Paper 1"
              : q.paper === "GS2"
              ? "GS Paper 2"
              : q.paper === "GS3"
              ? "GS Paper 3"
              : q.paper === "GS4"
              ? "GS Paper 4"
              : q.paper,

          words:
            q.word_limit ??
            (Number(q.marks) === 10
              ? 150
              : Number(q.marks) === 15
              ? 250
              : null),
        }));

        if (!cancelled) {
          setMainsPYQs(mapped);
        }
      } catch (err) {
        console.error("Mains PYQ load error:", err);

        if (!cancelled) {
          setMainsError(
            err.message || "Mains PYQ load failed."
          );
        }
      } finally {
        if (!cancelled) {
          setMainsLoading(false);
        }
      }
    };

    loadMainsPYQs();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- LOAD PROGRESS ---------------- */

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;

    const loadProgress = async () => {
      try {
        const webApp = window.Telegram?.WebApp;
        const headers = {};

        // Email session uses sambhav_session cookie.
        // Telegram remains supported as fallback.
        if (webApp?.initData) {
          headers.Authorization = `tma ${webApp.initData}`;
        }

        const response = await fetch(
          "/api/pyq/progress",
          {
            method: "GET",
            credentials: "include",
            headers,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Progress load failed:",
            data.error
          );
          return;
        }

        const map = {};

        (data.progress || []).forEach((item) => {
          map[`${item.pyq_type}:${item.pyq_id}`] = item;
        });

        if (!cancelled) {
          setPyqProgress(map);
        }
      } catch (err) {
        console.error(
          "PYQ progress load error:",
          err
        );
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  /* ---------------- PRACTICE TIMER ---------------- */

  useEffect(() => {
    if (
      mode !== "practice" ||
      finished ||
      timerPaused
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setPracticeSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, finished, timerPaused]);

  /* ---------------- PROGRESS HELPERS ---------------- */

  const getProgress = (pyqId, pyqType) => {
    return (
      pyqProgress[
        `${pyqType}:${pyqId}`
      ] || {
        bookmarked: false,
        status: "new",
        attempted: false,
        attempt_count: 0,
        correct_count: 0,
        wrong_count: 0,
        revision_due_at: null,
      }
    );
  };

  const saveProgress = async (
    pyqId,
    pyqType,
    updates = {}
  ) => {
    try {
      const webApp = window.Telegram?.WebApp;

      const old = getProgress(
        pyqId,
        pyqType
      );

      const payload = {
        pyq_id: String(pyqId),
        pyq_type: pyqType,

        status:
          updates.status ??
          old.status ??
          "new",

        bookmarked:
          updates.bookmarked ??
          old.bookmarked ??
          false,

        attempted:
          updates.attempted ??
          old.attempted ??
          false,

        attempt_count:
          updates.attempt_count ??
          old.attempt_count ??
          0,

        correct_count:
          updates.correct_count ??
          old.correct_count ??
          0,

        wrong_count:
          updates.wrong_count ??
          old.wrong_count ??
          0,

        revision_due_at:
          updates.revision_due_at ??
          old.revision_due_at ??
          null,
      };

      const headers = {
        "Content-Type": "application/json",
      };

      // Email session uses sambhav_session cookie.
      // Telegram remains supported as fallback.
      if (webApp?.initData) {
        headers.Authorization =
          `tma ${webApp.initData}`;
      }

      setProgressLoading(true);

      const response = await fetch(
        "/api/pyq/progress",
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Progress save failed"
        );
      }

      if (data.progress) {
        setPyqProgress((prev) => ({
          ...prev,
          [`${pyqType}:${pyqId}`]: data.progress,
        }));
      }
    } catch (err) {
      console.error(
        "Progress save error:",
        err
      );
    } finally {
      setProgressLoading(false);
    }
  };

  const toggleBookmark = (
    pyqId,
    pyqType
  ) => {
    const progress =
      getProgress(
        pyqId,
        pyqType
      );

    saveProgress(
      pyqId,
      pyqType,
      {
        bookmarked:
          !progress.bookmarked,
      }
    );
  };

  const changePYQStatus = (
    pyqId,
    pyqType,
    status
  ) => {
    saveProgress(
      pyqId,
      pyqType,
      { status }
    );
  };

  /* ---------------- SEARCH + FILTER ---------------- */

  const searchText =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredPrelims =
    useMemo(() => {
      return prelimsPYQs.filter(
        (q) => {
          const subjectMatch =
            prelimsSubject ===
              "All" ||
            q.subject ===
              prelimsSubject;

          const yearMatch =
            prelimsYear ===
              "All" ||
            q.year ===
              Number(
                prelimsYear
              );

          const progress =
            getProgress(
              q.id,
              "prelims"
            );

          const searchable = [
            q.question,
            q.subject,
            q.topic,
            q.year,
          ]
            .join(" ")
            .toLowerCase();

          const searchMatch =
            !searchText ||
            searchable.includes(
              searchText
            );

          const bookmarkMatch =
            !showBookmarks ||
            progress.bookmarked;

          const mistakeMatch =
            !showMistakes ||
            progress.status ===
              "weak" ||
            progress.wrong_count >
              0;

          const reviseMatch =
            !showRevise ||
            progress.status ===
              "revise";

          return (
            subjectMatch &&
            yearMatch &&
            searchMatch &&
            bookmarkMatch &&
            mistakeMatch &&
            reviseMatch
          );
        }
      );
    }, [
      prelimsSubject,
      prelimsYear,
      searchText,
      showBookmarks,
      showMistakes,
      showRevise,
      pyqProgress,
    ]);

  /* ---------------- AUTO TRANSLATION ---------------- */

  useEffect(() => {
    if (
      language !== "hi" ||
      mode !== "practice" ||
      !filteredPrelims[current]
    ) {
      return;
    }

    ensureTranslation(filteredPrelims[current]);
  }, [language, mode, current, filteredPrelims]);

  const filteredMains =
    useMemo(() => {
      return mainsPYQs.filter(
        (q) => {
          const paperMatch =
            mainsPaper === "All" ||
            q.paper ===
              mainsPaper;

          const yearMatch =
            mainsYear === "All" ||
            q.year ===
              Number(mainsYear);

          const gs4Match =
            mainsPaper !==
              "GS Paper 4" ||
            gs4Section === "All" ||
            q.section ===
              gs4Section;

          const progress =
            getProgress(
              q.id,
              "mains"
            );

          const searchable = [
            q.question,
            q.topic,
            q.paper,
            q.section,
            q.year,
          ]
            .join(" ")
            .toLowerCase();

          const searchMatch =
            !searchText ||
            searchable.includes(
              searchText
            );

          const bookmarkMatch =
            !showBookmarks ||
            progress.bookmarked;

          const mistakeMatch =
            !showMistakes ||
            progress.status ===
              "weak" ||
            progress.wrong_count >
              0;

          const reviseMatch =
            !showRevise ||
            progress.status ===
              "revise";

          return (
            paperMatch &&
            yearMatch &&
            gs4Match &&
            searchMatch &&
            bookmarkMatch &&
            mistakeMatch &&
            reviseMatch
          );
        }
      );
    }, [
      mainsPYQs,
      mainsPaper,
      mainsYear,
      gs4Section,
      searchText,
      showBookmarks,
      showMistakes,
      showRevise,
      pyqProgress,
    ]);

  /* ---------------- PREMIUM TOPICS ---------------- */

  const premiumTopics =
    useMemo(() => {
      const groups =
        new Map();

      (mainsPYQs || []).forEach(
        (q) => {
          const rawTopic =
            String(
              q.topic || ""
            ).trim();

          if (!rawTopic) return;

          const normalized =
            rawTopic
              .toLowerCase()
              .replace(
                /[^a-z0-9\s&/-]/g,
                ""
              )
              .replace(
                /\s+/g,
                " "
              )
              .trim();

          if (
            !normalized ||
            normalized.length < 3
          ) {
            return;
          }

          if (
            !groups.has(
              normalized
            )
          ) {
            groups.set(
              normalized,
              {
                key: normalized,
                label: rawTopic,
                questions: [],
              }
            );
          }

          groups
            .get(normalized)
            .questions.push(q);
        }
      );

      return [
        ...groups.values(),
      ]
        .filter(
          (group) =>
            group.questions
              .length >= 2
        )
        .sort(
          (a, b) => {
            if (
              b.questions
                .length !==
              a.questions
                .length
            ) {
              return (
                b.questions
                  .length -
                a.questions
                  .length
              );
            }

            return a.label.localeCompare(
              b.label
            );
          }
        );
    }, [mainsPYQs]);

  const selectedPremiumQuestions =
    useMemo(() => {
      if (
        !selectedPremiumTopic
      ) {
        return [];
      }

      const topic =
        premiumTopics.find(
          (item) =>
            item.key ===
            selectedPremiumTopic
        );

      return (
        topic?.questions ||
        []
      );
    }, [
      premiumTopics,
      selectedPremiumTopic,
    ]);

  /* ---------------- PRELIMS PRACTICE ---------------- */

  const score =
    filteredPrelims.reduce(
      (total, q) =>
        total +
        (answers[q.id] ===
        q.answer
          ? 1
          : 0),
      0
    );

  const startPractice = () => {
    const practiceQuestions = filteredPrelims.filter(
      (q) =>
        Array.isArray(q.options) &&
        q.options.length > 0
    );

    if (!practiceQuestions.length) {
      return;
    }

    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
    setPracticeSeconds(0);
    setTimerPaused(false);
    setShowQuestionGrid(false);
    setLanguage("en");
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setMode("practice");
  };

  const chooseAnswer = (
    index
  ) => {
    if (
      selected !== null ||
      finished
    ) {
      return;
    }

    const question =
      filteredPrelims[
        current
      ];

    if (!question) return;

    setSelected(index);

    setAnswers((prev) => ({
      ...prev,
      [question.id]: index,
    }));

    const old =
      getProgress(
        question.id,
        "prelims"
      );

    const isCorrect =
      index ===
      question.answer;

    saveProgress(
      question.id,
      "prelims",
      {
        attempted: true,

        attempt_count:
          old.attempt_count +
          1,

        correct_count:
          old.correct_count +
          (isCorrect
            ? 1
            : 0),

        wrong_count:
          old.wrong_count +
          (isCorrect
            ? 0
            : 1),

        status:
          isCorrect
            ? old.status
            : "weak",
      }
    );
  };

  const ensureTranslation = async (question) => {
    if (!question) return;

    if (translationQuestionId === question.id && translation) {
      return;
    }

    setTranslationError("");
    setTranslationLoading(true);

    try {
      const cacheKey = `sambhav_translation_v2_${question.id}`;

      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.question_hi && Array.isArray(parsed?.options_hi)) {
            setTranslation(parsed);
            setTranslationQuestionId(question.id);
            return;
          }
        }
      } catch (cacheError) {
        console.warn("Translation cache read failed:", cacheError);
      }

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.question,
          options: question.options || [],
          explanation:
            question.explanation_en ||
            question.explanation ||
            "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success || !data?.translation) {
        throw new Error(
          data?.error || "Translation failed."
        );
      }

      setTranslation(data.translation);
      setTranslationQuestionId(question.id);

      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify(data.translation)
        );
      } catch (cacheError) {
        console.warn("Translation cache save failed:", cacheError);
      }
    } catch (error) {
      console.error("PYQ translation error:", error);
      setTranslationError(
        error?.message || "Translation failed."
      );
    } finally {
      setTranslationLoading(false);
    }
  };

  const selectLanguage = (value) => {
    if (value === "en" || value === "hi") {
      setLanguage(value);
    }
  };

  const goToQuestion = (targetIndex) => {
    if (
      targetIndex < 0 ||
      targetIndex >= filteredPrelims.length
    ) {
      return;
    }

    const targetQuestion =
      filteredPrelims[targetIndex];

    setCurrent(targetIndex);
    setSelected(
      targetQuestion &&
        Object.prototype.hasOwnProperty.call(
          answers,
          targetQuestion.id
        )
        ? answers[targetQuestion.id]
        : null
    );
    setTranslation(null);
    setTranslationQuestionId(null);
    setTranslationError("");
    setShowQuestionGrid(false);
  };

  const previousQuestion = () => {
    if (current <= 0) {
      return;
    }

    goToQuestion(current - 1);
  };

  const nextQuestion = () => {
    if (
      current >=
      filteredPrelims.length - 1
    ) {
      setFinished(true);
      setTimerPaused(true);
      setShowQuestionGrid(false);
      return;
    }

    goToQuestion(current + 1);
  };

  /* ---------------- FILTER CONTROLS ---------------- */

  const changeSection = (
    value
  ) => {
    setSection(value);
    setMode("browse");
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
    setPracticeSeconds(0);
    setTimerPaused(true);
    setShowQuestionGrid(false);

    setSearchQuery("");
    setShowBookmarks(false);
    setShowMistakes(false);
    setShowRevise(false);

    setShowPremiumTopics(false);
    setSelectedPremiumTopic(null);
  };

  const clearSmartFilters =
    () => {
      setSearchQuery("");
      setShowBookmarks(false);
      setShowMistakes(false);
      setShowRevise(false);
    };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main
          style={styles.page}
        >
          <div
            style={
              styles.loadingBox
            }
          >
            <h2
              style={styles.brand}
            >
              SAMBHAV UPSC
            </h2>

            <p
              style={styles.muted}
            >
              Opening PYQ
              Intelligence...
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ---------------- AUTH ERROR ---------------- */

  if (error || !user) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main
          style={styles.page}
        >
          <div
            style={
              styles.loadingBox
            }
          >
            <h2
              style={styles.brand}
            >
              SAMBHAV UPSC
            </h2>

            <h3
              style={{
                marginTop:
                  "22px",
              }}
            >
              Authentication
              Error
            </h3>

            <p
              style={styles.muted}
            >
              {error ||
                "User information nahi mili."}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              style={
                styles.primary
              }
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  /* ---------------- ACCESS CHECK ---------------- */

  if (
    user.status !==
    "approved"
  ) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main
          style={styles.page}
        >
          <div
            style={
              styles.loadingBox
            }
          >
            <h2
              style={styles.brand}
            >
              SAMBHAV UPSC
            </h2>

            <h3
              style={{
                marginTop:
                  "22px",
              }}
            >
              Access{" "}
              {user.status}
            </h3>

            <p
              style={styles.muted}
            >
              {user.status ===
              "pending"
                ? "Admin approval pending."
                : user.status ===
                  "rejected"
                ? "Your access request was rejected."
                : "Your account is currently blocked."}
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ---------------- MAIN UI ---------------- */

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main
        style={styles.page}
      >
        <div
          style={
            styles.container
          }
        >
          <header
            style={styles.header}
          >
            <button
              type="button"
              onClick={() =>
                router.push("/premium/home")
              }
              style={styles.back}
            >
              ←
            </button>

            <div>
              <div
                style={
                  styles.brand
                }
              >
                PYQ Intelligence
              </div>

              <div
                style={
                  styles.subtitle
                }
              >
                UPSC Previous Year
                Questions
              </div>
            </div>
          </header>

          <div
            style={styles.tabs}
          >
            <button
              type="button"
              onClick={() =>
                changeSection(
                  "prelims"
                )
              }
              style={{
                ...styles.tab,
                ...(section ===
                "prelims"
                  ? styles.activeTab
                  : {}),
              }}
            >
              Prelims PYQ
            </button>

            <button
              type="button"
              onClick={() =>
                changeSection(
                  "mains"
                )
              }
              style={{
                ...styles.tab,
                ...(section ===
                "mains"
                  ? styles.activeTab
                  : {}),
              }}
            >
              Mains PYQ
            </button>
          </div>

          <section
            style={styles.hero}
          >
            <div
              style={
                styles.heroSmall
              }
            >
              UPSC PYQ
              INTELLIGENCE
            </div>

            <h1
              style={
                styles.heroTitle
              }
            >
              {section ===
              "prelims"
                ? "Master Prelims PYQs."
                : "Master Mains PYQs."}
            </h1>

            <p
              style={
                styles.heroText
              }
            >
              {section ===
              "prelims"
                ? "Subject, year, search and practice-based PYQ preparation."
                : "GS papers and Essay questions with search, bookmarks and revision tracking."}
            </p>
          </section>

          {/* SEARCH */}

          <SearchPanel
            searchQuery={
              searchQuery
            }
            setSearchQuery={
              setSearchQuery
            }
            showBookmarks={
              showBookmarks
            }
            setShowBookmarks={
              setShowBookmarks
            }
            showMistakes={
              showMistakes
            }
            setShowMistakes={
              setShowMistakes
            }
            showRevise={
              showRevise
            }
            setShowRevise={
              setShowRevise
            }
            clearSmartFilters={
              clearSmartFilters
            }
            progressLoading={
              progressLoading
            }
          />

          {/* PREMIUM BELOW SEARCH */}

          {section ===
            "mains" && (
            <PremiumTopics
              topics={
                premiumTopics
              }
              showPremiumTopics={
                showPremiumTopics
              }
              setShowPremiumTopics={
                setShowPremiumTopics
              }
              selectedTopic={
                selectedPremiumTopic
              }
              setSelectedTopic={
                setSelectedPremiumTopic
              }
              selectedQuestions={
                selectedPremiumQuestions
              }
            />
          )}

          {/* ---------------- PRELIMS ---------------- */}

          {section ===
            "prelims" && (
            <>
              <section
                style={
                  styles.filterCard
                }
              >
                <div
                  style={
                    styles.filterTitle
                  }
                >
                  Prelims Filters
                </div>

                <div
                  style={
                    styles.filterGrid
                  }
                >
                  <select
                    value={
                      prelimsSubject
                    }
                    onChange={(e) => {
                      setPrelimsSubject(
                        e.target
                          .value
                      );
                      setMode(
                        "browse"
                      );
                    }}
                    style={
                      styles.select
                    }
                  >
                    {prelimsSubjects.map(
                      (item) => (
                        <option
                          key={item}
                          value={
                            item
                          }
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={
                      prelimsYear
                    }
                    onChange={(e) => {
                      setPrelimsYear(
                        e.target
                          .value
                      );
                      setMode(
                        "browse"
                      );
                    }}
                    style={
                      styles.select
                    }
                  >
                    <option value="All">
                      All Years
                    </option>

                    {Array.from(
                      new Set(
                        prelimsPYQs
                          .map((q) => Number(q.year))
                          .filter((year) => Number.isFinite(year))
                      )
                    )
                      .sort((a, b) => b - a)
                      .map((year) => (
                        <option
                          key={year}
                          value={String(year)}
                        >
                          {year}
                        </option>
                      ))}
                  </select>
                </div>

                <div
                  style={
                    styles.statsRow
                  }
                >
                  <span>
                    {prelimsLoading
                      ? "Loading Prelims..."
                      : prelimsError
                      ? "Prelims data failed to load"
                      : `${filteredPrelims.length} Questions`}
                  </span>

                  <button
                    type="button"
                    onClick={startPractice}
                    disabled={
                      prelimsLoading ||
                      !filteredPrelims.some(
                        (q) =>
                          Array.isArray(q.options) &&
                          q.options.length > 0
                      )
                    }
                    style={{
                      ...styles.primary,
                      opacity:
                        prelimsLoading ||
                        !filteredPrelims.some(
                          (q) =>
                            Array.isArray(q.options) &&
                            q.options.length > 0
                        )
                          ? 0.55
                          : 1,
                      cursor:
                        prelimsLoading ||
                        !filteredPrelims.some(
                          (q) =>
                            Array.isArray(q.options) &&
                            q.options.length > 0
                        )
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Start Practice
                  </button>
                </div>
              </section>

              {mode ===
                "browse" && (
                <section
                  style={
                    styles.section
                  }
                >
                  <div
                    style={
                      styles.sectionTitle
                    }
                  >
                    Prelims PYQs
                  </div>

                  {filteredPrelims.length ===
                  0 ? (
                    <EmptyState
                      text="No Prelims PYQs found for selected filters."
                    />
                  ) : (
                    filteredPrelims.map(
                      (
                        q,
                        index
                      ) => (
                        <div
                          key={q.id}
                          style={
                            styles.questionCard
                          }
                        >
                          <div
                            style={
                              styles.meta
                            }
                          >
                            {q.year} ·{" "}
                            {
                              q.subject
                            }{" "}
                            ·{" "}
                            {q.topic}
                          </div>

                          <div
                            style={
                              styles.question
                            }
                          >
                            {index +
                              1}
                            .{" "}
                            {
                              q.question
                            }
                          </div>

                          <div
                            style={
                              styles.answerHint
                            }
                          >
                            {Array.isArray(q.options) &&
                            q.options.length > 0
                              ? `MCQ · ${q.options.length} Options`
                              : "MCQ · Options not available yet"}
                          </div>

                          <ProgressActions
                            id={q.id}
                            type="prelims"
                            getProgress={
                              getProgress
                            }
                            toggleBookmark={
                              toggleBookmark
                            }
                            changePYQStatus={
                              changePYQStatus
                            }
                          />
                        </div>
                      )
                    )
                  )}
                </section>
              )}

              {mode ===
                "practice" &&
                filteredPrelims.length >
                  0 &&
                !finished && (
                  <section
                    style={
                      styles.section
                    }
                  >
                    <PracticeHeader
                      current={current}
                      total={filteredPrelims.length}
                      elapsedSeconds={practiceSeconds}
                      paused={timerPaused}
                      showGrid={showQuestionGrid}
                      onTogglePause={() =>
                        setTimerPaused((value) => !value)
                      }
                      onToggleGrid={() =>
                        setShowQuestionGrid((value) => !value)
                      }
                      onExit={() => {
                        setTimerPaused(true);
                        setShowQuestionGrid(false);
                        setMode("browse");
                      }}
                    />

                    {showQuestionGrid && (
                      <QuestionGrid
                        questions={filteredPrelims}
                        current={current}
                        answers={answers}
                        onSelect={goToQuestion}
                      />
                    )}

                    <div
                      style={
                        styles.questionCard
                      }
                    >
                      <div
                        style={
                          styles.meta
                        }
                      >
                        {
                          filteredPrelims[
                            current
                          ].year
                        }{" "}
                        ·{" "}
                        {
                          filteredPrelims[
                            current
                          ].subject
                        }{" "}
                        ·{" "}
                        {
                          filteredPrelims[
                            current
                          ].topic
                        }
                      </div>

                      <div
                        style={
                          styles.translationRow
                        }
                      >
                        <div style={styles.translationToggle}>
                          <button
                            type="button"
                            onClick={() => selectLanguage("en")}
                            style={{
                              ...styles.translationOption,
                              ...(language === "en"
                                ? styles.translationOptionActive
                                : {}),
                            }}
                          >
                            English
                          </button>

                          <button
                            type="button"
                            onClick={() => selectLanguage("hi")}
                            disabled={translationLoading}
                            style={{
                              ...styles.translationOption,
                              ...(language === "hi"
                                ? styles.translationOptionActive
                                : {}),
                            }}
                          >
                            {translationLoading ? "Translating..." : "हिंदी"}
                          </button>
                        </div>

                        <span style={styles.translationLabel}>
                          {language === "hi"
                            ? "Hindi mode — next questions auto-translate"
                            : "English mode"}
                        </span>
                      </div>

                      {translationError && (
                        <div style={styles.translationError}>
                          {translationError}
                        </div>
                      )}

                      <div
                        style={
                          styles.question
                        }
                      >
                        {language === "hi" &&
                        translationQuestionId === filteredPrelims[current].id &&
                        translation?.question_hi
                          ? translation.question_hi
                          : filteredPrelims[current].question}
                      </div>

                      <div
                        style={
                          styles.options
                        }
                      >
                        {Array.isArray(
                          filteredPrelims[current]?.options
                        ) &&
                        filteredPrelims[current].options.length > 0 ? (
                          filteredPrelims[current].options.map(
                            (option, index) => {
                              const correct =
                                index ===
                                filteredPrelims[current].answer;

                              const chosen =
                                selected === index;

                              let optionStyle =
                                styles.option;

                              if (
                                selected !== null &&
                                correct
                              ) {
                                optionStyle = {
                                  ...styles.option,
                                  ...styles.correct,
                                };
                              } else if (
                                selected !== null &&
                                chosen
                              ) {
                                optionStyle = {
                                  ...styles.option,
                                  ...styles.wrong,
                                };
                              }

                              const displayOption =
                                language === "hi" &&
                                translationQuestionId === filteredPrelims[current].id &&
                                Array.isArray(translation?.options_hi) &&
                                translation.options_hi[index]
                                  ? translation.options_hi[index]
                                  : option;

                              return (
                                <button
                                  type="button"
                                  key={`${filteredPrelims[current].id}-${index}`}
                                  onClick={() =>
                                    chooseAnswer(index)
                                  }
                                  style={optionStyle}
                                >
                                  <strong>
                                    {String.fromCharCode(
                                      65 + index
                                    )}
                                    .
                                  </strong>

                                  <span>
                                    {displayOption}
                                  </span>
                                </button>
                              );
                            }
                          )
                        ) : (
                          <div style={styles.explanation}>
                            <strong>
                              Practice options are not available yet.
                            </strong>
                            <p>
                              Is PYQ record me options available nahi hain.
                            </p>
                            <button
                              type="button"
                              onClick={() => setMode("browse")}
                              style={styles.primary}
                            >
                              Back to PYQs
                            </button>
                          </div>
                        )}
                      </div>

                      {selected !==
                        null && (
                        <ExplanationPanel
                          question={
                            filteredPrelims[
                              current
                            ]
                          }
                          selected={selected}
                          language={language}
                          translatedExplanation={
                            language === "hi" &&
                            translationQuestionId === filteredPrelims[current].id
                              ? translation?.explanation_hi || ""
                              : ""
                          }
                          onPrevious={previousQuestion}
                          onNext={nextQuestion}
                          isFirst={current === 0}
                          isLast={
                            current ===
                            filteredPrelims.length - 1
                          }
                        />
                      )}
                    </div>
                  </section>
                )}

              {finished && (
                <section
                  style={
                    styles.resultCard
                  }
                >
                  <div
                    style={
                      styles.resultLabel
                    }
                  >
                    PRACTICE COMPLETE
                  </div>

                  <div
                    style={
                      styles.resultScore
                    }
                  >
                    {score}/
                    {
                      filteredPrelims.length
                    }
                  </div>

                  <p
                    style={{
                      color:
                        "#aaa",
                    }}
                  >
                    Accuracy{" "}
                    {
                      filteredPrelims.length
                        ? Math.round(
                            (score /
                              filteredPrelims.length) *
                              100
                          )
                        : 0
                    }
                    %
                  </p>

                  <button
                    type="button"
                    onClick={
                      startPractice
                    }
                    style={
                      styles.primaryLight
                    }
                  >
                    Practice Again
                  </button>
                </section>
              )}
            </>
          )}

          {/* ---------------- MAINS ---------------- */}

          {section ===
            "mains" && (
            <>
              <section
                style={
                  styles.filterCard
                }
              >
                <div
                  style={
                    styles.filterTitle
                  }
                >
                  Mains Filters
                </div>

                <div
                  style={
                    styles.filterGrid
                  }
                >
                  <select
                    value={
                      mainsPaper
                    }
                    onChange={(e) => {
                      const value =
                        e.target
                          .value;

                      setMainsPaper(
                        value
                      );

                      if (
                        value ===
                        "GS Paper 4"
                      ) {
                        setGs4Section(
                          "Theory"
                        );
                      }

                      setMode(
                        "browse"
                      );
                    }}
                    style={
                      styles.select
                    }
                  >
                    {mainsPapers.map(
                      (
                        paper
                      ) => (
                        <option
                          key={
                            paper
                          }
                          value={
                            paper
                          }
                        >
                          {paper}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={
                      mainsYear
                    }
                    onChange={(e) =>
                      setMainsYear(
                        e.target
                          .value
                      )
                    }
                    style={
                      styles.select
                    }
                  >
                    <option value="All">
                      All Years
                    </option>

                    {[
                      ...new Set(
                        mainsPYQs
                          .map(
                            (q) =>
                              q.year
                          )
                          .filter(
                            Boolean
                          )
                      ),
                    ]
                      .sort(
                        (a, b) =>
                          Number(
                            b
                          ) -
                          Number(
                            a
                          )
                      )
                      .map(
                        (
                          year
                        ) => (
                          <option
                            key={
                              year
                            }
                            value={
                              year
                            }
                          >
                            {year}
                          </option>
                        )
                      )}
                  </select>
                </div>

                {mainsPaper ===
                  "GS Paper 4" && (
                  <div
                    style={
                      styles.gs4Tabs
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setGs4Section(
                          "Theory"
                        )
                      }
                      style={{
                        ...styles.gs4Tab,
                        ...(gs4Section ===
                        "Theory"
                          ? styles.gs4ActiveTab
                          : {}),
                      }}
                    >
                      Theory
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setGs4Section(
                          "Case Study"
                        )
                      }
                      style={{
                        ...styles.gs4Tab,
                        ...(gs4Section ===
                        "Case Study"
                          ? styles.gs4ActiveTab
                          : {}),
                      }}
                    >
                      Case Studies
                    </button>
                  </div>
                )}

                <div
                  style={
                    styles.statsRow
                  }
                >
                  <span>
                    {mainsLoading
                      ? "Loading..."
                      : `${filteredMains.length} Questions`}
                  </span>
                </div>
              </section>

              <section
                style={
                  styles.section
                }
              >
                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  {mainsPaper ===
                  "GS Paper 4"
                    ? gs4Section ===
                      "Case Study"
                      ? "GS4 Case Studies"
                      : "GS4 Theory"
                    : "Mains PYQs"}
                </div>

                {mainsLoading && (
                  <EmptyState
                    text="Loading Mains PYQs..."
                  />
                )}

                {!mainsLoading &&
                  mainsError && (
                    <div
                      style={
                        styles.questionCard
                      }
                    >
                      <div
                        style={
                          styles.question
                        }
                      >
                        Mains PYQ load
                        nahi hua.
                      </div>

                      <div
                        style={
                          styles.answerHint
                        }
                      >
                        {mainsError}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          window.location.reload()
                        }
                        style={{
                          ...styles.primary,
                          marginTop:
                            "12px",
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                {!mainsLoading &&
                  !mainsError &&
                  filteredMains.length ===
                    0 && (
                    <EmptyState
                      text="No Mains PYQs found for selected filters."
                    />
                  )}

                {!mainsLoading &&
                  !mainsError &&
                  filteredMains.map(
                    (
                      q,
                      index
                    ) => (
                      <div
                        key={q.id}
                        style={
                          styles.mainsCard
                        }
                      >
                        <div
                          style={
                            styles.meta
                          }
                        >
                          {q.year} ·{" "}
                          {
                            q.paper
                          }
                          {q.paper ===
                            "GS Paper 4" &&
                          q.section
                            ? " · " +
                              q.section
                            : ""}
                          {" · "}
                          {q.topic ||
                            "General"}
                        </div>

                        <div
                          style={
                            styles.question
                          }
                        >
                          {index +
                            1}
                          .{" "}
                          {
                            q.question
                          }
                        </div>

                        <div
                          style={
                            styles.mainsMeta
                          }
                        >
                          <span>
                            {q.marks ??
                              "—"}{" "}
                            Marks
                          </span>

                          <span>
                            {q.words
                              ? `${q.words} Words`
                              : "Word limit —"}
                          </span>
                        </div>

                        <button
  type="button"
  onClick={() => {
    sessionStorage.setItem(
      "sambhav_answer_question",
      JSON.stringify({
        id: q.id,
        year: q.year,
        paper: q.paper,
        section: q.section || "",
        topic: q.topic || "",
        question: q.question,
        marks: q.marks,
        word_limit:
          q.word_limit ||
          q.words ||
          (Number(q.marks) <= 10
            ? 150
            : 250),
      })
    );

    router.push("/answer");
  }}
  style={styles.primary}
>
  Start Answer Writing
</button>

                        <ProgressActions
                          id={q.id}
                          type="mains"
                          getProgress={
                            getProgress
                          }
                          toggleBookmark={
                            toggleBookmark
                          }
                          changePYQStatus={
                            changePYQStatus
                          }
                        />
                      </div>
                    )
                  )}
              </section>
            </>
          )}

          <section
            style={
              styles.infoCard
            }
          >
            <div
              style={
                styles.infoIcon
              }
            >
              ✦
            </div>

            <div>
              <div
                style={
                  styles.infoTitle
                }
              >
                PYQ Intelligence
              </div>

              <div
                style={
                  styles.infoText
                }
              >
                Search, bookmarks,
                mistakes, revise
                and personal PYQ
                revision status are
                connected with your
                account.
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   SEARCH
   OUTSIDE MAIN COMPONENT
   SO INPUT DOES NOT REMOUNT
========================================================= */

function SearchPanel({
  searchQuery,
  setSearchQuery,
  showBookmarks,
  setShowBookmarks,
  showMistakes,
  setShowMistakes,
  showRevise,
  setShowRevise,
  clearSmartFilters,
  progressLoading,
}) {
  const hasFilters =
    Boolean(searchQuery) ||
    showBookmarks ||
    showMistakes ||
    showRevise;

  return (
    <section
      style={styles.searchCard}
    >
      <div
        style={
          styles.searchTitle
        }
      >
        PYQ Search & Revision
      </div>

      <input
        value={searchQuery}
        onChange={(e) =>
          setSearchQuery(
            e.target.value
          )
        }
        placeholder="Search question, topic, paper..."
        style={
          styles.searchInput
        }
        type="search"
        autoComplete="off"
      />

      <div
        style={
          styles.searchActions
        }
      >
        <button
          type="button"
          onClick={() => {
            setShowBookmarks(
              (value) =>
                !value
            );
            setShowMistakes(
              false
            );
            setShowRevise(
              false
            );
          }}
          style={{
            ...styles.filterButton,
            ...(showBookmarks
              ? styles.filterButtonActive
              : {}),
          }}
        >
          ⭐ Bookmarks
        </button>

        <button
          type="button"
          onClick={() => {
            setShowMistakes(
              (value) =>
                !value
            );
            setShowBookmarks(
              false
            );
            setShowRevise(
              false
            );
          }}
          style={{
            ...styles.filterButton,
            ...(showMistakes
              ? styles.filterButtonActive
              : {}),
          }}
        >
          🔴 My Mistakes
        </button>

        <button
          type="button"
          onClick={() => {
            setShowRevise(
              (value) =>
                !value
            );
            setShowBookmarks(
              false
            );
            setShowMistakes(
              false
            );
          }}
          style={{
            ...styles.filterButton,
            ...(showRevise
              ? styles.filterButtonActive
              : {}),
          }}
        >
          🟡 Revise
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={
              clearSmartFilters
            }
            style={
              styles.clearButton
            }
          >
            Clear
          </button>
        )}
      </div>

      {progressLoading && (
        <div
          style={
            styles.savingText
          }
        >
          Saving progress...
        </div>
      )}
    </section>
  );
}

/* =========================================================
   PREMIUM TOPICS
   SEPARATE SECTION BELOW SEARCH
   ALL REPEATED TOPICS — NO LIMIT
========================================================= */

function PremiumTopics({
  topics,
  showPremiumTopics,
  setShowPremiumTopics,
  selectedTopic,
  setSelectedTopic,
  selectedQuestions,
}) {
  return (
    <section
      style={
        styles.premiumSection
      }
    >
      <button
        type="button"
        onClick={() => {
          const next =
            !showPremiumTopics;

          setShowPremiumTopics(
            next
          );

          if (!next) {
            setSelectedTopic(
              null
            );
          }
        }}
        style={
          styles.premiumMainButton
        }
      >
        <div
          style={
            styles.premiumMainLeft
          }
        >
          <div
            style={
              styles.premiumIcon
            }
          >
            ⭐
          </div>

          <div>
            <div
              style={
                styles.premiumMainTitle
              }
            >
              Premium PYQ Themes
            </div>

            <div
              style={
                styles.premiumMainSubtitle
              }
            >
              Repeated topics from
              previous years
            </div>
          </div>
        </div>

        <div
          style={
            styles.premiumMainRight
          }
        >
          <span>
            {topics.length}
          </span>

          <span>
            {showPremiumTopics
              ? "▲"
              : "▼"}
          </span>
        </div>
      </button>

      {showPremiumTopics && (
        <div
          style={
            styles.premiumBody
          }
        >
          {!topics.length ? (
            <div
              style={
                styles.premiumEmpty
              }
            >
              अभी कोई repeated
              topic उपलब्ध नहीं
              है।
            </div>
          ) : (
            <>
              <div
                style={
                  styles.premiumInfo
                }
              >
                {topics.length} repeated
                topics found · सबसे
                ज्यादा repeated topic
                ऊपर
              </div>

              <div
                style={
                  styles.premiumTopicList
                }
              >
                {topics.map(
                  (topic) => {
                    const active =
                      selectedTopic ===
                      topic.key;

                    return (
                      <button
                        key={
                          topic.key
                        }
                        type="button"
                        onClick={() =>
                          setSelectedTopic(
                            active
                              ? null
                              : topic.key
                          )
                        }
                        style={{
                          ...styles.premiumTopicButton,
                          ...(active
                            ? styles.premiumTopicActive
                            : {}),
                        }}
                      >
                        <span
                          style={
                            styles.premiumTopicName
                          }
                        >
                          {topic.label}
                        </span>

                        <span
                          style={
                            styles.premiumTopicCount
                          }
                        >
                          {
                            topic
                              .questions
                              .length
                          }{" "}
                          PYQs{" "}
                          {active
                            ? "▲"
                            : "→"}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {selectedTopic &&
                selectedQuestions.length >
                  0 && (
                  <div
                    style={
                      styles.premiumQuestions
                    }
                  >
                    <div
                      style={
                        styles.selectedPremiumHeader
                      }
                    >
                      <div>
                        <div
                          style={
                            styles.selectedPremiumTitle
                          }
                        >
                          {
                            topics.find(
                              (topic) =>
                                topic.key ===
                                selectedTopic
                            )?.label
                          }
                        </div>

                        <div
                          style={
                            styles.selectedPremiumMeta
                          }
                        >
                          {
                            selectedQuestions.length
                          }{" "}
                          related PYQs
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTopic(
                            null
                          )
                        }
                        style={
                          styles.closePremiumButton
                        }
                      >
                        ×
                      </button>
                    </div>

                    {selectedQuestions.map(
                      (
                        q,
                        index
                      ) => (
                        <div
                          key={`premium-${q.id}-${index}`}
                          style={
                            styles.premiumQuestionCard
                          }
                        >
                          <div
                            style={
                              styles.meta
                            }
                          >
                            {q.year} ·{" "}
                            {
                              q.paper
                            }
                            {q.section
                              ? ` · ${q.section}`
                              : ""}
                          </div>

                          <div
                            style={
                              styles.premiumQuestionNumber
                            }
                          >
                            PYQ{" "}
                            {index +
                              1}
                          </div>

                          <div
                            style={
                              styles.question
                            }
                          >
                            {
                              q.question
                            }
                          </div>

                          <div
                            style={
                              styles.mainsMeta
                            }
                          >
                            <span>
                              {q.marks ??
                                "—"}{" "}
                              Marks
                            </span>

                            <span>
                              {q.words
                                ? `${q.words} Words`
                                : "Word limit —"}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </section>
  );
}


/* =========================================================
   PYQ PRACTICE HEADER
========================================================= */

function formatPracticeTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function PracticeHeader({
  current,
  total,
  elapsedSeconds,
  paused,
  showGrid,
  onTogglePause,
  onToggleGrid,
  onExit,
}) {
  const progress = total
    ? Math.round(((current + 1) / total) * 100)
    : 0;

  return (
    <div style={styles.practiceHeader}>
      <div style={styles.practiceHeaderTop}>
        <div>
          <div style={styles.practiceQuestionCount}>
            Question {current + 1} / {total}
          </div>

          <div style={styles.practiceProgressPercent}>
            {progress}% progress
          </div>
        </div>

        <div style={styles.practiceHeaderActions}>
          <div style={styles.timerBox}>
            <span style={styles.timerIcon}>⏱</span>
            <span style={styles.timerText}>
              {formatPracticeTime(elapsedSeconds)}
            </span>
            <button
              type="button"
              onClick={onTogglePause}
              style={styles.timerButton}
              title={paused ? "Resume timer" : "Pause timer"}
              aria-label={paused ? "Resume timer" : "Pause timer"}
            >
              {paused ? "▶" : "Ⅱ"}
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleGrid}
            style={{
              ...styles.gridButton,
              ...(showGrid ? styles.gridButtonActive : {}),
            }}
            title="Question grid"
            aria-label="Question grid"
          >
            ▦
          </button>
        </div>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
          }}
        />
      </div>

      <div style={styles.practiceHeaderBottom}>
        <button
          type="button"
          onClick={onExit}
          style={styles.practiceExitButton}
        >
          Exit Practice
        </button>

        <span style={styles.timerState}>
          {paused ? "Timer paused" : "Timer running"}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   QUESTION GRID
========================================================= */

function QuestionGrid({
  questions,
  current,
  answers,
  onSelect,
}) {
  return (
    <div style={styles.questionGridPanel}>
      <div style={styles.questionGridHeader}>
        <div>
          <div style={styles.questionGridTitle}>
            Question Navigator
          </div>
          <div style={styles.questionGridSubtitle}>
            Tap any question to jump directly.
          </div>
        </div>
      </div>

      <div style={styles.questionGrid}>
        {questions.map((question, index) => {
          const answered = Object.prototype.hasOwnProperty.call(
            answers,
            question.id
          );
          const active = index === current;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(index)}
              style={{
                ...styles.gridQuestion,
                ...(active ? styles.gridQuestionActive : {}),
                ...(answered && !active
                  ? styles.gridQuestionAnswered
                  : {}),
              }}
              title={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div style={styles.gridLegend}>
        <span style={styles.legendItem}>
          <i
            style={{
              ...styles.legendDot,
              ...styles.legendCurrent,
            }}
          />
          Current
        </span>

        <span style={styles.legendItem}>
          <i
            style={{
              ...styles.legendDot,
              ...styles.legendAnswered,
            }}
          />
          Answered
        </span>

        <span style={styles.legendItem}>
          <i
            style={{
              ...styles.legendDot,
              ...styles.legendUnanswered,
            }}
          />
          Unanswered
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   PRELIMS EXPLANATION PANEL
========================================================= */

function ExplanationPanel({
  question,
  selected,
  language = "en",
  translatedExplanation = "",
  onPrevious,
  onNext,
  isFirst,
  isLast,
}) {
  const raw = String(
    language === "hi" && translatedExplanation
      ? translatedExplanation
      : question?.explanation ||
        question?.explanation_en ||
        ""
  )
    .replace(/\r\n/g, "\n")
    .trim();

  const isCorrect = selected === question?.answer;

  const sectionDefinitions =
    language === "hi"
      ? [
          {
            key: "asking",
            patterns: [
              /What is the question asking\?/i,
              /प्रश्न क्या पूछ रहा है\?/i,
            ],
            title: "प्रश्न क्या पूछ रहा है?",
          },
          {
            key: "correct",
            patterns: [
              /Why is the correct answer correct\?/i,
              /सही उत्तर क्यों सही है\?/i,
            ],
            title: "सही उत्तर क्यों सही है?",
          },
          {
            key: "wrong",
            patterns: [
              /Why are the other options incorrect\?/i,
              /अन्य विकल्प गलत क्यों हैं\?/i,
            ],
            title: "अन्य विकल्प गलत क्यों हैं?",
          },
          {
            key: "takeaway",
            patterns: [
              /Key Takeaway/i,
              /मुख्य सीख/i,
            ],
            title: "मुख्य सीख",
          },
          {
            key: "keywords",
            patterns: [
              /Important Terms\s*\/\s*Keywords:?/i,
              /महत्वपूर्ण शब्द\s*\/\s*कीवर्ड:?/i,
            ],
            title: "महत्वपूर्ण शब्द / Keywords",
          },
        ]
      : [
          {
            key: "asking",
            patterns: [/What is the question asking\?/i],
            title: "What is the question asking?",
          },
          {
            key: "correct",
            patterns: [/Why is the correct answer correct\?/i],
            title: "Why is the correct answer correct?",
          },
          {
            key: "wrong",
            patterns: [/Why are the other options incorrect\?/i],
            title: "Why are the other options incorrect?",
          },
          {
            key: "takeaway",
            patterns: [/Key Takeaway/i],
            title: "Key Takeaway",
          },
          {
            key: "keywords",
            patterns: [/Important Terms\s*\/\s*Keywords:?/i],
            title: "Important Terms / Keywords",
          },
        ];

  const matches = [];

  sectionDefinitions.forEach((section) => {
    section.patterns.forEach((pattern) => {
      const match = pattern.exec(raw);
      if (match) {
        matches.push({
          key: section.key,
          title: section.title,
          index: match.index,
          end: match.index + match[0].length,
        });
      }
    });
  });

  const uniqueMatches = Array.from(
    new Map(
      matches.map((item) => [item.key, item])
    ).values()
  ).sort((a, b) => a.index - b.index);

  const sections = {};

  uniqueMatches.forEach((section, index) => {
    const next = uniqueMatches[index + 1];
    let content = raw.slice(
      section.end,
      next ? next.index : raw.length
    );

    content = content
      .replace(/^\s*↓\s*/g, "")
      .replace(/^\s*:\s*/g, "")
      .trim();

    sections[section.key] = content;
  });

  const hasStructuredFormat =
    uniqueMatches.some((item) => item.key === "asking") &&
    uniqueMatches.some((item) => item.key === "correct") &&
    uniqueMatches.some((item) => item.key === "wrong");

  const fallbackText = raw
    .replace(/Important Terms\s*\/\s*Keywords:[\s\S]*$/i, "")
    .replace(/^Explanation\s*:\s*/i, "")
    .trim();

  const fallbackSentences = fallbackText
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const keywordText = sections.keywords || "";

  const keywords = keywordText
    .split(/\n+/)
    .map((item) =>
      item
        .replace(/^\s*[-•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .trim()
    )
    .filter(Boolean);

  const renderContent = (content) => {
    if (!content) {
      return (
        <p style={styles.explanationParagraph}>
          {language === "hi"
            ? "जानकारी उपलब्ध नहीं है।"
            : "Information is not available."}
        </p>
      );
    }

    return content
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((paragraph, index) => (
        <p
          key={`section-${index}`}
          style={styles.explanationParagraph}
        >
          {paragraph}
        </p>
      ));
  };

  const renderKeywords = () => {
    if (!keywords.length) return null;

    return (
      <div style={styles.keywordSection}>
        <div style={styles.keywordHeading}>
          {language === "hi"
            ? "महत्वपूर्ण शब्द / Keywords"
            : "Important Terms / Keywords"}
        </div>

        <div style={styles.keywordList}>
          {keywords.map((item, index) => {
            const separatorIndex = item.indexOf("—");

            const term =
              separatorIndex > -1
                ? item.slice(0, separatorIndex).trim()
                : item;

            const meaning =
              separatorIndex > -1
                ? item.slice(separatorIndex + 1).trim()
                : "";

            return (
              <div
                key={`keyword-${index}`}
                style={styles.keywordItem}
              >
                <span style={styles.keywordBullet}>•</span>

                <div style={styles.keywordContent}>
                  <strong style={styles.keywordTerm}>
                    {term}
                  </strong>

                  {meaning && (
                    <span style={styles.keywordMeaning}>
                      {meaning}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.explanation}>
      <div
        style={{
          ...styles.explanationStatus,
          ...(isCorrect
            ? styles.explanationStatusCorrect
            : styles.explanationStatusWrong),
        }}
      >
        <span style={styles.explanationStatusDot}>
          {isCorrect ? "✓" : "!"}
        </span>

        <span>
          {isCorrect
            ? language === "hi"
              ? "सही उत्तर"
              : "Correct Answer"
            : language === "hi"
            ? "गलत उत्तर"
            : "Incorrect Answer"}
        </span>
      </div>

      {hasStructuredFormat ? (
        <>
          {["asking", "correct", "wrong", "takeaway"].map((key) => {
            const section = sectionDefinitions.find(
              (item) => item.key === key
            );

            if (!section || !sections[key]) return null;

            return (
              <div
                key={key}
                style={styles.explanationSection}
              >
                <div style={styles.explanationHeading}>
                  {section.title}
                </div>

                <div style={styles.explanationBody}>
                  {renderContent(sections[key])}
                </div>
              </div>
            );
          })}

          {renderKeywords()}
        </>
      ) : (
        <>
          <div style={styles.explanationSection}>
            <div style={styles.explanationHeading}>
              {language === "hi" ? "व्याख्या" : "Explanation"}
            </div>

            <div style={styles.explanationBody}>
              {fallbackSentences.length > 0 ? (
                fallbackSentences.map((sentence, index) => (
                  <p
                    key={`fallback-${index}`}
                    style={styles.explanationParagraph}
                  >
                    {sentence}
                  </p>
                ))
              ) : (
                <p style={styles.explanationParagraph}>
                  {language === "hi"
                    ? "Explanation अभी उपलब्ध नहीं है।"
                    : "Explanation is not available yet."}
                </p>
              )}
            </div>
          </div>

          {renderKeywords()}
        </>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginTop: "18px",
        }}
      >
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst || !onPrevious}
          style={{
            padding: "12px 18px",
            borderRadius: "13px",
            border: "1px solid #e3e3e0",
            background:
              isFirst || !onPrevious ? "#f8f8f6" : "#fff",
            color:
              isFirst || !onPrevious ? "#aaa" : "#111",
            fontSize: "12px",
            fontWeight: "800",
            cursor:
              isFirst || !onPrevious ? "not-allowed" : "pointer",
          }}
        >
          ← Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          style={{
            padding: "12px 20px",
            borderRadius: "13px",
            border: 0,
            background: "#111",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          {isLast ? "Finish" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   QUESTION ACTIONS
========================================================= */

function ProgressActions({
  id,
  type,
  getProgress,
  toggleBookmark,
  changePYQStatus,
}) {
  const progress =
    getProgress(id, type);

  return (
    <div
      style={
        styles.pyqActions
      }
    >
      <button
        type="button"
        onClick={() =>
          toggleBookmark(
            id,
            type
          )
        }
        style={
          styles.smallButton
        }
      >
        {progress.bookmarked
          ? "⭐ Saved"
          : "☆ Save"}
      </button>

      <select
        value={
          progress.status ||
          "new"
        }
        onChange={(e) =>
          changePYQStatus(
            id,
            type,
            e.target.value
          )
        }
        style={
          styles.statusSelect
        }
      >
        <option value="new">
          New
        </option>

        <option value="important">
          ⭐ Important
        </option>

        <option value="weak">
          🔴 Weak
        </option>

        <option value="revise">
          🟡 Revise
        </option>

        <option value="mastered">
          🟢 Mastered
        </option>
      </select>
    </div>
  );
}

/* ---------------- EMPTY STATE ---------------- */

function EmptyState({
  text,
}) {
  return (
    <div
      style={
        styles.questionCard
      }
    >
      <div
        style={
          styles.question
        }
      >
        {text}
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f3",
    color: "#111",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: "760px",
    margin: "0 auto",
    padding:
      "18px 16px 40px",
  },

  loadingBox: {
    maxWidth: "500px",
    margin: "70px auto",
    padding: "30px",
    textAlign: "center",
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "24px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing:
      "-0.5px",
  },

  muted: {
    color: "#777",
    fontSize: "13px",
    lineHeight: "1.5",
    marginTop: "8px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "18px",
  },

  back: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    border:
      "1px solid #e4e4e2",
    background: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },

  subtitle: {
    color: "#888",
    fontSize: "11px",
    marginTop: "3px",
  },

  tabs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "8px",
    background: "#e9e9e6",
    padding: "5px",
    borderRadius: "16px",
    marginBottom: "14px",
  },

  tab: {
    border: 0,
    background:
      "transparent",
    borderRadius: "12px",
    padding: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  activeTab: {
    background: "#111",
    color: "#fff",
  },

  hero: {
    background: "#111",
    color: "#fff",
    borderRadius: "25px",
    padding: "24px",
    marginBottom: "16px",
  },

  heroSmall: {
    color: "#aaa",
    fontSize: "10px",
    letterSpacing: "1.4px",
    fontWeight: "700",
  },

  heroTitle: {
    fontSize: "27px",
    lineHeight: "1.15",
    letterSpacing:
      "-0.8px",
    margin: "12px 0",
  },

  heroText: {
    color: "#bcbcbc",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
  },

  /* SEARCH */

  searchCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "16px",
    marginBottom: "10px",
  },

  searchTitle: {
    fontSize: "14px",
    fontWeight: "800",
    marginBottom: "9px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding:
      "13px 14px",
    borderRadius: "13px",
    border:
      "1px solid #ddd",
    outline: "none",
    fontSize: "13px",
    background: "#fafafa",
  },

  searchActions: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    flexWrap: "wrap",
  },

  filterButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#333",
    borderRadius: "11px",
    padding:
      "9px 12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  filterButtonActive: {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  },

  clearButton: {
    border: 0,
    background: "#f0f0ee",
    color: "#555",
    borderRadius: "11px",
    padding:
      "9px 12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  savingText: {
    color: "#888",
    fontSize: "10px",
    marginTop: "8px",
  },

  /* PREMIUM */

  premiumSection: {
    background: "#111",
    color: "#fff",
    borderRadius: "18px",
    marginBottom: "16px",
    overflow: "hidden",
  },

  premiumMainButton: {
    width: "100%",
    border: 0,
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "12px",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
  },

  premiumMainLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  premiumIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#222",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
  },

  premiumMainTitle: {
    fontSize: "13px",
    fontWeight: "900",
  },

  premiumMainSubtitle: {
    color: "#999",
    fontSize: "9px",
    marginTop: "3px",
  },

  premiumMainRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#aaa",
    fontSize: "10px",
    fontWeight: "800",
    flexShrink: 0,
  },

  premiumBody: {
    borderTop:
      "1px solid #292929",
    padding: "12px",
  },

  premiumInfo: {
    color: "#888",
    fontSize: "9px",
    marginBottom: "8px",
  },

  premiumTopicList: {
    display: "grid",
    gap: "6px",
    maxHeight: "430px",
    overflowY: "auto",
  },

  premiumTopicButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    border:
      "1px solid #2c2c2c",
    background: "#1a1a1a",
    color: "#fff",
    borderRadius: "11px",
    padding:
      "10px 11px",
    textAlign: "left",
    cursor: "pointer",
  },

  premiumTopicActive: {
    background: "#fff",
    color: "#111",
    borderColor: "#fff",
  },

  premiumTopicName: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow:
      "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "11px",
    fontWeight: "800",
  },

  premiumTopicCount: {
    flexShrink: 0,
    fontSize: "9px",
    fontWeight: "700",
    opacity: 0.7,
  },

  premiumQuestions: {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop:
      "1px solid #292929",
  },

  selectedPremiumHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "10px",
    marginBottom: "8px",
  },

  selectedPremiumTitle: {
    fontSize: "14px",
    fontWeight: "900",
  },

  selectedPremiumMeta: {
    color: "#999",
    fontSize: "9px",
    marginTop: "3px",
  },

  closePremiumButton: {
    width: "27px",
    height: "27px",
    borderRadius: "8px",
    border:
      "1px solid #333",
    background: "#1b1b1b",
    color: "#fff",
    fontSize: "17px",
    lineHeight: "1",
    cursor: "pointer",
  },

  premiumQuestionCard: {
    background: "#1b1b1b",
    border:
      "1px solid #2d2d2d",
    borderRadius: "12px",
    padding: "11px",
    marginTop: "7px",
  },

  premiumQuestionNumber: {
    color: "#aaa",
    fontSize: "9px",
    fontWeight: "800",
    marginTop: "7px",
  },

  premiumEmpty: {
    color: "#888",
    fontSize: "10px",
    padding:
      "4px 0",
  },

  /* FILTER */

  filterCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "16px",
    marginBottom: "25px",
  },

  filterTitle: {
    fontSize: "15px",
    fontWeight: "800",
    marginBottom: "10px",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "1.5fr 1fr",
    gap: "10px",
  },

  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "13px",
    border:
      "1px solid #ddd",
    background: "#fff",
    fontWeight: "600",
  },

  gs4Tabs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "8px",
    background: "#f0f0ee",
    padding: "4px",
    borderRadius: "13px",
    marginTop: "12px",
  },

  gs4Tab: {
    border: 0,
    background:
      "transparent",
    borderRadius: "10px",
    padding:
      "10px 8px",
    fontWeight: "700",
    fontSize: "12px",
    color: "#666",
    cursor: "pointer",
  },

  gs4ActiveTab: {
    background: "#111",
    color: "#fff",
  },

  statsRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: "12px",
    fontSize: "12px",
    color: "#777",
  },

  primary: {
    border: 0,
    borderRadius: "12px",
    background: "#111",
    color: "#fff",
    padding:
      "11px 15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryLight: {
    border: 0,
    borderRadius: "12px",
    background: "#fff",
    color: "#111",
    padding:
      "11px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  section: {
    marginBottom: "25px",
  },

  sectionTitle: {
    fontSize: "19px",
    fontWeight: "800",
    marginBottom: "13px",
  },

  questionCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "19px",
    padding: "16px",
    marginBottom: "10px",
  },

  mainsCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "19px",
    padding: "17px",
    marginBottom: "10px",
  },

  meta: {
    fontSize: "10px",
    color: "#888",
    fontWeight: "700",
    textTransform:
      "uppercase",
    letterSpacing: ".5px",
  },

  question: {
    fontSize: "14px",
    fontWeight: "750",
    lineHeight: "1.5",
    marginTop: "9px",
  },

  answerHint: {
    color: "#999",
    fontSize: "11px",
    marginTop: "10px",
  },

  mainsMeta: {
    display: "flex",
    gap: "8px",
    margin: "14px 0",
    fontSize: "11px",
    fontWeight: "700",
  },

  pyqActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginTop: "13px",
    flexWrap: "wrap",
  },

  smallButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    borderRadius: "10px",
    padding:
      "8px 11px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  statusSelect: {
    border:
      "1px solid #ddd",
    background: "#fff",
    borderRadius: "10px",
    padding:
      "8px 10px",
    fontSize: "11px",
    fontWeight: "700",
  },

  practiceHeader: {
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "10px",
  },

  practiceHeaderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  practiceQuestionCount: {
    fontSize: "13px",
    fontWeight: "900",
  },

  practiceProgressPercent: {
    fontSize: "9px",
    color: "#888",
    marginTop: "3px",
    fontWeight: "700",
  },

  practiceHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  timerBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid #e1e1df",
    background: "#f7f7f5",
    borderRadius: "10px",
    padding: "7px 8px",
  },

  timerIcon: {
    fontSize: "12px",
  },

  timerText: {
    fontSize: "11px",
    fontWeight: "900",
    fontVariantNumeric: "tabular-nums",
    minWidth: "38px",
  },

  timerButton: {
    width: "22px",
    height: "22px",
    border: 0,
    borderRadius: "7px",
    background: "#111",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "900",
    cursor: "pointer",
  },

  gridButton: {
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    fontSize: "19px",
    fontWeight: "800",
    cursor: "pointer",
  },

  gridButtonActive: {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  },

  progressTrack: {
    width: "100%",
    height: "4px",
    background: "#e8e8e5",
    borderRadius: "999px",
    overflow: "hidden",
    marginTop: "12px",
  },

  progressFill: {
    height: "100%",
    background: "#111",
    borderRadius: "999px",
    transition: "width 300ms ease",
  },

  practiceHeaderBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "9px",
  },

  practiceExitButton: {
    border: 0,
    background: "transparent",
    color: "#777",
    padding: "3px 0",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  timerState: {
    color: "#999",
    fontSize: "9px",
    fontWeight: "700",
  },

  questionGridPanel: {
    marginTop: "13px",
    paddingTop: "13px",
    borderTop: "1px solid #e5e5e3",
  },

  questionGridHeader: {
    marginBottom: "10px",
  },

  questionGridTitle: {
    fontSize: "12px",
    fontWeight: "900",
  },

  questionGridSubtitle: {
    color: "#888",
    fontSize: "9px",
    marginTop: "2px",
  },

  questionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(42px, 1fr))",
    gap: "6px",
    maxHeight: "250px",
    overflowY: "auto",
    paddingRight: "2px",
  },

  gridQuestion: {
    minHeight: "38px",
    borderRadius: "9px",
    border: "1px solid #ddd",
    background: "#fafafa",
    color: "#333",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  gridQuestionActive: {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  },

  gridQuestionAnswered: {
    background: "#e9e9e6",
    color: "#111",
    borderColor: "#ccc",
  },

  gridLegend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "11px",
    color: "#777",
    fontSize: "9px",
    fontWeight: "700",
  },

  legendItem: {
    display: "inline-flex",
    alignItems: "center",
  },

  legendDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "3px",
    marginRight: "4px",
  },

  legendCurrent: {
    background: "#111",
  },

  legendAnswered: {
    background: "#ccc",
  },

  legendUnanswered: {
    background: "#fafafa",
    border: "1px solid #ccc",
  },

  practiceTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "10px",
    fontSize: "12px",
    fontWeight: "700",
  },

  textButton: {
    border: 0,
    background:
      "transparent",
    fontWeight: "700",
    cursor: "pointer",
  },

  options: {
    display: "grid",
    gap: "9px",
    marginTop: "15px",
  },

  option: {
    display: "flex",
    gap: "10px",
    alignItems:
      "flex-start",
    textAlign: "left",
    width: "100%",
    padding: "12px",
    borderRadius: "13px",
    border:
      "1px solid #e2e2e0",
    background: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  },

  correct: {
    border:
      "1px solid #111",
    background: "#f0f0ee",
  },

  wrong: {
    border:
      "1px solid #777",
    background: "#f5f5f3",
  },

  translationRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    marginBottom: "10px",
  },

  translationToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: "3px",
    borderRadius: "11px",
    background: "#e9e9e6",
    border: "1px solid #ddd",
  },

  translationOption: {
    border: 0,
    background: "transparent",
    color: "#555",
    borderRadius: "8px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  translationOptionActive: {
    background: "#111",
    color: "#fff",
  },

  translationLabel: {
    color: "#777",
    fontSize: "10px",
    fontWeight: "700",
  },

  translationError: {
    color: "#777",
    background: "#f0f0ee",
    borderRadius: "9px",
    padding: "8px 10px",
    fontSize: "10px",
    marginBottom: "9px",
  },

  explanation: {
    marginTop: "16px",
    padding: "16px",
    borderRadius: "16px",
    background: "#f5f5f3",
    border: "1px solid #e3e3e0",
    fontSize: "12px",
    lineHeight: "1.6",
  },

  explanationStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "12px",
    marginBottom: "14px",
    borderBottom: "1px solid #dededb",
    fontSize: "13px",
    fontWeight: "800",
  },

  explanationStatusCorrect: {
    color: "#111",
  },

  explanationStatusWrong: {
    color: "#555",
  },

  explanationStatusDot: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "900",
    flexShrink: 0,
  },

  explanationSection: {
    marginBottom: "14px",
  },

  explanationHeading: {
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px",
    color: "#111",
  },

  explanationBody: {
    color: "#333",
  },

  explanationParagraph: {
    margin: "0 0 8px",
    lineHeight: "1.65",
  },

  keywordSection: {
    marginTop: "14px",
    paddingTop: "13px",
    borderTop: "1px solid #dededb",
  },

  keywordHeading: {
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "9px",
    color: "#111",
  },

  keywordList: {
    display: "grid",
    gap: "8px",
  },

  keywordItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "7px",
    padding: "8px 9px",
    borderRadius: "10px",
    background: "#fff",
    border: "1px solid #e2e2df",
  },

  keywordBullet: {
    fontWeight: "900",
    lineHeight: "1.5",
  },

  keywordContent: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 6px",
    lineHeight: "1.5",
    minWidth: 0,
  },

  keywordTerm: {
    fontWeight: "800",
  },

  keywordMeaning: {
    color: "#666",
  },

  resultCard: {
    background: "#111",
    color: "#fff",
    borderRadius: "24px",
    padding: "25px",
    textAlign: "center",
    marginBottom: "25px",
  },

  resultLabel: {
    fontSize: "10px",
    letterSpacing:
      "1.4px",
    color: "#aaa",
    fontWeight: "700",
  },

  resultScore: {
    fontSize: "48px",
    fontWeight: "900",
    marginTop: "8px",
  },

  infoCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    gap: "13px",
    alignItems:
      "flex-start",
  },

  infoIcon: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "13px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
  },

  infoTitle: {
    fontSize: "14px",
    fontWeight: "800",
  },

  infoText: {
    color: "#858585",
    fontSize: "11px",
    lineHeight: "1.5",
    marginTop: "5px",
  },
};
