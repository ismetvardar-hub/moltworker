#!/usr/bin/env bash
# LİKYA çift yedek: (1) GitHub/cloud push+tag  (2) yerel/artifact arşiv
# Kullanım: bash scripts/backup-likya.sh [etiket-notu]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NOTE="${1:-manual}"
SAFE_NOTE="$(echo "$NOTE" | tr -cs 'A-Za-z0-9._-' '-' | cut -c1-40)"
NAME="likya-backup-${STAMP}-${SAFE_NOTE}"

ART_DIR="/opt/cursor/artifacts/backups"
LOCAL_DIR="${ROOT}/backups"
mkdir -p "$ART_DIR" "$LOCAL_DIR"

# Kod + veri + kritik config (node_modules / dist hariç)
ARCHIVE="${LOCAL_DIR}/${NAME}.tar.gz"
tar -czf "$ARCHIVE" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='backups' \
  --exclude='*.log' \
  server src data scripts \
  package.json package-lock.json \
  vite.config.ts tsconfig.json index.html \
  README.md .gitignore 2>/dev/null || \
tar -czf "$ARCHIVE" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='backups' \
  server src data scripts package.json package-lock.json README.md

cp -f "$ARCHIVE" "${ART_DIR}/${NAME}.tar.gz"

# Manifest
MANIFEST="${LOCAL_DIR}/${NAME}.manifest.txt"
{
  echo "name=${NAME}"
  echo "createdAt=${STAMP}"
  echo "note=${NOTE}"
  echo "gitHead=$(git rev-parse HEAD 2>/dev/null || echo none)"
  echo "gitBranch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo none)"
  echo "archiveLocal=${ARCHIVE}"
  echo "archiveArtifact=${ART_DIR}/${NAME}.tar.gz"
  echo "bytes=$(wc -c < "$ARCHIVE" | tr -d ' ')"
} > "$MANIFEST"
cp -f "$MANIFEST" "${ART_DIR}/${NAME}.manifest.txt"

# Bulut: commit yoksa sadece push; tag ile nokta atışı
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git push -u origin HEAD 2>/dev/null || git push origin HEAD || true
  TAG="backup/${STAMP}"
  if ! git rev-parse "$TAG" >/dev/null 2>&1; then
    git tag -a "$TAG" -m "LİKYA backup ${STAMP}: ${NOTE}" || true
    git push origin "$TAG" 2>/dev/null || true
  fi
fi

echo "BACKUP_OK"
echo "  local:    ${ARCHIVE}"
echo "  artifact: ${ART_DIR}/${NAME}.tar.gz"
echo "  manifest: ${MANIFEST}"
echo "  tag:      backup/${STAMP}"
