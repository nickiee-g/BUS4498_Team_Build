# Screen Fraud and Price Realism Task Specification

```yaml
# BASIC INFORMATION
task_id: "T5"
task_name: "Screen Fraud and Price Realism"
task_level: "L3"
task_owner: "Nicolas Gonzalez"
```

## 1. Task Goal
- **Objective:** Evaluate each qualified listing individually to protect students from rental fraud. Screen the unstructured listing text for linguistic scam heuristics (urgency, untraceable deposit requests, off-platform communication), compare listed rent against typical local rents in San Luis Obispo (`docs/local_rent_reference.md`) to detect unrealistic "too good to be true" bait pricing, and route listings based on clear risk thresholds.

## 2. Inbound Inputs
### Input 1
- **Input name:** evaluated_listing
- **What it contains:** JSON object for a single listing from T4 with `listing_id`, `listing_url`, `effective_monthly_cost`, `address`, and `description`.
- **Source:** evaluate-apartment-fit (T4)

### Input 2
- **Input name:** slo_rent_reference_table
- **What it contains:** Benchmark median rents by bedroom count and neighborhood.
- **Source:** `docs/local_rent_reference.md`

## 3. Tool Permissions and Boundaries
### Task-Wide Limits (Per Listing)
- **Total task timeout:** 15 seconds per listing
- **Maximum tool calls:** 2 per listing

### Tool 1
- **Tool name:** assess_linguistic_risk
- **Tool type:** language-model call (OpenAI GPT-6 Sol / ChatGPT API)
- **Supports these permitted subtasks:** `assess_linguistic_risk`, `verify_contact_methods`
- **Allowed use:** Scan listing text for high-risk scam patterns (requests for upfront cash/wire transfers prior to viewing, claiming landlord is currently abroad or out of state, excessive emotional urgency).
- **Prohibited use:** Initiating messages or contacting any phone/email listed.
- **Approval required:** None within allowed use.
- **Timeout per call:** 8 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** On timeout/error, mark fraud risk as `Unknown` and route to Nicolas Gonzalez.

### Tool 2
- **Tool name:** compare_market_rent
- **Tool type:** code lookup / calculation
- **Supports these permitted subtasks:** `evaluate_price_realism`
- **Allowed use:** Cross-references listing price against neighborhood median in `docs/local_rent_reference.md` to calculate price deviation percentage.
- **Prohibited use:** Modifying reference tables.
- **Approval required:** None within allowed use.
- **Timeout per call:** 2 seconds
- **Maximum retries per call:** 0

## 4. How the Agent Should Reason
### Permitted Subtask 1
- **Subtask name:** assess_linguistic_risk
- **Subtask description:** Assigns a linguistic fraud probability score between 0.0 and 1.0 based on recognized rental scam patterns.
- **Subtask boundary:** Read-only analysis of description text.
- **Retry limits:** 0

### Permitted Subtask 2
- **Subtask name:** verify_contact_methods
- **Subtask description:** Evaluates the contact details (e.g., standard local property management domain vs. burner email or request to communicate strictly via WhatsApp/Telegram).
- **Subtask boundary:** Static classification; no network calls to external servers.
- **Retry limits:** 0

### Permitted Subtask 3
- **Subtask name:** evaluate_price_realism
- **Subtask description:** If asking rent is $>35\%$ below the neighborhood median for the same bedroom count without an architectural explanation (e.g., shared room), flags listing as suspicious bait pricing.
- **Subtask boundary:** Read-only calculation using `docs/local_rent_reference.md`.
- **Retry limits:** 0

## 5. When to Stop or Hand Off to a Human
- **Stop successfully when:** Fraud risk score is computed:
  - **Verified Safe (Score < 0.40):** Passes to T6 for ranking.
  - **High Fraud Risk (Score > 0.80):** Immediately discarded and logged to `fraud_audit_log`.
- **Hand off to Nicolas Gonzalez when:**
  - **Ambiguous Risk (Score 0.40 - 0.80):** Conflicting signals (e.g., legitimate address but abnormal payment request).
  - **Tool Failure (Risk = Unknown):** Model or lookup failure.
- **Reviewer Actions:**
  - **Resume:** Nicolas Gonzalez reviews listing in admin queue and confirms it is legitimate $\rightarrow$ passes to T6.
  - **Retry:** Re-evaluates listing with additional context $\rightarrow$ returns to T5.
  - **End:** Confirms listing is fraudulent $\rightarrow$ discarded and landlord blacklisted.

## 6. Outbound Deliverable
- **Status:** `Verified_Safe` (Score < 0.40), `Discarded` (High Risk), or `Escalated` (Ambiguous / Error).
- **Deliverable name:** `verified_safe_listing`
- **Schema:**
  ```json
  {
    "listing_id": "SLO-2026-0042",
    "listing_url": "https://example.com/listings/slo-0042",
    "effective_monthly_cost": 1495,
    "commute_minutes": 8,
    "fraud_risk_score": 0.08,
    "fraud_risk_label": "Verified Safe",
    "price_realism_status": "Realistic",
    "market_rent_delta_percent": -3.5,
    "evidence_summary": "Asking rent ($1,350) aligns with Foothill 1BR median ($1,400). Legitimate property management contact. No wire transfer or advance deposit demands.",
    "passed_fraud_check": true
  }
  ```
- **Next task or recipient:** calculate-weighted-rank (T6)
