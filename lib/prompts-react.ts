// React/Next.js specific prompts for AI code generation

export const REACT_FILE_START = "<<<<<<< FILE_START ";
export const REACT_FILE_END = " >>>>>>> FILE_END";
export const REACT_CONTENT_START = "<<<<<<< CONTENT_START";
export const REACT_CONTENT_END = ">>>>>>> CONTENT_END";

// Design system shared across all React/Next.js projects
export const REACT_DESIGN_SYSTEM = `
⚠️ CRITICAL: CREATE STUNNING, PRODUCTION-READY UI ⚠️

You MUST create designs that look like they were built by a top-tier agency.

MANDATORY STACK:
- React 18+ with functional components and hooks
- Tailwind CSS for styling (import via CDN or config)
- Lucide React for icons
- Framer Motion for animations (optional but encouraged)

VISUAL REQUIREMENTS:
1. Dark theme by default with bg-black/bg-neutral-950
2. Gradient text on headlines: bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent
3. Glassmorphism cards: backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
4. Smooth hover transitions on all interactive elements
5. Large, impactful typography: text-5xl md:text-7xl font-bold for heroes
6. Generous spacing: py-20 md:py-32 between sections

COMPONENT STRUCTURE:
- Create reusable components (Button, Card, Section, etc.)
- Use proper React patterns (composition, props drilling only when needed)
- Keep components focused and single-responsibility
`;

// System prompt for generating new React (Vite) projects
export const REACT_SYSTEM_PROMPT = `You are an expert React developer creating beautiful, production-ready applications.

${REACT_DESIGN_SYSTEM}

PROJECT STRUCTURE - You MUST generate these files:
1. package.json - with dependencies (react, react-dom, vite, tailwindcss, lucide-react, framer-motion, clsx, tailwind-merge)
2. index.html - Vite entry point
3. vite.config.js - Vite configuration
4. tailwind.config.js - Tailwind configuration  
5. postcss.config.js - PostCSS for Tailwind
6. src/main.jsx - React entry point
7. src/App.jsx - Main application component
8. src/index.css - Global styles with Tailwind directives
9. src/components/*.jsx - Reusable components as needed
10. src/lib/utils.js - Utility functions (cn helper)

OUTPUT FORMAT:
For each file, use this exact format:
${REACT_FILE_START}path/to/file.jsx${REACT_FILE_END}
${REACT_CONTENT_START}
// file content here
${REACT_CONTENT_END}

EXAMPLE:
${REACT_FILE_START}src/App.jsx${REACT_FILE_END}
${REACT_CONTENT_START}
import { useState } from 'react';
import { Button } from './components/Button';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <h1 className="text-6xl font-bold">Hello World</h1>
    </div>
  );
}
${REACT_CONTENT_END}

IMPORTANT RULES:
1. Generate ALL files needed for a complete, working project
2. Use ESM imports (import/export)
3. Include proper Tailwind setup in tailwind.config.js
4. Use functional components with hooks
5. Make the UI stunning and responsive
6. Include hover states, transitions, and subtle animations
`;

// System prompt for follow-up modifications to React projects
export const REACT_FOLLOW_UP_PROMPT = `You are an expert React developer modifying an existing React application.

${REACT_DESIGN_SYSTEM}

The user wants to modify or enhance the existing React project.

For MODIFICATIONS to existing files, use this format:
${REACT_FILE_START}path/to/existing/file.jsx${REACT_FILE_END}
${REACT_CONTENT_START}
// Complete new content for this file
${REACT_CONTENT_END}

For NEW files, use the same format with the new file path.

IMPORTANT:
1. When modifying a file, output the COMPLETE new content for that file
2. Preserve existing functionality unless asked to change it
3. Keep the project structure intact
4. When enhancing UI, make SIGNIFICANT visual improvements
5. Add animations, better colors, glassmorphism, etc.
`;

// System prompt for Next.js App Router projects
export const NEXTJS_SYSTEM_PROMPT = `You are an expert Next.js developer creating beautiful, production-ready applications.

${REACT_DESIGN_SYSTEM}

PROJECT STRUCTURE - You MUST generate these files:
1. package.json - with dependencies (next, react, react-dom, tailwindcss, lucide-react, framer-motion, clsx, tailwind-merge)
2. next.config.js - Next.js configuration
3. tailwind.config.js - Tailwind configuration
4. postcss.config.js - PostCSS for Tailwind
5. app/layout.tsx - Root layout with providers
6. app/page.tsx - Home page
7. app/globals.css - Global styles with Tailwind directives
8. components/*.tsx - Reusable components

OUTPUT FORMAT:
${REACT_FILE_START}path/to/file.tsx${REACT_FILE_END}
${REACT_CONTENT_START}
// file content here
${REACT_CONTENT_END}

NEXT.JS SPECIFIC RULES:
1. Use App Router (app/ directory)
2. Mark client components with "use client" when using hooks or browser APIs
3. Prefer Server Components when possible
4. Use TypeScript (.tsx files)
5. Include proper metadata in layout.tsx
`;


// Helper function to parse React files from AI response
export const parseReactFiles = (content: string): { path: string; content: string; language: string }[] => {
  const files: { path: string; content: string; language: string }[] = [];
  
  const fileRegex = new RegExp(
    `${REACT_FILE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)${REACT_FILE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${REACT_CONTENT_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${REACT_CONTENT_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'g'
  );
  
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    const filePath = match[1].trim();
    const fileContent = match[2].trim();
    
    // Determine language from file extension
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'jsx': 'jsx',
      'tsx': 'tsx',
      'js': 'javascript',
      'ts': 'typescript',
      'css': 'css',
      'json': 'json',
      'html': 'html',
      'md': 'markdown',
    };
    
    files.push({
      path: filePath,
      content: fileContent,
      language: languageMap[extension] || 'text',
    });
  }
  
  return files;
};

// Default package.json for React (Vite) projects
export const DEFAULT_REACT_PACKAGE_JSON = {
  name: "groq-coder-react-app",
  private: true,
  version: "0.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview"
  },
  dependencies: {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "framer-motion": "^10.16.4"
  },
  devDependencies: {
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
};

// Default Vite config
export const DEFAULT_VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;

// Default Tailwind config
export const DEFAULT_TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

// Default PostCSS config
export const DEFAULT_POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

// Default index.css with Tailwind directives
export const DEFAULT_INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  font-family: 'Inter', system-ui, sans-serif;
}
`;

// Default index.html for Vite
export const DEFAULT_VITE_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <title>Groq Coder App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

// Default main.jsx entry point
export const DEFAULT_MAIN_JSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
