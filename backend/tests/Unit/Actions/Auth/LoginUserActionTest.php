<?php

declare(strict_types = 1);

use App\Actions\Auth\LoginUserAction;
use App\DataTransferObjects\Input\Auth\LoginUserData;
use App\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

covers(LoginUserAction::class);

describe('LoginUserAction', function(): void {
    it('should return user when credentials are valid', function(): void {
        // arrange
        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('getAttribute')->with('password')->andReturn('hashed_password');

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')
            ->with('email', 'john@example.com')
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('first')
            ->once()
            ->andReturn($userInstance);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newQuery')
            ->once()
            ->andReturn($builder);

        $hasher = \Mockery::mock(Hasher::class);
        $hasher->shouldReceive('check')
            ->with('password123', 'hashed_password')
            ->once()
            ->andReturn(true);

        $loginData = new LoginUserData(
            email: 'john@example.com',
            password: 'password123',
        );

        $action = new LoginUserAction($user, $hasher);

        // act
        $result = $action->execute($loginData);

        // assert
        expect($result)->toBe($userInstance);
    });

    it('should throw validation exception when password is incorrect', function(): void {
        // arrange
        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('getAttribute')->with('password')->andReturn('hashed_password');

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')
            ->with('email', 'john@example.com')
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('first')
            ->once()
            ->andReturn($userInstance);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newQuery')
            ->once()
            ->andReturn($builder);

        $hasher = \Mockery::mock(Hasher::class);
        $hasher->shouldReceive('check')
            ->with('wrongpassword', 'hashed_password')
            ->once()
            ->andReturn(false);

        $loginData = new LoginUserData(
            email: 'john@example.com',
            password: 'wrongpassword',
        );

        $action = new LoginUserAction($user, $hasher);

        // act & assert
        $action->execute($loginData);
    })->throws(ValidationException::class);

    it('should throw validation exception when user does not exist', function(): void {
        // arrange
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')
            ->with('email', 'nonexistent@example.com')
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('first')
            ->once()
            ->andReturn(null);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newQuery')
            ->once()
            ->andReturn($builder);

        $hasher = \Mockery::mock(Hasher::class);

        $loginData = new LoginUserData(
            email: 'nonexistent@example.com',
            password: 'password123',
        );

        $action = new LoginUserAction($user, $hasher);

        // act & assert
        $action->execute($loginData);
    })->throws(ValidationException::class);
});
