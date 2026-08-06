# Holleman Command Center — Morning Brief

A premium, zero-build personal command center built around the **Mockup C** visual direction.

## Functional connections now included

### Live Morning Brief

A Vercel serverless endpoint loads current headlines for all eight briefing subjects:

- Law Enforcement & Public Safety
- Maryland News
- National Politics
- Markets & Economy
- Fitness & Health
- Technology & AI
- Tesla & EVs
- Firearms & 2A

The Home screen refreshes the brief automatically when it is older than 30 minutes. Manual refresh is also available.

### Published Apple Calendar feed

The Calendar page accepts a published Apple Calendar `webcal://` or `https://` subscription URL. It imports events as a read-only feed and combines them with locally created dashboard events.

Calendar feeds automatically refresh after 15 minutes. The feed URL and imported events are stored in browser `localStorage`.

## Home screen

The Home screen combines:

- Connection status
- Morning Brief
- Readiness
- Mission and Focus Mode
- Today’s schedule and priorities
- Health and recovery snapshot
- Career progress
- Nutrition and important dates
- Daily Metrics and quick actions

## Preserved modules

- Command
- Calendar
- Health and recovery
- Running
- Strength
- Nutrition
- Body composition
- Career
- Morning Brief editor
- Workout plans
- Data and settings

## Apple Calendar event export

The Calendar section also creates Apple-compatible `.ics` event files with a 15-minute reminder. On iPhone or iPad, open the downloaded file and choose **Add to Calendar**.

Published-feed import is read-only. Live two-way Apple Calendar editing requires a native or authenticated backend integration.

## Local data

Dashboard values, priorities, local events, briefing content, connections, and career information are stored in browser `localStorage`. JSON backup and restore are included.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Set **Framework Preset** to **Other**.
3. Leave **Build Command** blank.
4. Leave **Output Directory** blank.
5. Deploy.

Vercel serves `index.html` directly and deploys the files under `/api` as serverless functions. There is no npm installation, framework compilation, database, or paid dependency.

## Add to iPhone or iPad

Open the deployed URL in Safari, tap **Share**, and choose **Add to Home Screen**.

## Security

This static build does not provide server-side authentication. Keep sensitive or regulated information out of the app until the repository and deployment are private and a real authentication layer is added.
