import { Gallery } from "@/components/gallery";
import { getGalleryProjects } from "@/app/actions/gallery";

export const metadata = {
  title: "Community Gallery | Groq Coder",
  description: "Explore amazing projects built with Groq Coder. Get inspired, fork projects, and share your own creations.",
};

export default async function GalleryPage() {
  const { projects, pagination } = await getGalleryProjects({
    page: 1,
    limit: 12,
    sort: "recent",
  });

  return <Gallery initialProjects={projects} initialPagination={pagination} />;
}
