"use client";

import { useEffect, useMemo, useState } from "react";
import { STATE_META, FEATURE_INDEX } from "./data";

/*
  SAMBHAV UPSC — BHARAT DARSHAN
  Route: /bharat-darshan

  IMPORTANT
  - This page is only the Bharat Darshan route.
  - Geography data stays in ./data.js.
  - Existing SAMBHAV dashboard/auth/current-affairs/PYQ routes are untouched.
  - Map selection uses exact source-name -> stable State/UT IDs only.
  - No coordinate-based or fuzzy state guessing.
*/

const GEOJSON_URL =
  "https://raw.githubusercontent.com/adarshbiradar/maps-geojson/master/india.json";

const MODES = [
  ["explore", "Explore India", "States & UTs", "◉"],
  ["rivers", "Rivers", "River systems", "≈"],
  ["mountains", "Mountains & Passes", "Relief & passes", "△"],
  ["ecology", "Ecology", "Parks & biodiversity", "✦"],
  ["minerals", "Minerals & Resources", "Resource geography", "◆"],
  ["agriculture", "Agriculture", "Crops & regions", "⌁"],
  ["coastal", "Coastal India", "Ports & islands", "◒"],
  ["climate", "Climate & Monsoon", "Monsoon geography", "☼"],
];

const REGIONS = [
  "All India",
  "North",
  "South",
  "East",
  "West",
  "Central",
  "Northeast",
  "UTs",
];

const QUIZ = [
  {
    q: "The Narmada flows broadly between which two major upland systems?",
    options: [
      "Vindhya and Satpura",
      "Aravalli and Himalaya",
      "Nilgiri and Cardamom",
      "Eastern Ghats and Shivalik",
    ],
    answer: 0,
    explanation:
      "The Narmada valley lies between the Vindhya range to the north and Satpura range to the south.",
  },
  {
    q: "Keibul Lamjao National Park is associated with which state?",
    options: ["Manipur", "Sikkim", "Meghalaya", "Mizoram"],
    answer: 0,
    explanation:
      "Keibul Lamjao National Park is in Manipur and is associated with Loktak Lake.",
  },
  {
    q: "Which river is most closely associated with the Kashmir Valley?",
    options: ["Jhelum", "Mahanadi", "Narmada", "Sabarmati"],
    answer: 0,
    explanation:
      "The Jhelum is the principal river of the Kashmir Valley.",
  },
  {
    q: "Which state is especially associated with the Thar Desert?",
    options: ["Rajasthan", "Kerala", "Assam", "Odisha"],
    answer: 0,
    explanation:
      "The Thar Desert occupies a large part of western Rajasthan.",
  },
  {
    q: "Which state receives an important share of rainfall from the northeast monsoon?",
    options: ["Tamil Nadu", "Punjab", "Rajasthan", "Himachal Pradesh"],
    answer: 0,
    explanation:
      "Tamil Nadu receives a major share of its rainfall during the northeast/retreating monsoon season.",
  },
  {
    q: "Kaziranga is especially famous for which species?",
    options: ["One-horned rhinoceros", "Asiatic lion", "Snow leopard", "Nilgai"],
    answer: 0,
    explanation:
      "Kaziranga in Assam is globally important for the greater one-horned rhinoceros.",
  },
  {
    q: "Which mineral-resource combination is especially important in Chhattisgarh?",
    options: ["Iron ore and coal", "Petroleum and gas", "Gold and uranium", "Tin and crude oil"],
    answer: 0,
    explanation:
      "Chhattisgarh is an important producer of iron ore and coal among several other minerals.",
  },
  {
    q: "Which river is one of the major rivers of the Punjab-Haryana plain?",
    options: ["Sutlej", "Periyar", "Godavari", "Vaigai"],
    answer: 0,
    explanation:
      "The Sutlej is one of the major rivers of northwestern India.",
  },
];

const NAME_ALIASES = {
  "andaman and nicobar islands": "AN",
  "andaman & nicobar islands": "AN",
  "nct of delhi": "DL",
  "national capital territory of delhi": "DL",
  "delhi": "DL",
  "orissa": "OD",
  "pondicherry": "PY",
  "jammu and kashmir": "JK",
  "jammu & kashmir": "JK",
  "ladakh": "LA",
  "uttarakhand": "UK",
  "uttaranchal": "UK",
  "odisha": "OD",
  "tamil nadu": "TN",
  "west bengal": "WB",
  "dadra and nagar haveli and daman and diu": "DN",
  "dadra & nagar haveli and daman & diu": "DN",
};

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ");
}

const NAME_TO_ID = Object.fromEntries(
  Object.entries(STATE_META).map(([id, value]) => [normalizeName(value.name), id])
);

function canonicalId(properties = {}) {
  const candidates = [
    properties.ST_NM,
    properties.st_nm,
    properties.NAME_1,
    properties.name,
    properties.NAME,
    properties.state,
    properties.State,
    properties.STATE,
    properties.st_nm_1,
    properties["Name of State"],
    properties["Name of State / UT"],
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeName(candidate);
    const alias = NAME_ALIASES[normalized];
    if (alias && STATE_META[alias]) return alias;

    const exact = NAME_TO_ID[normalized];
    if (exact) return exact;
  }

  return null;
}

function getFeatureName(properties = {}) {
  return (
    properties.ST_NM ||
    properties.st_nm ||
    properties.NAME_1 ||
    properties.name ||
    properties.NAME ||
    properties.state ||
    properties.State ||
    properties.STATE ||
    "Unknown"
  );
}

function getGeometryPoints(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") {
    return geometry.coordinates?.flat(1) || [];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates?.flat(2) || [];
  }
  return [];
}

function getGeoBounds(features) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (const item of features) {
    const points = getGeometryPoints(item.feature?.geometry);
    for (const point of points) {
      const lon = Number(point?.[0]);
      const lat = Number(point?.[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      bounds[0] = Math.min(bounds[0], lon);
      bounds[1] = Math.min(bounds[1], lat);
      bounds[2] = Math.max(bounds[2], lon);
      bounds[3] = Math.max(bounds[3], lat);
    }
  }

  if (!Number.isFinite(bounds[0])) return [68, 6, 98, 38];
  return bounds;
}

function projectPoint([lon, lat], bounds, width, height) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  const lonSpan = Math.max(maxLon - minLon, 1);
  const latSpan = Math.max(maxLat - minLat, 1);

  const padding = 34;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const scale = Math.min(
    usableWidth / lonSpan,
    usableHeight / latSpan
  );

  const mapWidth = lonSpan * scale;
  const mapHeight = latSpan * scale;
  const offsetX = (width - mapWidth) / 2;
  const offsetY = (height - mapHeight) / 2;

  const x = offsetX + (lon - minLon) * scale;
  const y = height - offsetY - (lat - minLat) * scale;

  return [x, y];
}

function geometryPath(geometry, bounds, width, height) {
  if (!geometry) return "";

  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  return polygons
    .map((polygon) =>
      polygon
        .map((ring) => {
          if (!ring?.length) return "";
          return (
            ring
              .map((point, index) => {
                const [x, y] = projectPoint(point, bounds, width, height);
                return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(" ") + " Z"
          );
        })
        .join(" ")
    )
    .join(" ");
}

function geometryCenter(geometry, bounds, width, height) {
  const points = getGeometryPoints(geometry);
  if (!points.length) return [width * 0.5, height * 0.5];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    const projected = projectPoint(point, bounds, width, height);
    if (!Number.isFinite(projected[0]) || !Number.isFinite(projected[1])) continue;
    minX = Math.min(minX, projected[0]);
    minY = Math.min(minY, projected[1]);
    maxX = Math.max(maxX, projected[0]);
    maxY = Math.max(maxY, projected[1]);
  }

  if (!Number.isFinite(minX)) return [width * 0.5, height * 0.5];
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function storageKey(user) {
  return `sambhav_bharat_darshan_${user?.id || user?.email || "guest"}`;
}

function getModeItems(selected, mode) {
  if (!selected) return [];

  const map = {
    explore: ["Important Geography", [...selected.rivers, ...selected.relief, ...selected.ecology]],
    rivers: ["Rivers & Water Systems", selected.rivers],
    mountains: ["Relief, Mountains & Passes", selected.relief],
    ecology: ["Ecology & Protected Areas", selected.ecology],
    minerals: ["Minerals & Resources", selected.minerals],
    agriculture: ["Agriculture & Crops", selected.crops],
    coastal: ["Coastal / Important Places", selected.places],
    climate: ["Climate & Monsoon", [selected.climate]],
  };

  return map[mode] || map.explore;
}

export default function BharatDarshanPage() {
  const [theme, setTheme] = useState("light");
  const [geo, setGeo] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [loadingMap, setLoadingMap] = useState(true);
  const [mode, setMode] = useState("explore");
  const [region, setRegion] = useState("All India");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [compareId, setCompareId] = useState("");
  const [compareId2, setCompareId2] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sambhav-theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    } catch {}

    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data?.user || null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(user));
      setProgress(raw ? JSON.parse(raw) : {});
    } catch {
      setProgress({});
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("sambhav-theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    setLoadingMap(true);
    setGeoError("");

    fetch(GEOJSON_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`India boundary dataset could not be loaded (${response.status}).`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!data || !Array.isArray(data.features)) throw new Error("Invalid India GeoJSON format.");
        setGeo(data);
      })
      .catch((error) => {
        if (!cancelled) setGeoError(error?.message || "India map data could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMap(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ui = theme === "dark"
    ? {
        bg: "#080808",
        surface: "#111111",
        surface2: "#171717",
        surface3: "#1c1c1c",
        text: "#f7f3e8",
        muted: "#aaa59a",
        faint: "#77736a",
        line: "rgba(255,255,255,.10)",
        gold: "#d9be78",
        goldSoft: "rgba(217,190,120,.12)",
        map: "#0e0e0e",
        green: "#cfe8cf",
        red: "#f0d2d2",
      }
    : {
        bg: "#f6f3ec",
        surface: "#ffffff",
        surface2: "#f5f1e7",
        surface3: "#eee9dc",
        text: "#11110f",
        muted: "#726e65",
        faint: "#9a958b",
        line: "#e3ded3",
        gold: "#a47f32",
        goldSoft: "#f2e8d0",
        map: "#eeeae0",
        green: "#dcebd9",
        red: "#f1dada",
      };

  const features = useMemo(() => {
    return (geo?.features || []).map((feature) => ({
      feature,
      id: canonicalId(feature?.properties),
      name: getFeatureName(feature?.properties),
    }));
  }, [geo]);

  const mappedFeatures = useMemo(
    () => features.filter((item) => item.id && STATE_META[item.id]),
    [features]
  );

  const mapBounds = useMemo(() => getGeoBounds(mappedFeatures), [mappedFeatures]);

  const filteredFeatures = useMemo(() => {
    const q = normalizeName(search);

    return mappedFeatures.filter(({ id }) => {
      const meta = STATE_META[id];
      if (!meta) return false;

      const regionOk = region === "All India" || meta.region === region;
      if (!regionOk) return false;
      if (!q) return true;

      const searchable = [
        meta.name,
        meta.region,
        meta.capital,
        ...meta.rivers,
        ...meta.relief,
        ...meta.ecology,
        ...meta.minerals,
        ...meta.crops,
        ...meta.places,
        meta.climate,
      ];

      const directFeatureHit = FEATURE_INDEX?.some(
        (item) => item.id === id && normalizeName(item.value).includes(q)
      );

      return directFeatureHit || searchable.some((value) => normalizeName(value).includes(q));
    });
  }, [mappedFeatures, region, search]);

  const selected = selectedId ? STATE_META[selectedId] : null;
  const modeItems = useMemo(() => getModeItems(selected, mode), [selected, mode]);

  const recallCards = useMemo(
    () => Object.entries(STATE_META).map(([id, state]) => ({
      id,
      title: state.name,
      prompt: `Recall two important UPSC map facts for ${state.name}.`,
      answer: `${state.rivers.slice(0, 2).join(" and ")}; ${state.relief.slice(0, 2).join(" and ")}.`,
    })),
    []
  );

  const currentRecall = recallCards[recallIndex % Math.max(recallCards.length, 1)];
  const currentQuiz = QUIZ[quizIndex];
  const masteredCount = Object.values(progress).filter((item) => item?.status === "Mastered").length;
  const learningCount = Object.values(progress).filter((item) => item?.status === "Learning" || item?.status === "Needs Revision").length;
  const revisionCount = Object.values(progress).filter((item) => item?.status === "Needs Revision").length;
  const compareState = compareId ? STATE_META[compareId] : null;
  const compareState2 = compareId2 ? STATE_META[compareId2] : null;
  const selectedMapFeature = useMemo(
    () => mappedFeatures.find((item) => item.id === selectedId),
    [mappedFeatures, selectedId]
  );
  const selectedMapAnchor = useMemo(
    () => selectedMapFeature ? geometryCenter(selectedMapFeature.feature?.geometry, mapBounds, 900, 700) : null,
    [selectedMapFeature, mapBounds]
  );

  function selectState(id) {
    if (!id || !STATE_META[id]) return;
    setSelectedId(id);
    setTab("overview");
    setRecallRevealed(false);

    setProgress((previous) => {
      const next = {
        ...previous,
        [id]: {
          ...(previous[id] || {}),
          status: previous[id]?.status === "Mastered" ? "Mastered" : "Learning",
          lastViewed: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(storageKey(user), JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function markMastered() {
    if (!selectedId) return;
    setProgress((previous) => {
      const next = {
        ...previous,
        [selectedId]: {
          ...(previous[selectedId] || {}),
          status: "Mastered",
          lastViewed: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(storageKey(user), JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function markNeedsRevision() {
    if (!selectedId) return;
    setProgress((previous) => {
      const next = {
        ...previous,
        [selectedId]: {
          ...(previous[selectedId] || {}),
          status: "Needs Revision",
          lastViewed: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(storageKey(user), JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function answerQuiz(index) {
    if (quizAnswered) return;
    setQuizAnswer(index);
    setQuizAnswered(true);
    if (index === currentQuiz.answer) setQuizScore((score) => score + 1);
  }

  function nextQuiz() {
    setQuizIndex((index) => (index + 1) % QUIZ.length);
    setQuizAnswer(null);
    setQuizAnswered(false);
  }

  function openComparison() {
    const ids = Object.keys(STATE_META).filter((id) => id !== selectedId);
    setCompareId(ids[0] || "");
    setCompareId2(ids[1] || "");
    setCompareOpen(true);
  }

  function resetQuiz() {
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizAnswered(false);
    setQuizScore(0);
    setQuizStarted(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: ui.bg, color: ui.text, fontFamily: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", ["--bd-line"]: ui.line, ["--bd-surface"]: ui.surface }}>
      <style>{`
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        .bd-scroll::-webkit-scrollbar{width:6px;height:6px}
        .bd-scroll::-webkit-scrollbar-thumb{background:rgba(130,130,130,.28);border-radius:999px}
        .bd-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
        .bd-card:hover{transform:translateY(-1px)}
        .bd-map path{transition:fill .12s ease,stroke .12s ease,filter .12s ease}
        .bd-map path:hover{fill:#d9be78!important;stroke:#866625!important;cursor:pointer;filter:drop-shadow(0 2px 2px rgba(0,0,0,.12))}
        .bd-mode{transition:all .18s ease}
        .bd-mode:hover{transform:translateY(-2px)}
        .bd-quiz-option{transition:all .15s ease}
        .bd-quiz-option:hover:not(:disabled){transform:translateY(-1px);border-color:#b9954b!important}
        .bd-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .bd-comparison-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0}
        .bd-comparison-table th,.bd-comparison-table td{padding:12px 13px;border-right:1px solid var(--bd-line);border-bottom:1px solid var(--bd-line);vertical-align:top;text-align:left}
        .bd-comparison-table th:last-child,.bd-comparison-table td:last-child{border-right:0}
        .bd-comparison-table thead th{position:sticky;top:0;background:var(--bd-surface);z-index:2}
        @media(max-width:1100px){
          .bd-main-grid{grid-template-columns:1fr!important}
          .bd-side{position:relative!important;top:auto!important}
          .bd-mode-grid{grid-template-columns:repeat(4,minmax(150px,1fr))!important}
        }
        @media(max-width:760px){
          .bd-shell{padding:12px!important}
          .bd-main-grid{gap:10px!important}
          .bd-map-box{min-height:520px!important}
          .bd-map-stage{height:500px!important}
          .bd-map{height:500px!important}
          .bd-stat-grid{grid-template-columns:repeat(2,1fr)!important}
          .bd-quiz-grid{grid-template-columns:1fr!important}
          .bd-mode-grid{grid-template-columns:repeat(4,minmax(135px,1fr))!important}
          .bd-hero h1{font-size:42px!important}
        }
        @media(max-width:520px){
          .bd-shell{padding:10px!important}
          .bd-hero{padding-top:22px!important}
          .bd-hero h1{font-size:34px!important}
          .bd-map-stage{height:430px!important}
          .bd-map{height:430px!important}
          .bd-stat-grid{grid-template-columns:1fr!important}
          .bd-mode-grid{grid-template-columns:repeat(4,minmax(122px,1fr))!important}
          .bd-comparison-table{min-width:690px}
        }
      `}</style>

      <div className="bd-shell" style={{ maxWidth: 1280, margin: "0 auto", padding: "18px 18px 50px" }}>
        {/* HEADER */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, paddingBottom: 16, borderBottom: `1px solid ${ui.line}` }}>
          <button onClick={() => (window.location.href = "/")} style={{ border: 0, background: "transparent", color: ui.text, padding: 0, textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontSize: 21, fontWeight: 950, letterSpacing: "-.7px" }}>SAMBHAV <span style={{ color: ui.gold }}>UPSC</span></div>
            <div style={{ marginTop: 3, color: ui.muted, fontSize: 8, letterSpacing: "1.7px", fontWeight: 900 }}>BHARAT DARSHAN • MAP INTELLIGENCE</div>
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={smallButton(ui)}>{theme === "dark" ? "☀" : "☾"}</button>
            <button onClick={() => (window.location.href = "/")} style={smallButton(ui)}>← Home</button>
          </div>
        </header>

        {/* HERO */}
        <section className="bd-hero" style={{ padding: "30px 0 20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 999, background: ui.goldSoft, color: ui.gold, fontSize: 8, fontWeight: 950, letterSpacing: "1.2px" }}>
            <span>✦</span> UPSC GEOGRAPHY • PRELIMS • GS
          </div>
          <h1 style={{ fontSize: "clamp(38px,6vw,62px)", lineHeight: .95, letterSpacing: "-2.4px", margin: "13px 0 12px", fontWeight: 950 }}>Bharat Darshan</h1>
          <p style={{ margin: 0, maxWidth: 760, color: ui.muted, fontSize: 13, lineHeight: 1.7 }}>See India → Understand India → Recall India → Master India through interactive maps, geography layers, active recall and UPSC-focused practice.</p>
        </section>

        {/* PREMIUM MODE SELECTOR */}
        <section style={{ background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 22, padding: 12, boxShadow: theme === "light" ? "0 10px 35px rgba(30,25,15,.05)" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "2px 4px 10px" }}>
            <div>
              <div style={{ fontSize: 9, color: ui.gold, fontWeight: 950, letterSpacing: "1.5px" }}>MAP INTELLIGENCE</div>
              <div style={{ marginTop: 3, fontSize: 11, fontWeight: 850 }}>Choose a geography layer</div>
            </div>
            <div style={{ fontSize: 8, color: ui.muted }}>{mappedFeatures.length} verified map regions</div>
          </div>

          <div className="bd-scroll bd-mode-grid" style={{ display: "grid", gridTemplateColumns: "repeat(8,minmax(120px,1fr))", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {MODES.map(([id, title, sub, icon]) => {
              const active = mode === id;
              return (
                <button key={id} className="bd-mode" onClick={() => setMode(id)} style={{ minWidth: 120, border: `1px solid ${active ? ui.gold : ui.line}`, background: active ? ui.goldSoft : ui.surface2, color: ui.text, borderRadius: 15, padding: "12px 11px", textAlign: "left", cursor: "pointer", position: "relative" }}>
                  {active && <span style={{ position: "absolute", left: 10, right: 10, top: 0, height: 2, borderRadius: 99, background: ui.gold }} />}
                  <div style={{ width: 29, height: 29, display: "grid", placeItems: "center", borderRadius: 9, background: active ? ui.gold : ui.surface3, color: active ? "#111" : ui.gold, fontWeight: 950, fontSize: 14 }}>{icon}</div>
                  <div style={{ marginTop: 9, fontSize: 9, fontWeight: 950, lineHeight: 1.25 }}>{title}</div>
                  <div style={{ marginTop: 3, fontSize: 7, color: ui.muted, lineHeight: 1.35 }}>{sub}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* FILTERS */}
        <section style={{ marginTop: 11, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div className="bd-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", maxWidth: "100%", paddingBottom: 2 }}>
            {REGIONS.map((item) => {
              const active = region === item;
              return <button key={item} onClick={() => setRegion(item)} style={{ border: `1px solid ${active ? ui.gold : ui.line}`, background: active ? ui.gold : ui.surface, color: active ? "#111" : ui.text, borderRadius: 999, padding: "7px 11px", fontSize: 8, fontWeight: 900, whiteSpace: "nowrap", cursor: "pointer" }}>{item}</button>;
            })}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: 10, color: ui.faint, fontSize: 11 }}>⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search state, river, mountain, park, crop, mineral…" style={{ width: "100%", border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 999, padding: "9px 13px 9px 31px", outline: "none", fontSize: 9 }} />
            </div>
          </div>
        </section>

        {/* MAP + STATE EXPLORER */}
        <div className="bd-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(340px,.72fr)", gap: 14, marginTop: 14, alignItems: "start" }}>
          <section className="bd-card bd-map-box" style={{ background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 24, overflow: "hidden", minHeight: 650, boxShadow: theme === "light" ? "0 12px 40px rgba(30,25,15,.05)" : "none" }}>
            <div style={{ padding: "15px 17px", borderBottom: `1px solid ${ui.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 950 }}><span style={{ color: ui.gold }}>◉</span> Interactive India Map</div>
                <div style={{ marginTop: 4, color: ui.muted, fontSize: 8 }}>Click a verified State/UT polygon to explore its geography.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 950 }}>{filteredFeatures.length}</div>
                <div style={{ fontSize: 7, color: ui.muted }}>visible regions</div>
              </div>
            </div>

            <div className="bd-map-stage" style={{ height: 560, background: ui.map, position: "relative" }}>
              {loadingMap ? (
                <MapMessage ui={ui} title="Loading India map…" text="Fetching verified administrative boundaries." />
              ) : geoError ? (
                <MapMessage ui={ui} title="Location data unavailable" text={geoError} />
              ) : (
                <svg className="bd-map" viewBox="0 0 900 700" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive India map">
                  {features.map(({ feature, id, name }) => {
                    if (!id || !STATE_META[id]) return null;
                    const visible = filteredFeatures.some((item) => item.id === id);
                    const selected = selectedId === id;
                    return (
                      <path
                        key={`${id}-${name}`}
                        d={geometryPath(feature.geometry, mapBounds, 900, 700)}
                        fill={selected ? ui.gold : visible ? (theme === "dark" ? "#292929" : "#ddd8cb") : (theme === "dark" ? "#151515" : "#e9e5db")}
                        stroke={selected ? "#806020" : theme === "dark" ? "#68645d" : "#aaa398"}
                        strokeWidth={selected ? 2.5 : 1.15}
                        onClick={() => selectState(id)}
                        aria-label={STATE_META[id]?.name || name}
                      />
                    );
                  })}

                  {selected && selectedMapAnchor && (() => {
                    const [ax, ay] = selectedMapAnchor;
                    const cardW = 190;
                    const cardH = 70;
                    const placeRight = ax < 560;
                    const cardX = Math.max(18, Math.min(900 - cardW - 18, placeRight ? ax + 78 : ax - cardW - 78));
                    const cardY = Math.max(24, Math.min(700 - cardH - 24, ay - 44));
                    const endX = placeRight ? cardX : cardX + cardW;
                    const endY = cardY + cardH * 0.5;
                    const bendX = placeRight ? ax + 38 : ax - 38;
                    const bendY = ay - 34;
                    return (
                      <g pointerEvents="none">
                        <path
                          d={`M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${bendX.toFixed(1)} ${bendY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`}
                          fill="none"
                          stroke={ui.gold}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          opacity=".95"
                        />
                        <circle cx={ax} cy={ay} r="5" fill={ui.gold} stroke={theme === "dark" ? "#111" : "#fff"} strokeWidth="2" />
                        <foreignObject x={cardX} y={cardY} width={cardW} height={cardH}>
                          <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", border: `1px solid ${ui.gold}`, background: theme === "dark" ? "rgba(17,17,17,.97)" : "rgba(255,255,255,.97)", borderRadius: 14, padding: "10px 12px", boxShadow: "0 8px 25px rgba(0,0,0,.20)", color: ui.text, fontFamily: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
                            <div style={{ fontSize: 7, color: ui.gold, fontWeight: 950, letterSpacing: "1.2px" }}>SELECTED LOCATION</div>
                            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 950, lineHeight: 1.1 }}>{selected.name}</div>
                            <div style={{ marginTop: 4, fontSize: 8, color: ui.muted }}>{selected.region === "UTs" ? "Union Territory" : "State"} • Tap to explore</div>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>

            <div style={{ padding: "9px 14px", borderTop: `1px solid ${ui.line}`, display: "flex", justifyContent: "space-between", gap: 12, color: ui.muted, fontSize: 7 }}>
              <span>Exact State/UT name → stable ID</span>
              <span>Verified polygon geometry</span>
            </div>
          </section>

          <aside className="bd-side" style={{ position: "sticky", top: 12, background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 24, overflow: "hidden", boxShadow: theme === "light" ? "0 12px 40px rgba(30,25,15,.05)" : "none" }}>
            <div style={{ padding: 17 }}>
              <div style={{ color: ui.gold, fontSize: 8, letterSpacing: "1.5px", fontWeight: 950 }}>STATE EXPLORER</div>
              <h2 style={{ margin: "7px 0 4px", fontSize: 25, letterSpacing: "-.8px" }}>{selected?.name || "Select a State or UT"}</h2>
              <div style={{ color: ui.muted, fontSize: 9 }}>{selected ? `${selected.region} • Capital: ${selected.capital}` : "Map par kisi State/UT par tap karein."}</div>

              {selected ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 14 }}>
                    {[['overview','Overview'],['facts','UPSC Facts'],['recall','Recall']].map(([id,label]) => <button key={id} onClick={() => setTab(id)} style={{ border: `1px solid ${tab === id ? ui.gold : ui.line}`, background: tab === id ? ui.gold : ui.surface2, color: tab === id ? "#111" : ui.text, borderRadius: 10, padding: "8px 4px", fontSize: 8, fontWeight: 900, cursor: "pointer" }}>{label}</button>)}
                  </div>

                  {tab === "overview" && <div style={{ marginTop: 15 }}>
                    <InfoGroup label="Rivers & Water" items={selected.rivers} ui={ui} />
                    <InfoGroup label="Relief, Mountains & Passes" items={selected.relief} ui={ui} />
                    <InfoGroup label="Ecology & Protected Areas" items={selected.ecology} ui={ui} />
                    <InfoGroup label="Agriculture & Crops" items={selected.crops} ui={ui} />
                    <InfoGroup label="Minerals & Resources" items={selected.minerals} ui={ui} />
                    <InfoGroup label="Important Places" items={selected.places} ui={ui} />
                  </div>}

                  {tab === "facts" && <div style={{ marginTop: 15, display: "grid", gap: 9 }}>
                    <FeaturePanel title="CURRENT LAYER" value={modeItems?.[0] || "Important Geography"} ui={ui} />
                    <FeaturePanel title="CLIMATE & MONSOON" value={selected.climate} ui={ui} />
                    <div style={{ border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 15, padding: 13 }}>
                      <div style={{ color: ui.gold, fontSize: 8, fontWeight: 950 }}>UPSC MAP RELEVANCE</div>
                      <div style={{ marginTop: 7, color: ui.muted, fontSize: 9, lineHeight: 1.65 }}>State location, river association, relief, ecology, resources and agriculture can be used for Prelims elimination and GS Geography map revision.</div>
                    </div>
                  </div>}

                  {tab === "recall" && <div style={{ marginTop: 15 }}>
                    <div style={{ border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 16, padding: 14 }}>
                      <div style={{ color: ui.gold, fontSize: 8, fontWeight: 950, letterSpacing: "1px" }}>ACTIVE RECALL</div>
                      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, fontWeight: 850 }}>Recall two important map facts for {selected.name}.</div>
                      <button onClick={() => setRecallRevealed(true)} style={{ marginTop: 12, width: "100%", border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 11, padding: 10, fontWeight: 900, cursor: "pointer" }}>{recallRevealed ? "Answer revealed" : "Reveal answer"}</button>
                      {recallRevealed && <div style={{ marginTop: 9, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>{selected.rivers.slice(0,2).join(" and ")}; {selected.relief.slice(0,2).join(" and ")}.</div>}
                    </div>
                    <button onClick={() => { setRecallRevealed(false); setRecallIndex((value) => value + 1); }} style={{ marginTop: 8, width: "100%", border: 0, background: ui.gold, color: "#111", borderRadius: 11, padding: 10, fontWeight: 900, cursor: "pointer" }}>Next Recall →</button>
                  </div>}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 14 }}>
                    <button onClick={markMastered} style={primaryButton(ui)}>✓ Mark Mastered</button>
                    <button onClick={markNeedsRevision} style={secondaryButton(ui)}>↻ Needs Revision</button>
                  </div>
                  <button onClick={openComparison} style={{ width: "100%", marginTop: 7, ...secondaryButton(ui) }}>Compare 3 States</button>
                  <div style={{ marginTop: 8, fontSize: 8, color: ui.muted }}>Status: <b style={{ color: ui.text }}>{progress[selectedId]?.status || "Not Started"}</b></div>
                </>
              ) : (
                <div style={{ marginTop: 18, border: `1px dashed ${ui.line}`, background: ui.surface2, borderRadius: 16, padding: 16, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>India map se State/UT select karte hi yahan rivers, relief, ecology, agriculture, minerals, places aur climate ka UPSC-focused profile open hoga.</div>
              )}
            </div>
          </aside>
        </div>

        {/* PROGRESS */}
        <section style={{ marginTop: 14 }}>
          <div className="bd-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <StatCard ui={ui} label="Knowledge Base" value={Object.keys(STATE_META).length} sub="States & UTs" />
            <StatCard ui={ui} label="Mastered" value={masteredCount} sub="Actual progress" />
            <StatCard ui={ui} label="Learning" value={learningCount} sub="Viewed / learning" />
            <StatCard ui={ui} label="Needs Revision" value={revisionCount} sub="Marked by you" />
          </div>
        </section>

        {/* QUIZ */}
        <section style={{ marginTop: 14, background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 24, padding: 18, boxShadow: theme === "light" ? "0 12px 40px rgba(30,25,15,.05)" : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: ui.gold, fontSize: 8, fontWeight: 950, letterSpacing: "1.5px" }}><span>✦</span> MAP QUIZ • PRACTICE</div>
              <h2 style={{ margin: "7px 0 4px", fontSize: 24, letterSpacing: "-.7px" }}>Test your India map intelligence</h2>
              <div style={{ color: ui.muted, fontSize: 9 }}>Practice questions are clearly labelled and are not presented as official UPSC PYQs.</div>
            </div>
            {quizStarted && <div style={{ textAlign: "right" }}><div style={{ fontSize: 19, fontWeight: 950 }}>{quizScore}/{QUIZ.length}</div><div style={{ fontSize: 7, color: ui.muted }}>score</div></div>}
          </div>

          {!quizStarted ? (
            <div style={{ marginTop: 16, border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 16, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 11, fontWeight: 900 }}>8-question map practice</div><div style={{ marginTop: 4, color: ui.muted, fontSize: 8 }}>State locations • rivers • relief • ecology • resources • monsoon</div></div>
              <button onClick={() => setQuizStarted(true)} style={primaryButton(ui)}>Start Practice →</button>
            </div>
          ) : (
            <div style={{ marginTop: 16, border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 17, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: ui.muted, fontSize: 8 }}><span>Question {quizIndex + 1} of {QUIZ.length}</span><span>Practice Question</span></div>
              <div style={{ marginTop: 11, fontSize: 15, lineHeight: 1.45, fontWeight: 950 }}>{currentQuiz.q}</div>

              <div className="bd-quiz-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 15 }}>
                {currentQuiz.options.map((option, index) => {
                  const chosen = quizAnswer === index;
                  const correct = currentQuiz.answer === index;
                  const answeredCorrect = quizAnswered && correct;
                  const answeredWrong = quizAnswered && chosen && !correct;
                  return (
                    <button key={option} className="bd-quiz-option" disabled={quizAnswered} onClick={() => answerQuiz(index)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 56, border: `1px solid ${answeredCorrect || chosen ? ui.gold : ui.line}`, background: answeredCorrect ? ui.green : answeredWrong ? ui.red : ui.surface, color: ui.text, borderRadius: 13, padding: "10px 12px", textAlign: "left", cursor: quizAnswered ? "default" : "pointer" }}>
                      <span style={{ width: 29, height: 29, flex: "0 0 29px", display: "grid", placeItems: "center", borderRadius: 9, background: answeredCorrect ? "#b8d9b8" : answeredWrong ? "#e6bebe" : ui.surface2, color: ui.text, fontSize: 9, fontWeight: 950 }}>{String.fromCharCode(65 + index)}</span>
                      <span style={{ fontSize: 9, lineHeight: 1.45, fontWeight: 850 }}>{option}</span>
                    </button>
                  );
                })}
              </div>

              {quizAnswered && <div style={{ marginTop: 13, borderTop: `1px solid ${ui.line}`, paddingTop: 12 }}>
                <div style={{ fontSize: 8, color: ui.gold, fontWeight: 950 }}>EXPLANATION</div>
                <div style={{ marginTop: 5, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>{currentQuiz.explanation}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <button onClick={nextQuiz} style={primaryButton(ui)}>Next Question →</button>
                  <button onClick={resetQuiz} style={secondaryButton(ui)}>Restart</button>
                </div>
              </div>}
            </div>
          )}
        </section>

        {/* ACTIVE RECALL */}
        <section style={{ marginTop: 14, background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 24, padding: 18 }}>
          <div style={{ color: ui.gold, fontSize: 8, fontWeight: 950, letterSpacing: "1.5px" }}>ACTIVE RECALL</div>
          <h2 style={{ margin: "7px 0 4px", fontSize: 23 }}>Learn → Recall → Revise → Master</h2>
          <p style={{ margin: 0, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>Location ko dekhkar answer recall karo, phir reveal karke apni memory check karo.</p>
          <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "stretch" }}>
            <div style={{ border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 15, padding: 14 }}>
              <div style={{ color: ui.gold, fontSize: 8, fontWeight: 950 }}>{currentRecall?.title || "India"}</div>
              <div style={{ marginTop: 7, fontSize: 11, fontWeight: 850 }}>{currentRecall?.prompt}</div>
              {recallRevealed && <div style={{ marginTop: 8, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>{currentRecall?.answer}</div>}
            </div>
            <button onClick={() => setRecallRevealed((value) => !value)} style={{ minWidth: 95, ...primaryButton(ui) }}>{recallRevealed ? "Hide" : "Reveal"}</button>
          </div>
          <button onClick={() => { setRecallIndex((value) => value + 1); setRecallRevealed(false); }} style={{ marginTop: 9, ...secondaryButton(ui) }}>Next Recall →</button>
        </section>

        {/* THREE-STATE COMPARISON */}
        {compareOpen && selected && (
          <div onClick={() => setCompareOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.68)", display: "grid", placeItems: "center", padding: 12 }}>
            <div onClick={(event) => event.stopPropagation()} className="bd-scroll" style={{ width: "min(1180px,100%)", maxHeight: "92vh", overflow: "auto", background: ui.surface, color: ui.text, border: `1px solid ${ui.line}`, borderRadius: 24, padding: 18, boxShadow: "0 25px 80px rgba(0,0,0,.35)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: ui.gold, fontSize: 8, fontWeight: 950, letterSpacing: "1.5px" }}>UPSC COMPARISON LAB</div>
                  <h2 style={{ margin: "6px 0 4px", fontSize: "clamp(21px,3vw,30px)", letterSpacing: "-.8px" }}>Compare 3 States / UTs</h2>
                  <div style={{ color: ui.muted, fontSize: 9, lineHeight: 1.5 }}>Side-by-side geography comparison for faster Prelims revision and elimination practice.</div>
                </div>
                <button onClick={() => setCompareOpen(false)} style={smallButton(ui)}>×</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9, marginTop: 16 }}>
                <CompareSelect label="State / UT 1" value={selectedId} disabled ui={ui}>
                  <option value={selectedId}>{selected.name}</option>
                </CompareSelect>
                <CompareSelect label="State / UT 2" value={compareId} onChange={(event) => setCompareId(event.target.value)} ui={ui}>
                  <option value="">Select state / UT</option>
                  {Object.entries(STATE_META).filter(([id]) => id !== selectedId && id !== compareId2).map(([id, state]) => <option key={id} value={id}>{state.name}</option>)}
                </CompareSelect>
                <CompareSelect label="State / UT 3" value={compareId2} onChange={(event) => setCompareId2(event.target.value)} ui={ui}>
                  <option value="">Select state / UT</option>
                  {Object.entries(STATE_META).filter(([id]) => id !== selectedId && id !== compareId).map(([id, state]) => <option key={id} value={id}>{state.name}</option>)}
                </CompareSelect>
              </div>

              {compareState && compareState2 ? (
                <div className="bd-table-wrap" style={{ marginTop: 16, border: `1px solid ${ui.line}`, borderRadius: 17 }}>
                  <table className="bd-comparison-table">
                    <thead>
                      <tr>
                        <th style={{ width: 145, color: ui.gold, fontSize: 8 }}>GEOGRAPHY</th>
                        {[selected, compareState, compareState2].map((state) => (
                          <th key={state.name} style={{ color: ui.text, minWidth: 205 }}>
                            <div style={{ fontSize: 11, fontWeight: 950 }}>{state.name}</div>
                            <div style={{ marginTop: 4, color: ui.muted, fontSize: 7 }}>{state.region === "UTs" ? "Union Territory" : state.region} • {state.capital}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Rivers & Water", selected.rivers, compareState.rivers, compareState2.rivers],
                        ["Relief / Passes", selected.relief, compareState.relief, compareState2.relief],
                        ["Agriculture", selected.crops, compareState.crops, compareState2.crops],
                        ["Ecology", selected.ecology, compareState.ecology, compareState2.ecology],
                        ["Minerals", selected.minerals, compareState.minerals, compareState2.minerals],
                        ["Important Places", selected.places, compareState.places, compareState2.places],
                        ["Climate / Monsoon", [selected.climate], [compareState.climate], [compareState2.climate]],
                      ].map(([label, a, b, c]) => (
                        <tr key={label}>
                          <td style={{ color: ui.gold, fontSize: 8, fontWeight: 950 }}>{label}</td>
                          {[a, b, c].map((items, index) => (
                            <td key={index}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {items.map((item) => <span key={item} style={{ display: "inline-block", padding: "5px 7px", borderRadius: 7, background: ui.surface2, color: ui.text, fontSize: 8, lineHeight: 1.35 }}>{item}</span>)}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ marginTop: 16, padding: 22, border: `1px dashed ${ui.line}`, background: ui.surface2, borderRadius: 16, textAlign: "center", color: ui.muted, fontSize: 9 }}>Select all three States/UTs to open the comparison table.</div>
              )}
            </div>
          </div>
        )}

        <footer style={{ marginTop: 25, paddingTop: 16, borderTop: `1px solid ${ui.line}`, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: ui.faint, fontSize: 7 }}>
          <span>SAMBHAV UPSC • Bharat Darshan</span>
          <span>Static geography is separate from Current Affairs.</span>
        </footer>
      </div>
    </main>
  );
}

function CompareSelect({ label, value, onChange, disabled, children, ui }) {
  return (
    <label style={{ display: "block", border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 13, padding: 10 }}>
      <div style={{ color: ui.gold, fontSize: 7, fontWeight: 950, letterSpacing: "1px" }}>{label}</div>
      <select value={value} onChange={onChange} disabled={disabled} style={{ marginTop: 6, width: "100%", border: 0, outline: "none", background: "transparent", color: ui.text, fontSize: 9, fontWeight: 850 }}>
        {children}
      </select>
    </label>
  );
}

function InfoGroup({ label, items, ui }) {
  if (!items?.length) return null;
  return <div style={{ marginBottom: 13 }}>
    <div style={{ color: ui.gold, fontSize: 8, fontWeight: 950, letterSpacing: ".8px" }}>{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {items.map((item) => <span key={item} style={{ padding: "6px 8px", borderRadius: 8, background: ui.surface2, border: `1px solid ${ui.line}`, fontSize: 8, color: ui.text }}>{item}</span>)}
    </div>
  </div>;
}

function FeaturePanel({ title, value, ui }) {
  return <div style={{ border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 15, padding: 13 }}><div style={{ color: ui.gold, fontSize: 8, fontWeight: 950 }}>{title}</div><div style={{ marginTop: 7, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>{value}</div></div>;
}

function StatCard({ ui, label, value, sub }) {
  return <div style={{ background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 17, padding: 14 }}><div style={{ color: ui.muted, fontSize: 8, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 6, fontSize: 24, fontWeight: 950 }}>{value}</div><div style={{ marginTop: 3, color: ui.faint, fontSize: 7 }}>{sub}</div></div>;
}

function MapMessage({ ui, title, text }) {
  return <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: 30, color: ui.muted }}><div><div style={{ width: 46, height: 46, margin: "0 auto", borderRadius: 15, display: "grid", placeItems: "center", background: ui.surface2, border: `1px solid ${ui.line}`, color: ui.gold, fontSize: 21 }}>◌</div><div style={{ marginTop: 11, fontSize: 12, fontWeight: 950, color: ui.text }}>{title}</div><div style={{ marginTop: 5, fontSize: 9, lineHeight: 1.5 }}>{text}</div></div></div>;
}

function smallButton(ui) {
  return { border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 11, padding: "9px 11px", cursor: "pointer", fontWeight: 850, fontSize: 9 };
}

function primaryButton(ui) {
  return { border: 0, background: ui.gold, color: "#111", borderRadius: 11, padding: "10px 13px", cursor: "pointer", fontWeight: 950, fontSize: 9 };
}

function secondaryButton(ui) {
  return { border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 11, padding: "10px 13px", cursor: "pointer", fontWeight: 900, fontSize: 9 };
}
