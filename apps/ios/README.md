# Walk with Me — iOS

iOS Expo shell for the shared React Native application. On macOS, run `npm run start:ios` from the repository root, or `npm start` from this folder. The LAN QR code opens the app in Expo Go. The API host is derived from Expo's development manifest unless `EXPO_PUBLIC_API_URL` is set in the root `.env`.

## Local test account

- Amina Akello: `amina@demo.gu.ac.ug` / `Walk1234`
- Other fictional test accounts use the same password; see the root [README](../../README.md#development-and-test-credentials).

These credentials work only with the local seeded API. They are not university accounts.
# iOS app

The iOS app is an Expo workspace. It requests foreground location only after a student explicitly enables sharing or chooses a location action. It does not request background location. iOS renders maps with the native Apple map provider; the university should still approve its map-data and privacy configuration before production use.
# iOS installable builds

Run `npm run build:preview` from this workspace for an internal ad hoc build after configuring an HTTPS API URL in the EAS `preview` environment and registering the tester devices with the Apple Developer account. For broader tester distribution, build and submit to TestFlight with `npm run build:production` and `npm run submit:testflight` after setting the HTTPS API URL in the EAS `production` environment.

An iOS app cannot reach the development computer using `localhost`; use a controlled HTTPS tunnel for local backend testing. Full instructions and versioning notes are in [../../RELEASE_BUILDS.md](../../RELEASE_BUILDS.md).
