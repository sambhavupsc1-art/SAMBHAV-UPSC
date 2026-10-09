
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
  if (Array.isArray(row?.options)) {
    return row.options;
  }

  if (typeof row?.options === "string") {
    try {
      const parsed = JSON.parse(row.options);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall back to option columns.
    }
  }

  return [
    row?.option_a,
    row?.option_b,
    row?.option_c,
    row?.option_d,
  ].filter(
    (option) =>
      option !== null &&
      option !== undefined &&
      String(option).trim() !== ""
  );
}

function hasUsableContent(row) {
  return (
    typeof row?.question === "string" &&
    row.question.trim().length > 0 &&
    normalizeOptions(row).length >= 2
  );
}

function fail(error, status = 400, extra = {}) {
  return NextResponse.json(
    { success: false, error, ...extra },
    { status }
  );
}

export async function POST(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return fail("Please log in to generate a quiz.", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return fail("Request body must be valid JSON.");
    }

    const subject = String(body.subject ?? "all").trim();
    const topic = String(body.topic ?? "all").trim();
    const year = String(body.year ?? "all").trim();
    const mode = String(body.mode ?? "practice").trim();

    const hasQuestionIds = Array.isArray(body.questionIds);

    const requestedIds = hasQuestionIds
      ? body.questionIds.map((id) => String(id).trim())
      : null;

    const requestedCount = Number(
      body.count ?? requestedIds?.length ?? 20
    );

    const allowedCounts = [10, 20, 30, 50, 75, 100];

    const validCount = hasQuestionIds
      ? Number.isInteger(requestedCount) &&
        requestedCount >= 1 &&
        requestedCount <= 100
      : Number.isInteger(requestedCount) &&
        allowedCounts.includes(requestedCount);

    if (!validCount) {
      return fail(
        hasQuestionIds
          ? "Question count must be between 1 and 100."
          : "Question count must be 10, 20, 30, 50, 75 or 100."
      );
    }

    if (!["practice", "exam", "mistake_retest"].includes(mode)) {
      return fail("Invalid quiz mode.");
    }

    if (hasQuestionIds) {
      if (
        requestedIds.length === 0 ||
        requestedIds.length > 100 ||
        requestedIds.some(
          (id) =>
            !id ||
            id === "undefined" ||
            id === "null"
        ) ||
        new Set(requestedIds).size !== requestedIds.length
      ) {
        return fail(
          "questionIds must contain 1–100 unique, valid IDs."
        );
      }

      if (requestedCount !== requestedIds.length) {
        return fail(
          "count must match the number of questionIds."
        );
      }
    }

    // IMPORTANT:
    // Load every database row. Do not filter by question content
    // before matching IDs supplied by the Prelims test.
    const rows = await smartQuizDb(
      "prelims_pyqs",
      "select=*&order=year.desc,id.asc"
    );

    if (!Array.isArray(rows)) {
      throw new Error(
        "Supabase did not return a valid question list."
      );
    }

    // Match against every row, including rows whose question text,
    // answer, or options need data cleanup.
    const rowsById = new Map(
      rows
        .filter(
          (row) =>
            row?.id !== null &&
            row?.id !== undefined
        )
        .map((row) => [String(row.id), row])
    );

    let selectedRows = [];

    if (hasQuestionIds) {
      const missingIds = requestedIds.filter(
        (id) => !rowsById.has(id)
      );

      if (missingIds.length > 0) {
        return fail(
          "These selected IDs do not exist in the prelims_pyqs table. The Prelims API and database are using different question IDs.",
          400,
          {
            missingQuestionIds: missingIds,
            databaseRowCount: rows.length,
          }
        );
      }

      // Preserve the exact order of questions selected by the test.
      selectedRows = requestedIds.map(
        (id) => rowsById.get(id)
      );

      // The Prelims page already loaded the question content.
      // Session creation only needs the selected database IDs.
    } else {
      let candidates = rows.filter(hasUsableContent);

      candidates = candidates.filter((row) => {
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
          String(row.year ?? "") === year;

        return subjectMatches && topicMatches && yearMatches;
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

      selectedRows = shuffle(candidates).slice(
        0,
        requestedCount
      );
    }

    if (selectedRows.length === 0) {
      return fail(
        "No matching questions found for the selected filters.",
        404
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
        "Quiz session could not be created. Check the smart_quiz_sessions table and database permissions."
      );
    }

    const questions = selectedRows.map((row) => ({
      id: String(row.id),
      year: row.year ?? null,
      subject: row.subject || "General",
      topic: row.topic || "General",
      question: row.question || "",
      options: normalizeOptions(row),
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
      {
        success: false,
        error:
          error?.message || "Unable to generate quiz.",
      },
      { status: 500 }
    );
  }
}
