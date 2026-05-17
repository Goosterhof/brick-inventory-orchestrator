<?php

declare(strict_types = 1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Middleware\HandleCors;

covers(HandleCors::class);

uses(RefreshDatabase::class);

describe('CORS configuration', function(): void {
    it('should not contain empty strings in cors allowed_origins', function(): void {
        $origins = config('cors.allowed_origins');

        expect($origins)->toBeArray()
            ->and($origins)->not->toContain('')
            ->and($origins)->each->toStartWith('http');
    });

    it('should contain at least one well-formed origin', function(): void {
        $origins = config('cors.allowed_origins');

        expect($origins)->toBeArray()
            ->and(\count($origins))->toBeGreaterThan(0);
    });
});
