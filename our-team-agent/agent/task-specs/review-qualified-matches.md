# Review Qualified Matches Task Specification

## Basic Information

- **Task ID:** review-qualified-matches
- **Task name:** Review Qualified Matches
- **Task type:** Decide
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This manual task requires Nicolas to review the top-ranked apartment matches via the UI. Because pursuing a lease has financial consequences, a human must authorize which specific apartment is worth contacting the landlord about.

## 2. Inputs

### Input 1

- **Input name:** top_ranked_matches
- **Contents and format:** UI dashboard displaying the highest-scoring listings from the database.
- **Source:** calculate-weighted-rank

- **If a required input is missing or invalid:** The UI will display a "No Matches Found" error.

## 3. Outputs

### Output 1

- **Output name:** approved_listing_target
- **Contents and format:** A JSON object containing the specific apartment data Nicolas wants to pursue.
- **Next task or recipient:** draft-negotiation-email
- **Complete when:** The user clicks "Approve & Draft Email" on a specific listing.

## 4. Planned Tools

### Tool 1

- **Tool name:** human_approval_dashboard
- **Input:** top_ranked_matches
- **Output:** approved_listing_target
- **Implementation Route:** web API calls
- **Integration approach:** direct integration
- **Role in this task:** Displays the data and captures the human's final decision.
- **Task timeout:** 3 business days
- **Maximum retries:** Not applicable — manual task.
- **Retry only when:** Not applicable
- **On timeout, exhausted retries, or an error that cannot be retried:** The workflow ends with no action taken.
