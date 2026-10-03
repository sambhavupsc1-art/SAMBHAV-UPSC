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

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid email is required.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check if account already exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("User lookup error:", userError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to check account.",
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Rate limit: 60 seconds
    const { data: recentOtp } = await supabase
      .from("email_otps")
      .select("created_at")
      .eq("email", email)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const secondsSinceLast =
        (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000;

      if (secondsSinceLast < 60) {
        const remaining = Math.ceil(60 - secondsSinceLast);

        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remaining} seconds before requesting another OTP.`,
          },
          { status: 429 }
        );
      }
    }

    // Invalidate previous unverified OTPs
    await supabase
      .from("email_otps")
      .update({
        verified_at: new Date().toISOString(),
      })
      .eq("email", email)
      .is("verified_at", null);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = hashOtp(otp);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

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
          message: "Unable to create OTP.",
        },
        { status: 500 }
      );
    }

    // Brevo API
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is missing.");
    }

    const brevoResponse = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "SAMBHAV UPSC",
            email: "sambhavupsc1@gmail.com",
          },
          to: [
            {
              email,
            },
          ],
          subject: "Your SAMBHAV UPSC Verification Code",
          htmlContent: `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
                <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;padding:32px;">
                  
                  <h2 style="margin:0 0 10px;color:#0b1f33;">
                    SAMBHAV UPSC
                  </h2>

                  <p style="color:#555;font-size:16px;">
                    Your email verification code is:
                  </p>

                  <div style="
                    margin:25px 0;
                    padding:18px;
                    background:#0b1f33;
                    border-radius:12px;
                    text-align:center;
                  ">
                    <span style="
                      font-size:32px;
                      letter-spacing:10px;
                      font-weight:bold;
                      color:#e4b936;
                    ">
                      ${otp}
                    </span>
                  </div>

                  <p style="color:#666;font-size:14px;">
                    This OTP is valid for 10 minutes.
                  </p>

                  <p style="color:#999;font-size:13px;">
                    If you did not request this code, you can safely ignore this email.
                  </p>

                </div>
              </body>
            </html>
          `,
        }),
      }
    );

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();

      console.error("Brevo API error:", errorText);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send verification email.",
        },
        { status: 500 }
      );
    }

    const brevoResult = await brevoResponse.json();

    console.log("Brevo OTP email sent:", brevoResult);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending OTP.",
      },
      { status: 500 }
    );
  }
}
