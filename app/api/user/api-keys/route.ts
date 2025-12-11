/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { BYOK_PROVIDERS } from "@/lib/providers";
import { encryptKey, decryptKey, maskKey } from "@/lib/api-keys";

// GET /api/user/api-keys - Get user's API keys (masked)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Return masked keys
    const keys: Record<string, { provider: string; masked: string; hasKey: boolean }> = {};
    
    for (const [providerId, provider] of Object.entries(BYOK_PROVIDERS)) {
      const encryptedKey = user.apiKeys?.[providerId as keyof typeof user.apiKeys] || "";
      const hasKey = !!encryptedKey;
      
      keys[providerId] = {
        provider: provider.name,
        masked: hasKey ? maskKey(decryptKey(encryptedKey)) : "",
        hasKey,
      };
    }

    return NextResponse.json({
      ok: true,
      keys,
    });
  } catch (error: any) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get API keys" },
      { status: 500 }
    );
  }
}

// POST /api/user/api-keys - Save or update an API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    // Validate provider
    if (!provider || !BYOK_PROVIDERS[provider]) {
      return NextResponse.json(
        { ok: false, error: "Invalid provider" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Initialize apiKeys if not exists
    if (!user.apiKeys) {
      user.apiKeys = {};
    }

    // Encrypt and save the key (or remove if empty)
    if (apiKey && apiKey.trim()) {
      user.apiKeys[provider as keyof typeof user.apiKeys] = encryptKey(apiKey.trim());
    } else {
      user.apiKeys[provider as keyof typeof user.apiKeys] = "";
    }

    await user.save();

    return NextResponse.json({
      ok: true,
      message: `API key for ${BYOK_PROVIDERS[provider].name} ${apiKey ? "saved" : "removed"} successfully`,
    });
  } catch (error: any) {
    console.error("Save API key error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/api-keys - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider || !BYOK_PROVIDERS[provider]) {
      return NextResponse.json(
        { ok: false, error: "Invalid provider" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.apiKeys) {
      user.apiKeys[provider as keyof typeof user.apiKeys] = "";
      await user.save();
    }

    return NextResponse.json({
      ok: true,
      message: `API key for ${BYOK_PROVIDERS[provider].name} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
