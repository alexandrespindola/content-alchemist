# **Project Context: The Content Alchemist**

## **User Profile & Goal**

* **User:** A freelance developer with 3 years of experience, specializing in N8N and automation.  
* **Objective:** To build a high-impact portfolio project to secure a first long-term "JS Automation Developer" role in the European tech market. The project is intended for a technical interview with a large, "AI-First" company.

## **Project Evolution & Key Decisions**

1. **Initial Idea ("Horizon Scanner"):** The first concept involved scraping public data sources (Reddit, news sites) to find emerging market trends.  
2. **Pivot:** This idea was **aborted** due to the fragility and unreliability of web scraping (IP blocks, inconsistent data).  
3. **Current Idea ("The Content Alchemist"):** The focus shifted to a more robust, API-driven architecture. The system ingests a single, stable input (a YouTube URL) and uses a chain of reliable services to generate a multi-channel marketing campaign. This approach is deterministic and suitable for a short-term prototype.

## **Core Architectural Philosophy**

* **Monorepo Structure:** All project code (Apps Script, Deno API) and documentation will reside in a single GitHub repository for simplicity and unified version control.  
* **Decoupled & Event-Driven:** The system uses a message queue (**Valkey/Redis on Heroku**) to decouple the initial request (ingestion) from the main processing logic. This makes the architecture resilient and scalable.  
* **AI Chaining:** The project deliberately uses a sequence of specialized AI models: **AssemblyAI** for transcription and **Google Gemini** for creative generation and analysis.  
* **Intelligent Pre-processing:** A lightweight **Deno Deploy** microservice is used to sanitize and structure the raw transcript before it is passed to the main LLM, improving the quality and consistency of the final output.  
* **Human-in-the-Loop:** **Google Apps Script** serves as the primary interface, allowing a non-technical user to initiate and review the automated process, making it a practical business tool.

## **Key Technical Details & Understandings**

* **N8N Setup:** The user is running a self-hosted N8N instance exposed to the internet via a **Cloudflare Tunnel**, providing full control. Workflows are backed up as JSON files in the repository.  
* **Apps Script Development:** The user understands the clasp CLI for local development, the push vs. deploy cycle, and the use of /dev vs. /exec URLs for testing. It's understood that Apps Script is not a Node.js environment but can serve as a full-stack, serverless platform with Google Sheets acting as a simple database.  
* **AI Workflow:** The user employs a three-layered AI methodology:  
  1. **Strategic AI (This Chat):** For high-level architecture, planning, and brainstorming.  
  2. **Co-pilot AI (Cursor IDE):** For real-time code generation, refactoring, and debugging.  
  3. **Specialist AI (N8N Nodes):** For specific, embedded tasks within the automation workflow.