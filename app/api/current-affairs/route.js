import { NextResponse } from "next/server";

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(model, apiKey, prompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${apiKey}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      const text = await response.text();

      if (response.ok) {
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Gemini returned invalid JSON response");
        }

        const output =
          data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("")
            .trim() || "";

        if (!output) {
          throw new Error("Gemini returned empty output");
        }

        return {
          success: true,
          output,
          model,
          attempt,
        };
      }

      const retryable =
        response.status === 429 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;

      console.error(
        `Gemini ${model} attempt ${attempt}/${MAX_RETRIES}:`,
        response.status,
        text.slice(0, 500)
      );

      if (!retryable) {
        throw new Error(
          `Gemini ${model} failed with ${response.status}: ${text.slice(0, 500)}`
        );
      }

      if (attempt < MAX_RETRIES) {
        await sleep(1500 * attempt);
      }
    } catch (error) {
      console.error(
        `Gemini ${model} attempt ${attempt}/${MAX_RETRIES} error:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        await sleep(1500 * attempt);
      }
    }
  }

  return {
    success: false,
    model,
  };
}

function cleanJson(text) {
  let value = text.trim();

  if (value.startsWith("```")) {
    value = value
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  const first = value.indexOf("[");
  const last = value.lastIndexOf("]");

  if (first !== -1 && last !== -1 && last > first) {
    value = value.slice(first, last + 1);
  }

  return value;
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const articles = Array.isArray(body?.articles)
      ? body.articles
      : [];

    if (!articles.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No articles supplied",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert UPSC Current Affairs editor.

Process the following PIB/current-affairs articles.

STRICT RULES:
1. Select only genuinely UPSC-relevant articles.
2. Do NOT invent news.
3. Do NOT create dummy/test articles.
4. Preserve factual accuracy.
5. Prefer GS-II, GS-III, GS-I, GS-IV, Prelims and Essay relevance.
6. Every selected article must be based on the supplied source material.
7. Return ONLY valid JSON.
8. Output must be an array.

For each selected article return:

{
  "title": "",
  "date": "",
  "gs": "",
  "subject": "",
  "source_name": "",
  "source_url": "",
  "why_in_news": "",
  "background": "",
  "key_facts": "",
  "prelims": "",
  "mains_analysis": "",
  "static_link": "",
  "premium_fact": "",
  "related_pyqs": "",
  "prelims_mcq": "",
  "mains_question": "",
  "is_important": false
}

SOURCE ARTICLES:
${JSON.stringify(articles)}
`;

    let lastError = "All Gemini models failed";

    for (const model of MODELS) {
      const result = await callGemini(model, apiKey, prompt);

      if (!result.success) {
        lastError = `Model ${model} failed`;
        continue;
      }

      try {
        const parsed = JSON.parse(cleanJson(result.output));

        if (!Array.isArray(parsed)) {
          throw new Error("AI output is not an array");
        }

        return NextResponse.json({
          success: true,
          articles: parsed,
          count: parsed.length,
          model: result.model,
          attempt: result.attempt,
          failedBatches: 0,
        });
      } catch (error) {
        console.error(
          `Invalid JSON from ${model}:`,
          error
        );

        lastError = `Invalid JSON from ${model}`;
      }
    }

    return NextResponse.json(
      {
        success: false,
        articles: [],
        count: 0,
        failedBatches: 1,
        error: lastError,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("CURRENT AFFAIRS AI ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        articles: [],
        count: 0,
        failedBatches: 1,
        error:
          error?.message ||
          "Current affairs AI processing failed",
      },
      { status: 500 }
    );
  }
}
