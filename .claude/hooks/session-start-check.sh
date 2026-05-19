#!/bin/bash
# SessionStart hook: Ensure Node 24+ is on PATH and verify the Gallery
# Wing's build environment. Uses CLAUDE_ENV_FILE to persist PATH changes
# for all subsequent Bash calls.
#
# Scoped to the Gallery Wing — Node/npm is the frontend toolchain.
# Foundry environment (PHP 8.5 + pcov + composer) is verified by the
# pre-commit gauntlet; not surfaced here because the cost of a bad PHP
# environment surfaces immediately on the first composer call.

CWD="${CWD:-$(pwd)}"
FRONTEND_DIR="$CWD/frontend"
ISSUES=""

# --- Node version resolution ---
# If the current node is below 24, look for a 24+ install via nvm and prepend it to PATH.
activate_node24() {
    local NVM_NODE_DIR="${NVM_DIR:-$HOME/.nvm}/versions/node"
    if [ -d "$NVM_NODE_DIR" ]; then
        # Find the highest installed v24+ version
        local best=""
        for dir in "$NVM_NODE_DIR"/v24.*/bin "$NVM_NODE_DIR"/v25.*/bin "$NVM_NODE_DIR"/v26.*/bin; do
            [ -x "$dir/node" ] && best="$dir"
        done
        if [ -n "$best" ]; then
            export PATH="$best:$PATH"
            if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
                echo "export PATH=\"$best:\$PATH\"" >> "$CLAUDE_ENV_FILE"
            fi
            return 0
        fi
    fi
    return 1
}

CURRENT_NODE_MAJOR=""
if command -v node &>/dev/null; then
    CURRENT_NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
fi

if [ -z "$CURRENT_NODE_MAJOR" ]; then
    ISSUES="${ISSUES}\n- Node.js is not installed"
elif [ "$CURRENT_NODE_MAJOR" -lt 24 ] 2>/dev/null; then
    if activate_node24; then
        CURRENT_NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
    fi
    if [ "$CURRENT_NODE_MAJOR" -lt 24 ] 2>/dev/null; then
        ISSUES="${ISSUES}\n- Node.js version is $(node -v) but 24+ is required — install via: nvm install 24"
    fi
fi

# --- Gallery Wing dependency check ---
if [ ! -d "$FRONTEND_DIR" ]; then
    # Working from outside the monorepo — skip the dependency check silently.
    :
elif [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    ISSUES="${ISSUES}\n- frontend/node_modules missing — run (cd frontend && npm install) before starting Gallery-Wing work"
elif [ -f "$FRONTEND_DIR/package.json" ] && [ "$FRONTEND_DIR/package.json" -nt "$FRONTEND_DIR/node_modules" ]; then
    ISSUES="${ISSUES}\n- frontend/package.json is newer than frontend/node_modules — run (cd frontend && npm install) to sync dependencies"
fi

# --- Tool check ---
if ! command -v npx &>/dev/null; then
    ISSUES="${ISSUES}\n- npx not found"
fi

# --- Report ---
if [ -n "$ISSUES" ]; then
    cat <<EOF
{
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "ENVIRONMENT ISSUES DETECTED:$(echo -e "$ISSUES")\n\nResolve these before starting work. The pre-push gauntlet will fail if the environment is broken."
    }
}
EOF
else
    cat <<EOF
{
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "Environment check passed: Node $(node -v), Gallery-Wing dependencies installed, tools available."
    }
}
EOF
fi

exit 0
