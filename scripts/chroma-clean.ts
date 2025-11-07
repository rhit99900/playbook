import { ChromaClient } from "chromadb";
import { CHROMA_COLLECTION_NAME } from "../services/config";

const cleanup = async () => {
  const client = new ChromaClient();
  try {
    await client.deleteCollection({ name: CHROMA_COLLECTION_NAME });
    console.log(`ChromaDB collection "${CHROMA_COLLECTION_NAME}" deleted successfully.`);
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      console.log(`ChromaDB collection "${CHROMA_COLLECTION_NAME}" does not exist.`);
    } else {
      console.error(`Failed to delete ChromaDB collection "${CHROMA_COLLECTION_NAME}":`, error?.message || error);
      process.exitCode = 1;
    }
    return;
  }
};

cleanup()
  .catch((error) => {
    console.error('Unexpected error while deleting ChromaDB collection:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    // Allow logs to flush before exiting.
    setTimeout(() => process.exit(), 100);
  });
