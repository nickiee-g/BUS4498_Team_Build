# Handoff — Off-Campus Housing Matcher & Deal Evaluator

**Owner:** Nicolas Gonzalez

## What works now
- **Website (GitHub Pages):** `https://nickiee-g.github.io/BUS4498_Team_Build/` *(enable GitHub Pages in repo Settings → Pages → Source: `main` branch `/ (root)` after pushing via GitHub Desktop)*
- **Curated SLO Listings Dataset (Feature Group 1):** `our_team_agent/data/listings.csv` contains 50 unique made-up San Luis Obispo rental listings (`SLO-001` through `SLO-050`) covering clean matches, hidden-fee traps, strict lease dealbreakers, long commutes, clear scams (including a prompt-injection test), and ambiguous review cases.
- **Database Schema & Row-Level Security (Feature Group 2):** `supabase/migrations/001_initial_schema.sql` is applied in Supabase with 7 tables (`evaluated_listings`, `commute_cache`, `agent_settings`, `lessons`, `inquiry_drafts`, `listing_reports`, `api_usage_log`), unique constraints, database-level scam guardrails, and explicit RLS policies.
- **Supabase Edge Functions (Feature Group 3 — Deployed & Verified):**
  - `agent` (Tasks T2–T6): Checks `paused` switch & $15/mo API cap, caches Google Maps commutes, runs OpenAI (primary) with automatic Google Gemini (`gemini-3.8-flash`) fallback, enforces all effective-cost math/dealbreakers/ranking in code, defends against prompt injection, and supports `dry_run: true` test mode.
  - `draft-inquiry` (Tasks T8–T9): Drafts personalized landlord inquiries for verified qualified listings only, saves as `draft` (never sends automatically), and blocks duplicates.
  - `review-decision`: Verifies signed-in reviewer token, records Resume/End sign-off decisions, and automatically writes trusted Lessons Learned into `lessons`.
- **Browser Dashboard (Feature Group 4):** `index.html`, `styles.css`, and `app.js` provide both the Student Search & Ranked Matches view (with effective cost breakdowns, clickable links, Report Listing, and Draft Inquiry approval/copy card) and the signed-in Reviewer & Admin Control Center.

## Where things live
- **GitHub repository:** https://github.com/nickiee-g/BUS4498_Team_Build
- **Supabase project:** https://qjfutrpwvzqlhwcgfhai.supabase.co
- **Website files:** `index.html`, `styles.css`, `app.js`
- **Edge Functions:** `supabase/functions/agent/index.ts`, `supabase/functions/draft-inquiry/index.ts`, `supabase/functions/review-decision/index.ts`
- **Database migrations:** `supabase/migrations/001_initial_schema.sql`
- **Runtime plans & docs:** `our_team_agent/runtime/` and `our_team_agent/docs/`
- **Sample dataset:** `our_team_agent/data/listings.csv`

## Secrets
*(Names only — never values. Stored in Supabase → Edge Functions → Secrets.)*
- `OPENAI_API_KEY` (primary AI provider — currently needs prepaid API credits if you want OpenAI active)
- `GEMINI_API_KEY` (backup AI provider — active and verified with `gemini-3.8-flash`)
- `GOOGLE_MAPS_API_KEY` (optional — Google Maps Routes API for live commute lookups; falls back to SLO distance estimates if absent)

## How to test
1. **Health checks (no AI cost):** Visit `https://qjfutrpwvzqlhwcgfhai.supabase.co/functions/v1/agent` and `.../draft-inquiry` — both return `{"ok": true, "ready": true}`.
2. **Student flow:** Open the website, keep "Quick Demo (6 mixed listings)" selected, and click **Evaluate SLO Listings**. Verify that clean listings (`SLO-001`, `SLO-002`) appear ranked with cost breakdowns, while hidden-fee (`SLO-011`), no-sublease (`SLO-015`), and prompt-injection scam (`SLO-024`) are filtered out. Click **Draft Inquiry** on a match to generate and copy a draft email.
3. **Reviewer flow:** Switch to **Reviewer & Admin**, sign in with your Supabase reviewer account, check that `SLO-025` appears in the Held Listings Queue, record a **Resume** or **End** decision with a reason, and verify a new row appears under **Lessons Learned**.
4. **Off switch check:** Set `paused` to `true` with a reason in Permissions, then try running a search on the Student tab — it should immediately display the paused banner without calling any AI.

## What's next
1. Commit and push these files with **GitHub Desktop**, then turn on **GitHub Pages** in your repo's Settings → Pages (`main` branch, `/ (root)`).
2. Run the BUS 4498 Week 11 Agent Builder Kit's **Page 6 Test Plan** against `https://qjfutrpwvzqlhwcgfhai.supabase.co/functions/v1/agent` to generate `our_team_agent/runtime/test-plan.md`.

## How we take turns
Pull before you start, push when you stop (via GitHub Desktop), and tell each other first.
