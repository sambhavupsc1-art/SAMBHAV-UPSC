import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = `
You are an expert UPSC Civil Services Examination Mains evaluator.

The candidate has submitted handwritten answer pages as images.

First read ALL submitted pages in order.
Treat Page 1, Page 2, Page 3 and Page 4 as one continuous answer.

Do not evaluate a page in isolation.

Carefully reconstruct the candidate's written answer from the images.

If handwriting is unclear:
- do not invent text
- explicitly mention uncertainty
- evaluate only what can reasonably be read

Evaluate at genuine UPSC Mains level.

Do NOT give arbitrary praise.
Do NOT inflate marks.
Do NOT judge only handwriting, grammar or presentation.
Do NOT invent facts, data, reports, committees, judgments or examples.
Do NOT claim that the score is an official UPSC score.

Analyse the QUESTION first.

Identify:
1. Directive
2. Core demand
3. Keywords
4. Expected dimensions

Then evaluate the candidate answer.

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
14. Constitutional/legal/institutional references where relevant
15. Current affairs linkage where relevant
16. Factual accuracy
17. Balance and nuance
18. Way forward where demanded
19. Word-limit discipline
20. Overall UPSC suitability

For GS1 consider:
history, geography, society, culture and relevant interdisciplinary dimensions.

For GS2 consider:
Constitution, governance, Parliament, judiciary, federalism, rights, welfare, accountability, social justice and international relations.

For GS3 consider:
economy, agriculture, science and technology, environment, disaster management, internal security and development.

For GS4 consider:
ethical concepts, values, stakeholders, conflicts, integrity, probity, emotional intelligence and practical administrative reasoning.

For case studies:
stakeholders, ethical issues, competing values, options, consequences, justification and implementation.

For Essay:
coherence, philosophical depth, multidimensionality, arguments, examples, balance, originality, structure and conclusion.

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
Assess whether the word limit affected demand fulfilment.

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

/* =========================================================
   IMAGE -> DATA URL
========================================================= */

async function fileToDataUrl(
  file
) {
  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );

  const base64 =
    buffer.toString(
      "base64"
    );

  const mime =
    file.type ||
    "image/jpeg";

  return `data:${mime};base64,${base64}`;
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing on the server.",
        },
        {
          status: 500,
        }
      );
    }

    const formData =
      await request.formData();

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

    const imageFiles =
      [];

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
      imageFiles.length ===
      0
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
      imageFiles.length >
      4
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

    /* =========================
       CONVERT IMAGES
    ========================= */

    const imageInputs =
      [];

    for (
      let i = 0;
      i <
      imageFiles.length;
      i++
    ) {
      const file =
        imageFiles[i];

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Page ${
                i + 1
              } is not a valid image.`,
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
              `Page ${
                i + 1
              } exceeds 8MB.`,
          },
          {
            status: 400,
          }
        );
      }

      const dataUrl =
        await fileToDataUrl(
          file
        );

      imageInputs.push({
        type: "input_image",
        image_url:
          dataUrl,
        detail:
          "high",
      });
    }

    /* =========================
       OPENAI INPUT
    ========================= */

    const inputContent = [
      {
        type: "input_text",

        text: `
Evaluate the following UPSC Mains handwritten answer.

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

The following images are the candidate's answer pages.

Read every page carefully and in order.

Page 1 is followed by Page 2, then Page 3 and Page 4 if supplied.

Treat all pages as ONE continuous answer.

Do not evaluate the handwriting style itself.

Assess the substance of the answer.

If some handwriting is genuinely unreadable, explicitly mention the uncertainty rather than inventing text.

Provide a rigorous UPSC Mains evaluation.
`,
      },

      ...imageInputs,
    ];

    /* =========================
       OPENAI REQUEST
    ========================= */

    const openaiResponse =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${apiKey}`,
          },

          body: JSON.stringify({
            model:
              process.env
                .OPENAI_EVALUATION_MODEL ||
              "gpt-5.6-sol",

            instructions:
              SYSTEM_INSTRUCTIONS,

            input: [
              {
                role:
                  "user",

                content:
                  inputContent,
              },
            ],

            reasoning: {
              effort:
                "high",
            },

            max_output_tokens:
              10000,

            text: {
              format: {
                type:
                  "json_schema",

                name:
                  "upsc_mains_handwritten_evaluation",

                strict:
                  true,

                schema:
                  EVALUATION_SCHEMA,
              },
            },
          }),
        }
      );

    const responseText =
      await openaiResponse.text();

    if (
      !openaiResponse.ok
    ) {
      console.error(
        "OpenAI API error:",
        responseText
      );

      return NextResponse.json(
        {
          error:
            "OpenAI evaluation request failed.",
        },
        {
          status: 502,
        }
      );
    }

    let apiData;

    try {
      apiData =
        JSON.parse(
          responseText
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "OpenAI returned invalid response data.",
        },
        {
          status: 502,
        }
      );
    }

    /* =========================
       EXTRACT OUTPUT
    ========================= */

    let outputText =
      "";

    if (
      typeof apiData.output_text ===
      "string"
    ) {
      outputText =
        apiData.output_text;
    }

    if (
      !outputText
    ) {
      for (
        const item of
          apiData.output ||
          []
      ) {
        for (
          const content of
            item.content ||
            []
        ) {
          if (
            content.type ===
              "output_text" &&
            typeof content.text ===
              "string"
          ) {
            outputText +=
              content.text;
          }
        }
      }
    }

    if (
      !outputText
    ) {
      return NextResponse.json(
        {
          error:
            "AI evaluation returned empty output.",
        },
        {
          status: 502,
        }
      );
    }

    /* =========================
       PARSE JSON
    ========================= */

    let evaluation;

    try {
      evaluation =
        JSON.parse(
          outputText
        );
    } catch (error) {
      console.error(
        "Evaluation JSON parse error:",
        error,
        outputText
      );

      return NextResponse.json(
        {
          error:
            "AI evaluation JSON format invalid.",
        },
        {
          status: 502,
        }
      );
    }

    /* =========================
       SCORE SAFETY
    ========================= */

    evaluation.maximum_marks =
      marks;

    evaluation.overall_score =
      Math.max(
        0,
        Math.min(
          Number(
            evaluation.overall_score
          ) || 0,
          marks
        )
      );

    return NextResponse.json(
      {
        success: true,

        evaluation,

        meta: {
          paper,
          section,
          marks,
          word_limit:
            wordLimit,
          pages:
            imageFiles.length,
          model:
            process.env
              .OPENAI_EVALUATION_MODEL ||
            "gpt-5.6-sol",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "AI evaluation route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "AI evaluation failed.",
      },
      {
        status: 500,
      }
    );
  }
        }
