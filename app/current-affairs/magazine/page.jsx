"use client";

import { useEffect, useMemo, useState } from "react";

const sections = [
  ["overview", "Overview", "Magazine overview"],
  ["gs1_content", "GS-I", "History, Art & Culture, Geography, Society"],
  ["gs2_content", "GS-II", "Polity, Governance, Social Justice, IR"],
  ["gs3_content", "GS-III", "Economy, Environment, S&T, Security"],
  ["gs4_content", "GS-IV", "Ethics, Integrity & Aptitude"],
  ["prelims_content", "Prelims", "Prelims-focused current facts"],
  ["premium_facts", "Premium Facts", "High-value exam facts"],
  ["important_current_affairs", "Important CA", "Most important monthly developments"],
  ["reports_indices", "Reports & Indices", "Reports, rankings, indicators"],
  ["government_schemes", "Schemes", "Government schemes and programmes"],
  ["international_relations", "International Relations", "India and the world"],
  ["important_places", "Important Places", "Places in news"],
  ["important_personalities", "Personalities", "Important personalities in news"],
  ["prelims_100_facts", "100 Prelims Facts", "Rapid revision facts"],
  ["mains_themes", "Mains Themes", "Issue-based themes for Mains"],
  ["mind_maps", "Mind Maps", "Quick conceptual revision"],
  ["mcqs", "MCQs", "Prelims practice questions"],
  ["mains_questions", "Mains Questions", "Mains practice questions"],
];

function monthValue(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );
}

export default function MagazinePage() {
  const [month, setMonth] = useState(monthValue());
  const [language, setLanguage] = useState("hi");
  const [magazine, setMagazine] = useState(null);
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hi = language === "hi";

  useEffect(() => {
    loadMagazine();
  }, [month]);

  async function loadMagazine() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/current-affairs/magazine?month=${encodeURIComponent(month)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error ||
            (hi
              ? "Magazine load नहीं हो पाई।"
              : "Magazine could not be loaded.")
        );
      }

      setMagazine(result.data || null);

      const firstAvailable = sections.find(
        ([key]) => result.data?.[key]
      );

      setActive(firstAvailable?.[0] || "overview");
    } catch (err) {
      setMagazine(null);
      setError(
        err.message ||
          (hi
            ? "Magazine load नहीं हो पाई।"
            : "Magazine could not be loaded.")
      );
    } finally {
      setLoading(false);
    }
  }

  const activeSection = useMemo(
    () => sections.find(([key]) => key === active),
    [active]
  );

  const content = magazine?.[active] || "";

  return (
    <main className="mag-page">
      <header className="mag-header">
        <div>
          <p className="eyebrow">SAMBHAV UPSC</p>
          <h1>{hi ? "Monthly Current Affairs" : "Monthly Current Affairs"}</h1>
          <p className="sub">
            {hi
              ? "महीने भर के UPSC Current Affairs का structured revision."
              : "Structured monthly revision of UPSC Current Affairs."}
          </p>
        </div>

        <div className="header-tools">
          <label className="month-box">
            <span>{hi ? "Month" : "Month"}</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <div className="lang-box">
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
      </header>

      {loading ? (
        <section className="state-card">
          <div className="loader" />
          <h2>{hi ? "Magazine load हो रही है..." : "Loading Magazine..."}</h2>
          <p>{formatMonth(month)}</p>
        </section>
      ) : error ? (
        <section className="state-card error">
          <h2>{hi ? "Magazine load नहीं हो पाई" : "Magazine could not be loaded"}</h2>
          <p>{error}</p>
          <button className="retry" onClick={loadMagazine}>
            {hi ? "Retry" : "Retry"}
          </button>
        </section>
      ) : !magazine ? (
        <section className="state-card empty-state">
          <span className="empty-badge">COMING SOON</span>
          <h2>
            {hi
              ? `${formatMonth(month)} की Magazine अभी publish नहीं हुई है`
              : `The ${formatMonth(month)} magazine is not published yet`}
          </h2>
          <p>
            {hi
              ? "Daily Current Affairs चलते रहेंगे। Monthly Magazine publish होने पर यही page automatically content दिखाएगा।"
              : "Daily Current Affairs will continue. Once the monthly magazine is published, this page will show it automatically."}
          </p>
        </section>
      ) : (
        <>
          <section className="cover-card">
            <div className="cover-content">
              <span className="cover-badge">SAMBHAV UPSC • MONTHLY</span>
              <h2>{magazine.title || formatMonth(month)}</h2>
              {magazine.subtitle && <p>{magazine.subtitle}</p>}
              <div className="cover-meta">
                <span>{formatMonth(month)}</span>
                <span>{magazine.status === "published" ? "Published" : "Draft"}</span>
              </div>
            </div>

            {magazine.cover_image_url ? (
              <img
                src={magazine.cover_image_url}
                alt={magazine.title || "Monthly Current Affairs"}
                className="cover-image"
              />
            ) : (
              <div className="cover-placeholder">
                <span>UPSC</span>
                <strong>{new Date(`${month}-01`).getMonth() + 1}</strong>
              </div>
            )}
          </section>

          <div className="mag-layout">
            <aside className="section-nav">
              <div className="nav-title">
                <span>INDEX</span>
                <strong>{sections.filter(([key]) => magazine[key]).length}</strong>
              </div>

              {sections.map(([key, label]) =>
                magazine[key] ? (
                  <button
                    key={key}
                    className={active === key ? "nav-item active" : "nav-item"}
                    onClick={() => setActive(key)}
                  >
                    {label}
                  </button>
                ) : null
              )}
            </aside>

            <section className="reading-card">
              <div className="reading-head">
                <div>
                  <span className="section-badge">
                    {activeSection?.[1] || "SECTION"}
                  </span>
                  <h2>{activeSection?.[1]}</h2>
                  <p>{activeSection?.[2]}</p>
                </div>
              </div>

              <div className="reading-content">
                {content ? (
                  content.split("\n").map((line, index) =>
                    line.trim() ? (
                      <p key={index}>{line}</p>
                    ) : (
                      <div key={index} className="content-gap" />
                    )
                  )
                ) : (
                  <div className="section-empty">
                    {hi
                      ? "इस section का content अभी उपलब्ध नहीं है।"
                      : "Content for this section is not available yet."}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      <style jsx>{`
        .mag-page {
          min-height: 100vh;
          background: #f6f7f9;
          color: #172033;
          padding: 26px 18px 60px;
          font-family: Arial, sans-serif;
        }

        .mag-header,
        .cover-card,
        .mag-layout {
          max-width: 1080px;
          margin-left: auto;
          margin-right: auto;
        }

        .mag-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: #667085;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        h1 {
          margin: 0;
          font-size: clamp(27px, 5vw, 40px);
        }

        .sub {
          margin: 8px 0 0;
          color: #667085;
          font-size: 14px;
        }

        .header-tools {
          display: flex;
          gap: 9px;
          align-items: stretch;
        }

        .month-box,
        .lang-box {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 14px;
          padding: 10px;
        }

        .month-box span {
          display: block;
          color: #667085;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .month-box input {
          border: 0;
          outline: 0;
          color: #172033;
          font-weight: 700;
          background: transparent;
        }

        .lang-box {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .lang {
          border: 0;
          background: transparent;
          padding: 8px 10px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .lang.active {
          background: #172033;
          color: #fff;
        }

        .cover-card {
          min-height: 220px;
          display: flex;
          justify-content: space-between;
          overflow: hidden;
          border-radius: 24px;
          background: #172033;
          color: #fff;
          box-shadow: 0 16px 40px rgba(16, 24, 40, .14);
          margin-bottom: 18px;
        }

        .cover-content {
          padding: 30px;
          max-width: 700px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cover-badge {
          width: fit-content;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .cover-content h2 {
          margin: 13px 0 7px;
          font-size: clamp(25px, 5vw, 38px);
        }

        .cover-content p {
          margin: 0;
          color: #d0d5dd;
          line-height: 1.6;
        }

        .cover-meta {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }

        .cover-meta span {
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 11px;
          color: #e4e7ec;
        }

        .cover-placeholder {
          width: 220px;
          min-height: 220px;
          display: grid;
          place-content: center;
          text-align: center;
          background: rgba(255,255,255,.06);
          border-left: 1px solid rgba(255,255,255,.1);
        }

        .cover-placeholder span {
          font-size: 12px;
          letter-spacing: .2em;
          font-weight: 900;
        }

        .cover-placeholder strong {
          font-size: 70px;
          line-height: 1;
          margin-top: 4px;
        }

        .cover-image {
          width: 220px;
          object-fit: cover;
        }

        .mag-layout {
          display: grid;
          grid-template-columns: 235px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        .section-nav,
        .reading-card,
        .state-card {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 18px;
          box-shadow: 0 8px 25px rgba(16, 24, 40, .05);
        }

        .section-nav {
          padding: 10px;
          position: sticky;
          top: 12px;
        }

        .nav-title {
          display: flex;
          justify-content: space-between;
          padding: 10px 9px;
          color: #667085;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .nav-item {
          display: block;
          width: 100%;
          border: 0;
          background: transparent;
          text-align: left;
          padding: 10px;
          border-radius: 9px;
          color: #475467;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 2px;
        }

        .nav-item:hover {
          background: #f8fafc;
        }

        .nav-item.active {
          background: #172033;
          color: #fff;
        }

        .reading-card {
          min-height: 420px;
          overflow: hidden;
        }

        .reading-head {
          padding: 20px 22px;
          border-bottom: 1px solid #eaecf0;
          background: #fcfcfd;
        }

        .section-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eef2f6;
          color: #344054;
          font-size: 10px;
          font-weight: 900;
        }

        .reading-head h2 {
          margin: 9px 0 4px;
          font-size: 22px;
        }

        .reading-head p {
          margin: 0;
          color: #667085;
          font-size: 12px;
        }

        .reading-content {
          padding: 22px;
        }

        .reading-content p {
          margin: 0 0 13px;
          color: #344054;
          font-size: 14px;
          line-height: 1.75;
          white-space: pre-wrap;
        }

        .content-gap {
          height: 3px;
        }

        .section-empty {
          padding: 35px 0;
          text-align: center;
          color: #667085;
          font-size: 13px;
        }

        .state-card {
          max-width: 700px;
          margin: 50px auto;
          padding: 35px 25px;
          text-align: center;
        }

        .state-card h2 {
          margin: 12px 0 7px;
        }

        .state-card p {
          margin: 0;
          color: #667085;
          line-height: 1.6;
        }

        .empty-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eef2f6;
          color: #475467;
          font-size: 10px;
          font-weight: 900;
        }

        .retry {
          margin-top: 15px;
          border: 0;
          border-radius: 9px;
          background: #172033;
          color: #fff;
          padding: 10px 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .loader {
          width: 30px;
          height: 30px;
          margin: 0 auto;
          border: 3px solid #eaecf0;
          border-top-color: #172033;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .mag-page {
            padding: 18px 12px 45px;
          }

          .mag-header {
            align-items: stretch;
            flex-direction: column;
          }

          .header-tools {
            width: 100%;
          }

          .month-box,
          .lang-box {
            flex: 1;
          }

          .cover-card {
            min-height: 190px;
          }

          .cover-content {
            padding: 22px;
          }

          .cover-placeholder,
          .cover-image {
            width: 115px;
          }

          .cover-placeholder {
            min-height: 190px;
          }

          .cover-placeholder strong {
            font-size: 45px;
          }

          .mag-layout {
            grid-template-columns: 1fr;
          }

          .section-nav {
            position: static;
            display: flex;
            gap: 5px;
            overflow-x: auto;
            padding: 8px;
          }

          .nav-title {
            display: none;
          }

          .nav-item {
            width: auto;
            min-width: max-content;
            margin: 0;
          }

          .reading-content {
            padding: 17px;
          }
        }
      `}</style>
    </main>
  );
}
