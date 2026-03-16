#!/usr/bin/env bash
#
# Submodule Sync Conveyor — report local submodule drift against remote main.
#

set -euo pipefail

synced=0
behind=0
ahead=0
errors=0

green()  { printf "\033[32m✔ IN SYNC\033[0m  %s\n" "$1"; synced=$((synced + 1)); }
yellow() { printf "\033[33m⚠ AHEAD\033[0m   %s\n" "$1"; ahead=$((ahead + 1)); }
red()    { printf "\033[31m✘ BEHIND\033[0m  %s\n" "$1"; behind=$((behind + 1)); }
grey()   { printf "\033[90m? ERROR\033[0m   %s\n" "$1"; errors=$((errors + 1)); }

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Submodule Sync Conveyor         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Fetch latest from remotes in each submodule
echo "Fetching latest from remotes..."
for mod in backend frontend; do
  if ! git -C "$mod" fetch origin --quiet 2>/dev/null; then
    echo "  Warning: could not fetch $mod remote"
  fi
done
echo ""

for mod in backend frontend; do
  # Get the commit pinned in the orchestrator
  pinned=$(git ls-tree HEAD "$mod" | awk '{print $3}')
  if [ -z "$pinned" ]; then
    grey "$mod — not registered as a submodule"
    continue
  fi

  # Get the latest commit on origin/main
  remote_head=$(git -C "$mod" rev-parse origin/main 2>/dev/null || echo "")
  if [ -z "$remote_head" ]; then
    grey "$mod — could not determine origin/main"
    continue
  fi

  short_pinned=${pinned:0:7}
  short_remote=${remote_head:0:7}

  if [ "$pinned" = "$remote_head" ]; then
    green "$mod ($short_pinned)"
  else
    # Count how many commits the pinned ref is behind
    commits_behind=$(git -C "$mod" rev-list --count "$pinned".."$remote_head" 2>/dev/null || echo "?")
    commits_ahead=$(git -C "$mod" rev-list --count "$remote_head".."$pinned" 2>/dev/null || echo "0")

    if [ "$commits_ahead" != "0" ] && [ "$commits_ahead" != "?" ]; then
      # Pinned commit is ahead of remote (unusual — maybe remote hasn't been pushed)
      yellow "$mod — pinned $short_pinned is $commits_ahead commit(s) ahead of origin/main ($short_remote)"
    else
      red "$mod — pinned $short_pinned is $commits_behind commit(s) behind origin/main ($short_remote)"
      # Show the missing commits
      echo ""
      echo "  Missing commits:"
      git -C "$mod" log --oneline "$pinned".."$remote_head" 2>/dev/null | sed 's/^/    /'
      echo ""
    fi
  fi
done

# ── Summary ─────────────────────────────────

echo "═══════════════════════════════════════"
total=$((synced + behind + ahead + errors))
printf "Results: \033[32m%d synced\033[0m, \033[31m%d behind\033[0m, \033[33m%d ahead\033[0m, \033[90m%d errors\033[0m (of %d submodules)\n" "$synced" "$behind" "$ahead" "$errors" "$total"

if [ "$behind" -gt 0 ]; then
  echo ""
  printf "\033[31mSome submodules are behind — run \`make submodule-update\` to restock parts.\033[0m\n"
  exit 1
elif [ "$ahead" -gt 0 ]; then
  echo ""
  printf "\033[33mSome submodules are ahead of remote — this is unusual, verify manually.\033[0m\n"
  exit 0
elif [ "$errors" -gt 0 ]; then
  echo ""
  printf "\033[90mCould not check all submodules — see errors above.\033[0m\n"
  exit 1
else
  echo ""
  printf "\033[32mAll submodules in sync — parts are freshly restocked!\033[0m\n"
  exit 0
fi
