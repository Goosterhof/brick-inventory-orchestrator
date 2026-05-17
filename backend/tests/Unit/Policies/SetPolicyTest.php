<?php

declare(strict_types = 1);

use App\Models\User;
use App\Policies\SetPolicy;

covers(SetPolicy::class);

describe('SetPolicy', function(): void {
    beforeEach(function(): void {
        $this->policy = new SetPolicy;
    });

    it('should allow any user to call method', function(string $method): void {
        $user = \Mockery::mock(User::class);

        expect($this->policy->{$method}($user))->toBeTrue();
    })->with([
        'viewParts' => ['viewParts'],
        'lookupByEan' => ['lookupByEan'],
        'viewStorageMap' => ['viewStorageMap'],
    ]);
});
