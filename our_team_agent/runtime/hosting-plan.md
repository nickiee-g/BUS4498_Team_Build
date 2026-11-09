# Hosting plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant turns it into a GitHub Pages website and a Supabase backend, following `runtime/hosting-rules.md`. Where this plan and our task specifications disagree, this plan wins.

## Our project

- GitHub repository: https://github.com/nickiee-g/BUS4498_Team_Build
- Our agent’s folder: `our_team_agent` (our plans are in `our_team_agent/runtime/`)
- Supabase project: https://qjfutrpwvzqlhwcgfhai.supabase.co
- Owner of the repository and the Supabase project: Nicolas Gonzalez

## What our agent does

Automates off-campus housing searches for Cal Poly students by evaluating rental listings against true effective monthly cost, commute time, and lease dealbreakers, while screening for scams and drafting landlord inquiries.

## Our tasks

Use the tasks in our task specifications: `our_team_agent/agent/workflow-of-tasks.md` and `our_team_agent/agent/task-specs/`.

## Who can see or change what

Students see search results, effective cost breakdowns, and draft inquiry emails. Only Nicolas Gonzalez (reviewer/admin) can view flagged fraud audits, change system limits, and sign off on ambiguous listings.

## External tools and applications

| # | Tool or application | What the agent uses it for | What it does with it | Most sensitive data it touches | How it connects |
|---|---|---|---|---|---|
| 1 | Google Maps Routes API | Estimates travel time and transit distance from listing address to Cal Poly campus, caching results to prevent duplicate API spend | Reads from it | Public | An API key (in Supabase Secrets) |
| 2 | San Luis Obispo Rent Reference Table | Provides typical local rent benchmarks by bedroom count and neighborhood for price realism checks. | Reads from it | Public | Not sure yet |

## Files people upload

Curated San Luis Obispo listing datasets (CSV or JSON format).
