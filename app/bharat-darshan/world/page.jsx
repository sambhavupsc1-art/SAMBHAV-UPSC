"use client";

import React, { useEffect, useMemo, useState } from "react";

/*
  SAMBHAV UPSC — BHARAT DARSHAN / WORLD MAP
  ------------------------------------------------
  Interaction model:
    WORLD MAP → CATEGORY → MAP → COUNTRY/LOCATION → RELATED FEATURES → DETAIL

  Source integration:
    The uploaded "FINAL MAPPING CLASS FOR 2026 PRELIMS.pdf" is used for the
    world-mapping note layer. Source-page references are kept in each item.
    General geography fields are separated from "Source Note" content.

  Important:
    - This is a single-file page.jsx.
    - It keeps the external GeoJSON map architecture.
    - Country polygons are clickable.
    - Feature dots are clickable.
    - In a feature layer, clicking a country first shows related features.
    - Clicking a feature opens its detailed UPSC panel.
    - Ecology is a first-class dot layer.
*/

const WORLD_COUNTRIES = [
  ["Afghanistan","Kabul","Asia"],
  ["Albania","Tirana","Europe"],
  ["Algeria","Algiers","Africa"],
  ["Argentina","Buenos Aires","South America"],
  ["Armenia","Yerevan","Asia"],
  ["Australia","Canberra","Oceania"],
  ["Austria","Vienna","Europe"],
  ["Azerbaijan","Baku","Asia"],
  ["Bangladesh","Dhaka","Asia"],
  ["Belarus","Minsk","Europe"],
  ["Belgium","Brussels","Europe"],
  ["Bhutan","Thimphu","Asia"],
  ["Bolivia","Sucre","South America"],
  ["Brazil","Brasília","South America"],
  ["Bulgaria","Sofia","Europe"],
  ["Cambodia","Phnom Penh","Asia"],
  ["Canada","Ottawa","North America"],
  ["Chile","Santiago","South America"],
  ["China","Beijing","Asia"],
  ["Colombia","Bogotá","South America"],
  ["Croatia","Zagreb","Europe"],
  ["Cyprus","Nicosia","Europe"],
  ["Czech Republic","Prague","Europe"],
  ["Denmark","Copenhagen","Europe"],
  ["DR Congo","Kinshasa","Africa"],
  ["Ecuador","Quito","South America"],
  ["Egypt","Cairo","Africa"],
  ["Estonia","Tallinn","Europe"],
  ["Ethiopia","Addis Ababa","Africa"],
  ["Finland","Helsinki","Europe"],
  ["France","Paris","Europe"],
  ["Georgia","Tbilisi","Asia"],
  ["Germany","Berlin","Europe"],
  ["Ghana","Accra","Africa"],
  ["Greece","Athens","Europe"],
  ["Hungary","Budapest","Europe"],
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
  ["Kyrgyzstan","Bishkek","Asia"],
  ["Laos","Vientiane","Asia"],
  ["Latvia","Riga","Europe"],
  ["Lebanon","Beirut","Asia"],
  ["Lithuania","Vilnius","Europe"],
  ["Malaysia","Kuala Lumpur","Asia"],
  ["Mali","Bamako","Africa"],
  ["Mexico","Mexico City","North America"],
  ["Moldova","Chișinău","Europe"],
  ["Mongolia","Ulaanbaatar","Asia"],
  ["Morocco","Rabat","Africa"],
  ["Myanmar","Naypyidaw","Asia"],
  ["Nepal","Kathmandu","Asia"],
  ["Netherlands","Amsterdam","Europe"],
  ["New Zealand","Wellington","Oceania"],
  ["Nigeria","Abuja","Africa"],
  ["North Korea","Pyongyang","Asia"],
  ["Norway","Oslo","Europe"],
  ["Pakistan","Islamabad","Asia"],
  ["Panama","Panama City","North America"],
  ["Peru","Lima","South America"],
  ["Philippines","Manila","Asia"],
  ["Poland","Warsaw","Europe"],
  ["Portugal","Lisbon","Europe"],
  ["Qatar","Doha","Asia"],
  ["Romania","Bucharest","Europe"],
  ["Russia","Moscow","Europe"],
  ["Saudi Arabia","Riyadh","Asia"],
  ["Serbia","Belgrade","Europe"],
  ["Singapore","Singapore","Asia"],
  ["Slovakia","Bratislava","Europe"],
  ["Slovenia","Ljubljana","Europe"],
  ["Somalia","Mogadishu","Africa"],
  ["South Africa","Pretoria","Africa"],
  ["South Korea","Seoul","Asia"],
  ["Spain","Madrid","Europe"],
  ["Sudan","Khartoum","Africa"],
  ["Sweden","Stockholm","Europe"],
  ["Switzerland","Bern","Europe"],
  ["Syria","Damascus","Asia"],
  ["Taiwan","Taipei","Asia"],
  ["Tajikistan","Dushanbe","Asia"],
  ["Tanzania","Dodoma","Africa"],
  ["Thailand","Bangkok","Asia"],
  ["Tunisia","Tunis","Africa"],
  ["Türkiye","Ankara","Asia"],
  ["Turkmenistan","Ashgabat","Asia"],
  ["Ukraine","Kyiv","Europe"],
  ["United Arab Emirates","Abu Dhabi","Asia"],
  ["United Kingdom","London","Europe"],
  ["United States","Washington, D.C.","North America"],
  ["Uruguay","Montevideo","South America"],
  ["Uzbekistan","Tashkent","Asia"],
  ["Venezuela","Caracas","South America"],
  ["Vietnam","Hanoi","Asia"],
  ["Zambia","Lusaka","Africa"],
  ["Zimbabwe","Harare","Africa"],
];

const WORLD_FEATURES = {
  seas: [
    {
      id:"aral-sea", name:"Aral Sea", type:"Sea",
      coords:[59.3,45.0], countries:["Kazakhstan","Uzbekistan"],
      facts:["Endorheic inland sea/lake system of Central Asia","Fed historically by the Amu Darya and Syr Darya"],
      upsc:"Major example of human-induced environmental degradation through diversion of inflowing rivers.",
      source:"Mapping Class note", pages:"1, 31"
    },
    {
      id:"baltic-sea", name:"Baltic Sea", type:"Sea",
      coords:[20.5,58.8],
      countries:["Denmark","Germany","Poland","Lithuania","Latvia","Estonia","Finland","Sweden","Russia"],
      facts:["Northern European marginal sea of the Atlantic system","Connected to the North Sea through Danish straits"],
      upsc:"Important for European geography, chokepoints and regional connectivity.",
      source:"Mapping Class note", pages:"2, 31"
    },
    {
      id:"black-sea", name:"Black Sea", type:"Sea",
      coords:[34.5,43.2],
      countries:["Bulgaria","Romania","Ukraine","Russia","Georgia","Türkiye"],
      facts:["Marginal sea between Eastern Europe and Western Asia","Connected to the Mediterranean through Bosporus, Sea of Marmara and Dardanelles"],
      upsc:"Know littoral countries and the Turkish Straits system.",
      source:"Mapping Class note", pages:"3, 4, 31"
    },
    {
      id:"mediterranean-sea", name:"Mediterranean Sea", type:"Sea",
      coords:[17.0,35.0],
      countries:["Spain","France","Italy","Greece","Türkiye","Cyprus","Syria","Lebanon","Israel","Egypt","Libya","Tunisia","Algeria","Morocco"],
      facts:["Intercontinental sea between Europe, Africa and Asia","Linked to the Atlantic by Strait of Gibraltar"],
      upsc:"Important for Europe–Africa–West Asia spatial relations and maritime routes.",
      source:"Mapping Class note", pages:"5, 31"
    },
    {
      id:"caspian-sea", name:"Caspian Sea", type:"Sea/Lake",
      coords:[50.2,41.9],
      countries:["Kazakhstan","Turkmenistan","Iran","Azerbaijan","Russia"],
      facts:["Largest enclosed inland body of water","Lies between Europe and Asia in the conventional geographic scheme"],
      upsc:"Energy resources, Central Asian geography and littoral-state mapping are high-yield.",
      source:"Mapping Class note", pages:"6, 31"
    },
    {
      id:"south-china-sea", name:"South China Sea", type:"Sea",
      coords:[114.0,14.0],
      countries:["China","Vietnam","Philippines","Malaysia","Brunei","Indonesia","Taiwan"],
      facts:["Strategic marginal sea of the western Pacific","Contains numerous islands, reefs and disputed maritime areas"],
      upsc:"Vanguard Bank, Spratly/Paracel island geography and sea-lane security are important.",
      source:"Mapping Class note", pages:"7, 36"
    },
    {
      id:"east-china-sea", name:"East China Sea", type:"Sea",
      coords:[126.5,28.0],
      countries:["China","Japan","South Korea","Taiwan"],
      facts:["Western Pacific marginal sea","Lies between East Asian mainland and Japan/Ryukyu island systems"],
      upsc:"Important for East Asian maritime geography.",
      source:"Mapping Class note", pages:"9, 30"
    },
    {
      id:"sea-of-japan", name:"Sea of Japan", type:"Sea",
      coords:[137.0,39.5],
      countries:["Japan","South Korea","North Korea","Russia"],
      facts:["Marginal sea between Japan and the Asian mainland","Connected to surrounding seas through several straits"],
      upsc:"Map its littoral countries and neighbouring East Asian seas.",
      source:"Mapping Class note", pages:"9, 30"
    },
    {
      id:"bering-sea", name:"Bering Sea", type:"Sea",
      coords:[-170.0,58.0],
      countries:["Russia","United States"],
      facts:["Between Alaska and Russia","Gateway between Pacific and Arctic systems"],
      upsc:"Key to the Bering Strait and Northern Sea Route geography.",
      source:"Mapping Class note", pages:"34"
    },
    {
      id:"barents-sea", name:"Barents Sea", type:"Sea",
      coords:[40.0,72.0],
      countries:["Russia","Norway"],
      facts:["Arctic marginal sea","Part of the Northern Sea Route regional system"],
      upsc:"Important for Arctic shipping and energy geography.",
      source:"Mapping Class note", pages:"28, 34"
    },
    {
      id:"kara-sea", name:"Kara Sea", type:"Sea",
      coords:[78.0,74.0],
      countries:["Russia"],
      facts:["Arctic sea north of Siberia","One of the seas along the Northern Sea Route"],
      upsc:"Part of the Arctic maritime route chain.",
      source:"Mapping Class note", pages:"28, 34"
    },
    {
      id:"laptev-sea", name:"Laptev Sea", type:"Sea",
      coords:[125.0,76.0],
      countries:["Russia"],
      facts:["Arctic marginal sea","Between the Taymyr Peninsula and New Siberian Islands"],
      upsc:"Major Northern Sea Route geography.",
      source:"Mapping Class note", pages:"28, 34"
    },
    {
      id:"east-siberian-sea", name:"East Siberian Sea", type:"Sea",
      coords:[160.0,73.0],
      countries:["Russia"],
      facts:["Arctic sea north of eastern Siberia"],
      upsc:"Important in the Northern Sea Route sequence.",
      source:"Mapping Class note", pages:"28, 34"
    },
    {
      id:"chukchi-sea", name:"Chukchi Sea", type:"Sea",
      coords:[-169.0,69.0],
      countries:["Russia","United States"],
      facts:["Arctic sea between northeastern Siberia and Alaska"],
      upsc:"Links the Arctic route to Bering Strait geography.",
      source:"Mapping Class note", pages:"28, 34"
    },
    {
      id:"red-sea", name:"Red Sea", type:"Sea",
      coords:[38.0,20.0],
      countries:["Egypt","Sudan","Eritrea","Saudi Arabia","Yemen","Djibouti"],
      facts:["Long, narrow sea between northeast Africa and the Arabian Peninsula","Connected northward to the Mediterranean through the Suez Canal system"],
      upsc:"Suez–Red Sea–Bab-el-Mandeb route is strategically important.",
      source:"Mapping Class note", pages:"21"
    },
  ],

  gulfs: [
    {id:"gulf-of-finland",name:"Gulf of Finland",type:"Gulf",coords:[26.0,59.8],countries:["Finland","Estonia","Russia"],facts:["Eastern arm of the Baltic Sea"],upsc:"Map Finland–Estonia–Russia relationship.",source:"Mapping Class note",pages:"2"},
    {id:"gulf-of-riga",name:"Gulf of Riga",type:"Gulf",coords:[23.5,57.8],countries:["Latvia","Estonia"],facts:["Eastern Baltic gulf"],upsc:"Useful Baltic Sea sub-feature.",source:"Mapping Class note",pages:"2"},
    {id:"persian-gulf",name:"Persian Gulf",type:"Gulf",coords:[51.0,27.0],countries:["Iran","Iraq","Kuwait","Saudi Arabia","Bahrain","Qatar","United Arab Emirates","Oman"],facts:["Shallow marginal sea of the Indian Ocean","Connected to Gulf of Oman through Strait of Hormuz"],upsc:"Energy security and Strait of Hormuz are core map topics.",source:"Mapping Class note",pages:"10, 12"},
    {id:"gulf-of-aden",name:"Gulf of Aden",type:"Gulf",coords:[47.0,13.0],countries:["Yemen","Djibouti","Somalia"],facts:["Between Arabian Peninsula and Horn of Africa","Opens westward toward Bab-el-Mandeb and Red Sea"],upsc:"Critical shipping route between Indian Ocean and Suez route.",source:"Mapping Class note",pages:"10, 14"},
    {id:"gulf-of-khambhat",name:"Gulf of Khambhat",type:"Gulf",coords:[72.5,21.5],countries:["India"],facts:["Gulf on India's western coast"],upsc:"Included in Indian coastal mapping.",source:"Mapping Class note",pages:"16"},
  ],

  straits: [
    {id:"strait-of-gibraltar",name:"Strait of Gibraltar",type:"Strait",coords:[-5.6,35.95],countries:["Spain","Morocco"],facts:["Connects Atlantic Ocean and Mediterranean Sea","Separates Europe and Africa"],upsc:"Major intercontinental maritime chokepoint.",source:"Mapping Class note",pages:"5, 31"},
    {id:"bosporus",name:"Bosporus",type:"Strait",coords:[29.0,41.1],countries:["Türkiye"],facts:["Connects Black Sea with Sea of Marmara","Separates European and Asian parts of Türkiye"],upsc:"Part of Turkish Straits system.",source:"Mapping Class note",pages:"3, 4"},
    {id:"dardanelles",name:"Dardanelles",type:"Strait",coords:[26.4,40.2],countries:["Türkiye"],facts:["Connects Aegean Sea with Sea of Marmara"],upsc:"Together with Bosporus, controls Black Sea access.",source:"Mapping Class note",pages:"3, 4"},
    {id:"kerch-strait",name:"Kerch Strait",type:"Strait",coords:[36.6,45.2],countries:["Russia","Ukraine"],facts:["Connects Black Sea and Sea of Azov"],upsc:"Important for Black Sea regional geography.",source:"Mapping Class note",pages:"3"},
    {id:"hormuz",name:"Strait of Hormuz",type:"Strait",coords:[56.5,26.6],countries:["Iran","Oman","United Arab Emirates"],facts:["Connects Persian Gulf and Gulf of Oman","Oman’s Musandam Peninsula lies near the strait"],upsc:"One of the world's most important oil and energy chokepoints.",source:"Mapping Class note",pages:"10, 12"},
    {id:"bab-el-mandeb",name:"Bab-el-Mandeb",type:"Strait",coords:[43.3,12.6],countries:["Yemen","Djibouti","Eritrea"],facts:["Connects Red Sea and Gulf of Aden"],upsc:"Links Suez route with Indian Ocean shipping.",source:"Mapping Class note",pages:"21"},
    {id:"malacca",name:"Strait of Malacca",type:"Strait",coords:[101.5,3.0],countries:["Malaysia","Indonesia","Singapore"],facts:["Between Malay Peninsula and Sumatra","Major Indian Ocean–Pacific maritime link"],upsc:"High-value Asian chokepoint for trade and energy movement.",source:"Mapping Class note",pages:"7, 14"},
    {id:"bering-strait",name:"Bering Strait",type:"Strait",coords:[-168.8,65.8],countries:["Russia","United States"],facts:["Separates Siberia and Alaska","Connects Arctic and Pacific waters"],upsc:"Northern gateway of the Pacific–Arctic connection.",source:"Mapping Class note",pages:"28, 34"},
    {id:"sunda-strait",name:"Sunda Strait",type:"Strait",coords:[105.7,-6.0],countries:["Indonesia"],facts:["Between Sumatra and Java","Connects Indian Ocean and Java Sea"],upsc:"Alternative regional route to Malacca Strait.",source:"Mapping Class note",pages:"29"},
    {id:"lombok-strait",name:"Lombok Strait",type:"Strait",coords:[116.0,-8.5],countries:["Indonesia"],facts:["Between Bali and Lombok","Deep-water passage between Indian and Pacific systems"],upsc:"Important Indonesian archipelagic passage.",source:"Mapping Class note",pages:"29"},
  ],

  rivers: [
    {id:"mekong",name:"Mekong",type:"River",coords:[105.8,15.0],countries:["China","Myanmar","Laos","Thailand","Cambodia","Vietnam"],facts:["Rises on the Tibetan Plateau region","Flows through mainland Southeast Asia","Forms a major delta in Vietnam"],upsc:"Mekong-Ganga Cooperation is a regional grouping; Mekong basin geography is important for dams, water and delta issues.",source:"Mapping Class note",pages:"8, 32"},
    {id:"nile",name:"Nile",type:"River",coords:[31.2,28.5],countries:["Uganda","South Sudan","Sudan","Egypt","Ethiopia","Tanzania","Kenya","Rwanda","Burundi","DR Congo"],facts:["Major transboundary river system of northeastern Africa","White Nile and Blue Nile are major components"],upsc:"Nile basin politics, dams and downstream dependence are major geography/current-affairs themes.",source:"Mapping Class note",pages:"24, 25"},
    {id:"amazon",name:"Amazon",type:"River",coords:[-60.0,-3.0],countries:["Peru","Colombia","Brazil"],facts:["Largest river system by discharge","Flows across the Amazon Basin to the Atlantic"],upsc:"Amazon Basin, tropical rainforest and South American physical geography.",source:"Mapping Class note",pages:"26"},
    {id:"parana",name:"Paraná",type:"River",coords:[-58.0,-27.0],countries:["Brazil","Paraguay","Argentina"],facts:["Major river of south-central South America","Part of the La Plata drainage system"],upsc:"Useful for South American river mapping.",source:"Mapping Class note",pages:"26"},
    {id:"orenoque",name:"Orinoco",type:"River",coords:[-65.0,7.0],countries:["Venezuela","Colombia"],facts:["Major northern South American river"],upsc:"Map with Amazon and Paraná systems.",source:"Mapping Class note",pages:"26"},
    {id:"mississippi",name:"Mississippi–Missouri System",type:"River System",coords:[-91.0,35.0],countries:["United States"],facts:["Major North American river system","Drains into the Gulf of Mexico"],upsc:"Core North American physical geography.",source:"Mapping Class note",pages:"26"},
    {id:"danube",name:"Danube",type:"River",coords:[28.0,45.2],countries:["Germany","Austria","Slovakia","Hungary","Croatia","Serbia","Romania","Bulgaria","Moldova","Ukraine"],facts:["Major European transboundary river","Flows to the Black Sea"],upsc:"Very important for Europe mapping; source note highlights Germany–Austria–Hungary–Romania–Bulgaria–Serbia–Croatia–Moldova–Ukraine.",source:"Mapping Class note",pages:"29"},
    {id:"syr-darya",name:"Syr Darya",type:"River",coords:[66.5,44.0],countries:["Kyrgyzstan","Uzbekistan","Tajikistan","Kazakhstan"],facts:["Central Asian river","Historically one of the principal inflows to the Aral Sea"],upsc:"Aral Sea geography and Central Asian water management.",source:"Mapping Class note",pages:"1"},
    {id:"amu-darya",name:"Amu Darya",type:"River",coords:[61.0,43.0],countries:["Afghanistan","Tajikistan","Uzbekistan","Turkmenistan"],facts:["Major Central Asian river","Historically one of the principal inflows to the Aral Sea"],upsc:"Central Asian water and Aral Sea mapping.",source:"Mapping Class note",pages:"1"},
    {id:"indus",name:"Indus",type:"River",coords:[70.0,28.0],countries:["China","India","Pakistan"],facts:["Major South Asian transboundary river","Flows toward the Arabian Sea"],upsc:"Important for Indus basin and South Asian physical geography.",source:"Mapping Class note",pages:"16, 38, 44"},
    {id:"ganga",name:"Ganga",type:"River",coords:[83.0,26.0],countries:["India","Bangladesh"],facts:["Major South Asian river system","Flows through the Indo-Gangetic plain and into the Bay of Bengal system"],upsc:"High-yield Indian river mapping; included in source mapping sheets.",source:"Mapping Class note",pages:"42–44"},
    {id:"brahmaputra",name:"Brahmaputra",type:"River",coords:[92.0,27.5],countries:["China","India","Bangladesh"],facts:["Transboundary Himalayan river","Known as Yarlung Tsangpo in Tibet before entering India"],upsc:"Important for Himalayan drainage and India–China–Bangladesh geography.",source:"Mapping Class note",pages:"43"},
  ],

  mountains: [
    {id:"himalayas",name:"Himalayas",type:"Mountain System",coords:[86.0,30.0],countries:["India","Nepal","Bhutan","China","Pakistan"],facts:["Young fold mountain system of South Asia","Includes major high peaks and passes"],upsc:"Core UPSC physical geography region.",source:"Mapping Class note",pages:"37–44"},
    {id:"andes",name:"Andes",type:"Mountain System",coords:[-70.0,-20.0],countries:["Venezuela","Colombia","Ecuador","Peru","Bolivia","Chile","Argentina"],facts:["Major mountain chain along western South America"],upsc:"Links to Pacific Ring of Fire, climate and river systems.",source:"Mapping Class note",pages:"26"},
    {id:"alps",name:"Alps",type:"Mountain System",coords:[9.0,46.5],countries:["France","Switzerland","Italy","Austria","Germany","Slovenia"],facts:["Major European mountain system"],upsc:"Important for European drainage and physical geography.",source:"Mapping Class note",pages:"29"},
    {id:"great-rift",name:"East African Rift",type:"Rift System",coords:[36.0,-1.0],countries:["Ethiopia","Kenya","Tanzania","Uganda"],facts:["Major continental rift system in eastern Africa","Associated with volcanic and tectonic activity"],upsc:"Connect with lakes, volcanism and East African physical geography.",source:"Mapping Class note",pages:"25"},
  ],

  deserts: [
    {id:"sahara",name:"Sahara",type:"Desert",coords:[15.0,24.0],countries:["Morocco","Algeria","Tunisia","Libya","Egypt","Sudan","Chad","Niger","Mali","Mauritania"],facts:["Largest hot desert region"],upsc:"Major African physical geography feature.",source:"Mapping Class note",pages:"25"},
    {id:"arabian-desert",name:"Arabian Desert",type:"Desert",coords:[45.0,25.0],countries:["Saudi Arabia","United Arab Emirates","Oman","Yemen","Jordan","Iraq","Kuwait"],facts:["Large desert region of the Arabian Peninsula"],upsc:"Important with Persian Gulf, Red Sea and West Asian mapping.",source:"Mapping Class note",pages:"10, 25"},
    {id:"gobi",name:"Gobi Desert",type:"Desert",coords:[104.0,43.0],countries:["Mongolia","China"],facts:["Cold desert of East-Central Asia"],upsc:"Important Asia physical geography.",source:"Mapping Class note",pages:"25"},
  ],

  lakes: [
    {id:"lake-natron",name:"Lake Natron",type:"Lake",coords:[35.9,-2.4],countries:["Tanzania","Kenya"],facts:["East African soda lake near the Tanzania–Kenya region"],upsc:"Source note specifically links Lake Natron with Tanzania + Kenya.",source:"Mapping Class note",pages:"37"},
    {id:"lake-tana",name:"Lake Tana",type:"Lake",coords:[37.3,12.0],countries:["Ethiopia"],facts:["Source region of the Blue Nile"],upsc:"Map with Blue Nile and Ethiopian highlands.",source:"Mapping Class note",pages:"25"},
    {id:"lake-titicaca",name:"Lake Titicaca",type:"Lake",coords:[-69.4,-15.8],countries:["Peru","Bolivia"],facts:["High-altitude lake in the Andes"],upsc:"Important South American map location.",source:"Mapping Class note",pages:"26"},
    {id:"lake-chad",name:"Lake Chad",type:"Lake",coords:[14.0,14.0],countries:["Chad","Cameroon","Nigeria","Niger"],facts:["Shallow endorheic lake in the Sahel"],upsc:"Important for Sahel geography and transboundary water issues.",source:"Mapping Class note",pages:"25"},
  ],

  canals: [
    {id:"suez-canal",name:"Suez Canal",type:"Canal",coords:[32.35,30.5],countries:["Egypt"],facts:["Artificial waterway connecting Mediterranean Sea and Red Sea","Cuts across the Isthmus of Suez"],upsc:"Shortens Europe–Asia maritime route and is a global chokepoint.",source:"Mapping Class note",pages:"21"},
    {id:"panama-canal",name:"Panama Canal",type:"Canal",coords:[-79.6,9.0],countries:["Panama"],facts:["Connects Atlantic and Pacific oceans through Central America"],upsc:"Global maritime route and interoceanic connectivity.",source:"Mapping Class note",pages:"26"},
    {id:"ben-gurion-canal",name:"Ben Gurion Canal concept",type:"Canal/Route",coords:[34.8,30.8],countries:["Israel","Egypt"],facts:["Shown in the source material as a proposed/illustrative route near the Red Sea–Mediterranean corridor"],upsc:"Treat as a map concept from the notes, not an operating canal.",source:"Mapping Class note",pages:"21"},
  ],

  routes: [
    {id:"northern-sea-route",name:"Northern Sea Route",type:"Strategic Route",coords:[105.0,73.0],countries:["Russia","United States"],facts:["Arctic route along Russia's northern coast","Source sequence: Barents Sea → Kara Sea → Laptev Sea → East Siberian Sea → Chukchi Sea → Bering Strait"],upsc:"Important Arctic shipping route; climate change increases navigability but creates environmental and geopolitical concerns.",source:"Mapping Class note",pages:"28, 34"},
    {id:"kaladan-project",name:"Kaladan Multi-Modal Transit Transport Project",type:"Connectivity",coords:[92.0,21.0],countries:["India","Myanmar"],facts:["Connects Indian eastern seaboard with Myanmar's Sittwe and inland Mizoram corridor"],upsc:"Important India–Myanmar connectivity project.",source:"Mapping Class note",pages:"22"},
    {id:"bcim-corridor",name:"BCIM Economic Corridor",type:"Connectivity",coords:[92.0,25.0],countries:["Bangladesh","China","India","Myanmar"],facts:["Bangladesh–China–India–Myanmar regional connectivity concept"],upsc:"Useful for regional connectivity and India's Act East context.",source:"Mapping Class note",pages:"22"},
  ],

  ecology: [
    {id:"amazon-ecoregion",name:"Amazon Rainforest",type:"Ecology",coords:[-62.0,-4.0],countries:["Brazil","Peru","Colombia"],facts:["Largest tropical rainforest region","Part of the Amazon Basin"],upsc:"Biodiversity, carbon cycle, deforestation and climate significance.",source:"Mapping Class note",pages:"26, 27"},
    {id:"congo-basin",name:"Congo Basin",type:"Ecology",coords:[23.0,-1.0],countries:["DR Congo","Republic of the Congo","Cameroon","Central African Republic","Gabon","Equatorial Guinea"],facts:["Major tropical rainforest region of central Africa"],upsc:"Important global carbon and biodiversity region.",source:"Mapping Class note",pages:"24, 25"},
    {id:"sahel",name:"Sahel",type:"Ecological Region",coords:[15.0,15.0],countries:["Mauritania","Mali","Burkina Faso","Niger","Chad","Sudan"],facts:["Semi-arid transition zone south of Sahara"],upsc:"Desertification, climate variability and food-security geography.",source:"Mapping Class note",pages:"29"},
    {id:"sundaland",name:"Sundaland",type:"Ecological Region",coords:[108.0,-1.0],countries:["Indonesia","Malaysia","Brunei"],facts:["Biogeographic region of Southeast Asia"],upsc:"Important for biodiversity and island biogeography.",source:"Mapping Class note",pages:"29"},
    {id:"sahul",name:"Sahul",type:"Biogeographic Region",coords:[134.0,-20.0],countries:["Australia","Papua New Guinea"],facts:["Biogeographic region associated with Australia and New Guinea"],upsc:"Useful for biogeography and Wallace/Sahul context.",source:"Mapping Class note",pages:"29"},
  ],

  glaciers: [
    {id:"greenland-ice-sheet",name:"Greenland Ice Sheet",type:"Glacier/Ice Sheet",coords:[-42.0,72.0],countries:["Denmark"],facts:["Largest ice sheet outside Antarctica"],upsc:"Ice-sheet loss and sea-level rise are major climate themes.",source:"Mapping Class note",pages:"27"},
    {id:"antarctic-ice-sheet",name:"Antarctic Ice Sheet",type:"Glacier/Ice Sheet",coords:[0.0,-82.0],countries:["Antarctica"],facts:["Largest reservoir of land ice on Earth"],upsc:"Major climate and sea-level relevance.",source:"Mapping Class note",pages:"27"},
    {id:"okjokull",name:"Okjökull",type:"Glacier",coords:[-21.0,64.6],countries:["Iceland"],facts:["Former Icelandic glacier highlighted in the source as a symbol of climate-change-related glacier loss"],upsc:"Use as a climate-change case study; the source notes glacier loss.",source:"Mapping Class note",pages:"37"},
    {id:"gangotri-source-context",name:"Himalayan glacier source context",type:"Glacier",coords:[79.0,31.0],countries:["India"],facts:["Source mapping class connects Himalayan glacier/river systems with major rivers"],upsc:"Use with Himalayan drainage and glacier–river linkage.",source:"Mapping Class note",pages:"37–44"},
  ],

  currents: [
    {id:"gulf-stream",name:"Gulf Stream",type:"Ocean Current",coords:[-45.0,35.0],countries:["United States","United Kingdom"],facts:["Warm North Atlantic current system"],upsc:"Helps explain Western Europe's relatively mild climate.",source:"Mapping Class note",pages:"27"},
    {id:"canary-current",name:"Canary Current",type:"Ocean Current",coords:[-18.0,25.0],countries:["Morocco","Spain"],facts:["Cold eastern boundary current of North Atlantic subtropical gyre"],upsc:"Associated with northwest African coastal climate and fisheries.",source:"Mapping Class note",pages:"27"},
    {id:"benguela-current",name:"Benguela Current",type:"Ocean Current",coords:[8.0,-25.0],countries:["Namibia","South Africa","Angola"],facts:["Cold eastern boundary current of South Atlantic"],upsc:"Links with Namib Desert and coastal upwelling.",source:"Mapping Class note",pages:"27"},
    {id:"peru-current",name:"Peru/Humboldt Current",type:"Ocean Current",coords:[-80.0,-20.0],countries:["Peru","Chile"],facts:["Cold current along western South America"],upsc:"Linked to coastal upwelling and aridity of western South America.",source:"Mapping Class note",pages:"27"},
  ],

  resources: [
    {id:"west-asia-oil-gas",name:"West Asia Oil & Gas Belt",type:"Resource",coords:[48.0,29.0],countries:["Saudi Arabia","Iran","Iraq","Kuwait","Qatar","United Arab Emirates"],facts:["Major global petroleum and natural-gas region"],upsc:"Map Persian Gulf, Hormuz and major producers together.",source:"Mapping Class note",pages:"10, 35"},
    {id:"iran-gas",name:"Iran Natural Gas",type:"Resource",coords:[52.0,32.0],countries:["Iran"],facts:["Source note identifies natural gas and gas fields in Iran"],upsc:"Use with Iran's regional geography and energy security.",source:"Mapping Class note",pages:"35"},
    {id:"afghanistan-resources",name:"Afghanistan Resource Context",type:"Resource",coords:[66.0,34.5],countries:["Afghanistan"],facts:["Source notes show Afghanistan's location within Central/South Asian strategic geography"],upsc:"Map Afghanistan with Central Asian republics, Iran, Pakistan and China.",source:"Mapping Class note",pages:"18, 35"},
  ],

  islands: [
    {id:"maldives",name:"Maldives",type:"Island Country",coords:[73.5,3.2],countries:["Maldives"],facts:["Archipelagic island country in the Indian Ocean"],upsc:"Important for Indian Ocean strategic geography.",source:"Mapping Class note",pages:"17, 33"},
    {id:"seychelles",name:"Seychelles",type:"Island Country",coords:[55.5,-4.6],countries:["Seychelles"],facts:["Island country in the western Indian Ocean"],upsc:"Map with Madagascar, Comoros and other western Indian Ocean islands.",source:"Mapping Class note",pages:"17, 33"},
    {id:"mauritius",name:"Mauritius",type:"Island Country",coords:[57.5,-20.2],countries:["Mauritius"],facts:["Island country in the southwest Indian Ocean"],upsc:"Indian Ocean island geography.",source:"Mapping Class note",pages:"17, 33"},
    {id:"reunion",name:"Réunion",type:"Island",coords:[55.5,-21.1],countries:["France"],facts:["French overseas department/region in the Indian Ocean"],upsc:"Source note associates Réunion with France.",source:"Mapping Class note",pages:"17, 33"},
    {id:"mayotte",name:"Mayotte",type:"Island",coords:[45.2,-12.8],countries:["France"],facts:["French overseas department in the Indian Ocean"],upsc:"Source note associates Mayotte with France.",source:"Mapping Class note",pages:"17, 33"},
    {id:"comoros",name:"Comoros",type:"Island Country",coords:[43.3,-11.7],countries:["Comoros"],facts:["Archipelago between Africa and Madagascar"],upsc:"Important western Indian Ocean mapping.",source:"Mapping Class note",pages:"17, 33"},
  ],

  hotspots: [
    {id:"gaza",name:"Gaza Strip",type:"Conflict/Geopolitical Hotspot",coords:[34.4,31.4],countries:["Israel","Palestine"],facts:["Narrow coastal territory on the eastern Mediterranean"],upsc:"Source revision sheet marks Gaza Strip as a major conflict region.",source:"Mapping Class note",pages:"28"},
    {id:"west-bank",name:"West Bank",type:"Conflict/Geopolitical Hotspot",coords:[35.3,31.9],countries:["Israel","Palestine"],facts:["Landlocked territory west of the Jordan River"],upsc:"Source revision sheet marks West Bank as a major conflict region.",source:"Mapping Class note",pages:"28"},
    {id:"donbas",name:"Donbas",type:"Conflict/Geopolitical Hotspot",coords:[37.8,48.0],countries:["Ukraine"],facts:["Industrial region of eastern Ukraine"],upsc:"Source revision sheet marks Donbas as a major conflict region.",source:"Mapping Class note",pages:"28"},
    {id:"transnistria",name:"Transnistria",type:"Conflict/Geopolitical Hotspot",coords:[29.6,47.2],countries:["Moldova"],facts:["Breakaway region along Moldova's eastern side"],upsc:"Source revision sheet includes Transnistria.",source:"Mapping Class note",pages:"28"},
    {id:"nagorno-karabakh",name:"Nagorno-Karabakh",type:"Conflict/Geopolitical Hotspot",coords:[46.8,40.0],countries:["Azerbaijan","Armenia"],facts:["South Caucasus region highlighted in the source revision sheet"],upsc:"Map with Armenia, Azerbaijan, Georgia and Caspian Sea.",source:"Mapping Class note",pages:"28"},
    {id:"taiwan-strait",name:"Taiwan Strait",type:"Conflict/Strategic Hotspot",coords:[119.5,24.2],countries:["China","Taiwan"],facts:["Strait separating Taiwan from mainland China"],upsc:"Source revision sheet identifies Taiwan Strait; source map also marks Taiwan's surrounding maritime geography.",source:"Mapping Class note",pages:"28, 35"},
    {id:"sout-china-sea-hotspot",name:"South China Sea Strategic Zone",type:"Strategic Hotspot",coords:[116.0,12.0],countries:["China","Vietnam","Philippines","Malaysia","Brunei","Indonesia"],facts:["Strategic maritime space with overlapping claims"],upsc:"Connect Spratly/Paracel geography with sea lanes.",source:"Mapping Class note",pages:"7, 28, 36"},
  ],
};

const WORLD_NOTE_REGIONS = [
  {
    id:"central-asia",
    name:"Central Asia — Aral / Caspian / CAR",
    type:"Source Note Cluster",
    coords:[66,42],
    countries:["Kazakhstan","Uzbekistan","Turkmenistan","Kyrgyzstan","Tajikistan","Afghanistan","Azerbaijan","Iran","Russia"],
    summary:"Aral Sea, Caspian Sea, Amu Darya, Syr Darya and the Central Asian republics are repeatedly used as map-based relations in the notes.",
    items:["Aral Sea → Kazakhstan + Uzbekistan","Caspian Sea → Kazakhstan, Turkmenistan, Azerbaijan, Iran, Russia","Afghanistan neighbours → India, Pakistan, China, Tajikistan, Uzbekistan, Turkmenistan, Iran","TARI(K) mnemonic in the source for Caspian littoral states"],
    pages:"1, 6, 18, 31–33"
  },
  {
    id:"baltic-cluster",
    name:"Baltic Sea Cluster",
    type:"Source Note Cluster",
    coords:[22,58.5],
    countries:["Russia","Finland","Sweden","Estonia","Latvia","Lithuania","Poland","Germany","Denmark"],
    summary:"The source uses the Baltic Sea to practice littoral-country mapping and the Denmark/Germany/Sweden/Finland/Estonia/Latvia/Lithuania/Poland/Russia relationship.",
    items:["Baltic Sea littoral mapping","Gulf of Finland","Gulf of Riga"],
    pages:"2, 31"
  },
  {
    id:"black-sea-cluster",
    name:"Black Sea Cluster",
    type:"Source Note Cluster",
    coords:[35,43],
    countries:["Bulgaria","Romania","Ukraine","Russia","Georgia","Türkiye"],
    summary:"The notes use the mnemonic BURGeR-T for Black Sea littoral countries.",
    items:["Bulgaria","Ukraine","Russia","Georgia","Romania","Türkiye","Black Sea","Kerch Strait","Bosporus","Dardanelles"],
    pages:"3, 4, 31"
  },
  {
    id:"gulf-cluster",
    name:"Gulf Cooperation Council + Persian Gulf",
    type:"Source Note Cluster",
    coords:[50,26],
    countries:["Saudi Arabia","Kuwait","Bahrain","Qatar","United Arab Emirates","Oman","Iran","Iraq"],
    summary:"The source map distinguishes GCC members and notes Iran + Iraq around the Persian Gulf.",
    items:["GCC states shown on the source map","Persian Gulf","Strait of Hormuz","Musandam"],
    pages:"10, 12, 31–32"
  },
  {
    id:"mekong-gms",
    name:"Mekong–Ganga / Mekong Region",
    type:"Source Note Cluster",
    coords:[103,17],
    countries:["Laos","Thailand","Myanmar","Cambodia","Vietnam","India","China"],
    summary:"The source mnemonic identifies the Mekong regional set and shows Mekong geography in mainland Southeast Asia.",
    items:["Mekong river","Laos","Thailand","Myanmar","Cambodia","Vietnam","Mekong–Ganga Cooperation context"],
    pages:"8, 32"
  },
  {
    id:"syria-neighbours",
    name:"Syria Neighbour Mapping",
    type:"Source Note Cluster",
    coords:[38.5,35],
    countries:["Syria","Lebanon","Israel","Türkiye","Jordan","Iraq"],
    summary:"The notes use the mnemonic LITJI for Syria's immediate neighbour mapping.",
    items:["Lebanon","Israel","Türkiye","Jordan","Iraq"],
    pages:"11, 32"
  },
  {
    id:"turkiye-neighbours",
    name:"Türkiye Neighbour Mapping",
    type:"Source Note Cluster",
    coords:[35,39],
    countries:["Türkiye","Bulgaria","Greece","Georgia","Armenia","Azerbaijan","Iran","Iraq","Syria"],
    summary:"The notes group Türkiye's land neighbours and connect the country to Black Sea, Aegean and Mediterranean geography.",
    items:["Bulgaria","Greece","Georgia","Armenia","Azerbaijan","Iran","Iraq","Syria"],
    pages:"12, 32"
  },
  {
    id:"iran-neighbours",
    name:"Iran Neighbour Mapping",
    type:"Source Note Cluster",
    coords:[54,32],
    countries:["Iran","Türkiye","Armenia","Azerbaijan","Turkmenistan","Afghanistan","Pakistan","Iraq"],
    summary:"The notes use TATA-PAI for Iran's surrounding-country mapping.",
    items:["Türkiye","Armenia","Azerbaijan","Turkmenistan","Afghanistan","Pakistan","Iraq"],
    pages:"12, 32"
  },
  {
    id:"sco-cluster",
    name:"SCO Country Cluster",
    type:"Source Note Cluster",
    coords:[75,42],
    countries:["India","Pakistan","China","Russia","Kazakhstan","Kyrgyzstan","Tajikistan","Uzbekistan","Iran","Belarus"],
    summary:"The source notes include an SCO map and a mnemonic built around Punjab/Belarus/Kazakhstan/India/Iran/Tajikistan/Uzbekistan/China/Kyrgyzstan.",
    items:["SCO regional mapping","Central Asia + South Asia + Russia/Belarus relationship"],
    pages:"20, 33"
  },
  {
    id:"indian-ocean-islands",
    name:"Indian Ocean Island Cluster",
    type:"Source Note Cluster",
    coords:[61,-8],
    countries:["Seychelles","Maldives","Comoros","Mauritius","France"],
    summary:"The source connects Indian Ocean island locations with France and the United Kingdom.",
    items:["Seychelles","Maldives","Comoros","Mayotte","Mauritius","Réunion","Chagos/UK note in source"],
    pages:"17, 33"
  },
  {
    id:"africa-nile-rift",
    name:"Africa — Nile Basin + Rift + Lakes",
    type:"Source Note Cluster",
    coords:[30,5],
    countries:["Egypt","Sudan","South Sudan","Ethiopia","Kenya","Uganda","Tanzania","Rwanda","Burundi","DR Congo"],
    summary:"The source combines Nile basin countries, East African Rift, Lake Natron and major African physical features.",
    items:["Nile basin","Lake Natron → Tanzania + Kenya","East African Rift","Congo Basin","Sahara","Sahel"],
    pages:"24–25, 37"
  },
  {
    id:"south-america",
    name:"South America Mapping Cluster",
    type:"Source Note Cluster",
    coords:[-62,-18],
    countries:["Brazil","Peru","Colombia","Bolivia","Chile","Argentina","Venezuela","Paraguay","Uruguay"],
    summary:"The notes map Amazon, Orinoco, Paraná, Andes and South American country relations.",
    items:["Amazon","Orinoco","Paraná","Andes","Patagonia","Lake Titicaca"],
    pages:"26"
  },
  {
    id:"arctic-route",
    name:"Arctic / Northern Sea Route",
    type:"Source Note Cluster",
    coords:[105,73],
    countries:["Russia","United States"],
    summary:"The notes explicitly sequence the Northern Sea Route from Barents Sea through Kara, Laptev, East Siberian and Chukchi seas to Bering Strait.",
    items:["Barents Sea","Kara Sea","Laptev Sea","East Siberian Sea","Chukchi Sea","Bering Strait"],
    pages:"28, 34"
  },
  {
    id:"climate-currents",
    name:"World Climate + Ocean Currents",
    type:"Source Note Cluster",
    coords:[0,15],
    countries:["United States","United Kingdom","Morocco","Namibia","South Africa","Peru","Chile","Australia","India"],
    summary:"The source includes world ocean-current mapping and wind/climate patterns.",
    items:["Gulf Stream","Canary Current","Benguela Current","Peru/Humboldt Current","warm/cold current patterns"],
    pages:"27"
  },
];

const WORLD_LEARNING_MODES = [
  {id:"countries",label:"Countries",icon:"🌐",desc:"Country → capital → neighbours → UPSC geography"},
  {id:"seas",label:"Seas",icon:"🌊",desc:"Seas, littoral countries and connected straits"},
  {id:"rivers",label:"Rivers",icon:"〰",desc:"Country → rivers → basin → detail"},
  {id:"mountains",label:"Mountains",icon:"⛰",desc:"Mountain systems and physical geography"},
  {id:"straits",label:"Straits",icon:"↔",desc:"Strategic maritime chokepoints"},
  {id:"gulfs",label:"Gulfs",icon:"◒",desc:"Gulfs and surrounding countries"},
  {id:"canals",label:"Canals & Routes",icon:"⇄",desc:"Canals, corridors and strategic routes"},
  {id:"deserts",label:"Deserts",icon:"◌",desc:"Major deserts and climate geography"},
  {id:"lakes",label:"Lakes",icon:"◉",desc:"Major lakes and basin context"},
  {id:"ecology",label:"Ecology",icon:"♧",desc:"Ecological regions as clickable map dots"},
  {id:"glaciers",label:"Glaciers",icon:"❄",desc:"Ice sheets, glaciers and climate links"},
  {id:"currents",label:"Currents",icon:"≈",desc:"Ocean currents and climate effects"},
  {id:"resources",label:"Resources",icon:"◆",desc:"Strategic resource regions"},
  {id:"islands",label:"Islands",icon:"⌁",desc:"Indian Ocean and global island mapping"},
  {id:"hotspots",label:"Hotspots",icon:"!",desc:"Conflict and strategic geography"},
  {id:"notes",label:"Mapping Notes",icon:"✎",desc:"Your class mnemonics and source clusters"},
];

const SOURCE_NOTES = [
  {title:"Aral Sea",detail:"Kazakhstan + Uzbekistan",pages:"1, 31"},
  {title:"Baltic Sea",detail:"Russia, Denmark, Germany, Sweden, Estonia, Latvia, Lithuania, Poland, Finland",pages:"2, 31"},
  {title:"Black Sea",detail:"Bulgaria, Ukraine, Russia, Georgia, Romania, Türkiye",pages:"3, 4, 31"},
  {title:"Caspian Sea",detail:"Turkmenistan, Azerbaijan, Russia, Iran, Kazakhstan",pages:"6, 31"},
  {title:"Mekong region",detail:"Laos, India, Myanmar, Cambodia, Thailand, Vietnam",pages:"8, 32"},
  {title:"Syria neighbours",detail:"Lebanon, Israel, Türkiye, Jordan, Iraq",pages:"11, 32"},
  {title:"Türkiye neighbours",detail:"Bulgaria, Greece, Georgia, Armenia, Azerbaijan, Iran, Iraq, Syria",pages:"12, 32"},
  {title:"Iran neighbours",detail:"Türkiye, Armenia, Azerbaijan, Turkmenistan, Afghanistan, Pakistan, Iraq",pages:"12, 32"},
  {title:"SCO cluster",detail:"India, Pakistan, China, Russia, Kazakhstan, Kyrgyzstan, Tajikistan, Uzbekistan, Iran, Belarus",pages:"20, 33"},
  {title:"Northern Sea Route",detail:"Barents → Kara → Laptev → East Siberian → Chukchi → Bering Strait",pages:"28, 34"},
  {title:"Nile basin",detail:"Africa map-based basin relations",pages:"24–25"},
  {title:"Lake Natron",detail:"Tanzania + Kenya",pages:"37"},
];

const QUIZ = [
  {q:"Which pair is associated with the Aral Sea in the source mapping notes?",o:["Iran + Iraq","Kazakhstan + Uzbekistan","India + Nepal","Russia + Finland"],a:1,e:"The source note maps the Aral Sea with Kazakhstan and Uzbekistan."},
  {q:"Which group represents the Black Sea littoral countries in the source mnemonic?",o:["Bulgaria, Ukraine, Russia, Georgia, Romania, Türkiye","Spain, France, Italy, Greece, Türkiye, Egypt","Kazakhstan, Iran, Russia, Azerbaijan, Turkmenistan","India, Pakistan, China, Nepal, Bhutan, Myanmar"],a:0,e:"The source uses BURGeR-T for the Black Sea cluster."},
  {q:"Which river is historically linked to the Aral Sea inflow?",o:["Mekong","Nile","Syr Darya","Amazon"],a:2,e:"Syr Darya is one of the major historical inflows to the Aral Sea."},
  {q:"Which strait connects the Persian Gulf with the Gulf of Oman?",o:["Malacca","Hormuz","Bering","Gibraltar"],a:1,e:"The Strait of Hormuz is the Persian Gulf–Gulf of Oman chokepoint."},
  {q:"Which sequence belongs to the Northern Sea Route in the source notes?",o:["Suez → Red Sea → Aden","Barents → Kara → Laptev → East Siberian → Chukchi","Baltic → Black → Caspian","Mediterranean → Aegean → Black"],a:1,e:"This is the sequence shown in the source notes."},
  {q:"Lake Natron is mapped in the notes with which countries?",o:["Tanzania + Kenya","Egypt + Sudan","Peru + Bolivia","India + Nepal"],a:0,e:"The source explicitly notes Lake Natron → Tanzania + Kenya."},
];

const GEO_URL = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const CONTINENTS = ["All","Asia","Europe","Africa","North America","South America","Oceania"];

const FEATURE_COLOR = {
  countries:"#38bdf8",
  seas:"#22d3ee",
  rivers:"#60a5fa",
  mountains:"#f59e0b",
  straits:"#a78bfa",
  gulfs:"#14b8a6",
  canals:"#fb7185",
  deserts:"#d6a756",
  lakes:"#38bdf8",
  ecology:"#34d399",
  glaciers:"#bae6fd",
  currents:"#f472b6",
  resources:"#fbbf24",
  islands:"#c084fc",
  hotspots:"#fb7185",
  notes:"#f97316",
};

const FEATURE_LABEL = {
  countries:"Countries",
  seas:"Seas",
  rivers:"Rivers",
  mountains:"Mountains",
  straits:"Straits",
  gulfs:"Gulfs",
  canals:"Canals & Routes",
  deserts:"Deserts",
  lakes:"Lakes",
  ecology:"Ecology",
  glaciers:"Glaciers",
  currents:"Ocean Currents",
  resources:"Resources",
  islands:"Islands",
  hotspots:"Strategic Hotspots",
  notes:"Mapping Notes",
};

const normalize = (s="") =>
  s.toLowerCase()
   .replace(/é/g,"e")
   .replace(/ü/g,"u")
   .replace(/ı/g,"i")
   .replace(/ö/g,"o")
   .replace(/ç/g,"c")
   .replace(/[^\w]+/g,"")
   .trim();

const COUNTRY_ALIASES = {
  usa:"United States",
  unitedstatesofamerica:"United States",
  us:"United States",
  uae:"United Arab Emirates",
  unitedarabemirates:"United Arab Emirates",
  turkey:"Türkiye",
  turkiye:"Türkiye",
  trkiye:"Türkiye",
  czechia:"Czech Republic",
  drcongo:"DR Congo",
  democraticrepublicofthecongo:"DR Congo",
  myanmar:"Myanmar",
  burma:"Myanmar",
  southkorea:"South Korea",
  northkorea:"North Korea",
  uk:"United Kingdom",
  britain:"United Kingdom",
  england:"United Kingdom",
  russia:"Russia",
  iran:"Iran",
};

function canonicalCountry(value="") {
  const n = normalize(value);
  return COUNTRY_ALIASES[n] || value;
}

function countryMatch(a,b) {
  return normalize(canonicalCountry(a)) === normalize(canonicalCountry(b));
}

function splitCountries(value=[]) {
  if (Array.isArray(value)) return value.map(canonicalCountry);
  return String(value)
    .split(/[,;→+]/)
    .map(s=>s.trim())
    .filter(Boolean)
    .map(canonicalCountry);
}

function countriesOverlap(featureCountries, countryName) {
  const list = splitCountries(featureCountries);
  return list.some(c=>countryMatch(c,countryName));
}

function project(lon, lat, w, h, pad=10) {
  const x = pad + ((lon + 180) / 360) * (w - pad*2);
  const y = pad + ((90 - lat) / 180) * (h - pad*2);
  return [x,y];
}

function ringPath(ring,w,h) {
  if (!ring?.length) return "";
  return ring.map((p,i)=>{
    const [x,y] = project(p[0],p[1],w,h);
    return `${i===0?"M":"L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + " Z";
}

function geometryPath(geometry,w,h) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") return geometry.coordinates.map(r=>ringPath(r,w,h)).join(" ");
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map(poly=>poly.map(r=>ringPath(r,w,h)).join(" ")).join(" ");
  return "";
}

function geoCountryName(feature) {
  const p = feature?.properties || {};
  return p.ADMIN || p.NAME || p.name || p.NAME_EN || p.ADMIN_EN || "Unknown";
}

function countryId(name) {
  return normalize(name).replace(/\d/g,"");
}

function getCountryMeta(name) {
  const exact = WORLD_COUNTRIES.find(([n])=>countryMatch(n,name));
  if (exact) return {name:exact[0],capital:exact[1],continent:exact[2],known:true};
  return {name,capital:null,continent:null,known:false};
}

function featureSet(layer) {
  if (layer === "notes") return WORLD_NOTE_REGIONS;
  if (layer === "countries") return [];
  return WORLD_FEATURES[layer] || [];
}

function featureToSearchText(item) {
  return [
    item.name,item.type,item.upsc,item.summary,
    ...(item.countries || []),
    ...(item.facts || []),
    ...(item.items || [])
  ].join(" ");
}

function featureRelatedToCountry(item,country) {
  return countriesOverlap(item.countries || [], country);
}

function markerSize(layer) {
  if (["rivers","mountains","hotspots","notes"].includes(layer)) return 7;
  if (["seas","ecology","glaciers","currents"].includes(layer)) return 6;
  return 5.5;
}

export default function WorldMapPage() {
  const [geo,setGeo] = useState(null);
  const [loading,setLoading] = useState(true);
  const [mapError,setMapError] = useState("");
  const [theme,setTheme] = useState("dark");
  const [layer,setLayer] = useState("countries");
  const [continent,setContinent] = useState("All");
  const [query,setQuery] = useState("");
  const [selectedCountry,setSelectedCountry] = useState(null);
  const [selectedFeature,setSelectedFeature] = useState(null);
  const [mode,setMode] = useState("explore");
  const [mastered,setMastered] = useState([]);
  const [quizIndex,setQuizIndex] = useState(0);
  const [quizSelected,setQuizSelected] = useState(null);
  const [quizScore,setQuizScore] = useState(0);
  const [showSourceNotes,setShowSourceNotes] = useState(false);

  useEffect(()=>{
    let alive=true;
    setLoading(true);
    fetch(GEO_URL)
      .then(r=>{
        if(!r.ok) throw new Error("World map data could not be loaded.");
        return r.json();
      })
      .then(data=>{
        if(alive) setGeo(data);
      })
      .catch(err=>{
        if(alive) setMapError(err.message || "Map loading failed.");
      })
      .finally(()=>{
        if(alive) setLoading(false);
      });
    return ()=>{alive=false;};
  },[]);

  const features = useMemo(()=>{
    return (geo?.features || []).map((feature,index)=>{
      const name = geoCountryName(feature);
      return {
        key:`country-${index}-${countryId(name)}`,
        feature,
        name,
        meta:getCountryMeta(name),
      };
    });
  },[geo]);

  const allFeatures = useMemo(()=>featureSet(layer),[layer]);

  const filteredCountryFeatures = useMemo(()=>{
    return features.filter(({name,meta})=>{
      const continentOK = continent==="All" || meta.continent===continent;
      const queryOK = !query || normalize(name).includes(normalize(query)) ||
        normalize(meta.capital || "").includes(normalize(query));
      return continentOK && queryOK;
    });
  },[features,continent,query]);

  const filteredMapFeatures = useMemo(()=>{
    const q=normalize(query);
    return allFeatures.filter(item=>{
      if(!q) return true;
      return normalize(featureToSearchText(item)).includes(q);
    });
  },[allFeatures,query]);

  const selectedCountryData = selectedCountry ? getCountryMeta(selectedCountry) : null;

  const relatedFeatures = useMemo(()=>{
    if(!selectedCountry || layer==="countries") return [];
    return allFeatures.filter(item=>featureRelatedToCountry(item,selectedCountry));
  },[allFeatures,selectedCountry,layer]);

  const visibleMapFeatures = useMemo(()=>{
    if(layer==="countries") return [];
    if(selectedCountry && relatedFeatures.length) return relatedFeatures;
    return filteredMapFeatures;
  },[layer,selectedCountry,relatedFeatures,filteredMapFeatures]);

  const stats = useMemo(()=>({
    countries:features.length,
    datasetCountries:WORLD_COUNTRIES.length,
    features:Object.values(WORLD_FEATURES).flat().length,
    sourceClusters:WORLD_NOTE_REGIONS.length,
    mastered:mastered.length,
  }),[features.length,mastered.length]);

  const chooseLayer = (nextLayer)=>{
    setLayer(nextLayer);
    setSelectedCountry(null);
    setSelectedFeature(null);
    setQuery("");
  };

  const handleCountryClick = (name)=>{
    setSelectedFeature(null);
    setSelectedCountry(name);
  };

  const handleFeatureClick = (item)=>{
    setSelectedFeature(item);
    const firstCountry = splitCountries(item.countries || [])[0];
    if(firstCountry) setSelectedCountry(firstCountry);
  };

  const resetSelection = ()=>{
    setSelectedFeature(null);
    setSelectedCountry(null);
  };

  const toggleMastered = (id)=>{
    setMastered(prev=>prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  };

  const currentQuiz = QUIZ[quizIndex % QUIZ.length];
  const quizAnswered = quizSelected !== null;
  const submitQuiz = ()=>{
    if(quizSelected === null) return;
    if(quizSelected === currentQuiz.a) setQuizScore(s=>s+1);
  };
  const nextQuiz = ()=>{
    setQuizSelected(null);
    setQuizIndex(i=>i+1);
  };

  const activeColor = FEATURE_COLOR[layer] || "#38bdf8";

  return (
    <div className={`world-shell ${theme}`}>
      <style>{`
        *{box-sizing:border-box}
        body{margin:0}
        .world-shell{
          min-height:100vh;
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          background:#f5f7fb;color:#0f172a;
        }
        .world-shell.dark{background:#07111f;color:#e5edf8}
        .world-shell.light{background:#f5f7fb;color:#0f172a}
        .world-wrap{max-width:1540px;margin:0 auto;padding:22px}
        .world-top{
          display:flex;justify-content:space-between;align-items:center;gap:16px;
          padding:18px 20px;border:1px solid rgba(148,163,184,.18);
          border-radius:22px;background:rgba(15,23,42,.78);backdrop-filter:blur(14px);
          position:sticky;top:12px;z-index:30;
        }
        .light .world-top{background:rgba(255,255,255,.86)}
        .brand-title{font-size:24px;font-weight:900;letter-spacing:-.03em}
        .brand-sub{font-size:12px;color:#94a3b8;margin-top:3px}
        .top-actions{display:flex;gap:8px;flex-wrap:wrap}
        button{
          font:inherit;border:0;cursor:pointer;
        }
        .pill-btn{
          border:1px solid rgba(148,163,184,.2);background:rgba(30,41,59,.72);
          color:inherit;border-radius:12px;padding:9px 12px;font-weight:700;
        }
        .light .pill-btn{background:#fff}
        .hero{
          margin-top:18px;padding:30px;border-radius:28px;
          background:
            radial-gradient(circle at 80% 10%,rgba(56,189,248,.18),transparent 30%),
            radial-gradient(circle at 15% 80%,rgba(168,85,247,.14),transparent 30%),
            linear-gradient(135deg,#0b1729,#0d2135);
          border:1px solid rgba(56,189,248,.15);
        }
        .light .hero{background:linear-gradient(135deg,#eaf7ff,#f5f3ff)}
        .hero h1{margin:0;font-size:42px;letter-spacing:-.045em}
        .hero p{margin:8px 0 0;color:#9fb0c4;max-width:820px;line-height:1.6}
        .light .hero p{color:#475569}
        .stats{
          display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:22px;
        }
        .stat{
          padding:15px;border:1px solid rgba(148,163,184,.16);border-radius:17px;
          background:rgba(15,23,42,.55)
        }
        .light .stat{background:#fff}
        .stat b{display:block;font-size:22px}.stat span{font-size:11px;color:#94a3b8}
        .layout{display:grid;grid-template-columns:330px minmax(0,1fr) 380px;gap:14px;margin-top:14px}
        .panel{
          border:1px solid rgba(148,163,184,.17);border-radius:22px;
          background:rgba(15,23,42,.74);overflow:hidden;
        }
        .light .panel{background:#fff}
        .panel-head{padding:17px;border-bottom:1px solid rgba(148,163,184,.13)}
        .panel-head h3{margin:0;font-size:14px}.panel-head small{color:#94a3b8}
        .layer-grid{padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .layer-btn{
          text-align:left;padding:12px;border-radius:15px;background:rgba(30,41,59,.5);
          color:inherit;border:1px solid transparent;min-height:72px;
        }
        .light .layer-btn{background:#f8fafc}
        .layer-btn.active{border-color:${activeColor};box-shadow:0 0 0 1px ${activeColor} inset}
        .layer-icon{font-size:18px}.layer-label{font-weight:800;font-size:12px;margin-top:4px}
        .layer-desc{font-size:10px;color:#94a3b8;line-height:1.3;margin-top:3px}
        .continent-row{padding:12px;display:flex;gap:6px;flex-wrap:wrap}
        .chip{
          padding:7px 9px;border-radius:999px;border:1px solid rgba(148,163,184,.16);
          background:transparent;color:inherit;font-size:11px;font-weight:700;
        }
        .chip.active{background:#38bdf8;color:#03101c;border-color:#38bdf8}
        .search{margin:0 12px 12px;padding:11px 12px;border-radius:13px;width:calc(100% - 24px);
          border:1px solid rgba(148,163,184,.18);background:rgba(2,6,23,.32);color:inherit;outline:none}
        .light .search{background:#f8fafc;color:#0f172a}
        .map-panel{min-width:0}
        .map-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 15px}
        .toolbar-left,.toolbar-right{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
        .mode-btn{padding:8px 10px;border-radius:10px;background:rgba(30,41,59,.6);color:inherit;font-size:11px;font-weight:800}
        .mode-btn.active{background:#38bdf8;color:#03101c}
        .mapbox{
          position:relative;min-height:610px;display:flex;align-items:center;justify-content:center;
          padding:8px 12px 18px;background:
            radial-gradient(circle at 50% 45%,rgba(14,116,144,.11),transparent 50%),
            linear-gradient(180deg,rgba(2,6,23,.12),rgba(2,6,23,.34));
        }
        .light .mapbox{background:linear-gradient(180deg,#eaf6fb,#f8fbfd)}
        .world-svg{width:100%;height:auto;max-height:620px;overflow:visible}
        .country-path{fill:rgba(71,85,105,.38);stroke:rgba(148,163,184,.32);stroke-width:.45;vector-effect:non-scaling-stroke;cursor:pointer;transition:.16s}
        .light .country-path{fill:rgba(148,163,184,.24);stroke:rgba(71,85,105,.35)}
        .country-path:hover{fill:rgba(56,189,248,.34);stroke:#38bdf8;stroke-width:1.2}
        .country-path.selected{fill:rgba(56,189,248,.42);stroke:#22d3ee;stroke-width:1.5}
        .feature-dot{cursor:pointer;stroke:#06111d;stroke-width:1.2}
        .light .feature-dot{stroke:#fff}
        .feature-dot:hover{r:9}
        .map-legend{
          position:absolute;left:22px;bottom:22px;padding:10px 12px;border-radius:13px;
          background:rgba(2,6,23,.74);border:1px solid rgba(148,163,184,.2);font-size:11px
        }
        .light .map-legend{background:rgba(255,255,255,.86)}
        .map-empty{text-align:center;color:#94a3b8;padding:100px 20px}
        .right-body{padding:14px}
        .selected-card{
          padding:15px;border-radius:17px;border:1px solid rgba(56,189,248,.2);
          background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(168,85,247,.07));
        }
        .selected-card h2{margin:0;font-size:22px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#38bdf8;font-weight:900}
        .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
        .meta-box{padding:10px;border-radius:12px;background:rgba(148,163,184,.08)}
        .meta-box span{display:block;font-size:9px;color:#94a3b8}.meta-box b{font-size:12px}
        .section-title{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;font-weight:900;margin:18px 0 8px}
        .related-list{display:flex;flex-direction:column;gap:7px}
        .related-btn{
          display:flex;justify-content:space-between;gap:8px;text-align:left;width:100%;
          padding:10px;border-radius:12px;background:rgba(30,41,59,.48);color:inherit;
          border:1px solid rgba(148,163,184,.12)
        }
        .light .related-btn{background:#f8fafc}
        .related-btn:hover{border-color:#38bdf8}
        .related-btn b{font-size:11px}.related-btn span{font-size:9px;color:#94a3b8}
        .detail-fact{padding:9px 0;border-bottom:1px solid rgba(148,163,184,.1);font-size:11px;line-height:1.45}
        .upsc-box{margin-top:12px;padding:12px;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.16);font-size:11px;line-height:1.5}
        .source-box{margin-top:12px;padding:11px;border-radius:13px;background:rgba(249,115,22,.07);border:1px solid rgba(249,115,22,.2);font-size:10px;line-height:1.5}
        .source-tag{display:inline-flex;padding:4px 7px;border-radius:999px;background:rgba(249,115,22,.14);color:#fb923c;font-weight:800;font-size:9px;margin-bottom:6px}
        .country-list{max-height:330px;overflow:auto;padding:0 12px 12px}
        .country-row{width:100%;display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border-radius:10px;background:transparent;color:inherit;text-align:left}
        .country-row:hover{background:rgba(56,189,248,.08)}
        .country-row b{font-size:11px}.country-row span{font-size:9px;color:#94a3b8}
        .note-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
        .note-card{padding:14px;border-radius:17px;background:rgba(15,23,42,.7);border:1px solid rgba(249,115,22,.13)}
        .light .note-card{background:#fff}
        .note-card h4{margin:0 0 5px;font-size:12px}.note-card p{margin:0;color:#94a3b8;font-size:10px;line-height:1.5}
        .quiz{padding:16px}.quiz h2{font-size:18px;margin:0 0 12px}
        .quiz-opt{display:block;width:100%;text-align:left;padding:12px;margin:7px 0;border-radius:12px;background:rgba(30,41,59,.55);color:inherit;border:1px solid rgba(148,163,184,.12)}
        .light .quiz-opt{background:#f8fafc}
        .quiz-opt.correct{border-color:#34d399;background:rgba(52,211,153,.12)}
        .quiz-opt.wrong{border-color:#fb7185;background:rgba(251,113,133,.12)}
        .bottom-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:14px;margin-top:14px}
        .info-panel{padding:18px}
        .info-panel h3{margin:0 0 8px}.info-panel p{font-size:12px;color:#94a3b8;line-height:1.6}
        .tag-cloud{display:flex;gap:7px;flex-wrap:wrap}.tag{padding:6px 9px;border-radius:999px;background:rgba(56,189,248,.08);font-size:10px}
        .footer-note{margin:14px 0 30px;color:#64748b;font-size:10px;line-height:1.5}
        @media(max-width:1180px){.layout{grid-template-columns:260px minmax(0,1fr)}.layout>.panel:last-child{grid-column:1/-1}.note-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:820px){
          .world-wrap{padding:10px}.world-top{position:static}.hero h1{font-size:31px}.stats{grid-template-columns:repeat(2,1fr)}
          .layout{grid-template-columns:1fr}.layout>.panel:last-child{grid-column:auto}.mapbox{min-height:450px}.note-grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="world-wrap">
        <header className="world-top">
          <div>
            <div className="brand-title">BHARAT DARSHAN · WORLD MAP</div>
            <div className="brand-sub">Explore the World • Learn the World • Master the World</div>
          </div>
          <div className="top-actions">
            <button className="pill-btn" onClick={()=>setMode("explore")}>Explore</button>
            <button className="pill-btn" onClick={()=>setMode("recall")}>Active Recall</button>
            <button className="pill-btn" onClick={()=>setMode("quiz")}>Prelims Quiz</button>
            <button className="pill-btn" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?"☀ Light":"◐ Dark"}</button>
          </div>
        </header>

        <section className="hero">
          <div className="eyebrow">UPSC PRELIMS · GS GEOGRAPHY · MAPPING INTELLIGENCE</div>
          <h1>Interactive World Map</h1>
          <p>
            Country click → related feature list → feature click → detailed UPSC panel.
            The uploaded Mapping Class 2026 notes are integrated as a separate source-note layer,
            so the original mnemonics and map relations remain traceable.
          </p>
          <div className="stats">
            <div className="stat"><b>{stats.countries || "—"}</b><span>GeoJSON countries</span></div>
            <div className="stat"><b>{stats.datasetCountries}</b><span>Country intelligence entries</span></div>
            <div className="stat"><b>{stats.features}</b><span>Mapped world features</span></div>
            <div className="stat"><b>{stats.sourceClusters}</b><span>Source-note clusters</span></div>
            <div className="stat"><b>{stats.mastered}</b><span>Mastered recall items</span></div>
          </div>
        </section>

        <div className="layout">
          <aside className="panel">
            <div className="panel-head">
              <h3>Learning Layers</h3>
              <small>Choose what you want to map</small>
            </div>
            <div className="layer-grid">
              {WORLD_LEARNING_MODES.map(m=>(
                <button key={m.id} className={`layer-btn ${layer===m.id?"active":""}`} onClick={()=>chooseLayer(m.id)}>
                  <div className="layer-icon">{m.icon}</div>
                  <div className="layer-label">{m.label}</div>
                  <div className="layer-desc">{m.desc}</div>
                </button>
              ))}
            </div>

            <div className="panel-head">
              <h3>Continent Filter</h3>
              <small>Applies to country view and feature search</small>
            </div>
            <div className="continent-row">
              {CONTINENTS.map(c=>(
                <button key={c} className={`chip ${continent===c?"active":""}`} onClick={()=>setContinent(c)}>{c}</button>
              ))}
            </div>

            <input
              className="search"
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder={`Search ${FEATURE_LABEL[layer] || "map"}...`}
            />

            {layer==="countries" ? (
              <div className="country-list">
                {filteredCountryFeatures.slice(0,120).map(c=>(
                  <button key={c.key} className="country-row" onClick={()=>handleCountryClick(c.name)}>
                    <b>{c.name}</b><span>{c.meta.capital || "Capital not in dataset"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="country-list">
                {(selectedCountry ? relatedFeatures : filteredMapFeatures).slice(0,120).map(item=>(
                  <button key={item.id} className="country-row" onClick={()=>handleFeatureClick(item)}>
                    <b>{item.name}</b><span>{item.type}</span>
                  </button>
                ))}
                {!selectedCountry && (
                  <div style={{padding:"12px",fontSize:10,color:"#94a3b8"}}>
                    Tip: select a country on the map first to see only features connected to that country.
                  </div>
                )}
              </div>
            )}
          </aside>

          <main className="panel map-panel">
            <div className="map-toolbar">
              <div className="toolbar-left">
                <button className={`mode-btn ${mode==="explore"?"active":""}`} onClick={()=>setMode("explore")}>MAP</button>
                <button className={`mode-btn ${mode==="recall"?"active":""}`} onClick={()=>setMode("recall")}>RECALL</button>
                <button className={`mode-btn ${mode==="quiz"?"active":""}`} onClick={()=>setMode("quiz")}>QUIZ</button>
                {selectedCountry && <button className="mode-btn" onClick={resetSelection}>RESET SELECTION</button>}
              </div>
              <div className="toolbar-right">
                <span style={{fontSize:10,color:"#94a3b8"}}>
                  {FEATURE_LABEL[layer]}
                  {selectedCountry ? ` · ${selectedCountry}` : ""}
                  {selectedFeature ? ` · ${selectedFeature.name}` : ""}
                </span>
              </div>
            </div>

            {mode==="quiz" ? (
              <div className="quiz">
                <div className="eyebrow">PRELIMS MAP QUIZ</div>
                <h2>{currentQuiz.q}</h2>
                {currentQuiz.o.map((opt,i)=>{
                  const picked = quizSelected===i;
                  const cls = quizAnswered && i===currentQuiz.a ? "correct" : quizAnswered && picked ? "wrong" : "";
                  return (
                    <button key={opt} className={`quiz-opt ${cls}`} onClick={()=>setQuizSelected(i)}>
                      <b>{String.fromCharCode(65+i)}.</b> {opt}
                    </button>
                  );
                })}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  {!quizAnswered ? (
                    <button className="mode-btn active" onClick={submitQuiz}>CHECK ANSWER</button>
                  ) : (
                    <button className="mode-btn active" onClick={nextQuiz}>NEXT QUESTION</button>
                  )}
                </div>
                {quizAnswered && (
                  <div className="upsc-box">
                    <b>Explanation:</b> {currentQuiz.e}
                    <div style={{marginTop:6}}>Score: {quizScore}/{quizIndex+1}</div>
                  </div>
                )}
              </div>
            ) : mode==="recall" ? (
              <div className="quiz">
                <div className="eyebrow">ACTIVE RECALL</div>
                <h2>Tap a mapping note or feature, then mark it mastered.</h2>
                <div className="note-grid">
                  {WORLD_NOTE_REGIONS.slice(0,9).map(item=>{
                    const done=mastered.includes(item.id);
                    return (
                      <div key={item.id} className="note-card">
                        <h4>{item.name}</h4>
                        <p>{item.summary}</p>
                        <button className={`mode-btn ${done?"active":""}`} style={{marginTop:10}} onClick={()=>toggleMastered(item.id)}>
                          {done?"I KNEW IT ✓":"I KNEW IT"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mapbox">
                {loading && <div className="map-empty">Loading world map…</div>}
                {!loading && mapError && <div className="map-empty">{mapError}</div>}
                {!loading && !mapError && geo && (
                  <>
                    <svg className="world-svg" viewBox="0 0 1000 500" role="img" aria-label="Interactive world map">
                      <rect x="0" y="0" width="1000" height="500" rx="18" fill="rgba(14,116,144,.055)" />
                      {features.map(({key,feature,name})=>{
                        const path=geometryPath(feature.geometry,1000,500);
                        if(!path) return null;
                        const selected = selectedCountry && countryMatch(selectedCountry,name);
                        return (
                          <path
                            key={key}
                            d={path}
                            className={`country-path ${selected?"selected":""}`}
                            onClick={()=>handleCountryClick(name)}
                            aria-label={name}
                          >
                            <title>{name}</title>
                          </path>
                        );
                      })}

                      {layer!=="countries" && visibleMapFeatures.map(item=>{
                        const [x,y]=project(item.coords[0],item.coords[1],1000,500);
                        const selected = selectedFeature?.id===item.id;
                        return (
                          <g key={item.id} onClick={()=>handleFeatureClick(item)} role="button" tabIndex={0}
                             onKeyDown={e=>{if(e.key==="Enter"||e.key===" ") handleFeatureClick(item)}}>
                            <circle
                              className="feature-dot"
                              cx={x} cy={y}
                              r={selected?10:markerSize(layer)}
                              fill={selected ? "#ffffff" : (FEATURE_COLOR[layer] || "#38bdf8")}
                              opacity={selected?1:.88}
                            />
                            <title>{item.name} — {item.type}</title>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="map-legend">
                      <b style={{color:activeColor}}>{FEATURE_LABEL[layer]}</b>
                      <div style={{marginTop:3,color:"#94a3b8"}}>
                        {layer==="countries"
                          ? "Tap any country for name + capital."
                          : selectedCountry
                            ? `Showing ${relatedFeatures.length} related feature(s). Tap a dot for details.`
                            : "Tap a country first, or tap any visible dot."}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </main>

          <aside className="panel">
            <div className="panel-head">
              <h3>Intelligence Panel</h3>
              <small>Context changes with your selection</small>
            </div>
            <div className="right-body">
              {selectedFeature ? (
                <>
                  <button className="mode-btn" onClick={()=>setSelectedFeature(null)}>← Back to {selectedCountry || "map"}</button>
                  <div className="selected-card" style={{marginTop:10}}>
                    <div className="eyebrow">{selectedFeature.type}</div>
                    <h2>{selectedFeature.name}</h2>
                    {selectedFeature.countries?.length>0 && (
                      <div style={{marginTop:7,fontSize:10,color:"#94a3b8"}}>
                        Countries/regions: {splitCountries(selectedFeature.countries).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="section-title">Map Facts</div>
                  {(selectedFeature.facts || selectedFeature.items || []).map((fact,i)=>(
                    <div className="detail-fact" key={i}>{fact}</div>
                  ))}

                  {selectedFeature.summary && (
                    <>
                      <div className="section-title">Source Note</div>
                      <div className="detail-fact">{selectedFeature.summary}</div>
                    </>
                  )}

                  {selectedFeature.upsc && (
                    <div className="upsc-box"><b>UPSC Importance</b><br/>{selectedFeature.upsc}</div>
                  )}

                  {selectedFeature.source && (
                    <div className="source-box">
                      <div className="source-tag">SOURCE-DERIVED</div>
                      <b>{selectedFeature.source}</b><br/>
                      Pages: {selectedFeature.pages}
                    </div>
                  )}

                  {selectedFeature.items && (
                    <button className={`mode-btn ${mastered.includes(selectedFeature.id)?"active":""}`}
                      style={{marginTop:10}} onClick={()=>toggleMastered(selectedFeature.id)}>
                      {mastered.includes(selectedFeature.id)?"MASTERED ✓":"I KNEW IT"}
                    </button>
                  )}
                </>
              ) : selectedCountryData ? (
                <>
                  <div className="selected-card">
                    <div className="eyebrow">Selected Country</div>
                    <h2>{selectedCountryData.name}</h2>
                    <div className="meta-grid">
                      <div className="meta-box"><span>Capital</span><b>{selectedCountryData.capital || "Not in intelligence dataset"}</b></div>
                      <div className="meta-box"><span>Continent</span><b>{selectedCountryData.continent || "—"}</b></div>
                    </div>
                  </div>

                  {layer!=="countries" && (
                    <>
                      <div className="section-title">Related {FEATURE_LABEL[layer]}</div>
                      <div className="related-list">
                        {relatedFeatures.length ? relatedFeatures.map(item=>(
                          <button key={item.id} className="related-btn" onClick={()=>handleFeatureClick(item)}>
                            <b>{item.name}</b><span>{item.type}</span>
                          </button>
                        )) : (
                          <div style={{fontSize:11,color:"#94a3b8",padding:"8px 0"}}>
                            No source-linked feature is currently indexed for this country in this layer.
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {layer==="countries" && (
                    <>
                      <div className="section-title">Country Intelligence</div>
                      <div className="detail-fact">The country polygon comes from the world GeoJSON layer.</div>
                      <div className="detail-fact">Capital is shown only when present in the curated country dataset.</div>
                      <div className="detail-fact">Switch to Rivers, Seas, Ecology, Hotspots or another layer to see country-specific map relations.</div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="selected-card">
                    <div className="eyebrow">How to use</div>
                    <h2>{FEATURE_LABEL[layer]}</h2>
                    <div style={{marginTop:8,fontSize:11,lineHeight:1.55,color:"#94a3b8"}}>
                      {layer==="countries"
                        ? "Tap a country. The panel will show its name and capital."
                        : "Tap a country to filter related features. Then tap a feature dot or a feature in the list to open full details."}
                    </div>
                  </div>

                  <div className="section-title">Current Layer</div>
                  <div className="detail-fact">{WORLD_LEARNING_MODES.find(x=>x.id===layer)?.desc}</div>

                  <div className="section-title">Source Notes</div>
                  <button className="mode-btn active" onClick={()=>setShowSourceNotes(v=>!v)}>
                    {showSourceNotes?"Hide source-note index":"Show source-note index"}
                  </button>

                  {showSourceNotes && SOURCE_NOTES.map((n,i)=>(
                    <div key={i} className="detail-fact">
                      <b>{n.title}</b><br/>
                      {n.detail}<br/>
                      <span style={{fontSize:9,color:"#fb923c"}}>PDF pages {n.pages}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </aside>
        </div>

        <div className="bottom-grid">
          <section className="panel info-panel">
            <div className="eyebrow">SOURCE-INTEGRATED WORLD MAPPING</div>
            <h3>Your Mapping Class notes are now map objects</h3>
            <p>
              The source PDF is not treated as a generic world atlas. Its map relations, mnemonics,
              route sequences and regional clusters are encoded as clickable source-note objects.
              This keeps the note-derived content distinguishable from the general geography layer.
            </p>
            <div className="tag-cloud">
              {["Aral Sea","Baltic Sea","Black Sea","Caspian","Mekong","Nile","SCO","Indian Ocean","Northern Sea Route","Currents","Conflict Regions"].map(t=>(
                <span className="tag" key={t}>{t}</span>
              ))}
            </div>
          </section>

          <section className="panel info-panel">
            <div className="eyebrow">INDIA ↔ WORLD CONTINUITY</div>
            <h3>Same interaction pattern as India Map</h3>
            <p>
              In a river layer, country selection filters rivers; in ecology, dots are directly clickable;
              in seas/straits/gulfs, a country exposes connected maritime features; and every feature opens
              a detail card with facts, UPSC relevance and source-page traceability.
            </p>
            <button className="mode-btn active" onClick={()=>chooseLayer("notes")}>Open Mapping Notes Layer</button>
          </section>
        </div>

        <div className="footer-note">
          Source-derived content in this page comes from the uploaded FINAL MAPPING CLASS FOR 2026 PRELIMS PDF,
          especially the world-mapping pages 1–37. General geography fields are used only to make the map
          interactive and explanatory. Source notes are explicitly labelled where applicable.
        </div>
      </div>
    </div>
  );
}
