import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { AppEditor } from "@/components/editor";

async function getProject(id: string) {
  try {
    await connectToDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await Project.findById(id).lean() as any;
    
    if (!project) {
      return null;
    }

    // Properly serialize pages to remove MongoDB ObjectIds from subdocuments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedPages = (project.pages || []).map((page: any) => ({
      path: page.path || "",
      html: page.html || "",
    }));

    return {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      pages: serializedPages,
      prompts: project.prompts || [],
      images: project.images || [],
      isPublic: project.isPublic,
      userId: project.userId?.toString(),
      authorName: project.authorName,
      authorImage: project.authorImage,
      model: project.model,
      provider: project.provider,
      likes: project.likes || 0,
      forks: project.forks || 0,
      tags: project.tags || [],
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Validate MongoDB ObjectId format
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    redirect("/");
  }
  
  const project = await getProject(id);
  
  if (!project || !project.pages?.length) {
    redirect("/");
  }

  return (
    <AppEditor 
      project={project} 
      pages={project.pages} 
      images={project.images || []} 
    />
  );
}

// Generate metadata for the project
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return { title: "Project Not Found | Groq Coder" };
  }
  
  const project = await getProject(id);
  
  if (!project) {
    return { title: "Project Not Found | Groq Coder" };
  }

  return {
    title: `${project.title} | Groq Coder`,
    description: project.description || `View ${project.title} on Groq Coder`,
  };
}
