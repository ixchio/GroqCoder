"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, Heart, GitFork, Clock, TrendingUp, Sparkles, ArrowLeft, Eye } from "lucide-react";
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
    <section className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 relative z-10">
        {/* Header */}
        <header className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-all duration-300 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="flex items-start justify-between max-lg:flex-col gap-6">
            <div>
              {/* Animated title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-4">
                <span className="relative">
                  <Sparkles className="w-10 h-10 text-pink-500 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                </span>
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                  Community Gallery
                </span>
              </h1>
              <p className="text-white/60 text-lg max-w-xl leading-relaxed">
                Explore amazing projects built with <span className="text-pink-400 font-medium">Groq Coder</span>. 
                Get inspired, fork projects, and share your own creations.
              </p>
            </div>
            
            <Link href="/projects/new" className="group">
              <Button className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 hover:from-pink-600 hover:via-purple-600 hover:to-violet-600 text-white font-medium px-6 py-6 shadow-lg shadow-purple-500/25 transition-all duration-300 group-hover:shadow-purple-500/40 group-hover:scale-105">
                <Sparkles className="w-5 h-5 mr-2 animate-spin" style={{ animationDuration: "3s" }} />
                Create Your Own
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-pink-400 transition-colors" />
            <Input
              placeholder="Search amazing projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-pink-500/50 focus:ring-pink-500/20 transition-all duration-300"
            />
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-pink-500/30 rounded-xl transition-all duration-300">
                <SlidersHorizontal className="w-4 h-4" />
                {currentSortOption?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-neutral-900/95 backdrop-blur-xl border-white/10 rounded-xl">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSort(option.value as typeof sort)}
                  className={`rounded-lg cursor-pointer ${sort === option.value ? "bg-pink-500/20 text-pink-400" : "hover:bg-white/5"}`}
                >
                  <option.icon className="w-4 h-4 mr-2" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags - Pill Style */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedTag("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedTag === ""
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            ✨ All Projects
          </button>
          {POPULAR_TAGS.map((tag, index) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedTag === tag
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="bg-white/5 rounded-2xl h-72 overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-40 bg-gradient-to-br from-white/10 to-transparent animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded-full w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <Sparkles className="w-16 h-16 text-white/10" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-pink-500 rounded-full animate-ping" />
            </div>
            <h3 className="text-xl font-semibold text-white/70 mb-3">No projects found</h3>
            <p className="text-white/40 mb-8 max-w-md mx-auto">
              {search || selectedTag
                ? "Try adjusting your filters to discover more amazing projects"
                : "Be the first to share your creation with the community!"}
            </p>
            <Link href="/projects/new">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Create a Project
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project, index) => (
                <GalleryCard key={project.id} project={project} index={index} />
              ))}
            </div>

            {/* Load More */}
            {pagination.page < pagination.totalPages && (
              <div className="flex justify-center mt-16">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-pink-500/30 rounded-xl transition-all duration-300"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Load More Projects"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="mt-16 text-center">
          <p className="text-white/30 text-sm">
            Showing <span className="text-pink-400 font-medium">{projects.length}</span> of{" "}
            <span className="text-white/50">{pagination.total}</span> amazing projects
          </p>
        </div>
      </div>
    </section>
  );
}

function GalleryCard({ project, index }: { project: Project; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href={`/projects/${project.id}`} 
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        animation: `fadeInUp 0.5s ease-out forwards`,
        animationDelay: `${index * 75}ms`,
        opacity: 0,
      }}
    >
      <div 
        className="relative rounded-2xl overflow-hidden transition-all duration-500 ease-out"
        style={{
          transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        }}
      >
        {/* Gradient border glow */}
        <div 
          className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 transition-opacity duration-500 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
        <div 
          className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 blur-xl transition-opacity duration-500 ${
            isHovered ? "opacity-50" : "opacity-0"
          }`}
        />
        
        {/* Card content */}
        <div className="relative bg-neutral-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
          {/* Thumbnail / Preview */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
            {project.thumbnail ? (
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                className={`object-cover transition-transform duration-700 ease-out ${
                  isHovered ? "scale-110" : "scale-100"
                }`}
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
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                <span className="text-5xl font-bold bg-gradient-to-br from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {project.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Hover overlay */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end p-4 transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <Button size="sm" className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20">
                <Eye className="w-4 h-4 mr-2" />
                View Project
              </Button>
            </div>

            {/* Featured badge for popular projects */}
            {(project.likes && project.likes > 10) && (
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[10px] font-bold uppercase tracking-wider">
                  🔥 Trending
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className={`font-semibold text-white line-clamp-1 mb-1 transition-colors duration-300 ${
              isHovered ? "text-pink-400" : ""
            }`}>
              {project.title}
            </h3>
            
            {project.description && (
              <p className="text-sm text-white/40 line-clamp-2 mb-3 min-h-[40px]">
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
                    width={24}
                    height={24}
                    className="rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 ring-2 ring-white/10" />
                )}
                <span className="text-xs text-white/50">{project.authorName}</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className={`flex items-center gap-1 transition-colors ${isHovered ? "text-pink-400" : "text-white/40"}`}>
                  <Heart className={`w-3.5 h-3.5 ${isHovered ? "fill-pink-400" : ""}`} />
                  {project.likes || 0}
                </span>
                <span className="flex items-center gap-1 text-white/40">
                  <GitFork className="w-3.5 h-3.5" />
                  {project.forks || 0}
                </span>
              </div>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40 border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Time */}
            <p className="text-[10px] text-white/25 mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {project.createdAt
                ? formatDistance(new Date(project.createdAt), new Date(), { addSuffix: true })
                : "Recently"}
            </p>
          </div>
        </div>
      </div>

      {/* Add keyframes via style tag */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Link>
  );
}
