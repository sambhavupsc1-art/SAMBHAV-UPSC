import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const AUTH_SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET;

/* =========================================================
   SUPABASE REQUEST
========================================================= */

async function supabaseFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

/* =========================================================
   VERIFY WEBSITE SESSION
========================================================= */

function verifyEmailSession(token) {
  try {
    if (!token || !AUTH_SESSION_SECRET) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (!data?.userId || !data?.exp) {
      return null;
    }

    if (Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

/* =========================================================
   GET LOGGED-IN USER
========================================================= */

async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionCookie =
    cookieStore.get("sambhav_session");

  if (!sessionCookie?.value) {
    return null;
  }

  const session = verifyEmailSession(
    sessionCookie.value
  );

  if (!session?.userId) {
    return null;
  }

  const response = await supabaseFetch(
    `users?id=eq.${encodeURIComponent(
      session.userId
    )}&select=id,email,telegram_id,first_name,username,status,plan,created_at,approved_at,approved_by,last_login_at,updated_at`
  );

  if (!response.ok) {
    console.error(
      "Current user lookup failed:",
      await response.text()
    );

    return null;
  }

  const users = await response.json();

  return users.length ? users[0] : null;
}

/* =========================================================
   VERIFY ADMIN
========================================================= */

async function getAdmin(user) {
  if (!user?.id) {
    return null;
  }

  /*
   * Primary admin check:
   * admin_users.user_id
   *
   * Email fallback is also supported.
   */

  let response = await supabaseFetch(
    `admin_users?user_id=eq.${encodeURIComponent(
      user.id
    )}&is_active=eq.true&select=id,user_id,email,telegram_id,first_name,username`
  );

  if (response.ok) {
    const admins = await response.json();

    if (admins.length > 0) {
      return admins[0];
    }
  }

  /*
   * Email fallback
   */

  if (user.email) {
    response = await supabaseFetch(
      `admin_users?email=ilike.${encodeURIComponent(
        user.email
      )}&is_active=eq.true&select=id,user_id,email,telegram_id,first_name,username`
    );

    if (response.ok) {
      const admins = await response.json();

      if (admins.length > 0) {
        return admins[0];
      }
    }
  }

  return null;
}

/* =========================================================
   ACTIVE SUBSCRIPTION
========================================================= */

async function getActiveSubscription(userId) {
  const now = new Date().toISOString();

  const response = await supabaseFetch(
    `subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.active&expires_at=gt.${encodeURIComponent(
      now
    )}&select=id,plan,status,amount,started_at,expires_at,order_id,payment_id&order=expires_at.desc&limit=1`
  );

  if (!response.ok) {
    console.error(
      "Subscription lookup failed:",
      await response.text()
    );

    return null;
  }

  const subscriptions = await response.json();

  return subscriptions.length
    ? subscriptions[0]
    : null;
}

/* =========================================================
   ADMIN AUTH
========================================================= */

async function authenticateAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const admin = await getAdmin(user);

  if (!admin) {
    return null;
  }

  return {
    user,
    admin,
  };
}

/* =========================================================
   GET USERS
========================================================= */

export async function GET() {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !AUTH_SESSION_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Required environment variables are missing",
        },
        { status: 500 }
      );
    }

    const auth = await authenticateAdmin();

    if (!auth) {
      return NextResponse.json(
        {
          error: "Admin access denied",
        },
        { status: 403 }
      );
    }

    const response = await supabaseFetch(
      "users?select=id,email,telegram_id,first_name,username,status,plan,created_at,approved_at,approved_by,last_login_at,updated_at&order=created_at.desc"
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Users fetch error:",
        errorText
      );

      return NextResponse.json(
        {
          error: "Failed to fetch users",
        },
        { status: 500 }
      );
    }

    const users = await response.json();

    /*
     * Attach active subscription information
     */

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const subscription =
          await getActiveSubscription(user.id);

        const premiumActive =
          subscription?.status === "active" &&
          subscription?.expires_at &&
          new Date(subscription.expires_at) >
            new Date();

        return {
          ...user,

          subscription:
            subscription || null,

          premium_active:
            Boolean(premiumActive),

          premium_plan:
            subscription?.plan || null,

          premium_expires_at:
            subscription?.expires_at || null,

          payment_id:
            subscription?.payment_id || null,

          order_id:
            subscription?.order_id || null,

          subscription_amount:
            subscription?.amount ?? null,

          subscription_started_at:
            subscription?.started_at || null,
        };
      })
    );

    return NextResponse.json({
      success: true,

      users: enrichedUsers,

      admin: {
        id: auth.admin.id,
        email: auth.admin.email || auth.user.email,
        user_id:
          auth.admin.user_id ||
          auth.user.id,
      },
    });
  } catch (error) {
    console.error(
      "Admin GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE USER STATUS
========================================================= */

export async function POST(request) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !AUTH_SESSION_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Required environment variables are missing",
        },
        { status: 500 }
      );
    }

    const auth = await authenticateAdmin();

    if (!auth) {
      return NextResponse.json(
        {
          error: "Admin access denied",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId = body.user_id
      ? String(body.user_id)
      : null;

    const status = body.status;

    if (!userId) {
      return NextResponse.json(
        {
          error: "user_id is required",
        },
        { status: 400 }
      );
    }

    if (
      ![
        "approved",
        "rejected",
        "banned",
      ].includes(status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid status",
        },
        { status: 400 }
      );
    }

    const updateData = {
      status,

      approved_at:
        status === "approved"
          ? new Date().toISOString()
          : null,

      approved_by:
        status === "approved"
          ? auth.admin.id
          : null,
    };

    const response = await supabaseFetch(
      `users?id=eq.${encodeURIComponent(
        userId
      )}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Prefer:
            "return=representation",
        },

        body: JSON.stringify(
          updateData
        ),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "User update error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "User update failed",
        },
        { status: 500 }
      );
    }

    const updatedUsers =
      await response.json();

    return NextResponse.json({
      success: true,

      status,

      user:
        updatedUsers?.[0] ||
        null,
    });
  } catch (error) {
    console.error(
      "Admin POST error:",
      error
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
