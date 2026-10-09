
import { NextResponse } from "next/server";
import {
  getSmartQuizUser,
  smartQuizDb,
} from "../../../../lib/smartQuizServer";

function getMasteryLevel(accuracy) {
  if (accuracy > 70) return "green";
  if (accuracy >= 40) return "yellow";
  return "red";
}

export async function GET(request) {
  try {
    const user = await getSmartQuizUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view analytics." },
        { status: 401 }
      );
    }

    const rows = await smartQuizDb(
      "smart_quiz_responses",
      `select=question_id,subject,topic,selected_option,is_correct,created_at` +
        `&user_id=eq.${encodeURIComponent(String(user.id))}` +
        "&order=created_at.desc"
    );

    const responses = Array.isArray(rows) ? rows : [];

    const groups = new Map();
    const questionHistory = new Map();

    let attempted = 0;
    let correct = 0;
    let wrong = 0;

    for (const response of responses) {
      const subject = response.subject || "General";
      const topic = response.topic || "General";
      const key = `${subject}|||${topic}`;

      if (!groups.has(key)) {
        groups.set(key, {
          subject,
          topic,
          attempted: 0,
          correct: 0,
          wrong: 0,
        });
      }

      const group = groups.get(key);

      // Unanswered questions do not affect accuracy.
      if (
        response.selected_option === null ||
        response.selected_option === undefined
      ) {
        continue;
      }

      group.attempted += 1;
      attempted += 1;

      if (response.is_correct === true) {
        group.correct += 1;
        correct += 1;
      } else {
        group.wrong += 1;
        wrong += 1;
      }

      const questionId = String(response.question_id);

      if (!questionHistory.has(questionId)) {
        questionHistory.set(questionId, {
          questionId,
          subject,
          topic,
          attempted: 0,
          correct: 0,
        });
      }

      const history = questionHistory.get(questionId);
      history.attempted += 1;

      if (response.is_correct === true) {
        history.correct += 1;
      }
    }

    const topics = Array.from(groups.values())
      .map((item) => {
        const accuracy = item.attempted
          ? Number(
              ((item.correct / item.attempted) * 100).toFixed(2)
            )
          : 0;

        return {
          ...item,
          accuracy,
          mastery: getMasteryLevel(accuracy),
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);

    const subjectMap = new Map();

    for (const item of topics) {
      if (!subjectMap.has(item.subject)) {
        subjectMap.set(item.subject, {
          subject: item.subject,
          attempted: 0,
          correct: 0,
          wrong: 0,
        });
      }

      const subjectItem = subjectMap.get(item.subject);
      subjectItem.attempted += item.attempted;
      subjectItem.correct += item.correct;
      subjectItem.wrong += item.wrong;
    }

    const subjects = Array.from(subjectMap.values())
      .map((item) => {
        const accuracy = item.attempted
          ? Number(
              ((item.correct / item.attempted) * 100).toFixed(2)
            )
          : 0;

        return {
          ...item,
          accuracy,
          mastery: getMasteryLevel(accuracy),
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);

    const questionStats = Array.from(questionHistory.values());

    const impact = questionStats
      .filter((item) => item.attempted > 0)
      .map((item) => ({
        ...item,
        userAccuracy: Number(
          ((item.correct / item.attempted) * 100).toFixed(2)
        ),
      }));

    return NextResponse.json({
      summary: {
        attempted,
        correct,
        wrong,
        accuracy: attempted
          ? Number(((correct / attempted) * 100).toFixed(2))
          : 0,
        topicsTracked: topics.length,
        subjectsTracked: subjects.length,
      },
      subjects,
      topics,
      weakTopics: topics.filter(
        (item) => item.attempted > 0 && item.accuracy < 40
      ),
      questionHistory: impact,
    });
  } catch (error) {
    console.error("Heatmap analytics error:", error);

    return NextResponse.json(
      { error: error.message || "Unable to load analytics." },
      { status: 500 }
    );
  }
}
