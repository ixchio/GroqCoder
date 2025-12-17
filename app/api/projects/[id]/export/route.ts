/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";
import JSZip from "jszip";

// GET /api/projects/[id]/export - Export project as ZIP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const project = await Project.findById(id).lean() as any;

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);

    // Check if user can access this project (must be public or owned by user)
    if (!project.isPublic) {
      if (!session?.user?.email) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const User = (await import("@/models/User")).default;
      const user = await User.findOne({ email: session.user.email });

      if (!user || project.userId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Create ZIP file
    const zip = new JSZip();
    const sanitizedTitle = (project.title || "groq-coder-project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Add all HTML pages
    if (project.pages && project.pages.length > 0) {
      project.pages.forEach((page: { path: string; html: string }) => {
        zip.file(page.path, page.html);
      });
    }

    // Add React/Next.js files if present
    if (project.files && project.files.length > 0) {
      project.files.forEach((file: { path: string; content: string }) => {
        zip.file(file.path, file.content);
      });
    }

    // Add package.json for React/Next.js projects
    if (project.projectType === "react" || project.projectType === "nextjs") {
      const packageJson = {
        name: sanitizedTitle,
        version: "1.0.0",
        private: true,
        scripts: {
          dev: project.projectType === "nextjs" ? "next dev" : "vite",
          build: project.projectType === "nextjs" ? "next build" : "vite build",
          start: project.projectType === "nextjs" ? "next start" : "vite preview",
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          ...(project.projectType === "nextjs" ? { next: "^14.0.0" } : { vite: "^5.0.0" }),
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          typescript: "^5.0.0",
        },
      };
      zip.file("package.json", JSON.stringify(packageJson, null, 2));
    }

    // Add README
    const readme = `# ${project.title || "Groq Coder Project"}

${project.description || "Generated with Groq Coder"}

## Generated with [Groq Coder](https://groq-coder.vercel.app)

Free AI Code Generation Platform.

## Files Included

${project.pages?.map((p: { path: string }) => `- \`${p.path}\``).join("\n") || "No files"}

## Getting Started

${project.projectType === "html" 
  ? "Open `index.html` in your browser to view the project."
  : `
\`\`\`bash
npm install
npm run dev
\`\`\`
`}

## Prompts Used

${project.prompts?.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n") || "No prompts recorded"}

## Powered By

- ⚡ Ultra-fast AI inference
- 🤖 ${project.model || "Llama 3.3 70B"}
- 🆓 100% free and open source

---

Built with ❤️ using Groq Coder
`;

    zip.file("README.md", readme);

    // Generate ZIP
    const buffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Return ZIP file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${sanitizedTitle}.zip"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Export project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to export project" },
      { status: 500 }
    );
  }
}
