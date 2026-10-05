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

  if (source.includes("press information bureau") || source === "pib") return "pib";
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

export default function CurrentAffairsPage() {
  const router = useRouter();

  const [active, setActive] = useState("Today");
  const [activeSource, setActiveSource] = useState("all");
  const [language, setLanguage] = useState("hi");
  const [news, setNews] = useState([]);
  const [important, setImportant] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [importantLoading, setImportantLoading] =
    useState(false);
  const [error, setError] = useState("");

  const [notificationOpen, setNotificationOpen] =
    useState(false);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);
  const [notificationLanguage, setNotificationLanguage] =
    useState("hi");
  const [notificationTime, setNotificationTime] =
    useState("10:00");
  const [notificationSaving, setNotificationSaving] =
    useState(false);
  const [notificationMessage, setNotificationMessage] =
    useState("");

  const hi = language === "hi";

  useEffect(() => {
    loadCurrentAffairs();
    loadImportant();
    loadNotificationSettings();
  }, []);

  function getUserId() {
    if (typeof window === "undefined") return "";

    let id = localStorage.getItem(
      "sambhav_upsc_notification_user"
    );

    if (!id) {
      id =
        "sambhav_" +
        Math.random().toString(36).slice(2) +
        "_" +
        Date.now();

      localStorage.setItem(
        "sambhav_upsc_notification_user",
        id
      );
    }

    return id;
  }

  async function loadCurrentAffairs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/current-affairs",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error ||
            "Current Affairs load nahi ho paye."
        );
      }

      setNews(result.data || []);
    } catch (err) {
      setError(
        err.message ||
          "Current Affairs load nahi ho paye."
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

      if (
        response.ok &&
        result.success &&
        result.data
      ) {
        setNotificationsEnabled(
          result.data.enabled !== false
        );

        setNotificationLanguage(
          result.data.language === "en"
            ? "en"
            : "hi"
        );

        setNotificationTime(
          result.data.notification_time ||
            "10:00"
        );
      }
    } catch (err) {
      console.error(
        "Notification settings load error:",
        err
      );
    }
  }

  async function saveNotificationSettings(
    overrides = {}
  ) {
    try {
      setNotificationSaving(true);
      setNotificationMessage("");

      const userId = getUserId();

      if (!userId) {
        throw new Error(
          "User identification unavailable."
        );
      }

      const enabled =
        overrides.enabled !== undefined
          ? overrides.enabled
          : notificationsEnabled;

      const selectedLanguage =
        overrides.language ||
        notificationLanguage;

      const selectedTime =
        overrides.time ||
        notificationTime;

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
          result?.error ||
            "Notification settings save nahi hui."
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
        err.message ||
          "Notification settings save nahi hui."
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

  const filteredNews = useMemo(() => {
    const base = sourceFilteredNews;

    if (active === "Today") {
      return base.filter((item) => !isEthicsExample(item));
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
  }, [active, sourceFilteredNews, importantIds]);

  const sourceTabs = [
    { key: "all", label: "ALL" },
    { key: "pib", label: "PIB" },
    { key: "gktoday", label: "GK TODAY" },
    { key: "the-hindu", label: "THE HINDU" },
    { key: "better-india", label: "BETTER INDIA", sub: "GS-IV" },
  ];

  function selectSource(key) {
    setActiveSource(key);
    if (key === "better-india") {
      setActive("GS-IV");
    } else if (active === "Premium" || active === "Important" || active === "GS-IV") {
      setActive("Today");
    }
  }

  async function toggleImportant(id) {
    try {
      setImportantLoading(true);

      const already =
        importantIds.includes(Number(id));

      const response = await fetch(
        already
          ? `/api/current-affairs?mode=important&current_affair_id=${id}`
          : "/api/current-affairs",
        {
          method: already ? "DELETE" : "POST",
          headers: already
            ? {}
            : {
                "Content-Type":
                  "application/json",
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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getLatestDate() {
    if (!news.length) return "Loading...";
    return formatDate(news[0]?.date);
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

      <section className="ca-header">
        <div>
          <p className="eyebrow">SAMBHAV UPSC</p>

          <h1>Current Affairs</h1>

          <p className="sub">
            {hi
              ? "UPSC प्रासंगिक दैनिक करेंट अफेयर्स — Prelims + Mains"
              : "UPSC-relevant daily current affairs — Prelims + Mains"}
          </p>
        </div>

        <div className="header-actions">
          <div className="language-box">
            <span>
              {hi ? "भाषा" : "Language"}
            </span>

            <div className="language-buttons">
              <button
                className={
                  hi ? "lang active" : "lang"
                }
                onClick={() =>
                  setLanguage("hi")
                }
              >
                हिन्दी
              </button>

              <button
                className={
                  !hi
                    ? "lang active"
                    : "lang"
                }
                onClick={() =>
                  setLanguage("en")
                }
              >
                English
              </button>
            </div>
          </div>

          <div className="date-card">
            <span>Latest Update</span>

            <strong>
              {getLatestDate()}
            </strong>

            <small>
              Daily update: 10:00 AM
            </small>
          </div>

          <button
            className="magazine-button"
            onClick={() =>
              (window.location.href =
                "/current-affairs/magazine")
            }
          >
            📖
            <span>Monthly Magazine</span>
          </button>

          <button
            className="notification-button"
            onClick={() =>
              setNotificationOpen(
                !notificationOpen
              )
            }
          >
            🔔
            <span>Notifications</span>
          </button>
        </div>
      </section>

      {notificationOpen && (
        <section className="notification-panel">
          <div className="notification-title">
            <div>
              <span className="badge">
                DAILY
              </span>

              <h2>
                🔔 Current Affairs Notification
              </h2>

              <p>
                {hi
                  ? "हर दिन नए UPSC Current Affairs की notification."
                  : "Get daily notifications for new UPSC Current Affairs."}
              </p>
            </div>

            <button
              className={
                notificationsEnabled
                  ? "switch on"
                  : "switch"
              }
              onClick={() => {
                const next =
                  !notificationsEnabled;

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
              <label>
                Notification Language
              </label>

              <div className="setting-buttons">
                <button
                  className={
                    notificationLanguage ===
                    "hi"
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
                  className={
                    notificationLanguage ===
                    "en"
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
              <label>
                Daily Notification Time
              </label>

              <input
                type="time"
                value={notificationTime}
                onChange={(e) =>
                  setNotificationTime(
                    e.target.value
                  )
                }
                disabled={
                  notificationSaving
                }
              />

              <button
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
                    notificationLanguage ===
                    "hi"
                      ? "हिन्दी"
                      : "English"
                  }`
                : `Daily at ${notificationTime} • ${
                    notificationLanguage ===
                    "hi"
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
            <span className="source-nav-eyebrow">SOURCES</span>
            <strong>Current Affairs Sources</strong>
          </div>
          <span className="source-nav-note">
            {activeSource === "better-india" ? "Better India → GS-IV Ethics" : "Select a source"}
          </span>
        </div>

        <div className="source-nav">
          {sourceTabs.map((tab) => {
            const count =
              tab.key === "all"
                ? news.filter((item) => !isEthicsExample(item)).length
                : news.filter((item) => getSourceKey(item) === tab.key).length;

            return (
              <button
                key={tab.key}
                type="button"
                className={`source-tab ${
                  activeSource === tab.key ? "active" : ""
                } ${tab.key === "better-india" ? "ethics" : ""}`}
                onClick={() => selectSource(tab.key)}
              >
                <span className="source-tab-main">{tab.label}</span>
                {tab.sub && <span className="source-tab-sub">{tab.sub}</span>}
                <span className="source-tab-count">{count}</span>
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
            onClick={() =>
              setActive(filter)
            }
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
          onClick={() =>
            setActive("Important")
          }
        >
          ⭐ Important
        </button>

        <button
          className={
            active === "Premium"
              ? "filter active premium"
              : "filter premium"
          }
          onClick={() =>
            setActive("Premium")
          }
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
              <span className="badge">
                SAVED
              </span>

              <h2>
                ⭐ My Important Current Affairs
              </h2>
            </div>

            <p>
              {filteredNews.length} saved
            </p>
          </div>

          {filteredNews.length === 0 ? (
            <div className="empty">
              {hi ? (
                <>
                  अभी कोई Current Affair
                  Important में नहीं है।
                  <br />
                  किसी news पर ⭐ दबाकर
                  save करें।
                </>
              ) : (
                <>
                  No Current Affairs saved yet.
                  <br />
                  Press ⭐ on any article to
                  save it.
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
                  onImportant={
                    toggleImportant
                  }
                  onOpen={setSelected}
                  expanded={
                    selected?.id === item.id
                  }
                  onClose={() =>
                    setSelected(null)
                  }
                  formatDate={formatDate}
                  disabled={
                    importantLoading
                  }
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

            <p>
              {filteredNews.length} updates
            </p>
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
                  onImportant={
                    toggleImportant
                  }
                  onOpen={setSelected}
                  expanded={
                    selected?.id === item.id
                  }
                  onClose={() =>
                    setSelected(null)
                  }
                  formatDate={formatDate}
                  disabled={
                    importantLoading
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      <style jsx global>{`
        /* ---------- PAGE BACK BUTTON ---------- */
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
  transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
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
            radial-gradient(circle at 8% 0%, rgba(30, 64, 175, 0.055), transparent 28%),
            radial-gradient(circle at 92% 8%, rgba(15, 23, 42, 0.045), transparent 25%),
            #f6f8fb;
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

        .source-nav-wrap {
          max-width: 1050px;
          margin: 0 auto 14px;
          padding: 12px;
          background: rgba(255,255,255,.88);
          border: 1px solid #e2e7ef;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(15,23,42,.045);
          backdrop-filter: blur(10px);
        }

        .source-nav-head {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding: 2px 4px 10px;
        }

        .source-nav-eyebrow {
          display:block;
          color:#98a2b3;
          font-size:9px;
          font-weight:950;
          letter-spacing:.14em;
          margin-bottom:3px;
        }

        .source-nav-head strong {
          font-size:13px;
          font-weight:900;
        }

        .source-nav-note {
          color:#667085;
          font-size:10px;
          font-weight:700;
          text-align:right;
        }

        .source-nav {
          display:grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap:7px;
        }

        .source-tab {
          min-width:0;
          min-height:46px;
          border:1px solid #e1e6ee;
          background:#fff;
          color:#344054;
          border-radius:12px;
          padding:8px 10px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          cursor:pointer;
          font-weight:900;
          transition:transform .16s ease, background .16s ease, border-color .16s ease, box-shadow .16s ease;
        }

        .source-tab:hover {
          transform:translateY(-1px);
          box-shadow:0 6px 14px rgba(15,23,42,.06);
        }

        .source-tab.active {
          background:#172033;
          color:#fff;
          border-color:#172033;
          box-shadow:0 7px 16px rgba(15,23,42,.14);
        }

        .source-tab.ethics.active {
          background:#7a263a;
          border-color:#7a263a;
        }

        .source-tab-main {
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          font-size:11px;
        }

        .source-tab-sub {
          font-size:8px;
          padding:3px 5px;
          border-radius:999px;
          background:#f2f4f7;
          color:#667085;
        }

        .source-tab.active .source-tab-sub {
          background:rgba(255,255,255,.14);
          color:#fff;
        }

        .source-tab-count {
          min-width:22px;
          padding:3px 5px;
          border-radius:999px;
          background:#f2f4f7;
          color:#475467;
          font-size:9px;
          text-align:center;
        }

        .source-tab.active .source-tab-count {
          background:rgba(255,255,255,.14);
          color:#fff;
        }

        .ca-header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
          margin-bottom: 20px;
          padding: 26px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #e2e7ef;
          border-radius: 22px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.065);
          backdrop-filter: blur(10px);
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: stretch;
          flex-wrap: wrap;
        }

.language-box,
        .date-card,
        .notification-button,
        .magazine-button {
          background: #fff;
          border: 1px solid #dfe5ec;
          border-radius: 14px;
          padding: 12px 14px;
          box-shadow: 0 4px 14px rgba(16, 24, 40, 0.035);
        }

        .language-box > span {
          display: block;
          color: #667085;
          font-size: 11px;
          margin-bottom: 7px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .language-buttons {
          display: flex;
          gap: 5px;
        }

        .lang {
          border: 1px solid #dfe3e8;
          background: #fff;
          color: #344054;
          border-radius: 8px;
          padding: 7px 10px;
          cursor: pointer;
          font-weight: 800;
          transition: transform 0.16s ease, background 0.16s ease;
        }

        .lang.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
        }

.magazine-button {
          cursor: pointer;
          font-weight: 850;
          color: #fff;
          background: #172033;
          border: 1px solid #172033;
          border-radius: 14px;
          padding: 12px 15px;
          display: flex;
          gap: 7px;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          box-shadow: 0 4px 14px rgba(16, 24, 40, 0.035);
          white-space: nowrap;
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .magazine-button:hover {
          background: #25304a;
          border-color: #25304a;
          transform: translateY(-1px);
        }

        .notification-button {
          cursor: pointer;
          font-weight: 850;
          color: #172033;
          display: flex;
          gap: 7px;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
          margin: 0 0 8px;
          color: #667085;
        }

        h1 {
          margin: 0;
          font-size: clamp(32px, 5vw, 46px);
          line-height: 1.02;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .sub {
          color: #667085;
          margin: 11px 0 0;
          font-size: 14px;
          line-height: 1.55;
          max-width: 620px;
        }

        .date-card {
          min-width: 190px;
        }

        .date-card span,
        .date-card small {
          display: block;
          color: #667085;
          font-size: 11px;
        }

        .date-card strong {
          display: block;
          margin: 5px 0;
          font-size: 15px;
          font-weight: 900;
          color: #172033;
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
          letter-spacing: -0.02em;
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
          flex-shrink: 0;
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
          transition: transform 0.16s ease, box-shadow 0.16s ease;
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
          box-shadow: 0 2px 7px rgba(15, 23, 42, 0.025);
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .filter.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
          box-shadow: 0 5px 12px rgba(15, 23, 42, 0.13);
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
          letter-spacing: -0.025em;
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
          letter-spacing: 0.07em;
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
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .news-card:hover {
          transform: translateY(-2px);
          border-color: #d5dce6;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
        }

        .topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .card-badges {
          display:flex;
          align-items:center;
          gap:6px;
          flex-wrap:wrap;
          min-width:0;
        }

        .source-chip {
          display:inline-flex;
          align-items:center;
          min-height:22px;
          padding:4px 7px;
          border-radius:7px;
          background:#f2f4f7;
          color:#475467;
          font-size:8px;
          font-weight:950;
          letter-spacing:.05em;
        }

        .source-chip.pib { background:#eef4ff; color:#175cd3; }
        .source-chip.gktoday { background:#ecfdf3; color:#027a48; }
        .source-chip.the-hindu { background:#fff1f3; color:#b42318; }
        .source-chip.better-india { background:#fff7e6; color:#9a6700; }

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
          letter-spacing: -0.02em;
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
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .read-button {
          background: #172033;
          color: #fff;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
        }

        .read-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 7px 16px rgba(15, 23, 42, 0.16);
        }

        .important-button {
          background: #f3f4f6;
          color: #344054;
        }

        .important-button:hover {
          transform: translateY(-1px);
        }

        .important-button.saved {
          background: #fff3d6;
          color: #8a5a00;
          border: 1px solid #f0d39b;
        }

        .important-button:disabled,
        .setting-btn:disabled,
        .save-time:disabled {
          opacity: 0.6;
          cursor: wait;
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
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
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
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
        }

        .premium-main-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f8e8e8;
          color: #7f1d1d;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .1em;
        }

        .premium-main-heading h2 {
          margin: 10px 0 5px;
          color: #172033;
          font-size: clamp(22px, 4vw, 30px);
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
          min-width: 0;
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
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease;
        }

        .premium-tab:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, .06);
        }

        .premium-tab.active {
          color: #fff;
          background: #172033;
          border-color: #172033;
          box-shadow: 0 10px 24px rgba(23, 32, 51, .16);
        }

        .premium-tab-number {
          font-size: 11px;
          font-weight: 950;
          opacity: .65;
        }

        .premium-tab-copy {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .premium-tab-copy strong {
          font-size: 13px;
          letter-spacing: .04em;
        }

        .premium-tab-copy small {
          color: #667085;
          font-size: 11px;
          line-height: 1.35;
        }

        .premium-tab.active .premium-tab-copy small {
          color: rgba(255,255,255,.72);
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
          background: rgba(255,255,255,.14);
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
          letter-spacing: .1em;
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
          min-width: 42px;
          text-align: center;
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
          box-shadow: 0 8px 22px rgba(15,23,42,.045);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .premium-clean-card:hover {
          transform: translateY(-2px);
          border-color: #d5dbe4;
          box-shadow: 0 13px 28px rgba(15,23,42,.07);
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
          align-items: center;
          padding: 5px 8px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .06em;
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

        .fact-grid {
          max-width: 1050px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .fact-card {
          background: #fff;
          border: 1px solid #e1e6ee;
          border-radius: 17px;
          padding: 19px;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.045);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .fact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 13px 28px rgba(15, 23, 42, 0.065);
        }

        .fact-card > span {
          font-size: 10px;
          color: #667085;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .fact-card h3 {
          font-size: 17px;
          margin: 10px 0;
          line-height: 1.35;
          font-weight: 900;
        }

        .fact-card p {
          color: #475467;
          line-height: 1.65;
          font-size: 13.5px;
          white-space: pre-wrap;
        }

        .fact-card small {
          color: #667085;
          font-size: 11px;
        }

        .inline-analysis {
          margin-top: 17px;
          padding-top: 17px;
          border-top: 1px solid #e3e8ef;
        }

        .inline-analysis-card {
          width: 100%;
          max-height: none;
          overflow: visible;
          background: #fbfcfe;
          border: 1px solid #d9e0e9;
          border-radius: 16px;
          padding: 22px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 10px 28px rgba(15, 23, 42, 0.055);
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
          line-height: 1;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .inline-analysis-card .close:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 12px rgba(15, 23, 42, 0.08);
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

        .filter:hover,
        .lang:hover,
        .setting-btn:hover,
        .setting-btn.active:hover,
        .notification-button:hover {
          transform: translateY(-1px);
        }

        .filter:focus-visible,
        .read-button:focus-visible,
        .important-button:focus-visible,
        .lang:focus-visible,
        .setting-btn:focus-visible,
        .notification-button:focus-visible,
        .magazine-button:focus-visible,
        .close:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.18);
          outline-offset: 2px;
        }

        /* =========================================================
           RESPONSIVE SYSTEM
           Mobile + Tablet + Laptop + Desktop
           ========================================================= */

        @media (min-width: 1400px) {
          .ca-page { padding-left:32px; padding-right:32px; }
          .ca-header, .source-nav-wrap, .notification-panel, .filter-row,
          .section-heading, .news-list, .special-section { max-width:1180px; }
          .ca-header { padding:30px; }
        }

        @media (min-width: 1025px) and (max-width: 1399px) {
          .ca-page { padding:28px 20px 80px; }
          .ca-header, .source-nav-wrap, .notification-panel, .filter-row,
          .section-heading, .news-list, .special-section { max-width:1100px; }
          .ca-header { align-items:flex-start; }
          .header-actions { max-width:560px; justify-content:flex-end; }
        }

        @media (min-width: 601px) and (max-width: 1024px) {
          .ca-page { padding:22px 16px 70px; }
          .ca-header { display:flex; flex-direction:column; align-items:stretch; gap:20px; padding:22px; }
          .header-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; width:100%; }
          .language-box, .date-card, .notification-button, .magazine-button { width:100%; min-width:0; }
          .source-nav { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .source-nav-wrap { width:100%; }
          .filter-row { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
          .filter { flex:0 0 auto; }
          .news-card { padding:20px; }
          .fact-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .premium-clean-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }

        @media (max-width: 600px) {
  .page-back-button {
    width: 100%;
    justify-content: center;
    min-height: 42px;
    margin-bottom: 10px;
  }
          .ca-page { width:100%; max-width:100%; min-width:0; padding:12px 10px 48px; overflow-x:hidden; }
          .ca-header { width:100%; display:flex; flex-direction:column; align-items:stretch; gap:17px; padding:17px; border-radius:18px; }
          h1 { font-size:clamp(29px,9vw,38px); }
          .sub { font-size:12.5px; }
          .header-actions { width:100%; display:grid; grid-template-columns:1fr; gap:8px; }
          .language-box, .date-card, .notification-button, .magazine-button { width:100%; min-width:0; box-sizing:border-box; }
          .lang { flex:1; min-height:40px; }

          .source-nav-wrap { width:100%; max-width:100%; box-sizing:border-box; padding:10px; margin-bottom:10px; border-radius:15px; }
          .source-nav-head { align-items:flex-start; }
          .source-nav-note { font-size:9px; max-width:45%; }
          .source-nav { display:flex; overflow-x:auto; gap:6px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
          .source-nav::-webkit-scrollbar { display:none; }
          .source-tab { flex:0 0 auto; min-height:40px; padding:7px 10px; }

          .notification-panel { width:100%; max-width:100%; box-sizing:border-box; padding:15px; border-radius:16px; }
          .notification-grid { grid-template-columns:1fr; }
          .notification-info { display:block; font-size:12px; }
          .notification-info span { display:block; margin-top:5px; }
          .setting-box input { width:100%; box-sizing:border-box; margin:0 0 8px; }
          .save-time { width:100%; }

          .filter-row { width:100%; max-width:100%; display:flex; overflow-x:auto; gap:7px; padding:3px 1px 13px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
          .filter-row::-webkit-scrollbar { display:none; }
          .filter { flex:0 0 auto; min-height:40px; padding:9px 13px; font-size:12px; }

          .section-heading { width:100%; max-width:100%; display:flex; flex-direction:column; align-items:flex-start; gap:7px; margin-bottom:11px; }
          .section-heading h2 { font-size:20px; }
          .news-list { width:100%; max-width:100%; grid-template-columns:1fr; gap:11px; }
          .news-card { width:100%; min-width:0; box-sizing:border-box; padding:15px; border-radius:16px; }
          .topline { align-items:flex-start; }
          .meta { font-size:10px; text-align:right; }
          .news-card h3 { font-size:18px; line-height:1.38; overflow-wrap:anywhere; }
          .summary { font-size:12.5px; line-height:1.7; }
          .card-actions { display:grid; grid-template-columns:1fr 1fr; gap:7px; align-items:stretch; }
          .read-button, .important-button { width:100%; min-height:42px; font-size:12px; }
          .source { grid-column:1 / -1; width:100%; font-size:10px; overflow-wrap:anywhere; }
          .card-badges { max-width:70%; }
          .source-chip { font-size:7px; }

          .inline-analysis { margin-top:13px; padding-top:13px; }
          .inline-analysis-card { width:100%; max-width:100%; box-sizing:border-box; padding:15px; border-radius:14px; }
          .modal h2 { font-size:21px; line-height:1.35; }
          .modal p, .content-block { font-size:13px; line-height:1.7; }

          .premium-facts-wrap { width:100%; max-width:100%; }
          .premium-main-heading { padding:17px; border-radius:17px; }
          .premium-tabs { grid-template-columns:1fr; }
          .premium-active-heading { display:flex; flex-direction:column; align-items:flex-start; }
          .premium-clean-grid { grid-template-columns:1fr; }
          .fact-grid { width:100%; grid-template-columns:1fr; }
          .empty, .state-card { width:100%; max-width:100%; box-sizing:border-box; padding:30px 15px; }
        }

        @media (max-width: 380px) {
          .ca-page { padding-left:7px; padding-right:7px; }
          .ca-header { padding:14px; }
          h1 { font-size:28px; }
          .source-nav-head { display:block; }
          .source-nav-note { display:block; max-width:none; text-align:left; margin-top:4px; }
          .filter { padding:8px 11px; font-size:11px; }
          .news-card { padding:13px; }
          .news-card h3 { font-size:17px; }
          .card-actions { grid-template-columns:1fr; }
          .source { grid-column:auto; }
        }

        html, body { max-width:100%; overflow-x:hidden; }
        *, *::before, *::after { box-sizing:border-box; }
        button, input, select, textarea { max-width:100%; }
        img, video, iframe { max-width:100%; height:auto; }
      `}


/* =========================================================
   SAMBHAV UPSC — CURRENT AFFAIRS PREMIUM VISUAL OVERRIDE
   DESIGN ONLY — NO FUNCTIONAL / FEATURE CHANGES
   Paste this at the END of the existing <style jsx global> block.
   ========================================================= */

.ca-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(191, 158, 76, .10), transparent 23%),
    radial-gradient(circle at 92% 4%, rgba(30, 41, 59, .045), transparent 24%),
    linear-gradient(180deg, #f8f7f3 0%, #f1f2f4 48%, #eceef1 100%);
  color: #172033;
  padding: 28px 18px 90px;
}

/* Back */
.page-back-button {
  border: 1px solid #ddd9cf;
  background: rgba(255,255,255,.92);
  color: #202634;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(22, 29, 43, .055);
}

/* =========================================================
   PREMIUM HERO — LIGHT, HIGH CONTRAST
   ========================================================= */

.ca-premium-hero {
  max-width: 1050px;
  margin-bottom: 18px;
  padding: 18px 20px 23px;
  border: 1px solid #d9cfb6;
  border-radius: 26px;
  color: #18202f;
  background:
    radial-gradient(circle at 88% 5%, rgba(191,158,76,.17), transparent 25%),
    radial-gradient(circle at 15% 120%, rgba(148,163,184,.12), transparent 32%),
    linear-gradient(145deg, #fffdf8 0%, #f7f3e8 58%, #eee9dc 100%);
  box-shadow:
    0 24px 60px rgba(22, 29, 43, .11),
    inset 0 1px 0 rgba(255,255,255,.95);
}

.ca-premium-hero::before {
  border-color: rgba(154,118,45,.15);
}

.ca-premium-hero::after {
  border-color: rgba(154,118,45,.12);
}

.ca-hero-brand-kicker,
.ca-hero-eyebrow {
  color: #94732b;
}

.ca-hero-brand strong,
.ca-hero-copy h2 {
  color: #171d29;
}

.ca-hero-brand small,
.ca-hero-copy p {
  color: #687181;
}

.ca-hero-divider {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(154,118,45,.28),
    transparent
  );
}

.ca-hero-action-card,
.ca-hero-utility-btn {
  border-color: #ddd6c7;
  background: rgba(255,255,255,.78);
  color: #202838;
  box-shadow:
    0 5px 14px rgba(22,29,43,.045),
    inset 0 1px 0 rgba(255,255,255,.85);
}

.ca-hero-action-card > span {
  color: #7b7467;
}

.ca-date-card strong {
  color: #202838;
}

.ca-date-card small {
  color: #858070;
}

.ca-lang-pill {
  border-color: #ded8ca;
  background: #f8f6f0;
  color: #6c675e;
}

.ca-lang-pill.active {
  background: #202838;
  color: #fff;
  border-color: #202838;
}

.ca-hero-utility-btn span {
  color: #9a762d;
}

.ca-hero-utility-btn:hover {
  background: #fff;
  border-color: #cbb986;
}

.ca-hero-utility-btn.notification {
  background: #202838;
  color: #fff;
  border-color: #202838;
}

.ca-hero-utility-btn.notification span {
  color: #e1c77e;
}

.ca-hero-stat {
  background: rgba(255,255,255,.68);
  border-color: #ded8ca;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.85);
}

.ca-hero-stat strong {
  color: #202838;
}

.ca-hero-stat span {
  color: #7d776d;
}

.ca-hero-seal-ring {
  border-color: rgba(154,118,45,.46);
  outline-color: rgba(154,118,45,.12);
  background: radial-gradient(
    circle,
    rgba(191,158,76,.14),
    rgba(255,255,255,.30) 68%
  );
}

.ca-hero-seal-ring span {
  color: #94732b;
}

.ca-hero-seal-ring small,
.ca-hero-date {
  color: #817b70;
}

.ca-hero-seal-line {
  background: rgba(154,118,45,.35);
}

/* =========================================================
   SOURCE NAV
   ========================================================= */

.source-nav-wrap {
  background: rgba(255,255,255,.91);
  border-color: #dedfdc;
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(22,29,43,.055);
}

.source-nav-eyebrow {
  color: #9a762d;
}

.source-nav-head strong {
  color: #202838;
}

.source-nav-note {
  color: #7a818c;
}

.source-tab {
  background: linear-gradient(180deg,#fff,#f8f9fa);
  border-color: #e0e3e7;
  color: #3b4351;
}

.source-tab:hover {
  border-color: #cfd4dc;
}

.source-tab.active {
  background: linear-gradient(145deg,#202838,#151b27);
  border-color: #202838;
  color: #fff;
}

.source-tab.ethics.active {
  background: linear-gradient(145deg,#8b3046,#682235);
  border-color: #8b3046;
}

.source-tab-sub,
.source-tab-count {
  background: #f0f2f4;
  color: #626b78;
}

.source-tab.active .source-tab-sub,
.source-tab.active .source-tab-count {
  background: rgba(255,255,255,.13);
  color: #fff;
}

/* =========================================================
   FILTERS
   ========================================================= */

.filter-row {
  padding-top: 5px;
}

.filter {
  background: rgba(255,255,255,.94);
  border-color: #dde1e6;
  color: #414957;
  box-shadow: 0 4px 12px rgba(22,29,43,.035);
}

.filter:hover {
  border-color: #cbd1d9;
}

.filter.active {
  background: #202838;
  border-color: #202838;
  color: #fff;
}

.filter.important.active {
  background: #967126;
  border-color: #967126;
}

.filter.premium.active {
  background: #7d2940;
  border-color: #7d2940;
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

.section-heading {
  background: rgba(255,255,255,.82);
  border-color: #e0e3e7;
  border-radius: 17px;
  box-shadow: 0 7px 22px rgba(22,29,43,.04);
}

.section-heading h2 {
  color: #1d2533;
}

.section-heading p {
  color: #7a828e;
}

.badge {
  background: #f1eee7;
  color: #75643e;
}

/* =========================================================
   NEWS CARDS
   ========================================================= */

.news-card {
  background: rgba(255,255,255,.96);
  border-color: #e0e4e9;
  border-radius: 19px;
  box-shadow: 0 10px 28px rgba(22,29,43,.052);
}

.news-card:hover {
  border-color: #d0d6de;
  box-shadow: 0 17px 35px rgba(22,29,43,.08);
}

.source-chip {
  background: #f0f2f4;
  color: #596270;
}

.source-chip.pib {
  background: #edf4ff;
  color: #175cd3;
}

.source-chip.gktoday {
  background: #ecfdf3;
  color: #027a48;
}

.source-chip.the-hindu {
  background: #fff0f2;
  color: #b42318;
}

.source-chip.better-india {
  background: #fff5dc;
  color: #8a6500;
}

.meta,
.source {
  color: #7b8490;
}

.news-card h3 {
  color: #1b2432;
}

.summary {
  color: #596574;
}

.card-actions {
  border-top-color: #edf0f3;
}

.read-button {
  background: #202838;
  color: #fff;
  box-shadow: 0 5px 12px rgba(22,29,43,.13);
}

.read-button:hover {
  background: #293348;
}

.important-button {
  background: #f3f4f5;
  color: #46505d;
}

.important-button.saved {
  background: #fff4d8;
  color: #8b6411;
  border-color: #ead39b;
}

/* =========================================================
   NOTIFICATION PANEL
   ========================================================= */

.notification-panel {
  background: rgba(255,255,255,.96);
  border-color: #dfe3e8;
  box-shadow: 0 12px 30px rgba(22,29,43,.055);
}

.notification-title h2,
.notification-title p {
  color: #202838;
}

.notification-title p,
.setting-box label,
.notification-info span {
  color: #707985;
}

.switch.on {
  background: #202838;
}

.setting-box {
  background: #fafbfc;
  border-color: #e2e6eb;
}

.setting-btn.active,
.save-time {
  background: #202838;
  border-color: #202838;
  color: #fff;
}

.notification-info {
  background: #f5f6f7;
}

.notification-message {
  color: #175cd3;
}

/* =========================================================
   STATES
   ========================================================= */

.empty,
.state-card {
  background: rgba(255,255,255,.96);
  border-color: #d6dce3;
  color: #707985;
  box-shadow: 0 10px 28px rgba(22,29,43,.045);
}

.state-card h2 {
  color: #202838;
}

.loader {
  border-color: #e4e7eb;
  border-top-color: #202838;
}

/* =========================================================
   PREMIUM FACTS
   ========================================================= */

.premium-main-heading {
  background:
    radial-gradient(circle at 90% 0%, rgba(191,158,76,.13), transparent 25%),
    linear-gradient(135deg,#fffdf8,#f5f1e8);
  border-color: #dfd5bf;
}

.premium-main-badge {
  background: #f3ead7;
  color: #80611e;
}

.premium-main-heading h2,
.premium-active-heading h3 {
  color: #202838;
}

.premium-main-heading p,
.premium-active-heading p {
  color: #707985;
}

.premium-tab {
  background: #fff;
  border-color: #dfe4e9;
  color: #202838;
}

.premium-tab.active {
  background: #202838;
  border-color: #202838;
}

.premium-tab-copy small {
  color: #737c88;
}

.premium-tab b {
  background: #f1f3f5;
  color: #46505d;
}

.premium-type-pill {
  background: #f4ead9;
  color: #80611e;
}

.premium-gs-pill {
  background: #f1f3f5;
  color: #596270;
}

.premium-clean-card {
  background: rgba(255,255,255,.97);
  border-color: #e0e4e9;
  box-shadow: 0 8px 22px rgba(22,29,43,.045);
}

.premium-clean-card h3 {
  color: #202838;
}

.premium-clean-fact {
  color: #596574;
}

.premium-clean-footer {
  border-top-color: #edf0f3;
  color: #8a929d;
}

.premium-clean-empty {
  background: #fafbfc;
  border-color: #d9dee5;
  color: #707985;
}

/* =========================================================
   INLINE ANALYSIS / ARTICLE DETAIL
   ========================================================= */

.inline-analysis {
  border-top-color: #e2e6eb;
}

.inline-analysis-card {
  background:
    linear-gradient(180deg,#ffffff 0%,#fafbfc 100%);
  border-color: #dce1e7;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.95),
    0 10px 28px rgba(22,29,43,.055);
}

.inline-analysis-card .close {
  background: #fff;
  border-color: #dce1e7;
  color: #4a5360;
}

.modal h2,
.modal h3 {
  color: #202838;
}

.modal h3 {
  border-bottom-color: #edf0f3;
}

.modal p,
.content-block {
  color: #596574;
}

.source-link {
  color: #175cd3;
}

.premium-box {
  background: linear-gradient(135deg,#fff8e9,#f8edd3);
  border-color: #e7d09a;
}

.premium-box strong {
  color: #80611e;
}

/* =========================================================
   MOBILE POLISH
   ========================================================= */

@media (max-width: 600px) {
  .ca-page {
    padding: 12px 10px 48px;
  }

  .ca-premium-hero {
    border-radius: 20px;
    padding: 15px;
  }

  .ca-hero-actions {
    gap: 7px;
  }

  .source-nav-wrap {
    border-radius: 17px;
  }

  .news-card {
    border-radius: 16px;
  }
}

</style>
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
    (hi
      ? item.title_hi
      : item.title_en) ||
    item.title ||
    (hi
      ? item.title_en
      : item.title_hi) ||
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

          <span className={`source-chip ${getSourceKey(item)}`}>
            {getSourceKey(item) === "pib"
              ? "PIB"
              : getSourceKey(item) === "gktoday"
                ? "GK TODAY"
                : getSourceKey(item) === "the-hindu"
                  ? "THE HINDU"
                  : getSourceKey(item) === "better-india"
                    ? "BETTER INDIA"
                    : "SOURCE"}
          </span>
        </div>

        <span className="meta">
          {item.subject ||
            "UPSC Current Affairs"}{" "}
          • {formatDate(item.date)}
        </span>
      </div>

      <h3>{title}</h3>

      <p className="summary">
        {summary}
      </p>

      <div className="card-actions">
        <button
          className="read-button"
          onClick={() =>
            expanded
              ? onClose()
              : onOpen(item)
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
          onClick={() =>
            onImportant(item.id)
          }
        >
          {important
            ? "★ Saved"
            : "⭐ Important"}
        </button>

        <span className="source">
          Source:{" "}
          {item.source_name ||
            "Not specified"}
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

function PremiumFacts({
  news,
  language,
  hi,
}) {
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

  const facts = tab === "prelims" ? prelimsFacts : mainsFacts;

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
      raw.split(/(?<=[.!?।])\s+/)[0].trim() || raw;

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

    const title = getText(item, "title", "Current Affair");

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
        <p className="premium-clean-fact">{fact}</p>

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
          <span className="premium-main-badge">PREMIUM</span>
          <h2>🔥 Premium Facts</h2>
          <p>
            {hi
              ? "UPSC-relevant, सीधे exam में इस्तेमाल होने वाले high-value facts."
              : "UPSC-relevant high-value facts for direct exam use."}
          </p>
        </div>
      </div>

      <div className="premium-tabs" role="tablist">
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
          <span className="premium-tab-number">01</span>
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
          <span className="premium-tab-number">02</span>
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
    (hi
      ? item.title_hi
      : item.title_en) ||
    item.title ||
    (hi
      ? item.title_en
      : item.title_hi);

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
    (hi
      ? item.prelims_hi
      : item.prelims_en) ||
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
          {item.gs ||
            item.paper ||
            "UPSC"}
        </span>

        <h2>{title}</h2>

        <p className="source">
          Source:{" "}
          {item.source_name ||
            "Not specified"}
        </p>

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
            <h3>
              Possible Mains Question
            </h3>

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
            <strong>
              🔥 Premium Fact
            </strong>

            <p>{premium}</p>
          </div>
        )}

        <button
          className="important-button modal-important"
          disabled={importantLoading}
          onClick={() =>
            onImportant(item.id)
          }
        >
          {important
            ? "★ Remove from Important"
            : "⭐ Add to Important"}
        </button>
      </article>
    </div>
  );
}
