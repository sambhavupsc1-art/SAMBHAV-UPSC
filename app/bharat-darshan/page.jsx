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

import { STATE_META, FEATURE_INDEX, MAPPING_CLASS_2026, MAPPING_CLASS_NOTES_2026 } from "./data";

/* ============================================================
   GEOJSON
   ============================================================ */

const GEOJSON_URL =
  "https://raw.githubusercontent.com/adarshbiradar/maps-geojson/master/india.json";

/*
  Verified external feature sources used only when explicit geometry is
  absent from the separate Bharat Darshan data file.
*/
const FEATURE_GEOJSON_SOURCES = {
  rivers: [
    // CWC / National Water Data Portal — River Network (updated Nov 2025).
    "https://nwdp.nwic.gov.in/dataset/3209962f-d0ff-45b8-910a-209bf69a0ccf/resource/6e552705-842d-40a4-92b2-8506bb66df2a/download/river_network.geojson",
    // Fallback for major named rivers if the CWC endpoint is unavailable.
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_rivers_lake_centerlines.geojson",
  ],
  ecology: [
    "https://livingatlas.esri.in/server1/rest/services/Wildlife/National_Parks_and_Wildlife_Sanctuaries/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
  ],
  coastal: [
    "https://livingatlas.esri.in/server/rest/services/India/Seaport/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
  ],
  mountains: [
    "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_geography_regions_elevation_points.geojson",
  ],
  minerals: [
    "https://livingatlas.esri.in/server/rest/services/Mines/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
  ],
  agriculture: [
    "https://livingatlas.esri.in/server/rest/services/AgricultureCensus/Agriculture_Statistics25/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
    "https://livingatlas.esri.in/server/rest/services/AgricultureCensus/India_Agriculture_Statistics_2022_2023_Rice_Production/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
    "https://livingatlas.esri.in/server/rest/services/AgricultureCensus/India_Agriculture_Statistics_2022_2023_Wheat_Production/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
    "https://livingatlas.esri.in/server/rest/services/AgricultureCensus/India_Agriculture_Statistics_2022_2023_Cotton_Production_Bales/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
    "https://livingatlas.esri.in/server/rest/services/AgricultureCensus/India_Agriculture_Statistics_2022_2023_Sugarcane_Production/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson",
  ],
};


/* ============================================================
   RIVER INTELLIGENCE — UPSC MAP CARD
   Verified/curated from India-WRIS/CWC/NRSC/ISRO and official
   river-governance sources. The page never invents missing fields.
   ============================================================ */
const RIVER_INTELLIGENCE = {
  ganga: {
    origin: "Bhagirathi at Gangotri Glacier near Gomukh, Uttarakhand; becomes Ganga at Devprayag after meeting Alaknanda.",
    states: "Uttarakhand → Uttar Pradesh → Bihar → Jharkhand → West Bengal",
    tributaries: "Yamuna, Son, Ramganga, Ghaghara, Gandak, Kosi, Mahananda; major sub-tributaries include Chambal and Betwa.",
    end: "Bay of Bengal / Ganga–Brahmaputra–Meghna delta",
    governance: "Namami Gange / National Mission for Clean Ganga (NMCG)",
    sourceUrl: "https://indiawris.gov.in/downloads/Ganga%20Basin.pdf",
  },
  yamuna: {
    origin: "Yamunotri Glacier, Uttarakhand, in the Bandarpunch massif.",
    states: "Uttarakhand → Himachal Pradesh (course/boundary stretches) → Haryana → Delhi → Uttar Pradesh",
    tributaries: "Tons, Chambal, Sindh, Betwa, Ken; Hindon and several smaller tributaries join in the lower basin.",
    end: "Confluences with the Ganga at Prayagraj, Uttar Pradesh.",
    governance: "Yamuna Action Plan / National River Conservation Programme; river rejuvenation is also addressed under central river-cleaning programmes.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  brahmaputra: {
    origin: "Rises in the Tibetan Himalaya; enters India through Arunachal Pradesh as Siang/Dihang.",
    states: "Arunachal Pradesh → Assam",
    tributaries: "Dibang, Lohit, Subansiri, Kameng/Jia-Bharali, Manas, Dhansiri, Kopili.",
    end: "Enters Bangladesh, where it joins the Ganga system and ultimately drains to the Bay of Bengal.",
    governance: "National Waterway-2 and basin-level water-resources management; no bilateral treaty is asserted here without a river-specific verified source.",
    sourceUrl: "https://indiawris.gov.in/",
  },
  narmada: {
    origin: "Amarkantak region, Madhya Pradesh.",
    states: "Madhya Pradesh → Maharashtra/Gujarat boundary stretches → Gujarat",
    tributaries: "Tawa, Hiran, Orsang, Kolar and other tributaries.",
    end: "Gulf of Khambhat (Arabian Sea).",
    governance: "Sardar Sarovar Project; Narmada Water Disputes Tribunal Award.",
    sourceUrl: "https://indiawris.gov.in/downloads/Narmada%20Basin.pdf",
  },
  godavari: {
    origin: "Trimbakeshwar/Nashik region, Maharashtra, in the Western Ghats.",
    states: "Maharashtra → Telangana → Andhra Pradesh",
    tributaries: "Pranhita, Indravati, Sabari, Manjira, Maner and Purna among major tributaries.",
    end: "Bay of Bengal, through the Godavari delta in Andhra Pradesh.",
    governance: "Polavaram Project and Godavari Water Disputes Tribunal framework.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/godavari-water-disputes-tribunal-april-1969",
  },
  krishna: {
    origin: "Near Jor village, Satara district, Maharashtra, near Mahabaleshwar in the Western Ghats.",
    states: "Maharashtra → Karnataka → Telangana → Andhra Pradesh",
    tributaries: "Bhima, Tungabhadra, Ghataprabha, Malaprabha, Koyna, Musi, Munneru and others.",
    end: "Bay of Bengal.",
    governance: "Krishna Water Disputes Tribunal framework; major basin projects include Nagarjuna Sagar and Srisailam.",
    sourceUrl: "https://indiawris.gov.in/downloads/Krishna%20Basin.pdf",
  },
  mahanadi: {
    origin: "Dhamtari district, Chhattisgarh.",
    states: "Chhattisgarh → Odisha",
    tributaries: "Seonath, Hasdeo, Mand, Ib, Ong, Tel and Jonk among major tributaries.",
    end: "Bay of Bengal.",
    governance: "Hirakud Project and Mahanadi basin water-management framework; no additional treaty is asserted without a verified river-specific source.",
    sourceUrl: "https://indiawris.gov.in/downloads/Mahanadi%20Basin.pdf",
  },
  cauvery: {
    origin: "Talakaveri in the Brahmagiri Hills, Karnataka.",
    states: "Karnataka → Tamil Nadu → Puducherry (Karaikal region via delta system)",
    tributaries: "Kabini, Hemavati, Harangi, Shimsha, Arkavathi, Bhavani, Noyyal and Amaravati.",
    end: "Bay of Bengal.",
    governance: "Cauvery Water Management Authority / Cauvery Water Regulation Committee under the inter-state water-dispute framework.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  tapi: {
    origin: "Multai, Betul district, Madhya Pradesh.",
    states: "Madhya Pradesh → Maharashtra → Gujarat",
    tributaries: "Purna, Girna, Panjhra, Waghur, Aner and others.",
    end: "Gulf of Khambhat (Arabian Sea).",
    governance: "Ukai Project and Tapi basin water-resources management.",
    sourceUrl: "https://indiawris.gov.in/",
  },
  son: {
    origin: "Maikala range, near Amarkantak/Sonbhadra region of Madhya Pradesh.",
    states: "Madhya Pradesh → Uttar Pradesh → Bihar",
    tributaries: "Rihand, Kanhar, North Koel, Gopat, Banas and others.",
    end: "Joins the Ganga near Patna/Dinapur, Bihar.",
    governance: "Rihand Dam is a major project in the Son sub-basin.",
    sourceUrl: "https://indiawris.gov.in/downloads/Ganga%20Basin.pdf",
  },
  gandak: {
    origin: "Himalayan system of Nepal/Tibet; the river enters the Indian plains at Valmikinagar, Bihar.",
    states: "Uttar Pradesh/Bihar border stretches → Bihar",
    tributaries: "Kali Gandaki, Trishuli and other Himalayan tributary streams.",
    end: "Joins the Ganga near Patna, Bihar.",
    governance: "Valmikinagar/Gandak Barrage and the Gandak basin's India–Nepal water-management arrangements.",
    sourceUrl: "https://indiawris.gov.in/downloads/Ganga%20Basin.pdf",
  },
  kosi: {
    origin: "Himalayan system of Tibet/Nepal; formed by major Himalayan streams including Arun, Sun Kosi and Tamur systems.",
    states: "Bihar (Indian course)",
    tributaries: "Arun, Sun Kosi, Tamur and associated Himalayan streams.",
    end: "Joins the Ganga in Bihar.",
    governance: "Kosi Barrage / India–Nepal Kosi Project framework.",
    sourceUrl: "https://indiawris.gov.in/downloads/Ganga%20Basin.pdf",
  },
  ghaghara: {
    origin: "Himalayan/Tibetan–Nepalese river system; known as Karnali in the upper reaches.",
    states: "Uttar Pradesh → Bihar",
    tributaries: "Rapti, Little Gandak and other Himalayan/foothill tributaries.",
    end: "Joins the Ganga in Bihar.",
    governance: "Gandak/Ganga basin water management; no separate treaty is asserted here without a verified river-specific source.",
    sourceUrl: "https://indiawris.gov.in/downloads/Ganga%20Basin.pdf",
  },
  chambal: {
    origin: "Janapav Hills, Madhya Pradesh.",
    states: "Madhya Pradesh → Rajasthan → Uttar Pradesh",
    tributaries: "Banas, Kali Sindh, Parbati and Mej among major tributaries.",
    end: "Joins the Yamuna in Uttar Pradesh.",
    governance: "Gandhi Sagar, Rana Pratap Sagar, Jawahar Sagar and Kota Barrage form the major Chambal cascade.",
    sourceUrl: "https://indiawris.gov.in/downloads/Ganga%20Basin.pdf",
  },
  betwa: {
    origin: "Vindhyan range, Madhya Pradesh.",
    states: "Madhya Pradesh → Uttar Pradesh",
    tributaries: "Dhasan, Jamni and other tributaries.",
    end: "Joins the Yamuna near Hamirpur, Uttar Pradesh.",
    governance: "Ken–Betwa Link Project; Betwa basin water-management projects.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  indus: {
    origin: "Near Lake Manasarovar / Tibetan Plateau, Tibet (China).",
    states: "India (Ladakh) → Pakistan.",
    tributaries: "Zanskar, Shyok, Gilgit, Kabul, Jhelum, Chenab, Ravi, Beas and Sutlej are part of the wider Indus river system.",
    end: "Arabian Sea near the Indus Delta, Sindh, Pakistan.",
    governance: "Indus Waters Treaty, 1960 — the Indus is one of the Western Rivers under the treaty's India–Pakistan water-sharing framework.",
    sourceUrl: "https://www.mea.gov.in/bilateral-documents.htm?dtl%2F6439%2FIndus=&outputType=chromeless",
  },
  jhelum: {
    origin: "Verinag spring, Jammu & Kashmir, in the southeastern Kashmir Valley.",
    states: "Jammu & Kashmir (UT)",
    tributaries: "Lidder, Sindh and Pohru among important tributaries.",
    end: "Enters Pakistan and joins the Chenab, ultimately forming part of the Indus system.",
    governance: "Indus Waters Treaty (1960) framework.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  sutlej: {
    origin: "Tibetan Plateau; enters India through Himachal Pradesh near Shipki La.",
    states: "Himachal Pradesh → Punjab",
    tributaries: "Spiti, Baspa and other Himalayan tributaries.",
    end: "Joins the Beas at Harike and continues through the Indus river system in Pakistan.",
    governance: "Bhakra-Nangal Project; Indus Waters Treaty framework.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  ravi: {
    origin: "Himalayan region of Himachal Pradesh.",
    states: "Himachal Pradesh → Punjab",
    tributaries: "Budhil, Siul and other Himalayan tributaries.",
    end: "Flows into Pakistan and joins the Chenab system.",
    governance: "Indus Waters Treaty framework; Ranjit Sagar/Thien Dam is a major basin project.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  beas: {
    origin: "Beas Kund near Rohtang Pass, Himachal Pradesh.",
    states: "Himachal Pradesh → Punjab",
    tributaries: "Parbati, Binwa, Banganga and other tributaries.",
    end: "Joins the Sutlej at Harike, Punjab.",
    governance: "Beas Project / Pong Dam; Indus Waters Treaty framework.",
    sourceUrl: "https://www.jalshakti-dowr.gov.in/",
  },
  mahi: {
    origin: "Vindhya Range, Madhya Pradesh.",
    states: "Madhya Pradesh → Rajasthan → Gujarat",
    tributaries: "Som, Anas and Panam among important tributaries.",
    end: "Gulf of Khambhat (Arabian Sea).",
    governance: "Mahi Bajaj Sagar Project and basin water-resources management.",
    sourceUrl: "https://indiawris.gov.in/downloads/Mahi%20Basin.pdf",
  },
};

function riverKey(value) {
  const n = normalizeName(value).replace(/\briver\b/g, "").trim();
  const aliases = {
    "ganga river": "ganga", ganges: "ganga", "ganges river": "ganga", gang: "ganga",
    yamuna: "yamuna", jamuna: "yamuna", "yamuna river": "yamuna",
    brahmaputra: "brahmaputra", "brahmaputra river": "brahmaputra", siang: "brahmaputra", dihang: "brahmaputra",
    indus: "indus", "indus river": "indus", sindhu: "indus",
    narmada: "narmada", narbada: "narmada", "narmada river": "narmada",
    godavari: "godavari", krishna: "krishna",
    mahanadi: "mahanadi", cauvery: "cauvery", kaveri: "cauvery",
    tapi: "tapi", tapti: "tapi",
    son: "son", sone: "son", gandak: "gandak",
    kosi: "kosi", koshi: "kosi", ghaghara: "ghaghara", ghaghar: "ghaghara",
    chambal: "chambal", betwa: "betwa", jhelum: "jhelum",
    sutlej: "sutlej", satluj: "sutlej", ravi: "ravi", beas: "beas", mahi: "mahi",
  };
  return aliases[n] || n;
}

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
  {
    id: "mapping2026",
    title: "Mapping Class 2026",
    short: "Prelims map revision",
    icon: "◎",
    key: "mapping2026",
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

function externalFeatureName(feature) {
  const p = feature?.properties || {};
  return (
    p.name ||
    p.NAME ||
    p.NAME_EN ||
    p.NAME_LOC ||
    p.NAME_ALT ||
    p.name_en ||
    p.name_local ||
    p.protectedAreaName ||
    p.protected_area ||
    p.PA_NAME ||
    p.PAName ||
    p.site_name ||
    p.PORT_NAME ||
    p.port_name ||
    p.mine_name ||
    p.MINE_NAME ||
    p.mine ||
    p.Mine ||
    p.crop_name ||
    p.CROP_NAME ||
    p.crop ||
    p.Crop ||
    p.cropname ||
    p.uid ||
    p.OBJECTID ||
    "Verified map feature"
  );
}

function externalFeatureMatchesName(featureName, targetName) {
  const a = normalizeName(featureName);
  const b = normalizeName(targetName);
  if (!a || !b) return false;
  if (a === b) return true;

  const compact = (value) =>
    value
      .replace(/national park/g, "")
      .replace(/national parks/g, "")
      .replace(/wildlife sanctuary/g, "")
      .replace(/wildlife sanctuaries/g, "")
      .replace(/tiger reserve/g, "")
      .replace(/tiger reserves/g, "")
      .replace(/protected area/g, "")
      .replace(/np$/g, "")
      .replace(/tr$/g, "")
      .replace(/wls$/g, "")
      .trim();

  return compact(a) === compact(b);
}

function geoJsonFeatureToMapItem(feature, index, type) {
  const name = externalFeatureName(feature);
  if (!name || !feature?.geometry) return null;

  const geometry = feature.geometry;
  const coordinates =
    geometry?.type === "Point" && Array.isArray(geometry.coordinates)
      ? geometry.coordinates
      : null;

  return {
    id: `external-${type}-${index}-${normalizeName(name).replace(/[^a-z0-9]+/g, "-")}`,
    name,
    type,
    geometry,
    coordinates,
    properties: feature.properties || {},
    source: "Verified external GeoJSON",
    sourceUrl: Array.isArray(FEATURE_GEOJSON_SOURCES[type]) ? FEATURE_GEOJSON_SOURCES[type][0] : (FEATURE_GEOJSON_SOURCES[type] || ""),
  };
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
   DATA-DRIVEN TIMED TEST BANK
   ============================================================ */

function buildTimedQuestionBank(knowledge) {
  const states = Object.values(knowledge || {}).filter(Boolean);
  if (states.length < 4) return [];

  const questions = [];
  const categories = [
    ["rivers", "river"],
    ["relief", "relief feature"],
    ["ecology", "protected area"],
    ["minerals", "mineral/resource"],
    ["crops", "crop"],
    ["coastal", "coastal feature"],
  ];

  for (const state of states) {
    if (state.capital && !String(state.capital).toLowerCase().includes("unavailable")) {
      questions.push({
        q: `Which State / UT has ${state.capital} as its capital?`,
        options: [],
        answerStateId: state.id,
        explanation: `${state.capital} is listed as the capital of ${state.name} in the Bharat Darshan data.`,
      });
    }

    for (const [key, label] of categories) {
      const items = Array.isArray(state[key]) ? state[key] : [];
      for (const raw of items.slice(0, 3)) {
        const item = String(raw || "").trim();
        if (!item || item.toLowerCase().includes("unavailable")) continue;
        questions.push({
          q: `Which State / UT is associated with ${item}?`,
          options: [],
          answerStateId: state.id,
          explanation: `${item} is listed under ${label} for ${state.name} in the Bharat Darshan data.`,
        });
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const question of questions) {
    const key = question.q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const answerState = knowledge[question.answerStateId];
    if (!answerState) continue;
    const distractors = states
      .filter((state) => state.id !== answerState.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const optionStates = [answerState, ...distractors].sort(() => Math.random() - 0.5);
    unique.push({
      ...question,
      options: optionStates.map((state) => state.name),
      answer: optionStates.findIndex((state) => state.id === answerState.id),
    });
  }

  return unique;
}

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


const GEOMETRY_BOUNDS_CACHE = new WeakMap();

function geometryBounds(geometry) {
  if (!geometry || typeof geometry !== "object") return null;
  const cached = GEOMETRY_BOUNDS_CACHE.get(geometry);
  if (cached) return cached;

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  function visit(value) {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1])) &&
      !Array.isArray(value[0])
    ) {
      const lon = Number(value[0]);
      const lat = Number(value[1]);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    value.forEach(visit);
  }

  visit(geometry.coordinates);

  const result =
    Number.isFinite(minLon) &&
    Number.isFinite(maxLon) &&
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat)
      ? { minLon, maxLon, minLat, maxLat }
      : null;

  GEOMETRY_BOUNDS_CACHE.set(geometry, result);
  return result;
}

function boundsOverlap(a, b) {
  if (!a || !b) return true;
  return !(
    a.maxLon < b.minLon ||
    a.minLon > b.maxLon ||
    a.maxLat < b.minLat ||
    a.minLat > b.maxLat
  );
}

function simplifyLineCoordinates(points, tolerance = 0.018) {
  if (!Array.isArray(points) || points.length <= 2) return points || [];

  const sqTolerance = tolerance * tolerance;
  const squaredDistance = (p1, p2) => {
    const dx = Number(p1?.[0]) - Number(p2?.[0]);
    const dy = Number(p1?.[1]) - Number(p2?.[1]);
    return dx * dx + dy * dy;
  };

  const getSqSegDist = (p, p1, p2) => {
    let x = p1[0];
    let y = p1[1];
    let dx = p2[0] - x;
    let dy = p2[1] - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2[0];
        y = p2[1];
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
  };

  const simplifyRadial = (coords) => {
    let previous = coords[0];
    const kept = [previous];
    for (let i = 1; i < coords.length; i += 1) {
      const point = coords[i];
      if (squaredDistance(point, previous) > sqTolerance) {
        kept.push(point);
        previous = point;
      }
    }
    if (previous !== coords[coords.length - 1]) kept.push(coords[coords.length - 1]);
    return kept;
  };

  const simplifyDouglasPeucker = (coords) => {
    const markers = new Uint8Array(coords.length);
    markers[0] = markers[coords.length - 1] = 1;
    const stack = [[0, coords.length - 1]];

    while (stack.length) {
      const [first, last] = stack.pop();
      let maxSqDist = sqTolerance;
      let index = -1;

      for (let i = first + 1; i < last; i += 1) {
        const sqDist = getSqSegDist(coords[i], coords[first], coords[last]);
        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (index !== -1) {
        markers[index] = 1;
        stack.push([first, index], [index, last]);
      }
    }

    return coords.filter((_, index) => markers[index]);
  };

  return simplifyDouglasPeucker(simplifyRadial(points));
}

function simplifyGeometryForMap(geometry) {
  if (!geometry) return geometry;
  if (geometry.type === "LineString") {
    return {
      ...geometry,
      coordinates: simplifyLineCoordinates(geometry.coordinates, 0.018),
    };
  }
  if (geometry.type === "MultiLineString") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((line) =>
        simplifyLineCoordinates(line, 0.018)
      ),
    };
  }
  return geometry;
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
  /*
    IMPORTANT:
    Rivers are LineString/MultiLineString features, so they do not have
    feature.coordinates directly. Use the verified geometry's representative
    point as the card anchor. This keeps the river intelligence card on-map
    instead of silently returning null.
  */
  const coordinates =
    feature?.coordinates ||
    (feature?.geometry
      ? geometryRepresentativePointSafe(feature.geometry)
      : null);

  if (!Array.isArray(coordinates)) return null;

  const [lon, lat] = coordinates;
  if (
    !Number.isFinite(Number(lon)) ||
    !Number.isFinite(Number(lat))
  ) {
    return null;
  }

  return projectPoint(
    [Number(lon), Number(lat)],
    bounds,
    width,
    height
  );
}

function geometryRepresentativePointSafe(geometry) {
  if (!geometry || !geometry.type) return null;

  if (
    geometry.type === "Point" &&
    Array.isArray(geometry.coordinates)
  ) {
    return geometry.coordinates;
  }

  if (
    geometry.type === "MultiPoint" &&
    Array.isArray(geometry.coordinates)
  ) {
    return geometry.coordinates.find(
      (point) =>
        Array.isArray(point) &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1]))
    ) || null;
  }

  if (
    geometry.type === "LineString" &&
    Array.isArray(geometry.coordinates)
  ) {
    return (
      geometry.coordinates[
        Math.floor(geometry.coordinates.length / 2)
      ] || null
    );
  }

  if (
    geometry.type === "MultiLineString" &&
    Array.isArray(geometry.coordinates)
  ) {
    const lines = geometry.coordinates.filter(
      (line) => Array.isArray(line) && line.length
    );
    if (!lines.length) return null;

    const line = lines[Math.floor(lines.length / 2)];
    return line[Math.floor(line.length / 2)] || null;
  }

  if (
    geometry.type === "Polygon" &&
    Array.isArray(geometry.coordinates?.[0])
  ) {
    const ring = geometry.coordinates[0];
    return ring[Math.floor(ring.length / 2)] || null;
  }

  if (
    geometry.type === "MultiPolygon" &&
    Array.isArray(geometry.coordinates)
  ) {
    const polygon = geometry.coordinates.find(
      (item) =>
        Array.isArray(item) &&
        Array.isArray(item[0]) &&
        item[0].length
    );
    if (!polygon) return null;

    const ring = polygon[0];
    return ring[Math.floor(ring.length / 2)] || null;
  }

  return null;
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
    mapping2026: "#8b6f47",
  };

  return map[mode] || "#b08a42";
}

/* ============================================================
   MAPPING CLASS 2026 — source-aligned learning deck
   ============================================================ */

const MAPPING_CLASS_SECTIONS = [
  { id: "rivers", label: "Rivers", icon: "≈" },
  { id: "relief", label: "Ranges", icon: "△" },
  { id: "passes", label: "Passes", icon: "⌁" },
  { id: "ecology", label: "Parks / Tiger", icon: "♧" },
  { id: "wetlands", label: "Wetlands", icon: "≈" },
  { id: "biosphereReserves", label: "Biosphere", icon: "◌" },
  { id: "soils", label: "Soils", icon: "◆" },
  { id: "unesco", label: "UNESCO", icon: "◇" },
  { id: "ports", label: "Ports", icon: "⚓" },
];

function mappingStateName(value) {
  return normalizeName(value).replace(/\bstate\b/g, "").trim();
}

function mappingStateId(knowledge, stateName) {
  const wanted = mappingStateName(stateName);
  const found = Object.entries(knowledge).find(([, state]) => mappingStateName(state?.name) === wanted);
  return found?.[0] || null;
}

function mappingEntries(category) {
  return Object.entries(MAPPING_CLASS_2026?.[category] || {}).map(([name, states]) => ({
    name,
    states: Array.isArray(states) ? states : [],
  }));
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
  const [mapLayerVisible, setMapLayerVisible] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");

  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const [progress, setProgress] = useState({});

  const [reportFilter, setReportFilter] = useState("all");

  const [mappingCategory, setMappingCategory] = useState("rivers");
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingRecallIndex, setMappingRecallIndex] = useState(0);
  const [mappingRecallRevealed, setMappingRecallRevealed] = useState(false);
  const [mappingQuizIndex, setMappingQuizIndex] = useState(0);
  const [mappingQuizAnswer, setMappingQuizAnswer] = useState(null);
  const [mappingQuizScore, setMappingQuizScore] = useState(0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedMapFeature(null);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const [timedMode, setTimedMode] = useState(null);
  const [timedStarted, setTimedStarted] = useState(false);
  const [timedFinished, setTimedFinished] = useState(false);
  const [timedIndex, setTimedIndex] = useState(0);
  const [timedScore, setTimedScore] = useState(0);
  const [timedCorrect, setTimedCorrect] = useState(0);
  const [timedWrong, setTimedWrong] = useState(0);
  const [timedAnswer, setTimedAnswer] = useState(null);
  const [timedAnswered, setTimedAnswered] = useState(false);
  const [timedTimeLeft, setTimedTimeLeft] = useState(0);
  const [timedQuestions, setTimedQuestions] = useState([]);

  const [externalFeatureData, setExternalFeatureData] = useState({});
  const [externalFeatureLoading, setExternalFeatureLoading] = useState(false);
  const [externalFeatureError, setExternalFeatureError] = useState("");

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
     EXTERNAL VERIFIED FEATURE GEOMETRY
     ========================================================== */
  useEffect(() => {
    const sourceKey =
      mode === "rivers"
        ? "rivers"
        : mode === "mountains"
        ? "mountains"
        : mode === "ecology"
        ? "ecology"
        : mode === "minerals"
        ? "minerals"
        : mode === "agriculture"
        ? "agriculture"
        : mode === "coastal"
        ? "coastal"
        : null;

    if (!sourceKey) return;

    let cancelled = false;

    async function loadExternalFeatures() {
      // Do not refetch an already-loaded layer when the user revisits a mode.
      if (externalFeatureData[sourceKey]) return;

      setExternalFeatureLoading(true);
      setExternalFeatureError("");

      try {
        const urls = Array.isArray(FEATURE_GEOJSON_SOURCES[sourceKey])
          ? FEATURE_GEOJSON_SOURCES[sourceKey]
          : [FEATURE_GEOJSON_SOURCES[sourceKey]];

        let features = [];

        // Fetch the primary source first. The previous Promise.allSettled
        // downloaded the huge CWC layer AND its fallback simultaneously,
        // which caused the Rivers tab to become noticeably sluggish.
        for (const url of urls) {
          try {
            const response = await fetch(url, { cache: "force-cache" });
            if (!response.ok) throw new Error(`Feature layer request failed (${response.status})`);
            const payload = await response.json();
            if (Array.isArray(payload?.features) && payload.features.length) {
              features = payload.features;
              break;
            }
          } catch (sourceError) {
            // Try the next verified fallback source only when necessary.
          }
        }

        if (!features.length) {
          throw new Error("No verified feature geometry was returned.");
        }

        if (!cancelled) {
          setExternalFeatureData((previous) => ({
            ...previous,
            [sourceKey]: features,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setExternalFeatureError(
            error?.message ||
              "Feature geometry could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setExternalFeatureLoading(false);
        }
      }
    }

    loadExternalFeatures();

    return () => {
      cancelled = true;
    };
  }, [mode]);

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

  const timedQuestionPool = useMemo(
    () => buildTimedQuestionBank(knowledge),
    [knowledge]
  );

  const currentTimedQuestion =
    timedQuestions[timedIndex] || null;

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
      case "mapping2026":
        return "Mapping Class 2026";
      default:
        return "State Overview";
    }
  }

  function geometryRepresentativePoint(geometry) {
    if (!geometry || !geometry.type) return null;

    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
      const [lon, lat] = geometry.coordinates;
      return Number.isFinite(Number(lon)) && Number.isFinite(Number(lat))
        ? [Number(lon), Number(lat)]
        : null;
    }

    if (geometry.type === "MultiPoint" && Array.isArray(geometry.coordinates)) {
      return geometry.coordinates.find(
        (point) =>
          Array.isArray(point) &&
          Number.isFinite(Number(point[0])) &&
          Number.isFinite(Number(point[1]))
      ) || null;
    }

    if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
      return geometry.coordinates[Math.floor(geometry.coordinates.length / 2)] || null;
    }

    if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
      const line = geometry.coordinates.find((x) => Array.isArray(x) && x.length);
      return line ? line[Math.floor(line.length / 2)] : null;
    }

    if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
      const ring = geometry.coordinates.find((x) => Array.isArray(x) && x.length);
      return ring ? ring[Math.floor(ring.length / 2)] : null;
    }

    if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
      for (const polygon of geometry.coordinates) {
        const ring = Array.isArray(polygon)
          ? polygon.find((x) => Array.isArray(x) && x.length)
          : null;
        if (ring?.length) return ring[Math.floor(ring.length / 2)];
      }
    }

    return null;
  }

  function pointInRing(point, ring) {
    if (!Array.isArray(point) || !Array.isArray(ring) || ring.length < 3) return false;
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = Number(ring[i]?.[0]);
      const yi = Number(ring[i]?.[1]);
      const xj = Number(ring[j]?.[0]);
      const yj = Number(ring[j]?.[1]);
      if (![xi, yi, xj, yj].every(Number.isFinite)) continue;

      const intersects =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
      if (intersects) inside = !inside;
    }

    return inside;
  }

  function pointInGeometry(point, geometry) {
    if (!point || !geometry) return false;

    if (geometry.type === "Polygon") {
      const rings = geometry.coordinates || [];
      if (!rings.length || !pointInRing(point, rings[0])) return false;
      return !rings.slice(1).some((hole) => pointInRing(point, hole));
    }

    if (geometry.type === "MultiPolygon") {
      return (geometry.coordinates || []).some((polygon) => {
        if (!polygon?.length || !pointInRing(point, polygon[0])) return false;
        return !polygon.slice(1).some((hole) => pointInRing(point, hole));
      });
    }

    return false;
  }

  function geometryIntersectsState(
    geometry,
    stateGeometry
  ) {
    if (!geometry || !stateGeometry) return false;

    // Fast reject before expensive point-in-polygon work. This matters
    // heavily for the CWC river network on mobile devices.
    if (!boundsOverlap(geometryBounds(geometry), geometryBounds(stateGeometry))) {
      return false;
    }

    const points = [];

    function collectPoints(g) {
      if (!g) return;

      if (g.type === "Point") {
        if (Array.isArray(g.coordinates)) {
          points.push(g.coordinates);
        }
        return;
      }

      if (
        g.type === "LineString" ||
        g.type === "MultiPoint"
      ) {
        if (Array.isArray(g.coordinates)) {
          g.coordinates.forEach((point) => {
            if (Array.isArray(point)) {
              points.push(point);
            }
          });
        }
        return;
      }

      if (
        g.type === "MultiLineString" ||
        g.type === "Polygon"
      ) {
        if (Array.isArray(g.coordinates)) {
          g.coordinates.forEach((part) => {
            if (Array.isArray(part)) {
              part.forEach((point) => {
                if (
                  Array.isArray(point) &&
                  Number.isFinite(Number(point[0])) &&
                  Number.isFinite(Number(point[1]))
                ) {
                  points.push(point);
                }
              });
            }
          });
        }
        return;
      }

      if (g.type === "MultiPolygon") {
        if (Array.isArray(g.coordinates)) {
          g.coordinates.forEach((polygon) =>
            polygon.forEach((ring) =>
              ring.forEach((point) => {
                if (
                  Array.isArray(point) &&
                  Number.isFinite(Number(point[0])) &&
                  Number.isFinite(Number(point[1]))
                ) {
                  points.push(point);
                }
              })
            )
          );
        }
      }
    }

    collectPoints(geometry);

    return points.some((point) =>
      pointInGeometry(point, stateGeometry)
    );
  }

  function geometryIntersectsAnyIndiaState(geometry, stateFeatures) {
    if (!geometry || !Array.isArray(stateFeatures) || !stateFeatures.length) {
      return false;
    }

    return stateFeatures.some((stateItem) =>
      stateItem?.feature?.geometry &&
      geometryIntersectsState(geometry, stateItem.feature.geometry)
    );
  }

  function featureInsideSelectedState(feature, stateId) {
    if (!stateId) return false;
    const stateFeature = geoData?.find((item) => item.id === stateId)?.feature;
    const geometry = feature?.geometry;
    if (!stateFeature?.geometry || !geometry) return false;

    const point = geometryRepresentativePoint(geometry);
    return pointInGeometry(point, stateFeature.geometry);
  }

  const verifiedIndiaRiverFeatures = useMemo(() => {
    const sourceFeatures = externalFeatureData.rivers || [];
    if (!sourceFeatures.length || !geoData?.length) return [];

    // This expensive national filter runs only when the downloaded river
    // layer or verified State/UT geometry changes — not on every state click.
    return sourceFeatures.filter((feature) => {
      const geometry = feature?.geometry;
      if (!geometry) return false;
      return geometryIntersectsAnyIndiaState(geometry, geoData);
    });
  }, [externalFeatureData.rivers, geoData]);

  const externalLayerItems = useMemo(() => {
    const sourceKey =
      mode === "rivers"
        ? "rivers"
        : mode === "mountains"
        ? "mountains"
        : mode === "ecology"
        ? "ecology"
        : mode === "minerals"
        ? "minerals"
        : mode === "agriculture"
        ? "agriculture"
        : mode === "coastal"
        ? "coastal"
        : null;

    if (!sourceKey) return [];

    const sourceFeatures =
      mode === "rivers"
        ? verifiedIndiaRiverFeatures
        : externalFeatureData[sourceKey] || [];

    const selectedStateFeature = selectedId
      ? geoData?.find((item) => item.id === selectedId)?.feature
      : null;

    const targetNames = selectedId
      ? getModeItemsForSearch(knowledge[selectedId], mode)
      : Object.values(knowledge).flatMap((state) =>
          getModeItemsForSearch(state, mode)
        );

    const broadLayer =
      mode === "mountains" ||
      mode === "minerals" ||
      mode === "agriculture";

    const seen = new Set();

    /*
      RIVERS:
      - If a State/UT is selected, show every verified river geometry
        that actually intersects that polygon.
      - Do not rely only on the static data names.
      - If no State/UT is selected, show the verified national river network.
      - No centroid, nearest-state or approximate placement is used.
    */
    return sourceFeatures
      .map((feature, index) => {
        const name = externalFeatureName(feature);
        if (!name) return null;

        const item = geoJsonFeatureToMapItem(
          feature,
          index,
          sourceKey
        );

        if (!item) return null;

        const matchedTarget = targetNames.find((target) =>
          externalFeatureMatchesName(name, target)
        );

        if (
          !matchedTarget &&
          !broadLayer &&
          mode !== "rivers"
        ) {
          return null;
        }

        if (broadLayer) {
          if (!selectedId) return null;

          const propertyStateId = canonicalId(
            item.properties || {}
          );

          const insideSelectedState =
            featureInsideSelectedState(
              item,
              selectedId
            );

          if (
            propertyStateId &&
            propertyStateId !== selectedId
          ) {
            return null;
          }

          if (
            !propertyStateId &&
            !insideSelectedState
          ) {
            return null;
          }
        }

        if (mode === "rivers" && selectedStateFeature?.geometry) {
          if (!geometryIntersectsState(item.geometry, selectedStateFeature.geometry)) {
            return null;
          }
        }

        /*
          Keep verified geometry segments. We intentionally do not
          deduplicate by river name because doing so can hide portions
          of a long river such as Ganga, Yamuna or Indus.
        */
        const key = `${normalizeName(name)}-${index}`;
        if (seen.has(key)) return null;
        seen.add(key);

        const propertyStateId = canonicalId(
          item.properties || {}
        );

        const resolvedStateId =
          propertyStateId ||
          (selectedId && mode === "rivers"
            ? selectedId
            : matchedTarget && selectedId
            ? selectedId
            : null);

        return {
          ...item,
          matchedName: matchedTarget || name,
          stateId: resolvedStateId,
          matchedTarget: matchedTarget || null,
        };
      })
      .filter(Boolean);
  }, [
    mode,
    selectedId,
    externalFeatureData,
    knowledge,
    geoData,
    verifiedIndiaRiverFeatures,
  ]);

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
      case "mapping2026":
        return [];
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

  function getFeatureIntelligence(feature) {
    if (!feature) return null;

    const state = feature.stateId ? knowledge[feature.stateId] : null;
    const props = feature.properties || {};
    const featureName = feature.name || feature.matchedName || props.name || props.NAME || "Map feature";

    if (mode === "rivers" || feature.type === "rivers") {
      const river = RIVER_INTELLIGENCE[riverKey(featureName)];
      const facts = [];
      if (river) {
        facts.push(
          { label: "Origin", value: river.origin },
          { label: "States of flow", value: river.states },
          { label: "Tributaries", value: river.tributaries },
          { label: "End / outlet", value: river.end },
          { label: "Project / treaty", value: river.governance },
        );
      } else {
        const propertyPairs = [
          ["Origin", props.origin || props.ORIGIN || props.source_name],
          ["Basin", props.basin || props.BASIN || props.basin_name],
          ["Tributaries", props.tributaries || props.TRIBUTARIES],
          ["End / outlet", props.outlet || props.OUTLET || props.mouth || props.MOUTH],
          ["State", props.state || props.STATE || props.state_name || props.ST_NM],
        ].filter(([, value]) => value !== undefined && value !== null && String(value).trim());
        propertyPairs.forEach(([label, value]) => facts.push({ label, value: Array.isArray(value) ? value.join(", ") : String(value) }));
      }

      if (!facts.length) {
        facts.push({ label: "Verified status", value: "River-specific intelligence is not available in the verified source for this feature." });
      }

      return {
        name: featureName,
        stateName: state?.name || props.state || props.STATE || "India",
        modeLabel: "Rivers",
        facts,
        description: river
          ? "UPSC river intelligence: source, Indian course, major tributaries, outlet and verified governance/project context."
          : "Verified river geometry selected. River-specific fields are shown only when supported by the verified dataset.",
        sourceUrl: river?.sourceUrl || feature.sourceUrl || "https://indiawris.gov.in/",
        river: true,
      };
    }

    const staticItems = state
      ? (mode === "mountains" ? state.relief : mode === "ecology" ? state.ecology : mode === "minerals" ? state.minerals : mode === "agriculture" ? state.crops : mode === "coastal" ? state.coastal : mode === "climate" ? [state.climate] : [])
      : [];

    const propertyPairs = [
      ["Origin", props.origin || props.ORIGIN || props.source_name],
      ["Basin", props.basin || props.BASIN || props.basin_name],
      ["Tributaries", props.tributaries || props.TRIBUTARIES],
      ["Elevation", props.elevation || props.ELEVATION || props.elev],
      ["Range", props.range || props.RANGE || props.mountain_range],
      ["Category", props.category || props.CATEGORY || props.type],
      ["State", props.state || props.STATE || props.state_name || props.ST_NM],
      ["District", props.district || props.DISTRICT || props.district_name],
      ["Crop", props.crop || props.CROP || props.crop_name],
      ["Production", props.production || props.PRODUCTION],
      ["Mineral", props.mineral || props.MINERAL || props.mine_name],
      ["Protected area", props.protected_area || props.PA_NAME || props.site_name],
      ["Port type", props.port_type || props.PORT_TYPE],
    ].filter(([, value]) => value !== undefined && value !== null && String(value).trim());

    const facts = [];
    const seen = new Set();
    for (const [label, value] of propertyPairs) {
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      const key = `${label}:${text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({ label, value: text });
      if (facts.length >= 4) break;
    }
    if (!facts.length && staticItems.length) facts.push({ label: "Static association", value: staticItems.slice(0, 5).join(" • ") });
    if (state?.capital && facts.length < 4) facts.push({ label: "State capital", value: state.capital });
    if (state?.region && facts.length < 4) facts.push({ label: "Region", value: state.region });

    return {
      name: featureName,
      stateName: state?.name || props.state || props.STATE || "India",
      modeLabel: getModeLabel(),
      facts,
      description: feature.description || props.description || props.DESCRIPTION || "Verified map feature linked to Bharat Darshan geography data.",
      sourceUrl: feature.sourceUrl || "",
      river: false,
    };
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
    if (!feature) return;
    setSelectedMapFeature({ ...feature, stateId });
    if (stateId && knowledge[stateId]) {
      setSelectedId(stateId);
      setMobilePanelOpen(false);
    }
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
    { id: "10-5", title: "10 / 5", questions: 10, minutes: 5 },
    { id: "25-10", title: "25 / 10", questions: 25, minutes: 10 },
    { id: "50-20", title: "50 / 20", questions: 50, minutes: 20 },
  ];

  function formatTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    const remaining = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }

  function finishTimedTest() {
    setTimedFinished(true);
    setTimedStarted(false);
    setTimedAnswered(false);
    setTimedAnswer(null);
  }

  function startTimedTest(option) {
    const pool = [...timedQuestionPool].sort(() => Math.random() - 0.5);
    const selectedQuestions = pool.slice(0, option.questions);
    if (selectedQuestions.length < option.questions) return;

    setTimedMode(option);
    setTimedQuestions(selectedQuestions);
    setTimedStarted(true);
    setTimedFinished(false);
    setTimedIndex(0);
    setTimedScore(0);
    setTimedCorrect(0);
    setTimedWrong(0);
    setTimedAnswer(null);
    setTimedAnswered(false);
    setTimedTimeLeft(option.minutes * 60);
  }

  function answerTimed(index) {
    if (!currentTimedQuestion || timedAnswered) return;

    const correct = index === currentTimedQuestion.answer;
    setTimedAnswer(index);
    setTimedAnswered(true);

    if (correct) {
      setTimedCorrect((value) => value + 1);
      setTimedScore((value) => value + 1);
    } else {
      setTimedWrong((value) => value + 1);
      setTimedScore((value) => Math.max(0, value - 0.33));
    }
  }

  function nextTimedQuestion() {
    if (!timedQuestions.length) return;
    if (timedIndex >= timedQuestions.length - 1) {
      finishTimedTest();
      return;
    }
    setTimedIndex((value) => value + 1);
    setTimedAnswer(null);
    setTimedAnswered(false);
  }

  useEffect(() => {
    if (!timedStarted || timedFinished) return;
    if (timedTimeLeft <= 0) {
      finishTimedTest();
      return;
    }
    const timer = window.setInterval(() => {
      setTimedTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timedStarted, timedFinished, timedTimeLeft]);

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

        button:not(:disabled) {
          transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        }

        button:not(:disabled):hover {
          transform: translateY(-1px);
        }

        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid ${ui.gold};
          outline-offset: 2px;
        }

        .bd-shell {
          width: min(1480px, calc(100% - 28px));
          margin: 0 auto;
          padding: 18px 0 calc(42px + env(safe-area-inset-bottom, 0px) + 96px);
        }

        .bd-scroll {
          scrollbar-width: thin;
        }

        .bd-feature-intelligence {
          scroll-margin-bottom: 120px;
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

          .bd-timed-options {
            grid-template-columns: 1fr !important;
          }
        }


        @media (max-width: 760px) {
          .bd-feature-intelligence {
            margin-bottom: 18px;
            padding: 14px !important;
          }

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
                  setSelectedMapFeature(null);
                  setMapLayerVisible(true);
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
            MAPPING CLASS 2026
        ==================================================== */}
        {mode === "mapping2026" ? (() => {
          const entries = mappingEntries(mappingCategory);
          const filteredEntries = entries.filter((entry) => {
            const haystack = `${entry.name} ${entry.states.join(" ")}`.toLowerCase();
            return haystack.includes(mappingSearch.toLowerCase().trim());
          });
          const recallPool = entries.length ? entries : [{ name: "No item", states: [] }];
          const recallItem = recallPool[mappingRecallIndex % recallPool.length];
          const quizPool = entries.length ? entries : [{ name: "No item", states: [] }];
          const quizItem = quizPool[mappingQuizIndex % quizPool.length];
          const quizCorrect = quizItem.states[0] || "—";
          const quizOptions = [quizCorrect, ...Object.values(knowledge).map((state) => state?.name).filter((name) => name && name !== quizCorrect && !quizItem.states.includes(name)).slice(0, 3)];
          const sourceNotes = Array.isArray(MAPPING_CLASS_NOTES_2026) ? MAPPING_CLASS_NOTES_2026 : [];

          return (
            <section style={{ marginBottom: 16, padding: 16, borderRadius: 22, border: `1px solid ${ui.line}`, background: ui.surface, boxShadow: ui.shadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 950, letterSpacing: "1.4px", color: modeAccent }}>MAPPING CLASS • 2026 PRELIMS</div>
                  <h2 style={{ margin: "6px 0 3px", fontSize: 22, letterSpacing: "-0.8px" }}>India Map Revision Deck</h2>
                  <div style={{ color: ui.muted, fontSize: 10, lineHeight: 1.55 }}>Source-aligned map associations from the uploaded Mapping Class 2026 material, organised for active recall and Prelims revision.</div>
                </div>
                <div style={{ padding: "7px 10px", borderRadius: 999, background: `${modeAccent}12`, border: `1px solid ${modeAccent}45`, color: modeAccent, fontSize: 8, fontWeight: 950 }}>
                  {Object.values(MAPPING_CLASS_2026 || {}).reduce((n, group) => n + Object.keys(group || {}).length, 0)} mapped items
                </div>
              </div>

              <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "14px 0 10px" }}>
                {MAPPING_CLASS_SECTIONS.map((section) => {
                  const active = mappingCategory === section.id;
                  const count = Object.keys(MAPPING_CLASS_2026?.[section.id] || {}).length;
                  return (
                    <button key={section.id} type="button" onClick={() => { setMappingCategory(section.id); setMappingSearch(""); setMappingRecallIndex(0); setMappingRecallRevealed(false); setMappingQuizIndex(0); setMappingQuizAnswer(null); setMappingQuizScore(0); }} style={{ flex: "0 0 auto", border: `1px solid ${active ? modeAccent : ui.line}`, background: active ? `${modeAccent}15` : ui.surface2, color: ui.text, borderRadius: 12, padding: "8px 10px", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: 8, fontWeight: 950 }}>{section.icon} {section.label}</div>
                      <div style={{ marginTop: 3, color: ui.muted, fontSize: 7 }}>{count} items</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(270px, .65fr)", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9 }}>
                    <input value={mappingSearch} onChange={(e) => setMappingSearch(e.target.value)} placeholder="Search mapped feature or state…" style={{ flex: 1, minWidth: 0, border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 11, padding: "9px 11px", outline: "none", fontSize: 9 }} />
                    <span style={{ fontSize: 8, color: ui.muted, whiteSpace: "nowrap" }}>{filteredEntries.length} results</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8, maxHeight: 390, overflowY: "auto", paddingRight: 2 }}>
                    {filteredEntries.map((entry) => (
                      <button key={entry.name} type="button" onClick={() => { const id = mappingStateId(knowledge, entry.states[0]); if (id) setSelectedId(id); setSelectedMapFeature(null); }} style={{ border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 13, padding: 11, textAlign: "left", cursor: "pointer" }}>
                        <div style={{ fontSize: 10, fontWeight: 950 }}>{entry.name}</div>
                        <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {entry.states.map((state) => <span key={state} style={{ padding: "4px 6px", borderRadius: 999, border: `1px solid ${modeAccent}35`, background: `${modeAccent}0d`, color: ui.text, fontSize: 7, fontWeight: 800 }}>{state}</span>)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ padding: 13, borderRadius: 15, border: `1px solid ${ui.line}`, background: ui.surface2 }}>
                    <div style={{ fontSize: 8, color: modeAccent, fontWeight: 950, letterSpacing: ".9px" }}>ACTIVE RECALL</div>
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900 }}>Where is {recallItem.name}?</div>
                    {mappingRecallRevealed ? <div style={{ marginTop: 8, color: ui.text, fontSize: 9, lineHeight: 1.55 }}>{recallItem.states.join(", ") || "No state association in the source dataset."}</div> : <div style={{ marginTop: 8, color: ui.muted, fontSize: 9 }}>Think first. Then reveal the mapped states.</div>}
                    <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
                      <button type="button" onClick={() => setMappingRecallRevealed(true)} style={{ border: 0, borderRadius: 9, padding: "8px 10px", background: modeAccent, color: "#111", fontWeight: 900, fontSize: 8, cursor: "pointer" }}>REVEAL</button>
                      <button type="button" onClick={() => { setMappingRecallIndex((v) => (v + 1) % recallPool.length); setMappingRecallRevealed(false); }} style={{ border: `1px solid ${ui.line}`, borderRadius: 9, padding: "8px 10px", background: ui.surface, color: ui.text, fontWeight: 900, fontSize: 8, cursor: "pointer" }}>NEXT</button>
                    </div>
                  </div>

                  <div style={{ padding: 13, borderRadius: 15, border: `1px solid ${ui.line}`, background: ui.surface2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div style={{ fontSize: 8, color: modeAccent, fontWeight: 950, letterSpacing: ".9px" }}>QUICK MAP QUIZ</div><div style={{ fontSize: 8, color: ui.muted, fontWeight: 900 }}>Score {mappingQuizScore}</div></div>
                    <div style={{ marginTop: 8, fontSize: 10, fontWeight: 900 }}>Which state is linked with {quizItem.name}?</div>
                    <div style={{ display: "grid", gap: 5, marginTop: 9 }}>
                      {quizOptions.map((state) => {
                        const selected = mappingQuizAnswer === state;
                        const correct = state === quizCorrect;
                        const answered = Boolean(mappingQuizAnswer);
                        return <button key={state} type="button" onClick={() => { if (!answered) { setMappingQuizAnswer(state); if (correct) setMappingQuizScore((v) => v + 1); } }} style={{ border: `1px solid ${selected ? (correct ? modeAccent : "#b55") : ui.line}`, background: selected ? (correct ? `${modeAccent}18` : "#b5511a") : ui.surface, color: ui.text, borderRadius: 9, padding: "7px 9px", textAlign: "left", fontSize: 8, fontWeight: 800, cursor: answered ? "default" : "pointer" }}>{state}{answered && correct ? " ✓" : ""}</button>;
                      })}
                    </div>
                    <button type="button" onClick={() => { setMappingQuizIndex((v) => (v + 1) % quizPool.length); setMappingQuizAnswer(null); }} style={{ marginTop: 8, border: `1px solid ${ui.line}`, borderRadius: 9, padding: "7px 10px", background: ui.surface, color: ui.text, fontWeight: 900, fontSize: 8, cursor: "pointer" }}>NEXT QUESTION</button>
                    <div style={{ marginTop: 6, color: ui.muted, fontSize: 7 }}>Quiz uses mapped state associations; no invented coordinates are used.</div>
                  </div>
                </div>
              </div>

              {sourceNotes.length ? <div style={{ marginTop: 12, padding: 11, borderRadius: 13, border: `1px dashed ${ui.line}`, background: ui.surface2 }}>
                <div style={{ fontSize: 7, fontWeight: 950, color: modeAccent, letterSpacing: ".8px" }}>SOURCE NOTES</div>
                <ul style={{ margin: "6px 0 0", paddingLeft: 17, color: ui.muted, fontSize: 8, lineHeight: 1.55 }}>{sourceNotes.map((note) => <li key={note}>{note}</li>)}</ul>
              </div> : null}
            </section>
          );
        })() : null}

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

              <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {mode !== "explore" ? (
                  <button
                    type="button"
                    onClick={() => setMapLayerVisible((value) => !value)}
                    style={{
                      ...iconButton(ui),
                      padding: "7px 10px",
                      fontSize: 9,
                      borderColor: mapLayerVisible ? modeAccent : ui.line,
                      color: mapLayerVisible ? modeAccent : ui.muted,
                    }}
                    aria-pressed={mapLayerVisible}
                  >
                    {mapLayerVisible ? "Layer on" : "Layer off"}
                  </button>
                ) : null}

                {(selectedId || selectedMapFeature) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedMapFeature(null);
                    }}
                    style={{
                      ...iconButton(ui),
                      padding: "7px 10px",
                      fontSize: 9,
                    }}
                  >
                    Clear selection
                  </button>
                ) : null}
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
                  {loadingMap ? (
                    <div style={{ position: "absolute", inset: 12, zIndex: 3, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                      <div style={{ padding: "10px 13px", borderRadius: 999, border: `1px solid ${ui.line}`, background: ui.surface, color: ui.muted, fontSize: 9, fontWeight: 900, boxShadow: ui.shadow }}>Loading verified India map…</div>
                    </div>
                  ) : null}
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
                    {mapLayerVisible && (() => {
                      const layerKey = getGeoLayerKey(mode);
                      if (!layerKey) return null;

                      const localLayerItems = Object.entries(knowledge).flatMap(
                        ([stateId, state]) =>
                          (state.geoLayers?.[layerKey] || []).map((item) => ({
                            ...item,
                            stateId,
                          }))
                      );

                      const layerItems = [
                        ...localLayerItems,
                        ...externalLayerItems,
                      ];

                      return layerItems.map((item) => {
                        const renderGeometry =
                          item.type === "rivers"
                            ? simplifyGeometryForMap(item.geometry)
                            : item.geometry;
                        const path = featureGeometryPath(
                          renderGeometry,
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
                            pointerEvents="all"
                            onPointerDown={(event) => {
                              event.stopPropagation();
                              selectMapFeature(item, item.stateId);
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectMapFeature(item, item.stateId);
                            }}
                            onTouchStart={(event) => {
                              event.stopPropagation();
                              selectMapFeature(item, item.stateId);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                selectMapFeature(item, item.stateId);
                              }
                            }}
                            style={{ cursor: "pointer", pointerEvents: "all" }}
                          >
                            {path ? (
                              <>
                                {/* Wider invisible touch target: keeps thin river lines easy to tap on mobile. */}
                                <path
                                  d={path}
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth={item.type === "rivers" ? 14 : 14}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  pointerEvents="stroke"
                                />
                                <path
                                  d={path}
                                  fill={item.type === "ecology" ? "rgba(95,155,104,.18)" : "none"}
                                  stroke={getModeAccent(mode)}
                                  strokeWidth={isSelected ? 5 : 2.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity={isSelected ? 1 : .82}
                                  pointerEvents="stroke"
                                />
                              </>
                            ) : null}
                            {item.type === "rivers" && point && isSelected ? (
                              <circle
                                cx={point[0]}
                                cy={point[1]}
                                r="7"
                                fill={getModeAccent(mode)}
                                stroke="white"
                                strokeWidth="2.5"
                                opacity="1"
                                pointerEvents="none"
                              />
                            ) : null}
                            {point && item.type !== "rivers" ? (
                              <>
                                {/* Point markers are reserved for true point features.
                                    River LineString/MultiLineString features must stay
                                    clean: their line itself is the interaction target. */}
                                <circle
                                  cx={point[0]}
                                  cy={point[1]}
                                  r={isSelected ? 16 : 13}
                                  fill="transparent"
                                  pointerEvents="all"
                                />
                                <circle
                                  cx={point[0]}
                                  cy={point[1]}
                                  r={isSelected ? 8 : 5}
                                  fill={getModeAccent(mode)}
                                  stroke="white"
                                  strokeWidth="2"
                                  opacity={isSelected ? 1 : .9}
                                  pointerEvents="none"
                                />
                              </>
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
                      const info = getFeatureIntelligence(selectedMapFeature);
                      if (!point || !info) return null;
                      const accent = getModeAccent(mode);
                      if (info.river) {
                        const cardWidth = 340;
                        const cardHeight = 365;
                        const cardX = point[0] < 360 ? 365 : 15;
                        const cardY = Math.max(10, Math.min(245, point[1] - 110));
                        const targetX = cardX < point[0] ? cardX + cardWidth : cardX;
                        return (
                          <g>
                            <line x1={point[0]} y1={point[1]} x2={targetX} y2={cardY + 32} stroke={accent} strokeWidth="2.5" strokeDasharray="6 4" pointerEvents="none" />
                            <circle cx={point[0]} cy={point[1]} r="7" fill={accent} stroke={theme === "dark" ? "#111" : "#fff"} strokeWidth="2.5" pointerEvents="none" />
                            <foreignObject
                              x={cardX}
                              y={cardY}
                              width={cardWidth}
                              height={cardHeight}
                              pointerEvents="all"
                              style={{ overflow: "visible" }}
                            >
                              <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: 14, borderRadius: 18, background: theme === "dark" ? "#111" : "#fffdf8", color: theme === "dark" ? "#fff" : "#171717", border: `1.5px solid ${accent}`, boxShadow: "0 18px 45px rgba(0,0,0,.28)", fontFamily: "inherit", overflow: "hidden" }}>
                                <div style={{ fontSize: 8, fontWeight: 950, letterSpacing: "1.2px", color: accent }}>RIVER INTELLIGENCE</div>
                                <div style={{ marginTop: 5, fontSize: 21, fontWeight: 950, lineHeight: 1 }}>{info.name}</div>
                                <div style={{ marginTop: 4, fontSize: 8, color: theme === "dark" ? "#aaa" : "#666" }}>{info.stateName} · UPSC Map Feature</div>
                                <div style={{ marginTop: 9, display: "grid", gap: 6 }}>
                                  {info.facts.slice(0, 5).map((fact, index) => (
                                    <div key={`${fact.label}-${index}`} style={{ padding: "6px 7px", borderRadius: 9, background: theme === "dark" ? "#1b1b1a" : "#f2efe7", border: `1px solid ${theme === "dark" ? "#2b2b29" : "#e1ddd2"}` }}>
                                      <div style={{ fontSize: 6.5, fontWeight: 950, letterSpacing: ".7px", textTransform: "uppercase", color: accent }}>{fact.label}</div>
                                      <div style={{ marginTop: 2, fontSize: 7.5, lineHeight: 1.35, color: theme === "dark" ? "#ddd" : "#333" }}>{fact.value}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ marginTop: 7, fontSize: 6.5, color: theme === "dark" ? "#8f8f8f" : "#777", lineHeight: 1.3 }}>Verified river intelligence • Source: India-WRIS / Government water-resources sources</div>
                              </div>
                            </foreignObject>
                          </g>
                        );
                      }
                      const cardWidth = 250;
                      const cardHeight = 150;
                      const cardX = point[0] < 360 ? 452 : 18;
                      const cardY = Math.max(18, Math.min(450, point[1] - 60));
                      const targetX = cardX < point[0] ? cardX + 8 : cardX + cardWidth - 8;
                      return (
                        <g pointerEvents="none">
                          <line x1={point[0]} y1={point[1]} x2={targetX} y2={cardY + 34} stroke={accent} strokeWidth="2" strokeDasharray="5 4" />
                          <circle cx={point[0]} cy={point[1]} r="6" fill={accent} stroke={theme === "dark" ? "#111" : "#fff"} strokeWidth="2" />
                          <rect x={cardX} y={cardY} width={cardWidth} height={cardHeight} rx="16" fill={theme === "dark" ? "#111111" : "#fffdf8"} stroke={accent} strokeWidth="1.5" />
                          <text x={cardX + 14} y={cardY + 23} fontSize="13" fontWeight="800" fill={theme === "dark" ? "#fff" : "#161616"}>{info.name}</text>
                          <text x={cardX + 14} y={cardY + 42} fontSize="9" fontWeight="800" fill={accent}>{info.stateName} · {info.modeLabel}</text>
                          {info.facts.slice(0, 3).map((fact, index) => (<text key={`${fact.label}-${index}`} x={cardX + 14} y={cardY + 63 + index * 22} fontSize="8" fill={theme === "dark" ? "#d4d4d4" : "#555"}>{fact.label}: {fact.value.length > 32 ? `${fact.value.slice(0, 32)}…` : fact.value}</text>))}
                          <text x={cardX + 14} y={cardY + 133} fontSize="8" fontWeight="700" fill={accent}>Map feature selected</text>
                        </g>
                      );
                    })() : null}

</svg>

                  {selectedId &&
                  ["mountains", "minerals", "agriculture"].includes(mode) &&
                  !externalFeatureLoading &&
                  externalLayerItems.length === 0 ? (
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
                      No verified {getModeLabel().toLowerCase()} feature geometry was found inside the selected state. Location data unavailable — no unrelated feature is shown.
                    </div>
                  ) : null}

                  {mode !== "explore" &&
                  mode !== "mapping2026" &&
                  !Object.values(knowledge).some((state) =>
                    (state.geoLayers?.[getGeoLayerKey(mode)] || []).length
                  ) &&
                  externalLayerItems.length === 0 &&
                  !externalFeatureLoading ? (
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


                  {externalFeatureLoading && mode !== "explore" ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        padding: "7px 9px",
                        borderRadius: 999,
                        border: `1px solid ${ui.line}`,
                        background: ui.surface,
                        color: ui.muted,
                        fontSize: 8,
                        zIndex: 4,
                      }}
                    >
                      Loading verified {getModeLabel().toLowerCase()} geometry…
                    </div>
                  ) : null}

                  {externalFeatureError && mode !== "explore" ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        maxWidth: 330,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: `1px solid ${ui.line}`,
                        background: ui.surface,
                        color: ui.muted,
                        fontSize: 8,
                        zIndex: 4,
                      }}
                    >
                      {externalFeatureError}
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

          {selectedMapFeature && mode !== "rivers" ? (() => {
            const info = getFeatureIntelligence(selectedMapFeature);
            if (!info) return null;
            return (
              <section className="bd-feature-intelligence" style={{ marginTop: 12, padding: 15, borderRadius: 18, border: `1px solid ${modeAccent}`, background: ui.surface, boxShadow: ui.shadow }}>
                <div style={{ fontSize: 8, fontWeight: 950, letterSpacing: "1.3px", color: modeAccent }}>MAP FEATURE INTELLIGENCE</div>
                <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div><div style={{ fontSize: 22, fontWeight: 950 }}>{info.name}</div><div style={{ marginTop: 4, fontSize: 9, color: ui.muted }}>{info.stateName} · {info.modeLabel}</div></div>
                  <span style={{ padding: "5px 8px", borderRadius: 999, border: `1px solid ${ui.line}`, color: modeAccent, fontSize: 8, fontWeight: 900 }}>VERIFIED MAP FEATURE</span>
                </div>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                  {info.facts.length ? info.facts.map((fact, index) => (
                    <div key={`${fact.label}-${index}`} style={{ padding: 10, borderRadius: 12, background: ui.surface2, border: `1px solid ${ui.line}` }}><div style={{ fontSize: 7, fontWeight: 950, color: modeAccent, textTransform: "uppercase", letterSpacing: ".7px" }}>{fact.label}</div><div style={{ marginTop: 5, fontSize: 10, lineHeight: 1.45 }}>{fact.value}</div></div>
                  )) : <div style={{ padding: 10, borderRadius: 12, background: ui.surface2, border: `1px solid ${ui.line}`, fontSize: 9, color: ui.muted }}>Feature-specific attributes are not available in the verified source.</div>}
                </div>
                <div style={{ marginTop: 10, padding: 11, borderRadius: 12, border: `1px solid ${ui.line}`, background: ui.card, color: ui.muted, fontSize: 9, lineHeight: 1.55 }}>{info.description}</div>
                <div style={{ marginTop: 11, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => { if (selectedMapFeature.stateId) setSelectedId(selectedMapFeature.stateId); setMobilePanelOpen(true); }} style={{ border: 0, borderRadius: 10, padding: "9px 12px", background: modeAccent, color: "#111", fontWeight: 900, fontSize: 9, cursor: "pointer" }}>Open state intelligence</button>
                  <button type="button" onClick={() => setSelectedMapFeature(null)} style={{ border: `1px solid ${ui.line}`, borderRadius: 10, padding: "9px 12px", background: ui.surface2, color: ui.text, fontWeight: 900, fontSize: 9, cursor: "pointer" }}>Close</button>
                  {info.sourceUrl ? <a href={info.sourceUrl} target="_blank" rel="noreferrer" style={{ border: `1px solid ${ui.line}`, borderRadius: 10, padding: "9px 12px", background: ui.surface2, color: ui.text, fontWeight: 900, fontSize: 9, textDecoration: "none" }}>Source</a> : null}
                </div>
              </section>
            );
          })() : null}

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
            background: ui.surface,
            border: `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
            boxShadow: ui.shadow,
          }}
        >
          <div style={{ color: modeAccent, fontSize: 8, fontWeight: 950, letterSpacing: "1.4px" }}>
            TIMED MAP TEST
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: "6px 0 5px", fontSize: 22 }}>Exam-style map revision</h2>
              <p style={{ margin: 0, color: ui.muted, fontSize: 9, lineHeight: 1.6 }}>
                Data-driven map questions generated from the verified Bharat Darshan geography dataset. +1 correct, −0.33 incorrect.
              </p>
            </div>
            {timedStarted && timedMode ? (
              <div style={{ padding: "8px 11px", borderRadius: 12, background: ui.surface2, border: `1px solid ${timedTimeLeft <= 30 ? "#a04b3f" : ui.line}`, fontSize: 12, fontWeight: 950, color: timedTimeLeft <= 30 ? "#a04b3f" : ui.text }}>
                {formatTime(timedTimeLeft)}
              </div>
            ) : null}
          </div>

          {!timedStarted && !timedFinished ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9, marginTop: 13 }} className="bd-timed-options">
              {TIMED_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => startTimedTest(option)}
                  disabled={timedQuestionPool.length < option.questions}
                  style={{ textAlign: "left", border: `1px solid ${ui.line}`, background: ui.surface2, color: ui.text, borderRadius: 13, padding: 12, cursor: timedQuestionPool.length < option.questions ? "not-allowed" : "pointer", opacity: timedQuestionPool.length < option.questions ? 0.5 : 1, transition: "transform .18s ease, border-color .18s ease" }}
                >
                  <div style={{ fontSize: 14, fontWeight: 950 }}>{option.title}</div>
                  <div style={{ marginTop: 4, color: ui.muted, fontSize: 8 }}>{option.questions} questions • {option.minutes} minutes</div>
                </button>
              ))}
            </div>
          ) : null}

          {timedStarted && currentTimedQuestion ? (
            <div style={{ marginTop: 13, padding: 14, borderRadius: 16, background: ui.surface2, border: `1px solid ${ui.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: ui.muted, fontSize: 8, fontWeight: 900 }}>
                <span>Question {timedIndex + 1} / {timedQuestions.length}</span>
                <span>Score {Number(timedScore.toFixed(2))}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, fontWeight: 900 }}>{currentTimedQuestion.q}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 12 }} className="bd-timed-options">
                {currentTimedQuestion.options.map((option, index) => {
                  const chosen = timedAnswer === index;
                  const correct = currentTimedQuestion.answer === index;
                  const background = timedAnswered && correct ? (theme === "dark" ? "#203426" : "#dcebd9") : timedAnswered && chosen ? (theme === "dark" ? "#3b2424" : "#f0d8d8") : ui.surface;
                  return (
                    <button key={option} type="button" onClick={() => answerTimed(index)} disabled={timedAnswered} style={{ minHeight: 52, textAlign: "left", border: `1px solid ${timedAnswered && (chosen || correct) ? modeAccent : ui.line}`, background, color: ui.text, borderRadius: 11, padding: 11, fontSize: 10, fontWeight: 850, cursor: timedAnswered ? "default" : "pointer" }}>
                      <span style={{ display: "inline-grid", placeItems: "center", width: 22, height: 22, marginRight: 7, borderRadius: 7, background: ui.surface3 }}>{String.fromCharCode(65 + index)}</span>
                      {option}
                    </button>
                  );
                })}
              </div>
              {timedAnswered ? (
                <>
                  <div style={{ marginTop: 11, padding: 10, borderRadius: 11, background: ui.surface, color: ui.muted, fontSize: 9, lineHeight: 1.55 }}>
                    <strong style={{ color: ui.text }}>{timedAnswer === currentTimedQuestion.answer ? "Correct" : "Incorrect"}.</strong>{" "}{currentTimedQuestion.explanation}
                  </div>
                  <button type="button" onClick={nextTimedQuestion} style={{ marginTop: 10, border: 0, background: modeAccent, color: "#111", borderRadius: 11, padding: "9px 14px", fontWeight: 950, cursor: "pointer" }}>
                    {timedIndex >= timedQuestions.length - 1 ? "Finish Test" : "Next Question →"}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}

          {timedFinished ? (
            <div style={{ marginTop: 13, padding: 15, borderRadius: 16, background: `${modeAccent}10`, border: `1px solid ${modeAccent}45` }}>
              <div style={{ color: modeAccent, fontSize: 8, fontWeight: 950, letterSpacing: "1.2px" }}>TEST COMPLETE</div>
              <div style={{ marginTop: 5, fontSize: 22, fontWeight: 950 }}>{Number(timedScore.toFixed(2))} / {timedQuestions.length}</div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 9 }}>
                Correct: {timedCorrect} • Incorrect: {timedWrong} • Accuracy: {timedQuestions.length ? Math.round((timedCorrect / timedQuestions.length) * 100) : 0}%
              </div>
              <button type="button" onClick={() => { setTimedFinished(false); setTimedMode(null); setTimedQuestions([]); }} style={{ marginTop: 10, border: `1px solid ${ui.line}`, background: ui.surface, color: ui.text, borderRadius: 11, padding: "9px 12px", fontSize: 9, fontWeight: 900, cursor: "pointer" }}>
                Choose another test
              </button>
            </div>
          ) : null}

          {timedQuestionPool.length < 50 ? (
            <div style={{ marginTop: 10, color: ui.muted, fontSize: 8 }}>Available verified question pool: {timedQuestionPool.length}. Larger test sizes unlock automatically as the geography dataset grows.</div>
          ) : null}
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

      </div>

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
