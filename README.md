# BUS4498_Team_Build
About the Agentic System
BUS 4498 Team Build

## Team Members
* Nick Gonzalez

## System Name
# Off-Campus Housing Matcher & Deal Evaluator

## Problem to be Solved
Finding a rental that fits a specific budget, commute distance, and strict lease requirements (e.g., in-unit laundry, parking, pet-friendly) is highly fragmented and manual. Renters waste hours manually calculating true commute times to campus or work and often miss "red flags" such as strict sublease bans or hidden utility fees that make the actual effective monthly cost unaffordable. 

## System Goal
For Cal Poly students and local Central Coast renters, reduce the time and effort required to find a qualifying rental, measured by the median time to identify a fully matched property moving from 5 days to 1 day, without recommending properties that exceed the user's maximum effective monthly budget or violate strict lease dealbreakers. Also allow the user to click a link directly to the listing so the user can apply to rent

## Beneficiary Statement
Cal Poly students and local renters will be better off when this system works because they will save hours of manual search time and avoid signing leases with hidden financial fees or unmanageable commute times.


## The following may be edited in the future:
## The Agent's Workflow
1. Searches local rental listings or accepts a list of URLs/search queries.
2. Fetches listing pages and extracts structured fields: monthly rent, bed/bath count, security deposit, utilities included, and lease terms.
3. Checks distance or travel time to the target destination via a lightweight distance/geocoding API.
4. Flags "red flags" (e.g., strict sublease bans, hidden utility fees, no parking) and calculates effective monthly cost.
5. Stores qualifying apartments in a normalized SQLite table with columns for `address`, `price`, `commute_minutes`, `fit_score`, and `contact_info`.

## Tools to Build
* `search_rentals(city, max_price)`
* `parse_listing_page(url)`
* `get_commute_time(address)`
* `save_listing(details)`
