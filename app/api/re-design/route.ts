import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://r.jina.ai/${encodeURIComponent(url)}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch redesign" },
        { status: 500 }
      );
    }
    const markdown = await response.text();
    return NextResponse.json(
      {
        ok: true,
        markdown,
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
