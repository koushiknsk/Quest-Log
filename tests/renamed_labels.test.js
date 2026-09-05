// Test Suite: Renamed Labels & Capitalization
const { setupTestEnvironment, htmlSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: renamed_labels.test.js');

// 1. Static HTML Template Checks
// Button "+ NEW QUEST" renamed to "NEW QUEST"
assert(
  htmlSource.includes('NEW QUEST'),
  'HTML must contain "NEW QUEST"'
);
assert(
  !htmlSource.includes('+ NEW QUEST') && !htmlSource.includes('+ New Quest'),
  'HTML must NOT contain "+ NEW QUEST" or "+ New Quest"'
);

const btnMatch = htmlSource.match(/id=["']open-init-screen-btn["'][^>]*>([\s\S]*?)<\/button>/);
assert(btnMatch, 'open-init-screen-btn must be present in HTML');
assert(btnMatch[1].includes('NEW QUEST'), 'open-init-screen-btn must contain "NEW QUEST"');
assert(!btnMatch[1].includes('+'), 'open-init-screen-btn must not contain "+"');
console.log('  [PASS] NEW QUEST button label verified without leading +.');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// 2. Tab and Header Labeling for Inspected Days
// User requirement: "rename the tab's label 16 quests to 16th Oct Quests please."
const dayTabEl = elementsById['phase-tab-day'];
const titleEl = elementsById['protocols-section-title'];

// 16th Oct inspected (reproducing user request)
state.mockDate = '2026-10-19';
state.selectedInspectionDate = '2026-10-16';
global.window.__kuroganeRenderProtocols();

assert.strictEqual(dayTabEl.textContent, '16th Oct Quests', 'Day 16 Oct inspected tab label must be "16th Oct Quests"');
assert.strictEqual(titleEl.textContent, '16th OCT QUESTS', 'Day 16 Oct inspected title must be "16th OCT QUESTS"');

// 4th Sep inspected
state.mockDate = '2026-09-07';
state.selectedInspectionDate = '2026-09-04';
global.window.__kuroganeRenderProtocols();

assert.strictEqual(dayTabEl.textContent, '4th Sep Quests', 'Day 04 inspected tab label must be "4th Sep Quests"');
assert.strictEqual(titleEl.textContent, '4th SEP QUESTS', 'Day 04 inspected title must be "4th SEP QUESTS"');

// 6th Sep inspected (Sunday)
state.selectedInspectionDate = '2026-09-06';
global.window.__kuroganeRenderProtocols();

assert.strictEqual(dayTabEl.textContent, '6th Sep Quests', 'Day 06 inspected tab label must be "6th Sep Quests"');
assert.strictEqual(titleEl.textContent, '6th SEP QUESTS', 'Day 06 inspected title must be "6th SEP QUESTS"');

// Today active state
state.selectedInspectionDate = null;
global.window.__kuroganeRenderProtocols();

assert.strictEqual(dayTabEl.textContent, "TODAY'S QUESTS", 'Default tab label must be "TODAY\'S QUESTS"');
assert.strictEqual(titleEl.textContent, 'ACTIVE QUESTS', 'Default title must be "ACTIVE QUESTS"');

console.log('  [PASS] Inspected tab and header labels adhere to ordinal format (e.g. 16th Oct Quests).');
console.log('>>> SUITE PASSED: renamed_labels.test.js\n');
