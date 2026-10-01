import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables missing.");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function todayIST() {
  const now = new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function isRelevant(title, description = "") {
  const text = `${title} ${description}`.toLowerCase();

  const keywords = [
    "india",
    "government",
    "parliament",
    "supreme court",
    "rbi",
    "sebi",
    "niti aayog",
    "ministry",
    "cabinet",
    "economy",
    "gdp",
    "inflation",
    "fiscal",
    "monetary",
    "agriculture",
    "farmer",
    "environment",
    "climate",
    "biodiversity",
    "wildlife",
    "forest",
    "pollution",
    "isro",
    "space",
    "science",
    "technology",
    "ai",
    "defence",
    "security",
    "disaster",
    "earthquake",
    "cyclone",
    "international",
    "united nations",
    "un",
    "world bank",
    "imf",
    "wto",
    "who",
    "unesco",
    "brics",
    "sco",
    "g20",
    "quad",
    "asean",
    "nepal",
    "bangladesh",
    "bhutan",
    "pakistan",
    "china",
    "usa",
    "russia",
    "election",
    "constitution",
    "governance",
    "scheme",
    "policy",
    "report",
    "index",
    "survey",
  ];

  return keywords.some((keyword) =>
    text.includes(keyword)
  );
}

function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractItems(xml) {
  const items = [];

  const blocks = xml.match(
    /<item[\s\S]*?<\/item>/gi
  );

  if (!blocks) return items;

  for (const block of blocks) {
    const title =
      block.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      )?.[1] || "";

    const description =
      block.match(
        /<description[^>]*>([\s\S]*?)<\/description>/i
      )?.[1] || "";

    const link =
      block.match(
        /<link[^>]*>([\s\S]*?)<\/link>/i
      )?.[1] || "";

    const pubDate =
      block.match(
        /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i
      )?.[1] || "";

    items.push({
      title: stripHtml(title),
      description: stripHtml(description),
      url: stripHtml(link),
      published: stripHtml(pubDate),
    });
  }

  return items;
}

/*
  IMPORTANT:
  Source URLs are intentionally kept in environment variables.
  This avoids hard-coding unverified RSS endpoints.

  Add:
  CURRENT_AFFAIRS_RSS_URLS

  Example:
  URL1,URL2,URL3
*/

async function collectSources() {
  const raw =
    process.env.CURRENT_AFFAIRS_RSS_URLS || "";

  const urls = raw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (!urls.length) {
    throw new Error(
      "CURRENT_AFFAIRS_RSS_URLS environment variable missing."
    );
  }

  const allItems = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "SAMBHAV-UPSC-Current-Affairs/1.0",
        },
        cache: "no-store",
      });

      if (!response.ok) continue;

      const xml = await response.text();

      const items = extractItems(xml);

      for (const item of items) {
        if (!item.title) continue;

        if (
          isRelevant(
            item.title,
            item.description
          )
        ) {
          allItems.push({
            ...item,
            source_url: item.url || url,
            source_name: "Source Feed",
          });
        }
      }
    } catch (error) {
      console.error(
        "Source fetch failed:",
        url,
        error.message
      );
    }
  }

  return allItems;
}

function removeDuplicates(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.title
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

async function createRun(runDate) {
  const response = await supabaseRequest(
    "current_affairs_runs",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        run_date: runDate,
        status: "started",
        articles_found: 0,
        articles_created: 0,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Run creation failed: ${text}`
    );
  }

  return response.json();
}

async function updateRun(
  runDate,
  values
) {
  const response = await supabaseRequest(
    `current_affairs_runs?run_date=eq.${runDate}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(values),
    }
  );

  if (!response.ok) {
    console.error(
      "Run update failed:",
      await response.text()
    );
  }
}

async function generateArticle(item) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sambhav-upsc.vercel.app";

  const response = await fetch(
    `${baseUrl}/api/current-affairs/ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: item.title,
        content: item.description,
        source_name: item.source_name,
        source_url: item.source_url,
        date: todayIST(),
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "AI article generation failed."
    );
  }

  return data;
}

export async function GET(request) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRON_SECRET environment variable missing.",
        },
        { status: 500 }
      );
    }

    const auth =
      request.headers.get("authorization");

    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const runDate = todayIST();

    await createRun(runDate);

    const collected =
      await collectSources();

    const unique =
      removeDuplicates(collected);

    const selected = unique.slice(0, 10);

    await updateRun(runDate, {
      articles_found: selected.length,
    });

    let created = 0;

    for (const item of selected) {
      try {
        const result =
          await generateArticle(item);

        if (
          result?.success &&
          !result?.duplicate
        ) {
          created++;
        }
      } catch (error) {
        console.error(
          "Article processing failed:",
          item.title,
          error.message
        );
      }
    }

    await updateRun(runDate, {
      status: "success",
      articles_created: created,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      date: runDate,
      articles_found: selected.length,
      articles_created: created,
    });
  } catch (error) {
    console.error(
      "Current Affairs cron failed:",
      error
    );

    try {
      await updateRun(todayIST(), {
        status: "failed",
        error_message:
          error.message ||
          "Unknown error",
        completed_at:
          new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Current Affairs cron failed.",
      },
      { status: 500 }
    );
  }
}
