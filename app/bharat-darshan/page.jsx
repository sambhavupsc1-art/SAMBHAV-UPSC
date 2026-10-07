"use client";

import { useEffect, useMemo, useState } from "react";

/*
  ============================================================
  SAMBHAV UPSC — BHARAT DARSHAN
  Route: /bharat-darshan

  IMPORTANT:
  - This page does NOT modify the main dashboard.
  - This page does NOT modify auth.
  - This page does NOT modify Current Affairs / PYQ / Mains.
  - Geography data remains in the separate data file.
  - State identity is always resolved through stable IDs.
  - Polygon geometry is used only for visual rendering.
  ============================================================
*/

/* ============================================================
   KEEP YOUR EXISTING DATA IMPORT PATH HERE
   ============================================================ */

import { STATE_META, FEATURE_INDEX } from "./data";

/* ============================================================
   GEOJSON
   ============================================================ */

const GEOJSON_URL =
  "https://raw.githubusercontent.com/adarshbiradar/maps-geojson/master/india.json";

/* ============================================================
   MODES
   ============================================================ */

const MODES = [
  {
    id: "explore",
    title: "Explore India",
    short: "States & UTs",
    icon: "◈",
    key: "overview",
  },
  {
    id: "rivers",
    title: "Rivers",
    short: "River systems",
    icon: "≈",
    key: "rivers",
  },
  {
    id: "mountains",
    title: "Mountains & Passes",
    short: "Relief & passes",
    icon: "△",
    key: "relief",
  },
  {
    id: "ecology",
    title: "Ecology",
    short: "Parks & biodiversity",
    icon: "♧",
    key: "ecology",
  },
  {
    id: "minerals",
    title: "Minerals & Resources",
    short: "Resource geography",
    icon: "◆",
    key: "minerals",
  },
  {
    id: "agriculture",
    title: "Agriculture",
    short: "Crops & regions",
    icon: "⌁",
    key: "crops",
  },
  {
    id: "coastal",
    title: "Coastal India",
    short: "Ports & islands",
    icon: "⌂",
    key: "coastal",
  },
  {
    id: "climate",
    title: "Climate & Monsoon",
    short: "Monsoon geography",
    icon: "☼",
    key: "climate",
  },
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

/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[().,'’']/g, "")
    .replace(/\s+/g, " ");
}

/*
  Aliases are only used for matching GeoJSON property names
  to the already-existing stable IDs.
*/
const NAME_ALIASES = {
  "andaman and nicobar islands": "AN",
  "andaman and nicobar": "AN",
  "andhra pradesh": "AP",
  "arunachal pradesh": "AR",
  assam: "AS",
  bihar: "BR",
  chhattisgarh: "CG",
  chattisgarh: "CG",
  goa: "GA",
  gujarat: "GJ",
  haryana: "HR",
  "himachal pradesh": "HP",
  jharkhand: "JH",
  karnataka: "KA",
  kerala: "KL",
  "madhya pradesh": "MP",
  maharashtra: "MH",
  manipur: "MN",
  meghalaya: "ML",
  mizoram: "MZ",
  nagaland: "NL",
  odisha: "OD",
  orissa: "OD",
  punjab: "PB",
  rajasthan: "RJ",
  sikkim: "SK",
  "tamil nadu": "TN",
  telangana: "TS",
  tripura: "TR",
  "uttar pradesh": "UP",
  uttarakhand: "UK",
  "west bengal": "WB",
  chandigarh: "CH",
  delhi: "DL",
  "nct of delhi": "DL",
  "dadra and nagar haveli and daman and diu": "DN",
  "dadra and nagar haveli": "DN",
  "daman and diu": "DN",
  "jammu and kashmir": "JK",
  "jammu kashmir": "JK",
  ladakh: "LA",
  lakshadweep: "LD",
  puducherry: "PY",
  pondicherry: "PY",
};

/*
  Build stable name -> ID mapping from existing data.
*/
const DATA_NAME_TO_ID = Object.fromEntries(
  Object.entries(STATE_META || {}).map(([id, item]) => [
    normalizeName(item?.name),
    id,
  ])
);

function canonicalId(properties = {}) {
  const candidates = [
    properties.ST_NM,
    properties.st_nm,
    properties.STATE,
    properties.State,
    properties.state,
    properties.NAME_1,
    properties.NAME,
    properties.name,
    properties.NAME_0,
    properties["Name of State"],
    properties["Name of State / UT"],
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeName(candidate);

    if (DATA_NAME_TO_ID[normalized]) {
      return DATA_NAME_TO_ID[normalized];
    }

    if (NAME_ALIASES[normalized]) {
      return NAME_ALIASES[normalized];
    }
  }

  return null;
}

/* ============================================================
   DATA ADAPTER
   ============================================================ */

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function cleanItems(value) {
  return asArray(value)
    .map((x) => {
      if (typeof x === "string") return x;
      if (x?.name) return x.name;
      if (x?.title) return x.title;
      if (x?.label) return x.label;
      return String(x);
    })
    .filter(Boolean);
}

function firstDefined(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      return value;
    }
  }
  return null;
}

function normalizeGeoFeatureItems(value, fallbackType = "point") {
  return asArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const name = firstDefined(
        item.name,
        item.title,
        item.label,
        item.feature,
        item.river,
        item.park,
        item.pass,
        item.mineral,
        item.crop,
        item.port
      );

      if (!name) return null;

      const geometry = item.geometry || item.geojson || item.geoJSON || null;
      const coordinates = item.coordinates || item.coords || null;
      const lat = item.lat ?? item.latitude;
      const lon = item.lon ?? item.lng ?? item.longitude;

      let safeCoordinates = null;
      if (Array.isArray(coordinates)) {
        safeCoordinates = coordinates;
      } else if (
        Number.isFinite(Number(lat)) &&
        Number.isFinite(Number(lon))
      ) {
        safeCoordinates = [Number(lon), Number(lat)];
      }

      const validPoint =
        Array.isArray(safeCoordinates) &&
        safeCoordinates.length === 2 &&
        Number.isFinite(Number(safeCoordinates[0])) &&
        Number.isFinite(Number(safeCoordinates[1]));

      const validGeometry =
        geometry &&
        typeof geometry === "object" &&
        typeof geometry.type === "string" &&
        Array.isArray(geometry.coordinates);

      if (!validPoint && !validGeometry) return null;

      return {
        id: item.id || item.featureId || `${fallbackType}-${String(name)}`,
        name: String(name),
        type: item.type || fallbackType,
        description: item.description || item.note || "",
        source: item.source || item.sourceName || "",
        sourceUrl: item.sourceUrl || item.url || "",
        geometry: validGeometry ? geometry : null,
        coordinates: validPoint ? [Number(safeCoordinates[0]), Number(safeCoordinates[1])] : null,
      };
    })
    .filter(Boolean);
}

function normalizeStateGeoLayers(raw = {}, feature = {}) {
  return {
    rivers: normalizeGeoFeatureItems(
      firstDefined(raw.riverFeatures, raw.riversGeo, raw.riversMap, feature.riverFeatures),
      "river"
    ),
    mountains: normalizeGeoFeatureItems(
      firstDefined(raw.mountainFeatures, raw.reliefGeo, raw.mountainsMap, feature.mountainFeatures),
      "mountain"
    ),
    ecology: normalizeGeoFeatureItems(
      firstDefined(raw.ecologyFeatures, raw.protectedAreaFeatures, raw.parksMap, feature.ecologyFeatures),
      "ecology"
    ),
    minerals: normalizeGeoFeatureItems(
      firstDefined(raw.mineralFeatures, raw.resourcesMap, feature.mineralFeatures),
      "mineral"
    ),
    agriculture: normalizeGeoFeatureItems(
      firstDefined(raw.agricultureFeatures, raw.cropRegions, raw.cropsMap, feature.agricultureFeatures),
      "agriculture"
    ),
    coastal: normalizeGeoFeatureItems(
      firstDefined(raw.coastalFeatures, raw.portFeatures, raw.coastMap, feature.coastalFeatures),
      "coastal"
    ),
    climate: normalizeGeoFeatureItems(
      firstDefined(raw.climateFeatures, raw.climateMap, feature.climateFeatures),
      "climate"
    ),
  };
}

function normalizeStateData(id, raw = {}) {
  const feature = FEATURE_INDEX?.[id] || {};

  return {
    id,
    name:
      raw.name ||
      raw.title ||
      raw.state ||
      raw.label ||
      id,

    region:
      raw.region ||
      raw.zone ||
      "All India",

    capital:
      raw.capital ||
      raw.capitalCity ||
      raw.capital_city ||
      "—",

    rivers: cleanItems(
      firstDefined(
        raw.rivers,
        raw.river,
        raw.water,
        raw.waterBodies,
        feature.rivers
      )
    ),

    relief: cleanItems(
      firstDefined(
        raw.relief,
        raw.mountains,
        raw.mountain,
        raw.passes,
        raw.mountainsPasses,
        feature.relief
      )
    ),

    ecology: cleanItems(
      firstDefined(
        raw.ecology,
        raw.parks,
        raw.protectedAreas,
        raw.biodiversity,
        raw.wildlife,
        feature.ecology
      )
    ),

    minerals: cleanItems(
      firstDefined(
        raw.minerals,
        raw.resources,
        raw.mineralsResources,
        feature.minerals
      )
    ),

    crops: cleanItems(
      firstDefined(
        raw.crops,
        raw.agriculture,
        raw.agri,
        raw.agricultural,
        feature.crops
      )
    ),

    coastal: cleanItems(
      firstDefined(
        raw.coastal,
        raw.ports,
        raw.port,
        raw.islands,
        raw.coast,
        feature.coastal
      )
    ),

    geoLayers: normalizeStateGeoLayers(raw, feature),

    climate:
      firstDefined(
        raw.climate,
        raw.monsoon,
        raw.climateMonsoon,
        feature.climate
      ) || "Verified climate data unavailable.",

    places: cleanItems(
      firstDefined(
        raw.places,
        raw.importantPlaces,
        raw.centres,
        raw.centers,
        feature.places
      )
    ),

    facts: cleanItems(
      firstDefined(raw.facts, raw.mapFacts, raw.upscFacts, feature.facts)
    ),

    importance:
      raw.importance ||
      raw.upscImportance ||
      feature.importance ||
      "Use this state/UT for map-based UPSC revision.",

    source:
      raw.source ||
      raw.sources ||
      feature.source ||
      null,
  };
}

function buildKnowledgeBase() {
  return Object.fromEntries(
    Object.entries(STATE_META || {}).map(([id, raw]) => [
      id,
      normalizeStateData(id, raw),
    ])
  );
}

/* ============================================================
   QUIZ
   ============================================================ */

const PRACTICE_QUIZ = [
  {
    q: "Which river is associated with the Kashmir Valley?",
    options: ["Jhelum", "Mahanadi", "Narmada", "Sabarmati"],
    answer: 0,
    explanation:
      "The Jhelum is the principal river associated with the Kashmir Valley.",
  },
  {
    q: "Which state is most strongly associated with the Thar Desert?",
    options: ["Rajasthan", "Kerala", "Assam", "Odisha"],
    answer: 0,
    explanation:
      "The Thar Desert occupies a large part of western Rajasthan.",
  },
  {
    q: "Keibul Lamjao National Park is located in which state?",
    options: ["Manipur", "Sikkim", "Meghalaya", "Mizoram"],
    answer: 0,
    explanation:
      "Keibul Lamjao National Park is located in Manipur on Loktak Lake.",
  },
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
      "The Narmada valley lies between the Vindhya Range in the north and Satpura Range in the south.",
  },
  {
    q: "Which state receives substantial rainfall from the northeast monsoon?",
    options: ["Tamil Nadu", "Punjab", "Rajasthan", "Himachal Pradesh"],
    answer: 0,
    explanation:
      "Tamil Nadu receives an important share of rainfall from the northeast/retreating monsoon.",
  },
  {
    q: "Kaziranga National Park is located in which state?",
    options: ["Assam", "Gujarat", "Rajasthan", "Madhya Pradesh"],
    answer: 0,
    explanation:
      "Kaziranga National Park is located in Assam and is famous for the greater one-horned rhinoceros.",
  },
  {
    q: "Which mineral combination is particularly important in Chhattisgarh?",
    options: [
      "Iron ore and coal",
      "Petroleum and natural gas",
      "Uranium and crude oil",
      "Gold and petroleum",
    ],
    answer: 0,
    explanation:
      "Chhattisgarh is an important producer of iron ore and coal.",
  },
  {
    q: "Which river is strongly associated with Punjab and Haryana?",
    options: ["Sutlej", "Periyar", "Godavari", "Vaigai"],
    answer: 0,
    explanation:
      "The Sutlej is one of the major rivers of the northwestern river system.",
  },
];

/* ============================================================
   ACTIVE RECALL
   ============================================================ */

const RECALL_ITEMS = [
  {
    title: "RIVER RECALL",
    prompt: "Name two major rivers associated with Uttar Pradesh.",
    answer: "Examples: Ganga and Yamuna.",
  },
  {
    title: "RELIEF RECALL",
    prompt: "Which two major relief systems are associated with Madhya Pradesh?",
    answer: "Examples: Vindhya and Satpura.",
  },
  {
    title: "ECOLOGY RECALL",
    prompt: "Name one major protected area of Assam.",
    answer: "Examples: Kaziranga National Park or Manas National Park.",
  },
  {
    title: "COASTAL RECALL",
    prompt: "Which sea lies along the western coast of India?",
    answer: "Arabian Sea.",
  },
];

/* ============================================================
   OFFICIAL REPORTS / LATEST DATA
   ============================================================

   These cards are report metadata/navigation only. They do not
   replace the separate State/UT geography data file.

   Report years are deliberately shown beside every item so that
   static geography and changing datasets are not mixed silently.
*/
const OFFICIAL_REPORTS = [
  {
    id: "forest",
    category: "Forest",
    title: "India State of Forest Report 2023",
    issuer: "Forest Survey of India • MoEFCC",
    year: "2023",
    updated: "Official report",
    summary:
      "Forest cover, tree cover, mangrove cover, forest types, biodiversity, forest fire monitoring, growing stock, bamboo and carbon stock.",
    upsc:
      "Prelims: forest-cover classes, mangroves, carbon stock and state-wise geography. GS-III: forests, biodiversity and climate mitigation.",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    sourceLabel: "FSI official report",
  },
  {
    id: "agriculture",
    category: "Agriculture",
    title: "Agricultural Statistics at a Glance 2024",
    issuer: "Department of Agriculture & Farmers Welfare",
    year: "2024",
    updated: "Official statistics",
    summary:
      "Crop area, production, productivity and wider agriculture statistics for UPSC-oriented state and national comparisons.",
    upsc:
      "Prelims: crop geography and production patterns. GS-III: productivity, irrigation, diversification and agricultural trends.",
    sourceUrl:
      "https://desagri.gov.in/document-report/agricultural-statistics-at-a-glance-2024/",
    sourceLabel: "Agriculture Department",
  },
  {
    id: "environment",
    category: "Environment",
    title: "Annual Report 2025–26",
    issuer: "Ministry of Environment, Forest & Climate Change",
    year: "2025–26",
    updated: "Official annual report",
    summary:
      "Ministry-level environment, forest, biodiversity, pollution, climate and conservation programme information.",
    upsc:
      "Useful for current static linkage: institutions, schemes, conservation programmes and environment governance.",
    sourceUrl: "https://www.moef.gov.in/annual-reports",
    sourceLabel: "MoEFCC annual reports",
  },
  {
    id: "water",
    category: "Water",
    title: "National Compilation on Dynamic Ground Water Resources of India, 2025",
    issuer: "Central Ground Water Board • Ministry of Jal Shakti",
    year: "2025",
    updated: "Official assessment",
    summary:
      "National groundwater-resource assessment with state/UT and assessment-unit level groundwater information.",
    upsc:
      "Prelims: aquifers and groundwater terminology. GS-III: groundwater stress, irrigation, recharge and water security.",
    sourceUrl:
      "https://cgwb.gov.in/en/national-compilation-dynamic-ground-water-resources-india-2025",
    sourceLabel: "CGWB official report",
  },
  {
    id: "climate",
    category: "Climate",
    title: "Statement on the Climate of India During 2025",
    issuer: "India Meteorological Department • Ministry of Earth Sciences",
    year: "2025",
    updated: "Issued 1 January 2026",
    summary:
      "Annual climate assessment for India covering temperature, rainfall and significant weather/climate observations.",
    upsc:
      "GS-I/GS-III linkage: monsoon, rainfall variability, temperature extremes, cyclones and climate-risk geography.",
    sourceUrl:
      "https://internal.imd.gov.in/pages/press_release_mausam.php",
    sourceLabel: "IMD official releases",
  },
];

const REPORT_FILTERS = [
  ["all", "All"],
  ["forest", "Forest"],
  ["agriculture", "Agriculture"],
  ["environment", "Environment"],
  ["water", "Water"],
  ["climate", "Climate"],
];

function getReportStatusLabel(report) {
  if (report?.updated) return report.updated;
  return "Official source";
}
/* ============================================================
   GEOJSON HELPERS
   ============================================================ */

function walkCoordinates(coords, output = []) {
  if (!Array.isArray(coords)) return output;

  if (
    coords.length >= 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  ) {
    output.push(coords);
    return output;
  }

  for (const child of coords) {
    walkCoordinates(child, output);
  }

  return output;
}

function geometryCoordinates(geometry) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return walkCoordinates(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return walkCoordinates(geometry.coordinates);
  }

  return [];
}

function calculateBounds(features) {
  const all = [];

  for (const item of features || []) {
    all.push(...geometryCoordinates(item.feature?.geometry));
  }

  if (!all.length) {
    return {
      minLon: 68,
      maxLon: 98,
      minLat: 6,
      maxLat: 38,
    };
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of all) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    minLon,
    maxLon,
    minLat,
    maxLat,
  };
}

function projectPoint(point, bounds, width = 720, height = 620) {
  const [lon, lat] = point;

  const padding = 28;

  const lonRange = Math.max(bounds.maxLon - bounds.minLon, 1);
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 1);

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const scale = Math.min(
    usableWidth / lonRange,
    usableHeight / latRange
  );

  const mapWidth = lonRange * scale;
  const mapHeight = latRange * scale;

  const offsetX = (width - mapWidth) / 2;
  const offsetY = (height - mapHeight) / 2;

  const x =
    offsetX +
    (lon - bounds.minLon) * scale;

  const y =
    height -
    (offsetY + (lat - bounds.minLat) * scale);

  return [x, y];
}

function ringPath(ring, bounds, width, height) {
  if (!Array.isArray(ring) || ring.length < 2) return "";

  return ring
    .map(([lon, lat], index) => {
      const [x, y] = projectPoint(
        [lon, lat],
        bounds,
        width,
        height
      );

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(
        2
      )}`;
    })
    .join(" ") + " Z";
}

function geometryPath(geometry, bounds, width = 720, height = 620) {
  if (!geometry) return "";

  if (geometry.type === "Polygon") {
    return geometry.coordinates
      .map((ring) =>
        ringPath(ring, bounds, width, height)
      )
      .join(" ");
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) =>
        polygon
          .map((ring) =>
            ringPath(ring, bounds, width, height)
          )
          .join(" ")
      )
      .join(" ");
  }

  return "";
}

/*
  Visual anchor only.
  State identity is NEVER derived from this point.
  The state ID already came from exact GeoJSON-name -> stable-ID mapping.
*/
function featureAnchor(feature, bounds, width = 720, height = 620) {
  const coords = geometryCoordinates(feature?.geometry);

  if (!coords.length) {
    return [width / 2, height / 2];
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return projectPoint(
    [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
    bounds,
    width,
    height
  );
}

/* ============================================================
   COLOR / UI
   ============================================================ */

function getGeoLayerKey(mode) {
  switch (mode) {
    case "rivers": return "rivers";
    case "mountains": return "mountains";
    case "ecology": return "ecology";
    case "minerals": return "minerals";
    case "agriculture": return "agriculture";
    case "coastal": return "coastal";
    case "climate": return "climate";
    default: return null;
  }
}

function featureGeometryPath(geometry, bounds, width = 720, height = 620) {
  if (!geometry) return "";
  if (geometry.type === "LineString") {
    return geometry.coordinates
      .map(([lon, lat], index) => {
        const [x, y] = projectPoint([lon, lat], bounds, width, height);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates
      .map((line) => featureGeometryPath({ type: "LineString", coordinates: line }, bounds, width, height))
      .join(" ");
  }
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    return geometryPath(geometry, bounds, width, height);
  }
  return "";
}

function featurePoint(feature, bounds, width = 720, height = 620) {
  if (!feature?.coordinates) return null;
  const [lon, lat] = feature.coordinates;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return projectPoint([lon, lat], bounds, width, height);
}

function getModeAccent(mode) {
  const map = {
    explore: "#b08a42",
    rivers: "#3f83c5",
    mountains: "#92775b",
    ecology: "#5f9b68",
    minerals: "#a17a4e",
    agriculture: "#7f9b50",
    coastal: "#4b8ca3",
    climate: "#b46f50",
  };

  return map[mode] || "#b08a42";
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function BharatDarshanPage() {
  const knowledge = useMemo(
    () => buildKnowledgeBase(),
    []
  );

  const [theme, setTheme] = useState("light");

  const [mode, setMode] = useState("explore");
  const [region, setRegion] = useState("All India");
  const [search, setSearch] = useState("");

  const [geoData, setGeoData] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [geoError, setGeoError] = useState("");

  const [selectedId, setSelectedId] = useState(null);

  const [selectedMapFeature, setSelectedMapFeature] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const [progress, setProgress] = useState({});

  const [reportFilter, setReportFilter] = useState("all");

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const [timedMode, setTimedMode] = useState(null);
  const [timedStarted, setTimedStarted] = useState(false);
  const [timedIndex, setTimedIndex] = useState(0);
  const [timedScore, setTimedScore] = useState(0);

  /* ==========================================================
     THEME
     ========================================================== */

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("sambhav-theme");

      if (stored === "dark" || stored === "light") {
        setTheme(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sambhav-theme",
        theme
      );
    } catch {}
  }, [theme]);

  /* ==========================================================
     PROGRESS
     ========================================================== */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "sambhav-bharat-darshan-progress"
      );

      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sambhav-bharat-darshan-progress",
        JSON.stringify(progress)
      );
    } catch {}
  }, [progress]);

  /* ==========================================================
     GEOJSON FETCH
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      setLoadingMap(true);
      setGeoError("");

      try {
        const response = await fetch(
          GEOJSON_URL,
          {
            cache: "force-cache",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Boundary request failed (${response.status})`
          );
        }

        const json = await response.json();

        if (cancelled) return;

        const rawFeatures = Array.isArray(json?.features)
          ? json.features
          : [];

        const mapped = rawFeatures
          .map((feature) => ({
            feature,
            id: canonicalId(
              feature?.properties || {}
            ),
            name:
              feature?.properties?.ST_NM ||
              feature?.properties?.NAME_1 ||
              feature?.properties?.name ||
              feature?.properties?.NAME ||
              "Unknown",
          }))
          .filter((item) => item.id);

        if (!mapped.length) {
          throw new Error(
            "No verified State/UT polygons could be mapped."
          );
        }

        setGeoData(mapped);
      } catch (error) {
        if (!cancelled) {
          setGeoError(
            error?.message ||
              "India boundary data could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMap(false);
        }
      }
    }

    loadMap();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     DERIVED MAP DATA
     ========================================================== */

  const bounds = useMemo(
    () => calculateBounds(geoData || []),
    [geoData]
  );

  const selected = selectedId
    ? knowledge[selectedId]
    : null;

  const currentMode = MODES.find(
    (item) => item.id === mode
  );

  const modeAccent = getModeAccent(mode);

  const totalStates = Object.keys(knowledge).length;

  const masteredCount = Object.values(progress).filter(
    (x) => x?.status === "Mastered"
  ).length;

  const revisionCount = Object.values(progress).filter(
    (x) => x?.status === "Needs Revision"
  ).length;

  const learningCount = Object.values(progress).filter(
    (x) =>
      x?.status === "Learning" ||
      x?.status === "Needs Revision"
  ).length;

  /* ==========================================================
     MODE DATA
     ========================================================== */

  function getModeItems(state) {
    if (!state) return [];

    switch (mode) {
      case "rivers":
        return state.rivers;

      case "mountains":
        return state.relief;

      case "ecology":
        return state.ecology;

      case "minerals":
        return state.minerals;

      case "agriculture":
        return state.crops;

      case "coastal":
        return state.coastal;

      case "climate":
        return [
          state.climate,
        ];

      case "explore":
      default:
        return [
          ...state.rivers.slice(0, 2),
          ...state.relief.slice(0, 2),
          ...state.ecology.slice(0, 2),
        ];
    }
  }

  function getModeLabel() {
    switch (mode) {
      case "rivers":
        return "Rivers";
      case "mountains":
        return "Mountains & Passes";
      case "ecology":
        return "Ecology";
      case "minerals":
        return "Minerals & Resources";
      case "agriculture":
        return "Agriculture";
      case "coastal":
        return "Coastal India";
      case "climate":
        return "Climate & Monsoon";
      default:
        return "State Overview";
    }
  }

  /* ==========================================================
     SEARCH
     ========================================================== */

  const filteredFeatures = useMemo(() => {
    if (!geoData) return [];

    const query = normalizeName(search);

    return geoData.filter((item) => {
      const state = knowledge[item.id];

      if (!state) return false;

      if (
        region !== "All India" &&
        state.region !== region
      ) {
        return false;
      }

      if (!query) return true;

      const modeItems = getModeItemsForSearch(
        state,
        mode
      );

      const searchable = [
        state.name,
        state.capital,
        state.region,
        ...modeItems,
        ...state.places,
        ...state.facts,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    geoData,
    region,
    search,
    mode,
    knowledge,
  ]);

  function getModeItemsForSearch(state, selectedMode) {
    switch (selectedMode) {
      case "rivers":
        return state.rivers;
      case "mountains":
        return state.relief;
      case "ecology":
        return state.ecology;
      case "minerals":
        return state.minerals;
      case "agriculture":
        return state.crops;
      case "coastal":
        return state.coastal;
      case "climate":
        return [state.climate];
      default:
        return [
          ...state.rivers,
          ...state.relief,
          ...state.ecology,
          ...state.minerals,
          ...state.crops,
          ...state.coastal,
        ];
    }
  }

  /* ==========================================================
     STATE SELECT
     ========================================================== */

  function selectState(id) {
    if (!knowledge[id]) return;

    setSelectedId(id);
    setSelectedMapFeature(null);
    setActiveTab("overview");
    setRecallRevealed(false);
    setMobilePanelOpen(true);

    /*
      Do not alter existing state progress merely because
      user clicked it.
    */
  }

  /* ==========================================================
     MASTERED
     ========================================================== */

  function selectMapFeature(feature, stateId) {
    setSelectedMapFeature({ ...feature, stateId });
  }

  function markMastered() {
    if (!selectedId) return;

    setProgress((previous) => ({
      ...previous,
      [selectedId]: {
        ...(previous[selectedId] || {}),
        status: "Mastered",
        masteredAt: new Date().toISOString(),
      },
    }));
  }

  function markNeedsRevision() {
    if (!selectedId) return;

    setProgress((previous) => ({
      ...previous,
      [selectedId]: {
        ...(previous[selectedId] || {}),
        status: "Needs Revision",
      },
    }));
  }

  /* ==========================================================
     COMPARISON
     ========================================================== */

  function openComparison() {
    if (!selectedId) return;

    const firstTwo = Object.keys(knowledge)
      .filter((id) => id !== selectedId)
      .slice(0, 2);

    setCompareIds(firstTwo);
    setCompareOpen(true);
  }

  function updateCompareSlot(slot, id) {
    setCompareIds((previous) => {
      const next = [...previous];

      next[slot] = id;

      return next;
    });
  }

  const comparisonStates = [
    selectedId,
    ...compareIds,
  ]
    .filter(Boolean)
    .slice(0, 3)
    .map((id) => knowledge[id])
    .filter(Boolean);

  /* ==========================================================
     QUIZ
     ========================================================== */

  const currentQuiz =
    PRACTICE_QUIZ[quizIndex];

  function startQuiz() {
    setQuizStarted(true);
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizAnswered(false);
    setQuizScore(0);
  }

  function answerQuiz(index) {
    if (quizAnswered) return;

    setQuizAnswer(index);
    setQuizAnswered(true);

    if (index === currentQuiz.answer) {
      setQuizScore((value) => value + 1);
    }
  }

  function nextQuiz() {
    if (
      quizIndex >=
      PRACTICE_QUIZ.length - 1
    ) {
      setQuizStarted(false);
      setQuizIndex(0);
      setQuizAnswer(null);
      setQuizAnswered(false);
      return;
    }

    setQuizIndex((value) => value + 1);
    setQuizAnswer(null);
    setQuizAnswered(false);
  }

  /* ==========================================================
     RECALL
     ========================================================== */

  const currentRecall =
    RECALL_ITEMS[
      recallIndex % RECALL_ITEMS.length
    ];

  function nextRecall() {
    setRecallIndex(
      (value) => value + 1
    );
    setRecallRevealed(false);
  }

  /* ==========================================================
     TIMED TEST
     ========================================================== */

  const TIMED_OPTIONS = [
    {
      id: "10-5",
      title: "10 / 5",
      questions: 10,
      minutes: 5,
    },
    {
      id: "25-10",
      title: "25 / 10",
      questions: 25,
      minutes: 10,
    },
    {
      id: "50-20",
      title: "50 / 20",
      questions: 50,
      minutes: 20,
    },
  ];

  function startTimedTest(option) {
    setTimedMode(option);
    setTimedStarted(true);
    setTimedIndex(0);
    setTimedScore(0);
  }

  /* ==========================================================
     UI
     ========================================================== */

  const ui =
    theme === "dark"
      ? {
          bg: "#0b0b0a",
          surface: "#151514",
          surface2: "#1c1c1a",
          surface3: "#23231f",
          text: "#f2eee5",
          muted: "#aaa69b",
          line: "#2d2d29",
          gold: "#c7a45c",
          map: "#0f0f0e",
          shadow:
            "0 18px 50px rgba(0,0,0,.35)",
        }
      : {
          bg: "#f4f1e9",
          surface: "#fffdf8",
          surface2: "#f7f3e9",
          surface3: "#eee9dc",
          text: "#1a1916",
          muted: "#716d63",
          line: "#ddd7c9",
          gold: "#a77d2f",
          map: "#f1eee6",
          shadow:
            "0 18px 50px rgba(63,49,23,.09)",
        };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: ui.bg,
        color: ui.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: ${ui.bg};
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .bd-shell {
          width: min(1480px, calc(100% - 28px));
          margin: 0 auto;
          padding: 18px 0 42px;
        }

        .bd-scroll {
          scrollbar-width: thin;
        }

        .bd-modes {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding: 4px 2px 12px;
          scrollbar-width: none;
        }

        .bd-modes::-webkit-scrollbar {
          display: none;
        }

        .bd-main-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.55fr)
            minmax(350px, 0.75fr);
          gap: 14px;
          align-items: start;
        }

        .bd-map-card {
          min-height: 650px;
        }

        .bd-map-area {
          height: 570px;
        }

        .bd-explorer {
          position: sticky;
          top: 12px;
        }

        .bd-stat-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .bd-info-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .bd-compare-table {
          min-width: 760px;
        }

        .bd-mobile-explorer-toggle {
          display: none;
        }

        @media (max-width: 1100px) {
          .bd-main-grid {
            grid-template-columns: 1fr;
          }

          .bd-explorer {
            position: relative;
            top: auto;
          }

          .bd-map-card {
            min-height: 590px;
          }

          .bd-map-area {
            height: 520px;
          }
        }

        @media (max-width: 760px) {
          .bd-shell {
            width: min(100% - 16px, 680px);
            padding-top: 10px;
          }

          .bd-map-card {
            min-height: 480px;
            border-radius: 18px !important;
          }

          .bd-map-area {
            height: 430px;
            padding: 7px !important;
          }

          .bd-stat-grid {
            grid-template-columns: 1fr;
          }

          .bd-info-grid {
            grid-template-columns: 1fr;
          }

          .bd-mobile-explorer-toggle {
            display: flex;
          }

          .bd-explorer-content {
            display: none;
          }

          .bd-explorer-content.open {
            display: block;
          }

          .bd-hero-title {
            font-size: 38px !important;
          }

          .bd-compare-table {
            min-width: 720px;
          }
        }


        @media (max-width: 760px) {
          .bd-report-grid {
            grid-template-columns: 1fr !important;
          }

          .bd-mastery-stats {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }

        @media (max-width: 480px) {
          .bd-map-area {
            height: 360px;
          }

          .bd-shell {
            width: calc(100% - 12px);
          }
        }
      `}</style>

      <div className="bd-shell">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "4px 0 14px",
            borderBottom:
              `1px solid ${ui.line}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "1.6px",
                fontWeight: 950,
                color: ui.gold,
              }}
            >
              SAMBHAV UPSC
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Bharat Darshan
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 7,
            }}
          >
            <button
              onClick={() => {
                const next =
                  theme === "dark"
                    ? "light"
                    : "dark";

                setTheme(next);
              }}
              style={iconButton(ui)}
              aria-label="Toggle theme"
            >
              {theme === "dark"
                ? "☀"
                : "☾"}
            </button>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                ...iconButton(ui),
                padding: "8px 12px",
                fontSize: 10,
              }}
            >
              ← Home
            </button>
          </div>
        </header>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          style={{
            padding:
              "25px 0 17px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "7px 10px",
              borderRadius: 999,
              border:
                `1px solid ${ui.line}`,
              background: ui.surface,
              color: ui.gold,
              fontSize: 8,
              fontWeight: 950,
              letterSpacing: "1.2px",
            }}
          >
            MAP INTELLIGENCE FOR UPSC
          </div>

          <h1
            className="bd-hero-title"
            style={{
              margin:
                "10px 0 9px",
              fontSize: "clamp(38px, 5vw, 60px)",
              lineHeight: 0.95,
              letterSpacing: "-2.4px",
              fontWeight: 950,
            }}
          >
            Bharat Darshan
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 820,
              color: ui.muted,
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Explore India through an interactive
            UPSC map — learn locations, recall
            associations, solve map questions and
            revise weak regions.
          </p>
        </section>

        {/* ====================================================
            MODES
        ==================================================== */}

        <div className="bd-modes">
          {MODES.map((item) => {
            const active =
              mode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setMode(item.id);
                  setSearch("");
                }}
                style={{
                  flex:
                    "0 0 auto",
                  minWidth: 142,
                  textAlign:
                    "left",
                  cursor: "pointer",
                  border:
                    `1px solid ${
                      active
                        ? modeAccent
                        : ui.line
                    }`,
                  background:
                    active
                      ? `${modeAccent}18`
                      : ui.surface,
                  color: ui.text,
                  borderRadius: 15,
                  padding:
                    "11px 12px",
                  boxShadow:
                    active
                      ? `0 8px 24px ${modeAccent}16`
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      display: "grid",
                      placeItems:
                        "center",
                      borderRadius: 8,
                      background:
                        active
                          ? modeAccent
                          : ui.surface2,
                      color:
                        active
                          ? "#111"
                          : ui.gold,
                      fontWeight: 950,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 950,
                    }}
                  >
                    {item.title}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 7,
                    paddingLeft: 31,
                    color: ui.muted,
                    fontSize: 8,
                  }}
                >
                  {item.short}
                </div>
              </button>
            );
          })}
        </div>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <section
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {REGIONS.map((item) => {
            const active =
              region === item;

            return (
              <button
                key={item}
                onClick={() =>
                  setRegion(item)
                }
                style={{
                  border:
                    `1px solid ${
                      active
                        ? ui.gold
                        : ui.line
                    }`,
                  background:
                    active
                      ? ui.gold
                      : ui.surface,
                  color:
                    active
                      ? "#111"
                      : ui.text,
                  borderRadius: 999,
                  padding:
                    "7px 11px",
                  fontSize: 8,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            );
          })}

          <div
            style={{
              flex: 1,
              minWidth: 220,
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={`Search ${currentMode?.title?.toLowerCase() || "India"}...`}
              style={{
                width: "100%",
                border:
                  `1px solid ${ui.line}`,
                background:
                  ui.surface,
                color: ui.text,
                borderRadius: 999,
                padding:
                  "9px 13px",
                outline: "none",
                fontSize: 10,
              }}
            />
          </div>
        </section>

        {/* ====================================================
            MAIN MAP + EXPLORER
        ==================================================== */}

        <div className="bd-main-grid">
          {/* MAP */}
          <section
            className="bd-map-card"
            style={{
              background: ui.surface,
              border:
                `1px solid ${ui.line}`,
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: ui.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: 10,
                padding:
                  "15px 16px",
                borderBottom:
                  `1px solid ${ui.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 950,
                  }}
                >
                  {currentMode?.title}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 8,
                    color: ui.muted,
                  }}
                >
                  Tap a verified state/UT
                  polygon to explore its{" "}
                  {getModeLabel().toLowerCase()}.
                </div>
              </div>

              <div
                style={{
                  fontSize: 8,
                  color: ui.muted,
                  whiteSpace:
                    "nowrap",
                }}
              >
                {loadingMap
                  ? "Loading..."
                  : `${filteredFeatures.length} mapped`}
              </div>
            </div>

            <div
              className="bd-map-area"
              style={{
                position: "relative",
                padding: 12,
                background:
                  ui.map,
                overflow:
                  "hidden",
              }}
            >
              {geoError ? (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems:
                      "center",
                    textAlign:
                      "center",
                    padding: 25,
                  }}
                >
                  <div
                    style={{
                      maxWidth: 420,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 32,
                        color: ui.gold,
                      }}
                    >
                      ◌
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontWeight: 950,
                      }}
                    >
                      Location data unavailable
                    </div>

                    <div
                      style={{
                        marginTop: 7,
                        color: ui.muted,
                        fontSize: 9,
                        lineHeight: 1.6,
                      }}
                    >
                      {geoError}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <svg
                    viewBox="0 0 720 620"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="Interactive India map"
                    style={{
                      display: "block",
                    }}
                  >
                    <defs>
                      <filter
                        id="bdSelectedShadow"
                        x="-40%"
                        y="-40%"
                        width="180%"
                        height="180%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="4"
                          stdDeviation="4"
                          floodOpacity=".25"
                        />
                      </filter>
                    </defs>

                    <rect
                      width="720"
                      height="620"
                      fill="transparent"
                    />

                    {(geoData || []).map(
                      ({
                        feature,
                        id,
                        name,
                      }) => {
                        const state =
                          knowledge[id];

                        if (!state)
                          return null;

                        const visible =
                          filteredFeatures.some(
                            (item) =>
                              item.id === id
                          );

                        const selectedState =
                          selectedId === id;

                        const hasModeData =
                          getModeItems(
                            state
                          ).length > 0;

                        return (
                          <path
                            key={id}
                            d={geometryPath(
                              feature.geometry,
                              bounds,
                              720,
                              620
                            )}
                            fill={
                              selectedState
                                ? ui.gold
                                : visible &&
                                  hasModeData
                                ? theme ===
                                  "dark"
                                  ? "#263127"
                                  : "#dfe4d8"
                                : theme ===
                                  "dark"
                                ? "#161615"
                                : "#e5e1d7"
                            }
                            stroke={
                              selectedState
                                ? "#806027"
                                : theme ===
                                  "dark"
                                ? "#55534c"
                                : "#aaa59a"
                            }
                            strokeWidth={
                              selectedState
                                ? 2.8
                                : 1.05
                            }
                            filter={
                              selectedState
                                ? "url(#bdSelectedShadow)"
                                : undefined
                            }
                            opacity={
                              visible
                                ? 1
                                : 0.23
                            }
                            style={{
                              cursor:
                                "pointer",
                              transition:
                                "opacity .2s ease, fill .2s ease",
                            }}
                            onClick={() =>
                              selectState(
                                id
                              )
                            }
                            onTouchStart={() =>
                              selectState(
                                id
                              )
                            }
                            aria-label={
                              state.name ||
                              name
                            }
                          />
                        );
                      }
                    )}

                    {/* =====================================================
                        VERIFIED MAP INTELLIGENCE LAYERS
                        Only explicit geometry/coordinates from the separate
                        Bharat Darshan data source are rendered. No centroid,
                        proximity or visual guessing is used.
                    ===================================================== */}
                    {(() => {
                      const layerKey = getGeoLayerKey(mode);
                      if (!layerKey) return null;

                      const layerItems = Object.entries(knowledge).flatMap(
                        ([stateId, state]) =>
                          (state.geoLayers?.[layerKey] || []).map((item) => ({
                            ...item,
                            stateId,
                          }))
                      );

                      return layerItems.map((item) => {
                        const path = featureGeometryPath(
                          item.geometry,
                          bounds,
                          720,
                          620
                        );
                        const point = featurePoint(item, bounds, 720, 620);
                        const isSelected =
                          selectedMapFeature?.id === item.id &&
                          selectedMapFeature?.stateId === item.stateId;

                        if (!path && !point) return null;

                        return (
                          <g
                            key={`${item.stateId}-${item.id}`}
                            role="button"
                            tabIndex={0}
                            aria-label={`${item.name} map feature`}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectMapFeature(item, item.stateId);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                selectMapFeature(item, item.stateId);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {path ? (
                              <path
                                d={path}
                                fill={item.type === "ecology" ? "rgba(95,155,104,.18)" : "none"}
                                stroke={getModeAccent(mode)}
                                strokeWidth={isSelected ? 5 : 2.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={isSelected ? 1 : .82}
                              />
                            ) : null}
                            {point ? (
                              <circle
                                cx={point[0]}
                                cy={point[1]}
                                r={isSelected ? 8 : 5}
                                fill={getModeAccent(mode)}
                                stroke="white"
                                strokeWidth="2"
                                opacity={isSelected ? 1 : .9}
                              />
                            ) : null}
                          </g>
                        );
                      });
                    })()}

                    {/* =================================================
                        CURVED LEADER LINE
                    ================================================= */}

                    {selectedId &&
                      (() => {
                        const selectedFeature =
                          geoData?.find(
                            (item) =>
                              item.id ===
                              selectedId
                          );

                        if (
                          !selectedFeature ||
                          !selected
                        ) {
                          return null;
                        }

                        const [
                          anchorX,
                          anchorY,
                        ] =
                          featureAnchor(
                            selectedFeature.feature,
                            bounds,
                            720,
                            620
                          );

                        const cardOnRight =
                          anchorX < 360;

                        const cardX =
                          cardOnRight
                            ? 548
                            : 28;

                        const cardY =
                          Math.max(
                            70,
                            Math.min(
                              465,
                              anchorY - 72
                            )
                          );

                        const targetX =
                          cardOnRight
                            ? cardX
                            : cardX + 144;

                        const targetY =
                          cardY + 45;

                        const controlX =
                          (anchorX +
                            targetX) /
                          2;

                        const controlY =
                          Math.min(
                            anchorY,
                            targetY
                          ) - 55;

                        const path = `
                          M ${anchorX}
                            ${anchorY}
                          Q ${controlX}
                            ${controlY}
                            ${targetX}
                            ${targetY}
                        `;

                        return (
                          <>
                            <path
                              d={path}
                              fill="none"
                              stroke={
                                modeAccent
                              }
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              opacity=".9"
                            />

                            <circle
                              cx={anchorX}
                              cy={anchorY}
                              r="5"
                              fill={
                                modeAccent
                              }
                              stroke={
                                theme ===
                                "dark"
                                  ? "#111"
                                  : "#fff"
                              }
                              strokeWidth="2"
                            />

                            <foreignObject
                              x={cardX}
                              y={cardY}
                              width="145"
                              height="100"
                            >
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                style={{
                                  width:
                                    "145px",
                                  minHeight:
                                    "88px",
                                  padding:
                                    "10px",
                                  borderRadius:
                                    "14px",
                                  background:
                                    ui.surface,
                                  border:
                                    `1px solid ${modeAccent}`,
                                  boxShadow:
                                    ui.shadow,
                                  color:
                                    ui.text,
                                  fontFamily:
                                    "Inter, system-ui, sans-serif",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      "9px",
                                    fontWeight:
                                      950,
                                    whiteSpace:
                                      "nowrap",
                                    overflow:
                                      "hidden",
                                    textOverflow:
                                      "ellipsis",
                                  }}
                                >
                                  {
                                    selected.name
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "4px",
                                    color:
                                      modeAccent,
                                    fontSize:
                                      "7px",
                                    fontWeight:
                                      900,
                                    textTransform:
                                      "uppercase",
                                    letterSpacing:
                                      ".8px",
                                  }}
                                >
                                  {
                                    getModeLabel()
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "6px",
                                    fontSize:
                                      "7px",
                                    color:
                                      ui.muted,
                                    lineHeight:
                                      1.45,
                                  }}
                                >
                                  {getModeItems(
                                    selected
                                  )
                                    .slice(
                                      0,
                                      3
                                    )
                                    .join(
                                      " • "
                                    ) ||
                                    "Location data unavailable"}
                                </div>
                              </div>
                            </foreignObject>
                          </>
                        );
                      })()}
                                      {selectedMapFeature ? (() => {
                      const point = featurePoint(selectedMapFeature, bounds, 720, 620);
                      if (!point) return null;
                      const cardX = point[0] < 360 ? 420 : 24;
                      const cardY = Math.max(34, Math.min(500, point[1] - 42));
                      return (
                        <g pointerEvents="none">
                          <line
                            x1={point[0]}
                            y1={point[1]}
                            x2={cardX < point[0] ? cardX + 8 : cardX + 220}
                            y2={cardY + 30}
                            stroke={getModeAccent(mode)}
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                          <rect
                            x={cardX}
                            y={cardY}
                            width="220"
                            height="72"
                            rx="14"
                            fill={theme === "dark" ? "#111111" : "#fffdf8"}
                            stroke={getModeAccent(mode)}
                            strokeWidth="1.5"
                          />
                          <text x={cardX + 14} y={cardY + 24} fontSize="14" fontWeight="700" fill={theme === "dark" ? "#fff" : "#161616"}>
                            {selectedMapFeature.name}
                          </text>
                          <text x={cardX + 14} y={cardY + 45} fontSize="11" fill={theme === "dark" ? "#c9c9c9" : "#666"}>
                            {knowledge[selectedMapFeature.stateId]?.name || "India"} · {getModeLabel()}
                          </text>
                          <text x={cardX + 14} y={cardY + 61} fontSize="10" fill={getModeAccent(mode)}>
                            Verified map feature
                          </text>
                        </g>
                      );
                    })() : null}

</svg>

                  {mode !== "explore" && !Object.values(knowledge).some((state) =>
                    (state.geoLayers?.[getGeoLayerKey(mode)] || []).length
                  ) ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${ui.border}`,
                        color: ui.muted,
                        fontSize: 12,
                        background: ui.card,
                      }}
                    >
                      Map geometry for this layer is not present in the verified data source. Location data unavailable — no feature is placed by approximation.
                    </div>
                  ) : null}


                  {!selectedId && (
                    <div
                      style={{
                        position:
                          "absolute",
                        left: 16,
                        bottom: 16,
                        padding:
                          "8px 10px",
                        borderRadius:
                          10,
                        background:
                          ui.surface,
                        border:
                          `1px solid ${ui.line}`,
                        color: ui.muted,
                        fontSize: 8,
                        boxShadow:
                          ui.shadow,
                      }}
                    >
                      Select a state/UT
                      on the map
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 12,
                padding:
                  "9px 14px",
                borderTop:
                  `1px solid ${ui.line}`,
                color: ui.muted,
                fontSize: 8,
              }}
            >
              <span>
                Stable State/UT mapping
              </span>

              <span>
                Verified polygon geometry
              </span>
            </div>
          </section>

          {/* EXPLORER */}
          <aside
            className="bd-explorer"
            style={{
              background: ui.surface,
              border:
                `1px solid ${ui.line}`,
              borderRadius: 24,
              overflow:
                "hidden",
              boxShadow:
                ui.shadow,
            }}
          >
            <button
              className="bd-mobile-explorer-toggle"
              onClick={() =>
                setMobilePanelOpen(
                  (value) => !value
                )
              }
              style={{
                width: "100%",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                border: 0,
                borderBottom:
                  `1px solid ${ui.line}`,
                background:
                  ui.surface,
                color: ui.text,
                padding: 14,
                cursor: "pointer",
                fontWeight: 950,
              }}
            >
              <span>
                State Explorer
              </span>

              <span>
                {mobilePanelOpen
                  ? "−"
                  : "+"}
              </span>
            </button>

            <div
              className={`bd-explorer-content ${
                mobilePanelOpen
                  ? "open"
                  : ""
              }`}
              style={{
                padding: 17,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  letterSpacing:
                    "1.5px",
                  fontWeight: 950,
                  color: modeAccent,
                }}
              >
                {getModeLabel().toUpperCase()}
              </div>

              {!selected ? (
                <div
                  style={{
                    marginTop: 15,
                    padding: 15,
                    borderRadius: 15,
                    background:
                      ui.surface2,
                    border:
                      `1px solid ${ui.line}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 950,
                    }}
                  >
                    Select a State / UT
                  </div>

                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      color: ui.muted,
                      fontSize: 10,
                      lineHeight:
                        1.6,
                    }}
                  >
                    Map par kisi state/UT
                    ko tap karein. Selected
                    location ka mode-specific
                    UPSC geography data yahan
                    open hoga.
                  </p>
                </div>
              ) : (
                <>
                  <h2
                    style={{
                      margin:
                        "8px 0 4px",
                      fontSize: 24,
                      letterSpacing:
                        "-.8px",
                      lineHeight: 1,
                    }}
                  >
                    {selected.name}
                  </h2>

                  <div
                    style={{
                      color:
                        ui.muted,
                      fontSize: 9,
                    }}
                  >
                    {selected.region}
                    {" • "}
                    Capital:{" "}
                    {selected.capital}
                  </div>

                  {/* MODE CARD */}
                  <div
                    style={{
                      marginTop: 14,
                      padding: 13,
                      borderRadius: 15,
                      background:
                        `${modeAccent}12`,
                      border:
                        `1px solid ${modeAccent}50`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        color:
                          modeAccent,
                        fontWeight: 950,
                        textTransform:
                          "uppercase",
                      }}
                    >
                      {getModeLabel()}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        flexWrap:
                          "wrap",
                        gap: 5,
                      }}
                    >
                      {getModeItems(
                        selected
                      )
                        .slice(0, 8)
                        .map(
                          (
                            item
                          ) => (
                            <span
                              key={
                                item
                              }
                              style={{
                                padding:
                                  "6px 7px",
                                borderRadius:
                                  8,
                                background:
                                  ui.surface,
                                border:
                                  `1px solid ${ui.line}`,
                                fontSize:
                                  8,
                                color:
                                  ui.text,
                              }}
                            >
                              {
                                item
                              }
                            </span>
                          )
                        )}
                    </div>
                  </div>

                  {/* TABS */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 13,
                    }}
                  >
                    {[
                      [
                        "overview",
                        "Overview",
                      ],
                      [
                        "facts",
                        "UPSC Facts",
                      ],
                      [
                        "recall",
                        "Recall",
                      ],
                    ].map(
                      ([
                        id,
                        label,
                      ]) => (
                        <button
                          key={id}
                          onClick={() =>
                            setActiveTab(
                              id
                            )
                          }
                          style={{
                            flex: 1,
                            border:
                              `1px solid ${
                                activeTab ===
                                id
                                  ? modeAccent
                                  : ui.line
                              }`,
                            background:
                              activeTab ===
                              id
                                ? `${modeAccent}18`
                                : ui.surface2,
                            color:
                              ui.text,
                            borderRadius:
                              10,
                            padding:
                              "8px 4px",
                            fontSize:
                              8,
                            fontWeight:
                              950,
                            cursor:
                              "pointer",
                          }}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>

                  {/* OVERVIEW */}
                  {activeTab ===
                    "overview" && (
                    <div
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <ModeInfoSection
                        label="Current Mode"
                        title={
                          getModeLabel()
                        }
                        items={getModeItems(
                          selected
                        )}
                        ui={ui}
                        accent={
                          modeAccent
                        }
                      />

                      <div
                        className="bd-info-grid"
                        style={{
                          marginTop: 10,
                        }}
                      >
                        <SmallInfoCard
                          label="Rivers"
                          items={
                            selected.rivers
                          }
                          ui={ui}
                        />

                        <SmallInfoCard
                          label="Relief"
                          items={
                            selected.relief
                          }
                          ui={ui}
                        />

                        <SmallInfoCard
                          label="Ecology"
                          items={
                            selected.ecology
                          }
                          ui={ui}
                        />

                        <SmallInfoCard
                          label="Agriculture"
                          items={
                            selected.crops
                          }
                          ui={ui}
                        />

                        <SmallInfoCard
                          label="Minerals"
                          items={
                            selected.minerals
                          }
                          ui={ui}
                        />

                        <SmallInfoCard
                          label="Coastal"
                          items={
                            selected.coastal
                          }
                          ui={ui}
                        />
                      </div>
                    </div>
                  )}

                  {/* FACTS */}
                  {activeTab ===
                    "facts" && (
                    <div
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 15,
                          background:
                            ui.surface2,
                          border:
                            `1px solid ${ui.line}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color:
                              modeAccent,
                            fontWeight:
                              950,
                          }}
                        >
                          UPSC IMPORTANCE
                        </div>

                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 10,
                            lineHeight:
                              1.65,
                            color:
                              ui.muted,
                          }}
                        >
                          {
                            selected.importance
                          }
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 9,
                          padding: 14,
                          borderRadius: 15,
                          background:
                            ui.surface2,
                          border:
                            `1px solid ${ui.line}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color:
                              modeAccent,
                            fontWeight:
                              950,
                          }}
                        >
                          CLIMATE & MONSOON
                        </div>

                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 10,
                            lineHeight:
                              1.65,
                            color:
                              ui.muted,
                          }}
                        >
                          {
                            selected.climate
                          }
                        </div>
                      </div>

                      {selected.facts
                        .length >
                        0 && (
                        <ModeInfoSection
                          label="MAP FACTS"
                          title="Important Locations"
                          items={
                            selected.facts
                          }
                          ui={ui}
                          accent={
                            modeAccent
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* RECALL */}
                  {activeTab ===
                    "recall" && (
                    <div
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <div
                        style={{
                          padding: 15,
                          borderRadius: 16,
                          background:
                            ui.surface2,
                          border:
                            `1px solid ${ui.line}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color:
                              modeAccent,
                            fontWeight:
                              950,
                            letterSpacing:
                              "1px",
                          }}
                        >
                          ACTIVE RECALL
                        </div>

                        <div
                          style={{
                            marginTop: 9,
                            fontSize: 12,
                            fontWeight:
                              900,
                            lineHeight:
                              1.5,
                          }}
                        >
                          Name two important
                          map facts for{" "}
                          {
                            selected.name
                          }.
                        </div>

                        <button
                          onClick={() =>
                            setRecallRevealed(
                              (value) =>
                                !value
                            )
                          }
                          style={{
                            marginTop: 12,
                            width: "100%",
                            border:
                              `1px solid ${ui.line}`,
                            background:
                              ui.surface,
                            color:
                              ui.text,
                            borderRadius:
                              11,
                            padding: 10,
                            fontSize: 9,
                            fontWeight:
                              900,
                            cursor:
                              "pointer",
                          }}
                        >
                          {recallRevealed
                            ? "Hide Answer"
                            : "Reveal Answer"}
                        </button>

                        {recallRevealed && (
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 9,
                              color:
                                ui.muted,
                              lineHeight:
                                1.65,
                            }}
                          >
                            {selected.rivers
                              .slice(
                                0,
                                2
                              )
                              .join(
                                " • "
                              )}
                            {" | "}
                            {selected.relief
                              .slice(
                                0,
                                2
                              )
                              .join(
                                " • "
                              )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={
                          nextRecall
                        }
                        style={{
                          width: "100%",
                          marginTop: 8,
                          border: 0,
                          background:
                            modeAccent,
                          color: "#111",
                          borderRadius:
                            11,
                          padding: 10,
                          fontSize: 9,
                          fontWeight:
                            950,
                          cursor:
                            "pointer",
                        }}
                      >
                        Next Recall →
                      </button>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      marginTop: 14,
                    }}
                  >
                    <button
                      onClick={
                        markMastered
                      }
                      style={{
                        flex: 1,
                        border: 0,
                        background:
                          modeAccent,
                        color: "#111",
                        borderRadius:
                          11,
                        padding: 10,
                        fontSize: 9,
                        fontWeight:
                          950,
                        cursor:
                          "pointer",
                      }}
                    >
                      ✓ Mastered
                    </button>

                    <button
                      onClick={
                        markNeedsRevision
                      }
                      style={{
                        flex: 1,
                        border:
                          `1px solid ${ui.line}`,
                        background:
                          ui.surface2,
                        color:
                          ui.text,
                        borderRadius:
                          11,
                        padding: 10,
                        fontSize: 9,
                        fontWeight:
                          900,
                        cursor:
                          "pointer",
                      }}
                    >
                      Revise
                    </button>
                  </div>

                  <button
                    onClick={
                      openComparison
                    }
                    style={{
                      width: "100%",
                      marginTop: 7,
                      border:
                        `1px solid ${ui.line}`,
                      background:
                        ui.surface,
                      color:
                        ui.text,
                      borderRadius:
                        11,
                      padding: 10,
                      fontSize: 9,
                      fontWeight:
                        900,
                      cursor:
                        "pointer",
                    }}
                  >
                    Compare 3 States / UTs
                  </button>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 8,
                      color:
                        ui.muted,
                    }}
                  >
                    Status:{" "}
                    <strong
                      style={{
                        color:
                          ui.text,
                      }}
                    >
                      {progress[
                        selectedId
                      ]?.status ||
                        "Not Started"}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* ====================================================
            PROGRESS
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
          }}
        >
          <div className="bd-stat-grid">
            <StatCard
              ui={ui}
              label="States / UTs in knowledge base"
              value={totalStates}
            />

            <StatCard
              ui={ui}
              label="Mastered"
              value={masteredCount}
            />

            <StatCard
              ui={ui}
              label="Learning / Revision"
              value={learningCount}
            />
          </div>
        </section>

        {/* ====================================================
            MAP QUIZ
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
            background:
              ui.surface,
            border:
              `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
            boxShadow:
              ui.shadow,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 12,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    modeAccent,
                  fontSize: 8,
                  fontWeight:
                    950,
                  letterSpacing:
                    "1.3px",
                }}
              >
                MAP QUIZ
              </div>

              <h2
                style={{
                  margin:
                    "6px 0 0",
                  fontSize: 22,
                }}
              >
                Test your India map intelligence
              </h2>
            </div>

            {!quizStarted ? (
              <button
                onClick={
                  startQuiz
                }
                style={{
                  border: 0,
                  background:
                    modeAccent,
                  color: "#111",
                  borderRadius:
                    12,
                  padding:
                    "10px 15px",
                  fontWeight:
                    950,
                  cursor:
                    "pointer",
                }}
              >
                Start Quiz
              </button>
            ) : (
              <div
                style={{
                  color:
                    ui.muted,
                  fontSize: 9,
                }}
              >
                Score:{" "}
                <strong
                  style={{
                    color:
                      ui.text,
                  }}
                >
                  {quizScore}
                  /
                  {
                    PRACTICE_QUIZ.length
                  }
                </strong>
              </div>
            )}
          </div>

          {quizStarted && (
            <div
              style={{
                marginTop: 15,
                padding: 15,
                borderRadius: 17,
                background:
                  ui.surface2,
                border:
                  `1px solid ${ui.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color:
                    ui.muted,
                }}
              >
                Practice Question{" "}
                {quizIndex + 1} /{" "}
                {
                  PRACTICE_QUIZ.length
                }
              </div>

              <div
                style={{
                  marginTop: 9,
                  fontSize: 14,
                  fontWeight:
                    950,
                  lineHeight:
                    1.45,
                }}
              >
                {currentQuiz.q}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 8,
                  marginTop: 13,
                }}
              >
                {currentQuiz.options.map(
                  (
                    option,
                    index
                  ) => {
                    const chosen =
                      quizAnswer ===
                      index;

                    const correct =
                      currentQuiz.answer ===
                      index;

                    let background =
                      ui.surface;

                    if (
                      quizAnswered &&
                      correct
                    ) {
                      background =
                        theme ===
                        "dark"
                          ? "#203426"
                          : "#dcebd9";
                    }

                    if (
                      quizAnswered &&
                      chosen &&
                      !correct
                    ) {
                      background =
                        theme ===
                        "dark"
                          ? "#3b2424"
                          : "#f0d8d8";
                    }

                    return (
                      <button
                        key={
                          option
                        }
                        onClick={() =>
                          answerQuiz(
                            index
                          )
                        }
                        style={{
                          minHeight:
                            52,
                          textAlign:
                            "left",
                          border:
                            `1px solid ${
                              chosen ||
                              (quizAnswered &&
                                correct)
                                ? modeAccent
                                : ui.line
                            }`,
                          background,
                          color:
                            ui.text,
                          borderRadius:
                            11,
                          padding:
                            11,
                          fontSize:
                            10,
                          fontWeight:
                            850,
                          cursor:
                            quizAnswered
                              ? "default"
                              : "pointer",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "inline-grid",
                            placeItems:
                              "center",
                            width: 22,
                            height: 22,
                            marginRight: 7,
                            borderRadius:
                              7,
                            background:
                              ui.surface3,
                          }}
                        >
                          {String.fromCharCode(
                            65 +
                              index
                          )}
                        </span>

                        {option}
                      </button>
                    );
                  }
                )}
              </div>

              {quizAnswered && (
                <>
                  <div
                    style={{
                      marginTop: 12,
                      padding: 11,
                      borderRadius: 11,
                      background:
                        ui.surface,
                      color:
                        ui.muted,
                      fontSize: 9,
                      lineHeight:
                        1.6,
                    }}
                  >
                    <strong
                      style={{
                        color:
                          ui.text,
                      }}
                    >
                      Explanation:
                    </strong>{" "}
                    {
                      currentQuiz.explanation
                    }
                  </div>

                  <button
                    onClick={
                      nextQuiz
                    }
                    style={{
                      marginTop: 10,
                      border: 0,
                      background:
                        modeAccent,
                      color: "#111",
                      borderRadius:
                        11,
                      padding:
                        "9px 14px",
                      fontWeight:
                        950,
                      cursor:
                        "pointer",
                    }}
                  >
                    {quizIndex >=
                    PRACTICE_QUIZ.length -
                      1
                      ? "Finish Quiz"
                      : "Next Question →"}
                  </button>
                </>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 9,
              color:
                ui.muted,
              fontSize: 8,
            }}
          >
            This section contains
            practice questions. Official UPSC
            PYQs should only be displayed when
            authenticated PYQ data is available.
          </div>
        </section>

        {/* ====================================================
            TIMED MAP TEST
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
            background:
              ui.surface,
            border:
              `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
          }}
        >
          <div
            style={{
              color:
                modeAccent,
              fontSize: 8,
              fontWeight:
                950,
              letterSpacing:
                "1.4px",
            }}
          >
            TIMED MAP TEST
          </div>

          <h2
            style={{
              margin:
                "6px 0 5px",
              fontSize: 22,
            }}
          >
            Exam-style map revision
          </h2>

          <p
            style={{
              margin: 0,
              color:
                ui.muted,
              fontSize: 9,
              lineHeight:
                1.6,
            }}
          >
            Choose a test size according to
            your revision time.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 9,
              marginTop: 13,
            }}
          >
            {TIMED_OPTIONS.map(
              (option) => (
                <button
                  key={
                    option.id
                  }
                  onClick={() =>
                    startTimedTest(
                      option
                    )
                  }
                  style={{
                    textAlign:
                      "left",
                    border:
                      `1px solid ${ui.line}`,
                    background:
                      ui.surface2,
                    color:
                      ui.text,
                    borderRadius:
                      13,
                    padding:
                      12,
                    cursor:
                      "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        14,
                      fontWeight:
                        950,
                    }}
                  >
                    {
                      option.title
                    }
                  </div>

                  <div
                    style={{
                      marginTop:
                        4,
                      color:
                        ui.muted,
                      fontSize:
                        8,
                    }}
                  >
                    {option.questions}{" "}
                    questions •{" "}
                    {option.minutes}{" "}
                    minutes
                  </div>
                </button>
              )
            )}
          </div>

          {timedStarted &&
            timedMode && (
              <div
                style={{
                  marginTop: 12,
                  padding: 13,
                  borderRadius: 14,
                  background:
                    `${modeAccent}10`,
                  border:
                    `1px solid ${modeAccent}40`,
                }}
              >
                <div
                  style={{
                    fontWeight:
                      950,
                    fontSize:
                      10,
                  }}
                >
                  {timedMode.title} Test
                  Ready
                </div>

                <div
                  style={{
                    marginTop:
                      5,
                    color:
                      ui.muted,
                    fontSize:
                      8,
                    lineHeight:
                      1.6,
                  }}
                >
                  Timed test engine is
                  connected to the Bharat
                  Darshan test flow. Add
                  your authenticated question
                  bank here without changing
                  the map module.
                </div>
              </div>
            )}
        </section>

        {/* ====================================================
            ACTIVE RECALL
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
            background:
              ui.surface,
            border:
              `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
          }}
        >
          <div
            style={{
              color:
                modeAccent,
              fontSize: 8,
              fontWeight:
                950,
              letterSpacing:
                "1.4px",
            }}
          >
            ACTIVE RECALL
          </div>

          <h2
            style={{
              margin:
                "6px 0 4px",
              fontSize: 22,
            }}
          >
            Learn → Recall → Revise
          </h2>

          <p
            style={{
              margin: 0,
              color:
                ui.muted,
              fontSize: 9,
              lineHeight:
                1.6,
            }}
          >
            Map location ko dekhkar answer
            recall karo, phir reveal karke
            apni memory check karo.
          </p>

          <div
            style={{
              marginTop: 13,
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) auto",
              gap: 10,
              alignItems:
                "center",
            }}
          >
            <div
              style={{
                padding: 13,
                borderRadius: 14,
                background:
                  ui.surface2,
                border:
                  `1px solid ${ui.line}`,
              }}
            >
              <div
                style={{
                  color:
                    modeAccent,
                  fontSize: 8,
                  fontWeight:
                    950,
                }}
              >
                {
                  currentRecall.title
                }
              </div>

              <div
                style={{
                  marginTop:
                    7,
                  fontSize:
                    11,
                  fontWeight:
                    850,
                  lineHeight:
                    1.5,
                }}
              >
                {
                  currentRecall.prompt
                }
              </div>

              {recallRevealed && (
                <div
                  style={{
                    marginTop:
                      7,
                    color:
                      ui.muted,
                    fontSize:
                      9,
                    lineHeight:
                      1.5,
                  }}
                >
                  {
                    currentRecall.answer
                  }
                </div>
              )}
            </div>

            <button
              onClick={() =>
                setRecallRevealed(
                  (value) =>
                    !value
                )
              }
              style={{
                border: 0,
                background:
                  modeAccent,
                color: "#111",
                borderRadius:
                  11,
                padding:
                  "10px 13px",
                fontSize: 9,
                fontWeight:
                  950,
                cursor:
                  "pointer",
              }}
            >
              {recallRevealed
                ? "Hide"
                : "Reveal"}
            </button>
          </div>

          <button
            onClick={
              nextRecall
            }
            style={{
              marginTop: 9,
              border:
                `1px solid ${ui.line}`,
              background:
                ui.surface,
              color:
                ui.text,
              borderRadius:
                11,
              padding:
                "9px 12px",
              fontSize: 9,
              fontWeight:
                900,
              cursor:
                "pointer",
            }}
          >
            Next Recall →
          </button>
        </section>

        {/* ====================================================
            LEARNING FLOW
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
            display: "grid",
            gridTemplateColumns:
              "repeat(6,minmax(0,1fr))",
            gap: 7,
          }}
        >
          {[
            "Learn",
            "Recall",
            "Quiz",
            "Mistake",
            "Revision",
            "Mastery",
          ].map(
            (item, index) => (
              <div
                key={item}
                style={{
                  padding:
                    "10px 7px",
                  borderRadius:
                    12,
                  background:
                    ui.surface,
                  border:
                    `1px solid ${ui.line}`,
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    margin:
                      "0 auto 5px",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    borderRadius:
                      "50%",
                    background:
                      index === 5
                        ? modeAccent
                        : ui.surface2,
                    color:
                      index === 5
                        ? "#111"
                        : ui.gold,
                    fontSize:
                      8,
                    fontWeight:
                      950,
                  }}
                >
                  {index + 1}
                </div>

                <div
                  style={{
                    fontSize:
                      7,
                    fontWeight:
                      900,
                  }}
                >
                  {item}
                </div>
              </div>
            )
          )}
        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer
          style={{
            marginTop: 28,
            paddingTop: 17,
            borderTop:
              `1px solid ${ui.line}`,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 12,
            flexWrap:
              "wrap",
            color:
              ui.muted,
            fontSize: 8,
          }}
        >
          <span>
            SAMBHAV UPSC • Bharat Darshan
          </span>

          <span>
            Static geography • Map intelligence •
            Active recall
          </span>
        </footer>
      </div>

      {/* ======================================================
        {/* ====================================================
            OFFICIAL REPORTS + LATEST DATA
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
            background: ui.surface,
            border: `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
            boxShadow: ui.shadow,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: modeAccent,
                  fontSize: 8,
                  fontWeight: 950,
                  letterSpacing: "1.4px",
                }}
              >
                OFFICIAL REPORTS • LATEST DATA
              </div>

              <h2
                style={{
                  margin: "6px 0 5px",
                  fontSize: 22,
                }}
              >
                India Data Intelligence
              </h2>

              <p
                style={{
                  margin: 0,
                  maxWidth: 780,
                  color: ui.muted,
                  fontSize: 9,
                  lineHeight: 1.65,
                }}
              >
                Verified government publications are kept separate from the
                State/UT geography dataset. Every card shows its report year
                and source so static facts are not silently mixed with
                changing statistics.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {REPORT_FILTERS.map(([id, label]) => {
                const active = reportFilter === id;

                return (
                  <button
                    key={id}
                    onClick={() => setReportFilter(id)}
                    style={{
                      border: `1px solid ${
                        active ? ui.gold : ui.line
                      }`,
                      background: active
                        ? ui.gold
                        : ui.surface2,
                      color: active
                        ? "#111"
                        : ui.text,
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontSize: 8,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 10,
            }}
            className="bd-report-grid"
          >
            {OFFICIAL_REPORTS
              .filter(
                (report) =>
                  reportFilter === "all" ||
                  report.id === reportFilter
              )
              .map((report) => (
                <OfficialReportCard
                  key={report.id}
                  report={report}
                  ui={ui}
                  accent={modeAccent}
                />
              ))}
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 13,
              background: ui.surface2,
              border: `1px solid ${ui.line}`,
              fontSize: 8,
              color: ui.muted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: ui.text }}>
              Data integrity rule:
            </strong>{" "}
            report cards provide verified publication references. They do not
            invent state-wise numbers. Numeric State/UT values should come
            from the separate Bharat Darshan data file. If a precise
            location/value is unavailable, the UI must show
            “Location data unavailable” rather than guess.
          </div>
        </section>

        {/* ====================================================
            INDIA MASTERY + MISTAKE MAP
        ==================================================== */}

        <section
          style={{
            marginTop: 15,
            background: ui.surface,
            border: `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
            boxShadow: ui.shadow,
          }}
        >
          <div
            style={{
              color: modeAccent,
              fontSize: 8,
              fontWeight: 950,
              letterSpacing: "1.4px",
            }}
          >
            INDIA MASTERY • MISTAKE MAP
          </div>

          <h2
            style={{
              margin: "6px 0 5px",
              fontSize: 22,
            }}
          >
            Learn → Recall → Quiz → Revise → Master
          </h2>

          <p
            style={{
              margin: 0,
              color: ui.muted,
              fontSize: 9,
              lineHeight: 1.6,
            }}
          >
            This dashboard uses only the progress actually recorded in this
            module. No synthetic scores or fake completion percentages are
            shown.
          </p>

          <div
            style={{
              marginTop: 13,
              display: "grid",
              gridTemplateColumns:
                "repeat(4,minmax(0,1fr))",
              gap: 8,
            }}
            className="bd-mastery-stats"
          >
            <StatCard
              ui={ui}
              label="Mapped States / UTs"
              value={totalStates}
            />
            <StatCard
              ui={ui}
              label="Mastered"
              value={masteredCount}
            />
            <StatCard
              ui={ui}
              label="Needs Revision"
              value={revisionCount}
            />
            <StatCard
              ui={ui}
              label="Learning"
              value={learningCount}
            />
          </div>

          <div
            style={{
              marginTop: 13,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {Object.values(knowledge)
              .sort((a, b) =>
                a.name.localeCompare(b.name)
              )
              .map((state) => {
                const status =
                  progress[state.id]?.status ||
                  "Not Started";

                const statusMeta =
                  status === "Mastered"
                    ? {
                        label: "Mastered",
                        bg: "#2e6b46",
                        fg: "#fff",
                      }
                    : status ===
                      "Needs Revision"
                    ? {
                        label: "Needs Revision",
                        bg: "#9a5b35",
                        fg: "#fff",
                      }
                    : status === "Learning"
                    ? {
                        label: "Learning",
                        bg: "#85712f",
                        fg: "#fff",
                      }
                    : {
                        label: "Not Started",
                        bg: ui.surface2,
                        fg: ui.muted,
                      };

                return (
                  <button
                    key={state.id}
                    onClick={() =>
                      selectState(state.id)
                    }
                    title={`${state.name} • ${status}`}
                    style={{
                      border:
                        `1px solid ${ui.line}`,
                      background:
                        statusMeta.bg,
                      color:
                        statusMeta.fg,
                      borderRadius: 9,
                      padding:
                        "6px 8px",
                      cursor:
                        "pointer",
                      fontSize: 7,
                      fontWeight: 900,
                    }}
                  >
                    {state.name}
                  </button>
                );
              })}
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              color: ui.muted,
              fontSize: 8,
            }}
          >
            <span>
              <b style={{ color: "#2e6b46" }}>
                ●
              </b>{" "}
              Mastered
            </span>
            <span>
              <b style={{ color: "#9a5b35" }}>
                ●
              </b>{" "}
              Needs Revision
            </span>
            <span>
              <b style={{ color: "#85712f" }}>
                ●
              </b>{" "}
              Learning
            </span>
            <span>
              <b style={{ color: ui.muted }}>
                ●
              </b>{" "}
              Not Started
            </span>
          </div>
        </section>

      {/* ======================================================
         3-STATE COMPARISON MODAL
      ====================================================== */}

      {compareOpen &&
        selected && (
          <div
            onClick={() =>
              setCompareOpen(
                false
              )
            }
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "grid",
              placeItems:
                "center",
              padding: 14,
              background:
                "rgba(0,0,0,.62)",
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width:
                  "min(1120px, 100%)",
                maxHeight:
                  "92vh",
                overflow:
                  "auto",
                background:
                  ui.surface,
                color:
                  ui.text,
                border:
                  `1px solid ${ui.line}`,
                borderRadius:
                  23,
                padding: 18,
                boxShadow:
                  "0 30px 100px rgba(0,0,0,.35)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        modeAccent,
                      fontSize: 8,
                      fontWeight:
                        950,
                      letterSpacing:
                        "1.4px",
                    }}
                  >
                    3-STATE COMPARISON
                  </div>

                  <h2
                    style={{
                      margin:
                        "6px 0 0",
                      fontSize: 23,
                    }}
                  >
                    Compare India geography
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setCompareOpen(
                      false
                    )
                  }
                  style={{
                    width: 35,
                    height: 35,
                    border:
                      `1px solid ${ui.line}`,
                    background:
                      ui.surface2,
                    color:
                      ui.text,
                    borderRadius:
                      10,
                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {/* STATE SELECTORS */}
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(3,minmax(0,1fr))",
                  gap: 8,
                  marginTop: 15,
                }}
              >
                <CompareSelect
                  label="State / UT 1"
                  value={
                    selectedId ||
                    ""
                  }
                  disabled
                  onChange={() => {}}
                  knowledge={
                    knowledge
                  }
                  ui={ui}
                />

                <CompareSelect
                  label="State / UT 2"
                  value={
                    compareIds[0] ||
                    ""
                  }
                  onChange={(value) =>
                    updateCompareSlot(
                      0,
                      value
                    )
                  }
                  exclude={[
                    selectedId,
                    compareIds[1],
                  ]}
                  knowledge={
                    knowledge
                  }
                  ui={ui}
                />

                <CompareSelect
                  label="State / UT 3"
                  value={
                    compareIds[1] ||
                    ""
                  }
                  onChange={(value) =>
                    updateCompareSlot(
                      1,
                      value
                    )
                  }
                  exclude={[
                    selectedId,
                    compareIds[0],
                  ]}
                  knowledge={
                    knowledge
                  }
                  ui={ui}
                />
              </div>

              {/* TABLE */}
              <div
                style={{
                  marginTop: 16,
                  overflowX:
                    "auto",
                  border:
                    `1px solid ${ui.line}`,
                  borderRadius:
                    15,
                }}
              >
                <table
                  className="bd-compare-table"
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    fontSize: 9,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={tableHead(
                          ui
                        )}
                      >
                        Dimension
                      </th>

                      {comparisonStates.map(
                        (state) => (
                          <th
                            key={
                              state.id
                            }
                            style={tableHead(
                              ui
                            )}
                          >
                            {
                              state.name
                            }
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      [
                        "Region",
                        (state) =>
                          state.region,
                      ],
                      [
                        "Capital",
                        (state) =>
                          state.capital,
                      ],
                      [
                        "Rivers",
                        (state) =>
                          state.rivers,
                      ],
                      [
                        "Mountains / Passes",
                        (state) =>
                          state.relief,
                      ],
                      [
                        "Ecology",
                        (state) =>
                          state.ecology,
                      ],
                      [
                        "Minerals",
                        (state) =>
                          state.minerals,
                      ],
                      [
                        "Agriculture",
                        (state) =>
                          state.crops,
                      ],
                      [
                        "Coastal",
                        (state) =>
                          state.coastal,
                      ],
                      [
                        "Important Places",
                        (state) =>
                          state.places,
                      ],
                      [
                        "Climate / Monsoon",
                        (state) =>
                          state.climate,
                      ],
                    ].map(
                      ([
                        label,
                        getValue,
                      ]) => (
                        <tr
                          key={
                            label
                          }
                        >
                          <td
                            style={tableCell(
                              ui,
                              true
                            )}
                          >
                            {label}
                          </td>

                          {comparisonStates.map(
                            (
                              state
                            ) => {
                              const value =
                                getValue(
                                  state
                                );

                              return (
                                <td
                                  key={
                                    state.id +
                                    label
                                  }
                                  style={tableCell(
                                    ui
                                  )}
                                >
                                  {Array.isArray(
                                    value
                                  )
                                    ? value
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " • "
                                        ) ||
                                      "—"
                                    : value ||
                                      "—"}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function iconButton(ui) {
  return {
    border:
      `1px solid ${ui.line}`,
    background:
      ui.surface,
    color:
      ui.text,
    borderRadius: 11,
    padding:
      "8px 10px",
    cursor:
      "pointer",
    fontWeight: 900,
  };
}

function ModeInfoSection({
  label,
  title,
  items,
  ui,
  accent,
}) {
  return (
    <div
      style={{
        marginBottom: 11,
        padding: 13,
        borderRadius: 15,
        background:
          ui.surface2,
        border:
          `1px solid ${ui.line}`,
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 8,
          fontWeight: 950,
          letterSpacing:
            ".8px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 10,
          fontWeight: 900,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap:
            "wrap",
          gap: 5,
          marginTop: 8,
        }}
      >
        {items?.length ? (
          items.map(
            (item) => (
              <span
                key={item}
                style={{
                  padding:
                    "6px 7px",
                  borderRadius:
                    8,
                  background:
                    ui.surface,
                  border:
                    `1px solid ${ui.line}`,
                  color:
                    ui.text,
                  fontSize:
                    8,
                }}
              >
                {item}
              </span>
            )
          )
        ) : (
          <span
            style={{
              color:
                ui.muted,
              fontSize:
                8,
            }}
          >
            Location data unavailable
          </span>
        )}
      </div>
    </div>
  );
}

function SmallInfoCard({
  label,
  items,
  ui,
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 12,
        background:
          ui.surface2,
        border:
          `1px solid ${ui.line}`,
      }}
    >
      <div
        style={{
          color:
            ui.gold,
          fontSize: 7,
          fontWeight:
            950,
          textTransform:
            "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          color:
            ui.muted,
          fontSize: 8,
          lineHeight:
            1.55,
        }}
      >
        {items?.length
          ? items
              .slice(0, 4)
              .join(" • ")
          : "Location data unavailable"}
      </div>
    </div>
  );
}

function OfficialReportCard({ report, ui, accent }) {
  const status = getReportStatusLabel(report);

  return (
    <article
      style={{
        background: ui.surface,
        border: `1px solid ${ui.line}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: ui.shadow,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: accent || ui.gold,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            {report.category}
          </div>
          <h3
            style={{
              margin: "7px 0 0",
              fontSize: 16,
              lineHeight: 1.3,
              fontWeight: 900,
              color: ui.text,
            }}
          >
            {report.title}
          </h3>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: "6px 9px",
            borderRadius: 999,
            border: `1px solid ${ui.line}`,
            color: ui.muted,
            fontSize: 8,
            fontWeight: 800,
          }}
        >
          {report.year}
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          color: ui.muted,
          fontSize: 10,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: ui.text }}>{report.publisher}</strong>
        {status ? ` • ${status}` : ""}
      </div>

      {report.description ? (
        <p
          style={{
            margin: "10px 0 0",
            color: ui.muted,
            fontSize: 10,
            lineHeight: 1.65,
          }}
        >
          {report.description}
        </p>
      ) : null}

      {report.upsc ? (
        <div
          style={{
            marginTop: 12,
            padding: 11,
            borderRadius: 14,
            background: ui.surface2,
            border: `1px solid ${ui.line}`,
            color: ui.text,
            fontSize: 9,
            lineHeight: 1.55,
          }}
        >
          <strong>UPSC relevance:</strong> {report.upsc}
        </div>
      ) : null}

      {report.sourceUrl ? (
        <a
          href={report.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            marginTop: 14,
            color: ui.gold,
            fontSize: 9,
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          Open official source →
        </a>
      ) : null}
    </article>
  );
}

function StatCard({
  ui,
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          ui.surface,
        border:
          `1px solid ${ui.line}`,
        borderRadius: 17,
        padding: 14,
      }}
    >
      <div
        style={{
          color:
            ui.muted,
          fontSize: 8,
          fontWeight:
            800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          lineHeight: 1,
          fontWeight:
            950,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CompareSelect({
  label,
  value,
  onChange,
  knowledge,
  ui,
  disabled,
  exclude = [],
}) {
  return (
    <label
      style={{
        display:
          "block",
      }}
    >
      <div
        style={{
          marginBottom:
            5,
          fontSize: 8,
          color:
            ui.muted,
          fontWeight:
            900,
        }}
      >
        {label}
      </div>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target
              .value
          )
        }
        style={{
          width: "100%",
          border:
            `1px solid ${ui.line}`,
          background:
            ui.surface2,
          color:
            ui.text,
          borderRadius:
            10,
          padding: 9,
          outline:
            "none",
          fontSize: 9,
        }}
      >
        {!disabled && (
          <option value="">
            Select state / UT
          </option>
        )}

        {Object.values(
          knowledge
        )
          .filter(
            (state) =>
              !exclude.includes(
                state.id
              ) ||
              state.id ===
                value
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
          .map(
            (state) => (
              <option
                key={
                  state.id
                }
                value={
                  state.id
                }
              >
                {state.name}
              </option>
            )
          )}
      </select>
    </label>
  );
}

function tableHead(ui) {
  return {
    textAlign:
      "left",
    padding: 11,
    borderBottom:
      `1px solid ${ui.line}`,
    color:
      ui.gold,
    background:
      ui.surface2,
    fontWeight:
      950,
    verticalAlign:
      "top",
  };
}

function tableCell(
  ui,
  bold = false
) {
  return {
    padding: 11,
    borderBottom:
      `1px solid ${ui.line}`,
    color:
      bold
        ? ui.text
        : ui.muted,
    fontWeight:
      bold ? 900 : 500,
    verticalAlign:
      "top",
    lineHeight:
      1.55,
  };
}
