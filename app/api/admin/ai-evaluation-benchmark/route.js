import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;
const BUCKET = process.env.ADMIN_CONTENT_BUCKET || "study-materials";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const TABLE = "ai_evaluation_benchmark";

function verify(token) {
  try {
    if (!token || !SESSION_SECRET) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data?.userId && data?.exp && Date.now() <= data.exp ? data : null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SESSION_SECRET) {
    return { error: "Server environment is not configured.", status: 500 };
  }
  const cookieStore = await cookies();
  const session = verify(cookieStore.get("sambhav_session")?.value);
  if (!session) return { error: "Admin access denied.", status: 403 };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(session.userId)}&is_active=eq.true&select=id&limit=1`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: "no-store",
    }
  );
  if (!response.ok) return { error: "Could not verify admin access.", status: 500 };
  const rows = await response.json();
  return rows.length ? { userId: session.userId } : { error: "Admin access denied.", status: 403 };
}

async function restRequest(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

async function storageRequest(path, options = {}) {
  return fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function safeFileName(name) {
  return String(name || "answer-image")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(-100) || "answer-image";
}

function encodedPath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

function validScore(value, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max;
}

function normalizeImages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => v.trim())
    .slice(0, 12);
}

async function objectExists(path) {
  const response = await storageRequest(
    `object/info/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,
    { method: "GET" }
  );
  return response.ok;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return json({ success: false, error: auth.error }, auth.status);

    const response = await restRequest(
      `${TABLE}?select=*&order=created_at.desc&limit=500`,
      { method: "GET" }
    );
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      return json({ success: false, error: `Could not load benchmark records. ${detail}` }, 502);
    }
    return json({ success: true, records: await response.json() });
  } catch (error) {
    console.error("Admin benchmark GET:", error);
    return json({ success: false, error: "Could not load benchmark records." }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return json({ success: false, error: auth.error }, auth.status);

    let body;
    try { body = await request.json(); } catch { body = null; }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ success: false, error: "Invalid JSON body." }, 400);
    }

    if (body.action === "sign") {
      if (!SUPABASE_ANON_KEY) {
        return json({ success: false, error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing." }, 500);
      }
      const size = Number(body.size);
      const fileName = safeFileName(body.fileName);
      const side = body.side === "institute" ? "institute" : "candidate";
      if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
        return json({ success: false, error: "Image must be between 1 byte and 50 MB." }, 413);
      }
      const path = `benchmark/${side}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
      const signed = await storageRequest(
        `object/upload/sign/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ upsert: false }) }
      );
      if (!signed.ok) {
        const detail = (await signed.text()).slice(0, 300);
        return json({ success: false, error: `Could not sign upload. ${detail}` }, 502);
      }
      const signedData = await signed.json();
      const signedPath = signedData.signedURL || signedData.signedUrl || signedData.url;
      const token = signedData.token;
      let uploadUrl;
      if (signedPath && /^https?:\/\//i.test(signedPath)) uploadUrl = signedPath;
      else if (signedPath) uploadUrl = `${SUPABASE_URL}/storage/v1/${String(signedPath).replace(/^\/+/, "")}`;
      else if (token) uploadUrl = `${SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(BUCKET)}/${encodedPath(path)}?token=${encodeURIComponent(token)}`;
      else return json({ success: false, error: "Supabase did not return an upload token." }, 502);

      return json({
        success: true,
        uploadUrl,
        anonKey: SUPABASE_ANON_KEY,
        bucket: BUCKET,
        path,
        // This URL works only if the configured Storage bucket is public.
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,
        maxBytes: MAX_UPLOAD_BYTES,
      });
    }

    if (body.action === "save") {
      const id = body.id ? String(body.id) : null;
      if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
        return json({ success: false, error: "Invalid benchmark record ID." }, 400);
      }

      const question = String(body.question || "").trim().slice(0, 12000);
      const candidateAnswer = String(body.candidate_answer || "").trim().slice(0, 30000);
      const subject = String(body.subject || "").trim().slice(0, 200) || null;
      const questionType = String(body.question_type || "").trim().slice(0, 100) || null;
      const max = Number(body.maximum_marks);
      const human = Number(body.human_score);
      const ai = Number(body.ai_score);
      const candidateImages = normalizeImages(body.candidate_copy_images);
      const instituteImages = normalizeImages(body.institute_copy_images);

      if (!question || !candidateAnswer) return json({ success: false, error: "Question and answer transcription are required." }, 400);
      if (!Number.isFinite(max) || max <= 0 || max > 1000 || !validScore(human, max) || !validScore(ai, max)) {
        return json({ success: false, error: "Maximum marks must be positive and both scores must be within the maximum marks." }, 400);
      }
      if (!candidateImages.length || !instituteImages.length) {
        return json({ success: false, error: "Upload at least one candidate-copy image and one human/institute-checked image." }, 400);
      }

      // Only accept paths belonging to this feature's bucket/prefix, and confirm each file exists.
      const allImages = [...candidateImages, ...instituteImages];
      for (const image of allImages) {
        if (image.startsWith("http://") || image.startsWith("https://")) {
          const expectedPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/benchmark/`;
          if (!image.startsWith(expectedPrefix)) {
            return json({ success: false, error: "Image URL must belong to the configured benchmark Storage folder." }, 400);
          }
        } else {
          if (!image.startsWith("benchmark/candidate/") && !image.startsWith("benchmark/institute/")) {
            return json({ success: false, error: "Invalid benchmark image path." }, 400);
          }
          if (!(await objectExists(image))) return json({ success: false, error: "An uploaded image was not found in Storage." }, 400);
        }
      }

      const feedback = (value, fallback) => {
        if (value && typeof value === "object" && !Array.isArray(value)) return value;
        if (typeof value === "string" && value.trim()) {
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
          } catch {}
          return { summary: value.trim().slice(0, 10000) };
        }
        return { summary: fallback };
      };

      const data = {
        question,
        subject,
        question_type: questionType,
        candidate_answer: candidateAnswer,
        maximum_marks: max,
        human_score: human,
        human_feedback: feedback(body.human_feedback, ""),
        ai_score: ai,
        ai_feedback: feedback(body.ai_feedback, ""),
        human_dimensions: feedback(body.human_dimensions, {}),
        ai_dimensions: feedback(body.ai_dimensions, {}),
        rubric_version: String(body.rubric_version || "manual-v1").trim().slice(0, 120) || "manual-v1",
        ai_model_version: String(body.ai_model_version || "recorded-existing-evaluation").trim().slice(0, 160) || "recorded-existing-evaluation",
        evaluator_code: String(body.evaluator_code || "SAMBHAV UPSC").trim().slice(0, 160) || null,
        candidate_copy_images: candidateImages.map((v) => v.startsWith("http") ? v : `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodedPath(v)}`),
        institute_copy_images: instituteImages.map((v) => v.startsWith("http") ? v : `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodedPath(v)}`),
        evaluated_at: body.evaluated_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Saving/editing never auto-verifies or auto-publishes a record.
        verification_status: "pending",
        consent_public: body.consent_public === true,
        is_public: false,
        published_at: null,
      };

      const path = id
        ? `${TABLE}?id=eq.${encodeURIComponent(id)}`
        : TABLE;
      const response = await restRequest(path, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        return json({ success: false, error: `Could not save benchmark record. ${detail}` }, 502);
      }
      const rows = await response.json();
      return json({ success: true, record: rows?.[0] || null, message: "Record saved as pending verification." });
    }

    if (body.action === "verify") {
      const id = String(body.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ success: false, error: "Valid record ID is required." }, 400);
      const lookup = await restRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=id,question,candidate_answer,maximum_marks,human_score,ai_score,candidate_copy_images,institute_copy_images&limit=1`);
      if (!lookup.ok) return json({ success: false, error: "Could not load record for verification." }, 502);
      const rows = await lookup.json();
      const record = rows?.[0];
      if (!record) return json({ success: false, error: "Record not found." }, 404);
      if (!record.question || !record.candidate_answer || !Array.isArray(record.candidate_copy_images) || !record.candidate_copy_images.length || !Array.isArray(record.institute_copy_images) || !record.institute_copy_images.length) {
        return json({ success: false, error: "Record is incomplete; question, answer text and both sets of copy images are required." }, 400);
      }
      const updated = await restRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ verification_status: "verified", is_public: false, published_at: null, updated_at: new Date().toISOString() }),
      });
      if (!updated.ok) return json({ success: false, error: "Could not verify record." }, 502);
      return json({ success: true, record: (await updated.json())?.[0] || null, message: "Verified. Publish separately after confirming consent." });
    }

    if (body.action === "publish") {
      const id = String(body.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ success: false, error: "Valid record ID is required." }, 400);
      const lookup = await restRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=id,verification_status,consent_public&limit=1`);
      if (!lookup.ok) return json({ success: false, error: "Could not load record." }, 502);
      const record = (await lookup.json())?.[0];
      if (!record) return json({ success: false, error: "Record not found." }, 404);
      if (record.verification_status !== "verified") return json({ success: false, error: "Verify the record before publishing." }, 409);
      if (body.consent_public !== true && record.consent_public !== true) {
        return json({ success: false, error: "Explicit public consent is required before publishing." }, 400);
      }
      const updated = await restRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ consent_public: true, is_public: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      });
      if (!updated.ok) return json({ success: false, error: "Could not publish record." }, 502);
      return json({ success: true, record: (await updated.json())?.[0] || null, message: "Published." });
    }

    if (body.action === "unpublish") {
      const id = String(body.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ success: false, error: "Valid record ID is required." }, 400);
      const updated = await restRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ is_public: false, published_at: null, updated_at: new Date().toISOString() }),
      });
      if (!updated.ok) return json({ success: false, error: "Could not unpublish record." }, 502);
      return json({ success: true, record: (await updated.json())?.[0] || null, message: "Unpublished." });
    }

    return json({ success: false, error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("Admin benchmark POST:", error);
    return json({ success: false, error: "Benchmark operation failed. Check server logs." }, 500);
  }
}
