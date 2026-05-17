<?php

declare(strict_types = 1);

use App\Models\StorageOption;
use App\Models\User;
use App\Policies\StorageOptionPolicy;

covers(StorageOptionPolicy::class);

describe('StorageOptionPolicy', function(): void {
    beforeEach(function(): void {
        $this->policy = new StorageOptionPolicy;
    });

    describe('always-allow methods', function(): void {
        it('should allow any authenticated user to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);

            expect($this->policy->{$method}($user))->toBeTrue();
        })->with([
            'viewAny' => ['viewAny'],
            'create' => ['create'],
        ]);
    });

    describe('family-scoped methods', function(): void {
        it('should allow user from same family to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family_id')->andReturn(1);

            $storageOption = \Mockery::mock(StorageOption::class);
            $storageOption->shouldReceive('getAttribute')->with('family_id')->andReturn(1);

            expect($this->policy->{$method}($user, $storageOption))->toBeTrue();
        })->with([
            'view' => ['view'],
            'update' => ['update'],
            'delete' => ['delete'],
            'assignPart' => ['assignPart'],
            'viewParts' => ['viewParts'],
        ]);

        it('should deny user from different family to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family_id')->andReturn(1);

            $storageOption = \Mockery::mock(StorageOption::class);
            $storageOption->shouldReceive('getAttribute')->with('family_id')->andReturn(2);

            expect($this->policy->{$method}($user, $storageOption))->toBeFalse();
        })->with([
            'view' => ['view'],
            'update' => ['update'],
            'delete' => ['delete'],
            'assignPart' => ['assignPart'],
            'viewParts' => ['viewParts'],
        ]);
    });
});
