<?php

declare(strict_types = 1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * WR-2128 round 3: a model in App\Models whose class name derives the users table. Loaded with
 * require_once by AccountProvisioningPermitTest; it lives outside app/ so it never ships.
 */
final class Users extends Model
{
    use HasFactory;
}
