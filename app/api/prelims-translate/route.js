import { NextResponse } from "next/server";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY;

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

function buildPrompt(payload) {
  return `
You are the dedicated Hindi translation engine for the SAMBHAV UPSC PRELIMS TEST only.

Your task is to translate the supplied English UPSC Prelims question into HIGH-QUALITY,
NATURAL, FORMAL, EXAM-STANDARD HINDI.

This is a translation task, NOT a solving task.

ABSOLUTE RULES:

1. Translate every part of the question faithfully.
   Do not summarize, simplify, solve, interpret, or rewrite the question.

2. Preserve the exact logical meaning of every statement, especially:
   NOT, INCORRECT, CORRECT, ONLY, ALL, NONE, ALWAYS, NEVER, BEST,
   MOST APPROPRIATE, CONSIDER, WHICH OF THE ABOVE, etc.

3. NEVER change:
   - correct answer
   - option order
   - option meaning
   - numbers
   - dates
   - years
   - percentages
   - units
   - symbols
   - names
   - institutions
   - constitutional articles
   - Acts
   - schemes
   - reports
   - places
   - species
   - scientific names
   - abbreviations
   - citations

4. Preserve A/B/C/D option order exactly.

5. Return exactly the same number of options as the input.

6. Do not add any information that is not present in the input.

7. Do not remove any information from the input.

8. Do not use Hinglish.
   Output must be proper Hindi suitable for UPSC preparation.

9. For established UPSC technical terms, use:
   English Term (हिंदी अर्थ)

   Examples:
   Fiscal Deficit (राजकोषीय घाटा)
   Monetary Policy (मौद्रिक नीति)
   Biodiversity (जैव विविधता)
   Carbon Sink (कार्बन सिंक)

   Do not force awkward Hindi where the English term is standard in UPSC.

10. Keep proper nouns, official scheme names, institution names,
    abbreviations and scientific names intact where appropriate.

11. Translate the explanation faithfully.
    Do not introduce a new explanation or change the reasoning.

12. If the explanation is empty, return an empty string.

13. Use grammatically correct Hindi with natural sentence flow.
    Avoid literal machine translation when it makes Hindi unnatural,
    but never alter the underlying meaning.

14. Preserve punctuation, numbering, bullets and statement structure
    as closely as possible.

15. Do not solve the question.

16. Do not reveal or infer the correct answer if it is not contained
    in the supplied input.

17. Return ONLY valid JSON.
    No markdown.
    No code fences.
    No commentary.

REQUIRED JSON FORMAT:

{
  "question_hi": "",
  "options_hi": [],
  "explanation_hi": ""
}

INPUT:
${JSON.stringify(payload)}
`;
}

async function translateWithGemini(payload) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable missing.");
  }

  let lastError = "Unknown Gemini error.";

  for (const model of GEMINI_MODELS) {
    try {
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
                role: "user",
                parts: [
                  {
                    text: buildPrompt(payload),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.05,
              responseMimeType: "application/json",
              maxOutputTokens: 7000,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        lastError =
          result?.error?.message ||
          `Gemini HTTP ${response.status}`;
        continue;
      }

      const text =
        result?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("") || "";

      if (!text) {
        lastError = "Gemini returned empty response.";
        continue;
      }

      let cleaned = text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");

      if (first === -1 || last === -1) {
        lastError = "Invalid JSON returned by Gemini.";
        continue;
      }

      const parsed = JSON.parse(
        cleaned.slice(first, last + 1)
      );

      if (
        typeof parsed.question_hi !== "string" ||
        !Array.isArray(parsed.options_hi) ||
        typeof parsed.explanation_hi !== "string" ||
        parsed.options_hi.length !== payload.options.length
      ) {
        lastError = "Gemini returned incomplete translation.";
        continue;
      }

      return parsed;
    } catch (error) {
      lastError =
        error?.message || "Translation failed.";
    }
  }

  throw new Error(
    `Translation failed: ${lastError}`
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.question) {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required.",
        },
        { status: 400 }
      );
    }

    const payload = {
      question: String(body.question),

      options: Array.isArray(body.options)
        ? body.options.map(String)
        : [],

      explanation: String(
        body.explanation || ""
      ),
    };

    const translated =
      await translateWithGemini(payload);

    return NextResponse.json({
      success: true,
      translation: translated,
    });
  } catch (error) {
    console.error(
      "PRELIMS TRANSLATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Translation failed.",
      },
      { status: 500 }
    );
  }
}
