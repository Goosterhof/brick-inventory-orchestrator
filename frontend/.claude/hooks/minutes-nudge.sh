#!/bin/bash
# Stop hook: nudge the CFO to suggest /minutes if the session has been
# running for a while without logging minutes.
#
# IMPORTANT: This hook must ALWAYS return {"continue": true}.
# Using "block" on a Stop hook creates an infinite loop: block → response → stop → block.
# The actual nudge behavior is handled via Claude's memory system instead.
# This hook only logs a reminder to stderr for debugging purposes.

MINUTES_FILE="${CWD:-$(pwd)}/MINUTES.md"
NUDGE_INTERVAL=600  # 10 minutes in seconds

now=$(date +%s)

if [ ! -f "$MINUTES_FILE" ]; then
    sentinel="/tmp/.claude-minutes-nudge-$$"
    if [ ! -f "$sentinel" ]; then
        touch "$sentinel"
        echo '{"continue": true}'
        exit 0
    fi
    last_nudge=$(stat -c %Y "$sentinel" 2>/dev/null || echo 0)
    elapsed=$((now - last_nudge))
    if [ "$elapsed" -lt "$NUDGE_INTERVAL" ]; then
        echo '{"continue": true}'
        exit 0
    fi
    touch "$sentinel"
    >&2 echo "[minutes-nudge] No MINUTES.md found and interval elapsed — relying on memory-based nudge"
    echo '{"continue": true}'
    exit 0
fi

# MINUTES.md exists — check staleness
last_modified=$(stat -c %Y "$MINUTES_FILE" 2>/dev/null || echo 0)
elapsed=$((now - last_modified))

if [ "$elapsed" -lt "$NUDGE_INTERVAL" ]; then
    echo '{"continue": true}'
    exit 0
fi

>&2 echo "[minutes-nudge] MINUTES.md is stale (${elapsed}s) — relying on memory-based nudge"
echo '{"continue": true}'
exit 0
