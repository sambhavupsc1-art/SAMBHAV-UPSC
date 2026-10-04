"use client";

import { useEffect, useState } from "react";

const modules = [
  {
    title: "Current Affairs",
    subtitle: "Daily • Monthly • UPSC Analysis",
    icon: "📰",
    route: "/current-affairs",
  },
  {
    title: "PYQ Intelligence",
    subtitle: "Prelims • Mains • Topic Wise",
    icon: "🎯",
    route: "/pyq",
  },
  {
    title: "Prelims Practice",
    subtitle: "PYQ Based • MCQs • Analysis",
    icon: "📝",
    route: null,
  },
  {
    title: "Mains Answer Writing",
    subtitle: "GS I • II • III • IV",
    icon: "✍️",
    route: "/answer",
  },
  {
    title: "AI Evaluation",
    subtitle: "Score • Feedback • Improvement",
    icon: "🤖",
    route: null,
  },
  {
    title: "Study Material",
    subtitle: "GS • Notes • Revision",
    icon: "📚",
    route: null,
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg),
    color: "var(--text),
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    paddingBottom: "95px",
  },

  container: {
    width: "100%",
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "20px 22px 42px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },

  brand: {
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "-.6px",
  },

  brandSub: {
    marginTop: "4px",
    fontSize: "9px",
    color: "var(--muted),
    letterSpacing: "1.2px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  avatar: {
    width: "43px",
    height: "43px",
    borderRadius: "50%",
    background: "var(--dark-surface),
    color: "#dfc477",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "15px",
  },

  greeting: {
    marginBottom: "18px",
  },

  greetingSmall: {
    color: "var(--muted),
    fontSize: "11px",
    fontWeight: "700",
  },

  greetingTitle: {
    margin: "5px 0 0",
    fontSize: "29px",
    lineHeight: "1.1",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  greetingSub: {
    marginTop: "7px",
    color: "var(--muted),
    fontSize: "12px",
  },

  tagline: {
    marginTop: "9px",
    color: "var(--text),
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "-.1px",
  },

  premiumCard: {
    position: "relative",
    overflow: "hidden",
    background: "var(--dark-surface),
    color: "#fff",
    borderRadius: "25px",
    padding: "21px",
    marginBottom: "17px",
    boxShadow: "0 16px 35px rgba(16,16,16,.15)",
  },

  glow: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(223,196,119,.08)",
    right: "-70px",
    top: "-85px",
  },

  premiumLabel: {
    position: "relative",
    zIndex: 2,
    color: "#dfc477",
    fontSize: "9px",
    letterSpacing: "1.4px",
    fontWeight: "900",
  },

  premiumTitle: {
    position: "relative",
    zIndex: 2,
    marginTop: "7px",
    fontSize: "21px",
    fontWeight: "900",
  },

  premiumSub: {
    position: "relative",
    zIndex: 2,
    marginTop: "6px",
    color: "var(--dark-muted),
    fontSize: "10px",
  },

  validity: {
    position: "relative",
    zIndex: 2,
    marginTop: "14px",
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(223,196,119,.22)",
    color: "#dfc477",
    fontSize: "9px",
    fontWeight: "800",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "9px",
    marginBottom: "21px",
  },

  stat: {
    background: "var(--surface),
    border: "1px solid var(--border),
    borderRadius: "17px",
    padding: "14px 10px",
    textAlign: "center",
  },

  statValue: {
    fontSize: "18px",
    fontWeight: "900",
  },

  statLabel: {
    marginTop: "4px",
    color: "var(--muted),
    fontSize: "8px",
    fontWeight: "700",
    lineHeight: "1.3",
  },

  countdown: {
    background: "var(--dark-surface),
    color: "#fff",
    borderRadius: "20px",
    padding: "17px",
    marginBottom: "22px",
  },

  countdownTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  countdownTitle: {
    fontSize: "12px",
    fontWeight: "850",
  },

  countdownValue: {
    color: "#dfc477",
    fontSize: "15px",
    fontWeight: "900",
  },

  progressTrack: {
    height: "5px",
    borderRadius: "99px",
    background: "#292929",
    marginTop: "12px",
    overflow: "hidden",
  },

  progressFill: {
    width: "42%",
    height: "100%",
    background: "#dfc477",
    borderRadius: "99px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "-.5px",
  },

  sectionSub: {
    fontSize: "9px",
    color: "var(--muted),
    fontWeight: "700",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "11px",
    marginBottom: "23px",
  },

  module: {
    background: "var(--surface),
    border: "1px solid var(--border),
    borderRadius: "20px",
    padding: "15px",
    minHeight: "125px",
    boxSizing: "border-box",
    cursor: "pointer",
    boxShadow: "0 5px 16px rgba(16,16,16,.035)",
  },

  icon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "var(--dark-surface),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    marginBottom: "12px",
  },

  moduleTitle: {
    fontSize: "13px",
    fontWeight: "850",
  },

  moduleSub: {
    marginTop: "5px",
    color: "var(--muted),
    fontSize: "9px",
    lineHeight: "1.4",
  },

  mission: {
    background: "var(--surface),
    border: "1px solid var(--border),
    borderRadius: "22px",
    padding: "17px",
    marginBottom: "22px",
  },

  missionRow: {
    marginTop: "14px",
  },

  missionTop: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    fontWeight: "800",
  },

  missionMuted: {
    color: "var(--muted),
  },

  missionTrack: {
    height: "5px",
    background: "var(--track),
    borderRadius: "99px",
    marginTop: "7px",
    overflow: "hidden",
  },

  missionFill: {
    height: "100%",
    background: "var(--dark-surface),
    borderRadius: "99px",
  },

  intelligence: {
    background: "var(--dark-surface),
    color: "#fff",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "22px",
  },

  intelligenceRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 0",
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },

  intelligenceIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "rgba(255,255,255,.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  intelligenceText: {
    flex: 1,
    fontSize: "10px",
    fontWeight: "750",
  },

  intelligenceSub: {
    marginTop: "2px",
    color: "var(--dark-muted),
    fontSize: "8px",
  },

  arrow: {
    color: "#dfc477",
    fontSize: "17px",
  },

  aiInsight: {
    background: "var(--surface),
    border: "1px solid rgba(184,148,69,.25)",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "15px",
  },

  aiBadge: {
    display: "inline-block",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "var(--dark-surface),
    color: "#dfc477",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: ".8px",
  },

  aiTitle: {
    marginTop: "10px",
    fontSize: "17px",
    fontWeight: "900",
  },

  aiText: {
    marginTop: "5px",
    color: "var(--muted),
    fontSize: "10px",
    lineHeight: "1.5",
  },

  profileCard: {
    background: "var(--surface),
    border: "1px solid var(--border),
    borderRadius: "25px",
    padding: "20px",
    marginBottom: "15px",
  },

  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },

  profileAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "20px",
    background: "var(--dark-surface),
    color: "#dfc477",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    flexShrink: 0,
  },

  profileName: {
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "-.5px",
  },

  profileEmail: {
    marginTop: "5px",
    color: "var(--muted),
    fontSize: "10px",
    wordBreak: "break-word",
  },

  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "13px 0",
    borderTop: "1px solid var(--border),
  },

  profileLabel: {
    color: "var(--muted),
    fontSize: "10px",
    fontWeight: "700",
  },

  profileValue: {
    fontSize: "10px",
    fontWeight: "850",
    textAlign: "right",
    wordBreak: "break-word",
  },

  activeBadge: {
    display: "inline-flex",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "var(--dark-surface),
    color: "#dfc477",
    fontSize: "8px",
    fontWeight: "900",
  },

  logoutButton: {
    width: "100%",
    padding: "15px",
    border: "1px solid rgba(181,43,34,.18)",
    borderRadius: "16px",
    background: "var(--surface),
    color: "#b52b22",
    fontSize: "11px",
    fontWeight: "900",
    cursor: "pointer",
  },

  logoutLoading: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  bottomNav: {
    position: "fixed",
    left: "50%",
    bottom: "11px",
    transform: "translateX(-50%)",
    width: "calc(100% - 28px)",
    maxWidth: "730px",
    height: "65px",
    background: "rgba(255,253,249,.97)",
    border: "1px solid var(--border),
    borderRadius: "23px",
    boxShadow: "0 10px 30px rgba(16,16,16,.13)",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    alignItems: "center",
    zIndex: 50,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },

  navItem: {
    height: "52px",
    margin: "5px",
    borderRadius: "17px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    color: "var(--muted),
    fontSize: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  navActive: {
    background: "var(--dark-surface),
    color: "#dfc477",
  },

  navIcon: {
    fontSize: "16px",
    lineHeight: "16px",
  },
};

export default function PremiumHome() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("home");
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("sambhav-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("sambhav-theme", theme);
    } catch {}
  }, [theme]);

  const dark = theme === "dark";

  const themeVars = {
    "--bg": dark ? "#0b0c0e" : "#f5f2eb",
    "--text": dark ? "#f4f4f2" : "#101010",
    "--muted": dark ? "#a6a6a1" : "#77736b",
    "--surface": dark ? "#17181b" : "#fffdf9",
    "--dark-surface": "#101010",
    "--dark-muted": "#b9b9b9",
    "--gold": "#dfc477",
    "--border": dark
      ? "rgba(255,255,255,.09)"
      : "rgba(16,16,16,.08)",
    "--track": dark ? "#292b30" : "#e7e2d9",
    colorScheme: dark ? "dark" : "light",
  };

  const pageStyle = {
    ...pageStyle,
    ...themeVars,
  };

  const themeButtonStyle = {
    border: `1px solid ${dark ? "rgba(223,196,119,.28)" : "rgba(16,16,16,.12)"}`,
    background: dark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.72)",
    color: "var(--text)",
    minWidth: "78px",
    height: "36px",
    padding: "0 11px",
    borderRadius: "12px",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: ".55px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    boxShadow: dark
      ? "0 6px 18px rgba(0,0,0,.18)"
      : "0 6px 18px rgba(16,16,16,.06)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  useEffect(() => {
    let stopped = false;

    const authenticate = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error || "Authentication failed"
          );
        }

        if (!data?.user) {
          throw new Error("User authentication failed.");
        }

        if (
          data.user.status &&
          data.user.status !== "approved"
        ) {
          throw new Error(
            "Your SAMBHAV account is not approved."
          );
        }

        if (stopped) return;

        setUser(data.user);
        setSubscription(data.subscription || null);
        setError("");
      } catch (err) {
        if (stopped) return;

        console.error(
          "Premium Home authentication error:",
          err
        );

        setError(
          err.message || "Authentication failed."
        );
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    authenticate();

    return () => {
      stopped = true;
    };
  }, []);

  const firstName =
    user?.first_name ||
    user?.firstName ||
    user?.name ||
    "Aspirant";

  const initial =
    firstName.charAt(0).toUpperCase();

  const go = (route) => {
    if (!route) return;
    window.location.href = route;
  };

  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Logout failed."
        );
      }

      window.location.href = "/login";
    } catch (err) {
      console.error(
        "SAMBHAV logout error:",
        err
      );

      setLoggingOut(false);

      alert(
        err.message ||
          "Logout failed. Please try again."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <main
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={styles.brand}>
            SAMBHAV UPSC
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "var(--muted),
              fontSize: "11px",
            }}
          >
            Loading Premium...
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main style={pageStyle}>
        <div className="sambhav-container" style={styles.container}>
          <div
            style={{
              background: "var(--surface),
              borderRadius: "23px",
              padding: "25px",
              marginTop: "80px",
              textAlign: "center",
              border:
                "1px solid rgba(16,16,16,.08)",
            }}
          >
            <div style={styles.brand}>
              SAMBHAV UPSC
            </div>

            <div
              style={{
                marginTop: "12px",
                color: "#b52b22",
                fontSize: "11px",
                lineHeight: "1.5",
              }}
            >
              {error ||
                "Premium access verification failed."}
            </div>

            <button
              style={{
                marginTop: "18px",
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "14px",
                background: "var(--dark-surface),
                color: "#fff",
                fontWeight: "800",
                cursor: "pointer",
              }}
              onClick={() => {
                window.location.href = "/";
              }}
            >
              ← Back to SAMBHAV
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * PROFILE VIEW
   * =========================================================
   */

  if (activeView === "profile") {
    const plan =
      subscription?.plan ||
      user?.plan ||
      "free";

    const status =
      user?.status ||
      "approved";

    const email =
      user?.email ||
      "Email not available";

    const createdAt =
      user?.created_at ||
      user?.createdAt ||
      null;

    const premiumStarted =
      subscription?.started_at ||
      null;

    const premiumExpiry =
      subscription?.expires_at ||
      null;

    return (
      <main style={pageStyle}>
        <div className="sambhav-container" style={styles.container}>
          <header style={styles.header}>
            <div>
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <div style={styles.brandSub}>
                Profile
              </div>
            </div>

            <div className="sambhav-header-actions">
              <button
                type="button"
                onClick={() => setTheme(dark ? "light" : "dark")}
                style={themeButtonStyle}
                aria-label="Toggle theme"
              >
                {dark ? "☀ LIGHT" : "◐ DARK"}
              </button>
              <div style={styles.avatar}>
                {initial}
              </div>
            </div>
          </header>

          <button
            onClick={() =>
              setActiveView("home")
            }
            style={{
              border: "none",
              background: "transparent",
              padding: "0",
              marginBottom: "18px",
              fontSize: "11px",
              fontWeight: "800",
              color: "var(--muted),
              cursor: "pointer",
            }}
          >
            ← Back to Premium Home
          </button>

          <section style={styles.profileCard}>
            <div style={styles.profileTop}>
              <div style={styles.profileAvatar}>
                {initial}
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div style={styles.profileName}>
                  {firstName}
                </div>

                <div style={styles.profileEmail}>
                  {email}
                </div>
              </div>
            </div>

            <div style={styles.profileRow}>
              <div style={styles.profileLabel}>
                Account Status
              </div>

              <div style={styles.activeBadge}>
                {String(status).toUpperCase()}
              </div>
            </div>

            <div style={styles.profileRow}>
              <div style={styles.profileLabel}>
                Current Plan
              </div>

              <div style={styles.profileValue}>
                {String(plan).toUpperCase()}
              </div>
            </div>

            {subscription && (
              <>
                <div style={styles.profileRow}>
                  <div style={styles.profileLabel}>
                    Premium Started
                  </div>

                  <div style={styles.profileValue}>
                    {formatDateTime(
                      premiumStarted
                    )}
                  </div>
                </div>

                <div style={styles.profileRow}>
                  <div style={styles.profileLabel}>
                    Premium Expiry
                  </div>

                  <div style={styles.profileValue}>
                    {formatDateTime(
                      premiumExpiry
                    )}
                  </div>
                </div>
              </>
            )}

            {!subscription && (
              <div style={styles.profileRow}>
                <div style={styles.profileLabel}>
                  Premium
                </div>

                <div style={styles.profileValue}>
                  No active subscription
                </div>
              </div>
            )}

            <div style={styles.profileRow}>
              <div style={styles.profileLabel}>
                Account Created
              </div>

              <div style={styles.profileValue}>
                {formatDate(createdAt)}
              </div>
            </div>
          </section>

          <section
            style={{
              ...styles.profileCard,
              padding: "17px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "900",
                marginBottom: "6px",
              }}
            >
              Account Security
            </div>

            <div
              style={{
                color: "var(--muted),
                fontSize: "9px",
                lineHeight: "1.5",
                marginBottom: "15px",
              }}
            >
              Your SAMBHAV account session is
              protected by a secure HTTP-only
              authentication cookie.
            </div>

            <button
              onClick={logout}
              disabled={loggingOut}
              style={{
                ...styles.logoutButton,
                ...(loggingOut
                  ? styles.logoutLoading
                  : {}),
              }}
            >
              {loggingOut
                ? "LOGGING OUT..."
                : "LOG OUT"}
            </button>
          </section>
        </div>

        <nav style={styles.bottomNav}>
          <div
            style={styles.navItem}
            onClick={() =>
              setActiveView("home")
            }
          >
            <span style={styles.navIcon}>
              ⌂
            </span>
            Home
          </div>

          <div
            style={styles.navItem}
            onClick={() => go("/pyq")}
          >
            <span style={styles.navIcon}>
              ▣
            </span>
            Practice
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              go("/current-affairs")
            }
          >
            <span style={styles.navIcon}>
              ▤
            </span>
            Current
          </div>

          <div
            style={styles.navItem}
            onClick={() => {
              console.log("AI module");
            }}
          >
            <span style={styles.navIcon}>
              ✦
            </span>
            AI
          </div>

          <div
            style={{
              ...styles.navItem,
              ...styles.navActive,
            }}
            onClick={() =>
              setActiveView("profile")
            }
          >
            <span style={styles.navIcon}>
              ●
            </span>
            Profile
          </div>
        </nav>
      </main>
    );
  }

  /*
   * =========================================================
   * PREMIUM HOME
   * =========================================================
   */

  return (
    <main style={pageSty

      <style>{`
        .sambhav-container {
          width: 100%;
        }

        .sambhav-header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
        }

        .sambhav-module-card {
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .sambhav-module-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(16,16,16,.08) !important;
        }

        @media (min-width: 900px) {
          .sambhav-container {
            padding-left: 34px !important;
            padding-right: 34px !important;
          }

          .sambhav-module-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
        }

        @media (max-width: 640px) {
          .sambhav-container {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          .sambhav-header-actions {
            gap: 7px;
          }

          .sambhav-header-actions button {
            min-width: 70px !important;
            height: 34px !important;
            padding: 0 8px !important;
            font-size: 8px !important;
          }

          .sambhav-module-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (min-width: 641px) and (max-width: 899px) {
          .sambhav-module-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 420px) {
          .sambhav-header-actions {
            gap: 5px;
          }

          .sambhav-header-actions button {
            min-width: 62px !important;
            letter-spacing: .25px !important;
          }
        }
      `}</style>le}>
      <div className="sambhav-container" style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>
              SAMBHAV UPSC
            </div>

            <div style={styles.brandSub}>
              Premium Preparation Platform
            </div>
          </div>

          <div className="sambhav-header-actions">
            <button
              type="button"
              onClick={() => setTheme(dark ? "light" : "dark")}
              style={themeButtonStyle}
              aria-label="Toggle theme"
            >
              {dark ? "☀ LIGHT" : "◐ DARK"}
            </button>
            <div style={styles.avatar}>
              {initial}
            </div>
          </div>
        </header>

        <section style={styles.greeting}>
          <div style={styles.greetingSmall}>
            GOOD MORNING
          </div>

          <h1 style={styles.greetingTitle}>
            {firstName}
          </h1>

          <div style={styles.greetingSub}>
            Your preparation. Your SAMBHAV.
          </div>

          <div style={styles.tagline}>
            “संभव है, तो UPSC भी संभव है।”
          </div>
        </section>

        <section style={styles.premiumCard}>
          <div style={styles.glow} />

          <div style={styles.premiumLabel}>
            ✦ PREMIUM ACCESS
          </div>

          <div style={styles.premiumTitle}>
            Officer Access Active
          </div>

          <div style={styles.premiumSub}>
            Your Premium learning environment
            is active.
          </div>

          <div style={styles.validity}>
            ✓ PREMIUM ACTIVE
          </div>
        </section>

        <section style={styles.stats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              0%
            </div>

            <div style={styles.statLabel}>
              SYLLABUS
            </div>
          </div>

          <div style={styles.stat}>
            <div style={styles.statValue}>
              0
            </div>

            <div style={styles.statLabel}>
              QUESTIONS SOLVED
            </div>
          </div>

          <div style={styles.stat}>
            <div style={styles.statValue}>
              0
            </div>

            <div style={styles.statLabel}>
              DAY STREAK
            </div>
          </div>
        </section>

        <section style={styles.countdown}>
          <div style={styles.countdownTop}>
            <div style={styles.countdownTitle}>
              UPSC 2027
            </div>

            <div style={styles.countdownValue}>
              Countdown
            </div>
          </div>

          <div style={styles.progressTrack}>
            <div style={styles.progressFill} />
          </div>
        </section>

        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            Learning Ecosystem
          </div>

          <div style={styles.sectionSub}>
            ALL ACCESS
          </div>
        </div>

        <section className="sambhav-module-grid" style={styles.grid}>
          {modules.map((module) => (
            <div
              className="sambhav-module-card"
              key={module.title}
              style={{
                ...styles.module,
                opacity: module.route
                  ? 1
                  : 0.72,
                cursor: module.route
                  ? "pointer"
                  : "default",
              }}
              onClick={() =>
                module.route &&
                go(module.route)
              }
            >
              <div style={styles.icon}>
                {module.icon}
              </div>

              <div style={styles.moduleTitle}>
                {module.title}
              </div>

              <div style={styles.moduleSub}>
                {module.subtitle}
              </div>
            </div>
          ))}
        </section>

        <section style={styles.mission}>
          <div style={styles.sectionTitle}>
            Today's Mission
          </div>

          <div style={styles.missionRow}>
            <div style={styles.missionTop}>
              <span>
                Read Today's Current Affairs
              </span>

              <span style={styles.missionMuted}>
                0%
              </span>
            </div>

            <div style={styles.missionTrack}>
              <div
                style={{
                  ...styles.missionFill,
                  width: "0%",
                }}
              />
            </div>
          </div>

          <div style={styles.missionRow}>
            <div style={styles.missionTop}>
              <span>
                Solve 25 PYQs
              </span>

              <span style={styles.missionMuted}>
                0%
              </span>
            </div>

            <div style={styles.missionTrack}>
              <div
                style={{
                  ...styles.missionFill,
                  width: "0%",
                }}
              />
            </div>
          </div>

          <div style={styles.missionRow}>
            <div style={styles.missionTop}>
              <span>
                Write 1 Mains Answer
              </span>

              <span style={styles.missionMuted}>
                0%
              </span>
            </div>

            <div style={styles.missionTrack}>
              <div
                style={{
                  ...styles.missionFill,
                  width: "0%",
                }}
              />
            </div>
          </div>
        </section>

        <section style={styles.intelligence}>
          <div style={styles.sectionTitle}>
            Daily Intelligence
          </div>

          <div style={styles.intelligenceRow}>
            <div style={styles.intelligenceIcon}>
              🇮🇳
            </div>

            <div style={styles.intelligenceText}>
              India Governance & Polity

              <div style={styles.intelligenceSub}>
                Governance • Constitution • Policy
              </div>
            </div>

            <div style={styles.arrow}>
              ›
            </div>
          </div>

          <div style={styles.intelligenceRow}>
            <div style={styles.intelligenceIcon}>
              🌍
            </div>

            <div style={styles.intelligenceText}>
              World & International Relations

              <div style={styles.intelligenceSub}>
                IR • Global Affairs • Diplomacy
              </div>
            </div>

            <div style={styles.arrow}>
              ›
            </div>
          </div>

          <div
            style={{
              ...styles.intelligenceRow,
              borderBottom: "none",
            }}
          >
            <div style={styles.intelligenceIcon}>
              ₹
            </div>

            <div style={styles.intelligenceText}>
              Economy

              <div style={styles.intelligenceSub}>
                Economy • Banking • Markets
              </div>
            </div>

            <div style={styles.arrow}>
              ›
            </div>
          </div>
        </section>

        <section style={styles.aiInsight}>
          <div style={styles.aiBadge}>
            ✦ AI INSIGHT
          </div>

          <div style={styles.aiTitle}>
            Build consistency first.
          </div>

          <div style={styles.aiText}>
            Your analytics will appear here as
            you solve questions, write answers
            and complete daily missions.
          </div>
        </section>
      </div>

      <nav style={styles.bottomNav}>
        <div
          style={{
            ...styles.navItem,
            ...styles.navActive,
          }}
          onClick={() =>
            setActiveView("home")
          }
        >
          <span style={styles.navIcon}>
            ⌂
          </span>
          Home
        </div>

        <div
          style={styles.navItem}
          onClick={() => go("/pyq")}
        >
          <span style={styles.navIcon}>
            ▣
          </span>
          Practice
        </div>

        <div
          style={styles.navItem}
          onClick={() =>
            go("/current-affairs")
          }
        >
          <span style={styles.navIcon}>
            ▤
          </span>
          Current
        </div>

        <div
          style={styles.navItem}
          onClick={() => {
            console.log("AI module");
          }}
        >
          <span style={styles.navIcon}>
            ✦
          </span>
          AI
        </div>

        <div
          style={styles.navItem}
          onClick={() =>
            setActiveView("profile")
          }
        >
          <span style={styles.navIcon}>
            ●
          </span>
          Profile
        </div>
      </nav>
    </main>
  );
}
