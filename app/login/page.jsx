"use client";

import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState("form");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function switchMode(newMode) {
    setMode(newMode);
    setStep("form");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setUsername("");
    clearMessages();
  }

  async function sendSignupOtp() {
    clearMessages();

    if (!firstName.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
      setMessage("OTP has been sent to your email.");
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndCreateAccount() {
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const verifyResponse = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(
          verifyData.message || "OTP verification failed."
        );
        return;
      }

      const signupResponse = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            firstName: firstName.trim(),
            username: username.trim(),
            otpVerified: true,
          }),
        }
      );

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        setError(
          signupData.message || "Account creation failed."
        );
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    clearMessages();

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="card">

        <div className="brand">
          <div className="logo">S</div>

          <div>
            <h1>SAMBHAV</h1>
            <p>UPSC Preparation Platform</p>
          </div>
        </div>

        <div className="tabs">
          <button
            className={mode === "signin" ? "active" : ""}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>

          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {mode === "signin" && (
          <>
            <div className="heading">
              <h2>Welcome back</h2>
              <p>Sign in to continue to SAMBHAV.</p>
            </div>

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") signIn();
              }}
              autoComplete="current-password"
            />

            <button
              className="primary"
              onClick={signIn}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <button
              className="forgot"
              onClick={() => {
                setError("");
                setMessage(
                  "Forgot password feature will be added next."
                );
              }}
            >
              Forgot Password?
            </button>
          </>
        )}

        {mode === "signup" && step === "form" && (
          <>
            <div className="heading">
              <h2>Create your account</h2>
              <p>
                Join SAMBHAV and start your UPSC preparation.
              </p>
            </div>

            <label>Full Name</label>

            <input
              type="text"
              placeholder="Your full name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="name"
            />

            <label>Username</label>

            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              autoComplete="new-password"
            />

            <button
              className="primary"
              onClick={sendSignupOtp}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </>
        )}

        {mode === "signup" && step === "otp" && (
          <>
            <button
              className="back"
              onClick={() => {
                setStep("form");
                clearMessages();
              }}
            >
              ← Back
            </button>

            <div className="heading">
              <h2>Verify your email</h2>
              <p>
                Enter the 6-digit OTP sent to{" "}
                <strong>{email}</strong>
              </p>
            </div>

            <label>Verification Code</label>

            <input
              className="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyAndCreateAccount();
                }
              }}
              autoFocus
            />

            <button
              className="primary"
              onClick={verifyAndCreateAccount}
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Verify & Create Account"}
            </button>

            <button
              className="secondary"
              onClick={sendSignupOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </>
        )}

        {error && <div className="error">{error}</div>}

        {message && (
          <div className="message">{message}</div>
        )}

        <div className="footer">
          <span>SAMBHAV UPSC</span>
          <span>Secure Login</span>
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at top,
              rgba(212, 175, 55, 0.13),
              transparent 35%
            ),
            #07111f;
          color: white;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .card {
          width: 100%;
          max-width: 450px;
          padding: 32px;
          border-radius: 24px;
          background: #0c1b2e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
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

        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          padding: 5px;
          margin-bottom: 28px;
          border-radius: 12px;
          background: #081827;
        }

        .tabs button {
          height: 42px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
        }

        .tabs button.active {
          background: #d4af37;
          color: #07111f;
        }

        .heading {
          margin-bottom: 22px;
        }

        .heading h2 {
          margin: 0 0 7px;
          font-size: 25px;
        }

        .heading p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
        }

        .heading strong {
          color: #d4af37;
        }

        label {
          display: block;
          margin: 14px 0 7px;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 600;
        }

        input {
          width: 100%;
          height: 50px;
          padding: 0 14px;
          border-radius: 11px;
          border: 1px solid #26384d;
          outline: none;
          background: #081827;
          color: white;
          font-size: 14px;
        }

        input:focus {
          border-color: #d4af37;
        }

        .otp {
          text-align: center;
          font-size: 23px;
          font-weight: 700;
          letter-spacing: 8px;
        }

        .primary {
          width: 100%;
          height: 51px;
          margin-top: 20px;
          border: 0;
          border-radius: 11px;
          background: #d4af37;
          color: #07111f;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .secondary {
          width: 100%;
          height: 48px;
          margin-top: 10px;
          border: 1px solid #2b4058;
          border-radius: 11px;
          background: transparent;
          color: #d4af37;
          font-weight: 600;
          cursor: pointer;
        }

        .forgot,
        .back {
          border: 0;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 13px;
        }

        .forgot {
          display: block;
          margin: 15px auto 0;
        }

        .back {
          padding: 0;
          margin-bottom: 20px;
        }

        .error,
        .message {
          margin-top: 17px;
          padding: 12px;
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

        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 26px;
          padding-top: 17px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          color: #64748b;
          font-size: 11px;
        }

        @media (max-width: 480px) {
          .page {
            padding: 14px;
          }

          .card {
            padding: 24px 20px;
            border-radius: 20px;
          }
        }
      `}</style>
    </main>
  );
}
