"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSystemStats } from "@/lib/apis";
import { SystemStats } from "@/lib/common.types";
import { Button } from "../ui/button";
import { Ellipsis, RefreshCwIcon } from "lucide-react";

type SystemStatsProps = {
  token?: string;
};

const SystemStatsPanel = ({ token }: SystemStatsProps) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchSystemStats(token);
      setStats(data);
      setError(null);
    } catch (e) {
      console.error("Failed to fetch system stats", e);
      setError("Unable to load system stats right now.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!token) {
    return null;
  }

  const chromaConnected = stats?.chroma.connected;
  const chromaStatusClass = chromaConnected ? "text-emerald-600" : "text-destructive";
  const chromaStatusText = chromaConnected ? "Connected" : "Unavailable";

  return (
    <div className="w-full rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase">System status</p>
          <h3 className="text-lg font-semibold">Embeddings Overview</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
        >
          {loading ? (
            <Ellipsis />
          ) : (
            <RefreshCwIcon />
          )}
        </Button>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Embedded files</p>
            <p className="mt-2 text-2xl font-semibold">{stats?.embeddedFiles ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">ChromaDB</p>
            <p className={`mt-2 text-lg font-semibold ${chromaStatusClass}`}>{chromaStatusText}</p>
            {typeof stats?.chroma.documentCount === "number" && (
              <p className="text-sm text-muted-foreground">
                {stats.chroma.documentCount} chunks stored
              </p>
            )}
            {stats?.chroma.collectionName && (
              <p className="text-xs text-muted-foreground">
                Collection: {stats.chroma.collectionName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatsPanel;
