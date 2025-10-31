import { DocumentCollection, MetaData } from "../utils/chroma.utils";
import { getEmbeddings } from "./embeddings.model";
import openai from "./openai"

export const Responder = async (query: string) => {
  if(!openai.apiKey) {
    throw new Error(`Open API Not Initialised`);
  }

  const queryEmbeddings = await getEmbeddings([query]);
  
  const results = await DocumentCollection.query({
    queryEmbeddings: queryEmbeddings,
    nResults: 3,
    include: ['documents', 'metadatas', 'distances']
  });

  const context = results.documents[0].join('\n--\n');
  const source = results.metadatas[0].map((meta: MetaData | null) => `Document ID: ${meta?.id}, Chunk Index: ${meta?.chunkIndex}`).join('; ');

  console.log(`--- Retrieved Context ---`);
  console.log(context);
  console.log(`Source(s): ${source}`);
  console.log('-------------------------\n');

  console.log(`Asking LLM to generate resposne`);

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: "system", 
          content: 'You are a helpful assistant. Answer the user\'s question based ONLY on the provided document content. If the answer is not in the document, state that you cannot find the information.'
        },
        {
          role: 'user',
          content: `Document Content: """\n${context}\n"""\n\nQuestion: "${query}"`
        }
      ],
      max_completion_tokens: 250,
      temperature: 0.2
    });

    return chatCompletion.choices[0].message.content;
  } catch(e: any) {
    console.error('Error calling OpenAI API:', e.message);
    return 'There was an error generating the answer with the LLM.';
  }

}