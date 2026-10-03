# Flag Scam Listings Task Specification

```yaml
# BASIC INFORMATION
task_id: "T5"
task_name: "Flag Scam Listings"
task_owner: "Nicolas Gonzalez"
```

## 1. Task Goal
- **Objective:** Analyze the linguistic patterns and semantics of unstructured listing text to detect fraud indicators and protect the user from scams.

## 2. Inbound Inputs
### Input 1
- **Input name:** evaluated_listings
- **What it contains:** JSON array of listings appended with extracted features and commute scores.
- **Source:** evaluate-apartment-fit

## 3. Tool Permissions and Boundaries
### Task-Wide Limits
- **Total task timeout:** 45 seconds
- **Maximum tool calls:** 3

### Tool 1
- **Tool name:** analyze_fraud_risk
- **Tool type:** language-model call
- **Supports these permitted subtasks:** assess_linguistic_risk
- **Allowed use:** Read listing text to match against known scam heuristics (e.g., wire transfers, abnormal urgency).
- **Prohibited use:** Sending messages to the listing owner.
- **Approval required:** None within the allowed use.
- **Timeout per call:** 10 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** Retry on model API timeout. On failure, mark risk as "Unknown".

## 4. How the Agent Should Reason
### Permitted Subtask 1
- **Subtask name:** assess_linguistic_risk
- **Subtask description:** Evaluates the listing description for suspicious requests or patterns.
- **Subtask boundary:** Only analyzes the text provided in the input payload.
- **Retry limits:** 0

### Permitted Subtask 2
- **Subtask name:** verify_contact_methods
- **Subtask description:** Evaluates the requested contact method or payment demand to see if it matches high-risk scam profiles (e.g., demanding wire transfers before a viewing).
- **Subtask boundary:** Read-only analysis; prohibited from actually contacting the provided email/phone number.
- **Retry limits:** 0

- **Decision guidance:** After each subtask, use its findings to select the permitted subtask most likely to resolve the most important remaining uncertainty. Do not follow a fixed sequence. If no permitted subtask can make useful progress, stop and hand the case to a person.

## 5. When to Stop or Hand Off to a Human
- **Stop successfully when:** All listings have a fraud risk boolean assigned (Safe/Scam) and scam listings are discarded.
- **Hand off early when:** The risk is ambiguous or the model encounters an error.
- **Hand off to:** Nicolas Gonzalez

## 6. Outbound Deliverable
- **Status:** Completed or escalated to human.
- **Result or recommendation:** The completed result. If escalated before reaching a supported result, write undetermined.
- **Evidence summary:** The most important evidence supporting the result or explaining why no result could be reached.
- **Subtasks performed:** Permitted subtasks completed, including repeated attempts.
- **Unresolved issues:** Remaining uncertainties or questions; use none only if no unresolved issue remains.
- **Handoff note:** Reason for stopping, unresolved questions, and what the reviewer needs to decide; write "Not applicable" for a completed task.
- **Next task or recipient:** calculate-weighted-rank
