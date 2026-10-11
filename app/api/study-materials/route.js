import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SECRET = process.env.AUTH_SESSION_SECRET;

function verify(token) {
  try {
    if (!token || !SECRET) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data?.userId && data?.exp && Date.now() <= data.exp ? data : null;
  } catch { return null; }
}

export async function GET(request) {
  try {
    if (!URL || !KEY || !SECRET) return NextResponse.json({ error: "Server environment is not configured." }, { status: 500 });
    const cookieStore = await cookies();
    const session = verify(cookieStore.get("sambhav_session")?.value);
    if (!session) return NextResponse.json({ error: "Please sign in to access Study Material." }, { status: 401 });

    const params = new URLSearchParams(new globalThis.URL(request.url).searchParams);
    const search = (params.get("q") || "").trim().slice(0, 100);
    const subject = (params.get("subject") || "").trim().slice(0, 80);
    const exam = (params.get("exam") || "").trim().slice(0, 40);
    const language = (params.get("language") || "").trim().slice(0, 30);
    const query = new URLSearchParams({ select: "id,title,category,subject,topic,language,exam_type,description,bucket,storage_path,created_at", published: "eq.true", order: "created_at.desc", limit: "500" });
    if (subject) query.set("subject", `eq.${subject}`);
    if (exam) query.set("exam_type", `eq.${exam}`);
    if (language) query.set("language", `eq.${language}`);
    if (search) query.set("or", `(title.ilike.*${search.replace(/[(),]/g, " ")}*,subject.ilike.*${search.replace(/[(),]/g, " ")}*,topic.ilike.*${search.replace(/[(),]/g, " ")}*,description.ilike.*${search.replace(/[(),]/g, " ")}*)`);

    const response = await fetch(`${URL}/rest/v1/study_materials?${query}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      return NextResponse.json({ error: "Could not load study materials. Confirm the study_materials table has been created.", detail }, { status: 502 });
    }
    const rows = await response.json();
    const items = await Promise.all(rows.map(async (item) => {
      let fileUrl = null;
      if (item.bucket && item.storage_path) {
        const signed = await fetch(`${URL}/storage/v1/object/sign/${encodeURIComponent(item.bucket)}/${item.storage_path.split("/").map(encodeURIComponent).join("/")}`, {
          method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 900 }), cache: "no-store"
        });
        if (signed.ok) {
          const data = await signed.json();
          fileUrl = data.signedURL ? (data.signedURL.startsWith("http") ? data.signedURL : `${URL}/storage/v1${data.signedURL.startsWith("/") ? "" : "/"}${data.signedURL}`) : null;
        }
      }
      return { ...item, fileUrl };
    }));
    return NextResponse.json({ success: true, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Study materials API error:", error);
    return NextResponse.json({ error: "Unable to load Study Material right now." }, { status: 500 });
  }
}
