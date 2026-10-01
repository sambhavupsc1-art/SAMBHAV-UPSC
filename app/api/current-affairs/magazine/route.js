import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

function getISTMonth() {
  const now = new Date();

  const ist = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function isValidMonth(value) {
  return /^\d{4}-\d{2}$/.test(value);
}

function getMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  const start = `${year}-${String(monthNumber).padStart(2, "0")}-01`;

  const nextMonthDate = new Date(
    Date.UTC(year, monthNumber, 1)
  );

  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = String(
    nextMonthDate.getUTCMonth() + 1
  ).padStart(2, "0");

  const end = `${nextYear}-${nextMonth}-01`;

  return { start, end };
}

function clean(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function articleBlock(article, index) {
  const title =
    clean(article.title_hi) ||
    clean(article.title_en) ||
    clean(article.title);

  const source = clean(article.source_name);
  const date = clean(article.date);
  const gs = clean(article.gs);
  const subject = clean(article.subject);

  const why =
    clean(article.why_in_news_hi) ||
    clean(article.why_in_news_en) ||
    clean(article.why_in_news);

  const background =
    clean(article.background_hi) ||
    clean(article.background_en) ||
    clean(article.background);

  const facts =
    clean(article.key_facts_hi) ||
    clean(article.key_facts_en) ||
    clean(article.key_facts);

  const prelims =
    clean(article.prelims_hi) ||
    clean(article.prelims_en) ||
    clean(article.prelims);

  const mains =
    clean(article.mains_analysis_hi) ||
    clean(article.mains_analysis_en) ||
    clean(article.mains_analysis);

  const premium =
    clean(article.premium_fact_hi) ||
    clean(article.premium_fact_en) ||
    clean(article.premium_fact);

  const pyqs =
    clean(article.related_pyqs_hi) ||
    clean(article.related_pyqs_en) ||
    clean(article.related_pyqs);

  const mcq =
    clean(article.prelims_mcq_hi) ||
    clean(article.prelims_mcq_en) ||
    clean(article.prelims_mcq);

  const mainsQuestion =
    clean(article.mains_question_hi) ||
    clean(article.mains_question_en) ||
    clean(article.mains_question);

  const ethics =
    clean(article.ethics_angle_hi) ||
    clean(article.ethics_angle_en) ||
    clean(article.ethics_angle);

  const reportType = clean(article.report_type);
  const scheme = clean(article.government_scheme);
  const place = clean(article.important_place);
  const personality = clean(article.personalities);

  return [
    `### ${index + 1}. ${title}`,
    `Date: ${date}`,
    `GS: ${gs}`,
    `Subject: ${subject}`,
    source ? `Source: ${source}` : "",
    why ? `Why in News: ${why}` : "",
    background ? `Background: ${background}` : "",
    facts ? `Key Facts: ${facts}` : "",
    prelims ? `Prelims: ${prelims}` : "",
    mains ? `Mains Analysis: ${mains}` : "",
    premium ? `Premium Fact: ${premium}` : "",
    pyqs ? `Related PYQs: ${pyqs}` : "",
    mcq ? `Prelims MCQ: ${mcq}` : "",
    mainsQuestion
      ? `Mains Question: ${mainsQuestion}`
      : "",
    ethics ? `Ethics Angle: ${ethics}` : "",
    reportType ? `Report Type: ${reportType}` : "",
    scheme ? `Government Scheme: ${scheme}` : "",
    place ? `Important Place: ${place}` : "",
    personality
      ? `Important Personality: ${personality}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function getArticles(month) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  const { start, end } = getMonthRange(month);

  const url =
    `${supabaseUrl}/rest/v1/current_affairs` +
    `?select=*` +
    `&date=gte.${encodeURIComponent(start)}` +
    `&date=lt.${encodeURIComponent(end)}` +
    `&order=date.asc,id.asc` +
    `&limit=1000`;

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
      "MAGAZINE ARTICLES FETCH ERROR:",
      data
    );

    throw new Error(
      data?.message ||
        data?.error_description ||
        "Unable to fetch current affairs."
    );
  }

  return Array.isArray(data) ? data : [];
}

function buildMagazine(month, articles) {
  const monthLabel = new Date(
    `${month}-01T00:00:00Z`
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const allArticles = articles
    .map((article, index) =>
      articleBlock(article, index)
    )
    .join("\n\n");

  const gs1 = articles.filter((a) =>
    String(a.gs || "")
      .toUpperCase()
      .includes("GS-I")
  );

  const gs2 = articles.filter((a) =>
    String(a.gs || "")
      .toUpperCase()
      .includes("GS-II")
  );

  const gs3 = articles.filter((a) =>
    String(a.gs || "")
      .toUpperCase()
      .includes("GS-III")
  );

  const gs4 = articles.filter((a) =>
    String(a.gs || "")
      .toUpperCase()
      .includes("GS-IV")
  );

  const prelims = articles.filter(
    (a) =>
      clean(a.prelims) ||
      clean(a.prelims_hi) ||
      clean(a.prelims_en)
  );

  const reports = articles.filter(
    (a) =>
      clean(a.report_type) ||
      String(a.tags || "")
        .toLowerCase()
        .includes("report")
  );

  const schemes = articles.filter(
    (a) =>
      clean(a.government_scheme) ||
      String(a.tags || "")
        .toLowerCase()
        .includes("scheme")
  );

  const international = articles.filter(
    (a) =>
      String(a.gs || "")
        .toUpperCase()
        .includes("GS-II") ||
      String(a.subject || "")
        .toLowerCase()
        .includes("international") ||
      String(a.tags || "")
        .toLowerCase()
        .includes("international")
  );

  const places = articles.filter(
    (a) => clean(a.important_place)
  );

  const personalities = articles.filter(
    (a) => clean(a.personalities)
  );

  const premiumFacts = articles
    .map((a) =>
      clean(a.premium_fact_hi) ||
      clean(a.premium_fact_en) ||
      clean(a.premium_fact)
    )
    .filter(Boolean);

  const importantCA = articles.filter(
    (a) => a.is_important === true
  );

  const prelims100 = articles
    .flatMap((a) => {
      const value =
        clean(a.prelims_hi) ||
        clean(a.prelims_en) ||
        clean(a.prelims);

      if (!value) return [];

      return [value];
    })
    .slice(0, 100);

  const mainsThemes = articles
    .map((a) => {
      const title =
        clean(a.title_hi) ||
        clean(a.title_en) ||
        clean(a.title);

      const mains =
        clean(a.mains_analysis_hi) ||
        clean(a.mains_analysis_en) ||
        clean(a.mains_analysis);

      if (!title && !mains) return "";

      return title
        ? `${title}${mains ? ` — ${mains}` : ""}`
        : mains;
    })
    .filter(Boolean);

  const mcqs = articles
    .map((a) =>
      clean(a.prelims_mcq_hi) ||
      clean(a.prelims_mcq_en) ||
      clean(a.prelims_mcq)
    )
    .filter(Boolean);

  const mainsQuestions = articles
    .map((a) =>
      clean(a.mains_question_hi) ||
      clean(a.mains_question_en) ||
      clean(a.mains_question)
    )
    .filter(Boolean);

  const makeSection = (items) =>
    items.length
      ? items
          .map((a, index) =>
            articleBlock(a, index)
          )
          .join("\n\n")
      : "इस section के लिए इस महीने कोई article उपलब्ध नहीं है।";

  return {
    month_date: `${month}-01`,
    title: `${monthLabel} Current Affairs Magazine`,
    subtitle:
      "UPSC Prelims + Mains के लिए Monthly Current Affairs Compilation",

    overview: [
      `${monthLabel} में कुल ${articles.length} UPSC-relevant Current Affairs articles compile किए गए हैं।`,
      "",
      "इस Magazine में GS-I, GS-II, GS-III, GS-IV, Prelims, Premium Facts, Reports & Indices, Government Schemes, International Relations, Important Places, Important Personalities, Mains Themes, MCQs और Mains Questions शामिल हैं।",
    ].join("\n"),

    gs1_content: makeSection(gs1),
    gs2_content: makeSection(gs2),
    gs3_content: makeSection(gs3),
    gs4_content: makeSection(gs4),

    prelims_content: makeSection(prelims),

    premium_facts:
      premiumFacts.length
        ? premiumFacts
            .map(
              (fact, index) =>
                `${index + 1}. ${fact}`
            )
            .join("\n")
        : "इस महीने Premium Facts उपलब्ध नहीं हैं।",

    important_current_affairs:
      makeSection(importantCA),

    reports_indices:
      makeSection(reports),

    government_schemes:
      makeSection(schemes),

    international_relations:
      makeSection(international),

    important_places:
      makeSection(places),

    important_personalities:
      makeSection(personalities),

    prelims_100_facts:
      prelims100.length
        ? prelims100
            .map(
              (fact, index) =>
                `${index + 1}. ${fact}`
            )
            .join("\n")
        : "इस महीने Prelims facts उपलब्ध नहीं हैं।",

    mains_themes:
      mainsThemes.length
        ? mainsThemes
            .map(
              (theme, index) =>
                `${index + 1}. ${theme}`
            )
            .join("\n")
        : "इस महीने Mains themes उपलब्ध नहीं हैं।",

    mind_maps:
      "Mind Maps के लिए इस महीने के GS-wise Current Affairs को topic-wise revise किया जा सकता है।",

    mcqs:
      mcqs.length
        ? mcqs
            .map(
              (question, index) =>
                `${index + 1}. ${question}`
            )
            .join("\n\n")
        : "इस महीने MCQs उपलब्ध नहीं हैं।",

    mains_questions:
      mainsQuestions.length
        ? mainsQuestions
            .map(
              (question, index) =>
                `${index + 1}. ${question}`
            )
            .join("\n\n")
        : "इस महीने Mains Questions उपलब्ध नहीं हैं।",

    status: "published",
  };
}

async function deleteExistingMagazine(
  month,
  supabaseUrl,
  supabaseKey
) {
  const monthDate = `${month}-01`;

  const url =
    `${supabaseUrl}/rest/v1/current_affairs_magazines` +
    `?month_date=eq.${encodeURIComponent(monthDate)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  });

  if (!response.ok) {
    const data = await response.text();

    console.error(
      "MAGAZINE DELETE ERROR:",
      data
    );

    throw new Error(
      data || "Unable to delete existing magazine."
    );
  }
}

async function saveMagazine(magazine) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  await deleteExistingMagazine(
    magazine.month_date.substring(0, 7),
    supabaseUrl,
    supabaseKey
  );

  const url =
    `${supabaseUrl}/rest/v1/current_affairs_magazines`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(magazine),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "MAGAZINE SAVE ERROR:",
      data
    );

    throw new Error(
      data?.message ||
        data?.hint ||
        data?.details ||
        "Unable to save magazine."
    );
  }

  return Array.isArray(data)
    ? data[0]
    : data;
}

async function generateMagazine(request) {
  try {
    console.log(
      "MAGAZINE GENERATION REQUEST:",
      request.method
    );

    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "CRON_SECRET is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    let month = getISTMonth();

    if (request.method === "POST") {
      try {
        const body = await request.json();

        if (
          body?.month &&
          isValidMonth(body.month)
        ) {
          month = body.month;
        }
      } catch {
        // Empty POST body is allowed.
      }
    }

    const url = new URL(request.url);

    const queryMonth =
      url.searchParams.get("month");

    if (
      queryMonth &&
      isValidMonth(queryMonth)
    ) {
      month = queryMonth;
    }

    if (!isValidMonth(month)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid month is required in YYYY-MM format.",
        },
        { status: 400 }
      );
    }

    console.log(
      "MAGAZINE GENERATION START:",
      month
    );

    const articles =
      await getArticles(month);

    console.log(
      "MAGAZINE SOURCE ARTICLES:",
      articles.length
    );

    if (!articles.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            `No Current Affairs articles found for ${month}.`,
          month,
          articles_found: 0,
        },
        { status: 404 }
      );
    }

    const magazine =
      buildMagazine(month, articles);

    const saved =
      await saveMagazine(magazine);

    console.log(
      "MAGAZINE GENERATED:",
      month
    );

    return NextResponse.json({
      success: true,
      message:
        "Monthly Current Affairs Magazine generated successfully.",
      month,
      articles_found: articles.length,
      magazine_id: saved?.id || null,
    });
  } catch (error) {
    console.error(
      "MAGAZINE GENERATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Magazine generation failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return generateMagazine(request);
}

export async function POST(request) {
  return generateMagazine(request);
}
