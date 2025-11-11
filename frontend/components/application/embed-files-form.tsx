"use client";

import { KeyboardEvent, useState } from "react";
import { Button } from "../ui/button";
import { indexFilesForEmbedding, lookupDriveFile } from "@/lib/apis";

type FileCandidate = {
  fileId: string;
  name?: string | null;
  status: "loading" | "ready" | "error";
  error?: string;
};

type EmbedFilesFormProps = {
  token?: string;
  onSuccess?: () => void;
};

type StatusMessage = {
  intent: "success" | "error";
  text: string;
};

const extractFileId = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed.length) return "";

  const maybeConvertToUrl = () => {
    if (trimmed.startsWith("http")) return trimmed;
    if (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com")) {
      return `https://${trimmed}`;
    }
    return null;
  };

  const urlCandidate = maybeConvertToUrl();
  if (urlCandidate) {
    try {
      const parsedUrl = new URL(urlCandidate);
      const paramId = parsedUrl.searchParams.get("id");
      if (paramId) {
        return paramId.trim();
      }

      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const dIndex = segments.indexOf("d");
      if (dIndex !== -1 && segments[dIndex + 1]) {
        return segments[dIndex + 1];
      }

      if (segments.length) {
        return segments[segments.length - 1];
      }
    } catch {
      // fall through to regex extraction
    }
  }

  const matchedId = trimmed.match(/[-\w]{15,}/);
  return matchedId ? matchedId[0] : "";
};

const parseErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    if (maybeError.response?.data?.message) {
      return maybeError.response.data.message;
    }
    if (maybeError.message) {
      return maybeError.message;
    }
  }

  return "Something went wrong while completing the request.";
};

const EmbedFilesForm = ({ token, onSuccess }: EmbedFilesFormProps) => {
  const [inputValue, setInputValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileCandidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const handleAddFile = async () => {
    if (!token) return;
    const fileId = extractFileId(inputValue);
    if (!fileId) {
      setFormError("Enter a valid Google Drive file ID or shareable link.");
      return;
    }
    if (files.some((file) => file.fileId === fileId)) {
      setFormError("This file is already in the list.");
      return;
    }

    setFormError(null);
    setStatusMessage(null);
    setFiles((prev) => [...prev, { fileId, status: "loading" }]);
    setInputValue("");

    try {
      const metadata = await lookupDriveFile(fileId, token);
      setFiles((prev) =>
        prev.map((file) =>
          file.fileId === fileId
            ? {
                ...file,
                status: "ready",
                name: metadata?.name ?? "Untitled file",
                error: undefined,
              }
            : file
        )
      );
    } catch (error) {
      const message = parseErrorMessage(error);
      setFiles((prev) =>
        prev.map((file) =>
          file.fileId === fileId
            ? {
                ...file,
                status: "error",
                error: message || "Unable to fetch file metadata.",
              }
            : file
        )
      );
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.fileId !== fileId));
  };

  const handleSubmit = async () => {
    if (!token || !files.length) return;
    const ids = files.map((file) => file.fileId);
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await indexFilesForEmbedding(ids, token);
      setStatusMessage({
        intent: "success",
        text: response?.message || `Started embedding for ${ids.length} file(s).`,
      });
      setFiles([]);
      onSuccess?.();
    } catch (error) {
      setStatusMessage({
        intent: "error",
        text: parseErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!inputValue.trim().length || !token) return;
      handleAddFile();
    }
  };

  const disableAdd = !token || !inputValue.trim().length;
  const disableSubmit =
    !token ||
    !files.length ||
    files.some((file) => file.status === "loading") ||
    isSubmitting;

  const helperText = !token
    ? "Authenticate to add files for embedding."
    : "Paste a Drive file ID (e.g. 1AbC23...) or any shareable link.";

  return (
    <div className="space-y-4 rounded-lg border border-border/70 bg-background/40 p-4">
      <div>
        <h2 className="text-base font-semibold">Add Files For Embedding</h2>
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Google Drive file ID or link"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            if (formError) {
              setFormError(null);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={!token}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
        />
        <Button type="button" onClick={handleAddFile} disabled={disableAdd}>
          Add file
        </Button>
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <div className="space-y-2">
        {files.length ? (
          files.map((file) => (
            <div
              key={file.fileId}
              className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
            >
              <div className="space-y-1">
                <p className="font-medium">{file.name || "Google Drive file"}</p>
                <p className="text-xs text-muted-foreground break-all">{file.fileId}</p>
                {file.status === "loading" && (
                  <p className="text-xs text-muted-foreground">Fetching file details…</p>
                )}
                {file.status === "error" && file.error && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.fileId)}
              >
                Remove
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No files added yet.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSubmit} disabled={disableSubmit}>
          {isSubmitting ? "Embedding..." : "Embed selected files"}
        </Button>
        {statusMessage && (
          <p
            className={`text-sm ${
              statusMessage.intent === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {statusMessage.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmbedFilesForm;
