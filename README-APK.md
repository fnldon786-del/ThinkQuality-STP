# ThinkQuality — How to get the APK (No Android Studio)

## 1) Create GitHub Repo
1. Go to https://github.com → **New repository** → Name it `thinkquality-app` → Create.
2. On your computer or phone:
   - Download `thinkquality-app-v1.0.0-capacitor-ready.zip` (from ChatGPT).
   - Unzip it.
   - Upload all files into your new repo (drag & drop in GitHub's **Add file → Upload files**).

## 2) Start the APK build
1. In your GitHub repo, click the **Actions** tab (top).
2. Click **Build ThinkQuality APK** workflow.
3. Click **Run workflow** (green button) → Run.
   - Or just push a new commit; it runs automatically.

## 3) Download the APK
1. Wait for the workflow to finish (green check).
2. Click the latest run → scroll to **Artifacts** at the bottom.
3. Download **ThinkQuality-v1.0.0.zip** (contains the APK).
4. Inside, find `app-debug.apk` → rename to `ThinkQuality-v1.0.0.apk` (optional).

## 4) Install on Android
1. Send the APK to your phone (WhatsApp/Drive/Email).
2. Tap to install → allow **Install unknown apps** when prompted.
3. Open the app → test menus (Admin/Technician/Customer).

## Notes
- This project is a Next.js web app wrapped with Capacitor into an Android APK.
- For a Play Store release later, we’ll switch from **Debug** to **Release** and sign the build.
