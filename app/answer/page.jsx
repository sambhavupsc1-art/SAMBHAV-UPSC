"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGES = 4;

export default function AnswerWritingPage() {
  const router = useRouter();

  const [questionData, setQuestionData] =
    useState(null);

  const [images, setImages] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [evaluating, setEvaluating] =
    useState(false);

  const [evaluation, setEvaluation] =
    useState(null);

  const [error, setError] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  /* =========================
     LOAD QUESTION
  ========================= */

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

  /* =========================
     CLEANUP PREVIEW URLS
  ========================= */

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  /* =========================
     WORD LIMIT
  ========================= */

  const marks = Number(
    questionData?.marks || 15
  );

  const wordLimit = Number(
    questionData?.word_limit ||
      questionData?.words ||
      (marks <= 10 ? 150 : 250)
  );

  /* =========================
     IMAGE VALIDATION
  ========================= */

  const validateFiles = (
    selectedFiles
  ) => {
    const valid = [];

    for (const file of selectedFiles) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        continue;
      }

      if (
        file.size >
        8 * 1024 * 1024
      ) {
        setError(
          `${file.name} 8MB se bada hai.`
        );
        continue;
      }

      valid.push(file);
    }

    return valid;
  };

  /* =========================
     ADD IMAGES
  ========================= */

  const addImages = (
    selectedFiles
  ) => {
    setError("");

    const valid =
      validateFiles(
        Array.from(selectedFiles)
      );

    if (!valid.length) {
      return;
    }

    const remaining =
      MAX_IMAGES -
      images.length;

    if (remaining <= 0) {
      setError(
        "Maximum 4 pages upload kar sakte hain."
      );
      return;
    }

    const filesToAdd =
      valid.slice(
        0,
        remaining
      );

    const newImages = [
      ...images,
      ...filesToAdd,
    ];

    const newPreviews =
      newImages.map(
        (file) =>
          URL.createObjectURL(file)
      );

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setImages(
      newImages
    );

    setPreviews(
      newPreviews
    );

    if (
      valid.length >
      remaining
    ) {
      setError(
        "Maximum 4 pages allowed hain."
      );
    }
  };

  /* =========================
     FILE INPUT
  ========================= */

  const handleFileChange = (
    event
  ) => {
    const files =
      event.target.files;

    if (files?.length) {
      addImages(files);
    }

    event.target.value = "";
  };

  /* =========================
     REMOVE IMAGE
  ========================= */

  const removeImage = (
    index
  ) => {
    const newImages =
      images.filter(
        (_, i) =>
          i !== index
      );

    const newPreviews =
      newImages.map(
        (file) =>
          URL.createObjectURL(file)
      );

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setImages(
      newImages
    );

    setPreviews(
      newPreviews
    );

    setError("");
  };

  /* =========================
     MOVE PAGE
  ========================= */

  const moveImage = (
    from,
    to
  ) => {
    if (
      to < 0 ||
      to >= images.length
    ) {
      return;
    }

    const newImages = [
      ...images,
    ];

    const [
      moved
    ] =
      newImages.splice(
        from,
        1
      );

    newImages.splice(
      to,
      0,
      moved
    );

    const newPreviews =
      newImages.map(
        (file) =>
          URL.createObjectURL(file)
      );

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setImages(
      newImages
    );

    setPreviews(
      newPreviews
    );
  };

  /* =========================
     DRAG & DROP
  ========================= */

  const handleDrop = (
    event
  ) => {
    event.preventDefault();

    setDragActive(false);

    if (
      event.dataTransfer.files
        ?.length
    ) {
      addImages(
        event.dataTransfer.files
      );
    }
  };

  /* =========================
     SUBMIT
  ========================= */

  const submitForEvaluation =
    async () => {
      if (!questionData) {
        return;
      }

      if (
        images.length === 0
      ) {
        setError(
          "Pehle handwritten answer ki image upload karein."
        );
        return;
      }

      setError("");
      setEvaluating(true);

      try {
        const formData =
          new FormData();

        formData.append(
          "question",
          questionData.question ||
            ""
        );

        formData.append(
          "paper",
          questionData.paper ||
            "GS"
        );

        formData.append(
          "section",
          questionData.section ||
            ""
        );

        formData.append(
          "marks",
          String(marks)
        );

        formData.append(
          "word_limit",
          String(wordLimit)
        );

        images.forEach(
          (file, index) => {
            formData.append(
              `image_${index + 1}`,
              file,
              file.name
            );
          }
        );

        const response =
          await fetch(
            "/api/ai/evaluate",
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
  const status =
    data?.openai_status ??
    response.status ??
    "unknown";

  const details =
    data?.details ||
    data?.error ||
    "Server ne koi additional error detail return nahi ki.";

  throw new Error(
    `${data?.error || "AI evaluation request failed."}

OpenAI Status: ${status}

Details:
${details}`
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
            pages:
              images.length,
            evaluation:
              data.evaluation,
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
      } finally {
        setEvaluating(false);
      }
    };

  /* =========================
     SCORE
  ========================= */

  const score =
    evaluation?.overall_score ??
    0;

  const maximum =
    evaluation?.maximum_marks ||
    marks;

  /* =========================
     ERROR STATE
  ========================= */

  if (
    error &&
    !questionData
  ) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
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
              Answer Evaluation
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

  /* =========================
     RESULT
  ========================= */

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
                {score}
                <span>
                  /{maximum}
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
                      {
                        item.dimension
                      }
                    </strong>

                    <p
                      style={
                        styles.dimensionText
                      }
                    >
                      <b>
                        Why important:
                      </b>{" "}
                      {
                        item.why_important
                      }
                    </p>

                    <p
                      style={
                        styles.dimensionText
                      }
                    >
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

            <EvaluationSection
              title="11. Next Attempt Improvement Plan"
            >
              <ArrayBlock
                items={
                  evaluation
                    .improvement_plan
                }
              />
            </EvaluationSection>

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

  /* =========================
     LOADING
  ========================= */

  if (!questionData) {
    return (
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
    );
  }

  /* =========================
     UPLOAD SCREEN
  ========================= */

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
                Handwritten Answer Evaluation
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
              {questionData.paper}{" "}
              · {marks} Marks
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
                Handwritten Mode
              </span>
            </div>
          </section>

          {/* UPLOAD CARD */}

          <section
            style={
              styles.uploadCard
            }
          >
            <div
              style={
                styles.uploadHeader
              }
            >
              <div>
                <div
                  style={
                    styles.uploadTitle
                  }
                >
                  Upload Handwritten Answer
                </div>

                <div
                  style={
                    styles.uploadSubtitle
                  }
                >
                  Maximum 4 pages · JPG, PNG, WEBP
                </div>
              </div>

              <div
                style={
                  styles.pageCounter
                }
              >
                {images.length}/4
              </div>
            </div>

            <label
              style={{
                ...styles.dropZone,
                ...(dragActive
                  ? styles.dropZoneActive
                  : {}),
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() =>
                setDragActive(false)
              }
              onDrop={
                handleDrop
              }
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={
                  handleFileChange
                }
                style={
                  styles.hiddenInput
                }
              />

              <div
                style={
                  styles.uploadIcon
                }
              >
                ↑
              </div>

              <div
                style={
                  styles.dropTitle
                }
              >
                Tap to upload pages
              </div>

              <div
                style={
                  styles.dropSubtitle
                }
              >
                Ya 3–4 photos ek saath select karein
              </div>

              <div
                style={
                  styles.uploadHint
                }
              >
                Page order upload ke order mein rahega
              </div>
            </label>

            {/* PREVIEWS */}

            {images.length > 0 && (
              <div
                style={
                  styles.previewGrid
                }
              >
                {images.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={
                        `${file.name}-${index}`
                      }
                      style={
                        styles.previewCard
                      }
                    >
                      <div
                        style={
                          styles.previewImageWrap
                        }
                      >
                        <img
                          src={
                            previews[
                              index
                            ]
                          }
                          alt={`Answer page ${
                            index + 1
                          }`}
                          style={
                            styles.previewImage
                          }
                        />

                        <div
                          style={
                            styles.pageBadge
                          }
                        >
                          Page{" "}
                          {index +
                            1}
                        </div>
                      </div>

                      <div
                        style={
                          styles.previewActions
                        }
                      >
                        <button
                          type="button"
                          disabled={
                            index ===
                            0
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              index -
                                1
                            )
                          }
                          style={
                            styles.smallButton
                          }
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            images.length -
                              1
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              index +
                                1
                            )
                          }
                          style={
                            styles.smallButton
                          }
                        >
                          →
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              index
                            )
                          }
                          style={
                            styles.removeButton
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* ERROR */}

          {error && (
            <div
              style={
                styles.errorBox
              }
            >
              {error}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="button"
            disabled={
              evaluating ||
              images.length ===
                0
            }
            onClick={
              submitForEvaluation
            }
            style={{
              ...styles.evaluateButton,
              ...(evaluating ||
              images.length === 0
                ? styles.disabledButton
                : {}),
            }}
          >
            {evaluating
              ? "AI is reading your answer..."
              : "Submit for UPSC Evaluation →"}
          </button>

          <div
            style={
              styles.securityNote
            }
          >
            AI uploaded pages ko read karke question
            demand, content, analysis, structure,
            examples, factual accuracy aur missing
            dimensions ke basis par evaluation karega.
          </div>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   COMPONENTS
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
              key={
                index
              }
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

      <p
        style={
          styles.improvementText
        }
      >
        {text}
      </p>
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
            <span
              style={
                styles.miniScoreLabel
              }
            >
              {item.label}
            </span>

            <strong
              style={
                styles.miniScoreValue
              }
            >
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
    letterSpacing:
      ".5px",
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

  uploadCard: {
    background: "#fff",
    border:
      "1px solid #e5e5e3",
    borderRadius: "21px",
    padding: "16px",
  },

  uploadHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  uploadTitle: {
    fontSize: "15px",
    fontWeight: "900",
  },

  uploadSubtitle: {
    fontSize: "10px",
    color: "#888",
    marginTop: "4px",
  },

  pageCounter: {
    background: "#111",
    color: "#fff",
    borderRadius: "10px",
    padding:
      "8px 10px",
    fontSize: "10px",
    fontWeight: "800",
  },

  dropZone: {
    display: "block",
    border:
      "2px dashed #d4d4d0",
    borderRadius: "17px",
    padding: "30px 16px",
    textAlign: "center",
    cursor: "pointer",
    background: "#fafafa",
  },

  dropZoneActive: {
    borderColor: "#111",
    background: "#f0f0ee",
  },

  hiddenInput: {
    display: "none",
  },

  uploadIcon: {
    width: "46px",
    height: "46px",
    margin:
      "0 auto 10px",
    borderRadius: "14px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "23px",
    fontWeight: "900",
  },

  dropTitle: {
    fontSize: "14px",
    fontWeight: "850",
  },

  dropSubtitle: {
    fontSize: "11px",
    color: "#777",
    marginTop: "5px",
  },

  uploadHint: {
    fontSize: "9px",
    color: "#aaa",
    marginTop: "9px",
  },

  previewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "12px",
  },

  previewCard: {
    border:
      "1px solid #e2e2df",
    borderRadius: "15px",
    overflow: "hidden",
    background: "#fafafa",
  },

  previewImageWrap: {
    position: "relative",
    background: "#eee",
    aspectRatio: "3 / 4",
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  pageBadge: {
    position: "absolute",
    top: "8px",
    left: "8px",
    background: "#111",
    color: "#fff",
    borderRadius: "7px",
    padding:
      "5px 7px",
    fontSize: "8px",
    fontWeight: "800",
  },

  previewActions: {
    display: "flex",
    gap: "5px",
    padding: "7px",
  },

  smallButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    borderRadius: "8px",
    padding:
      "6px 8px",
    cursor: "pointer",
    fontWeight: "800",
  },

  removeButton: {
    marginLeft: "auto",
    border: 0,
    background: "#111",
    color: "#fff",
    borderRadius: "8px",
    padding:
      "6px 8px",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: "700",
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
    maxWidth: "520px",
  },

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
    letterSpacing:
      ".5px",
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

  improvementText: {
    margin:
      "5px 0 0",
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

  miniScoreLabel: {
    display: "block",
    color: "#777",
    fontSize: "9px",
  },

  miniScoreValue: {
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

  dimensionText: {
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

  muted: {
    color: "#777",
    fontSize: "12px",
    lineHeight: "1.5",
  },
};
