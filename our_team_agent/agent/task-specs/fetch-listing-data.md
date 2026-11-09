# Ingest Listing Dataset Task Specification

## Basic Information

- **Task ID:** T2
- **Task name:** Ingest Listing Dataset
- **Task level:** L1
- **Task type:** Retrieve
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task ingests rental listings from a local curated dataset (CSV or JSON format) of real or realistic San Luis Obispo properties. Each listing is validated, normalized, and assigned a persistent `listing_id` and `listing_url` that carry through all downstream evaluation, ranking, and outreach tasks.

## 2. Inputs

### Input 1

- **Input name:** search_criteria
- **Contents and format:** Structured JSON containing the target location and search parameters.
- **Source:** app-user-interface (T1)

- **If a required input is missing or invalid:** Log a validation error and notify Nicolas Gonzalez to restart the search.

## 3. Outputs

### Output 1

- **Output name:** raw_listings_array
- **Contents and format:** A JSON array of listings, each guaranteed to contain a stable `listing_id` and direct `listing_url`:
  ```json
  [
    {
      "listing_id": "SLO-2026-0042",
      "listing_url": "https://example.com/listings/slo-0042",
      "address": "1250 Foothill Blvd, San Luis Obispo, CA",
      "neighborhood": "Foothill",
      "asking_rent": 1350,
      "bedrooms": 1,
      "bathrooms": 1.0,
      "description": "Spacious 1BR near Cal Poly campus. Water and trash included. Strict no-sublease policy. Off-street parking $50/mo.",
      "contact_email": "manager@foothillrentals.com"
    }
  ]
  ```
- **Next task or recipient:** filter-candidate-listings (T3)
- **Complete when:** The file/source is successfully read, parsed into memory, and validated against the schema.

## 4. Planned Tools

### Tool 1

- **Tool name:** ingest_listings
- **Input:** search_criteria, listing_data_source
- **Output:** raw_listings_array
- **Implementation Route:** functions/scripts
- **Integration approach:** direct integration
- **Role in this task:** Reads the curated local San Luis Obispo listing data source and outputs normalized JSON records.
- **Task timeout:** 10 seconds
- **Maximum retries:** 2
- **Retry only when:** File read lock or JSON parsing error.
- **On timeout, exhausted retries, or an error that cannot be retried:** Log an ingestion failure and hand off to Nicolas Gonzalez with options to Resume with fallback sample data or End.
