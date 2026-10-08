<?php

declare(strict_types = 1);

use App\Actions\Auth\CreateAccountAction;
use App\DataTransferObjects\Input\Auth\CreateAccountData;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Relations\HasMany;

covers(CreateAccountAction::class);

describe('CreateAccountAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $this->events = [];
        $this->familyValues = [];
        $this->userValues = [];

        $this->familyInstance = \Mockery::mock(Family::class);
        $this->familyInstance->allows('setAttribute')->andReturnUsing(function(string $key, mixed $value): void {
            $this->familyValues[$key] = $value;
            $this->events[] = 'family.' . $key;
        });
        $this->familyInstance->shouldReceive('save')->twice()->andReturnUsing(function(): bool {
            $this->events[] = 'family.save';

            return true;
        });

        $this->userInstance = \Mockery::mock(User::class);
        $this->userInstance->allows('setAttribute')->andReturnUsing(function(string $key, mixed $value): void {
            $this->userValues[$key] = $value;
        });
        $this->userInstance->allows('getAttribute')->with('id')->andReturn(42);

        $usersRelation = \Mockery::mock(HasMany::class);
        $usersRelation->shouldReceive('save')->once()->with($this->userInstance)->andReturnUsing(function(): User {
            $this->events[] = 'users.save';

            return $this->userInstance;
        });
        $this->familyInstance->shouldReceive('users')->once()->andReturn($usersRelation);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($this->familyInstance);

        $user = \Mockery::mock(User::class);
        $user->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($this->userInstance);

        $this->action = new CreateAccountAction($user, $family, $this->db);
        $this->data = new CreateAccountData(
            familyName: 'Test Family',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        );
    });

    it('should return the created user', function(): void {
        // act
        $result = $this->action->execute($this->data);

        // assert
        expect($result)->toBe($this->userInstance);
    });

    it('should write the provided values onto the family and the user', function(): void {
        // act
        $this->action->execute($this->data);

        // assert
        expect($this->familyValues)->toBe(['name' => 'Test Family', 'head_id' => 42])
            ->and($this->userValues)->toBe([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);
    });

    it('should save the family, attach the user, then set the user as head', function(): void {
        // act
        $this->action->execute($this->data);

        // assert
        expect($this->events)->toBe([
            'family.name',
            'family.save',
            'users.save',
            'family.head_id',
            'family.save',
        ]);
    });
});
