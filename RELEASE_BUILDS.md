# Build and share Walk with Me

Follow these steps to create an Android APK. The guide assumes the backend is running on your computer and the test phone is connected to the same Wi-Fi.

## Android: create an installable APK

### 1. Install the tools

- Install Node.js and npm.
- Create or sign in to an Expo account at [expo.dev](https://expo.dev/).
- Get a Google Maps SDK key for Android. Restrict it to the Android app (`ug.ac.gu.walkwithme`) and Maps SDK for Android.

### 2. Start the backend

Open PowerShell in the project folder and run:

```powershell
cd H:\walkwithme
npm run dev:api
```

Leave this window open while using the app. The backend must accept connections from the local network, and Windows Firewall must allow its API port on a Private network.

### 3. Find your computer's Wi-Fi address

Open a second PowerShell window and run:

```powershell
ipconfig
```

Under the active Wi-Fi adapter, find **IPv4 Address** (for example, `192.168.1.25`). Use your actual address in the next step. Do not use `localhost`: on a phone, `localhost` means the phone itself.

### 4. Set the preview connection and Maps key

In PowerShell, go to the Android app and sign in to EAS:

```powershell
cd H:\walkwithme\apps\android
npx --yes eas-cli@27.9.0 login
```

Connect this app folder to an EAS project when prompted:

```powershell
npx --yes eas-cli@27.9.0 init
```

Add the API address. Replace `192.168.1.25` with your computer's IPv4 address:

```powershell
npx --yes eas-cli@27.9.0 env:create --environment preview --name EXPO_PUBLIC_API_URL --value http://192.168.1.25:4000/api --visibility plaintext
```

Add your Android Maps key (replace the example value):

```powershell
npx --yes eas-cli@27.9.0 env:create --environment preview --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value YOUR_ANDROID_MAPS_SDK_KEY --visibility sensitive
```

These values are saved in Expo for the preview build. The API address is included in the app, so it is not a secret. The Maps key is also present in the installed app; restricting it in Google Cloud is important.

### 5. Build the APK

Still in `H:\walkwithme\apps\android`, run:

```powershell
npm run build:preview
```

The first build may take several minutes. If EAS asks to create Android signing credentials, allow it to create and manage them. When the build finishes, EAS prints a build page and APK download link.

### 6. Install and share

Download the APK from the EAS link. Send the APK to the tester, then open it on the Android phone and allow installation from that source if Android asks. The phone must be on the same Wi-Fi as the computer. Keep the backend running. If the computer's IPv4 address changes, update `EXPO_PUBLIC_API_URL` and build a new APK.

## Android production release

Do this only after the API is hosted at a public HTTPS address. Repeat step 4 using the `production` environment instead of `preview`, then build from `H:\walkwithme\apps\android`:

```powershell
npx --yes eas-cli@27.9.0 env:create --environment production --name EXPO_PUBLIC_API_URL --value https://YOUR_API_HOST/api --visibility plaintext
npx --yes eas-cli@27.9.0 env:create --environment production --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value YOUR_ANDROID_MAPS_SDK_KEY --visibility sensitive
npm run build:production
```

The production profile creates a store bundle (AAB), not a directly installable APK. Use the preview profile when you need an APK file to install and share. Build setup follows Expo's [APK guide](https://docs.expo.dev/build-reference/apk/).

## iOS builds

iOS cannot use the local HTTP address in this setup. First make the API available through a controlled HTTPS tunnel or deploy it to an HTTPS host, then configure `EXPO_PUBLIC_API_URL` in the iOS EAS `preview` environment.

For a limited internal install, register each tester's iPhone UDID with the Apple Developer account. Then open PowerShell in `H:\walkwithme\apps\ios`, run `npx --yes eas-cli@27.9.0 login`, `npx --yes eas-cli@27.9.0 init`, and `npm run build:preview`. EAS will provide an install link for registered devices. For TestFlight, configure the iOS `production` API URL, run `npm run build:production`, then `npm run submit:testflight`. TestFlight requires an Apple Developer Program membership and App Store Connect setup. See Expo's [internal distribution guide](https://docs.expo.dev/build/internal-distribution/) and [TestFlight guide](https://docs.expo.dev/submit/testflight/).

## Version updates

Before a release, update the version in `app-version.json` (for example, `0.2.0`). EAS automatically increments Android and iOS build numbers. Keep generated APK, AAB, and IPA files out of Git. For production releases, commit and review the code before starting the build.
