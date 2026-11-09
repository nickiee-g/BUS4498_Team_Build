# Review Ranked Matches Task Specification

## Basic Information

- **Task ID:** T7
- **Task name:** Review Ranked Matches
- **Task level:** L0
- **Task type:** Decide (Human)
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This interactive human-in-the-loop task presents the student with the ranked, verified-safe rental listings in a clean browser dashboard. Each card displays the true effective monthly cost, base rent, utility breakdown, commute time to Cal Poly, and a direct link to the listing. The student reviews their options and selects one listing to approve and generate an inquiry email for.

## 2. Inputs

### Input 1

- **Input name:** ranked_listings_dataset
- **Contents and format:** UI dashboard displaying the scored and sorted listings retrieved from the database cache.
- **Source:** calculate-weighted-rank (T6)

- **If a required input is missing or invalid:** The UI displays a "No Matching Properties Found" notice and allows the student to adjust search criteria.

## 3. Outputs

### Output 1

- **Output name:** approved_listing_target
- **Contents and format:** A JSON object for the single listing selected by the student:
  ```json
  {
    "listing_id": "SLO-2026-0042",
    "listing_url": "https://example.com/listings/slo-0042",
    "address": "1250 Foothill Blvd, San Luis Obispo, CA",
    "effective_monthly_cost": 1495,
    "contact_email": "manager@foothillrentals.com",
    "extracted_amenities": ["off-street parking", "water included"],
    "commute_minutes": 8,
    "user_notes": "Interested in lease starting September 1st"
  }
  ```
- **Next task or recipient:** draft-negotiation-email (T8)
- **Complete when:** The student clicks "Select & Draft Inquiry" on a property card.

## 4. Planned Tools

### Tool 1

- **Tool name:** review_ranked_matches
- **Input:** ranked_listings_dataset
- **Output:** approved_listing_target
- **Implementation Route:** web UI / client components
- **Integration approach:** direct integration
- **Role in this task:** Renders the responsive listing cards, shows cost and commute breakdowns, provides the direct listing link, and captures user selection.
- **Task timeout:** Not applicable — interactive student session.
- **Maximum retries:** Not applicable
- **On timeout, exhausted retries, or an error that cannot be retried:** If the student closes the session without selecting, workflow cleanly terminates with status `End: No Action`.
