#!/bin/sh
set -eu

exec flatpak-spawn --host podman exec -i -w /workspace codex-box codex mcp-server "$@"
