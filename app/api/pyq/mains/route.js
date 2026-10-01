import { NextResponse } from "next/server";

const CSV_URLS = [
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data/mains_pyqs.csv",
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data/gs2_pyqs.csv",
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i++;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;

      row.push(field);
      field = "";

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);

    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((values) => {
    const item = {};

    headers.forEach((header, index) => {
      item[header] = (values[index] ?? "").trim();
    });

    return item;
  });
}

function mapPYQ(row, index) {
  const marks =
    row.marks === "" ? null : Number(row.marks);

  const wordLimit =
    row.word_limit === ""
      ? null
      : Number(row.word_limit);

  return {
    id: `csv-${index + 1}`,
    year: Number(row.year),
    paper: row.paper,
    topic: row.topic || null,
    question: row.question,
    question_hi: row.question_hi || null,

    marks: Number.isFinite(marks)
      ? marks
      : null,

    word_limit: Number.isFinite(wordLimit)
      ? wordLimit
      : null,

    source:
      row.source_file || "GitHub CSV",

    source_file:
      row.source_file || "GitHub CSV",

    verified:
      row.verified === "true",
  };
}

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const paper =
      searchParams.get("paper");

    const year =
      searchParams.get("year");

    const responses = await Promise.all(
      CSV_URLS.map((url) =>
        fetch(url, {
          cache: "no-store",
          headers: {
            Accept: "text/plain",
          },
        })
      )
    );

    const failed =
      responses.find(
        (response) => !response.ok
      );

    if (failed) {
      console.error(
        "GitHub CSV fetch error:",
        failed.status
      );

      return NextResponse.json(
        {
          error:
            "Mains PYQ CSV fetch failed",
        },
        { status: 500 }
      );
    }

    const csvTexts =
      await Promise.all(
        responses.map(
          (response) =>
            response.text()
        )
      );

    const rows =
      csvTexts.flatMap(
        (csvText) =>
          parseCSV(csvText)
      );

    let pyqs = rows
      .map(mapPYQ)
      .filter(
        (pyq) =>
          pyq.question &&
          Number.isFinite(pyq.year)
      );

    if (
      paper &&
      paper !== "All"
    ) {
      pyqs = pyqs.filter(
        (pyq) =>
          pyq.paper === paper
      );
    }

    if (
      year &&
      year !== "All"
    ) {
      pyqs = pyqs.filter(
        (pyq) =>
          String(pyq.year) ===
          String(year)
      );
    }

    pyqs.sort(
      (a, b) =>
        b.year - a.year ||
        a.id.localeCompare(b.id)
    );

    return NextResponse.json({
      pyqs,
      source: "github_csv",
      count: pyqs.length,
    });
  } catch (error) {
    console.error(
      "Mains PYQ API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
