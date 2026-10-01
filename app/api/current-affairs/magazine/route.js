import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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

    const supabase = getSupabase();

    const monthDate = `${month}-01`;

    const { data, error } = await supabase
      .from("current_affairs_magazines")
      .select("*")
      .eq("month_date", monthDate)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("MAGAZINE GET ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message || "Magazine fetch failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error("MAGAZINE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Magazine API failed.",
      },
      { status: 500 }
    );
  }
}
