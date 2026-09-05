// Test Suite: Streak Recovery Banner & Protect / Deactivate Shield Button Labels
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: streak_banner_and_protect_btn.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// Setup account history with prior streak
state.firstLoginDate = '2026-08-01';
state.protocols.forEach(p => { p.startDate = '2026-08-01'; });
const allIds = state.protocols.map(p => p.id);

// Seed 14 100% days leading to an earned shield
for (let i = 1; i <= 14; i++) {
  const dStr = `2026-08-${String(i).padStart(2, '0')}`;
  state.history[dStr] = [...allIds];
}
state.mockDate = '2026-08-15';
global.window.__kuroganeUpdateScoringAndConsistency();
assert.strictEqual(state.shields, 1, 'Pre-condition: Must have 1 shield');

// 1. Simulate Day N miss on 2026-08-15 (partial or zero score)
state.history['2026-08-15'] = [];
state.mockDate = '2026-08-16'; // Day N+1

global.window.__kuroganeRenderArcadeHUD();

const banner = elementsById['streak-shield-alert-banner'];
const titleEl = elementsById['shield-banner-title'];
const actionBtn = elementsById['use-shield-recover-btn'];

assert(banner, 'streak-shield-alert-banner element must exist');
assert.strictEqual(banner.style.display, 'flex', 'Streak recovery banner must be visible on Day N+1');
assert(titleEl, 'shield-banner-title element must exist');
assert(actionBtn, 'use-shield-recover-btn element must exist');

// Verification: When streak at risk and shield available
assert.strictEqual(
  titleEl.textContent,
  'STREAK IS AT RISK // 1-DAY MISS DETECTED',
  'Title must be STREAK IS AT RISK // 1-DAY MISS DETECTED'
);
assert(
  actionBtn.innerHTML.includes('PROTECT'),
  'Action button must display PROTECT label'
);
assert(
  actionBtn.innerHTML.includes('shield'),
  'Action button must contain shield icon'
);
console.log('  [PASS] At-risk banner title and PROTECT button label verified.');

// 2. Simulate User Activating Shield for Yesterday
state.shieldedDates = { '2026-08-15': true };
state.shields = 0;
state.shieldAppliedOn = '2026-08-16';

global.window.__kuroganeRenderArcadeHUD();

// Verification: When streak is protected with active shield
assert.strictEqual(banner.style.display, 'flex', 'Banner must remain visible to permit deactivation');
assert.strictEqual(
  titleEl.textContent,
  'STREAK PROTECTED AND SHIELD ACTIVATED',
  'Title must shift to STREAK PROTECTED AND SHIELD ACTIVATED'
);
assert(
  actionBtn.innerHTML.includes('DEACTIVATE SHIELD'),
  'Action button must display DEACTIVATE SHIELD label'
);
assert(
  actionBtn.innerHTML.includes('restart_alt'),
  'Action button must contain restart_alt icon'
);
console.log('  [PASS] Shield activated banner title and DEACTIVATE SHIELD button label verified.');

console.log('>>> SUITE PASSED: streak_banner_and_protect_btn.test.js\n');
