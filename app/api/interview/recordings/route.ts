import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user ID from token
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Find all interviews with recordings for this user
    const interviews = await Interview.find(
      {
        user: userId,
        "recording.url": { $exists: true, $ne: null },
      },
      "jobRole techStack createdAt recording"
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { recordings: interviews },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
