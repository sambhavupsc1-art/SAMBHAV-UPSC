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

      /* AUTH ERROR */

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

      /* FORBIDDEN */

      if (
        response.status ===
        403
      ) {
        throw new Error(
          data?.error ||
            "Your account is not approved for premium payment."
        );
      }

      /* CONFLICT */

      if (
        response.status ===
        409
      ) {
        throw new Error(
          data?.error ||
            "You already have an active premium subscription."
        );
      }

      /* SERVER / CASHFREE ERROR */

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

      /* PAYMENT SESSION */

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

      /* CASHFREE */

      const Cashfree =
        await loadCashfree();

      const cashfree =
        Cashfree({
          mode:
            "production",
        });

      console.log(
        "Opening Cashfree production checkout"
      );

      /* OPEN CHECKOUT */

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
     LOADING
  =================================================== */

  if (pageLoading) {
    return (
      <>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f1e8;
            padding: 24px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid rgba(0, 0, 0, 0.12);
            border-top-color: #111;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }

          .loading-text {
            margin: 0;
            color: rgba(0, 0, 0, 0.5);
            font-size: 14px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

        <main className="loading-page">
          <div>
            <div className="loading-spinner" />
            <p className="loading-text">
              Loading secure checkout...
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ===================================================
     PAGE
  =================================================== */

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .payment-page {
          min-height: 100vh;
          background: #f5f1e8;
          color: #111111;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .payment-container {
          width: 100%;
          max-width: 1050px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 42px 28px 50px;
        }

        /* BACK */

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 54px;
          padding: 0;
          border: 0;
          background: transparent;
          color: rgba(0, 0, 0, 0.62);
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .back-button:hover {
          color: #111;
        }

        /* HEADER */

        .heading-section {
          margin-bottom: 42px;
        }

        .eyebrow {
          margin: 0 0 14px;
          color: #a18a46;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.22em;
        }

        .main-heading {
          max-width: 650px;
          margin: 0;
          font-size: 66px;
          line-height: 0.94;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .heading-description {
          max-width: 620px;
          margin: 18px 0 0;
          color: rgba(0, 0, 0, 0.52);
          font-size: 16px;
          line-height: 1.6;
        }

        /* MAIN */

        .payment-content {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        /* PLAN CARD */

        .plan-card {
          position: relative;
          overflow: hidden;
          margin-bottom: 22px;
          padding: 34px 38px;
          border-radius: 32px;
          background: #111111;
          color: #ffffff;
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.1);
        }

        .plan-card::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -120px;
          top: -150px;
          border-radius: 50%;
          background: rgba(223, 197, 111, 0.08);
          filter: blur(35px);
          pointer-events: none;
        }

        .plan-content {
          position: relative;
          z-index: 1;
        }

        .plan-label {
          margin: 0 0 14px;
          color: #dfc56f;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.22em;
        }

        .plan-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .plan-title {
          margin: 0;
          font-size: 34px;
          line-height: 1.1;
          letter-spacing: -0.025em;
          font-weight: 800;
        }

        .duration-badge {
          flex-shrink: 0;
          padding: 8px 13px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-weight: 600;
        }

        .plan-duration {
          margin: 9px 0 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: 16px;
        }

        .plan-price {
          margin-top: 30px;
          color: #dfc56f;
          font-size: 58px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 900;
        }

        /* BENEFITS */

        .benefits-divider {
          height: 1px;
          margin: 28px 0;
          background: rgba(255, 255, 255, 0.1);
        }

        .benefits-heading {
          margin: 0 0 16px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .benefits {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 28px;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.76);
          font-size: 14px;
          line-height: 1.4;
        }

        .check {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e2c773;
          color: #111111;
          font-size: 11px;
          font-weight: 900;
        }

        /* SECURITY BOX */

        .security-box {
          margin-top: 28px;
          padding: 13px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
        }

        .security-content {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .security-icon {
          font-size: 18px;
        }

        .security-title {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 12px;
          font-weight: 700;
        }

        .security-description {
          margin: 3px 0 0;
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          line-height: 1.4;
        }

        /* SUMMARY */

        .summary-card {
          padding: 32px 38px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 32px;
          background: #fffdfa;
          box-shadow:
            0 15px 40px rgba(0, 0, 0, 0.04);
        }

        .summary-label {
          margin: 0 0 7px;
          color: rgba(0, 0, 0, 0.43);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .summary-title {
          margin: 0;
          color: #111;
          font-size: 22px;
          letter-spacing: -0.025em;
          font-weight: 800;
        }

        .summary-details {
          margin-top: 27px;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 8px 0;
        }

        .summary-name {
          color: rgba(0, 0, 0, 0.52);
          font-size: 15px;
        }

        .summary-value {
          color: #111;
          font-size: 15px;
          font-weight: 700;
          text-align: right;
        }

        .summary-divider {
          height: 1px;
          margin: 22px 0;
          background: rgba(0, 0, 0, 0.08);
        }

        .total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .total-label {
          color: #111;
          font-size: 20px;
          font-weight: 800;
        }

        .total-value {
          color: #111;
          font-size: 22px;
          font-weight: 800;
        }

        /* ERROR */

        .error-box {
          margin-top: 20px;
          padding: 14px 16px;
          border: 1px solid #f0caca;
          border-radius: 16px;
          background: #fff1f1;
          color: #a33d3d;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        /* PAY BUTTON */

        .pay-button {
          width: 100%;
          min-height: 60px;
          margin-top: 22px;
          padding: 15px 24px;
          border: 0;
          border-radius: 16px;
          background: #e2c773;
          color: #111111;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 10px 25px rgba(226, 199, 115, 0.2);
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .pay-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #d9bb5f;
          box-shadow:
            0 14px 30px rgba(226, 199, 115, 0.27);
        }

        .pay-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .pay-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .processing {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .button-spinner {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.18);
          border-top-color: #111;
          animation: spin 0.8s linear infinite;
        }

        /* CASHFREE */

        .cashfree-note {
          margin: 15px 0 0;
          color: rgba(0, 0, 0, 0.43);
          font-size: 13px;
          line-height: 1.5;
          text-align: center;
        }

        .payment-methods {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .payment-method {
          padding: 6px 10px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          background: #fafafa;
          color: rgba(0, 0, 0, 0.43);
          font-size: 10px;
          font-weight: 700;
        }

        /* FOOTER */

        .footer-note {
          max-width: 620px;
          margin: 26px auto 0;
          color: rgba(0, 0, 0, 0.35);
          font-size: 11px;
          line-height: 1.5;
          text-align: center;
        }

        /* =============================================
           MOBILE
        ============================================= */

        @media (max-width: 700px) {
          .payment-container {
            padding: 28px 16px 40px;
          }

          .back-button {
            margin-bottom: 38px;
            font-size: 15px;
          }

          .heading-section {
            margin-bottom: 28px;
          }

          .eyebrow {
            font-size: 11px;
            margin-bottom: 11px;
          }

          .main-heading {
            font-size: 46px;
            line-height: 0.96;
          }

          .heading-description {
            margin-top: 14px;
            font-size: 14px;
            line-height: 1.55;
          }

          .plan-card {
            padding: 26px 22px;
            border-radius: 26px;
          }

          .plan-title-row {
            display: block;
          }

          .plan-title {
            font-size: 28px;
          }

          .duration-badge {
            display: inline-block;
            margin-top: 10px;
          }

          .plan-duration {
            font-size: 14px;
          }

          .plan-price {
            margin-top: 24px;
            font-size: 50px;
          }

          .benefits {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .benefit {
            font-size: 13px;
          }

          .summary-card {
            padding: 25px 22px;
            border-radius: 26px;
          }

          .summary-title {
            font-size: 20px;
          }

          .summary-name,
          .summary-value {
            font-size: 14px;
          }

          .total-label {
            font-size: 18px;
          }

          .total-value {
            font-size: 20px;
          }

          .pay-button {
            min-height: 57px;
            font-size: 16px;
          }

          .payment-method {
            font-size: 9px;
            padding: 6px 8px;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <main className="payment-page">

        <div className="payment-container">

          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="back-button"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          {/* HEADER */}

          <section className="heading-section">

            <p className="eyebrow">
              SECURE CHECKOUT
            </p>

            <h1 className="main-heading">
              Complete
              <br />
              Payment
            </h1>

            <p className="heading-description">
              Unlock Premium access to the complete
              SAMBHAV UPSC learning experience.
            </p>

          </section>

          <div className="payment-content">

            {/* ==========================================
                PREMIUM PLAN
            ========================================== */}

            <section className="plan-card">

              <div className="plan-content">

                <p className="plan-label">
                  SAMBHAV PREMIUM
                </p>

                <div className="plan-title-row">

                  <div>

                    <h2 className="plan-title">
                      {plan.title}
                    </h2>

                    <p className="plan-duration">
                      {plan.duration} · Full Premium Access
                    </p>

                  </div>

                  <div className="duration-badge">
                    {plan.duration}
                  </div>

                </div>

                <div className="plan-price">
                  ₹{plan.price}
                </div>

                <div className="benefits-divider" />

                <p className="benefits-heading">
                  Included with Premium
                </p>

                <div className="benefits">

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
                        className="benefit"
                      >
                        <span className="check">
                          ✓
                        </span>

                        <span>
                          {item}
                        </span>
                      </div>
                    )
                  )}

                </div>

                <div className="security-box">

                  <div className="security-content">

                    <span className="security-icon">
                      🔒
                    </span>

                    <div>

                      <p className="security-title">
                        Secure payment
                      </p>

                      <p className="security-description">
                        Payments are securely processed by Cashfree.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* ==========================================
                PAYMENT SUMMARY
            ========================================== */}

            <section className="summary-card">

              <p className="summary-label">
                PAYMENT SUMMARY
              </p>

              <h2 className="summary-title">
                Payment details
              </h2>

              <div className="summary-details">

                <div className="summary-row">

                  <span className="summary-name">
                    Plan
                  </span>

                  <span className="summary-value">
                    {plan.title}
                  </span>

                </div>

                <div className="summary-row">

                  <span className="summary-name">
                    Duration
                  </span>

                  <span className="summary-value">
                    {plan.duration}
                  </span>

                </div>

                <div className="summary-row">

                  <span className="summary-name">
                    Premium access
                  </span>

                  <span className="summary-value">
                    Included
                  </span>

                </div>

              </div>

              <div className="summary-divider" />

              <div className="total-row">

                <span className="total-label">
                  Total payable
                </span>

                <span className="total-value">
                  ₹{plan.amount}
                </span>

              </div>

              {/* ERROR */}

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              {/* PAY */}

              <button
                type="button"
                onClick={
                  handlePayment
                }
                disabled={
                  loading ||
                  !user
                }
                className="pay-button"
              >

                {loading ? (
                  <span className="processing">

                    <span className="button-spinner" />

                    <span>
                      Processing payment...
                    </span>

                  </span>
                ) : (
                  <>
                    Pay ₹{plan.amount} →
                  </>
                )}

              </button>

              {/* CASHFREE */}

              <p className="cashfree-note">
                🔒 Secure payment powered by Cashfree
              </p>

              <div className="payment-methods">

                <span className="payment-method">
                  UPI
                </span>

                <span className="payment-method">
                  Cards
                </span>

                <span className="payment-method">
                  Net Banking
                </span>

              </div>

            </section>

          </div>

          <p className="footer-note">
            You will be securely redirected to Cashfree
            to complete your payment.
          </p>

        </div>

      </main>
    </>
  );
}

/* =====================================================
   SUSPENSE LOADING
===================================================== */

function PaymentLoading() {
  return (
    <>
      <style jsx>{`
        .fallback {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f1e8;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.12);
          border-top-color: #111;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        p {
          margin: 0;
          color: rgba(0, 0, 0, 0.5);
          font-size: 14px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <main className="fallback">
        <div>
          <div className="spinner" />
          <p>
            Loading secure checkout...
          </p>
        </div>
      </main>
    </>
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
