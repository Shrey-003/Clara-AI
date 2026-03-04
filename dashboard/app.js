/**
 * Clara AI Pipeline Dashboard - Client App
 * Fetches data from the serve-dashboard endpoint and renders the UI
 */

// ─── Data store ──────────────────────────────
let dashboardData = null;
let selectedAccount = null;
let currentTab = 'memo';
let currentVersion = 'v1';

// ─── Initialize ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const response = await fetch('/api/data');
        dashboardData = await response.json();
        renderDashboard();
    } catch (err) {
        document.getElementById('runStatus').querySelector('.status-text').textContent = 'Error loading data';
        document.getElementById('runStatus').querySelector('.status-dot').style.background = '#ef4444';
        console.error('Failed to load dashboard data:', err);
    }
}

// ─── Render Functions ────────────────────────

function renderDashboard() {
    if (!dashboardData) return;

    // Update status
    const statusEl = document.getElementById('runStatus');
    statusEl.querySelector('.status-text').textContent = `Last run: ${formatDate(dashboardData.summary.timestamp)}`;
    statusEl.querySelector('.status-dot').style.background = dashboardData.summary.failed === 0 ? '#10b981' : '#ef4444';

    // Update metrics
    document.getElementById('totalAccounts').textContent = dashboardData.accounts.length;
    document.getElementById('v1Count').textContent = dashboardData.accounts.filter(a => a.v1).length;
    document.getElementById('v2Count').textContent = dashboardData.accounts.filter(a => a.v2).length;

    const totalChanges = dashboardData.accounts.reduce((sum, a) => sum + (a.changelog?.total_changes || 0), 0);
    document.getElementById('totalChanges').textContent = totalChanges;
    document.getElementById('pipelineDuration').textContent = `${dashboardData.summary.duration_seconds}s`;

    // Render account list
    renderAccountList();
}

function renderAccountList() {
    const container = document.getElementById('accountCards');
    container.innerHTML = '';

    for (const account of dashboardData.accounts) {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.dataset.accountId = account.account_id;

        const changeCount = account.changelog?.total_changes || 0;
        card.innerHTML = `
      <div class="name">${account.company_name || account.account_id}</div>
      <div class="meta">
        ${account.v1 ? '<span class="version-badge v1">v1</span>' : ''}
        ${account.v2 ? '<span class="version-badge v2">v2</span>' : ''}
        ${changeCount > 0 ? `<span class="changes-badge">${changeCount} changes</span>` : ''}
      </div>
    `;

        card.addEventListener('click', () => selectAccount(account.account_id));
        container.appendChild(card);
    }
}

function selectAccount(accountId) {
    selectedAccount = dashboardData.accounts.find(a => a.account_id === accountId);
    if (!selectedAccount) return;

    // Update active state
    document.querySelectorAll('.account-card').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-account-id="${accountId}"]`)?.classList.add('active');

    // Render content
    renderAccountContent();
}

function renderAccountContent() {
    const container = document.getElementById('contentArea');
    const account = selectedAccount;

    container.innerHTML = `
    <div class="section-header">
      <h2>${account.company_name || account.account_id}</h2>
    </div>

    <div class="tabs">
      <button class="tab ${currentTab === 'memo' ? 'active' : ''}" onclick="switchTab('memo')">Account Memo</button>
      <button class="tab ${currentTab === 'spec' ? 'active' : ''}" onclick="switchTab('spec')">Agent Spec</button>
      <button class="tab ${currentTab === 'prompt' ? 'active' : ''}" onclick="switchTab('prompt')">System Prompt</button>
      <button class="tab ${currentTab === 'diff' ? 'active' : ''}" onclick="switchTab('diff')">Diff Viewer</button>
    </div>

    <div id="tabContent"></div>
  `;

    renderTabContent();
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab:nth-child(${['memo', 'spec', 'prompt', 'diff'].indexOf(tab) + 1})`).classList.add('active');
    renderTabContent();
}

function renderTabContent() {
    const content = document.getElementById('tabContent');
    const account = selectedAccount;

    switch (currentTab) {
        case 'memo':
            content.innerHTML = renderVersionToggle() + renderMemoView();
            break;
        case 'spec':
            content.innerHTML = renderVersionToggle() + renderSpecView();
            break;
        case 'prompt':
            content.innerHTML = renderVersionToggle() + renderPromptView();
            break;
        case 'diff':
            content.innerHTML = renderDiffView();
            break;
    }
}

function renderVersionToggle() {
    const hasV2 = !!selectedAccount.v2;
    return `
    <div class="section-header" style="margin-bottom: 16px;">
      <div class="version-toggle">
        <button class="version-btn ${currentVersion === 'v1' ? 'active' : ''}" onclick="switchVersion('v1')">v1 (Demo)</button>
        <button class="version-btn ${currentVersion === 'v2' ? 'active' : ''}" onclick="switchVersion('v2')" ${!hasV2 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>v2 (Onboarding)</button>
      </div>
    </div>
  `;
}

function switchVersion(version) {
    currentVersion = version;
    renderTabContent();
}

function renderMemoView() {
    const data = currentVersion === 'v1' ? selectedAccount.v1?.memo : selectedAccount.v2?.memo;
    if (!data) return '<p style="color: var(--text-muted)">No data available for this version.</p>';
    return `<div class="json-viewer">${syntaxHighlightJSON(data)}</div>`;
}

function renderSpecView() {
    const data = currentVersion === 'v1' ? selectedAccount.v1?.spec : selectedAccount.v2?.spec;
    if (!data) return '<p style="color: var(--text-muted)">No data available for this version.</p>';
    return `<div class="json-viewer">${syntaxHighlightJSON(data)}</div>`;
}

function renderPromptView() {
    const spec = currentVersion === 'v1' ? selectedAccount.v1?.spec : selectedAccount.v2?.spec;
    if (!spec?.system_prompt) return '<p style="color: var(--text-muted)">No prompt available for this version.</p>';

    const formatted = spec.system_prompt
        .replace(/═{3,}/g, '<span class="section-divider">═══════════════════════════════════════════════</span>')
        .replace(/^(.*(?:COMPANY INFORMATION|DURING BUSINESS HOURS|AFTER HOURS|CRITICAL RULES|CONVERSATION STYLE).*)$/gm, '<span class="section-divider">$1</span>');

    return `<div class="prompt-viewer">${escapeHTML(spec.system_prompt)}</div>`;
}

function renderDiffView() {
    const changelog = selectedAccount.changelog;
    if (!changelog || !changelog.changes?.length) {
        return `
      <div class="changelog-summary">
        <h3>No Changes</h3>
        <p>No diff available — either v2 has not been generated or there were no changes between versions.</p>
      </div>
    `;
    }

    const added = changelog.changes.filter(c => c.action === 'added').length;
    const modified = changelog.changes.filter(c => c.action === 'modified').length;
    const removed = changelog.changes.filter(c => c.action === 'removed').length;

    let html = `
    <div class="changelog-summary">
      <h3>Changelog: v1 → v2</h3>
      <p>${changelog.summary}</p>
      <div class="changelog-stats">
        <div class="changelog-stat"><span class="dot added"></span> ${added} Added</div>
        <div class="changelog-stat"><span class="dot modified"></span> ${modified} Modified</div>
        <div class="changelog-stat"><span class="dot removed"></span> ${removed} Removed</div>
      </div>
    </div>

    <div class="diff-container">
      <div class="diff-header">
        <span>Field</span>
        <span>Action</span>
        <span>Old Value</span>
        <span>New Value</span>
      </div>
  `;

    for (const change of changelog.changes) {
        html += `
      <div class="diff-row ${change.action}">
        <span class="diff-field">${change.field}</span>
        <span class="diff-action ${change.action}">${change.action}</span>
        <span class="diff-value">${formatDiffValue(change.old_value)}</span>
        <span class="diff-value">${formatDiffValue(change.new_value)}</span>
      </div>
    `;
    }

    html += '</div>';
    return html;
}

// ─── Utilities ───────────────────────────────

function syntaxHighlightJSON(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                    match = match.replace(/"/g, '');
                    match = `"${match}`;
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${escapeHTML(match)}</span>`;
        }
    );
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDiffValue(value) {
    if (value === null || value === undefined) return '<span style="color: var(--text-muted)">—</span>';
    if (typeof value === 'object') {
        const str = JSON.stringify(value, null, 1);
        return escapeHTML(str.length > 120 ? str.substring(0, 120) + '...' : str);
    }
    return escapeHTML(String(value));
}

function formatDate(dateStr) {
    try {
        return new Date(dateStr).toLocaleString();
    } catch {
        return dateStr;
    }
}
