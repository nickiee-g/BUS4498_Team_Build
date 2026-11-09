# Capture Search Criteria Task Specification

## Basic Information

- **Task ID:** T1
- **Task name:** Capture Search Criteria
- **Task level:** L0
- **Task type:** Retrieve / Trigger
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task acts as the workflow trigger. It provides a user interface where the student inputs their explicit search criteria and preferences (max effective monthly budget, bed/bath count, target commute time, and strict lease dealbreakers like requiring subleasing permissions) so the system can evaluate matching properties.

## 2. Inputs

### Input 1

- **Input name:** user_preferences
- **Contents and format:** Human text input via UI form fields (numbers for budget, integers for bedrooms/bathrooms, dropdowns for commute thresholds, checkboxes for dealbreakers).
- **Source:** Student user / Nicolas Gonzalez

- **If a required input is missing or invalid:** The form will not submit and prompts the user to fill in the required fields (minimum budget and bedroom count).

## 3. Outputs

### Output 1

- **Output name:** search_criteria
- **Contents and format:** Structured JSON payload:
  ```json
  {
    "search_id": "REQ-2026-001",
    "target_campus": "Cal Poly San Luis Obispo",
    "max_effective_budget": 1400,
    "min_bedrooms": 1,
    "max_commute_minutes": 25,
    "sublease_required": true,
    "pets_allowed_required": false,
    "in_unit_laundry_preferred": true
  }
  ```
- **Next task or recipient:** fetch-listing-data (T2)
- **Complete when:** The user clicks "Find Rentals" and the validated `search_criteria` JSON object is generated.

## 4. Planned Tools

### Tool 1

- **Tool name:** submit_criteria
- **Input:** user_preferences
- **Output:** search_criteria
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Validates frontend user input and formats it into the standard `search_criteria` schema.
- **Task timeout:** Not applicable — interactive form.
- **Maximum retries:** Not applicable — manual input.
- **Retry only when:** Not applicable
- **On timeout, exhausted retries, or an error that cannot be retried:** Form displays client-side validation errors until corrected.
