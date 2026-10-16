import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

// Dedicated bucket for AI Evaluation Benchmark.
// This does not change the Study Material bucket.
const BUCKET = "ai-evaluation-benchmark";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const TABLE = "ai_evaluation_benchmark";
const SIGNED_VIEW_SECONDS = 60 * 60;

function verify(token) {
  try {
    if (!token || !SESSION_SECRET) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return data?.userId && data?.exp && Date.now() <= data.exp
      ? data
      : null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SESSION_SECRET) {
    return {
      error: "Server environment is not configured.",
      status: 500,
    };
  }

  const cookieStore = await cookies();
  const session = verify(
    cookieStore.get("sambhav_session")?.value
  );

  if (!session) {
    return {
      error: "Admin access denied.",
      status: 403,
    };
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(
      session.userId
    )}&is_active=eq.true&select=id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return {
      error: "Could not verify admin access.",
      status: 500,
    };
  }

  const rows = await response.json();

  return rows.length
    ? { userId: session.userId }
    : {
        error: "Admin access denied.",
        status: 403,
      };
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
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function safeFileName(name) {
  return (
    String(name || "answer-image")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(-100) || "answer-image"
  );
}

function encodedPath(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
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

function extractBucketPath(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const input = value.trim();

  // Preferred format: store the relative Storage object path.
  if (
    input.startsWith("benchmark/candidate/") ||
    input.startsWith("benchmark/institute/")
  ) {
    return input;
  }

  // Convert an existing public URL only if it belongs to this bucket.
  const publicPrefix =
    `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

  if (input.startsWith(publicPrefix)) {
    try {
      return decodeURIComponent(input.slice(publicPrefix.length));
    } catch {
      return null;
    }
  }

  // Convert a signed URL belonging to this bucket into its object path.
  const signedPrefix =
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/`;

  if (input.startsWith(signedPrefix)) {
    const withoutQuery = input
      .slice(signedPrefix.length)
      .split("?")[0];

    try {
      return decodeURIComponent(withoutQuery);
    } catch {
      return null;
    }
  }

  return null;
}

async function objectExists(path) {
  const response = await storageRequest(
    `object/info/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,
    {
      method: "GET",
    }
  );

  return response.ok;
}

async function createSignedViewUrl(path) {
  const response = await storageRequest(
    `object/sign/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expiresIn: SIGNED_VIEW_SECONDS,
      }),
    }
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 250);

    throw new Error(
      `Could not create signed image URL (${response.status}). ${detail}`
    );
  }

  const data = await response.json();
  const signed = data.signedURL || data.signedUrl;

  if (!signed) {
    throw new Error(
      "Supabase did not return a signed viewing URL."
    );
  }

  if (/^https?:\/\//i.test(signed)) {
    return signed;
  }

  return `${SUPABASE_URL}/storage/v1/${String(signed).replace(/^\/+/, "")}`;
}

async function withSignedImages(record) {
  const candidatePaths = normalizeImages(
    record.candidate_copy_images
  )
    .map(extractBucketPath)
    .filter(Boolean);

  const institutePaths = normalizeImages(
    record.institute_copy_images
  )
    .map(extractBucketPath)
    .filter(Boolean);

  const [candidateUrls, instituteUrls] = await Promise.all([
    Promise.all(
      candidatePaths.map(createSignedViewUrl)
    ),
    Promise.all(
      institutePaths.map(createSignedViewUrl)
    ),
  ]);

  return {
    ...record,

    // The database stores object paths, not expiring URLs.
    // Signed URLs are generated for image previews.
    candidate_copy_images: candidateUrls,
    institute_copy_images: instituteUrls,

    candidate_copy_paths: candidatePaths,
    institute_copy_paths: institutePaths,
  };
}

async function signRecords(records) {
  return Promise.all(records.map(withSignedImages));
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function feedback(value, fallback) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }
    } catch {}

    return {
      summary: value.trim().slice(0, 10000),
    };
  }

  return {
    summary: fallback,
  };
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return json(
        {
          success: false,
          error: auth.error,
        },
        auth.status
      );
    }

    const response = await restRequest(
      `${TABLE}?select=*&order=created_at.desc&limit=500`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);

      return json(
        {
          success: false,
          error: `Could not load benchmark records. ${detail}`,
        },
        502
      );
    }

    const records = await response.json();

    try {
      return json({
        success: true,
        records: await signRecords(records),
      });
    } catch (error) {
      console.error(
        "Admin benchmark signed image URLs:",
        error
      );

      return json({
        success: true,
        records,
        warning:
          "Some image previews could not be signed. Check that the benchmark bucket exists and contains the saved image paths.",
      });
    }
  } catch (error) {
    console.error("Admin benchmark GET:", error);

    return json(
      {
        success: false,
        error: "Could not load benchmark records.",
      },
      500
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return json(
        {
          success: false,
          error: auth.error,
        },
        auth.status
      );
    }

    const body = await readJson(request);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return json(
        {
          success: false,
          error: "Invalid JSON body.",
        },
        400
      );
    }

    // ---------------------------------------------------------
    // SIGN: create a signed upload URL for benchmark images
    // ---------------------------------------------------------
    if (body.action === "sign") {
      if (!SUPABASE_ANON_KEY) {
        return json(
          {
            success: false,
            error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
          },
          500
        );
      }

      const size = Number(body.size);
      const fileName = safeFileName(body.fileName);
      const side =
        body.side === "institute"
          ? "institute"
          : "candidate";

      const contentType = String(
        body.contentType || ""
      ).slice(0, 150);

      if (
        !Number.isFinite(size) ||
        size <= 0 ||
        size > MAX_UPLOAD_BYTES
      ) {
        return json(
          {
            success: false,
            error: "Image must be between 1 byte and 50 MB.",
          },
          413
        );
      }

      const path =
        `benchmark/${side}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

      const signed = await storageRequest(
        `object/upload/sign/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            upsert: false,
          }),
        }
      );

      if (!signed.ok) {
        const detail = (await signed.text()).slice(0, 300);

        return json(
          {
            success: false,
            error: `Could not sign upload. ${detail}`,
          },
          502
        );
      }

      const signedData = await signed.json();

      const signedPath =
        signedData.signedURL ||
        signedData.signedUrl ||
        signedData.url;

      const token = signedData.token;

      let uploadUrl;

      if (
        signedPath &&
        /^https?:\/\//i.test(signedPath)
      ) {
        uploadUrl = signedPath;
      } else if (signedPath) {
        uploadUrl =
          `${SUPABASE_URL}/storage/v1/${String(signedPath).replace(/^\/+/, "")}`;
      } else if (token) {
        uploadUrl =
          `${SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(
            BUCKET
          )}/${encodedPath(path)}?token=${encodeURIComponent(token)}`;
      } else {
        return json(
          {
            success: false,
            error: "Supabase did not return an upload token.",
          },
          502
        );
      }

      return json({
        success: true,
        uploadUrl,
        anonKey: SUPABASE_ANON_KEY,
        bucket: BUCKET,
        path,

        // Compatibility field for existing admin UI.
        // Private-bucket previews should use signed viewing URLs.
        publicUrl:
          `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodedPath(path)}`,

        maxBytes: MAX_UPLOAD_BYTES,
        contentType,
      });
    }

    // ---------------------------------------------------------
    // SAVE: persist benchmark record and private image paths
    // ---------------------------------------------------------
    if (body.action === "save") {
      const id = body.id
        ? String(body.id)
        : null;

      if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
        return json(
          {
            success: false,
            error: "Invalid benchmark record ID.",
          },
          400
        );
      }

      const question = String(
        body.question || ""
      ).trim().slice(0, 12000);

      const candidateAnswer = String(
        body.candidate_answer || ""
      ).trim().slice(0, 30000);

      const subject =
        String(body.subject || "")
          .trim()
          .slice(0, 200) || null;

      const questionType =
        String(body.question_type || "")
          .trim()
          .slice(0, 100) || null;

      const max = Number(body.maximum_marks);
      const human = Number(body.human_score);
      const ai = Number(body.ai_score);

      const candidateImagesInput = normalizeImages(
        body.candidate_copy_images
      );

      const instituteImagesInput = normalizeImages(
        body.institute_copy_images
      );

      const candidateImages =
        candidateImagesInput.map(extractBucketPath);

      const instituteImages =
        instituteImagesInput.map(extractBucketPath);

      if (!question || !candidateAnswer) {
        return json(
          {
            success: false,
            error: "Question and answer transcription are required.",
          },
          400
        );
      }

      if (
        !Number.isFinite(max) ||
        max <= 0 ||
        max > 1000 ||
        !validScore(human, max) ||
        !validScore(ai, max)
      ) {
        return json(
          {
            success: false,
            error:
              "Maximum marks must be positive and both scores must be within the maximum marks.",
          },
          400
        );
      }

      if (
        !candidateImages.length ||
        !instituteImages.length ||
        candidateImages.some((path) => !path) ||
        instituteImages.some((path) => !path)
      ) {
        return json(
          {
            success: false,
            error:
              "Use valid benchmark image paths or URLs from this benchmark bucket.",
          },
          400
        );
      }

      if (
        candidateImages.some(
          (path) => !path.startsWith("benchmark/candidate/")
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Candidate-copy images must be uploaded under benchmark/candidate/.",
          },
          400
        );
      }

      if (
        instituteImages.some(
          (path) => !path.startsWith("benchmark/institute/")
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Institute-checked images must be uploaded under benchmark/institute/.",
          },
          400
        );
      }

      for (const imagePath of [
        ...candidateImages,
        ...instituteImages,
      ]) {
        if (!(await objectExists(imagePath))) {
          return json(
            {
              success: false,
              error:
                "An uploaded image was not found in the ai-evaluation-benchmark Storage bucket. Re-upload the image and save again.",
            },
            400
          );
        }
      }

      const data = {
        question,
        subject,
        question_type: questionType,
        candidate_answer: candidateAnswer,
        maximum_marks: max,
        human_score: human,

        human_feedback: feedback(
          body.human_feedback,
          ""
        ),

        ai_score: ai,

        ai_feedback: feedback(
          body.ai_feedback,
          ""
        ),

        human_dimensions: feedback(
          body.human_dimensions,
          {}
        ),

        ai_dimensions: feedback(
          body.ai_dimensions,
          {}
        ),

        rubric_version:
          String(body.rubric_version || "manual-v1")
            .trim()
            .slice(0, 120) || "manual-v1",

        ai_model_version:
          String(
            body.ai_model_version ||
              "recorded-existing-evaluation"
          )
            .trim()
            .slice(0, 160) ||
          "recorded-existing-evaluation",

        evaluator_code:
          String(
            body.evaluator_code || "SAMBHAV UPSC"
          )
            .trim()
            .slice(0, 160) || null,

        // Persist object paths, not public or expiring signed URLs.
        candidate_copy_images: candidateImages,
        institute_copy_images: instituteImages,

        evaluated_at:
          body.evaluated_at || new Date().toISOString(),

        updated_at: new Date().toISOString(),

        // Every saved record starts pending verification.
        verification_status: "pending",

        consent_public: body.consent_public === true,

        // Saving alone must never publish a record.
        is_public: false,
        published_at: null,
      };

      const path = id
        ? `${TABLE}?id=eq.${encodeURIComponent(id)}`
        : TABLE;

      const response = await restRequest(path, {
        method: id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);

        return json(
          {
            success: false,
            error: `Could not save benchmark record. ${detail}`,
          },
          502
        );
      }

      const rows = await response.json();
      let record = rows?.[0] || null;

      if (record) {
        try {
          record = await withSignedImages(record);
        } catch (error) {
          console.error(
            "Could not sign saved benchmark images:",
            error
          );
        }
      }

      return json({
        success: true,
        record,
        message: "Record saved as pending verification.",
      });
    }

    // ---------------------------------------------------------
    // VERIFY: mark a complete benchmark record as verified
    // ---------------------------------------------------------
    if (body.action === "verify") {
      const id = String(body.id || "");

      if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return json(
          {
            success: false,
            error: "Valid record ID is required.",
          },
          400
        );
      }

      const lookup = await restRequest(
        `${TABLE}?id=eq.${encodeURIComponent(
          id
        )}&select=id,question,candidate_answer,maximum_marks,human_score,ai_score,candidate_copy_images,institute_copy_images&limit=1`
      );

      if (!lookup.ok) {
        return json(
          {
            success: false,
            error: "Could not load record for verification.",
          },
          502
        );
      }

      const record = (await lookup.json())?.[0];

      if (!record) {
        return json(
          {
            success: false,
            error: "Record not found.",
          },
          404
        );
      }

      const candidateImages = normalizeImages(
        record.candidate_copy_images
      );

      const instituteImages = normalizeImages(
        record.institute_copy_images
      );

      if (
        !record.question ||
        !record.candidate_answer ||
        !candidateImages.length ||
        !instituteImages.length
      ) {
        return json(
          {
            success: false,
            error:
              "Record is incomplete; question, answer text and both sets of copy images are required.",
          },
          400
        );
      }

      const updated = await restRequest(
        `${TABLE}?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            verification_status: "verified",
            is_public: false,
            published_at: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updated.ok) {
        return json(
          {
            success: false,
            error: "Could not verify record.",
          },
          502
        );
      }

      let saved = (await updated.json())?.[0] || null;

      if (saved) {
        try {
          saved = await withSignedImages(saved);
        } catch {}
      }

      return json({
        success: true,
        record: saved,
        message:
          "Verified. Publish separately after confirming consent.",
      });
    }

    // ---------------------------------------------------------
    // PUBLISH: requires verification and explicit public consent
    // ---------------------------------------------------------
    if (body.action === "publish") {
      const id = String(body.id || "");

      if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return json(
          {
            success: false,
            error: "Valid record ID is required.",
          },
          400
        );
      }

      const lookup = await restRequest(
        `${TABLE}?id=eq.${encodeURIComponent(
          id
        )}&select=id,verification_status,consent_public&limit=1`
      );

      if (!lookup.ok) {
        return json(
          {
            success: false,
            error: "Could not load record.",
          },
          502
        );
      }

      const record = (await lookup.json())?.[0];

      if (!record) {
        return json(
          {
            success: false,
            error: "Record not found.",
          },
          404
        );
      }

      if (record.verification_status !== "verified") {
        return json(
          {
            success: false,
            error: "Verify the record before publishing.",
          },
          409
        );
      }

      if (
        body.consent_public !== true &&
        record.consent_public !== true
      ) {
        return json(
          {
            success: false,
            error:
              "Explicit public consent is required before publishing.",
          },
          400
        );
      }

      const updated = await restRequest(
        `${TABLE}?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            consent_public: true,
            is_public: true,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updated.ok) {
        return json(
          {
            success: false,
            error: "Could not publish record.",
          },
          502
        );
      }

      let saved = (await updated.json())?.[0] || null;

      if (saved) {
        try {
          saved = await withSignedImages(saved);
        } catch {}
      }

      return json({
        success: true,
        record: saved,
        message: "Published.",
      });
    }

    // ---------------------------------------------------------
    // UNPUBLISH: remove public visibility
    // ---------------------------------------------------------
    if (body.action === "unpublish") {
      const id = String(body.id || "");

      if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return json(
          {
            success: false,
            error: "Valid record ID is required.",
          },
          400
        );
      }

      const updated = await restRequest(
        `${TABLE}?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            is_public: false,
            published_at: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updated.ok) {
        return json(
          {
            success: false,
            error: "Could not unpublish record.",
          },
          502
        );
      }

      let saved = (await updated.json())?.[0] || null;

      if (saved) {
        try {
          saved = await withSignedImages(saved);
        } catch {}
      }

      return json({
        success: true,
        record: saved,
        message: "Unpublished.",
      });
    }

    return json(
      {
        success: false,
        error: "Unsupported action.",
      },
      400
    );
  } catch (error) {
    console.error("Admin benchmark POST:", error);

    return json(
      {
        success: false,
        error: "Benchmark operation failed. Check server logs.",
      },
      500
    );
  }
}
