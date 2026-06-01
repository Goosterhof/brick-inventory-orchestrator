<?php

declare(strict_types = 1);

use Rector\Config\RectorConfig;
use Rector\DeadCode\Rector\ClassMethod\RemoveUnusedPublicMethodParameterRector;
use Rector\Naming\Rector\Assign\RenameVariableToMatchMethodCallReturnTypeRector;
use Rector\Naming\Rector\Class_\RenamePropertyToMatchTypeRector;
use Rector\Naming\Rector\ClassMethod\RenameParamToMatchTypeRector;
use Rector\Naming\Rector\ClassMethod\RenameVariableToMatchNewTypeRector;
use Rector\Php74\Rector\Closure\ClosureToArrowFunctionRector;
use Rector\Php83\Rector\ClassMethod\AddOverrideAttributeToOverriddenMethodsRector;
use RectorLaravel\Rector\FuncCall\RemoveDumpDataDeadCodeRector;
use RectorLaravel\Rector\MethodCall\WhereToWhereLikeRector;
use RectorLaravel\Rector\StaticCall\CarbonToDateFacadeRector;
use RectorLaravel\Rector\StaticCall\RouteActionCallableRector;
use RectorLaravel\Set\LaravelLevelSetList;
use RectorLaravel\Set\LaravelSetList;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/app',
        __DIR__ . '/bootstrap',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/public',
        __DIR__ . '/routes',
        __DIR__ . '/tests',
    ])
    ->withSkip([
        __DIR__ . '/bootstrap/cache',
        __DIR__ . '/storage',
        __DIR__ . '/vendor',
        // The Octane worker bootstrap runs BEFORE the Laravel autoloader, so
        // Rector rules that swap `$_ENV` / `$_SERVER` accesses for facades or
        // helpers must not be applied here — those references would resolve
        // to undefined symbols at boot and crash the FrankenPHP worker.
        __DIR__ . '/public/frankenphp-worker.php',
        CarbonToDateFacadeRector::class,
        AddOverrideAttributeToOverriddenMethodsRector::class,
        RenameParamToMatchTypeRector::class,
        RenamePropertyToMatchTypeRector::class,
        RenameVariableToMatchMethodCallReturnTypeRector::class => [
            __DIR__ . '/tests',
        ],
        RenameVariableToMatchNewTypeRector::class => [
            __DIR__ . '/tests',
        ],
        // Transaction closures in Actions must use full closures (arch test enforced)
        ClosureToArrowFunctionRector::class => [
            __DIR__ . '/app/Actions',
        ],
        // Laravel requires (User $user, Model $model) signature in Policies
        RemoveUnusedPublicMethodParameterRector::class => [
            __DIR__ . '/app/Policies',
        ],
    ])
    ->withPhpSets(php84: true)
    ->withPreparedSets(
        deadCode: true,
        codeQuality: true,
        codingStyle: true,
        earlyReturn: true,
        typeDeclarations: true,
        privatization: true,
        instanceOf: true,
        naming: true,
    )
    ->withSets([
        LaravelLevelSetList::UP_TO_LARAVEL_120,
        LaravelSetList::LARAVEL_CODE_QUALITY,
        LaravelSetList::LARAVEL_COLLECTION,
        LaravelSetList::LARAVEL_TESTING,
        LaravelSetList::LARAVEL_TYPE_DECLARATIONS,
        LaravelSetList::LARAVEL_ARRAYACCESS_TO_METHOD_CALL,
        LaravelSetList::LARAVEL_ARRAY_STR_FUNCTION_TO_STATIC_CALL,
        LaravelSetList::LARAVEL_CONTAINER_STRING_TO_FULLY_QUALIFIED_NAME,
        LaravelSetList::LARAVEL_ELOQUENT_MAGIC_METHOD_TO_QUERY_BUILDER,
        LaravelSetList::LARAVEL_FACADE_ALIASES_TO_FULL_NAMES,
        LaravelSetList::LARAVEL_FACTORIES,
    ])
    ->withConfiguredRule(RemoveDumpDataDeadCodeRector::class, ['dd', 'dump'])
    ->withConfiguredRule(RouteActionCallableRector::class, [
        RouteActionCallableRector::NAMESPACE => 'App\Http\Controllers',
    ])
    ->withConfiguredRule(WhereToWhereLikeRector::class, [
        WhereToWhereLikeRector::USING_POSTGRES_DRIVER => true,
    ])
    ->withImportNames(
        importNames: true,
        importDocBlockNames: true,
        importShortClasses: false,
        removeUnusedImports: true,
    )
    ->withCache(__DIR__ . '/storage/rector');
