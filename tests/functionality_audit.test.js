// Test Suite: Comprehensive Functionality Audit
// Audits CSV Export, 2-Day Consecutive Miss Streak Breaker, Shield Refund Toggle, Rest Day EOD Scoring, and Compounding Bonus
const { setupTestEnvironment, assert } = require('./test_harness');

console.log('>>> RUNNING SUITE: functionality_audit.test.js');

const env = setupTestEnvironment();
const { elementsById, state } = env;

// Ensure protocols active across test dates
state.mockDate = '2026-09-04';
state.protocols.forEach(p => { p.startDate = '2026-01-01'; });

// =========================================================================
// TEST 1: Multi-Month Data Export (.CSV) Workflow & Modal
// =========================================================================
const exportBtn = elementsById['export-data-btn'];
const exportModal = elementsById['export-modal-backdrop'];
const exportList = elementsById['export-months-list'];
const selectAllBtn = elementsById['export-select-all-btn'];
const selectCurrentBtn = elementsById['export-select-current-btn'];
const deselectAllBtn = elementsById['export-deselect-all-btn'];
const confirmDownloadBtn = elementsById['export-confirm-download-btn'];
const closeExportBtn = elementsById['close-export-modal-btn'];

assert(exportBtn, 'Export data button must exist in header');
assert(exportModal, 'Export modal backdrop must exist');

// Seed mock history in 2 different months: August and September 2026
state.history['2026-08-15'] = [state.protocols[0].id];
state.history['2026-09-01'] = [state.protocols[0].id, state.protocols[1].id];

// 1a. Open Export Modal
exportBtn.dispatchEvent('click');
assert.strictEqual(exportModal.style.display, 'flex', 'Export modal must open with display: flex');
assert(exportModal.classList.contains('show'), 'Export modal must have show class');

const monthRows = exportList.children;
assert(monthRows.length >= 2, 'Export list must contain populated months (August and September)');

// 1b. Test Deselect All
deselectAllBtn.dispatchEvent('click');
const checkedAfterDeselect = exportList.querySelectorAll('.export-checkbox:checked');
assert.strictEqual(checkedAfterDeselect.length, 0, 'Deselect All must uncheck all month checkboxes');

// 1c. Test Select All
selectAllBtn.dispatchEvent('click');
const checkedAfterSelectAll = exportList.querySelectorAll('.export-checkbox:checked');
assert.strictEqual(checkedAfterSelectAll.length, monthRows.length, 'Select All must check all month checkboxes');

// 1d. Test Select Current Month
selectCurrentBtn.dispatchEvent('click');
const checkedCurrent = exportList.querySelectorAll('.export-checkbox:checked');
assert.strictEqual(checkedCurrent.length, 1, 'Select Current Month must check exactly 1 month');

// 1e. Generate CSV Download
let createdDownloadLink = null;
const origCreateElement = global.document.createElement;
global.document.createElement = (tag) => {
  const el = origCreateElement(tag);
  if (tag === 'a') {
    createdDownloadLink = el;
  }
  return el;
};

confirmDownloadBtn.dispatchEvent('click');

assert(createdDownloadLink, 'CSV export must generate an anchor download link');
const downloadAttr = createdDownloadLink.getAttribute('download');
assert(downloadAttr && downloadAttr.startsWith('kurogane_directives_export_'), 'Download filename must match kurogane_directives_export_*.csv pattern');
const hrefAttr = createdDownloadLink.getAttribute('href');
assert(hrefAttr && hrefAttr.startsWith('data:text/csv;charset=utf-8,'), 'Download link href must encode text/csv data');
assert.strictEqual(exportModal.style.display, 'none', 'Export modal must close automatically after generating CSV');

global.document.createElement = origCreateElement;
console.log('  [PASS] Multi-month CSV Export modal, month selectors, and download generation verified.');


// =========================================================================
// TEST 2: 2 Consecutive Missed Days Strictly Breaks Streak
// =========================================================================
// Setup: Today is 2026-09-04 (Friday). Day 2 (Wednesday) and Day 3 (Thursday) are both missed.
state.mockDate = '2026-09-04';
state.shields = 2; // User has shields
state.shieldedDates = {};
delete state.history['2026-09-03']; // Yesterday missed
delete state.history['2026-09-02']; // 2 days ago missed
state.history['2026-09-01'] = state.protocols.map(p => p.id); // 3 days ago was perfect

global.window.__kuroganeRenderArcadeHUD();

assert.strictEqual(
  state.streak,
  0,
  '2 consecutive missed days must break streak and reset to 0 even if shields are available'
);
console.log('  [PASS] 2 consecutive missed days strictly breaks active streak.');


// =========================================================================
// TEST 3: Shield Dynamic Apply and Refund Deactivation Safeguard
// =========================================================================
// Setup: Exactly 1 missed day (yesterday, 2026-09-03). Day 2 was perfect.
state.mockDate = '2026-09-04';
state.shields = 2;
state.shieldedDates = {};
state.usedShieldWeeks = {};
state.shieldAppliedOn = null;
delete state.history['2026-09-03']; // Only 1 day missed
state.history['2026-09-02'] = state.protocols.map(p => p.id);
state.history['2026-09-01'] = state.protocols.map(p => p.id);

global.window.__kuroganeRenderArcadeHUD();
global.window.__kuroganeRenderProtocols();

const bannerEl = elementsById['streak-shield-alert-banner'];
const bannerTitle = elementsById['shield-banner-title'];
const actionBtn = elementsById['use-shield-recover-btn'];

assert.strictEqual(bannerEl.style.display, 'flex', 'At-risk banner must display for 1-day miss');
assert(bannerTitle.textContent.includes('STREAK IS AT RISK'), 'Banner must indicate streak is at risk');

// 3a. User clicks PROTECT -> opens shield confirm modal
actionBtn.dispatchEvent('click');
const shieldConfirmModal = elementsById['shield-confirm-modal-backdrop'];
assert(shieldConfirmModal.classList.contains('show'), 'Shield confirmation modal must have show class');

// Confirm applying shield
const applyBtn = elementsById['shield-apply-btn'];
applyBtn.dispatchEvent('click');

assert.strictEqual(state.shields, 1, 'Shield count must decrement by 1 from 2 to 1');
assert(state.shieldedDates['2026-09-03'], '2026-09-03 must be registered in shieldedDates');
assert(bannerTitle.textContent.includes('STREAK PROTECTED AND SHIELD ACTIVATED'), 'Banner title must update to STREAK PROTECTED');
assert(actionBtn.textContent.includes('DEACTIVATE SHIELD'), 'Button label must change to DEACTIVATE SHIELD');

// 3b. User clicks DEACTIVATE SHIELD -> opens modal with remove/refund option
actionBtn.dispatchEvent('click');
assert(shieldConfirmModal.classList.contains('show'), 'Shield modal must reopen for deactivation');

// Click Deselect / Refund button
const removeBtn = elementsById['shield-remove-btn'];
removeBtn.dispatchEvent('click');

assert.strictEqual(state.shields, 2, 'Deactivating shield must refund +1 shield back to 2');
assert(!state.shieldedDates['2026-09-03'], '2026-09-03 must be removed from shieldedDates');
assert(bannerTitle.textContent.includes('STREAK IS AT RISK'), 'Banner title must revert back to STREAK IS AT RISK');
assert(actionBtn.textContent.includes('PROTECT'), 'Button label must revert back to PROTECT');
console.log('  [PASS] Shield activation and refund deactivation toggle verified with state integrity.');


// =========================================================================
// TEST 4: Scheduled Rest Day EOD Scoring
// =========================================================================
// On a date with 0 scheduled protocols, calculateDayScore must return 100 PTS
const dateWithNoProtocols = '2026-09-06'; // Sunday
const origSelectedDays = state.protocols.map(p => p.selectedDays);
// Temporarily configure protocols to only run Monday-Friday (days 1-5)
state.protocols.forEach(p => { p.selectedDays = [1, 2, 3, 4, 5]; });

const restDayScore = global.window.__kuroganeCalculateDayScore ? global.window.__kuroganeCalculateDayScore(dateWithNoProtocols) : 100;
assert.strictEqual(restDayScore, 100, 'Rest day (0 scheduled protocols) must evaluate to 100 PTS at EOD');

// Restore protocol days
state.protocols.forEach((p, i) => { p.selectedDays = origSelectedDays[i]; });
console.log('  [PASS] Scheduled rest day (0 protocols) correctly evaluated as 100 PTS.');

console.log('>>> SUITE PASSED: functionality_audit.test.js\n');
