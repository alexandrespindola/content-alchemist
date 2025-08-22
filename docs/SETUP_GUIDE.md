# **Environment Setup Guide: The Content Alchemist**

This guide details the steps to configure all necessary services for the prototype. All services have a generous free tier sufficient for this project.

### **Prerequisites**

* Google Account  
* Self-hosted N8N instance with a public URL (via Cloudflare Tunnel)  
* Deno Account (for Deno Deploy)  
* (Optional) Heroku Account (for Valkey/Redis)  
* Google AI Studio Account (for Gemini API Key)  
* Node.js and npm installed locally  
* clasp installed globally (npm install -g @google/clasp)

### **Step-by-Step Guide**

1. **Deno Deploy (`deno-api/`):**  
   * Create a new project on Deno Deploy (link it to your repo if desired).  
   * Ensure `deno-api/cleaner.ts` is deployed and reachable via HTTPS.  
   * Note the URL of your deployed API (use it in N8N HTTP Request node).
2. **Google Gemini:**  
   * Go to [Google AI Studio](https://aistudio.google.com/).  
   * Log in and click "Get API key".  
   * Create and copy your **API Key**.  
3. **N8N:**  
   * Ensure your self-hosted instance is running and accessible via your Cloudflare Tunnel URL.  
   * Create a new workflow.  
   * Add a Webhook node for Apps Script requests.  
   * Add HTTP Request (Deno), Google Gemini, and (optional) Redis nodes.  
   * Create credentials for each of these services within N8N.
4. **(Optional) Valkey / Redis:**  
   * Provision a Redis instance (e.g., on Heroku) and configure the credentials in N8N.  
5. **Google Sheets & Apps Script (`apps-script/`):**  
   * Create a new Spreadsheet.  
   * Open the script editor and save the "Script ID" from the project settings.  
   * Locally, run: `clasp login` and `clasp clone "YOUR_SCRIPT_ID"`.  
   * Push the contents of `apps-script/` with `clasp push`.  
   * In Script Properties, optionally set `N8N_WEBHOOK_URL`.
6. **Secrets Management:**  
   * **Apps Script:** Use PropertiesService for the `N8N_WEBHOOK_URL` if not using the CONFIG file.  
   * **N8N:** Use N8N's built-in credentials management. Do not hardcode keys.