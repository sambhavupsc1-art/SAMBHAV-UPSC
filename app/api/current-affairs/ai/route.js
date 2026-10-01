import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

/*
  Gemini fallback order.
  One batch = maximum 5 articles.
*/
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

const BATCH_SIZE = 5;

/* ---------------------------------------
   SUPABASE
--------------------------------------- */

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
   JSON CLEANER
--------------------------------------- */

function cleanJson(text) {
  if (!text) {
    throw new Error(
      "Gemini returned empty response."
    );
  }

  let cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const first =
    cleaned.indexOf("{");

  const last =
    cleaned.lastIndexOf("}");

  if (
    first === -1 ||
    last === -1
  ) {
    throw new Error(
      "Gemini response is not valid JSON."
    );
  }

  return JSON.parse(
    cleaned.slice(
      first,
      last + 1
    )
  );
}

/* ---------------------------------------
   UPSC AI PROMPT
--------------------------------------- */

function buildPrompt(items) {
  const compactItems =
    items.map(
      (item, index) => ({
        index,

        title:
          String(
            item.title || ""
          ).slice(0, 500),

        date:
          item.date || "",

        source_name:
          item.source_name ||
          "Press Information Bureau (PIB)",

        source_url:
          item.source_url || "",

        content:
          String(
            item.content || ""
          ).slice(0, 9000),
      })
    );

  return `
You are the UPSC Current Affairs Editor for SAMBHAV UPSC.

Create ONE structured bilingual UPSC current-affairs record for EACH supplied PIB article.

STRICT RULES:

1. Return ONLY valid JSON.
2. Preserve the input index exactly.
3. Generate BOTH Hindi and English.
4. Hindi must be natural UPSC-standard Hindi.
5. English must be UPSC-standard English.
6. Use ONLY information supported by the supplied PIB article.
7. Never invent facts.
8. Never invent statistics.
9. Never invent schemes.
10. Never invent reports.
11. Never invent PYQs.
12. If information is unavailable, return an empty string.
13. Keep content concise but useful.
14. Do not force GS-IV.
15. Do not force a government scheme.
16. Do not force a report.
17. Do not force a PYQ.

GS MAPPING:

GS-I:
History, Art & Culture, Geography, Indian Society

GS-II:
Polity, Governance, Constitution, Social Justice, International Relations

GS-III:
Economy, Agriculture, Environment, Science & Technology,
Internal Security, Disaster Management

GS-IV:
Ethics, Integrity, Aptitude

FIELDS REQUIRED:

index
title_hi
title_en
date
gs
subject
paper
source_name
source_url

why_in_news_hi
why_in_news_en

background_hi
background_en

key_facts_hi
key_facts_en

prelims_hi
prelims_en

mains_analysis_hi
mains_analysis_en

static_link

premium_fact_hi
premium_fact_en

related_pyqs_hi
related_pyqs_en

prelims_mcq_hi
prelims_mcq_en

mains_question_hi
mains_question_en

report_type
tags
important_place
personalities
government_scheme

ethics_angle_hi
ethics_angle_en


MAINS ANALYSIS:

Where supported, cover:

- Significance
- Implications
- Challenges
- Opportunities
- Way Forward

Do NOT invent any of these.


PRELIMS MCQ:

Create exactly ONE UPSC-style MCQ from the supplied article.

The MCQ must be based only on supplied facts.


RELATED PYQS:

Only provide a genuine PYQ if you are confident it is real and relevant.

Otherwise return "".


STATIC LINK:

Mention the relevant static UPSC topic.


PREMIUM FACT:

Give one genuinely useful fact supported by the supplied article.


OUTPUT FORMAT:

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


INPUT ARTICLES:

${JSON.stringify(
    compactItems
  )}
`;
}

/* ---------------------------------------
   GEMINI GENERATION
--------------------------------------- */

async function generateWithGemini(
  prompt
) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable missing."
    );
  }

  let lastError = "";

  for (
    const model of GEMINI_MODELS
  ) {
    try {
      console.log(
        "GEMINI TRY:",
        model
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
                temperature: 0.15,

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

        console.error(
          "GEMINI ERROR:",
          model,
          response.status,
          lastError
        );

        /*
          Do NOT retry the same model.
          Immediately move to fallback model.
        */
        continue;
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

      console.log(
        "GEMINI SUCCESS:",
        model
      );

      return parsed;

    } catch (error) {
      lastError =
        error?.message ||
        "Unknown Gemini error";

      console.error(
        "GEMINI MODEL FAILED:",
        model,
        lastError
      );
    }
  }

  throw new Error(
    `AI generation failed. ${lastError}`
  );
}

/* ---------------------------------------
   NORMALIZE ARTICLE
--------------------------------------- */

function normalizeArticle(
  article,
  input
) {
  return {
    title:
      article.title_hi ||
      article.title_en ||
      input.title ||
      "",

    title_hi:
      String(
        article.title_hi ||
          input.title ||
          ""
      ).trim(),

    title_en:
      String(
        article.title_en ||
          input.title ||
          ""
      ).trim(),

    date:
      article.date ||
      input.date ||
      new Date()
        .toISOString()
        .slice(0, 10),

    gs:
      String(
        article.gs || ""
      ).trim(),

    subject:
      String(
        article.subject || ""
      ).trim(),

    paper:
      String(
        article.paper ||
          article.gs ||
          ""
      ).trim(),

    source_name:
      String(
        article.source_name ||
          input.source_name ||
          ""
      ).trim(),

    source_url:
      String(
        article.source_url ||
          input.source_url ||
          ""
      ).trim(),

    why_in_news_hi:
      String(
        article.why_in_news_hi ||
          ""
      ).trim(),

    why_in_news_en:
      String(
        article.why_in_news_en ||
          ""
      ).trim(),

    background_hi:
      String(
        article.background_hi ||
          ""
      ).trim(),

    background_en:
      String(
        article.background_en ||
          ""
      ).trim(),

    key_facts_hi:
      String(
        article.key_facts_hi ||
          ""
      ).trim(),

    key_facts_en:
      String(
        article.key_facts_en ||
          ""
      ).trim(),

    prelims_hi:
      String(
        article.prelims_hi ||
          ""
      ).trim(),

    prelims_en:
      String(
        article.prelims_en ||
          ""
      ).trim(),

    mains_analysis_hi:
      String(
        article.mains_analysis_hi ||
          ""
      ).trim(),

    mains_analysis_en:
      String(
        article.mains_analysis_en ||
          ""
      ).trim(),

    static_link:
      String(
        article.static_link ||
          ""
      ).trim(),

    premium_fact_hi:
      String(
        article.premium_fact_hi ||
          ""
      ).trim(),

    premium_fact_en:
      String(
        article.premium_fact_en ||
          ""
      ).trim(),

    related_pyqs_hi:
      String(
        article.related_pyqs_hi ||
          ""
      ).trim(),

    related_pyqs_en:
      String(
        article.related_pyqs_en ||
          ""
      ).trim(),

    prelims_mcq_hi:
      String(
        article.prelims_mcq_hi ||
          ""
      ).trim(),

    prelims_mcq_en:
      String(
        article.prelims_mcq_en ||
          ""
      ).trim(),

    mains_question_hi:
      String(
        article.mains_question_hi ||
          ""
      ).trim(),

    mains_question_en:
      String(
        article.mains_question_en ||
          ""
      ).trim(),

    report_type:
      String(
        article.report_type ||
          ""
      ).trim(),

    tags:
      String(
        article.tags || ""
      ).trim(),

    important_place:
      String(
        article.important_place ||
          ""
      ).trim(),

    personalities:
      String(
        article.personalities ||
          ""
      ).trim(),

    government_scheme:
      String(
        article.government_scheme ||
          ""
      ).trim(),

    ethics_angle_hi:
      String(
        article.ethics_angle_hi ||
          ""
      ).trim(),

    ethics_angle_en:
      String(
        article.ethics_angle_en ||
          ""
      ).trim(),

    is_important:
      false,
  };
}

/* ---------------------------------------
   SAVE ARTICLE
--------------------------------------- */

async function saveArticle(
  article
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
          JSON.stringify(
            article
          ),
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase save failed: ${text}`
    );
  }

  return JSON.parse(
    text
  );
}

/* ---------------------------------------
   SAVE GENERATED ARTICLES
--------------------------------------- */

async function saveGeneratedArticles(
  generatedArticles,
  inputs
) {
  let created = 0;

  for (
    let i = 0;
    i < inputs.length;
    i++
  ) {
    const input =
      inputs[i];

    const aiArticle =
      generatedArticles.find(
        (article) =>
          Number(
            article.index
          ) === i
      ) ||
      generatedArticles[i];

    if (!aiArticle) {
      console.error(
        "AI ARTICLE MISSING:",
        i,
        input.title
      );

      continue;
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
      continue;
    }

    /*
      Duplicate protection
      using PIB source URL.
    */

    if (
      article.source_url
    ) {
      const encodedUrl =
        encodeURIComponent(
          article.source_url
        );

      const duplicateResponse =
        await supabaseRequest(
          `current_affairs?select=id&source_url=eq.${encodedUrl}&limit=1`
        );

      if (
        duplicateResponse.ok
      ) {
        const duplicates =
          await duplicateResponse.json();

        if (
          duplicates.length
        ) {
          console.log(
            "DUPLICATE SKIPPED:",
            article.title_en
          );

          continue;
        }
      }
    }

    await saveArticle(
      article
    );

    created++;

    console.log(
      "ARTICLE SAVED:",
      article.title_en
    );
  }

  return created;
}

/* ---------------------------------------
   POST
--------------------------------------- */

export async function POST(
  request
) {
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
      });
    }

    let created = 0;
    let failedBatches = 0;

    /*
      IMPORTANT:
      Cron sends 10 articles.
      This route processes them
      as 5 + 5.
    */

    for (
      let start = 0;
      start < items.length;
      start += BATCH_SIZE
    ) {
      const batch =
        items.slice(
          start,
          start + BATCH_SIZE
        );

      console.log(
        "AI BATCH START:",
        start + 1,
        "-",
        start +
          batch.length,
        "of",
        items.length
      );

      try {
        const generated =
          await generateWithGemini(
            buildPrompt(batch)
          );

        const generatedArticles =
          Array.isArray(
            generated?.articles
          )
            ? generated.articles
            : [];

        created +=
          await saveGeneratedArticles(
            generatedArticles,
            batch
          );

        console.log(
          "AI BATCH COMPLETE:",
          start + 1,
          "-",
          start +
            batch.length
        );

      } catch (error) {
        failedBatches++;

        console.error(
          "AI BATCH FAILED:",
          start + 1,
          "-",
          start +
            batch.length,
          error?.message ||
            error
        );
      }
    }

    return NextResponse.json({
      success: true,

      articles_received:
        items.length,

      articles_created:
        created,

      failed_batches:
        failedBatches,
    });

  } catch (error) {
    console.error(
      "Current Affairs batch AI error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

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
