
import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../../lib/smartQuizServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // 1. Verify the logged-in user.
    const user = await getSmartQuizUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in to submit your mistake retest." },
        { status: 401 }
      );
    }

    // 2. Parse and validate the request.
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const sessionId = String(body?.sessionId || "").trim();
    const answers = body?.answers;

    if (body?.mode !== "mistake_retest") {
      return NextResponse.json(
        { success: false, error: "Invalid retest mode." },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No retest answers were provided." },
        { status: 400 }
      );
    }

    if (answers.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 answers are allowed." },
        { status: 400 }
      );
    }

    // 3. Verify that this session belongs to the current user.
    const sessions = await smartQuizDb(
      "smart_quiz_sessions",
      `select=id,user_id,mode,status,total_questions` +
        `&id=eq.${encodeURIComponent(sessionId)}` +
        `&user_id=eq.${encodeURIComponent(String(user.id))}`
    );

    const session = Array.isArray(sessions) ? sessions[0] : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Retest session not found for this account." },
        { status: 404 }
      );
    }

    if (session.mode !== "mistake_retest") {
      return NextResponse.json(
        { success: false, error: "The session is not a mistake retest." },
        { status: 400 }
      );
    }

    if (session.status !== "in_progress") {
      return NextResponse.json(
        { success: false, error: "This retest has already been submitted." },
        { status: 409 }
      );
    }

    // 4. Validate option indices: 0=A, 1=B, 2=C, 3=D.
    const normalizedAnswers = [];

    for (const item of answers) {
      const questionId = String(
        item?.questionId || item?.question_id || ""
      ).trim();

      if (!questionId) {
        return NextResponse.json(
          { success: false, error: "An answer is missing its question ID." },
          { status: 400 }
        );
      }

      const rawOption =
        item?.selectedOption ?? item?.selected_option;

      let selectedOption = null;

      if (
        rawOption !== null &&
        rawOption !== undefined &&
        rawOption !== ""
      ) {
        const value = Number(rawOption);

        if (!Number.isInteger(value) || value < 0 || value > 3) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid answer option for question ${questionId}.`,
            },
            { status: 400 }
          );
        }

        selectedOption = value;
      }

      normalizedAnswers.push({
        questionId,
        selectedOption,
        isBookmarked:
          item?.isBookmarked === true ||
          item?.is_bookmarked === true,
        timeTakenSeconds: Math.max(
          0,
          Math.min(86400, Number(item?.timeTakenSeconds) || 0)
        ),
      });
    }

    if (
      new Set(normalizedAnswers.map((item) => item.questionId)).size !==
      normalizedAnswers.length
    ) {
      return NextResponse.json(
        { success: false, error: "Duplicate question IDs were submitted." },
        { status: 400 }
      );
    }

    // 5. Reuse the main grading endpoint.
    // It must save responses and resolve correctly answered mistakes.
    const submitUrl = new URL("/api/quizzes/submit", request.url);

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const cookie = request.headers.get("cookie");
    const authorization = request.headers.get("authorization");

    if (cookie) headers.set("cookie", cookie);
    if (authorization) headers.set("authorization", authorization);

    const upstreamResponse = await fetch(submitUrl, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        mode: "mistake_retest",
        sessionId,
        answers: normalizedAnswers,
        timeTakenSeconds: Math.max(
          0,
          Math.min(86400, Number(body.timeTakenSeconds) || 0)
        ),
      }),
    });

    const responseText = await upstreamResponse.text();

    let result;

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {
        error: responseText || "The quiz submission API returned an invalid response.",
      };
    }

    // Preserve the actual upstream failure so it can be diagnosed.
    if (!upstreamResponse.ok) {
      console.error("Retest grading endpoint failed:", {
        status: upstreamResponse.status,
        error: result?.error || result?.message || "Unknown API error",
      });

      return NextResponse.json(
        {
          success: false,
          error:
            result?.error ||
            result?.message ||
            `Quiz submission failed with HTTP ${upstreamResponse.status}.`,
          upstreamStatus: upstreamResponse.status,
        },
        { status: upstreamResponse.status }
      );
    }

    if (result?.success !== true) {
      return NextResponse.json(
        {
          success: false,
          error: result?.error || "Quiz submission did not confirm success.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error) {
    console.error("Mistake retest API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unexpected mistake retest submission error.",
      },
      { status: 500 }
    );
  }
}
