"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { buildResponderStreamUrl } from "@/lib/apis";
import { ResponderAnswerEvent, ResponderContextEvent, ResponderStatusEvent, SourceAttribution } from "@/lib/common.types";

const parseEvent = <T,>(event: MessageEvent): T | null => {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
};

const PromptInput = () => {
  const [ prompt, setPrompt ] = useState<string>('');
  const [ statusMessage, setStatusMessage ] = useState<string>('');
  const [ answer, setAnswer ] = useState<string>('');
  const [ context, setContext ] = useState<string>('');
  const [ sources, setSources ] = useState<SourceAttribution[]>([]);
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null);
  const [ isStreaming, setIsStreaming ] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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
    setErrorMessage(null);
  }, []);

  const startStream = useCallback(() => {
    const trimmedQuery = prompt.trim();
    if (!trimmedQuery.length) return;
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      setErrorMessage('This browser does not support server-sent events.');
      return;
    }

    closeStream();
    resetResponse();
    setIsStreaming(true);

    const streamUrl = buildResponderStreamUrl(trimmedQuery);
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
  }, [prompt, closeStream, resetResponse]);

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
      <div className="flex w-full flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <Textarea
            placeholder="Ask the knowledge base anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            aria-label="Ask the assistant a question"
          />
          <p className="mt-1 text-xs text-muted-foreground">Press ⌘/Ctrl + Enter to send</p>
        </div>
        <div className="flex gap-2 md:flex-col">
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

      <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {statusMessage && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{statusMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
        {answer && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Answer</p>
            <p className="whitespace-pre-line text-base leading-relaxed text-zinc-900 dark:text-zinc-50">
              {answer}
            </p>
          </div>
        )}
        {context && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">
              View retrieved context
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">{context}</pre>
          </details>
        )}
        {sources.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Sources</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
              {sources.map((source, index) => (
                <li key={`${source.documentId ?? 'unknown'}-${source.chunkIndex}-${index}`}>
                  <span className="font-medium">{source.documentId ?? 'Unknown document'}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400"> · chunk {source.chunkIndex}</span>
                  {typeof source.distance === 'number' && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"> (distance {source.distance.toFixed(3)})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!statusMessage && !answer && !errorMessage && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Responses will appear here once you ask a question.
          </p>
        )}
      </div>
    </div>
  );
};

export default PromptInput;
