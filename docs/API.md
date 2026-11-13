# Local API contract

Base URL: `http://<host>:4000/api`. Protected requests use `Authorization: Bearer <token>`. Successful responses use `{ "data": ... }`; errors use `{ "error": { "message": "..." } }`.

## Authentication and profile

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Exchange email/password for an 8-hour bearer token |
| POST | `/auth/register` | Create a local account; domain allowlist is not university verification |
| GET | `/me` | Current public profile |
| GET/PATCH | `/settings` | Read or update privacy and invitation preferences |

## Home, friends and invitations

| Method | Path | Purpose |
|---|---|---|
| GET | `/home` | Friends, pending invitations and recent participant walks |
| GET | `/students?q=` | Search local student accounts |
| GET | `/friends` | Accepted friends and incoming requests |
| POST | `/friends/requests` | Send a request with `{ "userId": "..." }` |
| POST | `/friends/requests/:id/accept` | Accept an incoming request |
| POST | `/friends/requests/:id/decline` | Decline an incoming request |
| DELETE | `/friends/:id` | Remove a friendship on both sides |
| GET | `/invitations` | Pending walk invitations for the current user |
| POST | `/invitations/:id/accept` | Accept and join an invited walk |
| POST | `/invitations/:id/decline` | Decline an invitation |

## Walks, chat and safety

| Method | Path | Purpose |
|---|---|---|
| GET | `/walks` | Walk history for sessions the user joined |
| GET | `/walks/active` | Current active walk, if any |
| POST | `/walks` | Create a walk with origin, destination, invite IDs and sharing preference |
| POST | `/walks/:id/invitations` | Invite another accepted friend |
| GET | `/walks/:id/invitations` | List pending invites for walk participants |
| PATCH | `/walks/:id/sharing` | Update the current participant's sharing preference |
| POST | `/walks/:id/leave` | Non-organizer leaves; server disables their sharing flag |
| POST | `/walks/:id/end` | Organizer ends the walk and disables participant sharing flags |
| GET/POST | `/walks/:id/messages` | Read or send participant chat messages |
| GET | `/notifications` | Recent notices |
| POST | `/notifications/read` | Mark one notice or all notices read |
| POST | `/reports` | Record a local report |
| POST | `/safety/sos` | Record an SOS event locally; returns `externalContactNotified: false` |
| POST | `/safety/check-in` | Record a local check-in |
| GET | `/safety/events` | Recent safety events for the current user |
| GET | `/safety/emergency-contacts` | Active contacts explicitly verified by an administrator |
| GET | `/safety/safe-spots?latitude=&longitude=` | Verified spots ordered by distance |
| POST | `/safety/reports` | Submit a private pending unsafe-place/route/area report |
| GET | `/safety/reports/mine` | Current user's submitted report history |
| POST | `/walks/:id/location` | Publish a coarse foreground fix after consent and membership checks |
| GET | `/walks/:id/locations` | Current unexpired opted-in participant pins |
| POST | `/walks/:id/arrived` | Start the automatic ten-minute sharing grace period |
| PATCH | `/profile/saved-start` | Store or clear the student's usual starting point |
| POST | `/profile/phone/request`, `/profile/phone/verify` | Verify a phone through the replaceable SMS provider (local OTP only in development) |
| POST | `/friends/contacts/match` | Match selected E.164 phone numbers against verified student accounts; numbers are not stored |
| GET | `/rides/transporters` | Verified currently available transporters |
| POST | `/rides` | Request a ride; no payment or live tracking |
| GET/PATCH | `/rides` and `/rides/:id/cancel` | Student's requests and cancellation of a pending request |

### Role-separated APIs

The mobile `/auth/login` rejects `admin` accounts. Student API routes require `student`. Transporter endpoints under `/transporter/*` require `transporter`, with verified approval required before availability or ride actions. The web portal authenticates only at `/admin/auth/login`; all other `/admin/*` endpoints require `admin`. Admin accounts are created locally with `npm --workspace backend run admin:create` and are never seeded.

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/auth/login` | Admin-only eight-hour portal session |
| GET | `/admin/overview`, `/admin/audit-log` | Dashboard totals and administrative history |
| GET/POST/PATCH | `/admin/unsafe-reports` | Review and approve/reject student reports |
| GET/POST/PATCH | `/admin/safe-spots` | Create pending spots and verify/manage them |
| GET/POST/PATCH/DELETE | `/admin/emergency-contacts` | Maintain verified emergency contacts |
| GET/POST/PATCH | `/admin/transporters` | Provision and verify transporter accounts |
| GET/PATCH | `/transporter/bookings`, `/transporter/availability` | Verified transporter request/accept workflow |

Socket.IO authenticates the same bearer token. A client must request `walk:join` for a room; the server checks current participant membership before joining. `walk:message` and `walk:updated` are emitted to the walk room, and `activity:changed` is emitted to the user's room. Persisted state remains available from REST after reconnecting.

Location updates use foreground permission only, are rounded to three decimal places before storage, and expire after 90 seconds. A participant can stop sharing at any time; location access remains limited to current walk members who have opted in.
