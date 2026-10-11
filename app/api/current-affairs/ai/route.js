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

  // Updated: detect The Hindu from either report_type or source_name.
  const isTheHindu =
    String(item?.report_type || "")
      .toLowerCase()
      .includes("the_hindu_pdf") ||
    String(item?.source_name || "")
      .toLowerCase()
      .includes("the hindu");

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
You are the senior UPSC Current Affairs editor for SAMBHAV UPSC.

Create EXACTLY ONE decision for this candidate. For The Hindu PDF candidates,
YOU MUST independently decide whether the article deserves publication for UPSC.
The extraction stage uses imperfect PDF text windows; a keyword match is NOT proof
of UPSC relevance. The input may contain a wrong headline, mixed columns, partial
article text, page furniture, or unrelated local news.

STRICT UPSC RELEVANCE GATE (The Hindu PDF only):
Set is_upsc_relevant=true ONLY if the supplied headline/content has a clear,
substantive link to a UPSC CSE syllabus area AND provides a useful policy,
constitutional, governance, economy, IR, society, environment, science/technology,
security, disaster, culture/geography/history, or ethics learning point.
Routine crime, ordinary local incidents, routine political statements, celebrity,
sports/entertainment, promotional content, and isolated events without wider
institutional/policy significance must be rejected. A protest or local event is
eligible only when the text supports a broader issue such as rehabilitation,
rights, public administration, public policy, environment, or accountability.
Do not infer a broader issue from the headline alone if the article text does not support it.

If the candidate is not relevant, has a mismatched headline/body, or lacks enough
coherent article text to analyse reliably, return is_upsc_relevant=false, give a
short relevance_reason, and leave the educational fields empty. It will be skipped,
not published. If it is relevant, return is_upsc_relevant=true and a concise reason.
For non-The-Hindu sources, process as before and set is_upsc_relevant=true.

Create EXACTLY ONE current-affairs record. Do not merge it with another article.

Use ONLY information supported by the supplied article.

Never invent:
- facts, statistics, schemes, reports, institutions, places, personalities, court rulings,
  constitutional provisions, quotes, committee recommendations or PYQs
- a claim that is merely alleged as though it were an established fact
- an author's opinion as though it were verified reporting

Clearly distinguish verified facts, allegations/claims, official responses and analysis.
If something is not supported, say it is not stated in the supplied article or return an empty string.

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
    : isTheHindu
    ? `
This article was extracted from a The Hindu newspaper PDF.

Classify the ORIGINAL article accurately as one of:
NEWS, EDITORIAL, OPINION / OP-ED, EXPLAINER / ANALYSIS, FEATURE / SPECIAL REPORT, INTERVIEW.

Return that exact type in report_type. Do not label ordinary reporting as an editorial.

For NEWS: explain what happened, why it matters, background, stakeholders, verified facts and implications.

For EDITORIAL / OPINION: capture the central thesis, problem, structural/institutional causes, supporting arguments, recommendations, limitations/counterarguments where supported, and a balanced Mains perspective. Clearly treat opinions as the author's arguments, not established facts.

For EXPLAINER / ANALYSIS / SPECIAL REPORT: capture context, mechanisms, causes, consequences, institutions, challenges and source-supported way forward.

Keep article-specific details faithful to the supplied text. Do not invent page numbers, authors, quotes, statistics, schemes, laws, reports, constitutional provisions or PYQs. If unsupported, return an empty string. Keep the summary substantial enough for UPSC revision; do not reduce an in-depth article to a generic short summary.
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

${
  isTheHindu
    ? `
THE HINDU EXTRACTION RULES
- Preserve the article's original headline in the appropriate title field as closely as possible.
- Include only UPSC-relevant information supported by this article.
- Use report_type to classify NEWS, EDITORIAL, OPINION / OP-ED, EXPLAINER / ANALYSIS, FEATURE / SPECIAL REPORT, or INTERVIEW.
- For editorials/opinions, separate the author's opinion from verified facts and retain the central argument and recommendations.
- Do not claim that this single article represents the entire newspaper. This record represents only the supplied article candidate.
`
    : ""
}

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
      "is_upsc_relevant": true,
      "relevance_reason": "",

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
MAINS ANALYSIS — CRUX-STYLE, EXAM-READY, NOT A GENERIC PARAGRAPH
=========================================================

For a relevant The Hindu article, mains_analysis_hi and mains_analysis_en MUST be
substantial, article-specific and formatted with these exact section labels (translate
labels naturally in Hindi, while preserving the same order):

1. CONTEXT: explain the actual issue/event, why it matters now, stakeholders and
   necessary background. Do not repeat the headline as the whole context.
2. SIGNIFICANCE FOR UPSC: name the exact GS paper and syllabus linkage and explain
   the public-policy/constitutional/developmental significance.
3. UPSC VOCAB: give 3–5 useful terms with short, accurate definitions. Do not add
   decorative vocabulary unrelated to the article.
4. UPSC-READY INTRODUCTION: provide a concise answer-opening paragraph using only
   verified article facts or a safe conceptual opening. Do not fabricate data.
5. KEY POINTS: use 5–8 substantive bullets where the source supports them, covering
   causes/mechanisms, stakeholders, evidence, impacts, institutional/legal dimensions,
   implementation gaps and implications. Keep article facts distinct from inference.
6. COUNTER VIEW: fairly present relevant competing considerations, official response,
   public benefits, implementation constraints or limitations. If no counter-view is
   provided by the source, explicitly label the points as analytical considerations,
   not as claims made by the article.
7. UPSC-READY CONCLUSION: a balanced conclusion with actionable way forward,
   accountability/implementation measures and rights/equity/sustainability where relevant.

Do not merely write a single short paragraph. Aim for roughly 350–600 words in Hindi
and English combined separately per language only when the supplied article contains
enough evidence; never pad with generic filler. Use readable headings and bullet points.
Do not force irrelevant constitutional articles, schemes, statistics, SDGs or reports.
When information is absent, state the limitation rather than guessing.

APP QUALITY CONTRACT — SAMBHAV UPSC

1. WHY IN NEWS:
Explain the specific development in 2–4 clear sentences. Do not repeat the headline only.

2. BACKGROUND / CONTEXT:
Include only background necessary to understand this particular article.

3. MAINS ANALYSIS:
Use numbered headings and readable bullets in the existing required order above.
Include the exact GS paper and syllabus linkage, 3–5 relevant vocabulary terms,
a concise answer-ready introduction, article-specific key points, stakeholders,
institutional/legal dimensions where supported, implementation challenges,
a fair counter-view, and a balanced conclusion with practical way forward.
Editorials and opinion pieces must distinguish the author's argument from established
facts. News reports must explain the development, stakeholders, implications and policy choices.

4. PRELIMS BOOSTER:
Use only article-supported facts, institutions, places, laws and concepts. Never guess.

5. PRACTICE MCQ:
Create exactly one MCQ with options, correct answer and a short explanation.
All facts needed to answer it must be supported by the supplied article.

6. MAINS ENRICHMENT:
Provide one probable Mains question and concise answer-ready points.
Never label a generated/probable question as an authentic UPSC PYQ.

7. STATIC LINK:
Name a precise syllabus topic, not a generic subject alone.

8. QUICK REVISION:
Use 4–7 concise takeaways where key_facts supports them; avoid repeating the full analysis.

9. RELATED PYQs:
Include only a genuine UPSC PYQ that can be confidently verified from reliable knowledge.
If unsure, return an empty string. Never invent a year, wording or question number.

QUALITY GATE:
If headline and body do not match, the body is fragmented or mixed across unrelated articles,
or there is insufficient coherent text to support a reliable analysis, reject the candidate
with is_upsc_relevant=false and leave educational fields empty. Do not reconstruct a full
article from a partial PDF window. Keep the existing required JSON schema and all fields.

PRELIMS FOCUS:
Add source-supported facts, institutions, terms, locations, laws and concepts that a
Prelims question could test. MCQ answer and explanation must be supported by the article.

STATIC LINK:
Give the specific static subject/topic, not a generic phrase such as “Governance”.

The fields why_in_news, background and key_facts should remain concise and distinct;
do not paste the whole Mains Analysis into those fields.

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

    // Preserve the AI-generated classification.
    report_type:
      String(
        article?.report_type ||
          input?.report_type ||
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
  const normalizedA =
    normalizeTitleForDuplicate(incomingTitle);
  const normalizedB =
    normalizeTitleForDuplicate(existingTitle);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  // Exact normalized headline is a reliable duplicate signal.
  if (normalizedA === normalizedB) {
    return true;
  }

  const a = duplicateTokens(normalizedA);
  const b = duplicateTokens(normalizedB);

  // A broad topic match is not enough: separate reports can cover the same event.
  if (a.size < 3 || b.size < 3) {
    return false;
  }

  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared++;
  }

  if (shared < 3) {
    return false;
  }

  const unionSize = new Set([...a, ...b]).size;
  const jaccard = unionSize ? shared / unionSize : 0;
  const shorterSize = Math.min(a.size, b.size);
  const containment = shorterSize ? shared / shorterSize : 0;
  const sizeDifference = Math.abs(a.size - b.size);

  // Similarity must be strong and the titles must be close in length.
  // This avoids collapsing distinct articles merely because they mention
  // the same people, institution, protest, court, or location.
  return (
    jaccard >= 0.72 &&
    containment >= 0.82 &&
    sizeDifference <= 2
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

  const isTheHinduInput =
    String(input?.report_type || "").toLowerCase().includes("the_hindu_pdf") ||
    String(input?.source_name || "").toLowerCase().includes("the hindu");

  // The AI relevance gate runs before normalization, duplicate checks and saving.
  // Rejected PDF candidates never enter current_affairs.
  if (isTheHinduInput && aiArticle?.is_upsc_relevant !== true) {
    return {
      created: 0,
      skipped: 1,
      reason: String(aiArticle?.relevance_reason || "Not sufficiently UPSC-relevant"),
      title: String(input?.title || ""),
    };
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
      console.log(
        "CURRENT AFFAIRS ARTICLE SKIPPED",
        {
          articleNumber,
          title:
            article.title_en ||
            article.title_hi ||
            input?.title ||
            "",
          reason:
            "same-source-url-and-date",
          existingId:
            duplicates[0]?.id || null,
        }
      );

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
    console.log(
      "CURRENT AFFAIRS ARTICLE SKIPPED",
      {
        articleNumber,
        title:
          article.title_en ||
          article.title_hi ||
          input?.title ||
          "",
        reason:
          "same-event-cross-source",
        duplicateId:
          sameEvent.id || null,
        duplicateSource:
          sameEvent.source_name || null,
      }
    );

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

  console.log(
    "CURRENT AFFAIRS ARTICLE SAVED",
    {
      articleNumber,
      title:
        article.title_en ||
        article.title_hi ||
        input?.title ||
        "",
      date: article.date,
      source_url: article.source_url,
    }
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
    const skippedArticles = [];

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
          if (Number(result?.skipped || 0) > 0) {
            skippedArticles.push({
              title: String(input?.title || ""),
              reason: String(result?.reason || "duplicate_or_not_upsc_relevant"),
            });
          }
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
        skipped_articles: skippedArticles,
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
        skipped_articles: skippedArticles,
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
