# DevSprint

A 60-day placement-prep challenge built with React and Vite for Vercel. The plan covers C# Core, ASP.NET Core/.NET, JavaScript, and React. Each day includes one GFG reading link and four LeetCode problems (2 easy, 1 medium, 1 hard), with a separate GFG notes link beside each problem.

## Run the app

```bash
npm install
npm run dev
```

The client stores challenge check-offs, the challenge start date, the selected theme, and project-lab steps in versioned browser local storage. No user account is needed. Use **Copy backup code** to move progress between devices. The app can be deployed as a normal Vite static site on Vercel; the `/api` files are Vercel Functions.

## Daily reminder service

Email enrollment uses double opt-in. Confirmation links expire after 24 hours. The app stores only confirmed subscribers, sends one daily message with that subscriber's current lesson and LeetCode set, and includes an unsubscribe page in each reminder.

Connect these services before turning the enrollment form on in production:

1. Create an Upstash Redis database with its REST API enabled.
2. Create a Resend account, verify the sender domain, and create an API key.
3. Add the variables below to **Vercel → Project → Settings → Environment Variables**. `SITE_URL` should be the public HTTPS deployment URL or your custom domain. `REMINDER_FROM_EMAIL` must use the verified Resend domain. Generate a private random `CRON_SECRET` and keep it out of source control.
4. Deploy to production. Vercel registers the cron from `vercel.json` on production deployments.

| Variable | Purpose |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Private Upstash REST token |
| `RESEND_API_KEY` | Resend API key |
| `REMINDER_FROM_EMAIL` | Verified sender, such as `DevSprint <reminders@example.com>` |
| `SITE_URL` | Public HTTPS app origin used for confirmation and unsubscribe links |
| `CRON_SECRET` | Secret Vercel sends to authorize the reminder function |

The cron is scheduled at `03:30 UTC`, which is 9:00 AM in India Standard Time. On Vercel Hobby, scheduled jobs run once daily and can be invoked at any point within their scheduled hour, so delivery can arrive up to about an hour later. The email form requires an explicit opt-in and confirmation; it reports setup errors rather than pretending an address enrolled when the email or storage service is unavailable.

## Deploy

Import this repository into Vercel and use the project defaults. `vercel.json` sets the build command and `dist` output directory. Add the reminder environment variables above if daily email is wanted; the rest of the app works without them.

## Notes

- GFG links are direct curriculum guides or topic-specific GeeksforGeeks searches. LeetCode links open the named problem directly.
- Progress is browser-local. Clearing site data or switching browsers will not transfer it.
- The reminder function is rate-neutral for subscribers and runs once per day; use a persistent email provider and Redis credentials in Vercel, never in client-side React code.
