
"use client";

import { useCallback, useEffect, useState } from "react";

const API = "/api/admin/ai-evaluation-benchmark";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d8d8d8",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  color: "#171717",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 750,
  marginBottom: 6,
};

const buttonStyle = {
  border: "1px solid #d4d4d4",
  borderRadius: 10,
  padding: "10px 13px",
  fontWeight: 750,
  cursor: "pointer",
  background: "#fff",
  color: "#171717",
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }

  return data;
}

function parseFeedback(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminAIEvaluationBenchmarkPage() {
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("GS");
  const [questionType, setQuestionType] = useState("Mains");
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [maximumMarks, setMaximumMarks] = useState("10");
  const [humanScore, setHumanScore] = useState("");
  const [aiScore, setAiScore] = useState("");
  const [humanFeedback, setHumanFeedback] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [rubricVersion, setRubricVersion] = useState("manual-v1");
  const [aiModelVersion, setAiModelVersion] = useState(
    "recorded-existing-evaluation"
  );
  const [consent, setConsent] = useState(false);

  const [candidateFiles, setCandidateFiles] = useState([]);
  const [instituteFiles, setInstituteFiles] = useState([]);
  const [candidateImages, setCandidateImages] = useState([]);
  const [instituteImages, setInstituteImages] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(API, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await readResponse(response);
      setRecords(Array.isArray(data.records) ? data.records : []);

      if (data.warning) {
        setMessage(data.warning);
      }

      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch((error) => {
      setMessage(error.message || "Could not load benchmark records.");
    });
  }, [load]);

  function resetForm() {
    setSelectedId("");
    setQuestion("");
    setSubject("GS");
    setQuestionType("Mains");
    setCandidateAnswer("");
    setMaximumMarks("10");
    setHumanScore("");
    setAiScore("");
    setHumanFeedback("");
    setAiFeedback("");
    setRubricVersion("manual-v1");
    setAiModelVersion("recorded-existing-evaluation");
    setConsent(false);
    setCandidateFiles([]);
    setInstituteFiles([]);
    setCandidateImages([]);
    setInstituteImages([]);
    setMessage("");
  }

  function editRecord(record) {
    setSelectedId(record.id);
    setQuestion(record.question || "");
    setSubject(record.subject || "");
    setQuestionType(record.question_type || "");
    setCandidateAnswer(record.candidate_answer || "");
    setMaximumMarks(String(record.maximum_marks ?? "10"));
    setHumanScore(String(record.human_score ?? ""));
    setAiScore(String(record.ai_score ?? ""));
    setHumanFeedback(parseFeedback(record.human_feedback));
    setAiFeedback(parseFeedback(record.ai_feedback));
    setRubricVersion(record.rubric_version || "manual-v1");
    setAiModelVersion(
      record.ai_model_version || "recorded-existing-evaluation"
    );
    setConsent(record.consent_public === true);

    setCandidateImages(
      Array.isArray(record.candidate_copy_images)
        ? record.candidate_copy_images
        : []
    );

    setInstituteImages(
      Array.isArray(record.institute_copy_images)
        ? record.institute_copy_images
        : []
    );

    setCandidateFiles([]);
    setInstituteFiles([]);

    setMessage(
      "Record loaded. Saving edits resets verification and publication."
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadFiles(files, side) {
    const uploaded = [];

    for (const file of Array.from(files || [])) {
      if (!file.type.startsWith("image/")) {
        throw new Error(`${file.name}: choose an image file.`);
      }

      if (file.size <= 0 || file.size > 50 * 1024 * 1024) {
        throw new Error(`${file.name}: maximum image size is 50 MB.`);
      }

      const signResponse = await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          side,
          fileName: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      const sign = await readResponse(signResponse);

      if (!sign.uploadUrl || !sign.path || !sign.anonKey) {
        throw new Error(
          "Upload signing response is incomplete. Check the benchmark API."
        );
      }

      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          apikey: sign.anonKey,
          Authorization: `Bearer ${sign.anonKey}`,
          "x-upsert": "false",
        },
        body: file,
      });

      if (!put.ok) {
        const detail = await put.text().catch(() => "");

        throw new Error(
          `Upload failed for ${file.name} (${put.status}). ${
            detail.slice(0, 180) || "Check Storage bucket settings."
          }`
        );
      }

      // Store the object path. Do not store public URLs for a private bucket.
      uploaded.push(sign.path);
    }

    return uploaded;
  }

  async function saveRecord(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      if (!question.trim()) {
        throw new Error("Question is required.");
      }

      if (!candidateAnswer.trim()) {
        throw new Error("Candidate answer transcription is required.");
      }

      if (!candidateImages.length && !candidateFiles.length) {
        throw new Error("Upload at least one student original copy image.");
      }

      if (!instituteImages.length && !instituteFiles.length) {
        throw new Error("Upload at least one institute-checked copy image.");
      }

      const max = Number(maximumMarks);
      const human = Number(humanScore);
      const ai = Number(aiScore);

      if (
        !Number.isFinite(max) ||
        max <= 0 ||
        !Number.isFinite(human) ||
        human < 0 ||
        human > max ||
        !Number.isFinite(ai) ||
        ai < 0 ||
        ai > max
      ) {
        throw new Error(
          "Enter valid marks. Both scores must be between zero and maximum marks."
        );
      }

      let nextCandidateImages = [...candidateImages];
      let nextInstituteImages = [...instituteImages];

      if (candidateFiles.length) {
        const uploaded = await uploadFiles(candidateFiles, "candidate");
        nextCandidateImages = [...nextCandidateImages, ...uploaded];
      }

      if (instituteFiles.length) {
        const uploaded = await uploadFiles(instituteFiles, "institute");
        nextInstituteImages = [...nextInstituteImages, ...uploaded];
      }

      let humanFeedbackValue = {};
      let aiFeedbackValue = {};

      try {
        humanFeedbackValue = humanFeedback.trim()
          ? JSON.parse(humanFeedback)
          : {};
      } catch {
        humanFeedbackValue = { summary: humanFeedback };
      }

      try {
        aiFeedbackValue = aiFeedback.trim()
          ? JSON.parse(aiFeedback)
          : {};
      } catch {
        aiFeedbackValue = { summary: aiFeedback };
      }

      const response = await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          id: selectedId || undefined,
          question: question.trim(),
          subject,
          question_type: questionType,
          candidate_answer: candidateAnswer,
          maximum_marks: max,
          human_score: human,
          ai_score: ai,
          human_feedback: humanFeedbackValue,
          ai_feedback: aiFeedbackValue,
          rubric_version: rubricVersion,
          ai_model_version: aiModelVersion,
          consent_public: consent,
          candidate_copy_images: nextCandidateImages,
          institute_copy_images: nextInstituteImages,
        }),
      });

      const data = await readResponse(response);

      setMessage(data.message || "Record saved.");

      // API returns signed URLs for preview; retain these in the form.
      setCandidateImages(
        data.record?.candidate_copy_images || nextCandidateImages
      );

      setInstituteImages(
        data.record?.institute_copy_images || nextInstituteImages
      );

      setCandidateFiles([]);
      setInstituteFiles([]);

      await load();

      if (!selectedId && data.record?.id) {
        setSelectedId(data.record.id);
      }
    } catch (error) {
      setMessage(error.message || "Could not save record.");
    } finally {
      setBusy(false);
    }
  }

  async function action(id, actionName, extra = {}) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionName,
          id,
          ...extra,
        }),
      });

      const data = await readResponse(response);

      setMessage(data.message || "Updated.");
      await load();
    } catch (error) {
      setMessage(error.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const field = (label, value, setValue, props = {}) => (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      <input
        style={inputStyle}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...props}
      />
    </label>
  );

  function imageSection({
    title,
    images,
    setImages,
    files,
    setFiles,
  }) {
    return (
      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 12,
          minWidth: 0,
        }}
      >
        <label style={labelStyle}>{title} *</label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) =>
            setFiles(Array.from(event.target.files || []))
          }
        />

        <div style={{ fontSize: 12, color: "#666", marginTop: 7 }}>
          Existing images: {images.length}. New files: {files.length}.
        </div>

        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            style={{
              marginTop: 12,
              padding: 8,
              border: "1px solid #eee",
              borderRadius: 8,
              display: "grid",
              gap: 8,
              minWidth: 0,
            }}
          >
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                color: "#755b1d",
                overflowWrap: "anywhere",
              }}
            >
              Open image {index + 1}
            </a>

            <img
              src={src}
              alt={`${title} ${index + 1}`}
              loading="lazy"
              style={{
                display: "block",
                width: "100%",
                maxHeight: 320,
                objectFit: "contain",
                background: "#f7f7f7",
                borderRadius: 8,
              }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <button
              type="button"
              style={{ ...buttonStyle, padding: "6px 8px" }}
              onClick={() =>
                setImages((old) => old.filter((_, i) => i !== index))
              }
            >
              Remove image
            </button>
          </div>
        ))}
      </section>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f6f3",
        color: "#171717",
        padding: "22px 14px 60px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: 850,
              color: "#8a6b25",
            }}
          >
            SAMBHAV UPSC · ADMIN
          </div>

          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 36px)",
              margin: "8px 0",
            }}
          >
            AI Evaluation Benchmark
          </h1>

          <p style={{ margin: 0, color: "#626262", lineHeight: 1.6 }}>
            Add selected copies only. Save → Verify → Publish. Publishing
            requires explicit public consent.
          </p>
        </header>

        {message && (
          <div
            role="status"
            style={{
              padding: 12,
              marginBottom: 16,
              border: "1px solid #ded6be",
              borderRadius: 10,
              background: "#fffdf5",
              overflowWrap: "anywhere",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={saveRecord}
          style={{
            background: "#fff",
            border: "1px solid #e3e3df",
            borderRadius: 16,
            padding: 16,
            display: "grid",
            gap: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>
              {selectedId ? "Edit benchmark record" : "Add benchmark record"}
            </h2>

            <button
              type="button"
              style={buttonStyle}
              onClick={resetForm}
              disabled={busy}
            >
              New record / Clear
            </button>
          </div>

          <label>
            <span style={labelStyle}>Question *</span>
            <textarea
              required
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {field("Subject", subject, setSubject)}
            {field("Question type", questionType, setQuestionType)}
            {field("Maximum marks *", maximumMarks, setMaximumMarks, {
              type: "number",
              min: "0.1",
              step: "any",
              required: true,
            })}
            {field("Human / institute marks *", humanScore, setHumanScore, {
              type: "number",
              min: "0",
              step: "any",
              required: true,
            })}
            {field("Existing AI marks *", aiScore, setAiScore, {
              type: "number",
              min: "0",
              step: "any",
              required: true,
            })}
            {field("Rubric version", rubricVersion, setRubricVersion)}
            {field("AI model version (as recorded)", aiModelVersion, setAiModelVersion)}
          </div>

          <label>
            <span style={labelStyle}>
              Candidate answer transcription *
            </span>
            <textarea
              required
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
              value={candidateAnswer}
              onChange={(event) => setCandidateAnswer(event.target.value)}
              placeholder="Enter the student's answer transcription. Do not invent data."
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            <label>
              <span style={labelStyle}>
                Human / institute feedback (JSON or plain text)
              </span>
              <textarea
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
                value={humanFeedback}
                onChange={(event) => setHumanFeedback(event.target.value)}
                placeholder='{"summary":"...","strengths":[],"improvements":[]}'
              />
            </label>

            <label>
              <span style={labelStyle}>
                Existing AI feedback (JSON or plain text)
              </span>
              <textarea
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
                value={aiFeedback}
                onChange={(event) => setAiFeedback(event.target.value)}
                placeholder='{"summary":"...","strengths":[],"improvements":[]}'
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {imageSection({
              title: "Student original handwritten copy images",
              images: candidateImages,
              setImages: setCandidateImages,
              files: candidateFiles,
              setFiles: setCandidateFiles,
            })}

            {imageSection({
              title: "Coaching / human-checked copy images",
              images: instituteImages,
              setImages: setInstituteImages,
              files: instituteFiles,
              setFiles: setInstituteFiles,
            })}
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              lineHeight: 1.5,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              style={{ marginTop: 3 }}
            />

            I have confirmed documented permission to publish these
            answer-copy images and associated evaluation data publicly.
          </label>

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button
              disabled={busy}
              type="submit"
              style={{
                ...buttonStyle,
                background: "#171717",
                color: "#fff",
                borderColor: "#171717",
                opacity: busy ? 0.65 : 1,
              }}
            >
              {busy ? "Working…" : "Save as pending verification"}
            </button>

            {selectedId && (
              <button
                disabled={busy}
                type="button"
                style={buttonStyle}
                onClick={() => action(selectedId, "verify")}
              >
                Verify record
              </button>
            )}

            {selectedId && (
              <button
                disabled={busy || !consent}
                type="button"
                style={buttonStyle}
                onClick={() =>
                  action(selectedId, "publish", {
                    consent_public: consent,
                  })
                }
              >
                Publish publicly
              </button>
            )}

            {selectedId && (
              <button
                disabled={busy}
                type="button"
                style={buttonStyle}
                onClick={() => action(selectedId, "unpublish")}
              >
                Unpublish
              </button>
            )}

            <button
              disabled={busy}
              type="button"
              style={buttonStyle}
              onClick={() =>
                load().catch((error) => setMessage(error.message))
              }
            >
              Refresh records
            </button>
          </div>

          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Editing and saving resets verification and publication. The AI
            marks and feedback must be copied from the existing evaluator
            result; this page does not call or modify the evaluator.
          </p>
        </form>

        <section style={{ marginTop: 26 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ fontSize: 21 }}>
              Existing records ({records.length})
            </h2>

            {loading && (
              <span style={{ color: "#666", fontSize: 13 }}>
                Loading records…
              </span>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {records.map((record) => (
              <article
                key={record.id}
                style={{
                  border: "1px solid #e2e2de",
                  background: "#fff",
                  borderRadius: 13,
                  padding: 13,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {record.question || "Untitled question"}
                    </div>

                    <div
                      style={{
                        color: "#666",
                        fontSize: 12,
                        marginTop: 5,
                        lineHeight: 1.7,
                      }}
                    >
                      Human: {record.human_score}/{record.maximum_marks}
                      {" · "}
                      AI: {record.ai_score}/{record.maximum_marks}
                      {" · "}
                      Verification: {record.verification_status || "pending"}
                      {" · "}
                      {record.is_public ? "PUBLIC" : "Not public"}
                    </div>
                  </div>

                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => editRecord(record)}
                  >
                    Edit
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  {(record.candidate_copy_images || []).map((src, index) => (
                    <a
                      key={`candidate-${index}`}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        color: "#755b1d",
                        fontSize: 12,
                        overflowWrap: "anywhere",
                      }}
                    >
                      Student copy {index + 1}
                      <img
                        src={src}
                        alt={`Student copy ${index + 1}`}
                        loading="lazy"
                        style={{
                          display: "block",
                          width: "100%",
                          maxHeight: 260,
                          objectFit: "contain",
                          background: "#f7f7f7",
                          borderRadius: 8,
                          marginTop: 6,
                        }}
                      />
                    </a>
                  ))}

                  {(record.institute_copy_images || []).map((src, index) => (
                    <a
                      key={`institute-${index}`}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        color: "#755b1d",
                        fontSize: 12,
                        overflowWrap: "anywhere",
                      }}
                    >
                      Checked copy {index + 1}
                      <img
                        src={src}
                        alt={`Checked copy ${index + 1}`}
                        loading="lazy"
                        style={{
                          display: "block",
                          width: "100%",
                          maxHeight: 260,
                          objectFit: "contain",
                          background: "#f7f7f7",
                          borderRadius: 8,
                          marginTop: 6,
                        }}
                      />
                    </a>
                  ))}
                </div>
              </article>
            ))}

            {!loading && records.length === 0 && (
              <div
                style={{
                  border: "1px dashed #ccc",
                  borderRadius: 12,
                  padding: 18,
                  color: "#666",
                  background: "#fff",
                }}
              >
                No benchmark records yet. Add a record using the form above.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
