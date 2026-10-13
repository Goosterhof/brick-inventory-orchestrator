<?php

declare(strict_types = 1);

namespace Tests;

use App\Auth\AccountProvisioningPermit;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Override;

abstract class TestCase extends BaseTestCase
{
    /**
     * WR-2128: factories insert users as fixtures in almost every test, and none of those tests
     * measures admission. tests/Feature/Auth/AccountProvisioningPermitTest closes the permit and
     * is where admission is measured.
     */
    #[Override]
    protected function setUp(): void
    {
        AccountProvisioningPermit::open();

        parent::setUp();
    }

    #[Override]
    protected function tearDown(): void
    {
        AccountProvisioningPermit::close();

        parent::tearDown();
    }
}
