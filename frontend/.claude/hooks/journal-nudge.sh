#!/bin/bash
# Stop hook: remind the CFO to ensure construction journals are filed
# for any permits that are "In Progress".
#
# IMPORTANT: This hook must ALWAYS return {"continue": true}.
# Same pattern as minutes-nudge.sh — no blocking on Stop hooks.

RECORDS_DIR="${CWD:-$(pwd)}/.claude/records"
PERMITS_DIR="$RECORDS_DIR/permits"
JOURNALS_DIR="$RECORDS_DIR/journals"

# No permits directory = nothing to check
if [ ! -d "$PERMITS_DIR" ]; then
    echo '{"continue": true}'
    exit 0
fi

# Check for permits with "In Progress" status but no matching journal
unfiled=""
for permit in "$PERMITS_DIR"/*.md; do
    [ -f "$permit" ] || continue
    # Skip template files
    [[ "$(basename "$permit")" == .* ]] && continue

    if grep -q "Status:.*In Progress" "$permit" 2>/dev/null; then
        slug=$(basename "$permit" .md)
        if [ ! -f "$JOURNALS_DIR/$slug.md" ]; then
            unfiled="$unfiled $slug"
        fi
    fi
done

if [ -n "$unfiled" ]; then
    >&2 echo "[journal-nudge] Unfiled construction journals for in-progress permits:$unfiled"
fi

echo '{"continue": true}'
exit 0
