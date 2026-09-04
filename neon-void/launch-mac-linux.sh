#!/usr/bin/env bash
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  echo "NEON VOID running at http://localhost:8080"
  python3 -m http.server 8080
else
  echo "Python 3 is not installed. Open index.html directly in your browser."
fi
