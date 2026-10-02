"use client";

import { useEffect, useMemo, useState } from "react";

const filters = [
  "Today",
  "GS-I",
  "GS-II",
  "GS-III",
  "GS-IV",
  "Prelims",
];

export default function CurrentAffairsPage() {
  const [active, setActive] = useState("Today");
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

  const filteredNews = useMemo(() => {
    if (active === "Today") return news;

    if (active === "Prelims") {
      return news.filter(
        (item) =>
          item.prelims ||
          item.prelims_hi ||
          item.prelims_en ||
          item.prelims_mcq ||
          item.prelims_mcq_hi ||
          item.prelims_mcq_en
      );
    }

    if (active === "Important") {
      return news.filter((item) =>
        importantIds.includes(Number(item.id))
      );
    }

    return news.filter(
      (item) =>
        item.gs === active ||
        item.paper === active
    );
  }, [active, news, importantIds]);

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

      <style jsx>{`
        .ca-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(30, 64, 175, 0.08),
              transparent 32%
            ),
            linear-gradient(
              180deg,
              #f8fafc 0%,
              #f1f5f9 100%
            );
          color: #172033;
          padding: 30px 18px 84px;
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

        .ca-header {
          display: flex;
          justify-content: space-between;
          gap: 22px;
          align-items: center;
          margin-bottom: 22px;
          padding: 24px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.98),
              rgba(248, 250, 252, 0.96)
            );
          border: 1px solid #dfe5ec;
          border-radius: 24px;
          box-shadow:
            0 16px 45px rgba(15, 23, 42, 0.07),
            0 2px 8px rgba(15, 23, 42, 0.03);
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
          border: 1px solid #dfe5ec;
          border-radius: 16px;
          padding: 13px 15px;
          box-shadow:
            0 5px 18px rgba(16, 24, 40, 0.05);
        }

        .language-box > span {
          display: block;
          color: #667085;
          font-size: 12px;
          margin-bottom: 7px;
          font-weight: 700;
        }

        .language-buttons {
          display: flex;
          gap: 5px;
        }

        .lang {
          border: 1px solid #dfe3e8;
          background: #fff;
          border-radius: 9px;
          padding: 7px 10px;
          cursor: pointer;
          font-weight: 800;
        }

        .lang.active {
          background: #172033;
          color: #fff;
          border-color: #172033;
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

        .eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin: 0 0 7px;
          color: #667085;
        }

        h1 {
          margin: 0;
          font-size: clamp(30px, 5vw, 44px);
          line-height: 1.05;
          letter-spacing: -0.035em;
          font-weight: 950;
        }

        .sub {
          color: #667085;
          margin: 10px 0 0;
          font-size: 14px;
          line-height: 1.55;
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
          font-weight: 900;
        }

        .notification-panel {
          background: #fff;
          border: 1px solid #dfe5ec;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 18px;
          box-shadow:
            0 12px 30px rgba(16, 24, 40, 0.07);
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
          font-weight: 900;
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
          background: #fbfcfd;
        }

        .setting-box label {
          display: block;
          font-size: 12px;
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
          padding: 3px 0 20px;
          scrollbar-width: none;
        }

        .filter-row::-webkit-scrollbar {
          display: none;
        }

        .filter {
          border: 1px solid #dfe3e8;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 999px;
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
          letter-spacing: -0.02em;
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
          background:
            linear-gradient(
              145deg,
              #ffffff 0%,
              #fbfcfe 100%
            );
          border: 1px solid #dfe5ec;
          border-radius: 22px;
          padding: 21px;
          box-shadow:
            0 10px 28px rgba(15, 23, 42, 0.055),
            0 2px 5px rgba(15, 23, 42, 0.025);
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
        }

        .read-button {
          background:
            linear-gradient(
              135deg,
              #172033,
              #273449
            );
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
          box-shadow:
            0 10px 28px rgba(15, 23, 42, 0.05);
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

        .fact-grid {
          max-width: 1050px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .fact-card {
          background:
            linear-gradient(
              145deg,
              #fff,
              #fbfcfe
            );
          border: 1px solid #dfe5ec;
          border-radius: 20px;
          padding: 19px;
          box-shadow:
            0 9px 24px rgba(15, 23, 42, 0.055);
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

        /*
          IMPORTANT:
          Analysis is now rendered INSIDE the clicked ArticleCard.
          These styles replace the old full-screen modal behavior
          for the inline analysis.
        */

        .inline-analysis {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #e4e7ec;
        }

        .inline-analysis-card {
          width: 100%;
          max-height: none;
          overflow: visible;
          background:
            linear-gradient(
              180deg,
              #ffffff,
              #fbfcfe
            );
          border: 1px solid #dfe5ec;
          border-radius: 18px;
          padding: 20px;
          box-shadow:
            0 10px 28px rgba(15, 23, 42, 0.07);
        }

        .inline-analysis-card .close {
          float: right;
          width: 36px;
          height: 36px;
          border: 1px solid #dfe5ec;
          border-radius: 10px;
          background: #f8fafc;
          color: #475467;
          font-size: 24px;
          line-height: 1;
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
          font-size: 16px;
          font-weight: 900;
          color: #172033;
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
          background:
            linear-gradient(
              135deg,
              #fff9eb,
              #fff4d6
            );
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
            padding: 18px 12px 55px;
          }

          .ca-header {
            padding: 19px;
            border-radius: 20px;
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
            margin-top: 8px;
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

          .news-card {
            padding: 17px;
            border-radius: 19px;
          }

          .news-card h3 {
            font-size: 20px;
          }

          .card-actions {
            align-items: stretch;
          }

          .read-button,
          .important-button {
            flex: 1;
          }

          .source {
            width: 100%;
          }

          .inline-analysis {
            margin-top: 15px;
            padding-top: 15px;
          }

          .inline-analysis-card {
            padding: 17px;
            border-radius: 16px;
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
        <span className="badge">
          {item.gs ||
            item.paper ||
            "UPSC"}
        </span>

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

  const prelimsFacts = news.filter(
    (item) =>
      item.prelims_hi ||
      item.prelims_en ||
      item.prelims
  );

  const mainsFacts = news.filter(
    (item) =>
      item.premium_fact_hi ||
      item.premium_fact_en ||
      item.premium_fact
  );

  function getPrelimsFact(item) {
    const text =
      (hi
        ? item.prelims_hi
        : item.prelims_en) ||
      item.prelims ||
      "";

    return text
      .split(/[.!?]\s+/)[0]
      .slice(0, 170);
  }

  function getMainsFact(item) {
    return (
      (hi
        ? item.premium_fact_hi
        : item.premium_fact_en) ||
      item.premium_fact ||
      ""
    );
  }

  const facts =
    tab === "prelims"
      ? prelimsFacts
      : mainsFacts;

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
            ? "Prelims + Mains के high-value facts"
            : "High-value facts for UPSC"}
        </p>
      </div>

      <div
        className="premium-fact-tabs"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 15,
        }}
      >
        <button
          className={
            tab === "prelims"
              ? "setting-btn active"
              : "setting-btn"
          }
          onClick={() =>
            setTab("prelims")
          }
        >
          Prelims
        </button>

        <button
          className={
            tab === "mains"
              ? "setting-btn active"
              : "setting-btn"
          }
          onClick={() =>
            setTab("mains")
          }
        >
          Mains
        </button>
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
              tab === "prelims"
                ? getPrelimsFact(item)
                : getMainsFact(item);

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
