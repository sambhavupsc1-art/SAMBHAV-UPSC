import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

const BATCH_SIZE = 1;

/* =========================================================
   SUPABASE
========================================================= */

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

/* =========================================================
   JSON CLEANER
========================================================= */

function cleanJson(text) {
  if (!text) {
    throw new Error(
      "Gemini returned empty response."
    );
  }

  let cleaned = String(text)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (
    first === -1 ||
    last === -1 ||
    last <= first
  ) {
    throw new Error(
      "Gemini response is not valid JSON."
    );
  }

  cleaned = cleaned.slice(
    first,
    last + 1
  );

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      `Gemini JSON parse failed: ${
        error?.message || "invalid JSON"
      }`
    );
  }
}

/* =========================================================
   GEMINI PROMPT
========================================================= */

function buildPrompt(item) {
  const isEthics =
    String(item?.report_type || "")
      .toLowerCase()
      .includes("ethics");

  const input = {
    index: 0,

    title: String(
      item?.title || ""
    ).slice(0, 500),

    date: item?.date || "",

    source_name:
      item?.source_name ||
      "Press Information Bureau (PIB)",

    source_url:
      item?.source_url || "",

    content: String(
      item?.content || ""
    ).slice(0, 14000),

    report_type:
      item?.report_type || "",

    source_type:
      item?.source_type || "",
  };

  return `
You are the UPSC Current Affairs Editor for SAMBHAV UPSC.

The backend has ALREADY selected this article as UPSC relevant.

Create EXACTLY ONE current-affairs record.

DO NOT reject it.
DO NOT skip it.
DO NOT merge it.
DO NOT create another article.

Use ONLY information supported by the supplied article.

Never invent:
- facts
- statistics
- schemes
- reports
- institutions
- places
- personalities
- PYQs

If something is not supported, return an empty string.

Generate both Hindi and English.

Hindi must be natural UPSC-standard Hindi.

English must be UPSC-standard English.

=========================================================
ARTICLE TYPE
=========================================================

${
  isEthics
    ? `
This is an ETHICS EXAMPLE.

Focus on:
- integrity
- empathy
- compassion
- courage
- public service
- civic responsibility
- leadership
- social responsibility

Only use an ethics angle when supported by the article.
`
    : `
This is a normal CURRENT AFFAIRS article.

Focus on UPSC relevance.
`
}

=========================================================
GS MAPPING
=========================================================

GS-I:
History, Art & Culture, Geography, Indian Society

GS-II:
Polity, Governance, Constitution, Social Justice,
International Relations

GS-III:
Economy, Agriculture, Environment,
Science & Technology, Internal Security,
Disaster Management

GS-IV:
Ethics, Integrity, Aptitude

Do not force GS-IV.

Do not force a government scheme.

Do not force a report.

Do not fabricate PYQs.

=========================================================
IMPORTANT DATE RULE
=========================================================

The supplied input date is authoritative.

Return EXACTLY the same date.

Do not change it.

=========================================================
REQUIRED JSON
=========================================================

{
  "articles": [
    {
      "index": 0,

      "title_hi": "",
      "title_en": "",
      "date": "",

      "gs": "",
      "subject": "",
      "paper": "",

      "source_name": "",
      "source_url": "",

      "why_in_news_hi": "",
      "why_in_news_en": "",

      "background_hi": "",
      "background_en": "",

      "key_facts_hi": "",
      "key_facts_en": "",

      "prelims_hi": "",
      "prelims_en": "",

      "mains_analysis_hi": "",
      "mains_analysis_en": "",

      "static_link": "",

      "premium_fact_hi": "",
      "premium_fact_en": "",

      "related_pyqs_hi": "",
      "related_pyqs_en": "",

      "prelims_mcq_hi": "",
      "prelims_mcq_en": "",

      "mains_question_hi": "",
      "mains_question_en": "",

      "report_type": "",
      "tags": "",
      "important_place": "",
      "personalities": "",
      "government_scheme": "",

      "ethics_angle_hi": "",
      "ethics_angle_en": ""
    }
  ]
}

=========================================================
PRELIMS MCQ
=========================================================

Create exactly ONE UPSC-style MCQ.

The MCQ must be based ONLY on facts supported by
the supplied article.

=========================================================
RELATED PYQ
=========================================================

Only provide a genuine UPSC PYQ if confidently supported.

Never fabricate a PYQ.

Otherwise return empty string.

=========================================================
PREMIUM FACT
=========================================================

Give ONE useful UPSC fact supported by the article.

=========================================================
STATIC LINK
=========================================================

Mention the relevant static UPSC topic.

=========================================================
MAINS ANALYSIS
=========================================================

Where supported, cover:

- Significance
- Implications
- Challenges
- Opportunities
- Way Forward

=========================================================
INPUT ARTICLE
=========================================================

${JSON.stringify(input)}
`;
}

/* =========================================================
   GEMINI GENERATION
========================================================= */

async function generateWithGemini(
  prompt,
  articleNumber
) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable missing."
    );
  }

  let lastError =
    "Unknown Gemini error.";

  for (const model of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {
      try {
        console.log(
          "GEMINI TRY:",
          articleNumber,
          model,
          attempt
        );

        const response =
          await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType:
                    "application/json",
                  maxOutputTokens:
                    12000,
                },
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          lastError =
            result?.error?.message ||
            `Gemini HTTP ${response.status}`;

          const retryable =
            response.status === 429 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504;

          if (
            retryable &&
            attempt < 3
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  1500 * attempt
                )
            );

            continue;
          }

          break;
        }

        const text =
          result
            ?.candidates?.[0]
            ?.content?.parts
            ?.map(
              (part) =>
                part.text || ""
            )
            .join("") || "";

        const parsed =
          cleanJson(text);

        if (
          !Array.isArray(
            parsed?.articles
          )
        ) {
          throw new Error(
            "Gemini response does not contain articles array."
          );
        }

        if (
          parsed.articles.length !== 1
        ) {
          throw new Error(
            `Gemini returned ${parsed.articles.length} articles instead of 1.`
          );
        }

        return parsed;
      } catch (error) {
        lastError =
          error?.message ||
          "Unknown Gemini error.";

        console.error(
          "GEMINI ERROR:",
          articleNumber,
          model,
          attempt,
          lastError
        );

        if (attempt < 3) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1500 * attempt
              )
          );
        }
      }
    }
  }

  throw new Error(
    `AI generation failed for article ${articleNumber}: ${lastError}`
  );
}

/* =========================================================
   NORMALIZE ARTICLE
========================================================= */

function normalizeArticle(
  article,
  input
) {
  const titleEn = String(
    article?.title_en ||
      input?.title ||
      ""
  ).trim();

  const titleHi = String(
    article?.title_hi ||
      input?.title ||
      ""
  ).trim();

  return {
    title:
      titleEn || titleHi,

    title_hi:
      titleHi,

    title_en:
      titleEn,

    date:
      input?.date ||
      article?.date ||
      new Date()
        .toISOString()
        .slice(0, 10),

    gs:
      String(
        article?.gs || ""
      ).trim(),

    subject:
      String(
        article?.subject || ""
      ).trim(),

    paper:
      String(
        article?.paper ||
          article?.gs ||
          ""
      ).trim(),

    source_name:
      String(
        input?.source_name ||
          article?.source_name ||
          ""
      ).trim(),

    source_url:
      String(
        input?.source_url ||
          article?.source_url ||
          ""
      ).trim(),

    why_in_news_hi:
      String(
        article?.why_in_news_hi ||
          ""
      ).trim(),

    why_in_news_en:
      String(
        article?.why_in_news_en ||
          ""
      ).trim(),

    background_hi:
      String(
        article?.background_hi ||
          ""
      ).trim(),

    background_en:
      String(
        article?.background_en ||
          ""
      ).trim(),

    key_facts_hi:
      String(
        article?.key_facts_hi ||
          ""
      ).trim(),

    key_facts_en:
      String(
        article?.key_facts_en ||
          ""
      ).trim(),

    prelims_hi:
      String(
        article?.prelims_hi ||
          ""
      ).trim(),

    prelims_en:
      String(
        article?.prelims_en ||
          ""
      ).trim(),

    mains_analysis_hi:
      String(
        article?.mains_analysis_hi ||
          ""
      ).trim(),

    mains_analysis_en:
      String(
        article?.mains_analysis_en ||
          ""
      ).trim(),

    static_link:
      String(
        article?.static_link ||
          ""
      ).trim(),

    premium_fact_hi:
      String(
        article?.premium_fact_hi ||
          ""
      ).trim(),

    premium_fact_en:
      String(
        article?.premium_fact_en ||
          ""
      ).trim(),

    related_pyqs_hi:
      String(
        article?.related_pyqs_hi ||
          ""
      ).trim(),

    related_pyqs_en:
      String(
        article?.related_pyqs_en ||
          ""
      ).trim(),

    prelims_mcq_hi:
      String(
        article?.prelims_mcq_hi ||
          ""
      ).trim(),

    prelims_mcq_en:
      String(
        article?.prelims_mcq_en ||
          ""
      ).trim(),

    mains_question_hi:
      String(
        article?.mains_question_hi ||
          ""
      ).trim(),

    mains_question_en:
      String(
        article?.mains_question_en ||
          ""
      ).trim(),

    report_type:
      String(
        input?.report_type ||
          article?.report_type ||
          ""
      ).trim(),

    tags:
      String(
        article?.tags || ""
      ).trim(),

    important_place:
      String(
        article?.important_place ||
          ""
      ).trim(),

    personalities:
      String(
        article?.personalities ||
          ""
      ).trim(),

    government_scheme:
      String(
        article?.government_scheme ||
          ""
      ).trim(),

    ethics_angle_hi:
      String(
        article?.ethics_angle_hi ||
          ""
      ).trim(),

    ethics_angle_en:
      String(
        article?.ethics_angle_en ||
          ""
      ).trim(),

    is_important: false,
  };
}

/* =========================================================
   DUPLICATE HELPERS
========================================================= */

const DUPLICATE_STOPWORDS =
  new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "from",
    "by",
    "at",
    "is",
    "are",
    "was",
    "were",
    "as",
    "new",
    "india",
    "indian",

    "का",
    "के",
    "की",
    "और",
    "या",
    "में",
    "से",
    "को",
    "पर",
    "एक",
    "है",
    "हैं",
    "ने",
    "द्वारा",
    "लिए",
    "यह",
    "इस",
  ]);

function normalizeTitleForDuplicate(
  value
) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /https?:\/\/\S+/g,
      " "
    )
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function duplicateTokens(value) {
  return new Set(
    normalizeTitleForDuplicate(
      value
    )
      .split(" ")
      .filter(
        (token) =>
          token.length >= 3 &&
          !DUPLICATE_STOPWORDS.has(
            token
          )
      )
  );
}

function titleSimilarity(
  first,
  second
) {
  const a =
    duplicateTokens(first);

  const b =
    duplicateTokens(second);

  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const token of a) {
    if (b.has(token)) {
      intersection++;
    }
  }

  if (!intersection) {
    return 0;
  }

  const containment =
    intersection /
    Math.min(
      a.size,
      b.size
    );

  const union =
    new Set([
      ...a,
      ...b,
    ]).size;

  const jaccard =
    intersection / union;

  return Math.max(
    containment,
    jaccard
  );
}

function isSameEvent(
  incomingTitle,
  existingTitle
) {
  const a =
    normalizeTitleForDuplicate(
      incomingTitle
    );

  const b =
    normalizeTitleForDuplicate(
      existingTitle
    );

  if (a && b && a === b) {
    return true;
  }

  return (
    titleSimilarity(
      incomingTitle,
      existingTitle
    ) >= 0.78
  );
}

/* =========================================================
   CROSS-SOURCE DUPLICATE
========================================================= */

async function findSameEventDuplicate(
  article
) {
  if (!article?.date) {
    return null;
  }

  const response =
    await supabaseRequest(
      `current_affairs?select=id,title,source_name,source_url,date&date=eq.${encodeURIComponent(
        article.date
      )}&limit=100`,
      {
        method: "GET",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Cross-source duplicate check failed: ${await response.text()}`
    );
  }

  const existing =
    await response.json();

  if (
    !Array.isArray(existing) ||
    existing.length === 0
  ) {
    return null;
  }

  for (const row of existing) {
    if (
      isSameEvent(
        article.title,
        row?.title || ""
      )
    ) {
      return {
        id: row.id,
        title: row.title || "",
        source_name:
          row.source_name || "",
        source_url:
          row.source_url || "",
        date:
          row.date || "",
      };
    }
  }

  return null;
}

/* =========================================================
   SAVE ARTICLE
========================================================= */

async function saveArticle(
  article,
  articleNumber
) {
  const response =
    await supabaseRequest(
      "current_affairs",
      {
        method: "POST",
        headers: {
          Prefer:
            "return=representation",
        },
        body:
          JSON.stringify(article),
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase save failed: ${text}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

/* =========================================================
   PROCESS ONE ARTICLE
========================================================= */

async function processArticle(
  input,
  articleNumber
) {
  const generated =
    await generateWithGemini(
      buildPrompt(input),
      articleNumber
    );

  const aiArticle =
    generated?.articles?.[0];

  if (!aiArticle) {
    throw new Error(
      `No AI article returned for article ${articleNumber}.`
    );
  }

  const article =
    normalizeArticle(
      aiArticle,
      input
    );

  if (
    !article.title_hi &&
    !article.title_en
  ) {
    throw new Error(
      `AI returned empty title for article ${articleNumber}.`
    );
  }

  /*
   * EXACT SOURCE URL + DATE DUPLICATE
   */

  if (
    article.source_url &&
    article.date
  ) {
    const response =
      await supabaseRequest(
        `current_affairs?select=id&source_url=eq.${encodeURIComponent(
          article.source_url
        )}&date=eq.${encodeURIComponent(
          article.date
        )}&limit=1`,
        {
          method: "GET",
        }
      );

    if (!response.ok) {
      throw new Error(
        `Duplicate check failed: ${await response.text()}`
      );
    }

    const duplicates =
      await response.json();

    if (
      Array.isArray(duplicates) &&
      duplicates.length > 0
    ) {
      return {
        created: 0,
        skipped: 1,
        reason:
          "same-source-url-and-date",
      };
    }
  }

  /*
   * CROSS-SOURCE SAME EVENT
   */

  const sameEvent =
    await findSameEventDuplicate(
      article
    );

  if (sameEvent) {
    return {
      created: 0,
      skipped: 1,
      reason:
        "same-event-cross-source",
      duplicate_id:
        sameEvent.id,
      duplicate_source:
        sameEvent.source_name,
    };
  }

  /*
   * SAVE
   */

  await saveArticle(
    article,
    articleNumber
  );

  return {
    created: 1,
    skipped: 0,
    reason: "created",
  };
}

/* =========================================================
   POST
========================================================= */

export async function POST(request) {
  console.log(
    "CURRENT AFFAIRS AI REQUEST START"
  );

  try {
    const body =
      await request.json();

    if (
      !Array.isArray(
        body?.items
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "items array required.",
        },
        {
          status: 400,
        }
      );
    }

    const items =
      body.items;

    if (!items.length) {
      return NextResponse.json({
        success: true,
        articles_received: 0,
        articles_created: 0,
        articles_skipped: 0,
        articles_processed: 0,
        failed_batches: 0,
        failed_articles: [],
      });
    }

    let created = 0;
    let skipped = 0;
    let failed = 0;

    const errors = [];

    for (
      let i = 0;
      i < items.length;
      i += BATCH_SIZE
    ) {
      const batch =
        items.slice(
          i,
          i + BATCH_SIZE
        );

      for (
        let j = 0;
        j < batch.length;
        j++
      ) {
        const input =
          batch[j];

        const articleNumber =
          i + j + 1;

        try {
          const result =
            await processArticle(
              input,
              articleNumber
            );

          created +=
            Number(
              result?.created || 0
            );

          skipped +=
            Number(
              result?.skipped || 0
            );
        } catch (error) {
          failed++;

          errors.push({
            article:
              articleNumber,
            title:
              input?.title || "",
            error:
              error?.message ||
              String(error),
          });

          console.error(
            "ARTICLE FAILED:",
            articleNumber,
            input?.title || "",
            error?.message ||
              error
          );
        }
      }
    }

    const processed =
      created + skipped;

    if (processed > 0) {
      return NextResponse.json({
        success: true,
        articles_received:
          items.length,
        articles_created:
          created,
        articles_skipped:
          skipped,
        articles_processed:
          processed,
        failed_batches:
          failed,
        failed_articles:
          errors,
      });
    }

    return NextResponse.json(
      {
        success: false,
        articles_received:
          items.length,
        articles_created:
          created,
        articles_skipped:
          skipped,
        articles_processed:
          processed,
        failed_batches:
          failed,
        failed_articles:
          errors,
        error:
          "No current-affairs article could be processed.",
      },
      {
        status: 503,
      }
    );
  } catch (error) {
    console.error(
      "CURRENT AFFAIRS AI FATAL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        articles_received: 0,
        articles_created: 0,
        articles_skipped: 0,
        articles_processed: 0,
        failed_batches: 1,
        error:
          error?.message ||
          "Current Affairs AI generation failed.",
      },
      {
        status: 500,
      }
    );
  }
}
