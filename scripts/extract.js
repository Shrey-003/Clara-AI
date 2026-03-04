/**
 * Clara AI Pipeline - LLM-Based Extraction Engine
 * Extracts structured Account Memo JSON from demo/onboarding transcripts
 * Uses Gemini API to extract rich narrative context and intent categories
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { extractAccountNameFromHeader, extractDateFromHeader, generateAccountId, log } = require('./utils');
const path = require('path');
const fs = require('fs');

// Load API key from config.json (fallback for n8n sandbox where process.env is unavailable)
let configApiKey = null;
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    configApiKey = config.GEMINI_API_KEY;
  }
} catch (e) {
  // Config file not found or invalid - will fall back to process.env
}

// genAI will be initialized inside the function
let genAI;

const JSON_SCHEMA = `
{
  "business_hours": {
    "days": "Array of days open or null string (e.g. ['Monday', 'Tuesday'])",
    "start_time": "Opening time string or null",
    "end_time": "Closing time string or null",
    "timezone": "Timezone string or null",
    "seasonal_hours": "Any seasonal hours information or null",
    "holiday_policy": "Any holiday policy information or null"
  },
  "office_address": "String or null",
  "timezone": "String or null",
  "contact_info": [
    {
      "name": "String or null",
      "role": "String or null",
      "phone": "String or null",
      "email": "String or null",
      "context": "Brief context about this contact"
    }
  ],
  "services_supported": [
    "Array of intent categories or specific services (e.g., 'new client inquiries', 'quote requests', 'electrical', 'hot tub')"
  ],
  "services_excluded": [
    "Array of explicitly excluded services"
  ],
  "emergency_definition": [
    "Array of specific emergency triggers (e.g., 'G&M Pressure Washing', 'Gas station pumps go down')"
  ],
  "emergency_routing_rules": {
    "escalation_chain": [
      {
        "tier": 1,
        "name": "String",
        "phone": "String"
      }
    ],
    "order": ["Array of routing steps, e.g. 'transfer to Ben's second phone number'"],
    "timeout_seconds": "Number or null",
    "fallback_action": "String or null"
  },
  "non_emergency_routing_rules": {
    "action": "Narrative string detailing how non-emergencies are handled. E.g. 'Clara to answer calls, qualify intent, provide service fee information...'",
    "info_to_collect": ["Array of fields to collect: name, phone_number, etc."],
    "callback_timeframe": "String",
    "notes": "Any other routing notes"
  },
  "call_transfer_rules": {
    "during_hours_transfer": "Target of transfers",
    "transfer_timeout_seconds": "Number",
    "transfer_fail_action": "String",
    "notes": []
  },
  "integration_constraints": [
    "Array of constraints. Be highly specific about CRM logic, cell phone forwarding, etc."
  ],
  "after_hours_flow_summary": "Rich narrative detailing exactly what happens during an after-hours call",
  "office_hours_flow_summary": "Rich narrative detailing exactly what happens during an office-hours call",
  "special_rules": [
    "Any specific business rules"
  ],
  "questions_or_unknowns": [
    "Array of specific questions or missing data points from the transcript"
  ],
  "notes": "EXTREMELY DETAILED NARRATIVE NOTES. Include pricing (e.g. $249/month), corporate structure, 2nd phone number status, Jobber/QuickBooks usage, background info, testing/kickoff dates."
}
`;

const SYSTEM_PROMPT = `
You are an expert AI implementation engineer analyzing transcripts from business phone calls.
Your objective is to extract highly detailed operational configuration for an AI phone agent named Clara.
You are tasked with populating a very specific JSON schema object natively. 
You must capture explicit details, including names of specific commercial clients treated as emergencies, 
exact routing intents, narrative rules around what the business does, pricing of the AI software they were sold,
what CRM/Accounting tools they use (e.g. Jobber, QuickBooks, ServiceTitan), and how phone forwarding works.

Output ONLY valid raw JSON matching the schema provided. Do not include markdown codeblocks or any conversational text.
If a value is not discussed, put null or an empty array.

SCHEMA:
${JSON_SCHEMA}
`;

/**
 * Extract structured data from a transcript using Gemini
 * @param {string} content - Raw transcript text
 * @param {string} type - 'demo' or 'onboarding'
 * @param {string} apiKey - Optional API key (overrides process.env)
 * @returns {Object} Structured account memo
 */
async function extractFromTranscript(content, type = 'demo', apiKey = null) {
  let finalApiKey = apiKey || configApiKey;

  // Last resort: try process.env (works outside n8n sandbox)  
  try { if (!finalApiKey) finalApiKey = process.env.GEMINI_API_KEY; } catch (e) { }

  if (!finalApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required to run the pipeline.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(finalApiKey);
  }

  log('INFO', `Starting ${type} extraction using Gemini LLM API`, { contentLength: content.length });

  const companyName = extractAccountNameFromHeader(content) || 'Unknown Company';
  const accountId = generateAccountId(companyName);
  const date = extractDateFromHeader(content);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.1,
        // Asking Gemini to output JSON explicitly
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
${SYSTEM_PROMPT}

Extract information from this ${type} call transcript:
====== TRANSCRIPT ======
${content}
====== END TRANSCRIPT ======
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let extractedData;
    try {
      extractedData = JSON.parse(responseText.trim());
    } catch (parseErr) {
      log('ERROR', 'Failed to parse LLM JSON output', { error: parseErr.message, text: responseText.substring(0, 100) });
      throw parseErr;
    }

    // Apply metadata 
    const memo = {
      account_id: accountId,
      company_name: companyName,
      extraction_date: date || new Date().toISOString().split('T')[0],
      extraction_type: type,
      ...extractedData
    };

    log('INFO', `Extraction complete for ${companyName}`, { accountId });
    return memo;

  } catch (err) {
    log('ERROR', `Gemini Extraction failed for ${companyName}`, { error: err.message });
    throw err;
  }
}

module.exports = { extractFromTranscript };
