<?php

declare(strict_types = 1);

namespace App\Console\Commands;

use const STDIN;

use App\Actions\Auth\CreateAccountAction;
use App\DataTransferObjects\Input\Auth\CreateAccountData;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Console\Input\StreamableInputInterface;

use function is_string;
use function sprintf;

/**
 * WR-2118: BIO has no HTTP registration. An account exists only if someone with a shell on
 * the host runs this command. Never schedule it.
 *
 * WR-2123: leave the password argument out to keep it off argv and out of shell history; it is
 * then read from a hidden prompt, or from stdin when the input is not interactive.
 */
#[Description('Create a user and their family (operator-only; BIO has no public registration)')]
#[Signature('account:create {email} {password? : Omit to read it from a hidden prompt, or from stdin with --no-interaction} {--name=Owner} {--family=Family}')]
final class CreateAccountCommand extends Command
{
    public function handle(CreateAccountAction $createAccountAction): int
    {
        $password = $this->resolvePassword();

        if ($password === null) {
            return self::FAILURE;
        }

        if ($password === '') {
            $this->error('Password must not be empty; no account was created.');

            return self::FAILURE;
        }

        $user = $createAccountAction->execute(new CreateAccountData(
            familyName: (string) $this->option('family'),
            name: (string) $this->option('name'),
            email: $this->argument('email'),
            password: $password,
        ));

        $this->info(sprintf('Account created: user=%d family=%d', $user->id, $user->family_id));

        return self::SUCCESS;
    }

    /**
     * Null means the password could not be read and the reason was already printed.
     */
    private function resolvePassword(): ?string
    {
        $argument = $this->argument('password');

        if (is_string($argument)) {
            return $argument;
        }

        if ($this->input->isInteractive()) {
            $answer = $this->secret('Password');

            return is_string($answer) ? $answer : '';
        }

        $stream = $this->input instanceof StreamableInputInterface ? $this->input->getStream() : null;
        $stream ??= STDIN;

        if (stream_isatty($stream)) {
            $this->error('No password given: pipe it on stdin, or run interactively to be prompted.');

            return null;
        }

        $contents = stream_get_contents($stream);

        return mb_rtrim($contents === false ? '' : $contents, "\r\n");
    }
}
