# Clara AI Pipeline - Recording Guide (Loom Video)

This guide will help you record a high-quality 3-5 minute video to demonstrate your work.

## Video Structure (Suggested)

### 1. Introduction (30s)
*   **What to show**: Your VS Code editor with the project structure.
*   **What to say**: "Hi, I'm [Your Name], and this is my Clara AI Pipeline. It's a zero-cost, fully automated system that takes call transcripts and turns them into production-ready Retell AI agent configurations."

### 2. The Orchestrator & LLM Integration (1m)
*   **What to show**: `scripts/extract.js` and the `README.md` architecture diagram.
*   **What to say**: "I replaced the standard rule-based extraction with a powerful **Gemini-powered LLM engine**. By using the Gemini free tier, I've kept the pipeline at zero cost while achieving high-quality narrative extraction. You can see the system prompt here that guides the AI to extract specific operational details like routing rules and emergency triggers."

### 3. n8n Automation (1.5m)
*   **What to show**: Your browser with n8n at `http://localhost:5678`.
*   **What to say**: "The entire pipeline is automated using **n8n running in Docker**. Here is the workflow: it reads transcripts, calls the extraction scripts, and stores versioned outputs. Let's see it in action."
*   **Action**: Click "Execute workflow" and wait for the green checkmarks.
*   **Action**: Double-click the `Extract Demo Data` node and show the "Output" tab to reveal the extracted JSON from Gemini.

### 4. Versioned Outputs & Changelog (1m)
*   **What to show**: The `outputs/` and `changelog/` folders in VS Code.
*   **What to say**: "The pipeline generates versioned artifacts. Here is the **v1 Account Memo** from the demo call, and here is the **v2 Memo** after processing the onboarding call. Most importantly, it generates this **narrative changelog**."
*   **Action**: Open `changelog/ben_s_electric_solutions/changes.md` and scroll through it.

### 5. Bonus: Web Dashboard (30s)
*   **What to show**: The Dashboard (run `node scripts/serve-dashboard.js` and open `http://localhost:3000`).
*   **What to say**: "As a bonus, I built a web dashboard that allows you to view all accounts and see a focused diff of what changed between v1 and v2, making it easy to review the AI's updates."

### 6. Conclusion (15s)
*   **What to say**: "This pipeline is robust, reproducible via Docker, and leverages modern LLMs to provide a premium experience for onboarding Retell AI agents. Thanks for watching!"

---

## Pro-Tips for Success:
1.  **Preparation**: Make sure your n8n workflow is green and successful *before* you start recording.
2.  **Dashboard**: If you haven't run the dashboard yet, start it with `node scripts/serve-dashboard.js` and have it open in a tab.
3.  **Visuals**: Use a clear font size in VS Code (Ctrl +) so the reviewer can read your code and outputs.
