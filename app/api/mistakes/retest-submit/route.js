
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || body.mode !== "mistake_retest") {
      return NextResponse.json(
        { error: "Invalid mistake retest submission." },
        { status: 400 }
      );
    }

    const url = new URL("/api/quizzes/submit", request.url);

    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    const authorization = request.headers.get("authorization");

    if (cookie) headers.set("cookie", cookie);
    if (authorization) headers.set("authorization", authorization);

    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || "Invalid response from quiz submission." };
    }

    return NextResponse.json(data, {
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
