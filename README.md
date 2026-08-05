# Holleman Command Center — Intelligence Brief

A premium, zero-build personal command center based on the **Mockup C — Intelligence Brief** direction.

## Design direction

The home screen is an information-first command dashboard with:

- Daily intelligence brief and readiness score
- Today’s agenda
- Heart, recovery, and sleep snapshot
- Career pipeline
- Important deadlines
- Nutrition and hydration summary
- Health snapshot
- Training-load visualization
- Quick actions and system status

## Preserved performance modules

This rebuild is additive rather than reductive. It keeps the original performance areas:

- Command
- Heart
- Running
- Strength
- Nutrition
- Body composition
- Workout plans
- Data and settings

It also adds Calendar, Career, and Briefing sections around those existing modules.

## Apple Calendar

The Calendar section creates Apple-compatible `.ics` event files with a 15-minute reminder. On iPhone or iPad, open the downloaded file and choose **Add to Calendar**.

This is one-way export. Live two-way Apple Calendar synchronization requires a backend or native integration.

## Local data

Dashboard values, priorities, events, briefing content, and career information are stored in browser `localStorage`. JSON backup and restore are included.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Set **Framework Preset** to **Other**.
3. Leave **Build Command** blank.
4. Leave **Output Directory** blank.
5. Deploy.

Vercel serves `index.html` directly. There is no npm, framework compilation, database, or paid dependency.

## Add to iPhone or iPad

Open the deployed URL in Safari, tap **Share**, and choose **Add to Home Screen**.

## Security

This static build does not provide server-side authentication. Keep sensitive or regulated information out of the app until the repository and deployment are private and a real authentication layer is added.
