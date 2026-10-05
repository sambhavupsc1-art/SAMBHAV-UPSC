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

    legalCard: {
      marginTop: 28,
      padding: "24px",
      border: "1px solid #e5e2d9",
      borderRadius: 24,
      background: "#fff",
      boxShadow: "0 12px 30px rgba(0,0,0,0.04)",
    },
    legalEyebrow: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.16em",
      color: "#9b7a24",
      marginBottom: 8,
    },
    legalTitle: {
      fontSize: 22,
      fontWeight: 900,
      color: "#111",
      marginBottom: 6,
    },
    legalSub: {
      fontSize: 13,
      lineHeight: 1.6,
      color: "#666",
      marginBottom: 18,
    },
    legalGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
      gap: 12,
    },
    legalItem: {
      padding: "14px 15px",
      border: "1px solid #ece9e1",
      borderRadius: 16,
      background: "#faf9f6",
    },
    legalLabel: {
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.08em",
      color: "#888",
      marginBottom: 6,
    },
    legalValue: {
      fontSize: 13,
      lineHeight: 1.5,
      fontWeight: 700,
      color: "#222",
      wordBreak: "break-word",
    },
    legalTelegram: {
      display: "inline-block",
      marginTop: 7,
      fontSize: 12,
      fontWeight: 800,
      color: "#111",
      textDecoration: "none",
    },
    legalDescription: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid #ece9e1",
      fontSize: 12,
      lineHeight: 1.65,
      color: "#666",
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

function PublicLanding() {
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
                Intelligence • Preparation • Performance
              </div>
            </div>

            <a
              href="/login"
              style={{
                ...styles.secondaryButton,
                background: "#111111",
                border: "none",
                padding: "11px 15px",
              }}
            >
              Sign In
            </a>
          </header>

          <section style={styles.landingHero}>
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

          <section style={styles.landingSection}>
            <div style={styles.goldLabel}>
              THE SAMBHAV SYSTEM
            </div>

            <div style={styles.landingSectionTitle}>
              One platform.
              <br />
              One preparation system.
            </div>

            <div style={styles.landingSectionSub}>
              Instead of jumping between multiple tools,
              organise your preparation inside one
              structured workspace.
            </div>

            <div style={styles.featureGrid}>
              {features.map((feature, index) => (
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

          <section style={styles.landingSection}>
            <div style={styles.goldLabel}>
              INSIDE SAMBHAV
            </div>

            <div style={styles.landingSectionTitle}>
              Your preparation,
              <br />
              organised in one dashboard.
            </div>

            <div style={styles.landingSectionSub}>
              Everything important stays inside your
              preparation workspace.
            </div>

            <div style={styles.previewOuter}>
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

          <section style={styles.premiumLandingCard}>
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

              <div style={styles.premiumText}>
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
                style={styles.premiumButton}
              >
                Explore Premium →
              </a>
            </div>
          </section>

          <section style={styles.finalCTA}>
            <div style={styles.goldLabel}>
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

                <section style={styles.legalCard}>
        <div style={styles.legalEyebrow}>CONTACT & LEGAL</div>
        <div style={styles.legalTitle}>SAMBHAV UPSC</div>
        <div style={styles.legalSub}>
          Official platform information and customer support.
        </div>

        <div style={styles.legalGrid}>
          <div style={styles.legalItem}>
            <div style={styles.legalLabel}>LEGAL NAME</div>
            <div style={styles.legalValue}>AMAN SRIVASTAVA</div>
          </div>

          <div style={styles.legalItem}>
            <div style={styles.legalLabel}>CUSTOMER SUPPORT</div>
            <div style={styles.legalValue}>amanshrivastava9140@gmail.com</div>
          </div>

          <div style={styles.legalItem}>
            <div style={styles.legalLabel}>PHONE</div>
            <div style={styles.legalValue}>+91 9140302792</div>
          </div>

          <div style={styles.legalItem}>
            <div style={styles.legalLabel}>OFFICIAL TELEGRAM</div>
            <div style={styles.legalValue}>@SAMBHAVUPSC1</div>
            <a
              href="https://t.me/SAMBHAVUPSC1"
              target="_blank"
              rel="noreferrer"
              style={styles.legalTelegram}
            >
              Join Official Channel →
            </a>
          </div>
        </div>

        <div style={styles.legalDescription}>
          SAMBHAV UPSC is an online UPSC preparation platform providing
          Current Affairs, PYQ-based practice, Prelims practice, Mains answer
          writing and AI-assisted learning resources.
        </div>
      </section>

<footer style={styles.publicFooter}>
            <div style={styles.footerLinks}>
              <a href="/about" style={styles.footerLink}>
                About
              </a>

              <a href="/contact" style={styles.footerLink}>
                Contact
              </a>

              <a href="/pricing" style={styles.footerLink}>
                Pricing
              </a>

              <a href="/privacy" style={styles.footerLink}>
                Privacy
              </a>

              <a href="/terms" style={styles.footerLink}>
                Terms
              </a>

              <a href="/refund" style={styles.footerLink}>
                Refund
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
  const [showWelcome, setShowWelcome] = useState(false);
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

          if (
            emailData.user?.status ===
            "approved"
          ) {
            setShowWelcome(true);
          }

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

          if (
            telegramData.user?.status ===
            "approved"
          ) {
            setShowWelcome(true);
          }

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
  WELCOME SCREEN TIMER
  ===================================================== */

  useEffect(() => {
    if (!showWelcome) return;

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [showWelcome]);

  /* =====================================================
  PUBLIC WEBSITE
  ===================================================== */

  if (
    !loading &&
    !telegramMode &&
    !user
  ) {
    return <PublicLanding />;
  }

  /* =====================================================
  LOADING
  ===================================================== */

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
                SAMBHAV
                <span style={styles.brandGold}>
                  {" "}UPSC
                </span>
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
  WELCOME
  ===================================================== */

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

    const darkWelcome =
      theme === "dark";

    const welcomeBg = darkWelcome
      ? "linear-gradient(145deg,#0b0b0b,#181818)"
      : "linear-gradient(145deg,#fffdf8,#f0eadb)";

    const welcomeText =
      darkWelcome ? "#ffffff" : "#111111";

    const welcomeMuted =
      darkWelcome ? "#a9a49a" : "#6d685f";

    const welcomeGold = "#a07d32";

    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main
          style={{
            minHeight: "100vh",
            background: darkWelcome
              ? "#090909"
              : "linear-gradient(180deg,#f8f7f3,#efeee9)",
            color: welcomeText,
            fontFamily:
              "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "10px",
              }}
            >
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  height: "38px",
                  padding: "0 12px",
                  borderRadius: "999px",
                  border: `1px solid ${
                    darkWelcome
                      ? "rgba(255,255,255,0.12)"
                      : "#dedbd2"
                  }`,
                  background: darkWelcome
                    ? "#151515"
                    : "#ffffff",
                  color: welcomeText,
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "0.8px",
                  cursor: "pointer",
                }}
              >
                {darkWelcome ? "☀ LIGHT" : "☾ DARK"}
              </button>
            </div>

            <div
              style={{
                background: welcomeBg,
                borderRadius: "28px",
                padding: "36px 26px",
                textAlign: "left",
                border: `1px solid ${
                  darkWelcome
                    ? "rgba(255,255,255,0.08)"
                    : "#e3dfd5"
                }`,
                boxShadow: darkWelcome
                  ? "0 24px 60px rgba(0,0,0,0.32)"
                  : "0 20px 50px rgba(40,35,20,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: welcomeGold,
                  letterSpacing: "1.8px",
                  fontWeight: "950",
                }}
              >
                WELCOME TO SAMBHAV
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "30px",
                  lineHeight: "1.05",
                  fontWeight: "950",
                  letterSpacing: "-1px",
                }}
              >
                Your UPSC preparation
                <br />
                workspace is ready.
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "15px",
                  fontWeight: "850",
                }}
              >
                Welcome, {firstName}.
              </div>

              <div
                style={{
                  marginTop: "7px",
                  color: welcomeMuted,
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                Focused preparation. Structured practice. Consistent progress.
              </div>

              <div
                style={{
                  display: "inline-flex",
                  marginTop: "20px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: darkWelcome
                    ? "#f5f1e7"
                    : "#111111",
                  color: darkWelcome
                    ? "#111111"
                    : "#ffffff",
                  fontSize: "9px",
                  fontWeight: "950",
                  letterSpacing: "0.8px",
                }}
              >
                ✓ ACCESS VERIFIED
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* =====================================================
  APPROVED USER DASHBOARD
  ===================================================== */

  const firstName =
    user.first_name ||
    user.firstName ||
    user.name ||
    "Aspirant";

  const initial =
    firstName
      .charAt(0)
      .toUpperCase();

  const premiumBadgeText =
    isPremium
      ? premiumPlan === "demo"
        ? "✦ PREMIUM DEMO ACTIVE"
        : "✦ PREMIUM ACTIVE"
      : "✦ PREMIUM ACCESS";

  const premiumTitleText =
    isPremium
      ? premiumPlan === "demo"
        ? "Premium Demo is Active"
        : "Premium Access is Active"
      : "Upgrade Your Preparation";

  const premiumSubText =
    isPremium
      ? premiumPlan === "demo"
        ? "Explore the complete SAMBHAV workspace."
        : "Your premium workspace is ready for focused preparation."
      : "Current Affairs, PYQs, Tests, Mains practice and AI evaluation in one focused workspace.";

  const premiumActionText =
    isPremium
      ? "Open Premium →"
      : "Explore Premium →";

  const dark = theme === "dark";

  const ui = dark
    ? {
        pageBg: "linear-gradient(180deg, #090909 0%, #111111 100%)",
        text: "#f7f4ec",
        muted: "#a9a49a",
        soft: "#77736b",
        line: "rgba(255,255,255,0.09)",
        surface: "#151515",
        surfaceAlt: "#1a1a1a",
        surfaceSoft: "#202020",
        gold: "#d6bd79",
        goldSoft: "rgba(214,189,121,0.12)",
        buttonBg: "#f5f1e7",
        buttonText: "#111111",
        shadow: "0 14px 38px rgba(0,0,0,0.28)",
      }
    : {
        pageBg: "linear-gradient(180deg, #f8f7f3 0%, #efeee9 100%)",
        text: "#111111",
        muted: "#625f58",
        soft: "#77736c",
        line: "#e4e1da",
        surface: "#ffffff",
        surfaceAlt: "#f8f6f0",
        surfaceSoft: "#f1eee6",
        gold: "#a07d32",
        goldSoft: "#f4ead0",
        buttonBg: "#111111",
        buttonText: "#ffffff",
        shadow: "0 12px 30px rgba(30,25,15,0.07)",
      };

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        dark ? "Switch to light theme" : "Switch to dark theme"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        height: "38px",
        padding: "0 12px",
        borderRadius: "999px",
        border: `1px solid ${ui.line}`,
        background: ui.surface,
        color: ui.text,
        fontSize: "9px",
        fontWeight: "900",
        letterSpacing: "0.8px",
        cursor: "pointer",
        boxShadow: dark
          ? "none"
          : "0 5px 14px rgba(0,0,0,0.04)",
      }}
    >
      <span style={{ color: ui.gold, fontSize: "14px" }}>
        {dark ? "☀" : "☾"}
      </span>
      {dark ? "LIGHT" : "DARK"}
    </button>
  );

  const ecosystem = [
    {
      no: "01",
      title: "Current Affairs",
      label: "DAILY & MONTHLY INTELLIGENCE",
      points: [
        "Daily & Monthly Current Affairs",
        "UPSC-oriented Analysis",
        "The Hindu • PIB • Government Sources",
        "Prelims & Mains Relevance",
        "Revision-oriented Content",
      ],
    },
    {
      no: "02",
      title: "PYQ Intelligence",
      label: "PREVIOUS YEAR QUESTIONS",
      points: [
        "Prelims & Mains PYQs",
        "Subject & Topic-wise Classification",
        "Question-wise Practice",
        "Detailed Explanations",
        "Performance & Trend Analysis",
      ],
    },
    {
      no: "03",
      title: "Prelims Test",
      label: "PYQ-ORIENTED PRACTICE",
      points: [
        "PYQ-oriented MCQs",
        "Subject & Topic-wise Practice",
        "PYQ-based Tests",
        "Question Analysis",
        "Score & Performance Analysis",
      ],
    },
    {
      no: "04",
      title: "Mains",
      label: "ANSWER WRITING",
      points: [
        "GS I • II • III • IV",
        "PYQ-based Answer Writing",
        "Structured Answer Practice",
        "Answer Evaluation",
        "Improvement Guidance",
      ],
    },
    {
      no: "05",
      title: "AI Answer Evaluation",
      label: "AI-POWERED ANALYSIS",
      points: [
        "AI-powered Answer Evaluation",
        "Score & Assessment",
        "Strengths & Weaknesses",
        "Content & Structure Analysis",
        "Actionable Improvement Suggestions",
      ],
    },
    {
      no: "06",
      title: "Study Material",
      label: "NOTES & RESOURCES",
      points: [
        "GS Resources",
        "Conceptual Notes",
        "Revision Material",
        "UPSC-oriented Reference Resources",
        "CSAT Focus • Questions • Explanations",
      ],
    },
  ];

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main
        style={{
          minHeight: "100vh",
          background: ui.pageBg,
          color: ui.text,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          paddingBottom: "48px",
          transition: "background 180ms ease, color 180ms ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "760px",
            margin: "0 auto",
            padding: "18px 16px 42px",
            boxSizing: "border-box",
          }}
        >
          {/* HEADER */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "950",
                  letterSpacing: "-0.8px",
                }}
              >
                SAMBHAV{" "}
                <span style={{ color: ui.gold }}>
                  UPSC
                </span>
              </div>

              <div
                style={{
                  marginTop: "4px",
                  color: ui.soft,
                  fontSize: "8px",
                  letterSpacing: "1.35px",
                  textTransform: "uppercase",
                  fontWeight: "900",
                }}
              >
                Intelligence • Preparation • Performance
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              {themeToggle}

              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: dark
                    ? "linear-gradient(145deg,#222,#090909)"
                    : "#111111",
                  color: "#d6bd79",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "950",
                  boxShadow: dark
                    ? "none"
                    : "0 7px 18px rgba(0,0,0,0.10)",
                }}
              >
                {initial}
              </div>
            </div>
          </header>

          {/* HERO */}
          <section
            style={{
              background: dark
                ? "linear-gradient(145deg,#0b0b0b,#171717 58%,#252525)"
                : "linear-gradient(145deg,#fffdf8,#f0eadb)",
              color: ui.text,
              borderRadius: "28px",
              padding: "26px 22px 21px",
              marginBottom: "14px",
              border: `1px solid ${ui.line}`,
              boxShadow: ui.shadow,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: dark
                  ? "rgba(214,189,121,0.10)"
                  : "rgba(214,189,121,0.16)",
                right: "-85px",
                top: "-95px",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "950",
                  letterSpacing: "1.7px",
                  color: ui.gold,
                  marginBottom: "10px",
                }}
              >
                PERSONAL PREPARATION WORKSPACE
              </div>

              <div
                style={{
                  fontSize: "29px",
                  lineHeight: "1.05",
                  fontWeight: "950",
                  letterSpacing: "-1.2px",
                }}
              >
                Hello, {firstName}.
              </div>

              <div
                style={{
                  marginTop: "9px",
                  fontSize: "26px",
                  lineHeight: "1.08",
                  fontWeight: "950",
                  letterSpacing: "-0.9px",
                  color: ui.gold,
                }}
              >
                No Shortcut Just Consistency
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0,1fr))",
                  gap: "9px",
                  marginTop: "21px",
                }}
              >
                {[
                  ["01", "FOCUS"],
                  ["02", "PRACTICE"],
                  ["03", "PERFORM"],
                ].map(([num, label]) => (
                  <div
                    key={num}
                    style={{
                      paddingTop: "11px",
                      borderTop: `1px solid ${ui.line}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "950",
                      }}
                    >
                      {num}
                    </div>
                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "8px",
                        fontWeight: "900",
                        letterSpacing: "1.1px",
                        color: ui.soft,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* OFFICER ACCESS */}
          <section
            style={{
              background: dark
                ? "linear-gradient(145deg,#151515,#1d1d1d)"
                : "linear-gradient(145deg,#ffffff,#f8f5ed)",
              border: `1px solid ${ui.line}`,
              borderRadius: "20px",
              padding: "16px 18px",
              marginBottom: "14px",
              boxShadow: ui.shadow,
            }}
          >
            <div
              style={{
                fontSize: "8px",
                fontWeight: "950",
                letterSpacing: "1.3px",
                color: ui.gold,
              }}
            >
              OFFICER ACCESS
            </div>

            <div
              style={{
                marginTop: "6px",
                fontSize: "18px",
                fontWeight: "950",
              }}
            >
              {firstName}
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                color: ui.muted,
                fontWeight: "800",
              }}
            >
              ● ACTIVE CLEARANCE
            </div>
          </section>

          {/* PREMIUM */}
          <section
            style={{
              background: dark
                ? "linear-gradient(145deg,#171717,#242424)"
                : "linear-gradient(145deg,#fffdf8,#f1ead9)",
              border: `1px solid ${ui.line}`,
              borderRadius: "24px",
              padding: "20px",
              marginBottom: "15px",
              boxShadow: ui.shadow,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: dark
                  ? "rgba(214,189,121,0.07)"
                  : "rgba(214,189,121,0.12)",
                right: "-85px",
                top: "-95px",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "7px 10px",
                  borderRadius: "999px",
                  background: dark ? "#f5f1e7" : "#111111",
                  color: dark ? "#111111" : "#ffffff",
                  fontSize: "8px",
                  fontWeight: "950",
                  letterSpacing: "1px",
                }}
              >
                {premiumBadgeText}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "21px",
                  lineHeight: "1.2",
                  fontWeight: "950",
                }}
              >
                {premiumTitleText}
              </div>

              <div
                style={{
                  marginTop: "7px",
                  fontSize: "12px",
                  lineHeight: "1.55",
                  color: ui.muted,
                  fontWeight: "700",
                  maxWidth: "620px",
                }}
              >
                {premiumSubText}
              </div>

              {!isPremium && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2,minmax(0,1fr))",
                    gap: "7px",
                    marginTop: "14px",
                  }}
                >
                  {[
                    "Current Affairs",
                    "PYQ Intelligence",
                    "Mains Practice",
                    "AI Evaluation",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        fontSize: "9px",
                        fontWeight: "850",
                        color: ui.muted,
                        padding: "8px 9px",
                        border: `1px solid ${ui.line}`,
                        borderRadius: "9px",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {isPremium &&
              premiumPlan === "demo" ? (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "15px",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      ...styles.premiumAction,
                      marginTop: 0,
                      border: "none",
                    }}
                    onClick={() => {
                      window.location.href =
                        "/premium/home";
                    }}
                  >
                    Open Premium →
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.premiumAction,
                      marginTop: 0,
                      background: ui.gold,
                      color: "#111111",
                      border: "none",
                    }}
                    onClick={() => {
                      window.location.href =
                        "/premium";
                    }}
                  >
                    View Paid Plans →
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  style={{
                    ...styles.premiumAction,
                    border: "none",
                  }}
                  onClick={() => {
                    window.location.href =
                      isPremium
                        ? "/premium/home"
                        : "/premium";
                  }}
                >
                  {premiumActionText}
                </button>
              )}
            </div>
          </section>

          {/* ADMIN */}
          {isAdmin && (
            <section
              style={{
                background: dark
                  ? "linear-gradient(145deg,#1b1915,#242018)"
                  : "linear-gradient(145deg,#fffaf0,#f4ead0)",
                border: `1px solid ${
                  dark
                    ? "rgba(214,189,121,0.20)"
                    : "rgba(160,125,50,0.22)"
                }`,
                borderRadius: "20px",
                padding: "16px 18px",
                marginBottom: "15px",
                cursor: "pointer",
                boxShadow: ui.shadow,
              }}
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: "950",
                  letterSpacing: "1.3px",
                  color: ui.gold,
                }}
              >
                ADMIN ACCESS
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: "950",
                }}
              >
                Control Center →
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: ui.muted,
                  fontWeight: "750",
                }}
              >
                Users • Approvals • Premium • Accounts
              </div>
            </section>
          )}

          {/* TODAY'S PREPARATION */}
          <section
            style={{
              background: ui.surface,
              border: `1px solid ${ui.line}`,
              borderRadius: "18px",
              padding: "14px 16px",
              marginBottom: "26px",
              boxShadow: ui.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: "950",
                    letterSpacing: "1.4px",
                    color: ui.gold,
                  }}
                >
                  TODAY'S PREPARATION
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "15px",
                    fontWeight: "950",
                  }}
                >
                  Stay focused. Keep moving.
                </div>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: ui.surfaceSoft,
                  color: ui.muted,
                  fontSize: "8px",
                  fontWeight: "950",
                  letterSpacing: "0.8px",
                }}
              >
                DAILY FOCUS
              </div>
            </div>
          </section>

          {/* LEARNING ECOSYSTEM */}
          <section>
            <div
              style={{
                marginBottom: "15px",
                padding: "0 2px",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "950",
                  letterSpacing: "1.5px",
                  color: ui.gold,
                }}
              >
                SAMBHAV LEARNING ECOSYSTEM
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "25px",
                  lineHeight: "1.08",
                  fontWeight: "950",
                  letterSpacing: "-0.8px",
                }}
              >
                Complete UPSC Preparation
              </div>

              <div
                style={{
                  marginTop: "7px",
                  fontSize: "11px",
                  lineHeight: "1.55",
                  color: ui.muted,
                  fontWeight: "650",
                  maxWidth: "650px",
                }}
              >
                An integrated learning ecosystem built around the complete UPSC preparation cycle.
              </div>
            </div>

            {/* One refined surface instead of six heavy cards */}
            <section
              style={{
                background: ui.surface,
                border: `1px solid ${ui.line}`,
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: ui.shadow,
              }}
            >
              {ecosystem.map((item, index) => (
                <div
                  key={item.no}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "38px minmax(0,1fr)",
                    gap: "13px",
                    padding: "18px 17px",
                    borderBottom:
                      index === ecosystem.length - 1
                        ? "none"
                        : `1px solid ${ui.line}`,
                    background:
                      dark && index % 2 === 1
                        ? "rgba(255,255,255,0.015)"
                        : "transparent",
                  }}
                >
                  <div
                    style={{
                      paddingTop: "2px",
                      fontSize: "9px",
                      fontWeight: "950",
                      color: ui.soft,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {item.no}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "8px",
                        fontWeight: "950",
                        letterSpacing: "1.35px",
                        color: ui.gold,
                        lineHeight: "1.3",
                      }}
                    >
                      {item.label}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "18px",
                        lineHeight: "1.18",
                        fontWeight: "950",
                        letterSpacing: "-0.35px",
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2,minmax(0,1fr))",
                        columnGap: "22px",
                        rowGap: "7px",
                        marginTop: "10px",
                      }}
                    >
                      {item.points.map((point) => (
                        <div
                          key={point}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "7px",
                            fontSize: "10.5px",
                            lineHeight: "1.42",
                            color: ui.muted,
                            fontWeight: "800",
                          }}
                        >
                          <span
                            style={{
                              color: ui.gold,
                              fontWeight: "950",
                              flexShrink: 0,
                            }}
                          >
                            •
                          </span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}

