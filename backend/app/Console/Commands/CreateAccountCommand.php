<?php

declare(strict_types = 1);

namespace App\Console\Commands;

use App\Actions\Auth\CreateAccountAction;
use App\DataTransferObjects\Input\Auth\CreateAccountData;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use function sprintf;

/**
 * WR-2118: BIO has no HTTP registration. An account exists only if someone with a shell on
 * the host runs this command. Never schedule it.
 */
#[Description('Create a user and their family (operator-only; BIO has no public registration)')]
#[Signature('account:create {email} {password} {--name=Owner} {--family=Family}')]
final class CreateAccountCommand extends Command
{
    public function handle(CreateAccountAction $createAccountAction): int
    {
        $user = $createAccountAction->execute(new CreateAccountData(
            familyName: (string) $this->option('family'),
            name: (string) $this->option('name'),
            email: $this->argument('email'),
            password: $this->argument('password'),
        ));

        $this->info(sprintf('Account created: user=%d family=%d', $user->id, $user->family_id));

        return self::SUCCESS;
    }
}
