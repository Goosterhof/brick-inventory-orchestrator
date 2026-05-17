<?php

declare(strict_types = 1);

use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use App\Policies\StorageOptionPartPolicy;

covers(StorageOptionPartPolicy::class);

describe('StorageOptionPartPolicy', function(): void {
    it('should allow or deny delete based on family match', function(int $userFamilyId, int $storageFamilyId, bool $expected): void {
        $user = \Mockery::mock(User::class);
        $user->shouldReceive('getAttribute')->with('family_id')->andReturn($userFamilyId);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('getAttribute')->with('family_id')->andReturn($storageFamilyId);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('getAttribute')->with('storageOption')->andReturn($storageOption);

        expect(new StorageOptionPartPolicy()->delete($user, $storageOptionPart))->toBe($expected);
    })->with([
        'same family allows delete' => [1, 1, true],
        'different family denies delete' => [1, 2, false],
    ]);
});
