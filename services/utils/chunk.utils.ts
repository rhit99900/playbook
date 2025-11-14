import { CHUNK_OVERLAP, CHUNK_SIZE } from "../config";

const MERMAID_BLOCK_PATTERN = /```mermaid[\s\S]*?```/gi;

const chunkText = (text: string) => {
  if (!text?.length) {
    return [];
  }

  const protectedSpans = findMermaidSpans(text);
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextSpan = protectedSpans.find((span) => span.start <= cursor && span.end > cursor);

    if (nextSpan) {
      chunks.push(text.substring(nextSpan.start, nextSpan.end));
      cursor = nextSpan.end;
      continue;
    }

    const spanAfterCursor = protectedSpans.find((span) => span.start >= cursor);
    const blockEnd = spanAfterCursor ? Math.min(spanAfterCursor.start, cursor + CHUNK_SIZE) : Math.min(text.length, cursor + CHUNK_SIZE);
    chunks.push(text.substring(cursor, blockEnd));
    if (blockEnd === text.length) {
      break;
    }
    cursor = Math.max(blockEnd - CHUNK_OVERLAP, cursor + 1);
  }

  return mergeSmallChunks(chunks);
};

type Span = { start: number; end: number };

const findMermaidSpans = (text: string): Span[] => {
  const spans: Span[] = [];
  let match: RegExpExecArray | null;
  while ((match = MERMAID_BLOCK_PATTERN.exec(text)) !== null) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return spans;
};

const mergeSmallChunks = (chunks: string[]): string[] => {
  if (chunks.length <= 1) return chunks;
  const merged: string[] = [];
  let buffer = '';

  chunks.forEach((chunk) => {
    if (!buffer.length) {
      buffer = chunk;
      return;
    }
    if (buffer.length + chunk.length <= CHUNK_SIZE * 1.5) {
      buffer += chunk;
    } else {
      merged.push(buffer);
      buffer = chunk;
    }
  });

  if (buffer.length) {
    merged.push(buffer);
  }

  return merged;
};

export {
  chunkText
};
