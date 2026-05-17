<?php

declare(strict_types = 1);

use App\Actions\Family\SetRebrickableTokenAction;
use App\DataTransferObjects\Input\Family\SetRebrickableTokenData;
use App\Exceptions\NotFamilyHeadException;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

covers(SetRebrickableTokenAction::class);

describe('SetRebrickableTokenAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should set the rebrickable user token on the family', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $savedValues = [];
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $family->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            if ($key === 'head_id') {
                return 1;
            }

            return $savedValues[$key] ?? null;
        });
        $family->shouldReceive('save')->once();

        $data = new SetRebrickableTokenData(
            rebrickableUserToken: 'my-secret-token',
        );

        $action = new SetRebrickableTokenAction($this->db);

        // act
        $action->execute($family, $data, $user);

        // assert
        expect($savedValues['rebrickable_user_token'])->toBe('my-secret-token');
    });

    it('should return the updated family', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('setAttribute');
        $family->shouldReceive('save');

        $data = new SetRebrickableTokenData(
            rebrickableUserToken: 'another-token',
        );

        $action = new SetRebrickableTokenAction($this->db);

        // act
        $result = $action->execute($family, $data, $user);

        // assert
        expect($result)->toBe($family);
    });

    it('should overwrite existing token', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $savedValues = ['rebrickable_user_token' => 'old-token'];
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $family->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            if ($key === 'head_id') {
                return 1;
            }

            return $savedValues[$key] ?? null;
        });
        $family->shouldReceive('save')->once();

        $data = new SetRebrickableTokenData(
            rebrickableUserToken: 'new-token',
        );

        $action = new SetRebrickableTokenAction($this->db);

        // act
        $action->execute($family, $data, $user);

        // assert
        expect($savedValues['rebrickable_user_token'])->toBe('new-token');
    });

    it('should throw NotFamilyHeadException when user is not the family head', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(2);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->shouldReceive('save')->never();

        $data = new SetRebrickableTokenData(
            rebrickableUserToken: 'my-token',
        );

        $action = new SetRebrickableTokenAction($this->db);

        // act & assert
        expect(fn(): Family => $action->execute($family, $data, $user))
            ->toThrow(NotFamilyHeadException::class);
    });

    it('should allow action when user is the family head', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(5);

        $savedValues = [];
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(5);
        $family->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $family->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            if ($key === 'head_id') {
                return 5;
            }

            return $savedValues[$key] ?? null;
        });
        $family->shouldReceive('save')->once();

        $data = new SetRebrickableTokenData(
            rebrickableUserToken: 'valid-token',
        );

        $action = new SetRebrickableTokenAction($this->db);

        // act
        $result = $action->execute($family, $data, $user);

        // assert
        expect($result)->toBe($family)
            ->and($savedValues['rebrickable_user_token'])->toBe('valid-token');
    });
});
