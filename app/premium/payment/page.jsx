"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

/* =====================================================
   PLANS
===================================================== */

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

/* =====================================================
   PAYMENT CONTENT
===================================================== */

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planKey =
    searchParams.get("plan") || "monthly";

  const plan = useMemo(() => {
    return (
      PLANS[planKey] ||
      PLANS.monthly
    );
  }, [planKey]);

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [user, setUser] =
    useState(null);

  /* ===================================================
     AUTH CHECK
  =================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!mounted) {
          return;
        }

        if (
          !response.ok ||
          !data?.user
        ) {
          router.replace("/");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error(
          "Auth check failed:",
          err
        );

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

  /* ===================================================
     LOAD CASHFREE SDK
  =================================================== */

  async function loadCashfree() {
    if (
      typeof window ===
      "undefined"
    ) {
      throw new Error(
        "Payment can only be started in the browser."
      );
    }

    if (window.Cashfree) {
      return window.Cashfree;
    }

    await new Promise(
      (
        resolve,
        reject
      ) => {
        const existingScript =
          document.querySelector(
            'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
          );

        if (existingScript) {
          if (
            window.Cashfree
          ) {
            resolve();
            return;
          }

          existingScript.addEventListener(
            "load",
            resolve,
            {
              once: true,
            }
          );

          existingScript.addEventListener(
            "error",
            reject,
            {
              once: true,
            }
          );

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://sdk.cashfree.com/js/v3/cashfree.js";

        script.async = true;

        script.onload =
          resolve;

        script.onerror =
          () =>
            reject(
              new Error(
                "Unable to load Cashfree payment SDK."
              )
            );

        document.head.appendChild(
          script
        );
      }
    );

    if (
      !window.Cashfree
    ) {
      throw new Error(
        "Cashfree SDK failed to load."
      );
    }

    return window.Cashfree;
  }

  /* ===================================================
     PAYMENT
  =================================================== */

  async function handlePayment() {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/payment/create-order",
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify({
                plan:
                  plan.key,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Payment order response:",
        data
      );

      /* ---------------------------------------------
         AUTH ERROR
      --------------------------------------------- */

      if (
        response.status ===
        401
      ) {
        throw new Error(
          data?.reason
            ? `${data.error || "Authentication failed."} ${data.reason}`
            : data?.error ||
                "Authentication failed. Please login to SAMBHAV again."
        );
      }

      /* ---------------------------------------------
         FORBIDDEN
      --------------------------------------------- */

      if (
        response.status ===
        403
      ) {
        throw new Error(
          data?.error ||
            "Your account is not approved for premium payment."
        );
      }

      /* ---------------------------------------------
         CONFLICT
      --------------------------------------------- */

      if (
        response.status ===
        409
      ) {
        throw new Error(
          data?.error ||
            "You already have an active premium subscription."
        );
      }

      /* ---------------------------------------------
         SERVER / CASHFREE ERROR
      --------------------------------------------- */

      if (!response.ok) {
        let errorMessage =
          data?.error ||
          data?.message ||
          "Unable to create payment order.";

        if (
          data?.cashfreeStatus
        ) {
          errorMessage +=
            ` | Cashfree status: ${data.cashfreeStatus}`;
        }

        throw new Error(
          errorMessage
        );
      }

      /* ---------------------------------------------
         PAYMENT SESSION
      --------------------------------------------- */

      const paymentSessionId =
        data?.payment_session_id ||
        data?.paymentSessionId ||
        null;

      if (
        !paymentSessionId
      ) {
        console.error(
          "Payment session missing:",
          data
        );

        throw new Error(
          data?.error ||
            "Payment session was not created."
        );
      }

      /* ---------------------------------------------
         LOAD CASHFREE
      --------------------------------------------- */

      const Cashfree =
        await loadCashfree();

      /*
       * SAMBHAV uses Cashfree PRODUCTION.
       */

      const cashfree =
        Cashfree({
          mode:
            "production",
        });

      console.log(
        "Opening Cashfree production checkout"
      );

      /* ---------------------------------------------
         OPEN CASHFREE CHECKOUT
      --------------------------------------------- */

      await cashfree.checkout({
        paymentSessionId:
          paymentSessionId,

        redirectTarget:
          "_self",
      });
    } catch (err) {
      console.error(
        "Payment error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while starting the payment."
      );

      setLoading(false);
    }
  }

  /* ===================================================
     PAGE LOADING
  =================================================== */

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-6">

        <div className="text-center">

          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />

          <p className="text-sm font-medium text-black/50">
            Loading secure checkout...
          </p>

        </div>

      </main>
    );
  }

  /* ===================================================
     PAGE
  =================================================== */

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111]">

      {/* ================================================
          TOP BAR
      ================================================ */}

      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">

        <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">

          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="group flex items-center gap-2 text-sm font-semibold text-black/65 transition hover:text-black"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-0.5">
              ←
            </span>

            Back
          </button>

          {/* BRAND */}

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111] text-xs font-black text-[#e2c773]">
              S
            </div>

            <span className="text-sm font-black tracking-tight">
              SAMBHAV
            </span>

          </div>

          {/* STATUS */}

          <div className="hidden items-center gap-2 text-xs font-semibold text-black/45 sm:flex">

            <span className="h-2 w-2 rounded-full bg-green-500" />

            Secure Checkout

          </div>

        </div>

      </header>

      {/* ================================================
          CONTENT
      ================================================ */}

      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">

        {/* ==============================================
            HEADER
        ============================================== */}

        <section className="mx-auto mb-8 max-w-3xl text-center">

          <div className="mb-3 inline-flex items-center rounded-full border border-[#d8bd61]/30 bg-[#fff9e7] px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-[#94782b]">
            SAMBHAV PREMIUM
          </div>

          <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            Complete your payment
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/50 sm:text-base">
            Unlock Premium access to the complete
            SAMBHAV UPSC learning experience.
          </p>

        </section>

        {/* ==============================================
            MAIN GRID
        ============================================== */}

        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">

          {/* ============================================
              PLAN CARD
          ============================================ */}

          <section className="relative overflow-hidden rounded-[28px] bg-[#111] p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)] sm:p-9">

            {/* decorative glow */}

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#dfc56f]/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-white/[0.03] blur-3xl" />

            <div className="relative">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-[10px] font-black tracking-[0.2em] text-[#dfc56f]">
                    SELECTED PLAN
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                    {plan.title}
                  </h2>

                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70">
                  {plan.duration}
                </div>

              </div>

              {/* PRICE */}

              <div className="mt-8 flex items-end gap-2">

                <span className="text-5xl font-black tracking-[-0.05em] text-[#e2c773] sm:text-6xl">
                  ₹{plan.price}
                </span>

                <span className="mb-2 text-sm text-white/45">
                  /{" "}
                  {plan.key ===
                  "monthly"
                    ? "month"
                    : plan.key ===
                      "quarterly"
                    ? "3 months"
                    : "year"}
                </span>

              </div>

              <div className="my-8 h-px bg-white/10" />

              {/* BENEFITS */}

              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                Included with Premium
              </p>

              <div className="space-y-3">

                {[
                  "Complete Premium Modules",
                  "UPSC-focused learning resources",
                  "Premium Current Affairs",
                  "PYQ & Mock Test access",
                  "Mains & Prelims preparation",
                ].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >

                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e2c773] text-[11px] font-black text-black">
                        ✓
                      </span>

                      <span className="text-sm text-white/75">
                        {item}
                      </span>

                    </div>
                  )
                )}

              </div>

              {/* SECURITY BOX */}

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">

                <div className="flex items-center gap-3">

                  <span className="text-lg">
                    🔒
                  </span>

                  <div>

                    <p className="text-xs font-bold text-white/80">
                      Secure payment
                    </p>

                    <p className="mt-0.5 text-[11px] text-white/40">
                      Payments are securely processed by Cashfree.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* ============================================
              PAYMENT SUMMARY
          ============================================ */}

          <section className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)] sm:p-8">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] font-black tracking-[0.18em] text-black/40">
                  PAYMENT SUMMARY
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.025em]">
                  Payment details
                </h2>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f1df] text-lg">
                ₹
              </div>

            </div>

            {/* DETAILS */}

            <div className="mt-7 space-y-4">

              {/* PLAN */}

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-black/50">
                  Plan
                </span>

                <span className="text-right text-sm font-bold">
                  {plan.title}
                </span>

              </div>

              {/* DURATION */}

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-black/50">
                  Duration
                </span>

                <span className="text-sm font-semibold">
                  {plan.duration}
                </span>

              </div>

              {/* ACCESS */}

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-black/50">
                  Premium access
                </span>

                <span className="text-sm font-semibold">
                  Included
                </span>

              </div>

            </div>

            {/* TOTAL */}

            <div className="my-7 border-t border-black/[0.08] pt-6">

              <div className="flex items-end justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold text-black/40">
                    Total payable
                  </p>

                  <p className="mt-1 text-3xl font-black tracking-[-0.04em]">
                    ₹{plan.amount}
                  </p>

                </div>

                <span className="mb-1 rounded-full bg-[#f5f0dd] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#806923]">
                  Secure
                </span>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-5 break-words rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* PAY BUTTON */}

            <button
              type="button"
              onClick={
                handlePayment
              }
              disabled={
                loading ||
                !user
              }
              className="group flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-[#e2c773] px-6 text-base font-black text-black shadow-[0_10px_25px_rgba(226,199,115,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d9bb5f] hover:shadow-[0_14px_30px_rgba(226,199,115,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >

              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />

                  <span>
                    Processing payment...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Pay ₹{plan.amount}
                  </span>

                  <span className="text-lg transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}

            </button>

            {/* SECURITY */}

            <div className="mt-5 text-center">

              <p className="text-[11px] leading-5 text-black/40">
                You will be securely redirected to
                Cashfree to complete your payment.
              </p>

            </div>

            {/* PAYMENT METHODS */}

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-black/[0.06] pt-5">

              <span className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-2.5 py-1.5 text-[10px] font-bold text-black/45">
                UPI
              </span>

              <span className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-2.5 py-1.5 text-[10px] font-bold text-black/45">
                Cards
              </span>

              <span className="rounded-lg border border-black/[0.06] bg-[#fafafa] px-2.5 py-1.5 text-[10px] font-bold text-black/45">
                Net Banking
              </span>

            </div>

          </section>

        </div>

        {/* ==============================================
            FOOTER
        ============================================== */}

        <p className="mx-auto mt-7 max-w-xl text-center text-[11px] leading-5 text-black/35">
          By continuing, you agree to complete the
          selected SAMBHAV Premium purchase through
          our secure payment partner.
        </p>

      </div>

    </main>
  );
}

/* =====================================================
   SUSPENSE LOADING
===================================================== */

function PaymentLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">

      <div className="text-center">

        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />

        <p className="text-sm font-medium text-black/50">
          Loading secure checkout...
        </p>

      </div>

    </main>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <PaymentLoading />
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
