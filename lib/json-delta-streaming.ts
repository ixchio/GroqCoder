/**
 * V0-STYLE JSON DELTA STREAMING
 * 
 * A structured delta protocol for reliable streaming updates.
 * Instead of fragile HTML comment markers, we use a JSON-based format
 * that's easier to parse and more reliable for patching.
 * 
 * Delta Format:
 * {"type":"html","selector":"#hero","op":"replace","content":"<section>...</section>"}
 * {"type":"css","op":"append","content":".btn{...}"}
 * {"type":"js","op":"replace","target":"main","content":"..."}
 * {"type":"full","content":"<!DOCTYPE html>..."}
 */

// ============================================================================
// DELTA TYPES
// ============================================================================

export type DeltaType = 'html' | 'css' | 'js' | 'full' | 'error';
export type DeltaOp = 'replace' | 'append' | 'prepend' | 'delete' | 'insert';

export interface Delta {
  type: DeltaType;
  op: DeltaOp;
  selector?: string;      // For HTML: CSS selector
  target?: string;        // For JS: function name or script id
  content: string;        // The actual content to apply
  line?: number;          // Optional: line number for precise edits
}

export interface StreamProgress {
  chars: number;
  tokens: number;
  elapsed: number;
  deltasApplied: number;
  isStreaming: boolean;
}

// ============================================================================
// JSON DELTA PARSER
// Extracts JSON deltas from a streaming response
// ============================================================================

export class JSONDeltaParser {
  private buffer: string = '';
  private processedHashes: Set<string> = new Set();
  
  /**
   * Parse a chunk of streaming response and extract any complete JSON deltas
   * Supports both JSON-lines format and fallback to HTML comment markers
   */
  public parseStreamChunk(chunk: string): Delta[] {
    this.buffer += chunk;
    const deltas: Delta[] = [];

    // Strategy 1: Try JSON-lines format (one JSON object per line)
    const lines = this.buffer.split('\n');
    const completedLines: number[] = [];
    
    for (let i = 0; i < lines.length - 1; i++) { // Skip last (potentially incomplete) line
      const line = lines[i].trim();
      if (!line) continue;
      
      // Try to parse as JSON
      const delta = this.tryParseJSONDelta(line);
      if (delta) {
        const hash = this.hashDelta(delta);
        if (!this.processedHashes.has(hash)) {
          deltas.push(delta);
          this.processedHashes.add(hash);
        }
        completedLines.push(i);
      }
    }
    
    // Remove processed lines from buffer
    if (completedLines.length > 0) {
      const remainingLines = lines.slice(completedLines[completedLines.length - 1] + 1);
      this.buffer = remainingLines.join('\n');
    }

    // Strategy 2: Fallback to HTML comment markers if no JSON found
    if (deltas.length === 0) {
      const markerDeltas = this.parseHTMLMarkers();
      deltas.push(...markerDeltas);
    }
    
    // Strategy 3: Detect full HTML document as fallback
    if (deltas.length === 0) {
      const fullHtml = this.detectFullHTML();
      if (fullHtml) {
        deltas.push(fullHtml);
      }
    }

    return deltas;
  }
  
  /**
   * Try to parse a line as a JSON delta
   */
  private tryParseJSONDelta(line: string): Delta | null {
    // Quick check - must start with { and end with }
    if (!line.startsWith('{') || !line.endsWith('}')) {
      // Also try to extract JSON from markdown code blocks
      const jsonMatch = line.match(/```json\s*(\{.*\})\s*```/);
      if (jsonMatch) {
        line = jsonMatch[1];
      } else {
        return null;
      }
    }
    
    try {
      const obj = JSON.parse(line);
      
      // Validate delta structure
      if (obj.type && obj.content !== undefined) {
        return {
          type: obj.type as DeltaType,
          op: obj.op || 'replace',
          selector: obj.selector,
          target: obj.target,
          content: obj.content,
          line: obj.line,
        };
      }
    } catch {
      // Not valid JSON
    }
    
    return null;
  }
  
  /**
   * Fallback: Parse HTML comment markers (existing format)
   */
  private parseHTMLMarkers(): Delta[] {
    const deltas: Delta[] = [];
    
    // CSS blocks
    const cssRegex = /<!-- CSS_START -->([\s\S]*?)<!-- CSS_END -->/g;
    let cssMatch;
    while ((cssMatch = cssRegex.exec(this.buffer)) !== null) {
      const content = cssMatch[1].trim();
      const hash = this.hashContent('css', content);
      
      if (!this.processedHashes.has(hash) && content.length > 0) {
        deltas.push({
          type: 'css',
          op: 'append',
          content,
        });
        this.processedHashes.add(hash);
      }
    }
    
    // HTML blocks
    const htmlRegex = /<!-- HTML_START\s+([^\s>]+)\s*-->([\s\S]*?)<!-- HTML_END -->/g;
    let htmlMatch;
    while ((htmlMatch = htmlRegex.exec(this.buffer)) !== null) {
      const selector = htmlMatch[1].trim();
      const content = htmlMatch[2].trim();
      const hash = this.hashContent('html', selector + content);
      
      if (!this.processedHashes.has(hash) && content.length > 0) {
        deltas.push({
          type: 'html',
          op: this.detectOp(selector),
          selector: this.normalizeSelector(selector),
          content,
        });
        this.processedHashes.add(hash);
      }
    }
    
    // JS blocks
    const jsRegex = /<!-- JS_START\s+([^\s>]+)\s*-->([\s\S]*?)<!-- JS_END -->/g;
    let jsMatch;
    while ((jsMatch = jsRegex.exec(this.buffer)) !== null) {
      const target = jsMatch[1].trim();
      const content = jsMatch[2].trim();
      const hash = this.hashContent('js', target + content);
      
      if (!this.processedHashes.has(hash) && content.length > 0 && this.isValidJS(content)) {
        deltas.push({
          type: 'js',
          op: 'replace',
          target,
          content,
        });
        this.processedHashes.add(hash);
      }
    }
    
    return deltas;
  }
  
  /**
   * Detect if buffer contains a full HTML document
   */
  private detectFullHTML(): Delta | null {
    // Look for complete HTML document in response
    const htmlMatch = this.buffer.match(/```html\s*(<!DOCTYPE html>[\s\S]*?<\/html>)\s*```/i) ||
                      this.buffer.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/i);
    
    if (htmlMatch && htmlMatch[1] && htmlMatch[1].length > 100) {
      const content = htmlMatch[1].trim();
      const hash = this.hashContent('full', content);
      
      if (!this.processedHashes.has(hash)) {
        this.processedHashes.add(hash);
        return {
          type: 'full',
          op: 'replace',
          content,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Normalize a selector (handle common AI output variations)
   */
  private normalizeSelector(selector: string): string {
    // Handle body/html special cases
    if (selector === 'body' || selector === 'html' || selector === 'document') {
      return selector;
    }
    
    // Add # prefix if it looks like an ID but missing it
    if (!selector.startsWith('#') && !selector.startsWith('.') && 
        !selector.includes(' ') && /^[a-zA-Z][\w-]*$/.test(selector)) {
      return `#${selector}`;
    }
    
    return selector;
  }
  
  /**
   * Detect operation from selector name
   */
  private detectOp(selector: string): DeltaOp {
    const upper = selector.toUpperCase();
    if (upper.includes('DELETE') || upper.includes('REMOVE')) return 'delete';
    if (upper.includes('ADD') || upper.includes('NEW')) return 'insert';
    if (upper.includes('APPEND')) return 'append';
    if (upper.includes('PREPEND')) return 'prepend';
    return 'replace';
  }
  
  private hashContent(type: string, content: string): string {
    let hash = 0;
    const str = type + content;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
  
  private hashDelta(delta: Delta): string {
    return this.hashContent(
      delta.type, 
      (delta.selector || delta.target || '') + delta.content
    );
  }
  
  private isValidJS(js: string): boolean {
    try {
      new Function(js);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get raw buffer for fallback processing
   */
  public getBuffer(): string {
    return this.buffer;
  }
  
  /**
   * Reset parser state
   */
  public reset(): void {
    this.buffer = '';
    this.processedHashes.clear();
  }
}

// ============================================================================
// DELTA APPLIER
// Applies deltas to the DOM + keeps pages state in sync
// ============================================================================

export class DeltaApplier {
  private appliedCount: number = 0;
  private styleElement: HTMLStyleElement | null = null;
  
  constructor(private doc: Document) {
    this.initializeStyleElement();
  }
  
  private initializeStyleElement(): void {
    this.styleElement = this.doc.getElementById('ai-delta-styles') as HTMLStyleElement;
    
    if (!this.styleElement) {
      this.styleElement = this.doc.createElement('style');
      this.styleElement.id = 'ai-delta-styles';
      this.styleElement.textContent = `
        /* AI Delta Transitions */
        * { transition: all 0.2s ease; }
      `;
      this.doc.head?.appendChild(this.styleElement);
    }
  }
  
  /**
   * Apply a delta to the document
   * Returns true if successfully applied
   */
  public applyDelta(delta: Delta): boolean {
    try {
      switch (delta.type) {
        case 'css':
          return this.applyCSS(delta);
        case 'html':
          return this.applyHTML(delta);
        case 'js':
          return this.applyJS(delta);
        case 'full':
          return this.applyFullDocument(delta);
        default:
          console.warn('[DeltaApplier] Unknown delta type:', delta.type);
          return false;
      }
    } catch (error) {
      console.error('[DeltaApplier] Error applying delta:', error);
      return false;
    }
  }
  
  /**
   * Apply CSS delta
   */
  private applyCSS(delta: Delta): boolean {
    if (!this.styleElement) return false;
    
    // Append CSS to style element
    this.styleElement.textContent += '\n' + delta.content;
    this.appliedCount++;
    console.log('[DeltaApplier] Applied CSS');
    return true;
  }
  
  /**
   * Apply HTML delta
   */
  private applyHTML(delta: Delta): boolean {
    if (!delta.selector) {
      // No selector - try to apply to body
      delta.selector = 'body';
    }
    
    const element = this.resolveElement(delta.selector);
    
    if (!element && delta.op !== 'insert') {
      console.warn('[DeltaApplier] Element not found:', delta.selector);
      // Fallback: try to insert into body
      if (delta.selector !== 'body' && delta.selector !== 'html') {
        return this.insertIntoBody(delta.content);
      }
      return false;
    }
    
    switch (delta.op) {
      case 'replace':
        if (element) {
          element.innerHTML = delta.content;
          this.appliedCount++;
          console.log('[DeltaApplier] Replaced:', delta.selector);
          return true;
        }
        return false;
        
      case 'append':
        if (element) {
          element.innerHTML += delta.content;
          this.appliedCount++;
          console.log('[DeltaApplier] Appended to:', delta.selector);
          return true;
        }
        return false;
        
      case 'prepend':
        if (element) {
          element.innerHTML = delta.content + element.innerHTML;
          this.appliedCount++;
          console.log('[DeltaApplier] Prepended to:', delta.selector);
          return true;
        }
        return false;
        
      case 'delete':
        if (element && element !== this.doc.body && element !== this.doc.documentElement) {
          element.remove();
          this.appliedCount++;
          console.log('[DeltaApplier] Deleted:', delta.selector);
          return true;
        }
        return false;
        
      case 'insert':
        return this.insertIntoBody(delta.content);
    }
    
    return false;
  }
  
  /**
   * Apply JavaScript delta
   */
  private applyJS(delta: Delta): boolean {
    const iframeWindow = this.doc.defaultView;
    if (!iframeWindow) return false;
    
    try {
      const fn = new Function(delta.content);
      fn.call(iframeWindow);
      this.appliedCount++;
      console.log('[DeltaApplier] Applied JS:', delta.target || 'anonymous');
      return true;
    } catch (error) {
      console.error('[DeltaApplier] JS error:', error);
      return false;
    }
  }
  
  /**
   * Apply full document replacement
   */
  private applyFullDocument(delta: Delta): boolean {
    try {
      this.doc.open();
      this.doc.write(delta.content);
      this.doc.close();
      this.appliedCount++;
      console.log('[DeltaApplier] Applied full document');
      return true;
    } catch (error) {
      console.error('[DeltaApplier] Full doc error:', error);
      return false;
    }
  }
  
  /**
   * Resolve selector to element (with smart fallbacks)
   */
  private resolveElement(selector: string): HTMLElement | null {
    // Special cases
    if (selector === 'body') return this.doc.body;
    if (selector === 'html' || selector === 'document') return this.doc.documentElement;
    
    // Try direct selector
    try {
      const element = this.doc.querySelector(selector) as HTMLElement;
      if (element) return element;
    } catch { /* Invalid selector */ }
    
    // Try as ID without #
    const cleanSelector = selector.replace(/^#/, '');
    const byId = this.doc.getElementById(cleanSelector);
    if (byId) return byId;
    
    // Try common variations
    const variations = [
      `#${cleanSelector}`,
      `.${cleanSelector}`,
      `[id="${cleanSelector}"]`,
      `[data-id="${cleanSelector}"]`,
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
   * Insert content into body
   */
  private insertIntoBody(content: string): boolean {
    try {
      const temp = this.doc.createElement('div');
      temp.innerHTML = content;
      
      while (temp.firstChild) {
        this.doc.body.appendChild(temp.firstChild);
      }
      
      this.appliedCount++;
      console.log('[DeltaApplier] Inserted into body');
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get count of applied deltas
   */
  public getAppliedCount(): number {
    return this.appliedCount;
  }
  
  /**
   * Get current document HTML
   */
  public getDocumentHTML(): string {
    return `<!DOCTYPE html>\n${this.doc.documentElement.outerHTML}`;
  }
}

// ============================================================================
// DELTA PROMPT BUILDER
// Instructions for the AI to use JSON delta format
// ============================================================================

export const JSON_DELTA_SYSTEM_PROMPT = `
## STREAMING DELTA FORMAT

When modifying existing code, output changes as JSON deltas (one per line):

### For CSS changes:
\`\`\`
{"type":"css","op":"append","content":".btn { background: blue; }"}
\`\`\`

### For HTML changes:
\`\`\`
{"type":"html","op":"replace","selector":"#hero","content":"<section class=\\"hero\\">New content</section>"}
\`\`\`

### For JavaScript changes:
\`\`\`
{"type":"js","op":"replace","target":"handleClick","content":"function handleClick() { console.log('clicked'); }"}
\`\`\`

### Operations:
- \`replace\`: Replace element's innerHTML
- \`append\`: Add to end of element
- \`prepend\`: Add to start of element
- \`delete\`: Remove the element
- \`insert\`: Insert new element into body

### Common selectors:
- \`body\`: The body element
- \`#id\`: Element by ID
- \`.class\`: Element by class
- \`header\`, \`main\`, \`footer\`: Semantic elements

### Rules:
1. Output ONE JSON delta per line
2. Use valid JSON with escaped quotes in content
3. Be surgical - only output what changes
4. CSS first for instant visual feedback
5. If making many changes, output multiple deltas
`;
