import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function hashPassword(password) {
  const salt = crypto
    .randomBytes(16)
    .toString("hex");

  const hash = crypto
    .pbkdf2Sync(
      password,
      salt,
      120000,
      64,
      "sha512"
    )
    .toString("hex");

  return `${salt}:${hash}`;
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const otp = String(body.otp || "").trim();

    /*
     * ----------------------------------------
     * EMAIL
     * ----------------------------------------
     */

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid email is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * OTP
     * ----------------------------------------
     */

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please verify your email first.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * PASSWORD
     * ----------------------------------------
     */

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          error: passwordError,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    /*
     * ----------------------------------------
     * FIND USER
     * ----------------------------------------
     */

    const {
      data: user,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "id,email,status"
      )
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error(
        "Reset password user lookup error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to find account.",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No SAMBHAV account exists with this email.",
        },
        { status: 404 }
      );
    }

    /*
     * ----------------------------------------
     * CHECK VERIFIED OTP
     * ----------------------------------------
     *
     * The OTP must have been successfully
     * verified through /api/auth/verify-otp.
     */

    const {
      data: verifiedOtp,
      error: otpError,
    } = await supabase
      .from("email_otps")
      .select(
        "id,email,verified_at,expires_at"
      )
      .eq("email", email)
      .not(
        "verified_at",
        "is",
        null
      )
      .order(
        "verified_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error(
        "Reset password OTP lookup error:",
        otpError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify password reset request.",
        },
        { status: 500 }
      );
    }

    if (!verifiedOtp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please verify your OTP first.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * VERIFICATION EXPIRY
     * ----------------------------------------
     */

    const verifiedAt =
      new Date(
        verifiedOtp.verified_at
      ).getTime();

    if (
      !Number.isFinite(verifiedAt) ||
      Date.now() - verifiedAt >
        15 * 60 * 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password reset verification expired. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * HASH NEW PASSWORD
     * ----------------------------------------
     */

    const passwordHash =
      hashPassword(password);

    /*
     * ----------------------------------------
     * UPDATE PASSWORD
     * ----------------------------------------
     */

    const {
      data: updatedUser,
      error: updateError,
    } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", user.id)
      .select(
        "id,email,first_name,username,status,plan"
      )
      .single();

    if (updateError) {
      console.error(
        "Password update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to reset password.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * CONSUME VERIFIED OTP
     * ----------------------------------------
     *
     * Prevents the same verified OTP from
     * being reused for another reset.
     */

    const consumeOtpResponse =
      await supabase
        .from("email_otps")
        .update({
          verified_at: null,
        })
        .eq(
          "id",
          verifiedOtp.id
        );

    if (consumeOtpResponse.error) {
      console.error(
        "OTP cleanup error:",
        consumeOtpResponse.error
      );

      /*
       * Password is already changed.
       * Do not report reset as failed.
       */
    }

    /*
     * ----------------------------------------
     * SUCCESS
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while resetting your password.",
      },
      { status: 500 }
    );
  }
}
