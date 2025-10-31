import { CHUNK_OVERLAP, CHUNK_SIZE } from "../config";

const chunkText = (text: string) => {
  const chunks = [];
  let i = 0;
  while(i < text.length) {
    let end = Math.min(i + CHUNK_SIZE, text.length);
    let chunk = text.substring(i, end);
    chunks.push(chunk);
    if(end === text.length) {
      break;
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export {
  chunkText
}