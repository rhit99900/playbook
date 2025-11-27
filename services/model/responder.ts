import { CHROMA_COLLECTION_NAME } from "../config";
import { MetaData, getCollectionByName } from "../utils/chroma.utils";
import { getEmbeddings } from "./embeddings.model";
import openai from "./openai";

const extractMermaidDefinitions = (text: string): string[] => {
  if (!text) {
    return [];
  }

  const definitions: string[] = [];

  const fencedRegex = /```mermaid([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = fencedRegex.exec(text)) !== null) {
    const definition = cleanMermaidDefinition(match[1]);
    if (definition) {
      definitions.push(definition);
    }
  }

  if (!definitions.length) {
    const heuristicDefinition = detectHeuristicDiagram(text);
    if (heuristicDefinition) {
      definitions.push(heuristicDefinition);
    }
  }

  return definitions;
};

const cleanMermaidDefinition = (raw: string | undefined | null): string | null => {
  if (!raw) return null;
  let definition = raw.trim();
  if (definition.startsWith('```')) {
    definition = definition.replace(/^```/, '').trim();
  }
  if (definition.startsWith('mermaid')) {
    definition = definition.replace(/^mermaid/, '').trim();
  }
  return definition.length ? definition : null;
};

const detectHeuristicDiagram = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed.length) {
    return null;
  }

  const hasDiagramKeywords =
    /\b(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|pie|gantt|erDiagram)\b/i.test(trimmed);
  const hasArrowSymbols = /-->|==>|-.->|==.*==/.test(trimmed);

  if (!hasDiagramKeywords && !hasArrowSymbols) {
    return null;
  }

  const maybeDefinition = cleanMermaidDefinition(trimmed);
  if (maybeDefinition) {
    return maybeDefinition;
  }

  return trimmed.length ? trimmed : null;
};

export type MermaidDiagram = {
  id: string;
  definition: string;
  sourceDocumentId?: string | null;
  chunkIndex?: number;
};

export type SourceAttribution = {
  documentId: string | null | undefined;
  chunkIndex: number;
  chunk: string;
  distance: number | null;
  fileUrl?: string | null;
  mermaidDiagrams?: string[];
  path?: string | null;
  repo?: string | null;
  branch?: string | null;
  startLine?: number | null;
  endLine?: number | null;
  source?: string | null;
};

export type RetrievalResult = {
  context: string;
  chunks: string[];
  sources: SourceAttribution[];
  diagrams: MermaidDiagram[];
};

export type ResponderResult = RetrievalResult & {
  answer: string | null;
};

class Responder {

  private query: string;
  private collectionName: string;
  private embeddings: number[][] | undefined;
  private embeddingsPromise: Promise<number[][]> | null = null;

  constructor(query: string, collectionName: string = CHROMA_COLLECTION_NAME) {
    this.query = query;
    this.collectionName = collectionName;
  }

  private async ensureEmbeddings(): Promise<number[][]> {
    if (!this.embeddingsPromise) {
      this.embeddingsPromise = getEmbeddings([this.query]);
    }
    this.embeddings = await this.embeddingsPromise;
    return this.embeddings;
  }

  public retrieveDocuments = async (nResults: number = 3): Promise<RetrievalResult> => {
    const embeddings = await this.ensureEmbeddings();
    const collection = await getCollectionByName(this.collectionName);

    const results = await collection.query({
      queryEmbeddings: embeddings,
      nResults,
      include: ['documents', 'metadatas', 'distances']
    });

    const documents = results?.documents?.[0] ?? [];
    const metadatas = results?.metadatas?.[0] ?? [];
    const distances = results?.distances?.[0] ?? [];

    type SourceMetaData = MetaData & {
      path?: string | null;
      repo?: string | null;
      branch?: string | null;
      startLine?: number | null;
      endLine?: number | null;
      source?: string | null;
    };

    const sources: SourceAttribution[] = documents.map((chunk: string, index: number) => {
      const metadata = metadatas[index] as SourceMetaData | null | undefined;
      const distance = typeof distances[index] === 'number' ? distances[index] : null;
      const mermaidDiagrams = extractMermaidDefinitions(chunk);
      return {
        documentId: metadata?.id,
        chunkIndex: metadata?.chunkIndex ?? index,
        chunk,
        distance,
        fileUrl: metadata?.fileUrl,
        mermaidDiagrams: mermaidDiagrams.length ? mermaidDiagrams : undefined,
        path: metadata?.path,
        repo: metadata?.repo,
        branch: metadata?.branch,
        startLine: metadata?.startLine,
        endLine: metadata?.endLine,
        source: metadata?.source
      };
    });

    const diagrams: MermaidDiagram[] = [];
    sources.forEach((source) => {
      if (!source.mermaidDiagrams || !source.mermaidDiagrams.length) {
        return;
      }
      source.mermaidDiagrams.forEach((definition, index) => {
        diagrams.push({
          id: `${source.documentId ?? 'unknown'}-${source.chunkIndex}-${index}`,
          definition,
          sourceDocumentId: source.documentId,
          chunkIndex: source.chunkIndex
        });
      });
    });

    const contextualisedChunks = sources.map((source, index) => {
      const headerParts = [
        `File ID: ${source.documentId ?? 'Unknown'}`,
        `Chunk Index: ${source.chunkIndex}`,
      ];

      if (source.path) {
        headerParts.push(`Path: ${source.path}`);
      }
      if (source.branch) {
        headerParts.push(`Branch: ${source.branch}`);
      }
      if (source.startLine || source.endLine) {
        headerParts.push(`Lines: ${source.startLine ?? '?'}-${source.endLine ?? '?'}`);
      }
      headerParts.push(`File Link: ${source.fileUrl ?? 'Unavailable'}`);

      const header = headerParts.join('\n');
      return `${header}\nContent:\n${source.chunk}`;
    });

    return {
      context: contextualisedChunks.join('\n--\n'),
      chunks: documents,
      sources,
      diagrams
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
        const fileId = source.documentId ?? source.path ?? 'Unknown';
        const fileLink = source.fileUrl ?? 'Link unavailable';
        const location = source.startLine
          ? ` (lines ${source.startLine}${source.endLine ? `-${source.endLine}` : ''})`
          : '';
        return `- ${fileId}${location} -> ${fileLink}`;
      })
      .join('\n');
  }

  private formatSourcesForPrompt(sources: SourceAttribution[]): string {
    if (!sources.length) {
      return 'No source metadata available.';
    }
    return sources
      .map((source, index) => {
        const fileId = source.documentId ?? source.path ?? 'Unknown';
        const link = source.fileUrl ?? 'Unavailable';
        const distance = typeof source.distance === 'number' ? source.distance.toFixed(4) : 'N/A';
        const location = source.startLine
          ? `, Lines=${source.startLine}${source.endLine ? `-${source.endLine}` : ''}`
          : '';
        return `Source ${index + 1}: File ID=${fileId}, Path=${source.path ?? 'N/A'}, Link=${link}, Chunk Index=${source.chunkIndex}${location}, Distance=${distance}`;
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
              Produce longer, structured responses that cover every relevant detail with clear headings, short summaries, and concise follow-up guidance.
              Expand on each fact using plain language explanations, avoiding repetition while keeping the narrative easy to scan.
              Always cite the File ID alongside its link for every referenced fact so the user can open the original document. 
              Ensure any code or script output is provided in fenced markdown blocks so it renders correctly on the client side.
            `
          },
          {
            role: 'user',
            content: `Document Content:\n"""\n${context}\n"""\n\nSource Metadata:\n${this.formatSourcesForPrompt(sources)}\n\nQuestion: "${this.query}"`
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 900,
      });

      return chatCompletion.choices[0].message.content;
    } catch(e: any) {
      console.error('Error calling OpenAI API:', e.message);
      return 'There was an error generating the answer with the LLM.';
    }
  }
}

export default Responder;
