import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = `
You are an expert UPSC Civil Services Examination Mains evaluator.

Your job is to evaluate a candidate answer rigorously at UPSC Mains level.

Do NOT give arbitrary praise.
Do NOT inflate marks.
Do NOT judge only grammar or language.
Do NOT assume that an unstated point exists.
Do NOT invent facts, data, reports, committees, judgments or examples.
Do NOT claim that your marks are official UPSC marks.

First analyse the QUESTION.
Then identify its DIRECTIVE.
Then identify the exact DEMANDS of the question.
Only then evaluate the candidate answer.

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
13. Data where relevant
14. Constitutional/legal/institutional references where relevant
15. Current affairs linkage where relevant
16. Factual accuracy
17. Balance and nuance
18. Way forward where demanded
19. Word-limit discipline
20. Overall UPSC suitability

DIRECTIVES:

Discuss:
Cover the issue through balanced and relevant dimensions.

Examine:
Examine the issue using evidence, causes, effects, limitations and relevant arguments.

Analyse:
Break the issue into components and establish relationships such as cause-effect, significance, consequences and interlinkages.

Critically Analyse:
Analyse multiple sides, limitations/counterarguments and arrive at a balanced conclusion.

Evaluate:
Assess the issue against relevant criteria and provide a reasoned conclusion.

Critically Evaluate:
Assess merits, limitations and counterarguments before a balanced judgement.

Comment:
Give a reasoned assessment rather than simple description.

Elucidate:
Explain clearly with sufficient detail and relevant examples.

Explain:
Clearly explain the concept/process/causes/significance/consequences demanded by the question.

GS1:
Consider historical, geographical, social and cultural dimensions where relevant.

GS2:
Consider Constitution, governance, institutions, federalism, rights, welfare, accountability, judiciary, social justice and international relations where relevant.

GS3:
Consider economy, agriculture, technology, environment, disaster management, internal security and development dimensions where relevant.

GS4:
Consider ethical concepts, values, stakeholders, conflicts, integrity, probity, emotional intelligence and practical administrative reasoning where relevant.

CASE STUDY:
Evaluate stakeholders, ethical issues, competing values, options, consequences, justification, prioritisation and implementation.

ESSAY:
Evaluate coherence, philosophical depth, multidimensionality, arguments, examples, balance, originality, structure and conclusion.

MARKING:

Never exceed the supplied maximum marks.

10-mark answers generally correspond to approximately 150 words.
15-mark answers generally correspond to approximately 250 words.

Do not mechanically reduce marks only because of word count.
Assess whether the word limit affected demand fulfilment.

A technically correct but superficial answer should not receive a high score.

Strong language alone should not produce a high score.

The score MUST be justified.

For missing dimensions:
Explain why the dimension matters and how the candidate could add it.

For point-level feedback:
Only discuss points actually present in the candidate answer.
Do not invent quotations.

Model framework:
Give a framework, NOT a memorised model answer.

Final improvement plan:
Give specific changes for the next attempt.

Return ONLY valid JSON matching the supplied schema.
`;

const EVALUATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_score: { type: "number" },
    maximum_marks: { type: "number" },
    overall_assessment: { type: "string" },

    question_analysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        directive: { type: "string" },
        core_demand: { type: "string" },
        keywords: {
          type: "array",
          items: { type: "string" },
        },
        expected_dimensions: {
          type: "array",
          items: { type: "string" },
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
        score: { type: "number" },
        maximum: { type: "number" },
        assessment: { type: "string" },
        missing_demands: {
          type: "array",
          items: { type: "string" },
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
        assessment: { type: "string" },
        strengths: {
          type: "array",
          items: { type: "string" },
        },
        weaknesses: {
          type: "array",
          items: { type: "string" },
        },
        improvement: { type: "string" },
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
        content_score: { type: "number" },
        content_maximum: { type: "number" },
        analysis_score: { type: "number" },
        analysis_maximum: { type: "number" },
        structure_score: { type: "number" },
        structure_maximum: { type: "number" },
        assessment: { type: "string" },
        strengths: {
          type: "array",
          items: { type: "string" },
        },
        weaknesses: {
          type: "array",
          items: { type: "string" },
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
        score: { type: "number" },
        maximum: { type: "number" },
        assessment: { type: "string" },
        good_examples: {
          type: "array",
          items: { type: "string" },
        },
        missing_examples: {
          type: "array",
          items: { type: "string" },
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
        assessment: { type: "string" },
        possible_errors: {
          type: "array",
          items: { type: "string" },
        },
        corrections: {
          type: "array",
          items: { type: "string" },
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
        assessment: { type: "string" },
        strengths: {
          type: "array",
          items: { type: "string" },
        },
        weaknesses: {
          type: "array",
          items: { type: "string" },
        },
        improvement: { type: "string" },
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
          dimension: { type: "string" },
          why_important: { type: "string" },
          how_to_add: { type: "string" },
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
          issue: { type: "string" },
          type: { type: "string" },
          improvement: { type: "string" },
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
        introduction: { type: "string" },
        body: {
          type: "array",
          items: { type: "string" },
        },
        conclusion: { type: "string" },
      },
      required: [
        "introduction",
        "body",
        "conclusion",
      ],
    },

    model_framework: {
      type: "array",
      items: { type: "string" },
    },

    improvement_plan: {
      type: "array",
      items: { type: "string" },
    },

    examiner_summary: { type: "string" },
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

function cleanString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function detectDirective(question) {
  const q = question.toLowerCase();

  if (q.includes("critically analyse")) {
    return "Critically Analyse";
  }

  if (q.includes("critically evaluate")) {
    return "Critically Evaluate";
  }

  if (q.includes("analyse")) {
    return "Analyse";
  }

  if (q.includes("evaluate")) {
    return "Evaluate";
  }

  if (q.includes("examine")) {
    return "Examine";
  }

  if (q.includes("elucidate")) {
    return "Elucidate";
  }

  if (q.includes("comment")) {
    return "Comment";
  }

  if (q.includes("discuss")) {
    return "Discuss";
  }

  if (q.includes("explain")) {
    return "Explain";
  }

  return "Not clearly detected";
}

export async function POST(request) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing on the server.",
        },
        { status: 500 }
      );
    }

    const body =
      await request.json();

    const question = cleanString(
      body.question,
      12000
    );

    const answer = cleanString(
      body.answer,
      30000
    );

    const paper = cleanString(
      body.paper || "GS",
      100
    );

    const section = cleanString(
      body.section || "",
      100
    );

    const marks = Number(
      body.marks || 15
    );

    const wordLimit = Number(
      body.word_limit ||
        (marks <= 10 ? 150 : 250)
    );

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Question is required.",
        },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "Answer is required.",
        },
        { status: 400 }
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
            "Invalid marks value.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(wordLimit) ||
      wordLimit <= 0 ||
      wordLimit > 10000
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid word limit.",
        },
        { status: 400 }
      );
    }

    const directive =
      detectDirective(question);

    const userInput = `
Evaluate this UPSC Mains answer.

PAPER:
${paper}

SECTION:
${section || "Not specified"}

MAXIMUM MARKS:
${marks}

EXPECTED WORD LIMIT:
${wordLimit}

QUESTION:
${question}

CANDIDATE ANSWER:
${answer}

DETECTED DIRECTIVE:
${directive}

Evaluate only the answer supplied.
Do not assume missing points were written.
Do not invent facts.
Do not inflate marks.
Explain why the score was awarded.
`;

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
              process.env.OPENAI_EVALUATION_MODEL ||
              "gpt-5.6-sol",

            instructions:
              SYSTEM_INSTRUCTIONS,

            input: userInput,

            reasoning: {
              effort: "high",
            },

            max_output_tokens: 10000,

            text: {
              format: {
                type: "json_schema",
                name:
                  "upsc_mains_evaluation",
                strict: true,
                schema:
                  EVALUATION_SCHEMA,
              },
            },
          }),
        }
      );

    const responseText =
      await openaiResponse.text();

    if (!openaiResponse.ok) {
      console.error(
        "OpenAI API error:",
        responseText
      );

      return NextResponse.json(
        {
          error:
            "OpenAI evaluation request failed.",
          details:
            process.env.NODE_ENV ===
            "development"
              ? responseText
              : undefined,
        },
        { status: 502 }
      );
    }

    let apiData;

    try {
      apiData =
        JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error:
            "OpenAI returned invalid response data.",
        },
        { status: 502 }
      );
    }

    /*
     * Responses API output can contain
     * several output items.
     * Extract output_text safely.
     */

    let outputText = "";

    if (
      typeof apiData.output_text ===
      "string"
    ) {
      outputText =
        apiData.output_text;
    }

    if (!outputText) {
      for (const item of
        apiData.output || []) {
        for (const content of
          item.content || []) {
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

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "AI evaluation returned empty output.",
        },
        { status: 502 }
      );
    }

    let evaluation;

    try {
      evaluation =
        JSON.parse(outputText);
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
        { status: 502 }
      );
    }

    /*
     * Final server-side score protection.
     */

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
          word_limit: wordLimit,
          detected_directive:
            directive,
          model:
            process.env
              .OPENAI_EVALUATION_MODEL ||
            "gpt-5.6-sol",
        },
      },
      { status: 200 }
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
      { status: 500 }
    );
  }
}
