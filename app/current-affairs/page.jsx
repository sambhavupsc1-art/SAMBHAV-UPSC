"use client";

import { useMemo, useState } from "react";

const news = [
  {
    id: 1,
    title: "UPSC Centenary: Civil Services and Institutional Reform",
    paper: "GS-II",
    subject: "Polity & Governance",
    source: "PIB",
    date: "01 Oct 2026",
    summary:
      "UPSC centenary-related developments provide a context to study constitutional status, recruitment, transparency and reforms in civil services.",
    prelims: [
      "UPSC is a constitutional body under Part XIV of the Constitution.",
      "Articles 315–323 deal with Public Service Commissions.",
    ],
    mains:
      "Discuss the role of an independent public service commission in maintaining merit, neutrality and accountability in public administration.",
    premiumFact:
      "Use constitutional provisions and institutional safeguards as an introduction to answers on civil-service reforms.",
  },
  {
    id: 2,
    title: "Renewable Energy and Green Energy Corridor",
    paper: "GS-III",
    subject: "Environment & Economy",
    source: "The Hindu",
    date: "01 Oct 2026",
    summary:
      "Transmission infrastructure is important for integrating variable renewable power into the electricity grid.",
    prelims: [
      "Green transmission infrastructure supports renewable-energy integration.",
      "Grid balancing becomes important as the share of variable renewable generation rises.",
    ],
    mains:
      "Examine the infrastructure and grid-management challenges associated with India's renewable-energy transition.",
    premiumFact:
      "A current renewable-energy statistic from an official government report can strengthen the introduction or conclusion of a GS-III answer.",
  },
  {
    id: 3,
    title: "Rabi MSP and Agricultural Pricing",
    paper: "GS-III",
    subject: "Agriculture",
    source: "The Hindu",
    date: "01 Oct 2026",
    summary:
      "Rabi minimum support price developments can be linked with agricultural pricing, farmer income and food-security policy.",
    prelims: [
      "MSP is announced for notified agricultural crops.",
      "Agricultural pricing has implications for production incentives and food security.",
    ],
    mains:
      "Discuss the role and limitations of MSP in improving farm incomes while maintaining food-security objectives.",
    premiumFact:
      "Use the latest official MSP data and input-cost context as contemporary evidence in agricultural-policy answers.",
  },
];

const filters = ["Today", "GS-I", "GS-II", "GS-III", "GS-IV", "Prelims"];

export default function CurrentAffairsPage() {
  const [active, setActive] = useState("Today");
  const [important, setImportant] = useState([]);
  const [selected, setSelected] = useState(null);

  const filteredNews = useMemo(() => {
    if (active === "Today" || active === "Prelims") return news;
    return news.filter((item) => item.paper === active);
  }, [active]);

  function toggleImportant(id) {
    setImportant((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
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
          <span>Today's Update</span>
          <strong>01 October 2026</strong>
          <small>Daily update target: 10:00 AM</small>
        </div>
      </section>

      <nav className="filter-row">
        {filters.map((filter) => (
          <button
            key={filter}
            className={active === filter ? "filter active" : "filter"}
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

      {active === "Important" ? (
        <section className="special-section">
          <h2>⭐ My Important Current Affairs</h2>

          {important.length === 0 ? (
            <div className="empty">
              अभी कोई Current Affair Important में नहीं है।
              <br />
              किसी भी news पर ⭐ दबाकर उसे यहाँ save करें।
            </div>
          ) : (
            news
              .filter((item) => important.includes(item.id))
              .map((item) => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  important={true}
                  onImportant={toggleImportant}
                  onOpen={setSelected}
                />
              ))
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
              Introduction, Body और Conclusion में उपयोग होने वाले high-value
              facts.
            </p>
          </div>

          <div className="fact-grid">
            {news.map((item) => (
              <article className="fact-card" key={item.id}>
                <span>{item.paper}</span>
                <h3>{item.title}</h3>
                <p>{item.premiumFact}</p>
                <small>Source: {item.source}</small>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <div className="section-heading">
            <div>
              <span className="badge">01 OCT 2026</span>
              <h2>
                {active === "Today"
                  ? "Today's UPSC Current Affairs"
                  : active}
              </h2>
            </div>

            <p>{filteredNews.length} selected updates</p>
          </div>

          <div className="news-list">
            {filteredNews.map((item) => (
              <ArticleCard
                key={item.id}
                item={item}
                important={important.includes(item.id)}
                onImportant={toggleImportant}
                onOpen={setSelected}
              />
            ))}
          </div>
        </section>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <article className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>
              ×
            </button>

            <span className="badge">{selected.paper}</span>

            <h2>{selected.title}</h2>

            <p className="source">Source: {selected.source}</p>

            <h3>Why in News</h3>
            <p>{selected.summary}</p>

            <h3>Prelims</h3>

            <ul>
              {selected.prelims.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <h3>Mains Analysis</h3>
            <p>{selected.mains}</p>

            <div className="premium-box">
              <strong>🔥 Premium Fact</strong>
              <p>{selected.premiumFact}</p>
            </div>

            <button
              className="important-button"
              onClick={() => toggleImportant(selected.id)}
            >
              {important.includes(selected.id)
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

        .source {
          color: #667085;
          font-size: 12px;
          margin: 0;
        }

        .special-section {
          margin-top: 8px;
        }

        .empty {
          background: #fff;
          border: 1px dashed #d0d5dd;
          border-radius: 16px;
          padding: 35px 20px;
          text-align: center;
          color: #667085;
          margin-top: 15px;
          line-height: 1.7;
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
        }
      `}</style>
    </main>
  );
}

function ArticleCard({ item, important, onImportant, onOpen }) {
  return (
    <article className="news-card">
      <div className="topline">
        <span className="badge">{item.paper}</span>
        <span className="meta">
          {item.subject} • {item.date}
        </span>
      </div>

      <h3>{item.title}</h3>

      <p className="summary">{item.summary}</p>

      <div className="card-actions">
        <button className="read-button" onClick={() => onOpen(item)}>
          Read Full Analysis
        </button>

        <button
          className="important-button"
          onClick={() => onImportant(item.id)}
        >
          {important ? "★ Important" : "⭐ Add to Important"}
        </button>

        <span className="source">Source: {item.source}</span>
      </div>
    </article>
  );
      }
