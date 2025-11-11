import { ChromaClient } from "chromadb";
import { CHROMA_COLLECTION_NAME, CHROMADB_HOST_URI, CHROMADB_PORT } from "../config";
import { FileDetails } from "./drive.utils";

const Chroma = new ChromaClient({
  host: CHROMADB_HOST_URI,
  port: CHROMADB_PORT
});

let DocumentCollection: any;

const ensureDocumentCollection = async () => {
  if(!DocumentCollection) {
    await initialiseChromaDB();
  }
  return DocumentCollection;
}

export type MetaData = {
  id: string | null | undefined;
  chunkIndex: number;
  fileUrl?: string | null;
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
    await ensureDocumentCollection();
    const ids = chunks.map((_,i) => `${file.id}-chunk-${i}`);
    const metadata: MetaData[] = chunks.map((_,i) => ({
      id: file.id,
      chunkIndex: i,
      fileUrl: file.webViewLink
    }));
    await DocumentCollection.add({
      ids: ids,
      embeddings: embeddings,
      documents: chunks,
      metadatas: metadata
    })
  } catch(e) {
    console.error(`Failed to update data`);
  }
}

const deleteEmbeddingsByFileIds = async (fileIds: string[]) => {
  if(!fileIds || !fileIds.length) return;
  try {
    const collection = await ensureDocumentCollection();
    if(!collection) return;
    for (const fileId of fileIds) {
      if(!fileId) continue;
      await collection.delete({
        where: { id: fileId }
      });
    }
  } catch(e) {
    console.error('Failed to delete embeddings for files', e);
  }
}

const getChromaStatus = async () => {
  try {
    const collection = await ensureDocumentCollection();
    if(!collection) {
      throw new Error('Collection unavailable');
    }
    let documentCount: number | null = null;
    if (typeof collection.count === 'function') {
      documentCount = await collection.count();
    }
    return {
      connected: true,
      collectionName: CHROMA_COLLECTION_NAME,
      documentCount
    }
  } catch(e) {
    console.error('Failed to fetch Chroma status', e);
    return {
      connected: false,
      collectionName: CHROMA_COLLECTION_NAME,
      documentCount: null
    }
  }
}

export {
  initialiseChromaDB,
  updateCollections,
  DocumentCollection,
  deleteEmbeddingsByFileIds,
  getChromaStatus
}
