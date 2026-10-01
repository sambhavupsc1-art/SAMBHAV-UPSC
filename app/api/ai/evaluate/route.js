import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = `
You are an expert UPSC Civil Services Examination Mains evaluator.

Your task is to evaluate a candidate's handwritten UPSC Mains answer from
one or more uploaded page images.

IMPORTANT:
- All uploaded pages belong to ONE continuous answer.
- Read every page in order.
- Never evaluate pages independently.
- Reconstruct the answer carefully from the handwriting.
- Do not invent words, facts, examples or arguments that are not reasonably visible.
- If handwriting is unclear, explicitly mention the uncertainty.
- Evaluate substance, not handwriting beauty.
- Do not give artificial praise.
- Do not inflate marks.
- Do not give an official UPSC score.
- The score must be realistic and justified.

STEP 1 — UNDERSTAND THE QUESTION

Before evaluating the answer, identify:

1. Directive
2. Core demand
3. Important keywords
4. Expected dimensions
5. What an ideal UPSC answer should broadly cover

DIRECTIVE RULES:

Discuss:
Cover the issue through relevant and balanced dimensions.

Examine:
Examine arguments, causes, effects, limitations and evidence.

Analyse:
Break the issue into components and establish relationships.

Critically Analyse:
Analyse multiple sides, limitations and counterarguments before a balanced conclusion.

Evaluate:
Assess the issue against relevant criteria and provide a reasoned conclusion.

Critically Evaluate:
Assess merits, limitations and counterarguments before a balanced conclusion.

Comment:
Give a reasoned assessment.

Elucidate:
Explain clearly with adequate detail and examples.

Explain:
Clearly explain the demanded concept, process, causes or consequences.

STEP 2 — EVALUATE THE ANSWER

Evaluate:

1. Question demand
2. Directive handling
3. Relevance
4. Demand fulfilment
5. Content depth
6. Analytical quality
7. Breadth of dimensions
8. Structure
9. Introduction
10. Body
11. Conclusion
12. Examples
13. Data
14. Constitutional references where relevant
15. Legal/institutional references where relevant
16. Current affairs linkage where relevant
17. Factual accuracy
18. Balance and nuance
19. Way forward where demanded
20. Word-limit discipline
21. Overall UPSC suitability

GS1:
Consider history, geography, society, culture and interdisciplinary dimensions.

GS2:
Consider Constitution, governance, Parliament, judiciary, federalism,
rights, welfare, accountability, social justice and international relations.

GS3:
Consider economy, agriculture, science and technology, environment,
disaster management, internal security and development.

GS4:
Consider ethical concepts, values, stakeholders, conflicts, integrity,
probity, emotional intelligence and administrative reasoning.

CASE STUDIES:
Consider stakeholders, ethical issues, competing values, options,
consequences, justification and implementation.

ESSAY:
Consider coherence, philosophical depth, multidimensionality,
arguments, examples, balance, originality, structure and conclusion.

MARKING:

10-mark answer ≈ 150 words.
15-mark answer ≈ 250 words.

Do NOT mechanically reduce marks only because of word count.
Reduce marks when poor word-limit discipline actually harms demand fulfilment.

A superficial answer must not receive a high score.

Strong presentation must not artificially increase the score.

Do not give marks for points that are not present.

Do not assume that an omitted dimension was present.

If a factual claim appears questionable:
- identify it cautiously
- do not invent a correction
- give correction only when reasonably certain

MISSING DIMENSIONS:

For every important missing dimension:
- explain why it matters
- explain how the candidate could add it

POINT LEVEL FEEDBACK:

Identify specific weaknesses in the candidate's actual answer.

Examples:
- vague point
- unsupported claim
- repetition
- missing example
- weak analysis
- factual concern
- poor linkage
- irrelevant point
- incomplete dimension
- weak conclusion

BETTER ANSWER FRAMEWORK:

Provide a concise framework for how the candidate should structure a better answer.

NEXT ATTEMPT PLAN:

Give practical actions the candidate can apply in the next answer.

EXAMINER SUMMARY:

Give a concise final examiner-style assessment.

LANGUAGE:

Return the evaluation in clear Indian-English/Hinglish-compatible English.
Do not use unnecessarily complicated language.

QUALITY CONTROL:

Before returning the final JSON:
1. Verify that all required fields are present.
2. Verify that the score does not exceed maximum marks.
3. Verify that all feedback is based on the submitted answer.
4. Verify that no invented candidate content is included.
5. Verify that the JSON is valid.
`;

const EVALUATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    overall_score: {
      type: "NUMBER",
    },

    maximum_marks: {
      type: "NUMBER",
    },

    overall_assessment: {
      type: "STRING",
    },

    question_analysis: {
      type: "OBJECT",
      properties: {
        directive: {
          type: "STRING",
        },

        core_demand: {
          type: "STRING",
        },

        keywords: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        expected_dimensions: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },
      },

      required: [
        "directive",
        "core_demand",
        "keywords",
        "expected_dimensions",
      ],
    },

    demand_fulfilment: {
      type: "OBJECT",
      properties: {
        score: {
          type: "NUMBER",
        },

        maximum: {
          type: "NUMBER",
        },

        assessment: {
          type: "STRING",
        },

        missing_demands: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },
      },

      required: [
        "score",
        "maximum",
        "assessment",
        "missing_demands",
      ],
    },

    introduction: {
      type: "OBJECT",
      properties: {
        assessment: {
          type: "STRING",
        },

        strengths: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        weaknesses: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        improvement: {
          type: "STRING",
        },
      },

      required: [
        "assessment",
        "strengths",
        "weaknesses",
        "improvement",
      ],
    },

    body_analysis: {
      type: "OBJECT",
      properties: {
        content_score: {
          type: "NUMBER",
        },

        content_maximum: {
          type: "NUMBER",
        },

        analysis_score: {
          type: "NUMBER",
        },

        analysis_maximum: {
          type: "NUMBER",
        },

        structure_score: {
          type: "NUMBER",
        },

        structure_maximum: {
          type: "NUMBER",
        },

        assessment: {
          type: "STRING",
        },

        strengths: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        weaknesses: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },
      },

      required: [
        "content_score",
        "content_maximum",
        "analysis_score",
        "analysis_maximum",
        "structure_score",
        "structure_maximum",
        "assessment",
        "strengths",
        "weaknesses",
      ],
    },

    examples_and_data: {
      type: "OBJECT",
      properties: {
        score: {
          type: "NUMBER",
        },

        maximum: {
          type: "NUMBER",
        },

        assessment: {
          type: "STRING",
        },

        good_examples: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        missing_examples: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },
      },

      required: [
        "score",
        "maximum",
        "assessment",
        "good_examples",
        "missing_examples",
      ],
    },

    factual_accuracy: {
      type: "OBJECT",
      properties: {
        assessment: {
          type: "STRING",
        },

        possible_errors: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        corrections: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },
      },

      required: [
        "assessment",
        "possible_errors",
        "corrections",
      ],
    },

    conclusion: {
      type: "OBJECT",
      properties: {
        assessment: {
          type: "STRING",
        },

        strengths: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        weaknesses: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        improvement: {
          type: "STRING",
        },
      },

      required: [
        "assessment",
        "strengths",
        "weaknesses",
        "improvement",
      ],
    },

    missing_dimensions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          dimension: {
            type: "STRING",
          },

          why_important: {
            type: "STRING",
          },

          how_to_add: {
            type: "STRING",
          },
        },

        required: [
          "dimension",
          "why_important",
          "how_to_add",
        ],
      },
    },

    point_level_feedback: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          issue: {
            type: "STRING",
          },

          type: {
            type: "STRING",
          },

          improvement: {
            type: "STRING",
          },
        },

        required: [
          "issue",
          "type",
          "improvement",
        ],
      },
    },

    answer_structure: {
      type: "OBJECT",
      properties: {
        introduction: {
          type: "STRING",
        },

        body: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        conclusion: {
          type: "STRING",
        },
      },

      required: [
        "introduction",
        "body",
        "conclusion",
      ],
    },

    model_framework: {
      type: "ARRAY",
      items: {
        type: "STRING",
      },
    },

    improvement_plan: {
      type: "ARRAY",
      items: {
        type: "STRING",
      },
    },

    examiner_summary: {
      type: "STRING",
    },
  },

  required: [
    "overall_score",
    "maximum_marks",
    "overall_assessment",
    "question_analysis",
    "demand_fulfilment",
    "introduction",
    "body_analysis",
    "examples_and_data",
    "factual_accuracy",
    "conclusion",
    "missing_dimensions",
    "point_level_feedback",
    "answer_structure",
    "model_framework",
    "improvement_plan",
    "examiner_summary",
  ],
};

async function fileToBase64(file) {
  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  return buffer.toString("base64");
}

function cleanJsonText(text) {
  if (!text) {
    return "";
  }

  let cleaned = String(text).trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  return cleaned;
}

export async function POST(request) {
  try {
    /*
     * GEMINI_API_KEY is the preferred variable.
     *
     * GOOGLE_API_KEY is also accepted so existing setups
     * can work without changing the frontend.
     */

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is missing on the server.",

          details:
            "Add GEMINI_API_KEY in Vercel Environment Variables.",
        },
        {
          status: 500,
        }
      );
    }

    const formData =
      await request.formData();

    const question = String(
      formData.get("question") || ""
    ).trim();

    const paper = String(
      formData.get("paper") || "GS"
    ).trim();

    const section = String(
      formData.get("section") || ""
    ).trim();

    const marks = Number(
      formData.get("marks") || 15
    );

    const wordLimit = Number(
      formData.get("word_limit") ||
        (marks <= 10 ? 150 : 250)
    );

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Question is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(marks) ||
      marks <= 0 ||
      marks > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid marks.",
        },
        {
          status: 400,
        }
      );
    }

    const imageFiles = [];

    for (let i = 1; i <= 4; i++) {
      const file =
        formData.get(`image_${i}`);

      if (
        file &&
        typeof file.arrayBuffer ===
          "function"
      ) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        {
          error:
            "At least one answer image is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (imageFiles.length > 4) {
      return NextResponse.json(
        {
          error:
            "Maximum 4 pages allowed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Convert uploaded pages into Gemini inline image parts.
     */

    const imageParts = [];

    for (
      let i = 0;
      i < imageFiles.length;
      i++
    ) {
      const file = imageFiles[i];

      const mimeType =
        file.type || "image/jpeg";

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (
        !allowedTypes.includes(
          mimeType
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Page ${i + 1} must be JPG, PNG or WEBP.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        file.size >
        8 * 1024 * 1024
      ) {
        return NextResponse.json(
          {
            error:
              `Page ${i + 1} exceeds 8MB.`,
          },
          {
            status: 400,
          }
        );
      }

      const base64 =
        await fileToBase64(file);

      imageParts.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
    }

    /*
     * Main evaluation prompt.
     */

    const userPrompt = `
Evaluate this UPSC Civil Services Examination Mains answer.

QUESTION:
${question}

PAPER:
${paper}

SECTION:
${section || "Not specified"}

MAXIMUM MARKS:
${marks}

EXPECTED WORD LIMIT:
${wordLimit}

NUMBER OF ANSWER PAGES:
${imageFiles.length}

The uploaded images are handwritten pages of ONE continuous answer.

READING INSTRUCTIONS:

1. Read Page 1 first.
2. Then Page 2.
3. Then Page 3.
4. Then Page 4 if supplied.
5. Combine all pages into one answer.
6. Do not restart the evaluation on every page.
7. Do not assume missing text.
8. If handwriting is unclear, mention uncertainty.

IMPORTANT:

The question demand is more important than generic content.

First understand what the question is actually asking.

Then compare the candidate's answer against that demand.

For scoring, think like a strict UPSC Mains evaluator.

Do not give 70-80% marks merely because the answer contains
some correct information.

Reward:
- direct demand fulfilment
- relevant dimensions
- analytical depth
- examples
- data where useful
- constitutional/institutional references where relevant
- balanced arguments
- clear structure
- effective introduction
- effective conclusion
- appropriate way forward

Penalise:
- irrelevant content
- generic statements
- repetition
- factual errors
- weak analysis
- missing dimensions
- poor directive handling
- weak conclusion
- excessive introduction
- unsupported claims
- failure to answer the actual question

Do not penalise the candidate simply because handwriting is not beautiful.

Do not invent content that cannot reasonably be read.

Do not invent what the candidate "intended".

The final score must be between 0 and ${marks}.

Give detailed but useful feedback suitable for an UPSC aspirant.
`;

    /*
     * Gemini model.
     *
     * Gemini 2.5 Flash supports:
     * - text
     * - images
     * - structured output
     * - reasoning/thinking
     */

    const model =
      process.env.GEMINI_EVALUATION_MODEL ||
      "gemini-2.5-flash";

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

    const contents = [
      {
        role: "user",

        parts: [
          {
            text:
              SYSTEM_INSTRUCTIONS,
          },

          {
            text:
              userPrompt,
          },

          ...imageParts,
        ],
      },
    ];

    /*
     * Gemini generation configuration.
     */

    const requestBody = {
      contents,

      generationConfig: {
        temperature: 0.15,

        maxOutputTokens: 12000,

        responseMimeType:
          "application/json",

        responseSchema:
          EVALUATION_SCHEMA,
      },
    };

    const geminiResponse =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              requestBody
            ),
        }
      );

    const responseText =
      await geminiResponse.text();

    /*
     * IMPORTANT:
     * Never hide Gemini errors.
     */

    if (!geminiResponse.ok) {
      console.error(
        "Gemini API status:",
        geminiResponse.status
      );

      console.error(
        "Gemini API response:",
        responseText
      );

      let details =
        responseText;

      try {
        const parsed =
          JSON.parse(
            responseText
          );

        details =
          parsed?.error?.message ||
          parsed?.error?.status ||
          responseText;
      } catch {
        // Keep raw response.
      }

      return NextResponse.json(
        {
          error:
            "Gemini evaluation request failed.",

          gemini_status:
            geminiResponse.status,

          details:
            String(
              details
            ).slice(0, 2000),
        },
        {
          status: 502,
        }
      );
    }

    let geminiData;

    try {
      geminiData =
        JSON.parse(
          responseText
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "Gemini returned invalid response data.",

          details:
            responseText.slice(
              0,
              2000
            ),
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Safety checks for blocked/empty responses.
     */

    const candidate =
      geminiData?.candidates?.[0];

    if (!candidate) {
      return NextResponse.json(
        {
          error:
            "Gemini returned no evaluation candidate.",

          details:
            JSON.stringify(
              geminiData
            ).slice(0, 2000),
        },
        {
          status: 502,
        }
      );
    }

    if (
      candidate.finishReason ===
      "SAFETY"
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini blocked the evaluation response.",

          details:
            "Try submitting the answer again.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Extract Gemini text.
     */

    let outputText = "";

    const parts =
      candidate?.content?.parts ||
      [];

    for (
      const part of parts
    ) {
      if (
        typeof part.text ===
        "string"
      ) {
        outputText +=
          part.text;
      }
    }

    outputText =
      cleanJsonText(
        outputText
      );

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "Gemini returned empty evaluation.",

          details:
            `finishReason: ${
              candidate.finishReason ||
              "unknown"
            }`,
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Parse structured JSON.
     */

    let evaluation;

    try {
      evaluation =
        JSON.parse(
          outputText
        );
    } catch (error) {
      console.error(
        "Gemini JSON parse error:",
        error
      );

      console.error(
        "Raw Gemini output:",
        outputText
      );

      return NextResponse.json(
        {
          error:
            "Gemini evaluation JSON format invalid.",

          details:
            outputText.slice(
              0,
              2000
            ),
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Final score safety.
     */

    evaluation.maximum_marks =
      marks;

    const rawScore =
      Number(
        evaluation.overall_score
      );

    evaluation.overall_score =
      Math.max(
        0,
        Math.min(
          Number.isFinite(
            rawScore
          )
            ? rawScore
            : 0,
          marks
        )
      );

    /*
     * Keep internal section maximums sensible.
     */

    if (
      evaluation.demand_fulfilment
    ) {
      evaluation.demand_fulfilment.maximum =
        Number(
          evaluation.demand_fulfilment
            .maximum
        ) || 0;
    }

    if (
      evaluation.body_analysis
    ) {
      evaluation.body_analysis.content_maximum =
        Number(
          evaluation.body_analysis
            .content_maximum
        ) || 0;

      evaluation.body_analysis.analysis_maximum =
        Number(
          evaluation.body_analysis
            .analysis_maximum
        ) || 0;

      evaluation.body_analysis.structure_maximum =
        Number(
          evaluation.body_analysis
            .structure_maximum
        ) || 0;
    }

    if (
      evaluation.examples_and_data
    ) {
      evaluation.examples_and_data.maximum =
        Number(
          evaluation.examples_and_data
            .maximum
        ) || 0;
    }

    /*
     * Return the SAME evaluation object structure
     * expected by the existing SAMBHAV UPSC frontend.
     */

    return NextResponse.json(
      {
        success: true,

        evaluation,

        meta: {
          provider:
            "google-gemini",

          model,

          paper,

          section,

          marks,

          word_limit:
            wordLimit,

          pages:
            imageFiles.length,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Gemini evaluation route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Gemini AI evaluation failed.",

        details:
          error?.stack
            ? String(
                error.stack
              ).slice(0, 2000)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
