import { ChromaClient } from "chromadb";
import { CHROMA_COLLECTION_NAME, CHROMADB_HOST_URI, CHROMADB_PORT } from "../config";
import { FileDetails } from "./drive.utils";

const Chroma = new ChromaClient({
  host: CHROMADB_HOST_URI,
  port: CHROMADB_PORT
});

type CollectionCache = Record<string, any>;

const collectionCache: CollectionCache = {};

let DocumentCollection: any;

const getCollectionByName = async (name: string = CHROMA_COLLECTION_NAME) => {
  if (collectionCache[name]) {
    return collectionCache[name];
  }

  try {
    const collection = await Chroma.getOrCreateCollection({ name });
    collectionCache[name] = collection;
    if (name === CHROMA_COLLECTION_NAME) {
      DocumentCollection = collection;
    }
    return collection;
  } catch (e: any) {
    console.error(`Failed to initialise Chroma collection ${name}`, e?.message);
    console.log(`Attempting fallback to create an in-memory collection ${name}`);
    const collection = await Chroma.getOrCreateCollection({ name });
    collectionCache[name] = collection;
    if (name === CHROMA_COLLECTION_NAME) {
      DocumentCollection = collection;
    }
    return collection;
  }
}

const ensureDocumentCollection = async () => {
  if (!DocumentCollection) {
    await initialiseChromaDB();
  }
  return DocumentCollection;
}

export type MetaData = {
  id: string | null | undefined;
  chunkIndex: number;
  fileUrl?: string | null;
  path?: string | null;
  repo?: string | null;
  branch?: string | null;
  startLine?: number | null;
  endLine?: number | null;
  source?: string | null;
}

const initialiseChromaDB = async () => {
  console.log(`Initialising ChromaDB Client`);
  DocumentCollection = await getCollectionByName(CHROMA_COLLECTION_NAME);
  console.log(`ChromaDB Collection ${CHROMA_COLLECTION_NAME} is Ready`);
}

type AddEmbeddingsParams = {
  ids: string[];
  documents: string[];
  embeddings: any;
  metadatas: MetaData[];
  collectionName?: string;
};

const addEmbeddingsToCollection = async (params: AddEmbeddingsParams) => {
  const { ids, documents, embeddings, metadatas, collectionName = CHROMA_COLLECTION_NAME } = params;
  try {
    const collection = await getCollectionByName(collectionName);
    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas
    });
  } catch (e) {
    console.error(`Failed to update collection ${collectionName}`);
  }
}

const updateCollections = async (chunks: string[], file: FileDetails, embeddings: any, collectionName?: string) => {
  const ids = chunks.map((_, i) => `${file.id}-chunk-${i}`);
  const metadata: MetaData[] = chunks.map((_, i) => ({
    id: file.id,
    chunkIndex: i,
    fileUrl: file.webViewLink,
    source: 'google-drive'
  }));
  await addEmbeddingsToCollection({
    ids,
    embeddings,
    documents: chunks,
    metadatas: metadata,
    collectionName
  });
}

const deleteEmbeddingsByFileIds = async (fileIds: string[], collectionName: string = CHROMA_COLLECTION_NAME) => {
  if (!fileIds || !fileIds.length) return;
  try {
    const collection = await getCollectionByName(collectionName);
    if (!collection) return;
    for (const fileId of fileIds) {
      if (!fileId) continue;
      await collection.delete({
        where: { id: fileId }
      });
    }
  } catch (e) {
    console.error('Failed to delete embeddings for files', e);
  }
}

const getChromaStatus = async (collectionName: string = CHROMA_COLLECTION_NAME) => {
  try {
    const collection = await getCollectionByName(collectionName);
    if (!collection) {
      throw new Error('Collection unavailable');
    }
    let documentCount: number | null = null;
    if (typeof collection.count === 'function') {
      documentCount = await collection.count();
    }
    return {
      connected: true,
      collectionName,
      documentCount
    }
  } catch (e) {
    console.error('Failed to fetch Chroma status', e);
    return {
      connected: false,
      collectionName,
      documentCount: null
    }
  }
}

export {
  initialiseChromaDB,
  updateCollections,
  addEmbeddingsToCollection,
  DocumentCollection,
  deleteEmbeddingsByFileIds,
  getChromaStatus,
  getCollectionByName
}
