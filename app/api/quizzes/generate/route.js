
import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../../lib/smartQuizServer";

export async function POST(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to generate a quiz." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const mode = body.mode || "practice";
    const subject = body.subject || "all";
    const topic = body.topic || "all";
    const year = body.year || "all";

    const requestedCount = Number(body.count || body.totalQuestions || 20);
    const count = Math.max(
      1,
      Math.min(100, Math.floor(requestedCount))
    );

    if (!["practice", "exam", "mistake_retest"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid quiz mode." },
        { status: 400 }
      );
    }

    let questionRows = [];

    if (mode === "mistake_retest") {
      let mistakeQuery =
        "select=question_id,subject,topic,correct_option" +
        `&user_id=eq.${encodeURIComponent(String(user.id))}` +
        "&is_resolved=eq.false" +
        "&order=last_attempted_at.asc";

      if (subject !== "all") {
        mistakeQuery += `&subject=eq.${encodeURIComponent(subject)}`;
      }

      if (topic !== "all") {
        mistakeQuery += `&topic=eq.${encodeURIComponent(topic)}`;
      }

      const mistakes = await smartQuizDb(
        "smart_quiz_mistakes",
        mistakeQuery
      );

      const mistakeIds = [
        ...new Set(
          (Array.isArray(mistakes) ? mistakes : []).map(
            (item) => String(item.question_id)
          )
        ),
      ].slice(0, count);

      if (mistakeIds.length === 0) {
        return NextResponse.json(
          { error: "No active mistakes found to retest." },
          { status: 404 }
        );
      }

      const idFilter = mistakeIds
        .map((id) => encodeURIComponent(id))
        .join(",");

      questionRows = await smartQuizDb(
        "prelims_pyqs",
        `select=id,question,option_a,option_b,option_c,option_d,correct_option,explanation,explanation_hi,subject,topic,year` +
          `&id=in.(${idFilter})`
      );

      const questionMap = new Map(
        (Array.isArray(questionRows) ? questionRows : []).map(
          (item) => [String(item.id), item]
        )
      );

      questionRows = mistakeIds
        .map((id) => questionMap.get(id))
        .filter(Boolean);
    } else {
      let query =
        "select=id,question,option_a,option_b,option_c,option_d,correct_option,explanation,explanation_hi,subject,topic,year";

      const filters = [];

      if (subject !== "all") {
        filters.push(`subject=eq.${encodeURIComponent(subject)}`);
      }

      if (topic !== "all") {
        filters.push(`topic=eq.${encodeURIComponent(topic)}`);
      }

      if (year !== "all") {
        filters.push(`year=eq.${encodeURIComponent(String(year))}`);
      }

      query += filters.length ? `&${filters.join("&")}` : "";
      query += `&limit=${Math.min(5000, count * 20)}`;

      const rows = await smartQuizDb("prelims_pyqs", query);

      const validRows = (Array.isArray(rows) ? rows : []).filter(
        (item) =>
          Number.isInteger(Number(item.correct_option)) &&
          Number(item.correct_option) >= 0 &&
          Number(item.correct_option) <= 3
      );

      // Shuffle candidates before selecting the requested count.
      for (let i = validRows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validRows[i], validRows[j]] = [validRows[j], validRows[i]];
      }

      questionRows = validRows.slice(0, count);
    }

    if (!questionRows.length) {
      return NextResponse.json(
        { error: "No questions found for the selected filters." },
        { status: 404 }
      );
    }

    const sessionRows = await smartQuizDb(
      "smart_quiz_sessions",
      "",
      {
        method: "POST",
        body: {
          user_id: String(user.id),
          mode,
          subject: subject === "all" ? null : subject,
          topic: topic === "all" ? null : topic,
          total_questions: questionRows.length,
          attempted_questions: 0,
          correct_answers: 0,
          wrong_answers: 0,
          score: 0,
          accuracy: 0,
          time_taken_seconds: 0,
          status: "in_progress",
        },
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    const session = Array.isArray(sessionRows)
      ? sessionRows[0]
      : sessionRows;

    if (!session?.id) {
      throw new Error("Unable to create quiz session.");
    }

    const questions = questionRows.map((item) => ({
      id: String(item.id),
      question: item.question,
      options: [
        item.option_a,
        item.option_b,
        item.option_c,
        item.option_d,
      ],
      subject: item.subject || "General",
      topic: item.topic || "General",
      year: item.year ?? null,
      explanation: item.explanation_hi || item.explanation || "",
    }));

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      mode,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);

    return NextResponse.json(
      { error: error.message || "Unable to generate quiz." },
      { status: 500 }
    );
  }
}
