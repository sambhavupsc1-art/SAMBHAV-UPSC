import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const BASE = "https://raw.githubusercontent.com/sambhavupsc1-art/SAMBHAV-UPSC/main/data";
const SOURCES = [
  { file: "mains_pyqs.csv", paper: "GS1" },
  { file: "gs2_pyqs.csv", paper: "GS2" },
  { file: "gs3_pyqs.csv", paper: "GS3" },
  { file: "gs4_pyqs.csv", paper: "GS4" },
];

// Heuristic theme buckets: frequency is based on keyword matches in source CSV text,
// not an AI semantic classification. Keep labels and keywords explicit for auditing.
const THEMES = [
  { name: "Women & Gender", keywords: ["women", "woman", "gender", "महिला", "लिंग", "empowerment of women"] },
  { name: "Social Justice & Vulnerable Sections", keywords: ["social justice", "vulnerable", "poverty", "inequality", "असमानता", "गरीबी", "वंचित"] },
  { name: "Governance, Accountability & Transparency", keywords: ["governance", "accountability", "transparency", "citizen charter", "e-governance", "जवाबदेही", "पारदर्शिता", "सुशासन"] },
  { name: "Constitution & Federalism", keywords: ["constitution", "constitutional", "federalism", "federal", "parliament", "judiciary", "संविधान", "संघवाद", "संसद"] },
  { name: "International Relations", keywords: ["international relations", "foreign policy", "bilateral", "multilateral", "india and", "भारत और", "विदेश नीति"] },
  { name: "Economy, Growth & Employment", keywords: ["economy", "economic growth", "employment", "unemployment", "inflation", "inclusive growth", "अर्थव्यवस्था", "रोजगार", "मुद्रास्फीति"] },
  { name: "Agriculture & Food Security", keywords: ["agriculture", "farmer", "irrigation", "food security", "minimum support price", "कृषि", "किसान", "खाद्य सुरक्षा"] },
  { name: "Environment & Climate Change", keywords: ["environment", "climate change", "biodiversity", "pollution", "sustainable development", "पर्यावरण", "जलवायु परिवर्तन", "जैव विविधता"] },
  { name: "Science, Technology & AI", keywords: ["artificial intelligence", "technology", "cyber", "space", "biotechnology", "digital", "कृत्रिम बुद्धिमत्ता", "प्रौद्योगिकी", "साइबर"] },
  { name: "Internal Security & Terrorism", keywords: ["internal security", "terrorism", "left wing extremism", "naxal", "border management", "cyber security", "आंतरिक सुरक्षा", "आतंकवाद", "नक्सल"] },
  { name: "Ethics, Integrity & Aptitude", keywords: ["ethics", "integrity", "aptitude", "probity", "emotional intelligence", "ethical", "नैतिकता", "ईमानदारी", "सत्यनिष्ठा"] },
  { name: "Education & Health", keywords: ["education", "healthcare", "public health", "school education", "शिक्षा", "स्वास्थ्य"] },
  { name: "Urbanisation & Cities", keywords: ["urbanisation", "urbanization", "smart cities", "urban planning", "शहरीकरण", "स्मार्ट सिटी"] },
  { name: "Disaster Management", keywords: ["disaster management", "disaster risk", "flood", "earthquake", "आपदा प्रबंधन", "बाढ़", "भूकंप"] },
  { name: "History, Culture & Society", keywords: ["culture", "heritage", "ancient india", "medieval india", "modern india", "history", "संस्कृति", "विरासत", "इतिहास"] },
  { name: "Geography & Resources", keywords: ["geography", "resources", "monsoon", "river", "mineral", "भूगोल", "संसाधन", "मानसून"] },
];

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); if (row.some((v) => v.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); if (row.some((v) => v.trim())) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim().toLowerCase().replace(/^\uFEFF/, "").replace(/[^a-z0-9]+/g, "_"));
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

function firstValue(row, names) {
  for (const name of names) if (row[name] !== undefined && row[name] !== "") return row[name];
  return "";
}

async function fetchSource(source) {
  const response = await fetch(`${BASE}/${source.file}`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`${source.file} returned ${response.status}`);
  const rows = parseCSV(await response.text());
  return rows.map((r, index) => {
    const question = firstValue(r, ["question", "question_text", "question_en", "text", "pyq", "question_hi", "question_hindi"]);
    const yearRaw = firstValue(r, ["year", "exam_year", "year_of_exam"]);
    const yearMatch = String(yearRaw || question).match(/(?:19|20)\d{2}/);
    const topic = firstValue(r, ["topic", "subtopic", "theme", "subject", "syllabus_topic"]);
    const paper = firstValue(r, ["paper", "gs_paper", "subject_code"]) || source.paper;
    return {
      id: `${source.file}:${index + 1}`,
      year: yearMatch ? Number(yearMatch[0]) : null,
      paper: String(paper).toUpperCase().replace(/GENERAL STUDIES\s*/i, "GS"),
      topic: topic || "Unclassified",
      question,
      source: source.file,
    };
  }).filter((r) => r.question.length > 10);
}

function analyse(pyqs) {
  const themes = THEMES.map((theme) => {
    const matching = pyqs.filter((q) => {
      const haystack = `${q.question} ${q.topic}`.toLocaleLowerCase();
      return theme.keywords.some((keyword) => haystack.includes(keyword.toLocaleLowerCase()));
    });
    const years = [...new Set(matching.map((q) => q.year).filter(Boolean))].sort((a, b) => a - b);
    const paperCounts = matching.reduce((acc, q) => { acc[q.paper] = (acc[q.paper] || 0) + 1; return acc; }, {});
    return {
      name: theme.name,
      count: matching.length,
      yearsCovered: years.length,
      latestYear: years.at(-1) || null,
      papers: paperCounts,
      examples: matching.slice(0, 3).map(({ year, paper, question, topic }) => ({ year, paper, topic, question })),
      method: "keyword_match",
    };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count || b.yearsCovered - a.yearsCovered);

  const years = pyqs.map((q) => q.year).filter(Boolean);
  const paperCounts = pyqs.reduce((acc, q) => { acc[q.paper] = (acc[q.paper] || 0) + 1; return acc; }, {});
  return {
    totalQuestions: pyqs.length,
    yearRange: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
    paperCounts,
    themes,
    unclassifiedCount: pyqs.filter((q) => q.topic === "Unclassified").length,
    method: "Keyword-based theme matching. Counts can overlap because one question may match multiple themes; not semantic AI classification.",
  };
}

export async function GET() {
  try {
    const settled = await Promise.allSettled(SOURCES.map(fetchSource));
    const pyqs = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    const failedSources = settled.flatMap((result, index) => result.status === "rejected" ? [{ file: SOURCES[index].file, error: result.reason?.message || "Fetch failed" }] : []);
    if (!pyqs.length) {
      return NextResponse.json({ success: false, error: "No PYQ rows could be loaded from GitHub CSV files.", failedSources }, { status: 502 });
    }
    return NextResponse.json({ success: true, generatedAt: new Date().toISOString(), ...analyse(pyqs), failedSources }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.message || "PYQ analysis failed" }, { status: 500 });
  }
}
