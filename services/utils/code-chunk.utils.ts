type CodeChunk = {
  content: string;
  startLine: number;
  endLine: number;
};

const chunkCode = (content: string, maxLines: number = 120, overlap: number = 20): CodeChunk[] => {
  if (!content) return [];

  const lines = content.split('\n');
  const chunks: CodeChunk[] = [];

  let start = 0;
  while (start < lines.length) {
    const end = Math.min(lines.length, start + maxLines);
    const chunkLines = lines.slice(start, end);
    chunks.push({
      content: chunkLines.join('\n'),
      startLine: start + 1,
      endLine: end
    });

    if (end === lines.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
};

export {
  chunkCode,
  type CodeChunk
};
