# Walk with Me — iOS

iOS Expo shell for the shared React Native application. On macOS, run `npm run start:ios` from the repository root, or `npm start` from this folder. The LAN QR code opens the app in Expo Go. The API host is derived from Expo's development manifest unless `EXPO_PUBLIC_API_URL` is set in the root `.env`.

## Local test account

- Amina Akello: `amina@demo.gu.ac.ug` / `Walk1234`
- Other fictional test accounts use the same password; see the root [README](../../README.md#development-and-test-credentials).

These credentials work only with the local seeded API. They are not university accounts.
# iOS app

The iOS app is an Expo workspace. It requests foreground location only after a student explicitly enables sharing or chooses a location action. It does not request background location. iOS renders maps with the native Apple map provider; the university should still approve its map-data and privacy configuration before production use.
