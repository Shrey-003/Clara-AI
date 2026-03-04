# Clara AI — Zero-Cost Automation Pipeline

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)
![Gemini API](https://img.shields.io/badge/LLM-Gemini_Flash-blue.svg)

## About this Project

**Clara AI** is a robust, zero-cost automation pipeline designed to streamline the transition from customer demo calls to fully-configured AI voice agents. By leveraging the free tier of the Gemini LLM and local orchestration tools like n8n, it extracts structured business requirements from transcripts, generates optimized Retell AI agent specifications, and maintains a versioned history of changes with beautiful diff visualizations.

> Processes demo and onboarding call transcripts into Retell AI agent configurations — fully automated, versioned, with changelogs and a web dashboard.

## Architecture and Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Demo Call       │     │  LLM Extraction  │     │  Prompt          │     │  Retell Agent│
│  Transcript      │────▶│  via Gemini API  │────▶│  Template Engine │────▶│  Spec v1     │
│  (.txt)          │     │  (extract.js)    │     │  (generate-      │     │  (JSON)      │
└─────────────────┘     └──────────────────┘     │   agent-spec.js) │     └──────────────┘
                                                  └──────────────────┘            │
                                                                                  ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Onboarding Call │     │  Diff/Patch      │     │  Regenerate      │     │  Retell Agent│
│  Transcript      │────▶│  Engine          │────▶│  Agent Spec      │────▶│  Spec v2     │
│  (.txt)          │     │  (apply-         │     │  + Changelog     │     │  + Changelog │
└─────────────────┘     │   onboarding.js) │     └──────────────────┘     └──────────────┘
                         └──────────────────┘
```

**Pipeline A** (Demo → v1): `Transcript → extract.js (Gemini LLM) → Account Memo JSON → generate-agent-spec.js → Agent Spec v1`  
**Pipeline B** (Onboarding → v2): `Transcript + v1 Memo → apply-onboarding.js → Updated Memo + Agent Spec v2 + Changelog`

## Quick Start

```bash
# 1. Run the pipeline (processes all 10 transcripts)
node scripts/orchestrator.js

# 2. Launch the dashboard
node scripts/serve-dashboard.js
# → Open http://localhost:3000
```

## How to Plug In Dataset Files

1. Place demo call transcripts (`.txt`) in `dataset/demo/`
2. Place onboarding call transcripts (`.txt`) in `dataset/onboarding/`
3. Each transcript must have a header with `Account: <Company Name>` for matching
4. Run `node scripts/orchestrator.js` — it auto-discovers and processes all files
5. Outputs appear in `outputs/accounts/<account_id>/v1/` and `v2/`

## Project Structure

```
clara-ai-pipeline/
├── dataset/
│   ├── demo/                  # 5 demo call transcripts
│   └── onboarding/            # 5 onboarding call transcripts
├── scripts/
│   ├── extract.js              # LLM-based transcript extraction (Gemini)
│   ├── generate-agent-spec.js  # Retell agent spec via prompt templates
│   ├── apply-onboarding.js     # v1→v2 diff/patch engine + changelog
│   ├── orchestrator.js         # Main batch pipeline runner
│   ├── serve-dashboard.js      # Dashboard HTTP server
│   └── utils.js                # Shared utilities
├── outputs/
│   ├── accounts/<id>/v1/       # v1 account memo, agent spec, prompt
│   ├── accounts/<id>/v2/       # v2 account memo, agent spec, prompt
│   └── pipeline_summary.json   # Batch run summary
├── changelog/<id>/             # Per-account changelogs (JSON + Markdown)
├── dashboard/                  # Web dashboard (HTML/CSS/JS)
├── workflows/                  # n8n workflow export
├── tasks/                      # Task tracker JSON (Asana alternative)
├── docker-compose.yml          # Docker Compose for n8n
├── .env.example                # Environment variables reference
└── README.md
```

## Where Outputs Are Stored

| Output | Location |
|--------|----------|
| Account Memo (v1) | `outputs/accounts/<id>/v1/account_memo.json` |
| Agent Spec (v1) | `outputs/accounts/<id>/v1/agent_spec.json` |
| System Prompt (v1) | `outputs/accounts/<id>/v1/agent_prompt.txt` |
| Account Memo (v2) | `outputs/accounts/<id>/v2/account_memo.json` |
| Agent Spec (v2) | `outputs/accounts/<id>/v2/agent_spec.json` |
| System Prompt (v2) | `outputs/accounts/<id>/v2/agent_prompt.txt` |
| Changelog (JSON) | `changelog/<id>/changes.json` |
| Changelog (Markdown) | `changelog/<id>/changes.md` |
| Pipeline Summary | `outputs/pipeline_summary.json` |
| Task Tracker | `tasks/tracker.json` |

## Pipeline Details

### Pipeline A: Demo Call → v1 Agent
1. Reads demo transcripts from `dataset/demo/`
2. Extracts structured Account Memo via the Gemini LLM API (zero cost free tier)
3. Generates Retell Agent Draft Spec using prompt templates
4. Saves v1 outputs

### Pipeline B: Onboarding → v2 Agent
1. Reads onboarding transcripts from `dataset/onboarding/`
2. Matches to existing v1 memo by account name
3. Extracts onboarding updates and merges with v1 (smart conflict resolution)
4. Computes v1→v2 diff and generates changelog
5. Regenerates v2 agent spec
6. Saves v2 outputs and changelog

### Key Features
- **Zero-cost extraction**: Uses the free tier of the Gemini API for highly accurate narrative extraction
- **Idempotent**: Re-running produces the same outputs, no duplication or corruption
- **Retry logic**: 3 attempts per file with error logging
- **Versioning**: v1/v2 with full diff tracking
- **Changelogs**: JSON + Markdown per account showing what changed and why
- **Task tracker**: Local JSON as Asana alternative
- **Dashboard**: Web UI with diff viewer (bonus)
- **n8n export**: Workflow JSON for visual orchestration

## CLI Options

```bash
# Run full pipeline (demo + onboarding)
node scripts/orchestrator.js

# Run only demo processing (Pipeline A)
node scripts/orchestrator.js --demo-only

# Run only onboarding processing (Pipeline B)
node scripts/orchestrator.js --onboarding-only
```

## Dashboard

```bash
node scripts/serve-dashboard.js
# Open http://localhost:3000
```

Features:
- Account overview with batch metrics
- Account Memo viewer (v1/v2 toggle)
- Agent Spec viewer (v1/v2 toggle)
- System Prompt viewer
- **Diff viewer** showing v1→v2 changes with color coding

---

## n8n Setup (Docker)

### Prerequisites
- Docker and Docker Compose installed

### Steps

```bash
# 1. Start n8n
docker-compose up -d

# 2. Open n8n UI
# → http://localhost:5678
# Login: clara / clara2024

# 3. Import the workflow
# - Go to Workflows → Import from File
# - Select workflows/n8n-workflow.json
# - Click "Import"

# 4. Configure file paths in each Code node to point to /home/node/scripts/
# 5. Execute the workflow manually or via the Schedule Trigger
```

### Environment Variables
See `.env.example` for all configurable variables:
- `GEMINI_API_KEY` — API key for the Gemini LLM
- `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` — n8n login
- `PIPELINE_DATA_DIR` — path to dataset folder
- `PIPELINE_OUTPUT_DIR` — path to outputs folder
- `DASHBOARD_PORT` — port for dashboard server (default: 3000)

### Batch Processing
The orchestrator processes all files in `dataset/demo/` and `dataset/onboarding/` automatically. To run all 10 files:
```bash
node scripts/orchestrator.js
```

---

## Retell Setup

### Creating a Retell Account
1. Go to [https://www.retellai.com/](https://www.retellai.com/)
2. Sign up for a free account
3. Navigate to **Agents** → **Create Agent**

### Importing the Agent Spec into Retell

Since Retell's free tier does not support programmatic agent creation via API, follow these manual steps:

1. **Open the generated prompt file**:
   ```
   outputs/accounts/<account_id>/v2/agent_prompt.txt
   ```
2. **In Retell UI**, create a new agent:
   - Set **Agent Name** to the value in `agent_spec.json` → `agent_name`
   - Paste the contents of `agent_prompt.txt` into the **System Prompt** field
3. **Configure voice settings**:
   - Select a professional, friendly female voice
   - Set speed to 1.0x
4. **Configure call transfer** (if supported):
   - Add transfer phone numbers from the `call_transfer_protocol` section in `agent_spec.json`
   - Set timeout values as specified
5. **Test the agent** by calling the assigned phone number
6. Repeat for each account

### API Key (if using paid tier)
- Go to Settings → API Keys in Retell dashboard
- Copy the API key
- Set `RETELL_API_KEY` in your environment (not needed for free tier)

---

## Technology Stack (Zero Cost)

| Component | Technology | Cost |
|-----------|-----------|------|
| Runtime | Node.js | Free |
| Extraction | Gemini LLM API | Free Tier (zero cost) |
| Agent Spec | Prompt templates | Free |
| Storage | Local JSON files | Free |
| Dashboard | HTML/CSS/JS + Node HTTP | Free |
| Orchestration | Node.js script / n8n (Docker) | Free |
| Task Tracking | Local JSON file | Free |
| n8n | Docker (self-hosted) | Free |

**LLM Usage**: Uses the free tier of the Gemini API (`gemini-2.5-flash`) for extraction. All prompt generation is template-based. Zero paid API calls, adhering to the zero-cost constraint.

---

## Known Limitations

1. **No real-time Retell API integration**: Free tier doesn't support programmatic agent creation; specs must be pasted manually.
2. **No audio transcription**: Pipeline accepts `.txt` transcripts as input. If only audio recordings are provided, a separate transcription step (e.g., Whisper locally) would be needed.
4. **English only**: Extraction patterns are designed for English-language transcripts.
5. **Mock data for 4/5 accounts**: Only one real transcript (Ben's Electric) was available; the remaining 4 demo and 5 onboarding transcripts are realistic mocks.
6. **Jobber integration pending**: Clara's Jobber integration is marked as "coming soon" per the demo call.

## What We Would Improve with Production Access

1. **Retell API integration**: With a paid Retell tier, auto-create and update agents programmatically via their API.
2. **Audio transcription pipeline**: Add a Whisper-based transcription step to accept audio recordings directly.
4. **CRM integrations**: Auto-push account data to Jobber, ServiceTitan, Housecall Pro via their APIs.
5. **Automated QA**: Add validation checks comparing extracted data against the source transcript for accuracy scoring.
6. **Webhook-triggered pipeline**: Auto-run when new transcripts are uploaded (via n8n webhook or file watcher).
7. **Multi-language support**: Extend extraction patterns for French-Canadian and Spanish markets.
8. **Database storage**: Replace local JSON with Supabase or SQLite for better querying and scalability.
9. **Agent testing framework**: Automated test calls to verify agent behavior after deployment.
10. **Asana/project management integration**: Replace local task tracker with actual Asana API for team collaboration.

## Retell Setup Instructions

### Creating a Retell Account
1. Go to [https://www.retellai.com](https://www.retellai.com) and click **Sign Up**
2. Create a free account (no credit card required for sign-up)

### Using the Generated Agent Spec

Retell's free tier does **not** support programmatic agent creation via API. Therefore, the pipeline outputs a **"Retell Agent Spec JSON"** per account that you manually import:

1. Run the pipeline to generate outputs:
   ```bash
   node scripts/orchestrator.js
   ```
2. Open the agent spec for a given account:
   ```
   outputs/accounts/<account_id>/v1/agent_spec.json   # Demo-derived v1
   outputs/accounts/<account_id>/v2/agent_spec.json   # Onboarding-refined v2
   ```
3. In the Retell Dashboard, click **Create Agent** → **Custom Agent**
4. Copy the `system_prompt` field from the agent spec JSON and paste it into the **System Prompt** box
5. Set the **Agent Name** to match the `agent_name` field
6. Configure the **Voice** to match the `voice_style` field (e.g., "professional, warm, conversational")
7. Under **Functions / Tools**, add transfer-call functions as described in the `call_transfer_protocol` field
8. Save the agent

The `agent_prompt.txt` file in each version directory contains the ready-to-paste prompt text.

---

## Accounts Processed

| # | Account | Industry | Location |
|---|---------|----------|----------|
| 1 | Ben's Electric Solutions | Electrical | Calgary, AB |
| 2 | Patriot Fire Protection | Fire Protection | Houston, TX |
| 3 | Summit HVAC Solutions | HVAC | Phoenix, AZ |
| 4 | Coastal Alarm Systems | Security/Alarms | Tampa, FL |
| 5 | Evergreen Mechanical Services | Plumbing/HVAC | Denver, CO |
