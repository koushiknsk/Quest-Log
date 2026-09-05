// Test Suite: Pre-Login Boundary Guard on Progress Bar (Disable Actions Prior to First Login Date)
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: first_login_boundary.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// User first logs into the system on September 4th, 2026
state.firstLoginDate = '2026-09-04';
state.mockDate = '2026-09-04';
state.viewedYear = 2026;
state.viewedMonthIndex = 8; // September

global.window.__kuroganeRenderArcadeHUD();

const stream = elementsById['maze-pellets-stream'];
assert(stream.children.length >= 30, 'Month maze stream must render all month pellets');

// 1. Verify dots prior to firstLoginDate (Sept 1, 2, 3) are disabled
const pelletSept1 = stream.children.find(p => p.dataset && p.dataset.date === '2026-09-01');
const pelletSept2 = stream.children.find(p => p.dataset && p.dataset.date === '2026-09-02');
const pelletSept3 = stream.children.find(p => p.dataset && p.dataset.date === '2026-09-03');
const pelletSept4 = stream.children.find(p => p.dataset && p.dataset.date === '2026-09-04');

assert(pelletSept1, 'Pellet for 2026-09-01 must exist');
assert(pelletSept1.classList.contains('pre-login-disabled'), 'Pre-login pellet must have class pre-login-disabled');
assert.strictEqual(pelletSept1.style.opacity, '0.25', 'Pre-login pellet must have muted opacity 0.25');
assert.strictEqual(pelletSept1.style.cursor, 'not-allowed', 'Pre-login pellet must have cursor not-allowed');

assert(pelletSept2.classList.contains('pre-login-disabled'), 'Pellet Sept 2 must be pre-login disabled');
assert(pelletSept3.classList.contains('pre-login-disabled'), 'Pellet Sept 3 must be pre-login disabled');
assert(!pelletSept4.classList.contains('pre-login-disabled'), 'Pellet Sept 4 (first login day) must NOT be disabled');

console.log('  [PASS] Progress bar pellets prior to firstLoginDate are styled as pre-login-disabled.');

// 2. Verify Clicking Pre-Login Dot blocks inspection
pelletSept1.dispatchEvent('click');
assert.notStrictEqual(
  state.selectedInspectionDate,
  '2026-09-01',
  'Clicking pre-login pellet must not set selectedInspectionDate'
);
console.log('  [PASS] Clicking pre-login pellet prevents inspection.');

// 3. Verify renderProtocols Pre-Initialization Period Guard
state.currentFilter = 'today';
state.selectedInspectionDate = '2026-09-01';
global.window.__kuroganeRenderProtocols();

const container = elementsById['protocols-list-container'];
assert(
  container.innerHTML.includes('PRE-INITIALIZATION PERIOD'),
  'Protocols view must render PRE-INITIALIZATION PERIOD notice'
);
const cards = container.children.filter(c => c.classList && c.classList.contains('protocol-card'));
assert.strictEqual(cards.length, 0, 'No quest cards may be rendered for pre-initialization dates');

console.log('  [PASS] Pre-initialization notice displayed and all quest actions disabled.');
console.log('>>> SUITE PASSED: first_login_boundary.test.js\n');
