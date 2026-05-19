#!/bin/bash
# Stop hook: remind The Steward to ensure Build Records are filed for any
# Work Orders that are "In Progress".
#
# IMPORTANT: This hook must ALWAYS return {"continue": true}.
# Using "block" on a Stop hook creates an infinite loop: block → response → stop → block.
# This hook only logs a reminder to stderr.
#
# During the Brickworks merger (rev 4 of MERGER_PLAN.md), Work Orders live in
# three locations: the root .claude/records/ plus each wing's pre-merger dir.
# Phase 4 consolidates them at the root; missing dirs are skipped silently.

CWD="${CWD:-$(pwd)}"

RECORDS_ROOTS=(
    "$CWD/.claude/records"
    "$CWD/backend/.claude/records"
    "$CWD/frontend/.claude/records"
)

unfiled=""

for records_root in "${RECORDS_ROOTS[@]}"; do
    permits_dir="$records_root/permits"
    journals_dir="$records_root/journals"

    [ -d "$permits_dir" ] || continue

    for permit in "$permits_dir"/*.md; do
        [ -f "$permit" ] || continue
        # Skip template files (dot-prefixed names)
        [[ "$(basename "$permit")" == .* ]] && continue

        if grep -q "Status:.*In Progress" "$permit" 2>/dev/null; then
            slug=$(basename "$permit" .md)
            if [ ! -f "$journals_dir/$slug.md" ]; then
                # Tag the wing in the report so The Steward knows where to look
                wing_tag="root"
                case "$records_root" in
                    "$CWD/backend/.claude/records") wing_tag="foundry" ;;
                    "$CWD/frontend/.claude/records") wing_tag="gallery" ;;
                esac
                unfiled="$unfiled $slug($wing_tag)"
            fi
        fi
    done
done

if [ -n "$unfiled" ]; then
    >&2 echo "[journal-nudge] Unfiled Build Records for In Progress Work Orders:$unfiled"
fi

echo '{"continue": true}'
exit 0
