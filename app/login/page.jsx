"use client";

import { useEffect, useState } from "react";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f8f7f3 0%,#efeee9 100%)",
    color: "#111",
    fontFamily:
      "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    display: "flex",
    justifyContent: "center",
    padding: "20px 16px",
    boxSizing: "border-box",
  },

  wrapper: {
    width: "100%",
    maxWidth: "460px",
    margin: "0 auto",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
  },

  brand: {
    fontSize: "22px",
    fontWeight: "950",
    letterSpacing: "-.9px",
  },

  gold: {
    color: "#9b7b2f",
  },

  brandSub: {
    marginTop: "3px",
    fontSize: "7px",
    color: "#8a8a8a",
    letterSpacing: "1.5px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  back: {
    color: "#666",
    textDecoration: "none",
    fontSize: "10px",
    fontWeight: "800",
  },

  card: {
    background: "#fff",
    border: "1px solid #e4e2dd",
    borderRadius: "29px",
    padding: "27px 22px",
    boxShadow:
      "0 18px 50px rgba(0,0,0,.07)",
  },

  eyebrow: {
    color: "#9b7b2f",
    fontSize: "8px",
    fontWeight: "950",
    letterSpacing: "1.7px",
    textTransform: "uppercase",
  },

  title: {
    margin: "8px 0 0",
    fontSize: "30px",
    lineHeight: "1.08",
    fontWeight: "950",
    letterSpacing: "-1.2px",
  },

  subtitle: {
    marginTop: "9px",
    color: "#777",
    fontSize: "11px",
    lineHeight: "1.55",
  },

  form: {
    marginTop: "25px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "9px",
    fontWeight: "850",
    color: "#555",
  },

  input: {
    width: "100%",
    height: "49px",
    boxSizing: "border-box",
    border: "1px solid #deddd8",
    borderRadius: "14px",
    padding: "0 14px",
    outline: "none",
    background: "#fafaf8",
    color: "#111",
    fontSize: "13px",
    marginBottom: "15px",
  },

  passwordWrap: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: "70px",
  },

  showButton: {
    position: "absolute",
    right: "10px",
    top: "7px",
    height: "35px",
    padding: "0 9px",
    border: "none",
    background: "transparent",
    color: "#777",
    fontSize: "9px",
    fontWeight: "850",
    cursor: "pointer",
  },

  primary: {
    width: "100%",
    height: "51px",
    border: "none",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg,#171717,#050505)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow:
      "0 9px 22px rgba(0,0,0,.14)",
  },

  secondary: {
    width: "100%",
    height: "49px",
    border: "1px solid #deddd8",
    borderRadius: "15px",
    background: "#fff",
    color: "#111",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  link: {
    border: "none",
    background: "transparent",
    color: "#8c702c",
    fontSize: "9px",
    fontWeight: "850",
    cursor: "pointer",
    padding: 0,
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "21px 0",
    color: "#aaa",
    fontSize: "8px",
    fontWeight: "700",
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e9e8e4",
  },

  switchText: {
    marginTop: "20px",
    textAlign: "center",
    color: "#888",
    fontSize: "10px",
  },

  switchButton: {
    border: "none",
    background: "transparent",
    color: "#8c702c",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "10px",
    padding: 0,
  },

  message: {
    marginTop: "14px",
    padding: "11px 12px",
    borderRadius: "12px",
    background: "#f4f1e8",
    border: "1px solid #e2d8bd",
    color: "#665735",
    fontSize: "10px",
    lineHeight: "1.45",
  },

  error: {
    marginTop: "14px",
    padding: "11px 12px",
    borderRadius: "12px",
    background: "#faf0ef",
    border: "1px solid #ead3d0",
    color: "#8b3932",
    fontSize: "10px",
    lineHeight: "1.45",
  },

  otpBox: {
    marginTop: "16px",
    padding: "15px",
    borderRadius: "17px",
    background: "#f6f5f1",
    border: "1px solid #e5e3de",
  },

  otpTitle: {
    fontSize: "11px",
    fontWeight: "900",
  },

  otpText: {
    marginTop: "4px",
    color: "#888",
    fontSize: "9px",
    lineHeight: "1.45",
  },

  footer: {
    textAlign: "center",
    marginTop: "22px",
    color: "#999",
    fontSize: "8px",
    lineHeight: "1.6",
  },
};

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [cooldown, setCooldown] =
    useState(0);


  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((value) =>
        value > 0 ? value - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);


  const resetMessages = () => {
    setMessage("");
    setError("");
  };


  const changeMode = (newMode) => {
    resetMessages();

    setMode(newMode);
    setStep("form");

    setOtp("");
    setPassword("");
    setConfirmPassword("");
  };


  const apiRequest = async (
    url,
    body
  ) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data =
      await response.json().catch(
        () => ({})
      );

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Something went wrong."
      );
    }

    return data;
  };


  /* ======================================================
     SIGN IN
     ====================================================== */

  const handleSignin = async (e) => {
    e.preventDefault();

    resetMessages();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/signin",
        {
          email: cleanEmail,
          password,
        }
      );

      window.location.href = "/";
    } catch (err) {
      setError(
        err.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     SEND SIGNUP OTP
     ====================================================== */

  const sendSignupOtp = async () => {
    resetMessages();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!cleanEmail) {
      setError(
        "Please enter your email."
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/send-otp",
        {
          email: cleanEmail,
          purpose: "signup",
        }
      );

      setStep("otp");

      setCooldown(60);

      setMessage(
        "OTP has been sent to your email."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     VERIFY SIGNUP OTP
     ====================================================== */

  const verifySignupOtp = async () => {
    resetMessages();

    if (
      !/^\d{6}$/.test(
        otp.trim()
      )
    ) {
      setError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/verify-otp",
        {
          email:
            email.trim().toLowerCase(),
          otp: otp.trim(),
          purpose: "signup",
        }
      );

      setStep("password");

      setMessage(
        "Email verified successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     COMPLETE SIGNUP
     ====================================================== */

  const handleSignup = async (e) => {
    e.preventDefault();

    resetMessages();

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/signup",
        {
          name: name.trim(),
          email:
            email.trim().toLowerCase(),
          password,
          otp: otp.trim(),
        }
      );

      window.location.href = "/";
    } catch (err) {
      setError(
        err.message ||
          "Account creation failed."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     FORGOT PASSWORD
     ====================================================== */

  const sendForgotOtp = async () => {
    resetMessages();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email."
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/send-otp",
        {
          email: cleanEmail,
          purpose: "forgot_password",
        }
      );

      setStep("forgotOtp");

      setCooldown(60);

      setMessage(
        "Password reset OTP has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };


  const verifyForgotOtp = async () => {
    resetMessages();

    if (
      !/^\d{6}$/.test(
        otp.trim()
      )
    ) {
      setError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest(
        "/api/auth/verify-otp",
        {
          email:
            email.trim().toLowerCase(),
          otp: otp.trim(),
          purpose: "forgot_password",
        }
      );

      setStep("newPassword");

      setMessage(
        "OTP verified. Create your new password."
      );
    } catch (err) {
      setError(
        err.message ||
          "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  };


  const resetPassword = async (
    e
  ) => {
    e.preventDefault();

    resetMessages();

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * The existing signup/auth backend may expose
       * password reset through this endpoint.
       */

      await apiRequest(
        "/api/auth/reset-password",
        {
          email:
            email.trim().toLowerCase(),
          otp: otp.trim(),
          password,
        }
      );

      setMode("signin");
      setStep("form");

      setPassword("");
      setConfirmPassword("");
      setOtp("");

      setMessage(
        "Password reset successfully. Please sign in."
      );
    } catch (err) {
      setError(
        err.message ||
          "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ======================================================
     SIGN IN SCREEN
     ====================================================== */

  const renderSignin = () => (
    <>
      <div style={styles.eyebrow}>
        SAMBHAV ACCOUNT
      </div>

      <h1 style={styles.title}>
        Welcome back.
      </h1>

      <p style={styles.subtitle}>
        Sign in to continue your UPSC
        preparation.
      </p>

      <form
        onSubmit={handleSignin}
        style={styles.form}
      >
        <label style={styles.label}>
          EMAIL ADDRESS
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="you@example.com"
          autoComplete="email"
          style={styles.input}
        />

        <label style={styles.label}>
          PASSWORD
        </label>

        <div style={styles.passwordWrap}>
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            style={{
              ...styles.input,
              ...styles.passwordInput,
            }}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (value) => !value
              )
            }
            style={styles.showButton}
          >
            {showPassword
              ? "HIDE"
              : "SHOW"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            marginTop: "-4px",
            marginBottom: "18px",
          }}
        >
          <button
            type="button"
            style={styles.link}
            onClick={() => {
              resetMessages();
              setMode(
                "forgot"
              );
              setStep("form");
              setPassword("");
            }}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "SIGNING IN..."
            : "SIGN IN →"}
        </button>
      </form>

      <div style={styles.divider}>
        <span style={styles.dividerLine} />
        OR
        <span style={styles.dividerLine} />
      </div>

      <button
        type="button"
        style={styles.secondary}
        onClick={() =>
          changeMode("signup")
        }
      >
        Create New Account
      </button>

      <div style={styles.switchText}>
        New to SAMBHAV?{" "}
        <button
          type="button"
          style={styles.switchButton}
          onClick={() =>
            changeMode("signup")
          }
        >
          Create Account
        </button>
      </div>
    </>
  );


  /* ======================================================
     SIGNUP - BASIC DETAILS
     ====================================================== */

  const renderSignupForm = () => (
    <>
      <div style={styles.eyebrow}>
        CREATE ACCOUNT
      </div>

      <h1 style={styles.title}>
        Start with SAMBHAV.
      </h1>

      <p style={styles.subtitle}>
        Create your account and build your
        personalised UPSC preparation space.
      </p>

      <div style={styles.form}>

        <label style={styles.label}>
          FULL NAME
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Your full name"
          autoComplete="name"
          style={styles.input}
        />

        <label style={styles.label}>
          EMAIL ADDRESS
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="you@example.com"
          autoComplete="email"
          style={styles.input}
        />

        <button
          type="button"
          disabled={loading}
          onClick={sendSignupOtp}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "SENDING OTP..."
            : "SEND OTP →"}
        </button>

      </div>

      <div style={styles.switchText}>
        Already have an account?{" "}
        <button
          type="button"
          style={styles.switchButton}
          onClick={() =>
            changeMode("signin")
          }
        >
          Sign In
        </button>
      </div>
    </>
  );


  /* ======================================================
     SIGNUP OTP
     ====================================================== */

  const renderSignupOtp = () => (
    <>
      <div style={styles.eyebrow}>
        EMAIL VERIFICATION
      </div>

      <h1 style={styles.title}>
        Verify your email.
      </h1>

      <p style={styles.subtitle}>
        Enter the 6-digit OTP sent to:
        <br />
        <strong>
          {email}
        </strong>
      </p>

      <div style={styles.otpBox}>
        <div style={styles.otpTitle}>
          Verification Code
        </div>

        <div style={styles.otpText}>
          OTP valid for a limited time.
        </div>
      </div>

      <div style={styles.form}>

        <label style={styles.label}>
          6-DIGIT OTP
        </label>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(
              e.target.value
                .replace(/\D/g, "")
            )
          }
          placeholder="000000"
          style={{
            ...styles.input,
            textAlign: "center",
            fontSize: "20px",
            letterSpacing: "7px",
            fontWeight: "900",
          }}
        />

        <button
          type="button"
          disabled={loading}
          onClick={verifySignupOtp}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "VERIFYING..."
            : "VERIFY EMAIL →"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          {cooldown > 0 ? (
            <span
              style={{
                color: "#999",
                fontSize: "9px",
                fontWeight: "700",
              }}
            >
              Resend OTP in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              style={styles.link}
              onClick={sendSignupOtp}
            >
              Resend OTP
            </button>
          )}
        </div>

      </div>

      <div style={styles.switchText}>
        Wrong email?{" "}
        <button
          type="button"
          style={styles.switchButton}
          onClick={() =>
            setStep("form")
          }
        >
          Change Email
        </button>
      </div>
    </>
  );


  /* ======================================================
     SIGNUP PASSWORD
     ====================================================== */

  const renderSignupPassword = () => (
    <>
      <div style={styles.eyebrow}>
        SECURE YOUR ACCOUNT
      </div>

      <h1 style={styles.title}>
        Create your password.
      </h1>

      <p style={styles.subtitle}>
        Your email has been verified.
        Set a secure password to finish
        creating your account.
      </p>

      <form
        onSubmit={handleSignup}
        style={styles.form}
      >

        <label style={styles.label}>
          PASSWORD
        </label>

        <div style={styles.passwordWrap}>
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            style={{
              ...styles.input,
              ...styles.passwordInput,
            }}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (value) => !value
              )
            }
            style={styles.showButton}
          >
            {showPassword
              ? "HIDE"
              : "SHOW"}
          </button>
        </div>

        <label style={styles.label}>
          CONFIRM PASSWORD
        </label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          placeholder="Re-enter password"
          autoComplete="new-password"
          style={styles.input}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "CREATING ACCOUNT..."
            : "CREATE ACCOUNT →"}
        </button>

      </form>
    </>
  );


  /* ======================================================
     FORGOT PASSWORD - EMAIL
     ====================================================== */

  const renderForgot = () => (
    <>
      <div style={styles.eyebrow}>
        ACCOUNT RECOVERY
      </div>

      <h1 style={styles.title}>
        Reset your password.
      </h1>

      <p style={styles.subtitle}>
        Enter your registered email and
        we'll send you a verification OTP.
      </p>

      <div style={styles.form}>

        <label style={styles.label}>
          EMAIL ADDRESS
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="you@example.com"
          autoComplete="email"
          style={styles.input}
        />

        <button
          type="button"
          disabled={loading}
          onClick={sendForgotOtp}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "SENDING OTP..."
            : "SEND RESET OTP →"}
        </button>

      </div>

      <div style={styles.switchText}>
        Remember your password?{" "}
        <button
          type="button"
          style={styles.switchButton}
          onClick={() =>
            changeMode("signin")
          }
        >
          Sign In
        </button>
      </div>
    </>
  );


  /* ======================================================
     FORGOT PASSWORD - OTP
     ====================================================== */

  const renderForgotOtp = () => (
    <>
      <div style={styles.eyebrow}>
        ACCOUNT RECOVERY
      </div>

      <h1 style={styles.title}>
        Verify your email.
      </h1>

      <p style={styles.subtitle}>
        Enter the OTP sent to:
        <br />
        <strong>
          {email}
        </strong>
      </p>

      <div style={styles.form}>

        <label style={styles.label}>
          6-DIGIT OTP
        </label>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(
              e.target.value
                .replace(/\D/g, "")
            )
          }
          placeholder="000000"
          style={{
            ...styles.input,
            textAlign: "center",
            fontSize: "20px",
            letterSpacing: "7px",
            fontWeight: "900",
          }}
        />

        <button
          type="button"
          disabled={loading}
          onClick={verifyForgotOtp}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "VERIFYING..."
            : "VERIFY OTP →"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          {cooldown > 0 ? (
            <span
              style={{
                color: "#999",
                fontSize: "9px",
              }}
            >
              Resend OTP in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              style={styles.link}
              onClick={sendForgotOtp}
            >
              Resend OTP
            </button>
          )}
        </div>

      </div>
    </>
  );


  /* ======================================================
     NEW PASSWORD
     ====================================================== */

  const renderNewPassword = () => (
    <>
      <div style={styles.eyebrow}>
        NEW PASSWORD
      </div>

      <h1 style={styles.title}>
        Set a new password.
      </h1>

      <p style={styles.subtitle}>
        Create a new secure password for
        your SAMBHAV account.
      </p>

      <form
        onSubmit={resetPassword}
        style={styles.form}
      >

        <label style={styles.label}>
          NEW PASSWORD
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          style={styles.input}
        />

        <label style={styles.label}>
          CONFIRM PASSWORD
        </label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          placeholder="Re-enter password"
          autoComplete="new-password"
          style={styles.input}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.primary,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          {loading
            ? "RESETTING..."
            : "RESET PASSWORD →"}
        </button>

      </form>
    </>
  );


  /* ======================================================
     SCREEN SELECTOR
     ====================================================== */

  let content;

  if (mode === "signin") {
    content = renderSignin();
  }

  if (
    mode === "signup" &&
    step === "form"
  ) {
    content =
      renderSignupForm();
  }

  if (
    mode === "signup" &&
    step === "otp"
  ) {
    content =
      renderSignupOtp();
  }

  if (
    mode === "signup" &&
    step === "password"
  ) {
    content =
      renderSignupPassword();
  }

  if (
    mode === "forgot" &&
    step === "form"
  ) {
    content = renderForgot();
  }

  if (
    mode === "forgot" &&
    step === "forgotOtp"
  ) {
    content =
      renderForgotOtp();
  }

  if (
    mode === "forgot" &&
    step === "newPassword"
  ) {
    content =
      renderNewPassword();
  }


  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>

        <header style={styles.top}>
          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div style={styles.brand}>
              SAMBHAV{" "}
              <span style={styles.gold}>
                UPSC
              </span>
            </div>

            <div style={styles.brandSub}>
              Intelligence • Preparation • Performance
            </div>
          </a>

          <a
            href="/"
            style={styles.back}
          >
            ← Explore
          </a>
        </header>


        <section style={styles.card}>

          {content}

          {message && (
            <div style={styles.message}>
              ✓ {message}
            </div>
          )}

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

        </section>


        <div style={styles.footer}>
          <div>
            SAMBHAV UPSC
          </div>

          <div>
            Your preparation. Your SAMBHAV.
          </div>
        </div>

      </div>
    </main>
  );
}
