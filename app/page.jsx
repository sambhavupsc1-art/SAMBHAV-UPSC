"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const modules = [
  {
    title: "Current Affairs",
    subtitle: "Daily UPSC-focused updates",
    icon: "CA",
  },
  {
    title: "PYQ",
    subtitle: "Previous Year Questions",
    icon: "PY",
  },
  {
    title: "Prelims Test",
    subtitle: "Practice & test series",
    icon: "PT",
  },
  {
    title: "Mains",
    subtitle: "Answer writing practice",
    icon: "MA",
  },
  {
    title: "AI Evaluation",
    subtitle: "Evaluate your answers",
    icon: "AI",
  },
  {
    title: "Study Material",
    subtitle: "Notes, PDFs & resources",
    icon: "SM",
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#080b10",
    color: "#f8fafc",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    paddingBottom: "40px",
  },

  container: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "22px 18px",
    boxSizing: "border-box",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "750",
    letterSpacing: "-0.5px",
  },

  brandSmall: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "3px",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },

  profile: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#151a22",
    border: "1px solid #252d38",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },

  welcome: {
    marginBottom: "22px",
  },

  greeting: {
    fontSize: "27px",
    fontWeight: "750",
    letterSpacing: "-0.8px",
    margin: 0,
  },

  greetingSub: {
    color: "#7c8798",
    fontSize: "14px",
    marginTop: "7px",
  },

  progressCard: {
    background: "#10151d",
    border: "1px solid #1e2631",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "25px",
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressTitle: {
    fontSize: "14px",
    fontWeight: "650",
  },

  progressValue: {
    fontSize: "13px",
    color: "#8d98a8",
  },

  progressTrack: {
    height: "5px",
    background: "#202733",
    borderRadius: "10px",
    marginTop: "13px",
    overflow: "hidden",
  },

  progressBar: {
    width: "0%",
    height: "100%",
    background: "#d9e2ec",
    borderRadius: "10px",
  },

  sectionTitle: {
    fontSize: "13px",
    color: "#7c8798",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    fontWeight: "650",
    marginBottom: "12px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  card: {
    minHeight: "145px",
    background: "#10151d",
    border: "1px solid #1e2631",
    borderRadius: "18px",
    padding: "17px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    cursor: "pointer",
  },

  icon: {
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    background: "#171e28",
    border: "1px solid #28313d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "750",
    color: "#cbd5e1",
    letterSpacing: "0.4px",
  },

  cardTitle: {
    fontSize: "16px",
    fontWeight: "680",
    marginTop: "15px",
  },

  cardSubtitle: {
    color: "#6f7b8c",
    fontSize: "12px",
    lineHeight: "1.5",
    marginTop: "5px",
  },

  footer: {
    textAlign: "center",
    color: "#475263",
    fontSize: "11px",
    marginTop: "32px",
  },

  pending: {
    maxWidth: "500px",
    margin: "80px auto",
    padding: "30px",
    textAlign: "center",
    background: "#10151d",
    border: "1px solid #1e2631",
    borderRadius: "20px",
  },
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        setError("Telegram authentication data nahi mila.");
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
        .catch((err) => {
          setError(err.message || "Server connection failed.");
        })
        .finally(() => {
          setLoading(false);
        });
    };

    authenticate();
  }, []);

  if (loading) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <div style={styles.pending}>
              <div style={styles.brand}>SAMBHAV UPSC</div>
              <p style={styles.greetingSub}>Authenticating...</p>
            </div>
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
          <div style={styles.container}>
            <div style={styles.pending}>
              <div style={styles.brand}>SAMBHAV UPSC</div>
              <p style={{ color: "#f87171", marginTop: "15px" }}>
                {error}
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  if (user.status !== "approved") {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <div style={styles.pending}>
              <div style={styles.brand}>SAMBHAV UPSC</div>

              <p style={{ fontSize: "22px", fontWeight: "700" }}>
                Access {user.status}
              </p>

              <p style={styles.greetingSub}>
                {user.status === "pending"
                  ? "Admin approval pending."
                  : user.status === "rejected"
                  ? "Your access request was rejected."
                  : "Your account is currently blocked."}
              </p>

              <a
                href="/admin"
                style={{
                  display: "inline-block",
                  marginTop: "22px",
                  color: "#cbd5e1",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
              >
                Admin Panel
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  const firstName = user.first_name || "Aspirant";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main style={styles.page}>
        <div style={styles.container}>
          <header style={styles.topBar}>
            <div>
              <div style={styles.brand}>SAMBHAV UPSC</div>
              <div style={styles.brandSmall}>
                UPSC Preparation Platform
              </div>
            </div>

            <div style={styles.profile}>{initial}</div>
          </header>

          <section style={styles.welcome}>
            <h1 style={styles.greeting}>
              Hello, {firstName}
            </h1>

            <p style={styles.greetingSub}>
              Continue your preparation.
            </p>
          </section>

          <section style={styles.progressCard}>
            <div style={styles.progressTop}>
              <span style={styles.progressTitle}>
                Preparation Progress
              </span>

              <span style={styles.progressValue}>
                0% completed
              </span>
            </div>

            <div style={styles.progressTrack}>
              <div style={styles.progressBar} />
            </div>
          </section>

          <div style={styles.sectionTitle}>
            Preparation
          </div>

          <section style={styles.grid}>
            {modules.map((module) => (
              <div
                key={module.title}
                style={styles.card}
                onClick={() => {
                  console.log(`${module.title} clicked`);
                }}
              >
                <div style={styles.icon}>
                  {module.icon}
                </div>

                <div>
                  <div style={styles.cardTitle}>
                    {module.title}
                  </div>

                  <div style={styles.cardSubtitle}>
                    {module.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <a
            href="/admin"
            style={{
              display: "block",
              marginTop: "18px",
              padding: "14px",
              textAlign: "center",
              borderRadius: "14px",
              border: "1px solid #1e2631",
              background: "#0d1219",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "12px",
            }}
          >
            Admin Panel
          </a>

          <div style={styles.footer}>
            SAMBHAV UPSC · Built for serious preparation
          </div>
        </div>
      </main>
    </>
  );
        }
