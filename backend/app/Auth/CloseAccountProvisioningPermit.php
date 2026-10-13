<?php

declare(strict_types = 1);

namespace App\Auth;

/**
 * WR-2128: an Octane worker outlives the request, and so does a static flag. Registered on
 * RequestTerminated and TaskTerminated in config/octane.php.
 */
final class CloseAccountProvisioningPermit
{
    public function handle(): void
    {
        AccountProvisioningPermit::close();
    }
}
