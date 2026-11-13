# Architecture and module boundaries

## Overview

The repository is a small monorepo with Android and iOS Expo apps, a shared React Native feature package, an independent React admin portal, and a Node API. Most student and transporter mobile behavior lives in `shared/` so platform-specific changes do not fork the experience.

```text
apps/ios ───────┐
                ├── shared/src/screens ── shared/src/api ── HTTP ── backend/src/routes
apps/android ───┘                                         backend/src/services
apps/admin ──── React/Vite ── /api/admin ────────────────────────┤
                                                                  ├── SQLite migrations
                                                                  └── Socket.IO
```

## Mobile layers

- `screens/` owns user-facing flows and transient form state.
- `components/` holds reusable primitives and native map rendering. Campus landmarks remain illustrative labels until geographic campus data is approved.
- `data/` contains static, non-geographic landmarks used by both the map and selectors.
- `api/` owns HTTP transport, bearer token attachment and named endpoint calls. Replace this adapter to use a different backend without rewriting screens.
- `realtime/` owns Socket.IO connection lifecycle, room subscription and event mapping. The transport delivers persisted chat and session changes; REST remains the source of truth.
- `providers/location/` defines a platform-neutral contract and an Expo foreground-location adapter. Feature screens call it only after explicit user action.
- `theme.ts` centralizes color, spacing, radius and shadow tokens.
- `types.ts` records the shared API-facing models.
- `apps/ios` and `apps/android` hold app identifiers, platform config and their entry point. Add native integrations through config plugins or platform-specific source without moving shared feature rules into those shells.

## Backend layers

- `routes/api.js` maps student operations. `/api/admin` and `/api/transporter` use separate routers and role guards.
- `middleware/auth.js` verifies bearer tokens and reloads the user from the database for each protected request.
- `services/walks.js` owns walk validation, invitation rules, membership serialization and notifications associated with walk operations.
- `services/safety.js` delegates safety actions to a replaceable provider; the current provider records an event locally and does not dispatch it.
- `services/location.js` validates active walk membership and opt-in, rounds fixes before persistence, expires pins and enforces arrival cleanup.
- `services/identity.js` delegates the development email-domain gate; replace it with university verification when that integration is approved.
- `domain/` owns stable concepts and serialization between SQLite rows and API objects.
- `db/migrations/` is the ordered source of truth for schema. Add new, forward-only migrations for schema changes.
- `db/seed.js` provides fictional local-development accounts and example activity. It must remain idempotent and must not be used as production data.

## Data model

`users` and `settings` store account/profile preferences. `users.role` separates students, transporters and admins. `friend_requests` tracks requests; accepted relationships are stored in both directions in `friendships`. Walks, participants and invitations track session membership and consent. `location_updates` contains only coarse expiring pins. Emergency contacts, safe spots, reports and rides use separate domain tables. `admin_audit_log` records administrative changes.

An opt-in flag is not proof that location is currently available or being sent. A current map pin exists only when a recent unexpired fix is present.

## Replaceable integrations

Keep future integrations behind small adapters/services:

- `LocationProvider`: Expo requests foreground permission and streams fixes; the server enforces consent, precision reduction, expiry and access rules.
- `MapProvider`: native map rendering is present; provider credentials, approved campus landmarks and safe-place records must be configured for deployment.
- `NotificationProvider`: push delivery and delivery receipts.
- `IdentityProvider`: university student verification.
- `EmergencyProvider`: approved security/emergency routing and acknowledgement/escalation.
- `RealtimeProvider`: replacing polling with WebSocket or another realtime channel.

The API adapter and local SQLite setup make these seams explicit. Do not place provider SDK calls directly in route handlers. Admin authentication uses the separate React web client and `/api/admin/auth/login`; mobile login rejects administrators. Admins are created with `npm --workspace backend run admin:create`, never by demo seed data.

## Growth boundary

SQLite is for local development and modest single-server use. Keep SQL inside repositories/services and use migrations so production can move to a server database when concurrency, availability or operational needs require it. The current API is a single-process local MVP; it does not provide horizontal scaling, push delivery, queue processing, or a realtime broker.
