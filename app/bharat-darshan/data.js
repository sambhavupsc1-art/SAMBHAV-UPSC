/**
 * SAMBHAV UPSC — Bharat Darshan
 *
 * Static geography data layer.
 *
 * UI/logic page.jsx me hai.
 * Geography data yahan hai.
 *
 * Isliye future me data expand karne ke liye
 * page.jsx ko touch karne ki zarurat nahi hogi.
 */

const STATE_META = {
  AP: {
    name: "Andhra Pradesh",
    region: "South",
    capital: "Amaravati",
    rivers: ["Godavari", "Krishna", "Penna"],
    relief: ["Eastern Ghats", "Deccan Plateau"],
    crops: ["Rice", "Chilli", "Tobacco"],
    ecology: ["Papikonda NP", "Coringa WLS"],
    minerals: ["Barytes", "Limestone"],
    places: ["Visakhapatnam", "Amaravati"],
    climate:
      "Tropical monsoon with a long east-coast influence.",
  },

  AR: {
    name: "Arunachal Pradesh",
    region: "Northeast",
    capital: "Itanagar",
    rivers: [
      "Siang",
      "Subansiri",
      "Lohit",
    ],
    relief: [
      "Eastern Himalaya",
      "Sela Pass",
    ],
    crops: [
      "Rice",
      "Millets",
      "Horticulture",
    ],
    ecology: [
      "Namdapha NP",
      "Pakke WLS",
    ],
    minerals: [
      "Coal",
      "Petroleum",
    ],
    places: [
      "Tawang",
      "Itanagar",
    ],
    climate:
      "Humid to alpine across strong elevation gradients.",
  },

  AS: {
    name: "Assam",
    region: "Northeast",
    capital: "Dispur",
    rivers: [
      "Brahmaputra",
      "Barak",
    ],
    relief: [
      "Brahmaputra Valley",
      "Karbi Plateau",
    ],
    crops: [
      "Tea",
      "Rice",
      "Jute",
    ],
    ecology: [
      "Kaziranga NP",
      "Manas NP",
      "Dibru-Saikhowa NP",
    ],
    minerals: [
      "Petroleum",
      "Natural gas",
    ],
    places: [
      "Guwahati",
      "Sivasagar",
    ],
    climate:
      "Humid monsoonal climate with very high rainfall in parts.",
  },

  BR: {
    name: "Bihar",
    region: "East",
    capital: "Patna",
    rivers: [
      "Ganga",
      "Kosi",
      "Gandak",
      "Son",
    ],
    relief: [
      "Gangetic Plain",
      "Chota Nagpur fringe",
    ],
    crops: [
      "Rice",
      "Wheat",
      "Maize",
    ],
    ecology: [
      "Valmiki NP",
      "Vikramshila Gangetic Dolphin Sanctuary",
    ],
    minerals: [
      "Limestone",
      "Pyrite",
    ],
    places: [
      "Bodh Gaya",
      "Nalanda",
      "Patna",
    ],
    climate:
      "Monsoonal with hot summers and winter seasonality.",
  },

  CG: {
    name: "Chhattisgarh",
    region: "Central",
    capital: "Raipur",
    rivers: [
      "Mahanadi",
      "Indravati",
      "Hasdeo",
    ],
    relief: [
      "Chhattisgarh Plain",
      "Bastar Plateau",
    ],
    crops: [
      "Rice",
      "Pulses",
      "Oilseeds",
    ],
    ecology: [
      "Indravati NP",
      "Kanger Valley NP",
    ],
    minerals: [
      "Iron ore",
      "Coal",
      "Bauxite",
    ],
    places: [
      "Bastar",
      "Raipur",
    ],
    climate:
      "Tropical monsoonal; rainfall declines away from the eastern hills.",
  },

  GA: {
    name: "Goa",
    region: "West",
    capital: "Panaji",
    rivers: [
      "Mandovi",
      "Zuari",
    ],
    relief: [
      "Western Ghats",
      "Konkan coast",
    ],
    crops: [
      "Rice",
      "Coconut",
      "Cashew",
    ],
    ecology: [
      "Mollem NP",
    ],
    minerals: [
      "Iron ore",
    ],
    places: [
      "Panaji",
      "Old Goa",
    ],
    climate:
      "Strong southwest monsoon and humid coastal climate.",
  },

  GJ: {
    name: "Gujarat",
    region: "West",
    capital: "Gandhinagar",
    rivers: [
      "Narmada",
      "Tapi",
      "Sabarmati",
    ],
    relief: [
      "Aravalli",
      "Kathiawar",
      "Rann of Kachchh",
    ],
    crops: [
      "Cotton",
      "Groundnut",
      "Wheat",
    ],
    ecology: [
      "Gir NP",
      "Little Rann WLS",
    ],
    minerals: [
      "Limestone",
      "Lignite",
      "Bauxite",
    ],
    places: [
      "Ahmedabad",
      "Dwarka",
      "Kachchh",
    ],
    climate:
      "Semi-arid to dry tropical, moderated on the coast.",
  },

  HR: {
    name: "Haryana",
    region: "North",
    capital: "Chandigarh",
    rivers: [
      "Yamuna",
      "Ghaggar",
    ],
    relief: [
      "Indo-Gangetic Plain",
      "Aravalli outcrops",
    ],
    crops: [
      "Wheat",
      "Rice",
      "Cotton",
    ],
    ecology: [
      "Sultanpur NP",
      "Kalesar NP",
    ],
    minerals: [
      "Limestone",
      "Quartzite",
    ],
    places: [
      "Kurukshetra",
      "Gurugram",
    ],
    climate:
      "Continental with hot summers, cold winters and monsoon rainfall.",
  },

  HP: {
    name: "Himachal Pradesh",
    region: "North",
    capital: "Shimla",
    rivers: [
      "Sutlej",
      "Beas",
      "Ravi",
      "Chenab",
    ],
    relief: [
      "Himalaya",
      "Rohtang Pass",
    ],
    crops: [
      "Apple",
      "Maize",
      "Wheat",
    ],
    ecology: [
      "Great Himalayan NP",
      "Pin Valley NP",
    ],
    minerals: [
      "Limestone",
    ],
    places: [
      "Shimla",
      "Kinnaur",
      "Spiti",
    ],
    climate:
      "Strong altitudinal variation from subtropical foothills to cold desert.",
  },

  JH: {
    name: "Jharkhand",
    region: "East",
    capital: "Ranchi",
    rivers: [
      "Damodar",
      "Subarnarekha",
      "Koel",
    ],
    relief: [
      "Chota Nagpur Plateau",
      "Rajmahal Hills",
    ],
    crops: [
      "Rice",
      "Pulses",
      "Oilseeds",
    ],
    ecology: [
      "Betla NP",
      "Dalma WLS",
    ],
    minerals: [
      "Coal",
      "Iron ore",
      "Uranium",
    ],
    places: [
      "Ranchi",
      "Jamshedpur",
    ],
    climate:
      "Tropical monsoonal with marked dry and wet seasons.",
  },

  KA: {
    name: "Karnataka",
    region: "South",
    capital: "Bengaluru",
    rivers: [
      "Krishna",
      "Kaveri",
      "Tungabhadra",
    ],
    relief: [
      "Western Ghats",
      "Deccan Plateau",
    ],
    crops: [
      "Coffee",
      "Ragi",
      "Sugarcane",
    ],
    ecology: [
      "Bandipur NP",
      "Nagarahole NP",
    ],
    minerals: [
      "Iron ore",
      "Manganese",
    ],
    places: [
      "Hampi",
      "Bengaluru",
    ],
    climate:
      "Varied tropical climate shaped by the Western Ghats and plateau.",
  },

  KL: {
    name: "Kerala",
    region: "South",
    capital: "Thiruvananthapuram",
    rivers: [
      "Periyar",
      "Bharathapuzha",
      "Pamba",
    ],
    relief: [
      "Western Ghats",
      "Malabar Coast",
    ],
    crops: [
      "Rubber",
      "Coconut",
      "Spices",
    ],
    ecology: [
      "Periyar NP",
      "Silent Valley NP",
    ],
    minerals: [
      "Monazite",
      "Ilmenite",
    ],
    places: [
      "Kochi",
      "Thiruvananthapuram",
    ],
    climate:
      "Humid tropical climate dominated by southwest and northeast monsoon influence.",
  },

  MP: {
    name: "Madhya Pradesh",
    region: "Central",
    capital: "Bhopal",
    rivers: [
      "Narmada",
      "Chambal",
      "Betwa",
      "Son",
    ],
    relief: [
      "Malwa Plateau",
      "Vindhya",
      "Satpura",
    ],
    crops: [
      "Soybean",
      "Wheat",
      "Pulses",
    ],
    ecology: [
      "Kanha NP",
      "Bandhavgarh NP",
      "Pench NP",
    ],
    minerals: [
      "Diamond",
      "Coal",
      "Manganese",
    ],
    places: [
      "Khajuraho",
      "Bhopal",
    ],
    climate:
      "Tropical with monsoon rainfall and a dry winter.",
  },

  MH: {
    name: "Maharashtra",
    region: "West",
    capital: "Mumbai",
    rivers: [
      "Godavari",
      "Krishna",
      "Tapi",
      "Bhima",
    ],
    relief: [
      "Western Ghats",
      "Deccan Plateau",
    ],
    crops: [
      "Cotton",
      "Sugarcane",
      "Soybean",
    ],
    ecology: [
      "Tadoba-Andhari TR",
      "Sanjay Gandhi NP",
    ],
    minerals: [
      "Coal",
      "Manganese",
      "Iron ore",
    ],
    places: [
      "Mumbai",
      "Pune",
      "Ajanta",
    ],
    climate:
      "Monsoonal with a rain-shadow belt east of the Western Ghats.",
  },

  MN: {
    name: "Manipur",
    region: "Northeast",
    capital: "Imphal",
    rivers: [
      "Barak",
      "Imphal",
    ],
    relief: [
      "Manipur Hills",
      "Imphal Valley",
    ],
    crops: [
      "Rice",
      "Horticulture",
    ],
    ecology: [
      "Keibul Lamjao NP",
    ],
    minerals: [
      "Chromite",
      "Limestone",
    ],
    places: [
      "Imphal",
      "Loktak Lake",
    ],
    climate:
      "Humid subtropical to temperate at higher elevations.",
  },

  ML: {
    name: "Meghalaya",
    region: "Northeast",
    capital: "Shillong",
    rivers: [
      "Umiam",
      "Simsang",
    ],
    relief: [
      "Shillong Plateau",
      "Garo-Khasi-Jaintia Hills",
    ],
    crops: [
      "Rice",
      "Potato",
      "Orange",
    ],
    ecology: [
      "Nokrek NP",
      "Balpakram NP",
    ],
    minerals: [
      "Coal",
      "Limestone",
    ],
    places: [
      "Shillong",
      "Cherrapunji",
    ],
    climate:
      "Very high monsoon rainfall, especially on southern slopes.",
  },

  MZ: {
    name: "Mizoram",
    region: "Northeast",
    capital: "Aizawl",
    rivers: [
      "Tlawng",
      "Tuirial",
    ],
    relief: [
      "Mizo Hills",
    ],
    crops: [
      "Rice",
      "Horticulture",
    ],
    ecology: [
      "Dampa TR",
    ],
    minerals: [
      "Limestone",
    ],
    places: [
      "Aizawl",
      "Champhai",
    ],
    climate:
      "Humid monsoonal hill climate.",
  },

  NL: {
    name: "Nagaland",
    region: "Northeast",
    capital: "Kohima",
    rivers: [
      "Doyang",
      "Dhansiri",
    ],
    relief: [
      "Naga Hills",
    ],
    crops: [
      "Rice",
      "Horticulture",
    ],
    ecology: [
      "Intanki NP",
    ],
    minerals: [
      "Coal",
      "Limestone",
    ],
    places: [
      "Kohima",
      "Dimapur",
    ],
    climate:
      "Humid monsoon climate with cooler hill conditions.",
  },

  OD: {
    name: "Odisha",
    region: "East",
    capital: "Bhubaneswar",
    rivers: [
      "Mahanadi",
      "Brahmani",
      "Baitarani",
    ],
    relief: [
      "Eastern Ghats",
      "Odisha Coastal Plain",
    ],
    crops: [
      "Rice",
      "Pulses",
      "Oilseeds",
    ],
    ecology: [
      "Similipal NP",
      "Bhitarkanika NP",
      "Gahirmatha",
    ],
    minerals: [
      "Iron ore",
      "Bauxite",
      "Chromite",
    ],
    places: [
      "Bhubaneswar",
      "Puri",
      "Konark",
    ],
    climate:
      "Tropical monsoon with cyclone exposure along the Bay of Bengal.",
  },

  PB: {
    name: "Punjab",
    region: "North",
    capital: "Chandigarh",
    rivers: [
      "Sutlej",
      "Beas",
      "Ravi",
    ],
    relief: [
      "Punjab Plain",
      "Shivalik foothills",
    ],
    crops: [
      "Wheat",
      "Rice",
      "Cotton",
    ],
    ecology: [
      "Harike WLS",
    ],
    minerals: [
      "Limestone",
    ],
    places: [
      "Amritsar",
      "Ludhiana",
    ],
    climate:
      "Continental monsoonal climate with hot summers and cold winters.",
  },

  RJ: {
    name: "Rajasthan",
    region: "West",
    capital: "Jaipur",
    rivers: [
      "Luni",
      "Chambal",
      "Banas",
    ],
    relief: [
      "Thar Desert",
      "Aravalli Range",
    ],
    crops: [
      "Bajra",
      "Mustard",
      "Wheat",
    ],
    ecology: [
      "Desert NP",
      "Ranthambore NP",
      "Keoladeo NP",
    ],
    minerals: [
      "Zinc",
      "Lead",
      "Lignite",
      "Marble",
    ],
    places: [
      "Jaipur",
      "Jaisalmer",
      "Udaipur",
    ],
    climate:
      "Arid to semi-arid; rainfall is highly variable.",
  },

  SK: {
    name: "Sikkim",
    region: "Northeast",
    capital: "Gangtok",
    rivers: [
      "Teesta",
      "Rangeet",
    ],
    relief: [
      "Eastern Himalaya",
      "Nathu La",
    ],
    crops: [
      "Large cardamom",
      "Maize",
      "Horticulture",
    ],
    ecology: [
      "Khangchendzonga NP",
    ],
    minerals: [
      "Copper",
      "Limestone",
    ],
    places: [
      "Gangtok",
      "Nathu La",
    ],
    climate:
      "Strong altitudinal climate gradients with heavy monsoon influence.",
  },

  TN: {
    name: "Tamil Nadu",
    region: "South",
    capital: "Chennai",
    rivers: [
      "Kaveri",
      "Vaigai",
      "Tamiraparani",
    ],
    relief: [
      "Eastern Ghats",
      "Tamil Nadu Plains",
      "Nilgiris",
    ],
    crops: [
      "Rice",
      "Cotton",
      "Sugarcane",
    ],
    ecology: [
      "Mudumalai NP",
      "Gulf of Mannar Marine NP",
    ],
    minerals: [
      "Lignite",
      "Ilmenite",
    ],
    places: [
      "Chennai",
      "Madurai",
      "Kanyakumari",
    ],
    climate:
      "Receives important rainfall from the northeast/retreating monsoon.",
  },

  TS: {
    name: "Telangana",
    region: "South",
    capital: "Hyderabad",
    rivers: [
      "Godavari",
      "Krishna",
      "Musi",
    ],
    relief: [
      "Deccan Plateau",
      "Telangana Plateau",
    ],
    crops: [
      "Rice",
      "Cotton",
      "Maize",
    ],
    ecology: [
      "Kawal TR",
      "Amrabad TR",
    ],
    minerals: [
      "Coal",
      "Limestone",
    ],
    places: [
      "Hyderabad",
      "Warangal",
    ],
    climate:
      "Tropical semi-arid to sub-humid with monsoon rainfall.",
  },

  TR: {
    name: "Tripura",
    region: "Northeast",
    capital: "Agartala",
    rivers: [
      "Gomati",
      "Feni",
    ],
    relief: [
      "Tripura Hills",
    ],
    crops: [
      "Rice",
      "Rubber",
      "Tea",
    ],
    ecology: [
      "Sepahijala WLS",
    ],
    minerals: [
      "Natural gas",
    ],
    places: [
      "Agartala",
      "Unakoti",
    ],
    climate:
      "Warm humid monsoon climate.",
  },

  UP: {
    name: "Uttar Pradesh",
    region: "North",
    capital: "Lucknow",
    rivers: [
      "Ganga",
      "Yamuna",
      "Ghaghara",
      "Gomti",
      "Rapti",
      "Son",
    ],
    relief: [
      "Ganga-Yamuna Doab",
      "Terai",
      "Vindhyan fringe",
    ],
    crops: [
      "Wheat",
      "Rice",
      "Sugarcane",
      "Potato",
    ],
    ecology: [
      "Dudhwa NP",
      "Katarniaghat WLS",
      "National Chambal Sanctuary",
    ],
    minerals: [
      "Limestone",
      "Silica sand",
      "Coal",
    ],
    places: [
      "Varanasi",
      "Prayagraj",
      "Ayodhya",
      "Agra",
    ],
    climate:
      "Subtropical monsoon with hot summers and cool winters.",
  },

  UK: {
    name: "Uttarakhand",
    region: "North",
    capital: "Dehradun",
    rivers: [
      "Ganga",
      "Yamuna",
      "Alaknanda",
      "Bhagirathi",
    ],
    relief: [
      "Greater Himalaya",
      "Lesser Himalaya",
      "Shivalik",
    ],
    crops: [
      "Rice",
      "Wheat",
      "Horticulture",
    ],
    ecology: [
      "Jim Corbett NP",
      "Nanda Devi NP",
      "Valley of Flowers NP",
    ],
    minerals: [
      "Limestone",
      "Magnesite",
    ],
    places: [
      "Badrinath",
      "Kedarnath",
      "Rishikesh",
    ],
    climate:
      "Strong altitudinal variation and monsoon-driven rainfall.",
  },

  WB: {
    name: "West Bengal",
    region: "East",
    capital: "Kolkata",
    rivers: [
      "Ganga-Hooghly",
      "Teesta",
      "Damodar",
    ],
    relief: [
      "Gangetic Plain",
      "Darjeeling Himalaya",
      "Sundarbans",
    ],
    crops: [
      "Rice",
      "Jute",
      "Tea",
    ],
    ecology: [
      "Sundarbans NP",
      "Buxa NP",
    ],
    minerals: [
      "Coal",
      "Clay",
    ],
    places: [
      "Kolkata",
      "Darjeeling",
      "Sundarbans",
    ],
    climate:
      "Humid monsoonal; strong rainfall gradient from Himalaya to southwest.",
  },

  AN: {
    name: "Andaman & Nicobar Islands",
    region: "UTs",
    capital: "Port Blair",
    rivers: [
      "Short island streams",
    ],
    relief: [
      "Island arc",
      "Andaman hills",
    ],
    crops: [
      "Coconut",
      "Arecanut",
      "Rice",
    ],
    ecology: [
      "Mahatma Gandhi Marine NP",
      "Campbell Bay NP",
    ],
    minerals: [
      "Limestone",
    ],
    places: [
      "Port Blair",
      "Great Nicobar",
    ],
    climate:
      "Equatorial-oceanic and humid with high rainfall.",
  },

  CH: {
    name: "Chandigarh",
    region: "UTs",
    capital: "Chandigarh",
    rivers: [
      "Sukhna Choe",
    ],
    relief: [
      "Shivalik foothills",
    ],
    crops: [
      "Wheat",
      "Rice",
    ],
    ecology: [
      "Sukhna Lake ecosystem",
    ],
    minerals: [],
    places: [
      "Chandigarh",
    ],
    climate:
      "Subtropical with monsoon rainfall.",
  },

  DN: {
    name:
      "Dadra & Nagar Haveli and Daman & Diu",
    region: "UTs",
    capital: "Daman",
    rivers: [
      "Daman Ganga",
    ],
    relief: [
      "Western Ghats foothills",
      "Coastal plain",
    ],
    crops: [
      "Rice",
      "Ragi",
      "Mango",
    ],
    ecology: [
      "Coastal and forest ecosystems",
    ],
    minerals: [],
    places: [
      "Daman",
      "Diu",
    ],
    climate:
      "Tropical coastal monsoon climate.",
  },

  DL: {
    name: "Delhi",
    region: "UTs",
    capital: "New Delhi",
    rivers: [
      "Yamuna",
    ],
    relief: [
      "Yamuna floodplain",
      "Delhi Ridge",
    ],
    crops: [
      "Vegetables",
      "Wheat",
    ],
    ecology: [
      "Asola Bhatti WLS",
    ],
    minerals: [],
    places: [
      "New Delhi",
      "Delhi Ridge",
    ],
    climate:
      "Semi-arid continental with monsoon rainfall.",
  },

  JK: {
    name: "Jammu & Kashmir",
    region: "UTs",
    capital: "Srinagar",
    rivers: [
      "Jhelum",
      "Chenab",
      "Tawi",
    ],
    relief: [
      "Kashmir Valley",
      "Pir Panjal",
      "Karakoram",
    ],
    crops: [
      "Apple",
      "Rice",
      "Saffron",
    ],
    ecology: [
      "Dachigam NP",
      "Hemis landscape",
    ],
    minerals: [
      "Limestone",
      "Bauxite",
    ],
    places: [
      "Srinagar",
      "Jammu",
      "Gulmarg",
    ],
    climate:
      "Varied mountain climate with strong altitude effects.",
  },

  LA: {
    name: "Ladakh",
    region: "UTs",
    capital: "Leh",
    rivers: [
      "Indus",
      "Shyok",
      "Zanskar",
    ],
    relief: [
      "Karakoram",
      "Ladakh Range",
      "Cold Desert",
    ],
    crops: [
      "Barley",
      "Peas",
      "Apricot",
    ],
    ecology: [
      "Hemis NP",
      "Changthang landscape",
    ],
    minerals: [
      "Boron",
      "Limestone",
    ],
    places: [
      "Leh",
      "Pangong",
      "Khardung La",
    ],
    climate:
      "High-altitude cold desert with very low precipitation.",
  },

  LD: {
    name: "Lakshadweep",
    region: "UTs",
    capital: "Kavaratti",
    rivers: [
      "No major rivers",
    ],
    relief: [
      "Coral atolls",
    ],
    crops: [
      "Coconut",
      "Tuna fisheries",
    ],
    ecology: [
      "Marine coral reef ecosystems",
    ],
    minerals: [],
    places: [
      "Kavaratti",
      "Minicoy",
    ],
    climate:
      "Tropical maritime climate.",
  },

  PY: {
    name: "Puducherry",
    region: "UTs",
    capital: "Puducherry",
    rivers: [
      "Gingee",
      "Ariyankuppam",
    ],
    relief: [
      "Coastal plain",
    ],
    crops: [
      "Rice",
      "Groundnut",
      "Pulses",
    ],
    ecology: [
      "Coastal ecosystems",
    ],
    minerals: [],
    places: [
      "Puducherry",
      "Auroville",
    ],
    climate:
      "Tropical coastal; northeast monsoon is significant.",
  },
};

export const FEATURE_CATEGORIES = {
  rivers: "Rivers / Water",
  relief: "Mountains / Passes / Relief",
  ecology: "Ecology / Protected Areas",
  minerals: "Minerals / Resources",
  crops: "Agriculture / Crops",
  places: "Important Places",
  climate: "Climate / Monsoon",
};

export function buildFeatureIndex(
  stateMeta = STATE_META
) {
  const index = [];

  for (const [id, state] of Object.entries(
    stateMeta
  )) {
    for (const key of Object.keys(
      FEATURE_CATEGORIES
    )) {
      const values = Array.isArray(
        state[key]
      )
        ? state[key]
        : [state[key]];

      for (const value of values) {
        if (
          !value ||
          value === "—" ||
          value ===
            "Data pending verification"
        ) {
          continue;
        }

        index.push({
          id,
          state: state.name,
          category: key,
          value,
        });
      }
    }
  }

  return index;
}

export const FEATURE_INDEX =
  buildFeatureIndex();

export { STATE_META };
