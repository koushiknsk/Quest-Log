// Test Suite: RETURN TO TODAY Month Navigation Button & Removal of Reset Banner
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: return_to_today_button.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

state.mockDate = '2026-09-04';
state.firstLoginDate = '2026-09-01';
state.selectedInspectionDate = '2026-09-02';

global.window.__kuroganeRenderArcadeHUD();
global.window.__kuroganeRenderProtocols();

const container = elementsById['protocols-list-container'];
const todayMonthBtn = elementsById['today-month-btn'];

// 1. Verify absence of the old reset button inside day inspection banner
const exitBtn = container.children.find(c => c.id === 'exit-day-inspect-btn');
assert.strictEqual(exitBtn, undefined, 'Old #exit-day-inspect-btn must be completely removed');
assert(
  !container.innerHTML.includes('RESET TO TODAY'),
  'Protocols container must NOT contain "RESET TO TODAY" button'
);
console.log('  [PASS] Redundant "RESET TO TODAY" banner button removed from quest container.');

// 2. Verify #today-month-btn transforms into RETURN TO TODAY with .return-mode
assert.strictEqual(
  todayMonthBtn.textContent,
  'RETURN TO TODAY',
  'Header button text must be "RETURN TO TODAY" when inspecting another day'
);
assert(
  todayMonthBtn.classList.contains('return-mode'),
  'Header button must have .return-mode class'
);
console.log('  [PASS] Header button displays RETURN TO TODAY with return-mode styling.');

// 3. Test clicking RETURN TO TODAY
todayMonthBtn.dispatchEvent('click');

assert.strictEqual(state.selectedInspectionDate, null, 'selectedInspectionDate must be reset to null');
assert.strictEqual(state.viewedYear, null, 'viewedYear must be reset to null');
assert.strictEqual(state.viewedMonthIndex, null, 'viewedMonthIndex must be reset to null');
assert.strictEqual(state.selectedWeekNum, null, 'selectedWeekNum must be reset to null');

assert.strictEqual(
  todayMonthBtn.textContent,
  'TODAY',
  'Header button text must revert to "TODAY" when on live today'
);
assert(
  !todayMonthBtn.classList.contains('return-mode'),
  'Header button must NOT have .return-mode class on live today'
);
console.log('  [PASS] Clicking RETURN TO TODAY restores live focus and toggles label back to TODAY.');

console.log('>>> SUITE PASSED: return_to_today_button.test.js\n');
