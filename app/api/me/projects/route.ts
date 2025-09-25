import { NextRequest, NextResponse } from "next/server";
import { createRepo, RepoDesignation, uploadFiles } from "@huggingface/hub";

import { isAuthenticated } from "@/lib/auth";
import Project from "@/models/Project";
import dbConnect from "@/lib/mongodb";
import { COLORS } from "@/lib/utils";
import { Page } from "@/types";

export async function GET() {
  const user = await isAuthenticated();

  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const projects = await Project.find({
    user_id: user?.id,
  })
    .sort({ _createdAt: -1 })
    .limit(100)
    .lean();
  if (!projects) {
    return NextResponse.json(
      {
        ok: false,
        projects: [],
      },
      { status: 404 }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      projects,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const user = await isAuthenticated();

  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { title, pages, prompts } = await request.json();

  if (!title || !pages || pages.length === 0) {
    return NextResponse.json(
      { message: "Title and HTML content are required.", ok: false },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    let readme = "";

    const newTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .split("-")
      .filter(Boolean)
      .join("-")
      .slice(0, 96);

    const repo: RepoDesignation = {
      type: "space",
      name: `${user.name}/${newTitle}`,
    };

    const { repoUrl } = await createRepo({
      repo,
      accessToken: user.token as string,
    });
    const colorFrom = COLORS[Math.floor(Math.random() * COLORS.length)];
    const colorTo = COLORS[Math.floor(Math.random() * COLORS.length)];
    readme = `---
title: ${newTitle}
emoji: 🐳
colorFrom: ${colorFrom}
colorTo: ${colorTo}
sdk: static
pinned: false
tags:
  - deepsite
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference`;

    const readmeFile = new File([readme], "README.md", {
      type: "text/markdown",
    });
    const promptsFile = new File([prompts.join("\n")], "prompts.txt", {
      type: "text/plain",
    });
    const files = [readmeFile, promptsFile];
    pages.forEach((page: Page) => {
      const file = new File([page.html], page.path, { type: "text/html" });
      files.push(file);
    });
    await uploadFiles({
      repo,
      files,
      accessToken: user.token as string,
      commitTitle: `${prompts[prompts.length - 1]} - Initial Deployment`,
    });
    const path = repoUrl.split("/").slice(-2).join("/");
    const project = await Project.create({
      user_id: user.id,
      space_id: path,
      prompts,
    });
    return NextResponse.json({ project, path, ok: true }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, ok: false },
      { status: 500 }
    );
  }
}
