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
    route: "/prelims-test",
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
    background: "var(--sambhav-page)",
    color: "var(--sambhav-text)",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    paddingBottom: "95px",
  },

  container: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "18px 16px 35px",
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
    color: "var(--sambhav-muted)",
    letterSpacing: "1.2px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  avatar: {
    width: "43px",
    height: "43px",
    borderRadius: "50%",
    background: "#101010",
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
    color: "var(--sambhav-muted)",
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
    color: "var(--sambhav-muted)",
    fontSize: "12px",
  },

  tagline: {
    marginTop: "9px",
    color: "var(--sambhav-text)",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "-.1px",
  },

  premiumCard: {
    position: "relative",
    overflow: "hidden",
    background: "#101010",
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
    color: "#c4c4c4",
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
    background: "var(--sambhav-surface)",
    border: "1px solid var(--sambhav-border)",
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
    color: "var(--sambhav-muted)",
    fontSize: "8px",
    fontWeight: "700",
    lineHeight: "1.3",
  },

  countdown: {
    background: "#101010",
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
    color: "var(--sambhav-muted)",
    fontWeight: "700",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "11px",
    marginBottom: "23px",
  },

  module: {
    background: "var(--sambhav-surface)",
    border: "1px solid var(--sambhav-border)",
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
    background: "#101010",
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
    color: "var(--sambhav-muted)",
    fontSize: "9px",
    lineHeight: "1.4",
  },

  mission: {
    background: "var(--sambhav-surface)",
    border: "1px solid var(--sambhav-border)",
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
    color: "var(--sambhav-muted)",
  },

  missionTrack: {
    height: "5px",
    background: "var(--sambhav-track)",
    borderRadius: "99px",
    marginTop: "7px",
    overflow: "hidden",
  },

  missionFill: {
    height: "100%",
    background: "#101010",
    borderRadius: "99px",
  },

  intelligence: {
    background: "#101010",
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
    color: "#9e9e9e",
    fontSize: "8px",
  },

  arrow: {
    color: "#dfc477",
    fontSize: "17px",
  },

  aiInsight: {
    background: "var(--sambhav-surface)",
    border: "1px solid rgba(184,148,69,.25)",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "15px",
  },

  aiBadge: {
    display: "inline-block",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#101010",
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
    color: "var(--sambhav-muted)",
    fontSize: "10px",
    lineHeight: "1.5",
  },

  profileCard: {
    background: "var(--sambhav-surface)",
    border: "1px solid var(--sambhav-border)",
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
    background: "#101010",
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
    color: "var(--sambhav-muted)",
    fontSize: "10px",
    wordBreak: "break-word",
  },

  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "13px 0",
    borderTop: "1px solid rgba(16,16,16,.07)",
  },

  profileLabel: {
    color: "var(--sambhav-muted)",
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
    background: "#101010",
    color: "#dfc477",
    fontSize: "8px",
    fontWeight: "900",
  },

  logoutButton: {
    width: "100%",
    padding: "15px",
    border: "1px solid rgba(181,43,34,.18)",
    borderRadius: "16px",
    background: "var(--sambhav-surface)",
    color: "#b52b22",
    fontSize: "11px",
    fontWeight: "900",
    cursor: "pointer",
  },

  logoutLoading: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  themeButton: {
    width: "38px",
    height: "38px",
    marginLeft: "8px",
    borderRadius: "12px",
    border: "1px solid var(--sambhav-border)",
    background: "var(--sambhav-surface)",
    color: "var(--sambhav-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
    flexShrink: 0,
  },

  bottomNav: {
    position: "fixed",
    left: "50%",
    bottom: "11px",
    transform: "translateX(-50%)",
    width: "calc(100% - 28px)",
    maxWidth: "730px",
    height: "65px",
    background: "var(--sambhav-nav)",
    border: "1px solid rgba(16,16,16,.09)",
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
    color: "var(--sambhav-muted)",
    fontSize: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  navActive: {
    background: "#101010",
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
    const savedTheme = localStorage.getItem("sambhav-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sambhavTheme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("sambhav-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
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

  const themeVars = theme === "dark"
    ? {
        page: "#0b0b0b",
        text: "#f5f2eb",
        muted: "#aaa59a",
        surface: "#151515",
        border: "rgba(255,255,255,.10)",
        darkSurface: "#050505",
        darkText: "#ffffff",
        darkMuted: "#b9b9b9",
        track: "#2b2b2b",
        shadow: "0 8px 24px rgba(0,0,0,.28)",
        nav: "rgba(21,21,21,.97)",
      }
    : {
        page: "#f5f2eb",
        text: "#101010",
        muted: "#77736b",
        surface: "#fffdf9",
        border: "rgba(16,16,16,.08)",
        darkSurface: "#101010",
        darkText: "#ffffff",
        darkMuted: "#c4c4c4",
        track: "#e7e2d9",
        shadow: "0 8px 24px rgba(16,16,16,.07)",
        nav: "rgba(255,253,249,.97)",
      };

  const themed = {
    page: { ...styles.page, background: themeVars.page, color: themeVars.text },
    text: themeVars.text,
    muted: themeVars.muted,
    surface: themeVars.surface,
    border: themeVars.border,
    darkSurface: themeVars.darkSurface,
    darkText: themeVars.darkText,
    darkMuted: themeVars.darkMuted,
  };

  const rootThemeStyle = {
    "--sambhav-page": themeVars.page,
    "--sambhav-text": themeVars.text,
    "--sambhav-muted": themeVars.muted,
    "--sambhav-surface": themeVars.surface,
    "--sambhav-border": themeVars.border,
    "--sambhav-border-soft": theme === "dark" ? "rgba(255,255,255,.07)" : "rgba(16,16,16,.07)",
    "--sambhav-track": themeVars.track,
    "--sambhav-nav": themeVars.nav,
  };

  if (loading) {
    return (
      <main
        style={{
          ...themed.page,
          ...rootThemeStyle,
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
              color: "var(--sambhav-muted)",
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
      <main style={{ ...themed.page, ...rootThemeStyle }}>
        <div style={styles.container}>
          <div
            style={{
              background: "var(--sambhav-surface)",
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
                background: "#101010",
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
      <main style={{ ...themed.page, ...rootThemeStyle }}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <div style={styles.brandSub}>
                Profile
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                style={styles.themeButton}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
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
              color: "var(--sambhav-muted)",
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
                color: "var(--sambhav-muted)",
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
    <main style={{ ...themed.page, ...rootThemeStyle }}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>
              SAMBHAV UPSC
            </div>

            <div style={styles.brandSub}>
              Premium Preparation Platform
            </div>
          </div>

          <button
            type="button"
            aria-label="Open profile"
            onClick={() => setActiveView("profile")}
            style={{ ...styles.avatar, border: "none", cursor: "pointer" }}
          >
            {initial}
          </button>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            style={styles.themeButton}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </header>

        <section style={styles.greeting}>

          <h1 style={styles.greetingTitle}>
            {firstName}
          </h1>

          <div style={styles.greetingSub}>
            Your preparation. Your SAMBHAV.
          </div>

          <div style={styles.tagline}>
            No shortcut. Just consistency.
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

        <section style={styles.grid}>
          {modules.map((module) => (
            <div
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
