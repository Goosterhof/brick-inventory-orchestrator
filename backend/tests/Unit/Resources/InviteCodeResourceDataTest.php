<?php

declare(strict_types = 1);

use App\Http\Resources\InviteCodeResourceData;
use App\Models\InviteCode;
use Illuminate\Support\Facades\Date;

covers(InviteCodeResourceData::class);

describe('InviteCodeResourceData', function(): void {
    it('should create resource from InviteCode model', function(): void {
        // arrange
        $expiresAt = Date::parse('2026-04-01 12:00:00');
        $createdAt = Date::parse('2026-03-29 10:00:00');

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->allows('getAttribute')->with('id')->andReturn(1);
        $inviteCode->allows('getAttribute')->with('code')->andReturn('ABC123XY');
        $inviteCode->allows('getAttribute')->with('expires_at')->andReturn($expiresAt);
        $inviteCode->allows('getAttribute')->with('created_at')->andReturn($createdAt);

        // act
        $resource = InviteCodeResourceData::from($inviteCode);

        // assert
        expect($resource)->toBeInstanceOf(InviteCodeResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->code)->toBe('ABC123XY')
            ->and($resource->expires_at)->toBe($expiresAt)
            ->and($resource->created_at)->toBe($createdAt);
    });

    it('should serialize to array with ISO 8601 dates', function(): void {
        // arrange
        $expiresAt = Date::parse('2026-04-01 12:00:00');
        $createdAt = Date::parse('2026-03-29 10:00:00');

        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->allows('getAttribute')->with('id')->andReturn(2);
        $inviteCode->allows('getAttribute')->with('code')->andReturn('XYZ789AB');
        $inviteCode->allows('getAttribute')->with('expires_at')->andReturn($expiresAt);
        $inviteCode->allows('getAttribute')->with('created_at')->andReturn($createdAt);

        // act
        $array = InviteCodeResourceData::from($inviteCode)->toArray();

        // assert
        expect($array)->toBe([
            'id' => 2,
            'code' => 'XYZ789AB',
            'expires_at' => $expiresAt->format('c'),
            'created_at' => $createdAt->format('c'),
        ]);
    });

    it('should handle null dates', function(): void {
        // arrange
        $inviteCode = \Mockery::mock(InviteCode::class);
        $inviteCode->allows('getAttribute')->with('id')->andReturn(3);
        $inviteCode->allows('getAttribute')->with('code')->andReturn('NEVEREXP');
        $inviteCode->allows('getAttribute')->with('expires_at')->andReturn(null);
        $inviteCode->allows('getAttribute')->with('created_at')->andReturn(null);

        // act
        $resource = InviteCodeResourceData::from($inviteCode);

        // assert
        expect($resource->expires_at)->toBeNull()
            ->and($resource->created_at)->toBeNull();
    });
});
