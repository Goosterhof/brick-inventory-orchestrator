<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\DataTransferObjects\Input\Family\EmailInviteCodeData;
use App\Mail\InviteCodeMail;
use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Mail\Mailables\Address;

final readonly class EmailInviteCodeAction
{
    public function __construct(
        private GenerateInviteCodeAction $generateInviteCodeAction,
        private Mailer $mailer,
        #[Config('app.frontend_url')]
        private string $frontendUrl,
    ) {}

    public function execute(Family $family, User $user, EmailInviteCodeData $emailInviteCodeData): InviteCode
    {
        $inviteCode = $this->generateInviteCodeAction->execute($family, $user);

        $inviteCodeMail = new InviteCodeMail(
            code: $inviteCode->code,
            familyName: $family->name,
            recipientName: $emailInviteCodeData->recipientName,
            expiresAt: $inviteCode->expires_at !== null
                ? CarbonImmutable::instance($inviteCode->expires_at)
                : null,
            registerUrl: $this->buildRegisterUrl($inviteCode->code),
        );

        $recipient = $emailInviteCodeData->recipientName !== null
            ? new Address($emailInviteCodeData->recipientEmail, $emailInviteCodeData->recipientName)
            : $emailInviteCodeData->recipientEmail;

        $this->mailer->to($recipient)->send($inviteCodeMail);

        return $inviteCode;
    }

    private function buildRegisterUrl(string $code): string
    {
        return mb_rtrim($this->frontendUrl, '/') . '/register?invite=' . urlencode($code);
    }
}
