# **System Architecture: The Content Alchemist**

## **Architectural Principles**

* **Robustness over Fragility:** The entire system is triggered by a single, stable input (a URL) and relies exclusively on well-documented, stable third-party APIs. No web scraping is involved.  
* **Efficiency and Cost Control:** A **Valkey (Redis)** layer is introduced to prevent redundant processing of the same content, saving significant API costs and computation time.  
* **Intelligent Pre-processing:** A **Deno Deploy** microservice acts as a "Content Sanitizer," cleaning and structuring transcribed text *before* it's sent to the main LLM. This results in better, more consistent outputs from the generative AI.  
* **AI Chaining:** The system uses a sequence of specialized AI services (AssemblyAI for transcription, Gemini for generation) in a logical chain, demonstrating an understanding of using the right tool for each cognitive task.  
* **Human-in-the-Loop:** The process starts and ends with a human interface (Google Sheets), creating a practical tool that empowers a marketing team rather than fully replacing it.

## **Component Breakdown**

1. **Google Sheets (UI):**  
   * **Function:** The control panel for the marketing team.  
   * **Implementation:** A sheet with columns Campaign\_ID, Source\_YouTube\_URL, Partner\_Name, Status, and an output column for the generated content folder (Link\_to\_Google\_Drive\_Folder).  
2. **Google Apps Script (Trigger & Delivery):**  
   * **Trigger:** A custom menu ("Generate Campaign") created with onOpen(). The menu function grabs the URL from the active row and sends it to the N8N webhook.  
   * **Delivery:** A separate function, published as a Web App (doPost(e)), receives the final generated content from N8N. It creates a new folder in Google Drive for the campaign and populates it with multiple **Google Docs**, each containing the Markdown for a specific platform (Blog Post, X/Twitter, etc.).  
3. **N8N (Orchestrator):**  
   * **Setup:** A self-hosted instance accessible via a secure Cloudflare Tunnel URL.  
   * **Workflow:** A single workflow orchestrates the entire process:  
     1. Receives the URL from the Apps Script webhook.  
     2. Checks Valkey/Redis to see if this URL has been processed recently.  
     3. Calls AssemblyAI to transcribe the video.  
     4. Sends the raw transcript to the Deno Deploy API for cleaning.  
     5. Uses the clean, structured text to prompt Google Gemini for each content format.  
     6. Calls the Apps Script Web App to deliver the generated assets.  
     7. Creates a review task in Jira.  
     8. Updates Valkey/Redis to cache the result.  
4. **Valkey / Redis (Cache & Rate Limiter):**  
   * **Function:** Acts as the system's short-term memory.  
   * **Setup:** An instance running on Heroku, sufficient for development and testing.  
   * **Implementation:** Before processing, N8N checks if the YouTube URL exists as a key. If it does, the workflow can stop or return the cached result, preventing redundant API calls.  
5. **Deno Deploy API (Content Sanitizer & Structurer):**  
   * **Function:** A lightweight TypeScript microservice that receives a raw transcript.  
   * **Implementation:** It performs crucial pre-processing: removes timestamps, speaker labels, and filler words. It can also use heuristics to identify and structure the text into logical sections (e.g., "Introduction," "Main Points," "Conclusion"). This structured output is then sent to Gemini.  
6. **AI Services (The Creative Core):**  
   * **AssemblyAI:** The specialist for turning speech into text. Its native N8N node makes integration simple.  
   * **Google Gemini:** The generalist for creative generation. It receives clean, structured text from the Deno service, which allows for simpler, more effective prompts to generate the blog post, X/Twitter thread, and other social media copy.  
7. **Jira (The Action Item):**  
   * **Function:** The final step. It creates a task for a human ("Review and schedule campaign for \[Partner\_Name\]"), ensuring the generated content is reviewed before going live.  
8. **(Optional) Supabase \+ pgvector (RAG Extension):**  
   * If time permits, you can store every transcript and its generated content in Supabase. The transcript can be converted to an embedding and stored with pgvector. This allows for a future feature where you can ask, "Find me all past campaigns we generated that are similar to this new video."