# Walk with Me — Android

Android Expo shell for the shared React Native application. From the repository root, run `npm run start:android`, or from this folder run `npm start`. The LAN QR code opens the app in Expo Go. The API host is derived from Expo's LAN manifest unless `EXPO_PUBLIC_API_URL` is set in the root `.env`.

Foreground location is requested only after a student explicitly enables it for an active walk or taps the location control. The app does not request background location. Custom Android builds require `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in the build environment; restrict the key to the Android application ID and Maps SDK for Android. The key is injected through `app.config.js` and should not be committed.

## Local test account

- Amina Akello: `amina@demo.gu.ac.ug` / `Walk1234`
- Other fictional test accounts use the same password; see the root [README](../../README.md#development-and-test-credentials).

These credentials work only with the local seeded API. They are not university accounts.
