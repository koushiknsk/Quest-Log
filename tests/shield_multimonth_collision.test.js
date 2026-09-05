// Test Suite: Multi-Month Shield Usage & Isolation (Sept Week 3 vs Oct Week 3/4)
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: shield_multimonth_collision.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// Configure protocols to start from August
state.protocols.forEach(p => { p.startDate = '2026-08-01'; });
const allProtoIds = state.protocols.map(p => p.id);

// 1. User has earned shields (e.g. 2 shields)
state.shields = 2;

// 2. User uses 1 shield on 16th September 2026 (target date: 15th Sept)
state.mockDate = '2026-09-16';
state.history['2026-09-14'] = [...allProtoIds]; // two days ago has 100%
state.history['2026-09-15'] = [];               // yesterday missed
global.window.__kuroganeRenderArcadeHUD();

// Apply shield for 15th Sept
global.window.__kuroganeUseShieldToRecoverYesterday();

assert.strictEqual(state.shieldedDates['2026-09-15'], true, 'Shield must be applied for 15th Sept');
assert(state.usedShieldWeeks['2026-09-W03'], 'usedShieldWeeks must record September week 3 (2026-09-W03)');
assert.strictEqual(state.shields, 1, 'Shield count must decrement to 1');
console.log('  [PASS] First shield successfully used in September (recorded under 2026-09-W03).');

// 3. User travels to October 19th 2026 (Day N).
// Day N-1 (18th Oct) is a partial day.
// Two days ago (17th Oct) was 100% complete so priorStreak > 0.
state.mockDate = '2026-10-19';
state.history['2026-10-17'] = [...allProtoIds]; // 100%
state.partialDays = { '2026-10-18': 50 };       // 18th Oct partial day
state.history['2026-10-18'] = [allProtoIds[0]]; // partial history
state.dailyScores['2026-10-18'] = 50;

global.window.__kuroganeRenderArcadeHUD();

// Verify Banner is SHOWN
const banner = elementsById['streak-shield-alert-banner'];
assert(banner, 'Streak shield alert banner element must exist');
assert.strictEqual(banner.style.display, 'flex', 'Streak recovery banner MUST be displayed on 19th Oct when 18th is partial');

// Verify shields slot container has static glow warning (.can-apply-shield)
const shieldContainer = elementsById['shields-slot-container'];
assert(
  shieldContainer.classList.contains('can-apply-shield'),
  'Available shield must display static glow warning (.can-apply-shield) on 19th Oct'
);

console.log('  [PASS] Streak recovery banner and static shield glow correctly triggered on 19th Oct.');

// 4. Verify ability to USE shield on 19th Oct
// User applies shield for 18th Oct
global.window.__kuroganeUseShieldToRecoverYesterday();

assert.strictEqual(state.shieldedDates['2026-10-18'], true, 'Shield must be applied for 18th Oct');
assert.strictEqual(state.shieldAppliedOn, '2026-10-19', 'shieldAppliedOn must be recorded as 2026-10-19');
assert(
  state.usedShieldWeeks['2026-10-W04'] || state.usedShieldWeeks['2026-10-W03'],
  'October week must be recorded in usedShieldWeeks without colliding with September'
);
assert.strictEqual(state.shields, 0, 'Remaining shields should now be 0');

console.log('  [PASS] Second shield successfully applied in October without cross-month week collision.');
console.log('>>> SUITE PASSED: shield_multimonth_collision.test.js\n');
