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
LANGUAGE RULE — VERY IMPORTANT:

Detect the dominant language of the candidate's handwritten answer from the uploaded images.

- If the handwritten answer is predominantly Hindi/Devanagari, ALL human-readable evaluation text must be in Hindi.
- If the handwritten answer is predominantly English/Latin, ALL human-readable evaluation text must be in English.
- If the answer is mixed Hindi and English, determine the dominant language and use that language for the complete evaluation.
- The evaluation language must be based primarily on the candidate's handwritten answer, not merely the question language.
- Do not unnecessarily mix Hindi and English sentences.
- Use natural UPSC-level terminology in the detected language.
- JSON field names must remain exactly as defined in the schema and must NOT be translated.
- All JSON values containing evaluation text must follow the detected language.
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


ADVANCED EXAMINER EVALUATION LAYER:

QUESTION DEMAND MAPPING:
- Decompose the question into the core demand and distinct sub-demands.
- For each demand, compare the examiner's expectation with explicit evidence in the candidate's answer.
- Use status exactly as one of: "Met", "Partial", or "Missing".
- Justify every status from the readable answer. Do not infer absent content.

INTRODUCTION, BODY AND CONCLUSION:
- Evaluate these independently and provide specific improvements only where useful.
- Evaluate paragraph/argument blocks for logic, coverage, analysis, repetition and relevance.
- Distinguish conceptual errors from language or presentation issues.

KEYWORD AUDIT:
- Identify effective keywords actually used.
- Identify missing high-value terms and specify where to insert them and why.
- Identify incorrect, vague or superficial terminology and propose corrections.
- Avoid keyword stuffing and generic fixed keyword lists.

VISUAL ANALYSIS:
- Inspect all supplied answer images for actual diagrams, flowcharts, maps, tables, timelines or figures.
- Assess existing visuals for correctness, relevance, labels, readability and integration with the written answer.
- Recommend a new visual only when it genuinely improves understanding or compresses a complex relationship.
- For each recommended visual, specify exact placement, purpose, type, required labels, relevance, priority ("Essential", "Beneficial", or "Optional") and estimated space ("Small", "Medium", or "Large").
- If no visual would materially help, set no_additional_diagram_needed to true and explicitly say "No additional diagram is necessary for this question."
- Never claim to have inspected visual details that are not readable.

EVIDENCE AUDIT:
- Identify where reliable evidence would strengthen an argument.
- Suggest an example, statistic, judgment, report, scheme or committee only when sufficiently confident it is accurate and relevant.
- If current or exact facts cannot be verified, state that verification is needed. Never fabricate a citation, statistic or official marking scheme.

SCORING:
- Preserve the existing marks scale and maximum marks.
- Provide criterion-wise marks whose maximums add up to the question's maximum marks, without duplicate scoring or double penalties.
- Score the answer against the question and rubric, not by subtracting arbitrary penalties from a perfect score.
- Keep marks plausible and avoid false precision. State that the score is an AI estimate, not an official UPSC score.
- Do not award marks merely for decorative visuals, headings, or keyword quantity.

SENTENCE-LEVEL IMPROVEMENT:
- Quote only short, readable exact passages from the candidate's answer.
- For each selected passage, state the problem, improved version and reason.
- Do not fabricate a candidate quotation. If exact wording is unclear, describe the issue without quoting.

MODEL ANSWER:
- Provide a complete, question-specific model answer in the dominant language detected from the candidate's answer.
- Respect the provided word limit as closely as possible and cover every identified demand.
- Include a text-based visual only when it genuinely helps.
- Do not present the model answer as official UPSC material.
- If the question or answer lacks enough context, disclose the limitation.

FINAL PRIORITIES:
- List the three to five highest-impact improvements in priority order.
- Each major criticism must state what is wrong, why it matters, where it occurs, and how to correct it.
- For a strong answer, identify genuine refinements without inventing faults.
- Adapt all evaluation text to the candidate's dominant language. Keep JSON field names unchanged.

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


    demand_mapping: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          demand: { type: "string" },
          examiner_expectation: { type: "string" },
          answer_evidence: { type: "string" },
          status: { type: "string" },
          justification: { type: "string" },
        },
        required: [
          "demand",
          "examiner_expectation",
          "answer_evidence",
          "status",
          "justification",
        ],
      },
    },

    keyword_audit: {
      type: "object",
      additionalProperties: false,
      properties: {
        correctly_used: { type: "array", items: { type: "string" } },
        missing_keywords: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              keyword: { type: "string" },
              why_it_matters: { type: "string" },
              insertion_point: { type: "string" },
              priority: { type: "string" },
            },
            required: ["keyword", "why_it_matters", "insertion_point", "priority"],
          },
        },
        weak_or_incorrect: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              term_or_passage: { type: "string" },
              issue: { type: "string" },
              correction: { type: "string" },
            },
            required: ["term_or_passage", "issue", "correction"],
          },
        },
      },
      required: ["correctly_used", "missing_keywords", "weak_or_incorrect"],
    },

    visual_analysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        existing_visuals: { type: "array", items: { type: "string" } },
        opportunities: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              location_in_answer: { type: "string" },
              purpose: { type: "string" },
              recommended_type: { type: "string" },
              required_labels: { type: "array", items: { type: "string" } },
              examiner_relevance: { type: "string" },
              priority: { type: "string" },
              estimated_space: { type: "string" },
              text_diagram: { type: "string" },
            },
            required: [
              "location_in_answer",
              "purpose",
              "recommended_type",
              "required_labels",
              "examiner_relevance",
              "priority",
              "estimated_space",
              "text_diagram",
            ],
          },
        },
        no_additional_diagram_needed: { type: "boolean" },
        overall_assessment: { type: "string" },
      },
      required: [
        "existing_visuals",
        "opportunities",
        "no_additional_diagram_needed",
        "overall_assessment",
      ],
    },

    evidence_audit: {
      type: "object",
      additionalProperties: false,
      properties: {
        missing_evidence: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              argument_to_support: { type: "string" },
              evidence_type: { type: "string" },
              suggested_example: { type: "string" },
              insertion_point: { type: "string" },
              priority: { type: "string" },
              verification_status: { type: "string" },
            },
            required: [
              "argument_to_support",
              "evidence_type",
              "suggested_example",
              "insertion_point",
              "priority",
              "verification_status",
            ],
          },
        },
        verification_notes: { type: "array", items: { type: "string" } },
      },
      required: ["missing_evidence", "verification_notes"],
    },

    marks_breakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterion: { type: "string" },
          awarded: { type: "number" },
          maximum: { type: "number" },
          rationale: { type: "string" },
        },
        required: ["criterion", "awarded", "maximum", "rationale"],
      },
    },

    sentence_improvements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          problem: { type: "string" },
          improved: { type: "string" },
          reason: { type: "string" },
        },
        required: ["original", "problem", "improved", "reason"],
      },
    },

    model_answer: { type: "string" },
    quality_level: { type: "string" },
    word_count_assessment: { type: "string" },

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
    "demand_mapping",
    "keyword_audit",
    "visual_analysis",
    "evidence_audit",
    "marks_breakdown",
    "sentence_improvements",
    "model_answer",
    "quality_level",
    "word_count_assessment",
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
Evaluate this UPSC Civil Services Examination Mains handwritten answer using the advanced examiner evaluation layer.

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

The supplied images are pages of ONE continuous answer, in the order provided.
Read every page before evaluating. Reconstruct only text that can reasonably be read.
Flag uncertain handwriting/OCR and do not invent the candidate's wording.

MANDATORY EVALUATION:
1. Decode the directive, core demand, sub-demands, scope, expected approach and common traps.
2. Map every demand to the actual answer evidence and classify it as Met, Partial or Missing.
3. Evaluate introduction, body argument blocks, and conclusion separately.
4. Audit correct, missing, weak, or incorrect keywords with exact insertion points.
5. Inspect any visible diagrams, flowcharts, maps, tables or figures. Evaluate existing visuals and recommend only useful additions, with placement, labels, purpose, priority and estimated space.
6. Explicitly state when no additional diagram is necessary.
7. Audit relevant data, constitutional references, judgments, reports, schemes, examples and case studies. Never fabricate evidence; mark uncertain facts as needing verification.
8. Assess analytical depth, balance, logic, repetition, relevance, word-limit discipline and factual accuracy.
9. Provide criterion-wise marks that are consistent with the existing rubric and add up to no more than ${marks}. Avoid double-counting.
10. Give sentence-level improvements only for readable exact passages.
11. Provide three to five prioritized improvements and a complete improved model answer within approximately ${wordLimit} words.
12. Detect the dominant language from the handwritten answer and write all human-readable evaluation fields in that language.
13. The model answer is an AI-generated suggested answer, not an official UPSC model answer.
14. The final score must be between 0 and ${marks}; it is an estimated AI assessment, not an official UPSC score.

Return every field required by the JSON schema. For fields with no applicable findings, return an empty array or an appropriate concise explanation rather than omitting the field.
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
