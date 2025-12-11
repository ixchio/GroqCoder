/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { encryptKey, MASKED_KEY_MARKER, validateApiKeyFormat } from "@/lib/api-keys";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Return marker for masked keys (not actual masked values to prevent prefix attacks)
    const apiKeys = {
      openai: user.apiKeys?.openai ? MASKED_KEY_MARKER : "",
      deepseek: user.apiKeys?.deepseek ? MASKED_KEY_MARKER : "",
      google: user.apiKeys?.google ? MASKED_KEY_MARKER : "",
      mistral: user.apiKeys?.mistral ? MASKED_KEY_MARKER : "",
    };

    return NextResponse.json({
      ok: true,
      user: {
        name: user.name,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        githubUsername: user.githubUsername,
        apiKeys,
      },
    });
  } catch (error: any) {
    console.error("Get settings error:", error);
    return NextResponse.json({ ok: false, error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, linkedinUrl, apiKeys } = body;

    // Validate profile fields
    if (name && typeof name !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
    }
    
    if (bio && typeof bio !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid bio" }, { status: 400 });
    }
    
    if (bio && bio.length > 500) {
      return NextResponse.json({ ok: false, error: "Bio must be 500 characters or less" }, { status: 400 });
    }

    if (linkedinUrl && typeof linkedinUrl === "string" && linkedinUrl.trim()) {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/;
      if (!linkedinRegex.test(linkedinUrl)) {
        return NextResponse.json({ ok: false, error: "Invalid LinkedIn URL" }, { status: 400 });
      }
    }

    await connectToDatabase();

    const updateData: any = {
      name,
      bio,
      linkedinUrl,
    };

    // Handle API keys update
    if (apiKeys && typeof apiKeys === "object") {
      const user = await User.findOne({ email: session.user.email });
      
      if (!user) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }
      
      const currentKeys = user.apiKeys || {};
      const newKeys = { ...currentKeys };

      // Process each API key
      for (const provider of ["openai", "deepseek", "google", "mistral"]) {
        const newValue = apiKeys[provider];
        
        // Skip if value is undefined or is the masked marker (unchanged)
        if (newValue === undefined || newValue === MASKED_KEY_MARKER) {
          continue;
        }
        
        // Empty string means remove the key
        if (newValue === "") {
          newKeys[provider] = "";
          continue;
        }
        
        // Validate the new key format
        const validation = validateApiKeyFormat(provider, newValue);
        if (!validation.valid) {
          return NextResponse.json(
            { ok: false, error: `${provider}: ${validation.error}` },
            { status: 400 }
          );
        }
        
        // Encrypt and store the new key
        newKeys[provider] = encryptKey(newValue.trim());
      }

      updateData.apiKeys = newKeys;
    }

    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      ok: true,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update settings" }, { status: 500 });
  }
}
