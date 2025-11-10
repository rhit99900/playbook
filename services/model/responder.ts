import { DocumentCollection, MetaData } from "../utils/chroma.utils";
import { getEmbeddings } from "./embeddings.model";
import openai from "./openai";

export type SourceAttribution = {
  documentId: string | null | undefined;
  chunkIndex: number;
  chunk: string;
  distance: number | null;
  fileUrl?: string | null;
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
        distance,
        fileUrl: metadata?.fileUrl
      };
    });

    const contextualisedChunks = sources.map((source, index) => {
      const header = [
        `File ID: ${source.documentId ?? 'Unknown'}`,
        `File Link: ${source.fileUrl ?? 'Unavailable'}`,
        `Chunk Index: ${source.chunkIndex}`
      ].join('\n');
      return `${header}\nContent:\n${source.chunk}`;
    });

    return {
      context: contextualisedChunks.join('\n--\n'),
      chunks: documents,
      sources
    };
  }

  public answerFromContext = async (context: string, sources: SourceAttribution[]): Promise<string | null> => {
    if (!context) {
      return 'Unable to find relevant information in the indexed documents.';
    }
    return this.queryLLM(context, sources);
  }

  public search = async (): Promise<ResponderResult> => {
    const retrieval = await this.retrieveDocuments();
    const answer = await this.answerFromContext(retrieval.context, retrieval.sources);
    const sourceSummary = this.formatSourcesForAnswer(retrieval.sources);
    const baseAnswer = answer ?? 'There was an issue generating an answer from the retrieved context.';
    const finalAnswer = sourceSummary ? `${baseAnswer}\n\nSources:\n${sourceSummary}` : baseAnswer;
    return {
      ...retrieval,
      answer: finalAnswer
    };
  }

  private formatSourcesForAnswer(sources: SourceAttribution[]): string {
    if (!sources.length) return '';
    return sources
      .map((source) => {
        const fileId = source.documentId ?? 'Unknown';
        const fileLink = source.fileUrl ?? 'Link unavailable';
        return `- File ID ${fileId} -> ${fileLink}`;
      })
      .join('\n');
  }

  private formatSourcesForPrompt(sources: SourceAttribution[]): string {
    if (!sources.length) {
      return 'No source metadata available.';
    }
    return sources
      .map((source, index) => {
        const fileId = source.documentId ?? 'Unknown';
        const link = source.fileUrl ?? 'Unavailable';
        const distance = typeof source.distance === 'number' ? source.distance.toFixed(4) : 'N/A';
        return `Source ${index + 1}: File ID=${fileId}, Link=${link}, Chunk Index=${source.chunkIndex}, Distance=${distance}`;
      })
      .join('\n');
  }

  private queryLLM = async (context: string, sources: SourceAttribution[]): Promise<string | null> => {
    console.log(`Asking LLM to generate response`);
    try {
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: "system", 
            content: `
              You are a helpful assistant. Answer the user\'s question based ONLY on the provided document content. If the answer is not in the document, state that you cannot find the information.
              Always cite the File ID alongside its link for every referenced fact so the user can open the original document. 
              Ensure any code or script output is provided in fenced markdown blocks so it renders correctly on the client side.
            `
          },
          {
            role: 'user',
            content: `Document Content:\n"""\n${context}\n"""\n\nSource Metadata:\n${this.formatSourcesForPrompt(sources)}\n\nQuestion: "${this.query}"`
          }
        ],
        max_completion_tokens: 500,
      });

      return chatCompletion.choices[0].message.content;
    } catch(e: any) {
      console.error('Error calling OpenAI API:', e.message);
      return 'There was an error generating the answer with the LLM.';
    }
  }
}

export default Responder;
