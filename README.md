# BUS4498_Team_Build
About the Agentic System
BUS 4498 Team Build

## Team Members
* Nick Gonzalez

## System Name
# Off-Campus Housing Matcher & Deal Evaluator

## Problem to be Solved
Finding a rental that fits a specific budget, commute distance, and strict lease requirements (e.g., in-unit laundry, parking, pet-friendly) is highly fragmented and manual. Renters waste hours manually calculating true commute times to campus or work and often miss "red flags" such as strict sublease bans or hidden utility fees that make the actual effective monthly cost unaffordable. 

## System Goal
For Cal Poly students and local Central Coast renters, reduce the time and effort required to find a qualifying rental, measured by the median time to identify a fully matched property moving from 5 days to 1 day, without recommending properties that exceed the user's maximum effective monthly budget or violate strict lease dealbreakers. Also allow the user to click a link directly to the listing so the user can apply to rent

## Beneficiary Statement
Cal Poly students and local renters will be better off when this system works because they will save hours of manual search time and avoid signing leases with hidden financial fees or unmanageable commute times.


## The following may be edited in the future:
## The Agent's Workflow

1. **App User Interface:** User submits weighted criteria (budget, commute, deal-breakers).
2. **Fetch Listing Data:** Automated retrieval of raw listings via API.
3. **Filter Candidate Listings:** Hard constraints (e.g., max budget) applied to immediately discard unqualified properties.
4. **Evaluate Apartment Fit (L3 Agent):** AI agent extracts hidden amenities and calculates effective commute times.
5. **Flag Scam Listings (L3 Agent):** AI agent assesses unstructured text for fraud risk and discards scams.
6. **Calculate Weighted Rank:** Deterministic algorithm scores and sorts safe listings into an SQLite database.
7. **Review Qualified Matches:** Human manually reviews top matches and authorizes contact.
8. **Draft Negotiation Email (L3 Agent):** AI agent synthesizes listing weaknesses to draft a personalized negotiation email.
9. **Trigger Webhook Notification:** System pushes the drafted email to the user's device for final approval.

## Tools to Build

* `submit_criteria`
* `fetch_from_api`
* `apply_hard_filters`
* `calculate_commute_time`
* `analyze_fraud_risk`
* `compute_rank_score`
* `human_approval_dashboard`
* `generate_email_copy`
* `post_to_webhook`
