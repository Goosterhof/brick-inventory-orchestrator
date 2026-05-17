<?php

declare(strict_types = 1);

namespace App\Mail;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

use function sprintf;

/**
 * Invite-code email mailable.
 *
 * App\ leaf: receives primitives only via the constructor — no Model, DTO,
 * or other App\ imports. The Action is responsible for unpacking the
 * InviteCode model into primitives before passing them in. Keeps the
 * Mailable free of cascading rebuild cost when models change shape and
 * friendly to the queue serializer.
 *
 * SerializesModels is intentionally omitted — there's nothing to serialize-
 * by-id-and-rehydrate here; everything is a primitive that survives the
 * default PHP serializer cleanly.
 */
final class InviteCodeMail extends Mailable implements ShouldQueue
{
    public function __construct(
        public readonly string $code,
        public readonly string $familyName,
        public readonly ?string $recipientName,
        public readonly ?CarbonImmutable $expiresAt,
        public readonly string $registerUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf("You're invited to join %s on Brick Inventory", $this->familyName),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.invite-code',
            with: [
                'code' => $this->code,
                'familyName' => $this->familyName,
                'recipientName' => $this->recipientName,
                'expiresAt' => $this->expiresAt,
                'registerUrl' => $this->registerUrl,
            ],
        );
    }
}
