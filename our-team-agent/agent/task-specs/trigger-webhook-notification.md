# Trigger Webhook Notification Task Specification

## Basic Information

- **Task ID:** trigger-webhook-notification
- **Task name:** Trigger Webhook Notification
- **Task type:** Act
- **Task owner:** Nicolas Gonzalez

## 1. Task Description

This is a deterministic task that packages the finalized email draft and the apartment details into a JSON payload and pushes an HTTP POST request to a Webhook API to alert the user.

## 2. Inputs

### Input 1

- **Input name:** drafted_email_payload
- **Contents and format:** JSON payload containing the text of the drafted email.
- **Source:** draft-negotiation-email

- **If a required input is missing or invalid:** Log an empty payload error and halt the workflow.

## 3. Outputs

### Output 1

- **Output name:** webhook_delivery_receipt
- **Contents and format:** A 200 OK HTTP response code indicating successful delivery.
- **Next task or recipient:** End of Workflow
- **Complete when:** The webhook service confirms receipt of the POST request.

## 4. Planned Tools

### Tool 1

- **Tool name:** post_to_webhook
- **Input:** drafted_email_payload
- **Output:** webhook_delivery_receipt
- **Implementation Route:** web API calls
- **Integration approach:** direct integration
- **Role in this task:** Executes the network request to push the notification to the user's device.
- **Task timeout:** 15 seconds
- **Maximum retries:** 3
- **Retry only when:** The destination server returns a 5xx error or times out. Wait 5 seconds between retries.
- **On timeout, exhausted retries, or an error that cannot be retried:** Log a delivery failure.
