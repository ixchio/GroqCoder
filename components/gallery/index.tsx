"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, Heart, GitFork, Clock, TrendingUp, Sparkles, ArrowLeft } from "lucide-react";
import { formatDistance } from "date-fns";

import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GalleryProps {
  initialProjects: Project[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent", icon: Clock },
  { value: "popular", label: "Most Popular", icon: Heart },
  { value: "trending", label: "Trending", icon: TrendingUp },
];

const POPULAR_TAGS = [
  "landing-page",
  "dashboard",
  "portfolio",
  "e-commerce",
  "blog",
  "saas",
  "game",
  "animation",
];

export function Gallery({ initialProjects, initialPagination }: GalleryProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "trending">("recent");
  const [selectedTag, setSelectedTag] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        gallery: "true",
        page: "1",
        limit: pagination.limit.toString(),
        sort,
        ...(search && { search }),
        ...(selectedTag && { tag: selectedTag }),
      });

      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();

      if (data.ok) {
        setProjects(data.projects);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [sort, search, selectedTag, pagination.limit]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchProjects]);

  const loadMore = async () => {
    if (pagination.page >= pagination.totalPages) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        gallery: "true",
        page: (pagination.page + 1).toString(),
        limit: pagination.limit.toString(),
        sort,
        ...(search && { search }),
        ...(selectedTag && { tag: selectedTag }),
      });

      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();

      if (data.ok) {
        setProjects((prev) => [...prev, ...data.projects]);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load more projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSortOption = SORT_OPTIONS.find((o) => o.value === sort);

  return (
    <section className="max-w-7xl mx-auto py-12 px-4">
      {/* Header */}
      <header className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-start justify-between max-lg:flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-pink-500" />
              Community Gallery
            </h1>
            <p className="text-white/60 text-base mt-2 max-w-xl">
              Explore amazing projects built with Groq Coder. Get inspired, fork projects, and share your own creations.
            </p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Your Own
            </Button>
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
              <SlidersHorizontal className="w-4 h-4" />
              {currentSortOption?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSort(option.value as typeof sort)}
                className={sort === option.value ? "bg-white/10" : ""}
              >
                <option.icon className="w-4 h-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          size="sm"
          variant={selectedTag === "" ? "default" : "outline"}
          onClick={() => setSelectedTag("")}
          className="text-sm"
        >
          All
        </Button>
        {POPULAR_TAGS.map((tag) => (
          <Button
            key={tag}
            size="sm"
            variant={selectedTag === tag ? "default" : "outline"}
            onClick={() => setSelectedTag(tag)}
            className="text-sm"
          >
            #{tag}
          </Button>
        ))}
      </div>

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-2">No projects found</h3>
          <p className="text-white/40 mb-6">
            {search || selectedTag
              ? "Try adjusting your filters"
              : "Be the first to share your creation!"}
          </p>
          <Link href="/projects/new">
            <Button>Create a Project</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <GalleryCard key={project.id} project={project} />
            ))}
          </div>

          {/* Load More */}
          {pagination.page < pagination.totalPages && (
            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="px-8"
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Stats */}
      <div className="mt-12 text-center text-white/40 text-sm">
        Showing {projects.length} of {pagination.total} projects
      </div>
    </section>
  );
}

function GalleryCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="group">
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 overflow-hidden hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">
        {/* Thumbnail / Preview */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-900 to-black overflow-hidden">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : project.pages && project.pages.length > 0 ? (
            <iframe
              srcDoc={project.pages[0].html}
              title={project.title}
              className="absolute inset-0 w-[400%] h-[400%] origin-top-left scale-25 pointer-events-none border-none bg-white"
              tabIndex={-1}
              loading="lazy"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
              <span className="text-3xl font-bold text-white/10">
                {project.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <Button size="sm" className="w-full">
              View Project
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-1 mb-1 group-hover:text-pink-400 transition-colors">
            {project.title}
          </h3>
          
          {project.description && (
            <p className="text-sm text-white/50 line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          {/* Author & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {project.authorImage ? (
                <Image
                  src={project.authorImage}
                  alt={project.authorName}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
              )}
              <span className="text-xs text-white/50">{project.authorName}</span>
            </div>

            <div className="flex items-center gap-3 text-white/40 text-xs">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {project.likes || 0}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                {project.forks || 0}
              </span>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Time */}
          <p className="text-[10px] text-white/30 mt-2">
            {project.createdAt
              ? formatDistance(new Date(project.createdAt), new Date(), { addSuffix: true })
              : "Recently"}
          </p>
        </div>
      </div>
    </Link>
  );
}
