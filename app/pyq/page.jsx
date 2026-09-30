"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let attempts = 0;
    let stopped = false;

    const authenticate = async () => {
      if (stopped) return;

      attempts++;

      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        if (attempts < 50) {
          setTimeout(authenticate, 200);
          return;
        }

        setError(
          "Telegram authentication data nahi mila. Mini App ko Telegram ke andar se reopen karein."
        );
        setLoading(false);
        return;
      }

      webApp.ready();
      webApp.expand();

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `tma ${webApp.initData}`,
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Authentication failed"
          );
        }

        if (!data.user) {
          throw new Error("User information nahi mili.");
        }

        setUser(data.user);
      } catch (err) {
        console.error("PYQ authentication error:", err);

        setError(
          err.message || "Authentication failed."
        );
      } finally {
        setLoading(false);
      }
    };

    authenticate();

    return () => {
      stopped = true;
    };
  }, []);

  if (loading) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <h2 style={styles.brand}>
              SAMBHAV UPSC
            </h2>

            <p style={styles.muted}>
              Opening PYQ Intelligence...
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <h2 style={styles.brand}>
              SAMBHAV UPSC
            </h2>

            <h3 style={{ marginTop: "22px" }}>
              Authentication Error
            </h3>

            <p style={styles.muted}>
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              style={styles.retryButton}
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  if (user.status !== "approved") {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.loadingBox}>
            <h2 style={styles.brand}>
              SAMBHAV UPSC
            </h2>

            <h3 style={{ marginTop: "22px" }}>
              Access {user.status}
            </h3>

            <p style={styles.muted}>
              {user.status === "pending"
                ? "Admin approval pending."
                : user.status === "rejected"
                ? "Your access request was rejected."
                : "Your account is currently blocked."}
            </p>
          </div>
        </main>
      </>
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
              onClick={() => router.push("/")}
              style={styles.back}
              aria-label="Back to dashboard"
            >
              ←
            </button>

            <div style={{ flex: 1 }}>
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
              Analyse previous year questions by
              subject, year and topic.
            </p>
          </section>

          {/* SUBJECTS */}
          <section style={styles.section}>
            <div style={styles.sectionTitle}>
              Select Subject
            </div>

            <div style={styles.grid}>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  style={styles.subjectCard}
                  onClick={() => {
                    console.log(
                      "Selected subject:",
                      subject
                    );
                  }}
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

          {/* YEARS */}
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
                        "Selected year:",
                        year
                      )
                    }
                  >
                    <strong>{year}</strong>
                    <small>PYQs</small>
                  </button>
                )
              )}
            </div>
          </section>

          {/* ANALYTICS */}
          <section style={styles.infoCard}>
            <div style={styles.infoIcon}>
              ✦
            </div>

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

  loadingBox: {
    maxWidth: "500px",
    margin: "100px auto",
    padding: "30px",
    textAlign: "center",
    background: "#ffffff",
    border: "1px solid #e5e5e3",
    borderRadius: "24px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  muted: {
    color: "#777777",
    fontSize: "13px",
    lineHeight: "1.5",
    marginTop: "10px",
  },

  retryButton: {
    marginTop: "18px",
    border: "none",
    borderRadius: "14px",
    background: "#111111",
    color: "#ffffff",
    padding: "12px 22px",
    fontWeight: "700",
    cursor: "pointer",
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
    background: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
  },

  subtitle: {
    color: "#888888",
    fontSize: "11px",
    marginTop: "3px",
  },

  hero: {
    background: "#111111",
    color: "#ffffff",
    borderRadius: "25px",
    padding: "24px",
    marginBottom: "27px",
  },

  heroSmall: {
    color: "#aaaaaa",
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
    background: "#ffffff",
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
    background: "#111111",
    color: "#ffffff",
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
    color: "#999999",
    fontSize: "16px",
  },

  yearGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },

  yearCard: {
    background: "#ffffff",
    border: "1px solid #e5e5e3",
    borderRadius: "17px",
    padding: "16px 8px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  infoCard: {
    background: "#ffffff",
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
    background: "#111111",
    color: "#ffffff",
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
