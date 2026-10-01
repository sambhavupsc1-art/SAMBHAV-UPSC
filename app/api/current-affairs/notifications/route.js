import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables missing");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

/*
  GET
  User ki notification settings fetch karega.
*/
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "user_id is required",
        },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `current_affairs_notifications?select=*&user_id=eq.${encodeURIComponent(
        userId
      )}&limit=1`
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification settings fetch failed",
          details: text,
        },
        { status: response.status }
      );
    }

    const data = text ? JSON.parse(text) : [];

    return NextResponse.json({
      success: true,
      data: data[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Notification settings API failed",
      },
      { status: 500 }
    );
  }
}

/*
  POST
  Notification settings create/update karega.

  Body:
  {
    user_id: "...",
    enabled: true,
    language: "hi",
    notification_time: "10:00"
  }
*/
export async function POST(request) {
  try {
    const body = await request.json();

    const userId = String(body?.user_id || "").trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "user_id is required",
        },
        { status: 400 }
      );
    }

    const enabled =
      typeof body.enabled === "boolean"
        ? body.enabled
        : true;

    const language =
      body.language === "en"
        ? "en"
        : "hi";

    const notificationTime =
      body.notification_time || "10:00";

    if (
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        notificationTime
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "notification_time must be HH:MM format",
        },
        { status: 400 }
      );
    }

    const payload = {
      user_id: userId,
      enabled,
      language,
      notification_time: notificationTime,
      updated_at: new Date().toISOString(),
    };

    const response = await supabaseRequest(
      "current_affairs_notifications?on_conflict=user_id",
      {
        method: "POST",
        headers: {
          Prefer:
            "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Notification settings save failed",
          details: text,
        },
        { status: response.status }
      );
    }

    let data = [];

    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = [];
    }

    return NextResponse.json({
      success: true,
      message:
        "Notification settings saved successfully.",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Notification settings API failed",
      },
      { status: 500 }
    );
  }
}

/*
  DELETE
  Notification preference delete karega.
*/
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "user_id is required",
        },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `current_affairs_notifications?user_id=eq.${encodeURIComponent(
        userId
      )}`,
      {
        method: "DELETE",
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Notification settings delete failed",
          details: text,
        },
        { status: response.status }
      );
    }

    let data = [];

    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = [];
    }

    return NextResponse.json({
      success: true,
      message:
        "Notification settings deleted successfully.",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Notification settings API failed",
      },
      { status: 500 }
    );
  }
}
