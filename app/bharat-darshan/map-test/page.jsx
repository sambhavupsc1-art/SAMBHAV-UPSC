"use client";

import { useEffect, useMemo, useState } from "react";

const QUESTIONS = [
  {
    id: 1,
    scope: "World",
    category: "Seas",
    difficulty: "Easy",
    question: "The Aral Sea is associated with which two countries?",
    options: [
      "Kazakhstan and Uzbekistan",
      "Iran and Iraq",
      "Russia and Georgia",
      "Turkey and Syria",
    ],
    answer: 0,
    explanation:
      "The source mapping material places the Aral Sea between Kazakhstan and Uzbekistan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 2,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question:
      "Which group contains the littoral countries of the Caspian Sea?",
    options: [
      "Russia, Kazakhstan, Turkmenistan, Iran and Azerbaijan",
      "India, Pakistan, Iran, Iraq and Kuwait",
      "Russia, Ukraine, Poland, Germany and Denmark",
      "Turkey, Syria, Lebanon, Israel and Egypt",
    ],
    answer: 0,
    explanation:
      "The Caspian Sea is bordered by Russia, Kazakhstan, Turkmenistan, Iran and Azerbaijan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 3,
    scope: "World",
    category: "Rivers",
    difficulty: "Easy",
    question:
      "The Mekong River passes through which of the following countries?",
    options: [
      "China, Myanmar, Laos, Thailand, Cambodia and Vietnam",
      "India, Nepal, Bhutan and Bangladesh",
      "Russia, Kazakhstan and Uzbekistan",
      "Turkey, Syria and Iraq",
    ],
    answer: 0,
    explanation:
      "The Mekong is a major Southeast Asian river associated with China, Myanmar, Laos, Thailand, Cambodia and Vietnam.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 4,
    scope: "World",
    category: "Countries",
    difficulty: "Easy",
    question: "Which countries share a land border with Syria?",
    options: [
      "Turkey, Iraq, Jordan, Israel and Lebanon",
      "Iran, Afghanistan, Pakistan and India",
      "Turkey, Greece, Bulgaria and Georgia",
      "Egypt, Libya, Sudan and Israel",
    ],
    answer: 0,
    explanation:
      "Syria's land neighbours include Turkey, Iraq, Jordan, Israel and Lebanon.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 5,
    scope: "World",
    category: "Countries",
    difficulty: "Easy",
    question: "Which group represents Iran's land neighbours?",
    options: [
      "Iraq, Turkey, Armenia, Azerbaijan, Turkmenistan, Afghanistan and Pakistan",
      "Iraq, Syria, Jordan, Israel and Lebanon",
      "Pakistan, India, Nepal and Afghanistan",
      "Russia, Georgia, Armenia and Turkey",
    ],
    answer: 0,
    explanation:
      "Iran shares land borders with Iraq, Turkey, Armenia, Azerbaijan, Turkmenistan, Afghanistan and Pakistan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 6,
    scope: "World",
    category: "Routes",
    difficulty: "Medium",
    question:
      "The Northern Sea Route is primarily associated with which region?",
    options: [
      "Arctic coast of Russia",
      "Southern coast of Australia",
      "Mediterranean Sea",
      "Southern Atlantic Ocean",
    ],
    answer: 0,
    explanation:
      "The Northern Sea Route runs along Russia's Arctic coast.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 7,
    scope: "World",
    category: "Lakes",
    difficulty: "Medium",
    question: "Lake Natron is associated primarily with which country?",
    options: ["Tanzania", "Egypt", "Morocco", "South Africa"],
    answer: 0,
    explanation:
      "Lake Natron is in northern Tanzania, close to the Kenya border.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 8,
    scope: "World",
    category: "Islands",
    difficulty: "Medium",
    question:
      "Réunion is an overseas department/region of which country?",
    options: ["France", "Portugal", "Spain", "United Kingdom"],
    answer: 0,
    explanation:
      "Réunion is a French overseas department and region in the Indian Ocean.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 9,
    scope: "India",
    category: "Rivers",
    difficulty: "Easy",
    question:
      "The Indus River system is primarily associated with which region?",
    options: [
      "Northwestern Indian subcontinent",
      "Peninsular eastern India",
      "Northeastern India only",
      "Southern Western Ghats",
    ],
    answer: 0,
    explanation:
      "The Indus system is centred on the northwestern part of the Indian subcontinent.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 10,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question:
      "Vishnu Prayag is associated with which tributary of the Alaknanda?",
    options: ["Dhauliganga", "Pindar", "Mandakini", "Bhagirathi"],
    answer: 0,
    explanation:
      "Vishnu Prayag is the confluence of Alaknanda and Dhauliganga.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 11,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question:
      "Karnaprayag is associated with the confluence of Alaknanda and:",
    options: ["Pindar", "Dhauliganga", "Mandakini", "Bhagirathi"],
    answer: 0,
    explanation:
      "Karnaprayag is associated with the Alaknanda and Pindar rivers.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 12,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question:
      "Devprayag is associated with the confluence of Alaknanda and:",
    options: ["Bhagirathi", "Pindar", "Dhauliganga", "Yamuna"],
    answer: 0,
    explanation:
      "At Devprayag, Alaknanda and Bhagirathi meet and the river is known as the Ganga downstream.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 13,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question:
      "The Brahmaputra receives the Dibang in which broad region?",
    options: [
      "Arunachal Pradesh",
      "Gujarat",
      "Kerala",
      "Rajasthan",
    ],
    answer: 0,
    explanation:
      "The Dibang is an important tributary associated with the Brahmaputra system in Arunachal Pradesh.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 14,
    scope: "India",
    category: "Passes",
    difficulty: "Easy",
    question:
      "Zoji La is an important pass connecting which broad regions?",
    options: [
      "Kashmir Valley and Ladakh",
      "Kerala and Tamil Nadu",
      "Assam and Tripura",
      "Gujarat and Rajasthan",
    ],
    answer: 0,
    explanation:
      "Zoji La provides an important route between the Kashmir Valley and Ladakh.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 15,
    scope: "India",
    category: "Wetlands",
    difficulty: "Easy",
    question:
      "Which three wetlands are specifically listed for Kerala in the source material?",
    options: [
      "Vembanad, Sasthamkotta and Ashtamudi",
      "Loktak, Wular and Dal",
      "Chilika, Pulicat and Kolleru",
      "Sambhar, Keoladeo and Kanji",
    ],
    answer: 0,
    explanation:
      "The source material lists Vembanad, Sasthamkotta and Ashtamudi for Kerala.",
    source: "Mapping Class 2026 source material, page 52",
  },
  {
    id: 16,
    scope: "India",
    category: "Ecology",
    difficulty: "Medium",
    question:
      "According to the source note, the Kerala tiger-reserve observation is:",
    options: [
      "Only 2 tiger reserve in KL and both start with P",
      "Only 3 tiger reserves in KL and all start with K",
      "4 tiger reserves in KL",
      "No tiger reserve in Kerala",
    ],
    answer: 0,
    explanation:
      "This preserves the source note exactly as written; it is not presented as an independently verified correction.",
    source: "Mapping Class 2026 source material, page 52",
  },
  {
    id: 17,
    scope: "India",
    category: "UNESCO",
    difficulty: "Easy",
    question: "Dholavira is located in which Indian state?",
    options: [
      "Gujarat",
      "Rajasthan",
      "Madhya Pradesh",
      "Maharashtra",
    ],
    answer: 0,
    explanation:
      "Dholavira is an archaeological site in Gujarat and a UNESCO World Heritage Site.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 18,
    scope: "India",
    category: "Biosphere",
    difficulty: "Easy",
    question:
      "Nilgiri Biosphere Reserve is associated with which region?",
    options: [
      "Western Ghats",
      "Eastern Himalayas only",
      "Thar Desert",
      "Indo-Gangetic Plain",
    ],
    answer: 0,
    explanation:
      "The Nilgiri Biosphere Reserve lies in the Western Ghats region.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 19,
    scope: "India",
    category: "Ports",
    difficulty: "Easy",
    question:
      "Kandla is an important port associated with which state?",
    options: ["Gujarat", "Odisha", "Kerala", "Tamil Nadu"],
    answer: 0,
    explanation:
      "Kandla is located in Gujarat on the Gulf of Kutch.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 20,
    scope: "India",
    category: "Soils",
    difficulty: "Easy",
    question:
      "Which soil type is strongly associated with the Deccan Trap region?",
    options: [
      "Black soil",
      "Laterite soil",
      "Desert soil",
      "Mountain soil",
    ],
    answer: 0,
    explanation:
      "Black soil is strongly associated with basaltic Deccan Trap areas.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 21,
    scope: "World",
    category: "Hotspots",
    difficulty: "Medium",
    question: "Donbas is a region associated with which country?",
    options: ["Ukraine", "Romania", "Poland", "Belarus"],
    answer: 0,
    explanation:
      "Donbas is a major historical and geopolitical region of eastern Ukraine.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 22,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question:
      "Which group contains Black Sea littoral countries?",
    options: [
      "Turkey, Bulgaria, Romania, Ukraine, Russia and Georgia",
      "Iran, Iraq, Kuwait and Saudi Arabia",
      "India, Sri Lanka, Maldives and Myanmar",
      "Spain, France, Italy and Greece",
    ],
    answer: 0,
    explanation:
      "The Black Sea has littoral countries including Turkey, Bulgaria, Romania, Ukraine, Russia and Georgia.",
    source: "Mapping Class 2026 source material",
  },
];

const categories = [
  "All",
  ...Array.from(new Set(QUESTIONS.map((q) => q.category))),
];

export default function MapPrelimsTest() {
  const [scope, setScope] = useState("All");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [count, setCount] = useState(10);

  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const filteredQuestions = useMemo(() => {
    return QUESTIONS.filter(
      (q) =>
        (scope === "All" || q.scope === scope) &&
        (category === "All" || q.category === category) &&
        (difficulty === "All" || q.difficulty === difficulty)
    );
  }, [scope, category, difficulty]);

  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timer);
          setSubmitted(true);
          return 0;
        }

        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, submitted, timeLeft]);

  function startTest() {
    const selected = [...filteredQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, filteredQuestions.length));

    setQuestions(selected);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setStarted(true);
    setTimeLeft(selected.length * 60);
  }

  function getResult() {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];

      if (selected === undefined) {
        unanswered++;
      } else if (selected === q.answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    return {
      correct,
      wrong,
      unanswered,
      score: correct * 2 - wrong * 0.66,
      accuracy:
        correct + wrong === 0
          ? 0
          : (correct / (correct + wrong)) * 100,
    };
  }

  if (!started) {
    return (
      <SetupScreen
        scope={scope}
        setScope={setScope}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        count={count}
        setCount={setCount}
        categories={categories}
        filteredQuestions={filteredQuestions}
        startTest={startTest}
      />
    );
  }

  if (submitted) {
    return (
      <ResultScreen
        questions={questions}
        answers={answers}
        getResult={getResult}
        reset={() => {
          setStarted(false);
          setSubmitted(false);
        }}
      />
    );
  }

  const q = questions[current];

  return (
    <main className="bd-test">
      <style jsx global>{styles}</style>

      <div className="bd-shell">
        <header className="test-top">
          <div>
            <div className="eyebrow">
              BHARAT DARSHAN • MAP PRELIMS
            </div>

            <h1>Map Prelims Test</h1>

            <p>Practice Mode • Mapping Class 2026</p>
          </div>

          <div className="timer">
            <span>TIME LEFT</span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
        </header>

        <div className="progress-info">
          <span>
            Question {current + 1} of {questions.length}
          </span>

          <span>
            {Object.keys(answers).length} answered
          </span>
        </div>

        <div className="progress-bar">
          <div
            style={{
              width: `${((current + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <section className="test-layout">
          <article className="question-card">
            <div className="question-meta">
              <span className="pill blue">{q.scope}</span>
              <span className="pill">{q.category}</span>
              <span className="pill">{q.difficulty}</span>
              <span className="pill purple">PRACTICE</span>
            </div>

            <div className="question-number">
              QUESTION {String(current + 1).padStart(2, "0")}
            </div>

            <h2>{q.question}</h2>

            <div className="options">
              {q.options.map((option, index) => {
                const selected = answers[q.id] === index;

                return (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: index,
                      }))
                    }
                    className={`option ${
                      selected ? "selected" : ""
                    }`}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span>{option}</span>

                    <b>{selected ? "✓" : ""}</b>
                  </button>
                );
              })}
            </div>

            <div className="question-actions">
              <button
                className="ghost-btn"
                disabled={current === 0}
                onClick={() =>
                  setCurrent((value) => value - 1)
                }
              >
                ← Previous
              </button>

              {current < questions.length - 1 ? (
                <button
                  className="primary-btn"
                  onClick={() =>
                    setCurrent((value) => value + 1)
                  }
                >
                  Next Question →
                </button>
              ) : (
                <button
                  className="submit-btn"
                  onClick={() => setSubmitted(true)}
                >
                  Submit Test
                </button>
              )}
            </div>
          </article>

          <aside className="palette-card">
            <div className="side-title">
              <div>
                <div className="eyebrow">TEST CONTROL</div>
                <h3>Question Palette</h3>
              </div>

              <span>{questions.length}</span>
            </div>

            <div className="palette">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrent(index)}
                  className={`
                    ${index === current ? "active" : ""}
                    ${
                      answers[question.id] !== undefined
                        ? "answered"
                        : ""
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="legend">
              <div>
                <i className="dot current-dot" />
                Current
              </div>

              <div>
                <i className="dot answered-dot" />
                Answered
              </div>

              <div>
                <i className="dot" />
                Unanswered
              </div>
            </div>

            <div className="marking-box">
              <b>MARKING SCHEME</b>

              <span>
                <strong>+2</strong> Correct
              </span>

              <span>
                <strong>-0.66</strong> Wrong
              </span>

              <span>
                <strong>0</strong> Unanswered
              </span>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SetupScreen({
  scope,
  setScope,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  count,
  setCount,
  categories,
  filteredQuestions,
  startTest,
}) {
  return (
    <main className="bd-test">
      <style jsx global>{styles}</style>

      <div className="bd-shell">
        <header className="setup-head">
          <div className="eyebrow">
            SAMBHAV UPSC • BHARAT DARSHAN
          </div>

          <h1>Map Prelims Test</h1>

          <p>Practice • Analyse • Improve</p>
        </header>

        <section className="hero-card">
          <div className="hero-icon">🎯</div>

          <div>
            <span className="practice-badge">
              PRACTICE MODE
            </span>

            <h2>Map Intelligence Challenge</h2>

            <p>
              UPSC-style map practice based on the Mapping Class
              2026 material. Authentic PYQs remain separate.
            </p>
          </div>
        </section>

        <section className="setup-grid">
          <div className="setup-panel">
            <Step
              number="01"
              title="Choose your scope"
              subtitle="India, World or Mixed"
            />

            <div className="segmented">
              {["All", "India", "World"].map((item) => (
                <button
                  key={item}
                  className={scope === item ? "active" : ""}
                  onClick={() => setScope(item)}
                >
                  {item === "All" ? "Mixed" : item}
                </button>
              ))}
            </div>

            <Step
              number="02"
              title="Choose category"
              subtitle="Filter the mapping topic"
              extra
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <Step
              number="03"
              title="Difficulty"
              subtitle="Set your challenge level"
              extra
            />

            <div className="segmented four">
              {["All", "Easy", "Medium", "Hard"].map(
                (item) => (
                  <button
                    key={item}
                    className={
                      difficulty === item ? "active" : ""
                    }
                    onClick={() =>
                      setDifficulty(item)
                    }
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="setup-panel">
            <Step
              number="04"
              title="Test length"
              subtitle="Select number of questions"
            />

            <div className="length-grid">
              {[10, 20, 30].map((number) => (
                <button
                  key={number}
                  className={
                    count === number ? "active" : ""
                  }
                  onClick={() => setCount(number)}
                >
                  <strong>{number}</strong>
                  <span>Questions</span>
                </button>
              ))}
            </div>

            <div className="stats-grid">
              <div>
                <strong>{filteredQuestions.length}</strong>
                <span>Available</span>
              </div>

              <div>
                <strong>+2 / −0.66</strong>
                <span>Marking</span>
              </div>

              <div>
                <strong>
                  {Math.min(
                    count,
                    filteredQuestions.length
                  )}{" "}
                  min
                </strong>
                <span>Timer</span>
              </div>
            </div>

            <button
              className="start-button"
              disabled={!filteredQuestions.length}
              onClick={startTest}
            >
              <span>START MAP TEST</span>
              <strong>→</strong>
            </button>

            <div className="source-note">
              <b>i</b>

              <span>
                <strong>Practice only.</strong>{" "}
                Authentic UPSC PYQs will be integrated later
                through Prelims Intelligence.
              </span>
            </div>
          </div>
        </section>

        <section className="roadmap">
          <div className="eyebrow">
            BHARAT DARSHAN TEST ROADMAP
          </div>

          <div className="roadmap-grid">
            <div className="road active">
              <span>01</span>
              <strong>Map Practice</strong>
              <small>Available now</small>
            </div>

            <div className="road">
              <span>02</span>
              <strong>Prelims Intelligence</strong>
              <small>Authentic PYQs</small>
            </div>

            <div className="road">
              <span>03</span>
              <strong>Map PYQ Integration</strong>
              <small>Coming later</small>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  subtitle,
  extra = false,
}) {
  return (
    <div className={`step ${extra ? "extra-space" : ""}`}>
      <span>{number}</span>

      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function ResultScreen({
  questions,
  answers,
  getResult,
  reset,
}) {
  const result = getResult();

  return (
    <main className="bd-test">
      <style jsx global>{styles}</style>

      <div className="bd-shell">
        <header className="setup-head">
          <div className="eyebrow">
            BHARAT DARSHAN • TEST RESULT
          </div>

          <h1>Map Test Analysis</h1>

          <p>
            Practice performance • Review your mapping mistakes
          </p>
        </header>

        <section className="result-hero">
          <div className="score-circle">
            <strong>
              {result.score.toFixed(1)}
            </strong>

            <span>SCORE</span>
          </div>

          <div>
            <span className="practice-badge">
              TEST COMPLETE
            </span>

            <h2>
              {result.accuracy >= 70
                ? "Strong Mapping Performance"
                : "Keep Building Your Map Recall"}
            </h2>

            <p>
              Review incorrect questions below for active
              revision.
            </p>
          </div>
        </section>

        <div className="result-stats">
          <ResultStat
            label="Correct"
            value={result.correct}
            type="green"
          />

          <ResultStat
            label="Wrong"
            value={result.wrong}
            type="red"
          />

          <ResultStat
            label="Unanswered"
            value={result.unanswered}
          />

          <ResultStat
            label="Accuracy"
            value={`${result.accuracy.toFixed(1)}%`}
          />
        </div>

        <section className="review-section">
          <div className="eyebrow">REVIEW</div>

          <h2>Question Analysis</h2>

          {questions.map((question, index) => {
            const selected = answers[question.id];

            const correct =
              selected === question.answer;

            return (
              <article
                key={question.id}
                className={`review-card ${
                  correct
                    ? "correct-card"
                    : selected === undefined
                    ? "skip-card"
                    : "wrong-card"
                }`}
              >
                <div className="review-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <div className="question-meta">
                    <span className="pill">
                      {question.scope}
                    </span>

                    <span className="pill">
                      {question.category}
                    </span>
                  </div>

                  <h3>{question.question}</h3>

                  <div className="answer-row">
                    <span>Your answer</span>

                    <strong>
                      {selected === undefined
                        ? "Not answered"
                        : question.options[selected]}
                    </strong>
                  </div>

                  <div className="answer-row">
                    <span>Correct answer</span>

                    <strong className="green-text">
                      {question.options[
                        question.answer
                      ]}
                    </strong>
                  </div>

                  <p className="explanation">
                    {question.explanation}
                  </p>

                  <small className="source">
                    Source: {question.source}
                  </small>
                </div>
              </article>
            );
          })}
        </section>

        <div className="result-actions">
          <button
            className="ghost-btn"
            onClick={reset}
          >
            ← Change Test
          </button>

          <button
            className="primary-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            Retake Test →
          </button>
        </div>
      </div>
    </main>
  );
}

function ResultStat({
  label,
  value,
  type,
}) {
  return (
    <div>
      <span>{label}</span>

      <strong
        className={
          type === "green"
            ? "green-text"
            : type === "red"
            ? "red-text"
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remaining).padStart(2, "0")}`;
}

const styles = `
* {
  box-sizing: border-box;
}

.bd-test {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(54,125,214,.18),
      transparent 30%
    ),
    radial-gradient(
      circle at 90% 10%,
      rgba(56,196,151,.12),
      transparent 28%
    ),
    #07111f;
  color: #edf5ff;
  font-family: Inter, system-ui, sans-serif;
}

.bd-shell {
  max-width: 1180px;
  margin: auto;
}

.eyebrow {
  font-size: 10px;
  letter-spacing: .18em;
  color: #70dfbd;
  font-weight: 900;
  text-transform: uppercase;
}

.setup-head {
  text-align: center;
  padding: 32px 0 26px;
}

.setup-head h1 {
  font-size: 42px;
  line-height: 1.05;
  margin: 9px 0 8px;
  font-weight: 950;
  letter-spacing: -.05em;
}

.setup-head p,
.test-top p {
  margin: 0;
  color: #92a8c0;
  font-size: 14px;
}

.hero-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 25px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 24px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    ),
    #0d1a2b;
  box-shadow: 0 24px 70px rgba(0,0,0,.24);
}

.hero-card::after {
  content: "";
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  right: -80px;
  top: -100px;
  background: #8b63e8;
  filter: blur(65px);
  opacity: .15;
}

.hero-icon {
  position: relative;
  width: 62px;
  height: 62px;
  flex:none;
  display:grid;
  place-items:center;
  border-radius:17px;
  background:rgba(155,108,255,.13);
  border:1px solid rgba(155,108,255,.28);
  font-size:27px;
}

.practice-badge {
  display:inline-flex;
  padding:5px 9px;
  border-radius:999px;
  background:rgba(155,108,255,.12);
  border:1px solid rgba(155,108,255,.22);
  color:#c5aaff;
  font-size:9px;
  font-weight:900;
  letter-spacing:.12em;
}

.hero-card h2 {
  position:relative;
  margin:7px 0;
  font-size:25px;
}

.hero-card p {
  position:relative;
  margin:0;
  color:#93a7bd;
  font-size:13px;
  line-height:1.6;
}

.setup-grid {
  display:grid;
  grid-template-columns:1.1fr .9fr;
  gap:18px;
  margin-top:18px;
}

.setup-panel,
.question-card,
.palette-card,
.review-section {
  border:1px solid rgba(255,255,255,.1);
  border-radius:24px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    ),
    #0d1a2b;
  box-shadow:0 24px 70px rgba(0,0,0,.2);
}

.setup-panel {
  padding:24px;
}

.step {
  display:flex;
  gap:12px;
  align-items:center;
}

.step.extra-space {
  margin-top:23px;
}

.step > span {
  width:30px;
  height:30px;
  border-radius:9px;
  display:grid;
  place-items:center;
  background:rgba(101,168,255,.1);
  color:#8ec2ff;
  font-size:10px;
  font-weight:900;
}

.step strong {
  display:block;
  font-size:13px;
}

.step small {
  display:block;
  margin-top:3px;
  color:#657b93;
  font-size:10px;
}

.segmented {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:7px;
  margin-top:12px;
}

.segmented.four {
  grid-template-columns:repeat(4,1fr);
}

.segmented button,
.length-grid button {
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.035);
  color:#9fb1c5;
  border-radius:12px;
  padding:11px 8px;
  font-weight:800;
  font-size:11px;
  cursor:pointer;
}

.segmented button.active,
.length-grid button.active {
  background:rgba(112,223,189,.12);
  border-color:rgba(112,223,189,.35);
  color:#82e5c4;
}

select {
  width:100%;
  margin-top:12px;
  border:1px solid rgba(255,255,255,.1);
  background:#07111f;
  color:#dce9f7;
  border-radius:12px;
  padding:12px;
  font-size:12px;
  outline:none;
}

.length-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:13px;
}

.length-grid button strong {
  display:block;
  font-size:19px;
  color:#eaf3ff;
}

.length-grid button span {
  display:block;
  font-size:9px;
  color:#647a91;
}

.stats-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:20px;
}

.stats-grid div {
  padding:13px;
  border-radius:14px;
  background:rgba(255,255,255,.035);
}

.stats-grid strong {
  display:block;
  font-size:13px;
}

.stats-grid span {
  display:block;
  margin-top:3px;
  color:#647a91;
  font-size:9px;
}

.start-button {
  width:100%;
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:18px;
  padding:15px 17px;
  border:0;
  border-radius:14px;
  background:linear-gradient(
    135deg,
    #70dfbd,
    #4dcba7
  );
  color:#06151b;
  font-weight:950;
  font-size:12px;
  cursor:pointer;
}

.start-button:disabled {
  opacity:.4;
}

.source-note {
  display:flex;
  gap:9px;
  margin-top:13px;
  padding:12px;
  border-radius:13px;
  background:rgba(255,255,255,.025);
  color:#6e849b;
  font-size:10px;
  line-height:1.5;
}

.source-note > b {
  width:18px;
  height:18px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:rgba(112,223,189,.1);
  color:#70dfbd;
  flex:none;
}

.source-note strong {
  color:#9bb0c4;
}

.roadmap {
  margin-top:18px;
  padding:18px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:20px;
  background:rgba(255,255,255,.025);
}

.roadmap-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:12px;
}

.road {
  padding:12px;
  border-radius:13px;
  background:rgba(255,255,255,.025);
  border:1px solid transparent;
}

.road.active {
  border-color:rgba(112,223,189,.22);
}

.road span {
  font-size:9px;
  color:#61778e;
}

.road strong {
  display:block;
  margin-top:4px;
  font-size:11px;
}

.road small {
  display:block;
  margin-top:3px;
  color:#60758c;
  font-size:9px;
}

/* TEST SCREEN */

.test-top {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
  padding:18px 0;
}

.test-top h1 {
  font-size:28px;
  margin:7px 0 4px;
}

.timer {
  min-width:120px;
  padding:11px 16px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.035);
  text-align:center;
}

.timer span {
  display:block;
  font-size:8px;
  letter-spacing:.13em;
  color:#667d94;
  font-weight:900;
}

.timer strong {
  display:block;
  margin-top:2px;
  font-size:20px;
  color:#ff9a9a;
}

.progress-info {
  display:flex;
  justify-content:space-between;
  margin-bottom:7px;
  color:#667d94;
  font-size:10px;
  font-weight:800;
}

.progress-bar {
  height:4px;
  border-radius:99px;
  background:rgba(255,255,255,.06);
  overflow:hidden;
}

.progress-bar > div {
  height:100%;
  border-radius:99px;
  background:linear-gradient(
    90deg,
    #70dfbd,
    #65a8ff
  );
  transition:.2s;
}

.test-layout {
  display:grid;
  grid-template-columns:1fr 280px;
  gap:18px;
  margin-top:16px;
}

.question-card {
  padding:26px;
}

.question-meta {
  display:flex;
  gap:7px;
  flex-wrap:wrap;
}

.pill {
  padding:6px 9px;
  border-radius:999px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.07);
  color:#7f95ab;
  font-size:9px;
  font-weight:900;
}

.pill.blue {
  color:#8ec2ff;
  background:rgba(101,168,255,.08);
  border-color:rgba(101,168,255,.2);
}

.pill.purple {
  color:#c2a7ff;
  background:rgba(155,108,255,.08);
  border-color:rgba(155,108,255,.2);
}

.question-number {
  margin-top:26px;
  color:#5e748b;
  font-size:10px;
  font-weight:900;
  letter-spacing:.1em;
}

.question-card h2 {
  margin:7px 0 0;
  max-width:800px;
  font-size:22px;
  line-height:1.5;
}

.options {
  display:grid;
  gap:9px;
  margin-top:25px;
}

.option {
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  padding:15px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:15px;
  background:rgba(255,255,255,.025);
  color:#b7c7d9;
  text-align:left;
  font-size:12px;
  cursor:pointer;
  transition:.15s;
}

.option:hover {
  border-color:rgba(101,168,255,.3);
  background:rgba(101,168,255,.04);
}

.option.selected {
  border-color:rgba(112,223,189,.45);
  background:rgba(112,223,189,.08);
  color:#dffbf2;
}

.option-letter {
  width:28px;
  height:28px;
  display:grid;
  place-items:center;
  border-radius:9px;
  background:rgba(255,255,255,.05);
  color:#748aa0;
  font-weight:900;
  flex:none;
}

.option.selected .option-letter {
  background:#70dfbd;
  color:#06151b;
}

.option b {
  margin-left:auto;
  color:#70dfbd;
}

.question-actions {
  display:flex;
  gap:9px;
  margin-top:24px;
}

.ghost-btn,
.primary-btn,
.submit-btn {
  border:0;
  border-radius:12px;
  padding:12px 16px;
  font-size:10px;
  font-weight:900;
  cursor:pointer;
}

.ghost-btn {
  background:rgba(255,255,255,.05);
  color:#8da2b8;
}

.ghost-btn:disabled {
  opacity:.3;
}

.primary-btn {
  margin-left:auto;
  background:#70dfbd;
  color:#06151b;
}

.submit-btn {
  margin-left:auto;
  background:#ff9b9b;
  color:#210b0b;
}

.palette-card {
  padding:20px;
  height:max-content;
}

.side-title {
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.side-title h3 {
  margin:5px 0 0;
  font-size:15px;
}

.side-title > span {
  padding:6px 8px;
  border-radius:9px;
  background:rgba(255,255,255,.05);
  font-size:10px;
  color:#8da2b8;
}

.palette {
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:7px;
  margin-top:18px;
}

.palette button {
  height:38px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:9px;
  background:rgba(255,255,255,.025);
  color:#71879d;
  font-size:10px;
  font-weight:900;
  cursor:pointer;
}

.palette button.answered {
  background:rgba(112,223,189,.1);
  border-color:rgba(112,223,189,.25);
  color:#70dfbd;
}

.palette button.active {
  background:#70dfbd;
  color:#06151b;
  border-color:#70dfbd;
}

.legend {
  display:grid;
  gap:7px;
  margin-top:18px;
  padding-top:16px;
  border-top:1px solid rgba(255,255,255,.06);
  font-size:9px;
  color:#71879d;
}

.dot {
  display:inline-block;
  width:7px;
  height:7px;
  border-radius:50%;
  background:#3b4b5c;
  margin-right:6px;
}

.current-dot {
  background:#70dfbd;
}

.answered-dot {
  background:#3e927f;
}

.marking-box {
  display:grid;
  gap:6px;
  margin-top:18px;
  padding:13px;
  border-radius:14px;
  background:rgba(255,255,255,.025);
  font-size:9px;
  color:#657b92;
}

.marking-box b {
  color:#b5c7d8;
}

.marking-box strong {
  color:#70dfbd;
  margin-right:4px;
}

/* RESULT */

.result-hero {
  display:flex;
  align-items:center;
  gap:20px;
  padding:24px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:24px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    ),
    #0d1a2b;
}

.score-circle {
  width:100px;
  height:100px;
  border-radius:50%;
  display:grid;
  place-items:center;
  align-content:center;
  background:rgba(112,223,189,.08);
  border:5px solid rgba(112,223,189,.25);
  flex:none;
}

.score-circle strong {
  font-size:25px;
}

.score-circle span {
  font-size:8px;
  color:#658098;
  font-weight:900;
}

.result-hero h2 {
  margin:7px 0;
  font-size:23px;
}

.result-hero p {
  margin:0;
  color:#8ca2ba;
  font-size:12px;
}

.result-stats {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:9px;
  margin:16px 0;
}

.result-stats > div {
  padding:17px;
  border-radius:16px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.06);
}

.result-stats span {
  display:block;
  color:#657b92;
  font-size:9px;
}

.result-stats strong {
  display:block;
  margin-top:5px;
  font-size:20px;
}

.green-text {
  color:#70dfbd !important;
}

.red-text {
  color:#ff9b9b !important;
}

.review-section {
  padding:20px;
}

.review-section > h2 {
  margin:5px 0 15px;
  font-size:20px;
}

.review-card {
  display:grid;
  grid-template-columns:42px 1fr;
  gap:13px;
  margin-top:12px;
  padding:17px;
  border-radius:16px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.06);
}

.correct-card {
  border-color:rgba(112,223,189,.18);
}

.wrong-card {
  border-color:rgba(255,120,120,.18);
}

.review-number {
  font-size:10px;
  color:#667d94;
  font-weight:900;
}

.review-card h3 {
  margin:7px 0 12px;
  font-size:13px;
  line-height:1.5;
}

.answer-row {
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding:7px 0;
  border-bottom:1px solid rgba(255,255,255,.05);
  font-size:10px;
  color:#667d94;
}

.answer-row strong {
  color:#a9bacb;
  text-align:right;
}

.explanation {
  margin:12px 0 4px;
  color:#788da3;
  font-size:10px;
  line-height:1.6;
}

.source {
  color:#526a82;
  font-size:8px;
}

.result-actions {
  display:flex;
  gap:9px;
  margin-top:20px;
}

/* MOBILE */

@media(max-width:900px) {
  .setup-grid,
  .test-layout {
    grid-template-columns:1fr;
  }

  .palette-card {
    order:-1;
  }

  .roadmap-grid {
    grid-template-columns:1fr;
  }
}

@media(max-width:620px) {
  .bd-test {
    padding:14px;
  }

  .setup-head h1 {
    font-size:32px;
  }

  .hero-card {
    padding:18px;
    align-items:flex-start;
  }

  .hero-icon {
    width:52px;
    height:52px;
    font-size:23px;
  }

  .setup-panel,
  .question-card,
  .palette-card,
  .review-section {
    padding:17px;
  }

  .test-top h1 {
    font-size:22px;
  }

  .timer {
    min-width:100px;
  }

  .question-card h2 {
    font-size:18px;
  }

  .result-stats {
    grid-template-columns:1fr 1fr;
  }

  .result-hero {
    align-items:flex-start;
  }

  .palette {
    grid-template-columns:repeat(5,1fr);
  }

  .question-actions {
    flex-wrap:wrap;
  }
}
`;
