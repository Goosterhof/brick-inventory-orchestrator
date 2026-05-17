<?php

declare(strict_types = 1);

use App\Actions\Auth\CreateUserWithFamilyAction;
use App\DataTransferObjects\Input\Auth\RegisterUserData;
use App\Exceptions\InvalidInviteCodeException;
use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

covers(CreateUserWithFamilyAction::class);

describe('CreateUserWithFamilyAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
        $this->inviteCodeModel = \Mockery::mock(InviteCode::class);
    });

    it('should create a family with the provided name', function(): void {
        // arrange
        $familySavedValues = [];
        $familyInstance = \Mockery::mock(Family::class);
        $familyInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$familySavedValues): void {
            $familySavedValues[$key] = $value;
        });
        $familyInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$familySavedValues): mixed {
            return $familySavedValues[$key] ?? null;
        });
        $familyInstance->shouldReceive('save')->twice();
        $familyInstance->shouldReceive('users->save')->once();

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($familyInstance);

        $userSavedValues = [];
        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$userSavedValues): void {
            $userSavedValues[$key] = $value;
        });
        $userInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$userSavedValues): mixed {
            return $userSavedValues[$key] ?? null;
        });

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($userInstance);

        $action = new CreateUserWithFamilyAction($user, $family, $this->inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: 'Test Family',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($userInstance)
            ->and($familySavedValues['name'])->toBe('Test Family');
    });

    it('should save the family before creating the user', function(): void {
        // arrange
        $saveOrder = [];

        $familyInstance = \Mockery::mock(Family::class);
        $familyInstance->allows('setAttribute');
        $familyInstance->allows('getAttribute');
        $familyInstance->shouldReceive('save')->twice()->andReturnUsing(function() use (&$saveOrder): bool {
            $saveOrder[] = 'family';

            return true;
        });

        $usersRelation = \Mockery::mock(HasMany::class);
        $usersRelation->shouldReceive('save')->once()->andReturnUsing(function() use (&$saveOrder): bool {
            $saveOrder[] = 'user';

            return true;
        });

        $familyInstance->shouldReceive('users')->once()->andReturn($usersRelation);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->withNoArgs()->andReturn($familyInstance);

        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute');
        $userInstance->allows('getAttribute');

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')->withNoArgs()->andReturn($userInstance);

        $action = new CreateUserWithFamilyAction($user, $family, $this->inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: 'Test Family',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        );

        // act
        $action->execute($data);

        // assert
        expect($saveOrder)->toBe(['family', 'user', 'family']);
    });

    it('should associate the user with the family via the relationship', function(): void {
        // arrange
        $familyInstance = \Mockery::mock(Family::class);
        $familyInstance->allows('setAttribute');
        $familyInstance->allows('getAttribute');
        $familyInstance->shouldReceive('save')->twice();

        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute');
        $userInstance->allows('getAttribute');

        $usersRelation = \Mockery::mock(HasMany::class);
        $usersRelation->shouldReceive('save')
            ->with($userInstance)
            ->once();

        $familyInstance->shouldReceive('users')->once()->andReturn($usersRelation);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->withNoArgs()->andReturn($familyInstance);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')->withNoArgs()->andReturn($userInstance);

        $action = new CreateUserWithFamilyAction($user, $family, $this->inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: 'Test Family',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        );

        // act
        $action->execute($data);

        // assert - Mockery expectations verify the interactions
    });

    it('should set the correct user properties', function(): void {
        // arrange
        $familyInstance = \Mockery::mock(Family::class);
        $familyInstance->allows('setAttribute');
        $familyInstance->allows('getAttribute');
        $familyInstance->shouldReceive('save')->twice();
        $familyInstance->shouldReceive('users->save')->once();

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->withNoArgs()->andReturn($familyInstance);

        $userSavedValues = [];
        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$userSavedValues): void {
            $userSavedValues[$key] = $value;
        });
        $userInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$userSavedValues): mixed {
            return $userSavedValues[$key] ?? null;
        });

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($userInstance);

        $action = new CreateUserWithFamilyAction($user, $family, $this->inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: 'Test Family',
            name: 'John Doe',
            email: 'john@example.com',
            password: 'secret123',
        );

        // act
        $action->execute($data);

        // assert
        expect($userSavedValues['name'])->toBe('John Doe')
            ->and($userSavedValues['email'])->toBe('john@example.com')
            ->and($userSavedValues['password'])->toBe('secret123');
    });

    it('should set the created user as family head', function(): void {
        // arrange
        $familySavedValues = [];
        $familyInstance = \Mockery::mock(Family::class);
        $familyInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$familySavedValues): void {
            $familySavedValues[$key] = $value;
        });
        $familyInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$familySavedValues): mixed {
            return $familySavedValues[$key] ?? null;
        });
        $familyInstance->shouldReceive('save')->twice();

        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute');
        $userInstance->allows('getAttribute')->with('id')->andReturn(42);

        $usersRelation = \Mockery::mock(HasMany::class);
        $usersRelation->shouldReceive('save')
            ->with($userInstance)
            ->once();

        $familyInstance->shouldReceive('users')->once()->andReturn($usersRelation);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->withNoArgs()->andReturn($familyInstance);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')->withNoArgs()->andReturn($userInstance);

        $action = new CreateUserWithFamilyAction($user, $family, $this->inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: 'Test Family',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        );

        // act
        $action->execute($data);

        // assert
        expect($familySavedValues['head_id'])->toBe(42);
    });

    it('should join existing family when valid invite code is provided', function(): void {
        // arrange
        $existingFamily = \Mockery::mock(Family::class);
        $existingFamily->allows('getAttribute')->with('id')->andReturn(50);

        $inviteCodeInstance = \Mockery::mock(InviteCode::class);
        $inviteCodeInstance->allows('getAttribute')->with('family')->andReturn($existingFamily);
        $inviteCodeInstance->allows('getRelationValue')->with('family')->andReturn($existingFamily);

        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('code', 'BRICK-TEST')->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturn($inviteCodeInstance);

        $inviteCodeModel = \Mockery::mock(InviteCode::class);
        $inviteCodeModel->shouldReceive('newQuery')->once()->andReturn($query);

        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute');
        $userInstance->allows('getAttribute');

        $usersRelation = \Mockery::mock(HasMany::class);
        $usersRelation->shouldReceive('save')->with($userInstance)->once();
        $existingFamily->shouldReceive('users')->once()->andReturn($usersRelation);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($userInstance);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->never();

        $action = new CreateUserWithFamilyAction($user, $family, $inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: '',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            inviteCode: 'BRICK-TEST',
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($userInstance);
    });

    it('should throw InvalidInviteCodeException for invalid invite code', function(): void {
        // arrange
        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('code', 'BRICK-FAKE')->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturnNull();

        $inviteCodeModel = \Mockery::mock(InviteCode::class);
        $inviteCodeModel->shouldReceive('newQuery')->once()->andReturn($query);

        $user = \Mockery::mock(User::class);
        $family = \Mockery::mock(Family::class);

        $action = new CreateUserWithFamilyAction($user, $family, $inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: '',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            inviteCode: 'BRICK-FAKE',
        );

        // act & assert
        expect(fn(): User => $action->execute($data))
            ->toThrow(InvalidInviteCodeException::class);
    });

    it('should not create a new family when using invite code', function(): void {
        // arrange
        $existingFamily = \Mockery::mock(Family::class);
        $existingFamily->allows('getAttribute')->with('id')->andReturn(50);

        $inviteCodeInstance = \Mockery::mock(InviteCode::class);
        $inviteCodeInstance->allows('getAttribute')->with('family')->andReturn($existingFamily);
        $inviteCodeInstance->allows('getRelationValue')->with('family')->andReturn($existingFamily);

        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('code', 'BRICK-TEST')->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturn($inviteCodeInstance);

        $inviteCodeModel = \Mockery::mock(InviteCode::class);
        $inviteCodeModel->shouldReceive('newQuery')->once()->andReturn($query);

        $userInstance = \Mockery::mock(User::class);
        $userInstance->allows('setAttribute');
        $userInstance->allows('getAttribute');

        $usersRelation = \Mockery::mock(HasMany::class);
        $usersRelation->shouldReceive('save')->once();
        $existingFamily->shouldReceive('users')->once()->andReturn($usersRelation);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($userInstance);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->never();
        $family->shouldReceive('save')->never();

        $action = new CreateUserWithFamilyAction($user, $family, $inviteCodeModel, $this->db);
        $data = new RegisterUserData(
            familyName: '',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            inviteCode: 'BRICK-TEST',
        );

        // act
        $action->execute($data);

        // assert — Mockery expectations verify Family::newInstance was never called
    });
});
