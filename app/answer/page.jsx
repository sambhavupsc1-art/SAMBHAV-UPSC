"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGES = 4;

export default function AnswerWritingPage() {
  const router = useRouter();

  const [questionData, setQuestionData] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationStartedAt, setEvaluationStartedAt] = useState(null);
  const [evaluationElapsed, setEvaluationElapsed] = useState(0);
  const [selectedAnswerMarker, setSelectedAnswerMarker] = useState(null);
  const [historySaveState, setHistorySaveState] = useState("idle");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  /* =========================
     MANUAL QUESTION
  ========================= */

  const [manualMode, setManualMode] = useState(false);
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualMarks, setManualMarks] = useState("15");
  const [manualWordLimit, setManualWordLimit] = useState("250");

  /* =========================
     TIMER
  ========================= */

  const [timeLeft, setTimeLeft] = useState(null);
  const [timeExpired, setTimeExpired] = useState(false);

  /* =========================
     LOAD QUESTION
  ========================= */

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(
        "sambhav_answer_question"
      );

      if (!raw) {
        setManualMode(true);
        return;
      }

      const data = JSON.parse(raw);
      setQuestionData(data);
    } catch (err) {
      console.error("Question load error:", err);
      setError("Question load nahi ho saka.");
    }
  }, []);

  /* =========================
     CLEANUP PREVIEWS
  ========================= */

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  useEffect(() => {
    if (!evaluating || !evaluationStartedAt) return;
    const tick = () => setEvaluationElapsed(Math.max(0, Math.floor((Date.now() - evaluationStartedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [evaluating, evaluationStartedAt]);

  const evaluationElapsedLabel = `${String(Math.floor(evaluationElapsed / 60)).padStart(2, "0")}:${String(evaluationElapsed % 60).padStart(2, "0")}`;
  const evaluationStage = evaluationElapsed < 8
    ? "Reading your answer pages"
    : evaluationElapsed < 22
    ? "Mapping the question demands"
    : evaluationElapsed < 40
    ? "Checking content and evidence"
    : "Finalising marks and feedback";

  /* =========================
     MARKS / WORD LIMIT
  ========================= */

  const marks = Number(questionData?.marks || 15);

  const wordLimit = Number(
    questionData?.word_limit ||
      questionData?.words ||
      (marks <= 10 ? 150 : 250)
  );

  /* =========================
     TIMER
  ========================= */

  useEffect(() => {
    if (!questionData || evaluation) return;

    const totalSeconds =
      marks <= 10
        ? 7 * 60
        : marks <= 15
        ? 11 * 60
        : 15 * 60;

    setTimeLeft(totalSeconds);
    setTimeExpired(false);

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current === null || current <= 1) {
          setTimeExpired(true);
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questionData?.id, marks, evaluation]);

  const formattedTime =
    timeLeft === null
      ? "--:--"
      : `${String(Math.floor(timeLeft / 60)).padStart(
          2,
          "0"
        )}:${String(timeLeft % 60).padStart(2, "0")}`;

  /* =========================
     MANUAL QUESTION START
  ========================= */

  const startManualQuestion = () => {
    const cleanQuestion = manualQuestion.trim();

    if (!cleanQuestion) {
      setError("Pehle apna question enter karein.");
      return;
    }

    const selectedMarks = Number(manualMarks);
    const selectedWordLimit = Number(manualWordLimit);

    setError("");

    setQuestionData({
      id: `manual-${Date.now()}`,
      year: "Manual",
      paper: "Manual Question",
      section: "User Question",
      question: cleanQuestion,
      marks: selectedMarks,
      word_limit: selectedWordLimit,
      words: selectedWordLimit,
    });

    setManualMode(false);
  };

  /* =========================
     IMAGE VALIDATION
  ========================= */

  const validateFiles = (selectedFiles) => {
    const valid = [];

    for (const file of selectedFiles) {
      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type)
      ) {
        setError(
          `${file.name} JPG, PNG ya WEBP hona chahiye.`
        );
        continue;
      }

      if (file.size > 8 * 1024 * 1024) {
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

  const addImages = (selectedFiles) => {
    setError("");

    const valid = validateFiles(
      Array.from(selectedFiles)
    );

    if (!valid.length) return;

    const remaining =
      MAX_IMAGES - images.length;

    if (remaining <= 0) {
      setError(
        "Maximum 4 pages upload kar sakte hain."
      );
      return;
    }

    const filesToAdd = valid.slice(
      0,
      remaining
    );

    const newImages = [
      ...images,
      ...filesToAdd,
    ];

    const newPreviews = newImages.map(
      (file) => URL.createObjectURL(file)
    );

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setImages(newImages);
    setPreviews(newPreviews);

    if (valid.length > remaining) {
      setError(
        "Maximum 4 pages allowed hain."
      );
    }
  };

  /* =========================
     FILE INPUT
  ========================= */

  const handleFileChange = (event) => {
    const files = event.target.files;

    if (files?.length) {
      addImages(files);
    }

    event.target.value = "";
  };

  /* =========================
     REMOVE IMAGE
  ========================= */

  const removeImage = (index) => {
    const newImages = images.filter(
      (_, i) => i !== index
    );

    const newPreviews = newImages.map(
      (file) => URL.createObjectURL(file)
    );

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setImages(newImages);
    setPreviews(newPreviews);
    setError("");
  };

  /* =========================
     MOVE PAGE
  ========================= */

  const moveImage = (from, to) => {
    if (
      to < 0 ||
      to >= images.length
    ) {
      return;
    }

    const newImages = [...images];

    const [moved] = newImages.splice(
      from,
      1
    );

    newImages.splice(to, 0, moved);

    const newPreviews = newImages.map(
      (file) => URL.createObjectURL(file)
    );

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setImages(newImages);
    setPreviews(newPreviews);
  };

  /* =========================
     DRAG & DROP
  ========================= */

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    if (
      event.dataTransfer.files?.length
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
      if (!questionData) return;

      if (images.length === 0) {
        setError(
          "Pehle handwritten answer ki image upload karein."
        );
        return;
      }

      setError("");
      setEvaluationElapsed(0);
      setEvaluationStartedAt(Date.now());
      setEvaluating(true);

      try {
        // Reuse the exact saved evaluation for identical question + exact image bytes
        // in this browser session. This prevents accidental score drift on repeat taps.
        const fingerprintParts = [
          questionData.question || "",
          questionData.paper || "GS",
          questionData.section || "",
          String(marks),
          String(wordLimit),
        ];
        const imageSignatures = [];
        for (const file of images) {
          const bytes = await file.arrayBuffer();
          const digest = await crypto.subtle.digest("SHA-256", bytes);
          imageSignatures.push(Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join(""));
        }
        const cacheSource = `${fingerprintParts.join("|")}::${imageSignatures.join("|")}`;
        const cacheDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cacheSource));
        const cacheKey = `sambhav_evaluation_cache_${Array.from(new Uint8Array(cacheDigest)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
        const cachedEvaluation = sessionStorage.getItem(cacheKey);

        if (cachedEvaluation) {
          const cached = JSON.parse(cachedEvaluation);
          if (cached?.evaluation) {
            setEvaluation(cached.evaluation);
            sessionStorage.setItem(
              `sambhav_answer_evaluation_${questionData.id}`,
              JSON.stringify({ question: questionData, pages: images.length, evaluation: cached.evaluation, submittedAt: cached.submittedAt || new Date().toISOString(), reused: true })
            );
            setHistorySaveState("saving");
            try {
              const historyResponse = await fetch("/api/mains/history", {
                method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
                body: JSON.stringify({ questionData, evaluation: cached.evaluation }),
              });
              const historyData = await historyResponse.json().catch(() => ({}));
              setHistorySaveState(historyResponse.ok && historyData.success ? "saved" : historyResponse.status === 401 ? "signin" : "failed");
            } catch { setHistorySaveState("failed"); }
            return;
          }
        }

        const formData = new FormData();

        formData.append(
          "question",
          questionData.question || ""
        );

        formData.append(
          "paper",
          questionData.paper || "GS"
        );

        formData.append(
          "section",
          questionData.section || ""
        );

        formData.append(
          "marks",
          String(marks)
        );

        formData.append(
          "word_limit",
          String(wordLimit)
        );

        images.forEach((file, index) => {
          formData.append(
            `image_${index + 1}`,
            file,
            file.name
          );
        });

        const response = await fetch(
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
            data?.gemini_status ??
            response.status ??
            "unknown";

          const details =
            data?.details ||
            data?.error ||
            "Server ne koi additional error detail return nahi ki.";

          throw new Error(
            `${data?.error || "AI evaluation request failed."}

Gemini Status: ${status}

Details:
${details}`
          );
        }

        if (!data.evaluation) {
          throw new Error(
            "Evaluation result nahi mila."
          );
        }

        // Keep the score stable for this exact answer in this session.
        sessionStorage.setItem(cacheKey, JSON.stringify({ evaluation: data.evaluation, submittedAt: new Date().toISOString() }));
        setEvaluation(
          data.evaluation
        );

        sessionStorage.setItem(
          `sambhav_answer_evaluation_${questionData.id}`,
          JSON.stringify({
            question: questionData,
            pages: images.length,
            evaluation:
              data.evaluation,
            submittedAt:
              new Date().toISOString(),
          })
        );

        // Save to the signed-in user's persistent account history. A history
        // failure must never invalidate a successful AI evaluation.
        setHistorySaveState("saving");
        try {
          const historyResponse = await fetch("/api/mains/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ questionData, evaluation: data.evaluation }),
          });
          const historyData = await historyResponse.json().catch(() => ({}));
          if (historyResponse.ok && historyData.success) {
            setHistorySaveState("saved");
          } else if (historyResponse.status === 401) {
            setHistorySaveState("signin");
          } else {
            console.error("Answer history save failed:", historyData);
            setHistorySaveState("failed");
          }
        } catch (historyError) {
          console.error("Answer history save failed:", historyError);
          setHistorySaveState("failed");
        }
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
        setEvaluationStartedAt(null);
      }
    };

  /* =========================
     SCORE
  ========================= */

  const score =
    evaluation?.overall_score ?? 0;

  const maximum =
    evaluation?.maximum_marks || marks;

  /* =========================
     MANUAL QUESTION SCREEN
  ========================= */

  if (!questionData && manualMode) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <header style={styles.topBar}>
              <button
                type="button"
                onClick={() =>
                  router.push("/pyq")
                }
                style={styles.backButton}
              >
                ←
              </button>

              <div>
                <div style={styles.logo}>
                  SAMBHAV UPSC
                </div>

                <div
                  style={styles.topSubtitle}
                >
                  Manual Question Evaluation
                </div>
              </div>
            </header>

            <section
              style={styles.manualCard}
            >
              <div style={styles.manualTitle}>
                अपना Question डालें
              </div>

              <div
                style={
                  styles.manualSubtitle
                }
              >
                अपना UPSC Mains question
                लिखें और handwritten answer
                upload करके उसी question के
                अनुसार AI evaluation कराएं।
              </div>

              <textarea
                value={manualQuestion}
                onChange={(e) => {
                  setManualQuestion(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="यहाँ अपना UPSC Mains question लिखें..."
                style={
                  styles.manualTextarea
                }
              />

              <div
                style={styles.manualGrid}
              >
                <label
                  style={styles.manualField}
                >
                  <span>Marks</span>

                  <select
                    value={manualMarks}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setManualMarks(value);

                      if (value === "10") {
                        setManualWordLimit(
                          "150"
                        );
                      } else if (
                        value === "15"
                      ) {
                        setManualWordLimit(
                          "250"
                        );
                      }
                    }}
                    style={
                      styles.manualSelect
                    }
                  >
                    <option value="10">
                      10 Marks
                    </option>
                    <option value="15">
                      15 Marks
                    </option>
                    <option value="20">
                      20 Marks
                    </option>
                  </select>
                </label>

                <label
                  style={styles.manualField}
                >
                  <span>Word Limit</span>

                  <select
                    value={manualWordLimit}
                    onChange={(e) =>
                      setManualWordLimit(
                        e.target.value
                      )
                    }
                    style={
                      styles.manualSelect
                    }
                  >
                    <option value="150">
                      150 Words
                    </option>
                    <option value="250">
                      250 Words
                    </option>
                    <option value="300">
                      300 Words
                    </option>
                  </select>
                </label>
              </div>

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
                onClick={
                  startManualQuestion
                }
                style={
                  styles.evaluateButton
                }
              >
                Continue → Upload
                Handwritten Answer
              </button>
            </section>
          </div>
        </main>
      </>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (
    error &&
    !questionData &&
    !manualMode
  ) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div
            style={styles.centerCard}
          >
            <div style={styles.logo}>
              SAMBHAV UPSC
            </div>

            <h2>
              Answer Evaluation
            </h2>

            <p style={styles.muted}>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/pyq")
              }
              style={styles.primary}
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

        <main style={styles.page}>
          <div
            style={styles.container}
          >
            <header
              style={styles.topBar}
            >
              <button
                type="button"
                onClick={() =>
                  router.push("/pyq")
                }
                style={
                  styles.backButton
                }
              >
                ←
              </button>

              <div>
                <div
                  style={styles.logo}
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
              <button
                type="button"
                onClick={() => router.push("/answer/history")}
                style={styles.historyButton}
              >
                My Answers
              </button>
            </header>

            {historySaveState !== "idle" && (
              <div style={styles.historyNotice}>
                {historySaveState === "saving" && "Saving this evaluation to your history…"}
                {historySaveState === "saved" && "✓ Evaluation saved to My Evaluated Answers."}
                {historySaveState === "signin" && "Evaluation complete. Sign in to save it to your account history."}
                {historySaveState === "failed" && "Evaluation complete, but history could not be saved. Check the database setup."}
              </div>
            )}

            <section
              style={styles.scoreCard}
            >
              <div
                style={styles.scoreLabel}
              >
                UPSC-STYLE EVALUATION
              </div>

              <div style={styles.score}>
                {score}
                <span>/{maximum}</span>
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

            <EvaluationSection title="Examiner's Markup · Click a marker">
              <p style={styles.markerIntro}>Tap a numbered marker on the answer page to view marks, examiner feedback and a suggested improvement for that passage.</p>
              {previews.length > 0 ? (
                <div style={styles.markupPages}>
                  {previews.map((src, pageIndex) => {
                    const pageMarkers = (evaluation.answer_markers || []).filter((marker) => Number(marker.page_number) === pageIndex + 1);
                    return (
                      <div key={`markup-page-${pageIndex}`} style={styles.markupPage}>
                        <div style={styles.markupPageLabel}>ANSWER PAGE {pageIndex + 1}</div>
                        <div style={styles.markupImageWrap}>
                          <img src={src} alt={`Handwritten answer page ${pageIndex + 1}`} style={styles.markupImage} />
                          {pageMarkers.map((marker, markerIndex) => (
                            <button key={`marker-${pageIndex}-${markerIndex}`} type="button"
                              aria-label={`Open examiner feedback: ${marker.label || `Marker ${markerIndex + 1}`}`}
                              title={marker.label || "View examiner feedback"}
                              onClick={() => setSelectedAnswerMarker(marker)}
                              style={{ ...styles.answerMarker, left: `${Number(marker.x) / 10}%`, top: `${Number(marker.y) / 10}%` }}
                            >{markerIndex + 1}</button>
                          ))}
                        </div>
                        {pageMarkers.length === 0 && <p style={styles.markerEmpty}>No passage-level marker was returned for this page. See detailed feedback below.</p>}
                      </div>
                    );
                  })}
                </div>
              ) : <p style={styles.markerEmpty}>Answer images are not available in this view. Detailed evaluation feedback is shown below.</p>}
              {(evaluation.answer_markers || []).length === 0 && <p style={styles.markerEmpty}>No reliable passage-level markers were returned. The rest of the evaluation remains available below.</p>}
            </EvaluationSection>

            {selectedAnswerMarker && (
              <div role="dialog" aria-modal="true" aria-labelledby="answer-marker-title" style={styles.markerOverlay} onClick={() => setSelectedAnswerMarker(null)}>
                <section style={styles.markerModal} onClick={(event) => event.stopPropagation()}>
                  <div style={styles.markerModalHeader}>
                    <div><div style={styles.markerEyebrow}>SAMBHAV UPSC · EXAMINER FEEDBACK</div><h2 id="answer-marker-title" style={styles.markerModalTitle}>{selectedAnswerMarker.label || "Answer feedback"}</h2></div>
                    <button type="button" aria-label="Close feedback" onClick={() => setSelectedAnswerMarker(null)} style={styles.markerClose}>×</button>
                  </div>
                  <div style={styles.markerMarksCard}><strong style={{ fontSize: 36, lineHeight: 1.1 }}>+{selectedAnswerMarker.marks_awarded ?? 0}</strong><span>Marks indicated for this point</span></div>
                  <div style={styles.markerDetailBlock}><div style={styles.markerDetailLabel}>YOUR ANSWER</div><p style={styles.markerQuote}>{selectedAnswerMarker.candidate_excerpt || "Exact passage could not be transcribed confidently."}</p></div>
                  <div style={styles.markerDetailBlock}><div style={styles.markerDetailLabel}>EXAMINER'S FEEDBACK</div><p style={styles.markerDetailText}>{selectedAnswerMarker.examiner_feedback || "No specific feedback was returned for this marker."}</p></div>
                  <div style={styles.markerSuggested}><div style={styles.markerSuggestedTitle}>Suggested approach</div><p style={{ margin: 0, lineHeight: 1.65, fontSize: 13 }}>{selectedAnswerMarker.suggested_approach || "Address the question's demand with a precise concept, evidence or relevant example."}</p></div>
                  <div style={styles.markerModalFooter}><span>Page {selectedAnswerMarker.page_number}</span><button type="button" onClick={() => setSelectedAnswerMarker(null)} style={styles.markerDone}>Done</button></div>
                </section>
              </div>
            )}

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
                    label: "Content",
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
                    label: "Analysis",
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
                    label: "Structure",
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
                  .missing_dimensions || []
              ).map(
                (item, index) => (
                  <div
                    key={index}
                    style={
                      styles.dimensionCard
                    }
                  >
                    <strong>
                      {item.dimension}
                    </strong>

                    <p
                      style={
                        styles.dimensionText
                      }
                    >
                      <b>
                        Why important:
                      </b>{" "}
                      {item.why_important}
                    </p>

                    <p
                      style={
                        styles.dimensionText
                      }
                    >
                      <b>
                        How to add:
                      </b>{" "}
                      {item.how_to_add}
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
                  .point_level_feedback || []
              ).map(
                (item, index) => (
                  <div
                    key={index}
                    style={
                      styles.feedbackCard
                    }
                  >
                    <div
                      style={
                        styles.feedbackType
                      }
                    >
                      {item.type}
                    </div>

                    <div
                      style={
                        styles.feedbackIssue
                      }
                    >
                      {item.issue}
                    </div>

                    <div
                      style={
                        styles.feedbackImprove
                      }
                    >
                      <b>Improve:</b>{" "}
                      {item.improvement}
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

            <EvaluationSection title="12. Demand Mapping Audit">
              {(evaluation.demand_mapping || []).length > 0 ? (
                (evaluation.demand_mapping || []).map((item, index) => (
                  <div key={index} style={styles.advancedAuditCard}>
                    <div style={styles.advancedAuditHeader}>
                      <strong>{item.demand || `Demand ${index + 1}`}</strong>
                      <span style={styles.advancedStatus}>{item.status || "Not specified"}</span>
                    </div>
                    <InfoBlock title="Examiner expects" text={item.examiner_expectation} />
                    <InfoBlock title="Evidence in your answer" text={item.answer_evidence} />
                    <InfoBlock title="Justification" text={item.justification} />
                  </div>
                ))
              ) : (
                <InfoBlock text="Demand mapping details are not available in this evaluation response." />
              )}
            </EvaluationSection>

            <EvaluationSection title="13. Advanced Keyword Audit">
              <ArrayBlock
                title="Correctly Used Keywords"
                items={evaluation.keyword_audit?.correctly_used}
              />
              {(evaluation.keyword_audit?.missing_keywords || []).length > 0 && (
                <div style={styles.advancedSubsection}>
                  <div style={styles.arrayTitle}>Missing High-Value Keywords</div>
                  {evaluation.keyword_audit.missing_keywords.map((item, index) => (
                    <div key={index} style={styles.advancedAuditCard}>
                      <div style={styles.advancedAuditHeader}>
                        <strong>{item.keyword}</strong>
                        <span style={styles.advancedStatus}>{item.priority || "Priority not specified"}</span>
                      </div>
                      <InfoBlock title="Why it matters" text={item.why_it_matters} />
                      <InfoBlock title="Exact insertion point" text={item.insertion_point} />
                    </div>
                  ))}
                </div>
              )}
              {(evaluation.keyword_audit?.weak_or_incorrect || []).length > 0 && (
                <div style={styles.advancedSubsection}>
                  <div style={styles.arrayTitle}>Weak or Incorrect Terminology</div>
                  {evaluation.keyword_audit.weak_or_incorrect.map((item, index) => (
                    <div key={index} style={styles.advancedAuditCard}>
                      <strong>{item.term_or_passage}</strong>
                      <InfoBlock title="Issue" text={item.issue} />
                      <InfoBlock title="Suggested correction" text={item.correction} />
                    </div>
                  ))}
                </div>
              )}
            </EvaluationSection>

            <EvaluationSection title="14. Diagram & Visual Audit">
              <InfoBlock
                title="Overall assessment"
                text={evaluation.visual_analysis?.overall_assessment}
              />
              <ArrayBlock
                title="Visuals Already Present"
                items={evaluation.visual_analysis?.existing_visuals}
              />
              {evaluation.visual_analysis?.no_additional_diagram_needed && (
                <div style={styles.advancedNotice}>
                  No additional diagram is necessary for this question.
                </div>
              )}
              {(evaluation.visual_analysis?.opportunities || []).map((item, index) => (
                <div key={index} style={styles.advancedAuditCard}>
                  <div style={styles.advancedAuditHeader}>
                    <strong>Visual opportunity {index + 1}: {item.recommended_type}</strong>
                    <span style={styles.advancedStatus}>{item.priority || "Optional"}</span>
                  </div>
                  <InfoBlock title="Where to place it" text={item.location_in_answer} />
                  <InfoBlock title="Purpose" text={item.purpose} />
                  <ArrayBlock title="Required labels" items={item.required_labels} />
                  <InfoBlock title="Examiner relevance" text={item.examiner_relevance} />
                  <InfoBlock title="Estimated space" text={item.estimated_space} />
                  {item.text_diagram && (
                    <div style={styles.advancedSubsection}>
                      <div style={styles.arrayTitle}>Reproducible text diagram</div>
                      <pre style={styles.textDiagram}>{item.text_diagram}</pre>
                    </div>
                  )}
                </div>
              ))}
            </EvaluationSection>

            <EvaluationSection title="15. Evidence & Examples Audit">
              <ArrayBlock
                title="Verification Notes"
                items={evaluation.evidence_audit?.verification_notes}
              />
              {(evaluation.evidence_audit?.missing_evidence || []).length > 0 ? (
                evaluation.evidence_audit.missing_evidence.map((item, index) => (
                  <div key={index} style={styles.advancedAuditCard}>
                    <div style={styles.advancedAuditHeader}>
                      <strong>{item.evidence_type || "Evidence opportunity"}</strong>
                      <span style={styles.advancedStatus}>{item.priority || "Optional"}</span>
                    </div>
                    <InfoBlock title="Argument to support" text={item.argument_to_support} />
                    <InfoBlock title="Suggested example / evidence" text={item.suggested_example} />
                    <InfoBlock title="Insertion point" text={item.insertion_point} />
                    <InfoBlock title="Verification status" text={item.verification_status} />
                  </div>
                ))
              ) : (
                <InfoBlock text="No additional evidence opportunities were returned." />
              )}
            </EvaluationSection>

            <EvaluationSection title="16. Criterion-wise Marks Breakdown">
              {(evaluation.marks_breakdown || []).length > 0 ? (
                evaluation.marks_breakdown.map((item, index) => (
                  <div key={index} style={styles.advancedAuditCard}>
                    <div style={styles.advancedAuditHeader}>
                      <strong>{item.criterion}</strong>
                      <span style={styles.advancedMark}>{item.awarded ?? 0} / {item.maximum ?? 0}</span>
                    </div>
                    <InfoBlock title="Rationale" text={item.rationale} />
                  </div>
                ))
              ) : (
                <InfoBlock text="Criterion-wise marks breakdown is not available in this response." />
              )}
              <div style={styles.advancedNotice}>
                AI-estimated marks are indicative, not an official UPSC score.
              </div>
            </EvaluationSection>

            <EvaluationSection title="17. Sentence-level Improvements">
              {(evaluation.sentence_improvements || []).length > 0 ? (
                evaluation.sentence_improvements.map((item, index) => (
                  <div key={index} style={styles.advancedAuditCard}>
                    <InfoBlock title="Original wording" text={item.original} />
                    <InfoBlock title="Problem" text={item.problem} />
                    <InfoBlock title="Improved version" text={item.improved} />
                    <InfoBlock title="Why this is better" text={item.reason} />
                  </div>
                ))
              ) : (
                <InfoBlock text="No sentence-level corrections were returned. The model may have found no specific passage to revise or the field may be unavailable." />
              )}
            </EvaluationSection>

            <EvaluationSection title="18. Improved Model Answer">
              <div style={styles.advancedNotice}>
                This is an AI-generated practice answer, not an official UPSC model answer.
              </div>
              <InfoBlock title="Answer quality level" text={evaluation.quality_level} />
              <InfoBlock title="Word-limit assessment" text={evaluation.word_count_assessment} />
              <div style={styles.modelAnswerText}>
                {evaluation.model_answer || "A model answer was not returned in this evaluation."}
              </div>
            </EvaluationSection>

            <section
              style={styles.examinerCard}
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
                router.push("/pyq")
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
      <main style={styles.page}>
        <div
          style={styles.centerCard}
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

      <main style={styles.page}>
        <div style={styles.container}>
          <header
            style={styles.topBar}
          >
            <button
              type="button"
              onClick={() =>
                router.push("/pyq")
              }
              style={
                styles.backButton
              }
            >
              ←
            </button>

            <div>
              <div style={styles.logo}>
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

          <button
            type="button"
            onClick={() => router.push("/answer/history")}
            style={{ ...styles.historyButton, marginBottom: "14px" }}
          >
            My Evaluated Answers
          </button>

          {/* QUESTION */}

          <section
            style={styles.questionCard}
          >
            <div
              style={styles.questionMeta}
            >
              {questionData.year ||
                "UPSC"}{" "}
              ·{" "}
              {questionData.paper} ·{" "}
              {marks} Marks
            </div>

            <div
              style={
                styles.questionText
              }
            >
              {questionData.question}
            </div>

            <div
              style={styles.limitRow}
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

          {/* TIMER */}

          <section
            style={{
              ...styles.timerCard,
              ...(timeExpired
                ? styles.timerExpired
                : {}),
            }}
          >
            <div>
              <div
                style={styles.timerLabel}
              >
                ANSWER WRITING TIMER
              </div>

              <div
                style={styles.timerHint}
              >
                {timeExpired
                  ? "Time over — answer submit kar sakte hain."
                  : "Timer answer writing ke liye active hai."}
              </div>
            </div>

            <div
              style={styles.timerValue}
            >
              {formattedTime}
            </div>
          </section>

          {/* UPLOAD */}

          <section
            style={styles.uploadCard}
          >
            <div
              style={styles.uploadHeader}
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
                  Maximum 4 pages · JPG,
                  PNG, WEBP
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
              onDrop={handleDrop}
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
                style={styles.dropTitle}
              >
                Tap to upload pages
              </div>

              <div
                style={
                  styles.dropSubtitle
                }
              >
                Ya 3–4 photos ek saath
                select karein
              </div>

              <div
                style={
                  styles.uploadHint
                }
              >
                Page order upload ke order
                mein rahega
              </div>
            </label>

            {images.length > 0 && (
              <div
                style={
                  styles.previewGrid
                }
              >
                {images.map(
                  (file, index) => (
                    <div
                      key={`${file.name}-${index}`}
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
                            previews[index]
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
                          {index + 1}
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
                            index === 0
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              index - 1
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
                            images.length - 1
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              index + 1
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

          {error && (
            <div
              style={styles.errorBox}
            >
              {error}
            </div>
          )}

          {evaluating && (
            <div role="dialog" aria-modal="true" aria-labelledby="evaluation-processing-title" style={styles.processingOverlay}>
              <section style={styles.processingModal}>
                <div style={styles.processingHeader}>
                  <div style={styles.processingEyebrow}>SAMBHAV UPSC · MAINS EXAMINER</div>
                  <h2 id="evaluation-processing-title" style={styles.processingTitle}>Evaluating your answer</h2>
                  <p style={styles.processingSubtitle}>Your submitted pages are being reviewed together as one answer.</p>
                </div>
                <div style={styles.processingBody}>
                  <div style={styles.processingSpinner} aria-hidden="true" />
                  <div style={styles.processingTime}><span style={styles.processingClock}>◷</span> {evaluationElapsedLabel}</div>
                  <div style={styles.processingProgressTrack}><div style={styles.processingProgressIndeterminate} /></div>
                  <div style={styles.processingStage}>{evaluationStage}</div>
                  <div style={styles.processingSteps}>
                    <span style={evaluationElapsed >= 8 ? styles.processingStepDone : styles.processingStepActive}>01&nbsp; Read</span>
                    <span style={evaluationElapsed >= 22 ? styles.processingStepDone : evaluationElapsed >= 8 ? styles.processingStepActive : styles.processingStep}>02&nbsp; Analyse</span>
                    <span style={evaluationElapsed >= 40 ? styles.processingStepDone : evaluationElapsed >= 22 ? styles.processingStepActive : styles.processingStep}>03&nbsp; Score</span>
                  </div>
                  <p style={styles.processingFootnote}>Processing time depends on handwriting clarity and the number of pages. Please keep this screen open.</p>
                </div>
              </section>
              <style>{`@keyframes sambhavSpin { to { transform: rotate(360deg); } } @keyframes sambhavProgress { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }`}</style>
            </div>
          )}

          <button
            type="button"
            disabled={
              evaluating ||
              images.length === 0
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
            AI uploaded pages ko read karke
            question demand, content,
            analysis, structure, examples,
            factual accuracy aur missing
            dimensions ke basis par evaluation
            karega.
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
    <div style={styles.infoBlock}>
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
    <div style={styles.arrayBlock}>
      {title && (
        <div
          style={styles.arrayTitle}
        >
          {title}
        </div>
      )}

      <ul
        style={styles.arrayList}
      >
        {items.map(
          (item, index) => (
            <li key={index}>
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
      style={styles.improvement}
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
    <div style={styles.scoreLine}>
      <span>Score</span>

      <strong>
        {score ?? 0}/
        {maximum ?? 0}
      </strong>
    </div>
  );
}

function ScoreGrid({ items }) {
  return (
    <div style={styles.scoreGrid}>
      {items.map((item) => (
        <div
          key={item.label}
          style={styles.miniScore}
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
            {item.score ?? 0}/
            {item.max ?? 0}
          </strong>
        </div>
      ))}
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
    padding: "18px 16px 45px",
  },

  centerCard: {
    maxWidth: "500px",
    margin: "80px auto",
    padding: "30px",
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "24px",
    textAlign: "center",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },

  historyButton: {
    marginLeft: "auto",
    border: "1px solid #deded9",
    borderRadius: "10px",
    background: "#fff",
    color: "#222",
    padding: "10px 12px",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
    flexShrink: 0,
  },

  historyNotice: {
    border: "1px solid #e4e4df",
    borderRadius: "11px",
    padding: "10px 12px",
    marginBottom: "12px",
    background: "#f7f7f4",
    color: "#454540",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  backButton: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },

  logo: {
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "-0.4px",
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
    textTransform: "uppercase",
  },

  questionText: {
    fontSize: "17px",
    lineHeight: "1.55",
    fontWeight: "750",
    marginTop: "11px",
  },

  limitRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #292929",
    color: "#aaa",
    fontSize: "10px",
  },

  timerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "18px",
    padding: "13px 15px",
    marginBottom: "12px",
  },

  timerExpired: {
    borderColor: "#999",
  },

  timerLabel: {
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  timerHint: {
    marginTop: "4px",
    fontSize: "9px",
    color: "#777",
    lineHeight: "1.4",
  },

  timerValue: {
    minWidth: "76px",
    textAlign: "center",
    background: "#111",
    color: "#fff",
    borderRadius: "11px",
    padding: "10px 8px",
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  manualCard: {
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "22px",
    padding: "18px",
  },

  manualTitle: {
    fontSize: "18px",
    fontWeight: "900",
  },

  manualSubtitle: {
    marginTop: "6px",
    color: "#777",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  manualTextarea: {
    width: "100%",
    minHeight: "150px",
    marginTop: "15px",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: "14px",
    padding: "13px",
    fontSize: "13px",
    lineHeight: "1.6",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },

  manualGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
    marginTop: "10px",
  },

  manualField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "10px",
    fontWeight: "800",
    color: "#666",
  },

  manualSelect: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px",
    background: "#fff",
    color: "#111",
    fontSize: "12px",
  },

  uploadCard: {
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "21px",
    padding: "16px",
  },

  uploadHeader: {
    display: "flex",
    justifyContent: "space-between",
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
    padding: "8px 10px",
    fontSize: "10px",
    fontWeight: "800",
  },

  dropZone: {
    display: "block",
    border: "2px dashed #d4d4d0",
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
    margin: "0 auto 10px",
    borderRadius: "14px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    border: "1px solid #e2e2df",
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
    padding: "5px 7px",
    fontSize: "8px",
    fontWeight: "800",
  },

  previewActions: {
    display: "flex",
    gap: "5px",
    padding: "7px",
  },

  smallButton: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: "8px",
    padding: "6px 8px",
    cursor: "pointer",
    fontWeight: "800",
  },

  removeButton: {
    marginLeft: "auto",
    border: 0,
    background: "#111",
    color: "#fff",
    borderRadius: "8px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: "700",
  },

  errorBox: {
    background: "#fff",
    color: "#555",
    border: "1px solid #ccc",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "10px",
    fontSize: "11px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
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
    margin: "11px auto 0",
    maxWidth: "520px",
  },

  markerIntro: { margin: "0 0 14px", color: "#64748b", lineHeight: 1.6, fontSize: 13 },
  markupPages: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 14 },
  markupPage: { minWidth: 0, border: "1px solid #dbe3ef", borderRadius: 16, overflow: "hidden", background: "#f8fafc" },
  markupPageLabel: { padding: "10px 12px", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: "#334155", background: "#eef2ff", borderBottom: "1px solid #dbe3ef" },
  markupImageWrap: { position: "relative", width: "100%", lineHeight: 0, background: "#e2e8f0" },
  markupImage: { display: "block", width: "100%", height: "auto", objectFit: "contain" },
  answerMarker: { position: "absolute", transform: "translate(-50%, -50%)", width: 34, height: 34, border: "2px solid #fff", borderRadius: 999, background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 14px rgba(37,99,235,.4)", cursor: "pointer", display: "grid", placeItems: "center", lineHeight: 1 },
  markerEmpty: { margin: "12px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.6 },
  markerOverlay: { position: "fixed", inset: 0, zIndex: 10000, background: "rgba(15,23,42,.62)", backdropFilter: "blur(5px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 },
  markerModal: { width: "min(100%, 680px)", maxHeight: "88dvh", overflowY: "auto", background: "#fff", color: "#0f172a", borderRadius: "24px 24px 0 0", boxShadow: "0 -16px 50px rgba(15,23,42,.24)", padding: "22px 20px calc(20px + env(safe-area-inset-bottom))" },
  markerModalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 },
  markerEyebrow: { color: "#64748b", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", marginBottom: 6 },
  markerModalTitle: { margin: 0, fontSize: 21, lineHeight: 1.25, fontWeight: 800 },
  markerClose: { flex: "0 0 auto", width: 34, height: 34, border: 0, borderRadius: 999, background: "#f1f5f9", color: "#475569", fontSize: 26, cursor: "pointer" },
  markerMarksCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, margin: "16px 0", padding: "18px 12px", borderRadius: 14, background: "#eafaf2", color: "#087f5b" },
  markerDetailBlock: { marginTop: 16 },
  markerDetailLabel: { color: "#64748b", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", marginBottom: 8 },
  markerQuote: { margin: 0, borderLeft: "3px solid #3b82f6", background: "#f8fafc", padding: 14, borderRadius: "0 10px 10px 0", fontStyle: "italic", lineHeight: 1.65 },
  markerDetailText: { margin: 0, lineHeight: 1.7, fontSize: 14, color: "#334155" },
  markerSuggested: { marginTop: 16, padding: 15, borderRadius: 12, borderLeft: "4px solid #10b981", background: "#ecfdf5", color: "#166534" },
  markerSuggestedTitle: { fontWeight: 800, marginBottom: 6 },
  markerModalFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18, color: "#64748b", fontSize: 12 },
  markerDone: { border: 0, borderRadius: 10, padding: "11px 20px", color: "#fff", background: "#1d4ed8", fontWeight: 800, cursor: "pointer" },

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
    letterSpacing: "1.5px",
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
    border: "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "17px",
    marginBottom: "10px",
  },

  evaluationTitle: {
    fontSize: "15px",
    fontWeight: "900",
    margin: "0 0 13px",
  },

  directiveBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    background: "#111",
    color: "#fff",
    borderRadius: "13px",
    padding: "12px 13px",
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
    textTransform: "uppercase",
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
    margin: "0 0 0 18px",
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
    margin: "5px 0 0",
  },

  scoreLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f0f0ee",
    borderRadius: "12px",
    padding: "11px 13px",
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
    border: "1px solid #e2e2df",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "8px",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  dimensionText: {
    margin: "7px 0 0",
  },

  feedbackCard: {
    border: "1px solid #e2e2df",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "8px",
  },

  feedbackType: {
    display: "inline-block",
    background: "#111",
    color: "#fff",
    borderRadius: "7px",
    padding: "4px 7px",
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
    letterSpacing: "1.2px",
    fontWeight: "800",
  },

  examinerText: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "#ddd",
    margin: "10px 0 0",
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
    padding: "11px 15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  advancedAuditCard: {
    border: "1px solid #e4e4e0",
    borderRadius: "13px",
    padding: "12px",
    marginTop: "9px",
    background: "#fff",
  },

  advancedAuditHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    lineHeight: "1.45",
  },

  advancedStatus: {
    display: "inline-block",
    borderRadius: "7px",
    background: "#f0f0ee",
    color: "#444",
    padding: "4px 7px",
    fontSize: "9px",
    fontWeight: "800",
  },

  advancedMark: {
    display: "inline-block",
    borderRadius: "7px",
    background: "#111",
    color: "#fff",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  advancedSubsection: {
    marginTop: "13px",
  },

  advancedNotice: {
    marginTop: "10px",
    padding: "11px 12px",
    borderRadius: "11px",
    background: "#f4f3ef",
    color: "#555",
    fontSize: "11px",
    lineHeight: "1.55",
  },

  textDiagram: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    margin: "7px 0 0",
    padding: "12px",
    borderRadius: "10px",
    background: "#f7f7f5",
    border: "1px solid #e2e2df",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "11px",
    lineHeight: "1.55",
    overflowX: "auto",
  },

  modelAnswerText: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    marginTop: "10px",
    padding: "14px",
    borderRadius: "13px",
    background: "#f7f7f5",
    fontSize: "12px",
    lineHeight: "1.75",
  },

  processingOverlay: {
    position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10, 16, 30, 0.68)",
    backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "18px",
  },
  processingModal: {
    width: "100%", maxWidth: "440px", overflow: "hidden", borderRadius: "24px",
    background: "#fff", boxShadow: "0 28px 90px rgba(0,0,0,.32)", color: "#142033",
  },
  processingHeader: {
    padding: "23px 24px 21px", color: "#fff",
    background: "linear-gradient(120deg, #225ce5 0%, #5144d8 100%)",
  },
  processingEyebrow: { fontSize: "9px", letterSpacing: "1.6px", fontWeight: 800, opacity: .8 },
  processingTitle: { margin: "9px 0 6px", fontSize: "23px", lineHeight: 1.2, fontWeight: 850 },
  processingSubtitle: { margin: 0, fontSize: "12px", lineHeight: 1.55, opacity: .88 },
  processingBody: { padding: "27px 24px 23px", textAlign: "center" },
  processingSpinner: { width: "50px", height: "50px", margin: "0 auto 16px", borderRadius: "50%", border: "6px solid #e3eaff", borderTopColor: "#2861e8", animation: "sambhavSpin .85s linear infinite" },
  processingTime: { fontSize: "23px", fontWeight: 750, fontVariantNumeric: "tabular-nums", color: "#1d293d" },
  processingClock: { color: "#5274bf", fontSize: "24px", verticalAlign: "-1px" },
  processingProgressTrack: { height: "8px", borderRadius: "999px", background: "#e9edf5", margin: "23px 0 13px", overflow: "hidden" },
  processingProgressIndeterminate: { width: "38%", height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2861e8,#6549e8)", animation: "sambhavProgress 1.45s ease-in-out infinite" },
  processingStage: { fontSize: "13px", fontWeight: 750, color: "#34445f", minHeight: "20px" },
  processingSteps: { display: "flex", justifyContent: "space-between", gap: "6px", marginTop: "24px" },
  processingStep: { flex: 1, padding: "8px 4px", borderRadius: "9px", background: "#f2f4f8", color: "#8490a2", fontSize: "10px", fontWeight: 750 },
  processingStepActive: { flex: 1, padding: "8px 4px", borderRadius: "9px", background: "#eaf0ff", color: "#2857c5", fontSize: "10px", fontWeight: 850 },
  processingStepDone: { flex: 1, padding: "8px 4px", borderRadius: "9px", background: "#e6f8ef", color: "#148454", fontSize: "10px", fontWeight: 850 },
  processingFootnote: { margin: "20px 0 0", color: "#8993a2", fontSize: "10px", lineHeight: 1.5 },

  muted: {
    color: "#777",
    fontSize: "12px",
    lineHeight: "1.5",
  },
};
