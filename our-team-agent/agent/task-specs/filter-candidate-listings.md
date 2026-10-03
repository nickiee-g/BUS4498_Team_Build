# Filter Candidate Listings Task Specification

## Basic Information

- **Task ID:** filter-candidate-listings
- **Task name:** Filter Candidate Listings
- **Task type:** Decide
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task uses strict if/else logic to apply hard constraints (e.g., rejecting any listing where the rent exceeds the user's budget). It prevents downstream AI agents from wasting tokens on apartments that are mathematically disqualified.

## 2. Inputs

### Input 1

- **Input name:** raw_listings_array
- **Contents and format:** JSON array of unfiltered apartment listings.
- **Source:** fetch-listing-data

### Input 2

- **Input name:** search_criteria
- **Contents and format:** JSON payload containing the hard constraints like maximum budget.
- **Source:** app-user-interface

- **If a required input is missing or invalid:** Halt the script, log a pipeline error, and hand off to Nicolas Gonzalez.

## 3. Outputs

### Output 1

- **Output name:** qualified_candidates
- **Contents and format:** A smaller JSON array containing only listings that passed all hard rule checks.
- **Next task or recipient:** evaluate-apartment-fit
- **Complete when:** The Python script finishes iterating through the array and returns the filtered list.

## 4. Planned Tools

### Tool 1

- **Tool name:** apply_hard_filters
- **Input:** raw_listings_array
- **Output:** qualified_candidates
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Evaluates each listing against the budget integer and discards violations.
- **Task timeout:** 10 seconds
- **Maximum retries:** 0
- **Retry only when:** Not applicable
- **On timeout, exhausted retries, or an error that cannot be retried:** Log a script failure status and hand the exception to Nicolas Gonzalez.
