"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ART_CULTURE_SUBJECT } from "./data/art-culture";

const PAPERS = ["GS I", "GS II", "GS III", "GS IV"];

const TOPICS = {
  "GS I": [
    { name: "भारतीय समाज की विशेषताएँ", subject: "Indian Society", keywords: ["caste", "women", "population", "communal", "secular", "social"] },
    { name: "विश्व इतिहास", subject: "World History", keywords: ["world history", "industrial revolution", "world war", "colonial"] },
    { name: "भारतीय कला एवं संस्कृति", subject: "Art and Culture", keywords: ["culture", "art", "architecture", "temple", "literature", "heritage"] },
    { name: "आधुनिक भारतीय इतिहास", subject: "Modern History", keywords: ["freedom", "national movement", "british", "independence"] },
    { name: "भूगोल एवं संसाधन", subject: "Geography", keywords: ["geography", "monsoon", "river", "resource", "climate", "urbanization", "agriculture"] },
  ],
  "GS II": [
    { name: "भारतीय संविधान", subject: "Constitution", keywords: ["constitution", "constitutional", "basic structure", "amendment", "preamble"] },
    { name: "संसद", subject: "Parliament", keywords: ["parliament", "speaker", "legislature", "bill", "privilege"] },
    { name: "राज्य विधानमंडल", subject: "State Legislature", keywords: ["state legislature", "legislative council", "state assembly"] },
    { name: "कार्यपालिका", subject: "Executive", keywords: ["president", "ordinance", "pardon", "prime minister", "council of ministers", "cabinet"] },
    { name: "न्यायपालिका", subject: "Judiciary", keywords: ["judiciary", "judicial review", "supreme court", "high court", "judicial activism"] },
    { name: "संघवाद", subject: "Federalism", keywords: ["federal", "centre-state", "inter-state", "fiscal federalism"] },
    { name: "संवैधानिक निकाय", subject: "Constitutional Bodies", keywords: ["election commission", "cag", "upsc", "finance commission"] },
    { name: "शासन एवं जवाबदेही", subject: "Governance", keywords: ["governance", "transparency", "accountability", "citizen charter", "e-governance", "social audit"] },
    { name: "सामाजिक न्याय", subject: "Social Justice", keywords: ["welfare", "social justice", "health", "education", "vulnerable"] },
    { name: "भारत की विदेश नीति", subject: "International Relations", keywords: ["international", "foreign policy", "bilateral", "multilateral", "neighbourhood"] },
  ],
  "GS III": [
    { name: "अर्थव्यवस्था", subject: "Economy", keywords: ["economy", "economic", "growth", "inflation", "fiscal", "inclusive", "gdp", "banking"] },
    { name: "कृषि एवं खाद्य सुरक्षा", subject: "Agriculture", keywords: ["agriculture", "farmer", "irrigation", "food security", "cropping", "minimum support price"] },
    { name: "विज्ञान एवं प्रौद्योगिकी", subject: "Science and Technology", keywords: ["science", "technology", "space", "biotechnology", "artificial intelligence"] },
    { name: "पर्यावरण एवं जैव विविधता", subject: "Environment", keywords: ["environment", "biodiversity", "pollution", "climate change", "conservation", "forest"] },
    { name: "आंतरिक सुरक्षा", subject: "Internal Security", keywords: ["internal security", "terrorism", "left wing extremism", "cyber", "border", "insurgency"] },
    { name: "आपदा प्रबंधन", subject: "Disaster Management", keywords: ["disaster", "flood", "earthquake", "cyclone", "risk reduction", "resilience"] },
    { name: "अवसंरचना", subject: "Infrastructure", keywords: ["infrastructure", "investment", "transport", "energy", "logistics"] },
  ],
  "GS IV": [
    { name: "नैतिकता एवं मानवीय मूल्य", subject: "Ethics and Human Values", keywords: ["ethics", "values", "human values", "integrity", "honesty"] },
    { name: "अभिवृत्ति एवं भावनात्मक बुद्धिमत्ता", subject: "Attitude and Emotional Intelligence", keywords: ["attitude", "emotional intelligence", "empathy", "aptitude"] },
    { name: "लोक सेवा के मूल्य", subject: "Public Service Values", keywords: ["public service", "impartiality", "objectivity", "non-partisanship", "compassion"] },
    { name: "शासन में नैतिकता", subject: "Ethics in Governance", keywords: ["corruption", "accountability", "transparency", "code of conduct"] },
    { name: "केस स्टडी", subject: "Case Studies", keywords: ["case study", "stakeholder", "ethical dilemma", "course of action"] },
  ],
};

const STAGES = [
  "Topic Preparation",
  "Revision & PYQ",
  "Answer Writing",
  "Evaluation & Review",
];

const GENERAL_TASKS = {
  0: [
    "Syllabus demand aur basic concepts samjhein",
    "Key dimensions aur subtopics ke notes banayein",
    "Mind map ya flowchart banayein",
    "Relevant examples aur case studies jodein",
    "Short revision notes complete karein",
  ],
  1: [
    "Short notes revise karein",
    "Mapped PYQs ki wording aur directive samjhein",
    "Har question ke key dimensions identify karein",
    "PYQ practice aur mistake notes complete karein",
  ],
  2: [
    "10-marker ke liye 150-word answer likhein",
    "15-marker ke liye 250-word answer likhein",
    "Introduction, body aur conclusion check karein",
  ],
  3: [
    "Answer evaluation feedback review karein",
    "Feedback ke mutabik answer improve karein",
    "Weak points mistake notebook mein likhein",
    "Revision complete karein",
  ],
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionText(q) {
  return `${q.question || ""} ${q.question_hi || ""} ${q.topic || ""}`;
}

function matchesGeneralTopic(q, topic) {
  const text = normalize(questionText(q));
  const tag = normalize(q.topic);
  if (tag && (tag === normalize(topic.subject) || tag === normalize(topic.name))) {
    return true;
  }
  return topic.keywords.some((word) => {
    const keyword = normalize(word);
    return keyword.length >= 5 && text.includes(keyword);
  });
}

function getThemeQuestions(questions, theme) {
  const exactTopics = (theme.match?.topics || []).map(normalize);
  const keywords = (theme.match?.keywords || []).map(normalize);

  return questions.filter((q) => {
    if (normalize(q.paper) !== "gs1") return false;

    const tag = normalize(q.topic);
    const text = normalize(questionText(q));

    // Exact topic tags are preferred. Specific question keywords are fallback.
    if (exactTopics.includes(tag)) return true;

    return keywords.some((keyword) => keyword.length >= 5 && text.includes(keyword));
  });
}

function makeStyles() {
  return {
    page: {
      minHeight: "100vh",
      background: "#f4f6f8",
      color: "#17202b",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "16px 12px 48px",
    },
    shell: {
      maxWidth: 1280,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.65fr) minmax(280px, .85fr)",
      gap: 16,
    },
    card: {
      background: "#fff",
      border: "1px solid #e4e8ed",
      borderRadius: 16,
      padding: 18,
    },
    button: {
      border: "1px solid #d8dfe7",
      borderRadius: 10,
      padding: "10px 12px",
      background: "#fff",
      color: "#1b2734",
      cursor: "pointer",
      fontWeight: 700,
    },
    primary: {
      border: "1px solid #3158ed",
      borderRadius: 10,
      padding: "11px 14px",
      background: "#3158ed",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 800,
    },
  };
}

export default function MainsRoadmapPage() {
  const router = useRouter();
  const styles = makeStyles();

  const [paper, setPaper] = useState("GS I");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTopic, setActiveTopic] = useState("Art and Culture");
  const [activeTheme, setActiveTheme] = useState("");
  const [stage, setStage] = useState(0);
  const [completed, setCompleted] = useState({});
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("sambhav-mains-roadmap-v2") || "{}"
      );
      if (saved.paper && PAPERS.includes(saved.paper)) setPaper(saved.paper);
      if (saved.activeTopic) setActiveTopic(saved.activeTopic);
      if (saved.activeTheme) setActiveTheme(saved.activeTheme);
      if (Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage < 4) {
        setStage(saved.stage);
      }
      if (saved.completed && typeof saved.completed === "object") {
        setCompleted(saved.completed);
      }
    } catch {
      // Invalid local state is ignored.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sambhav-mains-roadmap-v2",
        JSON.stringify({ paper, activeTopic, activeTheme, stage, completed })
      );
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, [paper, activeTopic, activeTheme, stage, completed]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [authResponse, pyqResponse] = await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/pyq/mains", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const [auth, pyqData] = await Promise.all([
          authResponse.json().catch(() => ({})),
          pyqResponse.json().catch(() => ({})),
        ]);

        if (!authResponse.ok || !auth?.user) {
          router.replace("/login");
          return;
        }

        if (!pyqResponse.ok) {
          throw new Error(pyqData?.error || "Mains PYQs load nahi hue.");
        }

        const rows = Array.isArray(pyqData?.pyqs)
          ? pyqData.pyqs.map((q, index) => ({
              ...q,
              id: String(q.id ?? `${q.year ?? "x"}-${index}`),
              question: q.question || "",
            }))
          : [];

        if (!cancelled) setQuestions(rows);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Roadmap load nahi hua.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const topics = TOPICS[paper] || [];

  const topicStats = useMemo(() => {
    return topics.map((topic) => {
      const mapped = questions.filter((q) => matchesGeneralTopic(q, topic));
      const key = `${paper}:${topic.subject}`;

      // Existing broad topics retain a heuristic label, not an official prediction.
      const priority = mapped.length >= 6 ? "P1" : mapped.length >= 3 ? "P2" : "P3";

      return { ...topic, key, mapped, priority };
    });
  }, [topics, questions, paper]);

  const isArtCulture = paper === "GS I" && activeTopic === "Art and Culture";

  const artThemes = useMemo(() => {
    return ART_CULTURE_SUBJECT.themes.map((theme) => {
      const mapped = getThemeQuestions(questions, theme);
      const key = `GS I:Art and Culture:${theme.id}`;

      const taskCount = theme.studyTasks.reduce(
        (sum, group) => sum + group.items.length,
        0
      );

      const studyDone = theme.studyTasks.reduce(
        (sum, group) =>
          sum +
          group.items.filter((_, index) =>
            completed[`${key}:study:${group.id}:${index}`]
          ).length,
        0
      );

      const allMappedAttempted =
        mapped.length > 0 &&
        mapped.every((q) => completed[`${key}:pyq:${q.id}`]);

      const writingDone = !!completed[`${key}:writing:confirmed`];
      const evaluationDone = !!completed[`${key}:evaluation:confirmed`];

      const unlocked = true;
      const finished =
        studyDone === taskCount &&
        allMappedAttempted &&
        writingDone &&
        evaluationDone;

      return {
        ...theme,
        key,
        mapped,
        taskCount,
        studyDone,
        allMappedAttempted,
        writingDone,
        evaluationDone,
        unlocked,
        finished,
      };
    });
  }, [questions, completed]);

  const currentGeneral =
    topicStats.find((topic) => topic.subject === activeTopic) || topicStats[0];

  const currentTheme =
    artThemes.find((theme) => theme.id === activeTheme) ||
    artThemes.find((theme) => !theme.finished) ||
    artThemes[0];

  const visibleTopics = topicStats.filter((topic) =>
    normalize(`${topic.name} ${topic.subject} ${topic.mapped.map(questionText).join(" ")}`)
      .includes(normalize(search))
  );

  const p1Count = topicStats.filter((topic) => topic.priority === "P1").length;
  const p2Count = topicStats.filter((topic) => topic.priority === "P2").length;
  const p3Count = topicStats.filter((topic) => topic.priority === "P3").length;

  function setCheck(key, value) {
    setCompleted((previous) => ({ ...previous, [key]: value }));
  }

  function choosePaper(nextPaper) {
    setPaper(nextPaper);
    setStage(0);
    setNotice("");

    if (nextPaper === "GS I") {
      setActiveTopic("Art and Culture");
    } else {
      setActiveTopic("");
    }

    setActiveTheme("");
  }

  function chooseTheme(theme) {
    setActiveTheme(theme.id);
    setStage(0);
    setNotice("");
  }

  function nextStage() {
    if (stage < 3) {
      setStage(stage + 1);
      return;
    }

    if (isArtCulture && currentTheme) {
      if (!currentTheme.finished) {
        setNotice(
          "Agla theme unlock karne se pehle study tasks, mapped PYQs, answer writing aur evaluation complete karein."
        );
        return;
      }

      const currentIndex = artThemes.findIndex(
        (theme) => theme.id === currentTheme.id
      );
      const nextTheme = artThemes[currentIndex + 1];

      if (nextTheme) {
        setActiveTheme(nextTheme.id);
        setStage(0);
        setNotice("Current theme complete. Agla theme open ho gaya.");
      } else {
        setNotice("Art & Culture ke saare listed themes complete ho gaye.");
      }
      return;
    }

    const currentIndex = topicStats.findIndex(
      (topic) => topic.subject === currentGeneral?.subject
    );
    const nextTopic = topicStats[currentIndex + 1];

    if (nextTopic) {
      setActiveTopic(nextTopic.subject);
      setStage(0);
    } else {
      setNotice("Is paper ke listed topics mein yeh last topic hai.");
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        Mains Roadmap load ho raha hai…
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.page}>
        <section style={{ ...styles.card, maxWidth: 720, margin: "30px auto" }}>
          <h1>Mains Roadmap</h1>
          <p>{error}</p>
          <button
            style={styles.button}
            onClick={() => router.push("/mission-pyq")}
          >
            Mission PYQ kholen
          </button>
        </section>
      </main>
    );
  }

  const currentKey = isArtCulture ? currentTheme?.key : currentGeneral?.key;
  const generalMapped = currentGeneral?.mapped || [];

  return (
    <main style={styles.page}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible {
          outline: 2px solid #3158ed;
          outline-offset: 2px;
        }
        @media (max-width: 850px) {
          .roadmap-shell { grid-template-columns: 1fr !important; }
          .roadmap-side { order: -1; }
          .roadmap-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
        }
      `}</style>

      <header
        className="roadmap-header"
        style={{
          maxWidth: 1280,
          margin: "0 auto 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div>
          <button
            style={styles.button}
            onClick={() => router.push("/premium/home")}
          >
            ← Dashboard
          </button>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>
            Mains Roadmap › {paper} ›{" "}
            {isArtCulture ? "Art & Culture" : currentGeneral?.subject}
          </div>
          <h1 style={{ margin: "8px 0 4px", fontSize: "clamp(25px,4vw,34px)" }}>
            Mains Roadmap — {paper}
          </h1>
          <p style={{ margin: 0, color: "#64748b" }}>
            Existing PYQs, study tasks aur answer-writing workflow
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            aria-label="Search topics and PYQs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search topics, PYQs…"
            style={{
              minWidth: 180,
              padding: 11,
              border: "1px solid #d8dfe7",
              borderRadius: 10,
              background: "white",
            }}
          />
          <button
            style={styles.button}
            onClick={() =>
              setNotice(
                "Prepare → Revision & PYQ → Answer Writing → Evaluation. Art & Culture progress is stored in this browser."
              )
            }
          >
            How it works?
          </button>
        </div>
      </header>

      <div className="roadmap-shell" style={styles.shell}>
        <section style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <section style={styles.card}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PAPERS.map((item) => (
                <button
                  key={item}
                  style={{
                    ...styles.button,
                    background: item === paper ? "#3158ed" : "#fff",
                    color: item === paper ? "#fff" : "#17202b",
                  }}
                  onClick={() => choosePaper(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {!isArtCulture && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  {[
                    ["P1", "Highly Repeated", p1Count],
                    ["P2", "Repeated", p2Count],
                    ["P3", "Remaining", p3Count],
                  ].map(([label, description, count]) => (
                    <div
                      key={label}
                      style={{
                        border: "1px solid #e4e8ed",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <strong style={{ fontSize: 22 }}>{label}</strong>
                      <div style={{ fontSize: 12 }}>{description}</div>
                      <small>{count} topics</small>
                    </div>
                  ))}
                </div>
                <p style={{ color: "#64748b", fontSize: 11 }}>
                  Other GS topics retain their existing keyword-based heuristic.
                  Counts are not official UPSC predictions.
                </p>
              </>
            )}
          </section>

          {isArtCulture && currentTheme && (
            <>
              <section
                style={{
                  ...styles.card,
                  background: "#eef5ff",
                  borderColor: "#d8e5ff",
                }}
              >
                <div style={{ color: "#3158ed", fontSize: 12 }}>
                  GS I › भारतीय कला एवं संस्कृति
                </div>
                <h2 style={{ margin: "6px 0" }}>{currentTheme.title}</h2>
                <p style={{ color: "#64748b", fontSize: 12 }}>
                  {currentTheme.mapped.length} mapped questions ·{" "}
                  {currentTheme.studyDone}/{currentTheme.taskCount} study tasks
                  completed
                </p>
                <div
                  style={{
                    height: 8,
                    background: "#dbe3ef",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        currentTheme.taskCount
                          ? (currentTheme.studyDone / currentTheme.taskCount) * 100
                          : 0
                      }%`,
                      background: "#3158ed",
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "#64748b" }}>
                  Priority: analysis pending. Theme priority is not final until
                  its PYQ mapping is reviewed.
                </p>
              </section>

              <section style={styles.card}>
                <h3 style={{ marginTop: 0 }}>Theme Study Tasks</h3>
                {currentTheme.studyTasks.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      border: "1px solid #e4e8ed",
                      borderRadius: 12,
                      padding: 13,
                      marginTop: 10,
                    }}
                  >
                    <strong>{group.title}</strong>
                    {group.items.map((item, index) => {
                      const key = `${currentTheme.key}:study:${group.id}:${index}`;
                      return (
                        <label
                          key={key}
                          style={{
                            display: "flex",
                            gap: 9,
                            alignItems: "flex-start",
                            marginTop: 11,
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!completed[key]}
                            onChange={(event) =>
                              setCheck(key, event.target.checked)
                            }
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </section>
            </>
          )}

          <section style={styles.card}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                gap: 7,
              }}
            >
              {STAGES.map((name, index) => (
                <button
                  key={name}
                  style={{
                    ...styles.button,
                    padding: 9,
                    background: stage === index ? "#e7efff" : "#f7f9fb",
                    borderColor: stage === index ? "#3158ed" : "#e4e8ed",
                    textAlign: "left",
                  }}
                  onClick={() => setStage(index)}
                >
                  <strong style={{ display: "block" }}>{index + 1}</strong>
                  <span style={{ fontSize: 10 }}>{name}</span>
                </button>
              ))}
            </div>

            <h2 style={{ marginBottom: 4, marginTop: 20 }}>
              {STAGES[stage]}
            </h2>
            <p style={{ color: "#64748b", fontSize: 12 }}>
              {isArtCulture
                ? `Current theme: ${currentTheme?.title}`
                : `Current topic: ${currentGeneral?.name}`}
            </p>

            {isArtCulture && currentTheme && stage === 0 && (
              <div style={{ marginTop: 14 }}>
                <p>
                  Theme ke upar diye gaye study tasks complete karo. Apne notes
                  mein definitions, dimensions, examples aur answer structure
                  shamil karo.
                </p>
                <p style={{ fontSize: 12, color: "#64748b" }}>
                  Yeh study checklist hai; yahan full notes ya verified source
                  material automatically generate nahi hota.
                </p>
              </div>
            )}

            {isArtCulture && currentTheme && stage === 1 && (
              <div style={{ marginTop: 14 }}>
                <h3>Existing Mains PYQs</h3>
                {currentTheme.mapped.length === 0 && (
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    Is theme ke liye current mapping mein koi question nahi
                    mila. Theme ke keywords aur topic tags review karo.
                  </p>
                )}

                {currentTheme.mapped.map((question) => {
                  const key = `${currentTheme.key}:pyq:${question.id}`;
                  return (
                    <div
                      key={question.id}
                      style={{
                        border: "1px solid #e4e8ed",
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 9,
                      }}
                    >
                      <strong>
                        UPSC Mains {question.year || "Year unavailable"}
                      </strong>
                      <p style={{ lineHeight: 1.6, fontSize: 13 }}>
                        {question.question}
                      </p>
                      <small style={{ color: "#64748b" }}>
                        {question.marks
                          ? `${question.marks} marks`
                          : "Marks unavailable"}
                      </small>
                      <label
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 10,
                          fontSize: 12,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!completed[key]}
                          onChange={(event) =>
                            setCheck(key, event.target.checked)
                          }
                        />
                        Maine is question ko solve/revise kar liya
                      </label>
                      <button
                        style={{ ...styles.button, marginTop: 10 }}
                        onClick={() => router.push("/mission-pyq")}
                      >
                        Open Mission PYQ
                      </button>
                    </div>
                  );
                })}
                {currentTheme.mapped.length > 0 && (
                  <p style={{ color: "#64748b", fontSize: 11 }}>
                    Checklist completion student-marked hai; system ne
                    Mission PYQ ke answer status ko independently verify nahi
                    kiya hai.
                  </p>
                )}
              </div>
            )}

            {isArtCulture && currentTheme && stage === 2 && (
              <div style={{ marginTop: 14 }}>
                <h3>Answer Writing</h3>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>Question ki directive aur demand identify karo.</li>
                  <li>Introduction, body aur conclusion likho.</li>
                  <li>Specific examples aur zaroorat par diagram use karo.</li>
                  <li>10-marker ko lagbhag 150 words mein likho.</li>
                  <li>15-marker ko lagbhag 250 words mein likho.</li>
                </ul>
                <button
                  style={styles.primary}
                  onClick={() => router.push("/answer")}
                >
                  Open Answer Writing →
                </button>
                <label
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!completed[`${currentTheme.key}:writing:confirmed`]}
                    onChange={(event) =>
                      setCheck(
                        `${currentTheme.key}:writing:confirmed`,
                        event.target.checked
                      )
                    }
                  />
                  Maine assigned answer-writing practice complete kar li
                </label>
              </div>
            )}

            {isArtCulture && currentTheme && stage === 3 && (
              <div style={{ marginTop: 14 }}>
                <h3>Evaluation & Review</h3>
                <p>
                  Apna answer existing AI evaluation workflow se evaluate
                  karao. Feedback mein content, structure, examples aur
                  question ki demand ke hisaab se improvements review karo.
                </p>
                <button
                  style={styles.primary}
                  onClick={() => router.push("/ai-evaluation")}
                >
                  Open AI Evaluation →
                </button>
                <label
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      !!completed[`${currentTheme.key}:evaluation:confirmed`]
                    }
                    onChange={(event) =>
                      setCheck(
                        `${currentTheme.key}:evaluation:confirmed`,
                        event.target.checked
                      )
                    }
                  />
                  Maine evaluation feedback review karke mistakes revise kar li
                </label>
                <p style={{ fontSize: 11, color: "#64748b" }}>
                  Completion student checkbox se record hoti hai. AI evaluation
                  result ko backend se verify karna abhi implement nahi hai.
                </p>
              </div>
            )}

            {!isArtCulture && (
              <div style={{ marginTop: 14 }}>
                <h3>{currentGeneral?.name || "Topic Preparation"}</h3>
                {(GENERAL_TASKS[stage] || []).map((task, index) => {
                  const key = `${currentGeneral?.key}:${stage}:${index}`;
                  return (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        gap: 9,
                        marginTop: 12,
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!completed[key]}
                        onChange={(event) =>
                          setCheck(key, event.target.checked)
                        }
                      />
                      {task}
                    </label>
                  );
                })}

                {stage === 1 && (
                  <div style={{ marginTop: 16 }}>
                    <h3>Mapped PYQs ({generalMapped.length})</h3>
                    {generalMapped.slice(0, 20).map((question) => (
                      <div
                        key={question.id}
                        style={{
                          border: "1px solid #e4e8ed",
                          borderRadius: 10,
                          padding: 12,
                          marginTop: 8,
                        }}
                      >
                        <strong>{question.year || "Year unavailable"}</strong>
                        <p style={{ fontSize: 13 }}>{question.question}</p>
                        <button
                          style={styles.button}
                          onClick={() => router.push("/mission-pyq")}
                        >
                          Open Mission PYQ
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {stage === 2 && (
                  <button
                    style={{ ...styles.primary, marginTop: 14 }}
                    onClick={() => router.push("/answer")}
                  >
                    Open Answer Writing →
                  </button>
                )}

                {stage === 3 && (
                  <button
                    style={{ ...styles.primary, marginTop: 14 }}
                    onClick={() => router.push("/ai-evaluation")}
                  >
                    Open AI Evaluation →
                  </button>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button style={styles.primary} onClick={nextStage}>
                {stage < 3 ? "Continue to next stage →" : "Complete / Next theme →"}
              </button>
              {isArtCulture && currentTheme && (
                <button
                  style={styles.button}
                  onClick={() => {
                    setCompleted((previous) => {
                      const next = { ...previous };
                      Object.keys(next).forEach((key) => {
                        if (key.startsWith(`${currentTheme.key}:`)) {
                          delete next[key];
                        }
                      });
                      return next;
                    });
                    setNotice("Current theme ki checklist reset ho gayi.");
                  }}
                >
                  Reset theme checklist
                </button>
              )}
            </div>
          </section>

          {notice && (
            <div
              role="status"
              style={{
                ...styles.card,
                background: "#fff8e7",
                fontSize: 13,
              }}
            >
              {notice}
            </div>
          )}
        </section>

        <aside
          className="roadmap-side"
          style={{ display: "grid", gap: 14, alignContent: "start" }}
        >
          {isArtCulture ? (
            <section style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Art & Culture Themes</h3>
              {artThemes
                .filter((theme) =>
                  normalize(`${theme.title} ${theme.mapped.map(questionText).join(" ")}`)
                    .includes(normalize(search))
                )
                .map((theme, index) => (
                  <button
                    key={theme.id}
                    onClick={() => chooseTheme(theme)}
                    style={{
                      ...styles.button,
                      display: "block",
                      textAlign: "left",
                      width: "100%",
                      marginTop: 8,
                      background:
                        currentTheme?.id === theme.id ? "#eaf0ff" : "#fff",
                      borderColor:
                        currentTheme?.id === theme.id ? "#b9c9ff" : "#e4e8ed",
                    }}
                  >
                    <strong>{index + 1}. {theme.title}</strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "#64748b",
                        marginTop: 5,
                      }}
                    >
                      {theme.mapped.length} mapped PYQs ·{" "}
                      {theme.finished ? "Completed" : "In progress"}
                    </span>
                  </button>
                ))}
              <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
                Themes ka order study sequence hai, verified UPSC frequency
                ranking nahi. PYQ mapping ko review karna zaroori hai.
              </p>
            </section>
          ) : (
            <section style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Your Roadmap</h3>
              {visibleTopics.map((topic, index) => (
                <button
                  key={topic.subject}
                  onClick={() => {
                    setActiveTopic(topic.subject);
                    setStage(0);
                    setNotice("");
                  }}
                  style={{
                    ...styles.button,
                    display: "block",
                    textAlign: "left",
                    width: "100%",
                    marginTop: 8,
                    background:
                      activeTopic === topic.subject ? "#eaf0ff" : "#fff",
                  }}
                >
                  {index + 1}. {topic.name}
                  <small style={{ display: "block", marginTop: 4 }}>
                    {topic.priority} · {topic.mapped.length} keyword matches
                  </small>
                </button>
              ))}
            </section>
          )}

          <section style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Overall Progress</h3>
            {isArtCulture && (
              <>
                <p style={{ fontSize: 13 }}>
                  {artThemes.filter((theme) => theme.finished).length} /{" "}
                  {artThemes.length} themes completed
                </p>
                <div
                  style={{
                    height: 9,
                    background: "#e8edf2",
                    borderRadius: 9,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#07824e",
                      width: `${
                        (artThemes.filter((theme) => theme.finished).length /
                          Math.max(artThemes.length, 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </>
            )}
            <button
              style={{ ...styles.button, width: "100%", marginTop: 12 }}
              onClick={() => router.push("/mission-pyq")}
            >
              Open Mission PYQ →
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}
