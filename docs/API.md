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

Socket.IO authenticates the same bearer token. A client must request `walk:join` for a room; the server checks current participant membership before joining. `walk:message` and `walk:updated` are emitted to the walk room, and `activity:changed` is emitted to the user's room. Persisted state remains available from REST after reconnecting.

Walk location is intentionally absent from this contract. Add location endpoints only after access rules, consent lifecycle, precision, update cadence, offline behavior and retention have been agreed. Every location read must be authorized against current session membership.
