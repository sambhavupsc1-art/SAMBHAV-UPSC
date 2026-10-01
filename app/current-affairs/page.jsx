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

  const hi = language === "hi";

  useEffect(() => {
    loadCurrentAffairs();
    loadImportant();
  }, []);

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
      setError(err.message || "Current Affairs load nahi ho paye.");
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

  function getTitle(item) {
    if (hi) {
      return (
        item.title_hi ||
        item.title ||
        item.title_en ||
        "Current Affair"
      );
    }

    return (
      item.title_en ||
      item.title ||
      item.title_hi ||
      "Current Affair"
    );
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
                className={hi ? "lang active" : "lang"}
                onClick={() => setLanguage("hi")}
              >
                हिन्दी
              </button>

              <button
                className={!hi ? "lang active" : "lang"}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
            </div>
          </div>

          <div className="date-card">
            <span>
              {hi
                ? "Latest Update"
                : "Latest Update"}
            </span>

            <strong>
              {getLatestDate()}
            </strong>

            <small>
              {hi
                ? "Daily update target: 10:00 AM"
                : "Daily update target: 10:00 AM"}
            </small>
          </div>
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
          ⭐ {hi ? "Important" : "Important"}
        </button>

        <button
          className={
            active === "Premium"
              ? "filter active premium"
              : "filter premium"
          }
          onClick={() => setActive("Premium")}
        >
          🔥 {hi ? "Premium Facts" : "Premium Facts"}
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
                ⭐{" "}
                {hi
                  ? "My Important Current Affairs"
                  : "My Important Current Affairs"}
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
                  onImportant={toggleImportant}
                  onOpen={setSelected}
                  formatDate={formatDate}
                  disabled={importantLoading}
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
              {filteredNews.length}{" "}
              {hi ? "updates" : "updates"}
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
                  onImportant={toggleImportant}
                  onOpen={setSelected}
                  formatDate={formatDate}
                  disabled={importantLoading}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {selected && (
        <ArticleModal
          item={selected}
          language={language}
          important={importantIds.includes(
            Number(selected.id)
          )}
          importantLoading={importantLoading}
          onImportant={toggleImportant}
          onClose={() => setSelected(null)}
        />
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
        .section-heading {
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
          gap: 12px;
          align-items: stretch;
        }

        .language-box,
        .date-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          padding: 13px 15px;
          box-shadow: 0 4px 16px rgba(16, 24, 40, 0.05);
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
          box-shadow: 0 4px 16px rgba(16, 24, 40, 0.04);
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

        .important-button:disabled {
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
            flex-wrap: wrap;
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

          .date-card {
            width: 100%;
          }

          .language-box {
            width: 100%;
          }

          .language-buttons {
            width: 100%;
          }

          .lang {
            flex: 1;
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
  formatDate,
  disabled,
}) {
  const hi = language === "hi";

  const title =
    (hi
      ? item.title_hi
      : item.title_en) ||
    item.title ||
    (hi ? item.title_en : item.title_hi) ||
    "Current Affair";

  const summary =
    (hi
      ? item.why_in_news_hi
      : item.why_in_news_en) ||
    (hi
      ? item.why_in_news
      : item.why_in_news) ||
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
          {item.gs || item.paper || "UPSC"}
        </span>

        <span className="meta">
          {item.subject || "UPSC Current Affairs"} •{" "}
          {formatDate(item.date)}
        </span>
      </div>

      <h3>{title}</h3>

      <p className="summary">
        {summary}
      </p>

      <div className="card-actions">
        <button
          className="read-button"
          onClick={() => onOpen(item)}
        >
          {hi
            ? "पूरा Analysis पढ़ें"
            : "Read Full Analysis"}
        </button>

        <button
          className="important-button"
          disabled={disabled}
          onClick={() => onImportant(item.id)}
        >
          {important
            ? "★ Important"
            : "⭐ Add to Important"}
        </button>

        <span className="source">
          Source:{" "}
          {item.source_name ||
            "Not specified"}
        </span>
      </div>
    </article>
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

function ArticleModal({
  item,
  language,
  important,
  importantLoading,
  onImportant,
  onClose,
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
      className="modal-backdrop"
      onClick={onClose}
    >
      <article
        className="modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="close"
          onClick={onClose}
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
            <h3>
              {hi
                ? "Why in News"
                : "Why in News"}
            </h3>
            <p>{why}</p>
          </>
        )}

        {background && (
          <>
            <h3>
              {hi
                ? "Background"
                : "Background"}
            </h3>
            <p>{background}</p>
          </>
        )}

        {facts && (
          <>
            <h3>
              {hi
                ? "Key Facts"
                : "Key Facts"}
            </h3>
            <div className="content-block">
              {facts}
            </div>
          </>
        )}

        {prelims && (
          <>
            <h3>
              {hi
                ? "Prelims"
                : "Prelims"}
            </h3>
            <div className="content-block">
              {prelims}
            </div>
          </>
        )}

        {mains && (
          <>
            <h3>
              {hi
                ? "Mains Analysis"
                : "Mains Analysis"}
            </h3>
            <div className="content-block">
              {mains}
            </div>
          </>
        )}

        {item.static_link && (
          <>
            <h3>
              {hi
                ? "Static Link"
                : "Static Link"}
            </h3>
            <p>{item.static_link}</p>
          </>
        )}

        {pyqs && (
          <>
            <h3>
              {hi
                ? "Related PYQs"
                : "Related PYQs"}
            </h3>
            <div className="content-block">
              {pyqs}
            </div>
          </>
        )}

        {mcq && (
          <>
            <h3>
              {hi
                ? "Possible Prelims MCQ"
                : "Possible Prelims MCQ"}
            </h3>
            <div className="content-block">
              {mcq}
            </div>
          </>
        )}

        {mainsQuestion && (
          <>
            <h3>
              {hi
                ? "Possible Mains Question"
                : "Possible Mains Question"}
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
