# Architecture and module boundaries

## Overview

The repository is a small monorepo with two mobile app configurations, one shared React Native feature package, and an independently deployable Node API. The iOS and Android entry files intentionally contain only app registration. Most product behavior lives in `shared/` so platform-specific changes do not fork the student experience.

```text
apps/ios ───────┐
                ├── shared/src/screens ── shared/src/api ── HTTP ── backend/src/routes
apps/android ───┘                                         backend/src/services
                                                                  │
                                                            SQLite migrations
```

## Mobile layers

- `screens/` owns user-facing flows and transient form state.
- `components/` holds reusable primitives and the illustrative campus map.
- `data/` contains static, non-geographic landmarks used by both the map and selectors.
- `api/` owns HTTP transport, bearer token attachment and named endpoint calls. Replace this adapter to use a different backend without rewriting screens.
- `realtime/` owns Socket.IO connection lifecycle, room subscription and event mapping. The transport delivers persisted chat and session changes; REST remains the source of truth.
- `providers/location/LocationProvider.ts` is the mobile location contract. Its default implementation reports location as unavailable and rejects collection requests.
- `theme.ts` centralizes color, spacing, radius and shadow tokens.
- `types.ts` records the shared API-facing models.
- `apps/ios` and `apps/android` hold app identifiers, platform config and their entry point. Add native integrations through config plugins or platform-specific source without moving shared feature rules into those shells.

## Backend layers

- `routes/api.js` maps HTTP requests to authentication, user, social, walk, activity and safety operations.
- `middleware/auth.js` verifies bearer tokens and reloads the user from the database for each protected request.
- `services/walks.js` owns walk validation, invitation rules, membership serialization and notifications associated with walk operations.
- `services/safety.js` delegates safety actions to a replaceable provider; the current provider records an event locally and does not dispatch it.
- `services/identity.js` delegates the development email-domain gate; replace it with university verification when that integration is approved.
- `domain/` owns stable concepts and serialization between SQLite rows and API objects.
- `db/migrations/` is the ordered source of truth for schema. Add new, forward-only migrations for schema changes.
- `db/seed.js` provides fictional local-development accounts and example activity. It must remain idempotent and must not be used as production data.

## Data model

`users` and `settings` store account/profile preferences. `friend_requests` tracks pending or resolved requests; accepted relationships are stored in both directions in `friendships`. `walks` are sessions, `walk_participants` records membership and each participant's sharing preference, and `invitations` tracks each invite lifecycle. `messages`, `notifications`, and `safety_events` are separate so their retention and delivery can evolve independently.

No location coordinate table exists yet. The `sharing_enabled` flag is consent state only; it must not be interpreted as proof that location is currently available or being sent.

## Replaceable integrations

Keep future integrations behind small adapters/services:

- `LocationProvider`: permission request, foreground/background availability, precision reduction, and location updates.
- `MapProvider`: real map rendering and campus landmark/geofence data.
- `NotificationProvider`: push delivery and delivery receipts.
- `IdentityProvider`: university student verification.
- `EmergencyProvider`: approved security/emergency routing and acknowledgement/escalation.
- `RealtimeProvider`: replacing polling with WebSocket or another realtime channel.

The API adapter and local SQLite setup make these seams explicit. Do not place provider SDK calls directly in screens or route handlers.

## Growth boundary

SQLite is for local development and modest single-server use. Keep SQL inside repositories/services and use migrations so production can move to a server database when concurrency, availability or operational needs require it. The current API is a single-process local MVP; it does not provide horizontal scaling, push delivery, queue processing, or a realtime broker.
