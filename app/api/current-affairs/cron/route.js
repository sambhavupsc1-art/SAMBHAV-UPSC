import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const CRON_SECRET =
  process.env.CRON_SECRET;

/* ---------------------------------------
   SOURCE URLS
--------------------------------------- */

const PIB_URL =
  "https://www.pib.gov.in/AllReleasem.aspx?lang=1&reg=3";

const GKTODAY_URL =
  "https://www.gktoday.in/current-affairs/";

const THE_HINDU_FEEDS = [
  {
    name: "The Hindu - National",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
  },
  {
    name: "The Hindu - International",
    url: "https://www.thehindu.com/news/international/feeder/default.rss",
  },
  {
    name: "The Hindu - Business",
    url: "https://www.thehindu.com/business/feeder/default.rss",
  },
  {
    name: "The Hindu - Science & Technology",
    url: "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
  },
  {
    name: "The Hindu - Opinion",
    url: "https://www.thehindu.com/opinion/feeder/default.rss",
  },
];

const BETTER_INDIA_FEEDS = [
  {
    name: "The Better India - Civic Sense",
    url:
      "https://campaign.thebetterindia.com/civic-sense-revolution/",
  },
  {
    name: "The Better India - Changemakers",
    url:
      "https://thebetterindia.com/topics/changemakers/",
  },
];

/* ---------------------------------------
   SUPABASE
--------------------------------------- */

async function supabaseRequest(
  path,
  options = {}
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase environment variables missing."
    );
  }

  return fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );
}

/* ---------------------------------------
   DATE - IST
--------------------------------------- */

function todayIST() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

/* ---------------------------------------
   HTML / TEXT HELPERS
--------------------------------------- */

function decodeHtml(value = "") {
  return value
    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/gi,
      "$1"
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#(\d+);/g,
      (_, n) => {
        try {
          return String.fromCharCode(
            Number(n)
          );
        } catch {
          return "";
        }
      }
    );
}

function stripHtml(value = "") {
  return decodeHtml(value)
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<[^>]*>/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function normalizeText(value = "") {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------------------
   URL NORMALIZATION
--------------------------------------- */

function normalizeUrl(value = "", base = "") {
  let url = decodeHtml(value)
    .replace(/&amp;/gi, "&")
    .replace(/^['"]|['"]$/g, "")
    .trim();

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    if (base) {
      try {
        return new URL(
          url,
          base
        ).toString();
      } catch {
        return url;
      }
    }

    return url;
  }

  if (base) {
    try {
      return new URL(
        url,
        base
      ).toString();
    } catch {
      return url;
    }
  }

  return url;
}

/* ---------------------------------------
   FETCH HEADERS
--------------------------------------- */

function browserHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (compatible; SAMBHAV-UPSC/1.0)",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":
      "en-IN,en;q=0.9",
  };
}

/* ---------------------------------------
   UPSC RELEVANCE
--------------------------------------- */

function relevanceScore(
  title = "",
  content = ""
) {
  const text =
    `${title} ${content}`.toLowerCase();

  const keywords = {
    parliament: 5,
    constitution: 5,
    "supreme court": 5,
    judiciary: 4,
    governance: 4,
    policy: 3,
    scheme: 4,
    legislation: 5,
    bill: 4,
    election: 4,
    federal: 4,
    "local government": 4,
    "public administration": 4,
    transparency: 4,
    accountability: 4,

    rbi: 5,
    sebi: 5,
    economy: 4,
    economic: 3,
    gdp: 5,
    inflation: 5,
    fiscal: 4,
    monetary: 4,
    budget: 4,
    taxation: 4,
    tax: 3,
    trade: 4,
    exports: 4,
    imports: 4,
    investment: 4,
    manufacturing: 4,
    industry: 4,
    employment: 4,
    unemployment: 4,
    banking: 4,
    finance: 4,
    financial: 4,
    "current account": 5,
    "balance of payments": 5,
    subsidy: 4,
    "public expenditure": 4,

    agriculture: 4,
    agricultural: 4,
    farmer: 4,
    farmers: 4,
    crops: 3,
    crop: 3,
    msp: 5,
    irrigation: 4,
    fertilizer: 4,
    fertiliser: 4,
    foodgrain: 4,
    foodgrains: 4,
    food: 3,
    "food security": 5,
    "agricultural research": 5,
    storage: 3,

    environment: 5,
    climate: 5,
    biodiversity: 5,
    wildlife: 4,
    forest: 4,
    pollution: 4,
    water: 3,
    river: 3,
    wetland: 4,
    ecosystem: 5,
    conservation: 4,
    "climate change": 5,
    emissions: 4,
    carbon: 4,
    renewable: 4,
    "green energy": 4,
    sustainability: 4,
    sustainable: 3,

    disaster: 4,
    earthquake: 4,
    cyclone: 4,
    flood: 4,
    drought: 4,
    landslide: 4,
    tsunami: 5,
    resilience: 4,

    isro: 5,
    space: 5,
    satellite: 4,
    science: 4,
    technology: 4,
    "artificial intelligence": 5,
    ai: 2,
    biotechnology: 5,
    semiconductor: 5,
    quantum: 5,
    genome: 5,
    genomics: 5,
    vaccine: 4,
    research: 4,
    innovation: 3,
    digital: 3,
    cybersecurity: 5,
    cyber: 4,
    "digital public infrastructure": 5,
    "digital india": 5,

    defence: 4,
    defense: 4,
    security: 4,
    terrorism: 5,
    terrorist: 5,
    border: 4,
    maritime: 4,
    navy: 4,
    naval: 4,
    military: 4,
    "internal security": 5,
    insurgency: 5,
    extremism: 4,

    international: 3,
    "international relations": 5,
    "united nations": 4,
    "world bank": 4,
    imf: 4,
    wto: 4,
    who: 4,
    unesco: 4,
    brics: 4,
    sco: 4,
    g20: 5,
    quad: 5,
    asean: 4,
    treaty: 4,
    agreement: 4,
    summit: 4,
    "foreign policy": 5,
    diplomacy: 4,
    diplomatic: 4,
    bilateral: 4,
    multilateral: 4,
    "strategic partnership": 5,

    education: 3,
    health: 3,
    "public health": 4,
    healthcare: 4,
    tribal: 4,
    tribes: 4,
    women: 3,
    child: 3,
    children: 3,
    "human rights": 4,
    "social justice": 5,
    poverty: 4,
    nutrition: 4,
    sanitation: 3,
    welfare: 3,
    inclusion: 4,

    report: 3,
    index: 4,
    survey: 4,
    census: 5,
    data: 2,
    statistics: 4,
    indicator: 4,

    heritage: 4,
    culture: 3,
    history: 3,
    archaeology: 4,
    archaeological: 4,
    monument: 3,
    "national park": 4,
    biosphere: 5,
    geography: 3,
    tourism: 2,
    mineral: 3,
    minerals: 3,
    mining: 3,

    telecom: 4,
    telecommunications: 4,
    broadband: 4,
    bharatnet: 5,
    "digital bharat nidhi": 5,
    infrastructure: 4,
    connectivity: 4,
    "public service": 4,
    "civil services": 4,

    ethics: 5,
    integrity: 5,
    empathy: 5,
    compassion: 5,
    accountability: 5,
    honesty: 5,
    courage: 4,
    leadership: 4,
    "public spirit": 5,
    "civic sense": 5,
    "social responsibility": 5,
    altruism: 5,
    volunteer: 4,
    volunteering: 4,
    changemaker: 5,
  };

  let score = 0;

  for (
    const [keyword, points]
    of Object.entries(keywords)
  ) {
    if (text.includes(keyword)) {
      score += points;
    }
  }

  return score;
}

/* ---------------------------------------
   LOW VALUE NOISE
--------------------------------------- */

function isLowValueNoise(
  title = "",
  content = ""
) {
  const text =
    `${title} ${content}`.toLowerCase();

  const noisePatterns = [
    "birthday greetings",
    "extends birthday greetings",
    "greetings on the eve",
    "congratulates indian",
    "congratulates ",
    "lauds captain",
    "immense courage and valour",
    "courage and valour in saving lives",
    "meets prime minister",
    "pays tributes",
    "tributes to former",
    "sanskrit subhashitam",
    "cleanliness drive",
    "blood donation camp",
    "shramdaan",
    "swachhata hi sewa",
    "swachhata hi seva",
  ];

  return noisePatterns.some(
    (pattern) =>
      text.includes(pattern)
  );
}

/* ---------------------------------------
   PIB PARSER
--------------------------------------- */

function extractReleaseLinks(
  html
) {
  const results = [];
  const seen = new Set();

  function add(
    url,
    title = ""
  ) {
    if (!url) return;

    let cleanUrl =
      decodeHtml(url)
        .replace(
          /&amp;/gi,
          "&"
        )
        .replace(
          /^['"]|['"]$/g,
          ""
        )
        .trim();

    if (!cleanUrl) return;

    if (
      cleanUrl.startsWith("/")
    ) {
      cleanUrl =
        `https://www.pib.gov.in${cleanUrl}`;
    } else if (
      cleanUrl.startsWith("//")
    ) {
      cleanUrl =
        `https:${cleanUrl}`;
    } else if (
      !/^https?:\/\//i.test(
        cleanUrl
      )
    ) {
      cleanUrl =
        `https://www.pib.gov.in/${cleanUrl}`;
    }

    const lower =
      cleanUrl.toLowerCase();

    if (
      !lower.includes(
        "pressrelesedetail"
      ) &&
      !lower.includes(
        "pressreleasedetail"
      ) &&
      !lower.includes(
        "prid="
      )
    ) {
      return;
    }

    if (seen.has(cleanUrl)) {
      return;
    }

    seen.add(cleanUrl);

    results.push({
      url: cleanUrl,
      title: stripHtml(title),
    });
  }

  const anchorRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match =
      anchorRegex.exec(
        html
      )) !== null
  ) {
    add(
      match[1],
      match[2]
    );
  }

  const hrefRegex =
    /href\s*=\s*["']([^"']*(?:PressReleseDetailm|PressReleaseDetailm)[^"']*)["']/gi;

  while (
    (match =
      hrefRegex.exec(
        html
      )) !== null
  ) {
    add(
      match[1],
      ""
    );
  }

  const directRegex =
    /(?:https?:\/\/)?(?:www\.)?pib\.gov\.in\/PressReleseDetailm\.aspx\?[^"'<> ]+/gi;

  while (
    (match =
      directRegex.exec(
        html
      )) !== null
  ) {
    add(
      match[0],
      ""
    );
  }

  const relativeRegex =
    /PressReleseDetailm\.aspx\?[^"'<> )]+/gi;

  while (
    (match =
      relativeRegex.exec(
        html
      )) !== null
  ) {
    add(
      match[0],
      ""
    );
  }

  const pridRegex =
    /(?:PressReleseDetailm|PressReleaseDetailm)\.aspx[^"'<>]*?PRID\s*=\s*(\d+)/gi;

  while (
    (match =
      pridRegex.exec(
        html
      )) !== null
  ) {
    add(
      `https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=${match[1]}`,
      ""
    );
  }

  return results;
}

/* ---------------------------------------
   FETCH PIB PAGE
--------------------------------------- */

async function fetchPIBPage() {
  const response =
    await fetch(
      PIB_URL,
      {
        headers:
          browserHeaders(),
        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `PIB page request failed: HTTP ${response.status}`
    );
  }

  const html =
    await response.text();

  console.log(
    "PIB PAGE STATUS:",
    response.status
  );

  console.log(
    "PIB PAGE LENGTH:",
    html.length
  );

  return html;
}

/* ---------------------------------------
   INDIVIDUAL PIB RELEASE
--------------------------------------- */

async function fetchReleaseContent(
  url
) {
  try {
    const response =
      await fetch(
        url,
        {
          headers:
            browserHeaders(),
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      console.log(
        "RELEASE HTTP:",
        response.status,
        url
      );

      return "";
    }

    const html =
      await response.text();

    return stripHtml(
      html
    ).slice(
      0,
      30000
    );
  } catch (error) {
    console.error(
      "Release fetch failed:",
      error.message
    );

    return "";
  }
}

/* ---------------------------------------
   GKToday ARTICLE LINKS
--------------------------------------- */

function extractGKTodayLinks(
  html
) {
  const results = [];
  const seen = new Set();

  const anchorRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match =
      anchorRegex.exec(
        html
      )) !== null
  ) {
    const href =
      normalizeUrl(
        match[1],
        GKTODAY_URL
      );

    const title =
      stripHtml(
        match[2]
      );

    if (!href || !title) {
      continue;
    }

    let parsed;

    try {
      parsed =
        new URL(href);
    } catch {
      continue;
    }

    if (
      parsed.hostname !==
        "www.gktoday.in" &&
      parsed.hostname !==
        "gktoday.in"
    ) {
      continue;
    }

    const path =
      parsed.pathname.toLowerCase();

    if (
      !path.includes(
        "/current-affairs/"
      )
    ) {
      continue;
    }

    if (
      path.includes(
        "/category/"
      ) ||
      path.includes(
        "/page/"
      ) ||
      path.includes(
        "/quiz"
      ) ||
      path.includes(
        "daily-current-affairs-quiz"
      )
    ) {
      continue;
    }

    const key =
      href.split("#")[0];

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    results.push({
      url: key,
      title,
    });
  }

  return results;
}

/* ---------------------------------------
   FETCH GKTODAY PAGE
--------------------------------------- */

async function fetchGKTodayPage() {
  const response =
    await fetch(
      GKTODAY_URL,
      {
        headers:
          browserHeaders(),
        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `GKToday page request failed: HTTP ${response.status}`
    );
  }

  return response.text();
}

/* ---------------------------------------
   FETCH GKTODAY ARTICLE
--------------------------------------- */

async function fetchGKTodayArticle(
  url
) {
  try {
    const response =
      await fetch(
        url,
        {
          headers:
            browserHeaders(),
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      return "";
    }

    const html =
      await response.text();

    return stripHtml(
      html
    ).slice(
      0,
      25000
    );
  } catch (error) {
    console.error(
      "GKToday article fetch failed:",
      error.message
    );

    return "";
  }
}

/* ---------------------------------------
   THE HINDU RSS
--------------------------------------- */

function extractRSSItems(
  xml,
  sourceName
) {
  const items = [];

  const itemRegex =
    /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

  let match;

  while (
    (match =
      itemRegex.exec(
        xml
      )) !== null
  ) {
    const block =
      match[1];

    const titleMatch =
      block.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      );

    const linkMatch =
      block.match(
        /<link[^>]*>([\s\S]*?)<\/link>/i
      );

    const descriptionMatch =
      block.match(
        /<description[^>]*>([\s\S]*?)<\/description>/i
      );

    const dateMatch =
      block.match(
        /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i
      );

    const title =
      stripHtml(
        titleMatch?.[1] || ""
      );

    const link =
      normalizeUrl(
        linkMatch?.[1] || ""
      );

    const description =
      stripHtml(
        descriptionMatch?.[1] || ""
      );

    const publishedAt =
      stripHtml(
        dateMatch?.[1] || ""
      );

    if (
      !title ||
      !link
    ) {
      continue;
    }

    items.push({
      title,
      description,
      url: link,
      source_url: link,
      source_name:
        sourceName,
      published_at:
        publishedAt,
    });
  }

  return items;
}

async function fetchTheHinduFeed(
  feed
) {
  try {
    const response =
      await fetch(
        feed.url,
        {
          headers: {
            ...browserHeaders(),
            Accept:
              "application/rss+xml, application/xml, text/xml, */*",
          },
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      console.log(
        "THE HINDU FEED HTTP:",
        response.status,
        feed.name
      );

      return [];
    }

    const xml =
      await response.text();

    const items =
      extractRSSItems(
        xml,
        feed.name
      );

    console.log(
      "THE HINDU FEED:",
      feed.name,
      "| ITEMS:",
      items.length
    );

    return items;
  } catch (error) {
    console.error(
      "The Hindu feed failed:",
      feed.name,
      error.message
    );

    return [];
  }
}

/* ---------------------------------------
   THE HINDU IMPORTANCE FILTER
--------------------------------------- */

function isImportantTheHinduArticle(
  item
) {
  const text =
    `${item.title} ${item.description}`.toLowerCase();

  const score =
    relevanceScore(
      item.title,
      item.description
    );

  const importantTerms = [
    "supreme court",
    "parliament",
    "constitution",
    "government",
    "policy",
    "rbi",
    "sebi",
    "economy",
    "gdp",
    "inflation",
    "climate",
    "environment",
    "biodiversity",
    "international",
    "foreign policy",
    "china",
    "united states",
    "russia",
    "india",
    "united nations",
    "security",
    "defence",
    "technology",
    "artificial intelligence",
    "semiconductor",
    "agriculture",
    "farmer",
    "health",
    "education",
    "social justice",
    "women",
    "report",
    "index",
    "governance",
    "federalism",
    "judiciary",
    "election",
    "diplomacy",
    "geopolitics",
  ];

  const hasImportantTerm =
    importantTerms.some(
      (term) =>
        text.includes(term)
    );

  return (
    score >= 5 ||
    (hasImportantTerm &&
      score >= 3)
  );
}

/* ---------------------------------------
   BETTER INDIA ETHICS LINKS
--------------------------------------- */

function extractBetterIndiaLinks(
  html,
  baseUrl
) {
  const results = [];
  const seen = new Set();

  const anchorRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match =
      anchorRegex.exec(
        html
      )) !== null
  ) {
    const href =
      normalizeUrl(
        match[1],
        baseUrl
      );

    const title =
      stripHtml(
        match[2]
      );

    if (
      !href ||
      !title ||
      title.length < 20
    ) {
      continue;
    }

    let parsed;

    try {
      parsed =
        new URL(href);
    } catch {
      continue;
    }

    if (
      !parsed.hostname.includes(
        "thebetterindia.com"
      )
    ) {
      continue;
    }

    const key =
      href.split("#")[0];

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    results.push({
      url: key,
      title,
    });
  }

  return results;
}

/* ---------------------------------------
   BETTER INDIA ETHICS FILTER
--------------------------------------- */

function isEthicsExample(
  title = "",
  content = ""
) {
  const text =
    `${title} ${content}`.toLowerCase();

  const ethicsKeywords = [
    "civic sense",
    "civic responsibility",
    "changemaker",
    "compassion",
    "empathy",
    "integrity",
    "honesty",
    "kindness",
    "volunteer",
    "volunteering",
    "social worker",
    "social responsibility",
    "community",
    "public service",
    "citizen",
    "citizens",
    "helped",
    "helping",
    "saved",
    "rescue",
    "cleaned",
    "cleaning",
    "restored",
    "restoration",
    "education",
    "empower",
    "empowered",
    "women empowerment",
    "equality",
    "courage",
    "leadership",
    "sacrifice",
    "environmental responsibility",
    "wildlife conservation",
    "water conservation",
    "justice",
  ];

  let hits = 0;

  for (
    const keyword
    of ethicsKeywords
  ) {
    if (
      text.includes(
        keyword
      )
    ) {
      hits++;
    }
  }

  return hits >= 2;
}

/* ---------------------------------------
   FETCH BETTER INDIA PAGE
--------------------------------------- */

async function fetchBetterIndiaPage(
  feed
) {
  try {
    const response =
      await fetch(
        feed.url,
        {
          headers:
            browserHeaders(),
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      console.log(
        "BETTER INDIA HTTP:",
        response.status,
        feed.url
      );

      return [];
    }

    const html =
      await response.text();

    const links =
      extractBetterIndiaLinks(
        html,
        feed.url
      );

    console.log(
      "BETTER INDIA LINKS:",
      feed.name,
      links.length
    );

    return links;
  } catch (error) {
    console.error(
      "Better India page failed:",
      feed.name,
      error.message
    );

    return [];
  }
}

/* ---------------------------------------
   FETCH BETTER INDIA ARTICLE
--------------------------------------- */

async function fetchBetterIndiaArticle(
  url
) {
  try {
    const response =
      await fetch(
        url,
        {
          headers:
            browserHeaders(),
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      return "";
    }

    const html =
      await response.text();

    return stripHtml(
      html
    ).slice(
      0,
      20000
    );
  } catch (error) {
    console.error(
      "Better India article fetch failed:",
      error.message
    );

    return "";
  }
}

/* ---------------------------------------
   DUPLICATE REMOVAL
--------------------------------------- */

function removeDuplicates(
  items
) {
  const seenTitles =
    new Set();

  const seenUrls =
    new Set();

  return items.filter(
    (item) => {
      const normalizedTitle =
        normalizeText(
          item.title
        );

      const normalizedUrl =
        normalizeText(
          item.source_url ||
            item.url ||
            ""
        );

      if (
        !normalizedTitle &&
        !normalizedUrl
      ) {
        return false;
      }

      if (
        normalizedUrl &&
        seenUrls.has(
          normalizedUrl
        )
      ) {
        return false;
      }

      if (
        normalizedTitle &&
        seenTitles.has(
          normalizedTitle
        )
      ) {
        return false;
      }

      if (normalizedUrl) {
        seenUrls.add(
          normalizedUrl
        );
      }

      if (normalizedTitle) {
        seenTitles.add(
          normalizedTitle
        );
      }

      return true;
    }
  );
}

/* ---------------------------------------
   COLLECT PIB
--------------------------------------- */

async function collectPIB() {
  try {
    const html =
      await fetchPIBPage();

    const releaseLinks =
      extractReleaseLinks(
        html
      );

    console.log(
      "PIB RELEASE LINKS FOUND:",
      releaseLinks.length
    );

    if (
      !releaseLinks.length
    ) {
      console.log(
        "PIB RELEASE LINK PARSER FAILED."
      );

      return [];
    }

    const candidates =
      releaseLinks.slice(
        0,
        35
      );

    const collected = [];

    for (
      const release
      of candidates
    ) {
      try {
        const content =
          await fetchReleaseContent(
            release.url
          );

        const title =
          release.title ||
          content.slice(
            0,
            300
          );

        if (!title) {
          continue;
        }

        const score =
          relevanceScore(
            title,
            content
          );

        const noise =
          isLowValueNoise(
            title,
            content
          );

        console.log(
          "PIB:",
          title.slice(
            0,
            100
          ),
          "| SCORE:",
          score,
          "| NOISE:",
          noise
        );

        if (noise) {
          continue;
        }

        if (
          score >= 4
        ) {
          collected.push({
            title,
            description:
              content ||
              title,
            url:
              release.url,
            source_url:
              release.url,
            source_name:
              "Press Information Bureau (PIB)",
            score,
            source_type:
              "current_affairs",
            report_type:
              "current_affairs",
          });
        }
      } catch (error) {
        console.error(
          "PIB release processing failed:",
          error.message
        );
      }
    }

    return collected;
  } catch (error) {
    console.error(
      "PIB source failed:",
      error.message
    );

    return [];
  }
}

/* ---------------------------------------
   COLLECT GKTODAY
--------------------------------------- */

async function collectGKToday() {
  try {
    const html =
      await fetchGKTodayPage();

    const links =
      extractGKTodayLinks(
        html
      );

    console.log(
      "GKTODAY LINKS FOUND:",
      links.length
    );

    const candidates =
      links.slice(
        0,
        30
      );

    const collected = [];

    for (
      const article
      of candidates
    ) {
      try {
        const content =
          await fetchGKTodayArticle(
            article.url
          );

        const title =
          article.title;

        const score =
          relevanceScore(
            title,
            content
          );

        const noise =
          isLowValueNoise(
            title,
            content
          );

        console.log(
          "GKTODAY:",
          title.slice(
            0,
            100
          ),
          "| SCORE:",
          score,
          "| NOISE:",
          noise
        );

        if (
          noise ||
          score < 4
        ) {
          continue;
        }

        collected.push({
          title,
          description:
            content ||
            title,
          url:
            article.url,
          source_url:
            article.url,
          source_name:
            "GKToday",
          score:
            score + 1,
          source_type:
            "current_affairs",
          report_type:
            "current_affairs",
        });
      } catch (error) {
        console.error(
          "GKToday processing failed:",
          error.message
        );
      }
    }

    return collected;
  } catch (error) {
    console.error(
      "GKToday source failed:",
      error.message
    );

    return [];
  }
}

/* ---------------------------------------
   COLLECT THE HINDU
--------------------------------------- */

async function collectTheHindu() {
  const allItems = [];

  for (
    const feed
    of THE_HINDU_FEEDS
  ) {
    const items =
      await fetchTheHinduFeed(
        feed
      );

    allItems.push(
      ...items
    );
  }

  const unique =
    removeDuplicates(
      allItems
    );

  const important =
    unique
      .filter(
        isImportantTheHinduArticle
      )
      .map(
        (item) => ({
          ...item,
          score:
            relevanceScore(
              item.title,
              item.description
            ) + 2,
          source_type:
            "current_affairs",
          report_type:
            "current_affairs",
        })
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        12
      );

  console.log(
    "THE HINDU IMPORTANT ARTICLES:",
    important.length
  );

  return important;
}

/* ---------------------------------------
   COLLECT BETTER INDIA ETHICS
--------------------------------------- */

async function collectBetterIndiaEthics() {
  const allLinks = [];

  for (
    const feed
    of BETTER_INDIA_FEEDS
  ) {
    const links =
      await fetchBetterIndiaPage(
        feed
      );

    allLinks.push(
      ...links
    );
  }

  const uniqueLinks =
    removeDuplicates(
      allLinks.map(
        (item) => ({
          ...item,
          source_url:
            item.url,
          source_name:
            "The Better India",
        })
      )
    );

  const candidates =
    uniqueLinks.slice(
      0,
      20
    );

  const collected = [];

  for (
    const article
    of candidates
  ) {
    try {
      const content =
        await fetchBetterIndiaArticle(
          article.url
        );

      if (
        !isEthicsExample(
          article.title,
          content
        )
      ) {
        continue;
      }

      collected.push({
        title:
          article.title,
        description:
          content ||
          article.title,
        url:
          article.url,
        source_url:
          article.url,
        source_name:
          "The Better India",
        score:
          relevanceScore(
            article.title,
            content
          ) + 3,
        source_type:
          "ethics_example",
        report_type:
          "ethics_example",
      });

      console.log(
        "BETTER INDIA ETHICS:",
        article.title.slice(
          0,
          120
        )
      );

      if (
        collected.length >= 4
      ) {
        break;
      }
    } catch (error) {
      console.error(
        "Better India processing failed:",
        error.message
      );
    }
  }

  return collected;
}

/* ---------------------------------------
   COLLECT ALL SOURCES
--------------------------------------- */

async function collectSources() {
  const [
    pib,
    gktoday,
    hindu,
    betterIndia,
  ] =
    await Promise.all([
      collectPIB(),
      collectGKToday(),
      collectTheHindu(),
      collectBetterIndiaEthics(),
    ]);

  console.log(
    "SOURCE COUNTS:",
    {
      PIB:
        pib.length,
      GKToday:
        gktoday.length,
      "The Hindu":
        hindu.length,
      "The Better India Ethics":
        betterIndia.length,
    }
  );

  const currentAffairs =
    removeDuplicates([
      ...pib,
      ...gktoday,
      ...hindu,
    ])
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        10
      );

  const ethicsExamples =
    removeDuplicates(
      betterIndia
    )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        4
      );

  console.log(
    "CURRENT AFFAIRS SELECTED:",
    currentAffairs.length
  );

  console.log(
    "ETHICS EXAMPLES SELECTED:",
    ethicsExamples.length
  );

  return {
    currentAffairs,
    ethicsExamples,
  };
}

/* ---------------------------------------
   RUN TRACKING
--------------------------------------- */

async function createOrResetRun(
  runDate
) {
  const existingResponse =
    await supabaseRequest(
      `current_affairs_runs?run_date=eq.${runDate}&select=id`,
      {
        method:
          "GET",
      }
    );

  if (
    !existingResponse.ok
  ) {
    throw new Error(
      `Run lookup failed: ${await existingResponse.text()}`
    );
  }

  const existing =
    await existingResponse.json();

  if (
    existing.length > 0
  ) {
    const response =
      await supabaseRequest(
        `current_affairs_runs?run_date=eq.${runDate}`,
        {
          method:
            "PATCH",
          headers: {
            Prefer:
              "return=minimal",
          },
          body:
            JSON.stringify({
              status:
                "started",
              articles_found:
                0,
              articles_created:
                0,
              error_message:
                null,
              completed_at:
                null,
              started_at:
                new Date().toISOString(),
            }),
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `Run reset failed: ${await response.text()}`
      );
    }

    return;
  }

  const response =
    await supabaseRequest(
      "current_affairs_runs",
      {
        method:
          "POST",
        headers: {
          Prefer:
            "return=minimal",
        },
        body:
          JSON.stringify({
            run_date:
              runDate,
            status:
              "started",
            articles_found:
              0,
            articles_created:
              0,
          }),
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Run creation failed: ${await response.text()}`
    );
  }
}

async function updateRun(
  runDate,
  values
) {
  try {
    const response =
      await supabaseRequest(
        `current_affairs_runs?run_date=eq.${runDate}`,
        {
          method:
            "PATCH",
          headers: {
            Prefer:
              "return=minimal",
          },
          body:
            JSON.stringify(
              values
            ),
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        "Run update failed:",
        await response.text()
      );
    }
  } catch (error) {
    console.error(
      "Run update error:",
      error.message
    );
  }
}

/* ---------------------------------------
   AI ARTICLE CREATION
--------------------------------------- */

async function generateArticleBatch(
  items
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sambhav-upsc.vercel.app";

  const response =
    await fetch(
      `${baseUrl}/api/current-affairs/ai`,
      {
        method:
          "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            items,
          }),
        cache:
          "no-store",
      }
    );

  const text =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      `AI endpoint returned invalid JSON: ${text.slice(
        0,
        500
      )}`
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      data?.error ||
        `AI batch generation failed with HTTP ${response.status}.`
    );
  }

  if (
    !data?.success
  ) {
    throw new Error(
      data?.error ||
        "AI endpoint reported failure."
    );
  }

  return data;
}

/* ---------------------------------------
   CRON GET
--------------------------------------- */

export async function GET(
  request
) {
  const runDate =
    todayIST();

  try {
    /* -----------------------------------
       CRON AUTH
    ----------------------------------- */

    if (!CRON_SECRET) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "CRON_SECRET environment variable missing.",
        },
        {
          status:
            500,
        }
      );
    }

    const auth =
      request.headers.get(
        "authorization"
      );

    if (
      auth !==
      `Bearer ${CRON_SECRET}`
    ) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "Unauthorized.",
        },
        {
          status:
            401,
        }
      );
    }

    console.log(
      "======================================"
    );

    console.log(
      "SAMBHAV UPSC CURRENT AFFAIRS CRON START:",
      runDate
    );

    console.log(
      "======================================"
    );

    /* -----------------------------------
       START RUN
    ----------------------------------- */

    await createOrResetRun(
      runDate
    );

    /* -----------------------------------
       COLLECT ALL SOURCES
    ----------------------------------- */

    const {
      currentAffairs,
      ethicsExamples,
    } =
      await collectSources();

    console.log(
      "CURRENT AFFAIRS:",
      currentAffairs.length
    );

    console.log(
      "ETHICS:",
      ethicsExamples.length
    );

    /* -----------------------------------
       FINAL SELECTION
    ----------------------------------- */

    const selected =
      [
        ...currentAffairs,
        ...ethicsExamples,
      ];

    console.log(
      "TOTAL FINAL ARTICLES:",
      selected.length
    );

    selected.forEach(
      (item, index) => {
        console.log(
          `SELECTED ${index + 1}:`,
          item.title,
          "| SOURCE:",
          item.source_name,
          "| TYPE:",
          item.report_type,
          "| SCORE:",
          item.score
        );
      }
    );

    await updateRun(
      runDate,
      {
        articles_found:
          selected.length,
      }
    );

    /* -----------------------------------
       NO ARTICLES
    ----------------------------------- */

    if (
      !selected.length
    ) {
      await updateRun(
        runDate,
        {
          status:
            "success",
          articles_found:
            0,
          articles_created:
            0,
          error_message:
            "No UPSC-relevant articles found from configured sources.",
          completed_at:
            new Date().toISOString(),
        }
      );

      return NextResponse.json({
        success:
          true,
        date:
          runDate,
        sources: [
          "PIB",
          "GKToday",
          "The Hindu",
          "The Better India - Ethics",
        ],
        articles_found:
          0,
        articles_created:
          0,
      });
    }

    /* -----------------------------------
       AI PROCESSING
    ----------------------------------- */

    let created =
      0;

    let skipped =
      0;

    let failed =
      0;

    let aiError =
      null;

    console.log(
      "AI PROCESSING START:",
      selected.length,
      "articles"
    );

    try {
      const result =
        await generateArticleBatch(
          selected.map(
            (item) => ({
              title:
                item.title,
              content:
                item.description,
              source_name:
                item.source_name,
              source_url:
                item.source_url,
              date:
                runDate,

              /*
               * IMPORTANT:
               * Better India items are explicitly
               * marked as Ethics examples.
               *
               * The existing AI route already
               * supports report_type.
               */
              report_type:
                item.report_type,

              source_type:
                item.source_type,
            })
          )
        );

      console.log(
        "AI BATCH RESULT:",
        {
          success:
            result?.success,
          received:
            result?.articles_received,
          created:
            result?.articles_created,
          skipped:
            result?.articles_skipped,
          processed:
            result?.articles_processed,
          failed:
            result?.failed_articles,
        }
      );

      created =
        Number(
          result?.articles_created ||
            0
        );

      skipped =
        Number(
          result?.articles_skipped ||
            0
        );

      failed =
        Number(
          result?.failed_articles ||
            result?.failed_batches ||
            0
        );

      /*
       * IMPORTANT FIX:
       *
       * If the articles already exist,
       * AI can return:
       *
       * created = 0
       * skipped > 0
       *
       * This is NOT a failure.
       *
       * It means today's data is already
       * present in Supabase.
       */

      if (
        !result?.success
      ) {
        aiError =
          result?.error ||
          "AI endpoint reported failure.";
      } else if (
        created === 0 &&
        skipped === 0
      ) {
        aiError =
          result?.error ||
          "AI processing completed but no articles were created or skipped.";
      }
    } catch (error) {
      aiError =
        error?.message ||
        "AI batch processing failed.";

      console.error(
        "AI PROCESSING FAILED:",
        aiError
      );
    }

    /* -----------------------------------
       STRICT BUT DUPLICATE-SAFE SUCCESS
    ----------------------------------- */

    if (
      aiError
    ) {
      await updateRun(
        runDate,
        {
          status:
            "failed",
          articles_found:
            selected.length,
          articles_created:
            created,
          error_message:
            aiError,
          completed_at:
            new Date().toISOString(),
        }
      );

      console.error(
        "CURRENT AFFAIRS CRON FAILED:",
        {
          date:
            runDate,
          articles_found:
            selected.length,
          articles_created:
            created,
          articles_skipped:
            skipped,
          error:
            aiError,
        }
      );

      return NextResponse.json(
        {
          success:
            false,
          date:
            runDate,
          articles_found:
            selected.length,
          articles_created:
            created,
          articles_skipped:
            skipped,
          error:
            aiError,
        },
        {
          status:
            503,
        }
      );
    }

    /*
     * SUCCESS CONDITIONS:
     *
     * 1. created > 0
     * 2. created = 0 AND skipped > 0
     *
     * Only:
     * created = 0 AND skipped = 0
     * is considered failure.
     */

    const alreadyUpToDate =
      created === 0 &&
      skipped > 0;

    await updateRun(
      runDate,
      {
        status:
          "success",
        articles_found:
          selected.length,
        articles_created:
          created,
        error_message:
          alreadyUpToDate
            ? "Articles already existed; no duplicate articles were created."
            : null,
        completed_at:
          new Date().toISOString(),
      }
    );

    console.log(
      "======================================"
    );

    console.log(
      "CURRENT AFFAIRS CRON COMPLETE"
    );

    console.log(
      {
        date:
          runDate,
        current_affairs:
          currentAffairs.length,
        ethics_examples:
          ethicsExamples.length,
        articles_found:
          selected.length,
        articles_created:
          created,
        articles_skipped:
          skipped,
        articles_failed:
          failed,
      }
    );

    console.log(
      "======================================"
    );

    return NextResponse.json({
      success:
        true,

      date:
        runDate,

      sources: [
        "PIB",
        "GKToday",
        "The Hindu",
        "The Better India - Ethics",
      ],

      current_affairs_found:
        currentAffairs.length,

      ethics_examples_found:
        ethicsExamples.length,

      articles_found:
        selected.length,

      articles_created:
        created,

      articles_skipped:
        skipped,

      articles_failed:
        failed,

      already_up_to_date:
        alreadyUpToDate,
    });
  } catch (error) {
    console.error(
      "Current Affairs cron failed:",
      error
    );

    await updateRun(
      runDate,
      {
        status:
          "failed",
        error_message:
          error?.message ||
          "Unknown error",
        completed_at:
          new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success:
          false,
        error:
          error?.message ||
          "Current Affairs cron failed.",
      },
      {
        status:
          500,
      }
    );
  }
}
