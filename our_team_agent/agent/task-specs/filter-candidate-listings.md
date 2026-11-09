# Apply Raw Filters Task Specification

## Basic Information

- **Task ID:** T3
- **Task name:** Apply Raw Filters
- **Task level:** L1
- **Task type:** Decide
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task uses strict, deterministic if/else logic to filter out listings that violate basic constraints on their face (e.g., asking rent already exceeds maximum budget before any additional fees, or bedroom count does not meet requirements). It prevents downstream AI agents from spending API calls on properties that are mathematically disqualified from the start.

## 2. Inputs

### Input 1

- **Input name:** raw_listings_array
- **Contents and format:** JSON array of raw listing objects, each with `listing_id` and `listing_url`.
- **Source:** fetch-listing-data (T2)

### Input 2

- **Input name:** search_criteria
- **Contents and format:** JSON payload containing student parameters (`max_effective_budget`, `min_bedrooms`).
- **Source:** app-user-interface (T1)

- **If a required input is missing or invalid:** Halt the filtering script, log a pipeline error, and hand off to Nicolas Gonzalez.

## 3. Outputs

### Output 1

- **Output name:** qualified_candidates
- **Contents and format:** A JSON array containing only listings whose base asking rent is $\le$ `max_effective_budget` and whose bedroom count $\ge$ `min_bedrooms`, retaining all original fields including `listing_id` and `listing_url`.
- **Next task or recipient:** evaluate-apartment-fit (T4)
- **Complete when:** The script finishes iterating through the array and returns the filtered candidate list.

## 4. Planned Tools

### Tool 1

- **Tool name:** apply_raw_filters
- **Input:** raw_listings_array, search_criteria
- **Output:** qualified_candidates
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Evaluates each listing against integer thresholds (`asking_rent <= max_effective_budget` and `bedrooms >= min_bedrooms`) and discards non-matching records.
- **Task timeout:** 5 seconds
- **Maximum retries:** 0 (deterministic in-memory operation)
- **On timeout, exhausted retries, or an error that cannot be retried:** Log an error and hand off to Nicolas Gonzalez.
