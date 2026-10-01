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

const prelimsPYQs = [
  {
    id: 1,
    year: 2025,
    subject: "Polity",
    topic: "Constitution",
    question:
      "Which Article of the Constitution primarily deals with protection of life and personal liberty?",
    options: [
      "Article 14",
      "Article 19",
      "Article 21",
      "Article 32",
    ],
    answer: 2,
    explanation:
      "Article 21 provides protection of life and personal liberty.",
  },
  {
    id: 2,
    year: 2024,
    subject: "Economy",
    topic: "Inflation",
    question:
      "Which index is primarily used to measure changes in retail prices faced by consumers?",
    options: [
      "Consumer Price Index",
      "Wholesale Price Index",
      "GDP Deflator",
      "Index of Industrial Production",
    ],
    answer: 0,
    explanation:
      "CPI measures changes in the prices of a basket of goods and services consumed by households.",
  },
  {
    id: 3,
    year: 2024,
    subject: "Environment",
    topic: "Biodiversity",
    question:
      "A biodiversity hotspot is primarily associated with high endemism and significant habitat loss.",
    options: [
      "Both statements are relevant",
      "Only high endemism",
      "Only habitat loss",
      "Neither",
    ],
    answer: 0,
    explanation:
      "The hotspot concept combines exceptional endemic biodiversity with substantial habitat loss.",
  },
  {
    id: 4,
    year: 2023,
    subject: "Geography",
    topic: "Monsoon",
    question:
      "Seasonal reversal of winds is a defining characteristic of which phenomenon?",
    options: [
      "Western Disturbance",
      "Indian Monsoon",
      "Local Winds",
      "Jet Stream",
    ],
    answer: 1,
    explanation:
      "The Indian monsoon involves a large-scale seasonal reversal of wind patterns.",
  },
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

  const [mainsPYQs, setMainsPYQs] = useState([]);
  const [mainsLoading, setMainsLoading] = useState(false);
  const [mainsError, setMainsError] = useState("");

  const [mode, setMode] = useState("browse");

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    let attempts = 0;
    let stopped = false;

    const authenticate = async () => {
      if (stopped) return;

      attempts++;

      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        if (attempts < 50) {
          setTimeout(authenticate, 200);
          return;
        }

        setError(
          "Telegram authentication data nahi mila. Mini App ko Telegram ke andar se reopen karein."
        );

        setLoading(false);
        return;
      }

      webApp.ready();
      webApp.expand();

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `tma ${webApp.initData}`,
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Authentication failed"
          );
        }

        if (!data.user) {
          throw new Error(
            "User information nahi mili."
          );
        }

        setUser(data.user);
      } catch (err) {
        console.error(
          "PYQ authentication error:",
          err
        );

        setError(
          err.message ||
            "Authentication failed."
        );
      } finally {
        setLoading(false);
      }
    };

    authenticate();

    return () => {
      stopped = true;
    };
  }, []);

  /* ---------------- LOAD MAINS FROM API ---------------- */

  useEffect(() => {
    let cancelled = false;

    const loadMainsPYQs = async () => {
      setMainsLoading(true);
      setMainsError("");

      try {
        const response = await fetch(
          "/api/pyq/mains",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Mains PYQ fetch failed"
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
        console.error(
          "Mains PYQ load error:",
          err
        );

        if (!cancelled) {
          setMainsError(
            err.message ||
              "Mains PYQ load failed."
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

  /* ---------------- FILTERS ---------------- */

  const filteredPrelims = useMemo(() => {
    return prelimsPYQs.filter((q) => {
      const subjectMatch =
        prelimsSubject === "All" ||
        q.subject === prelimsSubject;

      const yearMatch =
        prelimsYear === "All" ||
        q.year === Number(prelimsYear);

      return (
        subjectMatch &&
        yearMatch
      );
    });
  }, [
    prelimsSubject,
    prelimsYear,
  ]);

  const filteredMains = useMemo(() => {
    return mainsPYQs.filter((q) => {
      const paperMatch =
        mainsPaper === "All" ||
        q.paper === mainsPaper;

      const yearMatch =
        mainsYear === "All" ||
        q.year === Number(mainsYear);

      return (
        paperMatch &&
        yearMatch
      );
    });
  }, [
    mainsPYQs,
    mainsPaper,
    mainsYear,
  ]);

  /* ---------------- PRELIMS PRACTICE ---------------- */

  const score = filteredPrelims.reduce(
    (total, q) =>
      total +
      (answers[q.id] === q.answer
        ? 1
        : 0),
    0
  );

  const startPractice = () => {
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
    setMode("practice");
  };

  const chooseAnswer = (index) => {
    if (
      selected !== null ||
      finished
    ) {
      return;
    }

    const question =
      filteredPrelims[current];

    setSelected(index);

    setAnswers((prev) => ({
      ...prev,
      [question.id]: index,
    }));
  };

  const nextQuestion = () => {
    if (
      current >=
      filteredPrelims.length - 1
    ) {
      setFinished(true);
      return;
    }

    setCurrent(
      (value) => value + 1
    );

    setSelected(null);
  };

  const changeSection = (value) => {
    setSection(value);
    setMode("browse");
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <h2 style={styles.brand}>
              SAMBHAV UPSC
            </h2>

            <p style={styles.muted}>
              Opening PYQ Intelligence...
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

        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <h2 style={styles.brand}>
              SAMBHAV UPSC
            </h2>

            <h3
              style={{
                marginTop: "22px",
              }}
            >
              Authentication Error
            </h3>

            <p style={styles.muted}>
              {error ||
                "User information nahi mili."}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              style={styles.primary}
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  /* ---------------- ACCESS CHECK ---------------- */

  if (user.status !== "approved") {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <h2 style={styles.brand}>
              SAMBHAV UPSC
            </h2>

            <h3
              style={{
                marginTop: "22px",
              }}
            >
              Access {user.status}
            </h3>

            <p style={styles.muted}>
              {user.status === "pending"
                ? "Admin approval pending."
                : user.status === "rejected"
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

      <main style={styles.page}>
        <div style={styles.container}>

          {/* HEADER */}

          <header style={styles.header}>
            <button
              onClick={() =>
                router.push("/")
              }
              style={styles.back}
            >
              ←
            </button>

            <div>
              <div style={styles.brand}>
                PYQ Intelligence
              </div>

              <div style={styles.subtitle}>
                UPSC Previous Year Questions
              </div>
            </div>
          </header>

          {/* TABS */}

          <div style={styles.tabs}>
            <button
              onClick={() =>
                changeSection("prelims")
              }
              style={{
                ...styles.tab,
                ...(section === "prelims"
                  ? styles.activeTab
                  : {}),
              }}
            >
              Prelims PYQ
            </button>

            <button
              onClick={() =>
                changeSection("mains")
              }
              style={{
                ...styles.tab,
                ...(section === "mains"
                  ? styles.activeTab
                  : {}),
              }}
            >
              Mains PYQ
            </button>
          </div>

          {/* HERO */}

          <section style={styles.hero}>
            <div style={styles.heroSmall}>
              UPSC PYQ INTELLIGENCE
            </div>

            <h1 style={styles.heroTitle}>
              {section === "prelims"
                ? "Master Prelims PYQs."
                : "Master Mains PYQs."}
            </h1>

            <p style={styles.heroText}>
              {section === "prelims"
                ? "Subject, year and topic-wise MCQ practice with explanations."
                : "GS papers and Essay questions with marks and word limits."}
            </p>
          </section>

          {/* ---------------- PRELIMS ---------------- */}

          {section === "prelims" && (
            <>
              <section
                style={styles.filterCard}
              >
                <div
                  style={styles.filterTitle}
                >
                  Prelims Filters
                </div>

                <div
                  style={styles.filterGrid}
                >
                  <select
                    value={prelimsSubject}
                    onChange={(e) => {
                      setPrelimsSubject(
                        e.target.value
                      );
                      setMode("browse");
                    }}
                    style={styles.select}
                  >
                    {prelimsSubjects.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={prelimsYear}
                    onChange={(e) => {
                      setPrelimsYear(
                        e.target.value
                      );
                      setMode("browse");
                    }}
                    style={styles.select}
                  >
                    <option value="All">
                      All Years
                    </option>

                    <option value="2025">
                      2025
                    </option>

                    <option value="2024">
                      2024
                    </option>

                    <option value="2023">
                      2023
                    </option>
                  </select>
                </div>

                <div
                  style={styles.statsRow}
                >
                  <span>
                    {
                      filteredPrelims.length
                    }{" "}
                    Questions
                  </span>

                  <button
                    onClick={
                      startPractice
                    }
                    style={styles.primary}
                  >
                    Start Practice
                  </button>
                </div>
              </section>

              {mode === "browse" && (
                <section
                  style={styles.section}
                >
                  <div
                    style={
                      styles.sectionTitle
                    }
                  >
                    Prelims PYQs
                  </div>

                  {filteredPrelims.map(
                    (q, index) => (
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
                          {q.subject} ·{" "}
                          {q.topic}
                        </div>

                        <div
                          style={
                            styles.question
                          }
                        >
                          {index + 1}.{" "}
                          {q.question}
                        </div>

                        <div
                          style={
                            styles.answerHint
                          }
                        >
                          MCQ · 4 Options
                        </div>
                      </div>
                    )
                  )}
                </section>
              )}

              {mode === "practice" &&
                filteredPrelims.length >
                  0 &&
                !finished && (
                  <section
                    style={styles.section}
                  >
                    <div
                      style={
                        styles.practiceTop
                      }
                    >
                      <span>
                        Question{" "}
                        {current + 1} /{" "}
                        {
                          filteredPrelims.length
                        }
                      </span>

                      <button
                        onClick={() =>
                          setMode(
                            "browse"
                          )
                        }
                        style={
                          styles.textButton
                        }
                      >
                        Exit
                      </button>
                    </div>

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
                          styles.question
                        }
                      >
                        {
                          filteredPrelims[
                            current
                          ].question
                        }
                      </div>

                      <div
                        style={
                          styles.options
                        }
                      >
                        {filteredPrelims[
                          current
                        ].options.map(
                          (
                            option,
                            index
                          ) => {
                            const correct =
                              index ===
                              filteredPrelims[
                                current
                              ].answer;

                            const chosen =
                              selected ===
                              index;

                            return (
                              <button
                                key={
                                  option
                                }
                                onClick={() =>
                                  chooseAnswer(
                                    index
                                  )
                                }
                                style={{
                                  ...styles.option,
                                  ...(selected !==
                                    null &&
                                  correct
                                    ? styles.correct
                                    : {}),
                                  ...(selected !==
                                    null &&
                                  chosen &&
                                  !correct
                                    ? styles.wrong
                                    : {}),
                                }}
                              >
                                <b>
                                  {String.fromCharCode(
                                    65 +
                                      index
                                  )}
                                  .
                                </b>

                                <span>
                                  {option}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>

                      {selected !==
                        null && (
                        <div
                          style={
                            styles.explanation
                          }
                        >
                          <strong>
                            {selected ===
                            filteredPrelims[
                              current
                            ].answer
                              ? "Correct"
                              : "Incorrect"}
                          </strong>

                          <p>
                            {
                              filteredPrelims[
                                current
                              ].explanation
                            }
                          </p>

                          <button
                            onClick={
                              nextQuestion
                            }
                            style={
                              styles.primary
                            }
                          >
                            {current ===
                            filteredPrelims.length -
                              1
                              ? "Finish"
                              : "Next Question →"}
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                )}

              {finished && (
                <section
                  style={styles.resultCard}
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
                      color: "#aaa",
                    }}
                  >
                    Accuracy{" "}
                    {filteredPrelims.length
                      ? Math.round(
                          (score /
                            filteredPrelims.length) *
                            100
                        )
                      : 0}
                    %
                  </p>

                  <button
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

          {section === "mains" && (
            <>
              <section
                style={styles.filterCard}
              >
                <div
                  style={styles.filterTitle}
                >
                  Mains Filters
                </div>

                <div
                  style={styles.filterGrid}
                >
                  <select
                    value={mainsPaper}
                    onChange={(e) =>
                      setMainsPaper(
                        e.target.value
                      )
                    }
                    style={styles.select}
                  >
                    {mainsPapers.map(
                      (paper) => (
                        <option
                          key={paper}
                          value={paper}
                        >
                          {paper}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={mainsYear}
                    onChange={(e) =>
                      setMainsYear(
                        e.target.value
                      )
                    }
                    style={styles.select}
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
                          .filter(Boolean)
                      ),
                    ]
                      .sort(
                        (a, b) =>
                          Number(b) -
                          Number(a)
                      )
                      .map(
                        (year) => (
                          <option
                            key={year}
                            value={year}
                          >
                            {year}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div
                  style={styles.statsRow}
                >
                  <span>
                    {mainsLoading
                      ? "Loading..."
                      : `${filteredMains.length} Questions`}
                  </span>
                </div>
              </section>

              <section
                style={styles.section}
              >
                <div
                  style={styles.sectionTitle}
                >
                  Mains PYQs
                </div>

                {mainsLoading && (
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
                      Loading Mains PYQs...
                    </div>

                    <div
                      style={
                        styles.answerHint
                      }
                    >
                      Supabase se questions
                      load ho rahe hain.
                    </div>
                  </div>
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
                        Mains PYQ load nahi
                        hua.
                      </div>

                      <div
                        style={
                          styles.answerHint
                        }
                      >
                        {mainsError}
                      </div>

                      <button
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
                        No Mains PYQs found.
                      </div>

                      <div
                        style={
                          styles.answerHint
                        }
                      >
                        Selected filters ke
                        liye data available
                        nahi hai.
                      </div>
                    </div>
                  )}

                {!mainsLoading &&
                  !mainsError &&
                  filteredMains.map(
                    (q, index) => (
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
                          {q.paper} ·{" "}
                          {q.topic ||
                            "General"}
                        </div>

                        <div
                          style={
                            styles.question
                          }
                        >
                          {index + 1}.{" "}
                          {q.question}
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
                          onClick={() =>
                            alert(
                              "Mains answer writing mode next layer mein connect hoga."
                            )
                          }
                          style={
                            styles.primary
                          }
                        >
                          Start Answer Writing
                        </button>
                      </div>
                    )
                  )}
              </section>
            </>
          )}

          {/* ANALYTICS */}

          <section
            style={styles.infoCard}
          >
            <div
              style={styles.infoIcon}
            >
              ✦
            </div>

            <div>
              <div
                style={styles.infoTitle}
              >
                PYQ Analytics
              </div>

              <div
                style={styles.infoText}
              >
                Attempts, accuracy, topic
                frequency and performance
                tracking will be connected
                to the user account in the
                next data layer.
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}

/* ---------------- STYLES ---------------- */

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
    padding: "18px 16px 40px",
  },

  loadingBox: {
    maxWidth: "500px",
    margin: "70px auto",
    padding: "30px",
    textAlign: "center",
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "24px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
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
    border: "1px solid #e4e4e2",
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
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    background: "#e9e9e6",
    padding: "5px",
    borderRadius: "16px",
    marginBottom: "14px",
  },

  tab: {
    border: 0,
    background: "transparent",
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
    letterSpacing: "-0.8px",
    margin: "12px 0",
  },

  heroText: {
    color: "#bcbcbc",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
  },

  filterCard: {
    background: "#fff",
    border: "1px solid #e5e5e3",
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
    gridTemplateColumns: "1.5fr 1fr",
    gap: "10px",
  },

  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "13px",
    border: "1px solid #ddd",
    background: "#fff",
    fontWeight: "600",
  },

  statsRow: {
    display: "flex",
    justifyContent: "space-between",
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
    padding: "11px 15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryLight: {
    border: 0,
    borderRadius: "12px",
    background: "#fff",
    color: "#111",
    padding: "11px 18px",
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
    border: "1px solid #e5e5e3",
    borderRadius: "19px",
    padding: "16px",
    marginBottom: "10px",
  },

  mainsCard: {
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "19px",
    padding: "17px",
    marginBottom: "10px",
  },

  meta: {
    fontSize: "10px",
    color: "#888",
    fontWeight: "700",
    textTransform: "uppercase",
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

  practiceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    fontSize: "12px",
    fontWeight: "700",
  },

  textButton: {
    border: 0,
    background: "transparent",
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
    alignItems: "flex-start",
    textAlign: "left",
    width: "100%",
    padding: "12px",
    borderRadius: "13px",
    border: "1px solid #e2e2e0",
    background: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  },

  correct: {
    border: "1px solid #111",
    background: "#f0f0ee",
  },

  wrong: {
    border: "1px solid #777",
    background: "#f5f5f3",
  },

  explanation: {
    marginTop: "14px",
    padding: "13px",
    borderRadius: "14px",
    background: "#f5f5f3",
    fontSize: "12px",
    lineHeight: "1.5",
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
    letterSpacing: "1.4px",
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
    border: "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
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
    justifyContent: "center",
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
