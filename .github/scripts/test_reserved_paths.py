"""Run with: python3 -B -m unittest discover -s .github/scripts"""

import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parents[1]
SCRIPT = SCRIPTS / "reserved_paths.py"
CODEOWNERS = REPO / ".github" / "CODEOWNERS"
WORKFLOW = REPO / ".github" / "workflows" / "reserved-paths.yml"

PASS, RESERVED, UNREADABLE, NO_RESERVED, LIST_UNREADABLE, AT_CAP = 0, 1, 2, 3, 4, 5


class CheckCase(unittest.TestCase):
    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.tmp = Path(directory.name)

    def run_check(self, entries=None, codeowners=None, expected=None, files_text=None):
        files = self.tmp / "files.jsonl"
        if files_text is None:
            files_text = "".join(json.dumps(entry) + "\n" for entry in entries or [])
        files.write_text(files_text, encoding="utf-8")
        owners = CODEOWNERS
        if codeowners is not None:
            owners = self.tmp / "CODEOWNERS"
            owners.write_text(codeowners, encoding="utf-8")
        count = expected if expected is not None else len(entries or [])
        return subprocess.run(
            [sys.executable, "-B", str(SCRIPT), "--codeowners", str(owners), "--files", str(files), "--expected", str(count)],
            capture_output=True,
            text=True,
            check=False,
        )

    def assert_exit(self, result, code, message=None):
        self.assertEqual(result.returncode, code, result.stdout + result.stderr)
        if message is not None:
            self.assertIn(message, result.stdout)


class RealCodeownersTest(CheckCase):
    def test_reserved_paths_fail_and_are_named(self):
        for path in (
            "backend/database/migrations/x.php",
            ".github/workflows/gate.yml",
            "backend/app/Auth/X.php",
            ".github/CODEOWNERS",
        ):
            with self.subTest(path=path):
                result = self.run_check([{"filename": path}])
                self.assert_exit(result, RESERVED, json.dumps(path))
                self.assertIn("WR-2887", result.stdout)
                self.assertIn("admin merge by the Commander", result.stdout)

    def test_the_check_reserves_its_own_files(self):
        for path in (
            ".github/scripts/reserved_paths.py",
            ".github/scripts/test_reserved_paths.py",
            ".github/workflows/reserved-paths.yml",
        ):
            with self.subTest(path=path):
                self.assert_exit(self.run_check([{"filename": path}]), RESERVED)

    def test_unreserved_paths_pass(self):
        for path in ("frontend/src/x.ts", "backend/app/Actions/Foo/X.php"):
            with self.subTest(path=path):
                self.assert_exit(self.run_check([{"filename": path}]), PASS, "1 changed files")

    def test_a_rename_out_of_a_reserved_path_fails(self):
        entry = {"filename": "backend/app/Foo/X.php", "previous_filename": "backend/app/Auth/X.php"}
        self.assert_exit(self.run_check([entry]), RESERVED, '"backend/app/Auth/X.php"')

    def test_a_rename_into_a_reserved_path_fails(self):
        entry = {"filename": "backend/app/Auth/X.php", "previous_filename": "backend/app/Foo/X.php"}
        self.assert_exit(self.run_check([entry]), RESERVED, '"backend/app/Auth/X.php"')

    def test_a_name_that_only_resembles_a_reserved_path_passes(self):
        for path in (
            "backend/app/AuthThing/X.php",
            "backend/binary/x",
            "backend/app/Models/UserXphp",
            "backend/app/Models/User.php.bak",
            "x/backend/app/Auth/X.php",
            "x/Dockerfile",
            "Dockerfile.dev",
            ".github/workflows2/x.yml",
        ):
            with self.subTest(path=path):
                self.assert_exit(self.run_check([{"filename": path}]), PASS)

    def test_a_clean_file_does_not_hide_a_reserved_one(self):
        entries = [{"filename": "frontend/src/x.ts"}, {"filename": "Dockerfile"}]
        result = self.run_check(entries)
        self.assert_exit(result, RESERVED, '"Dockerfile"')
        self.assertNotIn("frontend/src/x.ts", result.stdout)

    def test_a_hostile_filename_cannot_start_a_workflow_command(self):
        result = self.run_check([{"filename": "backend/app/Auth/x\n::error::forged"}])
        self.assert_exit(result, RESERVED)
        self.assertNotIn("::error::forged", result.stdout.splitlines())
        self.assertEqual([line for line in result.stdout.splitlines() if line.startswith("::")][1:], [])


    def test_a_line_separator_in_a_filename_is_not_a_record_break(self):
        text = json.dumps({"filename": "backend/app/Auth/x\u2028y"}, ensure_ascii=False) + "\n"
        self.assert_exit(self.run_check(files_text=text, expected=1), RESERVED)


class SemanticsTest(CheckCase):
    def test_last_match_wins_in_both_directions(self):
        released = "/a/ @Goosterhof\n/a/open.txt @Goosterhof @crit-ai\n"
        self.assert_exit(self.run_check([{"filename": "a/open.txt"}], released), PASS)
        self.assert_exit(self.run_check([{"filename": "a/other.txt"}], released), RESERVED)
        reserved = "* @Goosterhof @crit-ai\n/a/ @Goosterhof\n"
        self.assert_exit(self.run_check([{"filename": "a/x"}], reserved), RESERVED)
        catch_all_last = "/a/ @Goosterhof\n* @Goosterhof @crit-ai\n"
        self.assert_exit(self.run_check([{"filename": "a/x"}], catch_all_last), PASS)

    def test_a_later_ownerless_line_releases_a_path(self):
        owners = "/a/ @Goosterhof\n/a/free.txt\n"
        self.assert_exit(self.run_check([{"filename": "a/free.txt"}], owners), PASS)

    def test_owner_case_and_inline_comments(self):
        owners = "/a/ @GOOSTERHOF # the owner alone\n"
        self.assert_exit(self.run_check([{"filename": "a/x"}], owners), RESERVED)

    def test_a_shared_line_is_not_reserved(self):
        owners = "/a/ @Goosterhof\n/b/ @Goosterhof @crit-ai\n"
        self.assert_exit(self.run_check([{"filename": "b/x"}], owners), PASS)

    def test_pattern_shapes(self):
        cases = (
            ("/a/* @Goosterhof\n", "a/x", RESERVED),
            ("/a/* @Goosterhof\n", "a/b/x", PASS),
            ("/a/** @Goosterhof\n", "a/b/x", RESERVED),
            ("*.lock @Goosterhof\n", "deep/er/x.lock", RESERVED),
            ("*.lock @Goosterhof\n", "x.locked", PASS),
            ("apps/ @Goosterhof\n", "deep/apps/x", RESERVED),
            ("apps/ @Goosterhof\n", "apps", PASS),
            ("a/b @Goosterhof\n", "x/a/b", PASS),
            ("a/b @Goosterhof\n", "a/b/c", RESERVED),
            ("**/logs @Goosterhof\n", "x/y/logs/z", RESERVED),
            ("/a?c @Goosterhof\n", "abc", RESERVED),
            ("/a?c @Goosterhof\n", "a/c", PASS),
            ("/a\\ b @Goosterhof\n", "a b", RESERVED),
            ("\\#x @Goosterhof\n", "#x", RESERVED),
        )
        for owners, path, code in cases:
            with self.subTest(owners=owners, path=path):
                self.assert_exit(self.run_check([{"filename": path}], owners), code)


class FailClosedTest(CheckCase):
    def test_an_empty_codeowners_fails_with_its_own_message(self):
        result = self.run_check([{"filename": "x"}], "# only a comment\n\n")
        self.assert_exit(result, UNREADABLE, "it holds no rules")

    def test_no_sole_owner_lines_fails_with_its_own_message(self):
        result = self.run_check([{"filename": "x"}], "* @Goosterhof @crit-ai\n")
        self.assert_exit(result, NO_RESERVED, "No reserved lines")

    def test_a_missing_codeowners_fails(self):
        files = self.tmp / "files.jsonl"
        files.write_text("", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, "-B", str(SCRIPT), "--codeowners", str(self.tmp / "gone"), "--files", str(files), "--expected", "0"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assert_exit(result, UNREADABLE, "could not read")

    def test_unsupported_syntax_fails_rather_than_being_skipped(self):
        for line in ("!a @Goosterhof\n", "/a[bc] @Goosterhof\n"):
            with self.subTest(line=line):
                result = self.run_check([{"filename": "x"}], "/z/ @Goosterhof\n" + line)
                self.assert_exit(result, UNREADABLE, "line 2")

    def test_an_unreadable_file_list_fails(self):
        for text in ("not json\n", "[]\n", '{"name": "x"}\n', '{"filename": 3}\n', '{"filename": "x", "previous_filename": 3}\n'):
            with self.subTest(text=text):
                result = self.run_check(files_text=text, expected=1)
                self.assert_exit(result, LIST_UNREADABLE, "File list unreadable")

    def test_a_missing_file_list_fails(self):
        result = subprocess.run(
            [sys.executable, "-B", str(SCRIPT), "--codeowners", str(CODEOWNERS), "--files", str(self.tmp / "gone"), "--expected", "1"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assert_exit(result, LIST_UNREADABLE, "File list unreadable")

    def test_a_short_list_fails(self):
        result = self.run_check([{"filename": "frontend/x"}], expected=2)
        self.assert_exit(result, LIST_UNREADABLE, "listed 1 files")

    def test_an_unreadable_expected_count_fails(self):
        self.assert_exit(self.run_check([], expected="many"), LIST_UNREADABLE, "File list unreadable")

    def test_the_cap_fails(self):
        entries = [{"filename": f"frontend/{i}"} for i in range(3000)]
        self.assert_exit(self.run_check(entries), AT_CAP, "File list at the cap")
        self.assert_exit(self.run_check(entries[:2], expected=4000), AT_CAP, "File list at the cap")

    def test_just_under_the_cap_passes(self):
        entries = [{"filename": f"frontend/{i}"} for i in range(2999)]
        self.assert_exit(self.run_check(entries), PASS, "2999 changed files")

    def test_a_pull_request_with_no_changed_files_passes(self):
        self.assert_exit(self.run_check([]), PASS, "0 changed files")


class WorkflowShapeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.text = WORKFLOW.read_text(encoding="utf-8")

    def test_it_runs_the_base_copy(self):
        self.assertIn("pull_request_target:", self.text)
        self.assertNotRegex(self.text, r"(?m)^\s*pull_request:")

    def test_it_never_names_the_pull_requests_head(self):
        self.assertNotRegex(self.text, r"head_ref|pull_request\.head|refs/pull")

    def test_no_condition_can_skip_it(self):
        # A skipped job reports success to a required check.
        self.assertNotRegex(self.text, r"(?m)^\s*if:")

    def test_every_action_is_pinned_by_full_sha(self):
        uses = re.findall(r"(?m)^\s*(?:- )?uses:\s*(\S+)", self.text)
        self.assertTrue(uses, "the workflow names no action, so this test measured nothing")
        for action in uses:
            self.assertRegex(action, r"^[\w./-]+@[0-9a-f]{40}$")

    def test_no_event_value_is_interpolated_into_a_run_block(self):
        blocks = re.findall(r"(?m)^(\s*)- name:.*\n(?:\1  .*\n)*?\1  run: \|\n((?:\1    .*\n|\n)+)", self.text)
        self.assertTrue(blocks, "the workflow has no run block, so this test measured nothing")
        for _indent, block in blocks:
            self.assertNotIn("${{", block)


if __name__ == "__main__":
    unittest.main()
