
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
    return row.options.filter(
      (option) =>
        option !== null &&
        option !== undefined &&
        String(option).trim() !== ""
    );
  }

  if (typeof row.options === "string") {
    try {
      const parsed = JSON.parse(row.options);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (option) =>
            option !== null &&
            option !== undefined &&
            String(option).trim() !== ""
        );
      }
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

function hasValidQuestionContent(row) {
  return (
    typeof row?.question === "string" &&
    row.question.trim().length > 0 &&
    normalizeOptions(row).length >= 2
  );
}

function jsonError(error, status = 400, extra = {}) {
  return NextResponse.json(
    { success: false, error, ...extra },
    { status }
  );
}

export async function POST(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return jsonError("Please log in to generate a quiz.", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Request body must be valid JSON.");
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
      return jsonError(
        hasQuestionIds
          ? "Question count must be between 1 and 100."
          : "Question count must be 10, 20, 30, 50, 75 or 100."
      );
    }

    if (!["practice", "exam", "mistake_retest"].includes(mode)) {
      return jsonError("Invalid quiz mode.");
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
        return jsonError(
          "questionIds must contain 1–100 unique, valid IDs."
        );
      }

      if (requestedCount !== requestedIds.length) {
        return jsonError(
          "count must match the number of questionIds."
        );
      }
    }

    const rows = await smartQuizDb(
      "prelims_pyqs",
      "select=*&order=year.desc,id.asc"
    );

    if (!Array.isArray(rows)) {
      throw new Error(
        "Supabase did not return a valid question list."
      );
    }

    // Match IDs against ALL database rows, not only rows
    // that pass answer/options validation.
    const rowsById = new Map(
      rows.map((row) => [String(row.id), row])
    );

    let selectedRows = [];

    if (hasQuestionIds) {
      const missingIds = requestedIds.filter(
        (id) => !rowsById.has(id)
      );

      if (missingIds.length > 0) {
        return jsonError(
          "These question IDs do not exist in prelims_pyqs. Check the IDs returned by the Prelims API.",
          400,
          { missingQuestionIds: missingIds }
        );
      }

      selectedRows = requestedIds.map(
        (id) => rowsById.get(id)
      );

      const invalidQuestions = selectedRows
        .filter((row) => !hasValidQuestionContent(row))
        .map((row) => String(row.id));

      if (invalidQuestions.length > 0) {
        return jsonError(
          "Some selected database questions have missing question text or fewer than two options. Fix these rows in prelims_pyqs.",
          422,
          { invalidQuestionIds: invalidQuestions }
        );
      }
    } else {
      let candidates = rows.filter((row) => {
        if (!hasValidQuestionContent(row)) return false;

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
      return jsonError(
        "No valid questions were found for the selected filters.",
        404
      );
    }

    const sessionPayload = {
      user_id: String(user.id),
      mode,
      subject: subject.toLowerCase() === "all" ? null : subject,
      topic: topic.toLowerCase() === "all" ? null : topic,
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
        "Quiz session could not be created. Check smart_quiz_sessions database permissions and configuration."
      );
    }

    const questions = selectedRows.map((row) => ({
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
