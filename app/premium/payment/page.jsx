"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PremiumPaymentPage() {
  const router = useRouter();

  const [plan, setPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plans = {
    monthly: {
      name: "Monthly Premium",
      duration: "1 Month",
      price: 99,
      description: "Full Premium access for 1 month",
    },
    quarterly: {
      name: "Quarterly Premium",
      duration: "3 Months",
      price: 399,
      description: "Full Premium access for 3 months",
    },
    annual: {
      name: "Annual Premium",
      duration: "12 Months",
      price: 999,
      description: "Full Premium access for 12 months",
    },
  };

  /*
   * Read ?plan=monthly / quarterly / annual
   * without useSearchParams().
   *
   * This avoids the Next.js Suspense build error.
   */
  useEffect(() => {
    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const selectedPlan = params.get("plan");

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
   * Load Cashfree JS SDK.
   */
  useEffect(() => {
    const scriptId = "cashfree-sdk";

    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement("script");

    script.id = scriptId;
    script.src =
      "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;

    script.onload = () => {
      console.log("Cashfree SDK loaded");
    };

    script.onerror = () => {
      console.error(
        "Cashfree SDK failed to load"
      );
    };

    document.body.appendChild(script);
  }, []);

  const selected = plans[plan];

  /*
   * Get Telegram authentication data.
   */
  const getTelegramInitData = () => {
    const webApp =
      window.Telegram?.WebApp;

    let telegramInitData =
      webApp?.initData || "";

    /*
     * If Telegram WebApp initData is not
     * directly available, use the saved session.
     */
    if (!telegramInitData) {
      try {
        telegramInitData =
          sessionStorage.getItem(
            "sambhav_telegram_init_data"
          ) || "";
      } catch (storageError) {
        console.warn(
          "Telegram auth session read failed:",
          storageError
        );
      }
    }

    /*
     * Save current initData for internal
     * navigation / returning to this page.
     */
    if (telegramInitData) {
      try {
        sessionStorage.setItem(
          "sambhav_telegram_init_data",
          telegramInitData
        );
      } catch (storageError) {
        console.warn(
          "Telegram auth session save failed:",
          storageError
        );
      }
    }

    return telegramInitData;
  };

  /*
   * Start Cashfree payment.
   */
  const handlePayment = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      /*
       * Telegram auth
       */
      const telegramInitData =
        getTelegramInitData();

      if (!telegramInitData) {
        throw new Error(
          "Telegram authentication data nahi mila. SAMBHAV UPSC ko Telegram ke andar se open karein."
        );
      }

      /*
       * Telegram WebApp setup
       */
      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
        } catch (telegramError) {
          console.warn(
            "Telegram WebApp setup warning:",
            telegramError
          );
        }
      }

      /*
       * Create order on our backend.
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
       * Existing active subscription.
       */
      if (
        response.status === 409 &&
        data?.subscription
      ) {
        router.push("/premium/home");
        return;
      }

      /*
       * Backend error.
       */
      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Payment order create nahi ho saka."
        );
      }

      /*
       * Cashfree session ID must exist.
       */
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
          setTimeout(resolve, 100)
        );

        attempts++;
      }

      if (!window.Cashfree) {
        throw new Error(
          "Cashfree Checkout load nahi hua. Please retry karein."
        );
      }

      /*
       * Sandbox mode.
       */
      const cashfree =
        window.Cashfree({
          mode: "sandbox",
        });

      /*
       * Open Cashfree checkout.
       */
      const checkoutOptions = {
        paymentSessionId:
          data.payment_session_id,

        redirectTarget: "_self",
      };

      const checkoutResult =
        await cashfree.checkout(
          checkoutOptions
        );

      /*
       * Checkout error.
       */
      if (checkoutResult?.error) {
        console.error(
          "Cashfree checkout error:",
          checkoutResult.error
        );

        throw new Error(
          checkoutResult.error?.message ||
            "Cashfree checkout open nahi ho saka."
        );
      }

      /*
       * If Cashfree returns without redirect,
       * stop loading so user can retry.
       */
      setLoading(false);
    } catch (paymentError) {
      console.error(
        "Payment error:",
        paymentError
      );

      setError(
        paymentError?.message ||
          "Payment start nahi ho saka."
      );

      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090d] text-[#f5f1e8]">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">

        {/* Header */}
        <div className="mb-7 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#292d35] bg-[#0d1016] text-xl text-[#d9d3c7]"
          >
            ←
          </button>

          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#bca56a]">
              SAMBHAV UPSC
            </p>

            <h1 className="mt-1 text-xl font-semibold">
              Premium Checkout
            </h1>
          </div>
        </div>

        {/* Security */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#302d24] bg-[#0d1015] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17140d] text-[#d8b96d]">
            🔒
          </div>

          <div>
            <p className="text-sm font-medium">
              Secure Payment
            </p>

            <p className="mt-0.5 text-xs text-[#8f949d]">
              Payment is processed through a secure gateway
            </p>
          </div>
        </div>

        {/* Main Card */}
        <section className="rounded-3xl border border-[#3b3425] bg-[#0d1016] p-5 shadow-[0_15px_45px_rgba(0,0,0,0.35)]">

          {/* Selected Plan */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#bca56a]">
                Selected Plan
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                {selected.name}
              </h2>

              <p className="mt-1 text-sm text-[#8f949d]">
                {selected.description}
              </p>
            </div>

            <div className="rounded-full border border-[#4a3d20] bg-[#17140d] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d8b96d]">
              PREMIUM
            </div>
          </div>

          {/* Plan Selector */}
          <div className="space-y-2">
            {Object.entries(plans).map(
              ([key, item]) => {
                const active =
                  plan === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setPlan(key);
                      setError("");
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-[#b89b57] bg-[#17140d]"
                        : "border-[#272b32] bg-[#101319]"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          active
                            ? "text-[#e3c77d]"
                            : "text-[#e5e1d8]"
                        }`}
                      >
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-[#858b95]">
                        {item.duration}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ₹{item.price}
                      </p>

                      {active && (
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#bca56a]">
                          Selected
                        </p>
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Price Summary */}
          <div className="my-6 border-t border-[#252932] pt-5">

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8f949d]">
                Premium Plan
              </span>

              <span>
                ₹{selected.price}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#8f949d]">
                Payment Gateway
              </span>

              <span className="text-[#bca56a]">
                Cashfree
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-[#252932] pt-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#777d87]">
                  Total Payable
                </p>

                <p className="mt-1 text-3xl font-semibold">
                  ₹{selected.price}
                </p>
              </div>

              <span className="pb-1 text-xs text-[#777d87]">
                INR
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-2xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          {/* Pay */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full rounded-2xl bg-[#c5a45b] px-5 py-4 text-sm font-bold text-[#090a0d] shadow-[0_10px_30px_rgba(197,164,91,0.15)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Opening Secure Checkout..."
              : `Pay ₹${selected.price}`}
          </button>

          <p className="mt-4 text-center text-[11px] leading-5 text-[#707681]">
            You will be redirected to Cashfree's secure
            payment checkout.
          </p>
        </section>

        {/* Benefits */}
        <section className="mt-5 rounded-3xl border border-[#252932] bg-[#0b0e13] p-5">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#bca56a]">
            Premium Includes
          </p>

          <div className="mt-4 space-y-3">
            {[
              "Premium Current Affairs",
              "PYQ Intelligence",
              "Mains Answer Analysis",
              "AI-powered UPSC Preparation",
              "Premium Study Resources",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#17140d] text-xs text-[#d8b96d]">
                  ✓
                </span>

                <span className="text-sm text-[#c9cbd0]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#555b65]">
            SAMBHAV UPSC
          </p>

          <p className="mt-1 text-[10px] text-[#555b65]">
            Secure Premium Access
          </p>
        </div>

      </div>
    </main>
  );
}
