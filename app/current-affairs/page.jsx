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
  const [news, setNews] = useState([]);
  const [important, setImportant] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importantLoading, setImportantLoading] = useState(false);
  const [error, setError] = useState("");

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
    } catch (error) {
      console.error("Important Current Affairs load failed:", error);
    }
  }

  const importantIds = useMemo(
    () => important.map((item) => Number(item.current_affair_id)),
    [important]
  );

  const filteredNews = useMemo(() => {
    if (active === "Today") {
      return news;
    }

    if (active === "Prelims") {
      return news.filter(
        (item) =>
          item.prelims ||
          item.prelims_mcq ||
          item.paper?.toUpperCase() === "PRELIMS"
      );
    }

    if (active === "Important") {
      return news.filter((item) =>
        importantIds.includes(Number(item.id))
      );
    }

    return news.filter(
      (item) => item.gs === active || item.paper === active
    );
  }, [active, news, importantIds]);

  async function toggleImportant(id) {
    try {
      setImportantLoading(true);

      const isAlreadyImportant = importantIds.includes(Number(id));

      if (isAlreadyImportant) {
        const response = await fetch(
          `/api/current-affairs?mode=important&current_affair_id=${id}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result?.error || "Important remove nahi hua."
          );
        }
      } else {
        const response = await fetch("/api/current-affairs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_affair_id: id,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result?.error || "Important save nahi hua."
          );
        }
      }

      await loadImportant();
    } catch (error) {
      alert(error.message || "Important update nahi ho paya.");
    } finally {
      setImportantLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

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
            UPSC-relevant daily current affairs — Prelims + GS-wise Mains
          </p>
        </div>

        <div className="date-card">
          <span>Latest Update</span>

          <strong>{getLatestDate()}</strong>

          <small>Daily update target: 10:00 AM</small>
        </div>
      </section>

      <nav className="filter-row">
        {filters.map((filter) => (
          <button
            key={filter}
            className={
              active === filter ? "filter active" : "filter"
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
          <div className="loader"></div>

          <h2>Current Affairs load ho rahe hain...</h2>

          <p>
            Supabase database se latest updates fetch kiye ja rahe hain.
          </p>
        </section>
      ) : error ? (
        <section className="state-card error-card">
          <h2>Current Affairs load nahi ho paye</h2>

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
              अभी कोई Current Affair Important में नहीं है।
              <br />
              किसी भी news पर ⭐ दबाकर उसे यहाँ save करें।
            </div>
          ) : (
            <div className="news-list">
              {filteredNews.map((item) => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  important={true}
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
        <section className="special-section">
          <div className="section-heading">
            <div>
              <span className="badge premium-badge">PREMIUM</span>

              <h2>🔥 Premium Facts</h2>
            </div>

            <p>
              Introduction, Body और Conclusion में उपयोग होने वाले
              high-value facts.
            </p>
          </div>

          {news.filter((item) => item.premium_fact).length === 0 ? (
            <div className="empty">
              अभी Premium Facts उपलब्ध नहीं हैं।
            </div>
          ) : (
            <div className="fact-grid">
              {news
                .filter((item) => item.premium_fact)
                .map((item) => (
                  <article className="fact-card" key={item.id}>
                    <span>
                      {item.gs || item.paper || "UPSC"}
                    </span>

                    <h3>{item.title}</h3>

                    <p>{item.premium_fact}</p>

                    <small>
                      Source:{" "}
                      {item.source_name || "Official Source"}
                    </small>
                  </article>
                ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <div className="section-heading">
            <div>
              <span className="badge">
                {getLatestDate().toUpperCase()}
              </span>

              <h2>
                {active === "Today"
                  ? "Today's UPSC Current Affairs"
                  : active}
              </h2>
            </div>

            <p>{filteredNews.length} updates</p>
          </div>

          {filteredNews.length === 0 ? (
            <div className="empty">
              इस category में अभी कोई Current Affair उपलब्ध नहीं है।
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
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <article
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <span className="badge">
              {selected.gs || selected.paper || "UPSC"}
            </span>

            <h2>{selected.title}</h2>

            <p className="source">
              Source:{" "}
              {selected.source_name || "Not specified"}
            </p>

            {selected.source_url && (
              <a
                className="source-link"
                href={selected.source_url}
                target="_blank"
                rel="noreferrer"
              >
                View Original Source
              </a>
            )}

            {selected.why_in_news && (
              <>
                <h3>Why in News</h3>
                <p>{selected.why_in_news}</p>
              </>
            )}

            {selected.background && (
              <>
                <h3>Background</h3>
                <p>{selected.background}</p>
              </>
            )}

            {selected.key_facts && (
              <>
                <h3>Key Facts</h3>
                <p>{selected.key_facts}</p>
              </>
            )}

            {selected.prelims && (
              <>
                <h3>Prelims</h3>
                <div className="content-block">
                  {selected.prelims}
                </div>
              </>
            )}

            {selected.mains_analysis && (
              <>
                <h3>Mains Analysis</h3>
                <div className="content-block">
                  {selected.mains_analysis}
                </div>
              </>
            )}

            {selected.static_link && (
              <>
                <h3>Static Link</h3>
                <p>{selected.static_link}</p>
              </>
            )}

            {selected.related_pyqs && (
              <>
                <h3>Related PYQs</h3>
                <div className="content-block">
                  {selected.related_pyqs}
                </div>
              </>
            )}

            {selected.prelims_mcq && (
              <>
                <h3>Possible Prelims MCQ</h3>
                <div className="content-block">
                  {selected.prelims_mcq}
                </div>
              </>
            )}

            {selected.mains_question && (
              <>
                <h3>Possible Mains Question</h3>
                <div className="content-block">
                  {selected.mains_question}
                </div>
              </>
            )}

            {selected.premium_fact && (
              <div className="premium-box">
                <strong>🔥 Premium Fact</strong>

                <p>{selected.premium_fact}</p>
              </div>
            )}

            <button
              className="important-button modal-important"
              disabled={importantLoading}
              onClick={() =>
                toggleImportant(selected.id)
              }
            >
              {importantIds.includes(Number(selected.id))
                ? "★ Remove from Important"
                : "⭐ Add to Important"}
            </button>
          </article>
        </div>
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
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          padding: 15px 18px;
          min-width: 205px;
          box-shadow: 0 4px 16px rgba(16, 24, 40, 0.05);
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

        .section-heading h2,
        .special-section h2 {
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

        .premium-badge {
          background: #f7e9ed;
          color: #7a263a;
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

        .meta {
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

        .modal-important {
          margin-top: 12px;
        }

        .source {
          color: #667085;
          font-size: 12px;
          margin: 0;
        }

        .source-link {
          display: inline-block;
          margin-top: 8px;
          color: #175cd3;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .special-section {
          margin-top: 8px;
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

        .modal p,
        .modal li {
          line-height: 1.65;
          color: #475467;
        }

        .content-block {
          white-space: pre-wrap;
          color: #475467;
          line-height: 1.65;
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

        @media (max-width: 700px) {
          .ca-page {
            padding: 20px 12px 45px;
          }

          .ca-header {
            display: block;
          }

          .date-card {
            margin-top: 15px;
          }

          .section-heading {
            display: block;
          }

          .fact-grid {
            grid-template-columns: 1fr;
          }

          .topline {
            display: block;
          }

          .meta {
            display: block;
            margin-top: 7px;
          }
        }
      `}</style>
    </main>
  );
}

function ArticleCard({
  item,
  important,
  onImportant,
  onOpen,
  formatDate,
  disabled,
}) {
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

      <h3>{item.title}</h3>

      <p className="summary">
        {item.why_in_news ||
          item.background ||
          item.key_facts ||
          "UPSC-relevant current affair."}
      </p>

      <div className="card-actions">
        <button
          className="read-button"
          onClick={() => onOpen(item)}
        >
          Read Full Analysis
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
    </article>
  );
}
