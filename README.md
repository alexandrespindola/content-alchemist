# **The Content Alchemist: AI-Augmented Marketing Campaign Generator**

## **Project Purpose**

This is a portfolio project demonstrating a modern, event-driven, and AI-centric automation architecture. The goal is to showcase the ability to orchestrate multiple cloud services and AI models to solve a complex business problem: scaling marketing content creation.

## **Application Objective (The "What")**

The Content Alchemist is an automated pipeline that ingests a single content asset (a YouTube video URL) and transmutes it into a complete, multi-channel marketing campaign. The system transcribes the video, analyzes its content to extract key themes, and then uses a chain of AI models to generate tailored copy for different platforms (a blog post, and posts for X/Twitter, Facebook, and LinkedIn). The entire process is initiated and managed from a simple Google Sheets interface.

## **Core Tech Stack**

* **Human Interface:** Google Sheets  
* **Trigger & Final Delivery:** Google Apps Script  
* **Workflow Orchestration:** N8N (self-hosted via Cloudflare Tunnel)  
* **Rate Limiting & Caching:** Valkey / Redis (via Heroku)  
* **Data Pre-processing Service:** Deno Deploy (TypeScript)  
* **AI \- Transcription:** AssemblyAI  
* **AI \- Content Generation & Analysis:** Google Gemini  
* **Final Business Action:** Google Docs, Jira  
* **Optional RAG Extension:** Supabase \+ pgvector

## **High-Level Architecture**

graph TD  
    A\[Google Sheets \+ Apps Script\] \-- 1\. Initiate Campaign \--\> B(N8N \- Ingestion);  
    B \-- 2\. Check Cache \--\> C{Valkey/Redis};  
    B \-- 3\. Transcribe \--\> D(AssemblyAI);  
    B \-- 4\. Sanitize & Structure \--\> E(Deno Deploy API);  
    B \-- 5\. Generate Content \--\> F(Google Gemini);  
    B \-- 6\. Deliver Assets \--\> G(Apps Script \- Google Docs);  
    B \-- 7\. Create Review Task \--\> H(Jira);

## **Documentation Structure**

* **1\. README.md** (This file): Overview, objectives, and stack.  
* **2\. ARCHITECTURE.md**: A deep dive into the architecture, data flow, and models.  
* **3\. SETUP\_GUIDE.md**: A step-by-step guide to configure the entire environment.  
* **4\. DEVELOPMENT\_PLAN.md**: A phased roadmap for building the prototype.  
* **5\. GEMINI\_CONTEXT.md**: An extensive summary of the project's strategic and architectural decisions.