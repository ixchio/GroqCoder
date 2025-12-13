"use server";

import { isAuthenticated } from "@/lib/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";
import { Project as ProjectType } from "@/types";

export async function getProjects(): Promise<{
  ok: boolean;
  projects: ProjectType[];
}> {
  const user = await isAuthenticated();

  if (user instanceof NextResponse || !user) {
    return {
      ok: false,
      projects: [],
    };
  }

  await dbConnect();
  const projects = await Project.find({
    user_id: user?.id,
  })
    .sort({ _createdAt: -1 })
    .limit(100)
    .lean();
  if (!projects) {
    return {
      ok: false,
      projects: [],
    };
  }
  return {
    ok: true,
    projects: JSON.parse(JSON.stringify(projects)) as ProjectType[],
  };
}

export async function getProject(
  namespace: string,
  repoId: string
): Promise<ProjectType | null> {
  const user = await isAuthenticated();

  if (user instanceof NextResponse || !user) {
    return null;
  }

  await dbConnect();
  const project = await Project.findOne({
    user_id: user.id,
    namespace,
    repoId,
  }).lean();

  if (!project) {
    return null;
  }

  return JSON.parse(JSON.stringify(project)) as ProjectType;
}
