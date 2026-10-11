
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;
const BUCKET = process.env.ADMIN_CONTENT_BUCKET || "study-materials";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data?.userId && data?.exp && Date.now() <= data.exp ? data : null;
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
  if (!session) return { error: "Admin access denied.", status: 403 };

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

function safeFileName(name) {
  const cleaned = String(name || "upload.bin")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(-100);
  return cleaned || "upload.bin";
}

function encodedStoragePath(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await readJson(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (body.action === "list") {
      const materialsResponse = await restRequest(
        "study_materials?select=id,title,category,subject,topic,language,exam_type,description,bucket,storage_path,published,created_at&order=created_at.desc&limit=500",
        { method: "GET" }
      );
      if (!materialsResponse.ok) {
        const detail = (await materialsResponse.text()).slice(0, 400);
        return NextResponse.json(
          { success: false, error: `Could not load Study Material records. ${detail}` },
          { status: 502 }
        );
      }

      const materials = await materialsResponse.json();
      const foldersResponse = await storageRequest(
        `object/list/${encodeURIComponent(BUCKET)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prefix: "admin-folders", limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
        }
      );
      let folders = [];
      if (foldersResponse.ok) {
        const entries = await foldersResponse.json();
        folders = (Array.isArray(entries) ? entries : [])
          .filter((entry) => entry && entry.id == null && entry.name && entry.name !== ".keep")
          .map((entry) => String(entry.name))
          .filter((name) => name !== "." && name !== "..");
      }

      return NextResponse.json({
        success: true,
        items: Array.isArray(materials) ? materials : [],
        folders,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "create-folder") {
      const rawName = String(body.name || "").trim();
      const name = rawName
        .normalize("NFKC")
        .replace(/[\\/\\\\:*?"<>|#%{}^~[\\]`]/g, "-")
        .replace(/\\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-.]+|[-.]+$/g, "")
        .slice(0, 60);

      if (!name || name.toLowerCase() === "admin-uploads" || name.toLowerCase() === "admin-folders") {
        return NextResponse.json(
          { success: false, error: "Enter a valid folder name (letters, numbers, spaces, hyphens and underscores)." },
          { status: 400 }
        );
      }

      const folderObjectPath = `admin-folders/${name}/.keep`;
      const existing = await storageRequest(
        `object/info/${encodeURIComponent(BUCKET)}/${encodedStoragePath(folderObjectPath)}`,
        { method: "GET" }
      );
      if (existing.ok) {
        return NextResponse.json({ success: false, error: "A folder with this name already exists." }, { status: 409 });
      }

      const created = await storageRequest(
        `object/${encodeURIComponent(BUCKET)}/${encodedStoragePath(folderObjectPath)}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain", "x-upsert": "false" },
          body: "SAMBHAV UPSC folder marker",
        }
      );
      if (!created.ok) {
        const detail = (await created.text()).slice(0, 350);
        return NextResponse.json(
          { success: false, error: `Could not create folder marker in Supabase Storage. ${detail}` },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, name, path: folderObjectPath, message: "Folder created." });
    }

    if (body.action === "delete-content") {
      const id = String(body.id || "").trim();
      if (!id || id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return NextResponse.json({ success: false, error: "A valid content record ID is required." }, { status: 400 });
      }

      const lookup = await restRequest(
        `study_materials?id=eq.${encodeURIComponent(id)}&select=id,title,bucket,storage_path&limit=1`,
        { method: "GET" }
      );
      if (!lookup.ok) {
        const detail = (await lookup.text()).slice(0, 300);
        return NextResponse.json({ success: false, error: `Could not find content record. ${detail}` }, { status: 502 });
      }
      const rows = await lookup.json();
      const item = rows?.[0];
      if (!item) {
        return NextResponse.json({ success: false, error: "Content record was not found; refresh the library." }, { status: 404 });
      }

      const deletedRecord = await restRequest(
        `study_materials?id=eq.${encodeURIComponent(id)}`,
        { method: "DELETE", headers: { Prefer: "return=representation" } }
      );
      if (!deletedRecord.ok) {
        const detail = (await deletedRecord.text()).slice(0, 350);
        return NextResponse.json({ success: false, error: `Database record could not be deleted. ${detail}` }, { status: 502 });
      }

      let warning = "";
      if (item.bucket && item.storage_path) {
        const removed = await storageRequest(
          `object/${encodeURIComponent(item.bucket)}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: [String(item.storage_path)] }),
          }
        );
        if (!removed.ok) {
          const detail = (await removed.text()).slice(0, 250);
          warning = `Content record deleted from the library, but storage cleanup failed. Remove ${item.bucket}/${item.storage_path} manually. ${detail}`;
        }
      }
      return NextResponse.json({
        success: true,
        deletedId: id,
        title: item.title || "",
        warning,
        message: warning || "Content record and associated storage object deleted.",
      });
    }

    if (body.action === "sign") {
      if (!SUPABASE_ANON_KEY) {
        return NextResponse.json(
          {
            success: false,
            error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.",
          },
          { status: 500 }
        );
      }

      const size = Number(body.size);
      const fileName = safeFileName(body.fileName);

      if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "File size must be greater than 0 and no more than 50 MB.",
          },
          { status: 413 }
        );
      }

      const uploadedPath = `admin-uploads/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
      const encodedPath = encodedStoragePath(uploadedPath);

      const signed = await storageRequest(
        `object/upload/sign/${encodeURIComponent(BUCKET)}/${encodedPath}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upsert: false }),
        }
      );

      if (!signed.ok) {
        const detail = (await signed.text()).slice(0, 350);
        return NextResponse.json(
          {
            success: false,
            error: `Could not create signed upload (${signed.status}). Check the "${BUCKET}" bucket and Supabase configuration. ${detail}`,
          },
          { status: 502 }
        );
      }

      const signedData = await signed.json();
      const signedPath =
        signedData.signedURL ||
        signedData.signedUrl ||
        signedData.url;
      const token = signedData.token;

      if (!signedPath && !token) {
        return NextResponse.json(
          {
            success: false,
            error: "Supabase did not return a signed upload token.",
          },
          { status: 502 }
        );
      }

      let uploadUrl;

      if (signedPath && /^https?:\/\//i.test(signedPath)) {
        uploadUrl = signedPath;
      } else if (signedPath) {
        uploadUrl = `${SUPABASE_URL}/storage/v1/${String(signedPath).replace(/^\/+/, "")}`;
      } else {
        uploadUrl = `${SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(
          BUCKET
        )}/${encodedPath}?token=${encodeURIComponent(token)}`;
      }

      return NextResponse.json({
        success: true,
        uploadUrl,
        anonKey: SUPABASE_ANON_KEY,
        bucket: BUCKET,
        path: uploadedPath,
        maxBytes: MAX_UPLOAD_BYTES,
      });
    }

    if (body.action === "finalize") {
      const title = String(body.title || "").trim().slice(0, 250);
      const category = String(body.category || "Study Material")
        .trim()
        .slice(0, 100);
      const path = String(body.path || "");
      const bucket = String(body.bucket || BUCKET);

      if (
        !title ||
        !path ||
        bucket !== BUCKET ||
        !path.startsWith("admin-uploads/")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Title or upload details are invalid.",
          },
          { status: 400 }
        );
      }

      const fileName = safeFileName(body.fileName);
      const size = Number(body.size);

      if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "File size must be greater than 0 and no more than 50 MB.",
          },
          { status: 413 }
        );
      }

      const objectCheck = await storageRequest(
        `object/info/${encodeURIComponent(bucket)}/${encodedStoragePath(path)}`,
        { method: "GET" }
      );

      if (!objectCheck.ok) {
        const detail = (await objectCheck.text()).slice(0, 250);
        return NextResponse.json(
          {
            success: false,
            error: `Uploaded file could not be verified in storage. ${detail}`,
          },
          { status: 400 }
        );
      }

      const metadata = await restRequest("study_materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          title,
          category,
          subject: category,
          topic: "",
          language: "Hindi",
          exam_type: "Prelims & Mains",
          description: "",
          bucket,
          storage_path: path,
          published: true,
          created_by: auth.userId,
        }),
      });

      if (!metadata.ok) {
        const detail = (await metadata.text()).slice(0, 500);
        return NextResponse.json(
          {
            success: false,
            error:
              "File reached storage, but Study Material details could not be saved. " +
              detail,
            path,
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
        path,
        material: rows?.[0] || null,
        message: "File uploaded and Study Material metadata saved.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported upload action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin content upload:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Content upload failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}
