import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

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

  return JSON.parse(cleaned);
}

/* ---------------------------------------
   PROMPT
--------------------------------------- */

function buildPrompt(items) {
  const compactItems = items.map(
    (item, index) => ({
      index,

      title: String(
        item.title || ""
      ).slice(0, 500),

      date: item.date || "",

      source_name:
        item.source_name ||
        "Press Information Bureau (PIB)",

      source_url:
        item.source_url || "",

      content: String(
        item.content || ""
      ).slice(0, 12000),
    })
  );

  return `
You are the UPSC Current Affairs Editor for
SAMBHAV UPSC.

IMPORTANT TASK:

The input already contains articles that have been
selected by the backend as UPSC-relevant.

DO NOT SELECT OR FILTER ARTICLES AGAIN.

YOU MUST CREATE EXACTLY ONE CURRENT-AFFAIRS RECORD
FOR EVERY INPUT ARTICLE.

If 5 input articles are supplied, return exactly 5
article objects.

If 1 input article is supplied, return exactly 1
article object.

NEVER return fewer articles.

NEVER merge two articles.

NEVER skip an article because you think it is less
important.

The backend has already performed relevance filtering.

---------------------------------------
STRICT RULES
---------------------------------------

1. Return ONLY valid JSON.

2. Preserve the input index exactly.

3. Create exactly ONE output object for EACH input.

4. Number of output articles MUST equal number of
   input articles.

5. Use the supplied PIB article as the factual source.

6. Never invent facts.

7. Never invent statistics.

8. Never invent schemes.

9. Never invent reports.

10. Never invent institutions.

11. Never invent locations.

12. Never invent personalities.

13. Never invent PYQs.

14. If a field is not supported by the supplied
    article, return an empty string.

15. Do not reject an article.

16. Do not merge articles.

17. Do not omit articles.

18. Generate both Hindi and English.

19. Hindi must be natural UPSC-standard Hindi.

20. English must be UPSC-standard English.

21. Keep the content concise but useful.

22. Do not force GS-IV.

23. Do not force a government scheme.

24. Do not force a report.

25. Do not force a PYQ.

---------------------------------------
GS MAPPING
---------------------------------------

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

---------------------------------------
REQUIRED FIELDS
---------------------------------------

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

---------------------------------------
MAINS ANALYSIS
---------------------------------------

Where supported by the article, cover:

- Significance
- Implications
- Challenges
- Opportunities
- Way Forward

Do not invent unsupported information.

---------------------------------------
PRELIMS MCQ
---------------------------------------

Create exactly ONE UPSC-style MCQ for each article.

The MCQ must use only facts contained in that article.

---------------------------------------
RELATED PYQs
---------------------------------------

Only provide a genuine PYQ if you are confident it is
real and relevant.

Otherwise return an empty string.

Never fabricate a PYQ.

---------------------------------------
PREMIUM FACT
---------------------------------------

Give one useful UPSC fact supported by the article.

---------------------------------------
STATIC LINK
---------------------------------------

Mention the relevant static UPSC topic.

---------------------------------------
OUTPUT
---------------------------------------

Return this exact JSON structure:

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

---------------------------------------
FINAL VALIDATION
---------------------------------------

Before returning the answer:

- Count input articles.
- Count output articles.
- They MUST be identical.
- Every input index MUST appear exactly once.
- Do not skip any index.
- Do not create extra indexes.

INPUT ARTICLES:

${JSON.stringify(compactItems)}
`;
}

/* ---------------------------------------
   GEMINI REQUEST
--------------------------------------- */

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable missing."
    );
  }

  let lastError =
    "Unknown Gemini error.";

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          "GEMINI TRY:",
          model,
          "ATTEMPT:",
          attempt
        );

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
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

                maxOutputTokens: 16000,
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
            attempt,
            response.status,
            lastError
          );

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
          result?.candidates?.[0]?.content?.parts
            ?.map(
              (part) =>
                part.text || ""
            )
            .join("") || "";

        const parsed =
          cleanJson(text);

        console.log(
          "GEMINI SUCCESS:",
          model,
          attempt
        );

        return parsed;
      } catch (error) {
        lastError =
          error?.message ||
          "Unknown Gemini error.";

        console.error(
          "GEMINI MODEL ERROR:",
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
        article.subject ||
          ""
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

    is_important: false,
  };
}

/* ---------------------------------------
   SAVE ARTICLE
--------------------------------------- */

async function saveArticle(article) {
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

  return JSON.parse(text);
}

/* ---------------------------------------
   SAVE GENERATED ARTICLES
--------------------------------------- */

async function saveGeneratedArticles(
  generatedArticles,
  inputs
) {
  const generatedMap =
    new Map();

  for (
    const article of
      generatedArticles
  ) {
    const index =
      Number(article?.index);

    if (
      Number.isInteger(index)
    ) {
      generatedMap.set(
        index,
        article
      );
    }
  }

  const missingIndexes = [];

  for (
    let i = 0;
    i < inputs.length;
    i++
  ) {
    if (
      !generatedMap.has(i)
    ) {
      missingIndexes.push(i);
    }
  }

  if (
    missingIndexes.length
  ) {
    throw new Error(
      `AI omitted articles. Missing indexes: ${missingIndexes.join(
        ", "
      )}`
    );
  }

  let created = 0;

  for (
    let i = 0;
    i < inputs.length;
    i++
  ) {
    const input =
      inputs[i];

    const aiArticle =
      generatedMap.get(i);

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
        `AI returned empty title for article index ${i}.`
      );
    }

    /*
     * Always preserve original PIB URL.
     */

    if (
      !article.source_url
    ) {
      article.source_url =
        input.source_url ||
        "";
    }

    /*
     * IMPORTANT FIX:
     *
     * Duplicate check is now
     * source_url + date.
     *
     * Same PIB URL on a NEW DATE
     * is allowed as a new article.
     *
     * Same URL on the SAME DATE
     * is skipped.
     */

    if (
      article.source_url &&
      article.date
    ) {
      const encodedUrl =
        encodeURIComponent(
          article.source_url
        );

      const encodedDate =
        encodeURIComponent(
          article.date
        );

      const duplicateResponse =
        await supabaseRequest(
          `current_affairs?select=id&source_url=eq.${encodedUrl}&date=eq.${encodedDate}&limit=1`,
          {
            method: "GET",
          }
        );

      if (
        duplicateResponse.ok
      ) {
        const duplicates =
          await duplicateResponse.json();

        if (
          Array.isArray(
            duplicates
          ) &&
          duplicates.length > 0
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
      i,
      article.title_en
    );
  }

  return created;
}

/* ---------------------------------------
   POST
--------------------------------------- */

export async function POST(request) {
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

    if (
      items.length === 0
    ) {
      return NextResponse.json({
        success: true,
        articles_received: 0,
        articles_created: 0,
        failed_batches: 0,
      });
    }

    console.log(
      "CURRENT AFFAIRS AI START:",
      items.length,
      "articles"
    );

    let created = 0;
    let failedBatches = 0;

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
            buildPrompt(
              batch
            )
          );

        const generatedArticles =
          Array.isArray(
            generated?.articles
          )
            ? generated.articles
            : [];

        if (
          generatedArticles.length !==
          batch.length
        ) {
          throw new Error(
            `Gemini returned ${generatedArticles.length} articles for ${batch.length} inputs.`
          );
        }

        const batchCreated =
          await saveGeneratedArticles(
            generatedArticles,
            batch
          );

        created +=
          batchCreated;

        console.log(
          "AI BATCH COMPLETE:",
          start + 1,
          "-",
          start +
            batch.length,
          "| CREATED:",
          batchCreated
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

    /*
     * IMPORTANT:
     *
     * success=true only when
     * every received article has
     * been created.
     */

    if (
      failedBatches > 0 ||
      created < items.length
    ) {
      console.error(
        "CURRENT AFFAIRS AI INCOMPLETE:",
        {
          received:
            items.length,
          created,
          failedBatches,
        }
      );

      return NextResponse.json(
        {
          success: false,

          articles_received:
            items.length,

          articles_created:
            created,

          failed_batches:
            failedBatches,

          error:
            `AI processing incomplete: ${created}/${items.length} articles created.`,
        },
        {
          status: 503,
        }
      );
    }

    console.log(
      "CURRENT AFFAIRS AI COMPLETE:",
      {
        received:
          items.length,
        created,
        failedBatches,
      }
    );

    return NextResponse.json({
      success: true,

      articles_received:
        items.length,

      articles_created:
        created,

      failed_batches: 0,
    });
  } catch (error) {
    console.error(
      "Current Affairs AI ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        articles_received: 0,

        articles_created: 0,

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
