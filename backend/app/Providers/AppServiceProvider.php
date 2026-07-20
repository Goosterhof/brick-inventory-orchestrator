<?php

declare(strict_types = 1);

namespace App\Providers;

use App\Actions\Family\GenerateInviteCodeAction;
use App\Contracts\BrickIdentificationServiceInterface;
use App\Contracts\LegoDataServiceInterface;
use App\Policies\BrickIdentificationPolicy;
use App\Policies\SetPolicy;
use App\Services\BrickognizeService;
use App\Services\RebrickableService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(LegoDataServiceInterface::class, RebrickableService::class);
        $this->app->bind(BrickIdentificationServiceInterface::class, BrickognizeService::class);
        $this->app->bind(StatefulGuard::class, fn(mixed $app) => Auth::guard('web'));

        $this->app->when(GenerateInviteCodeAction::class)
            ->needs('$ttlDays')
            ->giveConfig('app.invite_code_ttl_days');
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('identify', [BrickIdentificationPolicy::class, 'identify']);
        Gate::define('viewParts', [SetPolicy::class, 'viewParts']);
        Gate::define('lookupByEan', [SetPolicy::class, 'lookupByEan']);
        Gate::define('viewStorageMap', [SetPolicy::class, 'viewStorageMap']);

        $enabled = !app()->environment('testing');

        RateLimiter::for(
            'auth',
            fn(): Limit => $enabled
            ? Limit::perMinute(5)
            : Limit::none(),
        );

        RateLimiter::for(
            'brick-identification',
            fn(): Limit => $enabled
            ? Limit::perMinute(10)
            : Limit::none(),
        );

        RateLimiter::for(
            'rebrickable',
            fn(Request $request): Limit => $enabled
            ? Limit::perMinute(30)->by((string) ($request->user()->id ?? $request->ip()))
            : Limit::none(),
        );

        RateLimiter::for(
            'invite-email',
            fn(Request $request): Limit => $enabled
            ? Limit::perHour(10)->by((string) ($request->user()->id ?? $request->ip()))
            : Limit::none(),
        );

        RateLimiter::for(
            'feedback',
            fn(Request $request): Limit => $enabled
            ? Limit::perHour(5)->by((string) ($request->user()->id ?? $request->ip()))
            : Limit::none(),
        );

        // Keyed by family, not user: the protected resource is the family's Rebrickable
        // token and upstream quota, and the endpoint's own concurrency invariant is already
        // family-scoped (the import_jobs_family_active_unique partial index is on family_id).
        // Per-user keying would let an n-member family drive n x the real upstream load.
        //
        // The limit must stay above 3/hour. A stranded import becomes reclaimable after
        // app.import_stale_active_job_threshold (1200s, BIO-0029), so a worker-down retry
        // cadence tops out at 3600/1200 = 3 attempts per hour; a tighter limit would 429 a
        // legitimate reclamation retry and undo that fix.
        RateLimiter::for(
            'rebrickable-import',
            fn(Request $request): Limit => $enabled
            ? Limit::perHour(5)->by((string) ($request->user()->family_id ?? $request->ip()))
            : Limit::none(),
        );
    }
}
