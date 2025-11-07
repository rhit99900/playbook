# Playbook

Knowledge-transfer chatbot that ingests Google Drive documents, stores semantic embeddings in ChromaDB, and serves streaming answers through an Express + Next.js stack.

## Stack

- **Backend:** Node.js (TypeScript), Express, Prisma (SQLite)
- **Vector store:** ChromaDB
- **LLM / embeddings:** OpenAI Chat Completions + `text-embedding-ada-002`
- **Frontend:** Next.js 16 (App Router) with server-sent events (SSE)

## Project Layout

```
services/        # Builder, server, and shared model/utility logic
frontend/        # Next.js UI (PromptInput, file list, SSE helpers)
scripts/         # Operational scripts (e.g., Chroma cleanup)
prisma/          # Prisma schema & migrations
start.sh         # Convenience launcher for backend + frontend + chroma
```

## Prerequisites

- Node.js 18+
- npm 10+ (used throughout the repo)
- A running ChromaDB instance (`chroma run` or Docker)
- Google Workspace service account credentials with Drive API access
- OpenAI API key that can call Chat Completions + embeddings

## Environment Variables

Create a `.env` in the repo root. Required keys:

| Key | Description |
| --- | --- |
| `OPEN_AI_API_KEY` | OpenAI API key with GPT-3.5+ access |
| `PORT` | Express server port (defaults to `8080` in examples) |
| `DATABASE_URL` | Prisma connection string (SQLite by default) |

The frontend reads `API_BASE_URI` from `frontend/.env` (falls back to `http://localhost:8080`).

Place the Google service account JSON at `credentials.json` in the repo root (matching `services/config.ts` expectations). A `token.json` will be generated after successful auth.

## Setup

```bash
# Install backend deps
npm install

# Install frontend deps
cd frontend && npm install && cd ..
```

Run database migrations if needed:

```bash
npm run db:migrate
```

## Running Locally

### With the helper script

```bash
chmod +x start.sh
./start.sh
```

This spawns:

1. Backend (`npm run dev`) – Express server + builder bootstrap
2. Frontend (`npm run dev` inside `frontend/`)
3. ChromaDB (`npm run chroma:start`)

All three run in parallel and terminate together when you stop the script.

### Manual steps

1. Start ChromaDB: `npm run chroma:start`
2. Start backend: `npm run dev`
3. Start frontend: `cd frontend && npm run dev`

Visit `http://localhost:3000` (default Next.js dev port).

## Document Ingestion Flow

1. `Builder` authenticates with Google Drive (service account).
2. `listFiles` pulls every accessible file (paginated) or a caller-provided subset of file IDs.
3. For each file:
   - The document is downloaded via the appropriate API (Docs, Sheets, Slides, PDF, or raw text export).
   - Text is chunked (`CHUNK_SIZE`/`CHUNK_OVERLAP` from `services/config.ts`).
   - OpenAI embeddings are generated for each chunk.
   - Chunks + embeddings are added to ChromaDB with metadata describing file ID + chunk index.
   - Prisma records are upserted to track file metadata and embedding status.

### Triggering ingestion via API

`POST /files/index`

```json
{}
```

Processes every file the service account can read.

```json
{
  "fileIds": [
    "drive-file-id-1",
    "drive-file-id-2"
  ]
}
```

Processes only the listed files. The endpoint responds after all requested files have been processed (success or failure).

### Cleaning Chroma

Use the script when you want to reset embeddings and rerun the builder:

```bash
npm run chroma:clean   # Deletes the configured Chroma collection
```

Then trigger ingestion again.

## API Surface

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET /files` | Paginated list of indexed files (`skip`, `limit` query params) |
| `DELETE /files` | Removes Prisma file records (primarily for maintenance) |
| `POST /files/index` | Triggers document ingestion (all files or provided `fileIds`) |
| `GET /respond` | SSE endpoint: `?query=question` |
| `POST /respond` | Alternative SSE entry point (expects JSON body `{ "query": "..." }`) |
| `GET /health` | Simple readiness probe |

### SSE Response Events

- `status`: progress updates (`Retrieving context`, `Generating answer`, etc.)
- `context`: retrieved document chunks + metadata (`{ context, sources }`)
- `answer`: final LLM answer
- `error`: emitted when retrieval or generation fails
- `done`: emitted before the stream closes on success

The frontend `PromptInput` component listens to these events using `EventSource`.

## Frontend Notes

- `PromptInput` handles prompt submission, opens the SSE stream (`buildResponderStreamUrl`), and surfaces status/answer/context/source data with live UI updates.
- `IndexedFilesList` shows a table of files returned from `GET /files`.
- Configure the frontend API base URL via `frontend/lib/config.ts` or `frontend/.env` (`API_BASE_URI`).

## Operational Tips

- **Chroma not running?** The backend builder logs will warn when it cannot initialize the collection. Start Chroma and rerun.
- **Drive permissions:** Ensure the service account has at least read access to the target Drive files; share folders with the service account email if needed.
- **Large corpora:** Increase `DEFAULT_PAGE_SIZE` and consider batching ingestion triggers (e.g., by file ID) to avoid rate limits.
- **OpenAI limits:** Monitor usage. If you hit rate limits, introduce throttling in `DocumentProcessor` or split ingestion runs.

## Testing & Development

- Backend runs with `nodemon` (hot reload).
- Frontend uses Next.js dev server with React Fast Refresh.
- Prisma tests can be run with SQLite; update `DATABASE_URL` to point elsewhere if desired.

---

For contributions or operational scripts, see:

- `scripts/chroma-clean.ts` – wipes the Chroma collection
- `prisma/` – schema updates & migrations
- `services/model/responder.ts` – retrieval + OpenAI interface
- `services/utils/drive.utils.ts` – Drive API integration and selective file fetching

Happy building!
