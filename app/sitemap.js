
const BASE_URL = "https://sambhavupsc.online";

export default function sitemap() {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date("2026-10-12"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
