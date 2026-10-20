import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const BASE =
  "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data";

const SOURCES = [
  { file: "mains_pyqs.csv", paper: "GS1" },
  { file: "gs2_pyqs.csv", paper: "GS2" },
  { file: "gs3_pyqs.csv", paper: "GS3" },
  { file: "gs4_pyqs.csv", paper: "GS4" },
];

/*
 * Paper-aware keyword classification.
 * Heuristic matching only; this is not semantic AI classification.
 */
const THEMES = [
  {
    name: "Ethics, Integrity & Aptitude",
    papers: ["GS4"],
    keywords: [
      "ethics", "ethical", "integrity", "aptitude", "probity",
      "emotional intelligence", "ethical dilemma", "moral values",
      "public service values", "code of conduct", "नैतिकता",
      "सत्यनिष्ठा", "ईमानदारी", "नैतिक दुविधा",
    ],
  },
  {
    name: "Constitution & Federalism",
    papers: ["GS2"],
    keywords: [
      "constitution", "constitutional", "federalism", "federal",
      "parliament", "judiciary", "supreme court", "high court",
      "fundamental rights", "directive principles", "constitutional body",
      "संविधान", "संवैधानिक", "संघवाद", "संसद", "मौलिक अधिकार",
    ],
  },
  {
    name: "Governance, Accountability & Transparency",
    papers: ["GS2", "GS4"],
    keywords: [
      "governance", "accountability", "transparency", "citizen charter",
      "e-governance", "social audit", "grievance redressal",
      "right to information", "public service delivery",
      "जवाबदेही", "पारदर्शिता", "सुशासन", "सामाजिक अंकेक्षण",
    ],
  },
  {
    name: "International Relations",
    papers: ["GS2"],
    keywords: [
      "international relations", "foreign policy", "bilateral",
      "multilateral", "india and", "india's relations",
      "neighbouring countries", "neighbourhood", "united nations",
      "global order", "विदेश नीति", "भारत के संबंध",
      "द्विपक्षीय", "बहुपक्षीय",
    ],
  },
  {
    name: "Economy, Growth & Employment",
    papers: ["GS3"],
    keywords: [
      "economy", "economic growth", "employment", "unemployment",
      "inflation", "inclusive growth", "fiscal policy", "monetary policy",
      "manufacturing", "industrial growth", "poverty", "अर्थव्यवस्था",
      "रोजगार", "बेरोजगारी", "मुद्रास्फीति", "समावेशी विकास",
    ],
  },
  {
    name: "Agriculture & Food Security",
    papers: ["GS3"],
    keywords: [
      "agriculture", "farmer", "irrigation", "food security",
      "minimum support price", "cropping pattern", "agricultural marketing",
      "food processing", "land reforms", "fertilizer", "कृषि", "किसान",
      "सिंचाई", "खाद्य सुरक्षा", "फसल", "भूमि सुधार",
    ],
  },
  {
    name: "Environment & Climate Change",
    papers: ["GS1", "GS3"],
    keywords: [
      "environment", "climate change", "biodiversity", "pollution",
      "sustainable development", "global warming", "ecosystem",
      "conservation", "greenhouse gas", "जलवायु परिवर्तन", "पर्यावरण",
      "जैव विविधता", "प्रदूषण", "पारिस्थितिकी",
    ],
  },
  {
    name: "Science, Technology & AI",
    papers: ["GS3"],
    keywords: [
      "artificial intelligence", "technology", "cyber", "space technology",
      "biotechnology", "nanotechnology", "digital technology",
      "quantum", "semiconductor", "robotics", "कृत्रिम बुद्धिमत्ता",
      "प्रौद्योगिकी", "साइबर", "जैव प्रौद्योगिकी", "अंतरिक्ष",
    ],
  },
  {
    name: "Internal Security & Terrorism",
    papers: ["GS3"],
    keywords: [
      "internal security", "terrorism", "left wing extremism",
      "naxal", "border management", "cyber security", "money laundering",
      "organised crime", "insurgency", "radicalization", "आंतरिक सुरक्षा",
      "आतंकवाद", "नक्सल", "सीमा प्रबंधन",
    ],
  },
  {
    name: "Education & Health",
    papers: ["GS2"],
    keywords: [
      "education", "healthcare", "public health", "school education",
      "higher education", "health infrastructure", "medical",
      "शिक्षा", "स्वास्थ्य", "सार्वजनिक स्वास्थ्य", "उच्च शिक्षा",
    ],
  },
  {
    name: "Women & Gender",
    papers: ["GS1", "GS2"],
    keywords: [
      "women", "woman", "gender", "gender equality", "women empowerment",
      "gender justice", "महिला", "महिलाओं", "लैंगिक समानता",
      "महिला सशक्तिकरण",
    ],
  },
  {
    name: "Social Justice & Vulnerable Sections",
    papers: ["GS1", "GS2"],
    keywords: [
      "social justice", "vulnerable sections", "poverty", "inequality",
      "scheduled caste", "scheduled tribes", "tribal", "marginalised",
      "social sector", "welfare scheme", "गरीबी", "असमानता", "आदिवासी",
      "अनुसूचित जाति", "अनुसूचित जनजाति", "सामाजिक न्याय",
    ],
  },
  {
    name: "History, Culture & Society",
    papers: ["GS1"],
    keywords: [
      "culture", "heritage", "ancient india", "medieval india",
      "modern india", "freedom struggle", "civilisation", "civilization",
      "art and culture", "architecture", "literature", "संस्कृति",
      "विरासत", "इतिहास", "स्वतंत्रता संग्राम", "सभ्यता",
    ],
  },
  {
    name: "Geography & Resources",
    papers: ["GS1", "GS3"],
    keywords: [
      "geography", "natural resources", "monsoon", "river", "mineral",
      "geophysical phenomena", "earthquake", "volcano", "mountain",
      "groundwater", "भूगोल", "संसाधन", "मानसून", "नदी", "भूकंप",
      "ज्वालामुखी",
    ],
  },
  {
    name: "Disaster Management",
    papers: ["GS3"],
    keywords: [
      "disaster management", "disaster risk", "flood management",
      "earthquake preparedness", "cyclone", "landslide", "drought",
      "आपदा प्रबंधन", "बाढ़ प्रबंधन", "चक्रवात", "सूखा", "भूस्खलन",
    ],
  },
  {
    name: "Urbanisation & Cities",
    papers: ["GS1", "GS2", "GS3"],
    keywords: [
      "urbanisation", "urbanization", "smart cities", "urban planning",
      "urbanisation in india", "urban infrastructure", "slums",
      "शहरीकरण", "स्मार्ट सिटी", "शहरी नियोजन", "झुग्गी",
    ],
  },
  {
    name: "Public Administration & Civil Services",
    papers: ["GS2", "GS4"],
    keywords: [
      "civil services", "civil servant", "public administration",
      "bureaucracy", "administrative reforms", "civil service reform",
      "लोक सेवा", "सिविल सेवा", "प्रशासनिक सुधार", "नौकरशाही",
    ],
  },
  {
    name: "Agrarian and Rural Development",
    papers: ["GS1", "GS2", "GS3"],
    keywords: [
      "rural development", "rural economy", "rural areas", "panchayati raj",
      "local self government", "village development", "ग्रामीण विकास",
      "ग्रामीण अर्थव्यवस्था", "पंचायती राज", "ग्राम विकास",
    ],
  },
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows.shift().map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/^\uFEFF/, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );

  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        (values[index] ?? "").trim(),
      ])
    )
  );
}

function firstValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== "") {
      return row[name];
    }
  }
  return "";
}

function parseYear(value, question) {
  const raw = String(value || "");
  const match =
    raw.match(/\b(?:19|20)\d{2}\b/) ||
    String(question || "").match(/\b(?:19|20)\d{2}\b/);

  if (!match) return null;

  const year = Number(match[0]);
  return year >= 1950 && year <= new Date().getFullYear()
    ? year
    : null;
}

async function fetchSource(source) {
  const response = await fetch(`${BASE}/${source.file}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`${source.file} returned HTTP ${response.status}`);
  }

  const rows = parseCSV(await response.text());

  return rows
    .map((row, index) => {
      const question = firstValue(row, [
        "question",
        "question_text",
        "question_en",
        "text",
        "pyq",
        "question_hi",
        "question_hindi",
      ]);

      const yearRaw = firstValue(row, [
        "year",
        "exam_year",
        "year_of_exam",
      ]);

      const topic = firstValue(row, [
        "topic",
        "subtopic",
        "theme",
        "syllabus_topic",
      ]);

      // Source file determines the GS paper.
      return {
        id: `${source.file}:${index + 1}`,
        year: parseYear(yearRaw, question),
        paper: source.paper,
        topic: topic || "Unclassified",
        question,
        source: source.file,
      };
    })
    .filter((question) => question.question.length > 10);
}

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9\u0900-\u097f\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasKeyword(text, keyword) {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) return false;

  if (
    /[\u0900-\u097f]/.test(normalizedKeyword) ||
    normalizedKeyword.includes(" ")
  ) {
    return normalizedText.includes(normalizedKeyword);
  }

  const escaped = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  return new RegExp(`\\b${escaped}\\b`, "i").test(normalizedText);
}

function getMatchedQuestions(pyqs, theme) {
  return pyqs.filter((question) => {
    if (!theme.papers.includes(question.paper)) return false;

    const haystack = `${question.topic} ${question.question}`;

    return theme.keywords.some((keyword) =>
      hasKeyword(haystack, keyword)
    );
  });
}

function analyse(pyqs) {
  const themes = THEMES.map((theme) => {
    const matching = getMatchedQuestions(pyqs, theme);

    const years = [
      ...new Set(matching.map((question) => question.year).filter(Boolean)),
    ].sort((a, b) => a - b);

    const paperCounts = matching.reduce((counts, question) => {
      counts[question.paper] = (counts[question.paper] || 0) + 1;
      return counts;
    }, {});

    return {
      name: theme.name,
      papersAllowed: theme.papers,
      count: matching.length,
      yearsCovered: years.length,
      latestYear: years.at(-1) || null,
      papers: paperCounts,
      examples: matching.slice(0, 5).map(
        ({ id, year, paper, question, topic, source }) => ({
          id,
          year,
          paper,
          topic,
          question,
          source,
        })
      ),
      method: "paper_aware_keyword_match",
    };
  })
    .filter((theme) => theme.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count || b.yearsCovered - a.yearsCovered
    );

  const years = pyqs.map((question) => question.year).filter(Boolean);

  const paperCounts = pyqs.reduce((counts, question) => {
    counts[question.paper] = (counts[question.paper] || 0) + 1;
    return counts;
  }, {});

  const topicUnclassifiedCount = pyqs.filter(
    (question) => question.topic === "Unclassified"
  ).length;

  const matchedQuestionIds = new Set();

  for (const theme of THEMES) {
    for (const question of getMatchedQuestions(pyqs, theme)) {
      matchedQuestionIds.add(question.id);
    }
  }

  return {
    totalQuestions: pyqs.length,
    yearRange: years.length
      ? {
          from: Math.min(...years),
          to: Math.max(...years),
        }
      : null,
    paperCounts,
    themes,
    topicUnclassifiedCount,
    questionsMatchedToAtLeastOneTheme: matchedQuestionIds.size,
    questionsWithoutAnyThemeMatch: pyqs.length - matchedQuestionIds.size,
    method:
      "Paper-aware keyword matching. A question can match multiple themes. This is a heuristic estimate, not semantic AI classification or a verified prediction of future UPSC questions.",
  };
}

export async function GET() {
  try {
    const settled = await Promise.allSettled(
      SOURCES.map(fetchSource)
    );

    const pyqs = settled.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    const failedSources = settled.flatMap((result, index) =>
      result.status === "rejected"
        ? [
            {
              file: SOURCES[index].file,
              error:
                result.reason?.message || "Fetch failed",
            },
          ]
        : []
    );

    if (!pyqs.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No PYQ rows could be loaded from GitHub CSV files.",
          failedSources,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        ...analyse(pyqs),
        failedSources,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "PYQ analysis failed",
      },
      { status: 500 }
    );
  }
}
