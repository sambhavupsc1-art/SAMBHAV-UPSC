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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "important") {
      const response = await supabaseRequest(
        "current_affairs_important?select=id,current_affair_id,created_at&order=created_at.desc"
      );

      if (!response.ok) {
        const errorText = await response.text();

        return NextResponse.json(
          {
            error: "Important Current Affairs fetch failed",
            details: errorText,
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        data,
      });
    }

    const response = await supabaseRequest(
      "current_affairs?select=*&order=date.desc,created_at.desc"
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: "Supabase data fetch failed",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Current Affairs API failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const currentAffairId = Number(body?.current_affair_id);

    if (!currentAffairId) {
      return NextResponse.json(
        {
          error: "current_affair_id is required",
        },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      "current_affairs_important",
      {
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          current_affair_id: currentAffairId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: "Important Current Affair save failed",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Important save API failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentAffairId = Number(
      searchParams.get("current_affair_id")
    );

    if (!currentAffairId) {
      return NextResponse.json(
        {
          error: "current_affair_id is required",
        },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `current_affairs_important?current_affair_id=eq.${currentAffairId}`,
      {
        method: "DELETE",
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: "Important Current Affair remove failed",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Important remove API failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
