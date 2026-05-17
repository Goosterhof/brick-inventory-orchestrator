<?php

declare(strict_types = 1);

use App\Actions\Family\RemoveFamilyMemberAction;
use App\Exceptions\CannotRemoveSelfException;
use App\Exceptions\NotFamilyHeadException;
use App\Exceptions\UserNotInFamilyException;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

covers(RemoveFamilyMemberAction::class);

describe('RemoveFamilyMemberAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should create a new family for the removed member', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $newFamilySavedValues = [];
        $newFamily = \Mockery::mock(Family::class);
        $newFamily->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newFamilySavedValues): void {
            $newFamilySavedValues[$key] = $value;
        });
        $newFamily->allows('getAttribute')->andReturnUsing(function($key) use (&$newFamilySavedValues): mixed {
            return $newFamilySavedValues[$key] ?? null;
        });
        $newFamily->shouldReceive('save')->twice();

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($newFamily);

        $memberSavedValues = [];
        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(2);
        $member->allows('getAttribute')->with('family_id')->andReturn(10);
        $member->allows('getAttribute')->with('name')->andReturn('Jane Doe');
        $member->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$memberSavedValues): void {
            $memberSavedValues[$key] = $value;
        });
        $member->shouldReceive('save')->once();

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        $action->execute($family, $member, $actor);

        // assert
        expect($newFamilySavedValues['name'])->toBe("Jane Doe's Family")
            ->and($newFamilySavedValues['head_id'])->toBe(2)
            ->and($memberSavedValues['family_id'])->toBeNull(); // set to newFamily->id which is null in mock
    });

    it('should reassign the member to the new family', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $newFamilySavedValues = [];
        $newFamily = \Mockery::mock(Family::class);
        $newFamily->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newFamilySavedValues): void {
            $newFamilySavedValues[$key] = $value;
        });
        $newFamily->allows('getAttribute')->andReturnUsing(function($key) use (&$newFamilySavedValues): mixed {
            if ($key === 'id') {
                return 99;
            }

            return $newFamilySavedValues[$key] ?? null;
        });
        $newFamily->shouldReceive('save')->twice();

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($newFamily);

        $memberSavedValues = [];
        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(2);
        $member->allows('getAttribute')->with('family_id')->andReturn(10);
        $member->allows('getAttribute')->with('name')->andReturn('Jane Doe');
        $member->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$memberSavedValues): void {
            $memberSavedValues[$key] = $value;
        });
        $member->shouldReceive('save')->once();

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        $action->execute($family, $member, $actor);

        // assert
        expect($memberSavedValues['family_id'])->toBe(99);
    });

    it('should set the removed member as head of the new family', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $newFamilySavedValues = [];
        $newFamily = \Mockery::mock(Family::class);
        $newFamily->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newFamilySavedValues): void {
            $newFamilySavedValues[$key] = $value;
        });
        $newFamily->allows('getAttribute')->andReturnUsing(function($key) use (&$newFamilySavedValues): mixed {
            return $newFamilySavedValues[$key] ?? null;
        });
        $newFamily->shouldReceive('save')->twice();

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($newFamily);

        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(7);
        $member->allows('getAttribute')->with('family_id')->andReturn(10);
        $member->allows('getAttribute')->with('name')->andReturn('Bob');
        $member->allows('setAttribute');
        $member->shouldReceive('save')->once();

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        $action->execute($family, $member, $actor);

        // assert
        expect($newFamilySavedValues['head_id'])->toBe(7);
    });

    it('should save in correct order: new family, member, then family head update', function(): void {
        // arrange
        $saveOrder = [];

        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $newFamily = \Mockery::mock(Family::class);
        $newFamily->allows('setAttribute');
        $newFamily->allows('getAttribute');
        $newFamily->shouldReceive('save')->twice()->andReturnUsing(function() use (&$saveOrder): bool {
            $saveOrder[] = 'family';

            return true;
        });

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($newFamily);

        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(2);
        $member->allows('getAttribute')->with('family_id')->andReturn(10);
        $member->allows('getAttribute')->with('name')->andReturn('Jane');
        $member->allows('setAttribute');
        $member->shouldReceive('save')->once()->andReturnUsing(function() use (&$saveOrder): bool {
            $saveOrder[] = 'member';

            return true;
        });

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        $action->execute($family, $member, $actor);

        // assert
        expect($saveOrder)->toBe(['family', 'member', 'family']);
    });

    it('should throw NotFamilyHeadException when actor is not the family head', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(2);

        $member = \Mockery::mock(User::class);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);

        $familyModel = \Mockery::mock(Family::class);

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act & assert
        expect(fn() => $action->execute($family, $member, $actor))
            ->toThrow(NotFamilyHeadException::class);
    });

    it('should throw CannotRemoveSelfException when actor tries to remove themselves', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);

        $familyModel = \Mockery::mock(Family::class);

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act & assert
        expect(fn() => $action->execute($family, $actor, $actor))
            ->toThrow(CannotRemoveSelfException::class);
    });

    it('should throw UserNotInFamilyException when member is not in the family', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(2);
        $member->allows('getAttribute')->with('family_id')->andReturn(99);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $familyModel = \Mockery::mock(Family::class);

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act & assert
        expect(fn() => $action->execute($family, $member, $actor))
            ->toThrow(UserNotInFamilyException::class);
    });

    it('should not save anything when actor is not the family head', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(2);

        $member = \Mockery::mock(User::class);
        $member->shouldReceive('save')->never();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->never();

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        try {
            $action->execute($family, $member, $actor);
        } catch (NotFamilyHeadException) {
            // expected
        }

        // assert — Mockery expectations verify nothing was saved
    });

    it('should not save anything when actor tries to remove themselves', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);
        $actor->shouldReceive('save')->never();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->never();

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        try {
            $action->execute($family, $actor, $actor);
        } catch (CannotRemoveSelfException) {
            // expected
        }

        // assert — Mockery expectations verify nothing was saved
    });

    it('should not save anything when member is not in the family', function(): void {
        // arrange
        $actor = \Mockery::mock(User::class);
        $actor->allows('getAttribute')->with('id')->andReturn(1);

        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(2);
        $member->allows('getAttribute')->with('family_id')->andReturn(99);
        $member->shouldReceive('save')->never();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $familyModel = \Mockery::mock(Family::class);
        $familyModel->shouldReceive('newInstance')->never();

        $action = new RemoveFamilyMemberAction($familyModel, $this->db);

        // act
        try {
            $action->execute($family, $member, $actor);
        } catch (UserNotInFamilyException) {
            // expected
        }

        // assert — Mockery expectations verify nothing was saved
    });
});
