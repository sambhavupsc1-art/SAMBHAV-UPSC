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
    const otp = String(body.otp || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid email is required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid 6-digit OTP.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: otpRecord, error: otpError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("OTP lookup error:", otpError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify OTP.",
        },
        { status: 500 }
      );
    }

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP not found. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please request a new OTP.",
        },
        { status: 429 }
      );
    }

    const submittedHash = hashOtp(otp);

    if (submittedHash !== otpRecord.otp_hash) {
      await supabase
        .from("email_otps")
        .update({
          attempts: otpRecord.attempts + 1,
        })
        .eq("id", otpRecord.id);

      return NextResponse.json(
        {
          success: false,
          message: "Incorrect OTP.",
        },
        { status: 400 }
      );
    }

    const { error: verifyError } = await supabase
      .from("email_otps")
      .update({
        verified_at: new Date().toISOString(),
      })
      .eq("id", otpRecord.id);

    if (verifyError) {
      console.error("OTP verification update error:", verifyError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to complete verification.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while verifying OTP.",
      },
      { status: 500 }
    );
  }
}
