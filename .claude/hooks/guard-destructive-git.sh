#!/bin/bash
# PreToolUse hook: Block destructive git commands.
# Catches force-push, hard reset, checkout ., clean -f, branch -D, etc.
# Exit 2 = block, Exit 0 = allow.
#
# Pure pattern matching on the Bash command — no path assumptions; works
# from any cwd.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
    exit 0
fi

# Normalize: collapse whitespace for matching
CMD=$(echo "$COMMAND" | tr -s '[:space:]' ' ')

# git push --force / -f (but not -u which is fine)
if echo "$CMD" | grep -qE 'git\s+push\s+(.*\s)?(-f|--force)(\s|$)'; then
    echo "Blocked: git push --force is destructive. The CEO must explicitly authorize this." >&2
    exit 2
fi

# git reset --hard
if echo "$CMD" | grep -qE 'git\s+reset\s+--hard'; then
    echo "Blocked: git reset --hard discards uncommitted work. The CEO must explicitly authorize this." >&2
    exit 2
fi

# git checkout . / git checkout -- .
if echo "$CMD" | grep -qE 'git\s+checkout\s+(--\s+)?\.'; then
    echo "Blocked: git checkout . discards all unstaged changes. The CEO must explicitly authorize this." >&2
    exit 2
fi

# git restore . (discard all changes)
if echo "$CMD" | grep -qE 'git\s+restore\s+\.'; then
    echo "Blocked: git restore . discards all unstaged changes. The CEO must explicitly authorize this." >&2
    exit 2
fi

# git clean -f
if echo "$CMD" | grep -qE 'git\s+clean\s+.*-f'; then
    echo "Blocked: git clean -f deletes untracked files permanently. The CEO must explicitly authorize this." >&2
    exit 2
fi

# git branch -D (force delete) — deliberate opt-in via ALLOW_BRANCH_D=1 prefix.
# Bare `git branch -D` stays blocked (guards against accidental force-delete);
# an explicit `ALLOW_BRANCH_D=1 git branch -D ...` is the CEO-authorized escape hatch.
if echo "$CMD" | grep -qE 'git\s+branch\s+.*-D'; then
    if echo "$CMD" | grep -qE '(^|\s)ALLOW_BRANCH_D=1(\s|$)'; then
        : # explicit authorization present — allow through
    else
        echo "Blocked: git branch -D force-deletes a branch without merge check. Prefix with ALLOW_BRANCH_D=1 to authorize a deliberate deletion." >&2
        exit 2
    fi
fi

# git stash drop / git stash clear
if echo "$CMD" | grep -qE 'git\s+stash\s+(drop|clear)'; then
    echo "Blocked: git stash drop/clear permanently destroys stashed work. The CEO must explicitly authorize this." >&2
    exit 2
fi

exit 0
