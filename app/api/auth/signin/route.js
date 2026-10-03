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

function verifyPassword(password, storedHash) {
  try {
    const [salt, originalHash] = String(storedHash).split(":");

    if (!salt || !originalHash) {
      return false;
    }

    const calculatedHash = crypto
      .pbkdf2Sync(password, salt, 120000, 64, "sha512")
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

function createSessionToken(user) {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is missing.");
  }

  const payload = {
    userId: user.id,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload)
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id,email,first_name,username,status,plan,password_hash,created_at"
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Signin lookup error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to sign in.",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account does not have a password yet. Please complete signup.",
        },
        { status: 400 }
      );
    }

    const passwordValid = verifyPassword(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Last login update error:", updateError);
    }

    const sessionToken = createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        username: user.username,
        status: user.status,
        plan: user.plan,
      },
    });

    response.cookies.set({
      name: "sambhav_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during sign in.",
      },
      { status: 500 }
    );
  }
}
