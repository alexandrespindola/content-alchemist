# **Environment Setup Guide: The Content Alchemist**

This guide details the steps to configure all necessary services for the prototype. All services have a generous free tier sufficient for this project.

### **Prerequisites**

* Google Account  
* Self-hosted N8N instance with a public URL (via Cloudflare Tunnel)  
* Deno Account (for Deno Deploy)  
* Heroku Account (for Valkey/Redis)  
* AssemblyAI Account  
* Google AI Studio Account (for Gemini API Key)  
* Jira Developer Account  
* Node.js and npm installed locally  
* clasp installed globally (npm install \-g @google/clasp)

### **Step-by-Step Guide**

1. **Valkey / Redis (via Heroku):**  
   * From your Heroku account, provision the "Heroku Data for Redis" add-on.  
   * In the add-on settings, find and copy your connection credentials (Host, Port, User, Password). You will need these for the N8N Redis node.  
2. **AssemblyAI:**  
   * Create a free account at [assemblyai.com](https://www.assemblyai.com/).  
   * From your dashboard, copy your **API Key**.  
3. **Google Gemini:**  
   * Go to [Google AI Studio](https://aistudio.google.com/).  
   * Log in and click "Get API key".  
   * Create and copy your **API Key**.  
4. **Jira:**  
   * Create a free account at [Jira Software Cloud](https://www.atlassian.com/software/jira/free).  
   * Create an API token in your account: Profile \> Account Settings \> Security \> Create and manage API tokens. Save this token.  
5. **Google Sheets & Apps Script:**  
   * Create a new Spreadsheet.  
   * Open the script editor and save the "Script ID" from the project settings.  
   * Locally, create the project folder.  
   * In the terminal, inside the folder, run clasp login and clasp clone "YOUR\_SCRIPT\_ID".  
6. **N8N:**  
   * Ensure your self-hosted instance is running and accessible via your Cloudflare Tunnel URL.  
   * Create a new workflow.  
   * Add a Webhook node. The production URL will be https://YOUR-N8N-DOMAIN/webhook/....  
   * Add the Redis, AssemblyAI, HTTP Request (for Deno), Google Gemini, Jira, etc., nodes.  
   * Create the necessary credentials for each of these services within N8N.  
7. **Deno Deploy:**  
   * Create a new project on Deno Deploy, linking it to your GitHub repository.  
   * Create a main.ts file locally with your API server code.  
   * Push to GitHub. Deno Deploy will automatically deploy it.  
   * Note the URL of your deployed API.  
8. **Secrets Management:**  
   * **Apps Script:** Use PropertiesService to securely store the N8N webhook URL.  
   * **N8N:** Use N8N's built-in credentials management for all API keys. Do not hardcode them in the nodes.