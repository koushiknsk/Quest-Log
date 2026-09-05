// Test Suite: Time Machine Single Day Step Regression Test
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: time_machine_single_step.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// 1. Initial State
const todayDate = new Date();
const y = todayDate.getFullYear();
const m = String(todayDate.getMonth() + 1).padStart(2, '0');
const d = String(todayDate.getDate()).padStart(2, '0');
const todayStr = `${y}-${m}-${d}`;

state.mockDate = null;
global.window.__kuroganeRenderArcadeHUD();

const stepBackBtn = elementsById['dev-prev-day-btn'];
const stepForwardBtn = elementsById['dev-next-day-btn'];
assert(stepBackBtn, 'dev-prev-day-btn must exist');
assert(stepForwardBtn, 'dev-next-day-btn must exist');

// 2. Step back 1 day
stepBackBtn.dispatchEvent('click');

const yesterday = new Date(todayDate);
yesterday.setDate(yesterday.getDate() - 1);
const expectedYesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

assert.strictEqual(
  state.mockDate,
  expectedYesterdayStr,
  `-1 Day button must step back exactly 1 day (expected: ${expectedYesterdayStr}, got: ${state.mockDate})`
);
console.log('  [PASS] -1 Day button steps back exactly 1 day.');

// 3. Step forward 1 day (should return to today)
stepForwardBtn.dispatchEvent('click');

assert.strictEqual(
  state.mockDate,
  todayStr,
  `+1 Day button must step forward exactly 1 day (expected: ${todayStr}, got: ${state.mockDate})`
);
console.log('  [PASS] +1 Day button steps forward exactly 1 day.');

// 4. Step forward 1 more day (should be tomorrow)
stepForwardBtn.dispatchEvent('click');

const tomorrow = new Date(todayDate);
tomorrow.setDate(tomorrow.getDate() + 1);
const expectedTomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

assert.strictEqual(
  state.mockDate,
  expectedTomorrowStr,
  `+1 Day button must advance to tomorrow (expected: ${expectedTomorrowStr}, got: ${state.mockDate})`
);
console.log('  [PASS] Single-step navigation verified across all directions.');
console.log('>>> SUITE PASSED: time_machine_single_step.test.js\n');
