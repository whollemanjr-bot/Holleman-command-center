# Holleman Personal Command Center V6

A premium, zero-build personal operations dashboard designed for fast use on desktop, iPhone, and iPad.

## V6 features

- Premium responsive command-center interface
- Today dashboard with readiness, priorities, health metrics, and career progress
- Persistent mission tracking and dashboard values using browser `localStorage`
- Apple Calendar support through downloadable `.ics` event files
- Local PIN access screen using a random salt and SHA-256 hash
- Configurable automatic inactivity locking
- Local JSON backup and restore
- Installable progressive web app metadata
- No npm, framework, database, or paid service required

## Apple Calendar

Create an event from the **Calendar** section or use one of the quick-schedule actions. The app downloads an Apple-compatible `.ics` file. On iPhone or iPad, open the file and select **Add to Calendar**.

This is one-way event export. Live two-way Apple Calendar synchronization requires a backend or native integration and is not included in the static version.

## Privacy and security

The PIN screen is intended as a simple local privacy barrier. The PIN is salted and hashed before it is stored, but this is still a static browser application. It does not provide server-side authentication and cannot protect a public repository or remotely stored data.

Before adding sensitive health, calendar, family, school, or career information:

1. Make the GitHub repository private.
2. Keep the Vercel deployment private or add real server-side authentication.
3. Do not store passwords, credentials, case information, protected law-enforcement information, medical records, or other regulated data in this version.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Set **Framework Preset** to **Other**.
3. Leave **Build Command** blank.
4. Leave **Output Directory** blank.
5. Deploy.

Vercel serves `index.html` directly.

## Add to iPhone or iPad

Open the deployed URL in Safari, tap **Share**, and select **Add to Home Screen**.

## Architecture

V6 intentionally remains zero-build. There is no `package.json`, dependency installation, compilation step, database, or external API requirement.
