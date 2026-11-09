# Rank and Score Matches Task Specification

## Basic Information

- **Task ID:** T6
- **Task name:** Rank and Score Matches
- **Task level:** L1
- **Task type:** Reason (Code)
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task executes a deterministic mathematical formula to score each verified safe listing on a 0–100 scale using normalized weights (effective monthly cost fit, commute proximity, and requested amenities) as defined in `docs/effective_cost_and_scoring_rules.md`. The scored listings are sorted and stored in the database cache for student review.

## 2. Inputs

### Input 1

- **Input name:** verified_safe_listings
- **Contents and format:** JSON array of listings that passed the fraud check (from T5), each with `listing_id`, `listing_url`, `effective_monthly_cost`, and `commute_minutes`.
- **Source:** flag-scam-listings (T5)

### Input 2

- **Input name:** search_criteria
- **Contents and format:** Student preferences (budget, preferred amenities).
- **Source:** app-user-interface (T1)

- **If a required input is missing or invalid:** Fall back to sorting purely by `effective_monthly_cost` ascending, log the fallback, and alert Nicolas Gonzalez.

## 3. Outputs

### Output 1

- **Output name:** ranked_listings_dataset
- **Contents and format:** A sorted JSON array written to the database cache, ordered by highest fit score (descending), retaining `listing_id`, `listing_url`, and complete cost breakdown.
- **Next task or recipient:** review-qualified-matches (T7)
- **Complete when:** All listings are scored, sorted, and recorded in the database cache.

## 4. Planned Tools

### Tool 1

- **Tool name:** compute_rank_score
- **Input:** verified_safe_listings, search_criteria
- **Output:** ranked_listings_dataset
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Executes the deterministic weighted scoring algorithm defined in `docs/effective_cost_and_scoring_rules.md`:
  $$\text{Score} = (0.40 \times S_{\text{cost}}) + (0.30 \times S_{\text{commute}}) + (0.30 \times S_{\text{amenities}})$$
- **Task timeout:** 5 seconds
- **Maximum retries:** 1
- **Retry only when:** Database write contention error.
- **On timeout, exhausted retries, or an error that cannot be retried:** Fall back to default price-sorted list and alert Nicolas Gonzalez.
