<?php

declare(strict_types = 1);

namespace App\Auth;

use App\Exceptions\AccountProvisioningClosedException;
use Closure;

/**
 * WR-2128: BIO admits nobody, so no User row may be inserted unless provisioning was opened on
 * purpose. The flag is static because the guard runs inside the model, where the caller's frame
 * is out of reach; Octane keeps static state across requests, so every opening is undone in a
 * `finally` and CloseAccountProvisioningPermit closes it again after each request and task.
 *
 * PersonalAppArchitectureTest pins which application classes may use this class.
 */
final class AccountProvisioningPermit
{
    private static bool $open = false;

    /**
     * @template TResult
     *
     * @param Closure(): TResult $callback
     *
     * @return TResult
     */
    public static function during(Closure $callback): mixed
    {
        $wasOpen = self::$open;
        self::$open = true;

        try {
            return $callback();
        } finally {
            self::$open = $wasOpen;
        }
    }

    /**
     * For the test harness, which must hold the permit across setUp and tearDown; application
     * code opens it through during().
     */
    public static function open(): void
    {
        self::$open = true;
    }

    public static function close(): void
    {
        self::$open = false;
    }

    public static function isOpen(): bool
    {
        return self::$open;
    }

    /**
     * @throws AccountProvisioningClosedException
     */
    public static function assertOpen(string $path): void
    {
        if (!self::$open) {
            throw AccountProvisioningClosedException::forInsert($path);
        }
    }
}
