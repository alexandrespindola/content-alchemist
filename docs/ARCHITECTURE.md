# **System Architecture: The Content Alchemist**

## **Architectural Principles**

* **Robustness over Fragility:** The entire system is triggered by a single, stable input (a URL) and relies on well-documented, stable third-party APIs. No web scraping is involved.  
* **Efficiency and Cost Control:** An optional **Valkey (Redis)** layer can prevent redundant processing of the same content, saving API costs and computation time.  
* **Intelligent Pre-processing:** A **Deno Deploy** microservice (directory `deno-api/`) acts as a "Content Sanitizer," cleaning and structuring text before it goes to the LLM.  
* **AI Chaining:** The system uses Google Gemini for content generation across multiple social channels.  
* **Human-in-the-Loop:** The process starts and ends with a human interface (Google Sheets), enabling straightforward review and handoff in Google Drive.

## **Component Breakdown**

1. **Google Sheets (UI):**  
   * **Function:** Control panel to start campaigns.  
   * **Implementation:** A sheet with columns `Campaign_ID`, `Partner_Name`, `YouTube_URL`, `Transcript_Raw`, `Status`, `Output_Folder`, `Created_At`.
2. **Google Apps Script (Trigger & Delivery) — `apps-script/`:**  
   * **Trigger:** Custom menu (onOpen) + dialog to capture input; sends payload to the N8N webhook.  
   * **Delivery:** Receives responses, writes rows in the sheet, links folders in Drive, and presents URLs to the user when applicable.
3. **N8N (Orchestrator):**  
   * **Setup:** Self-hosted and accessible via Cloudflare Tunnel.  
   * **Workflow:**  
     1. Receives the payload from Apps Script.  
     2. (Optional) Checks Redis for cache hits.  
     3. Calls **Deno Deploy API** to sanitize/structure.  
     4. Prompts **Google Gemini** to generate per-channel content.  
     5. Returns a status or a pre-existing Drive URL if already processed.
4. **Valkey / Redis (Optional Cache):**  
   * **Function:** Key-based cache for duplicates.  
   * **Implementation:** Store the YouTube URL as key and the output folder URL as value.
5. **Deno Deploy API (Content Sanitizer) — `deno-api/`:**  
   * **Function:** Lightweight service to clean timestamps, filler and normalize text.  
   * **Output:** Structured text used to prompt Gemini.
6. **AI Services:**  
   * **Google Gemini:** Generates channel-specific copy (Facebook, Instagram, LinkedIn).

## **End-to-End Flow (Implemented)**

1) User opens the Google Sheet and triggers "Generate Campaign".  
2) Apps Script collects `Partner_Name`, `YouTube_URL` (optional), `Transcript_Raw`, and creates a row with `Status=Processing`.  
3) N8N orchestrates sanitization (Deno API) + generation (Gemini).  
4) N8N replies either with `{ urlExists: false }` (processing) or `{ urlExists: true, url: <drive-folder> }`.  
5) Apps Script updates UI: if a pre-existing URL is returned, it displays a clickable link; otherwise processing continues and the Drive output is linked later.