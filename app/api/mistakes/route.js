
import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../lib/smartQuizServer";

export async function GET(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view your Mistake Notebook." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const subject = searchParams.get("subject") || "all";
    const topic = searchParams.get("topic") || "all";
    const status = searchParams.get("status") || "active";

    if (!["active", "resolved", "all"].includes(status)) {
      return NextResponse.json(
        { error: "status must be active, resolved or all." },
        { status: 400 }
      );
    }

    let query =
      `select=*&user_id=eq.${encodeURIComponent(String(user.id))}` +
      "&order=last_attempted_at.desc";

    if (status === "active") {
      query += "&is_resolved=eq.false";
    } else if (status === "resolved") {
      query += "&is_resolved=eq.true";
    }

    if (subject.toLowerCase() !== "all") {
      query += `&subject=eq.${encodeURIComponent(subject)}`;
    }

    if (topic.toLowerCase() !== "all") {
      query += `&topic=eq.${encodeURIComponent(topic)}`;
    }

    const rows = await smartQuizDb("smart_quiz_mistakes", query);
    const mistakes = Array.isArray(rows) ? rows : [];

    if (mistakes.length === 0) {
      return NextResponse.json({
        mistakes: [],
        summary: {
          total: 0,
          active: 0,
          resolved: 0,
        },
      });
    }

    const questionIds = [
      ...new Set(mistakes.map((item) => String(item.question_id))),
    ];

    const questionFilter = questionIds
      .map((id) => encodeURIComponent(id))
      .join(",");

    const questionRows = await smartQuizDb(
      "prelims_pyqs",
      `select=id,question,explanation,explanation_hi,subject,topic,year,option_a,option_b,option_c,option_d,correct_option&id=in.(${questionFilter})`
    );

    const questionMap = new Map(
      (Array.isArray(questionRows) ? questionRows : []).map((question) => [
        String(question.id),
        question,
      ])
    );

    const enriched = mistakes.map((mistake) => {
      const question = questionMap.get(String(mistake.question_id));

      return {
        ...mistake,
        question: question?.question || "Question data unavailable",
        options: question
          ? [
              question.option_a,
              question.option_b,
              question.option_c,
              question.option_d,
            ].filter(
              (option) =>
                option !== null &&
                option !== undefined &&
                String(option).trim() !== ""
            )
          : [],
        explanation:
          question?.explanation_hi ||
          question?.explanation ||
          "",
        year: question?.year ?? null,
        subject: mistake.subject || question?.subject || "General",
        topic: mistake.topic || question?.topic || "General",
      };
    });

    const active = enriched.filter((item) => !item.is_resolved).length;
    const resolved = enriched.filter((item) => item.is_resolved).length;

    return NextResponse.json({
      mistakes: enriched,
      summary: {
        total: enriched.length,
        active,
        resolved,
      },
    });
  } catch (error) {
    console.error("Mistake notebook error:", error);

    return NextResponse.json(
      { error: error.message || "Unable to load mistakes." },
      { status: 500 }
    );
  }
}
