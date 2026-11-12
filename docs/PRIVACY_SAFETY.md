# Privacy and safety boundaries

Walk with Me handles location and emergency signaling as safety-critical capabilities. This MVP establishes consent and authorization seams but deliberately does not send coordinates or contact responders.

## Implemented now

- Registration and password sign-in use the local server. Passwords are bcrypt-hashed; bearer tokens expire after eight hours.
- Sharing is off by default. A participant's preference is recorded per walk and can be paused. Ending a walk disables participant sharing flags.
- Invitations are limited to accepted friends; the recipient can disable invitations.
- Walk and chat reads require joined participant membership. Only the organizer can end a walk.
- The UI and API explicitly report that SOS/check-in are local-only and contact nobody.
- The app does not request device location permissions or collect coordinates.

## Not implemented

- Student identity verification, email challenges, account recovery, production token refresh/revocation, encrypted local token storage, and abuse/rate limits.
- Real maps, GPS, geofencing, background location, location precision reduction, location retention/deletion, or participant location feeds.
- Push notifications, real-time sockets, security desk dispatch, responder acknowledgement, emergency number integration, or escalation.
- End-to-end encrypted messaging, moderation/report review workflow, or operational audit access controls.

## Decisions required before real location

1. Whether participant positions are exact, rounded to an approved area, or hidden entirely; what each role can see.
2. When updates begin/end, maximum session duration, background permission needs, and behavior when a phone loses network or battery.
3. Whether location is kept at all; if kept, retention, deletion, export and incident-response rules.
4. How a participant revokes sharing immediately and how every location read checks membership and consent server-side.
5. Who receives SOS, the approved university/emergency workflow, what acknowledgement means, and what the app says if delivery fails.

Until those decisions and a security/privacy review are complete, do not market the current build as a safety-monitoring or emergency-response service. The static map markers are illustrative only.

## Local development safeguards

Keep `.env`, database files and real student information out of source control. Set a unique strong `JWT_SECRET`; set `ALLOW_DEMO_LOGIN=false` outside local development. The included data and passwords are fictional fixtures. The local database has no location records; user and message retention is not yet automated.
