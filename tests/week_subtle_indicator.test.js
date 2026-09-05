// Test Suite: Week Selection Subtle Indicator & Future Weeks Muted
const { setupTestEnvironment, cssSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: week_subtle_indicator.test.js');

// 1. Verify CSS Rules for subtle indicator
assert(cssSource.includes('.fruit-item.selected'), 'CSS must define .fruit-item.selected');
assert(
  cssSource.includes('border-bottom: 2px solid #FFE600 !important;'),
  'Selected week fruit item must have clean yellow bottom indicator'
);

// Verify absence of saturated yellow background / glow on .fruit-item.selected
const selectedRuleMatch = cssSource.match(/\.fruit-item\.selected\s*\{([^}]+)\}/);
assert(selectedRuleMatch, '.fruit-item.selected rule must exist');
assert(
  !selectedRuleMatch[1].includes('box-shadow'),
  '.fruit-item.selected must NOT have box-shadow yellow glow'
);
assert(
  !selectedRuleMatch[1].includes('background: rgba(255, 230, 0'),
  '.fruit-item.selected must NOT have yellow background tint'
);
console.log('  [PASS] Yellow glow and background tint removed; subtle yellow bottom line verified.');

// 2. Verify Locked / Future Weeks Stay Muted Even When Selected
assert(
  cssSource.includes('.fruit-item.locked.selected'),
  'CSS must define .fruit-item.locked.selected'
);
const lockedSelectedMatch = cssSource.match(/\.fruit-item\.locked\.selected\s*\{([^}]+)\}/);
assert(lockedSelectedMatch, '.fruit-item.locked.selected rule must exist');
assert(
  lockedSelectedMatch[1].includes('opacity: 0.35 !important;'),
  'Future locked week must maintain muted opacity 0.35 when selected'
);
assert(
  lockedSelectedMatch[1].includes('filter: grayscale(0.8) !important;'),
  'Future locked week must maintain grayscale(0.8) when selected'
);
console.log('  [PASS] Future locked weeks strictly remain muted and grayscale when selected.');

// 3. Runtime Selection Verification
const env = setupTestEnvironment();
const { elementsById, state } = env;

// Trigger arcade HUD render for Sept 2026 (WK 01 is active, WK 04/05 are locked)
state.mockDate = '2026-09-04';
global.window.__kuroganeRenderArcadeHUD();

const fruitRow = elementsById['fruit-checkpoints-row'];
assert(fruitRow, 'fruit-checkpoints-row container must exist');
assert(fruitRow.children.length > 0, 'Fruit checkpoints must be rendered');

// Find WK 04 or WK 05 (locked future week)
const lockedWeekEl = fruitRow.children.find(c => c.className.includes('locked'));
assert(lockedWeekEl, 'A future week should have locked status');

// Click on the locked week
lockedWeekEl.dispatchEvent('click');

assert.strictEqual(
  state.selectedWeekNum !== null,
  true,
  'Selecting a week updates state.selectedWeekNum'
);

// Re-render
global.window.__kuroganeRenderArcadeHUD();
const updatedLockedWeekEl = fruitRow.children.find(c => c.className.includes('locked'));
assert(
  updatedLockedWeekEl.className.includes('selected'),
  'Selected locked week has .selected class for yellow bottom indicator'
);

console.log('  [PASS] Runtime selection of locked week toggles selected state while retaining locked styles.');
console.log('>>> SUITE PASSED: week_subtle_indicator.test.js\n');
