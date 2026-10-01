import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

const SYSTEM_INSTRUCTIONS = `
You are an expert UPSC Civil Services Examination Mains evaluator.

Your task is to evaluate a candidate's answer with a rigorous UPSC-oriented framework.

IMPORTANT:
Do NOT give arbitrary praise.
Do NOT give an inflated score merely because the answer is grammatically good.
Do NOT evaluate only language quality.
Do NOT invent facts, data, committee names, judgments, reports or examples.
Do NOT claim that a particular score is an official UPSC score.
Your score is an analytical estimate based on the supplied question, marks and answer.

FIRST understand the QUESTION.
Then understand its DIRECTIVE.
Then identify every important DEMAND of the question.
Only after that evaluate the candidate's answer.

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
13. Data where genuinely useful
14. Constitutional/legal/institutional references where relevant
15. Current affairs linkage where relevant
16. Factual accuracy
17. Balance and nuance
18. Way forward where demanded
19. Word-limit discipline
20. Overall UPSC suitability

DIRECTIVE RULES:

Discuss:
Require balanced explanation and relevant dimensions.

Examine:
Require examination of the issue with evidence, causes, effects and relevant limitations.

Analyse:
Break the issue into components and establish relationships such as cause-effect, significance, consequences or interlinkages.

Critically Analyse:
Analyse both sides, limitations/counterarguments and then arrive at a balanced conclusion.

Evaluate:
Assess against relevant criteria and reach a reasoned conclusion.

Critically Evaluate:
Assess merits and limitations and reach a balanced judgement.

Comment:
Give a reasoned assessment, not merely description.

Elucidate:
Explain clearly with adequate detail and examples.

Explain:
Clarify the concept, process, causes, significance or consequences as demanded.

Discuss:
Do not convert the answer into a one-sided opinion.

GS-SPECIFIC EVALUATION:

GS1:
Give importance to historical, geographical, social, cultural and spatial dimensions where relevant.

GS2:
Look for constitutional provisions, institutions, governance, federalism, rights, welfare, judiciary, accountability, international relations and stakeholder dimensions where relevant.

GS3:
Look for economic, technological, environmental, agricultural, security, disaster-management and development dimensions where relevant.

GS4:
Evaluate ethical concepts, values, stakeholders, conflicts, justification, emotional intelligence, integrity, probity and practical administrative reasoning as applicable.

ESSAY:
Evaluate coherence, philosophical depth, multidimensionality, arguments, examples, balance, originality, structure and conclusion.

CASE STUDY:
Evaluate stakeholders, ethical issues, competing values, options, consequences, justification, prioritisation, implementation and practical administrative feasibility.

MARKING:

Respect the maximum marks supplied by the request.

Never give more than maximum_marks.

A 10-mark answer should normally be evaluated against the expected depth of a 150-word answer.

A 15-mark answer should normally be evaluated against the expected depth of a 250-word answer.

Do not mechanically deduct marks only because an answer is short or long. Consider whether the word limit materially affected demand fulfilment.

SCORING:

Use conservative, discriminating scoring.

A technically correct but superficial answer should not receive a high score.

A well-structured answer with strong language but poor question demand fulfilment should score accordingly.

A concise answer can score well if it covers the core demands effectively.

A factual error should be identified only when reasonably clear from the supplied material or established knowledge. If uncertain, state that it should be verified rather than presenting the correction as certain.

The output must explain WHY the score was given.

MISSING DIMENSIONS:

Identify important dimensions that the candidate actually missed.

For every missing dimension explain:
- why it matters
- how the candidate could have incorporated it

POINT-LEVEL FEEDBACK:

Identify specific weaknesses from the candidate answer.
Do not invent quotations that are not present.

MODEL FRAMEWORK:

Provide a framework for a stronger answer, NOT a memorised model answer.

The framework should show:
Introduction → dimensions/body → examples/data → way forward if relevant → conclusion.

FINAL IMPROVEMENT PLAN:

Give practical changes the candidate should make in the next attempt.

The final examiner summary should be concise but rigorous.
`;

function getDirectiveHint(question) {
  const q = question.toLowerCase();

  if (
    q.includes("critically analyse")
  ) {
    return "Critically Analyse";
  }

  if (
    q.includes("critically evaluate")
  ) {
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

function cleanString(value, maxLength) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(0, maxLength);
}

export async function POST(request) {
  try {
    if (
      !process.env.OPENAI_API_KEY
    ) {
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

    const question =
      cleanString(
        body.question,
        12000
      );

    const answer =
      cleanString(
        body.answer,
        30000
      );

    const paper =
      cleanString(
        body.paper || "GS",
        100
      );

    const section =
      cleanString(
        body.section || "",
        100
      );

    const marks = Number(
      body.marks || 15
    );

    const wordLimit = Number(
      body.word_limit ||
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
      !Number.isFinite(
        wordLimit
      ) ||
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
      getDirectiveHint(
        question
      );

    const userPrompt = `
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

Detected directive:
${directive}

IMPORTANT:
Evaluate the answer actually supplied.
Do not assume that the candidate has written points that are not present.
Do not invent missing examples.
Do not inflate the score.
Explain the score through the rubric.

Return only the requested structured evaluation.
`;

    const response =
      await openai.responses.create(
        {
          model:
            process.env.OPENAI_EVALUATION_MODEL ||
            "gpt-5.6-sol",

          instructions:
            SYSTEM_INSTRUCTIONS,

          input: userPrompt,

          reasoning: {
            effort: "high",
          },

          max_output_tokens:
            10000,

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
        }
      );

    const output =
      response.output_text;

    if (!output) {
      return NextResponse.json(
        {
          error:
            "AI evaluation returned an empty result.",
        },
        { status: 502 }
      );
    }

    let evaluation;

    try {
      evaluation =
        JSON.parse(output);
    } catch (parseError) {
      console.error(
        "AI JSON parse error:",
        parseError
      );

      return NextResponse.json(
        {
          error:
            "AI evaluation format invalid.",
        },
        { status: 502 }
      );
    }

    /*
     * Server-side safety check:
     * AI must never return a score above
     * the question's maximum marks.
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
            process.env.OPENAI_EVALUATION_MODEL ||
            "gpt-5.6-sol",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "AI evaluation error:",
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
