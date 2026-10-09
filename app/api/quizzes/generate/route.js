import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../../lib/smartQuizServer";

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function normalizeOptions(row) {
  if (Array.isArray(row.options)) {
    return row.options;
  }

  if (typeof row.options === "string") {
    try {
      const parsed = JSON.parse(row.options);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall back to individual option columns.
    }
  }

  return [
    row.option_a,
    row.option_b,
    row.option_c,
    row.option_d,
  ].filter(
    (option) =>
      option !== null &&
      option !== undefined &&
      String(option).trim() !== ""
  );
}

function isValidQuestion(row) {
  return (
    typeof row.question === "string" &&
    row.question.trim().length > 0 &&
    Number.isInteger(Number(row.correct_option)) &&
    Number(row.correct_option) >= 1 &&
    Number(row.correct_option) <= 4 &&
    normalizeOptions(row).length >= 2
  );
}

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

    const subject = String(body.subject || "all").trim();
    const topic = String(body.topic || "all").trim();
    const year = String(body.year || "all").trim();
    const mode = String(body.mode || "practice").trim();

    const requestedIds = Array.isArray(body.questionIds)
      ? body.questionIds.map((id) => String(id))
      : null;

    const requestedCount = Number(
      body.count ?? (requestedIds ? requestedIds.length : 20)
    );

    const allowedCounts = [10, 20, 30, 50, 75, 100];

    // Existing Prelims tests can contain any number from 1 to 100.
    // Generated quizzes retain the existing fixed count options.
    const validCount = requestedIds
      ? Number.isInteger(requestedCount) &&
        requestedCount >= 1 &&
        requestedCount <= 100
      : Number.isInteger(requestedCount) &&
        allowedCounts.includes(requestedCount);

    if (!validCount) {
      return NextResponse.json(
        {
          error: requestedIds
            ? "Question count must be between 1 and 100 when questionIds are supplied."
            : "Question count must be 10, 20, 30, 50, 75 or 100.",
        },
        { status: 400 }
      );
    }

    if (!["practice", "exam", "mistake_retest"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid quiz mode." },
        { status: 400 }
      );
    }

    if (
      requestedIds &&
      (
        requestedIds.length === 0 ||
        requestedIds.length > 100 ||
        requestedIds.some(
          (id) =>
            !id ||
            id === "undefined" ||
            id === "null"
        ) ||
        new Set(requestedIds).size !== requestedIds.length
      )
    ) {
      return NextResponse.json(
        {
          error: "questionIds must contain 1–100 unique, valid IDs.",
        },
        { status: 400 }
      );
    }

    if (
      requestedIds &&
      requestedCount !== requestedIds.length
    ) {
      return NextResponse.json(
        {
          error: "count must match the number of questionIds.",
        },
        { status: 400 }
      );
    }

    const rows = await smartQuizDb(
      "prelims_pyqs",
      "select=*&order=year.desc,id.asc"
    );

    if (!Array.isArray(rows)) {
      throw new Error(
        "Unexpected question data returned by Supabase."
      );
    }

    let candidates;

    if (requestedIds) {
      // Resolve explicit IDs against the complete table first.
      // Do not apply subject/year/topic filters before matching IDs.
      const validRows = rows.filter(isValidQuestion);

      const rowsById = new Map(
        validRows.map((row) => [String(row.id), row])
      );

      const missingIds = requestedIds.filter(
        (id) => !rowsById.has(id)
      );

      if (missingIds.length > 0) {
        return NextResponse.json(
          {
            error:
              "Some selected question IDs were not found in prelims_pyqs. The Prelims page IDs must match the database row IDs.",
            missingQuestionIds: missingIds,
          },
          { status: 400 }
        );
      }

      candidates = requestedIds.map(
        (id) => rowsById.get(id)
      );
    } else {
      candidates = rows.filter((row) => {
        if (!isValidQuestion(row)) return false;

        const subjectMatches =
          subject.toLowerCase() === "all" ||
          String(row.subject || "General").toLowerCase() ===
            subject.toLowerCase();

        const topicMatches =
          topic.toLowerCase() === "all" ||
          String(row.topic || "General").toLowerCase() ===
            topic.toLowerCase();

        const yearMatches =
          year.toLowerCase() === "all" ||
          String(row.year || "") === year;

        return (
          subjectMatches &&
          topicMatches &&
          yearMatches
        );
      });

      if (mode === "mistake_retest") {
        const mistakes = await smartQuizDb(
          "smart_quiz_mistakes",
          `select=question_id&user_id=eq.${encodeURIComponent(
            String(user.id)
          )}&is_resolved=eq.false`
        );

        const mistakeIds = new Set(
          (Array.isArray(mistakes) ? mistakes : []).map(
            (item) => String(item.question_id)
          )
        );

        candidates = candidates.filter((row) =>
          mistakeIds.has(String(row.id))
        );
      }
    }

    const selectedRows = requestedIds
      ? candidates
      : shuffle(candidates).slice(0, requestedCount);

    if (selectedRows.length === 0) {
      return NextResponse.json(
        {
          error: "No matching questions found for these filters.",
        },
        { status: 404 }
      );
    }

    const sessionPayload = {
      user_id: String(user.id),
      mode,
      subject:
        subject.toLowerCase() === "all" ? null : subject,
      topic:
        topic.toLowerCase() === "all" ? null : topic,
      total_questions: selectedRows.length,
      status: "in_progress",
    };

    const inserted = await smartQuizDb(
      "smart_quiz_sessions",
      "",
      {
        method: "POST",
        body: sessionPayload,
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    const session = Array.isArray(inserted)
      ? inserted[0]
      : null;

    if (!session?.id) {
      throw new Error(
        "Quiz session could not be created."
      );
    }

    const safeQuestions = selectedRows.map((row) => ({
      id: String(row.id),
      year: row.year ?? null,
      subject: row.subject || "General",
      topic: row.topic || "General",
      question: row.question,
      options: normalizeOptions(row),
    }));

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      mode,
      totalQuestions: safeQuestions.length,
      questions: safeQuestions,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);

    return NextResponse.json(
      {
        error:
          error.message || "Unable to generate quiz.",
      },
      { status: 500 }
    );
  }
}
