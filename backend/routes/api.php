<?php

declare(strict_types = 1);

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\MeController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BrickIdentificationController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\FamilySetController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\InviteCodeController;
use App\Http\Controllers\SetController;
use App\Http\Controllers\StorageOptionController;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\StorageOption;
use Illuminate\Support\Facades\Route;

Route::get('/', fn() => response()->json([
    'message' => 'Welcome to the API',
]));

Route::get('/health', fn() => response()->json([
    'status' => 'ok',
    'timestamp' => now()->toIso8601String(),
]));

Route::post('/register', RegisterController::class)->middleware('throttle:auth');
Route::post('/login', LoginController::class)->middleware('throttle:auth');
Route::post('/logout', LogoutController::class)->middleware('auth:sanctum');
Route::get('/me', MeController::class)->middleware('auth:sanctum');

Route::get('/sets/{setNum}/parts', [SetController::class, 'parts'])
    ->where('setNum', '\d+-\d+')
    ->middleware(['auth:sanctum', 'throttle:rebrickable', 'etag', 'cache.headers:private;max_age=3600'])
    ->can('viewParts');

Route::get('/sets/ean/{ean}', [SetController::class, 'lookupByEan'])
    ->where('ean', '\d{8,14}')
    ->middleware(['auth:sanctum', 'throttle:rebrickable', 'etag', 'cache.headers:private;max_age=3600'])
    ->can('lookupByEan');

Route::get('/sets/{setNum}/storage-map', [SetController::class, 'storageMap'])
    ->where('setNum', '\d+-\d+')
    ->middleware(['auth:sanctum', 'throttle:rebrickable', 'etag', 'cache.headers:private;max_age=3600'])
    ->can('viewStorageMap');

Route::middleware(['auth:sanctum', 'family.ownership'])->group(function(): void {
    // Storage Options
    Route::get('/storage-options', [StorageOptionController::class, 'index'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewAny', StorageOption::class);
    Route::post('/storage-options', [StorageOptionController::class, 'store'])
        ->can('create', StorageOption::class);
    Route::get('/storage-options/{storage_option}', [StorageOptionController::class, 'show'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('view', 'storage_option');
    Route::put('/storage-options/{storage_option}', [StorageOptionController::class, 'update'])
        ->can('update', 'storage_option');
    Route::patch('/storage-options/{storage_option}', [StorageOptionController::class, 'update'])
        ->can('update', 'storage_option');
    Route::delete('/storage-options/{storage_option}', [StorageOptionController::class, 'destroy'])
        ->can('delete', 'storage_option');
    Route::get('/storage-options/{storage_option}/parts', [StorageOptionController::class, 'parts'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewParts', 'storage_option');
    Route::post('/storage-options/{storage_option}/parts', [StorageOptionController::class, 'assignPart'])
        ->can('assignPart', 'storage_option');
    Route::delete('/storage-options/{storage_option}/parts/{storage_option_part}', [StorageOptionController::class, 'removePart'])
        ->scopeBindings()
        ->can('delete', 'storage_option_part');

    // Family Sets
    Route::get('/family-sets', [FamilySetController::class, 'index'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewAny', FamilySet::class);
    Route::get('/family-sets/completion', [FamilySetController::class, 'completion'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewCompletion', FamilySet::class);
    Route::get('/family-sets/missing-parts', [FamilySetController::class, 'missingParts'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewMissingParts', FamilySet::class);
    Route::post('/family-sets/import-from-rebrickable', [FamilySetController::class, 'importFromRebrickable'])
        ->can('importFromRebrickable', FamilySet::class);
    Route::get('/family-sets/import-status', [FamilySetController::class, 'importStatus'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewImportStatus', FamilySet::class);
    Route::post('/family-sets', [FamilySetController::class, 'store'])
        ->can('create', FamilySet::class);
    Route::get('/family-sets/{family_set}', [FamilySetController::class, 'show'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('view', 'family_set');
    Route::put('/family-sets/{family_set}', [FamilySetController::class, 'update'])
        ->can('update', 'family_set');
    Route::patch('/family-sets/{family_set}', [FamilySetController::class, 'update'])
        ->can('update', 'family_set');
    Route::delete('/family-sets/{family_set}', [FamilySetController::class, 'destroy'])
        ->can('delete', 'family_set');

    // Family
    Route::get('/family/members', [FamilyController::class, 'members'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewMembers', Family::class);
    Route::get('/family/parts', [FamilyController::class, 'parts'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewParts', Family::class);
    Route::get('/family/parts/{partNum}/{colorId}/usage', [FamilyController::class, 'partUsage'])
        ->where('colorId', '\d+')
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewParts', Family::class);
    Route::get('/family/stats', [FamilyController::class, 'stats'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewStats', Family::class);
    Route::get('/family/brick-dna', [FamilyController::class, 'brickDna'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewBrickDna', Family::class);
    Route::put('/family/rebrickable-token', [FamilyController::class, 'setRebrickableToken'])
        ->can('setRebrickableToken', Family::class);
    Route::delete('/family/members/{user}', [FamilyController::class, 'removeMember'])
        ->can('removeMember', Family::class);

    // Invite Codes
    Route::post('/family/invite-code', [InviteCodeController::class, 'store'])
        ->can('generateInviteCode', Family::class);
    Route::post('/family/invite-code/email', [InviteCodeController::class, 'email'])
        ->middleware('throttle:invite-email')
        ->can('generateInviteCode', Family::class);
    Route::get('/family/invite-code', [InviteCodeController::class, 'show'])
        ->middleware(['etag', 'cache.headers:private;max_age=60'])
        ->can('viewInviteCode', Family::class);
    Route::delete('/family/invite-code', [InviteCodeController::class, 'destroy'])
        ->can('revokeInviteCode', Family::class);

    // Brick Identification
    Route::post('/identify-brick', [BrickIdentificationController::class, 'identify'])
        ->middleware('throttle:brick-identification')
        ->can('identify');

    // Feedback
    Route::post('/feedback', [FeedbackController::class, 'store'])
        ->middleware('throttle:feedback')
        ->can('submitFeedback', Family::class);
});
