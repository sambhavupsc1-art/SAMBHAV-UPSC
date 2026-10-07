"use client";

import { useEffect, useMemo, useState } from "react";

/*
  SAMBHAV UPSC — BHARAT DARSHAN
  Standalone route: /bharat-darshan
  This module intentionally does not modify the existing dashboard/auth flow.

  Map source: DataMeet India administrative GeoJSON.
  The map is rendered from verified polygon geometry; state selection uses
  an exact canonical State/UT-name -> stable-ID dictionary, never coordinates.
*/

const GEOJSON_URL =
  "https://raw.githubusercontent.com/datameet/maps/master/States/India/india_state.geojson";

const MODES = [
  ["explore", "Explore India", "States & UTs"],
  ["rivers", "Rivers", "River systems"],
  ["mountains", "Mountains & Passes", "Relief & passes"],
  ["ecology", "Ecology", "Parks & biodiversity"],
  ["minerals", "Minerals & Resources", "Resource geography"],
  ["agriculture", "Agriculture", "Crops & regions"],
  ["coastal", "Coastal India", "Ports & islands"],
  ["climate", "Climate & Monsoon", "Monsoon geography"],
];

const REGIONS = ["All India", "North", "South", "East", "West", "Central", "Northeast", "UTs"];

const STATE_META = {
  AP: { name: "Andhra Pradesh", region: "South", capital: "Amaravati", rivers: ["Godavari", "Krishna", "Penna"], relief: ["Eastern Ghats", "Deccan Plateau"], crops: ["Rice", "Chilli", "Tobacco"], ecology: ["Papikonda NP", "Coringa WLS"], minerals: ["Barytes", "Limestone"], places: ["Visakhapatnam", "Amaravati"], climate: "Tropical monsoon with a long east-coast influence." },
  AR: { name: "Arunachal Pradesh", region: "Northeast", capital: "Itanagar", rivers: ["Siang", "Subansiri", "Lohit"], relief: ["Eastern Himalaya", "Sela Pass"], crops: ["Rice", "Millets", "Horticulture"], ecology: ["Namdapha NP", "Pakke WLS"], minerals: ["Coal", "Petroleum"], places: ["Tawang", "Itanagar"], climate: "Humid to alpine across strong elevation gradients." },
  AS: { name: "Assam", region: "Northeast", capital: "Dispur", rivers: ["Brahmaputra", "Barak"], relief: ["Brahmaputra Valley", "Karbi Plateau"], crops: ["Tea", "Rice", "Jute"], ecology: ["Kaziranga NP", "Manas NP", "Dibru-Saikhowa NP"], minerals: ["Petroleum", "Natural gas"], places: ["Guwahati", "Sivasagar"], climate: "Humid monsoonal climate with very high rainfall in parts." },
  BR: { name: "Bihar", region: "East", capital: "Patna", rivers: ["Ganga", "Kosi", "Gandak", "Son"], relief: ["Gangetic Plain", "Chota Nagpur fringe"], crops: ["Rice", "Wheat", "Maize"], ecology: ["Valmiki NP", "Vikramshila Gangetic Dolphin Sanctuary"], minerals: ["Limestone", "Pyrite"], places: ["Bodh Gaya", "Nalanda", "Patna"], climate: "Monsoonal with hot summers and winter seasonality." },
  CG: { name: "Chhattisgarh", region: "Central", capital: "Raipur", rivers: ["Mahanadi", "Indravati", "Hasdeo"], relief: ["Chhattisgarh Plain", "Bastar Plateau"], crops: ["Rice", "Pulses", "Oilseeds"], ecology: ["Indravati NP", "Kanger Valley NP"], minerals: ["Iron ore", "Coal", "Bauxite"], places: ["Bastar", "Raipur"], climate: "Tropical monsoonal; rainfall declines away from the eastern hills." },
  GA: { name: "Goa", region: "West", capital: "Panaji", rivers: ["Mandovi", "Zuari"], relief: ["Western Ghats", "Konkan coast"], crops: ["Rice", "Coconut", "Cashew"], ecology: ["Mollem NP"], minerals: ["Iron ore"], places: ["Panaji", "Old Goa"], climate: "Strong southwest monsoon and humid coastal climate." },
  GJ: { name: "Gujarat", region: "West", capital: "Gandhinagar", rivers: ["Narmada", "Tapi", "Sabarmati"], relief: ["Aravalli", "Kathiawar", "Rann of Kachchh"], crops: ["Cotton", "Groundnut", "Wheat"], ecology: ["Gir NP", "Little Rann WLS"], minerals: ["Limestone", "Lignite", "Bauxite"], places: ["Ahmedabad", "Dwarka", "Kachchh"], climate: "Semi-arid to dry tropical, moderated on the coast." },
  HR: { name: "Haryana", region: "North", capital: "Chandigarh", rivers: ["Yamuna", "Ghaggar"], relief: ["Indo-Gangetic Plain", "Aravalli outcrops"], crops: ["Wheat", "Rice", "Cotton"], ecology: ["Sultanpur NP", "Kalesar NP"], minerals: ["Limestone", "Quartzite"], places: ["Kurukshetra", "Gurugram"], climate: "Continental with hot summers, cold winters and monsoon rainfall." },
  HP: { name: "Himachal Pradesh", region: "North", capital: "Shimla", rivers: ["Sutlej", "Beas", "Ravi", "Chenab"], relief: ["Himalaya", "Rohtang Pass"], crops: ["Apple", "Maize", "Wheat"], ecology: ["Great Himalayan NP", "Pin Valley NP"], minerals: ["Limestone"], places: ["Shimla", "Kinnaur", "Spiti"], climate: "Strong altitudinal variation from subtropical foothills to cold desert." },
  JH: { name: "Jharkhand", region: "East", capital: "Ranchi", rivers: ["Damodar", "Subarnarekha", "Koel"], relief: ["Chota Nagpur Plateau", "Rajmahal Hills"], crops: ["Rice", "Pulses", "Oilseeds"], ecology: ["Betla NP", "Dalma WLS"], minerals: ["Coal", "Iron ore", "Uranium"], places: ["Ranchi", "Jamshedpur"], climate: "Tropical monsoonal with marked dry and wet seasons." },
  KA: { name: "Karnataka", region: "South", capital: "Bengaluru", rivers: ["Krishna", "Kaveri", "Tungabhadra"], relief: ["Western Ghats", "Deccan Plateau"], crops: ["Coffee", "Ragi", "Sugarcane"], ecology: ["Bandipur NP", "Nagarahole NP"], minerals: ["Iron ore", "Manganese"], places: ["Hampi", "Bengaluru"], climate: "Varied tropical climate shaped by the Western Ghats and plateau." },
  KL: { name: "Kerala", region: "South", capital: "Thiruvananthapuram", rivers: ["Periyar", "Bharathapuzha", "Pamba"], relief: ["Western Ghats", "Malabar Coast"], crops: ["Rubber", "Coconut", "Spices"], ecology: ["Periyar NP", "Silent Valley NP"], minerals: ["Monazite", "Ilmenite"], places: ["Kochi", "Thiruvananthapuram"], climate: "Humid tropical climate dominated by southwest and northeast monsoon influence." },
  MP: { name: "Madhya Pradesh", region: "Central", capital: "Bhopal", rivers: ["Narmada", "Chambal", "Betwa", "Son"], relief: ["Malwa Plateau", "Vindhya", "Satpura"], crops: ["Soybean", "Wheat", "Pulses"], ecology: ["Kanha NP", "Bandhavgarh NP", "Pench NP"], minerals: ["Diamond", "Coal", "Manganese"], places: ["Khajuraho", "Bhopal"], climate: "Tropical with monsoon rainfall and a dry winter." },
  MH: { name: "Maharashtra", region: "West", capital: "Mumbai", rivers: ["Godavari", "Krishna", "Tapi", "Bhima"], relief: ["Western Ghats", "Deccan Plateau"], crops: ["Cotton", "Sugarcane", "Soybean"], ecology: ["Tadoba-Andhari TR", "Sanjay Gandhi NP"], minerals: ["Coal", "Manganese", "Iron ore"], places: ["Mumbai", "Pune", "Ajanta"], climate: "Monsoonal with a rain-shadow belt east of the Western Ghats." },
  MN: { name: "Manipur", region: "Northeast", capital: "Imphal", rivers: ["Barak", "Imphal"], relief: ["Manipur Hills", "Imphal Valley"], crops: ["Rice", "Horticulture"], ecology: ["Keibul Lamjao NP"], minerals: ["Chromite", "Limestone"], places: ["Imphal", "Loktak Lake"], climate: "Humid subtropical to temperate at higher elevations." },
  ML: { name: "Meghalaya", region: "Northeast", capital: "Shillong", rivers: ["Umiam", "Simsang"], relief: ["Shillong Plateau", "Garo-Khasi-Jaintia Hills"], crops: ["Rice", "Potato", "Orange"], ecology: ["Nokrek NP", "Balpakram NP"], minerals: ["Coal", "Limestone"], places: ["Shillong", "Cherrapunji"], climate: "Very high monsoon rainfall, especially on southern slopes." },
  MZ: { name: "Mizoram", region: "Northeast", capital: "Aizawl", rivers: ["Tlawng", "Tuirial"], relief: ["Mizo Hills"], crops: ["Rice", "Horticulture"], ecology: ["Dampa TR"], minerals: ["Limestone"], places: ["Aizawl", "Champhai"], climate: "Humid monsoonal hill climate." },
  NL: { name: "Nagaland", region: "Northeast", capital: "Kohima", rivers: ["Doyang", "Dhansiri"], relief: ["Naga Hills"], crops: ["Rice", "Horticulture"], ecology: ["Intanki NP"], minerals: ["Coal", "Limestone"], places: ["Kohima", "Dimapur"], climate: "Humid monsoon climate with cooler hill conditions." },
  OD: { name: "Odisha", region: "East", capital: "Bhubaneswar", rivers: ["Mahanadi", "Brahmani", "Baitarani"], relief: ["Eastern Ghats", "Odisha Coastal Plain"], crops: ["Rice", "Pulses", "Oilseeds"], ecology: ["Similipal NP", "Bhitarkanika NP", "Gahirmatha"], minerals: ["Iron ore", "Bauxite", "Chromite"], places: ["Bhubaneswar", "Puri", "Konark"], climate: "Tropical monsoon with cyclone exposure along the Bay of Bengal." },
  PB: { name: "Punjab", region: "North", capital: "Chandigarh", rivers: ["Sutlej", "Beas", "Ravi"], relief: ["Punjab Plain", "Shivalik foothills"], crops: ["Wheat", "Rice", "Cotton"], ecology: ["Harike WLS"], minerals: ["Limestone"], places: ["Amritsar", "Ludhiana"], climate: "Continental monsoonal climate with hot summers and cold winters." },
  RJ: { name: "Rajasthan", region: "West", capital: "Jaipur", rivers: ["Luni", "Chambal", "Banas"], relief: ["Thar Desert", "Aravalli Range"], crops: ["Bajra", "Mustard", "Wheat"], ecology: ["Desert NP", "Ranthambore NP", "Keoladeo NP"], minerals: ["Zinc", "Lead", "Lignite", "Marble"], places: ["Jaipur", "Jaisalmer", "Udaipur"], climate: "Arid to semi-arid; rainfall is highly variable." },
  SK: { name: "Sikkim", region: "Northeast", capital: "Gangtok", rivers: ["Teesta", "Rangeet"], relief: ["Eastern Himalaya", "Nathu La"], crops: ["Large cardamom", "Maize", "Horticulture"], ecology: ["Khangchendzonga NP"], minerals: ["Copper", "Limestone"], places: ["Gangtok", "Nathu La"], climate: "Strong altitudinal climate gradients with heavy monsoon influence." },
  TN: { name: "Tamil Nadu", region: "South", capital: "Chennai", rivers: ["Kaveri", "Vaigai", "Tamiraparani"], relief: ["Eastern Ghats", "Tamil Nadu Plains", "Nilgiris"], crops: ["Rice", "Cotton", "Sugarcane"], ecology: ["Mudumalai NP", "Gulf of Mannar Marine NP"], minerals: ["Lignite", "Ilmenite"], places: ["Chennai", "Madurai", "Kanyakumari"], climate: "Receives important rainfall from the northeast/retreating monsoon." },
  TS: { name: "Telangana", region: "South", capital: "Hyderabad", rivers: ["Godavari", "Krishna", "Musi"], relief: ["Deccan Plateau", "Telangana Plateau"], crops: ["Rice", "Cotton", "Maize"], ecology: ["Kawal TR", "Amrabad TR"], minerals: ["Coal", "Limestone"], places: ["Hyderabad", "Warangal"], climate: "Tropical semi-arid to sub-humid with monsoon rainfall." },
  TR: { name: "Tripura", region: "Northeast", capital: "Agartala", rivers: ["Gomati", "Feni"], relief: ["Tripura Hills"], crops: ["Rice", "Rubber", "Tea"], ecology: ["Sepahijala WLS"], minerals: ["Natural gas"], places: ["Agartala", "Unakoti"], climate: "Warm humid monsoon climate." },
  UP: { name: "Uttar Pradesh", region: "North", capital: "Lucknow", rivers: ["Ganga", "Yamuna", "Ghaghara", "Gomti", "Rapti", "Son"], relief: ["Ganga-Yamuna Doab", "Terai", "Vindhyan fringe"], crops: ["Wheat", "Rice", "Sugarcane", "Potato"], ecology: ["Dudhwa NP", "Katarniaghat WLS", "National Chambal Sanctuary"], minerals: ["Limestone", "Silica sand", "Coal"], places: ["Varanasi", "Prayagraj", "Ayodhya", "Agra"], climate: "Subtropical monsoon with hot summers and cool winters." },
  UK: { name: "Uttarakhand", region: "North", capital: "Dehradun", rivers: ["Ganga", "Yamuna", "Alaknanda", "Bhagirathi"], relief: ["Greater Himalaya", "Lesser Himalaya", "Shivalik"], crops: ["Rice", "Wheat", "Horticulture"], ecology: ["Jim Corbett NP", "Nanda Devi NP", "Valley of Flowers NP"], minerals: ["Limestone", "Magnesite"], places: ["Badrinath", "Kedarnath", "Rishikesh"], climate: "Strong altitudinal variation and monsoon-driven rainfall." },
  WB: { name: "West Bengal", region: "East", capital: "Kolkata", rivers: ["Ganga-Hooghly", "Teesta", "Damodar"], relief: ["Gangetic Plain", "Darjeeling Himalaya", "Sundarbans"], crops: ["Rice", "Jute", "Tea"], ecology: ["Sundarbans NP", "Buxa NP"], minerals: ["Coal", "Clay"], places: ["Kolkata", "Darjeeling", "Sundarbans"], climate: "Humid monsoonal; strong rainfall gradient from Himalaya to southwest." },
  AN: { name: "Andaman & Nicobar Islands", region: "UTs", capital: "Port Blair", rivers: ["Short island streams"], relief: ["Island arc", "Andaman hills"], crops: ["Coconut", "Arecanut", "Rice"], ecology: ["Mahatma Gandhi Marine NP", "Campbell Bay NP"], minerals: ["Limestone"], places: ["Port Blair", "Great Nicobar"], climate: "Equatorial-oceanic and humid with high rainfall." },
  CH: { name: "Chandigarh", region: "UTs", capital: "Chandigarh", rivers: ["Sukhna Choe"], relief: ["Shivalik foothills"], crops: ["Wheat", "Rice"], ecology: ["Sukhna Lake ecosystem"], minerals: [], places: ["Chandigarh"], climate: "Subtropical with monsoon rainfall." },
  DN: { name: "Dadra & Nagar Haveli and Daman & Diu", region: "UTs", capital: "Daman", rivers: ["Daman Ganga"], relief: ["Western Ghats foothills", "Coastal plain"], crops: ["Rice", "Ragi", "Mango"], ecology: ["Coastal and forest ecosystems"], minerals: [], places: ["Daman", "Diu"], climate: "Tropical coastal monsoon climate." },
  DL: { name: "Delhi", region: "UTs", capital: "New Delhi", rivers: ["Yamuna"], relief: ["Yamuna floodplain", "Delhi Ridge"], crops: ["Vegetables", "Wheat"], ecology: ["Asola Bhatti WLS"], minerals: [], places: ["New Delhi", "Delhi Ridge"], climate: "Semi-arid continental with monsoon rainfall." },
  JK: { name: "Jammu & Kashmir", region: "UTs", capital: "Srinagar", rivers: ["Jhelum", "Chenab", "Tawi"], relief: ["Kashmir Valley", "Pir Panjal", "Karakoram"], crops: ["Apple", "Rice", "Saffron"], ecology: ["Dachigam NP", "Hemis landscape"], minerals: ["Limestone", "Bauxite"], places: ["Srinagar", "Jammu", "Gulmarg"], climate: "Varied mountain climate with strong altitude effects." },
  LA: { name: "Ladakh", region: "UTs", capital: "Leh", rivers: ["Indus", "Shyok", "Zanskar"], relief: ["Karakoram", "Ladakh Range", "Cold Desert"], crops: ["Barley", "Peas", "Apricot"], ecology: ["Hemis NP", "Changthang landscape"], minerals: ["Boron", "Limestone"], places: ["Leh", "Pangong", "Khardung La"], climate: "High-altitude cold desert with very low precipitation." },
  LD: { name: "Lakshadweep", region: "UTs", capital: "Kavaratti", rivers: ["No major rivers"], relief: ["Coral atolls"], crops: ["Coconut", "Tuna fisheries"], ecology: ["Marine coral reef ecosystems"], minerals: [], places: ["Kavaratti", "Minicoy"], climate: "Tropical maritime climate." },
  PY: { name: "Puducherry", region: "UTs", capital: "Puducherry", rivers: ["Gingee", "Ariyankuppam"], relief: ["Coastal plain"], crops: ["Rice", "Groundnut", "Pulses"], ecology: ["Coastal ecosystems"], minerals: [], places: ["Puducherry", "Auroville"], climate: "Tropical coastal; northeast monsoon is significant." },
};

const NAME_TO_ID = Object.fromEntries(
  Object.entries(STATE_META).map(([id, value]) => [value.name.toLowerCase(), id])
);

const FALLBACK_META = (name) => ({
  name,
  region: "All India",
  capital: "—",
  rivers: ["Data pending verification"],
  relief: ["Data pending verification"],
  crops: ["Data pending verification"],
  ecology: ["Data pending verification"],
  minerals: ["Data pending verification"],
  places: ["Data pending verification"],
  climate: "Verified state profile is being expanded.",
});

const QUIZ = [
  { q: "Which river is associated with the Kashmir Valley?", options: ["Jhelum", "Mahanadi", "Narmada", "Sabarmati"], answer: 0, explanation: "The Jhelum is the principal river of the Kashmir Valley." },
  { q: "Which state is strongly associated with the Thar Desert?", options: ["Rajasthan", "Kerala", "Assam", "Odisha"], answer: 0, explanation: "The Thar Desert occupies much of western Rajasthan." },
  { q: "Keibul Lamjao National Park is in which state?", options: ["Manipur", "Sikkim", "Meghalaya", "Mizoram"], answer: 0, explanation: "Keibul Lamjao lies on Loktak Lake in Manipur." },
  { q: "The Narmada flows broadly between which two major upland systems?", options: ["Vindhya and Satpura", "Aravalli and Himalaya", "Nilgiri and Cardamom", "Eastern Ghats and Shivalik"], answer: 0, explanation: "The Narmada valley lies between the Vindhya range to the north and Satpura range to the south." },
  { q: "Which state is especially important for the northeast/retreating monsoon?", options: ["Tamil Nadu", "Punjab", "Rajasthan", "Himachal Pradesh"], answer: 0, explanation: "Tamil Nadu receives a substantial share of annual rainfall from the northeast monsoon." },
  { q: "Which protected area is associated with the one-horned rhinoceros?", options: ["Kaziranga", "Ranthambore", "Dudhwa", "Periyar"], answer: 0, explanation: "Kaziranga in Assam is a globally important habitat for the greater one-horned rhinoceros." },
  { q: "Which mineral-resource combination is especially important in Chhattisgarh?", options: ["Iron ore and coal", "Petroleum and natural gas", "Uranium and gold", "Tin and crude oil"], answer: 0, explanation: "Chhattisgarh is a major mineral-producing state, notably for iron ore and coal." },
  { q: "Which river is most closely associated with the Punjab-Haryana plain among these?", options: ["Sutlej", "Periyar", "Godavari", "Vaigai"], answer: 0, explanation: "The Sutlej is one of the major rivers of the northwestern river system." },
];

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

function canonicalId(properties = {}) {
  const candidates = [
    properties.ST_NM,
    properties.NAME_1,
    properties.name,
    properties.NAME,
    properties.st_nm,
  ].filter(Boolean);
  for (const candidate of candidates) {
    const id = NAME_TO_ID[normalizeName(candidate)];
    if (id) return id;
  }
  return null;
}

function projectPoint([lon, lat], width, height) {
  // Simple equirectangular projection is sufficient for rendering the supplied
  // geographic polygons; selection is polygon-based, not coordinate-based.
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

function geometryPath(geometry, width, height) {
  if (!geometry) return "";
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates || [];
  return polygons
    .map((polygon) =>
      polygon
        .map((ring) => {
          return ring
            .map((point, index) => {
              const [x, y] = projectPoint(point, width, height);
              return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(" ") + " Z";
        })
        .join(" ")
    )
    .join(" ");
}

function storageKey(user) {
  const id = user?.id || user?.email || user?.user_id || "guest";
  return `sambhav_bharat_darshan_${id}`;
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
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [compareId, setCompareId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}

    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data?.user || null);
      })
      .catch(() => {})
      .finally(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sambhav-theme", theme);
      const raw = localStorage.getItem(storageKey(user));
      if (raw) setProgress(JSON.parse(raw));
    } catch {}
  }, [user, theme]);

  useEffect(() => {
    let cancelled = false;
    setLoadingMap(true);
    fetch(GEOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error("India boundary dataset could not be loaded.");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setGeo(data);
      })
      .catch((error) => {
        if (!cancelled) setGeoError(error.message || "Map data unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMap(false);
      });
    return () => { cancelled = true; };
  }, []);

  const ui = theme === "dark"
    ? {
        bg: "#090909", surface: "#121212", surface2: "#181818", text: "#f7f4ec",
        muted: "#a7a39a", line: "rgba(255,255,255,.10)", gold: "#d6bd79", map: "#151515",
      }
    : {
        bg: "#f7f5ef", surface: "#ffffff", surface2: "#f1eee6", text: "#111111",
        muted: "#77736b", line: "#e4e0d7", gold: "#9b792f", map: "#eeeae0",
      };

  const features = useMemo(() => {
    return (geo?.features || []).map((feature) => ({
      feature,
      id: canonicalId(feature.properties),
      name: feature.properties?.ST_NM || feature.properties?.NAME_1 || feature.properties?.name || "Unknown",
    }));
  }, [geo]);

  const selected = selectedId ? STATE_META[selectedId] || FALLBACK_META(selectedId) : null;
  const selectedName = selected?.name || "Select a state or UT";

  const filteredFeatures = useMemo(() => {
    const q = normalizeName(search);
    return features.filter(({ id, name }) => {
      if (!id) return false;
      const meta = STATE_META[id];
      if (!meta) return false;
      const regionOk = region === "All India" || meta.region === region;
      const searchOk = !q || normalizeName(meta.name).includes(q) || [
        ...meta.rivers, ...meta.relief, ...meta.ecology, ...meta.minerals, ...meta.crops, ...meta.places,
      ].some((x) => normalizeName(x).includes(q));
      return regionOk && searchOk;
    });
  }, [features, region, search]);

  const modeItems = useMemo(() => {
    if (!selected) return [];
    const map = {
      rivers: ["Rivers", selected.rivers],
      mountains: ["Relief & Passes", selected.relief],
      ecology: ["Ecology", selected.ecology],
      minerals: ["Minerals & Resources", selected.minerals],
      agriculture: ["Agriculture", selected.crops],
      coastal: ["Coastal / Places", selected.places],
      climate: ["Climate & Monsoon", [selected.climate]],
      explore: ["Important Geography", [...selected.rivers, ...selected.relief, ...selected.ecology]],
    };
    return map[mode] || map.explore;
  }, [selected, mode]);

  const recallCards = useMemo(() => {
    const stateList = Object.values(STATE_META);
    return stateList.slice(0, 20).map((s) => ({
      title: s.name,
      prompt: `Recall two important UPSC map facts for ${s.name}.`,
      answer: `${s.rivers.slice(0, 2).join(" and ")}; ${s.relief.slice(0, 2).join(" and ")}.`,
    }));
  }, []);

  const currentRecall = recallCards[recallIndex % recallCards.length];
  const currentQuiz = QUIZ[quizIndex];

  function selectState(id) {
    if (!id || !STATE_META[id]) return;
    setSelectedId(id);
    setTab("overview");
    setMobilePanel(true);
    setRecallRevealed(false);
    setProgress((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), status: "Learning", lastViewed: new Date().toISOString() } };
      try { localStorage.setItem(storageKey(user), JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function markMastered() {
    if (!selectedId) return;
    setProgress((prev) => {
      const next = { ...prev, [selectedId]: { ...(prev[selectedId] || {}), status: "Mastered", lastViewed: new Date().toISOString() } };
      try { localStorage.setItem(storageKey(user), JSON.stringify(next)); } catch {}
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

  const masteredCount = Object.values(progress).filter((x) => x?.status === "Mastered").length;
  const learningCount = Object.values(progress).filter((x) => x?.status === "Learning" || x?.status === "Needs Revision").length;
  const totalStates = Object.keys(STATE_META).length;

  return (
    <main style={{ minHeight: "100vh", background: ui.bg, color: ui.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", paddingBottom: 42 }}>
      <style>{`
        *{box-sizing:border-box}.bd-scroll::-webkit-scrollbar{width:6px;height:6px}.bd-scroll::-webkit-scrollbar-thumb{background:rgba(130,130,130,.3);border-radius:99px}
        .bd-card{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}.bd-card:hover{transform:translateY(-2px)}
        .bd-map path{transition:fill .14s ease,stroke .14s ease}.bd-map path:hover{fill:#d6bd79!important;stroke:#8e6c29!important;cursor:pointer}
        @media(max-width:850px){.bd-grid{grid-template-columns:1fr!important}.bd-map-wrap{min-height:420px!important}.bd-panel{position:relative!important;top:auto!important}.bd-top-actions{display:none!important}.bd-mobile-toggle{display:flex!important}}
        @media(min-width:851px){.bd-mobile-toggle{display:none!important}}
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "4px 2px 18px", borderBottom: `1px solid ${ui.line}` }}>
          <div>
            <button onClick={() => { window.location.href = "/"; }} style={{ border: 0, background: "transparent", color: ui.text, padding: 0, cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: 21, fontWeight: 950, letterSpacing: "-.7px" }}>SAMBHAV <span style={{ color: ui.gold }}>UPSC</span></div>
              <div style={{ fontSize: 9, letterSpacing: "1.7px", color: ui.muted, marginTop: 3, fontWeight: 800 }}>BHARAT DARSHAN</div>
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }} className="bd-top-actions">
            <div style={{ padding: "9px 12px", borderRadius: 999, background: ui.surface, border: `1px solid ${ui.line}`, fontSize: 9, fontWeight: 800, color: ui.muted }}>EXPLORE INDIA • LEARN INDIA • MASTER INDIA</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("sambhav-theme", next); }} style={{ border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 12, padding: "9px 11px", cursor: "pointer", fontWeight: 800 }}>{theme === "dark" ? "☀" : "☾"}</button>
            <button onClick={() => { window.location.href = "/"; }} style={{ border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 12, padding: "9px 12px", cursor: "pointer", fontWeight: 800 }}>← Home</button>
          </div>
        </header>

        <section style={{ padding: "26px 0 18px" }}>
          <div style={{ color: ui.gold, fontSize: 9, fontWeight: 950, letterSpacing: "1.8px" }}>MAP INTELLIGENCE FOR UPSC</div>
          <h1 style={{ fontSize: "clamp(30px,5vw,54px)", lineHeight: 1, letterSpacing: "-1.8px", margin: "9px 0 10px", fontWeight: 950 }}>Bharat Darshan</h1>
          <p style={{ color: ui.muted, maxWidth: 760, margin: 0, lineHeight: 1.65, fontSize: 13 }}>See India → Understand India → Recall India → Master India for UPSC Prelims and GS Geography.</p>
        </section>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }} className="bd-scroll">
          {MODES.map(([id, title, sub]) => (
            <button key={id} onClick={() => setMode(id)} style={{ flex: "0 0 auto", textAlign: "left", border: `1px solid ${mode === id ? ui.gold : ui.line}`, background: mode === id ? (theme === "dark" ? "#27231a" : "#f0e7d2") : ui.surface, color: ui.text, borderRadius: 13, padding: "10px 12px", cursor: "pointer" }}>
              <div style={{ fontSize: 10, fontWeight: 900 }}>{title}</div><div style={{ fontSize: 8, color: ui.muted, marginTop: 3 }}>{sub}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegion(r)} style={{ border: `1px solid ${region === r ? ui.gold : ui.line}`, background: region === r ? ui.gold : ui.surface, color: region === r ? "#111" : ui.text, borderRadius: 999, padding: "7px 11px", fontSize: 9, fontWeight: 850, cursor: "pointer" }}>{r}</button>
          ))}
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search state, river, mountain, park, crop, mineral..." style={{ width: "100%", border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 999, padding: "9px 13px", outline: "none", fontSize: 10 }} />
          </div>
        </div>

        <div className="bd-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) minmax(330px,.75fr)", gap: 14, alignItems: "start" }}>
          <section className="bd-card bd-map-wrap" style={{ background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 22, minHeight: 590, overflow: "hidden", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px", borderBottom: `1px solid ${ui.line}` }}>
              <div><div style={{ fontSize: 11, fontWeight: 900 }}>Interactive India Map</div><div style={{ fontSize: 8, color: ui.muted, marginTop: 3 }}>Click a verified state/UT polygon to explore.</div></div>
              <div style={{ fontSize: 8, color: ui.muted }}>{loadingMap ? "Loading boundaries…" : `${filteredFeatures.length} mapped regions`}</div>
            </div>
            <div style={{ padding: 12, height: 510, background: ui.map }}>
              {geoError ? (
                <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", color: ui.muted, padding: 30 }}>
                  <div><div style={{ fontSize: 26 }}>◌</div><div style={{ fontWeight: 900, color: ui.text, marginTop: 8 }}>Location data unavailable</div><div style={{ fontSize: 10, marginTop: 6 }}>{geoError}</div></div>
                </div>
              ) : (
                <svg className="bd-map" viewBox="0 0 720 620" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive India administrative map">
                  <rect width="720" height="620" fill="transparent" />
                  {features.map(({ feature, id, name }) => {
                    if (!id) return null;
                    const meta = STATE_META[id];
                    const visible = filteredFeatures.some((x) => x.id === id);
                    const isSelected = selectedId === id;
                    return <path key={id} d={geometryPath(feature.geometry, 720, 620)} fill={isSelected ? ui.gold : visible ? (theme === "dark" ? "#242424" : "#ddd9ce") : (theme === "dark" ? "#111" : "#e8e5dd")} stroke={isSelected ? "#8e6c29" : (theme === "dark" ? "#686868" : "#aaa69c")} strokeWidth={isSelected ? 2.1 : 1.1} onClick={() => selectState(id)} aria-label={meta?.name || name} />;
                  })}
                </svg>
              )}
            </div>
            <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", color: ui.muted, fontSize: 8, borderTop: `1px solid ${ui.line}` }}><span>Stable State/UT mapping</span><span>Verified polygon geometry</span></div>
          </section>

          <aside className="bd-panel" style={{ position: "sticky", top: 12, background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 22, overflow: "hidden" }}>
            <button className="bd-mobile-toggle" onClick={() => setMobilePanel((v) => !v)} style={{ width: "100%", display: "none", justifyContent: "space-between", border: 0, borderBottom: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, padding: 14, fontWeight: 900, cursor: "pointer" }}>State Explorer <span>{mobilePanel ? "−" : "+"}</span></button>
            <div style={{ padding: 17, display: mobilePanel ? "block" : undefined }}>
              <div style={{ color: ui.gold, fontSize: 8, letterSpacing: "1.4px", fontWeight: 900 }}>STATE EXPLORER</div>
              <h2 style={{ fontSize: 24, margin: "7px 0 5px", letterSpacing: "-.7px" }}>{selectedName}</h2>
              {selected ? <div style={{ fontSize: 9, color: ui.muted }}>{selected.region} • Capital: {selected.capital}</div> : <div style={{ fontSize: 10, color: ui.muted }}>Map par state/UT select karein.</div>}

              {selected && <>
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  {[["overview", "Overview"], ["facts", "UPSC Facts"], ["recall", "Recall"]].map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ flex: 1, border: `1px solid ${tab === id ? ui.gold : ui.line}`, background: tab === id ? ui.gold : ui.surface2, color: tab === id ? "#111" : ui.text, borderRadius: 10, padding: "8px 4px", fontSize: 8, fontWeight: 900, cursor: "pointer" }}>{label}</button>)}
                </div>

                {tab === "overview" && <div style={{ marginTop: 15 }}>
                  <InfoGroup label="Rivers / Water" items={selected.rivers} ui={ui} />
                  <InfoGroup label="Relief / Mountains / Passes" items={selected.relief} ui={ui} />
                  <InfoGroup label="Ecology" items={selected.ecology} ui={ui} />
                  <InfoGroup label="Agriculture" items={selected.crops} ui={ui} />
                  <InfoGroup label="Minerals / Resources" items={selected.minerals} ui={ui} />
                  <InfoGroup label="Important Places" items={selected.places} ui={ui} />
                </div>}

                {tab === "facts" && <div style={{ marginTop: 15 }}>
                  <div style={{ background: ui.surface2, border: `1px solid ${ui.line}`, borderRadius: 15, padding: 13 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: ui.gold }}>UPSC IMPORTANCE</div>
                    <p style={{ margin: "8px 0 0", fontSize: 10, lineHeight: 1.65, color: ui.muted }}>Use this profile for map-location questions, river/relief associations, ecology, agriculture, minerals and state-based elimination in Prelims.</p>
                  </div>
                  <div style={{ marginTop: 9, background: ui.surface2, border: `1px solid ${ui.line}`, borderRadius: 15, padding: 13 }}><div style={{ fontSize: 9, fontWeight: 900, color: ui.gold }}>CLIMATE & MONSOON</div><div style={{ marginTop: 7, fontSize: 10, color: ui.muted, lineHeight: 1.6 }}>{selected.climate}</div></div>
                </div>}

                {tab === "recall" && <div style={{ marginTop: 15 }}>
                  <div style={{ border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 16, padding: 14 }}>
                    <div style={{ fontSize: 9, color: ui.gold, fontWeight: 900 }}>ACTIVE RECALL</div>
                    <div style={{ marginTop: 10, fontSize: 13, fontWeight: 850 }}>Name two map facts you can recall for {selected.name}.</div>
                    <button onClick={() => setRecallRevealed(true)} style={{ marginTop: 13, width: "100%", border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 11, padding: 10, fontWeight: 850, cursor: "pointer" }}>{recallRevealed ? "Answer revealed" : "Reveal answer"}</button>
                    {recallRevealed && <div style={{ marginTop: 10, color: ui.muted, fontSize: 10, lineHeight: 1.6 }}>{selected.rivers.slice(0, 2).join(" and ")}; {selected.relief.slice(0, 2).join(" and ")}.</div>}
                  </div>
                  <button onClick={() => { setRecallRevealed(false); setRecallIndex((x) => x + 1); }} style={{ marginTop: 8, width: "100%", border: 0, background: ui.gold, color: "#111", borderRadius: 11, padding: 10, fontWeight: 900, cursor: "pointer" }}>Next Recall →</button>
                </div>}

                <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
                  <button onClick={markMastered} style={{ flex: 1, border: 0, background: ui.gold, color: "#111", borderRadius: 11, padding: 10, fontSize: 9, fontWeight: 900, cursor: "pointer" }}>✓ Mark Mastered</button>
                  <button onClick={() => { setCompareId(compareId || Object.keys(STATE_META).find((x) => x !== selectedId) || null); setCompareOpen(true); }} style={{ flex: 1, border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 11, padding: 10, fontSize: 9, fontWeight: 900, cursor: "pointer" }}>Compare</button>
                </div>
                <div style={{ marginTop: 9, fontSize: 8, color: ui.muted }}>Status: <b style={{ color: ui.text }}>{progress[selectedId]?.status || "Not Started"}</b></div>
              </>}
            </div>
          </aside>
        </div>

        <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
          <StatCard ui={ui} label="States / UTs in knowledge base" value={totalStates} />
          <StatCard ui={ui} label="Mastered" value={masteredCount} />
          <StatCard ui={ui} label="Learning / Revision" value={learningCount} />
        </section>

        <section style={{ marginTop: 16, background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 22, padding: 17 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div><div style={{ color: ui.gold, fontSize: 8, fontWeight: 900, letterSpacing: "1.4px" }}>MAP QUIZ</div><h2 style={{ margin: "6px 0 0", fontSize: 22 }}>Test your India map intelligence</h2></div>
            {!quizStarted ? <button onClick={() => setQuizStarted(true)} style={{ border: 0, background: ui.gold, color: "#111", borderRadius: 12, padding: "10px 15px", fontWeight: 900, cursor: "pointer" }}>Start Quiz</button> : <div style={{ fontSize: 10, color: ui.muted }}>Score: <b style={{ color: ui.text }}>{quizScore}/{QUIZ.length}</b></div>}
          </div>
          {quizStarted && <div style={{ marginTop: 16, background: ui.surface2, border: `1px solid ${ui.line}`, borderRadius: 16, padding: 15 }}>
            <div style={{ fontSize: 9, color: ui.muted }}>Question {quizIndex + 1} / {QUIZ.length}</div>
            <div style={{ marginTop: 9, fontSize: 14, fontWeight: 900 }}>{currentQuiz.q}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 13 }}>
              {currentQuiz.options.map((option, index) => {
                const chosen = quizAnswer === index;
                const correct = currentQuiz.answer === index;
                const bg = quizAnswered && correct ? "#dcebd9" : quizAnswered && chosen ? "#f0d8d8" : ui.surface;
                return <button key={option} onClick={() => answerQuiz(index)} style={{ textAlign: "left", border: `1px solid ${chosen || (quizAnswered && correct) ? ui.gold : ui.line}`, background: bg, color: "#111", borderRadius: 11, padding: 11, fontSize: 10, fontWeight: 800, cursor: quizAnswered ? "default" : "pointer" }}>{String.fromCharCode(65 + index)}. {option}</button>;
              })}
            </div>
            {quizAnswered && <><div style={{ marginTop: 12, fontSize: 10, color: ui.muted, lineHeight: 1.55 }}><b style={{ color: ui.text }}>Explanation:</b> {currentQuiz.explanation}</div><button onClick={nextQuiz} style={{ marginTop: 12, border: 0, background: ui.gold, color: "#111", borderRadius: 11, padding: "9px 14px", fontWeight: 900, cursor: "pointer" }}>Next Question →</button></>}
          </div>}
        </section>

        <section style={{ marginTop: 16, background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 22, padding: 17 }}>
          <div style={{ color: ui.gold, fontSize: 8, fontWeight: 900, letterSpacing: "1.4px" }}>ACTIVE RECALL</div>
          <h2 style={{ margin: "6px 0 4px", fontSize: 22 }}>Learn → Recall → Revise</h2>
          <p style={{ margin: 0, color: ui.muted, fontSize: 10, lineHeight: 1.55 }}>Ek location ko dekhkar answer yaad karo, phir reveal karke apni recall accuracy judge karo.</p>
          <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center" }}>
            <div style={{ border: `1px solid ${ui.line}`, background: ui.surface2, borderRadius: 14, padding: 13 }}><div style={{ fontSize: 8, color: ui.gold, fontWeight: 900 }}>{currentRecall.title}</div><div style={{ marginTop: 7, fontSize: 11, fontWeight: 850 }}>{currentRecall.prompt}</div>{recallRevealed && <div style={{ marginTop: 7, fontSize: 9, color: ui.muted }}>{currentRecall.answer}</div>}</div>
            <button onClick={() => setRecallRevealed((v) => !v)} style={{ border: 0, background: ui.gold, color: "#111", borderRadius: 11, padding: "10px 13px", fontSize: 9, fontWeight: 900, cursor: "pointer" }}>{recallRevealed ? "Hide" : "Reveal"}</button>
          </div>
          <button onClick={() => { setRecallIndex((x) => x + 1); setRecallRevealed(false); }} style={{ marginTop: 9, border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 11, padding: "9px 12px", fontSize: 9, fontWeight: 850, cursor: "pointer" }}>Next Recall →</button>
        </section>

        <footer style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${ui.line}`, color: ui.muted, fontSize: 8, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span>SAMBHAV UPSC • Bharat Darshan</span><span>Static geography and user progress are separate from Current Affairs.</span>
        </footer>
      </div>

      {compareOpen && selected && (
        <div onClick={() => setCompareOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.58)", zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(920px,100%)", maxHeight: "90vh", overflow: "auto", background: ui.surface, color: ui.text, border: `1px solid ${ui.line}`, borderRadius: 22, padding: 18 }} className="bd-scroll">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ color: ui.gold, fontSize: 8, fontWeight: 900 }}>STATE COMPARISON</div><h2 style={{ margin: "5px 0 0", fontSize: 22 }}>{selected.name} vs {STATE_META[compareId]?.name || "Select state"}</h2></div><button onClick={() => setCompareOpen(false)} style={{ border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 10, padding: "8px 11px", cursor: "pointer" }}>×</button></div>
            <select value={compareId || ""} onChange={(e) => setCompareId(e.target.value)} style={{ marginTop: 14, width: "100%", border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 11, padding: 10 }}>
              <option value="">Select comparison state</option>
              {Object.entries(STATE_META).filter(([id]) => id !== selectedId).map(([id, value]) => <option key={id} value={id}>{value.name}</option>)}
            </select>
            {compareId && STATE_META[compareId] && <div style={{ marginTop: 14, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}><thead><tr><th style={th(ui)}>Dimension</th><th style={th(ui)}>{selected.name}</th><th style={th(ui)}>{STATE_META[compareId].name}</th></tr></thead><tbody>{[["Rivers", selected.rivers, STATE_META[compareId].rivers],["Relief", selected.relief, STATE_META[compareId].relief],["Agriculture", selected.crops, STATE_META[compareId].crops],["Ecology", selected.ecology, STATE_META[compareId].ecology],["Minerals", selected.minerals, STATE_META[compareId].minerals],["Places", selected.places, STATE_META[compareId].places]].map(([label,a,b]) => <tr key={label}><td style={td(ui,true)}>{label}</td><td style={td(ui)}>{a.join(", ")}</td><td style={td(ui)}>{b.join(", ")}</td></tr>)}</tbody></table></div>}
          </div>
        </div>
      )}
    </main>
  );
}

function InfoGroup({ label, items, ui }) {
  return <div style={{ marginBottom: 12 }}><div style={{ fontSize: 8, color: ui.gold, fontWeight: 900, letterSpacing: ".8px" }}>{label}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>{items.map((item) => <span key={item} style={{ padding: "6px 7px", borderRadius: 8, background: ui.surface2, border: `1px solid ${ui.line}`, fontSize: 8, color: ui.text }}>{item}</span>)}</div></div>;
}

function StatCard({ ui, label, value }) {
  return <div style={{ background: ui.surface, border: `1px solid ${ui.line}`, borderRadius: 17, padding: 14 }}><div style={{ fontSize: 8, color: ui.muted, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 6, fontSize: 23, fontWeight: 950, color: ui.text }}>{value}</div></div>;
}

function th(ui) { return { textAlign: "left", padding: 10, borderBottom: `1px solid ${ui.line}`, color: ui.gold }; }
function td(ui, bold = false) { return { padding: 10, borderBottom: `1px solid ${ui.line}`, color: ui.muted, verticalAlign: "top", fontWeight: bold ? 900 : 500 }; }
