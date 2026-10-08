// WORLD MAP — UPSC-focused data layer
// Structured for Countries, Physical Geography, Chokepoints,
// Resources, UPSC Hotspots, Active Recall and Quiz.

const WORLD_COUNTRIES = [
  ["Afghanistan","Kabul","Asia"],
  ["Albania","Tirana","Europe"],
  ["Algeria","Algiers","Africa"],
  ["Argentina","Buenos Aires","South America"],
  ["Australia","Canberra","Oceania"],
  ["Austria","Vienna","Europe"],
  ["Bangladesh","Dhaka","Asia"],
  ["Belgium","Brussels","Europe"],
  ["Bhutan","Thimphu","Asia"],
  ["Brazil","Brasília","South America"],
  ["Canada","Ottawa","North America"],
  ["Chile","Santiago","South America"],
  ["China","Beijing","Asia"],
  ["Colombia","Bogotá","South America"],
  ["Cuba","Havana","North America"],
  ["Czechia","Prague","Europe"],
  ["Denmark","Copenhagen","Europe"],
  ["Egypt","Cairo","Africa"],
  ["Ethiopia","Addis Ababa","Africa"],
  ["Finland","Helsinki","Europe"],
  ["France","Paris","Europe"],
  ["Germany","Berlin","Europe"],
  ["Ghana","Accra","Africa"],
  ["Greece","Athens","Europe"],
  ["Hungary","Budapest","Europe"],
  ["Iceland","Reykjavík","Europe"],
  ["India","New Delhi","Asia"],
  ["Indonesia","Jakarta","Asia"],
  ["Iran","Tehran","Asia"],
  ["Iraq","Baghdad","Asia"],
  ["Ireland","Dublin","Europe"],
  ["Israel","Jerusalem","Asia"],
  ["Italy","Rome","Europe"],
  ["Japan","Tokyo","Asia"],
  ["Jordan","Amman","Asia"],
  ["Kazakhstan","Astana","Asia"],
  ["Kenya","Nairobi","Africa"],
  ["Kuwait","Kuwait City","Asia"],
  ["Kyrgyzstan","Bishkek","Asia"],
  ["Laos","Vientiane","Asia"],
  ["Lebanon","Beirut","Asia"],
  ["Libya","Tripoli","Africa"],
  ["Malaysia","Kuala Lumpur","Asia"],
  ["Maldives","Malé","Asia"],
  ["Mexico","Mexico City","North America"],
  ["Mongolia","Ulaanbaatar","Asia"],
  ["Morocco","Rabat","Africa"],
  ["Myanmar","Naypyidaw","Asia"],
  ["Nepal","Kathmandu","Asia"],
  ["Netherlands","Amsterdam","Europe"],
  ["New Zealand","Wellington","Oceania"],
  ["Nigeria","Abuja","Africa"],
  ["Norway","Oslo","Europe"],
  ["Oman","Muscat","Asia"],
  ["Pakistan","Islamabad","Asia"],
  ["Peru","Lima","South America"],
  ["Philippines","Manila","Asia"],
  ["Poland","Warsaw","Europe"],
  ["Portugal","Lisbon","Europe"],
  ["Qatar","Doha","Asia"],
  ["Romania","Bucharest","Europe"],
  ["Russia","Moscow","Europe/Asia"],
  ["Saudi Arabia","Riyadh","Asia"],
  ["Serbia","Belgrade","Europe"],
  ["Singapore","Singapore","Asia"],
  ["South Africa","Pretoria","Africa"],
  ["South Korea","Seoul","Asia"],
  ["Spain","Madrid","Europe"],
  ["Sri Lanka","Sri Jayawardenepura Kotte","Asia"],
  ["Sudan","Khartoum","Africa"],
  ["Sweden","Stockholm","Europe"],
  ["Switzerland","Bern","Europe"],
  ["Syria","Damascus","Asia"],
  ["Tajikistan","Dushanbe","Asia"],
  ["Thailand","Bangkok","Asia"],
  ["Tunisia","Tunis","Africa"],
  ["Türkiye","Ankara","Asia/Europe"],
  ["Turkmenistan","Ashgabat","Asia"],
  ["UAE","Abu Dhabi","Asia"],
  ["Uganda","Kampala","Africa"],
  ["Ukraine","Kyiv","Europe"],
  ["United Kingdom","London","Europe"],
  ["United States","Washington, D.C.","North America"],
  ["Uzbekistan","Tashkent","Asia"],
  ["Venezuela","Caracas","South America"],
  ["Vietnam","Hanoi","Asia"],
  ["Yemen","Sana'a","Asia"],
  ["Zambia","Lusaka","Africa"],
  ["Zimbabwe","Harare","Africa"],
];

const WORLD_PHYSICAL_FEATURES = {
  mountains: [
    ["Himalayas","Asia","India, Nepal, Bhutan, China, Pakistan","Young fold mountain system"],
    ["Karakoram","Asia","Pakistan, India, China","K2; high-altitude passes"],
    ["Hindu Kush","Asia","Afghanistan, Pakistan","Strategic mountain system"],
    ["Tien Shan","Asia","Kyrgyzstan, Kazakhstan, China","Major Central Asian mountain system"],
    ["Kunlun","Asia","China","North of the Tibetan Plateau"],
    ["Zagros","Asia","Iran, Iraq","Major fold mountain system"],
    ["Alps","Europe","France, Switzerland, Italy, Austria","Major European mountain system"],
    ["Pyrenees","Europe","Spain, France, Andorra","Natural barrier between Iberia and France"],
    ["Atlas","Africa","Morocco, Algeria, Tunisia","Northwest African mountain system"],
    ["Drakensberg","Africa","South Africa, Lesotho","Southern African mountain system"],
    ["Andes","South America","Chile, Argentina, Peru, Bolivia, Ecuador, Colombia, Venezuela","Major western South American mountain chain"],
    ["Rockies","North America","Canada, United States","Western North American mountain system"],
    ["Appalachians","North America","United States, Canada","Ancient mountain system"],
    ["Great Dividing Range","Oceania","Australia","Eastern Australian mountain system"],
  ],

  rivers: [
    ["Nile","Africa","Lake Victoria region","Mediterranean Sea","Egypt, Sudan, Uganda and basin states"],
    ["Amazon","South America","Peruvian Andes","Atlantic Ocean","Brazil, Peru, Colombia and basin"],
    ["Yangtze","Asia","Tibetan Plateau","East China Sea","China"],
    ["Yellow River","Asia","Qinghai/Tibetan Plateau","Bohai Sea","China"],
    ["Mekong","Asia","Tibetan Plateau","South China Sea","China, Myanmar, Laos, Thailand, Cambodia, Vietnam"],
    ["Ganges","Asia","Himalayas","Bay of Bengal","India, Bangladesh"],
    ["Brahmaputra","Asia","Tibet","Bay of Bengal","China, India, Bangladesh"],
    ["Indus","Asia","Tibetan Plateau","Arabian Sea","China, India, Pakistan"],
    ["Tigris","Asia","Turkey","Persian Gulf system","Turkey, Iraq"],
    ["Euphrates","Asia","Turkey","Persian Gulf system","Turkey, Syria, Iraq"],
    ["Danube","Europe","Germany","Black Sea","Central and Eastern Europe"],
    ["Rhine","Europe","Swiss Alps","North Sea","Switzerland, Germany, Netherlands"],
    ["Volga","Europe","Russia","Caspian Sea","Russia"],
    ["Niger","Africa","Guinea Highlands region","Gulf of Guinea","West Africa"],
    ["Congo","Africa","Central Africa","Atlantic Ocean","DR Congo, Republic of Congo and basin"],
    ["Zambezi","Africa","Southern Africa","Indian Ocean","Zambia, Zimbabwe, Mozambique and basin"],
    ["Orange","Africa","Lesotho/South Africa","Atlantic Ocean","Southern Africa"],
    ["Paraná","South America","Brazil","Río de la Plata","Brazil, Paraguay, Argentina"],
    ["Orinoco","South America","Venezuela region","Atlantic Ocean","Venezuela, Colombia basin"],
    ["Mississippi–Missouri","North America","United States","Gulf of Mexico","United States"],
    ["Mackenzie","North America","Canada","Beaufort Sea","Canada"],
    ["Murray–Darling","Oceania","Australia","Southern Ocean system","Australia"],
  ],

  straits: [
    ["Strait of Hormuz","Persian Gulf ↔ Gulf of Oman","Iran–Oman/UAE vicinity","Major oil-shipping chokepoint"],
    ["Strait of Malacca","Andaman Sea ↔ South China Sea","Malaysia–Indonesia–Singapore","Major Indo-Pacific trade route"],
    ["Bab-el-Mandeb","Red Sea ↔ Gulf of Aden","Yemen–Djibouti/Eritrea","Gateway to Suez route"],
    ["Bosporus","Black Sea ↔ Sea of Marmara","Türkiye","Separates European and Asian Türkiye"],
    ["Dardanelles","Aegean Sea ↔ Sea of Marmara","Türkiye","Access to Black Sea through Turkish Straits"],
    ["Strait of Gibraltar","Atlantic ↔ Mediterranean","Spain–Morocco","Gateway between Atlantic and Mediterranean"],
    ["Bering Strait","Arctic Ocean ↔ Pacific","Russia–United States","Separates Asia and North America"],
    ["Taiwan Strait","East China Sea ↔ South China Sea","China–Taiwan","Strategic East Asian waterway"],
    ["Korea Strait","East China Sea ↔ Sea of Japan/East Sea","Korea–Japan","Northeast Asian maritime route"],
    ["Dover Strait","English Channel","United Kingdom–France","Narrowest part of English Channel"],
    ["Palk Strait","Bay of Bengal","India–Sri Lanka","South Asian strait"],
    ["Sunda Strait","Java Sea ↔ Indian Ocean","Indonesia","Between Java and Sumatra"],
    ["Lombok Strait","Bali Sea ↔ Indian Ocean","Indonesia","Deep Indonesian passage"],
    ["Makassar Strait","Celebes Sea ↔ Java Sea","Indonesia","Between Borneo and Sulawesi"],
    ["Torres Strait","Arafura Sea ↔ Coral Sea","Australia–Papua New Guinea","Between Australia and New Guinea"],
  ],

  seas: [
    ["Mediterranean Sea","Atlantic-connected marginal sea","Europe–Africa–Asia"],
    ["Black Sea","Atlantic-connected inland sea","Eastern Europe–West Asia"],
    ["Red Sea","Indian Ocean marginal sea","Northeast Africa–Arabia"],
    ["Arabian Sea","Northern Indian Ocean","India–Arabian Peninsula–East Africa"],
    ["South China Sea","Western Pacific marginal sea","Southeast Asia"],
    ["East China Sea","Western Pacific marginal sea","China–Korea–Japan region"],
    ["Sea of Japan / East Sea","Western Pacific marginal sea","Japan–Korean Peninsula–Russia"],
    ["Caribbean Sea","Atlantic marginal sea","Caribbean–Central America–South America"],
    ["North Sea","Atlantic marginal sea","Northwestern Europe"],
    ["Baltic Sea","Northern European sea","Northern Europe"],
    ["Bering Sea","North Pacific marginal sea","Russia–Alaska"],
    ["Coral Sea","South Pacific marginal sea","Australia–Melanesia"],
    ["Tasman Sea","South Pacific sea","Australia–New Zealand"],
  ],

  gulfs: [
    ["Gulf of Mexico","Atlantic","United States–Mexico–Cuba"],
    ["Gulf of Guinea","Atlantic","West Africa"],
    ["Persian Gulf","Indian Ocean system","Iran–Arabian Peninsula"],
    ["Gulf of Oman","Arabian Sea system","Iran–Oman–UAE/Pakistan vicinity"],
    ["Gulf of Aden","Indian Ocean system","Yemen–Somalia/Djibouti"],
    ["Gulf of Thailand","South China Sea","Thailand–Cambodia–Vietnam–Malaysia"],
    ["Gulf of Mannar","Indian Ocean","India–Sri Lanka"],
    ["Gulf of California","Pacific","Mexico"],
    ["Gulf of Bothnia","Baltic Sea","Sweden–Finland"],
  ],

  canals: [
    ["Suez Canal","Egypt","Mediterranean Sea ↔ Red Sea","Europe–Asia maritime shortcut"],
    ["Panama Canal","Panama","Atlantic ↔ Pacific","Interoceanic canal"],
    ["Kiel Canal","Germany","North Sea ↔ Baltic Sea","European maritime shortcut"],
    ["Corinth Canal","Greece","Gulf of Corinth ↔ Saronic Gulf","Cuts across the Isthmus of Corinth"],
  ],

  deserts: [
    ["Sahara","Africa","North Africa","Largest hot desert"],
    ["Arabian Desert","Asia","Arabian Peninsula","Arid West Asia"],
    ["Gobi","Asia","Mongolia–China","Cold desert"],
    ["Taklamakan","Asia","Xinjiang, China","Tarim Basin desert"],
    ["Thar","Asia","India–Pakistan","Monsoon-influenced desert"],
    ["Karakum","Asia","Turkmenistan","Central Asian desert"],
    ["Kyzylkum","Asia","Uzbekistan–Kazakhstan","Central Asian desert"],
    ["Atacama","South America","Chile–Peru region","Extremely arid coastal desert"],
    ["Patagonian Desert","South America","Argentina","Cold desert"],
    ["Namib","Africa","Namibia–Angola–South Africa region","Coastal desert"],
    ["Kalahari","Africa","Botswana–Namibia–South Africa","Semi-arid region"],
    ["Great Victoria Desert","Australia","Western/Southern Australia","Australian desert"],
    ["Great Sandy Desert","Australia","Western Australia","Australian desert"],
    ["Mojave","North America","United States","Southwestern US"],
  ],

  lakes: [
    ["Caspian Sea","Europe/Asia","Largest enclosed inland water body by area"],
    ["Lake Baikal","Asia","Russia","Deep freshwater lake"],
    ["Lake Victoria","Africa","Tanzania–Uganda–Kenya","Major Nile-system lake"],
    ["Lake Tanganyika","Africa","Tanzania–DR Congo–Burundi–Zambia","Very deep African lake"],
    ["Lake Superior","North America","United States–Canada","Largest Great Lake by area"],
    ["Lake Titicaca","South America","Peru–Bolivia","High-altitude navigable lake"],
    ["Aral Sea","Asia","Kazakhstan–Uzbekistan","Major environmental-change case study"],
    ["Dead Sea","Asia","Israel/West Bank–Jordan region","Hypersaline lake"],
  ],
};

const WORLD_RESOURCES = [
  ["Persian Gulf","Petroleum & natural gas","West Asia","Hormuz is the key chokepoint"],
  ["North Sea","Petroleum & natural gas","Europe","Offshore resources"],
  ["Gulf of Mexico","Petroleum & natural gas","North America","Offshore production"],
  ["West Siberia","Petroleum & natural gas","Russia","Major Eurasian hydrocarbon province"],
  ["Middle East","Petroleum & natural gas","West Asia","Major global hydrocarbon region"],
  ["Silesia","Coal","Poland/Czechia region","European coal belt"],
  ["Appalachian Basin","Coal","United States","Major North American coal province"],
  ["Bowen Basin","Coal","Australia","Important Australian coal region"],
  ["Pilbara","Iron ore","Australia","Major iron-ore province"],
  ["Carajás","Iron ore","Brazil","Major iron-ore province"],
  ["Copperbelt","Copper","Zambia–DR Congo","Major copper/cobalt belt"],
  ["Atacama","Copper","Chile","Major global copper region"],
  ["Lithium Triangle","Lithium","Argentina–Bolivia–Chile","Major salt-flat lithium region"],
  ["Guiana Shield","Bauxite/iron ore","South America","Resource-rich shield region"],
];

const WORLD_UPSC_HOTSPOTS = [
  ["Strait of Hormuz","West Asia","Energy security + maritime chokepoint"],
  ["Strait of Malacca","Southeast Asia","Trade route + Indo-Pacific"],
  ["Bab-el-Mandeb","Red Sea region","Suez route + maritime security"],
  ["Suez Canal","Egypt","Europe–Asia trade route"],
  ["Panama Canal","Central America","Atlantic–Pacific connectivity"],
  ["South China Sea","Southeast Asia","Trade, resources + geopolitics"],
  ["Taiwan Strait","East Asia","Strategic maritime geography"],
  ["Arctic","Polar region","New routes + resources + climate"],
  ["Black Sea","Europe–West Asia","Trade, security + riverine geography"],
  ["Horn of Africa","Northeast Africa","Red Sea/Gulf of Aden gateway"],
  ["Sahel","Africa","Desertification + security + climate"],
  ["Great Lakes of Africa","East/Central Africa","Water, population + resources"],
  ["Andes","South America","Climate, glaciers + minerals"],
  ["Amazon Basin","South America","Biodiversity + carbon cycle"],
  ["Caspian region","Central Asia","Energy + transport corridors"],
];

const WORLD_ACTIVE_RECALL = [
  ["Strait of Hormuz","Which waterway connects the Persian Gulf with the Gulf of Oman?"],
  ["Strait of Malacca","Which strait is a major maritime route between the Indian and Pacific Ocean systems?"],
  ["Bab-el-Mandeb","Which strait links the Red Sea with the Gulf of Aden?"],
  ["Strait of Gibraltar","Which strait connects the Atlantic Ocean with the Mediterranean Sea?"],
  ["Bering Strait","Which strait separates Russia from Alaska?"],
  ["Suez Canal","Which canal connects the Mediterranean Sea with the Red Sea?"],
  ["Panama Canal","Which canal connects the Atlantic and Pacific maritime systems?"],
  ["Atacama","Which South American desert is famous for extreme aridity?"],
  ["Gobi","Which major desert lies across Mongolia and northern China?"],
  ["Andes","Which mountain system runs along the western margin of South America?"],
  ["Danube","Which major European river flows into the Black Sea?"],
  ["Amazon","Which major South American river drains into the Atlantic Ocean?"],
  ["Mekong","Which major Southeast Asian river flows through multiple mainland Southeast Asian countries?"],
  ["Caspian Sea","Which enclosed water body is the world's largest inland water body by area?"],
  ["Lake Baikal","Which Russian lake is famous for exceptional depth and freshwater volume?"],
];

const WORLD_QUIZ = [
  {
    q:"Which strait connects the Persian Gulf with the Gulf of Oman?",
    o:["Malacca","Hormuz","Gibraltar","Bering"],
    a:1,
    e:"The Strait of Hormuz is the gateway between the Persian Gulf and Gulf of Oman."
  },
  {
    q:"Bab-el-Mandeb connects the Red Sea with the:",
    o:["Gulf of Aden","Persian Gulf","Bay of Bengal","Black Sea"],
    a:0,
    e:"It lies at the southern entrance of the Red Sea."
  },
  {
    q:"The Suez Canal connects the Mediterranean Sea with the:",
    o:["Arabian Sea","Red Sea","Black Sea","Caspian Sea"],
    a:1,
    e:"The canal provides the maritime link between the Mediterranean and Red Sea."
  },
  {
    q:"Which mountain system lies along the western edge of South America?",
    o:["Rockies","Andes","Alps","Atlas"],
    a:1,
    e:"The Andes form the dominant mountain chain along western South America."
  },
  {
    q:"The Atacama Desert is mainly associated with:",
    o:["Chile","Egypt","Mongolia","Australia"],
    a:0,
    e:"The Atacama is principally in northern Chile, with extension toward Peru."
  },
  {
    q:"Which river flows into the Black Sea?",
    o:["Danube","Nile","Mekong","Orange"],
    a:0,
    e:"The Danube empties into the Black Sea delta."
  },
  {
    q:"The Strait of Malacca lies between:",
    o:["Spain and Morocco","Malaysia and Sumatra/Indonesia","Russia and Alaska","India and Sri Lanka"],
    a:1,
    e:"It is the major passage between the Malay Peninsula and Sumatra."
  },
  {
    q:"Lake Baikal is located in:",
    o:["Russia","Canada","Peru","Kenya"],
    a:0,
    e:"Lake Baikal is in southern Siberia, Russia."
  },
  {
    q:"The Gobi Desert extends across:",
    o:["Mongolia and China","India and Pakistan","Namibia and Botswana","Chile and Peru"],
    a:0,
    e:"The Gobi occupies southern Mongolia and northern China."
  },
  {
    q:"The Panama Canal links the Atlantic and:",
    o:["Indian Ocean","Pacific Ocean","Arctic Ocean","Southern Ocean"],
    a:1,
    e:"It provides an interoceanic route between Atlantic and Pacific systems."
  },
  {
    q:"The Copperbelt is strongly associated with:",
    o:["Zambia and DR Congo","Spain and Portugal","Canada and USA","India and Nepal"],
    a:0,
    e:"The Central African Copperbelt spans Zambia and the DR Congo region."
  },
  {
    q:"The Lithium Triangle is located mainly in:",
    o:["South America","Central Africa","Southeast Asia","Eastern Europe"],
    a:0,
    e:"It broadly refers to lithium-rich salt-flat regions of Argentina, Bolivia and Chile."
  },
];

const WORLD_LEARNING_MODES = [
  {id:"countries",label:"Countries & Capitals",icon:"🌐"},
  {id:"mountains",label:"Mountains & Peaks",icon:"⛰️"},
  {id:"rivers",label:"Rivers",icon:"🌊"},
  {id:"straits",label:"Straits & Chokepoints",icon:"🚢"},
  {id:"seas",label:"Seas & Gulfs",icon:"🌍"},
  {id:"deserts",label:"Deserts",icon:"🏜️"},
  {id:"lakes",label:"Lakes",icon:"💧"},
  {id:"resources",label:"Resources",icon:"⛏️"},
  {id:"hotspots",label:"UPSC Hotspots",icon:"📍"},
];

const WORLD_STATS = {
  countryEntries: WORLD_COUNTRIES.length,
  mountainEntries: WORLD_PHYSICAL_FEATURES.mountains.length,
  riverEntries: WORLD_PHYSICAL_FEATURES.rivers.length,
  straitEntries: WORLD_PHYSICAL_FEATURES.straits.length,
  seaEntries: WORLD_PHYSICAL_FEATURES.seas.length,
  gulfEntries: WORLD_PHYSICAL_FEATURES.gulfs.length,
  canalEntries: WORLD_PHYSICAL_FEATURES.canals.length,
  desertEntries: WORLD_PHYSICAL_FEATURES.deserts.length,
  lakeEntries: WORLD_PHYSICAL_FEATURES.lakes.length,
  resourceEntries: WORLD_RESOURCES.length,
  hotspotEntries: WORLD_UPSC_HOTSPOTS.length,
};




"use client";

import { useEffect, useMemo, useState } from "react";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const CONTINENTS = [
  "All",
  "Asia",
  "Europe",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

const norm = (v) => String(v || "").trim().toLowerCase();

function project(lon, lat, w, h, pad = 12) {
  return [
    pad + ((Number(lon) + 180) / 360) * (w - pad * 2),
    pad + ((90 - Number(lat)) / 180) * (h - pad * 2),
  ];
}

function ringPath(ring, w, h) {
  return (
    ring
      .map(([lon, lat], i) => {
        const [x, y] = project(lon, lat, w, h);
        return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ") + " Z"
  );
}

function geometryPath(geometry, w, h) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((r) => ringPath(r, w, h)).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .flatMap((polygon) => polygon.map((r) => ringPath(r, w, h)))
      .join(" ");
  }
  return "";
}

function geoCountryName(feature) {
  const p = feature?.properties || {};
  return String(p.ADMIN || p.NAME || p.NAME_EN || p.name || "").trim();
}

function countryId(feature) {
  const p = feature?.properties || {};
  const raw =
    p["ISO3166-1-Alpha-2"] ||
    p.ISO_A2 ||
    p.ISO_A2_EH ||
    p.ISO2 ||
    p.iso_a2;

  return raw && raw !== "-99" ? String(raw).toUpperCase() : null;
}

function getCountryMeta(name) {
  const row = WORLD_COUNTRIES.find(
    ([country]) => norm(country) === norm(name)
  );
  if (!row) return null;
  return { name: row[0], capital: row[1], continent: row[2] };
}

const POINTS = {
  mountains: WORLD_PHYSICAL_FEATURES.mountains.map(
    ([name, region, countries, note], i) => [
      name,
      [
        [85, 30], [77, 35], [70, 36], [80, 43], [59, 60],
        [10, 47], [3, 32], [-70, -20], [-115, 42], [147, -30],
        [25, 35], [30, -29], [88, 31], [90, 31],
      ][i % 14],
      `${region} • ${countries}`,
      note,
    ]
  ),
  rivers: WORLD_PHYSICAL_FEATURES.rivers.map(
    ([name, region, source, mouth, basin], i) => [
      name,
      [
        [31, 2], [-60, -4], [105, 31], [111, 35], [102, 25],
        [79, 23], [91, 30], [76, 31], [44, 33], [39, 35],
        [31, 48], [37, 50], [32, 9], [-57, -27], [-63, 8],
        [-91, 34], [-120, 60], [140, -32], [65, 40], [20, 10],
        [24, -15], [-75, -15],
      ][i % 22],
      `${region} • Source: ${source}`,
      `Mouth: ${mouth} • Basin: ${basin}`,
    ]
  ),
  straits: WORLD_PHYSICAL_FEATURES.straits.map(
    ([name, connection, location, note], i) => [
      name,
      [
        [56.5, 26.6], [100, 3], [43.3, 12.6], [29.1, 41.1],
        [26.3, 40.2], [-5.6, 35.9], [-169, 65.8], [119.5, 24],
        [128, 35], [1.3, 51], [79.8, 9.8], [105.8, -5.9],
        [116, -8.5], [143, -10], [173, -10],
      ][i % 15],
      `${location} • ${connection}`,
      note,
    ]
  ),
  seas: WORLD_PHYSICAL_FEATURES.seas.map(
    ([name, type, location], i) => [
      name,
      [
        [15, 35], [35, 42], [38, 20], [65, 15], [113, 15],
        [125, 28], [135, 40], [-75, 16], [3, 56], [20, 59],
        [-175, 55], [150, -18], [160, -40],
      ][i % 13],
      `${type} • ${location}`,
      "",
    ]
  ),
  gulfs: WORLD_PHYSICAL_FEATURES.gulfs.map(
    ([name, type, location], i) => [
      name,
      [
        [-90, 24], [0, 3], [51, 27], [58, 24], [45, 13],
        [103, 10], [80, 8], [-110, 25], [22, 63],
      ][i % 9],
      `${type} • ${location}`,
      "",
    ]
  ),
  canals: WORLD_PHYSICAL_FEATURES.canals.map(
    ([name, location, connection, note], i) => [
      name,
      [
        [32.3, 30.5], [-79.7, 9.1], [10, 53.9], [22.9, 37.9],
      ][i % 4],
      `${location} • ${connection}`,
      note,
    ]
  ),
  deserts: WORLD_PHYSICAL_FEATURES.deserts.map(
    ([name, region, location, note], i) => [
      name,
      [
        [10, 23], [45, 25], [105, 43], [85, 38], [70, 40],
        [55, 39], [65, 42], [-70, -23], [-70, -45], [16, -23],
        [22, -23], [135, -29], [125, -20], [-115, 35],
      ][i % 14],
      `${region} • ${location}`,
      note,
    ]
  ),
  lakes: WORLD_PHYSICAL_FEATURES.lakes.map(
    ([name, region, location, note], i) => [
      name,
      [
        [50, 42], [108, 53], [33, 1], [30, -5],
        [-87, 47], [-69, -16], [59, 45], [35, 31],
      ][i % 8],
      `${region} • ${location}`,
      note,
    ]
  ),
  resources: WORLD_RESOURCES.map(
    ([name, resource, region, note], i) => [
      name,
      [
        [51, 27], [2, 57], [-90, 24], [75, 60], [30, 45],
        [-100, 40], [150, -23], [22, -15], [-70, -23],
        [-65, -22], [70, 35], [40, 30], [-60, 5], [-50, 5],
      ][i % 14],
      `${resource} • ${region}`,
      note,
    ]
  ),
  hotspots: WORLD_UPSC_HOTSPOTS.map(
    ([name, region, relevance], i) => [
      name,
      [
        [56, 27], [100, 3], [43, 13], [32, 82], [48, 9],
        [0, 15], [120, 5], [34, 35], [65, 43], [-60, -5],
        [-70, -15], [20, 0], [0, 40], [30, 30], [50, 45],
      ][i % 15],
      `${region} • ${relevance}`,
      "",
    ]
  ),
};

export default function WorldMapPage() {
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [layer, setLayer] = useState("countries");
  const [continent, setContinent] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("explore");
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [mastered, setMastered] = useState({});

  const W = 1100;
  const H = 560;

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sambhav-world-theme");
      const savedProgress = localStorage.getItem("sambhav-world-progress");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        if (parsed && typeof parsed === "object") setMastered(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sambhav-world-theme", theme);
      localStorage.setItem("sambhav-world-progress", JSON.stringify(mastered));
    } catch {}
  }, [theme, mastered]);

  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Map request failed (${response.status})`);
        return response.json();
      })
      .then((json) => {
        if (!cancelled) setGeo(json);
      })
      .catch((error) => {
        if (!cancelled) setMapError(error?.message || "World boundaries could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const features = useMemo(() => {
    if (!Array.isArray(geo?.features)) return [];
    return geo.features.map((feature, index) => {
      const id = countryId(feature);
      const name = geoCountryName(feature);
      return {
        key: `${id || name || "country"}-${index}`,
        feature,
        id,
        name,
        meta: getCountryMeta(name),
      };
    });
  }, [geo]);

  const countries = useMemo(() => {
    const q = norm(query);
    return WORLD_COUNTRIES.filter(([name, capital, region]) => {
      const regionMatch =
        continent === "All" ||
        region === continent ||
        (continent === "Asia" && region === "Europe/Asia") ||
        (continent === "Europe" && region === "Europe/Asia");
      const queryMatch =
        !q ||
        norm(name).includes(q) ||
        norm(capital).includes(q) ||
        norm(region).includes(q);
      return regionMatch && queryMatch;
    });
  }, [query, continent]);

  const visibleFeatures = useMemo(() => {
    const q = norm(query);
    return features.filter(({ name, id, meta }) => {
      if (continent !== "All") {
        const region = meta?.continent || "";
        if (
          region !== continent &&
          !(continent === "Asia" && region === "Europe/Asia") &&
          !(continent === "Europe" && region === "Europe/Asia")
        ) return false;
      }
      if (!q) return true;
      return (
        norm(name).includes(q) ||
        norm(id).includes(q) ||
        norm(meta?.name).includes(q) ||
        norm(meta?.capital).includes(q)
      );
    });
  }, [features, query, continent]);

  const selectedCountry = useMemo(() => {
    if (!selected) return null;
    const row = WORLD_COUNTRIES.find(([name]) => norm(name) === norm(selected));
    if (row) return { name: row[0], capital: row[1], continent: row[2] };
    const feature = features.find(
      ({ id, name }) => norm(id) === norm(selected) || norm(name) === norm(selected)
    );
    return feature?.meta || (feature ? { name: feature.name, capital: "—", continent: "—" } : null);
  }, [selected, features]);

  const currentRecall = WORLD_ACTIVE_RECALL[recallIndex % WORLD_ACTIVE_RECALL.length];
  const currentQuiz = WORLD_QUIZ[quizIndex % WORLD_QUIZ.length];
  const points = POINTS[layer] || [];

  const markMastered = (key) =>
    setMastered((previous) => ({ ...previous, [key]: Date.now() }));

  const answerQuiz = (index) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(index);
    if (index === currentQuiz.a) setScore((previous) => previous + 1);
  };

  const nextQuiz = () => {
    setQuizIndex((previous) => (previous + 1) % WORLD_QUIZ.length);
    setQuizAnswer(null);
  };

  const light = theme === "light";

  return (
    <main className={light ? "world light" : "world"}>
      <style jsx global>{`
        :root{--wb:#07111f;--wp:#0d1a2b;--wp2:#12243a;--wt:#edf5ff;--wm:#91a6bd;--wbd:rgba(255,255,255,.1);--wa:#65a8ff;--wg:#70dfbd;--wl:#1b3047;--wac:#294c6e;--ws:#3d82c7;--ww:#06101c}
        .world.light{--wb:#f4f7fb;--wp:#fff;--wp2:#eef4fa;--wt:#10243a;--wm:#63758a;--wbd:rgba(15,35,58,.11);--wl:#d7e3ee;--wac:#b9d5ed;--ws:#6ba5d8;--ww:#e8f0f8}
        .world,.world *{box-sizing:border-box}.world{min-height:100vh;padding:20px;background:radial-gradient(circle at 10% 0%,rgba(67,139,226,.16),transparent 28%),var(--wb);color:var(--wt);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wshell{max-width:1500px;margin:auto}.whead{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:14px}.brand{display:flex;align-items:center;gap:12px}.logo{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;color:#fff;font-weight:900;font-size:21px;background:linear-gradient(135deg,#397cc9,#55cda9)}.kick{color:var(--wg);font-size:10px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.title{margin:2px 0;font-size:28px;line-height:1;font-weight:950;letter-spacing:-.04em}.sub{color:var(--wm);font-size:12px}.actions{display:flex;flex-wrap:wrap;gap:6px}.btn{border:1px solid var(--wbd);background:var(--wp);color:var(--wt);border-radius:10px;padding:9px 12px;cursor:pointer;font-size:10px;font-weight:850}.btn.active{color:var(--wa);border-color:rgba(101,168,255,.4);background:rgba(101,168,255,.12)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:13px}.stat,.card{background:var(--wp);border:1px solid var(--wbd);box-shadow:0 18px 55px rgba(0,0,0,.12)}.stat{border-radius:12px;padding:11px}.stat b{display:block;font-size:18px}.stat span{color:var(--wm);font-size:9px}.grid{display:grid;grid-template-columns:minmax(0,1fr) 355px;gap:13px}.card{overflow:hidden;border-radius:17px}.toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:12px;border-bottom:1px solid var(--wbd)}.tabs{display:flex;flex-wrap:wrap;gap:5px}.tab{border:1px solid var(--wbd);background:transparent;color:var(--wm);border-radius:9px;padding:8px 9px;cursor:pointer;font-size:9px;font-weight:900}.tab.active{color:var(--wa);border-color:rgba(101,168,255,.4);background:rgba(101,168,255,.12)}.map{position:relative;overflow:auto;background:var(--ww)}.svg{display:block;width:100%;min-width:650px}.side{display:flex;flex-direction:column;gap:10px;padding:13px}.input{width:100%;border:1px solid var(--wbd);outline:none;border-radius:10px;padding:11px;background:var(--wp2);color:var(--wt);font-size:11px}.chips{display:flex;flex-wrap:wrap;gap:5px}.chip{border:1px solid var(--wbd);background:transparent;color:var(--wm);border-radius:999px;padding:6px 8px;cursor:pointer;font-size:9px;font-weight:800}.chip.active{color:var(--wt);border-color:rgba(101,168,255,.4);background:rgba(101,168,255,.12)}.label{color:var(--wm);font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.list{display:flex;flex-direction:column;gap:5px;max-height:310px;overflow:auto}.item{border:1px solid transparent;border-radius:9px;padding:9px;background:var(--wp2);cursor:pointer}.item:hover{border-color:var(--wbd)}.itemname{font-size:11px;font-weight:900}.small,.note{color:var(--wm);font-size:9px;line-height:1.5}.selected{padding:12px;border-radius:12px;border:1px solid var(--wbd);background:var(--wp2)}.selectedname{margin:4px 0 7px;font-size:18px;font-weight:950}.bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:13px}.box{padding:15px;min-height:170px}.box h3{margin:0 0 7px;font-size:14px}.box p{margin:0;color:var(--wm);font-size:10px;line-height:1.65}.recall{padding:14px;border:1px solid var(--wbd);border-radius:12px;background:var(--wp2)}.recallname{margin:5px 0;font-size:20px;font-weight:950}.options{display:grid;gap:6px;margin-top:10px}.option{width:100%;text-align:left;border:1px solid var(--wbd);background:transparent;color:var(--wt);border-radius:9px;padding:9px;cursor:pointer;font-size:10px}.correct{background:rgba(70,210,155,.13)!important;border-color:rgba(70,210,155,.55)!important}.wrong{background:rgba(255,100,110,.13)!important;border-color:rgba(255,100,110,.55)!important}.maplabel{fill:var(--wt);font-size:7px;font-weight:850;paint-order:stroke;stroke:var(--ww);stroke-width:3px;pointer-events:none}.point{fill:var(--wa);stroke:var(--wb);stroke-width:2;cursor:pointer}.error{padding:70px 25px;text-align:center;color:var(--wm)}@media(max-width:950px){.grid,.bottom{grid-template-columns:1fr}.whead{align-items:flex-start}}@media(max-width:600px){.world{padding:9px}.title{font-size:22px}.stats{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="wshell">
        <header className="whead">
          <div className="brand">
            <div className="logo">◎</div>
            <div>
              <div className="kick">SAMBHAV UPSC • GEOGRAPHY INTELLIGENCE</div>
              <div className="title">WORLD MAP</div>
              <div className="sub">Explore the world • Learn locations • Master UPSC mapping</div>
            </div>
          </div>
          <div className="actions">
            <button className={`btn ${mode==="explore"?"active":""}`} onClick={()=>setMode("explore")}>Explore</button>
            <button className={`btn ${mode==="recall"?"active":""}`} onClick={()=>setMode("recall")}>Active Recall</button>
            <button className={`btn ${mode==="quiz"?"active":""}`} onClick={()=>setMode("quiz")}>Map Quiz</button>
            <button className="btn" onClick={()=>setTheme(light?"dark":"light")}>{light?"Dark":"Light"}</button>
          </div>
        </header>

        <section className="stats">
          <div className="stat"><b>{WORLD_STATS.countryEntries}+</b><span>Country intelligence</span></div>
          <div className="stat"><b>{WORLD_STATS.straitEntries}</b><span>Strategic straits</span></div>
          <div className="stat"><b>{WORLD_STATS.mountainEntries + WORLD_STATS.desertEntries}</b><span>Physical features</span></div>
          <div className="stat"><b>{Object.keys(mastered).length}</b><span>Items mastered</span></div>
        </section>

        <div className="grid">
          <section className="card">
            <div className="toolbar">
              <div className="tabs">
                {[
                  ["countries","◎ Countries"],["capitals","⌖ Capitals"],["mountains","△ Mountains"],
                  ["rivers","≈ Rivers"],["straits","⇆ Straits"],["seas","◉ Seas"],["gulfs","◌ Gulfs"],
                  ["canals","⇄ Canals"],["deserts","⌁ Deserts"],["lakes","○ Lakes"],
                  ["resources","◆ Resources"],["hotspots","✦ UPSC Hotspots"],
                ].map(([id,label])=><button key={id} className={`tab ${layer===id?"active":""}`} onClick={()=>setLayer(id)}>{label}</button>)}
              </div>
              <div className="kick">{continent.toUpperCase()}</div>
            </div>

            <div className="map">
              {loading && <div className="error">Loading world country boundaries…</div>}
              {!loading && (
                <>
                  {mapError && <div className="error"><b>Boundary map could not be loaded.</b><div style={{marginTop:7}}>{mapError}</div></div>}
                  <svg className="svg" viewBox={`0 0 ${W} ${H}`} aria-label="Interactive world map">
                    <rect width={W} height={H} fill="var(--ww)"/>
                    {visibleFeatures.map(({feature,id,name,meta,key})=>{
                      const selectedNow=norm(selected)===norm(id)||norm(selected)===norm(name);
                      const fill=selectedNow?"var(--ws)":continent!=="All"&&meta?.continent===continent?"var(--wac)":"var(--wl)";
                      return <path key={key} d={geometryPath(feature.geometry,W,H)} fill={fill} stroke="rgba(255,255,255,.18)" strokeWidth=".55" onClick={()=>setSelected(id||name)} style={{cursor:"pointer"}}><title>{meta?.name||name}{meta?.capital?` • Capital: ${meta.capital}`:""}</title></path>;
                    })}
                    {layer!=="countries" && points.map(([name,coords,subtitle,note],index)=>{
                      const [x,y]=project(coords[0],coords[1],W,H);
                      return <g key={`${name}-${index}`}><circle className="point" cx={x} cy={y} r="4" onClick={()=>setQuery(name)}/><text className="maplabel" x={x+6} y={y-6}>{name}</text><title>{name} • {subtitle}{note?` • ${note}`:""}</title></g>;
                    })}
                  </svg>
                </>
              )}
            </div>
          </section>

          <aside className="card side">
            {mode==="recall" && <>
              <div className="label">Active Recall</div>
              <div className="recall">
                <div className="kick">{currentRecall[0]}</div>
                <div className="recallname">{currentRecall[0]}</div>
                <div className="note">{currentRecall[1]}</div>
                {recallRevealed && <div className="note" style={{marginTop:10}}>Now locate it on the map and identify adjoining countries, sea/ocean and strategic relevance.</div>}
              </div>
              <div className="actions">
                <button className="btn" onClick={()=>setRecallRevealed(v=>!v)}>{recallRevealed?"Hide":"Reveal"}</button>
                <button className="btn active" onClick={()=>{markMastered(`recall-${currentRecall[0]}`);setRecallRevealed(false);setRecallIndex(i=>(i+1)%WORLD_ACTIVE_RECALL.length)}}>I KNEW IT</button>
              </div>
            </>}

            {mode==="quiz" && <>
              <div className="label">Prelims Map Quiz</div>
              <div className="recall">
                <div className="recallname" style={{fontSize:14}}>{currentQuiz.q}</div>
                <div className="options">
                  {currentQuiz.o.map((option,index)=><button key={option} className={`option ${quizAnswer!==null&&index===currentQuiz.a?"correct":""} ${quizAnswer===index&&index!==currentQuiz.a?"wrong":""}`} onClick={()=>answerQuiz(index)}>{String.fromCharCode(65+index)}. {option}</button>)}
                </div>
                {quizAnswer!==null && <div className="note" style={{marginTop:10}}><b>Answer:</b> {currentQuiz.o[currentQuiz.a]}<br/><b>Explanation:</b> {currentQuiz.e}</div>}
              </div>
              <div className="actions"><button className="btn active" onClick={nextQuiz}>Next Question</button><span className="btn">Score: {score}</span></div>
            </>}

            {mode==="explore" && <>
              <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search country, capital or feature…"/>
              <div className="chips">{CONTINENTS.map(item=><button key={item} className={`chip ${continent===item?"active":""}`} onClick={()=>setContinent(item)}>{item}</button>)}</div>
              {selectedCountry && <div className="selected">
                <div className="label">Selected country</div>
                <div className="selectedname">{selectedCountry.name}</div>
                <div className="note"><b>Capital:</b> {selectedCountry.capital}<br/><b>Continent:</b> {selectedCountry.continent}</div>
                <button className="btn active" style={{width:"100%",marginTop:10}} onClick={()=>markMastered(`country-${selectedCountry.name}`)}>Mark Mastered</button>
              </div>}
              <div className="label">Countries • {countries.length}</div>
              <div className="list">{countries.map(([name,capital,region])=><div className="item" key={`${name}-${capital}`} onClick={()=>setSelected(name)}><div className="itemname">{name}</div><div className="small">Capital: {capital} • {region}</div></div>)}</div>
            </>}
          </aside>
        </div>

        <div className="bottom">
          <section className="card box"><h3>Physical Geography</h3><p>Mountains, rivers, seas, gulfs, deserts and lakes are organised as location-first map layers for UPSC revision.</p><button className="btn active" style={{marginTop:13}} onClick={()=>{setMode("explore");setLayer("mountains")}}>Open Physical Layer</button></section>
          <section className="card box"><h3>Strategic Geography</h3><p>Revise major straits, canals and maritime chokepoints with their adjoining regions and geographic connections.</p><button className="btn active" style={{marginTop:13}} onClick={()=>{setMode("explore");setLayer("straits")}}>Open Chokepoints</button></section>
          <section className="card box"><h3>Resources + Hotspots</h3><p>Connect resource geography with important world regions and UPSC-relevant strategic locations.</p><button className="btn active" style={{marginTop:13}} onClick={()=>{setMode("explore");setLayer("hotspots")}}>Open UPSC Hotspots</button></section>
        </div>
      </div>
    </main>
  );
}
