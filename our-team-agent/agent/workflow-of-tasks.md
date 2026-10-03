# Workflow of Tasks

## 1. Workflow Goal
This workflow supports the goal in my completed [team charter]([PASTE_CHARTER_FILE_URL_HERE](https://github.com/nickiee-g/BUS4498_Team_Build/blob/main/README.md)[cite: 3].

## 2. Workflow Trigger
User submits weighted apartment search criteria (e.g., target commute, max budget, deal-breakers) via the App User Interface.

## 3. Completion Condition at Runtime
The workflow ends successfully when a qualified apartment match is manually reviewed by the user and the drafted negotiation email is successfully delivered to their device via a webhook.

## 4. General Workflow
The workflow begins when the user submits their search criteria. An automated script retrieves new listings from external sources, passing them to a rule-based filter that immediately discards any properties violating hard constraints like maximum budget. The remaining candidates are handed to an L3 agent to extract hidden amenities, compute effective costs, and flag potential scams. Once verified as safe, a deterministic ranking script scores and sorts the candidates into a database. 

User manually reviews these top-ranked matches. If he or she approves a listing, an L3 agent drafts a personalized negotiation email, which is then sent to him or her via a webhook for final approval. If fetching data fails, an API drops a connection, or a scam is detected, the workflow logs the exception, halts further automated action on that specific listing, and hands it off to the user for manual review.

## 5. Workflow Diagram
```mermaid
flowchart TD
    %% L0 Trigger
    UI((L0: T1 App User Interface)) --> |Submits Criteria| Fetch[L1: T2 Fetch Listing Data]
    
    %% L1/L2 Pipeline
    Fetch --> Filter{L2: T3 Filter Candidate Listings}
    Filter -- Over Budget --> Discard1[Log & Discard]
    
    %% L3 Agent Processing
    Filter -- Passes Constraints --> Eval[L3: T4 Evaluate Apartment Fit]
    Eval --> Scam[L3: T5 Flag Scam Listings]
    Scam -- High Fraud Risk --> Discard2[Log & Discard]
    
    %% L2 Scoring
    Scam -- Verified Safe --> Score[L2: T6 Calculate Weighted Rank]
    Score --> |Sorts Database| DB[(SQLite Database)]
    
    %% Loops & Exceptions
    Fetch -- Error --> Exception[Handoff Exception to Nicolas Gonzalez]
    Filter -- Error --> Exception
    Eval -- API Error --> Exception
    Scam -- API Error --> Exception
    
    %% L0 Human Review & Action
    DB --> HumanReview{L0: T7 Review Qualified Matches}
    HumanReview -- Reject --> End1((End: No Action))
    
    %% Post-Processing
    HumanReview -- Approve --> Draft[L3: T8 Draft Negotiation Email]
    Draft --> Notify[L1: T9 Trigger Webhook Notification]
    Notify --> End2((End: Alert Sent to User))
