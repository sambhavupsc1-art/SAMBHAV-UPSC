import { NextResponse } from "next/server";

export const runtime = "nodejs";

/*
|--------------------------------------------------------------------------
| GEMINI MODEL FALLBACK
|--------------------------------------------------------------------------
|
| अगर पहला model high-demand / temporary capacity error देता है,
| तो automatically अगला model try होगा.
|
*/

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

/*
|--------------------------------------------------------------------------
| SYSTEM INSTRUCTIONS
|--------------------------------------------------------------------------
*/

const SYSTEM_INSTRUCTIONS = `
You are an expert UPSC Civil Services Examination Mains evaluator.

The candidate has submitted handwritten answer pages as images.

Read ALL submitted pages in order.

Treat all pages as ONE continuous answer.

Do not evaluate pages separately.

Carefully reconstruct the candidate's written answer from the images.

If handwriting is unclear:
- do not invent text
- explicitly mention uncertainty
- evaluate only what can reasonably be read

Evaluate at genuine UPSC Mains level.

Do not give arbitrary praise.
Do not inflate marks.
Do not judge only handwriting, grammar or presentation.
Do not invent facts, data, reports, committees, judgments or examples.
Do not claim the score is an official UPSC score.

FIRST ANALYSE THE QUESTION.

Identify:
1. Directive
2. Core demand
3. Keywords
4. Expected dimensions

Then evaluate:

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
14. Constitutional/legal/institutional references where relevant
15. Current affairs linkage where relevant
16. Factual accuracy
17. Balance and nuance
18. Way forward where demanded
19. Word-limit discipline
20. Overall UPSC suitability

GS1:
History, geography, society, culture and interdisciplinary dimensions.

GS2:
Constitution, governance, Parliament, judiciary, federalism, rights,
welfare, accountability, social justice and international relations.

GS3:
Economy, agriculture, science and technology, environment,
disaster management, internal security and development.

GS4:
Ethical concepts, values, stakeholders, conflicts, integrity,
probity, emotional intelligence and administrative reasoning.

CASE STUDIES:
Stakeholders, ethical issues, competing values, options,
consequences, justification and implementation.

ESSAY:
Coherence, philosophical depth, multidimensionality, arguments,
examples, balance, originality, structure and conclusion.

DIRECTIVE RULES:

Discuss:
Cover the issue through balanced relevant dimensions.

Examine:
Examine arguments, causes, effects, limitations and evidence.

Analyse:
Break the issue into components and establish relationships.

Critically Analyse:
Analyse multiple sides, limitations and counterarguments before a balanced conclusion.

Evaluate:
Assess against relevant criteria and provide a reasoned conclusion.

Critically Evaluate:
Assess merits, limitations and counterarguments before a balanced conclusion.

Comment:
Give a reasoned assessment.

Elucidate:
Explain clearly with sufficient detail and examples.

Explain:
Clearly explain the demanded concept, process, causes or consequences.

MARKING:

Never exceed maximum marks.

10-mark answers generally correspond to approximately 150 words.
15-mark answers generally correspond to approximately 250 words.

Do not mechanically reduce marks only because of word count.
Assess whether word-limit discipline affected demand fulfilment.

A superficial answer should not receive a high score.

Strong handwriting or presentation should not produce a high score.

The score must be justified.

For missing dimensions:
Explain why the dimension matters and how it could be added.

Only discuss points actually present in the answer.

Do not invent quotations or claims made by the candidate.

Return ONLY valid JSON matching the supplied schema.
`;

/*
|--------------------------------------------------------------------------
| EVALUATION SCHEMA
|--------------------------------------------------------------------------
*/

const EVALUATION_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    overall_score: {
      type: "number",
    },

    maximum_marks: {
      type: "number",
    },

    overall_assessment: {
      type: "string",
    },

    question_analysis: {
      type: "object",
      additionalProperties: false,

      properties: {
        directive: {
          type: "string",
        },

        core_demand: {
          type: "string",
        },

        keywords: {
          type: "array",
          items: {
            type: "string",
          },
        },

        expected_dimensions: {
          type: "array",
          items: {
            type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        score: {
          type: "number",
        },

        maximum: {
          type: "number",
        },

        assessment: {
          type: "string",
        },

        missing_demands: {
          type: "array",
          items: {
            type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        assessment: {
          type: "string",
        },

        strengths: {
          type: "array",
          items: {
            type: "string",
          },
        },

        weaknesses: {
          type: "array",
          items: {
            type: "string",
          },
        },

        improvement: {
          type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        content_score: {
          type: "number",
        },

        content_maximum: {
          type: "number",
        },

        analysis_score: {
          type: "number",
        },

        analysis_maximum: {
          type: "number",
        },

        structure_score: {
          type: "number",
        },

        structure_maximum: {
          type: "number",
        },

        assessment: {
          type: "string",
        },

        strengths: {
          type: "array",
          items: {
            type: "string",
          },
        },

        weaknesses: {
          type: "array",
          items: {
            type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        score: {
          type: "number",
        },

        maximum: {
          type: "number",
        },

        assessment: {
          type: "string",
        },

        good_examples: {
          type: "array",
          items: {
            type: "string",
          },
        },

        missing_examples: {
          type: "array",
          items: {
            type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        assessment: {
          type: "string",
        },

        possible_errors: {
          type: "array",
          items: {
            type: "string",
          },
        },

        corrections: {
          type: "array",
          items: {
            type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        assessment: {
          type: "string",
        },

        strengths: {
          type: "array",
          items: {
            type: "string",
          },
        },

        weaknesses: {
          type: "array",
          items: {
            type: "string",
          },
        },

        improvement: {
          type: "string",
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
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          dimension: {
            type: "string",
          },

          why_important: {
            type: "string",
          },

          how_to_add: {
            type: "string",
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
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          issue: {
            type: "string",
          },

          type: {
            type: "string",
          },

          improvement: {
            type: "string",
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
      type: "object",
      additionalProperties: false,

      properties: {
        introduction: {
          type: "string",
        },

        body: {
          type: "array",
          items: {
            type: "string",
          },
        },

        conclusion: {
          type: "string",
        },
      },

      required: [
        "introduction",
        "body",
        "conclusion",
      ],
    },

    model_framework: {
      type: "array",
      items: {
        type: "string",
      },
    },

    improvement_plan: {
      type: "array",
      items: {
        type: "string",
      },
    },

    examiner_summary: {
      type: "string",
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

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanJsonText(text) {
  if (!text) return "";

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

function isTemporaryError(status, details) {
  const message =
    String(details || "").toLowerCase();

  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily unavailable") ||
    message.includes("capacity") ||
    message.includes("try again later") ||
    message.includes("resource exhausted") ||
    message.includes("rate limit")
  );
}

async function fileToBase64(file) {
  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  return buffer.toString("base64");
}

/*
|--------------------------------------------------------------------------
| GEMINI CALL
|--------------------------------------------------------------------------
*/

async function callGemini({
  model,
  apiKey,
  input,
}) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/interactions";

  const body = {
    model,
    input,

    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: EVALUATION_SCHEMA,
    },
  };

  let response;

  try {
    response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey,
        },

        body: JSON.stringify(body),
      }
    );
  } catch (error) {
    return {
      success: false,
      status: 503,
      details:
        error?.message ||
        "Network error while contacting Gemini.",
    };
  }

  const responseText =
    await response.text();

  if (!response.ok) {
    let details = responseText;

    try {
      const parsed =
        JSON.parse(responseText);

      details =
        parsed?.error?.message ||
        parsed?.error?.status ||
        responseText;
    } catch {
      // Keep raw response.
    }

    return {
      success: false,

      status:
        response.status,

      details:
        String(details).slice(
          0,
          2500
        ),
    };
  }

  let data;

  try {
    data =
      JSON.parse(responseText);
  } catch {
    return {
      success: false,
      status: 502,
      details:
        "Gemini returned invalid JSON response.",
    };
  }

  /*
   * Interactions API model output
   */

  let outputText = "";

  const steps =
    Array.isArray(data?.steps)
      ? data.steps
      : [];

  for (const step of steps) {
    if (
      step?.type !==
      "model_output"
    ) {
      continue;
    }

    const contents =
      Array.isArray(
        step?.content
      )
        ? step.content
        : [];

    for (const content of contents) {
      if (
        typeof content?.text ===
        "string"
      ) {
        outputText +=
          content.text;
      }
    }
  }

  /*
   * Other possible response shapes
   */

  if (
    !outputText &&
    typeof data?.output_text ===
      "string"
  ) {
    outputText =
      data.output_text;
  }

  if (
    !outputText &&
    Array.isArray(
      data?.output
    )
  ) {
    for (const item of data.output) {
      if (
        typeof item?.text ===
        "string"
      ) {
        outputText +=
          item.text;
      }

      if (
        Array.isArray(
          item?.content
        )
      ) {
        for (
          const content of
            item.content
        ) {
          if (
            typeof content?.text ===
            "string"
          ) {
            outputText +=
              content.text;
          }
        }
      }
    }
  }

  outputText =
    cleanJsonText(
      outputText
    );

  if (!outputText) {
    return {
      success: false,
      status: 502,
      details:
        `Gemini returned empty output. Interaction status: ${
          data?.status ||
          "unknown"
        }`,
    };
  }

  let evaluation;

  try {
    evaluation =
      JSON.parse(
        outputText
      );
  } catch {
    return {
      success: false,
      status: 502,
      details:
        `Gemini returned invalid evaluation JSON: ${outputText.slice(
          0,
          1500
        )}`,
    };
  }

  return {
    success: true,
    evaluation,
  };
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is missing.",

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

    /*
     * QUESTION
     */

    const question =
      String(
        formData.get(
          "question"
        ) || ""
      ).trim();

    const paper =
      String(
        formData.get(
          "paper"
        ) || "GS"
      ).trim();

    const section =
      String(
        formData.get(
          "section"
        ) || ""
      ).trim();

    const marks =
      Number(
        formData.get(
          "marks"
        ) || 15
      );

    const wordLimit =
      Number(
        formData.get(
          "word_limit"
        ) ||
          (marks <= 10
            ? 150
            : 250)
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
      !Number.isFinite(
        marks
      ) ||
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

    /*
     * HANDWRITTEN PAGES
     */

    const imageFiles = [];

    for (
      let i = 1;
      i <= 4;
      i++
    ) {
      const file =
        formData.get(
          `image_${i}`
        );

      if (
        file &&
        typeof file.arrayBuffer ===
          "function"
      ) {
        imageFiles.push(
          file
        );
      }
    }

    if (
      imageFiles.length === 0
    ) {
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

    if (
      imageFiles.length > 4
    ) {
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
     * IMAGE INPUT
     */

    const imageInputs = [];

    for (
      let i = 0;
      i < imageFiles.length;
      i++
    ) {
      const file =
        imageFiles[i];

      const mimeType =
        file.type ||
        "image/jpeg";

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
              `Page ${
                i + 1
              } must be JPG, PNG or WEBP.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        file.size >
        8 *
          1024 *
          1024
      ) {
        return NextResponse.json(
          {
            error:
              `Page ${
                i + 1
              } exceeds 8MB.`,
          },
          {
            status: 400,
          }
        );
      }

      const base64 =
        await fileToBase64(
          file
        );

      imageInputs.push({
        type: "image",
        data: base64,
        mime_type:
          mimeType,
      });
    }

    /*
     * USER PROMPT
     */

    const userPrompt = `
Evaluate this UPSC Civil Services Examination Mains handwritten answer.

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

The supplied images are pages of ONE continuous answer.

Read all pages in order.

Do not evaluate pages independently.

First understand the question and directive.

Then compare the actual answer against the question demand.

Evaluate:
- demand fulfilment
- relevance
- content
- analysis
- dimensions
- structure
- introduction
- body
- examples
- data
- factual accuracy
- conclusion
- balance
- current affairs linkage where relevant
- constitutional/institutional references where relevant
- word-limit discipline

Do not invent unreadable text.

Do not invent facts.

Do not reward handwriting quality itself.

Do not artificially inflate marks.

The final score must be between 0 and ${marks}.

Give practical feedback useful for the next UPSC Mains answer.
`;

    const input = [
      {
        type: "text",
        text:
          SYSTEM_INSTRUCTIONS,
      },

      {
        type: "text",
        text:
          userPrompt,
      },

      ...imageInputs,
    ];

    /*
     * FALLBACK EXECUTION
     */

    let evaluation = null;
    let successfulModel = null;
    let lastFailure = null;

    const attemptedModels = [];

    for (
      let index = 0;
      index < MODELS.length;
      index++
    ) {
      const model =
        MODELS[index];

      attemptedModels.push(
        model
      );

      console.log(
        `[SAMBHAV AI] Trying model: ${model}`
      );

      const result =
        await callGemini({
          model,
          apiKey,
          input,
        });

      if (
        result.success
      ) {
        evaluation =
          result.evaluation;

        successfulModel =
          model;

        console.log(
          `[SAMBHAV AI] SUCCESS: ${model}`
        );

        break;
      }

      lastFailure =
        result;

      console.error(
        `[SAMBHAV AI] FAILED: ${model}`,
        result.status,
        result.details
      );

      /*
       * Temporary errors:
       * move to next model.
       *
       * Permanent errors:
       * stop immediately.
       */

      if (
        !isTemporaryError(
          result.status,
          result.details
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Gemini evaluation request failed.",

            gemini_status:
              result.status,

            details:
              result.details,

            model,

            attempted_models:
              attemptedModels,
          },
          {
            status: 502,
          }
        );
      }
    }

    /*
     * ALL MODELS FAILED
     */

    if (
      !evaluation ||
      !successfulModel
    ) {
      return NextResponse.json(
        {
          error:
            "All Gemini evaluation models are temporarily unavailable.",

          gemini_status:
            lastFailure?.status ||
            502,

          details:
            lastFailure?.details ||
            "All fallback models failed.",

          attempted_models:
            attemptedModels,
        },
        {
          status: 502,
        }
      );
    }

    /*
     * SCORE SAFETY
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
     * SUCCESS RESPONSE
     */

    return NextResponse.json(
      {
        success: true,

        evaluation,

        meta: {
          provider:
            "google-gemini",

          model:
            successfulModel,

          fallback_used:
            successfulModel !==
            MODELS[0],

          attempted_models:
            attemptedModels,

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
      "[SAMBHAV AI] Route error:",
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
              ).slice(
                0,
                2000
              )
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
