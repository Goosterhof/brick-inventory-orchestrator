<?php

declare(strict_types = 1);

use App\Contracts\BelongsToFamilyInterface;
use App\Http\Middleware\EnsureFamilyOwnership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Symfony\Component\HttpFoundation\Response;

covers(EnsureFamilyOwnership::class);

describe('EnsureFamilyOwnership', function(): void {
    it('should return 401 when user is not authenticated', function(): void {
        // arrange
        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn(null);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(401);
        expect($response->getContent())->toContain('Unauthenticated');
    });

    it('should continue when no route parameters exist', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);

        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn($user);
        $request->shouldReceive('route')->andReturn(null);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(200);
        expect($response->getContent())->toBe('OK');
    });

    it('should continue when route parameter does not implement BelongsToFamily', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);

        $route = \Mockery::mock(Route::class);
        $route->shouldReceive('parameters')->andReturn(['id' => 123]);

        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn($user);
        $request->shouldReceive('route')->andReturn($route);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(200);
        expect($response->getContent())->toBe('OK');
    });

    it('should continue when model family_id matches user family_id', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('family_id')->andReturn(1);

        $model = \Mockery::mock(BelongsToFamilyInterface::class);
        $model->shouldReceive('getFamilyId')->andReturn(1);

        $route = \Mockery::mock(Route::class);
        $route->shouldReceive('parameters')->andReturn(['model' => $model]);

        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn($user);
        $request->shouldReceive('route')->andReturn($route);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(200);
        expect($response->getContent())->toBe('OK');
    });

    it('should return 404 when model family_id does not match user family_id', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('family_id')->andReturn(1);

        $model = \Mockery::mock(BelongsToFamilyInterface::class);
        $model->shouldReceive('getFamilyId')->andReturn(2);

        $route = \Mockery::mock(Route::class);
        $route->shouldReceive('parameters')->andReturn(['model' => $model]);

        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn($user);
        $request->shouldReceive('route')->andReturn($route);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(404);
        expect($response->getContent())->toContain('Not found');
    });

    it('should return 404 when any model in multiple parameters does not match', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('family_id')->andReturn(1);

        $model1 = \Mockery::mock(BelongsToFamilyInterface::class);
        $model1->shouldReceive('getFamilyId')->andReturn(1);

        $model2 = \Mockery::mock(BelongsToFamilyInterface::class);
        $model2->shouldReceive('getFamilyId')->andReturn(2);

        $route = \Mockery::mock(Route::class);
        $route->shouldReceive('parameters')->andReturn([
            'model1' => $model1,
            'model2' => $model2,
        ]);

        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn($user);
        $request->shouldReceive('route')->andReturn($route);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(404);
        expect($response->getContent())->toContain('Not found');
    });

    it('should continue when all models in multiple parameters match', function(): void {
        // arrange
        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('family_id')->andReturn(1);

        $model1 = \Mockery::mock(BelongsToFamilyInterface::class);
        $model1->shouldReceive('getFamilyId')->andReturn(1);

        $model2 = \Mockery::mock(BelongsToFamilyInterface::class);
        $model2->shouldReceive('getFamilyId')->andReturn(1);

        $route = \Mockery::mock(Route::class);
        $route->shouldReceive('parameters')->andReturn([
            'model1' => $model1,
            'model2' => $model2,
        ]);

        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('user')->andReturn($user);
        $request->shouldReceive('route')->andReturn($route);

        $middleware = new EnsureFamilyOwnership;
        $next = fn(): Response => new Response('OK');

        // act
        $response = $middleware->handle($request, $next);

        // assert
        expect($response->getStatusCode())->toBe(200);
        expect($response->getContent())->toBe('OK');
    });
});
