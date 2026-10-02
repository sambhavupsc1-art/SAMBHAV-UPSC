import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase environment variables missing."
    );
  }

  return fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );
}

/* ---------------------------------------
   GET
   Current Affairs load
--------------------------------------- */

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const mode =
      searchParams.get("mode") || "";

    /* -----------------------------------
       IMPORTANT CURRENT AFFAIRS
    ----------------------------------- */

    if (mode === "important") {
      const response =
        await supabaseRequest(
          "current_affairs_important?select=*&order=created_at.desc"
        );

      const text =
        await response.text();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Important Current Affairs load failed.",
            details: text,
          },
          {
            status: response.status,
          }
        );
      }

      let data = [];

      try {
        data = text
          ? JSON.parse(text)
          : [];
      } catch {
        data = [];
      }

      return NextResponse.json({
        success: true,
        data,
      });
    }

    /* -----------------------------------
       ALL CURRENT AFFAIRS
    ----------------------------------- */

    const response =
      await supabaseRequest(
        "current_affairs?select=*&order=date.desc,created_at.desc"
      );

    const text =
      await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Current Affairs load failed.",
          details: text,
        },
        {
          status: response.status,
        }
      );
    }

    let data = [];

    try {
      data = text
        ? JSON.parse(text)
        : [];
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase returned invalid JSON.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "CURRENT AFFAIRS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Current Affairs API failed.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ---------------------------------------
   POST
   Save Current Affair as Important
--------------------------------------- */

export async function POST(request) {
  try {
    const body =
      await request.json();

    const currentAffairId = Number(
      body?.current_affair_id
    );

    if (
      !Number.isInteger(
        currentAffairId
      ) ||
      currentAffairId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid current_affair_id is required.",
        },
        {
          status: 400,
        }
      );
    }

    const response =
      await supabaseRequest(
        "current_affairs_important",
        {
          method: "POST",
          headers: {
            Prefer:
              "return=representation,resolution=ignore-duplicates",
          },
          body: JSON.stringify({
            current_affair_id:
              currentAffairId,
          }),
        }
      );

    const text =
      await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Important Current Affair save failed.",
          details: text,
        },
        {
          status: response.status,
        }
      );
    }

    let data = [];

    try {
      data = text
        ? JSON.parse(text)
        : [];
    } catch {
      data = [];
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "CURRENT AFFAIRS IMPORTANT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Important save failed.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ---------------------------------------
   DELETE
   Remove Current Affair from Important
--------------------------------------- */

export async function DELETE(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const currentAffairId = Number(
      searchParams.get(
        "current_affair_id"
      )
    );

    if (
      !Number.isInteger(
        currentAffairId
      ) ||
      currentAffairId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid current_affair_id is required.",
        },
        {
          status: 400,
        }
      );
    }

    const response =
      await supabaseRequest(
        `current_affairs_important?current_affair_id=eq.${currentAffairId}`,
        {
          method: "DELETE",
          headers: {
            Prefer:
              "return=representation",
          },
        }
      );

    const text =
      await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Important Current Affair remove failed.",
          details: text,
        },
        {
          status: response.status,
        }
      );
    }

    let data = [];

    try {
      data = text
        ? JSON.parse(text)
        : [];
    } catch {
      data = [];
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "CURRENT AFFAIRS IMPORTANT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Important remove failed.",
      },
      {
        status: 500,
      }
    );
  }
}
