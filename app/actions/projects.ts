"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";
import { Project as ProjectType } from "@/types";

export async function getProjects(): Promise<{
  ok: boolean;
  projects: ProjectType[];
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      ok: false,
      projects: [],
    };
  }

  await connectToDatabase();
  
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return {
      ok: false,
      projects: [],
    };
  }

  const projects = await Project.find({
    userId: user._id,
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .select("-pages") // Don't include full HTML in list
    .lean();

  if (!projects) {
    return {
      ok: false,
      projects: [],
    };
  }

  return {
    ok: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: projects.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      userId: p.userId.toString(),
      authorName: p.authorName,
      authorImage: p.authorImage,
      pages: [],
      prompts: p.prompts,
      thumbnail: p.thumbnail,
      isPublic: p.isPublic,
      likes: p.likes,
      forks: p.forks,
      tags: p.tags,
      model: p.model,
      provider: p.provider,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })) as ProjectType[],
  };
}

export async function getProject(id: string): Promise<ProjectType | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  await connectToDatabase();
  
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return null;
  }

  const project = await Project.findOne({
    _id: id,
    userId: user._id,
  }).lean();

  if (!project) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any;
  return {
    id: p._id.toString(),
    title: p.title,
    description: p.description,
    userId: p.userId.toString(),
    authorName: p.authorName,
    authorImage: p.authorImage,
    pages: p.pages,
    prompts: p.prompts,
    thumbnail: p.thumbnail,
    isPublic: p.isPublic,
    likes: p.likes,
    forks: p.forks,
    tags: p.tags,
    model: p.model,
    provider: p.provider,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  } as ProjectType;
}
