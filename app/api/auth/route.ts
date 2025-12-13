import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const Authorization = `Basic ${Buffer.from(
      `${process.env.OAUTH_CLIENT_ID}:${process.env.OAUTH_CLIENT_SECRET}`
    ).toString("base64")}`;

    const host =
      req.headers.get("host") ?? req.headers.get("origin") ?? "localhost:3000";

    const url = host.includes("/spaces/enzostvs")
      ? "enzostvs-deepsite.hf.space"
      : host;

    const redirect_uri =
      `${host.includes("localhost") ? "http://" : "https://"}` +
      url +
      "/auth/callback";

    // Helper to handle fallback between main and internal Hugging Face API
    async function fetchToken() {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      });

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization,
        },
        body: params,
      };

      try {
        // Try the main endpoint first
        const res = await fetch("https://huggingface.co/oauth/token", options);
        if (res.ok) return res;
        throw new Error(`Primary endpoint failed: ${res.status}`);
      } catch (err) {
        console.warn("Primary token endpoint failed:", err.message);
        console.warn("Retrying via internal API endpoint...");
        // Fallback to internal endpoint
        return await fetch("https://api-inference.huggingface.co/oauth/token", options);
      }
    }

    const request_auth = await fetchToken();
    const response = await request_auth.json();

    if (!response.access_token) {
      return NextResponse.json(
        { error: "Failed to retrieve access token", details: response },
        { status: 400 }
      );
    }

    // Retrieve user info
    const userResponse = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${response.access_token}` },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { user: null, errCode: userResponse.status },
        { status: userResponse.status }
      );
    }

    const user = await userResponse.json();

    return NextResponse.json(
      {
        access_token: response.access_token,
        expires_in: response.expires_in,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
