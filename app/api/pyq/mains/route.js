import { NextResponse } from "next/server";

const CSV_URLS = [
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data/mains_pyqs.csv",
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data/gs2_pyqs.csv",
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data/gs3_pyqs.csv",
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data/gs4_pyqs.csv",
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
      if (char === "\r" && next === "\n") {
        i++;
      }

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

function normalizeSection(value) {
  const section = String(value || "")
    .trim()
    .toLowerCase();

  if (
    section === "case study" ||
    section === "case studies" ||
    section === "casestudy" ||
    section === "case-study"
  ) {
    return "Case Study";
  }

  if (section === "theory") {
    return "Theory";
  }

  return value ? String(value).trim() : null;
}

function mapPYQ(row, index, sourceIndex) {
  const marks =
    row.marks === "" || row.marks == null
      ? null
      : Number(row.marks);

  const wordLimit =
    row.word_limit === "" || row.word_limit == null
      ? null
      : Number(row.word_limit);

  return {
    id: `csv-${sourceIndex}-${index + 1}`,

    year: Number(row.year),

    paper: String(row.paper || "").trim(),

    topic: row.topic
      ? String(row.topic).trim()
      : null,

    section: normalizeSection(row.section),

    question: row.question
      ? String(row.question).trim()
      : "",

    question_hi: row.question_hi
      ? String(row.question_hi).trim()
      : null,

    marks: Number.isFinite(marks)
      ? marks
      : null,

    word_limit: Number.isFinite(wordLimit)
      ? wordLimit
      : null,

    source: row.source_file || "GitHub CSV",

    source_file: row.source_file || "GitHub CSV",

    verified:
      String(row.verified).toLowerCase() === "true",
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const paper = searchParams.get("paper");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

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

    const failed = responses.find(
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
        {
          status: 500,
        }
      );
    }

    const csvTexts = await Promise.all(
      responses.map((response) =>
        response.text()
      )
    );

    let pyqs = [];

    csvTexts.forEach(
      (csvText, sourceIndex) => {
        const rows = parseCSV(csvText);

        const mapped = rows
          .map((row, index) =>
            mapPYQ(
              row,
              index,
              sourceIndex
            )
          )
          .filter(
            (pyq) =>
              pyq.question &&
              Number.isFinite(pyq.year)
          );

        pyqs.push(...mapped);
      }
    );

    // Paper filter
    if (paper && paper !== "All") {
      pyqs = pyqs.filter(
        (pyq) =>
          pyq.paper === paper
      );
    }

    // Year filter
    if (year && year !== "All") {
      pyqs = pyqs.filter(
        (pyq) =>
          String(pyq.year) ===
          String(year)
      );
    }

    // Section filter
    if (section && section !== "All") {
      const requestedSection =
        normalizeSection(section);

      pyqs = pyqs.filter(
        (pyq) =>
          normalizeSection(
            pyq.section
          ) === requestedSection
      );
    }

    // Latest year first
    pyqs.sort(
      (a, b) =>
        b.year - a.year ||
        a.paper.localeCompare(
          b.paper
        ) ||
        a.id.localeCompare(
          b.id
        )
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
      {
        status: 500,
      }
    );
  }
}
