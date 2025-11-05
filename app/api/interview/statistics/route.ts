import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user id from token
    const userId = getUserIdFromToken(token);

    // Get all interviews for the user
    const interviews = await Interview.find({ user: userId });

    // Calculate statistics
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(
      (interview) => interview.status === "completed"
    ).length;
    const inProgressInterviews = totalInterviews - completedInterviews;

    return NextResponse.json(
      {
        total: totalInterviews,
        completed: completedInterviews,
        inProgress: inProgressInterviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving interview statistics:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
