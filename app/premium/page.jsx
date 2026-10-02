"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const plans = [
  {
    id: "demo",
    title: "2-Day Premium Demo",
    price: "₹0",
    period: "FREE",
    duration: "2 days",
    description:
      "Experience the complete SAMBHAV Premium platform.",
    badge: "FREE",
    featured: true,
  },
  {
    id: "monthly",
    title: "Monthly",
    price: "₹99",
    period: "/ month",
    duration: "1 month",
    description:
      "Full Premium access for one month.",
  },
  {
    id: "quarterly",
    title: "Quarterly",
    price: "₹399",
    period: "/ 3 months",
    duration: "3 months",
    description:
      "Premium access for three months.",
    badge: "POPULAR",
  },
  {
    id: "annual",
    title: "Annual",
    price: "₹999",
    period: "/ year",
    duration: "1 year",
    description:
      "Complete Premium access for one year.",
    badge: "BEST VALUE",
  },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f2eb",
    color: "#101010",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    paddingBottom: "40px",
  },

  container: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px 16px 45px",
    boxSizing: "border-box",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
  },

  back: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    border:
      "1px solid rgba(16,16,16,.08)",
    background: "#fffdf9",
    fontSize: "20px",
    cursor: "pointer",
  },

  brand: {
    fontSize: "15px",
    fontWeight: "900",
    letterSpacing: "-.3px",
  },

  premiumBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#101010",
    color: "#dfc477",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  hero: {
    textAlign: "center",
    marginBottom: "28px",
  },

  crown: {
    fontSize: "31px",
    marginBottom: "9px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "31px",
    lineHeight: "1.12",
    fontWeight: "900",
    letterSpacing: "-1.1px",
  },

  heroSub: {
    margin: "10px auto 0",
    maxWidth: "430px",
    color: "#77736b",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  officerCard: {
    background: "#101010",
    color: "#fff",
    borderRadius: "25px",
    padding: "22px",
    marginBottom: "24px",
    position: "relative",
    overflow: "hidden",
    boxShadow:
      "0 15px 35px rgba(16,16,16,.14)",
  },

  officerGlow: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    right: "-75px",
    top: "-90px",
    background:
      "rgba(223,196,119,.08)",
  },

  officerLabel: {
    position: "relative",
    zIndex: 2,
    color: "#b9b9b9",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },

  officerTitle: {
    position: "relative",
    zIndex: 2,
    marginTop: "8px",
    fontSize: "20px",
    fontWeight: "850",
  },

  officerText: {
    position: "relative",
    zIndex: 2,
    marginTop: "6px",
    color: "#c8c8c8",
    fontSize: "11px",
    lineHeight: "1.5",
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "-.5px",
    marginBottom: "13px",
  },

  plans: {
    display: "grid",
    gap: "13px",
  },

  plan: {
    position: "relative",
    background: "#fffdf9",
    border:
      "1px solid rgba(16,16,16,.08)",
    borderRadius: "23px",
    padding: "19px",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "all .15s ease",
  },

  selectedPlan: {
    border: "2px solid #b89445",
    boxShadow:
      "0 10px 28px rgba(184,148,69,.13)",
  },

  demoPlan: {
    background: "#101010",
    color: "#fff",
    border: "1px solid #101010",
  },

  badge: {
    position: "absolute",
    top: "15px",
    right: "15px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#b89445",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: ".7px",
  },

  demoBadge: {
    background: "#fff",
    color: "#101010",
  },

  planTitle: {
    fontSize: "16px",
    fontWeight: "850",
    paddingRight: "75px",
  },

  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "5px",
    marginTop: "12px",
  },

  price: {
    fontSize: "29px",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  period: {
    fontSize: "10px",
    color: "#77736b",
    fontWeight: "700",
  },

  demoPeriod: {
    color: "#bcbcbc",
  },

  duration: {
    marginTop: "5px",
    fontSize: "10px",
    color: "#77736b",
    fontWeight: "700",
  },

  demoDuration: {
    color: "#bdbdbd",
  },

  description: {
    marginTop: "9px",
    fontSize: "11px",
    color: "#77736b",
    lineHeight: "1.5",
  },

  demoDescription: {
    color: "#bcbcbc",
  },

  check: {
    marginTop: "12px",
    fontSize: "10px",
    color: "#6f6a61",
    fontWeight: "700",
  },

  demoCheck: {
    color: "#d7d7d7",
  },

  bottomAction: {
    position: "sticky",
    bottom: "12px",
    marginTop: "22px",
    background: "#101010",
    color: "#fff",
    borderRadius: "17px",
    padding: "16px",
    width: "100%",
    border: "none",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow:
      "0 12px 30px rgba(16,16,16,.18)",
  },

  secure: {
    textAlign: "center",
    marginTop: "12px",
    color: "#8a867e",
    fontSize: "9px",
    lineHeight: "1.5",
  },

  loadingCard: {
    marginTop: "80px",
    background: "#fffdf9",
    borderRadius: "24px",
    padding: "28px",
    textAlign: "center",
    border:
      "1px solid rgba(16,16,16,.08)",
  },

  error: {
    marginTop: "10px",
    color: "#c0392b",
    fontSize: "12px",
  },
};

export default function PremiumPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [selectedPlan, setSelectedPlan] =
    useState("demo");

  const [activatingDemo, setActivatingDemo] =
    useState(false);

  const [demoMessage, setDemoMessage] =
    useState("");

  useEffect(() => {
    let attempts = 0;
    let stopped = false;

    const authenticate = () => {
      if (stopped) return;

      attempts++;

      const webApp =
        window.Telegram?.WebApp;

      if (!webApp?.initData) {
        if (attempts < 30) {
          setTimeout(authenticate, 200);
          return;
        }

        setAuthError(
          "Telegram authentication data nahi mila."
        );

        setLoading(false);
        return;
      }

      webApp.ready();
      webApp.expand();

      fetch("/api/auth/me", {
        headers: {
          Authorization:
            `tma ${webApp.initData}`,
        },
        cache: "no-store",
      })
        .then(async (response) => {
          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Authentication failed"
            );
          }

          setUser(data.user);
        })
        .catch((error) => {
          setAuthError(
            error.message ||
              "Authentication failed."
          );
        })
        .finally(() => {
          setLoading(false);
        });
    };

    authenticate();

    return () => {
      stopped = true;
    };
  }, []);

  const selected = plans.find(
    (plan) =>
      plan.id === selectedPlan
  );

  const activateDemo = async () => {
    if (selectedPlan !== "demo") return;

    setActivatingDemo(true);
    setDemoMessage("");

    try {
      const webApp =
        window.Telegram?.WebApp;

      if (!webApp?.initData) {
        throw new Error(
          "Telegram authentication data nahi mila."
        );
      }

      const response = await fetch(
        "/api/premium/demo",
        {
          method: "POST",

          headers: {
            Authorization:
              `tma ${webApp.initData}`,
            "Content-Type":
              "application/json",
          },

          cache: "no-store",
        }
      );

      const data =
        await response.json();

      /*
       * IMPORTANT:
       * If the user already has an active
       * Premium subscription, do not treat
       * it as a fatal error.
       *
       * Send the user directly to
       * Premium Home.
       */
      if (
        response.status === 409 &&
        data?.subscription
      ) {
        setDemoMessage(
          "PREMIUM ALREADY ACTIVE"
        );

        setTimeout(() => {
          window.location.href =
            "/premium/home";
        }, 500);

        return;
      }

      /*
       * If the API says the demo was already
       * used but does not return a subscription,
       * show the message normally.
       */
      if (
        response.status === 409 &&
        data?.error?.includes(
          "already been used"
        )
      ) {
        setDemoMessage(
          "Your 2-Day Premium Demo has already been used."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Demo activation failed."
        );
      }

      /*
       * First-time demo activation.
       */
      setDemoMessage(
        "PREMIUM DEMO ACTIVATED"
      );

      setTimeout(() => {
        window.location.href =
          "/premium/home";
      }, 700);
    } catch (error) {
      setDemoMessage(
        error.message ||
          "Demo activation failed."
      );
    } finally {
      setActivatingDemo(false);
    }
  };

  const continuePlan = () => {
    if (selectedPlan === "demo") {
      activateDemo();
      return;
    }

    /*
     * Paid plans will use Cashfree later.
     * No fake payment is performed here.
     */
    window.location.href =
      `/premium/payment?plan=${selectedPlan}`;
  };

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
              style={styles.loadingCard}
            >
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <p style={styles.heroSub}>
                Authenticating...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (authError || !user) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <main style={styles.page}>
          <div style={styles.container}>
            <div
              style={styles.loadingCard}
            >
              <div style={styles.brand}>
                SAMBHAV UPSC
              </div>

              <div style={styles.error}>
                {authError ||
                  "User authentication failed."}
              </div>

              <button
                style={{
                  ...styles.bottomAction,
                  marginTop: "22px",
                }}
                onClick={() => {
                  window.location.href =
                    "/";
                }}
              >
                ← Back to SAMBHAV
              </button>
            </div>
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
          <header style={styles.topBar}>
            <button
              style={styles.back}
              onClick={() => {
                window.location.href =
                  "/";
              }}
              aria-label="Back"
            >
              ‹
            </button>

            <div style={styles.brand}>
              SAMBHAV UPSC
            </div>

            <div
              style={styles.premiumBadge}
            >
              ✦ PREMIUM
            </div>
          </header>

          <section style={styles.hero}>
            <div style={styles.crown}>
              ♛
            </div>

            <h1 style={styles.heroTitle}>
              Your Preparation.
              <br />
              Your SAMBHAV.
            </h1>

            <p style={styles.heroSub}>
              Unlock structured UPSC
              preparation, intelligent
              practice and premium
              learning tools.
            </p>
          </section>

          <section
            style={styles.officerCard}
          >
            <div
              style={styles.officerGlow}
            />

            <div
              style={styles.officerLabel}
            >
              Officer Access
            </div>

            <div
              style={styles.officerTitle}
            >
              Welcome,{" "}
              {user.first_name ||
                user.firstName ||
                "Aspirant"}
            </div>

            <div
              style={styles.officerText}
            >
              Select your Premium access
              plan below.
            </div>
          </section>

          <div
            style={styles.sectionTitle}
          >
            Choose your plan
          </div>

          <section style={styles.plans}>
            {plans.map((plan) => {
              const isSelected =
                selectedPlan === plan.id;

              const isDemo =
                plan.id === "demo";

              return (
                <div
                  key={plan.id}
                  style={{
                    ...styles.plan,

                    ...(isDemo
                      ? styles.demoPlan
                      : {}),

                    ...(isSelected
                      ? styles.selectedPlan
                      : {}),
                  }}
                  onClick={() =>
                    setSelectedPlan(
                      plan.id
                    )
                  }
                >
                  {plan.badge && (
                    <div
                      style={{
                        ...styles.badge,

                        ...(isDemo
                          ? styles.demoBadge
                          : {}),
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div
                    style={
                      styles.planTitle
                    }
                  >
                    {plan.title}
                  </div>

                  <div
                    style={
                      styles.priceRow
                    }
                  >
                    <div
                      style={styles.price}
                    >
                      {plan.price}
                    </div>

                    <div
                      style={{
                        ...styles.period,

                        ...(isDemo
                          ? styles.demoPeriod
                          : {}),
                      }}
                    >
                      {plan.period}
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.duration,

                      ...(isDemo
                        ? styles.demoDuration
                        : {}),
                    }}
                  >
                    {plan.duration}
                  </div>

                  <div
                    style={{
                      ...styles.description,

                      ...(isDemo
                        ? styles.demoDescription
                        : {}),
                    }}
                  >
                    {plan.description}
                  </div>

                  <div
                    style={{
                      ...styles.check,

                      ...(isDemo
                        ? styles.demoCheck
                        : {}),
                    }}
                  >
                    ✓ Full Premium access
                  </div>
                </div>
              );
            })}
          </section>

          {demoMessage && (
            <div
              style={{
                marginTop: "15px",
                padding: "13px",
                borderRadius: "15px",

                background:
                  demoMessage ===
                  "PREMIUM DEMO ACTIVATED" ||
                  demoMessage ===
                  "PREMIUM ALREADY ACTIVE"
                    ? "#eaf7ed"
                    : "#fff0ee",

                color:
                  demoMessage ===
                  "PREMIUM DEMO ACTIVATED" ||
                  demoMessage ===
                  "PREMIUM ALREADY ACTIVE"
                    ? "#217a39"
                    : "#b52b22",

                textAlign: "center",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {demoMessage}
            </div>
          )}

          <button
            style={{
              ...styles.bottomAction,

              opacity:
                activatingDemo
                  ? 0.65
                  : 1,
            }}
            disabled={activatingDemo}
            onClick={continuePlan}
          >
            {activatingDemo
              ? "Activating..."
              : selectedPlan ===
                "demo"
              ? "START FREE DEMO →"
              : `CONTINUE WITH ${selected?.price} →`}
          </button>

          <div style={styles.secure}>
            {selectedPlan === "demo"
              ? "No payment required • 2-day Premium access"
              : "Secure payment • Payment verification required"}
          </div>
        </div>
      </main>
    </>
  );
}
