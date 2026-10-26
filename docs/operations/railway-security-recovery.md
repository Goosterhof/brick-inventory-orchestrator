# Railway credential recovery

The web service (`lego-storage`) and queue worker (`unique-quietude`) share a database and Laravel application key. Rotate them together. The database URL references `Postgres.DATABASE_URL`; provider keys reference project shared variables.

## Encryption key

`families.rebrickable_user_token` uses Laravel's encrypted cast. Preserve a private backup, deploy the new APP_KEY with a temporary APP_PREVIOUS_KEYS bridge to both services, re-encrypt the stored value transactionally, verify plaintext preservation and old-key rejection, then remove the bridge and deploy both services again. Existing login sessions and remember-me credentials must be invalidated under explicit incident-response authorization. Never put credentials or record payloads in Git or logs.

A redeploy can reuse the previous deployment's environment snapshot. Verify the actual running environment and Laravel configuration; use a new source deployment when required. A successful deployment badge alone is insufficient.

## Worker and mail

The queue worker recycles after `--max-time=3600` with a successful exit. Railway must use `restartPolicyType = "ALWAYS"` so that this normal exit does not leave mail and imports unprocessed. The same policy also restarts the web service if it stops.

Resend requires both the `resend/resend-php` package and `services.resend.key` configuration. Supply a send-only RESEND_API_KEY in the shared variables, scoped to the sending domain. Resolve the real Laravel transport during validation without sending a test email. The default PHPUnit run includes the `Integration` suite for this configuration check; application coverage and mutation suites retain their existing application-class scope. Verify the replacement at the issuer and revoke the old credential there; replacing a Railway value alone does not revoke it.

## Security baseline

The production Dockerfile selects PHP 8.5.12 and Node 24.22.1. Compatible npm security updates and Happy DOM 21.0.4 address the advisories found on 26 October 2026. Happy DOM required a major test-dependency update for its security fix; application framework majors are unchanged. Keep dependency audits and runtime patch updates current.

The incident investigation's retained logs and rotation receipts are kept outside this repository. Public documentation must contain only sanitized evidence and limits, never private tokens, sessions, IP addresses or raw request bodies.
