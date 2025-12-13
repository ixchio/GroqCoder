
// Mock of the StreamingDiffParser class from lib/smooth-streaming.ts
class StreamingDiffParser {
  constructor() {
    this.buffer = '';
    this.processedHashes = new Set();
  }

  parseStreamChunk(chunk) {
    this.buffer += chunk;
    const diffs = [];

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
          priority: 1,
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
          priority: 2,
          timestamp: Date.now(),
        });
        this.processedHashes.add(hash);
      }
    }

    return diffs;
  }

  hashContent(type, content) {
    let hash = 0;
    const str = type + content;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  detectOperation(selector) {
    if (selector.includes('DELETE') || selector.includes('REMOVE')) return 'delete';
    if (selector.includes('ADD') || selector.includes('NEW')) return 'add';
    if (selector.includes('APPEND')) return 'append';
    return 'modify';
  }
}

// Test Runner
async function runTest() {
  console.log('🧪 Testing StreamingDiffParser...');
  const parser = new StreamingDiffParser();

  // Test Case 1: CSS Streaming
  console.log('\nTest 1: Streaming CSS');
  const chunks1 = [
    'Here is some text',
    '<!-- CSS_START -->\n.btn { color: red; }',
    '\n<!-- CSS_END -->',
  ];
  
  for (const chunk of chunks1) {
    const diffs = parser.parseStreamChunk(chunk);
    if (diffs.length > 0) {
      console.log('✅ Found CSS diff:', diffs[0].content);
    }
  }

  // Test Case 2: HTML Streaming (Split across chunks)
  console.log('\nTest 2: Streaming HTML (Split chunks)');
  parser.buffer = ''; 
  parser.processedHashes.clear();
  
  const chunks2 = [
    '<!-- HTML_START #header -->',
    '<div class="header">',
    '  <h1>Title</h1>',
    '</div>',
    '<!-- HTML_END -->',
  ];

  let foundHtml = false;
  for (const chunk of chunks2) {
    const diffs = parser.parseStreamChunk(chunk);
    if (diffs.length > 0) {
      console.log('✅ Found HTML diff for:', diffs[0].path);
      console.log('   Content:', diffs[0].content);
      foundHtml = true;
    }
  }
  if (!foundHtml) console.error('❌ Failed to find HTML diff');

  console.log('\n✨ Verification Complete');
}

runTest();
