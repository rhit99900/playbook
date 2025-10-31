import { error } from "console";
import openai from "./openai"
import { chunkText } from "../utils/chunk.utils";

const getEmbeddings = async (texts: string[] | undefined) => {
  if(!texts) return [];  
  // Initialization logic for the embeddings model
  if(!openai.apiKey) {
    throw new Error("OpenAI API key is not configured."); 
  }

  try {    
    const respone = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texts
    });
    return respone.data.map(item => item.embedding);    
  } catch(e) { 
    // @ts-ignore
    console.error("Error creating embeddings:", e?.message);
    throw e;
  }
}

export { 
  getEmbeddings
}