<?php

declare(strict_types = 1);

use App\Actions\Family\RevokeInviteCodeAction;
use App\Exceptions\InviteCodeNotFoundException;
use App\Models\Family;
use App\Models\InviteCode;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;

covers(RevokeInviteCodeAction::class);

describe('RevokeInviteCodeAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should set revoked_at on the active invite code', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $savedValues = [];
        $activeCode = \Mockery::mock(InviteCode::class);
        $activeCode->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $activeCode->shouldReceive('save')->once();

        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturn($activeCode);

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->once()->andReturn($query);

        $action = new RevokeInviteCodeAction($inviteCode, $this->db);

        // act
        $action->execute($family);

        // assert
        expect($savedValues['revoked_at'])->not->toBeNull()
            ->and($savedValues['revoked_at']->toDateTimeString())->toBe(now()->toDateTimeString());
    });

    it('should throw InviteCodeNotFoundException when no active code exists', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturnNull();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->once()->andReturn($query);

        $action = new RevokeInviteCodeAction($inviteCode, $this->db);

        // act & assert
        expect(fn() => $action->execute($family))
            ->toThrow(InviteCodeNotFoundException::class);
    });

    it('should not save anything when no active code exists', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturnNull();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->once()->andReturn($query);

        $action = new RevokeInviteCodeAction($inviteCode, $this->db);

        // act
        try {
            $action->execute($family);
        } catch (InviteCodeNotFoundException) {
            // expected
        }

        // assert — Mockery expectations verify nothing was saved
    });
});
