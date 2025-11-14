"use client";

import { MermaidDiagram } from "@/lib/common.types";
import mermaid from "mermaid";
import { useEffect, useState } from "react";

type MermaidDiagramCardProps = {
  diagram: MermaidDiagram;
  index: number;
};

let mermaidInitialised = false;

const ensureMermaidInitialised = () => {
  if (!mermaidInitialised) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral"
    });
    mermaidInitialised = true;
  }
};

const sanitizeMermaidDefinition = (definition: string): string => {
  const trimmed = definition.trim();
  if (!trimmed.startsWith('---')) {
    return trimmed;
  }
  const frontMatterPattern = /^---[\s\S]*?---\s*/;
  return trimmed.replace(frontMatterPattern, '').trim();
};

const MermaidDiagramCard = ({ diagram, index }: MermaidDiagramCardProps) => {
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    ensureMermaidInitialised();
    setRenderedSvg(null);
    setErrorMessage(null);

    const renderDiagram = async () => {
      try {
        const renderId = `mermaid-${diagram.id}-${index}`;
        const sanitizedDefinition = sanitizeMermaidDefinition(diagram.definition);
        const { svg } = await mermaid.render(renderId, sanitizedDefinition);
        if (isMounted) {
          setRenderedSvg(svg);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to render mermaid diagram", error);
          setErrorMessage("Unable to render this diagram.");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [diagram.definition, diagram.id, index]);

  return (
    <div className="rounded-lg border border-border/70 bg-white p-4 shadow-sm dark:bg-zinc-900">
      <div className="mb-3 text-xs font-medium text-muted-foreground">
        Diagram from {diagram.sourceDocumentId ?? "unknown file"} · chunk {diagram.chunkIndex ?? "?"}
      </div>
      {renderedSvg && (
        <div
          className="mermaid-diagram overflow-auto text-zinc-900 dark:text-zinc-100"
          dangerouslySetInnerHTML={{ __html: renderedSvg }}
        />
      )}
      {!renderedSvg && !errorMessage && (
        <p className="text-xs text-muted-foreground">Rendering diagram...</p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
};

export default MermaidDiagramCard;
