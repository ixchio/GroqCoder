// Diff utilities for computing and applying programmatic diffs
// Uses jsdiff library for reliable text comparison

import * as Diff from 'diff';

export interface DiffPatch {
  lineChanges: LineChange[];
  addedLines: number;
  removedLines: number;
  changedLines: number;
  hasChanges: boolean;
}

export interface LineChange {
  type: 'add' | 'remove' | 'unchanged';
  lineNumber: number;
  content: string;
}

/**
 * Compute line-by-line diff between old and new code
 */
export function computeDiff(oldCode: string, newCode: string): DiffPatch {
  const changes = Diff.diffLines(oldCode, newCode);
  
  const lineChanges: LineChange[] = [];
  let lineNumber = 1;
  let addedLines = 0;
  let removedLines = 0;
  
  for (const change of changes) {
    const lines = change.value.split('\n').filter((line, index, arr) => 
      // Filter out the last empty string from split
      index !== arr.length - 1 || line !== ''
    );
    
    for (const line of lines) {
      if (change.added) {
        lineChanges.push({
          type: 'add',
          lineNumber,
          content: line
        });
        addedLines++;
        lineNumber++;
      } else if (change.removed) {
        lineChanges.push({
          type: 'remove',
          lineNumber,
          content: line
        });
        removedLines++;
        // Don't increment lineNumber for removed lines
      } else {
        lineChanges.push({
          type: 'unchanged',
          lineNumber,
          content: line
        });
        lineNumber++;
      }
    }
  }
  
  return {
    lineChanges,
    addedLines,
    removedLines,
    changedLines: addedLines + removedLines,
    hasChanges: addedLines > 0 || removedLines > 0
  };
}

/**
 * Get ranges of lines that were modified (for highlighting in editor)
 * Returns array of [startLine, endLine] tuples
 */
export function getUpdatedLineRanges(oldCode: string, newCode: string): number[][] {
  const changes = Diff.diffLines(oldCode, newCode);
  const ranges: number[][] = [];
  
  let lineNumber = 1;
  let currentRangeStart: number | null = null;
  let currentRangeEnd: number | null = null;
  
  for (const change of changes) {
    const lineCount = (change.value.match(/\n/g) || []).length + 
      (change.value.endsWith('\n') ? 0 : 1);
    
    if (change.added) {
      // Start or extend a range
      if (currentRangeStart === null) {
        currentRangeStart = lineNumber;
      }
      currentRangeEnd = lineNumber + lineCount - 1;
      lineNumber += lineCount;
    } else if (change.removed) {
      // Mark the position but don't advance line numbers
      if (currentRangeStart === null) {
        currentRangeStart = lineNumber;
        currentRangeEnd = lineNumber;
      }
    } else {
      // Unchanged block - close any open range
      if (currentRangeStart !== null && currentRangeEnd !== null) {
        ranges.push([currentRangeStart, currentRangeEnd]);
        currentRangeStart = null;
        currentRangeEnd = null;
      }
      lineNumber += lineCount;
    }
  }
  
  // Close any remaining open range
  if (currentRangeStart !== null && currentRangeEnd !== null) {
    ranges.push([currentRangeStart, currentRangeEnd]);
  }
  
  return ranges;
}

/**
 * Create a unified diff string (for debugging/display)
 */
export function createUnifiedDiff(
  oldCode: string, 
  newCode: string, 
  fileName: string = 'file.html'
): string {
  return Diff.createPatch(fileName, oldCode, newCode, '', '');
}

/**
 * Apply a patch to code (reconstruct from unified diff)
 */
export function applyUnifiedPatch(oldCode: string, patchString: string): string | false {
  const result = Diff.applyPatch(oldCode, patchString);
  return result;
}

/**
 * Quick check if two code strings are semantically different
 * (ignores pure whitespace changes at line level)
 */
export function hasRealChanges(oldCode: string, newCode: string): boolean {
  const changes = Diff.diffLines(oldCode, newCode, { ignoreWhitespace: true });
  return changes.some(change => change.added || change.removed);
}

/**
 * Get a simple summary of changes
 */
export function getChangeSummary(oldCode: string, newCode: string): string {
  const diff = computeDiff(oldCode, newCode);
  
  if (!diff.hasChanges) {
    return 'No changes detected';
  }
  
  const parts: string[] = [];
  if (diff.addedLines > 0) {
    parts.push(`+${diff.addedLines} lines`);
  }
  if (diff.removedLines > 0) {
    parts.push(`-${diff.removedLines} lines`);
  }
  
  return parts.join(', ');
}
