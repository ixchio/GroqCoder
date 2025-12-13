import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Page } from '@/types';

/**
 * Download a project as a ZIP file containing all HTML pages
 */
export async function downloadProjectAsZip(
  pages: Page[],
  projectTitle?: string
): Promise<void> {
  const zip = new JSZip();
  const sanitizedTitle = (projectTitle || 'groq-coder-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Add all HTML pages to the ZIP
  pages.forEach(page => {
    zip.file(page.path, page.html);
  });

  // Add a README file
  const readme = `# ${projectTitle || 'Groq Coder Project'}

Generated with [Groq Coder](https://groq-coder.vercel.app) - Free AI Code Generation Platform

## Files Included

${pages.map(p => `- \`${p.path}\``).join('\n')}

## Getting Started

Open \`index.html\` in your browser to view the project.

## Powered By

- ⚡ Groq LPU for ultra-fast inference
- 🤖 Llama, Mixtral, Gemma, and more AI models
- 🆓 100% free and open source

---

Built with ❤️ using Groq Coder
`;

  zip.file('README.md', readme);

  // Generate and download the ZIP
  const blob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  saveAs(blob, `${sanitizedTitle}.zip`);
}

/**
 * Download a single HTML page
 */
export function downloadSinglePage(page: Page, projectTitle?: string): void {
  const blob = new Blob([page.html], { type: 'text/html;charset=utf-8' });
  const filename = page.path || `${projectTitle || 'page'}.html`;
  saveAs(blob, filename);
}

/**
 * Copy HTML to clipboard
 */
export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch {
    return false;
  }
}
