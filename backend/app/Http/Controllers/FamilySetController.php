<?php

declare(strict_types = 1);

namespace App\Http\Controllers;

use App\Actions\FamilySet\CreateFamilySetAction;
use App\Actions\FamilySet\DeleteFamilySetAction;
use App\Actions\FamilySet\GetFamilyMissingPartsAction;
use App\Actions\FamilySet\GetFamilySetCompletionAction;
use App\Actions\FamilySet\GetFamilySetsAction;
use App\Actions\FamilySet\GetImportStatusAction;
use App\Actions\FamilySet\StartImportAction;
use App\Actions\FamilySet\UpdateFamilySetAction;
use App\Http\Requests\FamilySet\StoreFamilySetRequest;
use App\Http\Requests\FamilySet\UpdateFamilySetRequest;
use App\Http\Resources\FamilyMissingPartsResourceData;
use App\Http\Resources\FamilySetCompletionResourceData;
use App\Http\Resources\FamilySetResourceData;
use App\Http\Resources\ImportJobResourceData;
use App\Models\FamilySet;
use App\Models\ImportJob;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

class FamilySetController extends Controller
{
    /**
     * @return array<int, FamilySetResourceData>
     */
    public function index(#[CurrentUser] User $user, GetFamilySetsAction $getFamilySetsAction): array
    {
        $familySets = $getFamilySetsAction->execute($user->family);

        return FamilySetResourceData::collection($familySets);
    }

    /**
     * @return array<int, FamilySetCompletionResourceData>
     */
    public function completion(
        #[CurrentUser]
        User $user,
        GetFamilySetCompletionAction $getFamilySetCompletionAction,
    ): array {
        $familySetCompletionsResultData = $getFamilySetCompletionAction->execute($user->family);

        return FamilySetCompletionResourceData::fromResult($familySetCompletionsResultData);
    }

    public function missingParts(
        #[CurrentUser]
        User $user,
        GetFamilyMissingPartsAction $getFamilyMissingPartsAction,
    ): JsonResponse {
        $familyMissingPartsData = $getFamilyMissingPartsAction->execute($user->family);

        return FamilyMissingPartsResourceData::from($familyMissingPartsData)->toResponse();
    }

    public function store(
        StoreFamilySetRequest $storeFamilySetRequest,
        #[CurrentUser]
        User $user,
        CreateFamilySetAction $createFamilySetAction,
    ): JsonResponse {
        $familySet = $createFamilySetAction->execute($user->family, $storeFamilySetRequest->toDto());

        return FamilySetResourceData::from($familySet)->toResponseWithStatus(201);
    }

    public function show(FamilySet $familySet): JsonResponse
    {
        return FamilySetResourceData::from($familySet)->toResponse();
    }

    public function update(
        UpdateFamilySetRequest $updateFamilySetRequest,
        FamilySet $familySet,
        UpdateFamilySetAction $updateFamilySetAction,
    ): JsonResponse {
        $familySet = $updateFamilySetAction->execute($familySet, $updateFamilySetRequest->toDto());

        return FamilySetResourceData::from($familySet)->toResponse();
    }

    public function destroy(FamilySet $familySet, DeleteFamilySetAction $deleteFamilySetAction): JsonResponse
    {
        $deleteFamilySetAction->execute($familySet);

        return response()->json(null, 204);
    }

    public function importFromRebrickable(
        #[CurrentUser]
        User $user,
        StartImportAction $startImportAction,
    ): JsonResponse {
        $importJob = $startImportAction->execute($user->family);

        return ImportJobResourceData::from($importJob)->toResponseWithStatus(202);
    }

    public function importStatus(
        #[CurrentUser]
        User $user,
        GetImportStatusAction $getImportStatusAction,
    ): JsonResponse {
        $importJob = $getImportStatusAction->execute($user->family);

        if (!$importJob instanceof ImportJob) {
            return response()->json(['message' => 'No import jobs found'], 404);
        }

        return ImportJobResourceData::from($importJob)->toResponse();
    }
}
