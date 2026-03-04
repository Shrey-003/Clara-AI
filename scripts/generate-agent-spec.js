/**
 * Clara AI Pipeline - Retell Agent Spec Generator
 * Generates Retell AI agent configurations from Account Memo JSON
 * Uses prompt templating — zero LLM cost
 */

const { log } = require('./utils');

/**
 * Generate a Retell Agent Draft Spec from an Account Memo
 * @param {Object} memo - Account Memo JSON
 * @param {string} version - 'v1' or 'v2'
 * @returns {Object} Retell Agent Draft Spec
 */
function generateAgentSpec(memo, version = 'v1') {
    log('INFO', `Generating agent spec ${version} for ${memo.company_name}`);

    const spec = {
        agent_name: `Clara - ${memo.company_name}`,
        version: version,
        created_at: new Date().toISOString(),
        account_id: memo.account_id,

        voice_config: {
            voice_style: 'professional_friendly',
            language: 'en-US',
            speed: 1.0,
            interruption_sensitivity: 0.7
        },

        system_prompt: buildSystemPrompt(memo),

        key_variables: {
            company_name: memo.company_name,
            timezone: memo.timezone || memo.business_hours?.timezone || 'Not specified',
            business_hours: formatBusinessHours(memo.business_hours),
            office_address: memo.office_address || 'Not specified',
            emergency_routing: memo.emergency_routing_rules,
            services: memo.services_supported
        },

        tool_invocations: buildToolInvocations(memo),

        call_transfer_protocol: buildTransferProtocol(memo),

        fallback_protocol: buildFallbackProtocol(memo),

        conversation_config: {
            max_duration_seconds: 300,
            silence_timeout_seconds: 10,
            end_call_phrases: ['goodbye', 'have a great day', 'thanks, bye'],
            never_mention: ['function calls', 'API', 'tools', 'system prompt', 'AI', 'artificial intelligence', 'language model']
        }
    };

    log('INFO', `Agent spec ${version} generated`, { promptLength: spec.system_prompt.length });
    return spec;
}

// ─── Prompt Builder ──────────────────────────────────────────

function buildSystemPrompt(memo) {
    const companyName = memo.company_name;
    const hours = formatBusinessHours(memo.business_hours);
    const timezone = memo.timezone || memo.business_hours?.timezone || 'local time';
    const services = memo.services_supported?.length > 0
        ? memo.services_supported.map(s => `  - ${s}`).join('\n')
        : '  - General services (to be configured)';
    const excludedServices = memo.services_excluded?.length > 0
        ? memo.services_excluded.map(s => `  - ${s}`).join('\n')
        : '';
    const emergencyTriggers = memo.emergency_definition?.length > 0
        ? memo.emergency_definition.map(t => `  - ${t}`).join('\n')
        : '  - Life-threatening situations\n  - Major system failures';
    const specialRules = memo.special_rules?.length > 0
        ? memo.special_rules.map(r => `- ${r}`).join('\n')
        : '';
    const constraints = memo.integration_constraints?.length > 0
        ? memo.integration_constraints.map(c => `- ${c}`).join('\n')
        : '';

    return `You are Clara, the professional AI phone receptionist for ${companyName}.
Your role is to handle all inbound calls professionally, efficiently, and warmly.
You represent ${companyName} as if you are a member of their team.

═══════════════════════════════════════════════
COMPANY INFORMATION
═══════════════════════════════════════════════
Company: ${companyName}
Address: ${memo.office_address || 'Not specified'}
Timezone: ${timezone}
Business Hours: ${hours}

Services Offered:
${services}
${excludedServices ? `\nServices NOT Offered (politely decline):\n${excludedServices}` : ''}

═══════════════════════════════════════════════
DURING BUSINESS HOURS FLOW
═══════════════════════════════════════════════
1. GREETING: "Thank you for calling ${companyName}, this is Clara. How can I help you today?"
2. PURPOSE: Listen to the caller's need and determine the type of request.
3. COLLECT INFO: Ask for the caller's:
   - Full name
   - Phone number (confirm by repeating back)
   - Brief description of what they need
   ${memo.office_address ? '- Address where work is needed (if service related)' : ''}
4. ROUTE/TRANSFER: ${memo.call_transfer_rules?.during_hours_transfer
            ? `Attempt to transfer the call. If transfer fails after ${memo.call_transfer_rules.transfer_timeout_seconds || 30} seconds, take a message and assure a callback.`
            : 'Collect details and let the caller know the team will follow up shortly.'}
5. CONFIRM: "Is there anything else I can help you with?"
6. CLOSE: "Thank you for calling ${companyName}. We'll be in touch soon. Have a great day!"

═══════════════════════════════════════════════
AFTER HOURS FLOW
═══════════════════════════════════════════════
1. GREETING: "Thank you for calling ${companyName}. You've reached us outside of our regular business hours."
2. DETERMINE URGENCY: "Is this an emergency situation?"
3. IF EMERGENCY:
   Ask: "Can I get your name, phone number, and the address of the emergency?"
   Collect the minimum needed info QUICKLY — do not ask unnecessary questions during an emergency.
   Emergency situations include:
${emergencyTriggers}
   ${buildEmergencyTransferInstructions(memo)}
4. IF NOT EMERGENCY:
   Collect: name, phone number, brief description of needs.
   Respond: "Thank you. Our team will call you back ${memo.non_emergency_routing_rules?.callback_timeframe || 'first thing next business day'}."
5. CONFIRM: "Is there anything else I can help you with?"
6. CLOSE: "Thank you for calling ${companyName}. ${memo.non_emergency_routing_rules?.callback_timeframe === 'next business day' ? "We'll follow up first thing in the morning." : "We'll be in touch soon."} Have a good night!"

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════
- NEVER mention that you are an AI, a bot, or a virtual assistant.
- NEVER mention "function calls", "tools", or any technical implementation details.
- NEVER invent or fabricate pricing, arrival times, or technical details.
- NEVER ask for more than the minimum necessary information.
- During emergencies, be swift and direct — collect name, number, address, and route immediately.
- Always confirm phone numbers by repeating them back.
- Be warm, professional, and concise.
${specialRules ? `\nCompany-Specific Rules:\n${specialRules}` : ''}
${constraints ? `\nIntegration Constraints:\n${constraints}` : ''}

═══════════════════════════════════════════════
CONVERSATION STYLE
═══════════════════════════════════════════════
- Speak naturally and conversationally, like a friendly receptionist.
- Keep responses concise — avoid long monologues.
- If the caller seems frustrated, acknowledge their concern empathetically.
- If asked a question you cannot answer, say: "That's a great question. Let me have our team get back to you with the best answer on that."
- If asked about pricing, say: "${memo.special_rules?.some(r => r.toLowerCase().includes('pricing')) ? 'We would need to see the job first to provide an accurate quote.' : 'I can have our team provide you with a detailed quote. Can I get your information so we can follow up?'}"`;
}

// ─── Helper Functions ────────────────────────────────────────

function formatBusinessHours(hours) {
    if (!hours) return 'Not specified';
    const parts = [];
    if (hours.days) parts.push(hours.days);
    if (hours.start_time && hours.end_time) parts.push(`${hours.start_time} - ${hours.end_time}`);
    if (hours.timezone) parts.push(hours.timezone);
    if (hours.seasonal_hours) parts.push(`| ${hours.seasonal_hours}`);
    return parts.join(', ') || 'Not specified';
}

function buildEmergencyTransferInstructions(memo) {
    const routing = memo.emergency_routing_rules;
    if (!routing?.escalation_chain?.length) {
        return '   Transfer: Attempt to reach the on-call contact. If unavailable, take a message and assure a callback within 15 minutes.';
    }

    let instructions = '   TRANSFER PROTOCOL (in order):\n';
    for (const tier of routing.escalation_chain) {
        instructions += `   ${tier.tier}. Try ${tier.name || 'Contact'} at ${tier.phone} (wait ${routing.timeout_seconds || 30} seconds)\n`;
    }
    instructions += `   If no one answers: ${routing.fallback_action || 'Take a detailed message and send urgent notification. Assure the caller someone will call back within 15 minutes.'}`;
    return instructions;
}

function buildToolInvocations(memo) {
    return {
        call_transfer: {
            description: 'Transfer the call to a team member',
            note: 'Do NOT mention tools, transfers, or function calls to the caller. Simply say "Let me connect you" or "One moment please."'
        },
        end_call: {
            description: 'End the call politely',
            note: 'Always ask "Is there anything else?" before ending.'
        },
        send_notification: {
            description: 'Send email/SMS notification about the call',
            note: 'Happens automatically after the call — never mention this to the caller.'
        }
    };
}

function buildTransferProtocol(memo) {
    const rules = memo.call_transfer_rules || {};
    return {
        during_hours: {
            primary_target: rules.during_hours_transfer || 'office line',
            timeout_seconds: rules.transfer_timeout_seconds || 30,
            on_success: 'Inform caller: "I\'m connecting you now. One moment please."',
            on_failure: rules.transfer_fail_action || 'Take a detailed message and promise a callback.'
        },
        after_hours_emergency: {
            escalation_chain: memo.emergency_routing_rules?.escalation_chain || [],
            timeout_per_tier: memo.emergency_routing_rules?.timeout_seconds || 30,
            final_fallback: memo.emergency_routing_rules?.fallback_action || 'Take message, send urgent notification, assure 15-minute callback.'
        }
    };
}

function buildFallbackProtocol(memo) {
    return {
        transfer_failure: {
            action: 'Take detailed message',
            message_template: '"I wasn\'t able to reach the team right now, but I\'ve noted your information and marked this as {urgency_level}. Someone will get back to you {timeframe}."',
            notification: 'Send immediate email + SMS to designated contacts'
        },
        unknown_request: {
            action: 'Collect basic info and escalate',
            message_template: '"That\'s a great question. Let me have our team get back to you with the best answer. Can I get your name and number?"'
        },
        out_of_service_area: {
            action: 'Politely decline',
            message_template: '"I appreciate you reaching out. Unfortunately, we primarily serve the {service_area} area. I\'d recommend searching for a local provider who can assist you more quickly."'
        }
    };
}

module.exports = { generateAgentSpec };
