"use client";

import { useMemo, useState } from "react";

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
      "Which of the following countries are associated with the Black Sea?",
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
  {
    id: 3,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question: "Which group contains the littoral countries of the Caspian Sea?",
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
    id: 4,
    scope: "World",
    category: "Rivers",
    difficulty: "Easy",
    question: "The Mekong River passes through which of the following countries?",
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
    id: 5,
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
    id: 6,
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
    id: 7,
    scope: "World",
    category: "Routes",
    difficulty: "Medium",
    question: "The Northern Sea Route is primarily associated with which region?",
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
    id: 8,
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
    id: 9,
    scope: "World",
    category: "Islands",
    difficulty: "Medium",
    question: "Réunion is an overseas department/region of which country?",
    options: ["France", "Portugal", "Spain", "United Kingdom"],
    answer: 0,
    explanation:
      "Réunion is a French overseas department and region in the Indian Ocean.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 10,
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
    id: 11,
    scope: "India",
    category: "Rivers",
    difficulty: "Easy",
    question: "The Indus River system is primarily associated with which region?",
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
    id: 12,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Vishnu Prayag is associated with which tributary of the Alaknanda?",
    options: ["Dhauliganga", "Pindar", "Mandakini", "Bhagirathi"],
    answer: 0,
    explanation:
      "Vishnu Prayag is the confluence of Alaknanda and Dhauliganga.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 13,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Karnaprayag is associated with the confluence of Alaknanda and:",
    options: ["Pindar", "Dhauliganga", "Mandakini", "Bhagirathi"],
    answer: 0,
    explanation:
      "Karnaprayag is associated with the Alaknanda and Pindar rivers.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 14,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Devprayag is associated with the confluence of Alaknanda and:",
    options: ["Bhagirathi", "Pindar", "Dhauliganga", "Yamuna"],
    answer: 0,
    explanation:
      "At Devprayag, Alaknanda and Bhagirathi meet and the river is known as the Ganga downstream.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 15,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "The Brahmaputra receives the Dibang in which broad region?",
    options: ["Arunachal Pradesh", "Gujarat", "Kerala", "Rajasthan"],
    answer: 0,
    explanation:
      "The Dibang is an important tributary associated with the Brahmaputra system in Arunachal Pradesh.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 16,
    scope: "India",
    category: "Passes",
    difficulty: "Easy",
    question: "Zoji La is an important pass connecting which broad regions?",
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
    id: 17,
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
    id: 18,
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
      "This question preserves the source note exactly as written; it is not presented as an independently verified correction.",
    source: "Mapping Class 2026 source material, page 52",
  },
  {
    id: 19,
    scope: "India",
    category: "UNESCO",
    difficulty: "Easy",
    question: "Dholavira is located in which Indian state?",
    options: ["Gujarat", "Rajasthan", "Madhya Pradesh", "Maharashtra"],
    answer: 0,
    explanation:
      "Dholavira is an archaeological site in Gujarat and a UNESCO World Heritage Site.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 20,
    scope: "India",
    category: "Biosphere",
    difficulty: "Easy",
    question: "Nilgiri Biosphere Reserve is associated with which region?",
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
    id: 21,
    scope: "India",
    category: "Ports",
    difficulty: "Easy",
    question: "Kandla is an important port associated with which state?",
    options: ["Gujarat", "Odisha", "Kerala", "Tamil Nadu"],
    answer: 0,
    explanation:
      "Kandla is located in Gujarat on the Gulf of Kutch.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 22,
    scope: "India",
    category: "Soils",
    difficulty: "Easy",
    question: "Which soil type is strongly associated with the Deccan Trap region?",
    options: ["Black soil", "Laterite soil", "Desert soil", "Mountain soil"],
    answer: 0,
    explanation:
      "Black soil is strongly associated with basaltic Deccan Trap areas.",
    source: "Mapping Class 2026 source material",
  },
];

const categories = ["All", ...new Set(QUESTIONS.map((q) => q.category))];

export default function MapPrelimsTest() {
  const [scope, setScope] = useState("All");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(10);

  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const filteredQuestions = useMemo(() => {
    return QUESTIONS.filter((q) => {
      const scopeMatch = scope === "All" || q.scope === scope;
      const categoryMatch =
        category === "All" || q.category === category;
      const difficultyMatch =
        difficulty === "All" || q.difficulty === difficulty;

      return scopeMatch && categoryMatch && difficultyMatch;
    });
  }, [scope, category, difficulty]);

  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function startTest() {
    const selected = shuffle(filteredQuestions).slice(
      0,
      Math.min(questionCount, filteredQuestions.length)
    );

    setQuestions(selected);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setStarted(true);
    setTimeLeft(selected.length * 60);
  }

  function selectAnswer(optionIndex) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questions[current].id]: optionIndex,
    }));
  }

  function submitTest() {
    setSubmitted(true);
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

    const score = correct * 2 - wrong * 0.66;
    const accuracy =
      correct + wrong === 0
        ? 0
        : (correct / (correct + wrong)) * 100;

    return {
      correct,
      wrong,
      unanswered,
      score,
      accuracy,
    };
  }

  const result = submitted ? getResult() : null;
  const question = questions[current];

  if (!started) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white p-5 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="text-xs font-bold tracking-[0.2em] text-emerald-300">
              BHARAT DARSHAN • MAP INTELLIGENCE
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Map Prelims Test
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              UPSC-style map practice based on the Mapping Class 2026
              material. This is a practice test, not an authentic UPSC PYQ
              test.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1a2b] p-5 sm:p-7">
            <div className="grid gap-5 md:grid-cols-3">
              <Filter
                label="Scope"
                value={scope}
                onChange={setScope}
                options={["All", "India", "World"]}
              />

              <Filter
                label="Category"
                value={category}
                onChange={setCategory}
                options={categories}
              />

              <Filter
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={["All", "Easy", "Medium", "Hard"]}
              />
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Number of Questions
              </p>

              <div className="flex flex-wrap gap-2">
                {[10, 20, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`rounded-xl px-5 py-3 text-sm font-bold ${
                      questionCount === n
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Info label="Marking" value="+2 / -0.66" />
              <Info label="Mode" value="Practice" />
              <Info
                label="Available"
                value={`${filteredQuestions.length} Questions`}
              />
            </div>

            <button
              onClick={startTest}
              disabled={filteredQuestions.length === 0}
              className="mt-7 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-slate-950 disabled:opacity-40"
            >
              START MAP TEST →
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-xs leading-6 text-slate-400">
            <b className="text-amber-300">Important:</b> These are
            practice questions derived from the mapping material. Authentic
            UPSC PYQs will be integrated separately through Prelims
            Intelligence.
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white p-5 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-[#0d1a2b] p-6 sm:p-8">
            <div className="text-xs font-bold tracking-[0.2em] text-emerald-300">
              TEST COMPLETE
            </div>

            <h1 className="mt-2 text-3xl font-black">
              Map Test Result
            </h1>

            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              <ResultCard label="Score" value={result.score.toFixed(2)} />
              <ResultCard label="Correct" value={result.correct} />
              <ResultCard label="Wrong" value={result.wrong} />
              <ResultCard label="Accuracy" value={`${result.accuracy.toFixed(1)}%`} />
            </div>

            <div className="mt-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-400">
              Unanswered:{" "}
              <span className="font-bold text-white">
                {result.unanswered}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {questions.map((q, index) => {
              const selected = answers[q.id];

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/10 bg-[#0d1a2b] p-5"
                >
                  <div className="text-xs font-bold text-slate-500">
                    Q{index + 1} • {q.scope} • {q.category}
                  </div>

                  <h3 className="mt-2 text-sm font-bold leading-6">
                    {q.question}
                  </h3>

                  <div className="mt-3 text-sm">
                    <p className="text-slate-400">
                      Your answer:{" "}
                      <span
                        className={
                          selected === undefined
                            ? "text-amber-300"
                            : selected === q.answer
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {selected === undefined
                          ? "Not answered"
                          : q.options[selected]}
                      </span>
                    </p>

                    <p className="mt-1 text-slate-400">
                      Correct answer:{" "}
                      <span className="font-semibold text-emerald-300">
                        {q.options[q.answer]}
                      </span>
                    </p>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setStarted(false);
              setSubmitted(false);
            }}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-slate-950"
          >
            RETAKE / CHANGE TEST
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-emerald-300">
              MAP PRELIMS TEST • PRACTICE
            </div>

            <h1 className="mt-1 text-lg font-black sm:text-xl">
              Question {current + 1} of {questions.length}
            </h1>
          </div>

          <div className="rounded-xl bg-red-400/10 px-4 py-2 text-sm font-black text-red-300">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <section className="rounded-3xl border border-white/10 bg-[#0d1a2b] p-5 sm:p-7">
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300">
                {question.scope}
              </span>

              <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">
                {question.category}
              </span>

              <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">
                {question.difficulty}
              </span>
            </div>

            <h2 className="mt-6 text-lg font-bold leading-8 sm:text-xl">
              {question.question}
            </h2>

            <div className="mt-6 space-y-3">
              {question.options.map((option, index) => {
                const selected = answers[question.id] === index;

                return (
                  <button
                    key={option}
                    onClick={() => selectAnswer(index)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition ${
                      selected
                        ? "border-emerald-300 bg-emerald-300/10 text-emerald-200"
                        : "border-white/10 bg-white/[.025] text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <span className="font-black">
                      {String.fromCharCode(65 + index)}.
                    </span>

                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex gap-3">
              <button
                disabled={current === 0}
                onClick={() => setCurrent((v) => v - 1)}
                className="rounded-xl bg-white/5 px-5 py-3 text-xs font-bold disabled:opacity-30"
              >
                ← PREVIOUS
              </button>

              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((v) => v + 1)}
                  className="ml-auto rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black text-slate-950"
                >
                  NEXT →
                </button>
              ) : (
                <button
                  onClick={submitTest}
                  className="ml-auto rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black text-slate-950"
                >
                  SUBMIT TEST
                </button>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-[#0d1a2b] p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Palette
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const answered = answers[q.id] !== undefined;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(index)}
                    className={`h-10 rounded-lg text-xs font-black ${
                      index === current
                        ? "bg-emerald-400 text-slate-950"
                        : answered
                        ? "bg-emerald-400/20 text-emerald-300"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-white/5 p-4 text-xs leading-5 text-slate-500">
              <div>
                Answered:{" "}
                <b className="text-emerald-300">
                  {Object.keys(answers).length}
                </b>
              </div>

              <div>
                Remaining:{" "}
                <b className="text-white">
                  {questions.length - Object.keys(answers).length}
                </b>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Filter({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#07111f] px-3 py-3 text-sm text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-black">
        {value}
      </div>
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">
        {value}
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
}
