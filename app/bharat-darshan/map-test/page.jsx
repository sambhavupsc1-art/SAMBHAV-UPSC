"use client";

import { useEffect, useMemo, useState } from "react";

const QUESTIONS = [
  {
    id: 1,
    scope: "World",
    category: "Seas",
    difficulty: "Easy",
    question: "Aral Sea is associated with which pair?",
    options: ["Iran + Iraq", "Kazakhstan + Uzbekistan", "Russia + Georgia", "Turkmenistan + Iran"],
    answer: 1,
    explanation: "Correct answer: Kazakhstan + Uzbekistan.",
    source: "Mapping Class 2026, pp. 1,31",
  },
  {
    id: 2,
    scope: "World",
    category: "Seas",
    difficulty: "Easy",
    question: "Which set represents the Black Sea littoral countries used in the notes?",
    options: ["Bulgaria, Ukraine, Russia, Georgia, Romania, Türkiye", "Spain, France, Italy, Greece, Türkiye, Egypt", "Kazakhstan, Iran, Russia, Azerbaijan, Turkmenistan", "India, Nepal, Bhutan, Myanmar, China"],
    answer: 0,
    explanation: "Correct answer: Bulgaria, Ukraine, Russia, Georgia, Romania, Türkiye.",
    source: "Mapping Class 2026, pp. 3,4,31",
  },
  {
    id: 3,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question: "Which five countries are associated with the Caspian Sea?",
    options: ["Kazakhstan, Uzbekistan, Iran, Russia, Georgia", "Kazakhstan, Turkmenistan, Azerbaijan, Iran, Russia", "Iran, Iraq, Azerbaijan, Russia, Armenia", "Kazakhstan, Kyrgyzstan, Tajikistan, Iran, Russia"],
    answer: 1,
    explanation: "Correct answer: Kazakhstan, Turkmenistan, Azerbaijan, Iran, Russia.",
    source: "Mapping Class 2026, pp. 6,31",
  },
  {
    id: 4,
    scope: "World",
    category: "Rivers",
    difficulty: "Easy",
    question: "Which river is mapped with China, Myanmar, Laos, Thailand, Cambodia and Vietnam?",
    options: ["Nile", "Mekong", "Danube", "Amazon"],
    answer: 1,
    explanation: "Correct answer: Mekong.",
    source: "Mapping Class 2026, pp. 8,32",
  },
  {
    id: 5,
    scope: "World",
    category: "West Asia",
    difficulty: "Medium",
    question: "Which is NOT in the Syria-neighbour mapping list?",
    options: ["Lebanon", "Israel", "Jordan", "Azerbaijan"],
    answer: 3,
    explanation: "Correct answer: Azerbaijan.",
    source: "Mapping Class 2026, pp. 11,32",
  },
  {
    id: 6,
    scope: "World",
    category: "West Asia",
    difficulty: "Medium",
    question: "Which country is included in the Iran-neighbour mapping set?",
    options: ["Armenia", "Egypt", "Lebanon", "Saudi Arabia"],
    answer: 0,
    explanation: "Correct answer: Armenia.",
    source: "Mapping Class 2026, pp. 12,32",
  },
  {
    id: 7,
    scope: "World",
    category: "Arctic",
    difficulty: "Hard",
    question: "Which sequence follows the Northern Sea Route in the notes?",
    options: ["Barents → Kara → Laptev → East Siberian → Chukchi → Bering Strait", "Black → Caspian → Kara → Bering → Baltic", "Red Sea → Aden → Arabian Sea → Malacca", "Mediterranean → Aegean → Black → Azov"],
    answer: 0,
    explanation: "Correct answer: Barents → Kara → Laptev → East Siberian → Chukchi → Bering Strait.",
    source: "Mapping Class 2026, pp. 28,34",
  },
  {
    id: 8,
    scope: "World",
    category: "Africa",
    difficulty: "Easy",
    question: "Lake Natron is linked with which countries in the notes?",
    options: ["Tanzania + Kenya", "Kenya + Uganda", "Tanzania + Rwanda", "Ethiopia + Kenya"],
    answer: 0,
    explanation: "Correct answer: Tanzania + Kenya.",
    source: "Mapping Class 2026, p. 37",
  },
  {
    id: 9,
    scope: "World",
    category: "Indian Ocean",
    difficulty: "Medium",
    question: "Which Indian Ocean island/territory is associated with France in the notes?",
    options: ["Seychelles", "Maldives", "Réunion", "Comoros"],
    answer: 2,
    explanation: "Correct answer: Réunion.",
    source: "Mapping Class 2026, pp. 17,33",
  },
  {
    id: 10,
    scope: "World",
    category: "Conflict Geography",
    difficulty: "Medium",
    question: "Which appears in the source Major Conflict Regions sheet?",
    options: ["Donbas", "Sahara", "Gobi", "Patagonia"],
    answer: 0,
    explanation: "Correct answer: Donbas.",
    source: "Mapping Class 2026, p. 28",
  },
  {
    id: 11,
    scope: "India",
    category: "Rivers",
    difficulty: "Easy",
    question: "Which major river is included in the India mapping sheets?",
    options: ["Nile", "Indus", "Danube", "Mekong"],
    answer: 1,
    explanation: "Correct answer: Indus.",
    source: "Mapping Class 2026, pp. 38–44,49",
  },
  {
    id: 12,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Vishnu Prayag is associated with which river in the source diagram?",
    options: ["Dhauliganga", "Pindar", "Bhagirathi", "Mandakini"],
    answer: 0,
    explanation: "Correct answer: Dhauliganga.",
    source: "Mapping Class 2026, p. 42",
  },
  {
    id: 13,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Karnaprayag is associated with which river?",
    options: ["Pindar", "Dhauliganga", "Mandakini", "Bhagirathi"],
    answer: 0,
    explanation: "Correct answer: Pindar.",
    source: "Mapping Class 2026, p. 42",
  },
  {
    id: 14,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Devprayag is associated with which river?",
    options: ["Alaknanda", "Bhagirathi", "Pindar", "Dhauliganga"],
    answer: 1,
    explanation: "Correct answer: Bhagirathi.",
    source: "Mapping Class 2026, p. 42",
  },
  {
    id: 15,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Which is shown in the Brahmaputra tributary diagram?",
    options: ["Dibang", "Narmada", "Mahi", "Sabarmati"],
    answer: 0,
    explanation: "Correct answer: Dibang.",
    source: "Mapping Class 2026, p. 43",
  },
  {
    id: 16,
    scope: "India",
    category: "Passes",
    difficulty: "Easy",
    question: "Which pass appears in the Kashmir–Ladakh pass sequence?",
    options: ["Zoji La", "Nathu La", "Sela", "Shipki La"],
    answer: 0,
    explanation: "Correct answer: Zoji La.",
    source: "Mapping Class 2026, p. 42",
  },
  {
    id: 17,
    scope: "India",
    category: "Ecology",
    difficulty: "Medium",
    question: "Which three wetlands are written in the Kerala source note?",
    options: ["Vembanad, Sasthamkotta, Ashtamudi", "Pulicat, Chilika, Vembanad", "Loktak, Vembanad, Sambhar", "Ashtamudi, Chilika, Loktak"],
    answer: 0,
    explanation: "Correct answer: Vembanad, Sasthamkotta, Ashtamudi.",
    source: "Mapping Class 2026, p. 52",
  },
  {
    id: 18,
    scope: "India",
    category: "Tiger Reserves",
    difficulty: "Medium",
    question: "What exact observation is written in the source note about Kerala tiger reserves?",
    options: ["Only 1 tiger reserve in Kerala", "Only 2 tiger reserves in KL and both start with P", "3 tiger reserves and all start with P", "Both start with K"],
    answer: 1,
    explanation: "Correct answer: Only 2 tiger reserves in KL and both start with P.",
    source: "Mapping Class 2026, p. 52",
  },
  {
    id: 19,
    scope: "India",
    category: "UNESCO",
    difficulty: "Easy",
    question: "Which is marked on the India UNESCO World Heritage sheet?",
    options: ["Dholavira", "Lake Natron", "Aral Sea", "Danube Delta"],
    answer: 0,
    explanation: "Correct answer: Dholavira.",
    source: "Mapping Class 2026, p. 47",
  },
  {
    id: 20,
    scope: "India",
    category: "Biosphere",
    difficulty: "Medium",
    question: "Which is marked as a Biosphere Reserve on the source map?",
    options: ["Nilgiri", "Aral Sea", "Black Sea", "Lake Natron"],
    answer: 0,
    explanation: "Correct answer: Nilgiri.",
    source: "Mapping Class 2026, p. 53",
  },
  {
    id: 21,
    scope: "India",
    category: "Ports",
    difficulty: "Easy",
    question: "Which is included in the source India port list?",
    options: ["Kandla", "Hamburg", "Rotterdam", "Gwadar"],
    answer: 0,
    explanation: "Correct answer: Kandla.",
    source: "Mapping Class 2026, p. 50",
  },
  {
    id: 22,
    scope: "India",
    category: "Soils",
    difficulty: "Medium",
    question: "Which soil type is represented on the source India soil map?",
    options: ["Black soil", "Tundra soil", "Podzol", "Chernozem"],
    answer: 0,
    explanation: "Correct answer: Black soil.",
    source: "Mapping Class 2026, p. 50",
  },
  {
    id: 23,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Consider the following pairs: 1. Narmada — Madhya Pradesh, Maharashtra, Gujarat 2. Mahi — Madhya Pradesh, Rajasthan, Gujarat 3. Betwa — Madhya Pradesh, Uttar Pradesh. Which of the pairs are correctly matched?",
    options: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
    answer: 3,
    explanation: "Correct answer: 1, 2 and 3.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 24,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Which one of the following river-state combinations is NOT included in the Mapping Class 2026 state association?",
    options: ["Narmada — Gujarat", "Mahanadi — Odisha", "Kaveri — Tamil Nadu", "Kaveri — Kerala"],
    answer: 3,
    explanation: "Correct answer: Kaveri — Kerala.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 25,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Consider the following: 1. Godavari 2. Krishna 3. Tungabhadra. Which of these are mapped with Karnataka in the source data?",
    options: ["1 only", "2 and 3 only", "1 and 2 only", "1, 2 and 3"],
    answer: 1,
    explanation: "Correct answer: 2 and 3 only.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 26,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Which pair is correctly matched according to the source mapping?",
    options: ["Mahanadi — Gujarat and Rajasthan", "Mahanadi — Chhattisgarh and Odisha", "Mahanadi — Karnataka and Tamil Nadu", "Mahanadi — Maharashtra and Telangana"],
    answer: 1,
    explanation: "Correct answer: Mahanadi — Chhattisgarh and Odisha.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 27,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Which set contains only rivers associated with Madhya Pradesh in the source data?",
    options: ["Narmada, Tapi, Chambal, Betwa, Mahi", "Ganga, Yamuna, Kaveri, Krishna, Mahi", "Godavari, Krishna, Tungabhadra, Tapi, Mahanadi", "Jhelum, Chenab, Ravi, Beas, Sutlej"],
    answer: 0,
    explanation: "Correct answer: Narmada, Tapi, Chambal, Betwa, Mahi.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 28,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Which of the following is the correct descending sequence of the number of states/UTs listed for these rivers in the source data?",
    options: ["Ganga > Yamuna > Krishna", "Krishna > Ganga > Yamuna", "Yamuna > Krishna > Ganga", "All have the same association count"],
    answer: 0,
    explanation: "Correct answer: Ganga > Yamuna > Krishna.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 29,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "The source associates the Brahmaputra with which pair of Indian regions?",
    options: ["Arunachal Pradesh and Assam", "Sikkim and West Bengal", "Bihar and Jharkhand", "Nagaland and Manipur"],
    answer: 0,
    explanation: "Correct answer: Arunachal Pradesh and Assam.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 30,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Which river is mapped with Karnataka and Telangana but not Andhra Pradesh in the source data?",
    options: ["Godavari", "Krishna", "Tungabhadra", "Kaveri"],
    answer: 2,
    explanation: "Correct answer: Tungabhadra.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 31,
    scope: "India",
    category: "Rivers",
    difficulty: "Medium",
    question: "Which river is mapped with Karnataka and Tamil Nadu in the source data?",
    options: ["Kaveri", "Krishna", "Godavari", "Tungabhadra"],
    answer: 0,
    explanation: "Correct answer: Kaveri.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 32,
    scope: "India",
    category: "Rivers",
    difficulty: "Hard",
    question: "Which pair of rivers is mapped with both Madhya Pradesh and Maharashtra?",
    options: ["Narmada and Tapi", "Chambal and Betwa", "Mahi and Mahanadi", "Godavari and Kaveri"],
    answer: 0,
    explanation: "Correct answer: Narmada and Tapi.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 33,
    scope: "India",
    category: "Relief",
    difficulty: "Hard",
    question: "Consider the following pairs: 1. Aravalli — Rajasthan, Haryana, Gujarat 2. Satpura — Madhya Pradesh, Maharashtra 3. Vindhya — Madhya Pradesh, Uttar Pradesh. Which are correctly matched?",
    options: ["1 only", "1 and 2 only", "2 and 3 only", "1, 2 and 3"],
    answer: 3,
    explanation: "Correct answer: 1, 2 and 3.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 34,
    scope: "India",
    category: "Relief",
    difficulty: "Hard",
    question: "Which range is associated with the largest number of states in the source mapping list?",
    options: ["Karakoram", "Shivalik", "Western Ghats", "Vindhya Range"],
    answer: 2,
    explanation: "Correct answer: Western Ghats.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 35,
    scope: "India",
    category: "Relief",
    difficulty: "Medium",
    question: "Which set contains only regions/ranges associated with Ladakh?",
    options: ["Karakoram, Ladakh Range and Zanskar Range", "Aravalli, Vindhya and Satpura", "Shivalik, Nilgiri and Eastern Ghats", "Pir Panjal, Aravalli and Western Ghats"],
    answer: 0,
    explanation: "Correct answer: Karakoram, Ladakh Range and Zanskar Range.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 36,
    scope: "India",
    category: "Relief",
    difficulty: "Hard",
    question: "The source maps Pir Panjal with which two broad state/UT units?",
    options: ["Jammu & Kashmir and Himachal Pradesh", "Ladakh and Sikkim", "Uttarakhand and Haryana", "Punjab and Rajasthan"],
    answer: 0,
    explanation: "Correct answer: Jammu & Kashmir and Himachal Pradesh.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 37,
    scope: "India",
    category: "Relief",
    difficulty: "Medium",
    question: "Which set is entirely associated with the Western Ghats in the source data?",
    options: ["Gujarat, Maharashtra, Goa, Karnataka, Kerala and Tamil Nadu", "Rajasthan, Gujarat, Haryana and Punjab", "Odisha, Bihar, Jharkhand and West Bengal", "Jammu & Kashmir, Ladakh and Himachal Pradesh"],
    answer: 0,
    explanation: "Correct answer: Gujarat, Maharashtra, Goa, Karnataka, Kerala and Tamil Nadu.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 38,
    scope: "India",
    category: "Relief",
    difficulty: "Hard",
    question: "Nilgiri Hills are mapped with which three states?",
    options: ["Tamil Nadu, Kerala and Karnataka", "Maharashtra, Goa and Gujarat", "Odisha, Andhra Pradesh and Telangana", "Punjab, Haryana and Rajasthan"],
    answer: 0,
    explanation: "Correct answer: Tamil Nadu, Kerala and Karnataka.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 39,
    scope: "India",
    category: "Passes",
    difficulty: "Hard",
    question: "Consider the following pairs: 1. Zoji La — Jammu & Kashmir/Ladakh 2. Nathu La — Sikkim 3. Sela Pass — Arunachal Pradesh. Which are correctly matched?",
    options: ["1 only", "1 and 2 only", "2 and 3 only", "1, 2 and 3"],
    answer: 3,
    explanation: "Correct answer: 1, 2 and 3.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 40,
    scope: "India",
    category: "Passes",
    difficulty: "Medium",
    question: "Which pass is mapped exclusively with Sikkim in the source list?",
    options: ["Zoji La", "Nathu La", "Shipki La", "Rohtang Pass"],
    answer: 1,
    explanation: "Correct answer: Nathu La.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 41,
    scope: "India",
    category: "Passes",
    difficulty: "Medium",
    question: "Which pair is correctly matched?",
    options: ["Shipki La — Sikkim", "Shipki La — Himachal Pradesh", "Shipki La — Arunachal Pradesh", "Shipki La — Ladakh"],
    answer: 1,
    explanation: "Correct answer: Shipki La — Himachal Pradesh.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 42,
    scope: "India",
    category: "Passes",
    difficulty: "Hard",
    question: "Which set contains only passes associated with the Himalayan states/UTs listed in the source?",
    options: ["Zoji La, Nathu La, Rohtang Pass, Sela Pass", "Zoji La, Aravalli Pass, Nathu La, Nilgiri Pass", "Khardung La, Satpura Pass, Shipki La, Sela Pass", "Fotu La, Vindhya Pass, Rohtang Pass, Nathu La"],
    answer: 0,
    explanation: "Correct answer: Zoji La, Nathu La, Rohtang Pass, Sela Pass.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 43,
    scope: "India",
    category: "Ecology",
    difficulty: "Hard",
    question: "Which set contains only protected areas listed in the source under Assam?",
    options: ["Kaziranga, Manas and Dibru-Saikhowa", "Dudhwa, Corbett and Nanda Devi", "Gir, Ranthambore and Keoladeo", "Kanha, Bandhavgarh and Pench"],
    answer: 0,
    explanation: "Correct answer: Kaziranga, Manas and Dibru-Saikhowa.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 44,
    scope: "India",
    category: "Ecology",
    difficulty: "Hard",
    question: "Which state has both Kawal Tiger Reserve and Amrabad Tiger Reserve in the source data?",
    options: ["Maharashtra", "Telangana", "Madhya Pradesh", "Karnataka"],
    answer: 1,
    explanation: "Correct answer: Telangana.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 45,
    scope: "India",
    category: "Ecology",
    difficulty: "Medium",
    question: "Which pair is correctly matched?",
    options: ["Dampa Tiger Reserve — Manipur", "Dampa Tiger Reserve — Mizoram", "Dampa Tiger Reserve — Meghalaya", "Dampa Tiger Reserve — Nagaland"],
    answer: 1,
    explanation: "Correct answer: Dampa Tiger Reserve — Mizoram.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 46,
    scope: "India",
    category: "Ecology",
    difficulty: "Hard",
    question: "Which set contains only protected areas associated with Rajasthan in the source data?",
    options: ["Ranthambore, Keoladeo and Desert National Park", "Gir, Kanha and Pench", "Bandipur, Nagarahole and Periyar", "Dudhwa, Corbett and Sundarbans"],
    answer: 0,
    explanation: "Correct answer: Ranthambore, Keoladeo and Desert National Park.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 47,
    scope: "India",
    category: "Ecology",
    difficulty: "Hard",
    question: "Which state contains the source-listed combination of Kanha, Bandhavgarh and Pench?",
    options: ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Chhattisgarh"],
    answer: 0,
    explanation: "Correct answer: Madhya Pradesh.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 48,
    scope: "India",
    category: "Ecology",
    difficulty: "Medium",
    question: "Which marine protected-area pair is correctly matched?",
    options: ["Gulf of Mannar — Kerala; Mahatma Gandhi Marine — Goa", "Gulf of Mannar — Tamil Nadu; Mahatma Gandhi Marine — Andaman & Nicobar Islands", "Gulf of Mannar — Odisha; Mahatma Gandhi Marine — Gujarat", "Both — Maharashtra"],
    answer: 1,
    explanation: "Correct answer: Gulf of Mannar — Tamil Nadu; Mahatma Gandhi Marine — Andaman & Nicobar Islands.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 49,
    scope: "India",
    category: "Ecology",
    difficulty: "Hard",
    question: "Which of the following is NOT in the source-listed Karnataka protected-area set?",
    options: ["Bandipur National Park", "Nagarahole National Park", "Gir National Park", "Both Bandipur and Nagarahole"],
    answer: 2,
    explanation: "Correct answer: Gir National Park.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 50,
    scope: "India",
    category: "Ecology",
    difficulty: "Medium",
    question: "Which pair is correctly matched according to the source?",
    options: ["Keibul Lamjao — Mizoram", "Keibul Lamjao — Manipur", "Keibul Lamjao — Assam", "Keibul Lamjao — Tripura"],
    answer: 1,
    explanation: "Correct answer: Keibul Lamjao — Manipur.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 51,
    scope: "India",
    category: "Wetlands",
    difficulty: "Hard",
    question: "Which three wetlands are all mapped to Kerala in the source data?",
    options: ["Vembanad, Sasthamkotta and Ashtamudi", "Chilika, Pulicat and Kolleru", "Loktak, Wular and Dal", "Sambhar, Keoladeo and Ashtamudi"],
    answer: 0,
    explanation: "Correct answer: Vembanad, Sasthamkotta and Ashtamudi.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 52,
    scope: "India",
    category: "Biosphere",
    difficulty: "Hard",
    question: "Which set contains only biosphere reserves listed in the source?",
    options: ["Nilgiri, Agasthyamalai, Gulf of Mannar and Great Nicobar", "Gir, Kaziranga, Kanha and Corbett", "Sundarbans, Dudhwa, Pench and Bandipur", "Dholavira, Hampi, Khajuraho and Nalanda"],
    answer: 0,
    explanation: "Correct answer: Nilgiri, Agasthyamalai, Gulf of Mannar and Great Nicobar.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 53,
    scope: "India",
    category: "Biosphere",
    difficulty: "Medium",
    question: "Which biosphere reserve is associated with the Great Rann of Kutch in the source list?",
    options: ["Great Rann of Kutch", "Nilgiri", "Nokrek", "Panna"],
    answer: 0,
    explanation: "Correct answer: Great Rann of Kutch.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 54,
    scope: "India",
    category: "Biosphere",
    difficulty: "Hard",
    question: "Which pair is correctly matched?",
    options: ["Achanakmar-Amarkantak — Gujarat/Rajasthan region", "Achanakmar-Amarkantak — Madhya Pradesh/Chhattisgarh region", "Achanakmar-Amarkantak — Kerala/Tamil Nadu region", "Achanakmar-Amarkantak — Assam/Arunachal Pradesh region"],
    answer: 1,
    explanation: "Correct answer: Achanakmar-Amarkantak — Madhya Pradesh/Chhattisgarh region.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 55,
    scope: "India",
    category: "Soils",
    difficulty: "Hard",
    question: "Which set contains only states included in the source Black Soil association?",
    options: ["Madhya Pradesh, Maharashtra, Gujarat, Karnataka and Telangana", "Kerala, Goa, Odisha, Tamil Nadu and Rajasthan", "Rajasthan, Gujarat, Punjab, Haryana and Delhi", "Assam, Meghalaya, Nagaland, Manipur and Mizoram"],
    answer: 0,
    explanation: "Correct answer: Madhya Pradesh, Maharashtra, Gujarat, Karnataka and Telangana.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 56,
    scope: "India",
    category: "Soils",
    difficulty: "Hard",
    question: "Which soil is associated with Rajasthan and Gujarat in the source data?",
    options: ["Black Soil", "Red Soil", "Desert Soil", "Mountain Soil"],
    answer: 2,
    explanation: "Correct answer: Desert Soil.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 57,
    scope: "India",
    category: "Soils",
    difficulty: "Medium",
    question: "Which set contains only states listed under Laterite Soil?",
    options: ["Kerala, Karnataka, Goa, Maharashtra, Odisha and Tamil Nadu", "Rajasthan, Gujarat and Punjab", "Madhya Pradesh, Maharashtra and Telangana", "Himachal Pradesh, Uttarakhand and Ladakh"],
    answer: 0,
    explanation: "Correct answer: Kerala, Karnataka, Goa, Maharashtra, Odisha and Tamil Nadu.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 58,
    scope: "India",
    category: "UNESCO",
    difficulty: "Hard",
    question: "Which set contains only source-listed UNESCO sites from Maharashtra?",
    options: ["Ajanta, Ellora, Elephanta and Chhatrapati Shivaji Terminus", "Hampi, Pattadakal, Ajanta and Ellora", "Dholavira, Rani-ki-Vav, Ajanta and Ellora", "Khajuraho, Ajanta, Ellora and Konark"],
    answer: 0,
    explanation: "Correct answer: Ajanta, Ellora, Elephanta and Chhatrapati Shivaji Terminus.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 59,
    scope: "India",
    category: "UNESCO",
    difficulty: "Hard",
    question: "Which pair is correctly matched?",
    options: ["Nalanda Mahavihara — Odisha", "Nalanda Mahavihara — Bihar", "Nalanda Mahavihara — Uttar Pradesh", "Nalanda Mahavihara — Madhya Pradesh"],
    answer: 1,
    explanation: "Correct answer: Nalanda Mahavihara — Bihar.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 60,
    scope: "India",
    category: "UNESCO",
    difficulty: "Medium",
    question: "Which pair of UNESCO sites is associated with Gujarat in the source list?",
    options: ["Dholavira and Rani-ki-Vav", "Dholavira and Hampi", "Rani-ki-Vav and Konark", "Dholavira and Khajuraho"],
    answer: 0,
    explanation: "Correct answer: Dholavira and Rani-ki-Vav.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 61,
    scope: "India",
    category: "UNESCO",
    difficulty: "Hard",
    question: "Which set is entirely associated with Karnataka?",
    options: ["Hampi and Pattadakal", "Ajanta and Ellora", "Konark and Khajuraho", "Nalanda and Mahabodhi"],
    answer: 0,
    explanation: "Correct answer: Hampi and Pattadakal.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 62,
    scope: "India",
    category: "Ports",
    difficulty: "Hard",
    question: "Which sequence follows the source's west-to-east style coastal port grouping most plausibly?",
    options: ["Kandla → Mumbai → Mormugao → New Mangalore → Kochi", "Kochi → Mumbai → Kandla → Chennai → Mormugao", "Paradip → Kandla → Kochi → Mumbai → Kolkata", "Kolkata → Chennai → Kochi → Kandla → Paradip"],
    answer: 0,
    explanation: "Correct answer: Kandla → Mumbai → Mormugao → New Mangalore → Kochi.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 63,
    scope: "India",
    category: "Ports",
    difficulty: "Medium",
    question: "Which port-state pair is correctly matched?",
    options: ["Paradip — Gujarat", "Paradip — Odisha", "Paradip — Kerala", "Paradip — Tamil Nadu"],
    answer: 1,
    explanation: "Correct answer: Paradip — Odisha.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 64,
    scope: "India",
    category: "Ports",
    difficulty: "Medium",
    question: "Which source-listed port is associated with Goa?",
    options: ["Kochi", "Mormugao", "New Mangalore", "Kandla"],
    answer: 1,
    explanation: "Correct answer: Mormugao.",
    source: "Mapping Class 2026 source data",
  },
  {
    id: 65,
    scope: "World",
    category: "Seas",
    difficulty: "Hard",
    question: "Which set contains only Baltic Sea littoral countries listed in the source?",
    options: ["Germany, Poland, Lithuania, Latvia, Estonia, Finland and Sweden", "France, Spain, Portugal, Italy, Greece and Türkiye", "Russia, Iran, Azerbaijan, Kazakhstan and Turkmenistan", "Norway, Iceland, Ireland, UK and France"],
    answer: 0,
    explanation: "Correct answer: Germany, Poland, Lithuania, Latvia, Estonia, Finland and Sweden.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 66,
    scope: "World",
    category: "Seas",
    difficulty: "Hard",
    question: "Which sequence connects the Black Sea to the Mediterranean in the source mapping?",
    options: ["Black Sea → Bosporus → Sea of Marmara → Dardanelles", "Black Sea → Gibraltar → Mediterranean", "Black Sea → Suez → Red Sea", "Black Sea → Bering Strait → Pacific"],
    answer: 0,
    explanation: "Correct answer: Black Sea → Bosporus → Sea of Marmara → Dardanelles.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 67,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question: "Which country is a littoral state of both the Black Sea and the Mediterranean system in the source geography?",
    options: ["Türkiye", "Germany", "Poland", "Kazakhstan"],
    answer: 0,
    explanation: "Correct answer: Türkiye.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 68,
    scope: "World",
    category: "Seas",
    difficulty: "Hard",
    question: "Which set contains only Caspian Sea littoral states?",
    options: ["Russia, Kazakhstan, Turkmenistan, Iran and Azerbaijan", "Russia, Ukraine, Georgia, Türkiye and Bulgaria", "Iran, Iraq, Kuwait, Qatar and Bahrain", "Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan and Turkmenistan"],
    answer: 0,
    explanation: "Correct answer: Russia, Kazakhstan, Turkmenistan, Iran and Azerbaijan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 69,
    scope: "World",
    category: "Seas",
    difficulty: "Hard",
    question: "Which pair of seas is explicitly important for the Northern Sea Route sequence in the source?",
    options: ["Kara Sea and Laptev Sea", "Mediterranean Sea and Red Sea", "Baltic Sea and Black Sea", "Arabian Sea and Bay of Bengal"],
    answer: 0,
    explanation: "Correct answer: Kara Sea and Laptev Sea.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 70,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question: "Which sea is mapped between Alaska and Russia?",
    options: ["Bering Sea", "Baltic Sea", "Barents Sea", "Caspian Sea"],
    answer: 0,
    explanation: "Correct answer: Bering Sea.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 71,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question: "Which two countries are associated with the Barents Sea in the source feature data?",
    options: ["Russia and Norway", "Russia and Finland", "Norway and Sweden", "Denmark and Germany"],
    answer: 0,
    explanation: "Correct answer: Russia and Norway.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 72,
    scope: "World",
    category: "Seas",
    difficulty: "Hard",
    question: "Which group contains only East Asian marginal seas listed in the source world map?",
    options: ["South China Sea, East China Sea and Sea of Japan", "Caspian Sea, Baltic Sea and Black Sea", "Mediterranean, Red Sea and Arabian Sea", "Bering, Barents and Caspian"],
    answer: 0,
    explanation: "Correct answer: South China Sea, East China Sea and Sea of Japan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 73,
    scope: "World",
    category: "Seas",
    difficulty: "Medium",
    question: "The South China Sea feature in the source is associated with which strategic geography?",
    options: ["Spratly/Paracel island systems and maritime routes", "Northern Sea Route and Bering Strait", "Aral Sea drainage and Central Asian irrigation", "Baltic Sea and Danish straits only"],
    answer: 0,
    explanation: "Correct answer: Spratly/Paracel island systems and maritime routes.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 74,
    scope: "World",
    category: "Rivers",
    difficulty: "Hard",
    question: "The Mekong mapping cluster in the source includes which country at its upstream end?",
    options: ["China", "India", "Bangladesh", "Japan"],
    answer: 0,
    explanation: "Correct answer: China.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 75,
    scope: "World",
    category: "Rivers",
    difficulty: "Medium",
    question: "Which set contains only countries included in the Mekong mapping cluster?",
    options: ["Laos, Thailand, Cambodia and Vietnam", "India, Nepal, Bhutan and Bangladesh", "Russia, Ukraine, Romania and Bulgaria", "Egypt, Sudan, Ethiopia and Kenya"],
    answer: 0,
    explanation: "Correct answer: Laos, Thailand, Cambodia and Vietnam.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 76,
    scope: "World",
    category: "Central Asia",
    difficulty: "Hard",
    question: "Which pair of rivers is historically associated with the Aral Sea system in the source?",
    options: ["Amu Darya and Syr Darya", "Nile and Congo", "Danube and Dnieper", "Mekong and Irrawaddy"],
    answer: 0,
    explanation: "Correct answer: Amu Darya and Syr Darya.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 77,
    scope: "World",
    category: "West Asia",
    difficulty: "Hard",
    question: "Which country is NOT a land neighbour of Syria in the source mapping?",
    options: ["Turkey", "Iraq", "Jordan", "Azerbaijan"],
    answer: 3,
    explanation: "Correct answer: Azerbaijan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 78,
    scope: "World",
    category: "West Asia",
    difficulty: "Hard",
    question: "Which set contains only Iran's source-listed land neighbours?",
    options: ["Iraq, Turkey, Armenia, Azerbaijan, Turkmenistan, Afghanistan and Pakistan", "Iraq, Syria, Jordan, Lebanon, Israel, Kuwait and Bahrain", "Turkey, Georgia, Russia, Armenia, Greece, Iraq and Syria", "Pakistan, India, Nepal, Afghanistan, China, Tajikistan and Uzbekistan"],
    answer: 0,
    explanation: "Correct answer: Iraq, Turkey, Armenia, Azerbaijan, Turkmenistan, Afghanistan and Pakistan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 79,
    scope: "World",
    category: "Arctic",
    difficulty: "Hard",
    question: "Which is the correct Northern Sea Route sequence given in the source notes?",
    options: ["Barents → Kara → Laptev → East Siberian → Chukchi → Bering Strait", "Baltic → North Sea → Mediterranean → Suez → Red Sea", "Black → Marmara → Aegean → Mediterranean → Gibraltar", "Bering → Chukchi → Kara → Barents → Baltic"],
    answer: 0,
    explanation: "Correct answer: Barents → Kara → Laptev → East Siberian → Chukchi → Bering Strait.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 80,
    scope: "World",
    category: "Arctic",
    difficulty: "Medium",
    question: "Which sea follows the Kara Sea in the source Northern Sea Route sequence?",
    options: ["Laptev Sea", "Bering Sea", "Baltic Sea", "Barents Sea"],
    answer: 0,
    explanation: "Correct answer: Laptev Sea.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 81,
    scope: "World",
    category: "Arctic",
    difficulty: "Medium",
    question: "Which strait forms the eastern end of the Northern Sea Route sequence in the source?",
    options: ["Bering Strait", "Strait of Gibraltar", "Strait of Hormuz", "Bosporus"],
    answer: 0,
    explanation: "Correct answer: Bering Strait.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 82,
    scope: "World",
    category: "Africa",
    difficulty: "Hard",
    question: "Lake Natron is associated with which country in the source feature mapping?",
    options: ["Tanzania", "Uganda", "Ethiopia", "Kenya"],
    answer: 0,
    explanation: "Correct answer: Tanzania.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 83,
    scope: "World",
    category: "Africa",
    difficulty: "Medium",
    question: "Which country pair is associated with Lake Natron in the source note?",
    options: ["Tanzania and Kenya", "Kenya and Uganda", "Tanzania and Rwanda", "Ethiopia and Sudan"],
    answer: 0,
    explanation: "Correct answer: Tanzania and Kenya.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 84,
    scope: "World",
    category: "Indian Ocean",
    difficulty: "Medium",
    question: "Which island/territory in the source world mapping is associated with France?",
    options: ["Réunion", "Maldives", "Seychelles", "Comoros"],
    answer: 0,
    explanation: "Correct answer: Réunion.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 85,
    scope: "World",
    category: "Conflict Geography",
    difficulty: "Medium",
    question: "Which location appears in the source Major Conflict Regions mapping sheet?",
    options: ["Donbas", "Sahara", "Gobi", "Patagonia"],
    answer: 0,
    explanation: "Correct answer: Donbas.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 86,
    scope: "World",
    category: "Countries",
    difficulty: "Hard",
    question: "Which country group is correctly matched with Syria as a land neighbour set?",
    options: ["Türkiye, Iraq, Jordan, Israel and Lebanon", "Iran, Iraq, Kuwait, Jordan and Egypt", "Türkiye, Greece, Armenia, Georgia and Azerbaijan", "Lebanon, Cyprus, Egypt, Libya and Israel"],
    answer: 0,
    explanation: "Correct answer: Türkiye, Iraq, Jordan, Israel and Lebanon.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 87,
    scope: "World",
    category: "Countries",
    difficulty: "Hard",
    question: "Which pair is correctly matched according to the source world mapping?",
    options: ["Armenia — Iran neighbour", "Egypt — Iran land neighbour", "Lebanon — Iran land neighbour", "Saudi Arabia — Syria land neighbour"],
    answer: 0,
    explanation: "Correct answer: Armenia — Iran neighbour.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 88,
    scope: "World",
    category: "Indian Ocean",
    difficulty: "Hard",
    question: "Which location is correctly classified as an overseas French territory/region in the source mapping?",
    options: ["Réunion", "Sri Lanka", "Maldives", "Mauritius"],
    answer: 0,
    explanation: "Correct answer: Réunion.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 89,
    scope: "World",
    category: "Europe",
    difficulty: "Hard",
    question: "Which set contains only Baltic Sea littoral countries from the source?",
    options: ["Denmark, Germany, Poland, Lithuania, Latvia, Estonia, Finland, Sweden and Russia", "France, Spain, Portugal, Italy, Greece, Albania, Croatia and Slovenia", "Norway, Iceland, Ireland, UK, France and Spain", "Russia, Ukraine, Romania, Bulgaria, Türkiye and Georgia"],
    answer: 0,
    explanation: "Correct answer: Denmark, Germany, Poland, Lithuania, Latvia, Estonia, Finland, Sweden and Russia.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 90,
    scope: "World",
    category: "Europe",
    difficulty: "Medium",
    question: "The Baltic Sea is connected to the North Sea through which general route?",
    options: ["Danish straits", "Bosporus and Dardanelles", "Strait of Gibraltar", "Bering Strait"],
    answer: 0,
    explanation: "Correct answer: Danish straits.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 91,
    scope: "World",
    category: "Mediterranean",
    difficulty: "Hard",
    question: "Which statement best matches the source mapping of the Mediterranean Sea?",
    options: ["It lies between Europe, Africa and Asia and connects to the Atlantic through Gibraltar", "It lies entirely within Asia and drains to the Arctic", "It is an enclosed lake between Russia and Iran", "It connects the Pacific to the Arctic through Bering"],
    answer: 0,
    explanation: "Correct answer: It lies between Europe, Africa and Asia and connects to the Atlantic through Gibraltar.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 92,
    scope: "World",
    category: "East Asia",
    difficulty: "Hard",
    question: "Which country is NOT included in the source littoral list for the East China Sea?",
    options: ["China", "Japan", "South Korea", "Vietnam"],
    answer: 3,
    explanation: "Correct answer: Vietnam.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 93,
    scope: "World",
    category: "East Asia",
    difficulty: "Hard",
    question: "Which set contains the source-listed countries associated with the Sea of Japan?",
    options: ["Japan, South Korea, North Korea and Russia", "Japan, China, Vietnam and Philippines", "Russia, Finland, Sweden and Denmark", "Türkiye, Georgia, Russia and Ukraine"],
    answer: 0,
    explanation: "Correct answer: Japan, South Korea, North Korea and Russia.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 94,
    scope: "World",
    category: "Arctic",
    difficulty: "Hard",
    question: "Which two seas in the source are both Russian Arctic seas?",
    options: ["Kara Sea and Laptev Sea", "Baltic Sea and Black Sea", "Bering Sea and Caspian Sea", "Mediterranean Sea and Barents Sea"],
    answer: 0,
    explanation: "Correct answer: Kara Sea and Laptev Sea.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 95,
    scope: "World",
    category: "Mapping Clusters",
    difficulty: "Hard",
    question: "Which cluster is most strongly associated with Central Asian inland-water geography in the source?",
    options: ["Aral Sea and Caspian Sea", "Baltic Sea and Bering Sea", "Mediterranean Sea and Black Sea", "South China Sea and East China Sea"],
    answer: 0,
    explanation: "Correct answer: Aral Sea and Caspian Sea.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 96,
    scope: "World",
    category: "Mapping Clusters",
    difficulty: "Hard",
    question: "Which cluster is most strongly associated with Arctic maritime geography in the source?",
    options: ["Barents, Kara, Laptev, East Siberian and Chukchi seas", "Baltic, Black, Caspian and Mediterranean seas", "South China, East China and Mediterranean seas", "Aral, Caspian and Black seas"],
    answer: 0,
    explanation: "Correct answer: Barents, Kara, Laptev, East Siberian and Chukchi seas.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 97,
    scope: "World",
    category: "Mapping Clusters",
    difficulty: "Hard",
    question: "Which option contains one Central Asian inland-water feature and one Arctic feature?",
    options: ["Aral Sea and Kara Sea", "Baltic Sea and Mediterranean Sea", "Black Sea and Caspian Sea", "South China Sea and East China Sea"],
    answer: 0,
    explanation: "Correct answer: Aral Sea and Kara Sea.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 98,
    scope: "World",
    category: "Mapping Clusters",
    difficulty: "Medium",
    question: "Which pair is correctly matched?",
    options: ["Aral Sea — Kazakhstan and Uzbekistan", "Baltic Sea — Russia and Iran", "Caspian Sea — India and Pakistan", "Bering Sea — France and Spain"],
    answer: 0,
    explanation: "Correct answer: Aral Sea — Kazakhstan and Uzbekistan.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 99,
    scope: "World",
    category: "Mapping Clusters",
    difficulty: "Hard",
    question: "Which set contains only source-mentioned geopolitical/map hotspots?",
    options: ["Donbas, South China Sea and Arctic/Northern Sea Route", "Gobi, Sahara and Thar only", "Amazon, Andes and Pampas only", "Deccan, Western Ghats and Nilgiri only"],
    answer: 0,
    explanation: "Correct answer: Donbas, South China Sea and Arctic/Northern Sea Route.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 100,
    scope: "World",
    category: "Map Elimination",
    difficulty: "Hard",
    question: "Which one of the following pairs is incorrectly matched with the source world mapping?",
    options: ["Aral Sea — Kazakhstan/Uzbekistan", "Barents Sea — Russia/Norway", "Bering Sea — Russia/United States", "Bering Sea — France"],
    answer: 3,
    explanation: "Correct answer: Bering Sea — France.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 101,
    scope: "World",
    category: "Map Elimination",
    difficulty: "Hard",
    question: "Which one of the following pairs is incorrectly matched?",
    options: ["Caspian Sea — Azerbaijan", "Caspian Sea — Iran", "Caspian Sea — Turkmenistan", "Caspian Sea — Georgia"],
    answer: 3,
    explanation: "Correct answer: Caspian Sea — Georgia.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 102,
    scope: "World",
    category: "Map Elimination",
    difficulty: "Hard",
    question: "Which one of the following is NOT part of the source Northern Sea Route chain?",
    options: ["Kara Sea", "Laptev Sea", "Chukchi Sea", "Dardanelles"],
    answer: 3,
    explanation: "Correct answer: Dardanelles.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 103,
    scope: "World",
    category: "Map Elimination",
    difficulty: "Hard",
    question: "Which one of the following is NOT listed among the Black Sea littoral countries in the source?",
    options: ["Bulgaria", "Romania", "Georgia", "Poland"],
    answer: 3,
    explanation: "Correct answer: Poland.",
    source: "Mapping Class 2026 source material",
  },
  {
    id: 104,
    scope: "World",
    category: "Map Elimination",
    difficulty: "Hard",
    question: "Which one of the following is NOT a source-listed Caspian littoral state?",
    options: ["Kazakhstan", "Azerbaijan", "Iran", "Uzbekistan"],
    answer: 3,
    explanation: "Correct answer: Uzbekistan.",
    source: "Mapping Class 2026 source material",
  }
];

const categories = [
  "All",
  ...Array.from(new Set(QUESTIONS.map((q) => q.category))),
];

export default function MapPrelimsTest() {
  const [scope, setScope] = useState("All");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [count, setCount] = useState(30);

  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const filteredQuestions = useMemo(() => {
    return QUESTIONS.filter(
      (q) =>
        (scope === "All" || q.scope === scope) &&
        (category === "All" || q.category === category) &&
        (difficulty === "All" || q.difficulty === difficulty)
    );
  }, [scope, category, difficulty]);

  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timer);
          setSubmitted(true);
          return 0;
        }

        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, submitted, timeLeft]);

  function startTest() {
    const selected = [...filteredQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, filteredQuestions.length));

    setQuestions(selected);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setStarted(true);
    setTimeLeft(selected.length * 60);
  }

  function getResult() {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];

      if (selected === undefined) {
        unanswered++;
      } else if (selected === q.answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    return {
      correct,
      wrong,
      unanswered,
      score: correct * 2 - wrong * 0.66,
      accuracy:
        correct + wrong === 0
          ? 0
          : (correct / (correct + wrong)) * 100,
    };
  }

  if (!started) {
    return (
      <SetupScreen
        scope={scope}
        setScope={setScope}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        count={count}
        setCount={setCount}
        categories={categories}
        filteredQuestions={filteredQuestions}
        startTest={startTest}
      />
    );
  }

  if (submitted) {
    return (
      <ResultScreen
        questions={questions}
        answers={answers}
        getResult={getResult}
        reset={() => {
          setStarted(false);
          setSubmitted(false);
        }}
      />
    );
  }

  const q = questions[current];

  return (
    <main className="bd-test">
      <style jsx global>{styles}</style>

      <div className="bd-shell">
        <header className="test-top">
          <div>
            <div className="eyebrow">
              BHARAT DARSHAN • MAP PRELIMS
            </div>

            <h1>Map Prelims Test</h1>

            <p>Practice Mode • Mapping Class 2026</p>
          </div>

          <div className="timer">
            <span>TIME LEFT</span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
        </header>

        <div className="progress-info">
          <span>
            Question {current + 1} of {questions.length}
          </span>

          <span>
            {Object.keys(answers).length} answered
          </span>
        </div>

        <div className="progress-bar">
          <div
            style={{
              width: `${((current + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <section className="test-layout">
          <article className="question-card">
            <div className="question-meta">
              <span className="pill blue">{q.scope}</span>
              <span className="pill">{q.category}</span>
              <span className="pill">{q.difficulty}</span>
              <span className="pill purple">PRACTICE</span>
            </div>

            <div className="question-number">
              QUESTION {String(current + 1).padStart(2, "0")}
            </div>

            <h2>{q.question}</h2>

            <div className="options">
              {q.options.map((option, index) => {
                const selected = answers[q.id] === index;

                return (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: index,
                      }))
                    }
                    className={`option ${
                      selected ? "selected" : ""
                    }`}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span>{option}</span>

                    <b>{selected ? "✓" : ""}</b>
                  </button>
                );
              })}
            </div>

            <div className="question-actions">
              <button
                className="ghost-btn"
                disabled={current === 0}
                onClick={() =>
                  setCurrent((value) => value - 1)
                }
              >
                ← Previous
              </button>

              {current < questions.length - 1 ? (
                <button
                  className="primary-btn"
                  onClick={() =>
                    setCurrent((value) => value + 1)
                  }
                >
                  Next Question →
                </button>
              ) : (
                <button
                  className="submit-btn"
                  onClick={() => setSubmitted(true)}
                >
                  Submit Test
                </button>
              )}
            </div>
          </article>

          <aside className="palette-card">
            <div className="side-title">
              <div>
                <div className="eyebrow">TEST CONTROL</div>
                <h3>Question Palette</h3>
              </div>

              <span>{questions.length}</span>
            </div>

            <div className="palette">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrent(index)}
                  className={`
                    ${index === current ? "active" : ""}
                    ${
                      answers[question.id] !== undefined
                        ? "answered"
                        : ""
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="legend">
              <div>
                <i className="dot current-dot" />
                Current
              </div>

              <div>
                <i className="dot answered-dot" />
                Answered
              </div>

              <div>
                <i className="dot" />
                Unanswered
              </div>
            </div>

            <div className="marking-box">
              <b>MARKING SCHEME</b>

              <span>
                <strong>+2</strong> Correct
              </span>

              <span>
                <strong>-0.66</strong> Wrong
              </span>

              <span>
                <strong>0</strong> Unanswered
              </span>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SetupScreen({
  scope,
  setScope,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  count,
  setCount,
  categories,
  filteredQuestions,
  startTest,
}) {
  return (
    <main className="bd-test">
      <style jsx global>{styles}</style>

      <div className="bd-shell">
        <header className="setup-head">
          <div className="eyebrow">
            SAMBHAV UPSC • BHARAT DARSHAN
          </div>

          <h1>Map Prelims Test</h1>

          <p>Practice • Analyse • Improve</p>
        </header>

        <section className="hero-card">
          <div className="hero-icon">🎯</div>

          <div>
            <span className="practice-badge">
              PRACTICE MODE
            </span>

            <h2>Map Intelligence Challenge</h2>

            <p>
              UPSC-style map practice based on the Mapping Class
              2026 material. Authentic PYQs remain separate.
            </p>
          </div>
        </section>

        <section className="setup-grid">
          <div className="setup-panel">
            <Step
              number="01"
              title="Choose your scope"
              subtitle="India, World or Mixed"
            />

            <div className="segmented">
              {["All", "India", "World"].map((item) => (
                <button
                  key={item}
                  className={scope === item ? "active" : ""}
                  onClick={() => setScope(item)}
                >
                  {item === "All" ? "Mixed" : item}
                </button>
              ))}
            </div>

            <Step
              number="02"
              title="Choose category"
              subtitle="Filter the mapping topic"
              extra
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <Step
              number="03"
              title="Difficulty"
              subtitle="Set your challenge level"
              extra
            />

            <div className="segmented four">
              {["All", "Easy", "Medium", "Hard"].map(
                (item) => (
                  <button
                    key={item}
                    className={
                      difficulty === item ? "active" : ""
                    }
                    onClick={() =>
                      setDifficulty(item)
                    }
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="setup-panel">
            <Step
              number="04"
              title="Test length"
              subtitle="Select number of questions"
            />

            <div className="length-grid">
              {[10, 20, 30].map((number) => (
                <button
                  key={number}
                  className={
                    count === number ? "active" : ""
                  }
                  onClick={() => setCount(number)}
                >
                  <strong>{number}</strong>
                  <span>Questions</span>
                </button>
              ))}
            </div>

            <div className="stats-grid">
              <div>
                <strong>{filteredQuestions.length}</strong>
                <span>Available</span>
              </div>

              <div>
                <strong>+2 / −0.66</strong>
                <span>Marking</span>
              </div>

              <div>
                <strong>
                  {Math.min(
                    count,
                    filteredQuestions.length
                  )}{" "}
                  min
                </strong>
                <span>Timer</span>
              </div>
            </div>

            <button
              className="start-button"
              disabled={!filteredQuestions.length}
              onClick={startTest}
            >
              <span>START MAP TEST</span>
              <strong>→</strong>
            </button>

            <div className="source-note">
              <b>i</b>

              <span>
                <strong>Practice only.</strong>{" "}
                Authentic UPSC PYQs will be integrated later
                through Prelims Intelligence.
              </span>
            </div>
          </div>
        </section>

        <section className="roadmap">
          <div className="eyebrow">
            BHARAT DARSHAN TEST ROADMAP
          </div>

          <div className="roadmap-grid">
            <div className="road active">
              <span>01</span>
              <strong>Map Practice</strong>
              <small>Available now</small>
            </div>

            <div className="road">
              <span>02</span>
              <strong>Prelims Intelligence</strong>
              <small>Authentic PYQs</small>
            </div>

            <div className="road">
              <span>03</span>
              <strong>Map PYQ Integration</strong>
              <small>Coming later</small>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  subtitle,
  extra = false,
}) {
  return (
    <div className={`step ${extra ? "extra-space" : ""}`}>
      <span>{number}</span>

      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function ResultScreen({
  questions,
  answers,
  getResult,
  reset,
}) {
  const result = getResult();

  return (
    <main className="bd-test">
      <style jsx global>{styles}</style>

      <div className="bd-shell">
        <header className="setup-head">
          <div className="eyebrow">
            BHARAT DARSHAN • TEST RESULT
          </div>

          <h1>Map Test Analysis</h1>

          <p>
            Practice performance • Review your mapping mistakes
          </p>
        </header>

        <section className="result-hero">
          <div className="score-circle">
            <strong>
              {result.score.toFixed(1)}
            </strong>

            <span>SCORE</span>
          </div>

          <div>
            <span className="practice-badge">
              TEST COMPLETE
            </span>

            <h2>
              {result.accuracy >= 70
                ? "Strong Mapping Performance"
                : "Keep Building Your Map Recall"}
            </h2>

            <p>
              Review incorrect questions below for active
              revision.
            </p>
          </div>
        </section>

        <div className="result-stats">
          <ResultStat
            label="Correct"
            value={result.correct}
            type="green"
          />

          <ResultStat
            label="Wrong"
            value={result.wrong}
            type="red"
          />

          <ResultStat
            label="Unanswered"
            value={result.unanswered}
          />

          <ResultStat
            label="Accuracy"
            value={`${result.accuracy.toFixed(1)}%`}
          />
        </div>

        <section className="review-section">
          <div className="eyebrow">REVIEW</div>

          <h2>Question Analysis</h2>

          {questions.map((question, index) => {
            const selected = answers[question.id];

            const correct =
              selected === question.answer;

            return (
              <article
                key={question.id}
                className={`review-card ${
                  correct
                    ? "correct-card"
                    : selected === undefined
                    ? "skip-card"
                    : "wrong-card"
                }`}
              >
                <div className="review-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <div className="question-meta">
                    <span className="pill">
                      {question.scope}
                    </span>

                    <span className="pill">
                      {question.category}
                    </span>
                  </div>

                  <h3>{question.question}</h3>

                  <div className="answer-row">
                    <span>Your answer</span>

                    <strong>
                      {selected === undefined
                        ? "Not answered"
                        : question.options[selected]}
                    </strong>
                  </div>

                  <div className="answer-row">
                    <span>Correct answer</span>

                    <strong className="green-text">
                      {question.options[
                        question.answer
                      ]}
                    </strong>
                  </div>

                  <p className="explanation">
                    {question.explanation}
                  </p>

                  <small className="source">
                    Source: {question.source}
                  </small>
                </div>
              </article>
            );
          })}
        </section>

        <div className="result-actions">
          <button
            className="ghost-btn"
            onClick={reset}
          >
            ← Change Test
          </button>

          <button
            className="primary-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            Retake Test →
          </button>
        </div>
      </div>
    </main>
  );
}

function ResultStat({
  label,
  value,
  type,
}) {
  return (
    <div>
      <span>{label}</span>

      <strong
        className={
          type === "green"
            ? "green-text"
            : type === "red"
            ? "red-text"
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remaining).padStart(2, "0")}`;
}

const styles = `
* {
  box-sizing: border-box;
}

.bd-test {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(54,125,214,.18),
      transparent 30%
    ),
    radial-gradient(
      circle at 90% 10%,
      rgba(56,196,151,.12),
      transparent 28%
    ),
    #07111f;
  color: #edf5ff;
  font-family: Inter, system-ui, sans-serif;
}

.bd-shell {
  max-width: 1180px;
  margin: auto;
}

.eyebrow {
  font-size: 10px;
  letter-spacing: .18em;
  color: #70dfbd;
  font-weight: 900;
  text-transform: uppercase;
}

.setup-head {
  text-align: center;
  padding: 32px 0 26px;
}

.setup-head h1 {
  font-size: 42px;
  line-height: 1.05;
  margin: 9px 0 8px;
  font-weight: 950;
  letter-spacing: -.05em;
}

.setup-head p,
.test-top p {
  margin: 0;
  color: #92a8c0;
  font-size: 14px;
}

.hero-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 25px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 24px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    ),
    #0d1a2b;
  box-shadow: 0 24px 70px rgba(0,0,0,.24);
}

.hero-card::after {
  content: "";
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  right: -80px;
  top: -100px;
  background: #8b63e8;
  filter: blur(65px);
  opacity: .15;
}

.hero-icon {
  position: relative;
  width: 62px;
  height: 62px;
  flex:none;
  display:grid;
  place-items:center;
  border-radius:17px;
  background:rgba(155,108,255,.13);
  border:1px solid rgba(155,108,255,.28);
  font-size:27px;
}

.practice-badge {
  display:inline-flex;
  padding:5px 9px;
  border-radius:999px;
  background:rgba(155,108,255,.12);
  border:1px solid rgba(155,108,255,.22);
  color:#c5aaff;
  font-size:9px;
  font-weight:900;
  letter-spacing:.12em;
}

.hero-card h2 {
  position:relative;
  margin:7px 0;
  font-size:25px;
}

.hero-card p {
  position:relative;
  margin:0;
  color:#93a7bd;
  font-size:13px;
  line-height:1.6;
}

.setup-grid {
  display:grid;
  grid-template-columns:1.1fr .9fr;
  gap:18px;
  margin-top:18px;
}

.setup-panel,
.question-card,
.palette-card,
.review-section {
  border:1px solid rgba(255,255,255,.1);
  border-radius:24px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    ),
    #0d1a2b;
  box-shadow:0 24px 70px rgba(0,0,0,.2);
}

.setup-panel {
  padding:24px;
}

.step {
  display:flex;
  gap:12px;
  align-items:center;
}

.step.extra-space {
  margin-top:23px;
}

.step > span {
  width:30px;
  height:30px;
  border-radius:9px;
  display:grid;
  place-items:center;
  background:rgba(101,168,255,.1);
  color:#8ec2ff;
  font-size:10px;
  font-weight:900;
}

.step strong {
  display:block;
  font-size:13px;
}

.step small {
  display:block;
  margin-top:3px;
  color:#657b93;
  font-size:10px;
}

.segmented {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:7px;
  margin-top:12px;
}

.segmented.four {
  grid-template-columns:repeat(4,1fr);
}

.segmented button,
.length-grid button {
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.035);
  color:#9fb1c5;
  border-radius:12px;
  padding:11px 8px;
  font-weight:800;
  font-size:11px;
  cursor:pointer;
}

.segmented button.active,
.length-grid button.active {
  background:rgba(112,223,189,.12);
  border-color:rgba(112,223,189,.35);
  color:#82e5c4;
}

select {
  width:100%;
  margin-top:12px;
  border:1px solid rgba(255,255,255,.1);
  background:#07111f;
  color:#dce9f7;
  border-radius:12px;
  padding:12px;
  font-size:12px;
  outline:none;
}

.length-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:13px;
}

.length-grid button strong {
  display:block;
  font-size:19px;
  color:#eaf3ff;
}

.length-grid button span {
  display:block;
  font-size:9px;
  color:#647a91;
}

.stats-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:20px;
}

.stats-grid div {
  padding:13px;
  border-radius:14px;
  background:rgba(255,255,255,.035);
}

.stats-grid strong {
  display:block;
  font-size:13px;
}

.stats-grid span {
  display:block;
  margin-top:3px;
  color:#647a91;
  font-size:9px;
}

.start-button {
  width:100%;
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:18px;
  padding:15px 17px;
  border:0;
  border-radius:14px;
  background:linear-gradient(
    135deg,
    #70dfbd,
    #4dcba7
  );
  color:#06151b;
  font-weight:950;
  font-size:12px;
  cursor:pointer;
}

.start-button:disabled {
  opacity:.4;
}

.source-note {
  display:flex;
  gap:9px;
  margin-top:13px;
  padding:12px;
  border-radius:13px;
  background:rgba(255,255,255,.025);
  color:#6e849b;
  font-size:10px;
  line-height:1.5;
}

.source-note > b {
  width:18px;
  height:18px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:rgba(112,223,189,.1);
  color:#70dfbd;
  flex:none;
}

.source-note strong {
  color:#9bb0c4;
}

.roadmap {
  margin-top:18px;
  padding:18px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:20px;
  background:rgba(255,255,255,.025);
}

.roadmap-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:12px;
}

.road {
  padding:12px;
  border-radius:13px;
  background:rgba(255,255,255,.025);
  border:1px solid transparent;
}

.road.active {
  border-color:rgba(112,223,189,.22);
}

.road span {
  font-size:9px;
  color:#61778e;
}

.road strong {
  display:block;
  margin-top:4px;
  font-size:11px;
}

.road small {
  display:block;
  margin-top:3px;
  color:#60758c;
  font-size:9px;
}

/* TEST SCREEN */

.test-top {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
  padding:18px 0;
}

.test-top h1 {
  font-size:28px;
  margin:7px 0 4px;
}

.timer {
  min-width:120px;
  padding:11px 16px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.035);
  text-align:center;
}

.timer span {
  display:block;
  font-size:8px;
  letter-spacing:.13em;
  color:#667d94;
  font-weight:900;
}

.timer strong {
  display:block;
  margin-top:2px;
  font-size:20px;
  color:#ff9a9a;
}

.progress-info {
  display:flex;
  justify-content:space-between;
  margin-bottom:7px;
  color:#667d94;
  font-size:10px;
  font-weight:800;
}

.progress-bar {
  height:4px;
  border-radius:99px;
  background:rgba(255,255,255,.06);
  overflow:hidden;
}

.progress-bar > div {
  height:100%;
  border-radius:99px;
  background:linear-gradient(
    90deg,
    #70dfbd,
    #65a8ff
  );
  transition:.2s;
}

.test-layout {
  display:grid;
  grid-template-columns:1fr 280px;
  gap:18px;
  margin-top:16px;
}

.question-card {
  padding:26px;
}

.question-meta {
  display:flex;
  gap:7px;
  flex-wrap:wrap;
}

.pill {
  padding:6px 9px;
  border-radius:999px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.07);
  color:#7f95ab;
  font-size:9px;
  font-weight:900;
}

.pill.blue {
  color:#8ec2ff;
  background:rgba(101,168,255,.08);
  border-color:rgba(101,168,255,.2);
}

.pill.purple {
  color:#c2a7ff;
  background:rgba(155,108,255,.08);
  border-color:rgba(155,108,255,.2);
}

.question-number {
  margin-top:26px;
  color:#5e748b;
  font-size:10px;
  font-weight:900;
  letter-spacing:.1em;
}

.question-card h2 {
  margin:7px 0 0;
  max-width:800px;
  font-size:22px;
  line-height:1.5;
}

.options {
  display:grid;
  gap:9px;
  margin-top:25px;
}

.option {
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  padding:15px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:15px;
  background:rgba(255,255,255,.025);
  color:#b7c7d9;
  text-align:left;
  font-size:12px;
  cursor:pointer;
  transition:.15s;
}

.option:hover {
  border-color:rgba(101,168,255,.3);
  background:rgba(101,168,255,.04);
}

.option.selected {
  border-color:rgba(112,223,189,.45);
  background:rgba(112,223,189,.08);
  color:#dffbf2;
}

.option-letter {
  width:28px;
  height:28px;
  display:grid;
  place-items:center;
  border-radius:9px;
  background:rgba(255,255,255,.05);
  color:#748aa0;
  font-weight:900;
  flex:none;
}

.option.selected .option-letter {
  background:#70dfbd;
  color:#06151b;
}

.option b {
  margin-left:auto;
  color:#70dfbd;
}

.question-actions {
  display:flex;
  gap:9px;
  margin-top:24px;
}

.ghost-btn,
.primary-btn,
.submit-btn {
  border:0;
  border-radius:12px;
  padding:12px 16px;
  font-size:10px;
  font-weight:900;
  cursor:pointer;
}

.ghost-btn {
  background:rgba(255,255,255,.05);
  color:#8da2b8;
}

.ghost-btn:disabled {
  opacity:.3;
}

.primary-btn {
  margin-left:auto;
  background:#70dfbd;
  color:#06151b;
}

.submit-btn {
  margin-left:auto;
  background:#ff9b9b;
  color:#210b0b;
}

.palette-card {
  padding:20px;
  height:max-content;
}

.side-title {
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.side-title h3 {
  margin:5px 0 0;
  font-size:15px;
}

.side-title > span {
  padding:6px 8px;
  border-radius:9px;
  background:rgba(255,255,255,.05);
  font-size:10px;
  color:#8da2b8;
}

.palette {
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:7px;
  margin-top:18px;
}

.palette button {
  height:38px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:9px;
  background:rgba(255,255,255,.025);
  color:#71879d;
  font-size:10px;
  font-weight:900;
  cursor:pointer;
}

.palette button.answered {
  background:rgba(112,223,189,.1);
  border-color:rgba(112,223,189,.25);
  color:#70dfbd;
}

.palette button.active {
  background:#70dfbd;
  color:#06151b;
  border-color:#70dfbd;
}

.legend {
  display:grid;
  gap:7px;
  margin-top:18px;
  padding-top:16px;
  border-top:1px solid rgba(255,255,255,.06);
  font-size:9px;
  color:#71879d;
}

.dot {
  display:inline-block;
  width:7px;
  height:7px;
  border-radius:50%;
  background:#3b4b5c;
  margin-right:6px;
}

.current-dot {
  background:#70dfbd;
}

.answered-dot {
  background:#3e927f;
}

.marking-box {
  display:grid;
  gap:6px;
  margin-top:18px;
  padding:13px;
  border-radius:14px;
  background:rgba(255,255,255,.025);
  font-size:9px;
  color:#657b92;
}

.marking-box b {
  color:#b5c7d8;
}

.marking-box strong {
  color:#70dfbd;
  margin-right:4px;
}

/* RESULT */

.result-hero {
  display:flex;
  align-items:center;
  gap:20px;
  padding:24px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:24px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    ),
    #0d1a2b;
}

.score-circle {
  width:100px;
  height:100px;
  border-radius:50%;
  display:grid;
  place-items:center;
  align-content:center;
  background:rgba(112,223,189,.08);
  border:5px solid rgba(112,223,189,.25);
  flex:none;
}

.score-circle strong {
  font-size:25px;
}

.score-circle span {
  font-size:8px;
  color:#658098;
  font-weight:900;
}

.result-hero h2 {
  margin:7px 0;
  font-size:23px;
}

.result-hero p {
  margin:0;
  color:#8ca2ba;
  font-size:12px;
}

.result-stats {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:9px;
  margin:16px 0;
}

.result-stats > div {
  padding:17px;
  border-radius:16px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.06);
}

.result-stats span {
  display:block;
  color:#657b92;
  font-size:9px;
}

.result-stats strong {
  display:block;
  margin-top:5px;
  font-size:20px;
}

.green-text {
  color:#70dfbd !important;
}

.red-text {
  color:#ff9b9b !important;
}

.review-section {
  padding:20px;
}

.review-section > h2 {
  margin:5px 0 15px;
  font-size:20px;
}

.review-card {
  display:grid;
  grid-template-columns:42px 1fr;
  gap:13px;
  margin-top:12px;
  padding:17px;
  border-radius:16px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.06);
}

.correct-card {
  border-color:rgba(112,223,189,.18);
}

.wrong-card {
  border-color:rgba(255,120,120,.18);
}

.review-number {
  font-size:10px;
  color:#667d94;
  font-weight:900;
}

.review-card h3 {
  margin:7px 0 12px;
  font-size:13px;
  line-height:1.5;
}

.answer-row {
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding:7px 0;
  border-bottom:1px solid rgba(255,255,255,.05);
  font-size:10px;
  color:#667d94;
}

.answer-row strong {
  color:#a9bacb;
  text-align:right;
}

.explanation {
  margin:12px 0 4px;
  color:#788da3;
  font-size:10px;
  line-height:1.6;
}

.source {
  color:#526a82;
  font-size:8px;
}

.result-actions {
  display:flex;
  gap:9px;
  margin-top:20px;
}

/* MOBILE */

@media(max-width:900px) {
  .setup-grid,
  .test-layout {
    grid-template-columns:1fr;
  }

  .palette-card {
    order:-1;
  }

  .roadmap-grid {
    grid-template-columns:1fr;
  }
}

@media(max-width:620px) {
  .bd-test {
    padding:14px;
  }

  .setup-head h1 {
    font-size:32px;
  }

  .hero-card {
    padding:18px;
    align-items:flex-start;
  }

  .hero-icon {
    width:52px;
    height:52px;
    font-size:23px;
  }

  .setup-panel,
  .question-card,
  .palette-card,
  .review-section {
    padding:17px;
  }

  .test-top h1 {
    font-size:22px;
  }

  .timer {
    min-width:100px;
  }

  .question-card h2 {
    font-size:18px;
  }

  .result-stats {
    grid-template-columns:1fr 1fr;
  }

  .result-hero {
    align-items:flex-start;
  }

  .palette {
    grid-template-columns:repeat(5,1fr);
  }

  .question-actions {
    flex-wrap:wrap;
  }
}
`;
