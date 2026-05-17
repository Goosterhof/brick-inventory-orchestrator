#!/bin/bash
# Stop hook: remind the Logistics Director to ensure shift logs are filed
# for any shipping orders that are "In Progress".
#
# IMPORTANT: This hook must ALWAYS return {"continue": true}.
# Same pattern as the frontend's journal-nudge.sh — no blocking on Stop hooks.

RECORDS_DIR="${CWD:-$(pwd)}/.claude/records"
ORDERS_DIR="$RECORDS_DIR/permits"
LOGS_DIR="$RECORDS_DIR/journals"

# No orders directory = nothing to check
if [ ! -d "$ORDERS_DIR" ]; then
    echo '{"continue": true}'
    exit 0
fi

# Check for shipping orders with "In Progress" status but no matching shift log
unfiled=""
for order in "$ORDERS_DIR"/*.md; do
    [ -f "$order" ] || continue
    # Skip template files
    [[ "$(basename "$order")" == .* ]] && continue

    if grep -q "Status:.*In Progress" "$order" 2>/dev/null; then
        slug=$(basename "$order" .md)
        if [ ! -f "$LOGS_DIR/$slug.md" ]; then
            unfiled="$unfiled $slug"
        fi
    fi
done

if [ -n "$unfiled" ]; then
    >&2 echo "[journal-nudge] Unfiled shift logs for in-progress shipping orders:$unfiled"
fi

echo '{"continue": true}'
exit 0
