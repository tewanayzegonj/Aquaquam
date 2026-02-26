# How to Create an Android APK

This application is built as a Progressive Web App (PWA). You can convert it into a native Android APK using **PWABuilder**.

## Steps to Generate APK

1.  **Deploy the App**: Ensure your app is deployed to a public URL (e.g., Vercel, Netlify, Firebase).
2.  **Go to PWABuilder**: Visit [https://www.pwabuilder.com/](https://www.pwabuilder.com/).
3.  **Enter URL**: Paste your deployed app's URL into the input field and click "Start".
4.  **Review Audit**: PWABuilder will check your PWA manifest and service worker. Ensure you have a high score.
    *   *Note: We have already configured the manifest and service worker for you.*
5.  **Package for Android**:
    *   Click "Package for Stores".
    *   Select "Android".
    *   Fill in the details (Package ID, App Name, etc.).
    *   Click "Generate".
6.  **Download APK/AAB**: You will receive a zip file containing:
    *   `.apk` file (for direct installation on devices).
    *   `.aab` file (for uploading to the Google Play Store).
    *   Signing keys (keep these safe!).

## Testing on Android Device

1.  Transfer the `.apk` file to your Android phone.
2.  Open the file and tap "Install".
    *   *You may need to enable "Install from Unknown Sources" in your settings.*
3.  The app will install and appear in your app drawer like a native app.

## Features Enabled

*   **Offline Support**: Caches assets and pages for offline use.
*   **Installable**: Can be added to the home screen.
*   **Splash Screen**: Native-like launch experience.
*   **Theme Color**: Matches the system UI.
