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
  const [error, setError] = useState("");

  const selectedPlan = plans[plan];

  /*
   * ----------------------------------------
   * READ SELECTED PLAN
   * ----------------------------------------
   */

  useEffect(() => {
    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const selectedPlanFromUrl =
        params.get("plan");

      if (
        selectedPlanFromUrl &&
        Object.prototype.hasOwnProperty.call(
          plans,
          selectedPlanFromUrl
        )
      ) {
        setPlan(selectedPlanFromUrl);
      }
    } catch (error) {
      console.warn(
        "Payment plan URL read failed:",
        error
      );
    }
  }, []);

  /*
   * ----------------------------------------
   * TELEGRAM INIT DATA
   * ----------------------------------------
   *
   * Telegram is OPTIONAL.
   *
   * Website users will use:
   * sambhav_session cookie.
   *
   * Telegram users can still use:
   * tma authentication.
   * ----------------------------------------
   */

  const getTelegramInitData = () => {
    let initData = "";

    try {
      const tg =
        window.Telegram?.WebApp;

      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch (error) {
          console.warn(
            "Telegram WebApp ready failed:",
            error
          );
        }

        initData =
          tg.initData || "";
      }
    } catch (error) {
      console.warn(
        "Telegram initData read failed:",
        error
      );
    }

    /*
     * Legacy sessionStorage fallback
     */

    if (!initData) {
      try {
        initData =
          sessionStorage.getItem(
            "sambhav_telegram_init_data"
          ) || "";
      } catch (error) {
        console.warn(
          "Telegram session auth read failed:",
          error
        );
      }
    }

    /*
     * Save Telegram initData if available
     */

    if (initData) {
      try {
        sessionStorage.setItem(
          "sambhav_telegram_init_data",
          initData
        );
      } catch (error) {
        console.warn(
          "Telegram session auth save failed:",
          error
        );
      }
    }

    return initData;
  };

  /*
   * ----------------------------------------
   * CASHFREE PAYMENT
   * ----------------------------------------
   */

  const handlePayment = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      /*
       * Headers
       *
       * Website:
       * sambhav_session cookie automatically
       * goes with credentials: include.
       *
       * Telegram:
       * tma Authorization header is also sent
       * when Telegram initData is available.
       */

      const headers = {
        "Content-Type":
          "application/json",
      };

      const telegramInitData =
        getTelegramInitData();

      if (telegramInitData) {
        headers.Authorization =
          `tma ${telegramInitData}`;
      }

      /*
       * ----------------------------------------
       * CREATE CASHFREE ORDER
       * ----------------------------------------
       */

      const response = await fetch(
        "/api/payment/create-order",
        {
          method: "POST",

          headers,

          credentials:
            "include",

          body: JSON.stringify({
            plan,
          }),

          cache:
            "no-store",
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      /*
       * ----------------------------------------
       * ALREADY ACTIVE PREMIUM
       * ----------------------------------------
       */

      if (
        response.status === 409
      ) {
        setError(
          data?.error ||
            "Aapka Premium subscription already active hai."
        );

        setTimeout(() => {
          router.push("/");
        }, 1200);

        return;
      }

      /*
       * ----------------------------------------
       * AUTHENTICATION ERROR
       * ----------------------------------------
       */

      if (
        response.status === 401
      ) {
        throw new Error(
          data?.error ||
            "Please login to SAMBHAV before payment."
        );
      }

      /*
       * ----------------------------------------
       * OTHER BACKEND ERROR
       * ----------------------------------------
       */

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Payment order create nahi ho saka."
        );
      }

      /*
       * ----------------------------------------
       * CASHFREE SESSION CHECK
       * ----------------------------------------
       */

      if (
        !data?.payment_session_id
      ) {
        throw new Error(
          "Cashfree payment session nahi mila."
        );
      }

      /*
       * ----------------------------------------
       * WAIT FOR CASHFREE SDK
       * ----------------------------------------
       */

      let attempts = 0;

      while (
        !window.Cashfree &&
        attempts < 50
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              200
            )
        );

        attempts++;
      }

      if (!window.Cashfree) {
        throw new Error(
          "Cashfree payment system load nahi hua. Please try again."
        );
      }

      /*
       * ----------------------------------------
       * INITIALIZE CASHFREE
       * ----------------------------------------
       */

      const cashfree =
        window.Cashfree({
          mode:
            data.environment ===
            "production"
              ? "production"
              : "sandbox",
        });

      /*
       * ----------------------------------------
       * OPEN ACTUAL CASHFREE CHECKOUT
       * ----------------------------------------
       */

      await cashfree.checkout({
        paymentSessionId:
          data.payment_session_id,

        redirectTarget:
          "_self",
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

  /*
   * ----------------------------------------
   * UI
   * ----------------------------------------
   */

  return (
    <>
      {/* CASHFREE SDK */}

      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
      />

      {/* TELEGRAM SDK
          Kept for legacy Telegram support.
          Payment no longer depends on it.
      */}

      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
      />

      <main
        style={{
          minHeight:
            "100vh",

          background:
            "#f5f2eb",

          color:
            "#101010",

          padding:
            "24px 16px 40px",

          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            width:
              "100%",

            maxWidth:
              520,

            margin:
              "0 auto",
          }}
        >
          {/* BACK */}

          <button
            onClick={() =>
              router.push(
                "/premium"
              )
            }
            style={{
              border:
                "none",

              background:
                "transparent",

              padding:
                "6px 0",

              fontSize:
                15,

              cursor:
                "pointer",

              color:
                "#555",
            }}
          >
            ← Back
          </button>

          {/* HEADING */}

          <div
            style={{
              marginTop:
                24,

              letterSpacing:
                2,

              fontSize:
                11,

              fontWeight:
                800,

              color:
                "#9d833c",
            }}
          >
            SECURE CHECKOUT
          </div>

          <h1
            style={{
              fontSize:
                "clamp(34px, 9vw, 48px)",

              lineHeight:
                0.98,

              letterSpacing:
                -1.5,

              margin:
                "8px 0 22px",
            }}
          >
            Complete
            <br />
            Payment
          </h1>

          {/* PREMIUM CARD */}

          <section
            style={{
              background:
                "#101010",

              color:
                "#fff",

              borderRadius:
                24,

              padding:
                24,

              boxShadow:
                "0 18px 45px rgba(16,16,16,.14)",
            }}
          >
            <div
              style={{
                fontSize:
                  11,

                letterSpacing:
                  2,

                color:
                  "#dfc477",

                fontWeight:
                  800,
              }}
            >
              SAMBHAV PREMIUM
            </div>

            <div
              style={{
                marginTop:
                  10,

                fontSize:
                  25,

                fontWeight:
                  800,
              }}
            >
              {selectedPlan.name}
            </div>

            <div
              style={{
                marginTop:
                  6,

                fontSize:
                  14,

                color:
                  "#aaa",
              }}
            >
              {selectedPlan.duration}
              {" • "}
              Full Premium Access
            </div>

            <div
              style={{
                marginTop:
                  22,

                fontSize:
                  42,

                fontWeight:
                  900,

                color:
                  "#dfc477",
              }}
            >
              ₹
              {selectedPlan.price}
            </div>
          </section>

          {/* PAYMENT SUMMARY */}

          <section
            style={{
              marginTop:
                14,

              background:
                "#fffdf9",

              border:
                "1px solid #e8e2d7",

              borderRadius:
                22,

              padding:
                20,
            }}
          >
            <div
              style={{
                fontSize:
                  11,

                letterSpacing:
                  1.5,

                fontWeight:
                  900,

                color:
                  "#777",
              }}
            >
              PAYMENT SUMMARY
            </div>

            <div
              style={{
                marginTop:
                  16,

                display:
                  "grid",

                gap:
                  12,
              }}
            >
              {/* MEMBERSHIP */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    12,
                }}
              >
                <span>
                  Membership
                </span>

                <strong
                  style={{
                    textAlign:
                      "right",
                  }}
                >
                  {selectedPlan.name}
                </strong>
              </div>

              {/* ACCESS */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    12,
                }}
              >
                <span>
                  Access
                </span>

                <span
                  style={{
                    textAlign:
                      "right",
                  }}
                >
                  All Premium Modules
                </span>
              </div>

              {/* DIVIDER */}

              <div
                style={{
                  height:
                    1,

                  background:
                    "#e9e4db",

                  margin:
                    "4px 0",
                }}
              />

              {/* TOTAL */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    12,

                  fontSize:
                    18,
                }}
              >
                <strong>
                  Total payable
                </strong>

                <strong>
                  ₹
                  {
                    selectedPlan.price
                  }
                </strong>
              </div>
            </div>

            {/* ERROR */}

            {error ? (
              <div
                style={{
                  marginTop:
                    16,

                  padding:
                    "12px 14px",

                  borderRadius:
                    12,

                  background:
                    "#fff0f0",

                  border:
                    "1px solid #efcaca",

                  color:
                    "#a12a2a",

                  fontSize:
                    13,

                  lineHeight:
                    1.45,
                }}
              >
                {error}
              </div>
            ) : null}

            {/* PAY BUTTON */}

            <button
              onClick={
                handlePayment
              }
              disabled={
                loading
              }
              style={{
                width:
                  "100%",

                marginTop:
                  18,

                border:
                  "none",

                borderRadius:
                  14,

                padding:
                  "15px 18px",

                background:
                  loading
                    ? "#bca76a"
                    : "#dfc477",

                color:
                  "#101010",

                fontSize:
                  16,

                fontWeight:
                  900,

                cursor:
                  loading
                    ? "wait"
                    : "pointer",

                boxShadow:
                  "0 8px 20px rgba(223,196,119,.24)",

                transition:
                  "all .2s ease",
              }}
            >
              {loading
                ? "Opening Secure Checkout..."
                : `Pay ₹${selectedPlan.price} →`}
            </button>

            {/* SECURITY */}

            <div
              style={{
                marginTop:
                  12,

                textAlign:
                  "center",

                color:
                  "#888",

                fontSize:
                  11,
              }}
            >
              🔒 Secure payment powered by Cashfree
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
