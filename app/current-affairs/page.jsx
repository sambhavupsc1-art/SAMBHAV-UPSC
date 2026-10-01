"use client";

import { useEffect, useMemo, useState } from "react";

const filters = [
  "Today",
  "GS-I",
  "GS-II",
  "GS-III",
  "GS-IV",
  "Prelims",
  "Mains",
  "Reports",
  "Schemes",
  "International",
  "Places",
  "Personalities",
];

export default function CurrentAffairsPage() {
  const [active, setActive] = useState("Today");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("hi");
  const [news, setNews] = useState([]);
  const [important, setImportant] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [importantLoading, setImportantLoading] = useState(false);
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

  const filteredNews = useMemo(() => {
    let result = news;

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((item) => {
        const searchable = [
          item.title,
          item.title_hi,
          item.title_en,
          item.subject,
          item.gs,
          item.paper,
          item.source_name,
          item.why_in_news,
          item.why_in_news_hi,
          item.why_in_news_en,
          item.key_facts,
          item.key_facts_hi,
          item.key_facts_en,
          item.tags,
          item.report_type,
          item.government_scheme,
          item.important_place,
          item.personalities,
          item.static_link,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    if (active === "Today") return result;

    if (active === "Prelims") {
      return result.filter(
        (item) =>
          item.prelims ||
          item.prelims_hi ||
          item.prelims_en ||
          item.prelims_mcq ||
          item.prelims_mcq_hi ||
          item.prelims_mcq_en
      );
    }

    if (active === "Mains") {
      return result.filter(
        (item) =>
          item.mains_analysis ||
          item.mains_analysis_hi ||
          item.mains_analysis_en ||
          item.mains_question ||
          item.mains_question_hi ||
          item.mains_question_en
      );
    }

    if (active === "Reports") {
      return result.filter(
        (item) =>
          item.report_type ||
          /report|index|survey|ranking|indicator/i.test(
            `${item.tags || ""} ${item.subject || ""} ${item.title || ""}`
          )
      );
    }

    if (active === "Schemes") {
      return result.filter(
        (item) =>
          item.government_scheme ||
          /scheme|yojana|mission|programme|program/i.test(
            `${item.tags || ""} ${item.subject || ""} ${item.title || ""}`
          )
      );
    }

    if (active === "International") {
      return result.filter(
        (item) =>
          item.gs === "GS-II" ||
          item.paper === "GS-II" ||
          /international|bilateral|multilateral|foreign|global|g20|un|summit|treaty|agreement/i.test(
            `${item.tags || ""} ${item.subject || ""} ${item.title || ""}`
          )
      );
    }

    if (active === "Places") {
      return result.filter((item) => item.important_place);
    }

    if (active === "Personalities") {
      return result.filter((item) => item.personalities);
    }

    if (active === "Important") {
      return result.filter((item) =>
        importantIds.includes(Number(item.id))
      );
    }

    return result.filter(
      (item) =>
        item.gs === active ||
        item.paper === active
    );
  }, [active, news, importantIds, search]);

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
      <section className="ca-header">
        <div>
          <p className="eyebrow">
            SAMBHAV UPSC
          </p>

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
            <span>
              Latest Update
            </span>

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
            <span>
              {hi ? "Monthly Magazine" : "Monthly Magazine"}
            </span>
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
            <span>
              {hi
                ? "Notifications"
                : "Notifications"}
            </span>
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
                🔔{" "}
                {hi
                  ? "Current Affairs Notification"
                  : "Current Affairs Notification"}
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
                {hi
                  ? "Notification Language"
                  : "Notification Language"}
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
                {hi
                  ? "Daily Notification Time"
                  : "Daily Notification Time"}
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
                  : hi
                  ? "Save Time"
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

      <section className="search-panel">
        <div className="search-box">
          <span className="search-icon">⌕</span>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              hi
                ? "Current Affairs खोजें — topic, subject, GS, scheme, report..."
                : "Search Current Affairs — topic, subject, GS, scheme, report..."
            }
          />

          {search && (
            <button
              className="clear-search"
              type="button"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        {search && (
          <div className="search-result-info">
            {hi
              ? `"${search}" के लिए ${filteredNews.length} परिणाम`
              : `${filteredNews.length} result(s) for "${search}"`}
          </div>
        )}
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

        <button
          className="filter refresh-filter"
          onClick={() => {
            loadCurrentAffairs();
            loadImportant();
          }}
          disabled={loading}
        >
          ↻ Refresh
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
                  expandedId={expandedId}
                  onExpand={setExpandedId}
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
          news={news}
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
                  expandedId={expandedId}
                  onExpand={setExpandedId}
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

      <style jsx>{`
        .ca-page {
          min-height: 100vh;
          background: #f6f7f9;
          color: #172033;
          padding: 28px 18px 60px;
          font-family: Arial, sans-serif;
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

        .ca-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          margin-bottom: 22px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .language-box,
        .date-card,
        .notification-button {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          padding: 13px 15px;
          box-shadow: 0 4px 16px
            rgba(16, 24, 40, 0.05);
        }

        .language-box > span {
          display: block;
          color: #667085;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .language-buttons {
          display: flex;
          gap: 5px;
        }

        .lang {
          border: 1px solid #dfe3e8;
          background: #fff;
          border-radius: 8px;
          padding: 7px 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .lang.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
        }

        .magazine-button {
          cursor: pointer;
          font-weight: 800;
          color: #fff;
          background: #172033;
          border: 1px solid #172033;
          border-radius: 16px;
          padding: 13px 15px;
          display: flex;
          gap: 7px;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px
            rgba(16, 24, 40, 0.08);
          white-space: nowrap;
        }

        .magazine-button:hover {
          background: #25304a;
          border-color: #25304a;
        }

        .notification-button {
          cursor: pointer;
          font-weight: 800;
          color: #172033;
          display: flex;
          gap: 7px;
          align-items: center;
          justify-content: center;
        }

        .notification-button:hover {
          background: #f8fafc;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin: 0 0 6px;
          color: #667085;
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 42px);
        }

        .sub {
          color: #667085;
          margin: 8px 0 0;
        }

        .date-card {
          min-width: 205px;
        }

        .date-card span,
        .date-card small {
          display: block;
          color: #667085;
          font-size: 12px;
        }

        .date-card strong {
          display: block;
          margin: 5px 0;
          font-size: 15px;
        }

        .notification-panel {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 18px;
          box-shadow: 0 8px 25px
            rgba(16, 24, 40, 0.07);
        }

        .notification-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .notification-title h2 {
          margin: 8px 0 5px;
          font-size: 21px;
        }

        .notification-title p {
          color: #667085;
          margin: 0;
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
          transition: 0.2s;
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
          border-radius: 14px;
          padding: 15px;
        }

        .setting-box label {
          display: block;
          font-size: 12px;
          color: #667085;
          font-weight: 700;
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
          border-radius: 9px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 700;
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
        }

        .search-panel {
          max-width: 1050px;
          margin: 0 auto 10px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #dfe3e8;
          border-radius: 14px;
          min-height: 48px;
          box-shadow: 0 4px 16px
            rgba(16, 24, 40, 0.04);
        }

        .search-icon {
          padding-left: 15px;
          color: #667085;
          font-size: 22px;
          line-height: 1;
        }

        .search-box input {
          flex: 1;
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          padding: 13px 12px;
          font-size: 14px;
          color: #172033;
        }

        .search-box input::placeholder {
          color: #98a2b3;
        }

        .clear-search {
          border: 0;
          background: transparent;
          color: #667085;
          font-size: 22px;
          cursor: pointer;
          padding: 8px 14px;
        }

        .search-result-info {
          color: #667085;
          font-size: 12px;
          margin-top: 7px;
          padding-left: 4px;
        }

        .filter-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 3px 0 18px;
        }

        .filter {
          border: 1px solid #dfe3e8;
          background: #fff;
          border-radius: 999px;
          padding: 10px 15px;
          min-height: 42px;
          white-space: nowrap;
          cursor: pointer;
        }

        .filter.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
        }

        .refresh-filter {
          font-weight: 800;
        }

        .refresh-filter:disabled {
          opacity: 0.6;
          cursor: wait;
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
          font-size: 23px;
        }

        .section-heading p {
          color: #667085;
          margin: 0;
        }

        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          padding: 5px 9px;
          border-radius: 999px;
          background: #eef2f6;
          color: #475467;
        }

        .news-list {
          display: grid;
          gap: 13px;
        }

        .news-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 4px 16px
            rgba(16, 24, 40, 0.04);
        }

        .topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .meta,
        .source {
          color: #667085;
          font-size: 12px;
        }

        .news-card h3 {
          margin: 10px 0 7px;
          font-size: 19px;
          line-height: 1.35;
        }

        .summary {
          color: #475467;
          line-height: 1.55;
          margin: 0 0 13px;
          white-space: pre-wrap;
        }

        .card-actions {
          display: flex;
          gap: 9px;
          align-items: center;
          flex-wrap: wrap;
        }

        .read-button,
        .important-button {
          border: 0;
          border-radius: 10px;
          padding: 10px 13px;
          cursor: pointer;
          font-weight: 700;
        }

        .read-button {
          background: #172033;
          color: #fff;
        }

        .important-button {
          background: #f3f4f6;
          color: #344054;
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
          border: 1px dashed #d0d5dd;
          border-radius: 16px;
          padding: 35px 20px;
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

        .fact-grid {
          max-width: 1050px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
        }

        .fact-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          padding: 17px;
        }

        .fact-card > span {
          font-size: 12px;
          color: #667085;
          font-weight: 700;
        }

        .fact-card h3 {
          font-size: 16px;
          margin: 9px 0;
        }

        .fact-card p {
          color: #475467;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .fact-card small {
          color: #667085;
        }

        .news-card.expanded {
          border-color: #cfd6e4;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
        }

        .inline-analysis {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e4e7ec;
          animation: analysisIn 0.2s ease-out;
        }

        @keyframes analysisIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 12px;
        }

        .analysis-kicker {
          display: block;
          color: #667085;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin-bottom: 5px;
        }

        .analysis-header h4 {
          margin: 0;
          font-size: 18px;
          line-height: 1.4;
          color: #172033;
        }

        .analysis-badge {
          flex-shrink: 0;
          border: 1px solid #e4e7ec;
          background: #f8fafc;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 800;
        }

        .inline-source {
          margin: 0 0 4px;
        }

        .analysis-block {
          padding: 15px 0;
          border-bottom: 1px solid #eef0f3;
        }

        .analysis-block h5 {
          margin: 0 0 7px;
          font-size: 14px;
          color: #172033;
        }

        .analysis-block .content-block {
          color: #475467;
          font-size: 14px;
          line-height: 1.7;
        }

        .inline-premium-box {
          margin-top: 16px;
          padding: 15px;
          border-radius: 14px;
          background: #fff9ed;
          border: 1px solid #f0d39b;
        }

        .premium-label {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin-bottom: 7px;
        }

        .analysis-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: grid;
          place-items: center;
          padding: 16px;
          z-index: 50;
        }

        .modal {
          width: min(760px, 100%);
          max-height: 90vh;
          overflow: auto;
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          position: relative;
        }

        .close {
          position: absolute;
          right: 15px;
          top: 10px;
          border: 0;
          background: transparent;
          font-size: 30px;
          cursor: pointer;
        }

        .modal h2 {
          margin: 12px 35px 5px 0;
        }

        .modal h3 {
          margin: 22px 0 8px;
        }

        .modal p {
          line-height: 1.65;
          color: #475467;
          white-space: pre-wrap;
        }

        .content-block {
          white-space: pre-wrap;
          color: #475467;
          line-height: 1.65;
        }

        .source-link {
          display: inline-block;
          margin-top: 8px;
          color: #175cd3;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .premium-box {
          margin: 20px 0;
          padding: 15px;
          border-radius: 13px;
          background: #fff7e8;
          border: 1px solid #f0d39b;
        }

        .premium-box p {
          margin-bottom: 0;
        }

        .modal-important {
          margin-top: 12px;
        }

        @media (max-width: 800px) {
          .ca-header {
            display: block;
          }

          .header-actions {
            margin-top: 15px;
          }

          .notification-grid {
            grid-template-columns: 1fr;
          }

          .fact-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .ca-page {
            padding: 20px 12px 45px;
          }

          .section-heading {
            display: block;
          }

          .section-heading p {
            margin-top: 8px;
          }

          .topline {
            display: block;
          }

          .meta {
            display: block;
            margin-top: 7px;
          }

          .date-card,
          .language-box,
          .notification-button {
            width: 100%;
          }

          .language-buttons {
            width: 100%;
          }

          .lang {
            flex: 1;
          }

          .notification-info {
            display: block;
          }

          .notification-info span {
            display: block;
            margin-top: 5px;
          }

          .setting-box input {
            width: 100%;
            margin: 0 0 8px;
          }

          .save-time {
            width: 100%;
          }

          .notification-title {
            align-items: flex-start;
          }
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
  expandedId,
  onExpand,
  formatDate,
  disabled,
}) {
  const hi = language === "hi";
  const expanded = Number(expandedId) === Number(item.id);

  const title =
    (hi ? item.title_hi : item.title_en) ||
    item.title ||
    (hi ? item.title_en : item.title_hi) ||
    "Current Affair";

  const summary =
    (hi ? item.why_in_news_hi : item.why_in_news_en) ||
    item.why_in_news ||
    (hi ? item.background_hi : item.background_en) ||
    item.background ||
    item.key_facts ||
    "";

  return (
    <article className={expanded ? "news-card expanded" : "news-card"}>
      <div className="topline">
        <span className="badge">
          {item.gs || item.paper || "UPSC"}
        </span>

        <span className="meta">
          {item.subject || "UPSC Current Affairs"} • {formatDate(item.date)}
        </span>
      </div>

      <h3>{title}</h3>

      {summary && <p className="summary">{summary}</p>}

      <div className="card-actions">
        <button
          className="read-button"
          onClick={() =>
            onExpand(expanded ? null : item.id)
          }
          aria-expanded={expanded}
        >
          {expanded
            ? hi
              ? "Analysis बंद करें ↑"
              : "Close Analysis ↑"
            : hi
            ? "पूरा Analysis पढ़ें ↓"
            : "Read Full Analysis ↓"}
        </button>

        <button
          className="important-button"
          disabled={disabled}
          onClick={() => onImportant(item.id)}
        >
          {important ? "★ Important" : "⭐ Add to Important"}
        </button>

        <span className="source">
          Source: {item.source_name || "Not specified"}
        </span>
      </div>

      {expanded && (
        <ArticleAnalysis
          item={item}
          language={language}
          important={important}
          importantLoading={disabled}
          onImportant={onImportant}
        />
      )}
    </article>
  );
}

function ArticleAnalysis({
  item,
  language,
  important,
  importantLoading,
  onImportant,
}) {
  const hi = language === "hi";

  const title =
    (hi ? item.title_hi : item.title_en) ||
    item.title ||
    (hi ? item.title_en : item.title_hi) ||
    "Current Affair";

  const why =
    (hi ? item.why_in_news_hi : item.why_in_news_en) ||
    item.why_in_news;
  const background =
    (hi ? item.background_hi : item.background_en) ||
    item.background;
  const facts =
    (hi ? item.key_facts_hi : item.key_facts_en) ||
    item.key_facts;
  const prelims =
    (hi ? item.prelims_hi : item.prelims_en) ||
    item.prelims;
  const mains =
    (hi ? item.mains_analysis_hi : item.mains_analysis_en) ||
    item.mains_analysis;
  const premium =
    (hi ? item.premium_fact_hi : item.premium_fact_en) ||
    item.premium_fact;
  const pyqs =
    (hi ? item.related_pyqs_hi : item.related_pyqs_en) ||
    item.related_pyqs;
  const mcq =
    (hi ? item.prelims_mcq_hi : item.prelims_mcq_en) ||
    item.prelims_mcq;
  const mainsQuestion =
    (hi ? item.mains_question_hi : item.mains_question_en) ||
    item.mains_question;
  const ethics =
    (hi ? item.ethics_angle_hi : item.ethics_angle_en) ||
    "";

  return (
    <div className="inline-analysis">
      <div className="analysis-header">
        <div>
          <span className="analysis-kicker">
            {hi ? "DETAILED UPSC ANALYSIS" : "DETAILED UPSC ANALYSIS"}
          </span>
          <h4>{title}</h4>
        </div>
        <span className="analysis-badge">
          {item.gs || item.paper || "UPSC"}
        </span>
      </div>

      {item.source_url && (
        <a
          className="source-link inline-source"
          href={item.source_url}
          target="_blank"
          rel="noreferrer"
        >
          {hi ? "Original Source देखें ↗" : "View Original Source ↗"}
        </a>
      )}

      {why && <AnalysisBlock title={hi ? "Why in News" : "Why in News"} text={why} />}
      {background && <AnalysisBlock title={hi ? "Background" : "Background"} text={background} />}
      {facts && <AnalysisBlock title={hi ? "Key Facts" : "Key Facts"} text={facts} />}
      {prelims && <AnalysisBlock title={hi ? "Prelims" : "Prelims"} text={prelims} />}
      {mains && <AnalysisBlock title={hi ? "Mains Analysis" : "Mains Analysis"} text={mains} />}
      {item.static_link && <AnalysisBlock title={hi ? "Static Link" : "Static Link"} text={item.static_link} />}
      {pyqs && <AnalysisBlock title={hi ? "Related PYQs" : "Related PYQs"} text={pyqs} />}
      {mcq && <AnalysisBlock title={hi ? "Possible Prelims MCQ" : "Possible Prelims MCQ"} text={mcq} />}
      {mainsQuestion && <AnalysisBlock title={hi ? "Possible Mains Question" : "Possible Mains Question"} text={mainsQuestion} />}
      {ethics && <AnalysisBlock title={hi ? "GS-IV Ethics" : "GS-IV Ethics"} text={ethics} />}

      {premium && (
        <div className="inline-premium-box">
          <div className="premium-label">🔥 PREMIUM FACT</div>
          <div className="content-block">{premium}</div>
        </div>
      )}

      <div className="analysis-footer">
        <button
          className="important-button"
          disabled={importantLoading}
          onClick={() => onImportant(item.id)}
        >
          {important
            ? "★ Remove from Important"
            : "⭐ Add to Important"}
        </button>
      </div>
    </div>
  );
}

function AnalysisBlock({ title, text }) {
  return (
    <section className="analysis-block">
      <h5>{title}</h5>
      <div className="content-block">{text}</div>
    </section>
  );
}

function PremiumFacts({
  news,
  language,
  hi,
}) {
  const facts = news.filter(
    (item) =>
      item.premium_fact_hi ||
      item.premium_fact_en ||
      item.premium_fact
  );

  return (
    <section className="special-section">
      <div className="section-heading">
        <div>
          <span className="badge">
            PREMIUM
          </span>

          <h2>🔥 Premium Facts</h2>
        </div>

        <p>
          {hi
            ? "Mains में उपयोग होने वाले high-value facts"
            : "High-value facts for UPSC Mains"}
        </p>
      </div>

      {facts.length === 0 ? (
        <div className="empty">
          {hi
            ? "अभी Premium Facts उपलब्ध नहीं हैं।"
            : "No Premium Facts available yet."}
        </div>
      ) : (
        <div className="fact-grid">
          {facts.map((item) => {
            const fact =
              (hi
                ? item.premium_fact_hi
                : item.premium_fact_en) ||
              item.premium_fact;

            return (
              <article
                className="fact-card"
                key={item.id}
              >
                <span>
                  {item.gs ||
                    item.paper ||
                    "UPSC"}
                </span>

                <h3>
                  {hi
                    ? item.title_hi ||
                      item.title
                    : item.title_en ||
                      item.title}
                </h3>

                <p>{fact}</p>

                <small>
                  Source:{" "}
                  {item.source_name ||
                    "Official Source"}
                </small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

