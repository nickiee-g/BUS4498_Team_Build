# Calculate Weighted Rank Task Specification

## Basic Information

- **Task ID:** calculate-weighted-rank
- **Task name:** Calculate Weighted Rank
- **Task type:** Reason
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task applies a deterministic mathematical formula to score each verified safe listing. It calculates a final fit score out of 100 based on weighted criteria (price, commute time, amenities) to sort the best options to the top.

## 2. Inputs

### Input 1

- **Input name:** verified_safe_listings
- **Contents and format:** JSON array of listings that passed the fraud check.
- **Source:** flag-scam-listings

- **If a required input is missing or invalid:** Halt the scoring script, log the error, and hand off to Nicolas Gonzalez.

## 3. Outputs

### Output 1

- **Output name:** ranked_listings_database
- **Contents and format:** A sorted dataset saved to an SQLite Database, ordered by highest fit score.
- **Next task or recipient:** review-qualified-matches
- **Complete when:** The Python script successfully writes the sorted data to the database.

## 4. Planned Tools

### Tool 1

- **Tool name:** compute_rank_score
- **Input:** verified_safe_listings
- **Output:** ranked_listings_database
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Evaluates each listing against a weighted algorithm and assigns an integer score.
- **Task timeout:** 10 seconds
- **Maximum retries:** 0
- **Retry only when:** Not applicable
- **On timeout, exhausted retries, or an error that cannot be retried:** Log an execution failure and notify Nicolas Gonzalez.
