<?php

declare(strict_types = 1);

it('should not have cascade deletes in migrations', function(): void {
    foreach (getMigrationFiles() as $file) {
        $content = file_get_contents($file);
        $filename = basename((string) $file);

        // Strip comments to avoid false positives
        $contentWithoutComments = preg_replace('/\/\*.*?\*\/|\/\/.*$/ms', '', $content);

        // Check for onDelete('cascade') or onDelete("cascade") with flexible whitespace
        expect(preg_match('/->onDelete\s*\(\s*[\'"]cascade[\'"]\s*\)/i', (string) $contentWithoutComments))
            ->toBe(0, \sprintf('Migration %s should not use onDelete(cascade) - handle in Action classes', $filename));

        // Check for cascadeOnDelete() with flexible whitespace
        expect(preg_match('/->cascadeOnDelete\s*\(\s*\)/i', (string) $contentWithoutComments))
            ->toBe(0, \sprintf('Migration %s should not use cascadeOnDelete() - handle in Action classes', $filename));
    }
});

it('should use anonymous classes in migrations', function(): void {
    foreach (getMigrationFiles() as $file) {
        $content = file_get_contents($file);
        $filename = basename((string) $file);

        expect(str_contains($content, 'return new class extends Migration'))
            ->toBeTrue(\sprintf('Migration %s should use anonymous class syntax', $filename));
    }
});

it('should have void return types in migration methods', function(): void {
    foreach (getMigrationFiles() as $file) {
        $content = file_get_contents($file);
        $filename = basename((string) $file);

        expect(preg_match('/public function up\(\)\s*:\s*void/', $content))
            ->toBe(1, \sprintf('Migration %s up() method should have void return type', $filename));

        expect(preg_match('/public function down\(\)\s*:\s*void/', $content))
            ->toBe(1, \sprintf('Migration %s down() method should have void return type', $filename));
    }
});

it('should use strict types in migrations', function(): void {
    foreach (getMigrationFiles() as $file) {
        $content = file_get_contents($file);
        $filename = basename((string) $file);

        expect(preg_match('/declare\(strict_types\s*=\s*1\)/', $content))
            ->toBe(1, \sprintf('Migration %s should declare strict types', $filename));
    }
});
