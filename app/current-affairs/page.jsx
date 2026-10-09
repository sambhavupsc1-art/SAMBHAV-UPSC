"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const filters = [
  "Today",
  "GS-I",
  "GS-II",
  "GS-III",
  "GS-IV",
  "Prelims",
];

function getSourceKey(item) {
  const source = String(item?.source_name || "").toLowerCase();

  if (source.includes("press information bureau") || source === "pib")
    return "pib";
  if (source.includes("gktoday")) return "gktoday";
  if (source.startsWith("the hindu")) return "the-hindu";
  if (source.includes("the better india")) return "better-india";
  return "other";
}

function isEthicsExample(item) {
  return (
    item?.report_type === "ethics_example" ||
    getSourceKey(item) === "better-india"
  );
}

function getISTDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const part = (type) =>
    parts.find((entry) => entry.type === type)?.value || "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getTodayIST() {
  return getISTDateKey(new Date());
}

/**
 * API versions may expose the article date under different field names.
 * Prefer the editorial/publication date, then fall back to creation time.
 */
function getItemDate(item) {
  return (
    item?.date ||
    item?.published_at ||
    item?.publishedAt ||
    item?.publication_date ||
    item?.created_at ||
    item?.createdAt ||
    item?.updated_at ||
    item?.updatedAt ||
    null
  );
}

function isTodayIST(value) {
  if (!value) return false;

  const raw = String(value).trim();

  // Date-only database values are already calendar dates; do not shift them
  // through UTC and accidentally move them to the previous/next day.
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)) {
    return raw === getTodayIST();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return getISTDateKey(date) === getTodayIST();
}

export default function CurrentAffairsPage() {
  const router = useRouter();

  const [active, setActive] = useState("Today");
  const [activeSource, setActiveSource] = useState("all");
  const [language, setLanguage] = useState("hi");
  const [theme, setTheme] = useState("light");
  const [news, setNews] = useState([]);
  const [important, setImportant] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [importantLoading, setImportantLoading] = useState(false);
  const [error, setError] = useState("");

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationLanguage, setNotificationLanguage] = useState("hi");
  const [notificationTime, setNotificationTime] = useState("10:00");
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const hi = language === "hi";

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sambhav-theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sambhavTheme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem("sambhav-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    loadCurrentAffairs();
    loadImportant();
    loadNotificationSettings();
  }, []);

  function getUserId() {
    if (typeof window === "undefined") return "";

    let id = localStorage.getItem("sambhav_upsc_notification_user");

    if (!id) {
      id =
        "sambhav_" +
        Math.random().toString(36).slice(2) +
        "_" +
        Date.now();

      localStorage.setItem("sambhav_upsc_notification_user", id);
    }

    return id;
  }

  async function loadCurrentAffairs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/current-affairs", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error || "Current Affairs load nahi ho paye."
        );
      }

      setNews(result.data || []);
    } catch (err) {
      setError(
        err.message || "Current Affairs load nahi ho paye."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadImportant() {
    try {
      const response = await fetch(
        "/api/current-affairs?mode=important",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setImportant(result.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadNotificationSettings() {
    try {
      const userId = getUserId();

      if (!userId) return;

      const response = await fetch(
        `/api/current-affairs/notifications?user_id=${encodeURIComponent(
          userId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setNotificationsEnabled(result.data.enabled !== false);

        setNotificationLanguage(
          result.data.language === "en" ? "en" : "hi"
        );

        setNotificationTime(
          result.data.notification_time || "10:00"
        );
      }
    } catch (err) {
      console.error("Notification settings load error:", err);
    }
  }

  async function saveNotificationSettings(overrides = {}) {
    try {
      setNotificationSaving(true);
      setNotificationMessage("");

      const userId = getUserId();

      if (!userId) {
        throw new Error("User identification unavailable.");
      }

      const enabled =
        overrides.enabled !== undefined
          ? overrides.enabled
          : notificationsEnabled;

      const selectedLanguage =
        overrides.language || notificationLanguage;

      const selectedTime =
        overrides.time || notificationTime;

      const response = await fetch(
        "/api/current-affairs/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            enabled,
            language: selectedLanguage,
            notification_time: selectedTime,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error || "Notification settings save nahi hui."
        );
      }

      setNotificationsEnabled(enabled);
      setNotificationLanguage(selectedLanguage);
      setNotificationTime(selectedTime);

      setNotificationMessage(
        hi
          ? "Notification settings save हो गईं।"
          : "Notification settings saved."
      );
    } catch (err) {
      setNotificationMessage(
        err.message || "Notification settings save nahi hui."
      );
    } finally {
      setNotificationSaving(false);
    }
  }

  const importantIds = useMemo(
    () =>
      important.map((item) =>
        Number(item.current_affair_id)
      ),
    [important]
  );

  const sourceFilteredNews = useMemo(() => {
    if (activeSource === "all") return news;

    return news.filter(
      (item) => getSourceKey(item) === activeSource
    );
  }, [news, activeSource]);

  const todayNews = useMemo(() => {
    return news.filter((item) => isTodayIST(getItemDate(item)));
  }, [news]);

  const todaySourceFilteredNews = useMemo(() => {
    if (activeSource === "all") return todayNews;

    return todayNews.filter(
      (item) => getSourceKey(item) === activeSource
    );
  }, [todayNews, activeSource]);

  const filteredNews = useMemo(() => {
    const base = sourceFilteredNews;

    if (active === "Today") {
      return todaySourceFilteredNews.filter(
        (item) => !isEthicsExample(item)
      );
    }

    if (active === "Prelims") {
      return base.filter(
        (item) =>
          !isEthicsExample(item) &&
          (item.prelims ||
            item.prelims_hi ||
            item.prelims_en ||
            item.prelims_mcq ||
            item.prelims_mcq_hi ||
            item.prelims_mcq_en)
      );
    }

    if (active === "Important") {
      return base.filter((item) =>
        importantIds.includes(Number(item.id))
      );
    }

    if (active === "Premium") return base;

    if (active === "GS-IV") {
      return base.filter(
        (item) =>
          item.gs === "GS-IV" ||
          item.paper === "GS-IV" ||
          isEthicsExample(item)
      );
    }

    return base.filter(
      (item) =>
        item.gs === active ||
        item.paper === active
    );
  }, [
    active,
    sourceFilteredNews,
    todaySourceFilteredNews,
    importantIds,
  ]);

  const sourceTabs = [
    { key: "all", label: "ALL" },
    { key: "pib", label: "PIB" },
    { key: "gktoday", label: "GK TODAY" },
    { key: "the-hindu", label: "THE HINDU" },
    {
      key: "better-india",
      label: "BETTER INDIA",
      sub: "GS-IV",
    },
  ];

  function selectSource(key) {
    setActiveSource(key);

    if (key === "better-india") {
      setActive("GS-IV");
    } else if (
      active === "Premium" ||
      active === "Important" ||
      active === "GS-IV"
    ) {
      setActive("Today");
    }
  }

  async function toggleImportant(id) {
    try {
      setImportantLoading(true);

      const already = importantIds.includes(Number(id));

      const response = await fetch(
        already
          ? `/api/current-affairs?mode=important&current_affair_id=${id}`
          : "/api/current-affairs",
        {
          method: already ? "DELETE" : "POST",
          headers: already
            ? {}
            : {
                "Content-Type": "application/json",
              },
          body: already
            ? undefined
            : JSON.stringify({
                current_affair_id: id,
              }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error ||
            (already
              ? "Important remove nahi hua."
              : "Important save nahi hua.")
        );
      }

      await loadImportant();
    } catch (err) {
      alert(
        err.message ||
          "Important update nahi ho paya."
      );
    } finally {
      setImportantLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "";

    // A date-only value should be displayed as supplied, without timezone shift.
    const raw = String(value).trim();
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12));
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(date);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return raw;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  function getLatestDate() {
    if (loading && !news.length) return "Loading...";
    if (!news.length) return formatDate(getTodayIST());

    const datedItems = news
      .map((item) => getItemDate(item))
      .filter(Boolean)
      .map((value) => ({ value, timestamp: new Date(value).getTime() }))
      .filter((entry) => Number.isFinite(entry.timestamp))
      .sort((a, b) => b.timestamp - a.timestamp);

    const latest = datedItems[0]?.value;
    return latest ? formatDate(latest) : formatDate(getTodayIST());
  }

  return (
    <main className="ca-page">
      <button
        type="button"
        className="page-back-button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }}
        aria-label="Go back"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <section className="ca-premium-hero">
        <div className="ca-hero-topbar">
          <div className="ca-hero-brand">
            <span className="ca-hero-brand-kicker">
              SAMBHAV UPSC
            </span>
            <strong>Current Affairs</strong>
            <small>
              UPSC Daily Intelligence • Prelims + Mains
            </small>
          </div>

          <div className="ca-hero-actions">
            <button
              type="button"
              className="ca-theme-toggle"
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
            >
              <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <div className="ca-hero-action-card ca-language-card">
              <span>{hi ? "भाषा" : "Language"}</span>

              <div className="ca-lang-pills">
                <button
                  type="button"
                  className={
                    hi
                      ? "ca-lang-pill active"
                      : "ca-lang-pill"
                  }
                  onClick={() => setLanguage("hi")}
                >
                  हिन्दी
                </button>

                <button
                  type="button"
                  className={
                    !hi
                      ? "ca-lang-pill active"
                      : "ca-lang-pill"
                  }
                  onClick={() => setLanguage("en")}
                >
                  English
                </button>
              </div>
            </div>

            <div className="ca-hero-action-card ca-date-card">
              <span>Latest Update</span>
              <strong>{getLatestDate()}</strong>
              <small>Daily update • 10:00 AM</small>
            </div>

            <button
              type="button"
              className="ca-hero-utility-btn magazine"
              onClick={() =>
                (window.location.href =
                  "/current-affairs/magazine")
              }
            >
              <span>▣</span>
              <b>Monthly Magazine</b>
            </button>

            <button
              type="button"
              className="ca-hero-utility-btn notification"
              onClick={() =>
                setNotificationOpen(!notificationOpen)
              }
            >
              <span>◉</span>
              <b>Notifications</b>
            </button>
          </div>
        </div>

        <div className="ca-hero-divider" />

        <div className="ca-hero-copy">
          <span className="ca-hero-eyebrow">
            SAMBHAV UPSC • DAILY INTELLIGENCE
          </span>

          {!hi && (
            <h2>
              Not just news. The right news for UPSC.
            </h2>
          )}

          <p>
            {hi
              ? "PIB, GKToday, The Hindu और Better India को एक structured UPSC view में पढ़ें — Prelims + Mains + Ethics."
              : "PIB, GKToday, The Hindu and Better India in one structured UPSC view — Prelims + Mains + Ethics."}
          </p>

          <div className="ca-hero-stats">
            <div className="ca-hero-stat">
              <strong>
                {
                  todayNews.filter(
                    (item) => !isEthicsExample(item)
                  ).length
                }
              </strong>
              <span>Daily Updates</span>
            </div>

            <div className="ca-hero-stat">
              <strong>4</strong>
              <span>Core Sources</span>
            </div>

            <div className="ca-hero-stat">
              <strong>GS I–IV</strong>
              <span>UPSC Mapping</span>
            </div>
          </div>
        </div>

        <div className="ca-hero-seal">
          <div className="ca-hero-seal-ring">
            <span>CA</span>
            <small>2026</small>
          </div>

          <div className="ca-hero-seal-line" />

          <span className="ca-hero-date">
            UPDATED • {getLatestDate()}
          </span>
        </div>
      </section>

      {notificationOpen && (
        <section className="notification-panel">
          <div className="notification-title">
            <div>
              <span className="badge">DAILY</span>

              <h2>🔔 Current Affairs Notification</h2>

              <p>
                {hi
                  ? "हर दिन नए UPSC Current Affairs की notification."
                  : "Get daily notifications for new UPSC Current Affairs."}
              </p>
            </div>

            <button
              type="button"
              className={
                notificationsEnabled
                  ? "switch on"
                  : "switch"
              }
              onClick={() => {
                const next = !notificationsEnabled;

                setNotificationsEnabled(next);

                saveNotificationSettings({
                  enabled: next,
                });
              }}
              disabled={notificationSaving}
            >
              <span />
            </button>
          </div>

          <div className="notification-grid">
            <div className="setting-box">
              <label>Notification Language</label>

              <div className="setting-buttons">
                <button
                  type="button"
                  className={
                    notificationLanguage === "hi"
                      ? "setting-btn active"
                      : "setting-btn"
                  }
                  onClick={() =>
                    saveNotificationSettings({
                      language: "hi",
                    })
                  }
                  disabled={notificationSaving}
                >
                  हिन्दी
                </button>

                <button
                  type="button"
                  className={
                    notificationLanguage === "en"
                      ? "setting-btn active"
                      : "setting-btn"
                  }
                  onClick={() =>
                    saveNotificationSettings({
                      language: "en",
                    })
                  }
                  disabled={notificationSaving}
                >
                  English
                </button>
              </div>
            </div>

            <div className="setting-box">
              <label>Daily Notification Time</label>

              <input
                type="time"
                value={notificationTime}
                onChange={(e) =>
                  setNotificationTime(e.target.value)
                }
                disabled={notificationSaving}
              />

              <button
                type="button"
                className="save-time"
                onClick={() =>
                  saveNotificationSettings({
                    time: notificationTime,
                  })
                }
                disabled={notificationSaving}
              >
                {notificationSaving
                  ? "Saving..."
                  : "Save Time"}
              </button>
            </div>
          </div>

          <div className="notification-info">
            <strong>
              {notificationsEnabled
                ? "🟢 Notifications ON"
                : "⚪ Notifications OFF"}
            </strong>

            <span>
              {hi
                ? `Daily ${notificationTime} बजे • ${
                    notificationLanguage === "hi"
                      ? "हिन्दी"
                      : "English"
                  }`
                : `Daily at ${notificationTime} • ${
                    notificationLanguage === "hi"
                      ? "Hindi"
                      : "English"
                  }`}
            </span>
          </div>

          {notificationMessage && (
            <div className="notification-message">
              {notificationMessage}
            </div>
          )}
        </section>
      )}

      <section className="source-nav-wrap">
        <div className="source-nav-head">
          <div>
            <span className="source-nav-eyebrow">
              SOURCES
            </span>
            <strong>Current Affairs Sources</strong>
          </div>

          <span className="source-nav-note">
            {activeSource === "better-india"
              ? "Better India → GS-IV Ethics"
              : "Select a source"}
          </span>
        </div>

        <div className="source-nav">
          {sourceTabs.map((tab) => {
            const count =
              tab.key === "all"
                ? todayNews.filter(
                    (item) => !isEthicsExample(item)
                  ).length
                : todayNews.filter(
                    (item) =>
                      getSourceKey(item) === tab.key
                  ).length;

            return (
              <button
                key={tab.key}
                type="button"
                className={`source-tab ${
                  activeSource === tab.key
                    ? "active"
                    : ""
                } ${
                  tab.key === "better-india"
                    ? "ethics"
                    : ""
                }`}
                onClick={() =>
                  selectSource(tab.key)
                }
              >
                <span className="source-tab-main">
                  {tab.label}
                </span>

                {tab.sub && (
                  <span className="source-tab-sub">
                    {tab.sub}
                  </span>
                )}

                <span className="source-tab-count">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="filter-row">
        {filters.map((filter) => (
          <button
            key={filter}
            className={
              active === filter
                ? "filter active"
                : "filter"
            }
            onClick={() => setActive(filter)}
          >
            {filter}
          </button>
        ))}

        <button
          className={
            active === "Important"
              ? "filter active important"
              : "filter important"
          }
          onClick={() => setActive("Important")}
        >
          ⭐ Important
        </button>

        <button
          className={
            active === "Premium"
              ? "filter active premium"
              : "filter premium"
          }
          onClick={() => setActive("Premium")}
        >
          🔥 Premium Facts
        </button>
      </nav>
            {loading ? (
        <section className="state-card">
          <div className="loader" />

          <h2>
            {hi
              ? "Current Affairs load हो रहे हैं..."
              : "Loading Current Affairs..."}
          </h2>

          <p>
            {hi
              ? "Latest updates fetch किए जा रहे हैं।"
              : "Fetching latest updates."}
          </p>
        </section>
      ) : error ? (
        <section className="state-card error-card">
          <h2>
            {hi
              ? "Current Affairs load नहीं हो पाए"
              : "Current Affairs could not be loaded"}
          </h2>

          <p>{error}</p>
        </section>
      ) : active === "Important" ? (
        <section className="special-section">
          <div className="section-heading">
            <div>
              <span className="badge">SAVED</span>

              <h2>⭐ My Important Current Affairs</h2>
            </div>

            <p>{filteredNews.length} saved</p>
          </div>

          {filteredNews.length === 0 ? (
            <div className="empty">
              {hi ? (
                <>
                  अभी कोई Current Affair Important में नहीं है।
                  <br />
                  किसी news पर ⭐ दबाकर save करें।
                </>
              ) : (
                <>
                  No Current Affairs saved yet.
                  <br />
                  Press ⭐ on any article to save it.
                </>
              )}
            </div>
          ) : (
            <div className="news-list">
              {filteredNews.map((item) => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  important
                  language={language}
                  onImportant={toggleImportant}
                  onOpen={setSelected}
                  expanded={selected?.id === item.id}
                  onClose={() => setSelected(null)}
                  formatDate={formatDate}
                  disabled={importantLoading}
                />
              ))}
            </div>
          )}
        </section>
      ) : active === "Premium" ? (
        <PremiumFacts
          news={sourceFilteredNews}
          language={language}
          hi={hi}
        />
      ) : (
        <section>
          <div className="section-heading">
            <div>
              <span className="badge">
                {getLatestDate().toUpperCase()}
              </span>

              <h2>
                {active === "Today"
                  ? hi
                    ? "आज के UPSC Current Affairs"
                    : "Today's UPSC Current Affairs"
                  : active}
              </h2>
            </div>

            <p>{filteredNews.length} updates</p>
          </div>

          {filteredNews.length === 0 ? (
            <div className="empty">
              {hi
                ? "इस category में अभी कोई Current Affair उपलब्ध नहीं है।"
                : "No Current Affair is available in this category."}
            </div>
          ) : (
            <div className="news-list">
              {filteredNews.map((item) => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  important={importantIds.includes(
                    Number(item.id)
                  )}
                  language={language}
                  onImportant={toggleImportant}
                  onOpen={setSelected}
                  expanded={selected?.id === item.id}
                  onClose={() => setSelected(null)}
                  formatDate={formatDate}
                  disabled={importantLoading}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <style jsx global>{`
        .page-back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          padding: 9px 14px;
          border: 1px solid #e2e7ef;
          border-radius: 11px;
          background: #fff;
          color: #172033;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 5px 16px rgba(15, 23, 42, 0.05);
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.16s ease;
        }

        .page-back-button:hover {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        }

        .page-back-button span:first-child {
          font-size: 18px;
          line-height: 1;
        }

        .ca-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 12% 0%,
              rgba(195, 161, 90, 0.1),
              transparent 24%
            ),
            radial-gradient(
              circle at 88% 6%,
              rgba(15, 23, 42, 0.055),
              transparent 25%
            ),
            linear-gradient(
              180deg,
              #f8f6f1 0%,
              #f3f5f7 48%,
              #eef1f4 100%
            );
          color: #172033;
          padding: 32px 18px 90px;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .ca-header,
        .filter-row,
        .news-list,
        .special-section,
        .section-heading,
        .notification-panel {
          max-width: 1050px;
          margin-left: auto;
          margin-right: auto;
        }

        .ca-premium-hero {
          position: relative;
          overflow: hidden;
          max-width: 1050px;
          margin: 0 auto 16px;
          padding: 27px 29px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          color: #fff;
          border: 1px solid rgba(195, 161, 90, 0.3);
          border-radius: 25px;
          background:
            radial-gradient(
              circle at 88% 10%,
              rgba(195, 161, 90, 0.25),
              transparent 25%
            ),
            radial-gradient(
              circle at 65% 120%,
              rgba(52, 64, 84, 0.55),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #0d1118 0%,
              #151b25 62%,
              #0b0f15 100%
            );
          box-shadow: 0 22px 55px rgba(15, 23, 42, 0.15);
        }

        .ca-premium-hero::before {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          right: 75px;
          bottom: -170px;
          border: 1px solid rgba(226, 199, 125, 0.16);
          border-radius: 50%;
          pointer-events: none;
        }

        .ca-premium-hero::after {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          right: -70px;
          top: -75px;
          border: 1px solid rgba(226, 199, 125, 0.13);
          border-radius: 50%;
          pointer-events: none;
        }

        .ca-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 720px;
        }

        .ca-hero-eyebrow {
          display: inline-flex;
          color: #e2c77d;
          font-size: 9px;
          line-height: 1;
          letter-spacing: 0.18em;
          font-weight: 950;
        }

        .ca-hero-copy h2 {
          margin: 10px 0 8px;
          font-size: clamp(25px, 3.2vw, 38px);
          line-height: 1.06;
          letter-spacing: -1.25px;
          color: #fffdf9;
          max-width: 650px;
        }

        .ca-hero-copy p {
          margin: 0;
          max-width: 650px;
          color: #b9c0ca;
          font-size: 12px;
          line-height: 1.7;
        }

        .ca-hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 19px;
        }

        .ca-hero-stat {
          min-width: 108px;
          padding: 9px 11px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.055);
          backdrop-filter: blur(8px);
        }

        .ca-hero-stat strong {
          display: block;
          color: #fff;
          font-size: 13px;
          font-weight: 950;
        }

        .ca-hero-stat span {
          display: block;
          margin-top: 3px;
          color: #929ba8;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .ca-hero-seal {
          position: relative;
          z-index: 1;
          flex: 0 0 155px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ca-hero-seal-ring {
          width: 112px;
          height: 112px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(226, 199, 125, 0.45);
          outline: 1px solid rgba(226, 199, 125, 0.12);
          outline-offset: 7px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(226, 199, 125, 0.13),
              rgba(255, 255, 255, 0.015) 68%
            );
        }

        .ca-hero-seal-ring span {
          color: #e2c77d;
          font-size: 29px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .ca-hero-seal-ring small {
          margin-top: 7px;
          color: #aeb5bf;
          font-size: 8px;
          letter-spacing: 0.2em;
          font-weight: 900;
        }

        .ca-hero-seal-line {
          width: 46px;
          height: 1px;
          margin: 18px 0 8px;
          background: rgba(226, 199, 125, 0.38);
        }

        .ca-hero-date {
          color: #8e97a4;
          font-size: 7px;
          letter-spacing: 0.13em;
          font-weight: 900;
          text-align: center;
        }

        .source-nav-wrap {
          max-width: 1050px;
          margin: 0 auto 14px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e2e7ef;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045);
          backdrop-filter: blur(10px);
        }

        .source-nav-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 2px 4px 10px;
        }

        .source-nav-eyebrow {
          display: block;
          color: #98a2b3;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.14em;
          margin-bottom: 3px;
        }

        .source-nav-head strong {
          font-size: 13px;
          font-weight: 900;
        }

        .source-nav-note {
          color: #667085;
          font-size: 10px;
          font-weight: 700;
          text-align: right;
        }

        .source-nav {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 7px;
        }

        .source-tab {
          min-width: 0;
          min-height: 46px;
          border: 1px solid #e1e6ee;
          background: #fff;
          color: #344054;
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          font-weight: 900;
        }

        .source-tab.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
          box-shadow: 0 7px 16px rgba(15, 23, 42, 0.14);
        }

        .source-tab.ethics.active {
          background: #7a263a;
          border-color: #7a263a;
        }

        .source-tab-main {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
        }

        .source-tab-sub {
          font-size: 8px;
          padding: 3px 5px;
          border-radius: 999px;
          background: #f2f4f7;
          color: #667085;
        }

        .source-tab.active .source-tab-sub {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }

        .source-tab-count {
          min-width: 22px;
          padding: 3px 5px;
          border-radius: 999px;
          background: #f2f4f7;
          color: #475467;
          font-size: 9px;
          text-align: center;
        }

        .source-tab.active .source-tab-count {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }

        .notification-panel {
          background: #fff;
          border: 1px solid #dfe5ec;
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 18px;
          box-shadow: 0 12px 30px rgba(16, 24, 40, 0.055);
        }

        .notification-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .notification-title h2 {
          margin: 8px 0 5px;
          font-size: 20px;
          font-weight: 900;
        }

        .notification-title p {
          color: #667085;
          margin: 0;
          line-height: 1.55;
        }

        .switch {
          width: 54px;
          height: 30px;
          border: 0;
          border-radius: 999px;
          background: #d0d5dd;
          padding: 3px;
          cursor: pointer;
        }

        .switch span {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s ease;
        }

        .switch.on {
          background: #172033;
        }

        .switch.on span {
          transform: translateX(24px);
        }

        .notification-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-top: 18px;
        }

        .setting-box {
          border: 1px solid #e4e7ec;
          border-radius: 13px;
          padding: 15px;
          background: #fbfcfd;
        }

        .setting-box label {
          display: block;
          font-size: 11px;
          color: #667085;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .setting-buttons {
          display: flex;
          gap: 7px;
        }

        .setting-btn,
        .save-time {
          border: 1px solid #dfe3e8;
          background: #fff;
          color: #344054;
          border-radius: 9px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 800;
        }

        .setting-btn.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
        }

        .setting-box input {
          border: 1px solid #dfe3e8;
          border-radius: 9px;
          padding: 9px;
          font-size: 15px;
          margin-right: 7px;
          background: #fff;
        }

        .save-time {
          background: #172033;
          color: #fff;
          border-color: #172033;
        }

        .notification-info {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 13px;
          padding: 11px 13px;
          border-radius: 10px;
          background: #f6f7f9;
          font-size: 13px;
        }

        .notification-info span {
          color: #667085;
        }

        .notification-message {
          margin-top: 10px;
          font-size: 13px;
          color: #175cd3;
          font-weight: 700;
        }

        .filter-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 2px 18px;
          scrollbar-width: none;
          position: sticky;
          top: 8px;
          z-index: 8;
        }

        .filter-row::-webkit-scrollbar {
          display: none;
        }

        .filter {
          border: 1px solid #dfe5ec;
          background: rgba(255, 255, 255, 0.96);
          color: #344054;
          border-radius: 10px;
          padding: 10px 15px;
          min-height: 42px;
          white-space: nowrap;
          cursor: pointer;
          font-weight: 800;
        }

        .filter.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
        }

        .filter.important.active {
          background: #8a5a00;
          border-color: #8a5a00;
        }

        .filter.premium.active {
          background: #7a263a;
          border-color: #7a263a;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 15px;
          margin-bottom: 14px;
        }

        .section-heading h2 {
          margin: 8px 0 0;
          font-size: 24px;
          font-weight: 900;
        }

        .section-heading p {
          color: #667085;
          margin: 0;
          font-size: 13px;
          font-weight: 700;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 900;
          padding: 6px 9px;
          border-radius: 999px;
          background: #eef2f6;
          color: #475467;
        }

        .news-list {
          display: grid;
          gap: 15px;
        }

        .news-card {
          background: #fff;
          border: 1px solid #e1e6ee;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045);
        }

        .topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .card-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .source-chip {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 4px 7px;
          border-radius: 7px;
          background: #f2f4f7;
          color: #475467;
          font-size: 8px;
          font-weight: 950;
        }

        .source-chip.pib {
          background: #eef4ff;
          color: #175cd3;
        }

        .source-chip.gktoday {
          background: #ecfdf3;
          color: #027a48;
        }

        .source-chip.the-hindu {
          background: #fff1f3;
          color: #b42318;
        }

        .source-chip.better-india {
          background: #fff7e6;
          color: #9a6700;
        }

        .meta,
        .source {
          color: #667085;
          font-size: 12px;
          font-weight: 600;
        }

        .news-card h3 {
          margin: 12px 0 8px;
          font-size: clamp(20px, 2.3vw, 25px);
          line-height: 1.3;
          font-weight: 900;
          color: #172033;
        }

        .summary {
          color: #475467;
          font-size: 13.5px;
          line-height: 1.78;
          margin: 0 0 16px;
          white-space: pre-wrap;
        }

        .card-actions {
          display: flex;
          gap: 9px;
          align-items: center;
          flex-wrap: wrap;
          padding-top: 13px;
          border-top: 1px solid #edf0f3;
        }

        .read-button,
        .important-button {
          border: 0;
          border-radius: 11px;
          padding: 11px 14px;
          min-height: 44px;
          cursor: pointer;
          font-weight: 850;
        }

        .read-button {
          background: #172033;
          color: #fff;
        }

        .important-button {
          background: #f3f4f6;
          color: #344054;
        }

        .important-button.saved {
          background: #fff3d6;
          color: #8a5a00;
          border: 1px solid #f0d39b;
        }

        .empty,
        .state-card {
          background: #fff;
          border: 1px dashed #cbd5e1;
          border-radius: 18px;
          padding: 38px 20px;
          text-align: center;
          color: #667085;
          margin: 15px auto 0;
          line-height: 1.7;
          max-width: 1050px;
        }

        .state-card {
          border-style: solid;
        }

        .state-card h2 {
          color: #172033;
          margin: 12px 0 5px;
          font-weight: 900;
        }

        .error-card {
          border-color: #f04438;
        }

        .loader {
          width: 32px;
          height: 32px;
          margin: auto;
          border: 4px solid #e4e7ec;
          border-top-color: #172033;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .premium-facts-wrap {
          max-width: 1120px;
          margin: 0 auto;
        }

        .premium-main-heading {
          background: linear-gradient(135deg, #fff8f5, #fffdf9);
          border: 1px solid #eaded8;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 16px;
        }

        .premium-main-badge {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f8e8e8;
          color: #7f1d1d;
          font-size: 10px;
          font-weight: 950;
        }

        .premium-main-heading h2 {
          margin: 10px 0 5px;
          color: #172033;
          font-size: 30px;
          font-weight: 950;
        }

        .premium-main-heading p {
          margin: 0;
          color: #667085;
          line-height: 1.55;
        }

        .premium-tabs {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .premium-tab {
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          padding: 14px 16px;
          border: 1px solid #dfe4eb;
          border-radius: 15px;
          background: #fff;
          color: #172033;
          cursor: pointer;
        }

        .premium-tab.active {
          color: #fff;
          background: #172033;
          border-color: #172033;
        }

        .premium-tab-number {
          font-size: 11px;
          font-weight: 950;
        }

        .premium-tab-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .premium-tab-copy strong {
          font-size: 13px;
        }

        .premium-tab-copy small {
          color: #667085;
          font-size: 11px;
        }

        .premium-tab.active .premium-tab-copy small {
          color: rgba(255, 255, 255, 0.72);
        }

        .premium-tab b {
          min-width: 30px;
          text-align: center;
          padding: 5px 7px;
          border-radius: 999px;
          background: #f2f4f7;
          color: #344054;
          font-size: 11px;
        }

        .premium-tab.active b {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }

        .premium-active-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin: 6px 0 14px;
        }

        .premium-active-label {
          color: #8b1e2d;
          font-size: 10px;
          font-weight: 950;
        }

        .premium-active-heading h3 {
          margin: 5px 0 4px;
          color: #172033;
          font-size: 20px;
          font-weight: 900;
        }

        .premium-active-heading p {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .premium-active-heading > strong {
          padding: 8px 10px;
          border-radius: 10px;
          background: #f5f6f8;
          color: #344054;
          font-size: 12px;
        }

        .premium-clean-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .premium-clean-card {
          background: #fff;
          border: 1px solid #e1e6ee;
          border-radius: 17px;
          padding: 18px;
        }

        .premium-clean-meta,
        .premium-clean-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .premium-type-pill,
        .premium-gs-pill {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 900;
        }

        .premium-type-pill {
          background: #f8e8e8;
          color: #8b1e2d;
        }

        .premium-gs-pill {
          background: #f2f4f7;
          color: #475467;
        }

        .premium-clean-card h3 {
          margin: 14px 0 9px;
          color: #172033;
          font-size: 16px;
          line-height: 1.4;
          font-weight: 900;
        }

        .premium-clean-fact {
          min-height: 68px;
          margin: 0;
          color: #475467;
          font-size: 13.5px;
          line-height: 1.65;
        }

        .premium-clean-footer {
          margin-top: 15px;
          padding-top: 11px;
          border-top: 1px solid #edf0f3;
          color: #98a2b3;
          font-size: 10px;
        }

        .premium-clean-footer span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 48%;
        }

        .premium-clean-empty {
          padding: 32px 18px;
          border: 1px dashed #d9dee7;
          border-radius: 16px;
          background: #fafbfc;
          color: #667085;
          text-align: center;
        }

        .inline-analysis {
          margin-top: 17px;
          padding-top: 17px;
          border-top: 1px solid #e3e8ef;
        }

        .inline-analysis-card {
          width: 100%;
          background: #fbfcfe;
          border: 1px solid #d9e0e9;
          border-radius: 16px;
          padding: 22px;
        }

        .inline-analysis-card .close {
          float: right;
          width: 36px;
          height: 36px;
          border: 1px solid #dfe5ec;
          border-radius: 10px;
          background: #fff;
          color: #475467;
          font-size: 22px;
          cursor: pointer;
        }

        .modal h2 {
          margin: 12px 40px 6px 0;
          font-size: clamp(23px, 4vw, 30px);
          line-height: 1.3;
          font-weight: 950;
        }

        .modal h3 {
          margin: 24px 0 9px;
          padding-bottom: 6px;
          font-size: 16px;
          font-weight: 900;
          color: #172033;
          border-bottom: 1px solid #edf0f3;
        }

        .modal p {
          line-height: 1.7;
          color: #475467;
          white-space: pre-wrap;
        }

        .content-block {
          white-space: pre-wrap;
          color: #475467;
          line-height: 1.7;
          font-size: 14px;
        }

        .source-link {
          display: inline-block;
          margin-top: 8px;
          color: #175cd3;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .source-link:hover {
          text-decoration: underline;
        }

        /* THE HINDU ACTUAL NEWSPAPER CUT */

        .the-hindu-headline-cut {
          margin: 18px 0 24px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid #dfe3e8;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
        }

        .the-hindu-headline-label {
          margin-bottom: 10px;
          padding-bottom: 7px;
          border-bottom: 1px solid #222;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #111;
        }

        .the-hindu-headline-image {
          display: block;
          width: 100%;
          max-width: 100%;
          height: auto;
          margin: 0 auto;
          object-fit: contain;
          background: #fff;
        }

        .premium-box {
          margin: 22px 0;
          padding: 17px;
          border-radius: 16px;
          background: linear-gradient(135deg, #fff9eb, #fff4d6);
          border: 1px solid #f0d39b;
        }

        .premium-box p {
          margin-bottom: 0;
        }

        .modal-important {
          margin-top: 12px;
        }

        @media (max-width: 1024px) {
          .ca-page {
            padding: 22px 16px 70px;
          }

          .ca-header {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
            padding: 22px;
          }

          .header-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            width: 100%;
          }

          .source-nav {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .fact-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .premium-clean-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .ca-premium-hero {
            grid-template-columns: 1fr;
          }

          .ca-hero-seal {
            display: none;
          }

          .ca-hero-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .ca-hero-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 800px) {
          .ca-premium-hero {
            padding: 22px;
          }
        }

        @media (max-width: 600px) {
          .page-back-button {
            width: 100%;
            justify-content: center;
            min-height: 42px;
            margin-bottom: 10px;
          }

          .ca-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            padding: 12px 10px 48px;
            overflow-x: hidden;
          }

          .ca-premium-hero {
            display: block;
            padding: 15px;
            border-radius: 20px;
          }

          .ca-hero-topbar {
            display: block;
          }

          .ca-hero-brand {
            margin-bottom: 12px;
          }

          .ca-hero-brand strong {
            font-size: 20px;
          }

          .ca-hero-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
          }

          .ca-hero-action-card,
          .ca-hero-utility-btn {
            width: 100%;
            min-width: 0;
          }

          .ca-language-card,
          .ca-date-card {
            min-width: 0;
          }

          .ca-hero-utility-btn {
            min-height: 46px;
          }

          .ca-hero-divider {
            margin: 13px 0 3px;
          }

          .ca-hero-copy h2 {
            font-size: 25px;
            letter-spacing: -1px;
          }

          .ca-hero-copy p {
            font-size: 11.5px;
          }

          .ca-hero-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .ca-hero-stat {
            min-width: 0;
            padding: 8px 7px;
          }

          .ca-hero-stat strong {
            font-size: 11px;
          }

          .ca-hero-stat span {
            font-size: 6.5px;
          }

          .source-nav-wrap {
            border-radius: 17px;
            width: 100%;
            box-sizing: border-box;
            padding: 10px;
          }

          .source-nav-head {
            align-items: flex-start;
          }

          .source-nav-note {
            font-size: 9px;
            max-width: 45%;
          }

          .source-nav {
            display: flex;
            overflow-x: auto;
            gap: 6px;
            scrollbar-width: none;
          }

          .source-nav::-webkit-scrollbar {
            display: none;
          }

          .source-tab {
            flex: 0 0 auto;
            min-height: 43px;
            padding: 7px 10px;
            border-radius: 12px;
          }

          .notification-panel {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 15px;
            border-radius: 16px;
          }

          .notification-grid {
            grid-template-columns: 1fr;
          }

          .notification-info {
            display: block;
            font-size: 12px;
          }

          .notification-info span {
            display: block;
            margin-top: 5px;
          }

          .setting-box input {
            width: 100%;
            box-sizing: border-box;
            margin: 0 0 8px;
          }

          .save-time {
            width: 100%;
          }

          .filter-row {
            width: 100%;
            max-width: 100%;
            display: flex;
            overflow-x: auto;
            gap: 7px;
            padding: 3px 1px 13px;
            scrollbar-width: none;
          }

          .filter-row::-webkit-scrollbar {
            display: none;
          }

          .filter {
            flex: 0 0 auto;
            min-height: 40px;
            padding: 9px 13px;
            font-size: 12px;
          }

          .section-heading {
            width: 100%;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
            margin-bottom: 11px;
          }

          .section-heading h2 {
            font-size: 20px;
          }

          .news-list {
            width: 100%;
            max-width: 100%;
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .news-card {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            padding: 15px;
            border-radius: 16px;
          }

          .topline {
            align-items: flex-start;
          }

          .meta {
            font-size: 10px;
            text-align: right;
          }

          .news-card h3 {
            font-size: 18px;
            line-height: 1.38;
            overflow-wrap: anywhere;
          }

          .summary {
            font-size: 12.5px;
            line-height: 1.7;
          }

          .card-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
            align-items: stretch;
          }

          .read-button,
          .important-button {
            width: 100%;
            min-height: 42px;
            font-size: 12px;
          }

          .source {
            grid-column: 1 / -1;
            width: 100%;
            font-size: 10px;
            overflow-wrap: anywhere;
          }

          .card-badges {
            max-width: 70%;
          }

          .source-chip {
            font-size: 7px;
          }

          .inline-analysis {
            margin-top: 13px;
            padding-top: 13px;
          }

          .inline-analysis-card {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 15px;
            border-radius: 14px;
          }

          .modal h2 {
            font-size: 21px;
            line-height: 1.35;
          }

          .modal p,
          .content-block {
            font-size: 13px;
            line-height: 1.7;
          }

          .the-hindu-headline-cut {
            margin: 15px 0 20px;
            padding: 10px;
            border-radius: 12px;
          }

          .the-hindu-headline-label {
            font-size: 9px;
            margin-bottom: 8px;
            padding-bottom: 6px;
          }

          .premium-facts-wrap {
            width: 100%;
            max-width: 100%;
          }

          .premium-main-heading {
            padding: 17px;
            border-radius: 17px;
          }

          .premium-tabs {
            grid-template-columns: 1fr;
          }

          .premium-active-heading {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .premium-clean-grid {
            grid-template-columns: 1fr;
          }

          .empty,
          .state-card {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 30px 15px;
          }
        }

        @media (max-width: 380px) {
          .ca-page {
            padding-left: 7px;
            padding-right: 7px;
          }

          .ca-header {
            padding: 14px;
          }

          .source-nav-head {
            display: block;
          }

          .source-nav-note {
            display: block;
            max-width: none;
            text-align: left;
            margin-top: 4px;
          }

          .filter {
            padding: 8px 11px;
            font-size: 11px;
          }

          .news-card {
            padding: 13px;
          }

          .news-card h3 {
            font-size: 17px;
          }

          .card-actions {
            grid-template-columns: 1fr;
          }

          .source {
            grid-column: auto;
          }
        }

        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        button,
        input,
        select,
        textarea {
          max-width: 100%;
        }

        img,
        video,
        iframe {
          max-width: 100%;
          height: auto;
        }


        /* SAMBHAV UPSC shared premium theme: warm ivory, charcoal and muted gold */
        .ca-page {
          --ca-page: #f5f2eb;
          --ca-surface: #fffdf9;
          --ca-text: #101010;
          --ca-muted: #77736b;
          --ca-border: rgba(16,16,16,.09);
          --ca-soft: #f0ece3;
          --ca-gold: #dfc477;
          background: var(--ca-page) !important;
          color: var(--ca-text) !important;
          transition: background .2s ease, color .2s ease;
        }
        .ca-theme-toggle {
          display:inline-flex; align-items:center; justify-content:center; gap:7px;
          min-height:40px; padding:0 13px; border-radius:13px;
          border:1px solid var(--ca-border); background:var(--ca-surface);
          color:var(--ca-text); font-size:12px; font-weight:800; cursor:pointer;
          box-shadow:0 4px 14px rgba(16,16,16,.06); transition:transform .16s ease;
        }
        .ca-theme-toggle:hover { transform:translateY(-1px); }
        .ca-theme-toggle span:first-child { font-size:16px; color:#b89445; }
        .ca-page .page-back-button { background:var(--ca-surface); color:var(--ca-text); border-color:var(--ca-border); }
        .ca-page .section-heading,
        .ca-page .notification-panel,
        .ca-page .news-card,
        .ca-page .article-card,
        .ca-page .special-card,
        .ca-page .special-section,
        .ca-page .filter-chip,
        .ca-page .source-tab,
        .ca-page .ca-hero-action-card,
        .ca-page .ca-date-card,
        .ca-page .ca-language-card,
        .ca-page .important-card,
        .ca-page .empty-state,
        .ca-page .error-card {
          color:var(--ca-text);
        }
        .ca-page button { transition: background-color .16s ease, border-color .16s ease, color .16s ease, transform .16s ease; }
        .ca-page .ca-premium-hero { box-shadow:0 16px 34px rgba(16,16,16,.12); }
        .ca-page .news-list > *, .ca-page .special-section, .ca-page .notification-panel { border-color:var(--ca-border); }
        html[data-sambhav-theme="dark"] .ca-page {
          --ca-page:#0b0b0b; --ca-surface:#151515; --ca-text:#f5f2eb;
          --ca-muted:#aaa59a; --ca-border:rgba(255,255,255,.10);
          --ca-soft:#202020; --ca-gold:#dfc477;
          background:#0b0b0b !important; color:#f5f2eb !important;
        }
        html[data-sambhav-theme="dark"] .ca-page .page-back-button,
        html[data-sambhav-theme="dark"] .ca-page .ca-hero-action-card,
        html[data-sambhav-theme="dark"] .ca-page .ca-date-card,
        html[data-sambhav-theme="dark"] .ca-page .ca-language-card,
        html[data-sambhav-theme="dark"] .ca-page .news-card,
        html[data-sambhav-theme="dark"] .ca-page .article-card,
        html[data-sambhav-theme="dark"] .ca-page .special-card,
        html[data-sambhav-theme="dark"] .ca-page .special-section,
        html[data-sambhav-theme="dark"] .ca-page .notification-panel,
        html[data-sambhav-theme="dark"] .ca-page .section-heading,
        html[data-sambhav-theme="dark"] .ca-page .empty-state,
        html[data-sambhav-theme="dark"] .ca-page .error-card,
        html[data-sambhav-theme="dark"] .ca-page input,
        html[data-sambhav-theme="dark"] .ca-page select,
        html[data-sambhav-theme="dark"] .ca-page textarea {
          background:#151515 !important; color:#f5f2eb !important; border-color:rgba(255,255,255,.11) !important;
        }
        html[data-sambhav-theme="dark"] .ca-page p,
        html[data-sambhav-theme="dark"] .ca-page small,
        html[data-sambhav-theme="dark"] .ca-page label,
        html[data-sambhav-theme="dark"] .ca-page .muted,
        html[data-sambhav-theme="dark"] .ca-page .section-subtitle { color:#aaa59a; }
        html[data-sambhav-theme="dark"] .ca-page .filter-row button,
        html[data-sambhav-theme="dark"] .ca-page .source-row button,
        html[data-sambhav-theme="dark"] .ca-page .ca-theme-toggle {
          background:#151515; color:#f5f2eb; border-color:rgba(255,255,255,.12);
        }
        html[data-sambhav-theme="dark"] .ca-page .ca-theme-toggle { background:#202020; }
        html[data-sambhav-theme="dark"] .ca-page .premium-box { background:#292316; color:#f5f2eb; border-color:rgba(223,196,119,.25); }
        html[data-sambhav-theme="dark"] .ca-page .content-block { background:#111; color:#f5f2eb; border-color:rgba(255,255,255,.09); }
        /* Premium readability pass: consistent controls and analysis surfaces */
        .ca-page .ca-premium-hero {
          background: radial-gradient(circle at 90% 0%, rgba(223,196,119,.12), transparent 32%),
                      linear-gradient(135deg, #171717 0%, #202538 100%) !important;
          color: #f8f5ed !important;
          border: 1px solid rgba(223,196,119,.18);
        }
        .ca-page .ca-hero-brand strong { color:#fffdf7 !important; }
        .ca-page .ca-hero-brand small,
        .ca-page .ca-hero-copy p,
        .ca-page .ca-hero-copy .muted { color:#d0d2dc !important; }
        .ca-page .ca-hero-action-card {
          border:1px solid rgba(255,255,255,.13) !important;
          border-radius:15px !important;
          background:rgba(255,255,255,.07) !important;
          color:#f8f5ed !important;
          box-shadow:0 8px 22px rgba(0,0,0,.12);
        }
        .ca-page .ca-theme-toggle,
        .ca-page .ca-hero-utility-btn,
        .ca-page .ca-lang-pill {
          display:inline-flex; align-items:center; justify-content:center; gap:7px;
          min-height:40px; padding:9px 14px; border-radius:12px;
          border:1px solid rgba(223,196,119,.3); font-weight:800;
          letter-spacing:.01em; cursor:pointer;
        }
        .ca-page .ca-lang-pills { display:flex; gap:7px; margin-top:8px; }
        .ca-page .ca-lang-pill { background:rgba(255,255,255,.08); color:#e8e6df; }
        .ca-page .ca-lang-pill.active { background:#dfc477 !important; color:#171717 !important; border-color:#dfc477 !important; box-shadow:0 4px 12px rgba(223,196,119,.18); }
        .ca-page .ca-hero-utility-btn { background:rgba(255,255,255,.08); color:#f8f5ed; }
        .ca-page .ca-hero-utility-btn:hover,
        .ca-page .ca-lang-pill:hover { transform:translateY(-1px); }
        .ca-page .source-row,
        .ca-page .filter-row { gap:9px; }
        .ca-page .source-row button,
        .ca-page .filter-row button,
        .ca-page .filter-chip,
        .ca-page .source-tab {
          border-radius:13px !important; font-weight:800 !important;
          min-height:42px; transition:all .18s ease;
        }
        .ca-page .content-block,
        .ca-page .inline-analysis-card,
        .ca-page .analysis-content,
        .ca-page .analysis-body,
        .ca-page .article-analysis,
        .ca-page .analysis-section {
          background:var(--ca-surface) !important; color:var(--ca-text) !important;
          border:1px solid var(--ca-border) !important; border-radius:16px;
        }
        .ca-page .inline-analysis-card { padding:clamp(18px, 3vw, 30px) !important; }
        .ca-page .inline-analysis-card h2,
        .ca-page .inline-analysis-card h3,
        .ca-page .content-block h2,
        .ca-page .content-block h3 { color:var(--ca-text) !important; font-weight:850; line-height:1.35; }
        .ca-page .inline-analysis-card p,
        .ca-page .content-block,
        .ca-page .analysis-content { color:var(--ca-text) !important; line-height:1.8; }
        .ca-page .inline-analysis-card h3 { margin-top:22px; padding-bottom:8px; border-bottom:1px solid var(--ca-border); }
        .ca-page .source-link { color:#315b9d !important; font-weight:800; }
        html[data-sambhav-theme="dark"] .ca-page .content-block,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card,
        html[data-sambhav-theme="dark"] .ca-page .analysis-content,
        html[data-sambhav-theme="dark"] .ca-page .analysis-body,
        html[data-sambhav-theme="dark"] .ca-page .article-analysis,
        html[data-sambhav-theme="dark"] .ca-page .analysis-section,
        html[data-sambhav-theme="dark"] .ca-page .ca-language-card,
        html[data-sambhav-theme="dark"] .ca-page .ca-date-card {
          background:#171a22 !important; color:#f2f4f8 !important;
          border-color:rgba(255,255,255,.12) !important;
          box-shadow:0 10px 28px rgba(0,0,0,.22);
        }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card h2,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card h3,
        html[data-sambhav-theme="dark"] .ca-page .content-block h2,
        html[data-sambhav-theme="dark"] .ca-page .content-block h3,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card p,
        html[data-sambhav-theme="dark"] .ca-page .content-block,
        html[data-sambhav-theme="dark"] .ca-page .analysis-content { color:#f2f4f8 !important; }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card p,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card li { color:#d5d9e2 !important; }
        html[data-sambhav-theme="dark"] .ca-page .source-link { color:#9fc1ff !important; }
        html[data-sambhav-theme="dark"] .ca-page .news-card h3,
        html[data-sambhav-theme="dark"] .ca-page .article-card h3 { color:#e7c96f !important; }
        html[data-sambhav-theme="dark"] .ca-page .news-card .summary,
        html[data-sambhav-theme="dark"] .ca-page .article-card p { color:#d3d7e0 !important; }
        html[data-sambhav-theme="dark"] .ca-page .read-button { background:#244b8d !important; color:#fff !important; border-color:#355da0 !important; }
        html[data-sambhav-theme="dark"] .ca-page .important-button,
        html[data-sambhav-theme="dark"] .ca-page .important-btn { background:#242735 !important; color:#f5f2eb !important; border-color:rgba(223,196,119,.35) !important; }
        /* Professional article-analysis reading layout */
        .ca-page .inline-analysis { margin-top:22px; padding-top:20px; border-top:1px solid var(--ca-border); }
        .ca-page .inline-analysis-card { position:relative; overflow:hidden; background:var(--ca-surface) !important; color:var(--ca-text) !important; box-shadow:0 16px 40px rgba(16,24,40,.08); }
        .ca-page .inline-analysis-card::before { content:"UPSC ANALYSIS"; display:block; width:max-content; max-width:100%; margin:0 0 14px; padding:6px 10px; border:1px solid rgba(184,148,69,.32); border-radius:999px; background:rgba(184,148,69,.10); color:#98752c; font-size:10px; font-weight:900; letter-spacing:1.2px; }
        .ca-page .inline-analysis-card .close { display:inline-flex; align-items:center; justify-content:center; float:right; background:var(--ca-soft) !important; color:var(--ca-text) !important; border-color:var(--ca-border) !important; }
        .ca-page .inline-analysis-card h2 { clear:both; margin:12px 0 16px !important; padding:0 0 15px; border-bottom:1px solid var(--ca-border); font-size:clamp(23px,3.2vw,32px) !important; letter-spacing:-.6px; }
        .ca-page .inline-analysis-card h3 { margin:24px 0 10px !important; padding:11px 13px !important; border:0 !important; border-left:3px solid #b89445 !important; border-radius:0 10px 10px 0; background:var(--ca-soft) !important; color:var(--ca-text) !important; font-size:16px !important; font-weight:850 !important; }
        .ca-page .inline-analysis-card p, .ca-page .inline-analysis-card .content-block { margin:9px 0 13px; font-size:14px; line-height:1.85 !important; color:var(--ca-text) !important; overflow-wrap:anywhere; }
        .ca-page .inline-analysis-card ul, .ca-page .inline-analysis-card ol { margin:10px 0 16px; padding-left:23px; line-height:1.8; }
        .ca-page .inline-analysis-card li { margin:5px 0; padding-left:3px; color:var(--ca-text); }
        .ca-page .inline-analysis-card strong, .ca-page .inline-analysis-card b { color:var(--ca-text); font-weight:850; }
        .ca-page .inline-analysis-card blockquote { margin:16px 0; padding:13px 16px; border-left:3px solid #b89445; border-radius:0 12px 12px 0; background:var(--ca-soft); color:var(--ca-text); }
        .ca-page .inline-analysis-card table { display:block; width:100%; max-width:100%; overflow-x:auto; border-collapse:separate; border-spacing:0; border:1px solid var(--ca-border); border-radius:12px; }
        .ca-page .inline-analysis-card th { padding:11px 12px; background:var(--ca-soft); color:var(--ca-text); text-align:left; font-size:12px; }
        .ca-page .inline-analysis-card td { padding:10px 12px; border-top:1px solid var(--ca-border); color:var(--ca-text); font-size:13px; vertical-align:top; }
        .ca-page .inline-analysis-card hr { border:0; border-top:1px solid var(--ca-border); margin:22px 0; }
        .ca-page .inline-analysis-card .source-link { display:inline-flex; align-items:center; gap:6px; margin:10px 0; padding:9px 12px; border:1px solid var(--ca-border); border-radius:10px; background:var(--ca-soft); color:#315b9d !important; }
        .ca-page .inline-analysis-card .premium-box { color:var(--ca-text) !important; }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card { background:#171a22 !important; color:#f2f4f8 !important; border-color:rgba(255,255,255,.12) !important; box-shadow:0 18px 44px rgba(0,0,0,.28); }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card h2,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card h3,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card p,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card li,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card strong,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card b,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card td,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card th,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card blockquote { color:#edf0f6 !important; }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card h3,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card blockquote,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card th,
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card .source-link { background:#222735 !important; }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card .source-link { color:#a9c9ff !important; }
        html[data-sambhav-theme="dark"] .ca-page .inline-analysis-card .close { background:#252a36 !important; color:#f2f4f8 !important; }
        /* Fix white source/filter panel in dark mode */
        html[data-sambhav-theme="dark"] .ca-page .source-nav-wrap,
        html[data-sambhav-theme="dark"] .ca-page .notification-panel,
        html[data-sambhav-theme="dark"] .ca-page .source-panel,
        html[data-sambhav-theme="dark"] .ca-page .filters-panel,
        html[data-sambhav-theme="dark"] .ca-page .filter-panel,
        html[data-sambhav-theme="dark"] .ca-page .monthly-panel,
        html[data-sambhav-theme="dark"] .ca-page .stats-card,
        html[data-sambhav-theme="dark"] .ca-page .source-tabs-wrap {
          background:#171a24 !important;
          color:#f1f4fa !important;
          border-color:rgba(255,255,255,.13) !important;
          box-shadow:0 12px 32px rgba(0,0,0,.25) !important;
        }
        html[data-sambhav-theme="dark"] .ca-page .source-nav-wrap * { color:inherit; }
        html[data-sambhav-theme="dark"] .ca-page .source-nav-eyebrow,
        html[data-sambhav-theme="dark"] .ca-page .source-nav-note { color:#aeb8c9 !important; }
        html[data-sambhav-theme="dark"] .ca-page .source-tab {
          background:#202533 !important;
          color:#e6eaf2 !important;
          border-color:#353d4f !important;
        }
        html[data-sambhav-theme="dark"] .ca-page .source-tab.active {
          background:#d8b965 !important;
          color:#171923 !important;
          border-color:#d8b965 !important;
        }
        html[data-sambhav-theme="dark"] .ca-page .source-tab.active .source-tab-sub,
        html[data-sambhav-theme="dark"] .ca-page .source-tab.active .source-tab-count {
          background:rgba(23,25,35,.12) !important;
          color:#171923 !important;
        }
        html[data-sambhav-theme="dark"] .ca-page .source-tab-sub,
        html[data-sambhav-theme="dark"] .ca-page .source-tab-count {
          background:#303748 !important;
          color:#d9dfeb !important;
        }
        html[data-sambhav-theme="dark"] .ca-page .source-nav-wrap button,
        html[data-sambhav-theme="dark"] .ca-page .source-nav-wrap [role="button"] {
          color:#e6eaf2;
        }
        html[data-sambhav-theme="dark"] .ca-page .source-nav-wrap [style*="background: rgb(255, 255, 255)"],
        html[data-sambhav-theme="dark"] .ca-page .source-nav-wrap [style*="background-color: rgb(255, 255, 255)"] {
          background:#171a24 !important;
          color:#f1f4fa !important;
        }
        @media (max-width:640px) {
          .ca-theme-toggle { min-height:38px; padding:0 10px; }
          .ca-page .ca-hero-actions { gap:8px; }
          .ca-page .ca-lang-pills { gap:5px; }
          .ca-page .ca-lang-pill { min-height:36px; padding:7px 10px; }
          .ca-page { padding-left:12px !important; padding-right:12px !important; }
        }
      `}</style>
    </main>
  );
}

function ArticleCard({
  item,
  important,
  language,
  onImportant,
  onOpen,
  expanded,
  onClose,
  formatDate,
  disabled,
}) {
  const hi = language === "hi";

  const title =
    (hi ? item.title_hi : item.title_en) ||
    item.title ||
    (hi ? item.title_en : item.title_hi) ||
    "Current Affair";

  const summary =
    (hi
      ? item.why_in_news_hi
      : item.why_in_news_en) ||
    item.why_in_news ||
    (hi
      ? item.background_hi
      : item.background_en) ||
    item.background ||
    item.key_facts ||
    "";

  return (
    <article className="news-card">
      <div className="topline">
        <div className="card-badges">
          <span className="badge">
            {isEthicsExample(item)
              ? "GS-IV • ETHICS"
              : item.gs || item.paper || "UPSC"}
          </span>

          <span
            className={`source-chip ${getSourceKey(item)}`}
          >
            {getSourceKey(item) === "pib"
              ? "PIB"
              : getSourceKey(item) === "gktoday"
              ? "GK TODAY"
              : getSourceKey(item) === "the-hindu"
              ? "THE HINDU"
              : getSourceKey(item) ===
                "better-india"
              ? "BETTER INDIA"
              : "SOURCE"}
          </span>
        </div>

        <span className="meta">
          {item.subject || "UPSC Current Affairs"} •{" "}
          {formatDate(getItemDate(item))}
        </span>
      </div>

      <h3>{title}</h3>

      <p className="summary">{summary}</p>

      <div className="card-actions">
        <button
          className="read-button"
          onClick={() =>
            expanded ? onClose() : onOpen(item)
          }
        >
          {expanded
            ? hi
              ? "Analysis बंद करें"
              : "Close Analysis"
            : hi
            ? "पूरा Analysis पढ़ें"
            : "Read Full Analysis"}
        </button>

        <button
          className={
            important
              ? "important-button saved"
              : "important-button"
          }
          disabled={disabled}
          onClick={() => onImportant(item.id)}
        >
          {important ? "★ Saved" : "⭐ Important"}
        </button>

        <span className="source">
          Source: {item.source_name || "Not specified"}
        </span>
      </div>

      {expanded && (
        <ArticleModal
          item={item}
          language={language}
          important={important}
          importantLoading={disabled}
          onImportant={onImportant}
          onClose={onClose}
          inline
        />
      )}
    </article>
  );
}

function PremiumFacts({ news, language, hi }) {
  const [tab, setTab] = useState("prelims");

  const getText = (item, base, fallback = "") =>
    (hi
      ? item[`${base}_hi`] || item[`${base}_en`]
      : item[`${base}_en`] || item[`${base}_hi`]) ||
    item[base] ||
    fallback;

  const prelimsFacts = news.filter((item) => {
    const fact = getText(item, "prelims");
    return Boolean(fact);
  });

  const mainsFacts = news.filter((item) => {
    const fact = getText(item, "premium_fact");
    return Boolean(fact);
  });

  const facts =
    tab === "prelims" ? prelimsFacts : mainsFacts;

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^[-•*]\s*/, "")
      .trim();
  }

  function getPrelimsFact(item) {
    const raw = cleanText(getText(item, "prelims"));
    if (!raw) return "";

    const firstSentence =
      raw.split(/(?<=[.!?।])\s+/)[0].trim() ||
      raw;

    return firstSentence.length > 190
      ? `${firstSentence.slice(0, 187).trim()}...`
      : firstSentence;
  }

  function getMainsFact(item) {
    return cleanText(getText(item, "premium_fact"));
  }

  const renderFact = (item) => {
    const fact =
      tab === "prelims"
        ? getPrelimsFact(item)
        : getMainsFact(item);

    const title = getText(
      item,
      "title",
      "Current Affair"
    );

    return (
      <article
        className="premium-clean-card"
        key={`${tab}-${item.id}`}
      >
        <div className="premium-clean-meta">
          <span className="premium-type-pill">
            {tab === "prelims"
              ? "PRELIMS FACT"
              : "MAINS FACT"}
          </span>

          <span className="premium-gs-pill">
            {item.gs || item.paper || "UPSC"}
          </span>
        </div>

        <h3>{title}</h3>

        <p className="premium-clean-fact">
          {fact}
        </p>

        <div className="premium-clean-footer">
          <span>
            {tab === "prelims"
              ? hi
                ? "त्वरित पुनरावृत्ति"
                : "Quick Revision"
              : hi
              ? "Mains Answer Use"
              : "Mains Answer Use"}
          </span>

          <span>
            {item.source_name || "Official Source"}
          </span>
        </div>
      </article>
    );
  };

  return (
    <section className="premium-facts-wrap">
      <div className="premium-main-heading">
        <div>
          <span className="premium-main-badge">
            PREMIUM
          </span>

          <h2>🔥 Premium Facts</h2>

          <p>
            {hi
              ? "UPSC-relevant, सीधे exam में इस्तेमाल होने वाले high-value facts."
              : "UPSC-relevant high-value facts for direct exam use."}
          </p>
        </div>
      </div>

      <div
        className="premium-tabs"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "prelims"}
          className={
            tab === "prelims"
              ? "premium-tab active"
              : "premium-tab"
          }
          onClick={() => setTab("prelims")}
        >
          <span className="premium-tab-number">
            01
          </span>

          <span className="premium-tab-copy">
            <strong>PRELIMS</strong>

            <small>
              {hi
                ? "एक-लाइन factual revision"
                : "One-line factual revision"}
            </small>
          </span>

          <b>{prelimsFacts.length}</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === "mains"}
          className={
            tab === "mains"
              ? "premium-tab active"
              : "premium-tab"
          }
          onClick={() => setTab("mains")}
        >
          <span className="premium-tab-number">
            02
          </span>

          <span className="premium-tab-copy">
            <strong>MAINS</strong>

            <small>
              {hi
                ? "Answer-ready points"
                : "Answer-ready points"}
            </small>
          </span>

          <b>{mainsFacts.length}</b>
        </button>
      </div>

      <div className="premium-active-heading">
        <div>
          <span className="premium-active-label">
            {tab === "prelims"
              ? "PRELIMS CURRENT FACTS"
              : "MAINS CURRENT FACTS"}
          </span>

          <h3>
            {tab === "prelims"
              ? hi
                ? "Prelims के लिए Current Facts"
                : "Current Facts for Prelims"
              : hi
              ? "Mains के लिए Current Facts"
              : "Current Facts for Mains"}
          </h3>

          <p>
            {tab === "prelims"
              ? hi
                ? "एक नज़र में याद रखने योग्य factual points."
                : "Factual points for quick revision."
              : hi
              ? "Mains answers को मजबूत करने वाले high-value points."
              : "High-value points to strengthen Mains answers."}
          </p>
        </div>

        <strong>{facts.length}</strong>
      </div>

      {facts.length === 0 ? (
        <div className="premium-clean-empty">
          {tab === "prelims"
            ? hi
              ? "अभी कोई Prelims Premium Fact उपलब्ध नहीं है।"
              : "No Prelims Premium Facts available yet."
            : hi
            ? "अभी कोई Mains Premium Fact उपलब्ध नहीं है।"
            : "No Mains Premium Facts available yet."}
        </div>
      ) : (
        <div className="premium-clean-grid">
          {facts.map(renderFact)}
        </div>
      )}
    </section>
  );
}

function ArticleModal({
  item,
  language,
  important,
  importantLoading,
  onImportant,
  onClose,
  inline = false,
}) {
  const hi = language === "hi";

  const title =
    (hi ? item.title_hi : item.title_en) ||
    item.title ||
    (hi ? item.title_en : item.title_hi);

  const why =
    (hi
      ? item.why_in_news_hi
      : item.why_in_news_en) ||
    item.why_in_news;

  const background =
    (hi
      ? item.background_hi
      : item.background_en) ||
    item.background;

  const facts =
    (hi
      ? item.key_facts_hi
      : item.key_facts_en) ||
    item.key_facts;

  const prelims =
    (hi ? item.prelims_hi : item.prelims_en) ||
    item.prelims;

  const mains =
    (hi
      ? item.mains_analysis_hi
      : item.mains_analysis_en) ||
    item.mains_analysis;

  const premium =
    (hi
      ? item.premium_fact_hi
      : item.premium_fact_en) ||
    item.premium_fact;

  const pyqs =
    (hi
      ? item.related_pyqs_hi
      : item.related_pyqs_en) ||
    item.related_pyqs;

  const mcq =
    (hi
      ? item.prelims_mcq_hi
      : item.prelims_mcq_en) ||
    item.prelims_mcq;

  const mainsQuestion =
    (hi
      ? item.mains_question_hi
      : item.mains_question_en) ||
    item.mains_question;

  const ethics =
    (hi
      ? item.ethics_angle_hi
      : item.ethics_angle_en) ||
    "";

  const isTheHindu =
    String(item?.source_name || "")
      .toLowerCase()
      .includes("the hindu");

  return (
    <div
      className={
        inline
          ? "inline-analysis"
          : "modal-backdrop"
      }
    >
      <article
        className={
          inline
            ? "modal inline-analysis-card"
            : "modal"
        }
      >
        <button
          className="close"
          onClick={onClose}
          aria-label="Close analysis"
        >
          ×
        </button>

        <span className="badge">
          {item.gs || item.paper || "UPSC"}
        </span>

        <h2>{title}</h2>

        <p className="source">
          Source: {item.source_name || "Not specified"}
        </p>

        {isTheHindu &&
          item.headline_image_url && (
            <div className="the-hindu-headline-cut">
              <div className="the-hindu-headline-label">
                THE HINDU
              </div>

              <img
                src={item.headline_image_url}
                alt="The Hindu newspaper headline"
                className="the-hindu-headline-image"
                loading="lazy"
              />
            </div>
          )}

        {item.source_url && (
          <a
            className="source-link"
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
          >
            {hi
              ? "Original Source देखें"
              : "View Original Source"}
          </a>
        )}

        {why && (
          <>
            <h3>Why in News</h3>
            <p>{why}</p>
          </>
        )}

        {background && (
          <>
            <h3>Background</h3>
            <p>{background}</p>
          </>
        )}

        {facts && (
          <>
            <h3>Key Facts</h3>
            <div className="content-block">
              {facts}
            </div>
          </>
        )}

        {prelims && (
          <>
            <h3>Prelims Focus</h3>
            <div className="content-block">
              {prelims}
            </div>
          </>
        )}

        {mains && (
          <>
            <h3>Mains Analysis</h3>
            <div className="content-block">
              {mains}
            </div>
          </>
        )}

        {item.static_link && (
          <>
            <h3>Static Link</h3>
            <p>{item.static_link}</p>
          </>
        )}

        {pyqs && (
          <>
            <h3>Related PYQs</h3>
            <div className="content-block">
              {pyqs}
            </div>
          </>
        )}

        {mcq && (
          <>
            <h3>Possible Prelims MCQ</h3>
            <div className="content-block">
              {mcq}
            </div>
          </>
        )}

        {mainsQuestion && (
          <>
            <h3>Possible Mains Question</h3>

            <div className="content-block">
              {mainsQuestion}
            </div>
          </>
        )}

        {ethics && (
          <>
            <h3>GS-IV Ethics</h3>

            <div className="content-block">
              {ethics}
            </div>
          </>
        )}

        {premium && (
          <div className="premium-box">
            <strong>🔥 Premium Fact</strong>

            <p>{premium}</p>
          </div>
        )}

        <button
          className="important-button modal-important"
          disabled={importantLoading}
          onClick={() => onImportant(item.id)}
        >
          {important
            ? "★ Remove from Important"
            : "⭐ Add to Important"}
        </button>
      </article>
    </div>
  );
}
