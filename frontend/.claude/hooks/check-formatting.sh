#!/bin/bash
# PostToolUse hook: Check formatting on edited/written files.
# Runs oxfmt --check on the file that was just modified.
# Non-blocking — injects a warning as context if formatting is off.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only check formattable files
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.vue|*.json|*.css|*.html)
        ;;
    *)
        exit 0
        ;;
esac

# Skip generated files (they get formatted by their own pipeline)
if [[ "$FILE_PATH" == */shared/generated/* ]]; then
    exit 0
fi

# Skip node_modules and dist
if [[ "$FILE_PATH" == */node_modules/* ]] || [[ "$FILE_PATH" == */dist/* ]]; then
    exit 0
fi

# Run oxfmt check
OUTPUT=$(npx oxfmt --check "$FILE_PATH" 2>&1)
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then
    cat <<EOF
{
    "hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": "WARNING: $FILE_PATH has formatting issues. Run oxfmt to fix before committing. The pre-commit hook will catch this, but fixing now saves a round-trip."
    }
}
EOF
fi

exit 0
