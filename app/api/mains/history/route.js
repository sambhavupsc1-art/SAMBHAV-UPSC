import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

function verifyEmailSession(token) {
  try {
    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret || !token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || Date.now() > data.exp || !data.userId) return null;
    return data;
  } catch (error) {
    console.error("Mains history session verification failed:", error);
    return null;
  }
}

async function getAuthenticatedUserId() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return { error: "Supabase environment variables are missing", status: 500 };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("sambhav_session")?.value;
  const session = verifyEmailSession(token);
  if (!session?.userId) {
    return { error: "Please sign in to save and view evaluated answers.", status: 401 };
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(session.userId)}&select=id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("Mains history user lookup failed:", await response.text());
    return { error: "Unable to verify your account.", status: 500 };
  }

  const users = await response.json();
  if (!users.length) return { error: "Account not found. Please sign in again.", status: 401 };
  return { userId: users[0].id };
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    ...extra,
  };
}

export async function GET() {
  try {
    const auth = await getAuthenticatedUserId();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/mains_answer_history?user_id=eq.${encodeURIComponent(auth.userId)}&select=id,question,paper,section,topic,pyq_id,pyq_year,pyq_question_number,marks,word_limit,pyq_verified,question_source,candidate_answer_transcription,evaluation,score,maximum_marks,created_at&order=created_at.desc&limit=100`,
      { headers: supabaseHeaders(), cache: "no-store" }
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("Mains history read failed:", details);
      return NextResponse.json(
        { error: "Could not load answer history. Confirm the Supabase migration has been run." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, records: await response.json() });
  } catch (error) {
    console.error("Mains history GET failed:", error);
    return NextResponse.json({ error: "Unable to load answer history." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthenticatedUserId();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const payload = await request.json();
    const questionData = payload?.questionData || {};
    const evaluation = payload?.evaluation;
    const question = String(questionData.question || "").trim();

    if (!question || !evaluation || typeof evaluation !== "object") {
      return NextResponse.json({ error: "Question and evaluation are required." }, { status: 400 });
    }

    if (JSON.stringify(evaluation).length > 900_000) {
      return NextResponse.json({ error: "Evaluation is too large to save." }, { status: 413 });
    }

    const yearValue = Number(questionData.year);
    const pyqYear = Number.isInteger(yearValue) && yearValue >= 1950 && yearValue <= 2100
      ? yearValue
      : null;
    const verified = questionData.verified === true && Boolean(questionData.id) && pyqYear !== null;

    const row = {
      user_id: auth.userId,
      question,
      paper: String(questionData.paper || "GS").slice(0, 80),
      section: questionData.section ? String(questionData.section).slice(0, 160) : null,
      topic: questionData.topic ? String(questionData.topic).slice(0, 200) : null,
      pyq_id: questionData.id && !String(questionData.id).startsWith("manual-")
        ? String(questionData.id).slice(0, 180)
        : null,
      pyq_year: pyqYear,
      pyq_question_number: questionData.question_number != null
        ? String(questionData.question_number).slice(0, 20)
        : null,
      marks: Number.isFinite(Number(questionData.marks)) ? Number(questionData.marks) : Number(evaluation.maximum_marks) || null,
      word_limit: Number.isFinite(Number(questionData.word_limit || questionData.words))
        ? Number(questionData.word_limit || questionData.words)
        : null,
      pyq_verified: verified,
      question_source: String(
        questionData.source || questionData.source_file ||
        (String(questionData.year || "").toLowerCase() === "manual"
          ? "Custom Question"
          : (verified ? "Verified PYQ dataset" : "PYQ unverified"))
      ).slice(0, 200),
      candidate_answer_transcription: String(evaluation.candidate_answer_transcription || "").slice(0, 80_000),
      evaluation,
      score: Number.isFinite(Number(evaluation.overall_score)) ? Number(evaluation.overall_score) : null,
      maximum_marks: Number.isFinite(Number(evaluation.maximum_marks)) ? Number(evaluation.maximum_marks) : null,
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/mains_answer_history`, {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(row),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Mains history insert failed:", details);
      return NextResponse.json(
        { error: "Evaluation is complete, but history could not be saved. Check the Supabase table migration." },
        { status: 500 }
      );
    }

    const saved = await response.json();
    return NextResponse.json({ success: true, record: saved[0] || null });
  } catch (error) {
    console.error("Mains history POST failed:", error);
    return NextResponse.json({ error: "Unable to save this evaluation to history." }, { status: 500 });
  }
}
