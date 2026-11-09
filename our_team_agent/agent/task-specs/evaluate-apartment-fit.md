# Evaluate Apartment Fit Task Specification

```yaml
# BASIC INFORMATION
task_id: "T4"
task_name: "Evaluate Apartment Fit"
task_level: "L3"
task_owner: "Nicolas Gonzalez"
```

## 1. Task Goal
- **Objective:** For each individual qualified listing, analyze the unstructured description to extract hidden fees (utilities, parking), detect strict lease dealbreakers (e.g., sublease prohibitions, pet limits), calculate transit commute time to Cal Poly campus, and compute the true effective monthly cost. Apply a deterministic post-evaluation hard check that discards any listing where the effective monthly cost exceeds the student's maximum budget or where strict dealbreakers are violated.

## 2. Inbound Inputs
### Input 1
- **Input name:** candidate_listing
- **What it contains:** JSON object for a single listing passing raw filters, containing `listing_id`, `listing_url`, `address`, `neighborhood`, `asking_rent`, and `description`.
- **Source:** filter-candidate-listings (T3)

### Input 2
- **Input name:** search_criteria
- **What it contains:** JSON object specifying student constraints (`max_effective_budget`, `max_commute_minutes`, `sublease_required`).
- **Source:** app-user-interface (T1)

## 3. Tool Permissions and Boundaries
### Task-Wide Limits (Per Listing)
- **Total task timeout:** 15 seconds per listing
- **Maximum tool calls:** 2 per listing

### Tool 1
- **Tool name:** extract_listing_terms
- **Tool type:** language-model call (OpenAI GPT-6 Sol / ChatGPT API)
- **Supports these permitted subtasks:** `extract_hidden_amenities`, `detect_lease_restrictions`
- **Allowed use:** Parse unstructured listing text to extract numeric utility/parking costs, amenities, and explicit lease policy booleans (`sublease_allowed`, `pets_allowed`).
- **Prohibited use:** Altering base rent or making outreach to landlords.
- **Approval required:** None within allowed use.
- **Timeout per call:** 8 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** Retry on model API timeout. On failure, assume standard utility allowance ($120/mo) and flag lease terms as ambiguous.

### Tool 2
- **Tool name:** calculate_commute_time
- **Tool type:** API request (Google Maps Routes API / Local Commute Cache)
- **Supports these permitted subtasks:** `compute_effective_cost`
- **Allowed use:** Send listing address to retrieve travel time in minutes and driving distance in miles to Cal Poly San Luis Obispo campus (1 Grand Ave, SLO, CA).
- **Prohibited use:** Booking transit or writing to external services.
- **Approval required:** None within allowed use.
- **Timeout per call:** 5 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** On API failure, check local cache; if missing, assign default neighborhood commute estimate.

## 4. How the Agent Should Reason
### Permitted Subtask 1
- **Subtask name:** extract_hidden_amenities
- **Subtask description:** Identifies included vs. unincluded utilities (water, trash, gas, electricity), parking fees, and amenities from the listing text.
- **Subtask boundary:** Read-only analysis of provided listing text.
- **Retry limits:** 0

### Permitted Subtask 2
- **Subtask name:** detect_lease_restrictions
- **Subtask description:** Scans description text specifically for dealbreaker clauses: subleasing policies (e.g., "no subleasing under any circumstance"), pet bans, or required lease lengths.
- **Subtask boundary:** Read-only analysis.
- **Retry limits:** 0

### Permitted Subtask 3
- **Subtask name:** compute_effective_cost
- **Subtask description:** Computes total monthly cost using the formula:
  $$\text{Effective Monthly Cost} = \text{Base Rent} + \text{Utilities} + \text{Parking Fee} + \text{Commute Expense}$$
  where commute expense is calculated based on round-trip mileage from `calculate_commute_time` as defined in `docs/effective_cost_and_scoring_rules.md`.
- **Subtask boundary:** Deterministic calculation using extracted values and Maps data.
- **Retry limits:** 0

### Post-T4 Rule-Based Hard Check (Enforcing Charter Promises)
Immediately following subtask execution, rule-based code evaluates:
1. `effective_monthly_cost <= search_criteria.max_effective_budget`
2. `search_criteria.sublease_required == false || listing.sublease_allowed == true`
3. `commute_minutes <= search_criteria.max_commute_minutes`
If any condition fails, the listing is dropped (`passed_effective_budget: false`) and logged, preventing it from ever reaching ranking (T6) or review (T7).

## 5. When to Stop or Hand Off to a Human
- **Stop successfully when:** The listing has been evaluated, its effective cost calculated, dealbreakers checked, and either forwarded to T5 or discarded.
- **Hand off early when:** Listing text is completely corrupt, unparseable, or missing an address.
- **Hand off to:** Nicolas Gonzalez (options to provide manual address or discard).

## 6. Outbound Deliverable
- **Status:** `Completed` (passed hard checks), `Discarded` (failed budget or dealbreaker), or `Escalated` (tool failure / corrupt address).
- **Deliverable name:** `evaluated_listing` (forwarded to T5 for scam check)
- **Schema:**
  ```json
  {
    "listing_id": "SLO-2026-0042",
    "listing_url": "https://example.com/listings/slo-0042",
    "address": "1250 Foothill Blvd, San Luis Obispo, CA",
    "neighborhood": "Foothill",
    "base_rent": 1350,
    "effective_monthly_cost": 1495,
    "cost_breakdown": {
      "base_rent": 1350,
      "mandatory_utilities": 65,
      "parking_fee": 50,
      "commute_expense": 30
    },
    "commute_minutes": 8,
    "commute_distance_miles": 2.1,
    "sublease_allowed": true,
    "lease_dealbreakers_violated": [],
    "extracted_amenities": ["water included", "trash included", "off-street parking"],
    "passed_effective_budget": true,
    "evaluation_evidence": "Extracted $65/mo electricity estimate and $50 parking fee. Commute is 8 min (2.1 mi). Effective cost is $1,495, within $1,500 budget."
  }
  ```
- **Next task or recipient:** flag-scam-listings (T5)
