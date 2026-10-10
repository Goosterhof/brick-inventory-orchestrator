<?php

declare(strict_types = 1);

use App\Console\Commands\CreateAccountCommand;
use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

covers(CreateAccountCommand::class);

uses(RefreshDatabase::class);

describe('account:create command', function(): void {
    it('should create a user who heads a new family and can authenticate', function(): void {
        // act
        $exitCode = Artisan::call('account:create', [
            'email' => 'owner@example.com',
            'password' => 'secret-password',
            '--name' => 'The Owner',
            '--family' => 'The Bricks',
        ]);
        $output = Artisan::output();

        // assert
        $user = User::query()->where('email', 'owner@example.com')->sole();
        $family = Family::query()->findOrFail($user->family_id);

        expect($exitCode)->toBe(0)
            ->and($output)->toContain(\sprintf('Account created: user=%d family=%d', $user->id, $family->id))
            ->and($user->name)->toBe('The Owner')
            ->and(Hash::check('secret-password', $user->password))->toBeTrue()
            ->and($family->name)->toBe('The Bricks')
            ->and($family->head_id)->toBe($user->id);
    });

    it('should apply the default name and family name', function(): void {
        // act
        Artisan::call('account:create', ['email' => 'default@example.com', 'password' => 'secret-password']);

        // assert
        $user = User::query()->where('email', 'default@example.com')->sole();

        expect($user->name)->toBe('Owner')
            ->and($user->family->name)->toBe('Family');
    });

    describe('password off argv (WR-2123)', function(): void {
        /**
         * Runs the command non-interactively with $stdin as its input stream, as
         * `printf '%s\n' "$pw" | php artisan account:create <email>` would.
         *
         * @return array{0: int, 1: string}
         */
        $runWithStdin = function(string $email, string $stdin): array {
            $stream = fopen('php://memory', 'r+');
            fwrite($stream, $stdin);
            rewind($stream);

            $input = new ArrayInput(['email' => $email]);
            $input->setStream($stream);
            $input->setInteractive(false);

            $command = resolve(CreateAccountCommand::class);
            $command->setLaravel(app());

            $output = new BufferedOutput;

            return [$command->run($input, $output), $output->fetch()];
        };

        it('should read the password from piped stdin when no argument is given', function() use ($runWithStdin): void {
            // act
            [$exitCode] = $runWithStdin('piped@example.com', "piped secret\n");

            // assert
            $user = User::query()->where('email', 'piped@example.com')->sole();

            expect($exitCode)->toBe(0)
                ->and(Hash::check('piped secret', $user->password))->toBeTrue();
        });

        it('should refuse an empty password on stdin and create nothing', function() use ($runWithStdin): void {
            // act
            [$exitCode, $output] = $runWithStdin('empty@example.com', "\n");

            // assert
            expect($exitCode)->toBe(1)
                ->and($output)->toContain('Password must not be empty')
                ->and(User::query()->count())->toBe(0)
                ->and(Family::query()->count())->toBe(0);
        });

        it('should refuse an empty password argument and create nothing', function(): void {
            // act
            $exitCode = Artisan::call('account:create', ['email' => 'blank@example.com', 'password' => '']);

            // assert
            expect($exitCode)->toBe(1)
                ->and(Artisan::output())->toContain('Password must not be empty')
                ->and(User::query()->count())->toBe(0);
        });

        it('should ask for the password with a hidden prompt when interactive', function(): void {
            // act
            $this->artisan('account:create', ['email' => 'prompted@example.com'])
                ->expectsQuestion('Password', 'prompted secret')
                ->assertExitCode(0);

            // assert
            $user = User::query()->where('email', 'prompted@example.com')->sole();

            expect(Hash::check('prompted secret', $user->password))->toBeTrue();
        });

        it('should refuse an empty answer to the prompt and create nothing', function(): void {
            // act
            $this->artisan('account:create', ['email' => 'unanswered@example.com'])
                ->expectsQuestion('Password', null)
                ->expectsOutputToContain('Password must not be empty')
                ->assertExitCode(1);

            // assert
            expect(User::query()->count())->toBe(0);
        });
    });
});
