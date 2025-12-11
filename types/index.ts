export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUsername?: string;
  isLocalUse?: boolean;
}

export interface HtmlHistory {
  pages: Page[];
  createdAt: Date;
  prompt: string;
}

// Project types for different frameworks
export type ProjectType = 'html' | 'react' | 'nextjs';

// Code file for React/Next.js projects
export interface CodeFile {
  path: string;      // e.g., "src/App.jsx" or "app/page.tsx"
  content: string;   // File content
  language: string;  // "jsx", "tsx", "css", "json", "js", "ts"
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  projectType?: ProjectType;  // New: type of project (html, react, nextjs)
  pages: Page[];              // For HTML projects (backward compatible)
  files?: CodeFile[];         // For React/Next.js projects
  prompts: string[];
  userId: string;
  authorName: string;
  authorImage?: string;
  thumbnail?: string;
  isPublic: boolean;
  likes: number;
  forks: number;
  tags: string[];
  model: string;
  provider: string;
  forkedFrom?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Page {
  path: string;
  html: string;
}

export interface ApiKey {
  provider: string;
  masked: string;
  hasKey: boolean;
}
