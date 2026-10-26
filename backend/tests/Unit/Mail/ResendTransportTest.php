<?php

declare(strict_types = 1);

use Illuminate\Contracts\Mail\Factory;
use Illuminate\Mail\MailManager;
use Illuminate\Mail\Transport\ResendTransport;

covers(MailManager::class);

describe('Production Resend transport', function(): void {
    it('should resolve the configured transport without sending mail', function(): void {
        $this->app['config']->set('services.resend.key', 're_test_transport_resolution');

        $mailer = $this->app->make(Factory::class)->mailer('resend');

        expect($mailer->getSymfonyTransport())->toBeInstanceOf(ResendTransport::class);
    });
});
