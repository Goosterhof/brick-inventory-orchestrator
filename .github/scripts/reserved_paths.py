#!/usr/bin/env python3
"""Fail when a pull request changes a path CODEOWNERS reserves to the owner alone.

Run by .github/workflows/reserved-paths.yml from the base branch's checkout. Paths and the file
list come from the API and are data: nothing here executes or opens a path from the pull request.

Exit codes: 0 pass, 1 reserved path changed, 2 CODEOWNERS unreadable or unsupported, 3 no reserved
lines, 4 file list unreadable, 5 file list at the API's cap.
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

RESERVED_OWNER = "@Goosterhof"
FILE_LIST_CAP = 3000
CODEOWNERS_SIZE_LIMIT = 3_000_000
# The check matches literals, `*` and `**` only. GitHub's docs exclude `\#`, `!` and `[ ]` and show no
# other escape and no `?`. A line GitHub skips could be the one meant to reserve a path, so neither
# match it nor skip it: refuse it.
UNSUPPORTED_SYNTAX = re.compile(r"^!|[\\?\[\]]")
TICKET = "WR-2887"

EXIT_RESERVED = 1
EXIT_CODEOWNERS_UNREADABLE = 2
EXIT_NO_RESERVED_LINES = 3
EXIT_FILE_LIST_UNREADABLE = 4
EXIT_FILE_LIST_AT_CAP = 5


class CheckFailure(Exception):
    def __init__(self, exit_code: int, message: str) -> None:
        super().__init__(message)
        self.exit_code = exit_code
        self.message = message


@dataclass(frozen=True)
class Rule:
    line: int
    pattern: str
    owners: tuple[str, ...]
    regex: re.Pattern[str]

    @property
    def reserved(self) -> bool:
        return self.owners == (RESERVED_OWNER.lower(),)


def pattern_to_regex(pattern: str) -> re.Pattern[str]:
    """CODEOWNERS' gitignore subset. A slash at the start or middle anchors to the root."""
    anchored = "/" in pattern.rstrip("/")
    body = pattern.removeprefix("/")
    directory_only = body.endswith("/")
    body = body.rstrip("/")

    translated = ""
    i = 0
    while i < len(body):
        if body.startswith("**/", i):
            translated += "(?:.*/)?"
            i += 3
        elif body.startswith("**", i):
            translated += ".*"
            i += 2
        elif body[i] == "*":
            translated += "[^/]*"
            i += 1
        else:
            translated += re.escape(body[i])
            i += 1

    if directory_only:
        suffix = "/.*"
    elif body.rsplit("/", 1)[-1] == "*":
        suffix = ""
    else:
        suffix = "(?:/.*)?"
    prefix = "" if anchored else "(?:.*/)?"
    return re.compile(f"{prefix}{translated}{suffix}", re.DOTALL)


def parse_codeowners(text: str) -> list[Rule]:
    rules = []
    for number, raw in enumerate(text.splitlines(), start=1):
        tokens = raw.split()
        if not tokens or tokens[0].startswith("#"):
            continue
        pattern = tokens[0]
        if UNSUPPORTED_SYNTAX.search(pattern):
            raise CheckFailure(
                EXIT_CODEOWNERS_UNREADABLE,
                f"CODEOWNERS unreadable: line {number} uses syntax this check does not read as GitHub does.",
            )
        owners = []
        for token in tokens[1:]:
            if token.startswith("#"):
                break
            owners.append(token.lower())
        rules.append(Rule(number, pattern, tuple(owners), pattern_to_regex(pattern)))
    return rules


def load_rules(path: Path) -> list[Rule]:
    try:
        content = path.read_bytes()
        text = content.decode("utf-8")
    except (OSError, UnicodeDecodeError) as error:
        raise CheckFailure(
            EXIT_CODEOWNERS_UNREADABLE,
            f"CODEOWNERS unreadable: could not read the base branch's copy ({type(error).__name__}).",
        ) from error
    if len(content) >= CODEOWNERS_SIZE_LIMIT:
        raise CheckFailure(
            EXIT_CODEOWNERS_UNREADABLE,
            f"CODEOWNERS unreadable: GitHub will not load a file of {CODEOWNERS_SIZE_LIMIT} bytes or more.",
        )
    rules = parse_codeowners(text)
    if not rules:
        raise CheckFailure(EXIT_CODEOWNERS_UNREADABLE, "CODEOWNERS unreadable: it holds no rules.")
    if not any(rule.reserved for rule in rules):
        raise CheckFailure(
            EXIT_NO_RESERVED_LINES,
            f"No reserved lines: CODEOWNERS parsed, but no line names {RESERVED_OWNER} as its only owner.",
        )
    return rules


def reserving_rule(rules: list[Rule], path: str) -> Rule | None:
    """The last matching line decides, so a later line can release a path an earlier one reserved."""
    for rule in reversed(rules):
        if rule.regex.fullmatch(path):
            return rule if rule.reserved else None
    return None


def load_paths(path: Path, expected: str) -> tuple[int, list[str]]:
    """One JSON object per line. Returns the file count and every path, renames in both directions."""
    try:
        expected_count = int(expected)
        lines = path.read_text(encoding="utf-8").split("\n")
        entries = [json.loads(line) for line in lines if line]
        paths = []
        for entry in entries:
            paths.append(_required_string(entry["filename"]))
            previous = entry.get("previous_filename")
            if previous is not None:
                paths.append(_required_string(previous))
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        raise CheckFailure(
            EXIT_FILE_LIST_UNREADABLE,
            f"File list unreadable: the pull request's changed files could not be parsed ({type(error).__name__}).",
        ) from error
    if expected_count >= FILE_LIST_CAP or len(entries) >= FILE_LIST_CAP:
        raise CheckFailure(
            EXIT_FILE_LIST_AT_CAP,
            f"File list at the cap: the API lists at most {FILE_LIST_CAP} files and this pull request "
            f"reports {expected_count}, so the list cannot be trusted to be whole.",
        )
    if len(entries) != expected_count:
        raise CheckFailure(
            EXIT_FILE_LIST_UNREADABLE,
            f"File list unreadable: the API listed {len(entries)} files, the pull request reports {expected_count}.",
        )
    return len(entries), paths


def _required_string(value: object) -> str:
    if not isinstance(value, str):
        raise TypeError("path is not a string")
    return value


def check(codeowners: Path, files: Path, expected: str) -> None:
    rules = load_rules(codeowners)
    file_count, paths = load_paths(files, expected)
    reserved_lines = sum(rule.reserved for rule in rules)

    hits = {}
    for path in paths:
        rule = reserving_rule(rules, path)
        if rule is not None:
            hits[path] = rule

    if not hits:
        print(f"PASS: {file_count} changed files checked against {reserved_lines} reserved lines; none reserved.")
        return

    print(
        f"::error::Reserved paths ({TICKET}): this pull request changes {len(hits)} path(s) CODEOWNERS "
        f"reserves to {RESERVED_OWNER} alone. The way through is an admin merge by the Commander."
    )
    # json.dumps keeps a hostile filename from starting a line, so it cannot issue a workflow command.
    for path, rule in hits.items():
        print(f"  {json.dumps(path)} reserved by CODEOWNERS line {rule.line}: {json.dumps(rule.pattern)}")
    print("No review, label or comment releases this check.")
    raise SystemExit(EXIT_RESERVED)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--codeowners", type=Path, required=True)
    parser.add_argument("--files", type=Path, required=True, help="JSON lines from the pull request files API")
    parser.add_argument("--expected", required=True, help="changed_files from the pull request API")
    arguments = parser.parse_args()
    try:
        check(arguments.codeowners, arguments.files, arguments.expected)
    except CheckFailure as failure:
        print(f"::error::Reserved paths ({TICKET}): {failure.message} Failing closed.")
        sys.exit(failure.exit_code)


if __name__ == "__main__":
    main()
