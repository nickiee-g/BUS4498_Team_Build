# App User Interface Task Specification

## Basic Information

- **Task ID:** T1 app-user-interface
- **Task name:** App User Interface
- **Task type:** Retrieve
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task acts as the workflow trigger. It provides a user interface where Nicolas inputs his explicit, subjective search constraints (target commute, max budget, deal-breakers) so the system knows what to search for.

## 2. Inputs

### Input 1

- **Input name:** user_preferences
- **Contents and format:** Human text input via UI form fields (e.g., numbers for budget, strings for locations).
- **Source:** Nicolas Gonzalez

- **If a required input is missing or invalid:** The form will not submit and will prompt Nicolas Gonzalez to fill in the missing fields.

## 3. Outputs

### Output 1

- **Output name:** search_criteria
- **Contents and format:** Structured JSON payload containing budget, commute times, and requested amenities.
- **Next task or recipient:** fetch-listing-data
- **Complete when:** The user clicks the "Submit Search" button and the JSON payload is successfully generated.

## 4. Planned Tools

### Tool 1

- **Tool name:** submit_criteria
- **Input:** user_preferences
- **Output:** search_criteria
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Captures human input from the frontend and converts it into a structured dictionary/JSON for the backend.
- **Task timeout:** one business day after assignment
- **Maximum retries:** Not applicable — manual task.
- **Retry only when:** Not applicable
- **On timeout, exhausted retries, or an error that cannot be retried:** Task remains pending until the human user submits the form.
