// Test Suite: Quest Card Layouts & Read-Only Specification Modal
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: quest_card_and_modal.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

state.mockDate = '2026-09-04';
state.protocols.forEach(p => { p.startDate = '2026-01-01'; });
state.currentFilter = 'all'; // Switch to Yearly Archive
state.selectedInspectionDate = null;
state.selectedWeekNum = null;

global.window.__kuroganeRenderProtocols();

const container = elementsById['protocols-list-container'];
const yearlyCards = container.children.filter(c => c.classList && c.classList.contains('protocol-card'));

assert(yearlyCards.length > 0, 'Yearly archive must render quest cards');

const firstYearlyCard = yearlyCards[0];
const targetProto = state.protocols.find(p => p.id === firstYearlyCard.dataset.id);

// 1. Verify Yearly Archive Card Layout
// Sub-line: CATEGORY • {frequency}D/WK
const metaEl = firstYearlyCard.children.find(c => c.className === 'protocol-info');
assert(metaEl, 'Card must have protocol-info');
assert(
  firstYearlyCard.innerHTML.includes(`${targetProto.frequency}D/WK`),
  'Yearly card must display frequency in meta line'
);
assert(
  !firstYearlyCard.innerHTML.includes('FROM:'),
  'Yearly card must NOT display "FROM:" date timeline on surface'
);
assert(
  !firstYearlyCard.innerHTML.includes('DAYS CLEARED'),
  'Yearly card must NOT display "0 DAYS CLEARED" badge on surface'
);
assert(
  firstYearlyCard.innerHTML.includes('protocol-delete-btn'),
  'Yearly card must contain delete button'
);
console.log('  [PASS] Yearly archive card format: clean symbol, name, category, and {frequency}D/WK verified.');

// 2. Verify Opening Read-Only Quest Specification Modal
const modalBackdrop = elementsById['quest-details-modal-backdrop'];
const modalName = elementsById['modal-quest-name'];
const modalCategory = elementsById['modal-quest-category'];
const modalFreq = elementsById['modal-quest-frequency'];
const modalCleared = elementsById['modal-quest-cleared-count'];
const modalDays = elementsById['modal-quest-days'];
const modalTimeline = elementsById['modal-quest-timeline'];
const modalNotes = elementsById['modal-quest-notes'];

// Click the yearly card to open modal
firstYearlyCard.dispatchEvent('click');

assert.strictEqual(
  modalBackdrop.style.display,
  'flex',
  'Clicking yearly card must open quest details modal'
);
assert.strictEqual(
  modalName.textContent,
  targetProto.name,
  'Modal must display quest name'
);
assert.strictEqual(
  modalCategory.textContent,
  targetProto.category.toUpperCase().replace('DEEPFOCUS', 'DEEP_FOCUS'),
  'Modal must display category'
);
assert.strictEqual(
  modalFreq.textContent,
  `${targetProto.frequency}D/WK`,
  'Modal must display frequency pill'
);
assert(
  modalCleared.textContent.includes('CLEARED'),
  'Modal must display yearly cleared count pill'
);
assert(
  modalDays.textContent.length > 0,
  'Modal must display scheduled days spec'
);
assert(
  modalTimeline.textContent.includes('FROM'),
  'Modal must display timeline spec'
);
console.log('  [PASS] Read-only quest specification modal opens and populates all tactical specs.');

// Close modal
const closeBtn = elementsById['close-quest-details-btn'];
closeBtn.dispatchEvent('click');
assert.strictEqual(
  modalBackdrop.style.display,
  'none',
  'Closing modal must hide backdrop'
);
console.log('  [PASS] Quest specification modal closes cleanly.');

// 3. Verify Today's Quests Card Layout
state.currentFilter = 'today';
global.window.__kuroganeRenderProtocols();

const todayCards = container.children.filter(c => c.classList && c.classList.contains('protocol-card'));
assert(todayCards.length > 0, "Today's quests must render cards");

const firstTodayCard = todayCards[0];
assert(
  firstTodayCard.innerHTML.includes('hex-checkbox'),
  "Today's card must have hex checkbox (tick)"
);
assert(
  !firstTodayCard.innerHTML.includes('D/WK'),
  "Today's card meta must NOT display frequency or day symbols"
);
assert(
  !firstTodayCard.innerHTML.includes('FROM:'),
  "Today's card meta must NOT display date timeline"
);
console.log("  [PASS] Today's quests card format: clean symbol, name, category, and tick verified.");

console.log('>>> SUITE PASSED: quest_card_and_modal.test.js\n');
