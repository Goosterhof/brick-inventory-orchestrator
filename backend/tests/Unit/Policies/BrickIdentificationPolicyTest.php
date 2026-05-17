<?php

declare(strict_types = 1);

use App\Models\User;
use App\Policies\BrickIdentificationPolicy;

covers(BrickIdentificationPolicy::class);

describe('BrickIdentificationPolicy', function(): void {
    beforeEach(function(): void {
        $this->policy = new BrickIdentificationPolicy;
    });

    it('should allow any user to identify bricks', function(): void {
        $user = \Mockery::mock(User::class);

        expect($this->policy->identify($user))->toBeTrue();
    });
});
