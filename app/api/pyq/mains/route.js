import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const paper =
      searchParams.get("paper");

    const year =
      searchParams.get("year");

    let url =
      `${SUPABASE_URL}/rest/v1/mains_pyqs` +
      `?select=*` +
      `&order=year.desc,id.asc`;

    if (
      paper &&
      paper !== "All"
    ) {
      url += `&paper=eq.${encodeURIComponent(
        paper
      )}`;
    }

    if (
      year &&
      year !== "All"
    ) {
      url += `&year=eq.${encodeURIComponent(
        year
      )}`;
    }

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization:
          `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Mains PYQ fetch error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Mains PYQ data fetch failed",
        },
        { status: 500 }
      );
    }

    const pyqs =
      await response.json();

    return NextResponse.json({
      pyqs,
    });
  } catch (error) {
    console.error(
      "Mains PYQ API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
