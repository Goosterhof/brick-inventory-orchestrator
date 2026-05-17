<?php

declare(strict_types = 1);

use App\Models\FamilySet;
use App\Models\User;
use App\Policies\FamilySetPolicy;

covers(FamilySetPolicy::class);

describe('FamilySetPolicy', function(): void {
    beforeEach(function(): void {
        $this->policy = new FamilySetPolicy;
    });

    describe('always-allow methods', function(): void {
        it('should allow any authenticated user to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);

            expect($this->policy->{$method}($user))->toBeTrue();
        })->with([
            'viewAny' => ['viewAny'],
            'create' => ['create'],
            'viewImportStatus' => ['viewImportStatus'],
        ]);
    });

    describe('family-scoped methods', function(): void {
        it('should allow user from same family to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family_id')->andReturn(1);

            $familySet = \Mockery::mock(FamilySet::class);
            $familySet->shouldReceive('getAttribute')->with('family_id')->andReturn(1);

            expect($this->policy->{$method}($user, $familySet))->toBeTrue();
        })->with([
            'view' => ['view'],
            'update' => ['update'],
            'delete' => ['delete'],
        ]);

        it('should deny user from different family to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family_id')->andReturn(1);

            $familySet = \Mockery::mock(FamilySet::class);
            $familySet->shouldReceive('getAttribute')->with('family_id')->andReturn(2);

            expect($this->policy->{$method}($user, $familySet))->toBeFalse();
        })->with([
            'view' => ['view'],
            'update' => ['update'],
            'delete' => ['delete'],
        ]);
    });

    it('should allow viewCompletion', function(): void {
        $user = \Mockery::mock(User::class);

        expect($this->policy->viewCompletion($user))->toBeTrue();
    });

    it('should allow viewMissingParts', function(): void {
        $user = \Mockery::mock(User::class);

        expect($this->policy->viewMissingParts($user))->toBeTrue();
    });

    describe('importFromRebrickable', function(): void {
        it('should allow family head to import', function(): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family')->andReturn((object) ['head_id' => 42]);
            $user->shouldReceive('getAttribute')->with('id')->andReturn(42);

            expect($this->policy->importFromRebrickable($user))->toBeTrue();
        });

        it('should deny non-head family member from importing', function(): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family')->andReturn((object) ['head_id' => 42]);
            $user->shouldReceive('getAttribute')->with('id')->andReturn(99);

            expect($this->policy->importFromRebrickable($user))->toBeFalse();
        });
    });
});
