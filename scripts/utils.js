/**
 * Clara AI Pipeline - Shared Utilities
 * Common functions used across all pipeline modules
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Ensure a directory exists, create it recursively if not
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate a deterministic account_id from company name
 */
function generateAccountId(companyName) {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Read a transcript file and return its content
 */
function readTranscript(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Save JSON data to a file
 */
function saveJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Load JSON data from a file
 */
function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Get output directory for a specific account and version
 */
function getOutputDir(accountId, version) {
  return path.join(ROOT_DIR, 'outputs', 'accounts', accountId, version);
}

/**
 * Get changelog directory for a specific account
 */
function getChangelogDir(accountId) {
  return path.join(ROOT_DIR, 'changelog', accountId);
}

/**
 * Create a timestamped log entry
 */
function log(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...context };
  console.log(`[${timestamp}] [${level}] ${message}`, Object.keys(context).length ? context : '');
  return entry;
}

/**
 * Extract the account name from a transcript header
 */
function extractAccountNameFromHeader(content) {
  const accountMatch = content.match(/Account:\s*(.+)/i);
  return accountMatch ? accountMatch[1].trim() : null;
}

/**
 * Extract date from a transcript header
 */
function extractDateFromHeader(content) {
  const dateMatch = content.match(/Date:\s*(.+)/i);
  return dateMatch ? dateMatch[1].trim() : null;
}

/**
 * Extract participants from a transcript header  
 */
function extractParticipantsFromHeader(content) {
  const partMatch = content.match(/Participants:\s*(.+)/i);
  return partMatch ? partMatch[1].trim() : null;
}

/**
 * Deep merge two objects (source overrides target for non-empty values)
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] === null || source[key] === undefined || source[key] === '') continue;
    if (Array.isArray(source[key])) {
      if (source[key].length > 0) {
        result[key] = source[key];
      }
    } else if (typeof source[key] === 'object' && typeof target[key] === 'object') {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Compute a diff between two objects (old vs new)
 */
function computeDiff(oldObj, newObj, prefix = '') {
  const changes = [];
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (typeof oldVal === 'object' && typeof newVal === 'object' && !Array.isArray(oldVal) && !Array.isArray(newVal)) {
        changes.push(...computeDiff(oldVal, newVal, fullKey));
      } else {
        changes.push({
          field: fullKey,
          old_value: oldVal ?? null,
          new_value: newVal ?? null,
          action: oldVal === undefined ? 'added' : newVal === undefined ? 'removed' : 'modified'
        });
      }
    }
  }
  return changes;
}

module.exports = {
  ROOT_DIR,
  ensureDir,
  generateAccountId,
  readTranscript,
  saveJSON,
  loadJSON,
  getOutputDir,
  getChangelogDir,
  log,
  extractAccountNameFromHeader,
  extractDateFromHeader,
  extractParticipantsFromHeader,
  deepMerge,
  computeDiff
};
