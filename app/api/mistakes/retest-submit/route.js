
import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../../lib/smartQuizServer";

export async function POST(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to submit your mistake retest." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sessionId = String(body.sessionId || "");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    const sessions = await smartQuizDb(
      "smart_quiz_sessions",
      `id=eq.${encodeURIComponent(sessionId)}` +
        `&user_id=eq.${encodeURIComponent(String(user.id))}` +
        "&select=id,mode,status"
    );

    const session = Array.isArray(sessions) ? sessions[0] : null;

    if (!session) {
      return NextResponse.json(
        { error: "Retest session not found." },
        { status: 404 }
      );
    }

    if (session.mode !== "mistake_retest") {
      return NextResponse.json(
        { error: "This session is not a mistake retest." },
        { status: 400 }
      );
    }

    if (session.status !== "in_progress") {
      return NextResponse.json(
        { error: "This retest has already been submitted." },
        { status: 409 }
      );
    }

    // Reuse the verified submission engine so scoring, responses,
    // bookmarks and mistake resolution remain consistent.
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const cookie = request.headers.get("cookie");
    const authorization = request.headers.get("authorization");

    if (cookie) headers.set("cookie", cookie);
    if (authorization) headers.set("authorization", authorization);

    const submitUrl = new URL("/api/quizzes/submit", request.url);

    const response = await fetch(submitUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({
      error: "Invalid response from quiz submission endpoint.",
    }));

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error("Mistake retest submission error:", error);

    return NextResponse.json(
      { error: error.message || "Unable to submit mistake retest." },
      { status: 500 }
    );
  }
}
