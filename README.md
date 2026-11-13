# Walk with Me

Walk with Me is a Gulu University student walking-coordination MVP. The repository contains separate iOS and Android React Native app shells, shared mobile features, and a Node.js API backed by SQLite for local development. The original browser prototype remains at the repository root (`index.html`, `styles.css`, `app.js`) as a behavior reference.

## Project layout

```text
apps/
  android/       Expo app configuration and Android entry point
  ios/           Expo app configuration and iOS entry point
  admin/         Separate React administrator portal
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

5. For the administrator portal, create an administrator account and start the web app:

   ```sh
   npm --workspace backend run admin:create
   npm run dev:admin
   ```

   Visit `http://localhost:5174`. Admin accounts are provisioned by the CLI and can sign in only to the web portal. Student registration always creates student accounts, and the mobile API rejects administrator-role accounts. The admin setup is documented in [apps/admin/README.md](apps/admin/README.md).

### Development and test credentials

| Name | Email | Password |
|---|---|---|
| Amina Akello | `amina@demo.gu.ac.ug` | `Walk1234` |
| Brian Okello | `brian@demo.gu.ac.ug` | `Walk1234` |
| Grace Atim | `grace@demo.gu.ac.ug` | `Walk1234` |
| Peter Ocen | `peter@demo.gu.ac.ug` | `Walk1234` |
| Sarah Lamunu | `sarah@demo.gu.ac.ug` | `Walk1234` |
| Joan Adong | `joan@demo.gu.ac.ug` | `Walk1234` |
| emmie@gmail.com | `emmie@gmail.com` | `Adminemmie@walkwithme` |

These are fictional local fixtures; the seed includes friends, an invitation to join Brian's walk, and walk history. Do not use seed accounts or data outside development. Demo sign-in can be disabled with `ALLOW_DEMO_LOGIN=false`.

The photo headers use locally bundled Unsplash images: [Campus walkway by djun1215](https://unsplash.com/photos/campus-walkway-with-modern-buildings-ZdG4pA47lnk) and [Students walking by Azalea](https://unsplash.com/photos/three-students-walk-down-a-path-towards-a-building-1r5SpkUYqPY). The images are included in the app bundle and display without a network connection.

## Product behavior in this build

- Account creation, sign-in, profile settings, friends, friend requests, invitations, walk records, participant membership, chat, alerts and safety-event records use the local API and SQLite.
- Passwords are hashed with bcrypt. Authenticated API routes use signed, expiring bearer tokens. Walk messages and walk records require participant membership; only an organizer can end a session.
- Walk maps show only opted-in, approximate, short-lived location pins. The map is centered on a provisional Gulu reference point; no university route geometry or approved safe-spot inventory is bundled.
- The mobile interface follows the device light/dark appearance, including status-bar contrast; its tab bar uses safe-area insets so it clears the active system navigation area. Account actions are grouped in a full-page overflow menu, with unread category badges for walks, friends and activity. Authentication forms adapt to the software keyboard and provide password visibility controls. Home and authentication headers use locally bundled, attributed Unsplash photography.
- Emergency contacts and verified safe spots are managed in the web admin portal. No university contact directory or campus spot inventory is seeded, so these areas must be configured from verified university records before operational use.
- Safety reports are private to the reporter while pending. Admin review is required before an approved report can be published to friends or campus users.
- Ride requests target verified available transporters; students request and cancel, while verified transporters can accept, decline or complete requests in their mobile transporter area. There are no payments or live ride tracking.
- Friend discovery supports account search and opt-in contact matching after a student's own phone is verified. Local OTP codes are for development only; production SMS needs a university-approved provider.
- Walk messages and session changes use authenticated Socket.IO events, with HTTP reads as the persisted source of truth and reconnection fallback. There is no push notification delivery yet.
- SOS and safety check-in actions create local records only. They do not contact a friend, campus security, police, ambulance or another emergency service.
- University email domain checking is not university identity verification. Do not treat a successful registration as proof of student status.

Foreground location is consent-gated and rounded before persistence; precise GPS is never stored by the API. Sharing fixes expire after 90 seconds and are deleted when sharing stops. See [Privacy and safety](docs/PRIVACY_SAFETY.md) for remaining operational configuration requirements.

## Engineering notes

Feature screens call the shared API adapter, not fetch directly. Backend route handlers enforce authentication and delegate walk rules to the walk service. SQLite schema changes belong in a new numbered migration; do not edit an already applied migration. Each app shell can later add platform-specific permission and native configuration without duplicating feature screens.

More detail: [Architecture](docs/ARCHITECTURE.md), [API contract](docs/API.md), [Privacy and safety](docs/PRIVACY_SAFETY.md), and [Contributing](docs/CONTRIBUTING.md).
