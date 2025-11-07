import { DocumentCollection, MetaData } from "../utils/chroma.utils";
import { getEmbeddings } from "./embeddings.model";
import openai from "./openai";

export type SourceAttribution = {
  documentId: string | null | undefined;
  chunkIndex: number;
  chunk: string;
  distance: number | null;
};

export type RetrievalResult = {
  context: string;
  chunks: string[];
  sources: SourceAttribution[];
};

export type ResponderResult = RetrievalResult & {
  answer: string | null;
};

class Responder {

  private query: string;
  private embeddings: number[][] | undefined;
  private embeddingsPromise: Promise<number[][]> | null = null;

  constructor(query: string) {
    this.query = query;
  }

  private async ensureEmbeddings(): Promise<number[][]> {
    if (!this.embeddingsPromise) {
      this.embeddingsPromise = getEmbeddings([this.query]);
    }
    this.embeddings = await this.embeddingsPromise;
    return this.embeddings;
  }

  private assertCollection() {
    if (!DocumentCollection) {
      throw new Error('Document collection has not been initialised');
    }
    return DocumentCollection;
  }

  public retrieveDocuments = async (nResults: number = 3): Promise<RetrievalResult> => {
    const embeddings = await this.ensureEmbeddings();
    const collection = this.assertCollection();

    const results = await collection.query({
      queryEmbeddings: embeddings,
      nResults,
      include: ['documents', 'metadatas', 'distances']
    });

    const documents = results?.documents?.[0] ?? [];
    const metadatas = results?.metadatas?.[0] ?? [];
    const distances = results?.distances?.[0] ?? [];

    const sources: SourceAttribution[] = documents.map((chunk: string, index: number) => {
      const metadata = metadatas[index] as MetaData | null | undefined;
      const distance = typeof distances[index] === 'number' ? distances[index] : null;
      return {
        documentId: metadata?.id,
        chunkIndex: metadata?.chunkIndex ?? index,
        chunk,
        distance
      };
    });

    return {
      context: documents.join('\n--\n'),
      chunks: documents,
      sources
    };
  }

  public answerFromContext = async (context: string): Promise<string | null> => {
    if (!context) {
      return 'Unable to find relevant information in the indexed documents.';
    }
    return this.queryLLM(context);
  }

  public search = async (): Promise<ResponderResult> => {
    const retrieval = await this.retrieveDocuments();
    const answer = await this.answerFromContext(retrieval.context);
    return {
      ...retrieval,
      answer
    };
  }

  private queryLLM = async (context: string): Promise<string | null> => {
    console.log(`Asking LLM to generate response`);
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
            content: `Document Content: """\n${context}\n"""\n\nQuestion: "${this.query}"`
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
}

export default Responder;
