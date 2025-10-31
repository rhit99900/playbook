import { ChromaClient } from "chromadb";
import { CHROMA_COLLECTION_NAME } from "../config";
import { FileDetails } from "./drive.utils";

const Chroma = new ChromaClient();
let DocumentCollection: any;

export type MetaData = {
  id: string | null | undefined;
  chunkIndex: number;
}

const initialiseChromaDB = async () => {
  console.log(`Initialising ChromaDB Client`);
  try {
    DocumentCollection = await Chroma.getOrCreateCollection({ name: CHROMA_COLLECTION_NAME});
    console.log(`ChromaDB Collection ${CHROMA_COLLECTION_NAME} is Ready`);
  } catch(e: any) {
    console.error(`Failed to initialise ChromaDB`, e?.message);
    console.log(`Attempting Fallback to create a new client. Likely In-Memory`);
    DocumentCollection = await Chroma.getOrCreateCollection({ name: CHROMA_COLLECTION_NAME});
  }
}

const updateCollections = async (chunks: string[], file: FileDetails, embeddings: any) => {
  try {
    const ids = chunks.map((_,i) => `${file.id}-chunk-${i}`);
    const metadata: MetaData[] = chunks.map((_,i) => ({ id: file.id, chunkIndex: i}));
    await DocumentCollection.add({
      ids: ids,
      embeddings: embeddings,
      document: chunks,
      metadata: metadata
    })
  } catch(e) {
    console.error(`Failed to update data`);
  }
}

export {
  initialiseChromaDB,
  updateCollections,
  DocumentCollection
}