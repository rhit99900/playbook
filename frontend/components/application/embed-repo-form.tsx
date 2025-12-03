"use client";

import { FormEvent, useMemo, useState } from "react";
import { indexGitlabRepository } from "@/lib/apis";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAppSelector } from "@/utils/state/hooks";
import { RootState } from "@/utils/state/store";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type FormState = {
  projectId: string;
  token: string;
  branch: string;
  baseUrl: string;
  includeExtensions: string;
  maxFiles: string;
};

const defaultState: FormState = {
  projectId: "",
  token: "",
  branch: "",
  baseUrl: "",
  includeExtensions: ".ts,.tsx,.js,.jsx,.py,.java",
  maxFiles: "150"
};

const parseExtensions = (raw: string): string[] => {
  if (!raw.trim().length) return [];
  return raw
    .split(",")
    .map((ext) => ext.trim())
    .filter(Boolean);
};

const EmbedRepoForm = () => {
  const session = useAppSelector((state: RootState) => state.auth.session);
  const [form, setForm] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(form.projectId.trim().length && session?.token);
  }, [form.projectId, session?.token]);

  const handleChange = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.token || !form.projectId.trim().length || !form.token.trim().length) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, any> = {
        projectId: form.projectId.trim()
      };

      if (form.token.trim().length) payload.token = form.token.trim();
      if (form.branch.trim().length) payload.branch = form.branch.trim();
      if (form.baseUrl.trim().length) payload.baseUrl = form.baseUrl.trim();
      const extensions = parseExtensions(form.includeExtensions);
      if (extensions.length) payload.includeExtensions = extensions;
      const maxFiles = Number(form.maxFiles);
      if (!Number.isNaN(maxFiles) && maxFiles > 0) payload.maxFiles = maxFiles;

      const response = await indexGitlabRepository(payload, session.token);
      if (response?.success) {
        const projectName = response?.data?.project || form.projectId;
        const branch = response?.data?.branch || payload.branch || "";
        setSuccess(`Queued embedding for ${projectName}${branch ? ` (${branch})` : ""}. Indexed ${response?.data?.indexedFiles ?? 0} file(s).`);
      } else {
        setError(response?.message || "Failed to start embedding.");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to start embedding.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.token) {
    return (
      <div className="w-full rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm text-sm text-muted-foreground">
        Sign in to start embedding a GitLab repository.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase">GitLab</p>
          <h3 className="text-lg font-semibold">Embed a repository</h3>
          <p className="text-sm text-muted-foreground mt-1">Provide a GitLab project ID and optional overrides. Uses the configured token/branch by default.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projectId">Project ID *</Label>
          <Input
            id="projectId"
            placeholder="12345 or namespace"
            value={form.projectId}
            onChange={handleChange("projectId")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch">Branch (optional)</Label>
          <Input
            id="branch"
            placeholder="Default Branch: master"
            value={form.branch}
            onChange={handleChange("branch")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="token">GitLab Token *</Label>
          <Input
            id="token"
            placeholder="Overrides server token"
            value={form.token}
            onChange={handleChange("token")}
            type="password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseUrl">GitLab Base URL (optional)</Label>
          <Input
            id="baseUrl"
            placeholder="Organisation URL (incase it's self-hosted) https://gitlab.yourcompany.com"
            value={form.baseUrl}
            onChange={handleChange("baseUrl")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="includeExtensions">Include file extensions (comma separated)</Label>
          <Input
            id="includeExtensions"
            placeholder=".ts,.tsx,.js"
            value={form.includeExtensions}
            onChange={handleChange("includeExtensions")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxFiles">Max files (optional)</Label>
          <Input
            id="maxFiles"
            placeholder="150"
            value={form.maxFiles}
            onChange={handleChange("maxFiles")}
            inputMode="numeric"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={!canSubmit || submitting} className="w-full md:w-auto">
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" /> Embedding…</>
            ) : (
              "Start embedding"
            )}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

export default EmbedRepoForm;
