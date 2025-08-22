# **Phased Development Plan: The Content Alchemist Prototype**

This is a focused plan to build a functional prototype, prioritizing the core flow.

### **Phase 1: The System's Core (Backend & AI)**

The goal is to build the main processing pipeline, ensuring the AI logic and integrations work as expected.

* [ ] Build the core **N8N** workflow:
  * Manual trigger for testing.
  * (Optional) Integrate **Redis** for cache key checks.
  * Integrate the **Deno API** for transcript sanitization (`deno-api/`).
  * Integrate **Google Gemini** to generate Facebook/Instagram/LinkedIn drafts.
* [ ] Define the response contract from N8N to Apps Script:
  * `{ urlExists: false }` or `{ urlExists: true, url: <drive-folder> }`.

### **Phase 2: The Entry and Exit Doors (Interfaces & Actions)**

Connect the system's "brain" to the outside world.

* [ ] **Google Sheets + Apps Script** (`apps-script/`):
  * Popup form to collect inputs (`Partner_Name`, `YouTube_URL`, `Transcript_Raw`).
  * Write a row with `Status=Processing`.
  * Call the N8N webhook and handle its response.
  * If a pre-existing URL is returned, show it as a clickable link.
  * Auto-link the `Output_Folder` cell to an existing Drive folder when the name matches a sibling folder of the spreadsheet.
* [ ] Replace manual trigger in N8N with Webhook.
* [ ] Delivery: Generate HTML → convert to plain text/Google Docs and save in a Drive folder.

### **Phase 3: Connection, Testing, and Refinement**

Tie the pieces together, test, and refine.

* [ ] Feedback loop: N8N updates `Status` (and folder URL) upon completion.
* [ ] End-to-end testing with different transcripts.
* [ ] Refine Gemini prompts to improve quality.
* [ ] Refine optional Redis caching logic.
* [ ] Prepare a clear demo of the workflow in action.
