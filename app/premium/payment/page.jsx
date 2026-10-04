"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PLANS = {
  monthly: {
    key: "monthly",
    title: "Monthly Premium",
    duration: "1 Month",
    price: 99,
    amount: 99,
  },
  quarterly: {
    key: "quarterly",
    title: "Quarterly Premium",
    duration: "3 Months",
    price: 399,
    amount: 399,
  },
  annual: {
    key: "annual",
    title: "Annual Premium",
    duration: "1 Year",
    price: 999,
    amount: 999,
  },
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planKey = searchParams.get("plan") || "monthly";

  const plan = useMemo(() => {
    return PLANS[planKey] || PLANS.monthly;
  }, [planKey]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!mounted) return;

        if (!response.ok || !data?.user) {
          router.replace("/");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error("Auth check failed:", err);

        if (mounted) {
          router.replace("/");
        }
      } finally {
        if (mounted) {
          setPageLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function loadCashfree() {
    if (typeof window === "undefined") {
      throw new Error("Payment can only be started in the browser.");
    }

    if (window.Cashfree) {
      return window.Cashfree;
    }

    await new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });

        if (window.Cashfree) {
          resolve();
        }

        return;
      }

      const script = document.createElement("script");

      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;

      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Unable to load Cashfree payment SDK."));

      document.head.appendChild(script);
    });

    if (!window.Cashfree) {
      throw new Error("Cashfree SDK failed to load.");
    }

    return window.Cashfree;
  }

  async function handlePayment() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * Payment request uses the normal website session cookie.
       *
       * Telegram Authorization header has intentionally been removed.
       */
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          plan: plan.key,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          data?.error ||
            "Authentication failed. Please login to SAMBHAV again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          data?.error ||
            "Your account is not approved for premium payment."
        );
      }

      if (response.status === 409) {
        throw new Error(
          data?.error ||
            "You already have an active premium subscription."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to create payment order."
        );
      }

      if (!data?.payment_session_id) {
        throw new Error("Payment session was not created.");
      }

      const Cashfree = await loadCashfree();

      const environment =
        data?.environment === "production" ? "production" : "sandbox";

      const cashfree = Cashfree({
        mode: environment,
      });

      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error("Payment error:", err);

      setError(
        err?.message ||
          "Something went wrong while starting the payment."
      );

      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#f5f1e8] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-black" />
          <p className="text-sm text-black/55">
            Loading secure checkout...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-black">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-12 text-base text-black/65 transition hover:text-black"
        >
          ← Back
        </button>

        {/* Heading */}
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#a18a46]">
            SECURE CHECKOUT
          </p>

          <h1 className="max-w-xl text-[52px] font-black leading-[0.94] tracking-[-0.045em] sm:text-[68px]">
            Complete
            <br />
            Payment
          </h1>
        </section>

        {/* Main content */}
        <div className="mx-auto max-w-4xl">
          {/* Plan card */}
          <section className="mb-6 overflow-hidden rounded-[32px] bg-[#111111] px-8 py-9 text-white shadow-[0_20px_50px_rgba(0,0,0,0.10)] sm:px-10 sm:py-10">
            <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-[#dfc56f]">
              SAMBHAV PREMIUM
            </p>

            <h2 className="text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
              {plan.title}
            </h2>

            <p className="mt-2 text-base text-white/55 sm:text-lg">
              {plan.duration} · Full Premium Access
            </p>

            <div className="mt-8 text-5xl font-black tracking-[-0.04em] text-[#dfc56f] sm:text-6xl">
              ₹{plan.price}
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-[32px] border border-black/[0.06] bg-[#fffdfa] p-7 shadow-[0_15px_40px_rgba(0,0,0,0.04)] sm:p-9">
            <p className="mb-6 text-xs font-bold tracking-[0.18em] text-black/45">
              PAYMENT SUMMARY
            </p>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-5">
                <span className="text-lg text-black/80">
                  Membership
                </span>

                <span className="text-right text-lg font-bold">
                  {plan.title}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="text-lg text-black/80">
                  Access
                </span>

                <span className="text-right text-lg">
                  All Premium Modules
                </span>
              </div>

              <div className="border-t border-black/10 pt-6">
                <div className="flex items-center justify-between gap-5">
                  <span className="text-xl font-bold">
                    Total payable
                  </span>

                  <span className="text-xl font-bold">
                    ₹{plan.amount}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* Pay button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={loading || !user}
                className="mt-2 flex w-full items-center justify-center rounded-2xl bg-[#e2c773] px-6 py-5 text-lg font-bold text-black transition hover:bg-[#d8bb61] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Processing...
                  </span>
                ) : (
                  <>Pay ₹{plan.amount} →</>
                )}
              </button>

              <p className="pt-1 text-center text-sm text-black/45">
                🔒 Secure payment powered by Cashfree
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
