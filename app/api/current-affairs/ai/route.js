import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables missing.");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function cleanJson(text) {
  if (!text) {
    throw new Error("Gemini returned empty response.");
  }

  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("Gemini response is not valid JSON.");
  }

  return JSON.parse(cleaned.slice(first, last + 1));
}

function buildPrompt(items) {
  return `
You are the UPSC Current Affairs Editor for SAMBHAV UPSC.

You will receive multiple PIB news articles.

Generate a structured bilingual UPSC current-affairs entry for EVERY article.

IMPORTANT RULES:

1. Generate BOTH Hindi and English.
2. Hindi must be natural UPSC-standard Hindi.
3. English must be UPSC-standard English.
4. Do NOT invent facts.
5. Do NOT invent statistics.
6. Do NOT invent PYQs.
7. Use only information supported by the supplied PIB article.
8. If a field cannot be supported, return an empty string.
9. Keep the content concise but useful.
10. Return ONLY valid JSON.
11. Output exactly one object per input article.
12. Preserve the same input index.

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

IMPORTANT:
Do NOT force GS-IV.
Do NOT force a PYQ.
Do NOT force a scheme/report.
Only use these when genuinely relevant.

For each article create:

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

MAINS ANALYSIS SHOULD INCLUDE WHEN SUPPORTED:
- significance
- implications
- challenges
- opportunities
- way forward

PRELIMS MCQ:
Create one UPSC-style MCQ only from the supplied article.

RELATED PYQS:
Only provide a PYQ if you are genuinely confident.
Otherwise return "".

STATIC LINK:
Mention the relevant static UPSC topic.

PREMIUM FACT:
Give one genuinely useful fact from the supplied source.

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

${JSON.stringify(items)}
`;
}

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable missing.");
  }

  let lastError = "";

  for (const model of GEMINI_MODELS) {
    try {
      console.log("GEMINI BATCH TRY:", model);

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
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        lastError =
          result?.error?.message ||
          `Gemini HTTP ${response.status}`;

        console.error(
          "GEMINI BATCH ERROR:",
          model,
          response.status,
          lastError
        );

        /*
         * Quota exceeded:
         * do not waste more retries.
         */
        if (
          lastError.toLowerCase().includes("quota exceeded") ||
          lastError.toLowerCase().includes("free_tier_requests") ||
          lastError.toLowerCase().includes("rate limit")
        ) {
          throw new Error(lastError);
        }

        continue;
      }

      const text =
        result?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("") || "";

      const parsed = cleanJson(text);

      console.log(
        "GEMINI BATCH SUCCESS:",
        model
      );

      return parsed;
    } catch (error) {
      lastError = error.message;

      console.error(
        "GEMINI MODEL FAILED:",
        model,
        error.message
      );

      if (
        error.message.toLowerCase().includes("quota exceeded") ||
        error.message.toLowerCase().includes("free_tier_requests")
      ) {
        break;
      }
    }
  }

  throw new Error(
    `AI generation failed. ${lastError}`
  );
}

function normalizeArticle(article, input) {
  return {
    title:
      article.title_hi ||
      article.title_en ||
      input.title ||
      "",

    title_hi:
      String(article.title_hi || input.title || "").trim(),

    title_en:
      String(article.title_en || input.title || "").trim(),

    date:
      article.date ||
      input.date ||
      new Date().toISOString().slice(0, 10),

    gs: String(article.gs || "").trim(),

    subject: String(article.subject || "").trim(),

    paper:
      String(article.paper || article.gs || "").trim(),

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
      String(article.why_in_news_hi || "").trim(),

    why_in_news_en:
      String(article.why_in_news_en || "").trim(),

    background_hi:
      String(article.background_hi || "").trim(),

    background_en:
      String(article.background_en || "").trim(),

    key_facts_hi:
      String(article.key_facts_hi || "").trim(),

    key_facts_en:
      String(article.key_facts_en || "").trim(),

    prelims_hi:
      String(article.prelims_hi || "").trim(),

    prelims_en:
      String(article.prelims_en || "").trim(),

    mains_analysis_hi:
      String(article.mains_analysis_hi || "").trim(),

    mains_analysis_en:
      String(article.mains_analysis_en || "").trim(),

    static_link:
      String(article.static_link || "").trim(),

    premium_fact_hi:
      String(article.premium_fact_hi || "").trim(),

    premium_fact_en:
      String(article.premium_fact_en || "").trim(),

    related_pyqs_hi:
      String(article.related_pyqs_hi || "").trim(),

    related_pyqs_en:
      String(article.related_pyqs_en || "").trim(),

    prelims_mcq_hi:
      String(article.prelims_mcq_hi || "").trim(),

    prelims_mcq_en:
      String(article.prelims_mcq_en || "").trim(),

    mains_question_hi:
      String(article.mains_question_hi || "").trim(),

    mains_question_en:
      String(article.mains_question_en || "").trim(),

    report_type:
      String(article.report_type || "").trim(),

    tags:
      String(article.tags || "").trim(),

    important_place:
      String(article.important_place || "").trim(),

    personalities:
      String(article.personalities || "").trim(),

    government_scheme:
      String(article.government_scheme || "").trim(),

    ethics_angle_hi:
      String(article.ethics_angle_hi || "").trim(),

    ethics_angle_en:
      String(article.ethics_angle_en || "").trim(),

    is_important: false,
  };
}

async function saveArticle(article) {
  const response = await supabaseRequest(
    "current_affairs",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(article),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase save failed: ${text}`
    );
  }

  return JSON.parse(text);
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        {
          success: false,
          error: "items array required.",
        },
        { status: 400 }
      );
    }

    if (!body.items.length) {
      return NextResponse.json({
        success: true,
        articles_created: 0,
      });
    }

    /*
     * One Gemini request for the whole daily batch.
     */
    const prompt = buildPrompt(body.items);

    const generated =
      await generateWithGemini(prompt);

    const generatedArticles =
      Array.isArray(generated?.articles)
        ? generated.articles
        : [];

    let created = 0;

    for (let i = 0; i < body.items.length; i++) {
      const input = body.items[i];

      const aiArticle =
        generatedArticles.find(
          (article) =>
            Number(article.index) === i
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
       * Exact source URL duplicate protection.
       */
      const encodedUrl =
        encodeURIComponent(
          article.source_url
        );

      const duplicateResponse =
        await supabaseRequest(
          `current_affairs?select=id&source_url=eq.${encodedUrl}&limit=1`
        );

      if (duplicateResponse.ok) {
        const duplicates =
          await duplicateResponse.json();

        if (duplicates.length) {
          console.log(
            "DUPLICATE SKIPPED:",
            article.title_en
          );
          continue;
        }
      }

      await saveArticle(article);

      created++;

      console.log(
        "ARTICLE SAVED:",
        article.title_en
      );
    }

    return NextResponse.json({
      success: true,
      articles_created: created,
      articles_received: body.items.length,
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
          error.message ||
          "Current Affairs AI generation failed.",
      },
      { status: 500 }
    );
  }
}
