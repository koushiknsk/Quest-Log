// Test Suite: Sunday Partial Completed Day Color & Badge
const { setupTestEnvironment, cssSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: sunday_partial_color.test.js');

// 1. CSS Assertions for Sunday Big Dot Partial
assert(cssSource.includes('.maze-pellet.big-dot.dot-partial'), 'CSS must define .maze-pellet.big-dot.dot-partial');
const sundayPartialMatch = cssSource.match(/\.maze-pellet\.big-dot\.dot-partial\s*\{([^}]+)\}/);
assert(sundayPartialMatch, '.maze-pellet.big-dot.dot-partial rule must exist');
assert(sundayPartialMatch[1].includes('#FF9500'), 'Sunday partial dot must have vibrant orange background (#FF9500)');
assert(sundayPartialMatch[1].includes('width: 12px'), 'Sunday partial dot must match full size (12px)');
assert(sundayPartialMatch[1].includes('height: 12px'), 'Sunday partial dot must match full size (12px)');
assert(sundayPartialMatch[1].includes('opacity: 1 !important;'), 'Sunday partial dot must be fully saturated (opacity 1)');

// Check partial badge styling
assert(cssSource.includes('.read-only-badge.partial-badge'), 'CSS must define .read-only-badge.partial-badge');
console.log('  [PASS] CSS for Sunday big dot partial color and saturation verified.');

// 2. State & DOM Rendering for Partial Sunday
const env = setupTestEnvironment();
const { elementsById, state } = env;

// 2026-09-06 is Sunday
const sundayDateStr = '2026-09-06';
const sundayDate = new Date(sundayDateStr + 'T12:00:00');
assert.strictEqual(sundayDate.getDay(), 0, '2026-09-06 must be a Sunday');

// Configure protocols: only 1 protocol scheduled for Sunday (reproducing user scenario)
state.protocols = [
  {
    id: 'proto_rew',
    name: 'REW',
    category: 'fitness',
    icon: 'fitness_center',
    frequency: 1,
    selectedDays: [0], // Sunday
    startDate: '2026-09-01',
    endDate: null,
    notes: 'asdras',
    completed: false
  }
];

// Seed Sunday as a partial day (e.g. 50 PTS)
state.partialDays = { [sundayDateStr]: 50 };
state.mockDate = '2026-09-07'; // Looking back at Sunday as a past day

// Render HUD
global.window.__kuroganeRenderArcadeHUD();

const stream = elementsById['maze-pellets-stream'];
assert(stream, 'maze-pellets-stream must exist');

const pellets = stream.querySelectorAll('.maze-pellet');
// Day 6 is index 5
const sundayPellet = Array.from(pellets).find(p => p.dataset && p.dataset.date === sundayDateStr);
assert(sundayPellet, 'Sunday pellet for 2026-09-06 must be rendered in pellets stream');

assert(sundayPellet.classList.contains('big-dot'), 'Sunday pellet must have big-dot class');
assert(sundayPellet.classList.contains('dot-partial'), 'Sunday partial pellet must have dot-partial class (vibrant orange)');
assert(!sundayPellet.classList.contains('dot-muted'), 'Sunday partial pellet must NOT be muted');
console.log('  [PASS] Sunday pellet correctly renders with big-dot and dot-partial classes.');

// 3. Inspect Sunday: Verify PARTIAL badge is displayed instead of MISSED
state.selectedInspectionDate = sundayDateStr;
global.window.__kuroganeRenderProtocols();

const container = elementsById['protocols-list'];
const card = container.querySelector('.protocol-card');
assert(card, 'Protocol card for REW must be rendered');

const badge = card.querySelector('.read-only-badge');
assert(badge, 'Read-only badge must be present on inspected past card');
assert.strictEqual(badge.textContent, 'PARTIAL', 'Badge on partial Sunday must say PARTIAL, not MISSED');
assert(badge.classList.contains('partial-badge'), 'Badge must have partial-badge class');
console.log('  [PASS] Inspected Sunday card correctly displays PARTIAL badge in vibrant orange.');

console.log('>>> SUITE PASSED: sunday_partial_color.test.js\n');
