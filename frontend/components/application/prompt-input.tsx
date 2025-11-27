"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { buildResponderStreamUrl } from "@/lib/apis";
import { MermaidDiagram, ResponderAnswerEvent, ResponderContextEvent, ResponderStatusEvent, SourceAttribution } from "@/lib/common.types";
import { useAppSelector } from "@/utils/state/hooks";
import { RootState } from "@/utils/state/store";
import MermaidDiagramCard from "./mermaid-diagram";
import { BookTextIcon, BotIcon, FileCodeCornerIcon } from "lucide-react";

const parseEvent = <T,>(event: MessageEvent): T | null => {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
};

const sanitizeHref = (href?: string): string | undefined => {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (!trimmed.length) return undefined;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
};

const CodeBlock: NonNullable<Components["code"]> = ({
  // @ts-ignore
  inline,
  className,
  children,
  ...props
}) => {  
  if (className === undefined) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary" {...props}>
        {children}
      </code>
    );
  }
  return (
    <pre className="text-xs overflow-auto rounded-lg dark:bg-black p-4 mt-1 mb-1 dark:text-zinc-50 bg-zinc-200 text-primary">
      <code className={`font-mono ${className || ""}`} {...props}>
        {children}
      </code>
    </pre>
  );
};

const markdownComponents: Components = {
  a: ({ children, href, ...props }) => {
    const safeHref = sanitizeHref(href);
    return (
      <a
        {...props}
        href={safeHref}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-primary underline decoration-dotted underline-offset-4 hover:text-primary/80"
      >
        {children}
      </a>
    );
  },
  code: CodeBlock,
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-zinc-900 dark:text-zinc-50">{children}</p>
  ),
  ul: ({ children }) => <ul className="text-sm list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="text-sm list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="text-sm border-l-4 border-primary/40 pl-4 italic text-zinc-600 dark:text-zinc-300">
      {children}
    </blockquote>
  ),
};

const PromptInput = () => {
  const [ prompt, setPrompt ] = useState<string>('');
  const [ statusMessage, setStatusMessage ] = useState<string>('');
  const [ answer, setAnswer ] = useState<string>('');
  const [ context, setContext ] = useState<string>('');
  const [ sources, setSources ] = useState<SourceAttribution[]>([]);
  const [ diagrams, setDiagrams ] = useState<MermaidDiagram[]>([]);
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null);
  const [ isStreaming, setIsStreaming ] = useState<boolean>(false);
  const [ sourceTarget, setSourceTarget ] = useState<'docs' | 'code'>('docs');
  const eventSourceRef = useRef<EventSource | null>(null);
  const session = useAppSelector((state: RootState) => state.auth.session);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const resetResponse = useCallback(() => {
    setStatusMessage('');
    setAnswer('');
    setContext('');
    setSources([]);
    setDiagrams([]);
    setErrorMessage(null);
  }, []);

  const startStream = useCallback(() => {
    const trimmedQuery = prompt.trim();
    setPrompt('');
    if (!trimmedQuery.length) return;
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      setErrorMessage('This browser does not support server-sent events.');
      return;
    }

    closeStream();
    resetResponse();
    setIsStreaming(true);

    const streamUrl = buildResponderStreamUrl(trimmedQuery, sourceTarget);
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('status', (event) => {
      const payload = parseEvent<ResponderStatusEvent>(event as MessageEvent);
      if (payload?.message) setStatusMessage(payload.message);
    });

    eventSource.addEventListener('context', (event) => {
      const payload = parseEvent<ResponderContextEvent>(event as MessageEvent);
      if (payload) {
        setContext(payload.context);
        setSources(payload.sources || []);
        setDiagrams(payload.diagrams || []);
      }
    });

    eventSource.addEventListener('answer', (event) => {
      const payload = parseEvent<ResponderAnswerEvent>(event as MessageEvent);
      if (payload?.answer) {
        setAnswer(payload.answer);
      }
    });

    eventSource.addEventListener('error', (event) => {
      const payload = parseEvent<{ message?: string }>(event as MessageEvent);
      setErrorMessage(payload?.message || 'Unable to retrieve a response. Please try again.');
      closeStream();
    });

    eventSource.addEventListener('done', () => {
      closeStream();
    });
  }, [prompt, closeStream, resetResponse, sourceTarget]);  

  const stopManually = useCallback(() => {
    setStatusMessage((prev) => prev || 'Response stream stopped.');
    closeStream();
  }, [closeStream]);

  useEffect(() => {
    return () => {
      closeStream();
    };
  }, [closeStream]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      startStream();      
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex w-full flex-col gap-3">
        <div className="flex-1">
          <Textarea
            placeholder="Ask the knowledge base anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
            className="resize-none h-[100px]"
            aria-label="Ask the assistant a question"
          />
          <p className="mt-1 text-xs text-muted-foreground">Press ⌘/Ctrl + Enter to send</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Search in:</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={sourceTarget === 'docs' ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setSourceTarget('docs')}
                disabled={isStreaming}
              >
                <BookTextIcon />
                Drive Doc
              </Button>
              <Button
                type="button"
                variant={sourceTarget === 'code' ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setSourceTarget('code')}
                disabled={isStreaming}
              >
                <FileCodeCornerIcon />
                GitLab Code
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-row">
            <Button
              onClick={startStream}
              disabled={!prompt.trim().length || isStreaming}
              className="md:w-24"
            >
              {isStreaming ? 'Streaming...' : 'Ask'}
            </Button>
            <Button
              variant="outline"
              onClick={stopManually}
              disabled={!isStreaming}
              className="md:w-24"
            >
              Stop
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {statusMessage && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{statusMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
        {answer && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-00">Answer</p>
            <ReactMarkdown
              className="markdown-body space-y-4 text-base leading-relaxed text-zinc-900 dark:text-zinc-50"
              components={markdownComponents}
            >
              {answer}
            </ReactMarkdown>
          </div>
        )}
        {diagrams.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Diagrams</p>
            <div className="grid gap-3 md:grid-cols-2">
              {diagrams.map((diagram, index) => (
                <MermaidDiagramCard key={diagram.id} diagram={diagram} index={index} />
              ))}
            </div>
          </div>
        )}
        {context && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">
              View retrieved context
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">{context}</pre>
          </details>
        )}
        {sources.length > 0 && (
          <div className="mt-4 text-xs">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Sources</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
              {sources.map((source, index) => (
                <li key={`${source.documentId ?? 'unknown'}-${source.chunkIndex}-${index}`}>
                  <span className="font-medium text-xs">
                    {sanitizeHref(source.fileUrl ?? undefined) ? (
                      <a
                        href={sanitizeHref(source.fileUrl ?? undefined)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {source.path || source.documentId || 'Unknown document'}
                      </a>
                    ) : (
                      source.path || source.documentId || 'Unknown document'
                    )}
                  </span>
                  {source.branch && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"> · {source.branch}</span>
                  )}
                  {source.chunkIndex !== undefined && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"> · chunk {source.chunkIndex}</span>
                  )}
                  {typeof source.startLine === 'number' && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {' '}
                      · lines {source.startLine}
                      {source.endLine ? `-${source.endLine}` : ''}
                    </span>
                  )}
                  {typeof source.distance === 'number' && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"> (distance {source.distance.toFixed(3)})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!statusMessage && !answer && !errorMessage && (
          <div>
            <div className="flex justify-center w-full mb-1.5">
              <BotIcon className="text-zinc-500 dark:text-zinc-400"/> 
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 justify-center text-center">
              Responses will appear here once you ask a question.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptInput;
