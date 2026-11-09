# Draft Landlord Inquiry Task Specification

```yaml
# BASIC INFORMATION
task_id: "T8"
task_name: "Draft Landlord Inquiry"
task_level: "L2"
task_owner: "Nicolas Gonzalez"
```

## 1. Task Goal
- **Objective:** Generate a polite, personalized, professional inquiry email draft to the landlord or property manager for the student's selected property. The draft introduces the student as a Cal Poly student, references specific property details (e.g., move-in timeline, parking, lease length), and requests a tour without legally binding the student.

## 2. Inbound Inputs
### Input 1
- **Input name:** approved_listing_target
- **What it contains:** JSON object containing `listing_id`, `listing_url`, `address`, `contact_email`, and `extracted_amenities`.
- **Source:** review-qualified-matches (T7)

## 3. Tool Permissions and Boundaries
### Task-Wide Limits
- **Total task timeout:** 15 seconds
- **Maximum tool calls:** 1

### Tool 1
- **Tool name:** generate_email_copy
- **Tool type:** language-model call (OpenAI GPT-6 Luna / ChatGPT API)
- **Supports these permitted subtasks:** `draft_landlord_inquiry`
- **Allowed use:** Synthesizes listing details and user preferences into a polite email inquiry body.
- **Prohibited use:** Sending the email directly to the recipient or making financial/legal commitments.
- **Approval required:** None within allowed use (output is strictly an un-sent draft).
- **Timeout per call:** 10 seconds
- **Maximum retries per call:** 1
- **Retry conditions and failure response:** On API failure, prompt user to write email manually.

## 4. How the Agent Should Reason
### Permitted Subtask 1
- **Subtask name:** draft_landlord_inquiry
- **Subtask description:** Composes email subject line and body using a respectful, student-oriented tone, referencing the listing address and move-in timeline.
- **Subtask boundary:** Must never claim to be anyone other than the student user.
- **Retry limits:** 1

## 5. When to Stop or Hand Off to a Human
- **Stop successfully when:** A complete, professional email draft is produced and formatted.
- **Hand off to Nicolas Gonzalez when:** The LLM API fails repeatedly. In this case, the system provides a standard template pre-populated with the address and contact email.

## 6. Outbound Deliverable
- **Status:** `Completed` or `Template_Fallback`
- **Deliverable name:** `drafted_email_payload`
- **Schema:**
  ```json
  {
    "listing_id": "SLO-2026-0042",
    "listing_url": "https://example.com/listings/slo-0042",
    "recipient_email": "manager@foothillrentals.com",
    "subject": "Inquiry: 1-Bedroom Rental on Foothill Blvd - Cal Poly Student",
    "body": "Dear Property Manager,\n\nI hope this email finds you well. I am a Cal Poly student looking for off-campus housing for the upcoming academic term and came across your 1-bedroom listing at 1250 Foothill Blvd.\n\nI am very interested in scheduling an in-person tour at your earliest convenience. Could you please confirm if the unit is available for a Fall lease and what the application process entails?\n\nThank you for your time and assistance.\n\nBest regards,\nNicolas Gonzalez\nCal Poly Student",
    "generation_evidence": "Generated personalized inquiry referencing Foothill Blvd address and Fall student move-in timeline."
  }
  ```
- **Next task or recipient:** trigger-webhook-notification / display-inquiry (T9)
