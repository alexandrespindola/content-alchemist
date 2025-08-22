# **Phased Development Plan: The Content Alchemist Prototype**

This is an intensive plan to build a functional prototype, focusing on the most complex and highest-risk parts first.

### **Phase 1: The System's Core (Backend & AI)**

The goal of this phase is to build the main processing pipeline, ensuring the AI logic and integrations work as expected.

* **\[ \]** Configure accounts for Valkey/Redis and Google Gemini.  
* **\[ \]** Build the core of the **N8N** workflow:  
  * Set up a manual trigger for testing.  
  * Integrate with the **Redis** node to check the cache.  
  * Integrate with the **Deno API** for transcript sanitization.  
* **\[ \]** Integrate the workflow with **Google Gemini**. Send the clean text from Deno to Gemini and generate a draft for an X/Twitter thread.  
* **Phase Goal:** Have an N8N workflow that, from a cleaned transcript, can generate content drafts using Redis to prevent duplicate work.

### **Phase 2: The Entry and Exit Doors (Interfaces & Actions)**

The goal of this phase is to connect the system's "brain" to the outside world, both for receiving requests and for delivering results.

* **\[ \]** Build the interface in **Google Sheets** and the **Apps Script** trigger. Implement the function that sends the transcript to the N8N webhook.  
* **\[ \]** Replace the manual trigger in N8N with the real **Webhook** node.  
* **\[ \]** Implement the **Asset Delivery** part in N8N:  
  * Publish a function in Apps Script as a Web App.  
  * Have N8N call this Web App to create a new **Google Drive Folder** and populate it with multiple **Google Docs** containing the generated Markdown.  
  * Have N8N update the original Spreadsheet with a link to the new folder.  
* **\[ \]** Integrate the creation of the review task in **Jira**.  
* **Phase Goal:** Have a functional end-to-end flow. Be able to start a campaign in Sheets and see a Google Drive folder with documents and a Jira task created automatically.

### **Phase 3: Connection, Testing, and Refinement**

The goal of this phase is to tie all the pieces together, perform end-to-end testing, and refine the product.

* **\[ \]** Implement the **Feedback Loop**: the final call from N8N back to Apps Script to update the Status in the Spreadsheet to "Completed".  
* **\[ \]** Conduct **end-to-end testing**. Initiate 5-10 different campaigns with various transcripts and verify the output is correct on all platforms.  
* **\[ \]** Refine the **Gemini prompts** to improve the quality of the generated content.  
* **\[ \]** Refine the **Redis caching logic**.  
* **\[ \]** Prepare a clear demonstration of the system in action, explaining the business value and architectural decisions.  
* **Phase Goal:** Have a functional, tested prototype and a cohesive, impactful presentation ready.