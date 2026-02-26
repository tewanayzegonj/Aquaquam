# How to Build an Android App (APK)

This application is a **Progressive Web App (PWA)**. It is designed to be installed directly on Android devices without needing the Play Store, but you can also package it as a standard Android App (APK/AAB) for the Play Store.

## Option 1: Direct Install (Easiest)

1.  Open the app in **Chrome** on your Android device.
2.  Tap the **"Install"** button in the app header (if available).
3.  OR tap the browser menu (three dots) -> **"Add to Home screen"** or **"Install app"**.
4.  The app will appear in your app drawer and run like a native Android app.

## Option 2: Generate an APK using PWABuilder

To create a real `.apk` file that you can share or upload to the Play Store:

1.  **Deploy your app** to a public URL (e.g., Vercel, Netlify, or Firebase Hosting).
    *   *Note: The current preview URL might change, so a permanent deployment is recommended.*
2.  Go to **[PWABuilder.com](https://www.pwabuilder.com/)**.
3.  Enter your deployed app's URL.
4.  Click **Start**.
5.  Once analyzed, click **Package for Stores**.
6.  Select **Android**.
7.  Follow the steps to generate your APK/AAB file.

## Option 3: Bubblewrap (CLI Tool)

For developers who want more control:

1.  Install Bubblewrap:
    ```bash
    npm install -g @bubblewrap/cli
    ```
2.  Initialize the project:
    ```bash
    bubblewrap init --manifest=https://your-app-url.com/manifest.webmanifest
    ```
3.  Build the APK:
    ```bash
    bubblewrap build
    ```

## Features Enabled

*   **Offline Support**: The app caches resources to work offline.
*   **Standalone Mode**: Runs without the browser UI (URL bar, etc.).
*   **Theme Color**: Matches the app's warm amber/rose palette.
*   **Icon**: Uses the app's icon for the home screen.
