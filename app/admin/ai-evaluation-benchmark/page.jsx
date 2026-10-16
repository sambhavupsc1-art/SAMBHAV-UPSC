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
const labelStyle = { display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 };
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
  if (!response.ok || data.success === false) throw new Error(data.error || "Request failed.");
  return data;
}

export default function AdminAIEvaluationBenchmarkPage() {
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
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
  const [aiModelVersion, setAiModelVersion] = useState("recorded-existing-evaluation");
  const [consent, setConsent] = useState(false);
  const [candidateFiles, setCandidateFiles] = useState([]);
  const [instituteFiles, setInstituteFiles] = useState([]);
  const [candidateImages, setCandidateImages] = useState([]);
  const [instituteImages, setInstituteImages] = useState([]);

  const load = useCallback(async () => {
    const data = await readResponse(await fetch(API, { credentials: "include", cache: "no-store" }));
    setRecords(data.records || []);
  }, []);

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
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
    setHumanFeedback(JSON.stringify(record.human_feedback || {}, null, 2));
    setAiFeedback(JSON.stringify(record.ai_feedback || {}, null, 2));
    setRubricVersion(record.rubric_version || "manual-v1");
    setAiModelVersion(record.ai_model_version || "recorded-existing-evaluation");
    setConsent(record.consent_public === true);
    setCandidateImages(Array.isArray(record.candidate_copy_images) ? record.candidate_copy_images : []);
    setInstituteImages(Array.isArray(record.institute_copy_images) ? record.institute_copy_images : []);
    setCandidateFiles([]);
    setInstituteFiles([]);
    setMessage("Record loaded. If you edit/save it, it returns to pending verification.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadFiles(files, side) {
    const uploaded = [];
    for (const file of Array.from(files || [])) {
      if (!file.type.startsWith("image/")) throw new Error(`${file.name}: choose an image file.`);
      if (file.size <= 0 || file.size > 50 * 1024 * 1024) throw new Error(`${file.name}: maximum image size is 50 MB.`);
      const sign = await readResponse(await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", side, fileName: file.name, size: file.size }),
      }));
      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream", apikey: sign.anonKey, Authorization: `Bearer ${sign.anonKey}`, "x-upsert": "false" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed for ${file.name}. Check Storage bucket settings.`);
      uploaded.push(sign.publicUrl);
    }
    return uploaded;
  }

  async function saveRecord(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      let nextCandidateImages = candidateImages;
      let nextInstituteImages = instituteImages;
      if (candidateFiles.length) nextCandidateImages = [...candidateImages, ...(await uploadFiles(candidateFiles, "candidate"))];
      if (instituteFiles.length) nextInstituteImages = [...instituteImages, ...(await uploadFiles(instituteFiles, "institute"))];

      let humanFeedbackValue = {};
      let aiFeedbackValue = {};
      try { humanFeedbackValue = humanFeedback.trim() ? JSON.parse(humanFeedback) : {}; }
      catch { humanFeedbackValue = { summary: humanFeedback }; }
      try { aiFeedbackValue = aiFeedback.trim() ? JSON.parse(aiFeedback) : {}; }
      catch { aiFeedbackValue = { summary: aiFeedback }; }

      const data = await readResponse(await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          id: selectedId || undefined,
          question, subject, question_type: questionType,
          candidate_answer: candidateAnswer,
          maximum_marks: Number(maximumMarks),
          human_score: Number(humanScore),
          ai_score: Number(aiScore),
          human_feedback: humanFeedbackValue,
          ai_feedback: aiFeedbackValue,
          rubric_version: rubricVersion,
          ai_model_version: aiModelVersion,
          consent_public: consent,
          candidate_copy_images: nextCandidateImages,
          institute_copy_images: nextInstituteImages,
        }),
      }));
      setMessage(data.message || "Saved.");
      setCandidateImages(nextCandidateImages);
      setInstituteImages(nextInstituteImages);
      setCandidateFiles([]);
      setInstituteFiles([]);
      await load();
      if (!selectedId && data.record?.id) setSelectedId(data.record.id);
    } catch (error) {
      setMessage(error.message || "Could not save record.");
    } finally {
      setBusy(false);
    }
  }

  async function action(id, actionName, extra = {}) {
    setBusy(true);
    setMessage("");
    try {
      const data = await readResponse(await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, id, ...extra }),
      }));
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
      <input style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)} {...props} />
    </label>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f6f6f3", color: "#171717", padding: "22px 14px 60px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 850, color: "#8a6b25" }}>SAMBHAV UPSC · ADMIN</div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", margin: "8px 0" }}>AI Evaluation Benchmark</h1>
          <p style={{ margin: 0, color: "#626262", lineHeight: 1.6 }}>
            Add selected copies only. Save → Verify → Publish. Publishing requires explicit public consent.
          </p>
        </header>

        {message && <div role="status" style={{ padding: 12, marginBottom: 16, border: "1px solid #ded6be", borderRadius: 10, background: "#fffdf5", overflowWrap: "anywhere" }}>{message}</div>}

        <form onSubmit={saveRecord} style={{ background: "#fff", border: "1px solid #e3e3df", borderRadius: 16, padding: 16, display: "grid", gap: 15 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{selectedId ? "Edit benchmark record" : "Add benchmark record"}</h2>
            <button type="button" style={buttonStyle} onClick={resetForm}>New record / Clear</button>
          </div>

          <label>
            <span style={labelStyle}>Question *</span>
            <textarea required rows={3} style={{ ...inputStyle, resize: "vertical" }} value={question} onChange={(e) => setQuestion(e.target.value)} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {field("Subject", subject, setSubject)}
            {field("Question type", questionType, setQuestionType)}
            {field("Maximum marks *", maximumMarks, setMaximumMarks, { type: "number", min: "0.1", step: "any", required: true })}
            {field("Human / institute marks *", humanScore, setHumanScore, { type: "number", min: "0", step: "any", required: true })}
            {field("Existing AI marks *", aiScore, setAiScore, { type: "number", min: "0", step: "any", required: true })}
            {field("Rubric version", rubricVersion, setRubricVersion)}
            {field("AI model version (as recorded)", aiModelVersion, setAiModelVersion)}
          </div>

          <label>
            <span style={labelStyle}>Candidate answer transcription *</span>
            <textarea required rows={5} style={{ ...inputStyle, resize: "vertical" }} value={candidateAnswer} onChange={(e) => setCandidateAnswer(e.target.value)} placeholder="Enter the student's answer transcription. Do not invent data." />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <label>
              <span style={labelStyle}>Human / institute feedback (JSON or plain text)</span>
              <textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={humanFeedback} onChange={(e) => setHumanFeedback(e.target.value)} placeholder='{"summary":"...","strengths":[],"improvements":[]}' />
            </label>
            <label>
              <span style={labelStyle}>Existing AI feedback (JSON or plain text)</span>
              <textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={aiFeedback} onChange={(e) => setAiFeedback(e.target.value)} placeholder='{"summary":"...","strengths":[],"improvements":[]}' />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
              <label style={labelStyle}>Student original handwritten copy images *</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setCandidateFiles(Array.from(e.target.files || []))} />
              <div style={{ fontSize: 12, color: "#666", marginTop: 7 }}>Existing image URLs: {candidateImages.length}. New files: {candidateFiles.length}.</div>
              {candidateImages.map((src, i) => <div key={`${src}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, overflowWrap: "anywhere" }}><a href={src} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#755b1d" }}>Open image {i + 1}</a><button type="button" style={{ ...buttonStyle, padding: "4px 8px" }} onClick={() => setCandidateImages((old) => old.filter((_, j) => j !== i))}>Remove</button></div>)}
            </section>
            <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
              <label style={labelStyle}>Coaching / human-checked copy images *</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setInstituteFiles(Array.from(e.target.files || []))} />
              <div style={{ fontSize: 12, color: "#666", marginTop: 7 }}>Existing image URLs: {instituteImages.length}. New files: {instituteFiles.length}.</div>
              {instituteImages.map((src, i) => <div key={`${src}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, overflowWrap: "anywhere" }}><a href={src} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#755b1d" }}>Open image {i + 1}</a><button type="button" style={{ ...buttonStyle, padding: "4px 8px" }} onClick={() => setInstituteImages((old) => old.filter((_, j) => j !== i))}>Remove</button></div>)}
            </section>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, lineHeight: 1.5, fontSize: 13 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
            I have confirmed documented permission to publish these answer-copy images and associated evaluation data publicly.
          </label>

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button disabled={busy} type="submit" style={{ ...buttonStyle, background: "#171717", color: "#fff", borderColor: "#171717" }}>{busy ? "Working…" : "Save as pending verification"}</button>
            {selectedId && <button disabled={busy} type="button" style={buttonStyle} onClick={() => action(selectedId, "verify")}>Verify record</button>}
            {selectedId && <button disabled={busy || !consent} type="button" style={buttonStyle} onClick={() => action(selectedId, "publish", { consent_public: consent })}>Publish publicly</button>}
            {selectedId && <button disabled={busy} type="button" style={buttonStyle} onClick={() => action(selectedId, "unpublish")}>Unpublish</button>}
          </div>
          <p style={{ margin: 0, color: "#666", fontSize: 12, lineHeight: 1.6 }}>
            Editing and saving resets verification and publication. The AI marks/feedback must be copied from the existing evaluator result; this page does not call or modify the evaluator.
          </p>
        </form>

        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 21 }}>Existing records ({records.length})</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {records.map((record) => (
              <article key={record.id} style={{ border: "1px solid #e2e2de", background: "#fff", borderRadius: 13, padding: 13, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, overflowWrap: "anywhere" }}>{record.question}</div>
                    <div style={{ color: "#666", fontSize: 12, marginTop: 5 }}>
                      Human: {record.human_score}/{record.maximum_marks} · AI: {record.ai_score}/{record.maximum_marks} · Verification: {record.verification_status} · {record.is_public ? "PUBLIC" : "Not public"}
                    </div>
                  </div>
                  <button type="button" style={buttonStyle} onClick={() => editRecord(record)}>Edit</button>
                </div>
              </article>
            ))}
            {!records.length && <div style={{ border: "1px dashed #ccc", borderRadius: 12, padding: 18, color: "#666" }}>No benchmark records yet.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
  
