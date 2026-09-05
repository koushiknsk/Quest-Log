// Test Suite: Fruit Milestone Checkpoints Full Saturation & Color Coding
const { setupTestEnvironment, cssSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: week_saturation.test.js');

// 1. CSS Rule Assertions: Full Saturation (opacity: 1, grayscale: 0)
const inProgressMatch = cssSource.match(/\.fruit-item\.in-progress\s*\{([^}]+)\}/);
assert(inProgressMatch, 'CSS must define .fruit-item.in-progress');
assert(inProgressMatch[1].includes('opacity: 1 !important;'), 'In-progress week must have opacity: 1 !important');
assert(inProgressMatch[1].includes('filter: grayscale(0) !important;'), 'In-progress week must have filter: grayscale(0) !important');
assert(cssSource.includes('color: #5CADFF !important;'), 'In-progress week label must be bright blue (#5CADFF)');

const clearedMatch = cssSource.match(/\.fruit-item\.active,\s*\.fruit-item\.cleared\s*\{([^}]+)\}/);
assert(clearedMatch, 'CSS must define .fruit-item.active, .fruit-item.cleared');
assert(clearedMatch[1].includes('opacity: 1 !important;'), 'Cleared week must have opacity: 1 !important');
assert(clearedMatch[1].includes('filter: grayscale(0) !important;'), 'Cleared week must have filter: grayscale(0) !important');
assert(cssSource.includes('color: #FFE600 !important;'), 'Cleared week label must be arcade yellow (#FFE600)');

const partialMatch = cssSource.match(/\.fruit-item\.partial\s*\{([^}]+)\}/);
assert(partialMatch, 'CSS must define .fruit-item.partial');
assert(partialMatch[1].includes('opacity: 1 !important;'), 'Partial week must have opacity: 1 !important');
assert(partialMatch[1].includes('filter: grayscale(0) !important;'), 'Partial week must have filter: grayscale(0) !important');
assert(cssSource.includes('color: #FF9500 !important;'), 'Partial week label must be vibrant orange (#FF9500)');

console.log('  [PASS] CSS full saturation rules verified for in-progress (blue), cleared (yellow), and partial (orange).');

// 2. DOM Rendering Assertions for Fruit Checkpoints
const env = setupTestEnvironment();
const { elementsById, state } = env;

// Set mockDate to 2026-09-04 (Week 1 is in progress)
state.mockDate = '2026-09-04';
state.history = {};
state.dailyScores = {};

global.window.__kuroganeRenderArcadeHUD();

const fruitRow = elementsById['fruit-checkpoints-row'];
assert(fruitRow, 'fruit-checkpoints-row element must exist');

const fruitItems = fruitRow.querySelectorAll('.fruit-item');
assert(fruitItems.length >= 4, 'Must render at least 4 fruit week items for the month');

// Week 1 (Days 1..6 for Sept 2026): Active / in-progress
const wk1Item = fruitItems[0];
assert(wk1Item.classList.contains('in-progress'), 'Current week 1 must have in-progress class (blue, full saturation)');
assert(!wk1Item.classList.contains('cleared'), 'Week 1 in progress must not be cleared');

// Future weeks (Week 2, 3, 4, 5): unreached, muted
const wk2Item = fruitItems[1];
assert(!wk2Item.classList.contains('in-progress'), 'Future week 2 must not be in-progress');
assert(!wk2Item.classList.contains('cleared'), 'Future week 2 must not be cleared');

// Simulate 100% full week for Week 1
for (let d = 1; d <= 6; d++) {
  const dStr = `2026-09-0${d}`;
  state.history[dStr] = state.protocols.map(p => p.id);
  state.dailyScores[dStr] = 100;
}
// Advance to Week 2: 2026-09-08
state.mockDate = '2026-09-08';
global.window.__kuroganeRenderArcadeHUD();

const updatedFruitItems = fruitRow.querySelectorAll('.fruit-item');
const wk1ClearedItem = updatedFruitItems[0];
assert(wk1ClearedItem.classList.contains('cleared'), 'Completed week 1 must have cleared class (yellow, full saturation)');

const wk2InProgressItem = updatedFruitItems[1];
assert(wk2InProgressItem.classList.contains('in-progress'), 'Week 2 is now current in-progress week (blue, full saturation)');

console.log('  [PASS] Fruit checkpoint status and class transitions verified in DOM.');
console.log('>>> SUITE PASSED: week_saturation.test.js\n');
