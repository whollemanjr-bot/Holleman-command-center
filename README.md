# Holleman Performance Command Center V5 — Zero-Build Edition

This version is intentionally static: no npm, no framework compilation, and no build command.

## Deploy to Vercel
1. Create a new GitHub repository.
2. Upload `index.html`, `manifest.webmanifest`, and `vercel.json` to the repository root.
3. Import the repository into Vercel.
4. Set **Framework Preset** to **Other**.
5. Leave **Build Command** blank.
6. Leave **Output Directory** blank.
7. Deploy.

Vercel will serve `index.html` directly.

## Add to iPhone
Open the Vercel URL in Safari → Share → Add to Home Screen.

## Why this version will not repeat the npm build failure
There is no `package.json` and no npm build step.
