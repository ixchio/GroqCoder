import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
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
        const res = await fetch("https://huggingface.co/oauth/token", options);
        if (res.ok) return res;
        throw new Error(`Primary endpoint failed: ${res.status}`);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : JSON.stringify(err);
        console.warn("Primary token endpoint failed:", message);
        console.warn("Retrying via internal API endpoint...");
        return await fetch(
          "https://api-inference.huggingface.co/oauth/token",
          options
        );
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Auth callback error:", message);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
