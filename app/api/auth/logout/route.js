import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    /*
     * Clear the SAMBHAV email session.
     */
    response.cookies.set({
      name: "sambhav_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return NextResponse.json(
      {
        error: "Logout failed",
      },
      { status: 500 }
    );
  }
}
