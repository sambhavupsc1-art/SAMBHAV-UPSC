"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const modules = [
  {
    title: "Current Affairs",
    subtitle: "UPSC Current Affairs",
    icon: "📰",
    route: "/current-affairs",
  },
  {
    title: "PYQ Intelligence",
    subtitle: "UPSC Previous Year Questions",
    icon: "🎯",
    route: "/pyq",
  },
  {
    title: "Prelims Test",
    subtitle: "Practice & Test Series",
    icon: "📝",
    route: null,
  },
  {
    title: "Mains",
    subtitle: "Answer Writing Practice",
    icon: "✍️",
    route: null,
  },
  {
    title: "AI Answer Evaluation",
    subtitle: "UPSC Mains Answer Analysis",
    icon: "🤖",
    route: null,
  },
  {
    title: "Study Material",
    subtitle: "Notes • PDFs • Resources",
    icon: "📚",
    route: null,
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7f7f5 0%, #f3f3f1 100%)",
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
    marginBottom: "27px",
  },

  brand: {
    fontSize: "20px",
    fontWeight: "850",
    letterSpacing: "-0.7px",
  },

  brandSub: {
    fontSize: "10px",
    color: "#8b8b8b",
    marginTop: "3px",
    letterSpacing: "1.1px",
    textTransform: "uppercase",
    fontWeight: "600",
  },

  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, #191919, #050505)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "750",
    boxShadow: "0 7px 18px rgba(0,0,0,0.13)",
  },

  landingHero: {
    background:
      "linear-gradient(145deg, #111111 0%, #191919 55%, #252525 100%)",
    color: "#ffffff",
    borderRadius: "30px",
    padding: "32px 24px",
    marginBottom: "18px",
    boxShadow: "0 18px 42px rgba(0,0,0,0.16)",
    position: "relative",
    overflow: "hidden",
  },

  landingGlow: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.055)",
    right: "-100px",
    top: "-100px",
    pointerEvents: "none",
  },

  landingEyebrow: {
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "1.8px",
    color: "#bdbdbd",
    textTransform: "uppercase",
    position: "relative",
    zIndex: 2,
  },

  landingTitle: {
    margin: "12px 0 0",
    fontSize: "38px",
    lineHeight: "1.05",
    fontWeight: "900",
    letterSpacing: "-1.5px",
    position: "relative",
    zIndex: 2,
  },

  landingText: {
    marginTop: "13px",
    color: "#c2c2c2",
    fontSize: "14px",
    lineHeight: "1.65",
    maxWidth: "540px",
    position: "relative",
    zIndex: 2,
  },

  landingButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "22px",
    position: "relative",
    zIndex: 2,
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 18px",
    borderRadius: "15px",
    background: "#ffffff",
    color: "#111111",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "850",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 18px",
    borderRadius: "15px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "750",
  },

  landingSection: {
    marginTop: "25px",
  },

  landingSectionTitle: {
    fontSize: "22px",
    fontWeight: "850",
    letterSpacing: "-0.6px",
  },

  landingSectionSub: {
    marginTop: "6px",
    color: "#777777",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },

  featureCard: {
    background: "#ffffff",
    border: "1px solid #e8e8e6",
    borderRadius: "21px",
    padding: "17px",
    minHeight: "128px",
    boxSizing: "border-box",
    boxShadow:
      "0 5px 16px rgba(0,0,0,0.045)",
  },

  featureIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg, #181818, #080808)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  featureTitle: {
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: "850",
  },

  featureText: {
    marginTop: "5px",
    fontSize: "10px",
    color: "#858585",
    lineHeight: "1.4",
  },

  pricingGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },

  pricingCard: {
    background: "#ffffff",
    border: "1px solid #e4e4e2",
    borderRadius: "21px",
    padding: "18px",
    boxSizing: "border-box",
  },

  pricingName: {
    fontSize: "13px",
    fontWeight: "800",
  },

  pricingPrice: {
    marginTop: "10px",
    fontSize: "26px",
    fontWeight: "900",
    letterSpacing: "-0.8px",
  },

  pricingDuration: {
    marginTop: "3px",
    color: "#888888",
    fontSize: "10px",
  },

  pricingButton: {
    display: "block",
    marginTop: "14px",
    padding: "10px",
    borderRadius: "12px",
    background: "#111111",
    color: "#ffffff",
    textAlign: "center",
    textDecoration: "none",
    fontSize: "10px",
    fontWeight: "800",
  },

  publicFooter: {
    marginTop: "32px",
    paddingTop: "22px",
    borderTop: "1px solid #dfdfdd",
  },

  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "13px",
  },

  footerLink: {
    color: "#666666",
    textDecoration: "none",
    fontSize: "10px",
    fontWeight: "650",
  },

  footerCopy: {
    marginTop: "14px",
    color: "#999999",
    fontSize: "9px",
  },

  greeting: {
    marginBottom: "20px",
  },

  greetingTitle: {
    margin: 0,
    fontSize: "29px",
    lineHeight: "1.15",
    fontWeight: "850",
    letterSpacing: "-1.1px",
  },

  greetingSub: {
    marginTop: "7px",
    color: "#777777",
    fontSize: "14px",
  },

  accessCard: {
    background:
      "linear-gradient(145deg, #171717 0%, #0d0d0d 100%)",
    color: "#ffffff",
    borderRadius: "24px",
    padding: "21px",
    marginBottom: "15px",
    boxShadow: "0 13px 32px rgba(0,0,0,0.13)",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  accessLabel: {
    fontSize: "10px",
    color: "#a7a7a7",
    letterSpacing: "1.3px",
    textTransform: "uppercase",
    fontWeight: "750",
  },

  accessTitle: {
    marginTop: "8px",
    fontSize: "22px",
    fontWeight: "850",
    letterSpacing: "-0.4px",
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
    fontWeight: "750",
    marginBottom: "17px",
    cursor: "pointer",
  },

  premiumCard: {
    background:
      "linear-gradient(135deg, #111111 0%, #191919 55%, #252525 100%)",
    color: "#ffffff",
    borderRadius: "25px",
    padding: "21px",
    marginBottom: "27px",
    boxShadow: "0 15px 38px rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  premiumGlow: {
    position: "absolute",
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.055)",
    right: "-75px",
    top: "-85px",
  },

  premiumGlowSmall: {
    position: "absolute",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.035)",
    right: "80px",
    bottom: "-45px",
  },

  premiumBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#111111",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
    position: "relative",
    zIndex: 2,
  },

  premiumTitle: {
    marginTop: "13px",
    fontSize: "20px",
    fontWeight: "850",
    lineHeight: "1.2",
    position: "relative",
    zIndex: 2,
  },

  premiumSub: {
    marginTop: "7px",
    color: "#b9b9b9",
    fontSize: "11px",
    lineHeight: "1.55",
    maxWidth: "315px",
    position: "relative",
    zIndex: 2,
  },

  premiumAction: {
    marginTop: "16px",
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#111111",
    fontSize: "11px",
    fontWeight: "850",
    position: "relative",
    zIndex: 2,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "13px",
  },

  sectionTitle: {
    fontSize: "21px",
    fontWeight: "850",
  },

  sectionSmall: {
    fontSize: "11px",
    color: "#999999",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e8e8e6",
    borderRadius: "22px",
    padding: "15px",
    minHeight: "108px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxSizing: "border-box",
    cursor: "pointer",
    boxShadow:
      "0 5px 16px rgba(0,0,0,0.045)",
  },

  iconBox: {
    width: "46px",
    height: "46px",
    minWidth: "46px",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #181818, #080808)",
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

  pendingCard: {
    marginTop: "70px",
    background: "#ffffff",
    border: "1px solid #e5e5e3",
    borderRadius: "24px",
    padding: "30px 22px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
  },

  welcomeCard: {
    marginTop: "70px",
    background:
      "linear-gradient(145deg, #171717, #090909)",
    color: "#ffffff",
    borderRadius: "26px",
    padding: "30px 22px",
    textAlign: "center",
    boxShadow:
      "0 18px 42px rgba(0,0,0,0.16)",
  },

  welcomeLabel: {
    fontSize: "10px",
    color: "#a7a7a7",
    letterSpacing: "2px",
    fontWeight: "800",
  },

  welcomeTitle: {
    marginTop: "8px",
    fontSize: "27px",
    fontWeight: "900",
  },

  welcomeUser: {
    marginTop: "10px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#e8e8e8",
  },

  welcomeStatus: {
    display: "inline-block",
    marginTop: "18px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#111111",
    fontSize: "11px",
    fontWeight: "900",
  },

  welcomePremium: {
    marginTop: "14px",
    padding: "11px 14px",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg, #222222, #3a3a3a)",
    border: "1px solid #4a4a4a",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "800",
  },

  bottomNav: {
    position: "fixed",
    left: "50%",
    bottom: "12px",
    transform: "translateX(-50%)",
    width: "calc(100% - 28px)",
    maxWidth: "730px",
    height: "68px",
    background: "rgba(255,255,255,0.97)",
    border: "1px solid #e5e5e3",
    borderRadius: "25px",
    boxShadow:
      "0 10px 35px rgba(0,0,0,0.12)",
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    alignItems: "center",
    zIndex: 50,
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

  lockedIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, #181818, #080808)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    margin: "0 auto 18px",
  },

  lockedTitle: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "900",
  },

  lockedText: {
    color: "#777",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "10px auto 0",
    maxWidth: "430px",
  },

  statusPill: {
    display: "inline-block",
    marginTop: "18px",
    padding: "8px 13px",
    borderRadius: "999px",
    background: "#f0f0ee",
    color: "#555",
    fontSize: "10px",
    fontWeight: "800",
    textTransform: "uppercase",
  },
};

function PublicLanding() {
  const features = [
    {
      icon: "📰",
      title: "Current Affairs",
      text: "UPSC-focused current affairs and revision support.",
    },
    {
      icon: "🎯",
      title: "PYQ Intelligence",
      text: "Previous Year Questions with structured practice.",
    },
    {
      icon: "📝",
      title: "Prelims",
      text: "Practice and test-oriented preparation.",
    },
    {
      icon: "✍️",
      title: "Mains",
      text: "Answer-writing practice and preparation tools.",
    },
    {
      icon: "🤖",
      title: "AI Evaluation",
      text: "AI-assisted analysis for Mains answer practice.",
    },
    {
      icon: "📚",
      title: "Study Material",
      text: "Notes, PDFs and preparation resources.",
    },
  ];

  const plans = [
    {
      name: "2-Day Demo",
      price: "₹0",
      duration: "2 Days",
    },
    {
      name: "Monthly",
      price: "₹99",
      duration: "30 Days",
    },
    {
      name: "Quarterly",
      price: "₹399",
      duration: "90 Days",
    },
    {
      name: "Annual",
      price: "₹999",
      duration: "365 Days",
    },
  ];

  return (
    <>
      <main style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <div style={styles.brandSub}>
                UPSC Preparation Platform
              </div>
            </div>

            <div style={styles.avatar}>
              ✦
            </div>
          </header>

          <section style={styles.landingHero}>
            <div style={styles.landingGlow} />

            <div style={styles.landingEyebrow}>
              UPSC • PREPARATION • 2026
            </div>

            <h1 style={styles.landingTitle}>
              Your Complete
              <br />
              UPSC Preparation
              <br />
              Platform.
            </h1>

            <p style={styles.landingText}>
              SAMBHAV UPSC brings current affairs,
              PYQs, Prelims, Mains, CSAT, study
              material and AI-assisted learning
              tools together in one platform.
            </p>

            <div style={styles.landingButtons}>
              <a
                href="/login"
                style={styles.primaryButton}
              >
                Login / Get Started →
              </a>

              <a
                href="/pricing"
                style={styles.secondaryButton}
              >
                View Plans
              </a>
            </div>
          </section>

          <section style={styles.landingSection}>
            <div style={styles.landingSectionTitle}>
              Everything for UPSC
            </div>

            <div style={styles.landingSectionSub}>
              Structured tools for different stages of your
              preparation.
            </div>

            <div style={styles.featureGrid}>
              {features.map((feature) => (
                <div
                  key={feature.title}
                  style={styles.featureCard}
                >
                  <div style={styles.featureIcon}>
                    {feature.icon}
                  </div>

                  <div style={styles.featureTitle}>
                    {feature.title}
                  </div>

                  <div style={styles.featureText}>
                    {feature.text}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.landingSection}>
            <div style={styles.landingSectionTitle}>
              Premium Plans
            </div>

            <div style={styles.landingSectionSub}>
              Choose the plan that fits your preparation.
            </div>

            <div style={styles.pricingGrid}>
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  style={styles.pricingCard}
                >
                  <div style={styles.pricingName}>
                    {plan.name}
                  </div>

                  <div style={styles.pricingPrice}>
                    {plan.price}
                  </div>

                  <div style={styles.pricingDuration}>
                    {plan.duration}
                  </div>

                  <a
                    href="/pricing"
                    style={styles.pricingButton}
                  >
                    View Plan
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.landingSection}>
            <div style={styles.landingHero}>
              <div style={styles.landingGlow} />

              <div style={styles.landingEyebrow}>
                START YOUR PREPARATION
              </div>

              <div
                style={{
                  ...styles.landingTitle,
                  fontSize: "28px",
                }}
              >
                Build your UPSC
                <br />
                preparation with SAMBHAV.
              </div>

              <p style={styles.landingText}>
                Create your account, complete verification
                and get access to the SAMBHAV UPSC platform.
              </p>

              <div style={styles.landingButtons}>
                <a
                  href="/login"
                  style={styles.primaryButton}
                >
                  Get Started →
                </a>
              </div>
            </div>
          </section>

          <footer style={styles.publicFooter}>
            <div style={styles.footerLinks}>
              <a
                href="/about"
                style={styles.footerLink}
              >
                About
              </a>

              <a
                href="/contact"
                style={styles.footerLink}
              >
                Contact
              </a>

              <a
                href="/pricing"
                style={styles.footerLink}
              >
                Pricing
              </a>

              <a
                href="/privacy"
                style={styles.footerLink}
              >
                Privacy Policy
              </a>

              <a
                href="/terms"
                style={styles.footerLink}
              >
                Terms & Conditions
              </a>

              <a
                href="/refund"
                style={styles.footerLink}
              >
                Refund & Cancellation
              </a>
            </div>

            <div style={styles.footerCopy}>
              © {new Date().getFullYear()} SAMBHAV UPSC.
              All rights reserved.
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [telegramMode, setTelegramMode] =
    useState(false);
  const [showWelcome, setShowWelcome] =
    useState(false);

  /*
   * ==========================================
   * AUTHENTICATION
   * ==========================================
   *
   * Priority:
   *
   * 1. Email session cookie
   * 2. Telegram initData
   * 3. Public landing
   *
   * This keeps both authentication systems
   * working without requiring Telegram for
   * normal browser users.
   */

  useEffect(() => {
    let stopped = false;

    const authenticate = async () => {
      if (stopped) return;

      try {
        /*
         * ==========================================
         * 1. EMAIL SESSION
         * ==========================================
         *
         * Browser automatically sends the
         * HTTP-only sambhav_session cookie.
         */

        const emailResponse = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const emailData =
          await emailResponse.json().catch(
            () => ({})
          );

        /*
         * Valid email session
         */

        if (
          emailResponse.ok &&
          emailData?.user
        ) {
          if (stopped) return;

          setTelegramMode(false);

          setUser(
            emailData.user
          );

          setIsAdmin(
            emailData.isAdmin === true
          );

          if (
            emailData.user?.status ===
            "approved"
          ) {
            setShowWelcome(true);
          }

          setLoading(false);
          return;
        }

        /*
         * ==========================================
         * 2. TELEGRAM AUTHENTICATION
         * ==========================================
         */

        const webApp =
          window.Telegram?.WebApp;

        /*
         * Only real Telegram initData
         * activates Telegram authentication.
         */

        if (webApp?.initData) {
          if (stopped) return;

          setTelegramMode(true);

          webApp.ready();
          webApp.expand();

          const telegramResponse =
            await fetch(
              "/api/auth/me",
              {
                method: "GET",
                headers: {
                  Authorization:
                    `tma ${webApp.initData}`,
                },
                cache: "no-store",
              }
            );

          const telegramData =
            await telegramResponse.json();

          if (!telegramResponse.ok) {
            throw new Error(
              telegramData.error ||
                "Authentication failed"
            );
          }

          if (stopped) return;

          setUser(
            telegramData.user
          );

          setIsAdmin(
            telegramData.isAdmin === true
          );

          if (
            telegramData.user?.status ===
            "approved"
          ) {
            setShowWelcome(true);
          }

          setLoading(false);
          return;
        }

        /*
         * ==========================================
         * 3. PUBLIC WEBSITE
         * ==========================================
         */

        if (stopped) return;

        setTelegramMode(false);
        setUser(null);
        setError("");
        setLoading(false);
      } catch (err) {
        if (stopped) return;

        console.error(
          "SAMBHAV authentication error:",
          err
        );

        setError(
          err.message ||
            "Server connection failed."
        );

        setLoading(false);
      }
    };

    authenticate();

    return () => {
      stopped = true;
    };
  }, []);

  useEffect(() => {
    if (!showWelcome) return;

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [showWelcome]);

  /*
   * ==========================================
   * PUBLIC WEBSITE
   * ==========================================
   */

  if (
    !loading &&
    !telegramMode &&
    !user
  ) {
    return <PublicLanding />;
  }

  /*
   * ==========================================
   * AUTH LOADING
   * ==========================================
   */

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
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <p style={styles.greetingSub}>
                Checking access...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  /*
   * ==========================================
   * TELEGRAM AUTH ERROR
   * ==========================================
   */

  if (
    telegramMode &&
    error &&
    !user
  ) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <header style={styles.header}>
              <div>
                <div style={styles.brand}>
                  SAMBHAV UPSC
                </div>

                <div style={styles.brandSub}>
                  UPSC Preparation Platform
                </div>
              </div>

              <div style={styles.avatar}>
                🔒
              </div>
            </header>

            <div
              style={{
                ...styles.pendingCard,
                marginTop: "45px",
              }}
            >
              <div style={styles.lockedIcon}>
                🔐
              </div>

              <h1 style={styles.lockedTitle}>
                Access Required
              </h1>

              <p style={styles.lockedText}>
                SAMBHAV UPSC application access
                ke liye Telegram se authorized
                login required hai.
              </p>

              <div style={styles.statusPill}>
                Authentication Required
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  /*
   * ==========================================
   * SAFETY
   * ==========================================
   */

  if (!user) {
    return null;
  }

  /*
   * ==========================================
   * NOT APPROVED
   * ==========================================
   */

  if (
    user.status !==
    "approved"
  ) {
    let title =
      "Access Pending";

    let text =
      "Admin approval ke baad aap SAMBHAV UPSC application access kar sakenge.";

    let icon = "⏳";

    let pill =
      "Approval Required";

    if (
      user.status ===
      "rejected"
    ) {
      title =
        "Access Rejected";

      text =
        "Aapki access request approve nahi hui hai. Application access abhi available nahi hai.";

      icon = "×";

      pill =
        "Access Rejected";
    }

    if (
      user.status ===
      "banned"
    ) {
      title =
        "Access Blocked";

      text =
        "Aapka account currently blocked hai. Application access available nahi hai.";

      icon = "🔒";

      pill =
        "Account Blocked";
    }

    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <header style={styles.header}>
              <div>
                <div style={styles.brand}>
                  SAMBHAV UPSC
                </div>

                <div style={styles.brandSub}>
                  UPSC Preparation Platform
                </div>
              </div>

              <div style={styles.avatar}>
                🔒
              </div>
            </header>

            <div
              style={{
                ...styles.pendingCard,
                marginTop: "45px",
              }}
            >
              <div style={styles.lockedIcon}>
                {icon}
              </div>

              <h1 style={styles.lockedTitle}>
                {title}
              </h1>

              <p style={styles.lockedText}>
                {text}
              </p>

              <div style={styles.statusPill}>
                {pill}
              </div>

              {isAdmin && (
                <a
                  href="/admin"
                  style={{
                    display: "inline-block",
                    marginTop: "20px",
                    color: "#111",
                    fontSize: "12px",
                    fontWeight: "800",
                    textDecoration: "none",
                  }}
                >
                  Open Admin Panel →
                </a>
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  /*
   * ==========================================
   * WELCOME
   * ==========================================
   */

  if (
    showWelcome &&
    user.status ===
      "approved"
  ) {
    const firstName =
      user.first_name ||
      user.firstName ||
      user.name ||
      "Aspirant";

    const isPremium =
      String(
        user.plan || ""
      ).toLowerCase() ===
        "premium" &&
      String(
        user.subscriptionStatus ||
          ""
      ).toLowerCase() ===
        "active";

    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <div style={styles.welcomeCard}>
              <div style={styles.welcomeLabel}>
                WELCOME
              </div>

              <div style={styles.welcomeTitle}>
                SAMBHAV UPSC
              </div>

              <div style={styles.welcomeUser}>
                {firstName}
              </div>

              <div style={styles.welcomeStatus}>
                ✓ APPROVED
              </div>

              <div style={styles.welcomePremium}>
                {isPremium
                  ? "✦ PREMIUM ACTIVE"
                  : "✦ SAMBHAV UPSC • PREMIUM EXPERIENCE"}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  /*
   * ==========================================
   * APPROVED USER DASHBOARD
   * ==========================================
   */

  const firstName =
    user.first_name ||
    user.firstName ||
    user.name ||
    "Aspirant";

  const initial =
    firstName
      .charAt(0)
      .toUpperCase();

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <div style={styles.brandSub}>
                UPSC Preparation Platform
              </div>
            </div>

            <div style={styles.avatar}>
              {initial}
            </div>
          </header>

          <section style={styles.greeting}>
            <h1 style={styles.greetingTitle}>
              Hello, {firstName}
            </h1>

            <p style={styles.greetingSub}>
              Continue your preparation.
            </p>
          </section>

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

          <button
            style={styles.secretaryButton}
            onClick={() =>
              console.log(
                "AI Secretary coming soon"
              )
            }
          >
            ✦ Open AI Secretary →
          </button>

          <section
            style={styles.premiumCard}
            onClick={() => {
              window.location.href =
                "/premium";
            }}
          >
            <div style={styles.premiumGlow} />
            <div style={styles.premiumGlowSmall} />

            <div style={styles.premiumBadge}>
              ✦ PREMIUM ACCESS
            </div>

            <div style={styles.premiumTitle}>
              Unlock the Full SAMBHAV Experience
            </div>

            <div style={styles.premiumSub}>
              Current Affairs, PYQ Intelligence,
              Tests, Mains practice, AI evaluation
              & premium study resources — all in
              one place.
            </div>

            <div style={styles.premiumAction}>
              Explore Batches →
            </div>
          </section>

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
                onClick={() => {
                  if (module.route) {
                    window.location.href =
                      module.route;
                  } else {
                    console.log(
                      `${module.title} coming soon`
                    );
                  }
                }}
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

            {isAdmin && (
              <div
                style={styles.card}
                onClick={() => {
                  window.location.href =
                    "/admin";
                }}
              >
                <div style={styles.iconBox}>
                  🔐
                </div>

                <div style={styles.cardContent}>
                  <div style={styles.cardTitle}>
                    Admin Panel
                  </div>

                  <div style={styles.cardSubtitle}>
                    Members • Requests • Approvals
                  </div>
                </div>

                <div style={styles.arrow}>
                  ›
                </div>
              </div>
            )}
          </section>
        </div>

        <nav style={styles.bottomNav}>
          <div
            style={{
              ...styles.navItem,
              ...styles.navActive,
            }}
          >
            <span style={styles.navIcon}>
              ⌂
            </span>
            Home
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              console.log("Current Affairs")
            }
          >
            <span style={styles.navIcon}>
              ▤
            </span>
            CA
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              console.log("GS")
            }
          >
            <span style={styles.navIcon}>
              ▣
            </span>
            GS
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              console.log("AI")
            }
          >
            <span style={styles.navIcon}>
              ▦
            </span>
            AI
          </div>
        </nav>
      </main>
    </>
  );
}
