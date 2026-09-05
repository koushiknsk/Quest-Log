// Test Suite: Context-Aware "NEW QUEST" Form (Today Quick Mode vs Yearly Full Mode)
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: today_new_quest_form.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

state.mockDate = '2026-09-04'; // Friday (day index 5)

const openInitBtn = elementsById['open-init-screen-btn'];
const formTimeline = elementsById['form-timeline-group'];
const formFreq = elementsById['form-frequency-group'];
const startDateInput = elementsById['start-date-input'];
const habitNameInput = elementsById['habit-name-input'];
const submitBtn = elementsById['submit-protocol-btn'];

// 1. Test clicking NEW QUEST from TODAY'S QUESTS tab
state.currentFilter = 'today';
openInitBtn.dispatchEvent('click');

assert.strictEqual(
  state.newQuestContext,
  'today',
  'Context must be set to "today" when launched from Today\'s Quests'
);
assert.strictEqual(
  formTimeline.style.display,
  'none',
  'Timeline (dates) group must be hidden when adding quest from Today\'s Quests'
);
assert.strictEqual(
  formFreq.style.display,
  'none',
  'Frequency slider and days-of-week chips must be hidden when adding quest from Today\'s Quests'
);
console.log('  [PASS] Timeline and Frequency form sections hidden for Today\'s Quests.');

// 2. Submit new quest in Today mode
habitNameInput.value = 'QUICK_MEDITATION';
state.selectedCategory = 'mindfulness';
state.selectedCategoryIcon = 'self_improvement';
global.window.__kuroganeSkipDeployAnimation = true;

global.window.__kuroganeHandleFormSubmission();

// Verify newly created protocol in state
const createdProto = state.protocols.find(p => p.name === 'QUICK_MEDITATION');
assert(createdProto, 'Quick quest must be deployed to protocols');
assert.strictEqual(createdProto.startDate, '2026-09-04', 'Start date must be today');
assert.strictEqual(createdProto.endDate, '2026-09-04', 'End date must be today');
assert.strictEqual(createdProto.frequency, 1, 'Frequency must default to 1 day');
assert.deepStrictEqual(createdProto.selectedDays, [5], 'Scheduled days must be today\'s day index (Friday = 5)');
console.log('  [PASS] Quick quest successfully created with today-only scope.');

// 3. Test clicking NEW QUEST from YEARLY ARCHIVE tab
state.currentFilter = 'all';
openInitBtn.dispatchEvent('click');

assert.strictEqual(
  state.newQuestContext,
  'yearly',
  'Context must be set to "yearly" when launched from Yearly Archive'
);
assert.strictEqual(
  formTimeline.style.display,
  'block',
  'Timeline group must be visible when adding quest from Yearly Archive'
);
assert.strictEqual(
  formFreq.style.display,
  'block',
  'Frequency group must be visible when adding quest from Yearly Archive'
);
console.log('  [PASS] Timeline and Frequency form sections visible for Yearly Archive.');

console.log('>>> SUITE PASSED: today_new_quest_form.test.js\n');
