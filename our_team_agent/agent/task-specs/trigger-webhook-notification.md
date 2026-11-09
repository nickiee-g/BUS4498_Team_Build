# Display and Dispatch Inquiry Task Specification

## Basic Information

- **Task ID:** T9
- **Task name:** Display and Dispatch Inquiry
- **Task level:** L1
- **Task type:** Act (UI / Dispatch)
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This task takes the drafted landlord inquiry payload from T8 and displays it on the student's dashboard screen for final review and editing. It provides one-click options to copy the email body or send it via an integrated notification/webhook, ensuring the student maintains complete oversight before any outreach is dispatched.

## 2. Inputs

### Input 1

- **Input name:** drafted_email_payload
- **Contents and format:** JSON payload containing `listing_id`, `recipient_email`, `subject`, and `body`.
- **Source:** draft-negotiation-email (T8)

- **If a required input is missing or invalid:** Halt the task, display an "Empty Email Payload" error, and prompt the student to re-generate the draft.

## 3. Outputs

### Output 1

- **Output name:** inquiry_delivery_status
- **Contents and format:** A JSON object confirming student action:
  ```json
  {
    "listing_id": "SLO-2026-0042",
    "status": "Displayed_And_Approved",
    "delivery_channel": "Dashboard_Copy",
    "timestamp": "2026-11-08T20:50:00Z"
  }
  ```
- **Next task or recipient:** End of Workflow (Workflow complete)
- **Complete when:** The student reviews the draft and either copies the text or dispatches the notification.

## 4. Planned Tools

### Tool 1

- **Tool name:** display_inquiry_card
- **Input:** drafted_email_payload
- **Output:** inquiry_delivery_status
- **Implementation Route:** UI component / functions
- **Integration approach:** direct integration
- **Role in this task:** Renders the editable email draft in the UI with a "Copy to Clipboard" button and an optional webhook dispatch trigger.
- **Task timeout:** 10 seconds
- **Maximum retries:** 2
- **Retry only when:** Network or webhook delivery timeout.
- **On timeout, exhausted retries, or an error that cannot be retried:** Display an in-app error notice with a manual "Retry Dispatch" button so delivery failures are never treated as silent successes.
