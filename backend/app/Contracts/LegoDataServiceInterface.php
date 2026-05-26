<?php

declare(strict_types = 1);

namespace App\Contracts;

use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\DataTransferObjects\Input\Lego\RebrickableUserSetData;
use App\Exceptions\InvalidApiResponseException;
use App\Exceptions\RebrickableApiException;
use App\Exceptions\SetNotFoundException;
use Generator;

interface LegoDataServiceInterface
{
    /**
     * Fetch a LEGO set by its set number.
     *
     * @throws SetNotFoundException
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     */
    public function fetchSet(string $setNum): LegoSetData;

    /**
     * Search for a LEGO set by its EAN barcode.
     *
     * @throws SetNotFoundException
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     */
    public function fetchSetByEan(string $ean): LegoSetData;

    /**
     * Fetch all parts for a LEGO set.
     *
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     *
     * @return list<LegoSetPartData>
     */
    public function fetchSetParts(string $setNum): array;

    /**
     * Fetch sets from a user's Rebrickable collection, yielding one page at a time.
     *
     * The cache key is rooted in the family id (rotation-invariant integer), not the
     * decrypted user token — keeping cleartext tokens out of the database-backed
     * cache table (ISO 27001 A.5.33 pattern).
     *
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     *
     * @return Generator<int, list<RebrickableUserSetData>>
     */
    public function fetchUserSets(int $familyId, string $userToken): Generator;

    /**
     * Fetch the LEGO theme catalog, yielding one page at a time.
     *
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     *
     * @return Generator<int, list<LegoThemeData>>
     */
    public function fetchThemes(): Generator;
}
