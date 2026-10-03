"use client";

import { useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendOtp() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email address enter karo.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "OTP send nahi ho saka.");
        return;
      }

      setStep("otp");
      setMessage("OTP aapke email par bhej diya gaya hai.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("6 digit OTP enter karo.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "OTP verify nahi ho saka.");
        return;
      }

      if (data.next === "approval") {
        setStep("success");
        setMessage(
          "Email verified. Aapka account admin approval ke liye pending hai."
        );
      } else {
        setStep("success");
        setMessage("Email verified successfully.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeEmail() {
    setStep("email");
    setOtp("");
    setError("");
    setMessage("");
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand">
          <div className="logo">S</div>
          <div>
            <h1>SAMBHAV</h1>
            <p>UPSC Preparation Platform</p>
          </div>
        </div>

        {step === "email" && (
          <>
            <div className="heading">
              <h2>Welcome to SAMBHAV</h2>
              <p>Continue with your email to access your account.</p>
            </div>

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendOtp();
              }}
              autoComplete="email"
            />

            <button onClick={sendOtp} disabled={loading}>
              {loading ? "Sending OTP..." : "Continue"}
            </button>

            <p className="security">
              A 6-digit verification code will be sent to your email.
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <button className="back-btn" onClick={changeEmail}>
              ← Change Email
            </button>

            <div className="heading">
              <h2>Verify OTP</h2>
              <p>
                OTP sent to <strong>{email}</strong>
              </p>
            </div>

            <label>6-Digit OTP</label>

            <input
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyOtp();
              }}
              autoFocus
            />

            <button onClick={verifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              className="secondary-btn"
              onClick={sendOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <div className="success-icon">✓</div>

            <div className="heading">
              <h2>Email Verified</h2>
              <p>{message}</p>
            </div>

            <button onClick={() => (window.location.href = "/")}>
              Continue
            </button>
          </>
        )}

        {error && <div className="error">{error}</div>}
        {message && step !== "success" && (
          <div className="message">{message}</div>
        )}

        <div className="footer">
          <span>© SAMBHAV UPSC</span>
          <span>Secure Login</span>
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at top,
              rgba(212, 175, 55, 0.12),
              transparent 35%
            ),
            #07111f;
          color: #ffffff;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 430px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          background: rgba(12, 27, 46, 0.96);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
        }

        .logo {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #d4af37;
          color: #07111f;
          font-size: 24px;
          font-weight: 800;
        }

        .brand h1 {
          margin: 0;
          font-size: 21px;
          letter-spacing: 1.5px;
        }

        .brand p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .heading {
          margin-bottom: 24px;
        }

        .heading h2 {
          margin: 0 0 8px;
          font-size: 25px;
        }

        .heading p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.5;
          font-size: 14px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 600;
        }

        input {
          width: 100%;
          height: 52px;
          padding: 0 15px;
          border: 1px solid #26384d;
          border-radius: 12px;
          outline: none;
          background: #081827;
          color: #ffffff;
          font-size: 15px;
          margin-bottom: 14px;
        }

        input:focus {
          border-color: #d4af37;
        }

        button {
          width: 100%;
          height: 52px;
          border: 0;
          border-radius: 12px;
          background: #d4af37;
          color: #07111f;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .otp-input {
          text-align: center;
          letter-spacing: 9px;
          font-size: 22px;
          font-weight: 700;
        }

        .secondary-btn {
          margin-top: 10px;
          background: transparent;
          border: 1px solid #2b4058;
          color: #d4af37;
        }

        .back-btn {
          width: auto;
          height: auto;
          padding: 0;
          margin-bottom: 24px;
          background: transparent;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
        }

        .security {
          margin: 14px 0 0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .error,
        .message {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.4;
        }

        .error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }

        .message {
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #e5c968;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 22px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #4ade80;
          font-size: 30px;
          font-weight: 700;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          color: #64748b;
          font-size: 11px;
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 14px;
          }

          .login-card {
            padding: 24px 20px;
            border-radius: 20px;
          }

          .brand {
            margin-bottom: 30px;
          }
        }
      `}</style>
    </main>
  );
}
