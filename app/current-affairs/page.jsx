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
                  onOpen={(article) =>
                    setSelected((prev) =>
                      prev?.id === article.id ? null : article
                    )
                  }
                  expanded={selected?.id === item.id}
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
                  onOpen={(article) =>
                    setSelected((prev) =>
                      prev?.id === article.id ? null : article
                    )
                  }
                  expanded={selected?.id === item.id}
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
        .ca-page{min-height:100vh;background:linear-gradient(180deg,#f7f8fa 0%,#eef1f5 100%);color:#121a2a;padding:clamp(14px,3vw,30px) clamp(12px,3vw,24px) 70px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;box-sizing:border-box;overflow-x:hidden}
        .ca-page *{box-sizing:border-box}
        .ca-page button,.ca-page input{font-family:inherit;-webkit-appearance:none;appearance:none}
        .ca-header,.filter-row,.news-list,.special-section,.section-heading,.notification-panel{width:100%;max-width:1120px;margin-left:auto;margin-right:auto}

        .ca-header{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;padding:24px 24px 22px;margin-bottom:16px;background:rgba(255,255,255,.94);border:1px solid #e2e6ec;border-radius:24px;box-shadow:0 12px 35px rgba(16,24,40,.055)}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:9px;font-weight:950;letter-spacing:.18em;margin:0 0 10px;color:#7b8492}.eyebrow:before{content:"";width:26px;height:2px;background:#172033;border-radius:2px}
        h1{margin:0;font-size:clamp(30px,5vw,46px);line-height:1.02;letter-spacing:-.045em;font-weight:950;color:#111827}.sub{color:#707a89;margin:10px 0 0;max-width:650px;line-height:1.55;font-size:13px;font-weight:560}
        .header-actions{display:grid;grid-template-columns:auto auto auto;gap:8px;align-items:stretch}.language-box,.date-card,.notification-button{background:#fff;border:1px solid #e1e5eb;border-radius:15px;box-shadow:0 4px 16px rgba(16,24,40,.035)}
        .language-box{padding:9px}.language-box>span{display:block;color:#9aa2ae;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;margin:1px 4px 6px}.language-buttons{display:flex;gap:4px}.lang{border:0;background:#f5f6f8;color:#707987;border-radius:9px;padding:8px 11px;cursor:pointer;font-size:10px;font-weight:850;transition:.18s}.lang:hover{color:#172033}.lang.active{background:#172033;color:#fff;box-shadow:0 4px 10px rgba(23,32,51,.18)}
        .date-card{min-width:175px;padding:10px 13px}.date-card span,.date-card small{display:block;color:#9aa2ae;font-size:8px;font-weight:850;letter-spacing:.05em}.date-card strong{display:block;margin:4px 0 3px;font-size:13px;color:#1b2434}.notification-button{cursor:pointer;font-weight:900;color:#172033;display:flex;gap:7px;align-items:center;justify-content:center;padding:0 14px;font-size:10px;transition:.18s}.notification-button:hover{border-color:#cbd2dc;transform:translateY(-1px);box-shadow:0 7px 18px rgba(16,24,40,.07)}

        .notification-panel{background:#fff;border:1px solid #e0e5eb;border-radius:20px;padding:20px;margin-bottom:16px;box-shadow:0 14px 38px rgba(16,24,40,.07)}.notification-title{display:flex;justify-content:space-between;align-items:center;gap:20px}.notification-title h2{margin:8px 0 5px;font-size:20px}.notification-title p{color:#667085;margin:0;font-size:12px}.badge{display:inline-flex;align-items:center;gap:5px;font-size:8px;font-weight:950;letter-spacing:.1em;padding:5px 8px;border-radius:7px;background:#f0f2f5;color:#596273}.badge:before{content:"";width:4px;height:4px;border-radius:50%;background:#8b95a5}.premium-badge{background:#f3f0f5;color:#6b3a50}.premium-badge:before{background:#7b3f5d}
        .switch{width:52px;height:29px;border:0;border-radius:999px;background:#d8dde5;padding:3px;cursor:pointer;flex-shrink:0}.switch span{display:block;width:23px;height:23px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.15);transition:.2s}.switch.on{background:#172033}.switch.on span{transform:translateX(23px)}.notification-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:18px}.setting-box{border:1px solid #e7eaf0;border-radius:14px;padding:15px;background:#fbfcfd}.setting-box label{display:block;font-size:10px;color:#667085;font-weight:850;margin-bottom:9px}.setting-buttons{display:flex;gap:7px}.setting-btn,.save-time{border:1px solid #dfe3e8;background:#fff;border-radius:9px;padding:9px 12px;cursor:pointer;font-weight:800;font-size:11px}.setting-btn.active,.save-time{background:#172033;color:#fff;border-color:#172033}.setting-box input{border:1px solid #dfe3e8;border-radius:9px;padding:9px;font-size:14px;margin-right:7px;background:#fff}.notification-info{display:flex;justify-content:space-between;gap:10px;margin-top:13px;padding:11px 13px;border-radius:10px;background:#f5f7fa;font-size:12px}.notification-info span{color:#667085}.notification-message{margin-top:10px;font-size:12px;color:#175cd3}

        .filter-row{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 18px;scrollbar-width:none}.filter-row::-webkit-scrollbar{display:none}.filter{border:1px solid #dfe4eb;background:rgba(255,255,255,.9);color:#687384;border-radius:12px;padding:10px 14px;min-height:40px;white-space:nowrap;cursor:pointer;font-size:10px;font-weight:900;transition:.18s;box-shadow:0 2px 7px rgba(16,24,40,.025)}.filter:hover{border-color:#c5ccd6;color:#172033;transform:translateY(-1px)}.filter.active{background:#121a2a;color:#fff;border-color:#121a2a;box-shadow:0 7px 17px rgba(18,26,42,.18)}.filter.important.active{background:#735815;border-color:#735815}.filter.premium.active{background:#55283d;border-color:#55283d}

        .section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:15px;margin-bottom:13px;padding:0 2px}.section-heading h2{margin:8px 0 0;font-size:clamp(22px,3vw,28px);letter-spacing:-.035em;color:#121a2a}.section-heading p{color:#8a93a1;margin:0;font-size:10px;font-weight:800}.premium-heading{align-items:flex-end}.premium-subtitle{margin-top:7px!important;color:#8a93a1!important;font-size:11px!important;font-weight:600!important}

        .news-list{display:grid;gap:12px}
        .news-card{position:relative;background:rgba(255,255,255,.98);border:1px solid #dfe4ea;border-radius:20px;padding:19px 20px 17px;box-shadow:0 7px 24px rgba(16,24,40,.055);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;overflow:hidden}
        .news-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#172033,#68748a);opacity:0;transition:.2s}.news-card:hover{transform:translateY(-2px);border-color:#cfd6df;box-shadow:0 14px 32px rgba(16,24,40,.085)}.news-card:hover:before{opacity:1}.news-card.is-expanded{border-color:#bfc8d4;border-bottom-left-radius:0;border-bottom-right-radius:0;box-shadow:0 10px 25px rgba(16,24,40,.075);transform:none}
        .topline{display:flex;justify-content:space-between;gap:12px;align-items:center}.meta,.source{color:#8a93a1;font-size:9px;font-weight:700}.news-card h3{margin:12px 0 9px;font-size:clamp(19px,2.25vw,23px);line-height:1.4;letter-spacing:-.028em;font-weight:900;color:#101827}.summary{color:#4f5b6b;line-height:1.7;margin:0 0 16px;white-space:pre-wrap;font-size:13px;font-weight:540;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}

        .card-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-top:13px;border-top:1px solid #edf0f3}.read-button,.important-button{border:1px solid transparent;border-radius:12px;min-height:43px;padding:0 14px;cursor:pointer;font-weight:900;font-size:10px;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .18s,box-shadow .18s,background .18s,border-color .18s;color:#fff;outline:none}.read-button{background:linear-gradient(135deg,#111827 0%,#263249 100%);box-shadow:0 7px 17px rgba(17,24,39,.18)}.read-button:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(17,24,39,.23)}.read-button.open{background:linear-gradient(135deg,#29364d,#121a2a)}.button-icon{width:20px;height:20px;border-radius:7px;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:11px}.button-arrow{font-size:15px;line-height:1;opacity:.75;transition:transform .18s}.read-button:hover .button-arrow{transform:translateX(3px)}
        .important-button{background:#fff;color:#4c5666;border-color:#d8dee6;box-shadow:0 3px 9px rgba(16,24,40,.04)}.important-button:hover{background:#f7f8fa;border-color:#c7ced8;transform:translateY(-1px);box-shadow:0 7px 15px rgba(16,24,40,.07)}.important-button.saved{background:linear-gradient(135deg,#fff9ea,#f7efd9);border-color:#e8d29a;color:#735614;box-shadow:0 5px 14px rgba(115,86,20,.09)}.bookmark-icon{width:19px;height:20px;display:grid;place-items:center}.bookmark-icon svg{width:19px;height:20px;stroke:currentColor;stroke-width:1.7;stroke-linejoin:round}.important-button.saved .bookmark-icon svg{filter:drop-shadow(0 1px 1px rgba(115,86,20,.15));stroke-width:1.45}.important-button:disabled,.setting-btn:disabled,.save-time:disabled{opacity:.6;cursor:wait}.source{margin-left:auto;max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

        .inline-analysis{margin:-1px 0 12px;border:1px solid #cfd7e1;border-top:0;border-radius:0 0 20px 20px;background:linear-gradient(180deg,#fbfcfd 0%,#f7f9fb 100%);box-shadow:0 12px 27px rgba(16,24,40,.075);overflow:hidden;scroll-margin-top:18px;animation:analysisIn .22s ease}
        @keyframes analysisIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .inline-analysis-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:22px 22px 20px;border-bottom:1px solid #e5e9ee;background:linear-gradient(135deg,#f1f4f8 0%,#ffffff 62%,#f8fafc 100%)}
        .analysis-kicker{display:inline-flex;align-items:center;gap:8px;font-size:8px;font-weight:950;letter-spacing:.18em;color:#647084}.analysis-kicker:before{content:"";width:25px;height:3px;background:linear-gradient(90deg,#111827,#7b8798);border-radius:99px}
        .inline-analysis-head h3{margin:10px 0 6px;font-size:clamp(20px,2.6vw,27px);line-height:1.32;letter-spacing:-.032em;color:#101827;font-weight:900}.inline-analysis-head p{margin:0;color:#8993a2;font-size:9px;font-weight:750}
        .analysis-close{border:1px solid #d6dde6;background:#fff;color:#273142;border-radius:12px;min-height:39px;padding:0 12px;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-size:9px;font-weight:900;transition:.18s;box-shadow:0 4px 12px rgba(16,24,40,.055)}.analysis-close span{font-size:17px;line-height:1}.analysis-close:hover{background:#f3f5f8;border-color:#c5ced9;transform:translateY(-1px);box-shadow:0 8px 18px rgba(16,24,40,.08)}
        .inline-analysis-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px;background:linear-gradient(180deg,#f8fafc,#f5f7fa)}
        .inline-analysis-section{position:relative;border:1px solid #dde3ea;background:#fff;border-radius:16px;padding:17px 18px 18px;min-width:0;box-shadow:0 5px 16px rgba(16,24,40,.045);overflow:hidden;transition:.18s}.inline-analysis-section:hover{border-color:#cbd4df;box-shadow:0 9px 22px rgba(16,24,40,.07)}
        .inline-analysis-section:after{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#cbd3de}.inline-analysis-section.highlight{grid-column:1/-1;background:linear-gradient(135deg,#eef2f6,#fff);border-color:#d2dbe5}.inline-analysis-section.highlight:after{background:linear-gradient(180deg,#172033,#6d7889)}
        .inline-analysis-label{display:flex;align-items:center;gap:8px;font-size:8px;font-weight:950;letter-spacing:.11em;color:#697586;margin:0 0 10px;text-transform:uppercase}.inline-analysis-label:before{content:"";width:22px;height:22px;display:grid;place-items:center;border-radius:7px;background:#f0f2f5;box-shadow:inset 0 0 0 1px #e3e7ec}.inline-analysis-content{color:#303b4c;font-size:13px;line-height:1.78;white-space:pre-wrap;font-weight:560}
        .inline-analysis-section.prelims{border-color:#dbe1e8;background:linear-gradient(180deg,#fff,#fbfcfd)}.inline-analysis-section.prelims:after{background:linear-gradient(180deg,#7b8797,#c7ced8)}.inline-analysis-section.mains{border-color:#cfd7e2;background:linear-gradient(180deg,#fff,#f8fafc)}.inline-analysis-section.mains:after{background:linear-gradient(180deg,#172033,#667386)}.inline-analysis-section.pyq{background:#fbfcfe}.inline-analysis-section.ethics{background:linear-gradient(135deg,#fbfaf7,#fff);border-color:#e7dfd0}.inline-analysis-section.ethics:after{background:linear-gradient(180deg,#9a845e,#d6c5a3)}
        .inline-analysis-section.prelims .inline-analysis-label:before{content:"P";color:#566273;font-size:9px;font-weight:950}.inline-analysis-section.mains .inline-analysis-label:before{content:"M";color:#172033;font-size:9px;font-weight:950}.inline-analysis-section.pyq .inline-analysis-label:before{content:"Q";color:#566273;font-size:9px;font-weight:950}.inline-analysis-section.ethics .inline-analysis-label:before{content:"E";color:#806c4b;font-size:9px;font-weight:950}.inline-analysis-section.highlight .inline-analysis-label:before{content:"•";color:#172033;font-size:15px;line-height:1}
        .inline-analysis-section.question-card{grid-column:1/-1;background:linear-gradient(135deg,#101827 0%,#1d2a3f 58%,#26354c 100%);border:1px solid #26364d;border-radius:18px;position:relative;padding:21px 22px 22px;box-shadow:0 12px 28px rgba(16,24,40,.16);overflow:hidden}.inline-analysis-section.question-card:after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#d7b86a,#f0d99b)}.inline-analysis-section.question-card:before{content:"PRELIMS • MCQ";position:absolute;right:16px;top:15px;font-size:7px;letter-spacing:.16em;font-weight:950;color:#f5dfaa;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);padding:6px 8px;border-radius:7px}.inline-analysis-section.question-card .inline-analysis-label{color:#f0d99b;font-size:8px;letter-spacing:.12em;padding-right:105px}.inline-analysis-section.question-card .inline-analysis-label:before{content:"?";color:#101827;background:#e9cc84;font-size:11px;font-weight:950}.inline-analysis-section.question-card .inline-analysis-content{font-size:clamp(15px,2vw,18px);line-height:1.72;color:#fff;font-weight:780;letter-spacing:-.008em;padding-right:12px}
        .inline-analysis-section.mains-question{background:linear-gradient(135deg,#fff 0%,#f3f6f9 100%);border-color:#cfd7e2;box-shadow:0 9px 23px rgba(16,24,40,.075)}.inline-analysis-section.mains-question:after{background:linear-gradient(180deg,#172033,#6b7788)}.inline-analysis-section.mains-question:before{content:"MAINS • ANSWER READY";color:#3d495a;background:#e8edf2;border-color:#d9e0e7}.inline-analysis-section.mains-question .inline-analysis-label{color:#172033}.inline-analysis-section.mains-question .inline-analysis-label:before{content:"M";color:#fff;background:#172033;font-size:9px}.inline-analysis-section.mains-question .inline-analysis-content{font-size:clamp(15px,2vw,18px);line-height:1.75;color:#172033;font-weight:780;letter-spacing:-.006em}
        .inline-premium-box{grid-column:1/-1;border:1px solid #e3c985;border-radius:17px;padding:18px;background:linear-gradient(135deg,#fff8e8 0%,#fffdf7 100%);box-shadow:0 9px 23px rgba(113,86,26,.08);position:relative;overflow:hidden}.inline-premium-box:after{content:"";position:absolute;right:-40px;top:-40px;width:110px;height:110px;border-radius:50%;background:rgba(218,183,94,.11)}.inline-premium-title{display:flex;align-items:center;gap:8px;font-size:9px;color:#806631;letter-spacing:.11em;text-transform:uppercase}.inline-premium-title span{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:#f3dfad;color:#70551e;font-size:13px}.inline-premium-box p{margin:11px 0 0;color:#3e3526;font-size:13px;line-height:1.76;font-weight:560}
        .inline-analysis-footer{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:13px 16px 16px;border-top:1px solid #e3e8ed;background:#fff}.inline-analysis-footer .important-button{min-height:42px}.inline-source-link{margin-left:auto}
        .fact-grid{max-width:1120px;margin:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.fact-card{background:#fff;border:1px solid #e2e6ec;border-radius:17px;padding:17px;box-shadow:0 6px 20px rgba(16,24,40,.045);transition:.2s}.fact-card:hover{transform:translateY(-2px);box-shadow:0 11px 27px rgba(16,24,40,.075)}.premium-facts-section{margin-top:4px}.premium-count{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 9px;border-radius:8px;background:#f1f2f5;color:#667085;font-size:8px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.premium-fact-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;max-width:540px;margin:0 0 17px;padding:5px;background:#e9edf1;border:1px solid #dfe3e8;border-radius:14px}.premium-fact-tab{border:0;background:transparent;color:#707987;border-radius:10px;padding:11px 13px;cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;transition:.18s}.premium-fact-tab:hover{background:#f7f8fa;color:#273142}.premium-fact-tab.active{background:#121a2a;color:#fff;box-shadow:0 6px 15px rgba(18,26,42,.15)}.premium-fact-tab .tab-icon{width:26px;height:26px;display:grid;place-items:center;border-radius:8px;background:rgba(255,255,255,.14);font-size:10px}.premium-fact-tab:not(.active) .tab-icon{background:#fff}.premium-fact-tab strong{display:block;font-size:10px;letter-spacing:.05em}.premium-fact-tab small{display:block;margin-top:2px;font-size:8px;opacity:.72;font-weight:650}.premium-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.premium-fact-card{padding:16px}.premium-card-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.premium-number{color:#a0a7b2!important;font-size:10px!important;font-weight:900!important;letter-spacing:.05em}.premium-gs{display:inline-flex!important;padding:4px 8px;border-radius:6px;background:#f4f5f7;color:#697382!important;font-size:8px!important;font-weight:900!important;letter-spacing:.04em}.premium-fact-card h3{font-size:15px;line-height:1.42;margin:0 0 11px;color:#172033}.premium-fact-content{display:flex;align-items:flex-start;gap:9px;padding:11px 12px;border-radius:10px;background:#f8f9fb;border:1px solid #eef0f3}.premium-fact-icon{flex:0 0 auto;margin-top:3px;color:#172033;font-size:8px}.premium-fact-content p{margin:0!important;color:#4e596a!important;line-height:1.55!important;font-size:12px!important;white-space:normal!important}.prelims-fact-card .premium-fact-content p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}.mains-fact-card .premium-fact-content p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;line-clamp:4;overflow:hidden}.premium-card-footer{margin-top:10px;padding-top:9px;border-top:1px solid #eef0f3}.premium-card-footer span{color:#98a0ad;font-size:9px;font-weight:650}.premium-empty{padding:48px 20px}.premium-empty-icon{font-size:22px;margin-bottom:7px;color:#98a0ad}

        .modal-backdrop{position:fixed;inset:0;background:rgba(8,15,28,.62);backdrop-filter:blur(5px);display:grid;place-items:center;padding:16px;z-index:50}.modal{width:min(820px,100%);max-height:91vh;overflow:auto;background:#f8fafc;border:1px solid rgba(255,255,255,.25);border-radius:22px;padding:0;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.25)}.modal-head{padding:24px 26px 20px;background:#172033;color:#fff}.modal-head .badge{background:rgba(255,255,255,.12);color:#fff}.modal-head .badge:before{background:#fff}.modal-head h2{margin:12px 38px 6px 0;font-size:24px;line-height:1.3;letter-spacing:-.025em}.modal-head .source{color:#b8c0cd}.modal-body{padding:8px 26px 26px}.close{position:absolute;right:16px;top:15px;width:35px;height:35px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;border-radius:10px;font-size:22px;line-height:1;cursor:pointer;z-index:2}.modal-section{background:#fff;border:1px solid #e3e7ed;border-radius:14px;padding:15px 16px;margin-top:13px}.modal-section h3{margin:0 0 8px;font-size:12px;color:#172033;text-transform:uppercase;letter-spacing:.06em}.modal p{line-height:1.65;color:#596273;white-space:pre-wrap;font-size:13px}.content-block{white-space:pre-wrap;color:#596273;line-height:1.65;font-size:13px}.source-link{display:inline-flex;margin-top:8px;color:#fff;font-size:10px;font-weight:900;text-decoration:none;background:#172033;border:1px solid #172033;padding:9px 11px;border-radius:9px}.premium-box{margin:13px 0;padding:16px;border-radius:14px;background:#fff8e9;border:1px solid #efd69e}.premium-box p{margin-bottom:0}.modal-footer{padding:14px 26px 22px}.modal-important{margin-top:0;width:100%}

        @media(max-width:900px){.ca-header{display:block}.header-actions{margin-top:17px;grid-template-columns:repeat(3,minmax(0,1fr))}.inline-analysis-grid{grid-template-columns:1fr}.inline-analysis-section.highlight,.inline-analysis-section.question-card,.inline-premium-box{grid-column:auto}.inline-source-link{margin-left:0}.fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:650px){.ca-page{padding:12px 10px 48px}.ca-header{padding:19px 16px 17px;border-radius:20px;margin-bottom:13px}.ca-header h1{font-size:31px}.sub{font-size:12px}.header-actions{grid-template-columns:1fr;gap:7px}.date-card,.language-box,.notification-button{width:100%}.notification-button{min-height:46px}.filter-row{gap:6px;padding-bottom:14px}.filter{min-height:38px;padding:9px 12px;border-radius:11px}.section-heading{display:block;margin-bottom:11px}.section-heading p{margin-top:7px}.premium-heading{display:flex}.premium-heading>div{min-width:0}.premium-heading .premium-count{margin-top:8px}.topline{display:block}.meta{display:block;margin-top:7px}.news-card{padding:16px 15px 15px;border-radius:17px}.news-card.is-expanded{border-bottom-left-radius:0;border-bottom-right-radius:0}.news-card h3{font-size:18px;line-height:1.42}.summary{font-size:12.5px;margin-bottom:13px}.card-actions{gap:7px;align-items:stretch}.read-button,.important-button{flex:1;min-height:45px;padding:0 10px}.source{margin-left:0;width:100%;max-width:none;order:3;padding:3px 2px 0}.inline-analysis{border-radius:0 0 17px 17px;margin-bottom:10px}.inline-analysis-head{padding:17px 15px 15px}.inline-analysis-head h3{font-size:19px}.analysis-close{min-height:35px;padding:0 9px}.inline-analysis-grid{padding:10px;gap:9px}.inline-analysis-section{padding:14px 14px 15px;border-radius:14px}.inline-analysis-section.question-card{padding:18px 15px 19px}.inline-analysis-section.question-card:before{right:10px;top:10px;font-size:5.5px}.inline-analysis-section.question-card .inline-analysis-label{padding-right:90px}.inline-analysis-section.question-card .inline-analysis-content{font-size:14px;line-height:1.78;padding-right:0}.inline-analysis-section.mains-question .inline-analysis-content{font-size:14px;line-height:1.78}.inline-analysis-footer{padding:11px}.inline-analysis-footer .important-button{width:100%}.inline-source-link{width:100%;justify-content:center;margin:0!important}.fact-grid,.premium-fact-grid{grid-template-columns:1fr}.premium-fact-tabs{max-width:none}.premium-fact-tab{padding:10px 9px}.premium-fact-tab small{font-size:8px}.notification-grid{grid-template-columns:1fr}.notification-info{display:block}.notification-info span{display:block;margin-top:5px}.setting-box input{width:100%;margin:0 0 8px}.save-time{width:100%}.notification-title{align-items:flex-start}.modal-body{padding:7px 14px 20px}.modal-head{padding:20px 17px 17px}.modal-head h2{font-size:20px}.modal-footer{padding:12px 14px 18px}}
        @media(min-width:651px) and (max-width:1100px){.ca-page{padding-left:clamp(16px,4vw,30px);padding-right:clamp(16px,4vw,30px)}}
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
  formatDate,
  disabled,
  expanded,
}) {
  const hi = language === "hi";
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
    <>
      <article className={expanded ? "news-card is-expanded" : "news-card"}>
      <div className="topline">
        <span className="badge">{item.gs || item.paper || "UPSC"}</span>
        <span className="meta">
          {item.subject || "UPSC Current Affairs"} · {formatDate(item.date)}
        </span>
      </div>

      <h3>{title}</h3>
      <p className="summary">{summary}</p>

      <div className="card-actions">
        <button
          type="button"
          className={expanded ? "read-button open" : "read-button"}
          onClick={() => onOpen(item)}
          aria-expanded={expanded}
        >
          <span className="button-icon">
            {expanded ? "↑" : "↗"}
          </span>
          <span>
            {expanded
              ? (hi ? "Analysis बंद करें" : "Close Analysis")
              : (hi ? "पूरा Analysis पढ़ें" : "Read Full Analysis")}
          </span>
          <span className="button-arrow">{expanded ? "↑" : "→"}</span>
        </button>

        <button
          type="button"
          className={important ? "important-button saved" : "important-button"}
          disabled={disabled}
          onClick={() => onImportant(item.id)}
          aria-label={important ? "Remove from Important" : "Save to Important"}
        >
          <span className="bookmark-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill={important ? "currentColor" : "none"}>
              <path d="M6.5 4.75A2.25 2.25 0 0 1 8.75 2.5h6.5A2.25 2.25 0 0 1 17.5 4.75V21l-5.5-3.4L6.5 21V4.75Z" />
            </svg>
          </span>
          <span>{important ? (hi ? "Saved" : "Saved") : (hi ? "Important" : "Save")}</span>
        </button>

        <span className="source">{item.source_name || "Official Source"}</span>
      </div>
      </article>

      {expanded && (
        <ArticleInlineAnalysis
          item={item}
          language={language}
          important={important}
          importantLoading={disabled}
          onImportant={onImportant}
          onClose={() => onOpen(item)}
        />
      )}
    </>
  );
}

function PremiumFacts({ news, language, hi }) {
  const [factType, setFactType] = useState("prelims");

  const prelimsFacts = news.filter(
    (item) => item.prelims_hi || item.prelims_en || item.prelims
  );

  const mainsFacts = news.filter(
    (item) => item.premium_fact_hi || item.premium_fact_en || item.premium_fact
  );

  const facts = factType === "prelims" ? prelimsFacts : mainsFacts;

  function titleOf(item) {
    return (
      (hi ? item.title_hi : item.title_en) ||
      item.title ||
      (hi ? item.title_en : item.title_hi) ||
      "Current Affair"
    );
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^[-•*]\s*/, "")
      .trim();
  }

  function getPrelimsFact(item) {
    const raw = cleanText(
      (hi ? item.prelims_hi : item.prelims_en) || item.prelims
    );

    if (!raw) return "";

    // Prelims card intentionally shows one concise factual line.
    const firstSentence = raw.split(/(?<=[.!?।])\s+/)[0].trim();
    const compact = firstSentence || raw;

    return compact.length > 170
      ? `${compact.slice(0, 167).trim()}...`
      : compact;
  }

  function getMainsFact(item) {
    const raw = cleanText(
      (hi ? item.premium_fact_hi : item.premium_fact_en) || item.premium_fact
    );

    return raw;
  }

  return (
    <section className="special-section premium-facts-section">
      <div className="section-heading premium-heading">
        <div>
          <span className="badge premium-badge">PREMIUM</span>
          <h2>🔥 Premium Facts</h2>
          <p className="premium-subtitle">
            {factType === "prelims"
              ? hi
                ? "एक नज़र में Prelims के लिए high-value facts"
                : "One-line high-value facts for Prelims revision"
              : hi
              ? "Mains answers में इस्तेमाल करने योग्य analytical points"
              : "High-value points to strengthen Mains answers"}
          </p>
        </div>

        <span className="premium-count">
          {facts.length} {factType === "prelims" ? "Prelims" : "Mains"}
        </span>
      </div>

      <div className="premium-fact-tabs" role="tablist" aria-label="Premium Facts type">
        <button
          type="button"
          role="tab"
          aria-selected={factType === "prelims"}
          className={factType === "prelims" ? "premium-fact-tab active" : "premium-fact-tab"}
          onClick={() => setFactType("prelims")}
        >
          <span className="tab-icon">◆</span>
          <span>
            <strong>PRELIMS</strong>
            <small>{hi ? "One-line facts" : "One-line facts"}</small>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={factType === "mains"}
          className={factType === "mains" ? "premium-fact-tab active" : "premium-fact-tab"}
          onClick={() => setFactType("mains")}
        >
          <span className="tab-icon">→</span>
          <span>
            <strong>MAINS</strong>
            <small>{hi ? "Answer-ready points" : "Answer-ready points"}</small>
          </span>
        </button>
      </div>

      {facts.length === 0 ? (
        <div className="empty premium-empty">
          <div className="premium-empty-icon">◇</div>
          <strong>
            {factType === "prelims"
              ? hi
                ? "अभी Prelims Facts उपलब्ध नहीं हैं।"
                : "No Prelims Facts available yet."
              : hi
              ? "अभी Mains Facts उपलब्ध नहीं हैं।"
              : "No Mains Facts available yet."}
          </strong>
        </div>
      ) : (
        <div className="fact-grid premium-fact-grid">
          {facts.map((item, index) => {
            const fact =
              factType === "prelims"
                ? getPrelimsFact(item)
                : getMainsFact(item);

            return (
              <article
                className={
                  factType === "prelims"
                    ? "fact-card premium-fact-card prelims-fact-card"
                    : "fact-card premium-fact-card mains-fact-card"
                }
                key={item.id}
              >
                <div className="premium-card-top">
                  <span className="premium-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="premium-gs">
                    {item.gs || item.paper || "UPSC"}
                  </span>
                </div>

                <h3>{titleOf(item)}</h3>

                <div className="premium-fact-content">
                  <span className="premium-fact-icon">
                    {factType === "prelims" ? "◆" : "→"}
                  </span>
                  <p>{fact}</p>
                </div>

                <div className="premium-card-footer">
                  <span>{item.source_name || "Official Source"}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ArticleInlineAnalysis({
  item,
  language,
  important,
  importantLoading,
  onImportant,
  onClose,
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

  const block = (label, content, variant = "") =>
    content ? (
      <section className={`inline-analysis-section ${variant}`}>
        <div className="inline-analysis-label">{label}</div>
        <div className="inline-analysis-content">{content}</div>
      </section>
    ) : null;

  const questionCard = (label, content, variant = "") =>
    content ? (
      <section className={`inline-analysis-section question-card ${variant}`}>
        <div className="inline-analysis-label">{label}</div>
        <div className="inline-analysis-content">{content}</div>
      </section>
    ) : null;

  return (
    <section className="inline-analysis" aria-label="Full analysis">
      <div className="inline-analysis-head">
        <div>
          <span className="analysis-kicker">
            {hi ? "DETAILED UPSC ANALYSIS" : "DETAILED UPSC ANALYSIS"}
          </span>
          <h3>{title}</h3>
          <p>
            {item.source_name || "Official Source"} · {item.date || ""}
          </p>
        </div>

        <button
          type="button"
          className="analysis-close"
          onClick={onClose}
          aria-label={hi ? "Analysis बंद करें" : "Close analysis"}
        >
          <span>×</span>
          {hi ? "बंद करें" : "Close"}
        </button>
      </div>

      <div className="inline-analysis-grid">
        {why && (
          <section className="inline-analysis-section highlight">
            <div className="inline-analysis-label">
              {hi ? "क्यों चर्चा में?" : "Why in News"}
            </div>
            <div className="inline-analysis-content">{why}</div>
          </section>
        )}

        {background && block(hi ? "पृष्ठभूमि" : "Background", background)}
        {facts && block(hi ? "मुख्य तथ्य" : "Key Facts", facts)}
        {prelims && block(hi ? "Prelims Focus" : "Prelims Focus", prelims, "prelims")}
        {mains && block(hi ? "Mains Analysis" : "Mains Analysis", mains, "mains")}
        {item.static_link && block(hi ? "Static Link" : "Static Link", item.static_link)}
        {pyqs && block(hi ? "Related PYQs" : "Related PYQs", pyqs, "pyq")}
        {mcq && questionCard(hi ? "Prelims Practice MCQ" : "Prelims Practice MCQ", mcq)}
        {mainsQuestion && questionCard(hi ? "Mains Practice Question" : "Mains Practice Question", mainsQuestion, "mains-question")}
        {ethics && block(hi ? "GS-IV Ethics Angle" : "GS-IV Ethics Angle", ethics, "ethics")}

        {premium && (
          <section className="inline-premium-box">
            <div className="inline-premium-title">
              <span>✦</span>
              <strong>{hi ? "Premium Fact" : "Premium Fact"}</strong>
            </div>
            <p>{premium}</p>
          </section>
        )}
      </div>

      <div className="inline-analysis-footer">
        <button
          type="button"
          className={important ? "important-button saved" : "important-button"}
          disabled={importantLoading}
          onClick={() => onImportant(item.id)}
        >
          <span className="bookmark-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill={important ? "currentColor" : "none"}>
              <path d="M6.5 4.75A2.25 2.25 0 0 1 8.75 2.5h6.5A2.25 2.25 0 0 1 17.5 4.75V21l-5.5-3.4L6.5 21V4.75Z" />
            </svg>
          </span>
          {important
            ? (hi ? "Important में Saved" : "Saved to Important")
            : (hi ? "Important में Save करें" : "Save to Important")}
        </button>

        {item.source_url && (
          <a
            className="source-link inline-source-link"
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
          >
            {hi ? "Original Source देखें ↗" : "View Original Source ↗"}
          </a>
        )}
      </div>
    </section>
  );
}
