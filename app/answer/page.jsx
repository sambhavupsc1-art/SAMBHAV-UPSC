"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AnswerWritingPage() {
  const router = useRouter();

  const [questionData, setQuestionData] =
    useState(null);

  const [answer, setAnswer] =
    useState("");

  const [seconds, setSeconds] =
    useState(0);

  const [timerRunning, setTimerRunning] =
    useState(true);

  const [evaluating, setEvaluating] =
    useState(false);

  const [evaluation, setEvaluation] =
    useState(null);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  /* ---------------- LOAD QUESTION ---------------- */

  useEffect(() => {
    try {
      const raw =
        sessionStorage.getItem(
          "sambhav_answer_question"
        );

      if (!raw) {
        setError(
          "Question data nahi mila. PYQ page se Start Answer Writing karein."
        );
        return;
      }

      const data = JSON.parse(raw);

      setQuestionData(data);

      const draft =
        sessionStorage.getItem(
          `sambhav_answer_draft_${data.id}`
        );

      if (draft) {
        setAnswer(draft);
      }
    } catch (err) {
      console.error(
        "Question load error:",
        err
      );

      setError(
        "Question load nahi ho saka."
      );
    }
  }, []);

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (
      !timerRunning ||
      evaluation
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        setSeconds(
          (value) => value + 1
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    timerRunning,
    evaluation,
  ]);

  /* ---------------- WORD COUNT ---------------- */

  const wordCount =
    useMemo(() => {
      return answer
        .trim()
        ? answer
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length
        : 0;
    }, [answer]);

  const wordLimit =
    Number(
      questionData?.word_limit ||
        questionData?.words ||
        (Number(
          questionData?.marks
        ) <= 10
          ? 150
          : 250)
    );

  const marks =
    Number(
      questionData?.marks || 15
    );

  /* ---------------- TIMER FORMAT ---------------- */

  const formatTime = (
    totalSeconds
  ) => {
    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const secs =
      totalSeconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      secs
    ).padStart(
      2,
      "0"
    )}`;
  };

  /* ---------------- SAVE DRAFT ---------------- */

  const saveDraft = () => {
    if (!questionData) {
      return;
    }

    sessionStorage.setItem(
      `sambhav_answer_draft_${questionData.id}`,
      answer
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  /* ---------------- EVALUATE ---------------- */

  const submitForEvaluation =
    async () => {
      if (!questionData) {
        return;
      }

      if (!answer.trim()) {
        setError(
          "Pehle answer likhiye."
        );
        return;
      }

      setError("");
      setTimerRunning(false);
      setEvaluating(true);

      try {
        const response =
          await fetch(
            "/api/ai/evaluate",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                question:
                  questionData.question,

                answer: answer.trim(),

                paper:
                  questionData.paper ||
                  "GS",

                section:
                  questionData.section ||
                  "",

                marks,

                word_limit:
                  wordLimit,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "AI evaluation failed."
          );
        }

        if (
          !data.evaluation
        ) {
          throw new Error(
            "Evaluation result nahi mila."
          );
        }

        setEvaluation(
          data.evaluation
        );

        sessionStorage.setItem(
          `sambhav_answer_evaluation_${questionData.id}`,
          JSON.stringify({
            question:
              questionData,
            answer,
            evaluation:
              data.evaluation,
            timeTaken:
              seconds,
            submittedAt:
              new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error(
          "AI evaluation error:",
          err
        );

        setError(
          err.message ||
            "AI evaluation failed."
        );

        setTimerRunning(true);
      } finally {
        setEvaluating(false);
      }
    };

  /* ---------------- ERROR ---------------- */

  if (error && !questionData) {
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
              styles.centerCard
            }
          >
            <div
              style={
                styles.logo
              }
            >
              SAMBHAV UPSC
            </div>

            <h2>
              Answer Writing
            </h2>

            <p
              style={
                styles.muted
              }
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/pyq"
                )
              }
              style={
                styles.primary
              }
            >
              ← Back to PYQ
            </button>
          </div>
        </main>
      </>
    );
  }

  /* ---------------- EVALUATION RESULT ---------------- */

  if (evaluation) {
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
              style={
                styles.topBar
              }
            >
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/pyq"
                  )
                }
                style={
                  styles.backButton
                }
              >
                ←
              </button>

              <div>
                <div
                  style={
                    styles.logo
                  }
                >
                  SAMBHAV UPSC
                </div>

                <div
                  style={
                    styles.topSubtitle
                  }
                >
                  AI Mains Evaluation
                </div>
              </div>
            </header>

            {/* SCORE */}

            <section
              style={
                styles.scoreCard
              }
            >
              <div
                style={
                  styles.scoreLabel
                }
              >
                UPSC-STYLE EVALUATION
              </div>

              <div
                style={
                  styles.score
                }
              >
                {
                  evaluation.overall_score
                }
                <span>
                  /
                  {
                    evaluation.maximum_marks ||
                    marks
                  }
                </span>
              </div>

              <div
                style={
                  styles.scoreAssessment
                }
              >
                {
                  evaluation.overall_assessment
                }
              </div>
            </section>

            {/* QUESTION ANALYSIS */}

            <EvaluationSection
              title="1. Question Demand Analysis"
            >
              <div
                style={
                  styles.directiveBox
                }
              >
                <span>
                  Directive
                </span>

                <strong>
                  {
                    evaluation
                      .question_analysis
                      ?.directive
                  }
                </strong>
              </div>

              <InfoBlock
                title="Core Demand"
                text={
                  evaluation
                    .question_analysis
                    ?.core_demand
                }
              />

              <ArrayBlock
                title="Keywords"
                items={
                  evaluation
                    .question_analysis
                    ?.keywords
                }
              />

              <ArrayBlock
                title="Expected Dimensions"
                items={
                  evaluation
                    .question_analysis
                    ?.expected_dimensions
                }
              />
            </EvaluationSection>

            {/* DEMAND */}

            <EvaluationSection
              title="2. Demand Fulfilment"
            >
              <ScoreLine
                score={
                  evaluation
                    .demand_fulfilment
                    ?.score
                }
                maximum={
                  evaluation
                    .demand_fulfilment
                    ?.maximum
                }
              />

              <InfoBlock
                title="Assessment"
                text={
                  evaluation
                    .demand_fulfilment
                    ?.assessment
                }
              />

              <ArrayBlock
                title="Missing Demands"
                items={
                  evaluation
                    .demand_fulfilment
                    ?.missing_demands
                }
              />
            </EvaluationSection>

            {/* INTRODUCTION */}

            <EvaluationSection
              title="3. Introduction"
            >
              <InfoBlock
                title="Assessment"
                text={
                  evaluation
                    .introduction
                    ?.assessment
                }
              />

              <ArrayBlock
                title="Strengths"
                items={
                  evaluation
                    .introduction
                    ?.strengths
                }
              />

              <ArrayBlock
                title="Weaknesses"
                items={
                  evaluation
                    .introduction
                    ?.weaknesses
                }
              />

              <ImprovementBlock
                text={
                  evaluation
                    .introduction
                    ?.improvement
                }
              />
            </EvaluationSection>

            {/* BODY */}

            <EvaluationSection
              title="4. Body Analysis"
            >
              <ScoreGrid
                items={[
                  {
                    label:
                      "Content",
                    score:
                      evaluation
                        .body_analysis
                        ?.content_score,
                    max:
                      evaluation
                        .body_analysis
                        ?.content_maximum,
                  },
                  {
                    label:
                      "Analysis",
                    score:
                      evaluation
                        .body_analysis
                        ?.analysis_score,
                    max:
                      evaluation
                        .body_analysis
                        ?.analysis_maximum,
                  },
                  {
                    label:
                      "Structure",
                    score:
                      evaluation
                        .body_analysis
                        ?.structure_score,
                    max:
                      evaluation
                        .body_analysis
                        ?.structure_maximum,
                  },
                ]}
              />

              <InfoBlock
                title="Assessment"
                text={
                  evaluation
                    .body_analysis
                    ?.assessment
                }
              />

              <ArrayBlock
                title="Strengths"
                items={
                  evaluation
                    .body_analysis
                    ?.strengths
                }
              />

              <ArrayBlock
                title="Weaknesses"
                items={
                  evaluation
                    .body_analysis
                    ?.weaknesses
                }
              />
            </EvaluationSection>

            {/* EXAMPLES */}

            <EvaluationSection
              title="5. Examples & Data"
            >
              <ScoreLine
                score={
                  evaluation
                    .examples_and_data
                    ?.score
                }
                maximum={
                  evaluation
                    .examples_and_data
                    ?.maximum
                }
              />

              <InfoBlock
                title="Assessment"
                text={
                  evaluation
                    .examples_and_data
                    ?.assessment
                }
              />

              <ArrayBlock
                title="Good Examples"
                items={
                  evaluation
                    .examples_and_data
                    ?.good_examples
                }
              />

              <ArrayBlock
                title="Missing Examples"
                items={
                  evaluation
                    .examples_and_data
                    ?.missing_examples
                }
              />
            </EvaluationSection>

            {/* FACTUAL */}

            <EvaluationSection
              title="6. Factual Accuracy"
            >
              <InfoBlock
                title="Assessment"
                text={
                  evaluation
                    .factual_accuracy
                    ?.assessment
                }
              />

              <ArrayBlock
                title="Possible Errors"
                items={
                  evaluation
                    .factual_accuracy
                    ?.possible_errors
                }
              />

              <ArrayBlock
                title="Corrections"
                items={
                  evaluation
                    .factual_accuracy
                    ?.corrections
                }
              />
            </EvaluationSection>

            {/* CONCLUSION */}

            <EvaluationSection
              title="7. Conclusion"
            >
              <InfoBlock
                title="Assessment"
                text={
                  evaluation
                    .conclusion
                    ?.assessment
                }
              />

              <ArrayBlock
                title="Strengths"
                items={
                  evaluation
                    .conclusion
                    ?.strengths
                }
              />

              <ArrayBlock
                title="Weaknesses"
                items={
                  evaluation
                    .conclusion
                    ?.weaknesses
                }
              />

              <ImprovementBlock
                text={
                  evaluation
                    .conclusion
                    ?.improvement
                }
              />
            </EvaluationSection>

            {/* MISSING DIMENSIONS */}

            <EvaluationSection
              title="8. Missing Dimensions"
            >
              {(
                evaluation
                  .missing_dimensions ||
                []
              ).map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    style={
                      styles.dimensionCard
                    }
                  >
                    <strong>
                      {item.dimension}
                    </strong>

                    <p>
                      <b>
                        Why important:
                      </b>{" "}
                      {
                        item.why_important
                      }
                    </p>

                    <p>
                      <b>
                        How to add:
                      </b>{" "}
                      {
                        item.how_to_add
                      }
                    </p>
                  </div>
                )
              )}
            </EvaluationSection>

            {/* POINT FEEDBACK */}

            <EvaluationSection
              title="9. Point-Level Feedback"
            >
              {(
                evaluation
                  .point_level_feedback ||
                []
              ).map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    style={
                      styles.feedbackCard
                    }
                  >
                    <div
                      style={
                        styles.feedbackType
                      }
                    >
                      {
                        item.type
                      }
                    </div>

                    <div
                      style={
                        styles.feedbackIssue
                      }
                    >
                      {
                        item.issue
                      }
                    </div>

                    <div
                      style={
                        styles.feedbackImprove
                      }
                    >
                      <b>
                        Improve:
                      </b>{" "}
                      {
                        item.improvement
                      }
                    </div>
                  </div>
                )
              )}
            </EvaluationSection>

            {/* FRAMEWORK */}

            <EvaluationSection
              title="10. Better Answer Framework"
            >
              <InfoBlock
                title="Introduction"
                text={
                  evaluation
                    .answer_structure
                    ?.introduction
                }
              />

              <ArrayBlock
                title="Body"
                items={
                  evaluation
                    .answer_structure
                    ?.body
                }
              />

              <InfoBlock
                title="Conclusion"
                text={
                  evaluation
                    .answer_structure
                    ?.conclusion
                }
              />

              <ArrayBlock
                title="Model Framework"
                items={
                  evaluation
                    .model_framework
                }
              />
            </EvaluationSection>

            {/* IMPROVEMENT */}

            <EvaluationSection
              title="11. Next Attempt Improvement Plan"
            >
              <ArrayBlock
                title=""
                items={
                  evaluation
                    .improvement_plan
                }
              />
            </EvaluationSection>

            {/* EXAMINER */}

            <section
              style={
                styles.examinerCard
              }
            >
              <div
                style={
                  styles.examinerLabel
                }
              >
                EXAMINER SUMMARY
              </div>

              <p
                style={
                  styles.examinerText
                }
              >
                {
                  evaluation.examiner_summary
                }
              </p>
            </section>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/pyq"
                )
              }
              style={
                styles.fullButton
              }
            >
              ← Back to Mains PYQs
            </button>
          </div>
        </main>
      </>
    );
  }

  /* ---------------- ANSWER WRITING ---------------- */

  if (!questionData) {
    return (
      <>
        <main
          style={styles.page}
        >
          <div
            style={
              styles.centerCard
            }
          >
            Loading question...
          </div>
        </main>
      </>
    );
  }

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
            style={
              styles.topBar
            }
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/pyq"
                )
              }
              style={
                styles.backButton
              }
            >
              ←
            </button>

            <div>
              <div
                style={
                  styles.logo
                }
              >
                SAMBHAV UPSC
              </div>

              <div
                style={
                  styles.topSubtitle
                }
              >
                Mains Answer Writing
              </div>
            </div>
          </header>

          {/* QUESTION */}

          <section
            style={
              styles.questionCard
            }
          >
            <div
              style={
                styles.questionMeta
              }
            >
              {questionData.year ||
                "UPSC"}{" "}
              ·{" "}
              {
                questionData.paper
              }

              {questionData.section
                ? ` · ${questionData.section}`
                : ""}

              {" · "}
              {marks} Marks
            </div>

            <div
              style={
                styles.questionText
              }
            >
              {
                questionData.question
              }
            </div>

            <div
              style={
                styles.limitRow
              }
            >
              <span>
                Word Limit:{" "}
                <strong>
                  {wordLimit}
                </strong>
              </span>

              <span>
                Target:{" "}
                {marks <= 10
                  ? "150 words"
                  : "250 words"}
              </span>
            </div>
          </section>

          {/* TIMER */}

          <section
            style={
              styles.controlBar
            }
          >
            <div>
              <div
                style={
                  styles.controlLabel
                }
              >
                TIME
              </div>

              <div
                style={
                  styles.timer
                }
              >
                {formatTime(
                  seconds
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setTimerRunning(
                  (value) =>
                    !value
                )
              }
              style={
                styles.pauseButton
              }
            >
              {timerRunning
                ? "Pause"
                : "Resume"}
            </button>
          </section>

          {/* ANSWER EDITOR */}

          <section
            style={
              styles.editorCard
            }
          >
            <div
              style={
                styles.editorHeader
              }
            >
              <div>
                <div
                  style={
                    styles.editorTitle
                  }
                >
                  Your Answer
                </div>

                <div
                  style={
                    styles.editorHint
                  }
                >
                  Write as you would in
                  the UPSC Mains examination.
                </div>
              </div>

              <div
                style={{
                  ...styles.wordCount,
                  ...(wordCount >
                  wordLimit
                    ? styles.wordCountOver
                    : {}),
                }}
              >
                {wordCount}/
                {wordLimit}
              </div>
            </div>

            <textarea
              value={answer}
              onChange={(e) =>
                setAnswer(
                  e.target.value
                )
              }
              placeholder="Start writing your answer..."
              style={
                styles.textarea
              }
              spellCheck={true}
            />

            <div
              style={
                styles.editorFooter
              }
            >
              <span
                style={
                  styles.editorTip
                }
              >
                Focus on demand,
                structure, dimensions
                and analysis.
              </span>

              <button
                type="button"
                onClick={
                  saveDraft
                }
                style={
                  styles.saveButton
                }
              >
                {saved
                  ? "✓ Saved"
                  : "Save Draft"}
              </button>
            </div>
          </section>

          {/* SUBMIT */}

          {error && (
            <div
              style={
                styles.errorBox
              }
            >
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={
              evaluating ||
              !answer.trim()
            }
            onClick={
              submitForEvaluation
            }
            style={{
              ...styles.evaluateButton,
              ...(evaluating ||
              !answer.trim()
                ? styles.disabledButton
                : {}),
            }}
          >
            {evaluating
              ? "AI is evaluating..."
              : "Submit for UPSC Evaluation →"}
          </button>

          <div
            style={
              styles.securityNote
            }
          >
            Your answer is evaluated against
            the question demand, directive,
            content, analysis, structure,
            examples, factual accuracy and
            UPSC-specific dimensions.
          </div>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   RESULT COMPONENTS
========================================================= */

function EvaluationSection({
  title,
  children,
}) {
  return (
    <section
      style={
        styles.evaluationSection
      }
    >
      <h2
        style={
          styles.evaluationTitle
        }
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function InfoBlock({
  title,
  text,
}) {
  if (!text) return null;

  return (
    <div
      style={
        styles.infoBlock
      }
    >
      {title && (
        <div
          style={
            styles.infoBlockTitle
          }
        >
          {title}
        </div>
      )}

      <div
        style={
          styles.infoBlockText
        }
      >
        {text}
      </div>
    </div>
  );
}

function ArrayBlock({
  title,
  items,
}) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return null;
  }

  return (
    <div
      style={
        styles.arrayBlock
      }
    >
      {title && (
        <div
          style={
            styles.arrayTitle
          }
        >
          {title}
        </div>
      )}

      <ul
        style={
          styles.arrayList
        }
      >
        {items.map(
          (item, index) => (
            <li
              key={index}
            >
              {item}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function ImprovementBlock({
  text,
}) {
  if (!text) return null;

  return (
    <div
      style={
        styles.improvement
      }
    >
      <strong>
        How to improve
      </strong>

      <p>{text}</p>
    </div>
  );
}

function ScoreLine({
  score,
  maximum,
}) {
  return (
    <div
      style={
        styles.scoreLine
      }
    >
      <span>
        Score
      </span>

      <strong>
        {score ?? 0}/
        {maximum ?? 0}
      </strong>
    </div>
  );
}

function ScoreGrid({
  items,
}) {
  return (
    <div
      style={
        styles.scoreGrid
      }
    >
      {items.map(
        (item) => (
          <div
            key={
              item.label
            }
            style={
              styles.miniScore
            }
          >
            <span>
              {item.label}
            </span>

            <strong>
              {item.score ??
                0}
              /
              {item.max ??
                0}
            </strong>
          </div>
        )
      )}
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
      "18px 16px 45px",
  },

  centerCard: {
    maxWidth: "500px",
    margin: "80px auto",
    padding: "30px",
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "24px",
    textAlign: "center",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },

  backButton: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    border:
      "1px solid #ddd",
    background: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },

  logo: {
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing:
      "-0.4px",
  },

  topSubtitle: {
    fontSize: "10px",
    color: "#888",
    marginTop: "3px",
  },

  questionCard: {
    background: "#111",
    color: "#fff",
    borderRadius: "23px",
    padding: "20px",
    marginBottom: "12px",
  },

  questionMeta: {
    color: "#aaa",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: ".5px",
    textTransform:
      "uppercase",
  },

  questionText: {
    fontSize: "17px",
    lineHeight: "1.55",
    fontWeight: "750",
    marginTop: "11px",
  },

  limitRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop:
      "1px solid #292929",
    color: "#aaa",
    fontSize: "10px",
  },

  controlBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "18px",
    padding:
      "13px 16px",
    marginBottom: "10px",
  },

  controlLabel: {
    fontSize: "8px",
    color: "#999",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  timer: {
    fontSize: "22px",
    fontWeight: "900",
    marginTop: "2px",
    fontVariantNumeric:
      "tabular-nums",
  },

  pauseButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    borderRadius: "11px",
    padding:
      "9px 13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  editorCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "21px",
    padding: "16px",
  },

  editorHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "11px",
  },

  editorTitle: {
    fontSize: "15px",
    fontWeight: "850",
  },

  editorHint: {
    color: "#888",
    fontSize: "10px",
    marginTop: "3px",
    lineHeight: "1.4",
  },

  wordCount: {
    flexShrink: 0,
    borderRadius: "10px",
    background: "#f0f0ee",
    padding:
      "8px 10px",
    fontSize: "10px",
    fontWeight: "800",
  },

  wordCountOver: {
    background: "#111",
    color: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: "390px",
    resize: "vertical",
    boxSizing: "border-box",
    border:
      "1px solid #ddd",
    borderRadius: "15px",
    padding: "15px",
    outline: "none",
    fontSize: "14px",
    lineHeight: "1.7",
    fontFamily:
      "inherit",
    background: "#fafafa",
  },

  editorFooter: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
  },

  editorTip: {
    color: "#999",
    fontSize: "9px",
    lineHeight: "1.4",
  },

  saveButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    borderRadius: "10px",
    padding:
      "9px 12px",
    fontWeight: "700",
    fontSize: "10px",
    cursor: "pointer",
    flexShrink: 0,
  },

  errorBox: {
    background: "#fff",
    color: "#555",
    border:
      "1px solid #ccc",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "10px",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  evaluateButton: {
    width: "100%",
    marginTop: "12px",
    border: 0,
    background: "#111",
    color: "#fff",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "13px",
    fontWeight: "850",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  securityNote: {
    textAlign: "center",
    color: "#999",
    fontSize: "9px",
    lineHeight: "1.5",
    margin:
      "11px auto 0",
    maxWidth: "500px",
  },

  /* RESULT */

  scoreCard: {
    background: "#111",
    color: "#fff",
    borderRadius: "24px",
    padding: "25px",
    textAlign: "center",
    marginBottom: "12px",
  },

  scoreLabel: {
    color: "#999",
    fontSize: "9px",
    letterSpacing:
      "1.5px",
    fontWeight: "800",
  },

  score: {
    fontSize: "54px",
    lineHeight: "1",
    fontWeight: "950",
    marginTop: "12px",
  },

  scoreAssessment: {
    color: "#bbb",
    fontSize: "12px",
    lineHeight: "1.5",
    marginTop: "14px",
  },

  evaluationSection: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "17px",
    marginBottom: "10px",
  },

  evaluationTitle: {
    fontSize: "15px",
    fontWeight: "900",
    margin:
      "0 0 13px",
  },

  directiveBox: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    background: "#111",
    color: "#fff",
    borderRadius: "13px",
    padding:
      "12px 13px",
    fontSize: "11px",
  },

  infoBlock: {
    background: "#f7f7f5",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "9px",
  },

  infoBlockTitle: {
    fontSize: "10px",
    color: "#777",
    fontWeight: "800",
    textTransform:
      "uppercase",
    letterSpacing: ".5px",
    marginBottom: "5px",
  },

  infoBlockText: {
    fontSize: "12px",
    lineHeight: "1.55",
  },

  arrayBlock: {
    marginTop: "11px",
  },

  arrayTitle: {
    fontSize: "11px",
    fontWeight: "850",
    marginBottom: "5px",
  },

  arrayList: {
    margin:
      "0 0 0 18px",
    padding: 0,
    fontSize: "12px",
    lineHeight: "1.6",
  },

  improvement: {
    marginTop: "11px",
    padding: "12px",
    borderRadius: "13px",
    background: "#f0f0ee",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  improvement p: {
    marginTop: "5px",
  },

  scoreLine: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    background: "#f0f0ee",
    borderRadius: "12px",
    padding:
      "11px 13px",
    fontSize: "12px",
    marginBottom: "10px",
  },

  scoreGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "7px",
    marginBottom: "10px",
  },

  miniScore: {
    background: "#f0f0ee",
    borderRadius: "11px",
    padding: "10px",
    textAlign: "center",
  },

  miniScore span: {
    display: "block",
    color: "#777",
    fontSize: "9px",
  },

  miniScore strong: {
    display: "block",
    marginTop: "4px",
    fontSize: "13px",
  },

  dimensionCard: {
    border:
      "1px solid #e2e2df",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "8px",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  dimensionCard p: {
    margin:
      "7px 0 0",
  },

  feedbackCard: {
    border:
      "1px solid #e2e2df",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "8px",
  },

  feedbackType: {
    display: "inline-block",
    background: "#111",
    color: "#fff",
    borderRadius: "7px",
    padding:
      "4px 7px",
    fontSize: "8px",
    fontWeight: "800",
    marginBottom: "7px",
  },

  feedbackIssue: {
    fontSize: "12px",
    lineHeight: "1.5",
  },

  feedbackImprove: {
    marginTop: "7px",
    fontSize: "11px",
    lineHeight: "1.5",
    color: "#555",
  },

  examinerCard: {
    background: "#111",
    color: "#fff",
    borderRadius: "21px",
    padding: "18px",
    marginTop: "10px",
  },

  examinerLabel: {
    color: "#999",
    fontSize: "9px",
    letterSpacing:
      "1.2px",
    fontWeight: "800",
  },

  examinerText: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "#ddd",
    margin:
      "10px 0 0",
  },

  fullButton: {
    width: "100%",
    border: 0,
    background: "#111",
    color: "#fff",
    borderRadius: "14px",
    padding: "14px",
    marginTop: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  muted: {
    color: "#777",
    fontSize: "12px",
    lineHeight: "1.5",
  },
};
