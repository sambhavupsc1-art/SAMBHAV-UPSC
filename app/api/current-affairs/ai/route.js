import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

const MAX_RETRIES_PER_MODEL = 2;

async function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase environment variables missing"
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

function cleanJson(text) {
  if (!text) {
    throw new Error(
      "AI ne empty response diya."
    );
  }

  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error(
      "AI response valid JSON nahi hai."
    );
  }

  cleaned = cleaned.slice(
    first,
    last + 1
  );

  return JSON.parse(cleaned);
}

function buildPrompt(input) {
  return `
You are the official UPSC Current Affairs Editor for SAMBHAV UPSC.

Create a complete bilingual UPSC current-affairs entry from the supplied source.

VERY IMPORTANT:
- Generate BOTH Hindi and English versions.
- Hindi must be natural UPSC-standard Hindi.
- English must be clear UPSC-standard English.
- Do not merely translate word-by-word.
- Do not invent facts, statistics, reports, judgments, schemes or PYQs.
- Use only facts supported by the supplied source.
- If information is unavailable, return an empty string.
- GS classification must be accurate.
- Return ONLY valid JSON.
- Do not use markdown fences outside the JSON.

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

OUTPUT EXACTLY THIS JSON STRUCTURE:

{
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

CONTENT RULES:

1. WHY IN NEWS
Hindi and English separately.
Keep it concise and UPSC relevant.

2. BACKGROUND
Give only relevant background supported by the source.

3. KEY FACTS
Important factual points useful for Prelims.

4. PRELIMS
Create concise revision-oriented points.

5. MAINS ANALYSIS
Cover:
- significance
- issues/challenges
- opportunities
- implications
- way forward

Only include dimensions supported by the source.

6. STATIC LINK
Connect the current affair with a static UPSC syllabus topic.

7. PREMIUM FACT
Give a high-value fact, data point, example or official finding
that can genuinely be used in a UPSC Mains answer.

Never manufacture statistics.

8. RELATED PYQs
Mention only genuinely relevant UPSC PYQs if confidently identifiable.
If not confident, return "".

9. PRELIMS MCQ
Create one UPSC-style MCQ.

Hindi:
Question + A-D options + Answer + short explanation.

English:
Question + A-D options + Answer + short explanation.

10. MAINS QUESTION
Create one UPSC-style Mains question in both languages.

11. REPORT TYPE
Examples:
Government Report
International Report
Index
Survey
Judgment
Scheme
Policy
Agreement
Science & Technology

12. TAGS
Comma-separated.

13. ETHICS ANGLE
Only when genuinely relevant to GS-IV.

SOURCE INPUT:

${JSON.stringify(input)}
`;
}

/* ---------------------------------------
   GEMINI ERROR CLASSIFICATION
--------------------------------------- */

function isRetryableGeminiError(status, message = "") {
  const text = message.toLowerCase();

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes("high demand") ||
    text.includes("temporarily") ||
    text.includes("unavailable") ||
    text.includes("overloaded") ||
    text.includes("rate limit") ||
    text.includes("resource exhausted")
  );
}

/* ---------------------------------------
   GEMINI GENERATION
   MODEL FALLBACK + RETRY
--------------------------------------- */

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable missing."
    );
  }

  let lastError =
    "All Gemini models failed.";

  for (const model of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= MAX_RETRIES_PER_MODEL;
      attempt++
    ) {
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
                temperature: 0.2,
                responseMimeType:
                  "application/json",
              },
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          const errorMessage =
            result?.error?.message ||
            `Gemini request failed: ${response.status}`;

          lastError = errorMessage;

          console.error(
            "GEMINI ERROR:",
            model,
            "STATUS:",
            response.status,
            errorMessage
          );

          /*
            Retry temporary capacity/rate-limit errors.
          */

          if (
            isRetryableGeminiError(
              response.status,
              errorMessage
            )
          ) {
            if (
              attempt <
              MAX_RETRIES_PER_MODEL
            ) {
              const delay =
                attempt === 1
                  ? 1500
                  : 3000;

              console.log(
                "GEMINI RETRY AFTER:",
                delay,
                "ms"
              );

              await sleep(delay);
              continue;
            }

            /*
              Current model exhausted.
              Move to next model.
            */

            console.log(
              "SWITCHING GEMINI MODEL:",
              model
            );

            break;
          }

          /*
            Non-temporary model/API error:
            move to next model.
          */

          break;
        }

        const text =
          result?.candidates?.[0]?.content?.parts
            ?.map(
              (part) =>
                part.text || ""
            )
            .join("") || "";

        if (!text) {
          lastError =
            "Gemini returned empty response.";

          console.error(
            "GEMINI EMPTY RESPONSE:",
            model
          );

          if (
            attempt <
            MAX_RETRIES_PER_MODEL
          ) {
            await sleep(1500);
            continue;
          }

          break;
        }

        try {
          const parsed =
            cleanJson(text);

          console.log(
            "GEMINI SUCCESS:",
            model,
            "ATTEMPT:",
            attempt
          );

          return parsed;
        } catch (parseError) {
          lastError =
            parseError.message;

          console.error(
            "GEMINI JSON PARSE ERROR:",
            model,
            parseError.message
          );

          /*
            Retry malformed AI output once.
          */

          if (
            attempt <
            MAX_RETRIES_PER_MODEL
          ) {
            await sleep(1000);
            continue;
          }

          break;
        }
      } catch (error) {
        lastError =
          error.message ||
          "Unknown Gemini error.";

        console.error(
          "GEMINI NETWORK ERROR:",
          model,
          error.message
        );

        if (
          attempt <
          MAX_RETRIES_PER_MODEL
        ) {
          await sleep(
            attempt === 1
              ? 1500
              : 3000
          );

          continue;
        }

        break;
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

    title_hi: String(
      article.title_hi ||
        input.title ||
        ""
    ).trim(),

    title_en: String(
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

    gs: String(
      article.gs || ""
    ).trim(),

    subject: String(
      article.subject || ""
    ).trim(),

    paper: String(
      article.paper ||
        article.gs ||
        ""
    ).trim(),

    source_name: String(
      article.source_name ||
        input.source_name ||
        ""
    ).trim(),

    source_url: String(
      article.source_url ||
        input.source_url ||
        ""
    ).trim(),

    why_in_news_hi: String(
      article.why_in_news_hi ||
        ""
    ).trim(),

    why_in_news_en: String(
      article.why_in_news_en ||
        ""
    ).trim(),

    background_hi: String(
      article.background_hi ||
        ""
    ).trim(),

    background_en: String(
      article.background_en ||
        ""
    ).trim(),

    key_facts_hi: String(
      article.key_facts_hi ||
        ""
    ).trim(),

    key_facts_en: String(
      article.key_facts_en ||
        ""
    ).trim(),

    prelims_hi: String(
      article.prelims_hi ||
        ""
    ).trim(),

    prelims_en: String(
      article.prelims_en ||
        ""
    ).trim(),

    mains_analysis_hi: String(
      article.mains_analysis_hi ||
        ""
    ).trim(),

    mains_analysis_en: String(
      article.mains_analysis_en ||
        ""
    ).trim(),

    static_link: String(
      article.static_link ||
        ""
    ).trim(),

    premium_fact_hi: String(
      article.premium_fact_hi ||
        ""
    ).trim(),

    premium_fact_en: String(
      article.premium_fact_en ||
        ""
    ).trim(),

    related_pyqs_hi: String(
      article.related_pyqs_hi ||
        ""
    ).trim(),

    related_pyqs_en: String(
      article.related_pyqs_en ||
        ""
    ).trim(),

    prelims_mcq_hi: String(
      article.prelims_mcq_hi ||
        ""
    ).trim(),

    prelims_mcq_en: String(
      article.prelims_mcq_en ||
        ""
    ).trim(),

    mains_question_hi: String(
      article.mains_question_hi ||
        ""
    ).trim(),

    mains_question_en: String(
      article.mains_question_en ||
        ""
    ).trim(),

    report_type: String(
      article.report_type ||
        ""
    ).trim(),

    tags: String(
      article.tags || ""
    ).trim(),

    important_place: String(
      article.important_place ||
        ""
    ).trim(),

    personalities: String(
      article.personalities ||
        ""
    ).trim(),

    government_scheme: String(
      article.government_scheme ||
        ""
    ).trim(),

    ethics_angle_hi: String(
      article.ethics_angle_hi ||
        ""
    ).trim(),

    ethics_angle_en: String(
      article.ethics_angle_en ||
        ""
    ).trim(),

    is_important: false,
  };
}

/* ---------------------------------------
   DUPLICATE CHECK
--------------------------------------- */

async function findDuplicate(
  titleHi,
  titleEn
) {
  const title =
    titleHi || titleEn || "";

  if (!title) {
    return [];
  }

  const encoded =
    encodeURIComponent(title);

  const response =
    await supabaseRequest(
      `current_affairs?select=id,title,title_hi,title_en&title=ilike.${encoded}&limit=5`
    );

  if (!response.ok) {
    console.error(
      "Duplicate check failed:",
      await response.text()
    );

    return [];
  }

  return response.json();
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
        body: JSON.stringify(
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

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
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

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Input required.",
        },
        { status: 400 }
      );
    }

    if (
      !body.title &&
      !body.content &&
      !body.text
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "News title ya article content provide karo.",
        },
        { status: 400 }
      );
    }

    const input = {
      title:
        body.title || "",

      date:
        body.date ||
        new Date()
          .toISOString()
          .slice(0, 10),

      source_name:
        body.source_name || "",

      source_url:
        body.source_url || "",

      content:
        body.content ||
        body.text ||
        body.description ||
        "",
    };

    const prompt =
      buildPrompt(input);

    const generated =
      await generateWithGemini(
        prompt
      );

    const article =
      normalizeArticle(
        generated,
        input
      );

    if (
      !article.title_hi &&
      !article.title_en
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI article title generate nahi kar paya.",
        },
        { status: 422 }
      );
    }

    const duplicates =
      await findDuplicate(
        article.title_hi,
        article.title_en
      );

    if (
      duplicates.length > 0
    ) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message:
          "Similar Current Affair already database me available hai.",
        existing:
          duplicates[0],
      });
    }

    const saved =
      await saveArticle(
        article
      );

    return NextResponse.json({
      success: true,
      duplicate: false,
      message:
        "Bilingual Current Affair successfully generated and saved.",
      data: saved,
    });
  } catch (error) {
    console.error(
      "Current Affairs bilingual AI error:",
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
