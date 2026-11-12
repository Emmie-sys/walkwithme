# Walk with Me

Walk with Me is a Gulu University student walking-coordination MVP. The repository contains separate iOS and Android React Native app shells, shared mobile features, and a Node.js API backed by SQLite for local development. The original browser prototype remains at the repository root (`index.html`, `styles.css`, `app.js`) as a behavior reference.

## Project layout

```text
apps/
  android/       Expo app configuration and Android entry point
  ios/           Expo app configuration and iOS entry point
shared/src/
  api/           Replaceable HTTP transport and endpoint adapter
  components/    Shared UI primitives and campus diagram
  data/          Illustrative campus landmarks
  screens/       Auth, home, walk, friends, activity, profile features
backend/src/
  db/            SQLite connection, ordered migrations and local seed data
  domain/        Campus landmarks and API serializers
  middleware/    Authentication boundary
  routes/        HTTP API
  services/      Walk/session rules
docs/            Architecture, API, privacy/safety, contributor guidance
```

## Local development

Requirements: Node.js 22 or newer. An iOS simulator/native build requires macOS with Xcode; Android native builds require Android Studio and an Android SDK. Expo Go can be used for early UI work where supported.

1. Install workspace dependencies from the repository root:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell). Change `JWT_SECRET` to a long random local secret. The app derives the API host from Expo's LAN manifest by default; set `EXPO_PUBLIC_API_URL` only when you need to override it (for example `http://localhost:4000/api` for an iOS simulator).

3. Start the API and seed fictional local accounts from the repository root:

   ```sh
   npm run dev:api
   ```

   The server applies migrations and seeds example data at startup. The SQLite database is stored at `backend/data/walkwithme.sqlite` by default. Set `DATABASE_PATH` to move it.

   The same `dev:api` command is available when your terminal is already inside `backend/`.

4. In another terminal, start the chosen platform:

   ```sh
   npm run start:android
   npm run start:ios
   ```

   These are separate Expo app shells which load the same feature code from `shared/`.
   Their start scripts cap Metro's Node heap at 1 GB to reduce memory pressure during development.

### Local account

`amina@demo.gu.ac.ug` / `Walk1234`

The seed includes fictional friends, a pending invitation to join Brian's walk, and a completed walk in the history. All seed accounts use the same development password. Do not use seed credentials or data outside local development. Demo sign-in can be disabled with `ALLOW_DEMO_LOGIN=false`.

## Product behavior in this build

- Account creation, sign-in, profile settings, friends, friend requests, invitations, walk records, participant membership, chat, alerts and safety-event records use the local API and SQLite.
- Passwords are hashed with bcrypt. Authenticated API routes use signed, expiring bearer tokens. Walk messages and walk records require participant membership; only an organizer can end a session.
- The campus map is a locally drawn diagram. It does not use geographic data, map-provider credentials or device location.
- Position-sharing controls save the user's preference only. This build does not request location permission, collect GPS, publish coordinates, or show real locations.
- Walk messages and session changes use authenticated Socket.IO events, with HTTP reads as the persisted source of truth and reconnection fallback. There is no push notification delivery yet.
- SOS and safety check-in actions create local records only. They do not contact a friend, campus security, police, ambulance or another emergency service.
- University email domain checking is not university identity verification. Do not treat a successful registration as proof of student status.

These limits are intentional while the university identity, precise/approximate location policy, background behavior, emergency recipient and escalation path remain to be agreed. See [Privacy and safety](docs/PRIVACY_SAFETY.md).

## Engineering notes

Feature screens call the shared API adapter, not fetch directly. Backend route handlers enforce authentication and delegate walk rules to the walk service. SQLite schema changes belong in a new numbered migration; do not edit an already applied migration. Each app shell can later add platform-specific permission and native configuration without duplicating feature screens.

More detail: [Architecture](docs/ARCHITECTURE.md), [API contract](docs/API.md), [Privacy and safety](docs/PRIVACY_SAFETY.md), and [Contributing](docs/CONTRIBUTING.md).
