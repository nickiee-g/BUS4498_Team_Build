# Draft Negotiation Email Task Specification

```yaml
# BASIC INFORMATION
task_id: "T8"
task_name: "Draft Negotiation Email"
task_owner: "Nicolas Gonzalez"
```

## 1. Task Goal
- **Objective:** Generate a personalized, context-aware email draft to the landlord negotiating rent or terms based on the specific weaknesses of the apartment (e.g., lack of in-unit laundry).

## 2. Inbound Inputs
### Input 1
- **Input name:** approved_listing_target
- **What it contains:** JSON object of the approved apartment and its previously extracted features.
- **Source:** review-qualified-matches

## 3. Tool Permissions and Boundaries
### Task-Wide Limits
- **Total task timeout:** 60 seconds
- **Maximum tool calls:** 2

### Tool 1
- **Tool name:** generate_email_copy
- **Tool type:** language-model call
- **Supports these permitted subtasks:** synthesize_negotiation_points
- **Allowed use:** Read the listing data to draft polite email text.
- **Prohibited use:** Sending the email directly to the landlord.
- **Approval required:** None within the allowed use (the output is just a draft).
- **Timeout per call:** 15 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** Retry on API timeout. On failure, hand off to human.

## 4. How the Agent Should Reason
### Permitted Subtask 1
- **Subtask name:** synthesize_negotiation_points
- **Subtask description:** Reviews the apartment's missing amenities or long commute time to form logical negotiation arguments.
- **Subtask boundary:** Must maintain a polite, professional tone.
- **Retry limits:** 0

- **Decision guidance:** After each subtask, use its findings to select the permitted subtask most likely to resolve the most important remaining uncertainty. Do not follow a fixed sequence. If no permitted subtask can make useful progress, stop and hand the case to a person.

## 5. When to Stop or Hand Off to a Human
- **Stop successfully when:** A complete, professional email draft is generated.
- **Hand off early when:** Contact information for the listing is completely missing.
- **Hand off to:** Nicolas Gonzalez

## 6. Outbound Deliverable
- **Status:** Completed or escalated to human.
- **Result or recommendation:** The completed result. If escalated before reaching a supported result, write undetermined.
- **Evidence summary:** The most important evidence supporting the result or explaining why no result could be reached.
- **Subtasks performed:** Permitted subtasks completed, including repeated attempts.
- **Unresolved issues:** Remaining uncertainties or questions; use none only if no unresolved issue remains.
- **Handoff note:** Reason for stopping, unresolved questions, and what the reviewer needs to decide; write "Not applicable" for a completed task.
- **Next task or recipient:** trigger-webhook-notification
