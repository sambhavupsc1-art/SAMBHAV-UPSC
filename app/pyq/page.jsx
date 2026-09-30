"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const subjects = [
  "Polity",
  "Economy",
  "History",
  "Geography",
  "Environment",
  "Science & Technology",
  "International Relations",
  "Art & Culture",
];

export default function PYQPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let attempts = 0;

    const authenticate = () => {
      attempts++;

      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        if (attempts < 30) {
          setTimeout(authenticate, 200);
          return;
        }

        setLoading(false);
        return;
      }

      webApp.ready();
      webApp.expand();

      fetch("/api/auth/me", {
        headers: {
          Authorization: `tma ${webApp.initData}`,
        },
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Authentication failed");
          }

          setUser(data.user);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    authenticate();
  }, []);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          Loading PYQ Intelligence...
        </div>
      </main>
    );
  }

  if (!user || user.status !== "approved") {
    return (
      <main style={styles.page}>
        <div style={styles.locked}>
          <h1>SAMBHAV UPSC</h1>
          <p>PYQ Intelligence</p>
          <div style={styles.lockBox}>
            Access required
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main style={styles.page}>
        <div style={styles.container}>

          {/* HEADER */}
          <header style={styles.header}>
            <button
              onClick={() => window.history.back()}
              style={styles.back}
            >
              ←
            </button>

            <div>
              <div style={styles.brand}>
                PYQ Intelligence
              </div>

              <div style={styles.subtitle}>
                UPSC Previous Year Questions
              </div>
            </div>
          </header>

          {/* HERO */}
          <section style={styles.hero}>
            <div style={styles.heroSmall}>
              UPSC PRELIMS + MAINS
            </div>

            <h1 style={styles.heroTitle}>
              Master PYQs.
              <br />
              Understand the pattern.
            </h1>

            <p style={styles.heroText}>
              Analyse previous year questions by subject,
              year and topic.
            </p>
          </section>

          {/* FILTER */}
          <section style={styles.section}>
            <div style={styles.sectionTitle}>
              Select Subject
            </div>

            <div style={styles.grid}>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  style={styles.subjectCard}
                  onClick={() =>
                    console.log(
                      `Selected subject: ${subject}`
                    )
                  }
                >
                  <span style={styles.subjectIcon}>
                    {subject === "Polity"
                      ? "⚖️"
                      : subject === "Economy"
                      ? "₹"
                      : subject === "History"
                      ? "🏛️"
                      : subject === "Geography"
                      ? "🌍"
                      : subject === "Environment"
                      ? "🌱"
                      : subject ===
                        "Science & Technology"
                      ? "⚛️"
                      : subject ===
                        "International Relations"
                      ? "🌐"
                      : "🎨"}
                  </span>

                  <span style={styles.subjectName}>
                    {subject}
                  </span>

                  <span style={styles.arrow}>
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* YEAR */}
          <section style={styles.section}>
            <div style={styles.sectionTitle}>
              Quick Access
            </div>

            <div style={styles.yearGrid}>
              {[2026, 2025, 2024, 2023].map(
                (year) => (
                  <button
                    key={year}
                    style={styles.yearCard}
                    onClick={() =>
                      console.log(
                        `Selected year: ${year}`
                      )
                    }
                  >
                    <span>{year}</span>
                    <small>PYQs</small>
                  </button>
                )
              )}
            </div>
          </section>

          {/* COMING SOON */}
          <section style={styles.infoCard}>
            <div style={styles.infoIcon}>✦</div>

            <div>
              <div style={styles.infoTitle}>
                PYQ Analytics
              </div>

              <div style={styles.infoText}>
                Topic frequency, difficulty,
                repeated concepts and your
                performance will appear here.
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f3",
    color: "#111111",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "18px 16px 40px",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
  },

  locked: {
    maxWidth: "500px",
    margin: "100px auto",
    textAlign: "center",
    padding: "30px",
  },

  lockBox: {
    marginTop: "20px",
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "18px",
    padding: "20px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "22px",
  },

  back: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    border: "1px solid #e4e4e2",
    background: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    color: "#888",
    fontSize: "11px",
    marginTop: "3px",
  },

  hero: {
    background: "#111",
    color: "#fff",
    borderRadius: "25px",
    padding: "24px",
    marginBottom: "27px",
  },

  heroSmall: {
    color: "#aaa",
    fontSize: "10px",
    letterSpacing: "1.4px",
    fontWeight: "700",
  },

  heroTitle: {
    fontSize: "27px",
    lineHeight: "1.15",
    letterSpacing: "-0.8px",
    margin: "12px 0",
  },

  heroText: {
    color: "#bcbcbc",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
  },

  section: {
    marginBottom: "25px",
  },

  sectionTitle: {
    fontSize: "19px",
    fontWeight: "800",
    marginBottom: "13px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  subjectCard: {
    minHeight: "78px",
    borderRadius: "18px",
    border: "1px solid #e5e5e3",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer",
  },

  subjectIcon: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    borderRadius: "11px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
  },

  subjectName: {
    fontSize: "12px",
    fontWeight: "700",
    flex: 1,
  },

  arrow: {
    color: "#999",
    fontSize: "16px",
  },

  yearGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },

  yearCard: {
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "17px",
    padding: "16px 8px",
    cursor: "pointer",
  },

  yearCardSpan: {
    fontWeight: "800",
  },

  infoCard: {
    background: "#fff",
    border: "1px solid #e5e5e3",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
  },

  infoIcon: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "13px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTitle: {
    fontSize: "14px",
    fontWeight: "800",
  },

  infoText: {
    color: "#858585",
    fontSize: "11px",
    lineHeight: "1.5",
    marginTop: "5px",
  },
};
