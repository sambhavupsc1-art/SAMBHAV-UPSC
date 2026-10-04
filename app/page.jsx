"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

const modules = [
  {
    title: "Current Affairs",
    subtitle: "Daily UPSC Intelligence",
    icon: "📰",
    route: "/current-affairs",
    premium: true,
  },
  {
    title: "PYQ Intelligence",
    subtitle: "Previous Year Questions",
    icon: "🎯",
    route: "/pyq",
    premium: true,
  },
  {
    title: "Prelims Practice",
    subtitle: "MCQs & Test Practice",
    icon: "📝",
    route: null,
    premium: true,
  },
  {
    title: "Mains Practice",
    subtitle: "Answer Writing",
    icon: "✍️",
    route: null,
    premium: true,
  },
  {
    title: "AI Evaluation",
    subtitle: "Mains Answer Analysis",
    icon: "🤖",
    route: null,
    premium: true,
  },
  {
    title: "Study Material",
    subtitle: "Notes • PDFs • Resources",
    icon: "📚",
    route: null,
    premium: true,
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f8f7f3 0%,#f1f0ec 100%)",
    color: "#111",
    fontFamily:
      "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    paddingBottom: "105px",
  },

  container: {
    width: "100%",
    maxWidth: "920px",
    margin: "0 auto",
    padding: "18px clamp(14px, 3vw, 28px) 35px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  brand: {
    fontSize: "21px",
    fontWeight: "950",
    letterSpacing: "-0.8px",
  },

  gold: {
    color: "#9b7b2f",
  },

  brandSub: {
    marginTop: "3px",
    color: "#8a8a8a",
    fontSize: "8px",
    letterSpacing: "1.4px",
    textTransform: "uppercase",
    fontWeight: "750",
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg,#181818,#050505)",
    color: "#d5bd79",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "900",
    boxShadow: "0 8px 20px rgba(0,0,0,.13)",
  },

  eyebrow: {
    color: "#9b7b2f",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "1.6px",
    textTransform: "uppercase",
  },

  greeting: {
    marginBottom: "18px",
  },

  greetingTitle: {
    margin: "7px 0 0",
    fontSize: "31px",
    lineHeight: "1.08",
    letterSpacing: "-1.2px",
    fontWeight: "950",
  },

  greetingSub: {
    marginTop: "7px",
    color: "#777",
    fontSize: "12px",
  },

  /* ACCESS */

  accessCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "27px",
    background:
      "linear-gradient(145deg,#0c0c0c,#191919 55%,#252525)",
    color: "#fff",
    padding: "22px",
    boxShadow:
      "0 20px 42px rgba(0,0,0,.16)",
    marginBottom: "13px",
  },

  accessGlow: {
    position: "absolute",
    width: "210px",
    height: "210px",
    borderRadius: "50%",
    right: "-90px",
    top: "-105px",
    background:
      "radial-gradient(circle,rgba(191,158,76,.25),rgba(191,158,76,0) 70%)",
  },

  accessContent: {
    position: "relative",
    zIndex: 2,
  },

  accessBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#fff",
    color: "#111",
    fontSize: "8px",
    fontWeight: "950",
    letterSpacing: "1px",
  },

  accessTitle: {
    marginTop: "13px",
    fontSize: "23px",
    fontWeight: "900",
    letterSpacing: "-.4px",
  },

  accessText: {
    marginTop: "6px",
    color: "#aaa",
    fontSize: "11px",
    lineHeight: "1.5",
    maxWidth: "360px",
  },

  accessStatus: {
    display: "inline-flex",
    marginTop: "15px",
    padding: "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,.07)",
    border:
      "1px solid rgba(255,255,255,.08)",
    color: "#d5bd79",
    fontSize: "8px",
    fontWeight: "850",
  },

  /* MOTIVATION */

  motivationCard: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(145deg,#171717,#0b0b0b)",
    color: "#fff",
    borderRadius: "23px",
    padding: "19px 20px",
    marginBottom: "13px",
    border: "1px solid rgba(213,189,121,.18)",
    boxShadow: "0 12px 30px rgba(0,0,0,.10)",
  },

  motivationGlow: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    right: "-85px",
    top: "-100px",
    background: "radial-gradient(circle,rgba(213,189,121,.20),rgba(213,189,121,0) 70%)",
  },

  motivationLabel: {
    position: "relative",
    color: "#d5bd79",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "1.5px",
  },

  motivationTitle: {
    position: "relative",
    marginTop: "7px",
    fontSize: "15px",
    lineHeight: "1.35",
    fontWeight: "900",
    maxWidth: "680px",
  },

  motivationText: {
    position: "relative",
    marginTop: "6px",
    color: "#aaa",
    fontSize: "10px",
    lineHeight: "1.55",
    maxWidth: "680px",
  },

  /* PREMIUM CONVERSION */

  premiumPrompt: {
    background: "linear-gradient(145deg,#eee8d8,#e4dbc5)",
    border: "1px solid #d7ccb0",
    borderRadius: "23px",
    padding: "19px",
    marginBottom: "13px",
  },

  premiumPromptTitle: {
    fontSize: "16px",
    lineHeight: "1.2",
    fontWeight: "950",
  },

  premiumPromptText: {
    marginTop: "6px",
    color: "#6f685a",
    fontSize: "10px",
    lineHeight: "1.55",
    maxWidth: "680px",
  },

  premiumPromptButton: {
    display: "inline-flex",
    marginTop: "13px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "#111",
    color: "#fff",
    textDecoration: "none",
    fontSize: "9px",
    fontWeight: "900",
  },

  /* STATS */

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "9px",
    marginBottom: "13px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e5e3de",
    borderRadius: "19px",
    padding: "14px 9px",
    textAlign: "center",
    boxShadow:
      "0 6px 17px rgba(0,0,0,.035)",
  },

  statNumber: {
    fontSize: "19px",
    fontWeight: "950",
  },

  statLabel: {
    marginTop: "4px",
    color: "#888",
    fontSize: "7px",
    letterSpacing: ".8px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  /* COUNTDOWN */

  countdown: {
    borderRadius: "23px",
    background: "#fff",
    border: "1px solid #e5e3de",
    padding: "17px",
    marginBottom: "27px",
    boxShadow:
      "0 7px 20px rgba(0,0,0,.04)",
  },

  countdownTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  countdownTitle: {
    fontSize: "13px",
    fontWeight: "900",
  },

  countdownSmall: {
    color: "#999",
    fontSize: "8px",
    fontWeight: "750",
  },

  countdownNumber: {
    marginTop: "9px",
    fontSize: "29px",
    fontWeight: "950",
    letterSpacing: "-1px",
  },

  countdownBar: {
    height: "5px",
    borderRadius: "999px",
    background: "#eeeeeb",
    marginTop: "10px",
    overflow: "hidden",
  },

  countdownFill: {
    width: "25%",
    height: "100%",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg,#111,#b3944b)",
  },

  /* MISSION */

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    fontSize: "19px",
    fontWeight: "900",
    letterSpacing: "-.4px",
  },

  sectionSmall: {
    color: "#999",
    fontSize: "8px",
    fontWeight: "750",
  },

  mission: {
    background: "#fff",
    border:
      "1px solid #e5e3de",
    borderRadius: "23px",
    padding: "8px",
    marginBottom: "28px",
    boxShadow:
      "0 7px 20px rgba(0,0,0,.035)",
  },

  missionRow: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "13px 10px",
    borderBottom: "1px solid #eeeeeb",
  },

  missionLast: {
    borderBottom: "none",
  },

  check: {
    width: "28px",
    height: "28px",
    borderRadius: "10px",
    background: "#f0f0ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
    fontSize: "12px",
  },

  missionTitle: {
    fontSize: "11px",
    fontWeight: "850",
  },

  missionSub: {
    marginTop: "3px",
    color: "#999",
    fontSize: "8px",
  },

  /* MODULES */

  modulesGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "11px",
    marginBottom: "28px",
  },

  moduleCard: {
    position: "relative",
    background: "#fff",
    border: "1px solid #e5e3de",
    borderRadius: "21px",
    padding: "15px",
    minHeight: "135px",
    boxSizing: "border-box",
    boxShadow:
      "0 7px 20px rgba(0,0,0,.04)",
    cursor: "pointer",
  },

  moduleIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg,#181818,#080808)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  moduleTitle: {
    marginTop: "12px",
    fontSize: "13px",
    fontWeight: "900",
  },

  moduleSubtitle: {
    marginTop: "4px",
    color: "#888",
    fontSize: "9px",
    lineHeight: "1.35",
  },

  moduleArrow: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    background: "#f0f0ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
  },

  lock: {
    position: "absolute",
    right: "12px",
    top: "12px",
    fontSize: "11px",
  },

  /* AI */

  aiCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "24px",
    background:
      "linear-gradient(145deg,#111,#242424)",
    color: "#fff",
    padding: "20px",
    marginBottom: "28px",
    boxShadow:
      "0 15px 34px rgba(0,0,0,.14)",
  },

  aiGlow: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    right: "-90px",
    top: "-80px",
    background:
      "rgba(190,157,76,.15)",
  },

  aiContent: {
    position: "relative",
    zIndex: 2,
  },

  aiLabel: {
    color: "#d5bd79",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "1.4px",
  },

  aiTitle: {
    marginTop: "8px",
    fontSize: "20px",
    fontWeight: "900",
  },

  aiText: {
    marginTop: "6px",
    color: "#aaa",
    fontSize: "10px",
    lineHeight: "1.5",
    maxWidth: "390px",
  },

  aiButton: {
    display: "inline-flex",
    marginTop: "14px",
    padding: "10px 13px",
    borderRadius: "12px",
    background: "#fff",
    color: "#111",
    border: "none",
    fontSize: "9px",
    fontWeight: "900",
    cursor: "pointer",
  },

  /* DAILY */

  intelligence: {
    background: "#fff",
    border: "1px solid #e5e3de",
    borderRadius: "23px",
    padding: "18px",
    marginBottom: "28px",
  },

  intelligenceText: {
    marginTop: "6px",
    color: "#777",
    fontSize: "10px",
    lineHeight: "1.55",
  },

  intelligenceButton: {
    display: "inline-flex",
    marginTop: "12px",
    padding: "9px 12px",
    borderRadius: "11px",
    background: "#111",
    color: "#fff",
    textDecoration: "none",
    fontSize: "8px",
    fontWeight: "850",
  },

  /* LOCKED */

  lockedBanner: {
    background:
      "linear-gradient(145deg,#eee8d8,#e3dac3)",
    border:
      "1px solid #d7ccb0",
    borderRadius: "23px",
    padding: "18px",
    marginBottom: "28px",
  },

  lockedBannerTitle: {
    fontSize: "15px",
    fontWeight: "900",
  },

  lockedBannerText: {
    marginTop: "5px",
    color: "#6f685a",
    fontSize: "10px",
    lineHeight: "1.5",
  },

  lockedButton: {
    display: "inline-flex",
    marginTop: "12px",
    padding: "10px 13px",
    borderRadius: "12px",
    background: "#111",
    color: "#fff",
    textDecoration: "none",
    fontSize: "9px",
    fontWeight: "900",
  },

  /* NAV */

  bottomNav: {
    position: "fixed",
    left: "50%",
    bottom: "12px",
    transform: "translateX(-50%)",
    width: "min(730px, calc(100% - 28px))",
    maxWidth: "730px",
    height: "68px",
    background: "rgba(255,255,255,.97)",
    border: "1px solid #e5e3de",
    borderRadius: "25px",
    boxShadow:
      "0 10px 35px rgba(0,0,0,.12)",
    display: "grid",
    gridTemplateColumns:
      "repeat(5,1fr)",
    alignItems: "center",
    zIndex: 50,
  },

  navItem: {
    height: "52px",
    margin: "5px",
    borderRadius: "18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    fontSize: "8px",
    color: "#777",
    fontWeight: "700",
    cursor: "pointer",
  },

  navActive: {
    background: "#eeeeeb",
    color: "#111",
  },

  navIcon: {
    fontSize: "17px",
    lineHeight: "17px",
  },

  /* COMMON STATES */

  pendingCard: {
    marginTop: "70px",
    background: "#fff",
    border: "1px solid #e5e3de",
    borderRadius: "25px",
    padding: "30px 22px",
    textAlign: "center",
    boxShadow:
      "0 8px 25px rgba(0,0,0,.05)",
  },

  lockedIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg,#181818,#080808)",
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

  welcomeCard: {
    marginTop: "70px",
    background:
      "linear-gradient(145deg,#171717,#090909)",
    color: "#fff",
    borderRadius: "26px",
    padding: "30px 22px",
    textAlign: "center",
    boxShadow:
      "0 18px 42px rgba(0,0,0,.16)",
  },

  welcomeLabel: {
    fontSize: "9px",
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
    background: "#fff",
    color: "#111",
    fontSize: "10px",
    fontWeight: "900",
  },
};


/* =========================================================
   PUBLIC LANDING
   ========================================================= */

function PublicLanding() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <div style={styles.brand}>
              SAMBHAV{" "}
              <span style={styles.gold}>UPSC</span>
            </div>

            <div style={styles.brandSub}>
              Intelligence • Preparation • Performance
            </div>
          </div>

          <a
            href="/login"
            style={{
              background: "#111",
              color: "#fff",
              padding: "11px 15px",
              borderRadius: "13px",
              textDecoration: "none",
              fontSize: "10px",
              fontWeight: "900",
            }}
          >
            Sign In
          </a>
        </header>


        <section style={styles.accessCard}>
          <div style={styles.accessGlow} />

          <div style={styles.accessContent}>
            <div style={styles.accessBadge}>
              ✦ AI-POWERED UPSC PREPARATION
            </div>

            <div
              style={{
                marginTop: "19px",
                fontSize: "42px",
                lineHeight: "1",
                fontWeight: "950",
                letterSpacing: "-1.8px",
              }}
            >
              Prepare with clarity.
              <br />

              <span style={styles.gold}>
                Perform with SAMBHAV.
              </span>
            </div>

            <div style={styles.accessText}>
              Current Affairs, PYQ Intelligence,
              Prelims, Mains, AI-assisted learning
              and study resources — organised into
              one focused UPSC preparation system.
            </div>

            <div style={styles.landingButtons}>
              <a
                href="/login"
                style={{
                  ...styles.primaryButton,
                }}
              >
                Start Preparing →
              </a>

              <a
                href="/pricing"
                style={{
                  ...styles.secondaryButton,
                }}
              >
                Explore Plans
              </a>
            </div>
          </div>
        </section>


        <section style={{ marginTop: "38px" }}>
          <div style={styles.eyebrow}>
            THE SAMBHAV SYSTEM
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "27px",
              lineHeight: "1.1",
              fontWeight: "950",
              letterSpacing: "-.9px",
            }}
          >
            One platform.
            <br />
            One preparation system.
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#777",
              fontSize: "11px",
              lineHeight: "1.6",
            }}
          >
            Everything you need for a structured UPSC
            preparation journey.
          </div>
        </section>


        <section style={styles.featureGrid}>
          {[
            ["📰", "Current Affairs", "Daily UPSC intelligence"],
            ["🎯", "PYQ Intelligence", "Question-based learning"],
            ["📝", "Prelims Practice", "MCQs & tests"],
            ["✍️", "Mains Practice", "Answer writing"],
            ["🤖", "AI Evaluation", "Answer analysis"],
            ["📚", "Study Material", "Notes & resources"],
          ].map(([icon, title, text]) => (
            <div
              key={title}
              style={styles.moduleCard}
            >
              <div style={styles.moduleIcon}>
                {icon}
              </div>

              <div style={styles.moduleTitle}>
                {title}
              </div>

              <div style={styles.moduleSubtitle}>
                {text}
              </div>
            </div>
          ))}
        </section>


        <section style={styles.landingSection}>
          <div style={styles.eyebrow}>
            INSIDE SAMBHAV
          </div>

          <div style={styles.landingSectionTitle}>
            Your preparation.
            <br />
            One intelligent workspace.
          </div>

          <div style={styles.previewBox}>
            <div
              style={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: "900",
              }}
            >
              SAMBHAV UPSC
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#777",
                fontSize: "7px",
                letterSpacing: "1px",
              }}
            >
              COMMAND CENTRE
            </div>

            <div
              style={{
                marginTop: "17px",
                padding: "17px",
                borderRadius: "18px",
                background: "#222",
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: "8px",
                  fontWeight: "800",
                }}
              >
                TODAY'S PREPARATION
              </div>

              <div
                style={{
                  marginTop: "7px",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "900",
                }}
              >
                Stay consistent.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3,1fr)",
                  gap: "7px",
                  marginTop: "16px",
                }}
              >
                {["CA", "PYQ", "MAINS"].map(
                  (item) => (
                    <div
                      key={item}
                      style={{
                        background:
                          "rgba(255,255,255,.06)",
                        borderRadius: "11px",
                        padding: "11px 4px",
                        textAlign: "center",
                        color: "#d5bd79",
                        fontSize: "8px",
                        fontWeight: "900",
                      }}
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>


        <section
          style={{
            marginTop: "38px",
            padding: "22px",
            borderRadius: "26px",
            background:
              "linear-gradient(145deg,#eee7d5,#e3dac2)",
            border: "1px solid #d7ccb0",
          }}
        >
          <div style={styles.eyebrow}>
            PREMIUM ACCESS
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "24px",
              fontWeight: "950",
              lineHeight: "1.1",
            }}
          >
            Built for serious
            <br />
            UPSC preparation.
          </div>

          <div
            style={{
              marginTop: "9px",
              color: "#6f685a",
              fontSize: "10px",
              lineHeight: "1.6",
            }}
          >
            Unlock the complete SAMBHAV preparation
            experience.
          </div>

          <a
            href="/pricing"
            style={{
              display: "inline-flex",
              marginTop: "16px",
              padding: "11px 14px",
              borderRadius: "12px",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontSize: "9px",
              fontWeight: "900",
            }}
          >
            Explore Premium →
          </a>
        </section>


        <section
          style={{
            textAlign: "center",
            marginTop: "42px",
          }}
        >
          <div style={styles.eyebrow}>
            YOUR NEXT STEP
          </div>

          <div style={styles.finalTitle}>
            Start your preparation
            <br />
            with SAMBHAV.
          </div>

          <div style={styles.finalText}>
            Create your account and enter your
            personalised UPSC preparation workspace.
          </div>

          <a
            href="/login"
            style={styles.finalButton}
          >
            Create Account →
          </a>
        </section>

      </div>
    </main>
  );
}


/* =========================================================
   MAIN APP
   ========================================================= */

export default function Home() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] =
    useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [telegramMode, setTelegramMode] =
    useState(false);
  const [showWelcome, setShowWelcome] =
    useState(false);

  useEffect(() => {
    let stopped = false;

    const authenticate = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (
          response.ok &&
          data?.user
        ) {
          if (stopped) return;

          setTelegramMode(false);
          setUser(data.user);
          setSubscription(
            data.subscription || null
          );
          setIsAdmin(
            data.isAdmin === true
          );

          if (
            data.user.status ===
            "approved"
          ) {
            setShowWelcome(true);
          }

          setLoading(false);
          return;
        }

        const webApp =
          window.Telegram?.WebApp;

        if (webApp?.initData) {
          webApp.ready();
          webApp.expand();

          if (stopped) return;

          setTelegramMode(true);

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

          setSubscription(
            telegramData.subscription ||
              null
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

        if (stopped) return;

        setUser(null);
        setSubscription(null);
        setTelegramMode(false);
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [showWelcome]);


  /* PUBLIC */

  if (
    !loading &&
    !telegramMode &&
    !user
  ) {
    return <PublicLanding />;
  }


  /* LOADING */

  if (loading) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <div
              style={{
                ...styles.pendingCard,
                marginTop: "70px",
              }}
            >
              <div style={styles.brand}>
                SAMBHAV{" "}
                <span style={styles.gold}>
                  UPSC
                </span>
              </div>

              <p style={styles.greetingSub}>
                Preparing your workspace...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }


  /* TELEGRAM ERROR */

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
                  SAMBHAV{" "}
                  <span style={styles.gold}>
                    UPSC
                  </span>
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
                ke liye authorized login required
                hai.
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


  if (!user) {
    return null;
  }


  /* STATUS */

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
        "Aapki access request approve nahi hui hai.";

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
        "Aapka account currently blocked hai.";

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
                  SAMBHAV{" "}
                  <span style={styles.gold}>
                    UPSC
                  </span>
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


  /* WELCOME */

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
            </div>
          </div>
        </main>
      </>
    );
  }


  /* =========================================================
     FINAL DASHBOARD
     ========================================================= */

  const firstName =
    user.first_name ||
    user.firstName ||
    user.name ||
    "Aspirant";

  const initial =
    firstName.charAt(0).toUpperCase();

  const activeSubscription =
    subscription &&
    subscription.status === "active";

  const isPremium =
    Boolean(activeSubscription);

  const isDemo =
    isPremium &&
    String(
      subscription?.plan || ""
    ).toLowerCase() === "demo";

  const accessTitle =
    isPremium
      ? isDemo
        ? "Demo Access Active"
        : "Premium Access Active"
      : "Standard Access";

  const accessDescription =
    isPremium
      ? isDemo
        ? "Your 2-Day Premium Demo is currently active."
        : "Your Premium learning environment is active."
      : "Start building your UPSC preparation with SAMBHAV.";

  const expiryText =
    subscription?.expires_at
      ? new Date(
          subscription.expires_at
        ).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : null;

  const greeting = useMemo(() => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "GOOD MORNING";
    }

    if (hour < 17) {
      return "GOOD AFTERNOON";
    }

    return "GOOD EVENING";
  }, []);


  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main className="sambhav-dashboard" style={styles.page}>
        <style>{`
          .sambhav-dashboard .dashboard-container {
            width: 100%;
            max-width: 1120px;
            margin: 0 auto;
          }

          .sambhav-dashboard .dashboard-quote {
            margin: 0 0 28px;
            padding: 18px 20px;
            border: 1px solid #e5e3de;
            border-radius: 22px;
            background: rgba(255,255,255,.72);
            box-shadow: 0 7px 20px rgba(0,0,0,.035);
          }

          .sambhav-dashboard .dashboard-quote-title {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.2px;
            color: #9b7b2f;
            text-transform: uppercase;
          }

          .sambhav-dashboard .dashboard-quote-text {
            margin-top: 7px;
            font-size: 15px;
            line-height: 1.55;
            font-weight: 800;
            color: #181818;
          }

          .sambhav-dashboard .dashboard-quote-sub {
            margin-top: 5px;
            color: #777;
            font-size: 10px;
            line-height: 1.5;
          }

          @media (min-width: 900px) {
            .sambhav-dashboard .dashboard-container {
              padding-left: 28px;
              padding-right: 28px;
            }
            .sambhav-dashboard .dashboard-module-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .sambhav-dashboard .dashboard-wide-grid {
              display: grid;
              grid-template-columns: minmax(0, 1.45fr) minmax(300px, .75fr);
              gap: 14px;
              align-items: start;
            }
          }

          @media (min-width: 1200px) {
            .sambhav-dashboard .dashboard-container {
              max-width: 1180px;
            }
            .sambhav-dashboard .dashboard-module-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }

          @media (max-width: 520px) {
            .sambhav-dashboard .dashboard-container {
              padding-left: 13px;
              padding-right: 13px;
            }
            .sambhav-dashboard .dashboard-quote {
              padding: 16px;
            }
            .sambhav-dashboard .dashboard-quote-text {
              font-size: 14px;
            }
          }
        `}</style>
        <div className="dashboard-container" style={styles.container}>

          {/* HEADER */}

          <header style={styles.header}>
            <div>
              <div style={styles.brand}>
                SAMBHAV{" "}
                <span style={styles.gold}>
                  UPSC
                </span>
              </div>

              <div style={styles.brandSub}>
                Intelligence • Preparation • Performance
              </div>
            </div>

            <div style={styles.avatar}>
              {initial}
            </div>
          </header>


          {/* GREETING */}

          <section style={styles.greeting}>
            <div style={styles.eyebrow}>
              {greeting}
            </div>

            <h1 style={styles.greetingTitle}>
              {firstName}
            </h1>

            <div style={styles.greetingSub}>
              Your preparation. Your SAMBHAV.
            </div>
          </section>


          <section className="dashboard-quote">
            <div className="dashboard-quote-title">SAMBHAV MINDSET</div>
            <div className="dashboard-quote-text">
              “UPSC sirf padhne se nahi, sahi direction mein consistently prepare karne se crack hota hai.”
            </div>
            <div className="dashboard-quote-sub">
              Har din thoda better. Har revision thoda smarter.
            </div>
          </section>


          {/* ACCESS CARD */}

          <section style={styles.accessCard}>
            <div style={styles.accessGlow} />

            <div style={styles.accessContent}>

              <div style={styles.accessBadge}>
                {isPremium
                  ? "✦ PREMIUM ACCESS"
                  : "SAMBHAV ACCESS"}
              </div>

              <div style={styles.accessTitle}>
                {accessTitle}
              </div>

              <div style={styles.accessText}>
                {accessDescription}
              </div>

              <div style={styles.accessStatus}>
                {isPremium
                  ? isDemo
                    ? `✓ DEMO ACTIVE${expiryText ? ` • UNTIL ${expiryText}` : ""}`
                    : `✓ PREMIUM ACTIVE${expiryText ? ` • UNTIL ${expiryText}` : ""}`
                  : "STANDARD ACCESS"}
              </div>

            </div>
          </section>


          {/* PREPARATION MOTIVATION */}

          <section style={styles.motivationCard}>
            <div style={styles.motivationGlow} />

            <div style={styles.motivationLabel}>
              SAMBHAV MINDSET
            </div>

            <div style={styles.motivationTitle}>
              “UPSC sirf padhne se nahi, sahi direction mein consistently prepare karne se crack hota hai.”
            </div>

            <div style={styles.motivationText}>
              Aaj ki preparation ko kal par mat chhodiye. Chhote, focused steps hi long-term UPSC preparation ko strong banate hain.
            </div>
          </section>


          {/* FREE USER PREMIUM CTA */}

          {!isPremium && (
            <section style={styles.lockedBanner}>
              <div style={styles.lockedBannerTitle}>
                ✦ Turn Your Preparation Into a System
              </div>

              <div style={styles.lockedBannerText}>
                Current Affairs, PYQ Intelligence, Prelims Practice,
                Mains Answer Writing, AI Evaluation and premium resources —
                sab ek focused UPSC workspace mein.
              </div>

              <div
                style={{
                  marginTop: "8px",
                  color: "#5f594d",
                  fontSize: "10px",
                  lineHeight: "1.5",
                  fontWeight: "750",
                }}
              >
                Consistency ko direction do. Preparation ko SAMBHAV banao.
              </div>

              <a
                href="/premium"
                style={styles.lockedButton}
              >
                Explore Premium →
              </a>
            </section>
          )}


          {/* STATS */}

          <section style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>
                0%
              </div>

              <div style={styles.statLabel}>
                Syllabus
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statNumber}>
                0
              </div>

              <div style={styles.statLabel}>
                PYQs Solved
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statNumber}>
                0
              </div>

              <div style={styles.statLabel}>
                Day Streak
              </div>
            </div>
          </section>


          {/* COUNTDOWN */}

          <section style={styles.countdown}>
            <div style={styles.countdownTop}>
              <div style={styles.countdownTitle}>
                UPSC 2027
              </div>

              <div style={styles.countdownSmall}>
                PREPARATION COUNTDOWN
              </div>
            </div>

            <div style={styles.countdownNumber}>
              — DAYS
            </div>

            <div style={styles.countdownBar}>
              <div style={styles.countdownFill} />
            </div>
          </section>


          {/* TODAY'S MISSION */}

          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Today's Mission
            </div>

            <div style={styles.sectionSmall}>
              3 TASKS
            </div>
          </div>

          <section style={styles.mission}>

            <div style={styles.missionRow}>
              <div style={styles.check}>
                □
              </div>

              <div>
                <div style={styles.missionTitle}>
                  Current Affairs
                </div>

                <div style={styles.missionSub}>
                  Complete today's CA revision
                </div>
              </div>
            </div>

            <div style={styles.missionRow}>
              <div style={styles.check}>
                □
              </div>

              <div>
                <div style={styles.missionTitle}>
                  PYQ Practice
                </div>

                <div style={styles.missionSub}>
                  Solve today's selected questions
                </div>
              </div>
            </div>

            <div
              style={{
                ...styles.missionRow,
                ...styles.missionLast,
              }}
            >
              <div style={styles.check}>
                □
              </div>

              <div>
                <div style={styles.missionTitle}>
                  Mains Answer
                </div>

                <div style={styles.missionSub}>
                  Write one answer today
                </div>
              </div>
            </div>

          </section>


          {/* PREPARATION MODULES */}

          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Your Preparation
            </div>

            <div style={styles.sectionSmall}>
              {isPremium
                ? "ALL ACCESS"
                : "PREVIEW"}
            </div>
          </div>


          <section className="dashboard-module-grid" style={styles.modulesGrid}>
            {modules.map((module) => {

              const locked =
                module.premium &&
                !isPremium;

              return (
                <div
                  key={module.title}
                  style={{
                    ...styles.moduleCard,
                    opacity:
                      locked ? 0.78 : 1,
                  }}
                  onClick={() => {
                    if (locked) {
                      window.location.href =
                        "/premium";
                      return;
                    }

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

                  <div style={styles.moduleIcon}>
                    {module.icon}
                  </div>

                  {locked && (
                    <div style={styles.lock}>
                      🔒
                    </div>
                  )}

                  <div style={styles.moduleTitle}>
                    {module.title}
                  </div>

                  <div style={styles.moduleSubtitle}>
                    {module.subtitle}
                  </div>

                  <div style={styles.moduleArrow}>
                    ›
                  </div>

                </div>
              );
            })}

            {isAdmin && (
              <div
                style={styles.moduleCard}
                onClick={() => {
                  window.location.href =
                    "/admin";
                }}
              >
                <div style={styles.moduleIcon}>
                  🔐
                </div>

                <div style={styles.moduleTitle}>
                  Admin Panel
                </div>

                <div style={styles.moduleSubtitle}>
                  Members • Requests • Approvals
                </div>

                <div style={styles.moduleArrow}>
                  ›
                </div>
              </div>
            )}
          </section>


          {/* AI SECRETARY */}

          <section style={styles.aiCard}>
            <div style={styles.aiGlow} />

            <div style={styles.aiContent}>
              <div style={styles.aiLabel}>
                ✦ SAMBHAV AI
              </div>

              <div style={styles.aiTitle}>
                AI Secretary
              </div>

              <div style={styles.aiText}>
                Your personal UPSC preparation assistant
                for planning, revision, analysis and
                learning.
              </div>

              <button
                style={{
                  ...styles.aiButton,
                  opacity:
                    isPremium ? 1 : 0.7,
                }}
                onClick={() => {
                  if (!isPremium) {
                    window.location.href =
                      "/premium";
                    return;
                  }

                  console.log(
                    "AI Secretary coming soon"
                  );
                }}
              >
                {isPremium
                  ? "Open AI Secretary →"
                  : "Unlock AI Secretary →"}
              </button>
            </div>
          </section>


          {/* DAILY INTELLIGENCE */}

          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Daily Intelligence
            </div>

            <div style={styles.sectionSmall}>
              UPSC FOCUSED
            </div>
          </div>

          <section style={styles.intelligence}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "900",
              }}
            >
              Today's UPSC Intelligence
            </div>

            <div style={styles.intelligenceText}>
              Important current affairs, government
              updates and exam-relevant developments
              will appear here.
            </div>

            <a
              href={
                isPremium
                  ? "/current-affairs"
                  : "/premium"
              }
              style={
                styles.intelligenceButton
              }
            >
              {isPremium
                ? "Read Today's Intelligence →"
                : "Unlock Intelligence →"}
            </a>
          </section>

        </div>


        {/* BOTTOM NAV */}

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
            onClick={() => {
              if (!isPremium) {
                window.location.href =
                  "/premium";
                return;
              }

              console.log("Practice");
            }}
          >
            <span style={styles.navIcon}>
              ◫
            </span>
            Practice
          </div>

          <div
            style={styles.navItem}
            onClick={() => {
              if (!isPremium) {
                window.location.href =
                  "/premium";
                return;
              }

              window.location.href =
                "/current-affairs";
            }}
          >
            <span style={styles.navIcon}>
              ▤
            </span>
            Current
          </div>

          <div
            style={styles.navItem}
            onClick={() => {
              if (!isPremium) {
                window.location.href =
                  "/premium";
                return;
              }

              console.log("AI");
            }}
          >
            <span style={styles.navIcon}>
              ✦
            </span>
            AI
          </div>

          <div
            style={styles.navItem}
            onClick={() => {
              console.log("Profile");
            }}
          >
            <span style={styles.navIcon}>
              ◯
            </span>
            Profile
          </div>

        </nav>

      </main>
    </>
  );
}
