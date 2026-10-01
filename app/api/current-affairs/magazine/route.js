import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month || !isValidMonth(month)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid month is required in YYYY-MM format.",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const monthDate = `${month}-01`;

    const url =
      `${supabaseUrl}/rest/v1/current_affairs_magazines` +
      `?select=*` +
      `&month_date=eq.${encodeURIComponent(monthDate)}` +
      `&status=eq.published` +
      `&limit=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "MAGAZINE SUPABASE ERROR:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          error:
            data?.message ||
            data?.error_description ||
            "Magazine fetch failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data:
        Array.isArray(data) && data.length > 0
          ? data[0]
          : null,
    });
  } catch (error) {
    console.error(
      "MAGAZINE API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Magazine API failed.",
      },
      { status: 500 }
    );
  }
}
