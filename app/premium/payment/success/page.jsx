"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PremiumPaymentSuccessPage() {
  const router = useRouter();

  const [status, setStatus] =
    useState("verifying");

  const [message, setMessage] =
    useState(
      "Payment verify ho raha hai..."
    );

  const [orderId, setOrderId] =
    useState("");

  useEffect(() => {
    let stopped = false;

    const verifyPayment =
      async () => {
        try {
          const params =
            new URLSearchParams(
              window.location.search
            );

          const currentOrderId =
            params.get("order_id");

          if (!currentOrderId) {
            throw new Error(
              "Order ID nahi mila."
            );
          }

          setOrderId(
            currentOrderId
          );

          /*
           * Telegram auth
           */

          let initData = "";

          try {
            initData =
              window.Telegram?.WebApp
                ?.initData ||
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

          if (!initData) {
            throw new Error(
              "Telegram authentication data nahi mila."
            );
          }

          /*
           * Verify payment
           */

          const response =
            await fetch(
              "/api/payment/verify",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `tma ${initData}`,
                },

                body: JSON.stringify({
                  order_id:
                    currentOrderId,
                }),

                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (stopped) return;

          /*
           * Payment successful
           */

          if (
            response.ok &&
            data?.success &&
            data?.status ===
              "active"
          ) {
            setStatus(
              "success"
            );

            setMessage(
              "Payment successful. Premium activate ho gaya hai."
            );

            setTimeout(() => {
              if (!stopped) {
                router.push(
                  "/premium/home"
                );
              }
            }, 1200);

            return;
          }

          /*
           * Payment pending
           */

          if (
            data?.status ===
            "pending"
          ) {
            setStatus(
              "pending"
            );

            setMessage(
              "Payment abhi pending hai. Thodi der baad dobara check karein."
            );

            return;
          }

          /*
           * Payment failed
           */

          setStatus(
            "failed"
          );

          setMessage(
            data?.message ||
              data?.error ||
              "Payment verify nahi ho saka."
          );
        } catch (error) {
          if (stopped) return;

          console.error(
            "Payment success verification error:",
            error
          );

          setStatus(
            "failed"
          );

          setMessage(
            error?.message ||
              "Payment verification failed."
          );
        }
      };

    verifyPayment();

    return () => {
      stopped = true;
    };
  }, [router]);

  const goHome =
    () => {
      router.push(
        "/premium"
      );
    };

  const retry =
    () => {
      window.location.reload();
    };

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main
        style={{
          minHeight:
            "100vh",

          background:
            "#f5f2eb",

          color:
            "#101010",

          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",

          padding:
            "20px 16px 40px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            width:
              "100%",

            maxWidth:
              "500px",

            background:
              "#fffdf9",

            borderRadius:
              "28px",

            padding:
              "32px 22px",

            textAlign:
              "center",

            border:
              "1px solid rgba(16,16,16,.08)",

            boxShadow:
              "0 18px 45px rgba(16,16,16,.08)",
          }}
        >
          {/* STATUS ICON */}

          <div
            style={{
              width:
                "72px",

              height:
                "72px",

              margin:
                "0 auto 18px",

              borderRadius:
                "50%",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontSize:
                "30px",

              background:
                status ===
                "success"
                  ? "#e8f7ec"
                  : status ===
                    "pending"
                  ? "#fff6df"
                  : status ===
                    "failed"
                  ? "#fff0ee"
                  : "#eeeae2",

              color:
                status ===
                "success"
                  ? "#217a39"
                  : status ===
                    "pending"
                  ? "#9a7015"
                  : status ===
                    "failed"
                  ? "#b52b22"
                  : "#77736b",
            }}
          >
            {status ===
              "success"
              ? "✓"
              : status ===
                "pending"
              ? "…"
              : status ===
                "failed"
              ? "!"
              : "↻"}
          </div>

          {/* TITLE */}

          <h1
            style={{
              margin:
                "0",

              fontSize:
                "25px",

              fontWeight:
                "900",

              letterSpacing:
                "-.7px",
            }}
          >
            {status ===
            "success"
              ? "Payment Successful"
              : status ===
                "pending"
              ? "Payment Pending"
              : status ===
                "failed"
              ? "Payment Verification Failed"
              : "Verifying Payment"}
          </h1>

          {/* MESSAGE */}

          <p
            style={{
              margin:
                "11px auto 0",

              maxWidth:
                "390px",

              color:
                "#77736b",

              fontSize:
                "12px",

              lineHeight:
                "1.6",
            }}
          >
            {message}
          </p>

          {/* ORDER */}

          {orderId && (
            <div
              style={{
                marginTop:
                  "20px",

                padding:
                  "12px",

                borderRadius:
                  "14px",

                background:
                  "#f5f2eb",

                fontSize:
                  "9px",

                color:
                  "#77736b",

                wordBreak:
                  "break-all",
              }}
            >
              Order ID
              <br />

              <strong
                style={{
                  color:
                    "#101010",
                }}
              >
                {orderId}
              </strong>
            </div>
          )}

          {/* SUCCESS */}

          {status ===
            "success" && (
            <button
              onClick={() =>
                router.push(
                  "/premium/home"
                )
              }
              style={{
                width:
                  "100%",

                marginTop:
                  "22px",

                border:
                  "none",

                borderRadius:
                  "17px",

                padding:
                  "16px",

                background:
                  "#101010",

                color:
                  "#fff",

                fontSize:
                  "12px",

                fontWeight:
                  "900",

                cursor:
                  "pointer",
              }}
            >
              OPEN PREMIUM →
            </button>
          )}

          {/* PENDING */}

          {status ===
            "pending" && (
            <>
              <button
                onClick={
                  retry
                }
                style={{
                  width:
                    "100%",

                  marginTop:
                    "22px",

                  border:
                    "none",

                  borderRadius:
                    "17px",

                  padding:
                    "16px",

                  background:
                    "#101010",

                  color:
                    "#fff",

                  fontSize:
                    "12px",

                  fontWeight:
                    "900",

                  cursor:
                    "pointer",
                }}
              >
                CHECK AGAIN
              </button>

              <button
                onClick={
                  goHome
                }
                style={{
                  width:
                    "100%",

                  marginTop:
                    "10px",

                  border:
                    "1px solid rgba(16,16,16,.1)",

                  borderRadius:
                    "17px",

                  padding:
                    "15px",

                  background:
                    "#fffdf9",

                  color:
                    "#101010",

                  fontSize:
                    "11px",

                  fontWeight:
                    "800",

                  cursor:
                    "pointer",
                }}
              >
                BACK TO PREMIUM
              </button>
            </>
          )}

          {/* FAILED */}

          {status ===
            "failed" && (
            <>
              <button
                onClick={
                  retry
                }
                style={{
                  width:
                    "100%",

                  marginTop:
                    "22px",

                  border:
                    "none",

                  borderRadius:
                    "17px",

                  padding:
                    "16px",

                  background:
                    "#101010",

                  color:
                    "#fff",

                  fontSize:
                    "12px",

                  fontWeight:
                    "900",

                  cursor:
                    "pointer",
                }}
              >
                TRY AGAIN
              </button>

              <button
                onClick={
                  goHome
                }
                style={{
                  width:
                    "100%",

                  marginTop:
                    "10px",

                  border:
                    "1px solid rgba(16,16,16,.1)",

                  borderRadius:
                    "17px",

                  padding:
                    "15px",

                  background:
                    "#fffdf9",

                  color:
                    "#101010",

                  fontSize:
                    "11px",

                  fontWeight:
                    "800",

                  cursor:
                    "pointer",
                }}
              >
                BACK TO PREMIUM
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
