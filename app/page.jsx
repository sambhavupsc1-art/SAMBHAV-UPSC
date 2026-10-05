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
    route: "/prelims-test",
  },
  {
    title: "Mains",
    subtitle: "Answer Writing Practice",
    icon: "✍️",
    route: "/answer",
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
      "linear-gradient(180deg, #f8f7f3 0%, #f1f0ec 100%)",
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
    fontWeight: "900",
    letterSpacing: "-0.7px",
  },

  brandGold: {
    color: "#9b7b2f",
  },

  brandSub: {
    fontSize: "9px",
    color: "#8b8b8b",
    marginTop: "4px",
    letterSpacing: "1.3px",
    textTransform: "uppercase",
    fontWeight: "700",
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, #191919, #050505)",
    color: "#d6bd79",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    fontWeight: "850",
    boxShadow: "0 7px 18px rgba(0,0,0,0.13)",
  },

  landingHero: {
    background:
      "linear-gradient(145deg, #0b0b0b 0%, #151515 53%, #252525 100%)",
    color: "#ffffff",
    borderRadius: "31px",
    padding: "30px 23px 25px",
    marginBottom: "20px",
    boxShadow: "0 22px 48px rgba(0,0,0,0.17)",
    position: "relative",
    overflow: "hidden",
  },

  landingGlow: {
    position: "absolute",
    width: "270px",
    height: "270px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(190,157,76,0.25), rgba(190,157,76,0) 70%)",
    right: "-120px",
    top: "-120px",
    pointerEvents: "none",
  },

  landingGlow2: {
    position: "absolute",
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.035)",
    left: "-95px",
    bottom: "-100px",
    pointerEvents: "none",
  },

  landingEyebrow: {
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.7px",
    color: "#d2ba76",
    textTransform: "uppercase",
    position: "relative",
    zIndex: 2,
  },

  landingTitle: {
    margin: "17px 0 0",
    fontSize: "42px",
    lineHeight: "1.01",
    fontWeight: "950",
    letterSpacing: "-1.8px",
    position: "relative",
    zIndex: 2,
  },

  landingGold: {
    color: "#d6bd79",
  },

  landingText: {
    marginTop: "15px",
    color: "#bcbcbc",
    fontSize: "13px",
    lineHeight: "1.7",
    maxWidth: "560px",
    position: "relative",
    zIndex: 2,
  },

  landingButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
    marginTop: "22px",
    position: "relative",
    zIndex: 2,
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 17px",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#111111",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "900",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 17px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "800",
  },

  heroStats: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    marginTop: "25px",
    paddingTop: "17px",
    borderTop: "1px solid rgba(255,255,255,0.09)",
    position: "relative",
    zIndex: 2,
  },

  heroStatNumber: {
    fontSize: "16px",
    fontWeight: "900",
  },

  heroStatText: {
    marginTop: "3px",
    color: "#777777",
    fontSize: "8px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontWeight: "700",
  },

  landingSection: {
    marginTop: "39px",
  },

  goldLabel: {
    color: "#9b7b2f",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.6px",
    textTransform: "uppercase",
  },

  landingSectionTitle: {
    marginTop: "7px",
    fontSize: "27px",
    lineHeight: "1.12",
    fontWeight: "900",
    letterSpacing: "-0.9px",
  },

  landingSectionSub: {
    marginTop: "8px",
    color: "#777777",
    fontSize: "12px",
    lineHeight: "1.6",
    maxWidth: "560px",
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "11px",
    marginTop: "17px",
  },

  featureCard: {
    background: "#ffffff",
    border: "1px solid #e5e3de",
    borderRadius: "21px",
    padding: "16px",
    minHeight: "140px",
    boxSizing: "border-box",
    boxShadow:
      "0 7px 20px rgba(0,0,0,0.045)",
  },

  featureIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg, #181818, #080808)",
    color: "#d6bd79",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  featureTitle: {
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: "900",
  },

  featureText: {
    marginTop: "5px",
    fontSize: "10px",
    color: "#858585",
    lineHeight: "1.45",
  },

  previewOuter: {
    marginTop: "17px",
    background:
      "linear-gradient(145deg,#171717,#0a0a0a)",
    borderRadius: "27px",
    padding: "16px",
    boxShadow:
      "0 20px 43px rgba(0,0,0,0.16)",
    overflow: "hidden",
  },

  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "3px 3px 14px",
  },

  previewBrand: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "900",
  },

  previewSub: {
    marginTop: "3px",
    color: "#777777",
    fontSize: "7px",
    letterSpacing: "1.1px",
    fontWeight: "700",
  },

  previewAvatar: {
    width: "31px",
    height: "31px",
    borderRadius: "50%",
    background: "#f2efe7",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "900",
  },

  previewMainCard: {
    background:
      "linear-gradient(145deg,#252525,#151515)",
    borderRadius: "19px",
    padding: "17px",
    border:
      "1px solid rgba(255,255,255,0.07)",
  },

  previewLabel: {
    color: "#8d8d8d",
    fontSize: "8px",
    letterSpacing: "1.2px",
    fontWeight: "800",
  },

  previewTitle: {
    marginTop: "7px",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "900",
  },

  previewDescription: {
    marginTop: "5px",
    color: "#858585",
    fontSize: "9px",
  },

  previewMiniGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "7px",
    marginTop: "16px",
  },

  previewMini: {
    background:
      "rgba(255,255,255,0.055)",
    border:
      "1px solid rgba(255,255,255,0.06)",
    borderRadius: "11px",
    padding: "11px 4px",
    textAlign: "center",
    color: "#d6bd79",
    fontSize: "8px",
    fontWeight: "850",
  },

  previewModules: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "7px",
    marginTop: "9px",
  },

  previewModule: {
    padding: "10px",
    borderRadius: "12px",
    background:
      "rgba(255,255,255,0.045)",
    color: "#aaaaaa",
    fontSize: "8px",
    fontWeight: "750",
  },

  premiumLandingCard: {
    marginTop: "39px",
    background:
      "linear-gradient(145deg,#eee6d2,#e3dac1)",
    border:
      "1px solid #d7ccb0",
    borderRadius: "27px",
    padding: "23px",
    position: "relative",
    overflow: "hidden",
  },

  premiumLandingGlow: {
    position: "absolute",
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    right: "-95px",
    top: "-95px",
    background:
      "rgba(255,255,255,0.45)",
  },

  premiumLandingContent: {
    position: "relative",
    zIndex: 2,
  },

  premiumLabel: {
    color: "#806425",
    fontSize: "9px",
    fontWeight: "950",
    letterSpacing: "1.5px",
  },

  premiumTitle: {
    marginTop: "8px",
    fontSize: "25px",
    lineHeight: "1.12",
    fontWeight: "950",
    letterSpacing: "-0.8px",
  },

  premiumText: {
    marginTop: "9px",
    color: "#6f685a",
    fontSize: "11px",
    lineHeight: "1.6",
    maxWidth: "520px",
  },

  premiumPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "15px",
  },

  premiumPill: {
    padding: "7px 9px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.55)",
    border:
      "1px solid rgba(130,110,70,0.13)",
    color: "#5f584b",
    fontSize: "8px",
    fontWeight: "800",
  },

  premiumButton: {
    display: "inline-flex",
    marginTop: "18px",
    padding: "12px 15px",
    borderRadius: "13px",
    background: "#111111",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "10px",
    fontWeight: "900",
  },

  finalCTA: {
    marginTop: "42px",
    textAlign: "center",
    padding: "8px 8px 0",
  },

  finalTitle: {
    marginTop: "8px",
    fontSize: "29px",
    lineHeight: "1.08",
    fontWeight: "950",
    letterSpacing: "-1px",
  },

  finalText: {
    margin: "10px auto 0",
    maxWidth: "470px",
    color: "#777777",
    fontSize: "11px",
    lineHeight: "1.6",
  },

  finalButton: {
    display: "inline-flex",
    marginTop: "18px",
    padding: "14px 22px",
    borderRadius: "15px",
    background: "#111111",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: "900",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.13)",
  },

  publicFooter: {
    marginTop: "48px",
    paddingTop: "20px",
    borderTop: "1px solid #dedcd6",
  },

  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "13px",
  },

  footerLink: {
    color: "#666666",
    textDecoration: "none",
    fontSize: "9px",
    fontWeight: "700",
  },

  footerCopy: {
    marginTop: "13px",
    color: "#999999",
    fontSize: "8px",
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
    boxShadow:
      "0 13px 32px rgba(0,0,0,0.13)",
    border:
      "1px solid rgba(255,255,255,0.05)",
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
    marginBottom: "18px",
    boxShadow:
      "0 15px 38px rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  premiumGlow: {
    position: "absolute",
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.055)",
    right: "-75px",
    top: "-85px",
  },

  premiumGlowSmall: {
    position: "absolute",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.035)",
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

  premiumTitleDashboard: {
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
    cursor: "pointer",
  },

  adminCard: {
    background:
      "linear-gradient(135deg, #f0e7cf 0%, #e2d4b1 55%, #d5c398 100%)",
    color: "#111111",
    borderRadius: "25px",
    padding: "21px",
    marginBottom: "27px",
    boxShadow:
      "0 15px 38px rgba(95,75,25,0.13)",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    border:
      "1px solid #d4c49e",
  },

  adminGlow: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.42)",
    right: "-70px",
    top: "-80px",
  },

  adminBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#111111",
    color: "#d6bd79",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
    position: "relative",
    zIndex: 2,
  },

  adminTitle: {
    marginTop: "13px",
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: "1.2",
    position: "relative",
    zIndex: 2,
  },

  adminSub: {
    marginTop: "7px",
    color: "#655d4e",
    fontSize: "11px",
    lineHeight: "1.55",
    maxWidth: "390px",
    position: "relative",
    zIndex: 2,
  },

  adminAction: {
    marginTop: "16px",
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: "13px",
    background: "#111111",
    color: "#ffffff",
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
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.05)",
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

/* =========================================================
PUBLIC LANDING PAGE
========================================================= */

function PublicLanding({ theme, toggleTheme }) {
  const dark = theme === "dark";
  const publicUi = dark
    ? {
        pageBg: "linear-gradient(180deg,#090909 0%,#111111 100%)",
        text: "#f7f4ec",
        muted: "#a9a49a",
        soft: "#77736b",
        surface: "#151515",
        surfaceAlt: "#1b1b1b",
        line: "rgba(255,255,255,0.10)",
        gold: "#d6bd79",
      }
    : {
        pageBg: "linear-gradient(180deg,#f8f7f3 0%,#efeee9 100%)",
        text: "#111111",
        muted: "#625f58",
        soft: "#77736c",
        surface: "#ffffff",
        surfaceAlt: "#f8f6f0",
        line: "#e4e1da",
        gold: "#a07d32",
      };

  const features = [
    {
      icon: "◈",
      title: "Current Affairs",
      text:
        "Daily UPSC-focused intelligence with exam-oriented revision.",
    },
    {
      icon: "◎",
      title: "PYQ Intelligence",
      text:
        "Understand previous year questions beyond simple practice.",
    },
    {
      icon: "▣",
      title: "Prelims Practice",
      text:
        "Structured practice designed around UPSC preparation.",
    },
    {
      icon: "✎",
      title: "Mains Practice",
      text:
        "Build answer-writing discipline with focused practice.",
    },
  ];

  const systemCards = [
    "Current Affairs",
    "PYQ Intelligence",
    "Prelims Practice",
    "Mains Answer Writing",
    "AI Evaluation",
    "Study Material",
  ];

  return (
    <>
      <main style={{ ...styles.page, background: publicUi.pageBg, color: publicUi.text, transition: "background 180ms ease, color 180ms ease" }}>
        <div style={styles.container}>
          <header style={{ ...styles.header, color: publicUi.text }}>
            <div>
              <div style={styles.brand}>
                SAMBHAV
                <span style={styles.brandGold}>
                  {" "}UPSC
                </span>
              </div>

              <div style={styles.brandSub}>
                Intelligence • Preparation • Performance
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px", height: "38px",
                  padding: "0 11px", borderRadius: "999px", border: `1px solid ${publicUi.line}`,
                  background: publicUi.surface, color: publicUi.text, fontSize: "9px", fontWeight: 900,
                  letterSpacing: "0.8px", cursor: "pointer",
                }}
              >
                <span style={{ color: publicUi.gold, fontSize: "14px" }}>{dark ? "☀" : "☾"}</span>
                {dark ? "LIGHT" : "DARK"}
              </button>
              <a
                href="/login"
                style={{
                  ...styles.secondaryButton,
                  background: dark ? "#f5f1e7" : "#111111",
                  color: dark ? "#111111" : "#ffffff",
                  border: "none",
                  padding: "11px 15px",
                }}
              >
                Sign In
              </a>
            </div>
          </header>

          <section style={{ ...styles.landingHero, boxShadow: dark ? "0 22px 48px rgba(0,0,0,0.35)" : styles.landingHero.boxShadow }}>
            <div style={styles.landingGlow} />
            <div style={styles.landingGlow2} />

            <div style={styles.landingEyebrow}>
              ✦ AI-POWERED UPSC PREPARATION
            </div>

            <h1 style={styles.landingTitle}>
              Prepare with clarity.
              <br />
              <span style={styles.landingGold}>
                Perform with SAMBHAV.
              </span>
            </h1>

            <p style={styles.landingText}>
              A focused UPSC preparation system bringing
              Current Affairs, PYQs, Prelims, Mains,
              AI-assisted learning and study resources
              into one professional platform.
            </p>

            <div style={styles.landingButtons}>
              <a
                href="/login"
                style={styles.primaryButton}
              >
                Start Preparing →
              </a>

              <a
                href="/pricing"
                style={styles.secondaryButton}
              >
                Explore Plans
              </a>
            </div>

            <div style={styles.heroStats}>
              <div>
                <div style={styles.heroStatNumber}>01</div>
                <div style={styles.heroStatText}>Focused</div>
              </div>

              <div>
                <div style={styles.heroStatNumber}>02</div>
                <div style={styles.heroStatText}>Structured</div>
              </div>

              <div>
                <div style={styles.heroStatNumber}>03</div>
                <div style={styles.heroStatText}>Intelligent</div>
              </div>
            </div>
          </section>

          <section style={{ ...styles.landingSection, color: publicUi.text }}>
            <div style={styles.goldLabel}>
              THE SAMBHAV SYSTEM
            </div>

            <div style={styles.landingSectionTitle}>
              One platform.
              <br />
              One preparation system.
            </div>

            <div style={{ ...styles.landingSectionSub, color: publicUi.muted }}>
              Instead of jumping between multiple tools,
              organise your preparation inside one
              structured workspace.
            </div>

            <div style={styles.featureGrid}>
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  style={{ ...styles.featureCard, background: publicUi.surface, border: `1px solid ${publicUi.line}`, color: publicUi.text, boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.22)" : styles.featureCard.boxShadow }}
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

                  <div
                    style={{
                      marginTop: "9px",
                      color: "#b1b1b1",
                      fontSize: "8px",
                      fontWeight: "800",
                    }}
                  >
                    0{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...styles.landingSection, color: publicUi.text }}>
            <div style={styles.goldLabel}>
              INSIDE SAMBHAV
            </div>

            <div style={styles.landingSectionTitle}>
              Your preparation,
              <br />
              organised in one dashboard.
            </div>

            <div style={{ ...styles.landingSectionSub, color: publicUi.muted }}>
              Everything important stays inside your
              preparation workspace.
            </div>

            <div style={{ ...styles.previewOuter, boxShadow: dark ? "0 20px 43px rgba(0,0,0,0.35)" : styles.previewOuter.boxShadow }}>
              <div style={styles.previewHeader}>
                <div>
                  <div style={styles.previewBrand}>
                    SAMBHAV UPSC
                  </div>

                  <div style={styles.previewSub}>
                    COMMAND CENTRE
                  </div>
                </div>

                <div style={styles.previewAvatar}>
                  A
                </div>
              </div>

              <div style={styles.previewMainCard}>
                <div style={styles.previewLabel}>
                  TODAY'S PREPARATION
                </div>

                <div style={styles.previewTitle}>
                  Stay consistent.
                </div>

                <div style={styles.previewDescription}>
                  Your preparation system is ready.
                </div>

                <div style={styles.previewMiniGrid}>
                  <div style={styles.previewMini}>CA</div>
                  <div style={styles.previewMini}>PYQ</div>
                  <div style={styles.previewMini}>MAINS</div>
                </div>
              </div>

              <div style={styles.previewModules}>
                {systemCards.map((item) => (
                  <div
                    key={item}
                    style={styles.previewModule}
                  >
                    {item}

                    <span
                      style={{
                        float: "right",
                        color: "#555555",
                      }}
                    >
                      →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ ...styles.premiumLandingCard, background: dark ? "linear-gradient(145deg,#1d1d1d,#121212)" : styles.premiumLandingCard.background, border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "#d7ccb0"}`, color: dark ? "#f7f4ec" : "#111111" }}>
            <div style={styles.premiumLandingGlow} />

            <div style={styles.premiumLandingContent}>
              <div style={styles.premiumLabel}>
                PREMIUM ACCESS
              </div>

              <div style={styles.premiumTitle}>
                Built for serious
                <br />
                UPSC preparation.
              </div>

              <div style={{ ...styles.premiumText, color: dark ? "#aaa59b" : "#6f685a" }}>
                Unlock the complete SAMBHAV experience
                and bring your preparation tools into
                one focused workspace.
              </div>

              <div style={styles.premiumPills}>
                <span style={styles.premiumPill}>
                  ✓ Daily Intelligence
                </span>

                <span style={styles.premiumPill}>
                  ✓ PYQ Intelligence
                </span>

                <span style={styles.premiumPill}>
                  ✓ Mains Practice
                </span>

                <span style={styles.premiumPill}>
                  ✓ AI Learning
                </span>
              </div>

              <a
                href="/pricing"
                style={{ ...styles.premiumButton, background: dark ? "#f5f1e7" : "#111111", color: dark ? "#111111" : "#ffffff" }}
              >
                Explore Premium →
              </a>
            </div>
          </section>

          <section style={{ ...styles.finalCTA, color: publicUi.text }}>
            <div style={styles.goldLabel}>
              YOUR NEXT STEP
            </div>

            <div style={styles.finalTitle}>
              Start your preparation
              <br />
              with SAMBHAV.
            </div>

            <div style={{ ...styles.finalText, color: publicUi.muted }}>
              Create your account and enter your
              personalised UPSC preparation workspace.
            </div>

            <a
              href="/login"
              style={{ ...styles.finalButton, background: dark ? "#f5f1e7" : "#111111", color: dark ? "#111111" : "#ffffff" }}
            >
              Create Account →
            </a>
          </section>

<footer style={{ ...styles.publicFooter, borderTop: `1px solid ${publicUi.line}` }}>
            <div style={styles.footerLinks}>
              <a href="/about" style={{ ...styles.footerLink, color: publicUi.muted }}>
                About
              </a>

              <a href="/contact" style={{ ...styles.footerLink, color: publicUi.muted }}>
                Contact
              </a>

              <a href="/pricing" style={{ ...styles.footerLink, color: publicUi.muted }}>
                Pricing
              </a>

              <a href="/privacy" style={{ ...styles.footerLink, color: publicUi.muted }}>
                Privacy
              </a>

              <a href="/terms" style={{ ...styles.footerLink, color: publicUi.muted }}>
                Terms
              </a>

              <a href="/refund" style={{ ...styles.footerLink, color: publicUi.muted }}>
                Refund
              </a>
            </div>

            <div style={{ ...styles.footerCopy, color: publicUi.soft }}>
              © {new Date().getFullYear()} SAMBHAV UPSC.
              All rights reserved.
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}

/* =========================================================
MAIN HOME
========================================================= */

export default function Home() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [telegramMode, setTelegramMode] = useState(false);
  const [theme, setTheme] = useState("light");
  const [lockedFeature, setLockedFeature] = useState("");

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

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  /* =====================================================
  AUTHENTICATION
  ===================================================== */

  useEffect(() => {
    let stopped = false;

    const verifyAdmin = async () => {
      try {
        const response = await fetch(
          "/api/admin/users",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        /*
         * 200 = authenticated admin.
         * 401/403 = normal user.
         */
        if (!stopped && response.ok) {
          setIsAdmin(true);
        }
      } catch (adminError) {
        console.error(
          "Admin verification error:",
          adminError
        );
      }
    };

    const authenticate = async () => {
      if (stopped) return;

      try {
        /* ===============================================
        1. EMAIL SESSION
        =============================================== */

        const emailResponse = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const emailData =
          await emailResponse
            .json()
            .catch(() => ({}));

        if (
          emailResponse.ok &&
          emailData?.user
        ) {
          if (stopped) return;

          setTelegramMode(false);

          setUser(emailData.user);

          setSubscription(
            emailData.subscription || null
          );

          /*
           * Existing backend admin result.
           */
          setIsAdmin(
            emailData.isAdmin === true
          );

          /*
           * Independent admin verification.
           */
          await verifyAdmin();

          setLoading(false);

          return;
        }

        /* ===============================================
        2. LEGACY TELEGRAM AUTH
        =============================================== */

        const webApp =
          window.Telegram?.WebApp;

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

          setSubscription(
            telegramData.subscription || null
          );

          setIsAdmin(
            telegramData.isAdmin === true
          );

          setLoading(false);

          return;
        }

        /* ===============================================
        3. PUBLIC WEBSITE
        =============================================== */

        if (stopped) return;

        setTelegramMode(false);
        setUser(null);
        setSubscription(null);
        setIsAdmin(false);
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


  /* =====================================================
  PUBLIC WEBSITE
  ===================================================== */

  if (
    !loading &&
    !telegramMode &&
    !user
  ) {
    return <PublicLanding theme={theme} toggleTheme={toggleTheme} />;
  }

  /* =====================================================
  LOADING
  ===================================================== */

  if (loading) {
    const loadingDark = theme === "dark";
    const loadingUi = loadingDark
      ? { bg: "#090909", surface: "#151515", text: "#f7f4ec", muted: "#a9a49a", line: "rgba(255,255,255,0.10)" }
      : { bg: "#f8f7f3", surface: "#ffffff", text: "#111111", muted: "#77736c", line: "#e4e1da" };
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={{ ...styles.page, background: loadingUi.bg, color: loadingUi.text }}>
          <div style={styles.container}>
            <div
              style={{ ...styles.pendingCard, marginTop: "70px", background: loadingUi.surface, color: loadingUi.text, border: `1px solid ${loadingUi.line}` }}
            >
              <div style={styles.brand}>
                SAMBHAV
                <span style={styles.brandGold}>
                  {" "}UPSC
                </span>
              </div>

              <p style={{ ...styles.greetingSub, color: loadingUi.muted }}>
                Checking access...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* =====================================================
  TELEGRAM AUTH ERROR
  ===================================================== */

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
                  SAMBHAV
                  <span style={styles.brandGold}>
                    {" "}UPSC
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

  /* =====================================================
  SAFETY
  ===================================================== */

  if (!user) {
    return null;
  }

  /* =====================================================
  APPROVAL STATUS
  ===================================================== */

  if (
    user.status !==
    "approved"
  ) {
    let title = "Access Pending";

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
                  SAMBHAV
                  <span style={styles.brandGold}>
                    {" "}UPSC
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

  /* =====================================================
  PREMIUM STATUS
  ===================================================== */

  const isPremium =
    subscription?.status === "active" &&
    subscription?.expires_at &&
    new Date(subscription.expires_at) >
      new Date();

  const premiumPlan =
    String(
      subscription?.plan || ""
    ).toLowerCase();

  /* =====================================================
  SIGN-IN SUCCESS / PREVIEW SCREEN

  IMPORTANT:
  This screen is intentionally non-functional.
  The actual SAMBHAV modules are available only after
  Demo/Premium activation from /premium.
  ===================================================== */

  const firstName =
    user.first_name ||
    user.firstName ||
    user.name ||
    "Aspirant";

  const initial =
    String(firstName).charAt(0).toUpperCase() || "A";

  const previewFeatures = [
    {
      icon: "📰",
      title: "Current Affairs",
      subtitle: "Daily + Monthly • UPSC Analysis",
    },
    {
      icon: "🎯",
      title: "PYQ Intelligence",
      subtitle: "Prelims + Mains • Topic-wise",
    },
    {
      icon: "📝",
      title: "Prelims Test",
      subtitle: "PYQ-based Tests • Performance",
    },
    {
      icon: "✍️",
      title: "Mains Answer Writing",
      subtitle: "GS I • II • III • IV",
    },
    {
      icon: "🤖",
      title: "AI Answer Evaluation",
      subtitle: "Score • Analysis • Improvement",
    },
    {
      icon: "📚",
      title: "Study Material",
      subtitle: "Notes • Revision • CSAT",
    },
    {
      icon: "📊",
      title: "Performance Analytics",
      subtitle: "Progress • Accuracy • Weak Areas",
    },
  ];

  const goPremium = () => {
    window.location.href = "/premium";
  };

  const openLockedFeature = (name) => {
    setLockedFeature(name || "This feature");
  };

  const closeLockedFeature = () => {
    setLockedFeature("");
  };

  const darkPreview = theme === "dark";
  const preview = darkPreview
    ? {
        page: "radial-gradient(circle at 50% -10%, rgba(199,168,93,0.10), transparent 30%), linear-gradient(180deg, #080808 0%, #101010 100%)",
        text: "#f4f0e7",
        muted: "#969087",
        soft: "#777269",
        card: "rgba(255,255,255,0.045)",
        cardSolid: "#151515",
        line: "rgba(255,255,255,0.09)",
        navBg: "rgba(18,18,18,0.94)",
        navText: "#777269",
        navActive: "rgba(199,168,93,0.11)",
        heroBg: "linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
        heroBorder: "rgba(255,255,255,0.08)",
        heroMuted: "#8d887f",
        gold: "#c7a85d",
        goldSoft: "rgba(199,168,93,0.08)",
        premiumBg: "linear-gradient(135deg, rgba(199,168,93,0.14), rgba(255,255,255,0.025))",
        premiumBorder: "rgba(199,168,93,0.30)",
        buttonBg: "#f1ede4",
        buttonText: "#111111",
      }
    : {
        page: "linear-gradient(180deg, #f7f8fa 0%, #eef1f4 100%)",
        text: "#17202a",
        muted: "#596574",
        soft: "#74808d",
        card: "rgba(255,255,255,0.92)",
        cardSolid: "#ffffff",
        line: "#dce2e8",
        navBg: "rgba(255,255,255,0.96)",
        navText: "#65717e",
        navActive: "#f4ead3",
        heroBg: "linear-gradient(145deg, #ffffff 0%, #f3f5f7 100%)",
        heroBorder: "#e0e5ea",
        heroMuted: "#5f6b78",
        gold: "#9a762d",
        goldSoft: "#f7f0e1",
        premiumBg: "linear-gradient(135deg, #fbf7ed 0%, #f2ead8 100%)",
        premiumBorder: "#d8c79f",
        buttonBg: "#17202a",
        buttonText: "#ffffff",
      };
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main
        style={{
          minHeight: "100vh",
          background: preview.page,
          color: preview.text,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          padding: "26px 16px 70px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          {/* Header — same visual language as the supplied premium design */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "20px",
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: "-0.7px",
                }}
              >
                SAMBHAV <span style={{ color: preview.gold }}>UPSC</span>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  color: preview.muted,
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "2.1px",
                }}
              >
                INTELLIGENCE • PREPARATION • PERFORMANCE
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  height: "36px",
                  padding: "0 11px",
                  borderRadius: "999px",
                  border: `1px solid ${preview.premiumBorder}`,
                  background: preview.card,
                  color: preview.gold,
                  fontSize: "8px",
                  fontWeight: 900,
                  letterSpacing: "0.8px",
                  cursor: "pointer",
                }}
              >
                {theme === "dark" ? "☀ LIGHT" : "☾ DARK"}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { window.location.href = "/admin"; }}
                  style={{
                    height: "36px",
                    padding: "0 11px",
                    borderRadius: "999px",
                    border: `1px solid ${preview.premiumBorder}`,
                    background: preview.goldSoft,
                    color: preview.gold,
                    fontSize: "8px",
                    fontWeight: 900,
                    letterSpacing: "0.8px",
                    cursor: "pointer",
                  }}
                >
                  ADMIN
                </button>
              )}

              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: preview.cardSolid,
                  border: `1px solid ${preview.premiumBorder}`,
                  color: preview.gold,
                  fontSize: "14px",
                  fontWeight: 950,
                  boxSizing: "border-box",
                }}
                title={String(firstName)}
              >
                {initial}
              </div>
            </div>
          </header>

          {/* PREVIEW NAVIGATION — visual only; modules remain locked */}
          <nav
            aria-label="SAMBHAV preview navigation"
            style={{
              display: "flex",
              gap: "7px",
              overflowX: "auto",
              padding: "5px 2px 15px",
              marginBottom: "20px",
              scrollbarWidth: "none",
            }}
          >
            {[
              ["⌂", "Home"],
              ["📰", "Current Affairs"],
              ["🎯", "PYQ"],
              ["📝", "Prelims"],
              ["✍️", "Mains"],
              ["🤖", "AI"],
              ["📚", "Material"],
              ["📊", "Analytics"],
            ].map(([icon, label], index) => (
              <div
                key={label}
                aria-disabled="true"
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  height: "34px",
                  padding: "0 11px",
                  borderRadius: "999px",
                  border: `1px solid ${index === 0 ? preview.premiumBorder : preview.line}`,
                  background: index === 0 ? preview.navActive : preview.card,
                  color: index === 0 ? preview.gold : preview.navText,
                  fontSize: "8px",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                <span>{icon}</span>{label}
              </div>
            ))}
          </nav>

          {/* Hero */}
          <section style={{ textAlign: "center", marginBottom: "48px", padding: "34px 22px 32px", borderRadius: "26px", background: preview.heroBg, border: `1px solid ${preview.heroBorder}`, boxShadow: darkPreview ? "0 18px 50px rgba(0,0,0,0.20)" : "0 18px 45px rgba(31,42,55,0.07)" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "28px",
                padding: "0 12px",
                borderRadius: "999px",
                border: `1px solid ${preview.premiumBorder}`,
                background: preview.goldSoft,
                color: preview.gold,
                fontSize: "8px",
                fontWeight: 950,
                letterSpacing: "1.7px",
              }}
            >
              ✦ YOUR SAMBHAV WORKSPACE
            </div>

            <h1
              style={{
                margin: "18px auto 0",
                maxWidth: "620px",
                fontSize: "clamp(34px, 7vw, 58px)",
                lineHeight: 1.02,
                letterSpacing: "-2.4px",
                fontWeight: 950,
              }}
            >
              Prepare with clarity.
              <br />
              <span style={{ color: preview.gold }}>Perform with SAMBHAV.</span>
            </h1>

            <p
              style={{
                maxWidth: "520px",
                margin: "20px auto 0",
                color: preview.heroMuted,
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              Your complete UPSC preparation ecosystem — designed for focused,
              structured and consistent preparation.
            </p>
          </section>

          {/* Feature section — intentionally non-clickable */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  color: preview.soft,
                  fontSize: "8px",
                  fontWeight: 950,
                  letterSpacing: "1.8px",
                }}
              >
                YOUR LEARNING ECOSYSTEM
              </div>
              <div
                style={{
                  color: preview.soft,
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.8px",
                }}
              >
                PREMIUM ACCESS
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {previewFeatures.map((feature) => (
                <div
                  key={feature.title}
                  role="button"
                  tabIndex={0}
                  onClick={() => openLockedFeature(feature.title)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openLockedFeature(feature.title);
                    }
                  }}
                  aria-label={`${feature.title} - Premium locked`}
                  style={{
                    minHeight: "112px",
                    padding: "18px",
                    boxSizing: "border-box",
                    borderRadius: "18px",
                    border: `1px solid ${preview.line}`,
                    background: preview.card,
                    opacity: 1,
                    boxShadow: darkPreview ? "none" : "0 10px 28px rgba(31,42,55,0.06)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "80px",
                      height: "80px",
                      background:
                        "radial-gradient(circle, rgba(199,168,93,0.10), transparent 68%)",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        flex: "0 0 38px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: preview.goldSoft,
                        border: `1px solid ${preview.premiumBorder}`,
                        fontSize: "17px",
                        filter: "grayscale(0.15)",
                      }}
                    >
                      {feature.icon}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: preview.text,
                          fontSize: "12px",
                          lineHeight: 1.35,
                          fontWeight: 900,
                        }}
                      >
                        {feature.title}
                      </div>
                      <div
                        style={{
                          marginTop: "7px",
                          color: preview.soft,
                          fontSize: "9px",
                          lineHeight: 1.55,
                        }}
                      >
                        {feature.subtitle}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "14px",
                      color: preview.soft,
                      fontSize: "7px",
                      fontWeight: 900,
                      letterSpacing: "1.1px",
                    }}
                  >
                    AVAILABLE WITH PREMIUM
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Premium conversion card — the only actionable item on this screen */}
          <section
            style={{
              marginTop: "14px",
              padding: "24px",
              borderRadius: "22px",
              border: `1px solid ${preview.premiumBorder}`,
              background: preview.premiumBg,
              boxShadow: "0 18px 55px rgba(0,0,0,0.24)",
            }}
          >
            <div
              style={{
                color: preview.gold,
                fontSize: "8px",
                fontWeight: 950,
                letterSpacing: "1.8px",
              }}
            >
              ✦ UNLOCK THE COMPLETE EXPERIENCE
            </div>

            <h2
              style={{
                margin: "11px 0 0",
                fontSize: "24px",
                lineHeight: 1.15,
                letterSpacing: "-0.8px",
                fontWeight: 950,
              }}
            >
              Your preparation starts here.
            </h2>

            <p
              style={{
                margin: "10px 0 20px",
                color: preview.heroMuted,
                fontSize: "11px",
                lineHeight: 1.65,
              }}
            >
              Activate Demo or Premium to enter the fully functional SAMBHAV
              Learning Ecosystem.
            </p>

            <button
              type="button"
              onClick={goPremium}
              style={{
                width: "100%",
                minHeight: "52px",
                border: "none",
                borderRadius: "14px",
                background: preview.buttonBg,
                color: preview.buttonText,
                fontSize: "10px",
                fontWeight: 950,
                letterSpacing: "1.1px",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.20)",
              }}
            >
              EXPLORE PREMIUM →
            </button>

            <div
              style={{
                marginTop: "13px",
                textAlign: "center",
                color: "#575249",
                fontSize: "7px",
                fontWeight: 800,
                letterSpacing: "0.8px",
              }}
            >
              2-DAY DEMO • MONTHLY • QUARTERLY • ANNUAL
            </div>
          </section>

          <nav
            aria-label="SAMBHAV quick navigation"
            style={{
              position: "sticky",
              bottom: "14px",
              zIndex: 20,
              marginTop: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "6px",
              padding: "7px",
              borderRadius: "20px",
              background: preview.navBg,
              border: `1px solid ${preview.line}`,
              boxShadow: "0 15px 40px rgba(0,0,0,0.28)",
              backdropFilter: "blur(14px)",
            }}
          >
            {[
              ["⌂", "Home"],
              ["◈", "PYQ"],
              ["✎", "Mains"],
              ["✦", "Premium"],
            ].map(([icon, label], index) => (
              <div
                key={label}
                onClick={() => {
                  if (label === "Premium") goPremium();
                  else if (label === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
                  else openLockedFeature(label);
                }}
                style={{
                  height: "42px",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  background: index === 0 ? preview.navActive : "transparent",
                  color: index === 0 ? preview.gold : label === "Premium" ? preview.gold : preview.navText,
                  fontSize: "7px",
                  fontWeight: 900,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: "15px", lineHeight: 1 }}>{icon}</span>
                {label}
              </div>
            ))}
          </nav>

          {lockedFeature && (
            <div
              role="dialog"
              aria-modal="true"
              onClick={closeLockedFeature}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: "390px",
                  padding: "26px",
                  borderRadius: "24px",
                  background: darkPreview ? "#151515" : "#fffdf8",
                  color: darkPreview ? "#f4f0e7" : "#151515",
                  border: `1px solid ${darkPreview ? "rgba(255,255,255,0.10)" : "#dedbd2"}`,
                  boxShadow: "0 30px 80px rgba(0,0,0,0.40)",
                  textAlign: "center",
                }}
              >
                <div style={{ width: "54px", height: "54px", margin: "0 auto", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(199,168,93,0.12)", border: "1px solid rgba(199,168,93,0.20)", fontSize: "23px" }}>🔒</div>
                <div style={{ marginTop: "16px", color: preview.gold, fontSize: "8px", fontWeight: 950, letterSpacing: "1.7px" }}>PREMIUM ACCESS REQUIRED</div>
                <h3 style={{ margin: "9px 0 0", fontSize: "22px", fontWeight: 950 }}>
                  {lockedFeature} is locked
                </h3>
                <p style={{ margin: "9px 0 0", color: darkPreview ? "#8d887f" : "#6f6a61", fontSize: "11px", lineHeight: 1.6 }}>
                  Activate Demo or Premium to access this feature inside the fully functional SAMBHAV Learning Ecosystem.
                </p>
                <button
                  type="button"
                  onClick={goPremium}
                  style={{ width: "100%", marginTop: "19px", minHeight: "48px", border: "none", borderRadius: "13px", background: "#111111", color: "#ffffff", fontSize: "9px", fontWeight: 950, letterSpacing: "1px", cursor: "pointer" }}
                >
                  UNLOCK PREMIUM →
                </button>
                <button
                  type="button"
                  onClick={closeLockedFeature}
                  style={{ marginTop: "10px", border: "none", background: "transparent", color: darkPreview ? "#777269" : "#777269", fontSize: "9px", fontWeight: 850, cursor: "pointer" }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "28px",
              textAlign: "center",
              color: preview.soft,
              fontSize: "7px",
              fontWeight: 800,
              letterSpacing: "0.8px",
            }}
          >
            SAMBHAV UPSC • INTELLIGENCE • PREPARATION • PERFORMANCE
          </div>
        </div>
      </main>
    </>
  );
}
