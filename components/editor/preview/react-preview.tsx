"use client";

import { useEffect, useRef, useState } from "react";
import { CodeFile } from "@/types";
import classNames from "classnames";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magic-ui/grid-pattern";

interface ReactPreviewProps {
  files: CodeFile[];
  isResizing: boolean;
  isAiWorking: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
  device: "desktop" | "mobile";
  currentTab: string;
}

// Generate the HTML for React preview using ESM imports
const generateReactPreviewHtml = (files: CodeFile[]): string => {
  // Find the main App component
  const appFile = files.find(
    (f) => f.path === "src/App.jsx" || f.path === "src/App.tsx"
  );
  
  // Find the CSS file
  const cssFile = files.find(
    (f) => f.path === "src/index.css" || f.path === "src/App.css"
  );

  if (!appFile) {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0a0a0a; color: white; font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .message { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; }
  </style>
</head>
<body>
  <div class="message">
    <h1>No React App Found</h1>
    <p>Generate a React project to see the preview</p>
  </div>
</body>
</html>`;
  }

  // Process the App component code
  let appCode = appFile.content;
  
  // Convert import statements to use esm.sh
  appCode = appCode
    // React imports
    .replace(/import\s+React\s*,?\s*\{([^}]*)\}\s+from\s+['"]react['"]/g, 
      "import React, {$1} from 'https://esm.sh/react@18'")
    .replace(/import\s+\{([^}]*)\}\s+from\s+['"]react['"]/g, 
      "import {$1} from 'https://esm.sh/react@18'")
    .replace(/import\s+React\s+from\s+['"]react['"]/g, 
      "import React from 'https://esm.sh/react@18'")
    // Lucide React
    .replace(/import\s+\{([^}]*)\}\s+from\s+['"]lucide-react['"]/g, 
      "import {$1} from 'https://esm.sh/lucide-react@0.263.1'")
    // Framer Motion
    .replace(/import\s+\{([^}]*)\}\s+from\s+['"]framer-motion['"]/g, 
      "import {$1} from 'https://esm.sh/framer-motion@10.16.4'")
    // Remove local imports (components, CSS)
    .replace(/import\s+.*\s+from\s+['"]\.\/.*['"]/g, '// (local import removed)')
    .replace(/import\s+['"]\.\/.*\.css['"]/g, '// (css import removed)');

  // Extract CSS content or use defaults
  let cssContent = cssFile?.content || "";
  
  // Remove Tailwind directives since we'll load Tailwind from CDN
  cssContent = cssContent
    .replace(/@tailwind\s+base;?/g, "")
    .replace(/@tailwind\s+components;?/g, "")
    .replace(/@tailwind\s+utilities;?/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <!-- Import Map for ESM -->
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18",
      "react-dom": "https://esm.sh/react-dom@18",
      "react-dom/client": "https://esm.sh/react-dom@18/client",
      "lucide-react": "https://esm.sh/lucide-react@0.263.1",
      "framer-motion": "https://esm.sh/framer-motion@10.16.4"
    }
  }
  </script>
  
  <style>
    * { font-family: 'Inter', system-ui, sans-serif; }
    body { margin: 0; background: #000; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="module">
    import React from 'https://esm.sh/react@18';
    import { createRoot } from 'https://esm.sh/react-dom@18/client';
    
    // Make React globally available for JSX
    window.React = React;
    
    try {
      // Define the App component
      ${appCode}
      
      // Handle different export styles
      const AppComponent = typeof App !== 'undefined' ? App : 
                          (typeof default !== 'undefined' ? default : 
                          (() => React.createElement('div', null, 'No App component found')));
      
      // Render the app
      const root = createRoot(document.getElementById('root'));
      root.render(React.createElement(AppComponent));
    } catch (error) {
      console.error('React render error:', error);
      document.getElementById('root').innerHTML = \`
        <div style="background: #1a1a1a; color: #ff6b6b; padding: 2rem; font-family: monospace; border-radius: 8px; margin: 1rem;">
          <h2 style="margin-top: 0;">⚠️ Preview Error</h2>
          <pre style="background: #0a0a0a; padding: 1rem; border-radius: 4px; overflow-x: auto;">\${error.message}</pre>
          <p style="color: #888; margin-bottom: 0;">Check the browser console for more details.</p>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
};

export const ReactPreview = ({
  files,
  isResizing,
  isAiWorking,
  ref,
  device,
  currentTab,
}: ReactPreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    if (files && files.length > 0) {
      const html = generateReactPreviewHtml(files);
      setPreviewHtml(html);
    }
  }, [files]);

  return (
    <div
      ref={ref}
      className={classNames(
        "w-full border-l border-gray-900 h-full relative z-0 flex items-center justify-center",
        {
          "lg:p-4": currentTab !== "preview",
          "max-lg:h-0": currentTab === "chat",
          "max-lg:h-full": currentTab === "preview",
        }
      )}
    >
      <GridPattern
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className={cn(
          "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]"
        )}
      />
      <iframe
        id="react-preview-iframe"
        ref={iframeRef}
        title="React Preview"
        className={classNames(
          "w-full select-none transition-all duration-200 bg-black h-full",
          {
            "pointer-events-none": isResizing || isAiWorking,
            "lg:max-w-md lg:mx-auto lg:!rounded-[42px] lg:border-[8px] lg:border-neutral-700 lg:shadow-2xl lg:h-[80dvh] lg:max-h-[996px]":
              device === "mobile",
            "lg:border-[8px] lg:border-neutral-700 lg:shadow-2xl lg:rounded-[24px]":
              currentTab !== "preview" && device === "desktop",
          }
        )}
        srcDoc={previewHtml}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};
