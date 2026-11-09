# Task Summary

| Task ID | Task name | Level | Type | Specification file address |
| --- | --- | --- | --- | --- |
| T1 | Capture Search Criteria | L0 | Trigger / Input | [task-specs/app-user-interface.md](task-specs/app-user-interface.md) |
| T2 | Ingest Listing Dataset | L1 | Retrieve (Code) | [task-specs/fetch-listing-data.md](task-specs/fetch-listing-data.md) |
| T3 | Apply Raw Filters | L1 | Decide (Code) | [task-specs/filter-candidate-listings.md](task-specs/filter-candidate-listings.md) |
| T4 | Evaluate Apartment Fit | L3 | Reason (Agent) | [task-specs/evaluate-apartment-fit.md](task-specs/evaluate-apartment-fit.md) |
| T5 | Screen Fraud & Price Realism | L3 | Reason (Agent) | [task-specs/flag-scam-listings.md](task-specs/flag-scam-listings.md) |
| T6 | Rank and Score Matches | L1 | Reason (Code) | [task-specs/calculate-weighted-rank.md](task-specs/calculate-weighted-rank.md) |
| T7 | Review Ranked Matches | L0 | Decide (Human) | [task-specs/review-qualified-matches.md](task-specs/review-qualified-matches.md) |
| T8 | Draft Landlord Inquiry | L2 | Reason (LLM) | [task-specs/draft-negotiation-email.md](task-specs/draft-negotiation-email.md) |
| T9 | Display / Send Inquiry | L1 | Act (UI/Webhook) | [task-specs/trigger-webhook-notification.md](task-specs/trigger-webhook-notification.md) |
