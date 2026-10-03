import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(`${otp}:${process.env.OTP_HASH_SECRET || "sambhav-otp-secret"}`)
    .digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid email address required.",
        },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address is too long.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // ---------------------------------------------------
    // Rate limit: latest OTP request must be at least
    // 60 seconds old.
    // ---------------------------------------------------

    const { data: recentOtp, error: recentError } =
      await supabase
        .from("email_otps")
        .select("id, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (recentError) {
      console.error("OTP recent lookup error:", recentError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to process OTP request.",
        },
        { status: 500 }
      );
    }

    if (recentOtp?.created_at) {
      const createdAt = new Date(recentOtp.created_at).getTime();
      const elapsed = Date.now() - createdAt;

      if (elapsed < 60 * 1000) {
        const remaining = Math.ceil(
          (60 * 1000 - elapsed) / 1000
        );

        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${remaining} seconds before requesting another OTP.`,
            retry_after: remaining,
          },
          { status: 429 }
        );
      }
    }

    // ---------------------------------------------------
    // Invalidate previous unused OTPs
    // ---------------------------------------------------

    await supabase
      .from("email_otps")
      .update({
        verified_at: new Date().toISOString(),
      })
      .eq("email", email)
      .is("verified_at", null);

    // ---------------------------------------------------
    // Generate OTP
    // ---------------------------------------------------

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = hashOtp(otp);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    // ---------------------------------------------------
    // Store only HASH
    // ---------------------------------------------------

    const { error: insertError } = await supabase
      .from("email_otps")
      .insert({
        email,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
      });

    if (insertError) {
      console.error("OTP insert error:", insertError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create OTP.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------
    // Send email using Resend
    // ---------------------------------------------------

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "SAMBHAV UPSC <onboarding@resend.dev>";

    if (!resendKey) {
      console.error("RESEND_API_KEY missing.");

      return NextResponse.json(
        {
          success: false,
          error:
            "Email service is not configured yet.",
        },
        { status: 500 }
      );
    }

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Your SAMBHAV UPSC verification code",
          html: `
            <div style="margin:0;padding:40px 20px;background:#f5f2eb;font-family:Arial,sans-serif;">
              <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e7e1d5;">
                
                <div style="font-size:11px;letter-spacing:4px;font-weight:800;color:#a88745;">
                  SAMBHAV
                </div>

                <div style="font-size:30px;font-weight:900;color:#111;margin-top:4px;">
                  UPSC
                </div>

                <p style="color:#777;font-size:14px;line-height:1.6;margin-top:24px;">
                  Use the verification code below to continue with your SAMBHAV UPSC account.
                </p>

                <div style="margin:26px 0;padding:20px;text-align:center;background:#111;border-radius:18px;">
                  <div style="font-size:34px;letter-spacing:10px;font-weight:900;color:#e2c77d;">
                    ${otp}
                  </div>
                </div>

                <p style="font-size:12px;color:#777;">
                  This code expires in <strong>10 minutes</strong>.
                </p>

                <p style="font-size:11px;color:#aaa;margin-top:28px;">
                  If you did not request this code, you can safely ignore this email.
                </p>

              </div>
            </div>
          `,
        }),
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        "Resend API error:",
        resendData
      );

      return NextResponse.json(
        {
          success: false,
          error: "OTP email could not be sent.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
      expires_in: 600,
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to send OTP.",
      },
      { status: 500 }
    );
  }
}
