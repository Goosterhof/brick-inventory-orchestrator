#!/bin/bash
# Stop hook: remind The Steward to ensure Build Records are filed for any
# Work Orders that are "In Progress".
#
# IMPORTANT: This hook must ALWAYS return {"continue": true}.
# Using "block" on a Stop hook creates an infinite loop: block → response → stop → block.
# This hook only logs a reminder to stderr.
#
# Post-Phase-4 (records consolidation): records live only at the root.

CWD="${CWD:-$(pwd)}"
WORK_ORDERS_DIR="$CWD/.claude/records/work-orders"
BUILD_RECORDS_DIR="$CWD/.claude/records/build-records"

unfiled=""

if [ -d "$WORK_ORDERS_DIR" ]; then
    for permit in "$WORK_ORDERS_DIR"/*.md; do
        [ -f "$permit" ] || continue
        # Skip template files (dot-prefixed names)
        [[ "$(basename "$permit")" == .* ]] && continue

        if grep -q "Status:.*In Progress" "$permit" 2>/dev/null; then
            slug=$(basename "$permit" .md)
            if [ ! -f "$BUILD_RECORDS_DIR/$slug.md" ]; then
                unfiled="$unfiled $slug"
            fi
        fi
    done
fi

if [ -n "$unfiled" ]; then
    >&2 echo "[journal-nudge] Unfiled Build Records for In Progress Work Orders:$unfiled"
fi

echo '{"continue": true}'
exit 0
