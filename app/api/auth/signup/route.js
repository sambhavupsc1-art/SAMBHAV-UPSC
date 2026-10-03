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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 64, "sha512")
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
    const firstName = String(body.firstName || "").trim();
    const username = String(body.username || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid email is required.",
        },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          message: passwordError,
        },
        { status: 400 }
      );
    }

    if (!firstName) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Signup user lookup error:", lookupError);

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

    const passwordHash = hashPassword(password);

    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        email,
        first_name: firstName,
        username: username || null,
        password_hash: passwordHash,
        status: "approved",
        plan: "free",
      })
      .select(
        "id,email,first_name,username,status,plan,created_at"
      )
      .single();

    if (createError) {
      console.error("Signup creation error:", createError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to create account.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during signup.",
      },
      { status: 500 }
    );
  }
}
