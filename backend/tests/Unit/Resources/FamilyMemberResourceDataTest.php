<?php

declare(strict_types = 1);

use App\Http\Resources\FamilyMemberResourceData;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

covers(FamilyMemberResourceData::class);

describe('FamilyMemberResourceData', function(): void {
    it('should create resource from user model', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);
        $user->allows('getAttribute')->with('name')->andReturn('Jan de Vries');
        $user->allows('getAttribute')->with('email')->andReturn('jan@example.com');

        // act
        $resource = FamilyMemberResourceData::from($user);

        // assert
        expect($resource)->toBeInstanceOf(FamilyMemberResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->name)->toBe('Jan de Vries')
            ->and($resource->email)->toBe('jan@example.com')
            ->and($resource->is_head)->toBeFalse();
    });

    it('should create collection from family with head flag', function(): void {
        // arrange
        $head = \Mockery::mock(User::class);
        $head->allows('getAttribute')->with('id')->andReturn(1);
        $head->allows('getAttribute')->with('name')->andReturn('Jan de Vries');
        $head->allows('getAttribute')->with('email')->andReturn('jan@example.com');

        $member = \Mockery::mock(User::class);
        $member->allows('getAttribute')->with('id')->andReturn(2);
        $member->allows('getAttribute')->with('name')->andReturn('Maria Jansen');
        $member->allows('getAttribute')->with('email')->andReturn('maria@example.com');

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('head_id')->andReturn(1);
        $family->allows('getAttribute')->with('users')->andReturn(new Collection([$head, $member]));

        // act
        $result = FamilyMemberResourceData::fromFamily($family);

        // assert
        expect($result)->toHaveCount(2)
            ->and($result[0]->name)->toBe('Jan de Vries')
            ->and($result[0]->is_head)->toBeTrue()
            ->and($result[1]->name)->toBe('Maria Jansen')
            ->and($result[1]->is_head)->toBeFalse();
    });

    it('should serialize to array with snake_case keys', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);
        $user->allows('getAttribute')->with('name')->andReturn('Jan');
        $user->allows('getAttribute')->with('email')->andReturn('jan@example.com');

        // act
        $array = FamilyMemberResourceData::from($user)->toArray();

        // assert
        expect($array)->toBe([
            'id' => 1,
            'name' => 'Jan',
            'email' => 'jan@example.com',
            'is_head' => false,
        ]);
    });
});
