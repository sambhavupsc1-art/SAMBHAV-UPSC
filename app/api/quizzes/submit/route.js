**File:** `app/api/quizzes/submit/route.js`

```javascript
import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../../lib/smartQuizServer";

function optionIndex(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number) && number >= 0 && number <= 3
    ? number
    : null;
}

export async function POST(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to submit the quiz." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sessionId = String(body.sessionId || "");
    const answers = body.answers;

    if (!sessionId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "sessionId and answers are required." },
        { status: 400 }
      );
    }

    if (answers.length > 100) {
      return NextResponse.json(
        { error: "A maximum of 100 answers can be submitted." },
        { status: 400 }
      );
    }

    const sessions = await smartQuizDb(
      "smart_quiz_sessions",
      `id=eq.${encodeURIComponent(sessionId)}` +
        `&user_id=eq.${encodeURIComponent(String(user.id))}` +
        "&select=*"
    );

    const session = Array.isArray(sessions) ? sessions[0] : null;

    if (!session) {
      return NextResponse.json(
        { error: "Quiz session not found." },
        { status: 404 }
      );
    }

    if (session.status !== "in_progress") {
      return NextResponse.json(
        { error: "This quiz has already been submitted." },
        { status: 409 }
      );
    }

    const normalizedAnswers = answers.map((item) => ({
      questionId: String(item.questionId || item.question_id || ""),
      selectedOption: optionIndex(
        item.selectedOption ?? item.selected_option
      ),
      isBookmarked:
        item.isBookmarked === true || item.is_bookmarked === true,
      timeTakenSeconds: Math.max(
        0,
        Math.min(86400, Number(item.timeTakenSeconds) || 0)
      ),
    }));

    if (
      normalizedAnswers.some((item) => !item.questionId) ||
      new Set(normalizedAnswers.map((item) => item.questionId)).size !==
        normalizedAnswers.length
    ) {
      return NextResponse.json(
        { error: "Each answer must contain a unique questionId." },
        { status: 400 }
      );
    }

    const questionRows = await smartQuizDb(
      "prelims_pyqs",
      "select=id,question,subject,topic,correct_option,option_a,option_b,option_c,option_d"
    );

    const questionMap = new Map(
      (Array.isArray(questionRows) ? questionRows : []).map((row) => [
        String(row.id),
        row,
      ])
    );

    const verified = [];
    const invalidAnswerKeyIds = [];

    for (const answer of normalizedAnswers) {
      const question = questionMap.get(answer.questionId);

      if (!question) {
        return NextResponse.json(
          { error: `Question not found: ${answer.questionId}` },
          { status: 400 }
        );
      }

      const rawCorrect = question.correct_option;

      // Database format: 0=A, 1=B, 2=C, 3=D.
      if (
        rawCorrect === null ||
        rawCorrect === undefined ||
        rawCorrect === "" ||
        !Number.isInteger(Number(rawCorrect)) ||
        Number(rawCorrect) < 0 ||
        Number(rawCorrect) > 3
      ) {
        invalidAnswerKeyIds.push(answer.questionId);
        continue;
      }

      const correctOption = Number(rawCorrect);
      const isCorrect = answer.selectedOption === correctOption;

      verified.push({
        ...answer,
        question,
        correctOption,
        isCorrect,
        subject: question.subject || "General",
        topic: question.topic || "General",
      });
    }

    // Do not submit an ungradable quiz with zero valid answer keys.
    if (verified.length === 0) {
      return NextResponse.json(
        {
          error: "No questions have valid answer keys. Please check the question data.",
          invalidAnswerKeyIds,
        },
        { status: 422 }
      );
    }

    const total = verified.length;
    const attempted = verified.filter(
      (item) => item.selectedOption !== null
    ).length;
    const correct = verified.filter((item) => item.isCorrect).length;
    const wrong = attempted - correct;
    const accuracy = attempted ? (correct / attempted) * 100 : 0;

    const elapsedSeconds = Math.max(
      0,
      Math.min(86400, Number(body.timeTakenSeconds) || 0)
    );

    const responseRows = verified.map((item) => ({
      session_id: sessionId,
      user_id: String(user.id),
      question_id: item.questionId,
      subject: item.subject,
      topic: item.topic,
      selected_option: item.selectedOption,
      correct_option: item.correctOption,
      is_correct: item.isCorrect,
      is_bookmarked: item.isBookmarked,
      time_taken_seconds: item.timeTakenSeconds,
    }));

    await smartQuizDb("smart_quiz_responses", "", {
      method: "POST",
      body: responseRows,
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
    });

    for (const item of verified) {
      const filter =
        `user_id=eq.${encodeURIComponent(String(user.id))}` +
        `&question_id=eq.${encodeURIComponent(item.questionId)}`;

      if (item.isBookmarked) {
        await smartQuizDb(
          "smart_quiz_bookmarks",
          "on_conflict=user_id,question_id",
          {
            method: "POST",
            body: {
              user_id: String(user.id),
              question_id: item.questionId,
            },
            headers: {
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
          }
        );
      } else {
        await smartQuizDb("smart_quiz_bookmarks", filter, {
          method: "DELETE",
        });
      }
    }

    for (const item of verified) {
      const userFilter =
        `user_id=eq.${encodeURIComponent(String(user.id))}` +
        `&question_id=eq.${encodeURIComponent(item.questionId)}` +
        "&is_resolved=eq.false";

      const existing = await smartQuizDb(
        "smart_quiz_mistakes",
        `${userFilter}&select=id,attempt_count`
      );

      if (!item.isCorrect && item.selectedOption !== null) {
        if (Array.isArray(existing) && existing.length > 0) {
          const mistake = existing[0];

          await smartQuizDb(
            "smart_quiz_mistakes",
            `id=eq.${encodeURIComponent(mistake.id)}`,
            {
              method: "PATCH",
              body: {
                selected_option: item.selectedOption,
                correct_option: item.correctOption,
                attempt_count: Number(mistake.attempt_count || 1) + 1,
                last_attempted_at: new Date().toISOString(),
              },
            }
          );
        } else {
          await smartQuizDb("smart_quiz_mistakes", "", {
            method: "POST",
            body: {
              user_id: String(user.id),
              question_id: item.questionId,
              subject: item.subject,
              topic: item.topic,
              selected_option: item.selectedOption,
              correct_option: item.correctOption,
              attempt_count: 1,
              is_resolved: false,
            },
          });
        }
      } else if (item.isCorrect && Array.isArray(existing)) {
        for (const mistake of existing) {
          await smartQuizDb(
            "smart_quiz_mistakes",
            `id=eq.${encodeURIComponent(mistake.id)}`,
            {
              method: "PATCH",
              body: {
                is_resolved: true,
                resolved_at: new Date().toISOString(),
                last_attempted_at: new Date().toISOString(),
              },
            }
          );
        }
      }
    }

    for (const item of verified) {
      const currentRows = await smartQuizDb(
        "smart_quiz_question_stats",
        `question_id=eq.${encodeURIComponent(item.questionId)}` +
          "&select=total_attempts,correct_attempts"
      );

      const current = Array.isArray(currentRows) ? currentRows[0] : null;
      const totalAttempts = Number(current?.total_attempts || 0) + 1;
      const correctAttempts =
        Number(current?.correct_attempts || 0) + (item.isCorrect ? 1 : 0);

      await smartQuizDb(
        "smart_quiz_question_stats",
        "on_conflict=question_id",
        {
          method: "POST",
          body: {
            question_id: item.questionId,
            total_attempts: totalAttempts,
            correct_attempts: correctAttempts,
            updated_at: new Date().toISOString(),
          },
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
        }
      );
    }

    const score = correct * 2 - wrong * (2 / 3);

    await smartQuizDb(
      "smart_quiz_sessions",
      `id=eq.${encodeURIComponent(sessionId)}` +
        `&user_id=eq.${encodeURIComponent(String(user.id))}` +
        "&status=eq.in_progress",
      {
        method: "PATCH",
        body: {
          total_questions: total,
          attempted_questions: attempted,
          correct_answers: correct,
          wrong_answers: wrong,
          score: Number(score.toFixed(2)),
          accuracy: Number(accuracy.toFixed(2)),
          time_taken_seconds: elapsedSeconds,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      sessionId,
      summary: {
        total,
        attempted,
        correct,
        wrong,
        unanswered: total - attempted,
        score: Number(score.toFixed(2)),
        accuracy: Number(accuracy.toFixed(2)),
        timeTakenSeconds: elapsedSeconds,
        skippedInvalidAnswerKeys: invalidAnswerKeyIds.length,
        invalidAnswerKeyIds,
      },
    });
  } catch (error) {
    console.error("Quiz submission error:", error);

    return NextResponse.json(
      { error: error.message || "Unable to submit quiz." },
      { status: 500 }
    );
  }
}
```
