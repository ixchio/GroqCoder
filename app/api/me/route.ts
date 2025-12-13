import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ user: null, errCode: 401 }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).select(
      "-password -apiKeys"
    );

    if (!user) {
      return NextResponse.json({ user: null, errCode: 404 }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          bio: user.bio,
          linkedinUrl: user.linkedinUrl,
          githubUsername: user.githubUsername,
        },
        errCode: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ user: null, errCode: 500 }, { status: 500 });
  }
}
