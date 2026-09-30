import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const update = await request.json();

    console.log("Telegram update:", update);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
