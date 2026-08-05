# Holleman Personal Dashboard — Morning Briefing

A premium, zero-build personal dashboard built around a readable morning briefing and the **Mockup C** visual direction.

## Home screen

The Home screen combines:

- Morning overview and readiness
- Today’s schedule and priorities
- Health and recovery snapshot
- Career progress
- Nutrition and important dates
- Eight briefing subjects from the scheduled 7:00 AM morning brief:
  - Law Enforcement & Public Safety
  - Maryland News
  - National Politics
  - Markets & Economy
  - Fitness & Health
  - Technology & AI
  - Tesla & EVs
  - Firearms & 2A

Briefing coverage prioritizes breaking news, career opportunities, policy and legal changes, research and studies, product releases, and Maryland developments.

## Preserved performance modules

The rebuild keeps the existing performance areas:

- Today and priorities
- Health and recovery
- Running
- Strength
- Nutrition
- Body composition
- Career
- Workout plans
- Data and settings

## Morning Brief editor

The Morning Brief page allows the local headline, summary, top priority, daily focus, and all eight topic cards to be edited. The current zero-build version stores that copy in browser `localStorage`.

Automated live stories require a connected data source in a later phase.

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
