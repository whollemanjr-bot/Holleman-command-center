# Apple Calendar and Reminders Shortcut Bridge

The web app cannot directly access EventKit. This setup uses Apple Shortcuts on the iPhone or iPad as the permissioned bridge.

## Before building the Shortcut

1. Deploy the Command Center.
2. Run `supabase/schema.sql` in Supabase.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `APPLE_SYNC_TOKEN` in Vercel.
4. Redeploy.
5. Keep the sync token private. It is not your Apple password.

Assume the production URL is:

```text
https://hollemanperformance.com
```

## Shortcut A — Import Apple data

Create a Shortcut named **Command Center Import**.

1. Add **Find Calendar Events**.
   - Start Date: beginning of today
   - End Date: 30 days from today
   - Limit the calendars to the ones you want in the dashboard.
2. Use **Repeat with Each** to create a dictionary for each event with:
   - `external_id`: Calendar Event Identifier
   - `title`: Title
   - `start_at`: Start Date
   - `end_at`: End Date
   - `all_day`: Is All Day
   - `location`: Location
   - `notes`: Notes
   - `calendar_name`: Calendar Name
3. Add the dictionaries to an `events` list.
4. Add **Find Reminders** for incomplete and recently completed reminders you want synced.
5. Create a reminder dictionary with:
   - `external_id`: Reminder Identifier
   - `title`: Title
   - `due_at`: Due Date
   - `completed`: Is Completed
   - `priority`: Priority
   - `notes`: Notes
   - `list_name`: List Name
6. Add the dictionaries to a `reminders` list.
7. Create the final dictionary:

```json
{
  "device_name": "Walter iPhone",
  "events": [/* event dictionaries */],
  "reminders": [/* reminder dictionaries */]
}
```

8. Add **Get Contents of URL**:
   - URL: `https://hollemanperformance.com/api/apple-sync/import`
   - Method: `POST`
   - Request Body: JSON using the final dictionary
   - Header `x-sync-token`: your `APPLE_SYNC_TOKEN`

Run it manually once and allow Calendar and Reminders permissions.

## Shortcut B — Write Command Center items to Apple

Create a Shortcut named **Command Center Outbox**.

1. Add **Get Contents of URL**:
   - URL: `https://hollemanperformance.com/api/apple-sync/outbox`
   - Method: `GET`
   - Header `x-sync-token`: your token
2. Read the `items` array.
3. Repeat through each item:
   - When `entity_type` is `calendar_event`, use **Add New Event** with the payload title, start, end, location, and notes.
   - When `entity_type` is `reminder`, use **Add New Reminder** with the payload title, due date, list, and notes.
4. Collect each successfully processed `id`.
5. Send the IDs to:
   - URL: `https://hollemanperformance.com/api/apple-sync/ack`
   - Method: `POST`
   - Header `x-sync-token`: your token
   - JSON Body: `{"ids":[/* processed IDs */]}`

## Automation cadence

Useful Personal Automation triggers include:

- Time of Day: morning and evening
- App: when Safari or the Command Center home-screen app is opened/closed
- Apple Watch Workout: when a workout ends
- NFC: tap a tag near the gym, sauna, or cold plunge

Shortcuts are device-specific and may not be real-time. Begin with twice-daily import plus a manual **Sync Now** Shortcut widget.

## Conflict and duplication rules

- Apple-created records use Apple as their source of truth.
- Command-Center-created records are placed in the outbox for Apple creation.
- Imports deduplicate on `source + external_id`.
- Do not delete source records automatically in version 1.
- Test with a dedicated calendar and reminders list before enabling personal calendars.

## Troubleshooting

- `401 Invalid sync token`: the Shortcut header does not match `APPLE_SYNC_TOKEN`.
- `503 Supabase is not configured`: verify all Supabase environment variables and redeploy.
- Duplicate events: confirm the event identifier is included as `external_id`.
- No browser update: unlock the Command Center and press **Sync now** in Data & Connections.
- Shortcut cannot access a list/calendar: open the Shortcut manually and approve the Apple permission prompt.
