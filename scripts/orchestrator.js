/**
 * Clara AI Pipeline - Main Orchestrator
 * Batch processes all demo + onboarding transcripts end-to-end
 * Implements retry logic, error handling, idempotency, and logging
 */

const fs = require('fs');
const path = require('path');
const { extractFromTranscript } = require('./extract');
const { generateAgentSpec } = require('./generate-agent-spec');
const { applyOnboarding } = require('./apply-onboarding');
const {
    ROOT_DIR, ensureDir, readTranscript, saveJSON, loadJSON,
    getOutputDir, getChangelogDir, generateAccountId,
    extractAccountNameFromHeader, log
} = require('./utils');

// ─── Configuration ───────────────────────────────────────────
const DATASET_DIR = path.join(ROOT_DIR, 'dataset');
const DEMO_DIR = path.join(DATASET_DIR, 'demo');
const ONBOARDING_DIR = path.join(DATASET_DIR, 'onboarding');
const TASKS_FILE = path.join(ROOT_DIR, 'tasks', 'tracker.json');
const MAX_RETRIES = 3;

// ─── Main Pipeline ───────────────────────────────────────────

async function runPipeline(options = {}) {
    const startTime = Date.now();
    const runLog = [];
    const errors = [];

    log('INFO', '═══════════════════════════════════════════════');
    log('INFO', '  Clara AI Pipeline - Starting Batch Run');
    log('INFO', '═══════════════════════════════════════════════');

    // Step 1: Discover dataset files
    const demoFiles = discoverFiles(DEMO_DIR);
    const onboardingFiles = discoverFiles(ONBOARDING_DIR);

    log('INFO', `Found ${demoFiles.length} demo files and ${onboardingFiles.length} onboarding files`);

    // Step 2: Run Pipeline A (Demo → v1)
    if (!options.onboardingOnly) {
        log('INFO', '\n── Pipeline A: Demo Call → Preliminary Agent (v1) ──');
        for (const file of demoFiles) {
            const result = await runWithRetry(() => processDemoCall(file), file, MAX_RETRIES);
            runLog.push(result);
            if (result.error) errors.push(result);
        }
    }

    // Step 3: Match onboarding files to accounts
    const accountMap = buildAccountMap();

    // Step 4: Run Pipeline B (Onboarding → v2)
    if (!options.demoOnly) {
        log('INFO', '\n── Pipeline B: Onboarding → Agent Update (v2) ──');
        for (const file of onboardingFiles) {
            const result = await runWithRetry(() => processOnboarding(file, accountMap), file, MAX_RETRIES);
            runLog.push(result);
            if (result.error) errors.push(result);
        }
    }

    // Step 5: Update task tracker
    updateTaskTracker(runLog);

    // Step 6: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const summary = {
        run_id: `run_${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration_seconds: parseFloat(duration),
        total_files_processed: runLog.length,
        successful: runLog.filter(r => !r.error).length,
        failed: errors.length,
        accounts_processed: [...new Set(runLog.filter(r => r.accountId).map(r => r.accountId))],
        errors: errors.map(e => ({ file: e.file, error: e.error }))
    };

    log('INFO', '\n═══════════════════════════════════════════════');
    log('INFO', '  Pipeline Run Complete');
    log('INFO', `  Duration: ${duration}s`);
    log('INFO', `  Processed: ${summary.successful}/${summary.total_files_processed} files`);
    log('INFO', `  Errors: ${errors.length}`);
    log('INFO', '═══════════════════════════════════════════════');

    // Save run summary
    const summaryPath = path.join(ROOT_DIR, 'outputs', 'pipeline_summary.json');
    saveJSON(summaryPath, summary);

    return summary;
}

// ─── Pipeline A: Process Demo Call ───────────────────────────

async function processDemoCall(filePath) {
    const fileName = path.basename(filePath);
    log('INFO', `Processing demo file: ${fileName}`);

    // Read transcript
    const content = readTranscript(filePath);
    const accountName = extractAccountNameFromHeader(content);
    if (!accountName) throw new Error(`Could not extract account name from ${fileName}`);

    const accountId = generateAccountId(accountName);
    const outputDir = getOutputDir(accountId, 'v1');

    // Idempotency check
    const memoPath = path.join(outputDir, 'account_memo.json');
    if (fs.existsSync(memoPath)) {
        const existing = loadJSON(memoPath);
        log('INFO', `v1 already exists for ${accountName}, overwriting for idempotency`);
    }

    // Extract account memo
    const memo = await extractFromTranscript(content, 'demo');

    // Generate agent spec
    const spec = generateAgentSpec(memo, 'v1');

    // Save outputs
    ensureDir(outputDir);
    saveJSON(memoPath, memo);
    saveJSON(path.join(outputDir, 'agent_spec.json'), spec);

    // Save the prompt separately for easy review
    fs.writeFileSync(
        path.join(outputDir, 'agent_prompt.txt'),
        spec.system_prompt,
        'utf-8'
    );

    log('INFO', `✓ v1 outputs saved for ${accountName} (${accountId})`);

    return {
        file: fileName,
        accountId,
        accountName,
        pipeline: 'A',
        version: 'v1',
        outputDir,
        timestamp: new Date().toISOString()
    };
}

// ─── Pipeline B: Process Onboarding ──────────────────────────

async function processOnboarding(filePath, accountMap) {
    const fileName = path.basename(filePath);
    log('INFO', `Processing onboarding file: ${fileName}`);

    // Read onboarding transcript
    const content = readTranscript(filePath);
    const accountName = extractAccountNameFromHeader(content);
    if (!accountName) throw new Error(`Could not extract account name from ${fileName}`);

    const accountId = generateAccountId(accountName);

    // Find matching v1
    const v1Dir = getOutputDir(accountId, 'v1');
    const v1MemoPath = path.join(v1Dir, 'account_memo.json');

    if (!fs.existsSync(v1MemoPath)) {
        // Try to find by fuzzy matching
        const closest = findClosestAccount(accountName, accountMap);
        if (closest) {
            log('WARN', `Exact match not found, using closest: ${closest}`);
            const v1Memo = loadJSON(path.join(getOutputDir(closest, 'v1'), 'account_memo.json'));
            return processOnboardingForAccount(v1Memo, content, accountId, accountName, fileName);
        }
        throw new Error(`No v1 found for account: ${accountName} (${accountId}). Run demo pipeline first.`);
    }

    const v1Memo = loadJSON(v1MemoPath);
    return await processOnboardingForAccount(v1Memo, content, accountId, accountName, fileName);
}

async function processOnboardingForAccount(v1Memo, content, accountId, accountName, fileName) {
    // Apply onboarding
    const { v2Memo, v2Spec, changelog } = await applyOnboarding(v1Memo, content);

    // Save v2 outputs
    const v2Dir = getOutputDir(accountId, 'v2');
    ensureDir(v2Dir);
    saveJSON(path.join(v2Dir, 'account_memo.json'), v2Memo);
    saveJSON(path.join(v2Dir, 'agent_spec.json'), v2Spec);
    fs.writeFileSync(
        path.join(v2Dir, 'agent_prompt.txt'),
        v2Spec.system_prompt,
        'utf-8'
    );

    // Save changelog
    const changelogDir = getChangelogDir(accountId);
    ensureDir(changelogDir);
    saveJSON(path.join(changelogDir, 'changes.json'), changelog);

    // Also generate markdown changelog
    const changelogMd = generateMarkdownChangelog(changelog);
    fs.writeFileSync(path.join(changelogDir, 'changes.md'), changelogMd, 'utf-8');

    log('INFO', `✓ v2 outputs saved for ${accountName} (${accountId})`);
    log('INFO', `  Changelog: ${changelog.total_changes} changes`);

    return {
        file: fileName,
        accountId,
        accountName,
        pipeline: 'B',
        version: 'v2',
        outputDir: v2Dir,
        totalChanges: changelog.total_changes,
        timestamp: new Date().toISOString()
    };
}

// ─── Helper Functions ────────────────────────────────────────

function discoverFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.md'))
        .map(f => path.join(dir, f))
        .sort();
}

function buildAccountMap() {
    const outputsDir = path.join(ROOT_DIR, 'outputs', 'accounts');
    if (!fs.existsSync(outputsDir)) return {};
    const map = {};
    for (const dir of fs.readdirSync(outputsDir)) {
        const memoPath = path.join(outputsDir, dir, 'v1', 'account_memo.json');
        if (fs.existsSync(memoPath)) {
            const memo = loadJSON(memoPath);
            map[dir] = memo.company_name;
        }
    }
    return map;
}

function findClosestAccount(name, accountMap) {
    const targetId = generateAccountId(name);
    // Try exact match first
    if (accountMap[targetId]) return targetId;
    // Try fuzzy match
    const targetWords = name.toLowerCase().split(/\s+/);
    for (const [id, companyName] of Object.entries(accountMap)) {
        const words = companyName.toLowerCase().split(/\s+/);
        const overlap = targetWords.filter(w => words.includes(w)).length;
        if (overlap >= 2) return id;
    }
    return null;
}

async function runWithRetry(fn, filePath, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            log('ERROR', `Attempt ${attempt}/${maxRetries} failed for ${path.basename(filePath)}`, { error: err.message });
            if (attempt === maxRetries) {
                return {
                    file: path.basename(filePath),
                    error: err.message,
                    attempts: attempt,
                    timestamp: new Date().toISOString()
                };
            }
        }
    }
}

function updateTaskTracker(runLog) {
    const tasks = [];
    for (const entry of runLog) {
        if (!entry.error) {
            tasks.push({
                task_id: `TASK-${tasks.length + 1}`,
                account_id: entry.accountId,
                account_name: entry.accountName,
                type: entry.pipeline === 'A' ? 'Demo Processing' : 'Onboarding Update',
                status: 'completed',
                version: entry.version,
                completed_at: entry.timestamp,
                output_location: entry.outputDir
            });
        }
    }
    saveJSON(TASKS_FILE, {
        last_updated: new Date().toISOString(),
        total_tasks: tasks.length,
        tasks
    });
    log('INFO', `Task tracker updated: ${tasks.length} tasks`);
}

function generateMarkdownChangelog(changelog) {
    let md = `# Changelog: ${changelog.account_id}\n\n`;
    md += `**Changed At:** ${changelog.changed_at}\n`;
    md += `**Total Changes:** ${changelog.changes ? changelog.changes.length : 0}\n\n`;

    md += `## Changes\n\n`;
    md += `| Field | v1 Value | v2 Value | Reason |\n`;
    md += `|-------|----------|----------|--------|\n`;

    if (changelog.changes) {
        for (const change of changelog.changes) {
            const v1Val = truncate(JSON.stringify(change.v1_value), 40);
            const v2Val = truncate(JSON.stringify(change.v2_value), 40);
            md += `| ${change.field} | ${v1Val} | ${v2Val} | ${change.reason} |\n`;
        }
    }

    md += `\n## Fields Unchanged\n`;
    if (changelog.fields_unchanged && changelog.fields_unchanged.length > 0) {
        md += changelog.fields_unchanged.map(f => `- ${f}`).join('\n');
    } else {
        md += '*None*';
    }

    md += `\n\n## Questions Resolved\n`;
    if (changelog.questions_resolved && changelog.questions_resolved.length > 0) {
        md += changelog.questions_resolved.map(q => `- ${q}`).join('\n');
    } else {
        md += '*None*';
    }

    md += `\n\n## Questions Still Open\n`;
    if (changelog.questions_still_open && changelog.questions_still_open.length > 0) {
        md += changelog.questions_still_open.map(q => `- ${q}`).join('\n');
    } else {
        md += '*None*';
    }

    md += '\n';

    return md;
}

function truncate(str, len) {
    if (!str) return '-';
    // Remove quotes around strings for cleaner markdown
    if (str.startsWith('"') && str.endsWith('"')) {
        str = str.substring(1, str.length - 1);
    }
    return str.length > len ? str.substring(0, len) + '...' : str;
}

// ─── CLI Entry Point ─────────────────────────────────────────

const args = process.argv.slice(2);
const options = {
    demoOnly: args.includes('--demo-only'),
    onboardingOnly: args.includes('--onboarding-only')
};

runPipeline(options)
    .then(summary => {
        if (summary.failed > 0) {
            process.exit(1);
        }
    })
    .catch(err => {
        log('ERROR', 'Pipeline failed', { error: err.message });
        process.exit(1);
    });
