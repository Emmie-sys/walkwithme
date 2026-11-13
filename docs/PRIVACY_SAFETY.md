# Privacy and safety boundaries

Walk with Me handles location and emergency signaling as safety-critical capabilities. This MVP establishes consent and authorization seams but deliberately does not send coordinates or contact responders.

## Implemented now

- Registration and password sign-in use the local server. Passwords are bcrypt-hashed; bearer tokens expire after eight hours.
- Sharing is off by default. After a participant opts in, the mobile app requests foreground-only location access. Each persisted pin is rounded to three decimal places (roughly 100 m), expires after 90 seconds, and is deleted when sharing is paused, the participant leaves or the walk ends.
- Every location write checks active walk membership, joined status and the current sharing preference. Location reads require joined walk membership and return only unexpired pins from participants who still opted in.
- Marking arrival starts a ten-minute sharing grace period; a server cleanup task disables sharing and deletes fixes after the grace period. The mobile client does not request background location.
- Invitations are limited to accepted friends; the recipient can disable invitations.
- Walk and chat reads require joined participant membership. Only the organizer can end a walk.
- The SOS/check-in log remains local to the Walk with Me service and does not dispatch or notify emergency responders. Verified emergency contacts are displayed with a user-confirmed phone dialer action.
- Safety reports remain pending and private to the reporter until admin review. Approved reports can be distributed to the reporter's friends or campus users, based on the selected visibility.
- Verified safe spots and emergency contacts are administered through the separate role-protected web portal. No real campus contacts or safe places are seeded.
- Transport requests are request/accept workflows only. The mobile app does not process payments or perform continuous ride tracking.

## Not implemented

- University identity verification, account recovery, production token refresh/revocation, encrypted local token storage, and broader abuse/rate limits. Phone OTP currently has a local-only development adapter; the production SMS provider is not configured.
- University identity verification, student contact-phone OTP verification/contact discovery, account recovery, production token refresh/revocation, encrypted local token storage, and abuse/rate limits.
- Geofencing, background location, turn-by-turn routes, a university-approved map provider/key, or production tile-provider capacity/attribution review.
- Push notifications, security desk dispatch, responder acknowledgement, emergency-number routing, or escalation.
- End-to-end encrypted messaging or transport payments/live trip tracking.

## Decisions required before real location

1. Approve the approximately 100 m location precision and the 90-second fix expiry before enabling real student use.
2. Select the university's Android map key/provider and approve its terms, cost controls and data handling. iOS currently uses the platform map renderer.
3. Provide and verify emergency contacts, safe spots, and transporter records in the admin portal before publication.
4. Select and configure the university SMS provider before enabling production phone verification. Contact matching reads only after explicit permission and submits normalized selected phone numbers transiently; the server returns only matching verified student names/IDs and stores no address-book entries.
5. Define who receives SOS, the approved dispatch workflow, acknowledgement and failed-delivery behavior.

Until those decisions and a security/privacy review are complete, do not market the current build as a safety-monitoring or emergency-response service. The static map markers are illustrative only.

## Local development safeguards

Keep `.env`, database files and real student information out of source control. Set a unique strong `JWT_SECRET`; set `ALLOW_DEMO_LOGIN=false` outside local development. The included student data and passwords are fictional fixtures. The API stores only coarse location fixes while a consenting walk is active, and automatically deletes them on expiry/stop. Other user and message retention is not yet automated.
