// Test Suite: Shield Rules & Static Neon Glow (No Dynamic Glow, Day N+1 Static Glow, Day N+1 Muted Inventory, Day N+2 Removal)
const { setupTestEnvironment, cssSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: shield_rules.test.js');

// 1. CSS Rules Verification
// Rule 5a: Active earned shields will not have glow
assert(cssSource.includes('.shield-slot.active'), 'CSS must define .shield-slot.active');
assert(
  cssSource.includes('filter: none !important;'),
  'Active earned shields must have no glow (filter: none !important)'
);

// Rule 5b: Day N partial or no show -> on Day N+1 shield will be STATIC GLOW. Never dynamic.
assert(
  cssSource.includes('.shields-slot-container.can-apply-shield .shield-slot.active'),
  'CSS must define .shields-slot-container.can-apply-shield .shield-slot.active for Day N+1 warning'
);
assert(
  cssSource.includes('animation: none !important;'),
  'Shields must never animate dynamically (animation: none !important)'
);

// Rule 5c: When applied on Day N+1, present in inventory but muted with color
assert(
  cssSource.includes('.shield-slot.applied-today'),
  'CSS must define .shield-slot.applied-today'
);
assert(
  cssSource.includes('opacity: 0.45 !important;'),
  'Applied shield on Day N+1 must be present with muted opacity (0.45)'
);

console.log('  [PASS] CSS shield glow and inventory presentation rules verified.');

// 2. Logic: Shield Earning Rule (1 per 14 100% days, max 3)
const env = setupTestEnvironment();
const { state } = env;

assert.strictEqual(state.shields, 0, 'Initial shields must be 0');

state.protocols.forEach(p => { p.startDate = '2026-08-01'; });
const allProtoIds = state.protocols.map(p => p.id);

// Seed 14 100% days
for (let i = 1; i <= 14; i++) {
  const dStr = `2026-08-${String(i).padStart(2, '0')}`;
  state.history[dStr] = [...allProtoIds];
}

// Trigger state evaluation via mock date
state.mockDate = '2026-08-15';
global.window.__kuroganeUpdateScoringAndConsistency();

assert.strictEqual(state.shields, 1, '14 perfect days must earn exactly 1 shield');
console.log('  [PASS] 1 shield earned on 14 completed days.');

// 3. Verify Active Shield has no glow in HUD rendering
global.window.__kuroganeRenderArcadeHUD();
const slot1 = env.elementsById['shield-slot-1'];
assert.strictEqual(slot1.className, 'shield-slot active', 'Slot 1 must be active');

// 4. Verify Day N Miss / Partial -> Day N+1 Static Glow Warning (.can-apply-shield)
// Day N: 2026-08-15 is missed (empty history)
state.history['2026-08-15'] = [];
state.mockDate = '2026-08-16'; // Day N+1
global.window.__kuroganeRenderArcadeHUD();
const container = env.elementsById['shields-slot-container'];
assert(container.classList.contains('can-apply-shield'), 'Day N+1 must activate static glow warning .can-apply-shield');
console.log('  [PASS] Day N+1 triggers static warning on available shield.');

// 5. Verify Applying Shield on Day N+1: Present in inventory but muted with color (.applied-today)
state.shieldedDates = { '2026-08-15': true };
state.shields = 0; // consumed
state.shieldAppliedOn = '2026-08-16'; // applied on Day N+1
global.window.__kuroganeRenderArcadeHUD();
assert.strictEqual(slot1.className, 'shield-slot applied-today', 'Applied shield on Day N+1 must be present in inventory slot as applied-today');
console.log('  [PASS] Applied shield on Day N+1 is visible in inventory as applied-today (muted).');

// 6. Verify Day N+2: Shield is completely removed from inventory (.muted)
state.mockDate = '2026-08-17'; // Day N+2
global.window.__kuroganeRenderArcadeHUD();
assert.strictEqual(slot1.className, 'shield-slot muted', 'On Day N+2, shield must be permanently removed from inventory (muted outline)');
console.log('  [PASS] On Day N+2, applied shield is removed from inventory slot.');

console.log('>>> SUITE PASSED: shield_rules.test.js\n');
