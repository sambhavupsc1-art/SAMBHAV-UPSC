import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL =
  process.env.GEMINI_EVALUATION_MODEL ||
  "gemini-3.8-flash";

const SYSTEM_INSTRUCTIONS = `
You are an expert UPSC Civil Services Examination Mains evaluator.

The candidate has submitted handwritten answer pages as images.

Read ALL submitted pages in order.

Treat Page 1, Page 2, Page 3 and Page 4 as ONE continuous answer.

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

async function fileToBase64(file) {
  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  return buffer.toString("base64");
}

export async function POST(request) {
  try {
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

    /*
     * Read up to 4 handwritten answer pages.
     */

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
     * Gemini Interactions API accepts image
     * content using base64 inline data.
     */

    const imageInputs = [];

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

      imageInputs.push({
        type: "image",

        data: base64,

        mime_type: mimeType,
      });
    }

    const userPrompt = `
Evaluate the following UPSC Civil Services Examination Mains answer.

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

The images supplied after this instruction are handwritten pages
of ONE continuous answer.

Read them strictly in this order:

Page 1
Page 2
Page 3
Page 4

Only the pages actually supplied exist.

IMPORTANT EVALUATION RULES:

1. First understand the question.
2. Identify its directive.
3. Identify its core demand.
4. Identify the expected dimensions.
5. Then evaluate the candidate answer against that demand.
6. Read all pages together.
7. Do not evaluate each page independently.
8. Do not invent unreadable text.
9. Do not assume an argument exists if it cannot be reasonably read.
10. Do not reward handwriting quality itself.
11. Do not inflate marks.
12. Do not give an official UPSC score.

A strong answer should demonstrate:
- direct question demand fulfilment
- appropriate directive handling
- relevant dimensions
- analytical depth
- examples
- data where useful
- constitutional/institutional references where relevant
- balance
- structure
- useful introduction
- relevant body
- meaningful conclusion
- appropriate way forward where required

Penalise:
- generic content
- irrelevant content
- repetition
- weak analysis
- factual errors
- missing dimensions
- poor directive handling
- unsupported claims
- weak conclusion
- excessive introduction
- failure to answer the actual question

For factual accuracy:
Only identify an error when there is reasonable basis.
Do not invent corrections.

For missing dimensions:
Explain why the dimension matters and how the candidate could include it.

For point-level feedback:
Give feedback on actual points visible in the candidate's answer.

For improvement:
Give practical advice that can be used in the next UPSC answer.

The final score must be between 0 and ${marks}.
`;

    /*
     * Gemini Interactions API.
     *
     * This replaces the old OpenAI API and the old
     * Gemini generateContent endpoint.
     */

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/interactions`;

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

    const requestBody = {
      model: MODEL,

      input,

      response_format: {
        type: "text",

        mime_type:
          "application/json",

        schema:
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

            "x-goog-api-key":
              apiKey,
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
     * Return actual Gemini error.
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
     * Interactions API returns output steps.
     */

    let outputText = "";

    const steps =
      geminiData?.steps ||
      [];

    for (
      const step of steps
    ) {
      if (
        step?.type ===
        "model_output"
      ) {
        const contents =
          step?.content ||
          [];

        for (
          const content of contents
        ) {
          if (
            content?.type ===
              "text" &&
            typeof content?.text ===
              "string"
          ) {
            outputText +=
              content.text;
          }
        }
      }
    }

    /*
     * Some responses may expose output_text
     * directly.
     */

    if (
      !outputText &&
      typeof geminiData?.output_text ===
        "string"
    ) {
      outputText =
        geminiData.output_text;
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
            `Interaction status: ${
              geminiData?.status ||
              "unknown"
            }`,
        },
        {
          status: 502,
        }
      );
    }

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
     * Score safety.
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
     * Return exactly the structure expected
     * by the existing SAMBHAV UPSC frontend.
     */

    return NextResponse.json(
      {
        success: true,

        evaluation,

        meta: {
          provider:
            "google-gemini",

          model:
            MODEL,

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
