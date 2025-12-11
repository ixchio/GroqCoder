/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { checkRateLimit, recordFailedAttempt, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/register - Create new user
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Too many registration attempts. Try again in ${rateLimit.resetIn} seconds.` 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetIn),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          }
        }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Additional password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "Password must contain uppercase, lowercase, and a number" },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length < 2 || name.trim().length > 100) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { ok: false, error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password with high cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
    });

    // Don't record this as a failed attempt - it succeeded!

    return NextResponse.json(
      {
        ok: true,
        message: "User created successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
