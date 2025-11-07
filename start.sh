#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM

  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping process $pid..."
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

start_service() {
  local name="$1"
  local service_dir="$2"
  shift 2

  echo "Starting $name..."
  (
    cd "$service_dir"
    "$@"
  ) &

  local pid=$!
  PIDS+=("$pid")
  echo "$name running (pid $pid)"
}

start_service "backend" "$ROOT_DIR" npm run dev
start_service "frontend" "$ROOT_DIR/frontend" npm run dev
start_service "chromadb" "$ROOT_DIR" npm run chroma:start

exit_code=0
for pid in "${PIDS[@]}"; do
  if ! wait "$pid"; then
    exit_code=$?
  fi
done

PIDS=()
exit "$exit_code"
