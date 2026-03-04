/**
 * Clara AI Pipeline - Dashboard Server
 * Serves the dashboard UI and API endpoints for viewing pipeline outputs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { ROOT_DIR, loadJSON } = require('./utils');

const PORT = process.env.PORT || 3000;
const DASHBOARD_DIR = path.join(ROOT_DIR, 'dashboard');
const OUTPUTS_DIR = path.join(ROOT_DIR, 'outputs');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    // API endpoint
    if (req.url === '/api/data') {
        const data = gatherDashboardData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
    }

    // Static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    const fullPath = path.join(DASHBOARD_DIR, filePath);
    const ext = path.extname(fullPath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    if (fs.existsSync(fullPath)) {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(fullPath));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

function gatherDashboardData() {
    const summary = loadJSON(path.join(OUTPUTS_DIR, 'pipeline_summary.json')) || {};
    const accountsDir = path.join(OUTPUTS_DIR, 'accounts');
    const accounts = [];

    if (fs.existsSync(accountsDir)) {
        for (const accountId of fs.readdirSync(accountsDir)) {
            const accountDir = path.join(accountsDir, accountId);
            if (!fs.statSync(accountDir).isDirectory()) continue;

            const account = { account_id: accountId };

            // Load v1
            const v1Memo = loadJSON(path.join(accountDir, 'v1', 'account_memo.json'));
            const v1Spec = loadJSON(path.join(accountDir, 'v1', 'agent_spec.json'));
            if (v1Memo) {
                account.company_name = v1Memo.company_name;
                account.v1 = { memo: v1Memo, spec: v1Spec };
            }

            // Load v2
            const v2Memo = loadJSON(path.join(accountDir, 'v2', 'account_memo.json'));
            const v2Spec = loadJSON(path.join(accountDir, 'v2', 'agent_spec.json'));
            if (v2Memo) {
                account.v2 = { memo: v2Memo, spec: v2Spec };
            }

            // Load changelog
            const changelog = loadJSON(path.join(ROOT_DIR, 'changelog', accountId, 'changes.json'));
            if (changelog) {
                account.changelog = changelog;
            }

            accounts.push(account);
        }
    }

    return { summary, accounts };
}

server.listen(PORT, () => {
    console.log(`\n  ✦ Clara AI Dashboard running at http://localhost:${PORT}\n`);
    console.log(`  Accounts loaded: ${fs.existsSync(path.join(OUTPUTS_DIR, 'accounts')) ? fs.readdirSync(path.join(OUTPUTS_DIR, 'accounts')).length : 0}`);
    console.log(`  Press Ctrl+C to stop\n`);
});
