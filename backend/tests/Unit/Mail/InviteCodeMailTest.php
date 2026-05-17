<?php

declare(strict_types = 1);

use App\Mail\InviteCodeMail;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;

covers(InviteCodeMail::class);

describe('InviteCodeMail', function(): void {
    it('should expose the configured subject in its envelope', function(): void {
        $mail = new InviteCodeMail(
            code: 'BRICK-AB12',
            familyName: 'The Bricksons',
            recipientName: 'Kid',
            expiresAt: null,
            registerUrl: 'https://app.example.com/register?invite=BRICK-AB12',
        );

        $envelope = $mail->envelope();

        expect($envelope->subject)->toBe("You're invited to join The Bricksons on Brick Inventory");
    });

    it('should render the markdown view path and pass primitives to the view', function(): void {
        $expiresAt = CarbonImmutable::create(2_026, 6, 1, 12, 0, 0);

        $mail = new InviteCodeMail(
            code: 'BRICK-CD34',
            familyName: 'The Bricksons',
            recipientName: 'Kid',
            expiresAt: $expiresAt,
            registerUrl: 'https://app.example.com/register?invite=BRICK-CD34',
        );

        $content = $mail->content();

        expect($content->markdown)->toBe('mail.invite-code')
            ->and($content->with)->toBe([
                'code' => 'BRICK-CD34',
                'familyName' => 'The Bricksons',
                'recipientName' => 'Kid',
                'expiresAt' => $expiresAt,
                'registerUrl' => 'https://app.example.com/register?invite=BRICK-CD34',
            ]);
    });

    it('should pass null expiresAt straight through to the view', function(): void {
        $mail = new InviteCodeMail(
            code: 'BRICK-EF56',
            familyName: 'The Bricksons',
            recipientName: null,
            expiresAt: null,
            registerUrl: 'https://app.example.com/register?invite=BRICK-EF56',
        );

        $content = $mail->content();

        expect($content->with)->toMatchArray([
            'recipientName' => null,
            'expiresAt' => null,
        ]);
    });

    it('should be a queueable mailable', function(): void {
        $mail = new InviteCodeMail(
            code: 'BRICK-GH78',
            familyName: 'The Bricksons',
            recipientName: null,
            expiresAt: null,
            registerUrl: 'https://app.example.com/register?invite=BRICK-GH78',
        );

        expect($mail)->toBeInstanceOf(ShouldQueue::class);
    });
});
