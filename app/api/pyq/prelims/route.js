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

    const subject =
      searchParams.get("subject");

    const year =
      searchParams.get("year");

    let url =
      `${SUPABASE_URL}/rest/v1/prelims_pyqs` +
      `?select=*` +
      `&order=year.desc,id.asc`;

    if (
      subject &&
      subject !== "All"
    ) {
      url += `&subject=eq.${encodeURIComponent(
        subject
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
        "Prelims PYQ fetch error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "PYQ data fetch failed",
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
      "Prelims PYQ API error:",
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
