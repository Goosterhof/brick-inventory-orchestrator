@component('mail::message')
# Hi {{ $recipientName ?? 'there' }},

You've been invited to join **{{ $familyName }}** on Brick Inventory — the place where families track their LEGO collections together.

Use the invite code below when you register:

@component('mail::panel')
{{ $code }}
@endcomponent

@component('mail::button', ['url' => $registerUrl])
Accept invitation
@endcomponent

If the button above doesn't work, copy and paste this URL into your browser:

{{ $registerUrl }}

@if($expiresAt)
This invitation expires on {{ $expiresAt->toDayDateTimeString() }}.
@endif

Welcome aboard,<br>
{{ config('app.name') }}
@endcomponent
