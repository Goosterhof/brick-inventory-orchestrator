<?php

declare(strict_types = 1);

use App\Actions\Family\EmailInviteCodeAction;
use App\Actions\Family\GenerateInviteCodeAction;
use App\DataTransferObjects\Input\Family\EmailInviteCodeData;
use App\Mail\InviteCodeMail;
use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\PendingMail;

covers(EmailInviteCodeAction::class);

describe('EmailInviteCodeAction', function(): void {
    beforeEach(function(): void {
        $this->generateInviteCodeAction = \Mockery::mock(GenerateInviteCodeAction::class);
        $this->mailer = \Mockery::mock(Mailer::class);
    });

    it('should generate a fresh invite code and dispatch InviteCodeMail to the recipient', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);
        $family->allows('getAttribute')->with('name')->andReturn('The Bricksons');

        $user = \Mockery::mock(User::class);
        $user->allows('getAttribute')->with('id')->andReturn(1);

        $expiresAt = now()->addDays(7);
        $code = \Mockery::mock(InviteCode::class);
        $code->allows('getAttribute')->with('code')->andReturn('BRICK-AB12');
        $code->allows('getAttribute')->with('expires_at')->andReturn($expiresAt);

        $this->generateInviteCodeAction
            ->shouldReceive('execute')
            ->once()
            ->with($family, $user)
            ->andReturn($code);

        $pending = \Mockery::mock(PendingMail::class);
        $capturedMailable = null;
        $pending->shouldReceive('send')
            ->once()
            ->andReturnUsing(function(InviteCodeMail $inviteCodeMail) use (&$capturedMailable): void {
                $capturedMailable = $inviteCodeMail;
            });

        $capturedRecipient = null;
        $this->mailer->shouldReceive('to')
            ->once()
            ->andReturnUsing(function(mixed $recipient) use ($pending, &$capturedRecipient): PendingMail {
                $capturedRecipient = $recipient;

                return $pending;
            });

        $data = new EmailInviteCodeData(
            recipientEmail: 'kid@example.com',
            recipientName: 'Kid Brickson',
        );

        $action = new EmailInviteCodeAction(
            $this->generateInviteCodeAction,
            $this->mailer,
            'https://app.example.com',
        );

        // act
        $result = $action->execute($family, $user, $data);

        // assert
        expect($result)->toBe($code)
            ->and($capturedRecipient)->toBeInstanceOf(Address::class)
            ->and($capturedRecipient->address)->toBe('kid@example.com')
            ->and($capturedRecipient->name)->toBe('Kid Brickson')
            ->and($capturedMailable)->toBeInstanceOf(InviteCodeMail::class)
            ->and($capturedMailable->code)->toBe('BRICK-AB12')
            ->and($capturedMailable->familyName)->toBe('The Bricksons')
            ->and($capturedMailable->recipientName)->toBe('Kid Brickson')
            ->and($capturedMailable->expiresAt)->toBeInstanceOf(CarbonImmutable::class)
            ->and($capturedMailable->expiresAt->toDateTimeString())->toBe($expiresAt->toDateTimeString())
            ->and($capturedMailable->registerUrl)->toBe('https://app.example.com/register?invite=BRICK-AB12');
    });

    it('should pass the bare email when recipientName is null', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('name')->andReturn('The Bricksons');

        $user = \Mockery::mock(User::class);

        $code = \Mockery::mock(InviteCode::class);
        $code->allows('getAttribute')->with('code')->andReturn('BRICK-CD34');
        $code->allows('getAttribute')->with('expires_at')->andReturn(null);

        $this->generateInviteCodeAction
            ->shouldReceive('execute')
            ->once()
            ->andReturn($code);

        $pending = \Mockery::mock(PendingMail::class);
        $capturedMailable = null;
        $pending->shouldReceive('send')
            ->once()
            ->andReturnUsing(function(InviteCodeMail $inviteCodeMail) use (&$capturedMailable): void {
                $capturedMailable = $inviteCodeMail;
            });

        $capturedRecipient = null;
        $this->mailer->shouldReceive('to')
            ->once()
            ->andReturnUsing(function(mixed $recipient) use ($pending, &$capturedRecipient): PendingMail {
                $capturedRecipient = $recipient;

                return $pending;
            });

        $data = new EmailInviteCodeData(
            recipientEmail: 'kid@example.com',
            recipientName: null,
        );

        $action = new EmailInviteCodeAction(
            $this->generateInviteCodeAction,
            $this->mailer,
            'https://app.example.com',
        );

        // act
        $action->execute($family, $user, $data);

        // assert
        expect($capturedRecipient)->toBe('kid@example.com')
            ->and($capturedMailable->recipientName)->toBeNull()
            ->and($capturedMailable->expiresAt)->toBeNull();
    });

    it('should trim a trailing slash from the frontend URL when building the register URL', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('name')->andReturn('The Bricksons');

        $user = \Mockery::mock(User::class);

        $code = \Mockery::mock(InviteCode::class);
        $code->allows('getAttribute')->with('code')->andReturn('BRICK-EF56');
        $code->allows('getAttribute')->with('expires_at')->andReturn(null);

        $this->generateInviteCodeAction
            ->shouldReceive('execute')
            ->once()
            ->andReturn($code);

        $pending = \Mockery::mock(PendingMail::class);
        $capturedMailable = null;
        $pending->shouldReceive('send')
            ->once()
            ->andReturnUsing(function(InviteCodeMail $inviteCodeMail) use (&$capturedMailable): void {
                $capturedMailable = $inviteCodeMail;
            });

        $this->mailer->shouldReceive('to')
            ->once()
            ->andReturn($pending);

        $data = new EmailInviteCodeData(
            recipientEmail: 'kid@example.com',
            recipientName: null,
        );

        $action = new EmailInviteCodeAction(
            $this->generateInviteCodeAction,
            $this->mailer,
            'https://app.example.com/',
        );

        // act
        $action->execute($family, $user, $data);

        // assert
        expect($capturedMailable->registerUrl)->toBe('https://app.example.com/register?invite=BRICK-EF56');
    });

    it('should urlencode the invite code in the register URL', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('name')->andReturn('The Bricksons');

        $user = \Mockery::mock(User::class);

        // Hypothetical exotic code — guards against future generator changes
        // that could introduce reserved URL characters.
        $code = \Mockery::mock(InviteCode::class);
        $code->allows('getAttribute')->with('code')->andReturn('BRICK&Z=1');
        $code->allows('getAttribute')->with('expires_at')->andReturn(null);

        $this->generateInviteCodeAction
            ->shouldReceive('execute')
            ->once()
            ->andReturn($code);

        $pending = \Mockery::mock(PendingMail::class);
        $capturedMailable = null;
        $pending->shouldReceive('send')
            ->once()
            ->andReturnUsing(function(InviteCodeMail $inviteCodeMail) use (&$capturedMailable): void {
                $capturedMailable = $inviteCodeMail;
            });

        $this->mailer->shouldReceive('to')
            ->once()
            ->andReturn($pending);

        $data = new EmailInviteCodeData(
            recipientEmail: 'kid@example.com',
            recipientName: null,
        );

        $action = new EmailInviteCodeAction(
            $this->generateInviteCodeAction,
            $this->mailer,
            'https://app.example.com',
        );

        // act
        $action->execute($family, $user, $data);

        // assert
        expect($capturedMailable->registerUrl)->toBe('https://app.example.com/register?invite=BRICK%26Z%3D1');
    });

    it('should propagate an exception from the inner GenerateInviteCodeAction without dispatching mail', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);

        $user = \Mockery::mock(User::class);

        $this->generateInviteCodeAction
            ->shouldReceive('execute')
            ->once()
            ->andThrow(new \RuntimeException('generator down'));

        // mailer must NOT be called
        $this->mailer->shouldNotReceive('to');

        $data = new EmailInviteCodeData(
            recipientEmail: 'kid@example.com',
            recipientName: null,
        );

        $action = new EmailInviteCodeAction(
            $this->generateInviteCodeAction,
            $this->mailer,
            'https://app.example.com',
        );

        // act & assert
        expect(fn(): InviteCode => $action->execute($family, $user, $data))
            ->toThrow(\RuntimeException::class, 'generator down');
    });
});
