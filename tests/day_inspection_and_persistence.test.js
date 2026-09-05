// Test Suite: Static Day Inspection Indicator, Clean Tab Labeling, and Tab Switching Persistence
const { setupTestEnvironment, cssSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: day_inspection_and_persistence.test.js');

// 1. Static Green Target on Inspected Dot (Requirement 4)
assert(
  cssSource.includes('.maze-pellet.selected-inspection'),
  'CSS must define .maze-pellet.selected-inspection'
);
const inspectRuleMatch = cssSource.match(/\.maze-pellet\.selected-inspection\s*\{([^}]+)\}/);
assert(inspectRuleMatch, '.maze-pellet.selected-inspection rule must exist');
assert(
  !inspectRuleMatch[1].includes('animation:'),
  'Inspected dot must be completely static (no breathing/pulsing animation)'
);
assert(
  inspectRuleMatch[1].includes('outline: 2px solid #00FFAA !important;'),
  'Inspected dot must have clean static #00FFAA target outline'
);
console.log('  [PASS] Static green inspection indicator verified (no pulse animation).');

// 2. Day Inspection Tab Labeling (Requirement 5)
const env = setupTestEnvironment();
const { elementsById, state } = env;

// Ensure protocols are active for the viewed month
state.protocols.forEach(p => { p.startDate = '2026-01-01'; });

// Select 3rd Sept 2026
state.mockDate = '2026-09-04'; // Today is 4th Sept, so 3rd Sept is a past day
state.selectedInspectionDate = '2026-09-03';

global.window.__kuroganeRenderProtocols();

const dayTabEl = elementsById['phase-tab-day'];
const titleEl = elementsById['protocols-section-title'];

assert(dayTabEl, 'phase-tab-day element must exist');
assert.strictEqual(
  dayTabEl.textContent,
  '3rd Sep Quests',
  'Tab label for 3rd Sept inspection must be exactly "3rd Sep Quests"'
);
assert(
  !dayTabEl.textContent.includes('READ ONLY'),
  'Tab label must NOT contain "READ ONLY"'
);
assert(
  !titleEl.textContent.includes('(READ-ONLY)'),
  'Section title must NOT contain "(READ-ONLY)" text'
);

// Verify visual read-only conveyances on cards and banner
const container = elementsById['protocols-list'];
const banner = container.querySelector('.maze-filter-banner');
assert(banner, 'Day inspection filter banner must be rendered');
assert(
  banner.innerHTML.includes('PAST DAY'),
  'Banner conveys past day visually with status pill'
);

const pastCard = container.querySelector('.protocol-card');
if (pastCard) {
  assert(
    pastCard.className.includes('read-only'),
    'Cards on inspected past days must visually convey read-only via .read-only class'
  );
}
console.log('  [PASS] Tab label formatted as "3rd Sep Quests", without "READ ONLY" in text, conveyed visually.');

// 3. Selection Persistence Across Tab Switches (Requirement 6)
// Select 02nd Sept
state.selectedInspectionDate = '2026-09-02';
global.window.__kuroganeRenderProtocols();

assert.strictEqual(
  dayTabEl.textContent,
  '2nd Sep Quests',
  'Tab label for 02nd Sept inspection must be "2nd Sep Quests"'
);

// Click YEARLY ARCHIVE tab
const allTabEl = elementsById['phase-tab-all'];
allTabEl.dispatchEvent('click');

assert.strictEqual(
  state.currentFilter,
  'all',
  'State filter switched to "all" (Yearly Archive)'
);
assert(
  titleEl.textContent.includes('YEARLY QUEST ARCHIVE'),
  'Yearly archive view rendered'
);
assert.strictEqual(
  state.selectedInspectionDate,
  '2026-09-02',
  'Inspected date 2026-09-02 must NOT be erased when switching to Yearly Archive'
);

// Now click BACK to the first tab (2nd Sep Quests)
dayTabEl.dispatchEvent('click');

assert.strictEqual(
  state.currentFilter,
  'today',
  'State filter switched back to "today" tab'
);
assert.strictEqual(
  state.selectedInspectionDate,
  '2026-09-02',
  'Inspected date must be strictly preserved after returning from Yearly Archive'
);
assert.strictEqual(
  dayTabEl.textContent,
  '2nd Sep Quests',
  'Day tab label must still display "2nd Sep Quests"'
);

console.log('  [PASS] Selected day inspection strictly preserved across Yearly Archive tab toggle.');
console.log('>>> SUITE PASSED: day_inspection_and_persistence.test.js\n');
