
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const BUCKET = "ai-evaluation-benchmark";
const SIGNED_URL_EXPIRY = 3600;

function verifyEmailSession(token) {
  try {
    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret || !token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (!data.exp || Date.now() > data.exp || !data.userId) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function authorize() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return {
      error: "Benchmark service is not configured.",
      status: 503,
    };
  }

  const cookieStore = await cookies();
  const session = verifyEmailSession(
    cookieStore.get("sambhav_session")?.value
  );

  if (!session?.userId) {
    return {
      error: "Please sign in to view the benchmark.",
      status: 401,
    };
  }

  const userResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
      session.userId
    )}&select=id,status&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!userResponse.ok) {
    return {
      error: "Unable to verify your account.",
      status: 503,
    };
  }

  const users = await userResponse.json();

  if (!users.length || users[0].status !== "approved") {
    return {
      error: "An approved SAMBHAV account is required.",
      status: 403,
    };
  }

  return { userId: users[0].id };
}

function extractBucketPath(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const input = value.trim();

  // Accept stored object paths.
  if (
    input.startsWith("benchmark/candidate/") ||
    input.startsWith("benchmark/institute/")
  ) {
    return input;
  }

  // Accept existing Supabase public or signed storage URLs.
  try {
    const url = new URL(input);
    const marker = `/storage/v1/object/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    const storagePath = url.pathname.slice(markerIndex + marker.length);
    const prefixes = [
      `public/${BUCKET}/`,
      `sign/${BUCKET}/`,
      `authenticated/${BUCKET}/`,
    ];

    const prefix = prefixes.find((item) => storagePath.startsWith(item));
    if (!prefix) return null;

    return decodeURIComponent(storagePath.slice(prefix.length));
  } catch {
    return null;
  }
}

async function createSignedViewUrl(path) {
  if (!path) return null;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expiresIn: SIGNED_URL_EXPIRY,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("Benchmark image signing failed:", {
      path,
      status: response.status,
      details,
    });
    return null;
  }

  const data = await response.json();
  const signedPath = data.signedURL || data.signedUrl;

  if (!signedPath) return null;

  if (/^https?:\/\//i.test(signedPath)) return signedPath;

  return `${SUPABASE_URL}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
}

async function signImageList(value) {
  if (!Array.isArray(value)) return [];

  const results = await Promise.all(
    value.map(async (item) => {
      const path = extractBucketPath(item);
      if (!path) return null;

      return createSignedViewUrl(path);
    })
  );

  return results.filter(Boolean);
}

async function signRecordImages(row) {
  const [candidateImages, instituteImages] = await Promise.all([
    signImageList(row.candidate_copy_images),
    signImageList(row.institute_copy_images),
  ]);

  return {
    ...row,
    candidate_copy_images: candidateImages,
    institute_copy_images: instituteImages,
  };
}

export async function GET() {
  try {
    const auth = await authorize();

    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        {
          status: auth.status,
          headers: { "Cache-Control": "private, no-store" },
        }
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_evaluation_benchmark?verification_status=eq.verified&consent_public=eq.true&is_public=eq.true&select=id,question,subject,question_type,candidate_answer,candidate_copy_images,institute_copy_images,maximum_marks,human_score,human_feedback,ai_score,ai_feedback,human_dimensions,ai_dimensions,rubric_version,ai_model_version,evaluated_at,published_at&order=published_at.desc&limit=500`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("Benchmark data query failed:", details);

      return NextResponse.json(
        {
          success: true,
          records: [],
          dataStatus: "collecting",
          message: "Benchmark data being collected",
        },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const rows = await response.json();

    const eligibleRows = rows.filter(
      (row) =>
        Number.isFinite(Number(row.human_score)) &&
        Number.isFinite(Number(row.ai_score)) &&
        Number(row.maximum_marks) > 0 &&
        typeof row.candidate_answer === "string" &&
        row.candidate_answer.trim().length > 0
    );

    const records = await Promise.all(
      eligibleRows.map(signRecordImages)
    );

    return NextResponse.json(
      {
        success: true,
        records,
        dataStatus: records.length ? "available" : "collecting",
        message: records.length
          ? null
          : "Benchmark data being collected",
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("AI Evaluation Benchmark GET failed:", error);

    return NextResponse.json(
      { error: "Unable to load benchmark data right now." },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
