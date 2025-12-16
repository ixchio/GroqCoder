/**
 * SMOOTH STREAMING ARCHITECTURE
 * Lovable/v0.dev-style real-time DOM updates
 * 
 * Key Principles:
 * 1. Parse AI response WHILE it's streaming (not after)
 * 2. Apply CSS first for instant visual feedback
 * 3. Batch updates to minimize reflows
 * 4. Use CSS transitions for smooth animations
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DiffBlock {
  type: 'css' | 'html' | 'js';
  path?: string; // Selector for HTML, function name for JS
  operation: 'modify' | 'add' | 'delete' | 'append';
  content: string;
  priority: number; // 1=CSS, 2=HTML, 3=JS
  timestamp?: number;
}

export interface StreamProgress {
  chars: number;
  tokens: number;
  chunks: number;
  elapsed: number;
  isStreaming: boolean;
}

// ============================================================================
// STREAMING DIFF PARSER
// Extracts structured deltas from AI response in real-time
// ============================================================================

export class StreamingDiffParser {
  private buffer: string = '';
  private processedHashes: Set<string> = new Set();

  /**
   * Parse a chunk of streaming response and extract any complete diff blocks
   * This runs WHILE the AI is still generating - not after
   */
  public parseStreamChunk(chunk: string): DiffBlock[] {
    this.buffer += chunk;
    const diffs: DiffBlock[] = [];

    // Extract CSS blocks: <!-- CSS_START --> ... <!-- CSS_END -->
    const cssRegex = /<!-- CSS_START -->([\s\S]*?)<!-- CSS_END -->/g;
    let cssMatch;
    while ((cssMatch = cssRegex.exec(this.buffer)) !== null) {
      const content = cssMatch[1].trim();
      const hash = this.hashContent('css', content);
      
      if (!this.processedHashes.has(hash) && content.length > 0) {
        diffs.push({
          type: 'css',
          operation: 'modify',
          content,
          priority: 1, // CSS first for instant visual feedback
          timestamp: Date.now(),
        });
        this.processedHashes.add(hash);
      }
    }

    // Extract HTML blocks: <!-- HTML_START #selector --> ... <!-- HTML_END -->
    const htmlRegex = /<!-- HTML_START\s+([^\s>]+)\s*-->([\s\S]*?)<!-- HTML_END -->/g;
    let htmlMatch;
    while ((htmlMatch = htmlRegex.exec(this.buffer)) !== null) {
      const selector = htmlMatch[1].trim();
      const content = htmlMatch[2].trim();
      const hash = this.hashContent('html', selector + content);
      
      if (!this.processedHashes.has(hash) && content.length > 0) {
        diffs.push({
          type: 'html',
          path: selector,
          operation: this.detectOperation(selector),
          content,
          priority: 2, // HTML after CSS
          timestamp: Date.now(),
        });
        this.processedHashes.add(hash);
      }
    }

    // Extract JS blocks: <!-- JS_START functionName --> ... <!-- JS_END -->
    const jsRegex = /<!-- JS_START\s+([^\s>]+)\s*-->([\s\S]*?)<!-- JS_END -->/g;
    let jsMatch;
    while ((jsMatch = jsRegex.exec(this.buffer)) !== null) {
      const functionName = jsMatch[1].trim();
      const content = jsMatch[2].trim();
      const hash = this.hashContent('js', functionName + content);
      
      if (!this.processedHashes.has(hash) && content.length > 0 && this.isValidJS(content)) {
        diffs.push({
          type: 'js',
          path: functionName,
          operation: 'modify',
          content,
          priority: 3, // JS last
          timestamp: Date.now(),
        });
        this.processedHashes.add(hash);
      }
    }

    // Sort by priority (CSS first, then HTML, then JS)
    return diffs.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if we have any pending content that might become a valid block
   */
  public hasPendingContent(): boolean {
    return this.buffer.includes('<!-- CSS_START') ||
           this.buffer.includes('<!-- HTML_START') ||
           this.buffer.includes('<!-- JS_START');
  }

  /**
   * Reset parser state for new request
   */
  public reset(): void {
    this.buffer = '';
    this.processedHashes.clear();
  }

  /**
   * Get the raw buffer content (for fallback processing)
   */
  public getBuffer(): string {
    return this.buffer;
  }

  private hashContent(type: string, content: string): string {
    let hash = 0;
    const str = type + content;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private detectOperation(selector: string): 'modify' | 'add' | 'delete' | 'append' {
    if (selector.includes('DELETE') || selector.includes('REMOVE')) return 'delete';
    if (selector.includes('ADD') || selector.includes('NEW')) return 'add';
    if (selector.includes('APPEND')) return 'append';
    return 'modify';
  }

  private isValidJS(js: string): boolean {
    try {
      // Quick syntax check - will throw if invalid
      new Function(js);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SMOOTH DOM ORCHESTRATOR
// Applies updates with batching and smooth transitions
// ============================================================================

export class SmoothDOMOrchestrator {
  private updateQueue: DiffBlock[] = [];
  private isUpdating: boolean = false;
  private styleElement: HTMLStyleElement | null = null;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private appliedCount: number = 0;
  
  private readonly BATCH_DELAY = 50; // ms - group rapid updates

  constructor(private doc: Document) {
    this.initializeStyleElement();
    this.appliedCount = 0;
  }

  private initializeStyleElement(): void {
    // Check if style element already exists
    this.styleElement = this.doc.getElementById('ai-smooth-styles') as HTMLStyleElement;
    
    if (!this.styleElement) {
      this.styleElement = this.doc.createElement('style');
      this.styleElement.id = 'ai-smooth-styles';
      this.styleElement.textContent = `
        /* AI Smooth Update Transitions */
        :root {
          --ai-transition-speed: 0.3s;
          --ai-transition-ease: ease;
        }
        
        * {
          transition: 
            background-color var(--ai-transition-speed) var(--ai-transition-ease),
            color var(--ai-transition-speed) var(--ai-transition-ease),
            opacity var(--ai-transition-speed) var(--ai-transition-ease),
            transform var(--ai-transition-speed) var(--ai-transition-ease),
            border-color var(--ai-transition-speed) var(--ai-transition-ease);
        }
      `;
      this.doc.head.appendChild(this.styleElement);
    }
  }

  /**
   * Queue a diff for application (with batching for smooth updates)
   */
  public queueUpdate(diff: DiffBlock): void {
    this.updateQueue.push(diff);

    // Clear existing batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Batch updates with small delay - prevents jarring multiple re-renders
    this.batchTimeout = setTimeout(() => {
      this.flushQueue();
    }, this.BATCH_DELAY);
  }

  /**
   * Force immediate flush of all queued updates
   * @returns The number of updates that were actually applied
   */
  public async forceFlush(): Promise<number> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.flushQueue();
    return this.appliedCount;
  }

  /**
   * Get the count of successfully applied updates
   */
  public getAppliedCount(): number {
    return this.appliedCount;
  }

  /**
   * Resolve selector to element, handling special cases like 'body', 'html', '#id', '.class'
   */
  private resolveElement(selector: string): HTMLElement | null {
    // Handle special selectors that AI commonly uses
    const cleanSelector = selector.replace(/^#/, '').trim();
    
    // Special case: body or html selectors
    if (cleanSelector === 'body' || cleanSelector.startsWith('body ')) {
      return this.doc.body;
    }
    if (cleanSelector === 'html' || cleanSelector === 'document') {
      return this.doc.documentElement;
    }
    
    // Try direct selector first
    try {
      const element = this.doc.querySelector(selector) as HTMLElement;
      if (element) return element;
    } catch { /* Invalid selector, try alternatives */ }
    
    // Try as ID without #
    try {
      const byId = this.doc.getElementById(cleanSelector);
      if (byId) return byId;
    } catch { /* Not found */ }
    
    // Try common variations
    const variations = [
      `#${cleanSelector}`,
      `.${cleanSelector}`,
      `[data-id="${cleanSelector}"]`,
      `[id="${cleanSelector}"]`,
    ];
    
    for (const variant of variations) {
      try {
        const element = this.doc.querySelector(variant) as HTMLElement;
        if (element) return element;
      } catch { /* Invalid selector */ }
    }
    
    return null;
  }

  /**
   * Apply all queued updates in optimal order
   * CSS → HTML → JS (with minimal reflows)
   */
  private async flushQueue(): Promise<void> {
    if (this.isUpdating || this.updateQueue.length === 0) return;

    this.isUpdating = true;
    const updates = [...this.updateQueue];
    this.updateQueue = [];

    try {
      // Group by type: CSS first (visual feedback), then HTML, then JS
      const cssUpdates = updates.filter(d => d.type === 'css');
      const htmlUpdates = updates.filter(d => d.type === 'html');
      const jsUpdates = updates.filter(d => d.type === 'js');

      // Apply CSS first (instant visual feedback)
      if (cssUpdates.length > 0) {
        this.appliedCount += this.applyCSSUpdates(cssUpdates);
      }

      // Small delay after CSS so user sees visual feedback
      if (htmlUpdates.length > 0) {
        await this.delay(16); // One frame
        this.appliedCount += await this.applyHTMLUpdates(htmlUpdates);
      }

      // JS last
      if (jsUpdates.length > 0) {
        await this.delay(16);
        this.appliedCount += this.applyJSUpdates(jsUpdates);
      }

    } catch (error) {
      console.error('[SmoothDOM] Error applying updates:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Apply CSS updates with NO REFLOW
   * Single write to style element
   */
  private applyCSSUpdates(diffs: DiffBlock[]): number {
    if (!this.styleElement) return 0;

    // Combine all CSS changes into single update (one reflow)
    const cssContent = diffs.map(d => d.content).join('\n');

    // Append to existing styles
    const existingCSS = this.styleElement.textContent || '';
    this.styleElement.textContent = existingCSS + '\n' + cssContent;

    console.log(`[SmoothDOM] Applied ${diffs.length} CSS update(s)`);
    return diffs.length; // CSS always applies
  }

  /**
   * Apply HTML updates with smart diffing
   * Only updates changed DOM elements
   * @returns Number of successfully applied updates
   */
  private async applyHTMLUpdates(diffs: DiffBlock[]): Promise<number> {
    let applied = 0;
    
    for (const diff of diffs) {
      if (!diff.path) continue;

      // Use improved element resolution
      const element = this.resolveElement(diff.path);
      
      switch (diff.operation) {
        case 'modify':
          if (element) {
            // Fade effect
            element.style.opacity = '0.7';
            element.innerHTML = diff.content;
            // Animate back
            await this.delay(0);
            element.style.opacity = '1';
            console.log(`[SmoothDOM] Modified ${diff.path}`);
            applied++;
          } else {
            // Element doesn't exist - try to inject into body
            if (this.injectHTML(diff.path, diff.content)) {
              applied++;
            }
          }
          break;

        case 'add':
          if (this.injectHTML(diff.path, diff.content)) {
            applied++;
          }
          break;

        case 'append':
          if (element) {
            element.innerHTML += diff.content;
            console.log(`[SmoothDOM] Appended to ${diff.path}`);
            applied++;
          }
          break;

        case 'delete':
          if (element) {
            element.style.opacity = '0';
            await this.delay(300);
            element.remove();
            console.log(`[SmoothDOM] Removed ${diff.path}`);
            applied++;
          }
          break;
      }
    }
    
    return applied;
  }

  /**
   * Inject HTML into the document
   * @returns true if injection succeeded
   */
  private injectHTML(selector: string, content: string): boolean {
    try {
      // Try to find parent element
      const parentSelector = selector.split(' ').slice(0, -1).join(' ') || 'body';
      const parent = this.resolveElement(parentSelector) || this.doc.body;

      const temp = this.doc.createElement('div');
      temp.innerHTML = content;

      while (temp.firstChild) {
        parent.appendChild(temp.firstChild);
      }

      console.log(`[SmoothDOM] Injected HTML near ${selector}`);
      return true;
    } catch (error) {
      console.warn(`[SmoothDOM] Failed to inject HTML for ${selector}:`, error);
      return false;
    }
  }

  /**
   * Apply JavaScript changes safely
   * Hot-swap functions without page reload
   * @returns Number of successfully applied JS updates
   */
  private applyJSUpdates(diffs: DiffBlock[]): number {
    const iframeWindow = this.doc.defaultView;
    if (!iframeWindow) return 0;

    let applied = 0;
    for (const diff of diffs) {
      try {
        // Evaluate new function in iframe context
        const fn = new Function(diff.content);
        fn.call(iframeWindow);
        console.log(`[SmoothDOM] Applied JS: ${diff.path || 'anonymous'}`);
        applied++;
      } catch (error) {
        console.error(`[SmoothDOM] Failed to apply JS (${diff.path}):`, error);
        // Silently fail - don't break the entire page
      }
    }
    return applied;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// STREAMING UPDATE HANDLER
// Orchestrates parser + orchestrator for complete streaming flow
// ============================================================================

export class StreamingUpdateHandler {
  private parser: StreamingDiffParser;
  private orchestrator: SmoothDOMOrchestrator;
  private startTime: number = 0;

  constructor(iframeDoc: Document) {
    this.parser = new StreamingDiffParser();
    this.orchestrator = new SmoothDOMOrchestrator(iframeDoc);
  }

  /**
   * Main entry point - handle streaming from AI
   * This processes the response WHILE it's being generated
   */
  public async handleAIStream(
    response: Response,
    onProgress?: (stats: StreamProgress) => void
  ): Promise<{ success: boolean; totalDiffs: number }> {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    this.startTime = Date.now();
    this.parser.reset();
    
    let totalChars = 0;
    let chunkCount = 0;
    let totalDiffs = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream complete - flush any remaining updates
          await this.orchestrator.forceFlush();
          
          onProgress?.({
            chars: totalChars,
            tokens: Math.round(totalChars / 4),
            chunks: chunkCount,
            elapsed: Math.round((Date.now() - this.startTime) / 1000),
            isStreaming: false,
          });
          
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        totalChars += chunk.length;
        chunkCount++;

        // Parse the chunk and get diffs IMMEDIATELY
        const diffs = this.parser.parseStreamChunk(chunk);

        // Queue each diff for application
        for (const diff of diffs) {
          this.orchestrator.queueUpdate(diff);
          totalDiffs++;
        }

        // Report progress
        onProgress?.({
          chars: totalChars,
          tokens: Math.round(totalChars / 4),
          chunks: chunkCount,
          elapsed: Math.round((Date.now() - this.startTime) / 1000),
          isStreaming: true,
        });
      }

      return { success: true, totalDiffs };

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[StreamHandler] Stream cancelled');
        return { success: false, totalDiffs };
      }
      throw error;
    }
  }

  /**
   * Get raw buffer for fallback processing
   */
  public getRawBuffer(): string {
    return this.parser.getBuffer();
  }
}

// ============================================================================
// DELTA PROMPT BUILDER
// Helper to create prompts that instruct AI to use delta format
// ============================================================================

export const buildDeltaPromptInstructions = (): string => `
## CRITICAL: DELTA FORMAT INSTRUCTIONS

You are modifying an existing page. Do NOT regenerate the entire page.
Send ONLY the sections that need to change using these exact markers:

### For CSS changes:
\`\`\`
<!-- CSS_START -->
.button { background: blue; transition: all 0.3s ease; }
:root { --primary: #007bff; }
<!-- CSS_END -->
\`\`\`

### For HTML changes:
\`\`\`
<!-- HTML_START #element-selector -->
<div class="new-content">Updated content here</div>
<!-- HTML_END -->
\`\`\`

### For JavaScript changes:
\`\`\`
<!-- JS_START functionName -->
function functionName() {
  // New or modified function code
}
<!-- JS_END -->
\`\`\`

### RULES:
1. Return ONLY changed sections - not the entire page
2. Use CSS variables for theme changes (instant visual feedback)
3. Add transition properties for smooth animations
4. Preserve all existing code that wasn't modified
5. Be surgical with edits - minimal changes
`;
