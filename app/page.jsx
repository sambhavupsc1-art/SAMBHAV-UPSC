"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const modules = [
  {
    title: "Current Affairs",
    subtitle: "UPSC Current Affairs",
    icon: "📰",
  },
  {
    title: "PYQ Intelligence",
    subtitle: "UPSC Previous Year Questions",
    icon: "🎯",
  },
  {
    title: "Prelims Test",
    subtitle: "Practice & Test Series",
    icon: "📝",
  },
  {
    title: "Mains",
    subtitle: "Answer Writing Practice",
    icon: "✍️",
  },
  {
    title: "AI Answer Evaluation",
    subtitle: "UPSC Mains Answer Analysis",
    icon: "🤖",
  },
  {
    title: "Study Material",
    subtitle: "Notes • PDFs • Resources",
    icon: "📚",
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f3",
    color: "#111111",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    paddingBottom: "105px",
  },

  container: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "18px 16px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "25px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.6px",
  },

  brandSub: {
    fontSize: "10px",
    color: "#8a8a8a",
    marginTop: "3px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#111111",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
  },

  greeting: {
    marginBottom: "20px",
  },

  greetingTitle: {
    margin: 0,
    fontSize: "29px",
    lineHeight: "1.15",
    fontWeight: "800",
    letterSpacing: "-1px",
  },

  greetingSub: {
    marginTop: "7px",
    color: "#777777",
    fontSize: "14px",
  },

  accessCard: {
    background: "#111111",
    color: "#ffffff",
    borderRadius: "24px",
    padding: "21px",
    marginBottom: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  accessLabel: {
    fontSize: "10px",
    color: "#a7a7a7",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    fontWeight: "700",
  },

  accessTitle: {
    marginTop: "8px",
    fontSize: "22px",
    fontWeight: "800",
  },

  accessSub: {
    marginTop: "6px",
    color: "#bdbdbd",
    fontSize: "13px",
  },

  secretaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    background: "#111111",
    color: "#ffffff",
    padding: "15px",
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "26px",
    cursor: "pointer",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "13px",
  },

  sectionTitle: {
    fontSize: "21px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  sectionSmall: {
    fontSize: "11px",
    color: "#999999",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e9e9e7",
    borderRadius: "22px",
    padding: "15px",
    minHeight: "108px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxSizing: "border-box",
    cursor: "pointer",
    boxShadow: "0 3px 12px rgba(0,0,0,0.035)",
  },

  iconBox: {
    width: "46px",
    height: "46px",
    minWidth: "46px",
    borderRadius: "15px",
    background: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },

  cardContent: {
    minWidth: 0,
    flex: 1,
  },

  cardTitle: {
    fontSize: "14px",
    fontWeight: "800",
    lineHeight: "1.2",
  },

  cardSubtitle: {
    marginTop: "5px",
    color: "#858585",
    fontSize: "10px",
    lineHeight: "1.35",
  },

  arrow: {
    width: "28px",
    height: "28px",
    minWidth: "28px",
    borderRadius: "50%",
    background: "#f0f0ee",
    color: "#777777",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },

  adminButton: {
    display: "block",
    width: "100%",
    marginTop: "18px",
    padding: "14px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #e4e4e2",
    color: "#777777",
    textAlign: "center",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "600",
    boxSizing: "border-box",
  },

  bottomNav: {
    position: "fixed",
    left: "50%",
    bottom: "12px",
    transform: "translateX(-50%)",
    width: "calc(100% - 28px)",
    maxWidth: "730px",
    height: "68px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #e5e5e3",
    borderRadius: "25px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    alignItems: "center",
    zIndex: 50,
    backdropFilter: "blur(14px)",
  },

  navItem: {
    height: "52px",
    margin: "5px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    fontSize: "10px",
    color: "#777777",
    fontWeight: "600",
    cursor: "pointer",
  },

  navActive: {
    background: "#eeeeec",
    color: "#111111",
  },

  navIcon: {
    fontSize: "18px",
    lineHeight: "18px",
  },

  pendingCard: {
    marginTop: "70px",
    background: "#ffffff",
    border: "1px solid #e5e5e3",
    borderRadius: "24px",
    padding: "30px 22px",
    textAlign: "center",
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
            <div style={styles.pendingCard}>
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
            <div style={styles.pendingCard}>
              <div style={styles.brand}>SAMBHAV UPSC</div>
              <p style={{ color: "#d33", marginTop: "15px" }}>
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
            <div style={styles.pendingCard}>
              <div style={styles.brand}>SAMBHAV UPSC</div>

              <p
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  marginTop: "22px",
                }}
              >
                Access {user.status}
              </p>

              <p style={styles.greetingSub}>
                {user.status === "pending"
                  ? "Admin approval pending."
                  : user.status === "rejected"
                  ? "Your access request was rejected."
                  : "Your account is currently blocked."}
              </p>

              <a href="/admin" style={styles.adminButton}>
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

          {/* HEADER */}
          <header style={styles.header}>
            <div>
              <div style={styles.brand}>SAMBHAV UPSC</div>
              <div style={styles.brandSub}>
                UPSC Preparation Platform
              </div>
            </div>

            <div style={styles.avatar}>{initial}</div>
          </header>

          {/* GREETING */}
          <section style={styles.greeting}>
            <h1 style={styles.greetingTitle}>
              Hello, {firstName}
            </h1>

            <p style={styles.greetingSub}>
              Continue your preparation.
            </p>
          </section>

          {/* ACCESS CARD */}
          <section style={styles.accessCard}>
            <div style={styles.accessLabel}>
              Officer Access Card
            </div>

            <div style={styles.accessTitle}>
              {firstName}
            </div>

            <div style={styles.accessSub}>
              Clearance: ACTIVE
            </div>
          </section>

          {/* AI SECRETARY */}
          <button
            style={styles.secretaryButton}
            onClick={() =>
              console.log("AI Secretary coming soon")
            }
          >
            ✦ Open AI Secretary →
          </button>

          {/* QUICK LAUNCH */}
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Quick Launch
            </div>

            <div style={styles.sectionSmall}>
              UPSC • 2026
            </div>
          </div>

          <section style={styles.grid}>
            {modules.map((module) => (
              <div
                key={module.title}
                style={styles.card}
                onClick={() =>
                  console.log(`${module.title} clicked`)
                }
              >
                <div style={styles.iconBox}>
                  {module.icon}
                </div>

                <div style={styles.cardContent}>
                  <div style={styles.cardTitle}>
                    {module.title}
                  </div>

                  <div style={styles.cardSubtitle}>
                    {module.subtitle}
                  </div>
                </div>

                <div style={styles.arrow}>
                  ›
                </div>
              </div>
            ))}
          </section>

          {/* ADMIN */}
          <a href="/admin" style={styles.adminButton}>
            Admin Panel
          </a>

        </div>

        {/* BOTTOM NAV */}
        <nav style={styles.bottomNav}>
          <div
            style={{
              ...styles.navItem,
              ...styles.navActive,
            }}
          >
            <span style={styles.navIcon}>⌂</span>
            Home
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              console.log("Current Affairs")
            }
          >
            <span style={styles.navIcon}>▤</span>
            CA
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              console.log("GS")
            }
          >
            <span style={styles.navIcon}>▣</span>
            GS
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              console.log("AI")
            }
          >
            <span style={styles.navIcon}>▦</span>
            AI
          </div>
        </nav>
      </main>
    </>
  );
            }
