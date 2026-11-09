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
For Cal Poly students and local Central Coast renters, reduce the time and effort required to find a qualifying rental, measured by the median time to identify a fully matched property moving from 5 days to 1 day, without recommending properties that exceed the user's maximum effective monthly budget or violate strict lease dealbreakers. Also allow the user to click a link directly to the listing so the user can apply to rent.

## Beneficiary Statement
Cal Poly students and local renters will be better off when this system works because they will save hours of manual search time and avoid signing leases with hidden financial fees or unmanageable commute times.

## The Agent's Workflow

1. **Capture Search Criteria (L0 - Trigger):** User submits weighted search criteria (max budget, commute distance, bedroom count, and dealbreakers like subleasing requirement).
2. **Ingest Listing Dataset (L1 - Code):** Automated ingestion of curated San Luis Obispo rental listings, attaching persistent listing IDs and direct URLs.
3. **Apply Raw Filters (L1 - Code):** Deterministic if/else logic filters listings against basic budget and bed/bath counts.
4. **Evaluate Apartment Fit (L3 - Agent):** Per-listing AI evaluation extracting utility fees, parking costs, lease restrictions, and transit commute times, followed by a deterministic rule-based check that discards listings violating effective budget or sublease policies.
5. **Screen Fraud & Price Realism (L3 - Agent):** Assesses unstructured listing text for scam heuristics and compares rent against the local SLO market rent reference table.
6. **Rank and Score Matches (L1 - Code):** Deterministic mathematical formula scores and sorts verified safe listings into a database cache.
7. **Review Ranked Matches (L0 - Human Decision):** Student reviews top-ranked matches in the browser dashboard with full cost breakdowns and direct links.
8. **Draft Landlord Inquiry (L2 - Single LLM Prompt):** Generates a polite, personalized inquiry email tailored to the selected property.
9. **Display and Dispatch Inquiry (L1 - UI / Notification):** Displays the draft inquiry for student review, editing, and copy/dispatch.

## Tools to Build

* `submit_criteria` (T1: frontend form capture)
* `ingest_listings` (T2: CSV/JSON dataset ingestion)
* `apply_raw_filters` (T3: deterministic budget/bedroom filter)
* `extract_listing_terms` (T4: LLM tool for fees & lease restrictions)
* `calculate_commute_time` (T4: Maps API / cached commute lookup)
* `assess_linguistic_risk` (T5: LLM tool for scam pattern detection)
* `compare_market_rent` (T5: code comparison against SLO rent benchmarks)
* `compute_rank_score` (T6: weighted scoring algorithm)
* `review_ranked_matches` (T7: responsive listing review dashboard)
* `generate_email_copy` (T8: LLM tool for personalized inquiry drafting)
* `display_inquiry_card` (T9: UI display with copy/dispatch controls)
