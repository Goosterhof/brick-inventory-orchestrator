<?php

declare(strict_types = 1);

use App\Actions\Family\GenerateInviteCodeAction;
use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;

covers(GenerateInviteCodeAction::class);

describe('GenerateInviteCodeAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should create an invite code with correct attributes', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        // Mock: no existing active code
        $activeQuery = \Mockery::mock(Builder::class);
        $activeQuery->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $activeQuery->shouldReceive('active')->once()->andReturnSelf();
        $activeQuery->shouldReceive('first')->once()->andReturnNull();

        // Mock: uniqueness check
        $uniqueQuery = \Mockery::mock(Builder::class);
        $uniqueQuery->shouldReceive('where')->with('code', \Mockery::type('string'))->once()->andReturnSelf();
        $uniqueQuery->shouldReceive('exists')->once()->andReturnFalse();

        $savedValues = [];
        $codeInstance = \Mockery::mock(InviteCode::class);
        $codeInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $codeInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $codeInstance->shouldReceive('save')->once();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->twice()->andReturn($activeQuery, $uniqueQuery);
        $inviteCode->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($codeInstance);

        $action = new GenerateInviteCodeAction($inviteCode, $this->db, 7);

        // act
        $result = $action->execute($family, $user);

        // assert
        expect($result)->toBe($codeInstance)
            ->and($savedValues['family_id'])->toBe(10)
            ->and($savedValues['generated_by'])->toBe(1)
            ->and($savedValues['code'])->toMatch('/^BRICK-[A-Z0-9]{4}$/')
            ->and($savedValues['expires_at']->toDateTimeString())->toBe(now()->addDays(7)->toDateTimeString());
    });

    it('should revoke existing active code before generating new one', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        // Mock: existing active code found
        $existingCode = \Mockery::mock(InviteCode::class);
        $existingCodeValues = [];
        $existingCode->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingCodeValues): void {
            $existingCodeValues[$key] = $value;
        });
        $existingCode->shouldReceive('save')->once();

        $activeQuery = \Mockery::mock(Builder::class);
        $activeQuery->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $activeQuery->shouldReceive('active')->once()->andReturnSelf();
        $activeQuery->shouldReceive('first')->once()->andReturn($existingCode);

        // Mock: uniqueness check
        $uniqueQuery = \Mockery::mock(Builder::class);
        $uniqueQuery->shouldReceive('where')->with('code', \Mockery::type('string'))->once()->andReturnSelf();
        $uniqueQuery->shouldReceive('exists')->once()->andReturnFalse();

        $codeInstance = \Mockery::mock(InviteCode::class);
        $codeInstance->allows('setAttribute');
        $codeInstance->allows('getAttribute');
        $codeInstance->shouldReceive('save')->once();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->twice()->andReturn($activeQuery, $uniqueQuery);
        $inviteCode->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($codeInstance);

        $action = new GenerateInviteCodeAction($inviteCode, $this->db, 7);

        // act
        $action->execute($family, $user);

        // assert
        expect($existingCodeValues['revoked_at'])->not->toBeNull();
    });

    it('should set null expires_at when ttlDays is zero', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $activeQuery = \Mockery::mock(Builder::class);
        $activeQuery->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $activeQuery->shouldReceive('active')->once()->andReturnSelf();
        $activeQuery->shouldReceive('first')->once()->andReturnNull();

        $uniqueQuery = \Mockery::mock(Builder::class);
        $uniqueQuery->shouldReceive('where')->with('code', \Mockery::type('string'))->once()->andReturnSelf();
        $uniqueQuery->shouldReceive('exists')->once()->andReturnFalse();

        $savedValues = [];
        $codeInstance = \Mockery::mock(InviteCode::class);
        $codeInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $codeInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $codeInstance->shouldReceive('save')->once();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->twice()->andReturn($activeQuery, $uniqueQuery);
        $inviteCode->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($codeInstance);

        $action = new GenerateInviteCodeAction($inviteCode, $this->db, 0);

        // act
        $action->execute($family, $user);

        // assert
        expect($savedValues['expires_at'])->toBeNull();
    });

    it('should retry code generation when code already exists', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $activeQuery = \Mockery::mock(Builder::class);
        $activeQuery->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $activeQuery->shouldReceive('active')->once()->andReturnSelf();
        $activeQuery->shouldReceive('first')->once()->andReturnNull();

        // First uniqueness check returns true (exists), second returns false
        $uniqueQuery1 = \Mockery::mock(Builder::class);
        $uniqueQuery1->shouldReceive('where')->with('code', \Mockery::type('string'))->once()->andReturnSelf();
        $uniqueQuery1->shouldReceive('exists')->once()->andReturnTrue();

        $uniqueQuery2 = \Mockery::mock(Builder::class);
        $uniqueQuery2->shouldReceive('where')->with('code', \Mockery::type('string'))->once()->andReturnSelf();
        $uniqueQuery2->shouldReceive('exists')->once()->andReturnFalse();

        $codeInstance = \Mockery::mock(InviteCode::class);
        $codeInstance->allows('setAttribute');
        $codeInstance->allows('getAttribute');
        $codeInstance->shouldReceive('save')->once();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->times(3)->andReturn($activeQuery, $uniqueQuery1, $uniqueQuery2);
        $inviteCode->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($codeInstance);

        $action = new GenerateInviteCodeAction($inviteCode, $this->db, 7);

        // act
        $result = $action->execute($family, $user);

        // assert
        expect($result)->toBe($codeInstance);
    });

    it('should generate code matching BRICK-XXXX format', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $activeQuery = \Mockery::mock(Builder::class);
        $activeQuery->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $activeQuery->shouldReceive('active')->once()->andReturnSelf();
        $activeQuery->shouldReceive('first')->once()->andReturnNull();

        $uniqueQuery = \Mockery::mock(Builder::class);
        $uniqueQuery->shouldReceive('where')->with('code', \Mockery::type('string'))->once()->andReturnSelf();
        $uniqueQuery->shouldReceive('exists')->once()->andReturnFalse();

        $savedValues = [];
        $codeInstance = \Mockery::mock(InviteCode::class);
        $codeInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $codeInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $codeInstance->shouldReceive('save')->once();

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->twice()->andReturn($activeQuery, $uniqueQuery);
        $inviteCode->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($codeInstance);

        $action = new GenerateInviteCodeAction($inviteCode, $this->db, 7);

        // act
        $action->execute($family, $user);

        // assert
        expect($savedValues['code'])->toMatch('/^BRICK-[A-Z0-9]{4}$/');
    });
});
