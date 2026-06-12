<?php

declare(strict_types = 1);

use App\Models\User;
use App\Policies\FamilyPolicy;

covers(FamilyPolicy::class);

describe('FamilyPolicy', function(): void {
    beforeEach(function(): void {
        $this->policy = new FamilyPolicy;
    });

    describe('always-allow methods', function(): void {
        it('should allow any authenticated user to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);

            expect($this->policy->{$method}($user))->toBeTrue();
        })->with([
            'viewMembers' => ['viewMembers'],
            'viewParts' => ['viewParts'],
            'viewStats' => ['viewStats'],
            'viewBrickDna' => ['viewBrickDna'],
            'submitFeedback' => ['submitFeedback'],
        ]);
    });

    describe('head-only methods', function(): void {
        it('should allow family head to call method', function(string $method): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family')->andReturn((object) ['head_id' => 42]);
            $user->shouldReceive('getAttribute')->with('id')->andReturn(42);

            expect($this->policy->{$method}($user))->toBeTrue();
        })->with([
            'removeMember' => ['removeMember'],
            'setRebrickableToken' => ['setRebrickableToken'],
            'generateInviteCode' => ['generateInviteCode'],
            'viewInviteCode' => ['viewInviteCode'],
            'revokeInviteCode' => ['revokeInviteCode'],
        ]);

        it('should deny non-head member from calling method', function(string $method): void {
            $user = \Mockery::mock(User::class);
            $user->shouldReceive('getAttribute')->with('family')->andReturn((object) ['head_id' => 42]);
            $user->shouldReceive('getAttribute')->with('id')->andReturn(99);

            expect($this->policy->{$method}($user))->toBeFalse();
        })->with([
            'removeMember' => ['removeMember'],
            'setRebrickableToken' => ['setRebrickableToken'],
            'generateInviteCode' => ['generateInviteCode'],
            'viewInviteCode' => ['viewInviteCode'],
            'revokeInviteCode' => ['revokeInviteCode'],
        ]);
    });
});
