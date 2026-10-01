import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const CRON_SECRET =
  process.env.CRON_SECRET;

/* ---------------------------------------
   SUPABASE
--------------------------------------- */

async function supabaseRequest(
  path,
  options = {}
) {
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
        Authorization:
          `Bearer ${SUPABASE_KEY}`,
        "Content-Type":
          "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );
}

/* ---------------------------------------
   MONTH
--------------------------------------- */

function validMonth(value) {
  return /^\d{4}-\d{2}$/.test(value);
}

function monthRange(month) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  const start =
    `${year}-${String(monthNumber).padStart(
      2,
      "0"
    )}-01`;

  const nextYear =
    monthNumber === 12
      ? year + 1
      : year;

  const nextMonth =
    monthNumber === 12
      ? 1
      : monthNumber + 1;

  const end =
    `${nextYear}-${String(nextMonth).padStart(
      2,
      "0"
    )}-01`;

  return {
    start,
    end,
  };
}

/* ---------------------------------------
   TEXT
--------------------------------------- */

function clean(value = "") {
  return String(value)
    .replace(/\r/g, "")
    .trim();
}

function titleOf(item) {
  return (
    clean(item.title_hi) ||
    clean(item.title_en) ||
    clean(item.title) ||
    "Current Affair"
  );
}

function factOf(item) {
  return (
    clean(item.premium_fact_hi) ||
    clean(item.premium_fact_en) ||
    clean(item.premium_fact) ||
    ""
  );
}

/* ---------------------------------------
   ARTICLE FORMATTER
--------------------------------------- */

function articleBlock(item) {
  const title =
    titleOf(item);

  const fact =
    factOf(item);

  const keyFacts =
    clean(item.key_facts_hi) ||
    clean(item.key_facts_en) ||
    clean(item.key_facts);

  const prelims =
    clean(item.prelims_hi) ||
    clean(item.prelims_en) ||
    clean(item.prelims);

  const mains =
    clean(item.mains_analysis_hi) ||
    clean(item.mains_analysis_en) ||
    clean(item.mains_analysis);

  const source =
    clean(item.source_name);

  const date =
    clean(item.date);

  const lines = [
    `• ${title}`,
  ];

  if (fact) {
    lines.push(
      `Fact: ${fact}`
    );
  }

  if (keyFacts) {
    lines.push(
      `Key Facts: ${keyFacts}`
    );
  }

  if (prelims) {
    lines.push(
      `Prelims: ${prelims}`
    );
  }

  if (mains) {
    lines.push(
      `Mains: ${mains}`
    );
  }

  if (source) {
    lines.push(
      `Source: ${source}${date ? ` | ${date}` : ""}`
    );
  }

  return lines.join("\n");
}

/* ---------------------------------------
   GROUP
--------------------------------------- */

function byGS(
  articles,
  gs
) {
  return articles.filter(
    (item) =>
      String(
        item.gs || item.paper || ""
      )
        .toUpperCase()
        .includes(gs)
  );
}

function buildGSContent(
  articles,
  gs
) {
  const items =
    byGS(articles, gs);

  if (!items.length) {
    return "";
  }

  return items
    .map(articleBlock)
    .join("\n\n");
}

/* ---------------------------------------
   PRELIMS
--------------------------------------- */

function buildPrelims(
  articles
) {
  const items =
    articles.filter(
      (item) =>
        item.prelims ||
        item.prelims_hi ||
        item.prelims_en ||
        item.prelims_mcq ||
        item.prelims_mcq_hi ||
        item.prelims_mcq_en
    );

  return items
    .map((item) => {
      const title =
        titleOf(item);

      const prelims =
        clean(item.prelims_hi) ||
        clean(item.prelims_en) ||
        clean(item.prelims);

      const mcq =
        clean(item.prelims_mcq_hi) ||
        clean(item.prelims_mcq_en) ||
        clean(item.prelims_mcq);

      return [
        `• ${title}`,
        prelims
          ? `Fact: ${prelims}`
          : "",
        mcq
          ? `MCQ: ${mcq}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

/* ---------------------------------------
   PREMIUM FACTS
--------------------------------------- */

function buildPremiumFacts(
  articles
) {
  return articles
    .filter(
      (item) =>
        factOf(item)
    )
    .map((item) => {
      const fact =
        factOf(item);

      const title =
        titleOf(item);

      return `• ${fact}\n  — ${title}`;
    })
    .join("\n\n");
}

/* ---------------------------------------
   IMPORTANT CURRENT AFFAIRS
--------------------------------------- */

function buildImportant(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.is_important === true
    )
    .map(articleBlock)
    .join("\n\n");
}

/* ---------------------------------------
   REPORTS
--------------------------------------- */

function buildReports(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.report_type ||
        /report|index|survey|ranking|indicator/i.test(
          `${item.tags || ""} ${
            item.subject || ""
          }`
        )
    )
    .map((item) => {
      const title =
        titleOf(item);

      const type =
        clean(item.report_type);

      const facts =
        clean(item.key_facts_hi) ||
        clean(item.key_facts_en) ||
        clean(item.key_facts);

      return [
        `• ${title}`,
        type
          ? `Type: ${type}`
          : "",
        facts
          ? `Key Facts: ${facts}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

/* ---------------------------------------
   SCHEMES
--------------------------------------- */

function buildSchemes(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.government_scheme ||
        /scheme|yojana|mission|programme|program/i.test(
          `${item.tags || ""} ${
            item.subject || ""
          }`
        )
    )
    .map((item) => {
      const title =
        titleOf(item);

      const scheme =
        clean(
          item.government_scheme
        );

      const facts =
        clean(item.key_facts_hi) ||
        clean(item.key_facts_en) ||
        clean(item.key_facts);

      return [
        `• ${title}`,
        scheme
          ? `Scheme: ${scheme}`
          : "",
        facts
          ? `Key Facts: ${facts}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

/* ---------------------------------------
   IR
--------------------------------------- */

function buildIR(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.gs === "GS-II" ||
        item.paper === "GS-II" ||
        /international|bilateral|multilateral|foreign|g20|un |summit|treaty|agreement/i.test(
          `${item.title || ""} ${
            item.title_en || ""
          } ${item.tags || ""}`
        )
    )
    .map(articleBlock)
    .join("\n\n");
}

/* ---------------------------------------
   PLACES
--------------------------------------- */

function buildPlaces(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.important_place
    )
    .map(
      (item) =>
        `• ${item.important_place}\n  ${titleOf(
          item
        )}`
    )
    .join("\n\n");
}

/* ---------------------------------------
   PERSONALITIES
--------------------------------------- */

function buildPersonalities(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.personalities
    )
    .map(
      (item) =>
        `• ${item.personalities}\n  ${titleOf(
          item
        )}`
    )
    .join("\n\n");
}

/* ---------------------------------------
   100 PRELIMS FACTS
--------------------------------------- */

function build100Facts(
  articles
) {
  const facts = [];

  for (
    const item of articles
  ) {
    const fact =
      factOf(item);

    if (!fact) {
      continue;
    }

    facts.push(
      fact
    );

    if (
      facts.length >= 100
    ) {
      break;
    }
  }

  return facts
    .map(
      (fact, index) =>
        `${index + 1}. ${fact}`
    )
    .join("\n");
}

/* ---------------------------------------
   MAINS THEMES
--------------------------------------- */

function buildMainsThemes(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.mains_analysis ||
        item.mains_analysis_hi ||
        item.mains_analysis_en ||
        item.mains_question ||
        item.mains_question_hi ||
        item.mains_question_en
    )
    .map((item) => {
      const title =
        titleOf(item);

      const analysis =
        clean(
          item.mains_analysis_hi
        ) ||
        clean(
          item.mains_analysis_en
        ) ||
        clean(
          item.mains_analysis
        );

      const question =
        clean(
          item.mains_question_hi
        ) ||
        clean(
          item.mains_question_en
        ) ||
        clean(
          item.mains_question
        );

      return [
        `• ${title}`,
        analysis
          ? `Analysis: ${analysis}`
          : "",
        question
          ? `Question: ${question}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

/* ---------------------------------------
   MIND MAPS
--------------------------------------- */

function buildMindMaps(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.gs ||
        item.subject
    )
    .map((item) => {
      const title =
        titleOf(item);

      const gs =
        item.gs ||
        item.paper ||
        "UPSC";

      const subject =
        item.subject ||
        "Current Affairs";

      return [
        `• ${title}`,
        `GS: ${gs}`,
        `Subject: ${subject}`,
        "→ Background → Significance → Challenges → Way Forward",
      ].join("\n");
    })
    .join("\n\n");
}

/* ---------------------------------------
   MCQs
--------------------------------------- */

function buildMCQs(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.prelims_mcq ||
        item.prelims_mcq_hi ||
        item.prelims_mcq_en
    )
    .map((item, index) => {
      const mcq =
        clean(
          item.prelims_mcq_hi
        ) ||
        clean(
          item.prelims_mcq_en
        ) ||
        clean(
          item.prelims_mcq
        );

      return `${index + 1}. ${mcq}`;
    })
    .join("\n\n");
}

/* ---------------------------------------
   MAINS QUESTIONS
--------------------------------------- */

function buildMainsQuestions(
  articles
) {
  return articles
    .filter(
      (item) =>
        item.mains_question ||
        item.mains_question_hi ||
        item.mains_question_en
    )
    .map((item, index) => {
      const question =
        clean(
          item.mains_question_hi
        ) ||
        clean(
          item.mains_question_en
        ) ||
        clean(
          item.mains_question
        );

      return `${index + 1}. ${question}`;
    })
    .join("\n\n");
}

/* ---------------------------------------
   MAGAZINE OBJECT
--------------------------------------- */

function buildMagazine(
  month,
  articles
) {
  const [
    year,
    monthNumber,
  ] = month.split("-");

  const monthName =
    new Date(
      Number(year),
      Number(monthNumber) - 1,
      1
    ).toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );

  return {
    month_date:
      `${month}-01`,

    title:
      `SAMBHAV UPSC — ${monthName} Monthly Current Affairs`,

    subtitle:
      `${articles.length} UPSC-relevant current affairs compiled for monthly revision.`,

    overview:
      `This monthly magazine compiles the UPSC-relevant Current Affairs collected during ${monthName}. It is organised paper-wise and topic-wise for Prelims and Mains revision.`,

    gs1_content:
      buildGSContent(
        articles,
        "GS-I"
      ),

    gs2_content:
      buildGSContent(
        articles,
        "GS-II"
      ),

    gs3_content:
      buildGSContent(
        articles,
        "GS-III"
      ),

    gs4_content:
      buildGSContent(
        articles,
        "GS-IV"
      ),

    prelims_content:
      buildPrelims(
        articles
      ),

    premium_facts:
      buildPremiumFacts(
        articles
      ),

    important_current_affairs:
      buildImportant(
        articles
      ),

    reports_indices:
      buildReports(
        articles
      ),

    government_schemes:
      buildSchemes(
        articles
      ),

    international_relations:
      buildIR(
        articles
      ),

    important_places:
      buildPlaces(
        articles
      ),

    important_personalities:
      buildPersonalities(
        articles
      ),

    prelims_100_facts:
      build100Facts(
        articles
      ),

    mains_themes:
      buildMainsThemes(
        articles
      ),

    mind_maps:
      buildMindMaps(
        articles
      ),

    mcqs:
      buildMCQs(
        articles
      ),

    mains_questions:
      buildMainsQuestions(
        articles
      ),

    status:
      "published",
  };
}

/* ---------------------------------------
   GET MONTH ARTICLES
--------------------------------------- */

async function getArticles(
  month
) {
  const {
    start,
    end,
  } = monthRange(month);

  const path =
    `current_affairs?select=*` +
    `&date=gte.${start}` +
    `&date=lt.${end}` +
    `&order=date.asc` +
    `&limit=1000`;

  const response =
    await supabaseRequest(
      path
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Current Affairs fetch failed: ${text}`
    );
  }

  return JSON.parse(
    text
  );
}

/* ---------------------------------------
   SAVE MAGAZINE
--------------------------------------- */

async function saveMagazine(
  magazine
) {
  /*
   * Delete the old version first.
   * This makes regeneration safe.
   */

  const deleteResponse =
    await supabaseRequest(
      `current_affairs_magazines?month_date=eq.${encodeURIComponent(
        magazine.month_date
      )}`,
      {
        method: "DELETE",
      }
    );

  if (
    !deleteResponse.ok
  ) {
    throw new Error(
      `Old magazine removal failed: ${await deleteResponse.text()}`
    );
  }

  const response =
    await supabaseRequest(
      "current_affairs_magazines",
      {
        method: "POST",
        headers: {
          Prefer:
            "return=representation",
        },
        body:
          JSON.stringify(
            magazine
          ),
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Magazine save failed: ${text}`
    );
  }

  const data =
    JSON.parse(text);

  return Array.isArray(data)
    ? data[0]
    : data;
}

/* ---------------------------------------
   POST
--------------------------------------- */

export async function POST(
  request
) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRON_SECRET environment variable missing.",
        },
        {
          status: 500,
        }
      );
    }

    const auth =
      request.headers.get(
        "authorization"
      );

    if (
      auth !==
      `Bearer ${CRON_SECRET}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json().catch(
        () => ({})
      );

    const currentMonth =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
        }
      ).format(
        new Date()
      );

    const month =
      body?.month ||
      currentMonth;

    if (
      !validMonth(month)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Month must be YYYY-MM.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "MAGAZINE GENERATION START:",
      month
    );

    const articles =
      await getArticles(
        month
      );

    console.log(
      "MAGAZINE SOURCE ARTICLES:",
      articles.length
    );

    if (!articles.length) {
      return NextResponse.json({
        success: true,
        month,
        articles_used: 0,
        magazine_created: false,
        message:
          "No Current Affairs found for this month.",
      });
    }

    const magazine =
      buildMagazine(
        month,
        articles
      );

    const saved =
      await saveMagazine(
        magazine
      );

    console.log(
      "MAGAZINE GENERATED:",
      month,
      saved?.id
    );

    return NextResponse.json({
      success: true,
      month,
      articles_used:
        articles.length,
      magazine_created:
        true,
      magazine_id:
        saved?.id || null,
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
      {
        status: 500,
      }
    );
  }
}
