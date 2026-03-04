/**
 * Clara AI Pipeline - Onboarding Diff/Patch Engine
 * Processes onboarding transcripts to update v1 Account Memo and Agent Spec to v2
 * Produces changelogs showing what changed and why
 */

const { extractFromTranscript } = require('./extract');
const { generateAgentSpec } = require('./generate-agent-spec');
const { deepMerge, computeDiff, log, saveJSON, getOutputDir, getChangelogDir } = require('./utils');

/**
 * Apply onboarding updates to produce v2 outputs
 * @param {Object} v1Memo - The v1 Account Memo JSON
 * @param {string} onboardingContent - Raw onboarding transcript text
 * @returns {Object} { v2Memo, v2Spec, changelog }
 */
async function applyOnboarding(v1Memo, onboardingContent, apiKey = null) {
    const accountId = v1Memo.account_id;
    log('INFO', `Starting onboarding processing for ${v1Memo.company_name}`, { accountId });

    // Step 1: Extract updates from onboarding transcript
    const onboardingData = await extractFromTranscript(onboardingContent, 'onboarding', apiKey);
    log('INFO', 'Onboarding data extracted', { fieldsExtracted: Object.keys(onboardingData).length });

    // Step 2: Merge v1 with onboarding updates to produce v2
    const v2Memo = mergeWithOnboarding(v1Memo, onboardingData);
    v2Memo.extraction_type = 'onboarding_update';
    v2Memo.version = 'v2';
    v2Memo.v1_date = v1Memo.extraction_date;
    v2Memo.v2_date = onboardingData.extraction_date || new Date().toISOString().split('T')[0];

    // Clear demo-specific unknowns that are now resolved
    v2Memo.questions_or_unknowns = identifyRemainingUnknowns(v2Memo);
    v2Memo.notes = 'Updated with onboarding data. Operational details confirmed.';

    // Step 3: Compute changes
    const changes = computeDiff(v1Memo, v2Memo);
    log('INFO', `Computed ${changes.length} changes between v1 and v2`);

    // Step 4: Build changelog
    const changelog = buildChangelog(v1Memo, v2Memo, changes, onboardingData);

    // Step 5: Generate v2 agent spec
    const v2Spec = generateAgentSpec(v2Memo, 'v2');

    log('INFO', `Onboarding processing complete for ${v1Memo.company_name}`, {
        totalChanges: changes.length,
        addedFields: changes.filter(c => c.action === 'added').length,
        modifiedFields: changes.filter(c => c.action === 'modified').length,
        removedFields: changes.filter(c => c.action === 'removed').length
    });

    return { v2Memo, v2Spec, changelog };
}

/**
 * Merge onboarding data into v1 memo with smart conflict resolution
 */
function mergeWithOnboarding(v1Memo, onboardingData) {
    const v2 = { ...v1Memo };

    // Fields that onboarding should always override (operational specifics)
    const overrideFields = [
        'business_hours',
        'emergency_definition',
        'emergency_routing_rules',
        'non_emergency_routing_rules',
        'call_transfer_rules',
        'integration_constraints',
        'after_hours_flow_summary',
        'office_hours_flow_summary',
        'special_rules'
    ];

    // Fields that should be merged (additive)
    const mergeFields = [
        'services_supported',
        'services_excluded',
        'contact_info'
    ];

    // Fields that should be replaced if onboarding has non-empty data
    const replaceFields = [
        'office_address',
        'timezone'
    ];

    // Apply overrides
    for (const field of overrideFields) {
        if (onboardingData[field] && hasContent(onboardingData[field])) {
            v2[field] = onboardingData[field];
        }
    }

    // Apply merges
    for (const field of mergeFields) {
        if (Array.isArray(onboardingData[field]) && onboardingData[field].length > 0) {
            if (Array.isArray(v2[field])) {
                // Merge arrays, removing duplicates
                const combined = [...v2[field], ...onboardingData[field]];
                v2[field] = [...new Set(combined.map(item =>
                    typeof item === 'string' ? item : JSON.stringify(item)
                ))].map(item => {
                    try { return JSON.parse(item); } catch { return item; }
                });
            } else {
                v2[field] = onboardingData[field];
            }
        }
    }

    // Apply replacements
    for (const field of replaceFields) {
        if (onboardingData[field] && onboardingData[field] !== null) {
            v2[field] = onboardingData[field];
        }
    }

    return v2;
}

/**
 * Identify unknowns remaining after onboarding
 */
function identifyRemainingUnknowns(memo) {
    const unknowns = [];

    if (!memo.business_hours?.start_time) unknowns.push('Exact business start time not confirmed');
    if (!memo.business_hours?.end_time) unknowns.push('Exact business end time not confirmed');
    if (!memo.timezone) unknowns.push('Timezone not confirmed');
    if (!memo.office_address) unknowns.push('Office address not confirmed');
    if (!memo.emergency_routing_rules?.escalation_chain?.length) unknowns.push('Emergency escalation chain not defined');
    if (!memo.services_supported?.length) unknowns.push('Service list not confirmed');

    return unknowns;
}

/**
 * Build a detailed changelog
 */
function buildChangelog(v1Memo, v2Memo, changes, onboardingData) {
    // Map changes to friend's schema
    const formattedChanges = changes.map(c => {
        return {
            field: c.field,
            v1_value: c.old_value,
            v2_value: c.new_value,
            reason: "confirmed during onboarding call"
        };
    });

    return {
        account_id: v1Memo.account_id,
        changed_at: new Date().toISOString(),
        changes: formattedChanges,
        fields_unchanged: identifyUnchangedFields(v1Memo, v2Memo, changes),
        questions_resolved: identifyResolvedQuestions(v1Memo, v2Memo),
        questions_still_open: identifyRemainingUnknowns(v2Memo)
    };
}

/**
 * Identify fields that did not change between v1 and v2
 */
function identifyUnchangedFields(v1Memo, v2Memo, changes) {
    const changedFields = new Set(changes.map(c => c.field));
    const allFields = collectAllLeaves(v1Memo);

    return allFields.filter(f => !changedFields.has(f)).sort();
}

/**
 * Identify questions from v1 that were resolved in v2
 */
function identifyResolvedQuestions(v1Memo, v2Memo) {
    const v1Questions = v1Memo.questions_or_unknowns || [];
    const v2Questions = new Set(v2Memo.questions_or_unknowns || []);

    return v1Questions.filter(q => !v2Questions.has(q));
}

/**
 * Recursively collect all dot-notation leaf paths from an object
 */
function collectAllLeaves(obj, currentPath = '') {
    let leaves = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        if (currentPath) leaves.push(currentPath);
        return leaves;
    }

    for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        const childLeaves = collectAllLeaves(value, newPath);
        if (childLeaves.length > 0) {
            leaves.push(...childLeaves);
        } else {
            leaves.push(newPath);
        }
    }
    return leaves;
}

/**
 * Generate a human-readable change summary
 */
function generateChangeSummary(changes) {
    const added = changes.filter(c => c.action === 'added').length;
    const modified = changes.filter(c => c.action === 'modified').length;
    const removed = changes.filter(c => c.action === 'removed').length;

    const parts = [];
    if (added > 0) parts.push(`${added} field(s) added`);
    if (modified > 0) parts.push(`${modified} field(s) modified`);
    if (removed > 0) parts.push(`${removed} field(s) removed`);

    return `Onboarding update: ${parts.join(', ')}. Operational details confirmed and refined from demo call assumptions.`;
}

/**
 * Categorize why a change was made
 */
function categorizeChange(change) {
    const field = change.field.toLowerCase();
    if (change.action === 'added') return 'New detail confirmed during onboarding';
    if (field.includes('emergency')) return 'Emergency protocol refined during onboarding';
    if (field.includes('hours') || field.includes('time')) return 'Schedule details confirmed during onboarding';
    if (field.includes('routing') || field.includes('transfer')) return 'Call routing updated with operational specifics';
    if (field.includes('service')) return 'Service list finalized during onboarding';
    if (field.includes('constraint') || field.includes('rule')) return 'Business rules confirmed during onboarding';
    if (field.includes('unknown') || field.includes('note')) return 'Status updated based on onboarding confirmation';
    return 'Updated based on onboarding call information';
}

/**
 * Check if a value has actual content
 */
function hasContent(val) {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.values(val).some(v => hasContent(v));
    return true;
}

module.exports = { applyOnboarding };
