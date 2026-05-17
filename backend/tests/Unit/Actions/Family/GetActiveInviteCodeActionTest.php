<?php

declare(strict_types = 1);

use App\Actions\Family\GetActiveInviteCodeAction;
use App\Exceptions\InviteCodeNotFoundException;
use App\Models\Family;
use App\Models\InviteCode;
use Illuminate\Database\Eloquent\Builder;

covers(GetActiveInviteCodeAction::class);

describe('GetActiveInviteCodeAction', function(): void {
    it('should return the active invite code for the family', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $activeCode = \Mockery::mock(InviteCode::class);

        $query = \Mockery::mock(Builder::class);
        $query->shouldReceive('where')->with('family_id', 10)->once()->andReturnSelf();
        $query->shouldReceive('active')->once()->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturn($activeCode);

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->shouldReceive('newQuery')->once()->andReturn($query);

        $action = new GetActiveInviteCodeAction($inviteCode);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($activeCode);
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

        $action = new GetActiveInviteCodeAction($inviteCode);

        // act & assert
        expect(fn(): InviteCode => $action->execute($family))
            ->toThrow(InviteCodeNotFoundException::class);
    });
});
