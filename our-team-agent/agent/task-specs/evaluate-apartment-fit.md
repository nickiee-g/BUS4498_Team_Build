# Evaluate Apartment Fit Task Specification

```yaml
# BASIC INFORMATION
task_id: "T4"
task_name: "Evaluate Apartment Fit"
task_owner: "Nicolas Gonzalez"
```

## 1. Task Goal
- **Objective:** Extract hidden amenities, identify nuanced red flags in unstructured rental descriptions, and compute effective costs to determine if an apartment is a true fit.

## 2. Inbound Inputs
### Input 1
- **Input name:** qualified_candidates
- **What it contains:** JSON array containing listings that passed all hard rule checks (price, address, description).
- **Source:** filter-candidate-listings

## 3. Tool Permissions and Boundaries
### Task-Wide Limits
- **Total task timeout:** 60 seconds
- **Maximum tool calls:** 5

### Tool 1
- **Tool name:** calculate_commute_time
- **Tool type:** API request
- **Supports these permitted subtasks:** compute_effective_cost
- **Allowed use:** Send destination address to external Maps API to retrieve transit times.
- **Prohibited use:** Modifying database records or booking transit.
- **Approval required:** None within the allowed use.
- **Timeout per call:** 5 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** Retry on network timeout. On failure, assume max commute time.

## 4. How the Agent Should Reason
### Permitted Subtask 1
- **Subtask name:** extract_hidden_amenities
- **Subtask description:** Reads the unstructured listing text to find implicit fees or missing amenities not in the structured data.
- **Subtask boundary:** Read-only analysis of the provided text.
- **Retry limits:** 0

### Permitted Subtask 2
- **Subtask name:** compute_effective_cost
- **Subtask description:** Calculates the true monthly cost by factoring in the estimated commute time and any hidden fees identified in the text.
- **Subtask boundary:** Cannot modify the original listing price, only appends a new calculated field.
- **Retry limits:** 1

- **Decision guidance:** After each subtask, use its findings to select the permitted subtask most likely to resolve the most important remaining uncertainty. Do not follow a fixed sequence. If no permitted subtask can make useful progress, stop and hand the case to a person.

## 5. When to Stop or Hand Off to a Human
- **Stop successfully when:** All listings in the array have been analyzed and appended with extracted features and commute scores.
- **Hand off early when:** The text is in an unsupported language or severely malformed.
- **Hand off to:** Nicolas Gonzalez

## 6. Outbound Deliverable
- **Status:** Completed or escalated to human.
- **Result or recommendation:** The completed result. If escalated before reaching a supported result, write undetermined.
- **Evidence summary:** The most important evidence supporting the result or explaining why no result could be reached.
- **Subtasks performed:** Permitted subtasks completed, including repeated attempts.
- **Unresolved issues:** Remaining uncertainties or questions; use none only if no unresolved issue remains.
- **Handoff note:** Reason for stopping, unresolved questions, and what the reviewer needs to decide; write "Not applicable" for a completed task.
- **Next task or recipient:** flag-scam-listings
