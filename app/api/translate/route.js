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

async function translateWithGemini(payload) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable missing."
    );
  }

  const prompt = `
You are the Hindi translation engine for SAMBHAV UPSC.

Translate the supplied UPSC question content from English to natural,
clear, exam-standard Hindi.

IMPORTANT RULES:

1. Translate only. Do NOT solve the question.
2. Do NOT change the correct answer.
3. Do NOT add facts.
4. Do NOT remove facts.
5. Preserve numbers, dates, names, institutions and technical terms.
6. Preserve option order A, B, C, D.
7. Use natural Hindi suitable for UPSC preparation.
8. For important UPSC technical terms, write the English term first and
   immediately give its Hindi equivalent in brackets.
   Example: Financial Inclusion (वित्तीय समावेशन)
   Example: Fiscal Deficit (राजकोषीय घाटा)
9. In the Important Terms / Keywords section, ALWAYS write each important
   term in this format:
   English Term (हिंदी अर्थ) — short Hindi meaning.
10. Do not replace important English technical terminology completely with
    Hindi when the English term is commonly used in UPSC preparation.
11. Keep proper nouns, institutions, schemes and standard abbreviations intact.
12. Translate the explanation faithfully without changing its meaning.
13. Return ONLY valid JSON.

Required JSON format:

{
  "question_hi": "",
  "options_hi": [],
  "explanation_hi": ""
}

INPUT:

${JSON.stringify(payload)}
`;

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
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
              maxOutputTokens: 6000,
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

      cleaned = cleaned.slice(first, last + 1);

      const parsed = JSON.parse(cleaned);

      if (
        typeof parsed.question_hi !== "string" ||
        !Array.isArray(parsed.options_hi) ||
        typeof parsed.explanation_hi !== "string"
      ) {
        lastError =
          "Gemini returned incomplete translation.";
        continue;
      }

      return parsed;
    } catch (error) {
      lastError =
        error?.message ||
        "Translation failed.";
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
        ? body.options
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
      "TRANSLATION API ERROR:",
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
