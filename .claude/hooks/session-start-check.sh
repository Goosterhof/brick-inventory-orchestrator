#!/bin/bash
# SessionStart hook: Ensure Node 24+ is on PATH and verify the Gallery
# Wing's build environment. Uses CLAUDE_ENV_FILE to persist PATH changes
# for all subsequent Bash calls.
#
# On Claude Code on the web ($CLAUDE_CODE_REMOTE=true) the hook REPAIRS
# the environment instead of only reporting it: installs Node 24 via nvm
# and runs npm install for the Gallery Wing. The container state is
# cached after the hook completes, so the expensive paths run once per
# environment, not once per session. Local sessions keep the original
# report-only behavior — never mutate a developer's machine.
#
# Scoped to the Gallery Wing — Node/npm is the frontend toolchain.
# Foundry environment (PHP 8.5 + pcov + composer) is verified by the
# pre-commit gauntlet; not surfaced here because the cost of a bad PHP
# environment surfaces immediately on the first composer call.

CWD="${CWD:-$(pwd)}"
FRONTEND_DIR="$CWD/frontend"
IS_REMOTE="${CLAUDE_CODE_REMOTE:-}"
ISSUES=""

# --- Node version resolution ---
# If the current node is below 24, look for a 24+ install via nvm and prepend it to PATH.
# Checks $NVM_DIR, ~/.nvm, and /opt/nvm (the web container installs nvm at /opt/nvm
# without exporting NVM_DIR into hook environments).
activate_node24() {
    local nvm_root
    for nvm_root in "${NVM_DIR:-}" "$HOME/.nvm" "/opt/nvm"; do
        [ -n "$nvm_root" ] && [ -d "$nvm_root/versions/node" ] || continue
        # Find the highest installed v24+ version
        local best=""
        local dir
        for dir in "$nvm_root/versions/node"/v24.*/bin "$nvm_root/versions/node"/v25.*/bin "$nvm_root/versions/node"/v26.*/bin; do
            [ -x "$dir/node" ] && best="$dir"
        done
        if [ -n "$best" ]; then
            export PATH="$best:$PATH"
            if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
                echo "export PATH=\"$best:\$PATH\"" >> "$CLAUDE_ENV_FILE"
            fi
            return 0
        fi
    done
    return 1
}

# Remote-only repair: install Node 24 via nvm, then activate it.
install_node24() {
    [ "$IS_REMOTE" = "true" ] || return 1
    local nvm_sh
    for nvm_sh in "${NVM_DIR:-}/nvm.sh" "$HOME/.nvm/nvm.sh" "/opt/nvm/nvm.sh"; do
        if [ -f "$nvm_sh" ]; then
            # shellcheck disable=SC1090
            NVM_DIR="$(dirname "$nvm_sh")" . "$nvm_sh" >/dev/null 2>&1
            nvm install 24 >/dev/null 2>&1
            activate_node24 && return 0
        fi
    done
    return 1
}

CURRENT_NODE_MAJOR=""
if command -v node &>/dev/null; then
    CURRENT_NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
fi

if [ -z "$CURRENT_NODE_MAJOR" ] || [ "$CURRENT_NODE_MAJOR" -lt 24 ] 2>/dev/null; then
    if activate_node24 || install_node24; then
        CURRENT_NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
    fi
    if [ -z "$CURRENT_NODE_MAJOR" ]; then
        ISSUES="${ISSUES}\n- Node.js is not installed"
    elif [ "$CURRENT_NODE_MAJOR" -lt 24 ] 2>/dev/null; then
        ISSUES="${ISSUES}\n- Node.js version is $(node -v) but 24+ is required — install via: nvm install 24"
    fi
fi

# --- Gallery Wing dependency check (remote: repair; local: report) ---
gallery_deps_stale() {
    [ ! -d "$FRONTEND_DIR/node_modules" ] ||
        { [ -f "$FRONTEND_DIR/package.json" ] && [ "$FRONTEND_DIR/package.json" -nt "$FRONTEND_DIR/node_modules" ]; }
}

if [ ! -d "$FRONTEND_DIR" ]; then
    # Working from outside the monorepo — skip the dependency check silently.
    :
elif gallery_deps_stale; then
    INSTALL_RC=""
    if [ "$IS_REMOTE" = "true" ] && [ "${CURRENT_NODE_MAJOR:-0}" -ge 24 ] 2>/dev/null; then
        (cd "$FRONTEND_DIR" && npm install --no-audit --no-fund >/dev/null 2>&1)
        INSTALL_RC=$?
    fi
    # A failed install can still touch node_modules mtime, so the staleness
    # checks alone would report a broken tree as clean — surface the rc first.
    if [ -n "$INSTALL_RC" ] && [ "$INSTALL_RC" -ne 0 ]; then
        ISSUES="${ISSUES}\n- frontend npm install FAILED (exit $INSTALL_RC) during session-start repair — run (cd frontend && npm install) manually and check the output"
    elif [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        ISSUES="${ISSUES}\n- frontend/node_modules missing — run (cd frontend && npm install) before starting Gallery-Wing work"
    elif [ "$FRONTEND_DIR/package.json" -nt "$FRONTEND_DIR/node_modules" ]; then
        ISSUES="${ISSUES}\n- frontend/package.json is newer than frontend/node_modules — run (cd frontend && npm install) to sync dependencies"
    fi
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
