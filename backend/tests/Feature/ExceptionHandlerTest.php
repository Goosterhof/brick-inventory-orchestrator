<?php

declare(strict_types = 1);

use App\Exceptions\InvalidApiResponseException;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

covers(InvalidApiResponseException::class);

uses(RefreshDatabase::class);

describe('ExceptionHandler', function(): void {
    describe('InvalidApiResponseException', function(): void {
        it('should return 502 with error message when external API returns malformed response', function(): void {
            // arrange
            $user = User::factory()->create();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response([
                    'unexpected_key' => 'no items field',
                ]),
            ]);

            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $response = $this->actingAs($user)->postJson('/api/identify-brick', [
                'image' => $image,
            ]);

            // assert
            $response->assertStatus(502)
                ->assertJsonPath('error', 'Unexpected response from external API');
        });

        it('should return 502 when external API returns non-array response', function(): void {
            // arrange
            $user = User::factory()->create();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response('not json', 200),
            ]);

            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $response = $this->actingAs($user)->postJson('/api/identify-brick', [
                'image' => $image,
            ]);

            // assert
            $response->assertStatus(502)
                ->assertJsonPath('error', 'Unexpected response from external API');
        });
    });
});
