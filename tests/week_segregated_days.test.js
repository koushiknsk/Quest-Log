// Test Suite: Week Quests Segregated by Individual Days
const { setupTestEnvironment, cssSource, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: week_segregated_days.test.js');

// 1. CSS Verification for segregated week-day groups
assert(cssSource.includes('.week-day-group'), 'CSS must define .week-day-group');
assert(cssSource.includes('.week-day-header'), 'CSS must define .week-day-header');
assert(cssSource.includes('.week-day-badge'), 'CSS must define .week-day-badge');
assert(cssSource.includes('.week-day-status'), 'CSS must define .week-day-status');
assert(cssSource.includes('.day-status-pill'), 'CSS must define .day-status-pill');
assert(cssSource.includes('.week-day-quests-list'), 'CSS must define .week-day-quests-list');
assert(cssSource.includes('.rest-day-notice'), 'CSS must define .rest-day-notice');
console.log('  [PASS] All CSS structures for week-day groups and rest notices verified.');

// 2. Runtime Segregation Verification
const env = setupTestEnvironment();
const { elementsById, state } = env;

// Set state to September 2026, WK 01 selected
state.mockDate = '2026-09-04'; // Local Friday
state.selectedWeekNum = 1;
state.protocols.forEach(p => { p.startDate = '2026-01-01'; });

global.window.__kuroganeRenderProtocols();

const container = elementsById['protocols-list'];
assert(container, 'protocols-list container must exist');

// Verify tab header label
const dayTabEl = elementsById['phase-tab-day'];
assert(dayTabEl.textContent.includes('WK 01 QUESTS'), 'Tab label must be WK 01 QUESTS');

// Verify segregated week-day groups
const dayGroups = container.querySelectorAll('.week-day-group');
assert(dayGroups.length >= 5, `WK 01 should contain segregated day groups (found: ${dayGroups.length})`);

// Verify that each group has a header with week-day-title and status pill
let hasRestDayNotice = false;
let hasQuestsRendered = false;

dayGroups.forEach((group, idx) => {
  const badge = group.querySelector('.week-day-badge');
  const label = group.querySelector('.week-day-label');
  const pill = group.querySelector('.day-status-pill');

  assert(badge && badge.textContent, `Day group ${idx} must have a day of week badge (e.g. MON, TUE)`);
  assert(label && label.textContent.includes('DAY'), `Day group ${idx} label must include DAY number`);
  assert(pill && pill.textContent, `Day group ${idx} must display a status pill`);

  if (group.innerHTML.includes('SCHEDULED REST DAY')) {
    hasRestDayNotice = true;
  }
  if (group.querySelector('.protocol-card')) {
    hasQuestsRendered = true;
  }
});

assert(hasQuestsRendered, 'At least one day in the week must have scheduled quest cards rendered');
console.log(`  [PASS] Rendered ${dayGroups.length} segregated days with individual headers, badges, and status pills.`);
console.log('>>> SUITE PASSED: week_segregated_days.test.js\n');
