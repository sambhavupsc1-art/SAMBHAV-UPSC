import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp(otp) {
  const secret = process.env.OTP_HASH_SECRET;

  if (!secret) {
    throw new Error("OTP_HASH_SECRET is missing.");
  }

  return crypto
    .createHash("sha256")
    .update(`${otp}:${secret}`)
    .digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const email = normalizeEmail(body.email);
    const purpose = String(body.purpose || "signup")
      .trim()
      .toLowerCase();

    /*
     * ----------------------------------------
     * VALIDATE EMAIL
     * ----------------------------------------
     */

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid email is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * VALIDATE PURPOSE
     * ----------------------------------------
     */

    if (
      purpose !== "signup" &&
      purpose !== "forgot_password"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP purpose.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    /*
     * ----------------------------------------
     * CHECK ACCOUNT
     * ----------------------------------------
     */

    const { data: existingUser, error: userError } =
      await supabase
        .from("users")
        .select("id,email")
        .eq("email", email)
        .maybeSingle();

    if (userError) {
      console.error(
        "User lookup error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to check account.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * SIGNUP
     * ----------------------------------------
     *
     * Signup requires email that does NOT
     * already have an account.
     */

    if (
      purpose === "signup" &&
      existingUser
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * ----------------------------------------
     * FORGOT PASSWORD
     * ----------------------------------------
     *
     * Forgot password requires an existing
     * SAMBHAV account.
     */

    if (
      purpose === "forgot_password" &&
      !existingUser
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No SAMBHAV account exists with this email.",
        },
        { status: 404 }
      );
    }

    /*
     * ----------------------------------------
     * RATE LIMIT
     * ----------------------------------------
     *
     * Same email:
     * maximum one OTP request every 60 sec.
     */

    const { data: recentOtp, error: recentOtpError } =
      await supabase
        .from("email_otps")
        .select("created_at")
        .eq("email", email)
        .is("verified_at", null)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (recentOtpError) {
      console.error(
        "Recent OTP lookup error:",
        recentOtpError
      );
    }

    if (recentOtp) {
      const secondsSinceLast =
        (Date.now() -
          new Date(
            recentOtp.created_at
          ).getTime()) /
        1000;

      if (secondsSinceLast < 60) {
        const remaining = Math.ceil(
          60 - secondsSinceLast
        );

        return NextResponse.json(
          {
            success: false,
            message:
              `Please wait ${remaining} seconds before requesting another OTP.`,
          },
          { status: 429 }
        );
      }
    }

    /*
     * ----------------------------------------
     * INVALIDATE OLD OTPs
     * ----------------------------------------
     */

    await supabase
      .from("email_otps")
      .update({
        verified_at:
          new Date().toISOString(),
      })
      .eq("email", email)
      .is("verified_at", null);

    /*
     * ----------------------------------------
     * GENERATE OTP
     * ----------------------------------------
     */

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpHash = hashOtp(otp);

    const expiresAt = new Date(
      Date.now() +
        10 * 60 * 1000
    ).toISOString();

    /*
     * ----------------------------------------
     * SAVE OTP
     * ----------------------------------------
     */

    const { error: insertError } =
      await supabase
        .from("email_otps")
        .insert({
          email,
          otp_hash: otpHash,
          expires_at: expiresAt,
          attempts: 0,
        });

    if (insertError) {
      console.error(
        "OTP insert error:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create OTP.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * BREVO
     * ----------------------------------------
     */

    const brevoApiKey =
      process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
      throw new Error(
        "BREVO_API_KEY is missing."
      );
    }

    const emailSubject =
      purpose === "forgot_password"
        ? "SAMBHAV UPSC Password Reset Code"
        : "Your SAMBHAV UPSC Verification Code";

    const emailHeading =
      purpose === "forgot_password"
        ? "Reset your SAMBHAV password"
        : "Verify your SAMBHAV email";

    const emailDescription =
      purpose === "forgot_password"
        ? "Use the verification code below to reset your SAMBHAV UPSC password."
        : "Your email verification code is:";

    const brevoResponse =
      await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",

          headers: {
            accept:
              "application/json",

            "api-key":
              brevoApiKey,

            "content-type":
              "application/json",
          },

          body: JSON.stringify({
            sender: {
              name: "SAMBHAV UPSC",
              email:
                "sambhavupsc1@gmail.com",
            },

            to: [
              {
                email,
              },
            ],

            subject:
              emailSubject,

            htmlContent: `
<!DOCTYPE html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#f5f7fa;
      font-family:Arial,sans-serif;
    "
  >

    <div
      style="
        max-width:600px;
        margin:40px auto;
        background:#ffffff;
        border-radius:16px;
        padding:32px;
      "
    >

      <h2
        style="
          margin:0 0 10px;
          color:#0b1f33;
        "
      >
        SAMBHAV UPSC
      </h2>

      <p
        style="
          color:#555;
          font-size:16px;
        "
      >
        ${emailHeading}
      </p>

      <p
        style="
          color:#555;
          font-size:15px;
        "
      >
        ${emailDescription}
      </p>

      <div
        style="
          margin:25px 0;
          padding:18px;
          background:#0b1f33;
          border-radius:12px;
          text-align:center;
        "
      >

        <span
          style="
            font-size:32px;
            letter-spacing:10px;
            font-weight:bold;
            color:#e4b936;
          "
        >
          ${otp}
        </span>

      </div>

      <p
        style="
          color:#666;
          font-size:14px;
        "
      >
        This OTP is valid for 10 minutes.
      </p>

      <p
        style="
          color:#999;
          font-size:13px;
        "
      >
        If you did not request this code,
        you can safely ignore this email.
      </p>

    </div>

  </body>
</html>
            `,
          }),
        }
      );

    /*
     * ----------------------------------------
     * BREVO ERROR
     * ----------------------------------------
     */

    if (!brevoResponse.ok) {
      const errorText =
        await brevoResponse.text();

      console.error(
        "Brevo API error:",
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to send verification email.",
        },
        { status: 500 }
      );
    }

    const brevoResult =
      await brevoResponse
        .json()
        .catch(() => null);

    console.log(
      "Brevo OTP email sent:",
      brevoResult
    );

    /*
     * ----------------------------------------
     * SUCCESS
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        purpose ===
        "forgot_password"
          ? "Password reset OTP sent successfully."
          : "OTP sent successfully.",

      purpose,
    });

  } catch (error) {
    console.error(
      "Send OTP error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while sending OTP.",
      },
      { status: 500 }
    );
  }
}
