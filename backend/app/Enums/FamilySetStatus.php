<?php

declare(strict_types = 1);

namespace App\Enums;

enum FamilySetStatus: string
{
    case Sealed = 'sealed';
    case Built = 'built';
    case InProgress = 'in_progress';
    case InStorage = 'in_storage';
    case Incomplete = 'incomplete';
    case Wishlist = 'wishlist';
}
