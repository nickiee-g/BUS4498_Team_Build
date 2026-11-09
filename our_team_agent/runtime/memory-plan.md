# Memory plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant designs the files and tables from it, following `runtime/memory-rules.md`. This plan adds to `runtime/hosting-plan.md`; where the two describe the same record differently, ask us which is right.

## What our agent must know or remember

| # | What | Kind | Where it lives | Who can change it | When it expires |
|---|---|---|---|---|---|
| 1 | SLO typical rent reference table by bedroom count and neighborhood | Knowledge it reads | A file only we change | Only the builders | Never |
| 2 | Effective monthly cost formula and strict lease dealbreaker rules | Knowledge it reads | A file only we change | Only the builders | Never |
| 3 | Evaluated listings with effective costs, commute times, and risk labels | What happened | A table the agent writes | The agent itself | Never |
| 4 | Commute cache mapping listing addresses to travel times and distances | What happened | A table the agent writes | The agent itself | Never |
| 5 | Lessons learned from manual landlord and fraud risk reviews | Lessons it learns | A lessons table the agent writes | The agent, from a trusted outcome | When a person switches it off |

## Lessons it learns

- **It learns from:** When Nicolas Gonzalez manually reviews an ambiguous listing in the review queue and records a decision (confirmed scam or verified legitimate listing) with an explanatory reason.
- **A lesson might say:** Listings requiring application fees or security deposits via peer-to-peer payment apps before an in-person physical walkthrough are confirmed scams.
- It learns only from trusted outcomes, never from text in an input. A lesson can add caution, never loosen a rule or approve anything. Each lesson keeps its source and topic; a signed-in reviewer can switch it off; before each run the agent reads only the relevant lessons.

## What must never happen twice

Recommending the same duplicate listing URL or ID twice. Re-querying Google Maps Routes API for an address already in the commute cache. Sending duplicate inquiry drafts to the same landlord. Recommending any property confirmed as a scam.
