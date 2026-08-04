For this specific bug, **use Brevo's native Campaign/List API** — not a background queue — unless you have a concrete reason you can't.

**Why this beats a queue here:**

The core problem isn't "the loop is slow," it's "you're doing Brevo's job yourself." If you're just sending the same newsletter to a list of recipients, Brevo already has infrastructure built for exactly this: create a list, sync contacts to it, create a campaign, hit send. Brevo handles batching, rate limiting, retries, and bounce/unsubscribe management on their end — none of that is your problem anymore. Your API route becomes a single fast call (create/update list → trigger campaign) instead of a loop over hundreds of individual send requests.

```ts
// Rough shape — single request, no loop, no timeout risk
await brevo.contacts.importList(listId, recipients); // or upsert in batches via their bulk import endpoint
await brevo.campaigns.create({ listIds: [listId], subject, htmlContent });
await brevo.campaigns.send(campaignId);
```

This is 2-3 API calls total, regardless of whether you have 200 or 200,000 recipients. It's the correct fix, not a workaround.

**When to reach for a background queue instead:**

Only if you need something Brevo's campaign system genuinely can't do — e.g., per-recipient dynamically generated content that isn't achievable through Brevo's merge tags/personalization attributes (like content computed from your own DB per user, not just name/email substitution). In that case:

- On Vercel, you don't have a native long-running worker, so you'd reach for something like **QStash (Upstash)**, **Inngest**, or **Trigger.dev** — these let you fan out N background jobs (one per batch) that each run under their own timeout window, instead of one giant loop in the request handler.
- Pattern: API route enqueues jobs → each job sends one batch of 50 → queue handles retries on failure.

**What to avoid:** Don't just "make the batches smaller" or add a cron that re-invokes the same route recursively to page through the list — it works but you're reinventing (badly) what Brevo already does natively, and you inherit all the failure-mode complexity (partial sends, idempotency, tracking progress) yourself.

So: check whether your newsletter content is truly the same for everyone (or Brevo-template-personalizable). If yes, native Campaign API and this bug basically disappears rather than getting mitigated.