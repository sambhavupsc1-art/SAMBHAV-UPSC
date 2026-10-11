
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

function verify(token) {
  try {
    if (!token || !SESSION_SECRET) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return data?.userId && data?.exp && Date.now() <= data.exp
      ? data
      : null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SESSION_SECRET) {
    return { error: "Server environment is not configured.", status: 500 };
  }

  const cookieStore = await cookies();
  const session = verify(cookieStore.get("sambhav_session")?.value);

  if (!session) {
    return { error: "Admin access denied.", status: 403 };
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(
      session.userId
    )}&is_active=eq.true&select=id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return { error: "Could not verify admin access.", status: 500 };
  }

  const rows = await response.json();

  return rows.length
    ? { userId: session.userId }
    : { error: "Admin access denied.", status: 403 };
}

async function storageRequest(path, options = {}) {
  return fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    },
    cache: "no-store",
  });
}

async function restRequest(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    },
    cache: "no-store",
  });
}

export async function POST(request) {
  let uploadedPath = null;
  let bucket = process.env.ADMIN_CONTENT_BUCKET || "study-materials";

  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") || "").trim();
    const category = String(
      form.get("category") || "Study Material"
    ).trim();

    const subject = String(form.get("subject") || category).trim();
    const topic = String(form.get("topic") || "").trim();
    const language = String(form.get("language") || "Hindi").trim();
    const examType = String(
      form.get("exam_type") || "Prelims & Mains"
    ).trim();
    const description = String(form.get("description") || "").trim();

    if (!file || typeof file.arrayBuffer !== "function" || !title) {
      return NextResponse.json(
        { success: false, error: "A title and file are required." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "The selected file is empty." },
        { status: 400 }
      );
    }

    // Vercel route uploads are limited; large PDFs need direct/resumable upload.
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This route supports files up to 4 MB. Larger PDFs require direct/resumable Supabase Storage upload.",
        },
        { status: 413 }
      );
    }

    const safeName = String(file.name || "upload.bin")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100);

    // Unique name prevents conflicts with existing files.
    uploadedPath = `admin-uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const encodedPath = uploadedPath
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const upload = await storageRequest(
      `object/${encodeURIComponent(bucket)}/${encodedPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "false",
        },
        body: Buffer.from(await file.arrayBuffer()),
      }
    );

    if (!upload.ok) {
      const detail = (await upload.text()).slice(0, 400);
      uploadedPath = null;

      return NextResponse.json(
        {
          success: false,
          error: `Storage upload failed (${upload.status}). Check bucket "${bucket}" and server credentials. ${detail}`,
        },
        { status: 502 }
      );
    }

    // Requires public.study_materials with the columns used below.
    const metadata = await restRequest("study_materials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title,
        category,
        subject,
        topic,
        language,
        exam_type: examType,
        description,
        bucket,
        storage_path: uploadedPath,
        published: true,
        created_by: auth.userId,
      }),
    });

    if (!metadata.ok) {
      const detail = (await metadata.text()).slice(0, 600);

      // Remove the uploaded object if its database record cannot be saved.
      await storageRequest(`object/${encodeURIComponent(bucket)}/${encodedPath}`, {
        method: "DELETE",
      }).catch(() => {});

      uploadedPath = null;

      return NextResponse.json(
        {
          success: false,
          error:
            "PDF upload succeeded but metadata could not be saved. Verify the study_materials table schema. " +
            detail,
        },
        { status: 502 }
      );
    }

    const rows = await metadata.json();

    return NextResponse.json({
      success: true,
      title,
      category,
      bucket,
      path: uploadedPath,
      material: rows?.[0] || null,
      message: "File uploaded and Study Material metadata saved.",
    });
  } catch (error) {
    console.error("Admin content upload:", error);

    return NextResponse.json(
      { success: false, error: "Content upload failed. Check server logs." },
      { status: 500 }
    );
  }
}
