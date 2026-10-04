import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const requestCookie =
      request.cookies.get("sambhav_session");

    const cookieStore =
      await cookies();

    const serverCookie =
      cookieStore.get("sambhav_session");

    const rawCookie =
      request.headers.get("cookie");

    return NextResponse.json({
      requestCookiePresent:
        !!requestCookie?.value,

      serverCookiePresent:
        !!serverCookie?.value,

      rawCookiePresent:
        !!rawCookie,

      hasSambhavSession:
        rawCookie?.includes("sambhav_session=") || false,

      requestCookieLength:
        requestCookie?.value?.length || 0,

      serverCookieLength:
        serverCookie?.value?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.message || "Debug failed",
      },
      { status: 500 }
    );
  }
}
