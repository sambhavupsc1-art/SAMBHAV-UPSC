"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const plans = {
  monthly: {
    name: "Monthly Premium",
    duration: "1 Month",
    price: 99,
  },

  quarterly: {
    name: "Quarterly Premium",
    duration: "3 Months",
    price: 399,
  },

  annual: {
    name: "Annual Premium",
    duration: "12 Months",
    price: 999,
  },
};

export default function PremiumPaymentPage() {
  const router = useRouter();

  const [plan, setPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = plans[plan];

  /*
   * Read selected plan from URL.
   */
  useEffect(() => {
    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const selectedPlan =
        params.get("plan");

      if (
        selectedPlan &&
        Object.prototype.hasOwnProperty.call(
          plans,
          selectedPlan
        )
      ) {
        setPlan(selectedPlan);
      }
    } catch (error) {
      console.warn(
        "Payment plan URL read failed:",
        error
      );
    }
  }, []);

  /*
   * Get Telegram authentication data.
   */
  const getTelegramInitData = () => {
    let initData = "";

    try {
      initData =
        window.Telegram?.WebApp?.initData ||
        "";
    } catch (error) {
      console.warn(
        "Telegram initData read failed:",
        error
      );
    }

    if (!initData) {
      try {
        initData =
          sessionStorage.getItem(
            "sambhav_telegram_init_data"
          ) || "";
      } catch (error) {
        console.warn(
          "Session auth read failed:",
          error
        );
      }
    }

    if (initData) {
      try {
        sessionStorage.setItem(
          "sambhav_telegram_init_data",
          initData
        );
      } catch (error) {
        console.warn(
          "Session auth save failed:",
          error
        );
      }
    }

    return initData;
  };

  /*
   * Wait for Telegram authentication.
   */
  useEffect(() => {
    let stopped = false;
    let attempts = 0;

    const checkAuth = () => {
      if (stopped) return;

      attempts++;

      const initData =
        getTelegramInitData();

      if (initData) {
        setAuthReady(true);
        return;
      }

      /*
       * Even if Telegram WebApp object
       * isn't ready yet, saved session data
       * may become available.
       */
      if (attempts < 50) {
        setTimeout(checkAuth, 200);
        return;
      }

      /*
       * Don't immediately block the page.
       * Payment API will provide the exact
       * authentication error if required.
       */
      setAuthReady(true);
    };

    checkAuth();

    return () => {
      stopped = true;
    };
  }, []);

  /*
   * Load Cashfree SDK.
   */
  const handlePayment = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const telegramInitData =
        getTelegramInitData();

      if (!telegramInitData) {
        throw new Error(
          "Telegram authentication data nahi mila. SAMBHAV ko Telegram ke andar se open karo."
        );
      }

      /*
       * Create Cashfree order on backend.
       */
      const response = await fetch(
        "/api/payment/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `tma ${telegramInitData}`,
          },

          body: JSON.stringify({
            plan,
          }),

          cache: "no-store",
        }
      );

      const data =
        await response.json();

      /*
       * Existing Premium subscription.
       */
      if (response.status === 409) {
        if (data?.subscription) {
          setError(
            "Aapka Premium subscription already active hai."
          );

          setTimeout(() => {
            router.push("/premium/home");
          }, 1000);

          return;
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Payment order create nahi ho saka."
        );
      }

      if (!data?.payment_session_id) {
        throw new Error(
          "Cashfree payment session nahi mila."
        );
      }

      /*
       * Wait for Cashfree SDK.
       */
      let attempts = 0;

      while (
        !window.Cashfree &&
        attempts < 50
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 200)
        );

        attempts++;
      }

      if (!window.Cashfree) {
        throw new Error(
          "Cashfree payment system load nahi hua. Please try again."
        );
      }

      /*
       * Cashfree Sandbox.
       *
       * LIVE payment ke time:
       * mode: "production"
       */
      const cashfree =
        window.Cashfree({
          mode: "sandbox",
        });

      /*
       * Open Cashfree checkout.
       */
      await cashfree.checkout({
        paymentSessionId:
          data.payment_session_id,

        redirectTarget: "_self",
      });
    } catch (error) {
      console.error(
        "Cashfree payment error:",
        error
      );

      setError(
        error?.message ||
          "Payment start nahi ho saka."
      );

      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
      />

      <main
        style={{
          minHeight: "100vh",
          background: "#f5f2eb",
          color: "#101010",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          padding:
            "20px 16px 40px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginBottom: "28px",
            }}
          >
            <button
              onClick={() =>
                router.push(
                  "/premium"
                )
              }
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                border:
                  "1px solid rgba(16,16,16,.08)",
                background:
                  "#fffdf9",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ‹
            </button>

            <div
              style={{
                fontSize: "15px",
                fontWeight: "900",
              }}
            >
              SAMBHAV UPSC
            </div>

            <div
              style={{
                padding:
                  "7px 10px",
                borderRadius:
                  "999px",
                background:
                  "#101010",
                color: "#dfc477",
                fontSize: "9px",
                fontWeight: "900",
                letterSpacing:
                  "1px",
              }}
            >
              PAYMENT
            </div>
          </div>

          {/* TITLE */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "25px",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                marginBottom: "8px",
              }}
            >
              ♛
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "29px",
                lineHeight: "1.15",
                fontWeight: "900",
                letterSpacing:
                  "-1px",
              }}
            >
              Complete Your
              <br />
              Premium Payment
            </h1>

            <p
              style={{
                margin:
                  "10px auto 0",
                maxWidth:
                  "420px",
                color:
                  "#77736b",
                fontSize: "12px",
                lineHeight:
                  "1.6",
              }}
            >
              Securely continue with
              Cashfree Payment Gateway.
            </p>
          </div>

          {/* ORDER CARD */}
          <div
            style={{
              background:
                "#101010",
              color: "#fff",
              borderRadius: "25px",
              padding: "23px",
              marginBottom:
                "16px",
              boxShadow:
                "0 15px 35px rgba(16,16,16,.14)",
            }}
          >
            <div
              style={{
                color: "#aaa",
                fontSize: "9px",
                fontWeight: "800",
                letterSpacing:
                  "1.4px",
                textTransform:
                  "uppercase",
              }}
            >
              Selected Plan
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "20px",
                fontWeight: "900",
              }}
            >
              {selectedPlan.name}
            </div>

            <div
              style={{
                marginTop:
                  "15px",
                display: "flex",
                alignItems:
                  "baseline",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "34px",
                  fontWeight: "900",
                }}
              >
                ₹
                {selectedPlan.price}
              </span>

              <span
                style={{
                  color: "#aaa",
                  fontSize: "11px",
                }}
              >
                {selectedPlan.duration}
              </span>
            </div>
          </div>

          {/* PAYMENT INFO */}
          <div
            style={{
              background:
                "#fffdf9",
              border:
                "1px solid rgba(16,16,16,.08)",
              borderRadius: "22px",
              padding: "20px",
              marginBottom:
                "16px",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: "900",
                marginBottom:
                  "14px",
              }}
            >
              Payment Details
            </div>

            {[
              [
                "Plan",
                selectedPlan.name,
              ],
              [
                "Duration",
                selectedPlan.duration,
              ],
              [
                "Amount",
                `₹${selectedPlan.price}`,
              ],
              [
                "Gateway",
                "Cashfree",
              ],
              [
                "Environment",
                "Sandbox",
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    padding:
                      "10px 0",
                    borderBottom:
                      "1px solid rgba(16,16,16,.06)",
                    fontSize:
                      "11px",
                  }}
                >
                  <span
                    style={{
                      color:
                        "#858179",
                    }}
                  >
                    {label}
                  </span>

                  <strong>
                    {value}
                  </strong>
                </div>
              )
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div
              style={{
                background:
                  "#fff0ee",
                color:
                  "#b52b22",
                borderRadius:
                  "15px",
                padding: "13px",
                marginBottom:
                  "14px",
                fontSize: "11px",
                fontWeight: "700",
                lineHeight:
                  "1.5",
              }}
            >
              {error}
            </div>
          )}

          {/* PAY BUTTON */}
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "17px",
              padding: "17px",
              background:
                loading
                  ? "#777"
                  : "#101010",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "900",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              boxShadow:
                "0 12px 30px rgba(16,16,16,.18)",
            }}
          >
            {loading
              ? "CONNECTING TO CASHFREE..."
              : `PAY ₹${selectedPlan.price} SECURELY →`}
          </button>

          {/* SECURITY */}
          <div
            style={{
              textAlign:
                "center",
              marginTop: "13px",
              color:
                "#858179",
              fontSize: "9px",
              lineHeight:
                "1.6",
            }}
          >
            🔒 Secure payment powered
            by Cashfree
            <br />
            Payment verification is
            handled server-side.
          </div>
        </div>
      </main>
    </>
  );
}
