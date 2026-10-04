import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

function verifyEmailSession(token) {
  try {
    const secret =
      process.env.AUTH_SESSION_SECRET;

    if (!secret) {
      return {
        valid: false,
        reason: "AUTH_SESSION_SECRET missing",
      };
    }

    if (!token) {
      return {
        valid: false,
        reason: "Session token missing",
      };
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return {
        valid: false,
        reason: "Invalid token format",
      };
    }

    const [payload, signature] = parts;

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64url");

    if (
      signature.length !==
      expectedSignature.length
    ) {
      return {
        valid: false,
        reason: "Signature length mismatch",
      };
    }

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return {
        valid: false,
        reason: "Signature mismatch",
      };
    }

    const data =
      JSON.parse(
        Buffer.from(
          payload,
          "base64url"
        ).toString("utf8")
      );

    if (!data?.userId) {
      return {
        valid: false,
        reason: "userId missing",
      };
    }

    if (
      !data?.exp ||
      Date.now() > data.exp
    ) {
      return {
        valid: false,
        reason: "Session expired",
      };
    }

    return {
      valid: true,
      userId: data.userId,
    };
  } catch (error) {
    return {
      valid: false,
      reason:
        error?.message ||
        "Session verification exception",
    };
  }
}

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const sessionCookie =
      cookieStore.get(
        "sambhav_session"
      );

    if (!sessionCookie?.value) {
      return NextResponse.json({
        cookie: false,
        session: false,
        user: false,
        reason: "Cookie not found",
      });
    }

    const session =
      verifyEmailSession(
        sessionCookie.value
      );

    if (!session.valid) {
      return NextResponse.json({
        cookie: true,
        session: false,
        user: false,
        reason: session.reason,
      });
    }

    let userFound = false;

    if (
      SUPABASE_URL &&
      SUPABASE_SECRET_KEY
    ) {
      const response =
        await fetch(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
            session.userId
          )}&select=id,email,status,plan`,
          {
            headers: {
              apikey:
                SUPABASE_SECRET_KEY,

              Authorization:
                `Bearer ${SUPABASE_SECRET_KEY}`,
            },

            cache: "no-store",
          }
        );

      if (response.ok) {
        const users =
          await response.json();

        userFound =
          Array.isArray(users) &&
          users.length > 0;
      }
    }

    return NextResponse.json({
      cookie: true,

      session: true,

      user: userFound,

      userIdPresent: true,

      reason: userFound
        ? "Authentication chain is valid"
        : "Session valid but user not found",
    });
  } catch (error) {
    return NextResponse.json(
      {
        cookie: false,
        session: false,
        user: false,
        reason:
          error?.message ||
          "Diagnostic failed",
      },
      {
        status: 500,
      }
    );
  }
}
