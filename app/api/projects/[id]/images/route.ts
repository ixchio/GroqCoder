
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Basic auth check
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "No project ID provided" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const images = formData.getAll("images") as File[]; // "images" matches the frontend key

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    
    // Directory: public/uploads/[projectId]
    const uploadDir = path.join(process.cwd(), "public", "uploads", id);
    
    // Ensure directory exists
    try {
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (e) {
      console.error("Error creating upload dir:", e);
      return NextResponse.json({ error: "Failed to create directory" }, { status: 500 });
    }

    // Process each file
    for (const image of images) {
      // Validate file type
      if (!image.type.startsWith("image/")) {
        continue;
      }

      // Create valid filename (sanitize)
      const sanitizedName = image.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${Date.now()}-${sanitizedName}`;
      const filepath = path.join(uploadDir, filename);

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await writeFile(filepath, buffer);
      
      // Store public URL
      uploadedUrls.push(`/uploads/${id}/${filename}`);
    }

    return NextResponse.json({ 
      success: true, 
      uploadedFiles: uploadedUrls 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
