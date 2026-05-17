<?php

declare(strict_types = 1);

use App\Http\Resources\ProfileResourceData;
use App\Models\User;

covers(ProfileResourceData::class);

describe('ProfileResourceData', function(): void {
    it('should convert user model to profile resource data', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);
        $user->allows('getAttribute')->with('family_id')->andReturn(10);
        $user->allows('getAttribute')->with('name')->andReturn('Jan de Vries');
        $user->allows('getAttribute')->with('email')->andReturn('jan@example.com');
        $user->allows('getAttribute')->with('email_verified_at')->andReturn(
            new \DateTimeImmutable('2025-06-15T14:30:00+02:00'),
        );

        // act
        $resource = ProfileResourceData::from($user);

        // assert
        expect($resource)->toBeInstanceOf(ProfileResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->family_id)->toBe(10)
            ->and($resource->name)->toBe('Jan de Vries')
            ->and($resource->email)->toBe('jan@example.com')
            ->and($resource->email_verified_at)->toBeInstanceOf(\DateTimeInterface::class);
    });

    it('should serialize email_verified_at to ISO 8601 format', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);
        $user->allows('getAttribute')->with('family_id')->andReturn(10);
        $user->allows('getAttribute')->with('name')->andReturn('Jan de Vries');
        $user->allows('getAttribute')->with('email')->andReturn('jan@example.com');
        $user->allows('getAttribute')->with('email_verified_at')->andReturn(
            new \DateTimeImmutable('2025-06-15T14:30:00+02:00'),
        );

        // act
        $array = ProfileResourceData::from($user)->toArray();

        // assert
        expect($array['email_verified_at'])->toBe('2025-06-15T14:30:00+02:00');
    });

    it('should handle null email_verified_at', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(2);
        $user->allows('getAttribute')->with('family_id')->andReturn(10);
        $user->allows('getAttribute')->with('name')->andReturn('Maria Jansen');
        $user->allows('getAttribute')->with('email')->andReturn('maria@example.com');
        $user->allows('getAttribute')->with('email_verified_at')->andReturn(null);

        // act
        $resource = ProfileResourceData::from($user);
        $array = $resource->toArray();

        // assert
        expect($resource->email_verified_at)->toBeNull()
            ->and($array['email_verified_at'])->toBeNull();
    });
});
