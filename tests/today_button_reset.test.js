// Test Suite: TODAY Button Beside Month Header Resets Inspection & Focuses Today
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: today_button_reset.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// 1. Simulate user inspecting a specific dot (e.g. 2nd Sept) and week drill-down
state.mockDate = '2026-09-04';
state.selectedInspectionDate = '2026-09-02';
state.selectedWeekNum = 1;
state.viewedYear = 2026;
state.viewedMonthIndex = 7; // Navigated to August
global.window.__kuroganeRenderArcadeHUD();
global.window.__kuroganeRenderProtocols();

const dayTabEl = elementsById['phase-tab-day'];
const titleEl = elementsById['protocols-section-title'];
const todayMonthBtn = elementsById['today-month-btn'];

assert(todayMonthBtn, 'today-month-btn element must exist');
assert.strictEqual(dayTabEl.textContent, '2nd Sep Quests', 'Before click: tab displays inspected day label');

// 2. Click the TODAY button beside month header
todayMonthBtn.dispatchEvent('click');

// 3. Verify state reset and focus shift
assert.strictEqual(state.selectedInspectionDate, null, 'selectedInspectionDate must be reset to null');
assert.strictEqual(state.selectedWeekNum, null, 'selectedWeekNum must be reset to null');
assert.strictEqual(state.viewedYear, null, 'viewedYear must be reset to null');
assert.strictEqual(state.viewedMonthIndex, null, 'viewedMonthIndex must be reset to null');
assert.strictEqual(state.currentFilter, 'today', 'currentFilter must be reset to today');

// 4. Verify UI reflects today's quests
assert.strictEqual(dayTabEl.textContent, "TODAY'S QUESTS", "Tab label must shift back to TODAY'S QUESTS");
assert.strictEqual(titleEl.textContent, 'ACTIVE QUESTS', 'Section title must shift back to ACTIVE QUESTS');
assert(dayTabEl.classList.contains('active'), 'Today tab must have active class');

console.log('  [PASS] TODAY button resets inspected dot, week selection, calendar navigation, and focuses today.');
console.log('>>> SUITE PASSED: today_button_reset.test.js\n');
