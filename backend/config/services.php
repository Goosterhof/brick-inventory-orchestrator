<?php

declare(strict_types = 1);

return [
    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
     */

    'rebrickable' => [
        'key' => env('REBRICKABLE_API_KEY'),
        'base_url' => env('REBRICKABLE_BASE_URL', 'https://rebrickable.com/api/v3'),
        'cache_ttl' => (int) env('REBRICKABLE_CACHE_TTL', 86_400), // 24 hours for catalog data
        'user_cache_ttl' => (int) env('REBRICKABLE_USER_CACHE_TTL', 3_600), // 1 hour for user data
    ],

    'brickognize' => [
        'base_url' => env('BRICKOGNIZE_BASE_URL', 'https://api.brickognize.com'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

];
