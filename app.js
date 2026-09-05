// Kurogane Tactical Assistant - Core Application & Pac-Man Arcade Engine

(function () {
  'use strict';

  // LocalStorage Key
  const STORAGE_KEY = 'quest_log_state_v2';

  // Day of week names: 0 = SUN, 1 = MON, 2 = TUE, 3 = WED, 4 = THU, 5 = FRI, 6 = SAT
  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  // Helper for today's ISO date string (YYYY-MM-DD)
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get day index from YYYY-MM-DD string
  function getDayIndexFromDateString(dateStr) {
    if (!dateStr) return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  // Animated Alert Helpers
  function showAlert(el, html) {
    if (!el) return;
    el.classList.remove('hiding');
    el.style.display = 'flex';
    el.innerHTML = html;
  }

  function hideAlert(el) {
    if (!el || el.style.display === 'none') return;
    el.classList.add('hiding');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('hiding');
      el.innerHTML = '';
    }, 220);
  }

  function getActualTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Default Initial Protocols
  const DEFAULT_PROTOCOLS = [];

  // Application State
  const state = {
    protocols: [],
    history: {},            // Date-indexed map: { "YYYY-MM-DD": ["proto_1", "proto_2"] }
    dailyScores: {},        // Date-indexed scores: { "YYYY-MM-DD": 100 }
    metrics: {},            // Date-indexed metrics map: { "YYYY-MM-DD": { "proto_1": 60 } }
    shieldedDates: {},      // Non-destructive shield map: { "YYYY-MM-DD": true }
    highScore: 1000,        // Tracked behind the scenes for future app expansion
    currentScore: 0,        // Cumulative score till date
    shields: 0,             // 1UP Streak Shields (Max 3)
    usedShieldWeeks: {},    // Map of { "YYYY-WXX": true } - 1 shield per week limit
    consistencyBonus: 0,    // Compounding bonus 'x' (10, 15, 20...)
    streak: 0,
    currentFilter: 'today', // Default: Today's Directives
    soundEnabled: true,
    selectedCategory: null,
    selectedCategoryIcon: null,
    selectedFrequency: 1,
    selectedDays: [],
    mockDate: null,         // Virtual date for developer testing
    viewedYear: null,       // Navigated calendar year (null = current)
    viewedMonthIndex: null, // Navigated calendar month index (null = current)
    selectedWeekNum: null,  // Filter progress bar & protocols by week (null = whole month, 1..5)
    selectedInspectionDate: null, // Filter protocols by day inspection (null = live today, 'YYYY-MM-DD')
    partialDays: {},        // Explicit partial day score tracking: { "YYYY-MM-DD": 50 }
    shieldAppliedOn: null,  // Date string when shield was deployed (visible as muted on Day N+1, removed on Day N+2)
    firstLoginDate: null,   // Date user first logged into the system (e.g. '2026-09-04')
    newQuestContext: 'today' // Context when clicking NEW QUEST ('today' | 'yearly')
  };

  if (typeof window !== 'undefined') {
    window.__kuroganeState = state;
  }

  // DOM Element References
  const elements = {
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundIcon: document.getElementById('sound-icon'),
    openRulesBtn: document.getElementById('open-rules-btn'),
    toggleDevSandboxBtn: document.getElementById('toggle-dev-sandbox-btn'),
    exportDataBtn: document.getElementById('export-data-btn'),

    // Views
    viewDashboard: document.getElementById('view-dashboard'),
    viewInit: document.getElementById('view-init'),
    openInitScreenBtn: document.getElementById('open-init-screen-btn'),
    initBackBtn: document.getElementById('init-back-btn'),

    // Pac-Man Arcade Scoreboard & Visual Shield Slots
    arcadeScore: document.getElementById('arcade-score'),
    scoreBlockShields: document.getElementById('score-block-shields'),
    shieldsSlotContainer: document.getElementById('shields-slot-container'),
    shieldSlot1: document.getElementById('shield-slot-1'),
    shieldSlot2: document.getElementById('shield-slot-2'),
    shieldSlot3: document.getElementById('shield-slot-3'),
    arcadeConsistencyBonus: document.getElementById('arcade-consistency-bonus'),
    arcadeStreak: document.getElementById('arcade-streak'),

    // Month Navigation & Maze
    prevMonthBtn: document.getElementById('prev-month-btn'),
    nextMonthBtn: document.getElementById('next-month-btn'),
    todayMonthBtn: document.getElementById('today-month-btn'),
    mazeMonthName: document.getElementById('maze-month-name'),
    pelletsEatenDisplay: document.getElementById('pellets-eaten-display'),
    pacmanChomper: document.getElementById('pacman-chomper'),
    mazeTrackInner: document.getElementById('maze-track-inner'),
    mazePelletsStream: document.getElementById('maze-pellets-stream'),
    fruitCheckpointsRow: document.getElementById('fruit-checkpoints-row'),

    // Streak Recovery Shield Banner
    streakShieldAlertBanner: document.getElementById('streak-shield-alert-banner'),
    shieldBannerTitle: document.getElementById('shield-banner-title'),
    closeShieldAlertBtn: document.getElementById('close-shield-alert-btn'),
    useShieldRecoverBtn: document.getElementById('use-shield-recover-btn'),

    // Shield Recovery Confirmation Modal (Popup like Rule Book)
    shieldConfirmModalBackdrop: document.getElementById('shield-confirm-modal-backdrop'),
    closeShieldConfirmBtn: document.getElementById('close-shield-confirm-btn'),
    shieldCancelBtn: document.getElementById('shield-cancel-btn'),
    shieldApplyBtn: document.getElementById('shield-apply-btn'),
    shieldRemoveBtn: document.getElementById('shield-remove-btn'),
    shieldConfirmTitle: document.getElementById('shield-confirm-title'),
    shieldConfirmDesc: document.getElementById('shield-confirm-desc'),
    shieldConfirmDateDisplay: document.getElementById('shield-confirm-date-display'),

    // Export Month Selector Modal
    exportModalBackdrop: document.getElementById('export-modal-backdrop'),
    closeExportModalBtn: document.getElementById('close-export-modal-btn'),
    exportCancelBtn: document.getElementById('export-cancel-btn'),
    exportSelectAllBtn: document.getElementById('export-select-all-btn'),
    exportSelectCurrentBtn: document.getElementById('export-select-current-btn'),
    exportDeselectAllBtn: document.getElementById('export-deselect-all-btn'),
    exportMonthsList: document.getElementById('export-months-list'),
    exportConfirmDownloadBtn: document.getElementById('export-confirm-download-btn'),

    // Filters & Quests
    phaseFilters: document.querySelectorAll('.phase-tab'),
    phaseTabDay: document.getElementById('phase-tab-day'),
    phaseTabAll: document.getElementById('phase-tab-all'),
    protocolsSectionTitle: document.getElementById('protocols-section-title'),
    protocolsListContainer: document.getElementById('protocols-list-container'),

    // Form Elements
    protocolForm: document.getElementById('protocol-form'),
    habitNameInput: document.getElementById('habit-name-input'),
    paramCards: document.querySelectorAll('.param-card'),
    startDateInput: document.getElementById('start-date-input'),
    endDateInput: document.getElementById('end-date-input'),
    freqSlider: document.getElementById('freq-slider-input'),
    freqDisplay: document.getElementById('freq-val-display'),
    daysCountDisplay: document.getElementById('days-count-display'),
    daysContainer: document.getElementById('days-of-week-container'),
    dayChips: document.querySelectorAll('.day-chip'),
    notesInput: document.getElementById('habit-notes-input'),
    freqValidationAlert: document.getElementById('freq-validation-alert'),
    scheduleValidationAlert: document.getElementById('schedule-validation-alert'),
    submitBtn: document.getElementById('submit-protocol-btn'),
    submitBtnText: document.getElementById('submit-btn-text'),
    submitBtnIcon: document.getElementById('submit-btn-icon'),
    formTimelineGroup: document.getElementById('form-timeline-group'),
    formFrequencyGroup: document.getElementById('form-frequency-group'),
    metricNameInput: document.getElementById('metric-name-input'),
    metricUnitInput: document.getElementById('metric-unit-input'),

    // Read-Only Quest Details Modal
    questDetailsModalBackdrop: document.getElementById('quest-details-modal-backdrop'),
    closeQuestDetailsBtn: document.getElementById('close-quest-details-btn'),
    modalQuestCloseActionBtn: document.getElementById('modal-quest-close-action-btn'),
    modalQuestHeroIcon: document.getElementById('modal-quest-hero-icon'),
    modalQuestName: document.getElementById('modal-quest-name'),
    modalQuestCategory: document.getElementById('modal-quest-category'),
    modalQuestFrequency: document.getElementById('modal-quest-frequency'),
    modalQuestClearedCount: document.getElementById('modal-quest-cleared-count'),
    modalQuestDays: document.getElementById('modal-quest-days'),
    modalQuestTimeline: document.getElementById('modal-quest-timeline'),
    modalQuestNotes: document.getElementById('modal-quest-notes'),
    modalQuestMetricGrid: document.getElementById('modal-quest-metric-grid'),
    modalQuestMetricLabel: document.getElementById('modal-quest-metric-label'),
    modalQuestMetricTotal: document.getElementById('modal-quest-metric-total'),
    modalQuestMetricYear: document.getElementById('modal-quest-metric-year'),
    modalQuestMetricUnits: document.querySelectorAll('.modal-quest-metric-unit'),

    // Metric Input Modal
    metricInputModalBackdrop: document.getElementById('metric-input-modal-backdrop'),
    metricModalDesc: document.getElementById('metric-modal-desc'),
    metricModalInput: document.getElementById('metric-modal-input'),
    metricModalSubmitBtn: document.getElementById('metric-modal-submit-btn'),
    closeMetricModalBtn: document.getElementById('close-metric-modal-btn'),

    // Rule Book Modal
    rulesModalBackdrop: document.getElementById('rules-modal-backdrop'),
    closeRulesBtn: document.getElementById('close-rules-btn'),

    // Dev Testing Sandbox
    devSandboxPanel: document.getElementById('dev-sandbox-panel'),
    closeDevSandboxBtn: document.getElementById('close-dev-sandbox-btn'),
    devMockDateInput: document.getElementById('dev-mock-date-input'),
    devPrevDayBtn: document.getElementById('dev-prev-day-btn'),
    devNextDayBtn: document.getElementById('dev-next-day-btn'),
    devDayPill: document.getElementById('dev-day-pill'),
    devResetDateBtn: document.getElementById('dev-reset-date-btn'),
    devSimFullDayBtn: document.getElementById('dev-sim-full-day-btn'),
    devSimPartialDayBtn: document.getElementById('dev-sim-partial-day-btn'),
    devSimFullWeekBtn: document.getElementById('dev-sim-full-week-btn'),
    devSimPartialWeekBtn: document.getElementById('dev-sim-partial-week-btn'),
    devSimMissedYesterdayBtn: document.getElementById('dev-sim-missed-yesterday-btn'),
    devTriggerMidnightBtn: document.getElementById('dev-trigger-midnight-btn'),
    devClearHistoryBtn: document.getElementById('dev-clear-history-btn'),

    // Toast
    toast: document.getElementById('hud-toast'),
    toastMsg: document.getElementById('toast-message'),
    toastIcon: document.getElementById('toast-icon')
  };

  /* ==========================================================
     STATE MANAGEMENT & PERSISTENCE
     ========================================================== */

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const today = getTodayDateString();

      if (saved) {
        const parsed = JSON.parse(saved);
        state.protocols = parsed.protocols || DEFAULT_PROTOCOLS;
        state.history = parsed.history || {};
        state.dailyScores = parsed.dailyScores || {};
        state.metrics = parsed.metrics || {};
        state.shieldedDates = parsed.shieldedDates || {};
        // Clean up orphaned shieldedDates if history for that date was cleared or does not exist
        if (state.shieldedDates && state.history) {
          Object.keys(state.shieldedDates).forEach(d => {
            if (!state.history[d]) {
              delete state.shieldedDates[d];
            }
          });
        }
        state.highScore = parsed.highScore || 1000;
        state.currentScore = parsed.currentScore || 0;
        state.shields = parsed.shields !== undefined ? parsed.shields : 0;
        state.usedShieldWeeks = parsed.usedShieldWeeks || {};
        // Clean up any legacy keys without month (e.g. "2026-W3")
        if (state.usedShieldWeeks) {
          Object.keys(state.usedShieldWeeks).forEach(k => {
            if (/^\d{4}-W\d+$/i.test(k)) {
              delete state.usedShieldWeeks[k];
            }
          });
        }
        state.consistencyBonus = parsed.consistencyBonus !== undefined ? parsed.consistencyBonus : 0;
        state.streak = parsed.streak || 0;
        state.partialDays = parsed.partialDays || {};
        state.shieldAppliedOn = parsed.shieldAppliedOn || null;
        state.firstLoginDate = localStorage.getItem('quest_log_first_login_date') || parsed.firstLoginDate || today;
        if (!localStorage.getItem('quest_log_first_login_date')) {
          localStorage.setItem('quest_log_first_login_date', state.firstLoginDate);
        }

        // Ensure today's history exists
        if (!state.history[today]) {
          state.history[today] = [];
          state.protocols.forEach(p => { p.completed = false; });
        } else {
          // Sync protocol completed flag with today's history
          state.protocols.forEach(p => {
            p.completed = state.history[today].includes(p.id);
          });
        }
      } else {
        state.protocols = DEFAULT_PROTOCOLS.map(p => ({ ...p }));
        state.history = {};
        state.dailyScores = {};
        state.metrics = {};
        state.shieldedDates = {};
        state.history[today] = [];
        state.highScore = 1000;
        state.currentScore = 0;
        state.shields = 0;
        state.usedShieldWeeks = {};
        state.consistencyBonus = 0;
        state.streak = 0;
        state.firstLoginDate = localStorage.getItem('quest_log_first_login_date') || today;
        localStorage.setItem('quest_log_first_login_date', state.firstLoginDate);
        saveState();
      }
    } catch (e) {
      console.error('Error loading state:', e);
      state.protocols = DEFAULT_PROTOCOLS.map(p => ({ ...p }));
      state.history = {};
      state.dailyScores = {};
      state.metrics = {};
      state.shieldedDates = {};
      state.firstLoginDate = getTodayDateString();
    }
  }

  function saveState() {
    try {
      if (!state.firstLoginDate) {
        state.firstLoginDate = localStorage.getItem('quest_log_first_login_date') || getTodayDateString();
      }
      localStorage.setItem('quest_log_first_login_date', state.firstLoginDate);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        protocols: state.protocols,
        history: state.history,
        dailyScores: state.dailyScores,
        shieldedDates: state.shieldedDates,
        highScore: state.highScore,
        currentScore: state.currentScore,
        shields: state.shields,
        usedShieldWeeks: state.usedShieldWeeks,
        consistencyBonus: state.consistencyBonus,
        streak: state.streak,
        partialDays: state.partialDays,
        shieldAppliedOn: state.shieldAppliedOn,
        firstLoginDate: state.firstLoginDate
      }));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  /* ==========================================================
     TIME, CALENDAR & MOCK DATE ENGINE
     ========================================================== */

  /* ==========================================================
     TIME, CALENDAR & MOCK DATE ENGINE
     ========================================================== */

  function getEffectiveDate() {
    if (state.mockDate) {
      return new Date(state.mockDate + 'T12:00:00');
    }
    return new Date();
  }

  function getTodayDateString() {
    if (state.mockDate) return state.mockDate;
    return getActualTodayDateString();
  }

  function getViewedDate() {
    const effective = getEffectiveDate();
    const y = state.viewedYear !== null ? state.viewedYear : effective.getFullYear();
    const m = state.viewedMonthIndex !== null ? state.viewedMonthIndex : effective.getMonth();
    return { year: y, monthIndex: m };
  }

  function getFormattedTime() {
    const now = getEffectiveDate();
    return now.toTimeString().split(' ')[0];
  }

  function updateHUDClock() {
    if (elements.clock) {
      elements.clock.textContent = getFormattedTime();
    }
  }

  /**
   * Returns all active scheduled protocols for a specific date (YYYY-MM-DD)
   */
  function getScheduledForDate(dateStr) {
    const dayIndex = getDayIndexFromDateString(dateStr);
    const scheduled = state.protocols.filter(p => {
      const inDate = (!p.startDate || p.startDate <= dateStr) && (!p.endDate || p.endDate >= dateStr);
      if (!inDate) return false;
      if (!p.selectedDays || p.selectedDays.length === 0 || p.selectedDays.length === 7) return true;
      return p.selectedDays.includes(dayIndex);
    });
    return scheduled;
  }

  /**
   * Rule A: Max 100 PTS per day based on completed scheduled protocols
   * If 0 protocols are scheduled for a date (rest day), it is considered 100% completed at EOD.
   */
  function calculateDayScore(dateStr) {
    const scheduled = getScheduledForDate(dateStr);
    if (scheduled.length === 0) {
      return 100;
    }
    const completed = state.history[dateStr] || [];
    
    // Always grant 100 if everything scheduled is actually completed
    if (completed.length > 0 && completed.length === scheduled.length) {
      return 100;
    }
    
    if (state.partialDays && state.partialDays[dateStr] !== undefined) {
      return state.partialDays[dateStr];
    }
    if (completed.length === 0) return 0;
    const score = Math.min(100, Math.round((completed.length / scheduled.length) * 100));
    return score;
  }

  /**
   * Evaluates historical scores, streak consistency bonuses 'x', and 1UP shields
   */
  function updateScoringAndConsistency() {
    const effectiveDate = getEffectiveDate();
    const effectiveYear = effectiveDate.getFullYear();
    const effectiveMonth = effectiveDate.getMonth();
    const effectiveDay = effectiveDate.getDate();
    const todayStr = `${effectiveYear}-${String(effectiveMonth + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

    let totalScore = 0;
    let currentOrganicStreak = 0;
    let earnedShields = 0;

    // 1. Calculate raw scores for all recorded days (chronological)
    Object.keys(state.history).sort().forEach(d => {
      const s = calculateDayScore(d);
      state.dailyScores[d] = s;
      totalScore += s;
      // Only organic 100% unshielded days count towards earning NEW shields (Rule B)
      if (s === 100 && !(state.shieldedDates && state.shieldedDates[d])) {
        currentOrganicStreak++;
        if (currentOrganicStreak % 14 === 0) earnedShields++;
      } else {
        currentOrganicStreak = 0;
      }
    });

    // 2. Calculate Active Streak
    let activeStreak = 0;
    const yesterday = new Date(effectiveDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const twoDaysAgo = new Date(effectiveDate);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

    const todayScore = calculateDayScore(todayStr);
    const yesterdayScore = state.dailyScores[yesterdayStr] !== undefined ? state.dailyScores[yesterdayStr] : calculateDayScore(yesterdayStr);
    const twoDaysAgoScore = state.dailyScores[twoDaysAgoStr] !== undefined ? state.dailyScores[twoDaysAgoStr] : calculateDayScore(twoDaysAgoStr);
    const isYesterdayShielded = !!(state.shieldedDates && state.shieldedDates[yesterdayStr]);
    const isTwoDaysAgoShielded = !!(state.shieldedDates && state.shieldedDates[twoDaysAgoStr]);

    let checkDate = new Date(effectiveDate);
    if (todayScore === 100) {
      activeStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Today is in progress; check backward from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let daysWalked = 0;
    while (daysWalked < 365) {
      const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (state.firstLoginDate && dStr < state.firstLoginDate) break;
      const sched = getScheduledForDate(dStr);
      if (sched.length === 0) {
        activeStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        daysWalked++;
        continue;
      }

      const score = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);
      const isDayShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);

      if (score === 100 || isDayShielded) {
        activeStreak++;
      } else {
        // If yesterday was the 1st missed day of the week and user has shields available (unshielded), hold the streak from prior days
        if (dStr === yesterdayStr && (twoDaysAgoScore === 100 || isTwoDaysAgoShielded || !state.history[twoDaysAgoStr]) && state.shields > 0 && !isYesterdayShielded) {
          // Keep walking to count the streak held at risk
        } else {
          break;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
      daysWalked++;
    }

    state.streak = activeStreak;

    // Rule B: 1 Shield per 2 consecutive perfect weeks (14 organic perfect days), Max 3
    const activeUsedShields = Object.keys(state.shieldedDates || {}).length;
    state.shields = Math.min(3, Math.max(0, earnedShields - activeUsedShields));

    // Rule C: Consistency bonus x (Wk 1 = 10, Wk 2 = 15, Wk 3 = 20...)
    // Evaluated per calendar week (Sunday through Saturday).
    // When Saturday is reached / passed, if all scheduled days in that week scored 100% or are shielded:
    // Unshielded 100% week awards +10, +15, +20...
    // Shielded week preserves the multiplier rate without adding +5.
    // Broken week resets multiplier to 0.
    let cumulativeBonusPoints = 0;
    let currentConsistencyRate = 0;
    let consecutivePerfectWeeks = 0;

    for (let m = 0; m <= effectiveMonth; m++) {
      const weeks = getMonthWeeks(effectiveYear, m);
      for (const wk of weeks) {
        const satDay = wk.saturdayDay || wk.end;
        const satDateStr = `${effectiveYear}-${String(m + 1).padStart(2, '0')}-${String(satDay).padStart(2, '0')}`;
        const wkStartDateStr = `${effectiveYear}-${String(m + 1).padStart(2, '0')}-${String(wk.start).padStart(2, '0')}`;

        // 1. Evaluated on or after Saturday for completed calendar weeks
        if (satDateStr <= todayStr) {
          let weekPerfect = true;
          let weekHasShield = false;
          let weekHasScheduledDays = false;

          for (let d = wk.start; d <= wk.end; d++) {
            const dStr = `${effectiveYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (dStr > todayStr) break;

            const scheduled = getScheduledForDate(dStr);
            if (scheduled.length > 0) {
              weekHasScheduledDays = true;
              const score = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);
              const isDayShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);

              if (isDayShielded) {
                weekHasShield = true;
              } else if (score < 100) {
                weekPerfect = false;
                break;
              }
            }
          }

          if (weekHasScheduledDays) {
            if (weekPerfect) {
              if (!weekHasShield) {
                consecutivePerfectWeeks++;
                const weekReward = 10 + (consecutivePerfectWeeks - 1) * 5;
                cumulativeBonusPoints += weekReward;
                currentConsistencyRate = weekReward;
              } else {
                // Shielded week: keep currentConsistencyRate intact (don't increment)
              }
            } else {
              consecutivePerfectWeeks = 0;
              currentConsistencyRate = 0;
            }
          }
        } else if (todayStr >= wkStartDateStr && todayStr <= satDateStr) {
          // 2. Ongoing current week: If any scheduled day prior to today was missed & not shielded,
          // the consistency bonus multiplier drops to 0! Applying a shield restores it.
          for (let d = wk.start; d <= wk.end; d++) {
            const dStr = `${effectiveYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (dStr >= todayStr) break; // Only evaluate days before today

            const scheduled = getScheduledForDate(dStr);
            if (scheduled.length > 0) {
              const score = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);
              const isDayShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);

              if (!isDayShielded && score < 100) {
                currentConsistencyRate = 0;
                break;
              }
            }
          }
        }
      }
    }

    state.consistencyBonus = currentConsistencyRate;
    state.currentScore = totalScore + cumulativeBonusPoints;
    if (state.currentScore > state.highScore) {
      state.highScore = state.currentScore;
    }
  }

  function getMonthWeeks(year, monthIndex) {
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const weeks = [];
    let currentWeekStart = 1;
    let weekNum = 1;

    for (let day = 1; day <= totalDays; day++) {
      const dayOfWeek = new Date(year, monthIndex, day).getDay(); // 0 = Sun, 6 = Sat
      const isSaturday = (dayOfWeek === 6);
      const isLastDay = (day === totalDays);

      if (isSaturday || isLastDay) {
        weeks.push({
          num: weekNum,
          name: `WK ${String(weekNum).padStart(2, '0')}`,
          start: currentWeekStart,
          end: day,
          saturdayDay: isSaturday ? day : null
        });
        currentWeekStart = day + 1;
        weekNum++;
      }
    }
    return weeks;
  }

  function getCalendarWeekKey(date) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const weeks = getMonthWeeks(y, m);
    const curWeek = weeks.find(w => d >= w.start && d <= w.end);
    const wkNum = curWeek ? curWeek.num : Math.ceil(d / 7);
    return `${y}-${String(m + 1).padStart(2, '0')}-W${String(wkNum).padStart(2, '0')}`;
  }

  /* ==========================================================
     STREAK RECOVERY & SHIELD INTERACTION (1-DAY MISS RULE)
     ========================================================== */

  function checkStreakRecoveryAlert() {
    if (!elements.streakShieldAlertBanner) return;

    const now = getEffectiveDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

    const yesterdayScore = state.dailyScores[yesterdayStr] !== undefined ? state.dailyScores[yesterdayStr] : calculateDayScore(yesterdayStr);
    const twoDaysAgoScore = state.dailyScores[twoDaysAgoStr] !== undefined ? state.dailyScores[twoDaysAgoStr] : calculateDayScore(twoDaysAgoStr);
    const isYesterdayShielded = !!(state.shieldedDates && state.shieldedDates[yesterdayStr]);

    const minStartDate = state.protocols.reduce((min, p) => (p.startDate && p.startDate < min) ? p.startDate : min, '9999-99-99');
    const isYesterdayMissed = (yesterdayStr >= minStartDate && yesterdayScore < 100);
    const hadTwoDaysAgo = (state.history[twoDaysAgoStr] !== undefined);
    const isTwoDaysAgoShielded = !!(state.shieldedDates && state.shieldedDates[twoDaysAgoStr]);
    const isDoubleConsecutiveMiss = isYesterdayMissed && hadTwoDaysAgo && (twoDaysAgoScore < 100) && !isTwoDaysAgoShielded;

    // Calculate prior streak held immediately before yesterday
    let priorStreak = 0;
    let walkDate = new Date(twoDaysAgo);
    if (isDoubleConsecutiveMiss) {
      walkDate.setDate(walkDate.getDate() - 1);
    }
    
    let daysCount = 0;
    while (daysCount < 365) {
      const dStr = `${walkDate.getFullYear()}-${String(walkDate.getMonth() + 1).padStart(2, '0')}-${String(walkDate.getDate()).padStart(2, '0')}`;
      if (dStr < minStartDate) break;
      const sched = getScheduledForDate(dStr);
      if (sched.length === 0) {
        walkDate.setDate(walkDate.getDate() - 1);
        daysCount++;
        continue;
      }
      const s = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);
      const isShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);
      if (s === 100 || isShielded) {
        priorStreak++;
        walkDate.setDate(walkDate.getDate() - 1);
        daysCount++;
      } else {
        break;
      }
    }

    const targetWeekKey = getCalendarWeekKey(yesterday);
    const shieldUsedThisWeek = !!(state.usedShieldWeeks && state.usedShieldWeeks[targetWeekKey]);
    const hasAvailableShield = (state.shields > 0 && !shieldUsedThisWeek);

    const canShowBanner = isYesterdayMissed && priorStreak > 0 && (hasAvailableShield || isDoubleConsecutiveMiss || isYesterdayShielded);

    if (canShowBanner) {
      elements.streakShieldAlertBanner.style.display = 'flex';
      if (elements.shieldBannerTitle) {
        if (isDoubleConsecutiveMiss) {
          elements.shieldBannerTitle.textContent = "STREAK IS BROKEN AS PAST TWO DAY'S QUESTS ARE NOT FULLY COMPLETED.";
        } else if (isYesterdayShielded) {
          elements.shieldBannerTitle.textContent = 'STREAK PROTECTED AND SHIELD ACTIVATED';
        } else {
          elements.shieldBannerTitle.textContent = 'STREAK IS AT RISK';
        }
      }
      if (elements.useShieldRecoverBtn) {
        if (isDoubleConsecutiveMiss) {
          elements.useShieldRecoverBtn.style.display = 'none';
        } else if (isYesterdayShielded) {
          elements.useShieldRecoverBtn.style.display = 'flex';
          elements.useShieldRecoverBtn.innerHTML = '<span>DEACTIVATE SHIELD</span><span class="material-symbols-outlined" style="font-size: 13px;">restart_alt</span>';
          elements.useShieldRecoverBtn.title = 'Deactivate active shield and refund to inventory';
          elements.useShieldRecoverBtn.disabled = false;
        } else {
          elements.useShieldRecoverBtn.style.display = 'flex';
          elements.useShieldRecoverBtn.innerHTML = '<span>PROTECT</span><span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: \'FILL\' 1;">shield</span>';
          elements.useShieldRecoverBtn.title = 'Protect streak with 1UP Shield';
          elements.useShieldRecoverBtn.disabled = false;
        }
      }
    } else {
      elements.streakShieldAlertBanner.style.display = 'none';
    }
  }

  function promptShieldUsage() {
    const now = getEffectiveDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const targetWeekKey = getCalendarWeekKey(yesterday);
    const yesterdayScore = calculateDayScore(yesterdayStr);
    const isYesterdayShielded = !!(state.shieldedDates && state.shieldedDates[yesterdayStr]);

    if (yesterdayScore === 100 && !isYesterdayShielded) {
      showToast('YESTERDAY (DAY N-1) IS ALREADY 100% COMPLETED', 'normal', 'check_circle');
      return;
    }

    if (isYesterdayShielded) {
      // Prompt to Deactivate / Refund Shield
      if (elements.shieldConfirmTitle) {
        elements.shieldConfirmTitle.textContent = 'DEACTIVATE 1UP SHIELD?';
      }
      if (elements.shieldConfirmDesc) {
        elements.shieldConfirmDesc.textContent = 'Deactivate the active shield from yesterday? This will refund +1 Shield to your inventory and update your streak dynamically.';
      }
      if (elements.shieldConfirmDateDisplay) {
        elements.shieldConfirmDateDisplay.textContent = `SHIELDED DATE: ${yesterdayStr}`;
      }
      if (elements.shieldApplyBtn) elements.shieldApplyBtn.style.display = 'none';
      if (elements.shieldRemoveBtn) elements.shieldRemoveBtn.style.display = 'inline-flex';
    } else {
      // Prompt to Apply Shield
      if (state.shields <= 0) {
        showToast('NO SHIELDS AVAILABLE IN INVENTORY', 'normal', 'shield');
        return;
      }
      if (state.usedShieldWeeks && state.usedShieldWeeks[targetWeekKey]) {
        showToast('SHIELD LIMIT: MAX 1 SHIELD PER WEEK ALLOWED', 'error', 'warning');
        return;
      }

      if (elements.shieldConfirmTitle) {
        elements.shieldConfirmTitle.textContent = 'APPLY 1UP SHIELD?';
      }
      if (elements.shieldConfirmDesc) {
        elements.shieldConfirmDesc.textContent = 'Apply 1 Shield from your inventory to protect your streak and consistency multiplier from breaking.';
      }
      if (elements.shieldConfirmDateDisplay) {
        elements.shieldConfirmDateDisplay.textContent = `TARGET DATE: ${yesterdayStr}`;
      }
      if (elements.shieldApplyBtn) elements.shieldApplyBtn.style.display = 'inline-flex';
      if (elements.shieldRemoveBtn) elements.shieldRemoveBtn.style.display = 'none';
    }

    if (elements.shieldConfirmModalBackdrop) {
      elements.shieldConfirmModalBackdrop.classList.add('show');
      if (window.tacticalAudio) window.tacticalAudio.playSelect();
    }
  }

  function closeShieldConfirmModal() {
    if (elements.shieldConfirmModalBackdrop) {
      elements.shieldConfirmModalBackdrop.classList.remove('show');
    }
  }

  function useShieldToRecoverYesterday() {
    const now = getEffectiveDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const targetWeekKey = getCalendarWeekKey(yesterday);

    if (state.usedShieldWeeks && state.usedShieldWeeks[targetWeekKey]) {
      showToast('SHIELD LIMIT: MAX 1 SHIELD PER WEEK ALLOWED', 'error', 'warning');
      return;
    }
    if (state.shields <= 0) {
      showToast('NO SHIELDS AVAILABLE', 'error', 'shield');
      return;
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Apply shield non-destructively
    state.shieldedDates = state.shieldedDates || {};
    state.shieldedDates[yesterdayStr] = true;
    state.shields--;
    state.shieldAppliedOn = todayStr;
    state.usedShieldWeeks = state.usedShieldWeeks || {};
    state.usedShieldWeeks[targetWeekKey] = true;

    closeShieldConfirmModal();
    saveState();
    renderArcadeHUD();
    renderProtocols();
    if (window.tacticalAudio) window.tacticalAudio.playFruitPickup();
    showToast(`1UP SHIELD APPLIED! STREAK & REWARDS PROTECTED FOR ${yesterdayStr} 🛡️`, 'success', 'shield');
  }

  function removeShieldYesterday() {
    const now = getEffectiveDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const targetWeekKey = getCalendarWeekKey(yesterday);

    if (state.shieldedDates && state.shieldedDates[yesterdayStr]) {
      delete state.shieldedDates[yesterdayStr];
      delete state.shieldAppliedOn;
      state.shields = Math.min(3, (state.shields || 0) + 1);
      if (state.usedShieldWeeks) {
        delete state.usedShieldWeeks[targetWeekKey];
      }
    }

    closeShieldConfirmModal();
    saveState();
    renderArcadeHUD();
    renderProtocols();
    if (window.tacticalAudio) window.tacticalAudio.playSelect();
    showToast('1UP SHIELD DESELECTED (+1 REFUNDED). STREAK & REWARDS UPDATED DYNAMICALLY.', 'normal', 'restart_alt');
  }

  /* ==========================================================
     PAC-MAN ARCADE HUD RENDERING (MONTH NAVIGATION & VISUAL SHIELDS)
     ========================================================== */

  function renderArcadeHUD() {
    updateScoringAndConsistency();
    checkStreakRecoveryAlert();

    const effectiveDate = getEffectiveDate();
    const { year: viewedYear, monthIndex: viewedMonthIndex } = getViewedDate();
    const totalDaysInMonth = new Date(viewedYear, viewedMonthIndex + 1, 0).getDate();
    const monthName = MONTH_NAMES[viewedMonthIndex];
    const monthWeeks = getMonthWeeks(viewedYear, viewedMonthIndex);

    const isCurrentMonth = (viewedYear === effectiveDate.getFullYear() && viewedMonthIndex === effectiveDate.getMonth());
    const currentDay = isCurrentMonth ? effectiveDate.getDate() : totalDaysInMonth;

    // 1. Update Top Scoreboard
    if (elements.arcadeScore) {
      elements.arcadeScore.textContent = String(state.currentScore).padStart(6, '0');
    }

    // Render 3 Visual Shield Slots:
    // - Available shields: active (solid white, no idle glow)
    // - Applied on Day N+1: applied-today (present in inventory, muted with color)
    // - Day N+2+: removed from inventory (empty slot muted)
    const effectiveDayStr = `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveDate.getDate()).padStart(2, '0')}`;
    const isShieldAppliedToday = (state.shieldAppliedOn === effectiveDayStr);
    const shieldSlots = [elements.shieldSlot1, elements.shieldSlot2, elements.shieldSlot3];
    shieldSlots.forEach((slot, idx) => {
      if (slot) {
        if (idx < state.shields) {
          slot.className = 'shield-slot active';
        } else if (idx === state.shields && isShieldAppliedToday) {
          slot.className = 'shield-slot applied-today';
        } else {
          slot.className = 'shield-slot muted';
        }
      }
    });

    const yesterday = new Date(effectiveDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const twoDaysAgo = new Date(effectiveDate);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

    // Check if user CAN apply a shield right now (Day N+1 with prior streak at risk and shield available)
    const targetWeekKey = getCalendarWeekKey(yesterday);
    const shieldUsedThisWeek = !!(state.usedShieldWeeks && state.usedShieldWeeks[targetWeekKey]);
    const hasAvailableShield = (state.shields > 0 && !shieldUsedThisWeek);

    const minStartDate = state.protocols.reduce((min, p) => (p.startDate && p.startDate < min) ? p.startDate : min, '9999-99-99');
    const yesterdayScore = state.dailyScores[yesterdayStr] !== undefined ? state.dailyScores[yesterdayStr] : calculateDayScore(yesterdayStr);
    const twoDaysAgoScore = state.dailyScores[twoDaysAgoStr] !== undefined ? state.dailyScores[twoDaysAgoStr] : calculateDayScore(twoDaysAgoStr);
    const isYesterdayMissed = (yesterdayStr >= minStartDate && yesterdayScore < 100);
    const hadTwoDaysAgo = (state.history[twoDaysAgoStr] !== undefined);
    const isTwoDaysAgoShielded = !!(state.shieldedDates && state.shieldedDates[twoDaysAgoStr]);
    const isDoubleConsecutiveMiss = isYesterdayMissed && hadTwoDaysAgo && (twoDaysAgoScore < 100) && !isTwoDaysAgoShielded;

    // Calculate prior streak held before yesterday
    let priorStreak = 0;
    let walkDate = new Date(twoDaysAgo);
    if (isDoubleConsecutiveMiss) {
      walkDate.setDate(walkDate.getDate() - 1);
    }
    
    let daysCount = 0;
    while (daysCount < 365) {
      const dStr = `${walkDate.getFullYear()}-${String(walkDate.getMonth() + 1).padStart(2, '0')}-${String(walkDate.getDate()).padStart(2, '0')}`;
      if (dStr < minStartDate) break;
      const sched = getScheduledForDate(dStr);
      if (sched.length === 0) {
        walkDate.setDate(walkDate.getDate() - 1);
        daysCount++;
        continue;
      }
      const s = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);
      const isShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);
      if (s === 100 || isShielded) {
        priorStreak++;
        walkDate.setDate(walkDate.getDate() - 1);
        daysCount++;
      } else {
        break;
      }
    }

    const canApplyShieldNow = (isYesterdayMissed && priorStreak > 0 && !isDoubleConsecutiveMiss && hasAvailableShield);

    // Pulse/glow ONLY when the user CAN apply the shield on Day N+1
    if (elements.shieldsSlotContainer) {
      elements.shieldsSlotContainer.classList.toggle('can-apply-shield', canApplyShieldNow);
    }

    if (elements.arcadeConsistencyBonus) {
      elements.arcadeConsistencyBonus.textContent = `+${state.consistencyBonus} PTS`;
    }
    if (elements.arcadeStreak) {
      elements.arcadeStreak.textContent = `${state.streak} DAYS`;
    }

    // Update Dev Sandbox Date Input & Day Pill if visible
    if (elements.devMockDateInput) {
      elements.devMockDateInput.value = getTodayDateString();
    }
    if (elements.devDayPill) {
      const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      elements.devDayPill.textContent = DAY_NAMES_SHORT[effectiveDate.getDay()];
    }

    // 2. Month Title & Header Stats
    if (elements.mazeMonthName) {
      elements.mazeMonthName.textContent = `${monthName} ${viewedYear}`;
    }

    const todayDateStr = getTodayDateString();
    const isNotOnToday = (
      (state.selectedInspectionDate && state.selectedInspectionDate !== todayDateStr) ||
      (state.viewedYear !== null) ||
      (state.viewedMonthIndex !== null) ||
      (state.selectedWeekNum !== null)
    );
    if (elements.todayMonthBtn) {
      if (isNotOnToday) {
        elements.todayMonthBtn.textContent = 'RETURN TO TODAY';
        elements.todayMonthBtn.classList.add('return-mode');
      } else {
        elements.todayMonthBtn.textContent = 'TODAY';
        elements.todayMonthBtn.classList.remove('return-mode');
      }
    }

    // Dynamic Day Counter with Day of Week (e.g. THU, 03/30 DAYS or SUN, 06/30 DAYS)
    const isPastMonth = (viewedYear < effectiveDate.getFullYear() || (viewedYear === effectiveDate.getFullYear() && viewedMonthIndex < effectiveDate.getMonth()));
    const displayDay = isCurrentMonth ? currentDay : (isPastMonth ? totalDaysInMonth : 0);
    const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const activeDayName = isCurrentMonth ? DAY_NAMES_SHORT[effectiveDate.getDay()] : (isPastMonth ? 'COMPLETED' : 'UPCOMING');

    const activeWeek = state.selectedWeekNum ? monthWeeks.find(w => w.num === state.selectedWeekNum) : null;

    if (elements.pelletsEatenDisplay) {
      if (state.selectedWeekNum && activeWeek) {
        elements.pelletsEatenDisplay.textContent = `WK 0${state.selectedWeekNum}, DAYS ${String(activeWeek.start).padStart(2, '0')}–${String(activeWeek.end).padStart(2, '0')}`;
      } else if (state.selectedInspectionDate) {
        elements.pelletsEatenDisplay.textContent = `INSPECT: ${state.selectedInspectionDate}`;
      } else {
        elements.pelletsEatenDisplay.textContent = isCurrentMonth ?
          `${activeDayName}, ${String(displayDay).padStart(2, '0')}/${totalDaysInMonth} DAYS` :
          `${String(displayDay).padStart(2, '0')}/${totalDaysInMonth} DAYS`;
      }
    }

    // 3. Render Pellets Stream (Saturation-Based with Day Inspection & Week Drill-down)
    if (elements.mazePelletsStream) {
      elements.mazePelletsStream.innerHTML = '';

      const startDay = activeWeek ? activeWeek.start : 1;
      const endDay = activeWeek ? activeWeek.end : totalDaysInMonth;

      for (let day = startDay; day <= endDay; day++) {
        const dateStr = `${viewedYear}-${String(viewedMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(viewedYear, viewedMonthIndex, day).getDay(); // 0 = Sun
        const dayName = DAY_NAMES_SHORT[dayOfWeek];
        const isSunday = (dayOfWeek === 0);
        const isToday = isCurrentMonth && (day === currentDay);
        const isFuture = isCurrentMonth ? (day > currentDay) : (viewedYear > effectiveDate.getFullYear() || (viewedYear === effectiveDate.getFullYear() && viewedMonthIndex > effectiveDate.getMonth()));
        const isShielded = !!(state.shieldedDates && state.shieldedDates[dateStr]);
        const isInspected = (state.selectedInspectionDate === dateStr);

        // Pre-login boundary: pellets prior to firstLoginDate are disabled
        if (state.firstLoginDate && dateStr < state.firstLoginDate) {
          const pellet = document.createElement('div');
          pellet.className = `maze-pellet ${isSunday ? 'big-dot' : 'small-dot'} dot-muted pre-login-disabled ${isInspected ? 'selected-inspection' : ''}`;
          pellet.title = `${dayName} (Day ${day}, ${dateStr}): Prior to First System Login (${state.firstLoginDate}) [DISABLED]`;
          pellet.dataset.date = dateStr;
          pellet.style.opacity = '0.25';
          pellet.style.cursor = 'not-allowed';
          pellet.addEventListener('click', (e) => {
            e.stopPropagation();
            showToast(`DATE PRIOR TO INITIALIZATION (${state.firstLoginDate})`, 'normal', 'block');
          });
          elements.mazePelletsStream.appendChild(pellet);
          continue;
        }

        if (isShielded) {
          // Adaptive Shield Applied: Big Shield on Sunday, Small Shield on Weekday
          const pellet = document.createElement('div');
          pellet.className = `maze-pellet shield-dot ${isSunday ? 'big-shield' : 'small-shield'} ${isToday ? 'today' : ''} ${isInspected ? 'selected-inspection' : ''}`;
          pellet.title = `${dayName} (Day ${day}, ${dateStr}): 1UP Shield Applied [Streak & Rewards Protected] (Click to inspect directives)`;
          pellet.dataset.date = dateStr;
          pellet.innerHTML = '<span class="material-symbols-outlined">shield</span>';
          pellet.addEventListener('click', (e) => {
            e.stopPropagation();
            state.selectedInspectionDate = (state.selectedInspectionDate === dateStr) ? null : dateStr;
            state.currentFilter = 'today';
            renderArcadeHUD();
            renderProtocols();
            if (window.tacticalAudio) window.tacticalAudio.playSelect();
          });
          elements.mazePelletsStream.appendChild(pellet);
          continue;
        }

        let saturationClass = 'dot-muted';
        let tooltipText = '';

        if (isFuture) {
          saturationClass = 'dot-muted';
          tooltipText = `${dayName} (Day ${day}, ${dateStr}): Future Date [Muted]`;
        } else {
          const dayScore = state.dailyScores[dateStr] !== undefined ? state.dailyScores[dateStr] : calculateDayScore(dateStr);

          if (dayScore === 100) {
            saturationClass = 'dot-complete';
            tooltipText = `${dayName} (Day ${day}, ${dateStr})${isSunday ? ' [Big Sunday Dot]' : ''}: 100% Fully Completed (100 PTS) [Yellow Full Saturation]`;
          } else if (dayScore > 0) {
            saturationClass = 'dot-partial';
            tooltipText = `${dayName} (Day ${day}, ${dateStr})${isSunday ? ' [Big Sunday Dot]' : ''}: Partially Completed (${dayScore} PTS) [Orange Partial Saturation]`;
          } else {
            saturationClass = 'dot-muted';
            tooltipText = `${dayName} (Day ${day}, ${dateStr})${isSunday ? ' [Big Sunday Dot]' : ''}: 0 PTS [Muted]`;
          }
        }

        const pellet = document.createElement('div');
        pellet.className = `maze-pellet ${isSunday ? 'big-dot' : 'small-dot'} ${saturationClass} ${isToday ? 'today' : ''} ${isInspected ? 'selected-inspection' : ''}`;
        pellet.title = tooltipText + ' (Click to inspect directives)';
        pellet.dataset.date = dateStr;
        pellet.addEventListener('click', (e) => {
          e.stopPropagation();
          state.selectedInspectionDate = (state.selectedInspectionDate === dateStr) ? null : dateStr;
          state.currentFilter = 'today';
          renderArcadeHUD();
          renderProtocols();
          if (window.tacticalAudio) window.tacticalAudio.playSelect();
        });
        elements.mazePelletsStream.appendChild(pellet);
      }
    }

    // 4. Position Pac-Man directly in front of the current day's dot
    if (elements.pacmanChomper) {
      const isDayInView = activeWeek ? (currentDay >= activeWeek.start && currentDay <= activeWeek.end) : true;

      if (!isCurrentMonth || !isDayInView) {
        elements.pacmanChomper.style.display = 'none';
      } else {
        elements.pacmanChomper.style.display = 'block';

        const updateChomperPosition = () => {
          if (!elements.mazePelletsStream || !elements.pacmanChomper) return;

          const startDay = activeWeek ? activeWeek.start : 1;
          const endDay = activeWeek ? activeWeek.end : totalDaysInMonth;
          const totalViewPellets = endDay - startDay + 1;
          const targetIndex = Math.max(0, Math.min(totalViewPellets - 1, currentDay - startDay));

          const setPosition = () => {
            const targetPellet = elements.mazePelletsStream.children[targetIndex];
            const track = elements.mazeTrackInner || elements.mazePelletsStream.parentElement;

            if (targetPellet && track && typeof targetPellet.getBoundingClientRect === 'function' && typeof track.getBoundingClientRect === 'function') {
              const dotRect = targetPellet.getBoundingClientRect();
              const trackRect = track.getBoundingClientRect();
              const pacmanWidth = elements.pacmanChomper.offsetWidth || 22;

              if (trackRect.width > 0 && dotRect.width > 0) {
                const dotCenterX = (dotRect.left + dotRect.width / 2) - trackRect.left;
                // Position pacman centered on the dot (shifting it left covers the previous day's dot because the gap is only ~3px!)
                const pacmanLeft = dotCenterX - (pacmanWidth / 2);
                elements.pacmanChomper.style.left = `${Math.round(pacmanLeft * 10) / 10}px`;
                return;
              }
            }

            // Fallback percentage calculation
            const stepRatio = totalViewPellets > 1 ? targetIndex / (totalViewPellets - 1) : 0;
            elements.pacmanChomper.style.left = `calc(${Math.round(stepRatio * 1000) / 10}% - 14px)`;
          };

          setPosition();
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(setPosition);
          }
        };

        updateChomperPosition();
      }
    }

    // 5. Dynamic Fruit Checkpoints Row (WK 01 - WK 05) with 4 Visual States & Click Filter
    const fruitContainer = document.getElementById('fruit-checkpoints-row');
    const fruitIcons = ['🍒', '🍓', '🍊', '🍈', '🍇', '🏆'];

    if (fruitContainer) {
      fruitContainer.innerHTML = '';
      monthWeeks.forEach((wk, idx) => {
        const satDay = wk.saturdayDay || wk.end;
        const satDateStr = `${viewedYear}-${String(viewedMonthIndex + 1).padStart(2, '0')}-${String(satDay).padStart(2, '0')}`;
        const wkStartDateStr = `${viewedYear}-${String(viewedMonthIndex + 1).padStart(2, '0')}-${String(wk.start).padStart(2, '0')}`;
        const todayStr = getTodayDateString();

        let weekStatus = 'locked'; // 'cleared', 'partial', 'in-progress', 'locked'

        if (todayStr > satDateStr) {
          // Saturday has passed (evaluated after EOD / on Sunday+)
          // Check if all scheduled days in this week were 100% complete or shielded
          let allPerfect = true;
          let anyScheduled = false;

          for (let d = wk.start; d <= wk.end; d++) {
            const dStr = `${viewedYear}-${String(viewedMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const sched = getScheduledForDate(dStr);
            if (sched.length > 0) {
              anyScheduled = true;
              const s = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);
              const isShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);
              if (s < 100 && !isShielded) {
                allPerfect = false;
                break;
              }
            }
          }

          weekStatus = (anyScheduled && allPerfect) ? 'cleared' : 'partial';
        } else if (todayStr >= wkStartDateStr && todayStr <= satDateStr) {
          // Currently in-progress week (distinctly highlighted from future weeks)
          weekStatus = 'in-progress';
        } else {
          // Future week
          weekStatus = 'locked';
        }

        const isSelected = (state.selectedWeekNum === wk.num);
        const fruitIcon = (idx === monthWeeks.length - 1) ? '🏆' : (fruitIcons[idx] || '🍒');

        const item = document.createElement('div');
        item.className = `fruit-item ${weekStatus} ${isSelected ? 'selected' : ''}`;
        item.title = `${wk.name} (Days ${wk.start}–${wk.end}): ${weekStatus.toUpperCase()} (Click to toggle week view)`;
        item.innerHTML = `
          <span class="fruit-icon">${fruitIcon}</span>
          <span class="fruit-label">${wk.name}</span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          state.selectedWeekNum = (state.selectedWeekNum === wk.num) ? null : wk.num;
          state.currentFilter = 'today';
          renderArcadeHUD();
          renderProtocols();
          if (window.tacticalAudio) window.tacticalAudio.playSelect();
        });
        fruitContainer.appendChild(item);
      });
    }
  }

  /* ==========================================================
     QUEST CARD RENDERING & TAB FILTERING
     ========================================================== */

  function renderProtocols() {
    const container = elements.protocolsListContainer;
    if (!container) return;

    container.innerHTML = '';

    const todayStr = getTodayDateString();
    const todayDayIndex = getDayIndexFromDateString(todayStr);
    const { year: viewedYear, monthIndex: viewedMonthIndex } = getViewedDate();
    const effectiveDate = getEffectiveDate();
    const effectiveYear = effectiveDate.getFullYear();
    const isCurrentMonth = (viewedYear === effectiveDate.getFullYear() && viewedMonthIndex === effectiveDate.getMonth());

    // Synchronize protocols completed state strictly with today's history log
    const todayCompletedList = state.history[todayStr] || [];
    state.protocols.forEach(p => {
      p.completed = todayCompletedList.includes(p.id);
    });

    // Synchronize active class on phase-tab buttons
    if (elements.phaseFilters) {
      elements.phaseFilters.forEach(tab => {
        const filter = tab.dataset.filter;
        if (state.currentFilter === filter) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }

    // Dynamic Tab & Section Header Labels
    const dayTabEl = elements.phaseTabDay || document.getElementById('phase-tab-day');
    const allTabEl = elements.phaseTabAll || document.getElementById('phase-tab-all');
    const titleEl = elements.protocolsSectionTitle || document.getElementById('protocols-section-title');

    if (allTabEl) {
      allTabEl.textContent = `YEARLY ARCHIVE (${effectiveYear})`;
    }

    // Helper for English ordinal suffix (1st, 2nd, 3rd, 4th, 16th, 21st, 22nd...)
    function getOrdinalSuffix(day) {
      const d = parseInt(day, 10);
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1:  return 'st';
        case 2:  return 'nd';
        case 3:  return 'rd';
        default: return 'th';
      }
    }

    // Determine Day Tab Label based on current selection state
    if (dayTabEl) {
      if (state.selectedInspectionDate) {
        const pParts = state.selectedInspectionDate.split('-');
        const isTodayInspected = (state.selectedInspectionDate === todayStr);
        const pDate = new Date(parseInt(pParts[0], 10), parseInt(pParts[1], 10) - 1, parseInt(pParts[2], 10));
        const mName = MONTH_NAMES[pDate.getMonth()];
        const mShort = mName.charAt(0).toUpperCase() + mName.slice(1, 3).toLowerCase();
        const dayNum = parseInt(pParts[2], 10);
        const ord = getOrdinalSuffix(dayNum);
        dayTabEl.textContent = isTodayInspected ? "TODAY'S QUESTS" : `${dayNum}${ord} ${mShort} Quests`;
      } else if (state.selectedWeekNum) {
        dayTabEl.textContent = `WK 0${state.selectedWeekNum} QUESTS`;
      } else {
        dayTabEl.textContent = "TODAY'S QUESTS";
      }
    }

    function renderEmptyState(desc) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'empty-state-card';
      emptyCard.innerHTML = `
        <div class="empty-radar-icon">
          <span class="material-symbols-outlined" style="font-size: 32px;">sports_esports</span>
        </div>
        <div class="empty-state-title">// NO QUESTS FOUND</div>
        <p class="empty-state-desc">${desc}</p>
        <button class="init-protocol-btn" id="empty-init-btn" style="margin-top: 6px;">
          <span class="material-symbols-outlined" style="font-size: 14px;">bolt</span>
          DEPLOY QUEST
        </button>
      `;
      const emptyBtn = emptyCard.querySelector('#empty-init-btn');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => switchView('init'));
      }
      container.appendChild(emptyCard);
    }

    let filtered = [];
    let isReadOnly = false;
    let cardMode = 'interactive'; // 'interactive', 'past', 'future', 'yearly'

    if (state.currentFilter === 'all') {
      // 0. YEARLY ARCHIVE TAB ACTIVE
      const yearStart = `${effectiveYear}-01-01`;
      const yearEnd = `${effectiveYear}-12-31`;
      filtered = state.protocols.filter(p => {
        return (!p.startDate || p.startDate <= yearEnd) && (!p.endDate || p.endDate >= yearStart);
      });
      if (filtered.length === 0) filtered = state.protocols;
      isReadOnly = false;
      cardMode = 'yearly';
      if (titleEl) titleEl.textContent = `YEARLY QUEST ARCHIVE (${effectiveYear})`;

      if (filtered.length === 0) {
        renderEmptyState('No active quests found in the yearly archive.');
        return;
      }
      filtered.forEach(proto => {
        container.appendChild(createProtocolCard(proto, isReadOnly, cardMode));
      });
      return;
    }

    // Now in 'today' (or selected day/week) tab
    if (state.selectedInspectionDate) {
      // 1. DAY INSPECTION MODE (Clicked on a specific dot in the progress bar)
      const inspectDateStr = state.selectedInspectionDate;
      const inspectDateParts = inspectDateStr.split('-');
      const inspectDateObj = new Date(parseInt(inspectDateParts[0], 10), parseInt(inspectDateParts[1], 10) - 1, parseInt(inspectDateParts[2], 10));
      const inspectDayIndex = inspectDateObj.getDay();
      const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const inspectDayName = DAY_NAMES[inspectDayIndex];

      const isToday = (inspectDateStr === todayStr);
      isReadOnly = !isToday; // Today is editable; past & future dates are strictly READ-ONLY
      cardMode = isToday ? 'interactive' : (inspectDateStr < todayStr ? 'past' : 'future');

      if (titleEl) {
        const pDate = new Date(parseInt(inspectDateParts[0], 10), parseInt(inspectDateParts[1], 10) - 1, parseInt(inspectDateParts[2], 10));
        const mShort = MONTH_NAMES[pDate.getMonth()].slice(0, 3);
        const dayNum = parseInt(inspectDateParts[2], 10);
        const ord = getOrdinalSuffix(dayNum);
        titleEl.textContent = isToday ? "ACTIVE QUESTS" : `${dayNum}${ord} ${mShort.toUpperCase()} QUESTS`;
      }

      // Completion status on the inspected date
      const inspectedCompletedList = state.history[inspectDateStr] || [];
      state.protocols.forEach(p => {
        p.completed = inspectedCompletedList.includes(p.id);
      });

      // Check pre-login date boundary
      if (state.firstLoginDate && inspectDateStr < state.firstLoginDate) {
        const banner = document.createElement('div');
        banner.className = 'maze-filter-banner';
        banner.style.marginBottom = '10px';
        banner.innerHTML = `
          <div class="filter-title">
            <span class="material-symbols-outlined" style="font-size: 15px;">lock_clock</span>
            <span>PRE-INITIALIZATION PERIOD // DAY ${inspectDateParts[2]}</span>
            <span class="inspection-status-pill past">PRE-LOGIN</span>
          </div>
        `;
        container.appendChild(banner);
        renderEmptyState(`// PRE-INITIALIZATION PERIOD\nNo active directives recorded prior to first system login (${state.firstLoginDate}). All actions are disabled.`);
        return;
      }

      // Filter protocols scheduled for this date
      filtered = state.protocols.filter(p => {
        const isWithinDate = (!p.startDate || p.startDate <= inspectDateStr) && (!p.endDate || p.endDate >= inspectDateStr);
        if (!isWithinDate) return false;
        if (!p.selectedDays || p.selectedDays.length === 0 || p.selectedDays.length === 7) return true;
        return p.selectedDays.includes(inspectDayIndex);
      });

      // Render Day Inspection Notice Banner (Visual conveyances: icon, pill)
      const pillClass = inspectDateStr < todayStr ? 'past' : (inspectDateStr > todayStr ? 'future' : 'today');
      const pillText = inspectDateStr < todayStr ? 'PAST DAY' : (inspectDateStr > todayStr ? 'FUTURE PREVIEW' : 'TODAY: ACTIVE');

      const banner = document.createElement('div');
      banner.className = 'maze-filter-banner';
      banner.style.marginBottom = '10px';
      banner.innerHTML = `
        <div class="filter-title">
          <span class="material-symbols-outlined" style="font-size: 15px;">visibility</span>
          <span>DAY INSPECT: ${inspectDayName}, DAY ${inspectDateParts[2]}</span>
          <span class="inspection-status-pill ${pillClass}">${pillText}</span>
        </div>
      `;
      container.appendChild(banner);

      if (filtered.length === 0) {
        renderEmptyState(`No quests scheduled for Day ${inspectDateParts[2]}.`);
        return;
      }
      filtered.forEach(proto => {
        container.appendChild(createProtocolCard(proto, isReadOnly, cardMode));
      });
      return;
    } else if (state.selectedWeekNum) {
      // 2. WEEK FILTER MODE (Segregated by days)
      const monthWeeks = getMonthWeeks(viewedYear, viewedMonthIndex);
      const curWk = monthWeeks.find(w => w.num === state.selectedWeekNum) || monthWeeks[0];

      if (titleEl) {
        titleEl.textContent = `WEEKLY QUESTS // WK 0${state.selectedWeekNum}`;
      }

      // Render Week Filter Banner
      const banner = document.createElement('div');
      banner.className = 'maze-filter-banner';
      banner.style.marginBottom = '10px';
      banner.innerHTML = `
        <div class="filter-title">
          <span class="material-symbols-outlined" style="font-size: 15px;">view_week</span>
          <span>FILTERED: ${curWk.name} (DAYS ${String(curWk.start).padStart(2, '0')}–${String(curWk.end).padStart(2, '0')})</span>
        </div>
        <button type="button" class="filter-reset-btn" id="exit-week-filter-btn">✕ FULL MONTH</button>
      `;
      container.appendChild(banner);
      const exitBtn = banner.querySelector('#exit-week-filter-btn');
      if (exitBtn) {
        exitBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.selectedWeekNum = null;
          renderArcadeHUD();
          renderProtocols();
        });
      }

      // Segregate quests by individual days in the selected week
      const mShort = MONTH_NAMES[viewedMonthIndex].slice(0, 1).toUpperCase() + MONTH_NAMES[viewedMonthIndex].slice(1, 3).toLowerCase();
      let totalWeekQuests = 0;

      for (let d = curWk.start; d <= curWk.end; d++) {
        const dStr = `${viewedYear}-${String(viewedMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dObj = new Date(viewedYear, viewedMonthIndex, d);
        const dIndex = dObj.getDay();
        const dayName = DAY_NAMES[dIndex];

        const dayProtocols = state.protocols.filter(p => {
          const isWithin = (!p.startDate || p.startDate <= dStr) && (!p.endDate || p.endDate >= dStr);
          if (!isWithin) return false;
          if (!p.selectedDays || p.selectedDays.length === 0 || p.selectedDays.length === 7) return true;
          return p.selectedDays.includes(dIndex);
        });

        totalWeekQuests += dayProtocols.length;

        const isDayToday = (dStr === todayStr);
        const isPast = (dStr < todayStr);
        const isShielded = !!(state.shieldedDates && state.shieldedDates[dStr]);
        const score = state.dailyScores[dStr] !== undefined ? state.dailyScores[dStr] : calculateDayScore(dStr);

        let statusClass = 'upcoming';
        let statusText = 'UPCOMING';
        if (isDayToday) {
          statusClass = 'in-progress';
          statusText = 'TODAY // ACTIVE';
        } else if (isPast) {
          if (isShielded) {
            statusClass = 'shielded';
            statusText = 'SHIELDED';
          } else if (score >= 100) {
            statusClass = 'cleared';
            statusText = 'CLEARED 100%';
          } else if (score > 0) {
            statusClass = 'partial';
            statusText = `PARTIAL (${score}%)`;
          } else {
            statusClass = 'partial';
            statusText = 'MISSED (0%)';
          }
        }

        const groupEl = document.createElement('div');
        groupEl.className = `week-day-group ${isDayToday ? 'today-group' : ''}`;

        const headerEl = document.createElement('div');
        headerEl.className = 'week-day-header';
        headerEl.innerHTML = `
          <div class="week-day-title">
            <span class="week-day-badge">${dayName}</span>
            <span class="week-day-label">DAY ${String(d).padStart(2, '0')} // ${mShort} ${d}</span>
          </div>
          <div class="week-day-status">
            <span class="day-status-pill ${statusClass}">${statusText}</span>
          </div>
        `;
        groupEl.appendChild(headerEl);

        const listEl = document.createElement('div');
        listEl.className = 'week-day-quests-list';
        groupEl.appendChild(listEl);

        if (dayProtocols.length === 0) {
          const restNotice = document.createElement('div');
          restNotice.className = 'rest-day-notice';
          restNotice.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 13px;">bedtime</span>
            <span>SCHEDULED REST DAY // NO ACTIVE QUESTS</span>
          `;
          listEl.appendChild(restNotice);
        } else {
          const dayHistory = state.history[dStr] || [];
          dayProtocols.forEach(p => {
            const protoForDay = Object.assign({}, p, {
              completed: dayHistory.includes(p.id)
            });
            const cMode = isDayToday ? 'interactive' : (isPast ? 'past' : 'future');
            listEl.appendChild(createProtocolCard(protoForDay, !isDayToday, cMode));
          });
        }

        container.appendChild(groupEl);
      }

      if (totalWeekQuests === 0 && (curWk.end - curWk.start + 1) === 0) {
        renderEmptyState(`No quests scheduled for ${curWk.name}.`);
      }
      return;
    } else if (!isCurrentMonth) {
      // Past / Other Month: Visual Read-Only Mode
      filtered = state.protocols;
      isReadOnly = true;
      cardMode = 'future';
      if (titleEl) titleEl.textContent = `MONTH ARCHIVE // ${MONTH_NAMES[viewedMonthIndex]} ${viewedYear}`;
    } else {
      // LIVE TODAY
      filtered = state.protocols.filter(p => {
        const isWithinDate = (!p.startDate || p.startDate <= todayStr) && (!p.endDate || p.endDate >= todayStr);
        if (!isWithinDate) return false;
        if (!p.selectedDays || p.selectedDays.length === 0 || p.selectedDays.length === 7) return true;
        return p.selectedDays.includes(todayDayIndex);
      });
      isReadOnly = false;
      cardMode = 'interactive';
      if (titleEl) titleEl.textContent = "ACTIVE QUESTS";
    }

    // Render live today or non-current month
    if (filtered.length === 0) {
      renderEmptyState('No quests scheduled for today. Take a breather or deploy a new quest.');
      return;
    }
    filtered.forEach(proto => {
      container.appendChild(createProtocolCard(proto, isReadOnly, cardMode));
    });
  }

  function openQuestDetailsModal(proto) {
    if (!proto || !elements.questDetailsModalBackdrop) return;

    let categoryName = (proto.category || 'OBJECTIVE').toUpperCase();
    if (categoryName === 'DEEPFOCUS') categoryName = 'DEEP_FOCUS';

    // Yearly completions count
    let yearlyCompletions = 0;
    const yearPrefix = `${getEffectiveDate().getFullYear()}-`;
    if (state.history) {
      Object.entries(state.history).forEach(([dStr, completedList]) => {
        if (dStr.startsWith(yearPrefix) && Array.isArray(completedList) && completedList.includes(proto.id)) {
          yearlyCompletions++;
        }
      });
    }

    // Days formatted
    let daysFormatted = '';
    const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    if (proto.selectedDays && proto.selectedDays.length > 0) {
      if (proto.selectedDays.length === 7) {
        daysFormatted = 'DAILY (7 DAYS / WEEK)';
      } else {
        daysFormatted = proto.selectedDays.map(d => DAY_NAMES_SHORT[d]).join(', ');
      }
    } else {
      daysFormatted = `${proto.frequency} DAY(S) / WEEK`;
    }

    // Timeline formatted
    let timelineText = `FROM ${proto.startDate || 'SYSTEM INITIALIZATION'}`;
    if (proto.endDate) {
      timelineText += `  •  UNTIL ${proto.endDate}`;
    } else {
      timelineText += `  •  ONGOING`;
    }

    if (elements.modalQuestHeroIcon) {
      elements.modalQuestHeroIcon.textContent = proto.icon || 'sports_esports';
    }
    if (elements.modalQuestName) {
      elements.modalQuestName.textContent = proto.name;
    }
    if (elements.modalQuestCategory) {
      elements.modalQuestCategory.textContent = categoryName;
    }
    if (elements.modalQuestFrequency) {
      elements.modalQuestFrequency.textContent = `${proto.frequency}D/WK`;
    }
    if (elements.modalQuestDays) {
      elements.modalQuestDays.textContent = daysFormatted;
    }
    if (elements.modalQuestTimeline) {
      elements.modalQuestTimeline.textContent = timelineText;
    }
    if (elements.modalQuestNotes) {
      elements.modalQuestNotes.textContent = (proto.notes && proto.notes.trim()) ? proto.notes : '// NO DIRECTIVE BRIEFING FILED';
    }

    if (proto.metricName && elements.modalQuestMetricGrid) {
      elements.modalQuestMetricGrid.style.display = 'grid';
      if (elements.modalQuestMetricLabel) elements.modalQuestMetricLabel.textContent = `METRIC: ${proto.metricName}`;
      let totalAllTime = 0;
      let totalThisYear = 0;
      const yearStr = `${getEffectiveDate().getFullYear()}-`;

      if (state.metrics) {
        Object.keys(state.metrics).forEach(dStr => {
          if (state.metrics[dStr] && state.metrics[dStr][proto.id] !== undefined) {
            const val = state.metrics[dStr][proto.id];
            totalAllTime += val;
            if (dStr.startsWith(yearStr)) {
              totalThisYear += val;
            }
          }
        });
      }
      if (elements.modalQuestMetricTotal) elements.modalQuestMetricTotal.textContent = Number.isInteger(totalAllTime) ? totalAllTime : totalAllTime.toFixed(1);
      if (elements.modalQuestMetricYear) elements.modalQuestMetricYear.textContent = Number.isInteger(totalThisYear) ? totalThisYear : totalThisYear.toFixed(1);
      
      if (elements.modalQuestMetricUnits) {
        elements.modalQuestMetricUnits.forEach(u => {
          u.textContent = proto.metricUnit || 'COUNT';
        });
      }
    } else if (elements.modalQuestMetricGrid) {
      elements.modalQuestMetricGrid.style.display = 'none';
    }

    elements.questDetailsModalBackdrop.style.display = 'flex';
    // Small delay to allow display: flex to apply before opacity transition
    setTimeout(() => {
      elements.questDetailsModalBackdrop.classList.add('show');
    }, 10);
    if (window.tacticalAudio) window.tacticalAudio.playSelect();
  }

  function closeQuestDetailsModal() {
    if (elements.questDetailsModalBackdrop) {
      elements.questDetailsModalBackdrop.classList.remove('show');
      setTimeout(() => {
        elements.questDetailsModalBackdrop.style.display = 'none';
      }, 250);
    }
  }

  function createProtocolCard(proto, isReadOnly = false, cardMode = 'interactive') {
    const card = document.createElement('div');
    card.className = `protocol-card ${proto.completed ? 'completed' : ''} ${isReadOnly ? 'read-only' : ''} ${cardMode === 'yearly' ? 'yearly-card' : ''}`;
    card.dataset.id = proto.id;

    // Format category display
    let categoryName = (proto.category || 'OBJECTIVE').toUpperCase();
    if (categoryName === 'DEEPFOCUS') categoryName = 'DEEP_FOCUS';

    // Format notes snippet if present (only on interactive/past/future cards, not on yearly card surface)
    let notesHtml = '';
    if (cardMode !== 'yearly' && proto.notes && proto.notes.trim()) {
      notesHtml = `
        <div class="protocol-note-memo" title="${proto.notes}">
          <span class="material-symbols-outlined">notes</span>
          <span>${proto.notes}</span>
        </div>
      `;
    }

    // Action buttons vs Read-Only / Yearly Badges
    let actionHtml = '';
    let metaHtml = '';

    if (cardMode === 'yearly') {
      // Streamlined yearly format: [Symbol] NAME, meta: CATEGORY • {frequency}D/WK, right: delete button
      metaHtml = `
        <span class="protocol-tag">${categoryName}</span>
        <span>•</span>
        <span style="color: #ccc;">${proto.frequency}D/WK</span>
      `;
      actionHtml = `
        <div class="protocol-actions">
          <button class="protocol-delete-btn" data-id="${proto.id}" title="Delete / Retire Quest from Archive">
            <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
          </button>
        </div>
      `;
    } else if (cardMode === 'past') {
      const inspectDateStr = state.selectedInspectionDate;
      const isDayPartial = (inspectDateStr && state.partialDays && state.partialDays[inspectDateStr] !== undefined) ||
                           (inspectDateStr && !proto.completed && state.dailyScores[inspectDateStr] > 0);
      let badgeClass = 'missed-badge';
      let badgeText = 'MISSED';
      if (proto.completed) {
        badgeClass = 'completed-badge';
        badgeText = 'COMPLETED';
      } else if (isDayPartial) {
        badgeClass = 'partial-badge';
        badgeText = 'PARTIAL';
      }
      metaHtml = `<span class="protocol-tag">${categoryName}</span>`;
      actionHtml = `
        <div class="protocol-actions">
          <span class="read-only-badge ${badgeClass}">${badgeText}</span>
        </div>
      `;
    } else if (cardMode === 'future') {
      metaHtml = `<span class="protocol-tag">${categoryName}</span>`;
      actionHtml = `
        <div class="protocol-actions">
          <span class="read-only-badge">SCHEDULED</span>
        </div>
      `;
    } else {
      // Interactive mode (Today's quests)
      // Streamlined today format: [Symbol] NAME, meta: CATEGORY, right: check tick & delete button
      metaHtml = `<span class="protocol-tag">${categoryName}</span>`;
      actionHtml = `
        <div class="protocol-actions">
          <button class="hex-checkbox" data-id="${proto.id}" title="${proto.completed ? 'Mark Pending' : 'Complete Quest'}">
            <span class="material-symbols-outlined" style="font-size: 18px; font-weight: bold;">check</span>
          </button>
          <button class="protocol-delete-btn" data-id="${proto.id}" title="Abort / Delete Quest">
            <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="protocol-icon-box">
        <span class="material-symbols-outlined" style="font-size: 20px;">${proto.icon || 'terminal'}</span>
      </div>
      <div class="protocol-info">
        <div class="protocol-name">${proto.name}</div>
        <div class="protocol-meta">
          ${metaHtml}
        </div>
        ${notesHtml}
      </div>
      ${actionHtml}
    `;

    // Attach listeners depending on cardMode
    if (cardMode === 'interactive') {
      const checkbox = card.querySelector('.hex-checkbox');
      if (checkbox) {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleProtocol(proto.id);
        });
      }

      const delBtn = card.querySelector('.protocol-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteProtocol(proto.id);
        });
      }

      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        openQuestDetailsModal(proto);
      });
    } else if (cardMode === 'yearly') {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.protocol-delete-btn')) return;
        openQuestDetailsModal(proto);
      });

      const delBtn = card.querySelector('.protocol-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteProtocol(proto.id);
        });
      }
    }

    return card;
  }

  /* ==========================================================
     PROTOCOL ACTIONS & PAC-MAN INTERACTIONS
     ========================================================== */

  function processProtocolCompletion(proto, todayStr) {
    // Add to today's history log
    if (!state.history[todayStr].includes(proto.id)) {
      state.history[todayStr].push(proto.id);
    }

    // Add points
    state.currentScore += 100;

    // Play 8-bit Pac-Man Chomp
    if (window.tacticalAudio) window.tacticalAudio.playPacmanChomp();
    showToast(`DIRECTIVE EXECUTED // +100 PTS`, 'success', 'sports_esports');

    // Check if all protocols scheduled for today are completed
    const todayDayIndex = getDayIndexFromDateString(todayStr);
    const todayScheduled = state.protocols.filter(p => {
      if (!p.selectedDays || p.selectedDays.length === 0 || p.selectedDays.length === 7) return true;
      return p.selectedDays.includes(todayDayIndex);
    });

    const allTodayDone = todayScheduled.length > 0 && todayScheduled.every(p => p.completed);
    if (allTodayDone) {
      state.currentScore += 500;
      state.streak += 1;

      if (window.tacticalAudio) {
        setTimeout(() => window.tacticalAudio.playFruitPickup(), 150);
      }
      showToast(`PERFECT DAY CLEARED! 🍒 +500 BONUS PTS!`, 'success', 'military_tech');
    }

    saveState();
    renderArcadeHUD();
    renderProtocols();
  }

  function toggleProtocol(id) {
    const proto = state.protocols.find(p => p.id === id);
    if (!proto) return;

    const todayStr = getTodayDateString();
    if (!state.history[todayStr]) {
      state.history[todayStr] = [];
    }

    proto.completed = !proto.completed;
    proto.completedAt = proto.completed ? new Date().toISOString() : null;

    if (proto.completed) {
      if (proto.metricName) {
        // Open custom metric modal
        if (elements.metricInputModalBackdrop) {
          elements.metricModalDesc.textContent = `ENTER ${proto.metricName} (${proto.metricUnit || 'COUNT'})`;
          elements.metricModalInput.value = '';
          
          elements.metricInputModalBackdrop.style.display = 'flex';
          requestAnimationFrame(() => {
            elements.metricInputModalBackdrop.classList.add('show');
          });
          if (window.tacticalAudio) window.tacticalAudio.playSelect();
          elements.metricModalInput.focus();

          // Temporarily attach proto and todayStr to the submit button
          elements.metricModalSubmitBtn.dataset.protoId = proto.id;
          elements.metricModalSubmitBtn.dataset.todayStr = todayStr;
        }
        return; // Exit early, completion handled by modal submit
      }
      processProtocolCompletion(proto, todayStr);
    } else {
      // Remove from today's history log
      state.history[todayStr] = state.history[todayStr].filter(item => item !== proto.id);
      state.currentScore = Math.max(0, state.currentScore - 100);

      if (window.tacticalAudio) window.tacticalAudio.playSelect();
      showToast(`DIRECTIVE RESET TO PENDING`, 'normal', 'restart_alt');

      saveState();
      renderArcadeHUD();
      renderProtocols();
    }
  }

  function deleteProtocol(id) {
    const proto = state.protocols.find(p => p.id === id);
    if (!proto) return;

    state.protocols = state.protocols.filter(p => p.id !== id);
    if (window.tacticalAudio) window.tacticalAudio.playError();
    showToast(`PROTOCOL ABORTED & REMOVED`, 'error', 'delete');

    saveState();
    renderArcadeHUD();
    renderProtocols();
  }

  /* ==========================================================
     VIEW SWITCHING & ROUTING
     ========================================================== */

  function switchView(target) {
    if (window.tacticalAudio) window.tacticalAudio.playSelect();

    if (target === 'init') {
      elements.viewDashboard.classList.remove('active');
      elements.viewInit.classList.add('active');
      resetInitForm();

      const isTodayMode = (state.newQuestContext === 'today');
      if (elements.formTimelineGroup) {
        elements.formTimelineGroup.style.display = isTodayMode ? 'none' : 'block';
      }
      if (elements.formFrequencyGroup) {
        elements.formFrequencyGroup.style.display = isTodayMode ? 'none' : 'block';
      }
      if (elements.startDateInput) {
        if (isTodayMode) {
          elements.startDateInput.removeAttribute('required');
        } else {
          elements.startDateInput.setAttribute('required', 'true');
        }
      }

      setTimeout(() => {
        if (elements.habitNameInput && typeof elements.habitNameInput.focus === 'function') {
          elements.habitNameInput.focus();
        }
      }, 150);
    } else {
      elements.viewInit.classList.remove('active');
      elements.viewDashboard.classList.add('active');
      renderArcadeHUD();
      renderProtocols();
    }
  }

  /* ==========================================================
     FREQUENCY & SCHEDULE VALIDATION / LOCKING
     ========================================================== */

  function evaluateFrequencyAndLockDays() {
    const startDateStr = elements.startDateInput ? elements.startDateInput.value : getTodayDateString();
    const frequency = state.selectedFrequency;
    const freqAlertEl = elements.freqValidationAlert;

    const startDayIndex = getDayIndexFromDateString(startDateStr);
    const startDayName = DAY_NAMES[startDayIndex];
    const remainingDaysInWeek = 6 - startDayIndex + 1;

    // 1. Disable days that precede start date in initial week
    elements.dayChips.forEach(chip => {
      const day = parseInt(chip.dataset.day, 10);
      if (day < startDayIndex) {
        chip.classList.add('disabled-day');
        chip.setAttribute('disabled', 'true');
        chip.title = `Precedes start date (${startDayName}) in the initial week`;
        const idx = state.selectedDays.indexOf(day);
        if (idx > -1) {
          state.selectedDays.splice(idx, 1);
        }
      } else {
        chip.classList.remove('disabled-day');
        chip.removeAttribute('disabled');
        chip.title = '';
      }
    });

    // 2. Validate if frequency exceeds remaining eligible days
    if (frequency > remainingDaysInWeek) {
      const remainingDaysNames = DAY_NAMES.slice(startDayIndex, 7).join(', ');
      showAlert(freqAlertEl, `<span class="material-symbols-outlined" style="font-size: 16px;">error</span> <span><strong>FREQUENCY CONFLICT:</strong> Start date (${startDateStr}, ${startDayName}) has only <strong>${remainingDaysInWeek} eligible day(s)</strong> remaining before week ends on Saturday (${remainingDaysNames}). Frequency of <strong>${frequency} days/week</strong> is not possible. Please reduce frequency or select an earlier start date.</span>`);

      hideAlert(elements.scheduleValidationAlert);

      if (elements.daysContainer) {
        elements.daysContainer.classList.add('locked');
      }

      state.selectedDays = [];
      updateDaysUI();
      return { valid: false, reason: `Frequency ${frequency} exceeds remaining ${remainingDaysInWeek} day(s) in initial week.` };
    }

    hideAlert(freqAlertEl);

    if (elements.daysContainer) {
      elements.daysContainer.classList.remove('locked');
    }

    updateDaysUI();
    return { valid: true };
  }

  function updateDaysUI() {
    elements.dayChips.forEach(chip => {
      const day = parseInt(chip.dataset.day, 10);
      if (state.selectedDays.includes(day)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    if (elements.daysCountDisplay) {
      elements.daysCountDisplay.textContent = `${state.selectedDays.length} / ${state.selectedFrequency} SELECTED`;
      elements.daysCountDisplay.style.color = 'var(--color-primary-light)';
    }
  }

  /* ==========================================================
     PROTOCOL INITIALIZATION FORM
     ========================================================== */

  function resetInitForm() {
    elements.habitNameInput.value = '';
    elements.habitNameInput.classList.remove('error');

    if (elements.notesInput) {
      elements.notesInput.value = '';
    }
    if (elements.metricNameInput) {
      elements.metricNameInput.value = '';
    }
    if (elements.metricUnitInput) {
      elements.metricUnitInput.value = '';
    }

    hideAlert(elements.freqValidationAlert);
    hideAlert(elements.scheduleValidationAlert);

    state.selectedCategory = null;
    state.selectedCategoryIcon = null;
    elements.paramCards.forEach(c => {
      c.classList.remove('active');
    });

    const today = getTodayDateString();
    if (elements.startDateInput) {
      elements.startDateInput.value = today;
      elements.startDateInput.min = today;
      elements.startDateInput.classList.remove('error');
    }
    if (elements.endDateInput) {
      elements.endDateInput.value = '';
      elements.endDateInput.min = today;
      elements.endDateInput.classList.remove('error');
    }

    state.selectedFrequency = 1;
    if (elements.freqSlider) {
      elements.freqSlider.value = '1';
      elements.freqDisplay.textContent = '01 DAY/WEEK';
    }

    state.selectedDays = [];
    evaluateFrequencyAndLockDays();

    elements.submitBtn.classList.remove('active-state');
    elements.submitBtn.disabled = false;
    elements.submitBtnText.textContent = 'DEPLOY_QUEST';
    elements.submitBtnIcon.textContent = 'bolt';
  }

  function handleFormSubmission() {
    const rawName = elements.habitNameInput.value.trim();
    if (!rawName) {
      elements.habitNameInput.classList.add('error');
      if (window.tacticalAudio) window.tacticalAudio.playError();
      showToast('QUEST NAME REQUIRED', 'error', 'warning');
      elements.habitNameInput.focus();
      return;
    }

    if (!state.selectedCategory) {
      if (window.tacticalAudio) window.tacticalAudio.playError();
      showToast('CATEGORY SELECTION REQUIRED', 'error', 'category');
      return;
    }

    const isTodayMode = (state.newQuestContext === 'today');
    const today = getTodayDateString();
    let startDate = today;
    let endDate = isTodayMode ? today : null;
    let frequency = 1;
    let selectedDays = [getEffectiveDate().getDay()];

    if (!isTodayMode) {
      startDate = elements.startDateInput ? elements.startDateInput.value : today;
      if (!startDate || startDate < today) {
        if (elements.startDateInput) elements.startDateInput.classList.add('error');
        if (window.tacticalAudio) window.tacticalAudio.playError();
        showToast('START DATE MUST BE TODAY OR LATER', 'error', 'event');
        if (elements.startDateInput) elements.startDateInput.focus();
        return;
      }

      endDate = (elements.endDateInput && elements.endDateInput.value) ? elements.endDateInput.value : null;
      if (endDate && endDate < startDate) {
        if (elements.endDateInput) elements.endDateInput.classList.add('error');
        if (window.tacticalAudio) window.tacticalAudio.playError();
        showToast('END DATE CANNOT BE BEFORE START DATE', 'error', 'event');
        if (elements.endDateInput) elements.endDateInput.focus();
        return;
      }

      const freqCheck = evaluateFrequencyAndLockDays();
      if (!freqCheck.valid) {
        if (window.tacticalAudio) window.tacticalAudio.playError();
        showToast(freqCheck.reason, 'error', 'event');
        return;
      }

      if (state.selectedDays.length !== state.selectedFrequency) {
        showAlert(elements.scheduleValidationAlert, `<span class="material-symbols-outlined" style="font-size: 16px;">error</span> <span><strong>SCHEDULE MISMATCH:</strong> Frequency is set to <strong>${state.selectedFrequency} day(s)/week</strong>, but you have selected <strong>${state.selectedDays.length} day(s)</strong>. Please select exactly ${state.selectedFrequency} day(s).</span>`);
        if (window.tacticalAudio) window.tacticalAudio.playError();
        showToast(`SCHEDULE MISMATCH: SELECT EXACTLY ${state.selectedFrequency} DAY(S)`, 'error', 'warning');
        return;
      }

      hideAlert(elements.scheduleValidationAlert);
      frequency = parseInt(state.selectedFrequency, 10);
      selectedDays = [...state.selectedDays].sort((a, b) => a - b);
    } else {
      hideAlert(elements.scheduleValidationAlert);
      hideAlert(elements.freqValidationAlert);
    }

    const formattedName = rawName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/g, '');
    const notes = elements.notesInput ? elements.notesInput.value.trim() : '';

    const deployImmediately = (typeof window !== 'undefined' && window.__kuroganeSkipDeployAnimation);
    
    const metricNameRaw = elements.metricNameInput ? elements.metricNameInput.value.trim() : '';
    const metricUnitRaw = elements.metricUnitInput ? elements.metricUnitInput.value.trim() : '';
    const metricName = metricNameRaw ? metricNameRaw.toUpperCase() : null;
    const metricUnit = metricUnitRaw ? metricUnitRaw.toUpperCase() : null;

    if (deployImmediately) {
      const newProtocol = {
        id: 'proto_' + Date.now(),
        name: formattedName,
        category: state.selectedCategory,
        icon: state.selectedCategoryIcon || 'terminal',
        frequency: frequency,
        selectedDays: selectedDays,
        startDate: startDate,
        endDate: endDate,
        notes: notes,
        metricName: metricName,
        metricUnit: metricUnit,
        completed: false,
        completedAt: null
      };
      state.protocols.push(newProtocol);
      saveState();
      return;
    }

    elements.submitBtn.disabled = true;
    const originalText = "DEPLOYING...";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    let iterations = 0;
    const maxIterations = 14;

    const interval = setInterval(() => {
      if (window.tacticalAudio) window.tacticalAudio.playScramble();
      elements.submitBtnText.textContent = originalText.split('').map((char, index) => {
        if (index < iterations / 2) {
          return originalText[index];
        }
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');

      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);

        elements.submitBtnText.textContent = 'QUEST_ACTIVE';
        elements.submitBtnIcon.textContent = 'check_circle';
        elements.submitBtn.classList.add('active-state');
        if (window.tacticalAudio) window.tacticalAudio.playStageClear();

        const newProtocol = {
          id: 'proto_' + Date.now(),
          name: formattedName,
          category: state.selectedCategory,
          icon: state.selectedCategoryIcon || 'terminal',
          frequency: frequency,
          selectedDays: selectedDays,
          startDate: startDate,
          endDate: endDate,
          notes: notes,
          metricName: metricName,
          metricUnit: metricUnit,
          completed: false,
          completedAt: null
        };

        state.protocols.push(newProtocol);
        saveState();

        showToast(`QUEST DEPLOYED: ${formattedName}`, 'success', 'verified');

        setTimeout(() => {
          switchView('dashboard');
        }, 700);
      }
    }, 45);
  }

  /* ==========================================================
     TOAST NOTIFICATIONS
     ========================================================== */

  let toastTimer = null;
  function showToast(message, type = 'normal', iconName = 'info') {
    if (!elements.toast) return;

    if (toastTimer) clearTimeout(toastTimer);

    elements.toastMsg.textContent = message;
    elements.toastIcon.textContent = iconName;

    elements.toast.classList.remove('success', 'error');
    if (type === 'success') elements.toast.classList.add('success');
    if (type === 'error') elements.toast.classList.add('error');

    elements.toast.classList.add('show');

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2800);
  }

  /* ==========================================================
     DATA EXPORT (.CSV) & MULTI-MONTH SELECTOR MODAL
     ========================================================== */

  const MONTH_NAMES_LIST = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  function openExportModal() {
    if (!elements.exportModalBackdrop || !elements.exportMonthsList) return;

    const effective = getEffectiveDate();
    const currentMonthKey = `${effective.getFullYear()}-${String(effective.getMonth() + 1).padStart(2, '0')}`;

    const monthKeySet = new Set();
    monthKeySet.add(currentMonthKey);

    Object.keys(state.history).forEach(dateStr => {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        monthKeySet.add(`${parts[0]}-${parts[1]}`);
      }
    });

    const sortedMonths = Array.from(monthKeySet).sort().reverse();

    elements.exportMonthsList.innerHTML = '';
    sortedMonths.forEach(monthKey => {
      const [y, m] = monthKey.split('-').map(Number);
      const mName = MONTH_NAMES_LIST[m - 1] || 'MONTH';

      let entryCount = 0;
      Object.keys(state.history).forEach(dStr => {
        if (dStr.startsWith(monthKey) && state.history[dStr] && state.history[dStr].length > 0) {
          entryCount += state.history[dStr].length;
        }
      });

      const row = document.createElement('div');
      row.className = 'export-month-row selected';
      row.dataset.month = monthKey;
      row.innerHTML = `
        <label class="export-month-label" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
          <input type="checkbox" class="export-checkbox" value="${monthKey}" checked>
          <span>${mName} ${y} ${monthKey === currentMonthKey ? '(CURRENT)' : ''}</span>
        </label>
        <span class="export-month-count">${entryCount} LOGS</span>
      `;

      const checkbox = row.querySelector ? row.querySelector('.export-checkbox') : null;
      if (checkbox && checkbox.addEventListener) {
        checkbox.addEventListener('change', () => {
          row.classList.toggle('selected', checkbox.checked);
        });
      }

      elements.exportMonthsList.appendChild(row);
    });

    elements.exportModalBackdrop.style.display = 'flex';
    elements.exportModalBackdrop.classList.add('show');
    if (window.tacticalAudio) window.tacticalAudio.playSelect();
  }

  function closeExportModal() {
    if (elements.exportModalBackdrop) {
      elements.exportModalBackdrop.classList.remove('show');
      elements.exportModalBackdrop.style.display = 'none';
    }
  }

  function generateSelectedMonthsCSV() {
    if (!elements.exportMonthsList) return;

    const checkboxes = elements.exportMonthsList.querySelectorAll('.export-checkbox:checked');
    const selectedMonths = Array.from(checkboxes).map(cb => cb.value);

    if (selectedMonths.length === 0) {
      showToast('SELECT AT LEAST ONE MONTH TO EXPORT', 'error', 'warning');
      return;
    }

    const headers = [
      'RecordDate',
      'DayOfWeek',
      'QuestID',
      'QuestName',
      'Category',
      'ScheduledFrequency',
      'CompletionStatus',
      'MetricName',
      'MetricUnit',
      'MetricValue',
      'DailyScoreEarnedPTS',
      'CumulativeScorePTS',
      'ActiveStreakDays',
      'ConsistencyRewardPTS'
    ];

    const rows = [headers.join(',')];
    const allDates = Object.keys(state.history).filter(dStr => {
      const mKey = dStr.substring(0, 7);
      return selectedMonths.includes(mKey);
    });

    selectedMonths.forEach(mKey => {
      const [y, m] = mKey.split('-').map(Number);
      const daysInM = new Date(y, m, 0).getDate();
      for (let day = 1; day <= daysInM; day++) {
        const dStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!allDates.includes(dStr)) {
          allDates.push(dStr);
        }
      }
    });

    allDates.sort();

    allDates.forEach(dateStr => {
      const dObj = new Date(dateStr + 'T00:00:00');
      const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dObj.getDay()];
      const completedIds = state.history[dateStr] || [];
      const scheduled = getScheduledForDate(dateStr);
      const dayScore = state.dailyScores[dateStr] !== undefined ? state.dailyScores[dateStr] : calculateDayScore(dateStr);
      const dayMetrics = state.metrics && state.metrics[dateStr] ? state.metrics[dateStr] : {};

      scheduled.forEach(proto => {
        const isDone = completedIds.includes(proto.id);
        const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        const metricVal = dayMetrics[proto.id] !== undefined ? dayMetrics[proto.id] : '';

        rows.push([
          dateStr, // Removing quotes so Excel strictly parses it as a standard date without text-wrapper confusion
          escapeCsv(dayName),
          escapeCsv(proto.id),
          escapeCsv(proto.name),
          escapeCsv(proto.category),
          escapeCsv(`${proto.frequency}D/WK`),
          escapeCsv(isDone ? 'COMPLETED' : 'INCOMPLETE'),
          escapeCsv(proto.metricName || ''),
          escapeCsv(proto.metricUnit || ''),
          escapeCsv(metricVal),
          dayScore,
          state.currentScore,
          state.streak,
          state.consistencyBonus
        ].join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `questlog_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closeExportModal();
    if (window.tacticalAudio) window.tacticalAudio.playFruitPickup();
    showToast(`EXPORTED CSV FOR ${selectedMonths.length} MONTH(S)`, 'success', 'download_done');
  }

  /* ==========================================================
     EVENT BINDINGS & INITIALIZATION
     ========================================================== */

  function setupEventListeners() {

    // View Navigation Buttons
    if (elements.openInitScreenBtn) {
      elements.openInitScreenBtn.addEventListener('click', () => {
        state.newQuestContext = (state.currentFilter === 'today') ? 'today' : 'yearly';
        switchView('init');
      });
    }
    if (elements.initBackBtn) {
      elements.initBackBtn.addEventListener('click', () => switchView('dashboard'));
    }

    // Read-Only Quest Details Modal Close Handlers
    if (elements.closeQuestDetailsBtn) {
      elements.closeQuestDetailsBtn.addEventListener('click', closeQuestDetailsModal);
    }
    if (elements.modalQuestCloseActionBtn) {
      elements.modalQuestCloseActionBtn.addEventListener('click', closeQuestDetailsModal);
    }
    if (elements.questDetailsModalBackdrop) {
      elements.questDetailsModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.questDetailsModalBackdrop) {
          closeQuestDetailsModal();
        }
      });
    }

    // Metric Input Modal Handlers
    if (elements.closeMetricModalBtn && elements.metricInputModalBackdrop) {
      elements.closeMetricModalBtn.addEventListener('click', () => {
        elements.metricInputModalBackdrop.classList.remove('show');
        setTimeout(() => { elements.metricInputModalBackdrop.style.display = 'none'; }, 250);
        
        // Revert completion if canceled
        const protoId = elements.metricModalSubmitBtn.dataset.protoId;
        const proto = state.protocols.find(p => p.id === protoId);
        if (proto) {
          proto.completed = false;
          proto.completedAt = null;
          renderProtocols();
        }
      });
    }

    if (elements.metricInputModalBackdrop) {
      elements.metricInputModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.metricInputModalBackdrop) {
          elements.closeMetricModalBtn.click();
        }
      });
    }
    
    if (elements.metricModalSubmitBtn && elements.metricInputModalBackdrop) {
      elements.metricModalSubmitBtn.addEventListener('click', () => {
        const protoId = elements.metricModalSubmitBtn.dataset.protoId;
        const todayStr = elements.metricModalSubmitBtn.dataset.todayStr;
        const proto = state.protocols.find(p => p.id === protoId);
        if (proto) {
          let val = parseFloat(elements.metricModalInput.value);
          if (isNaN(val)) val = 0; // Default to 0 if empty
          
          if (!state.metrics[todayStr]) state.metrics[todayStr] = {};
          state.metrics[todayStr][proto.id] = val;
          
          elements.metricInputModalBackdrop.classList.remove('show');
          setTimeout(() => { elements.metricInputModalBackdrop.style.display = 'none'; }, 250);
          
          processProtocolCompletion(proto, todayStr);
        }
      });
    }
    
    if (elements.metricModalInput) {
      elements.metricModalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          elements.metricModalSubmitBtn.click();
        }
      });
    }

    // Sound FX Toggle
    if (elements.soundToggleBtn) {
      elements.soundToggleBtn.addEventListener('click', () => {
        if (window.tacticalAudio) {
          const isEnabled = window.tacticalAudio.toggleSound();
          state.soundEnabled = isEnabled;
          if (elements.soundIcon) {
            elements.soundIcon.textContent = isEnabled ? 'volume_up' : 'volume_off';
          }
          elements.soundToggleBtn.classList.toggle('active', isEnabled);
          showToast(isEnabled ? 'AUDIO TELEMETRY ONLINE' : 'AUDIO TELEMETRY MUTED', 'normal', isEnabled ? 'volume_up' : 'volume_off');
        }
      });
    }

    // Rule Book Modal
    if (elements.openRulesBtn && elements.rulesModalBackdrop) {
      elements.openRulesBtn.addEventListener('click', () => {
        elements.rulesModalBackdrop.classList.add('show');
        if (window.tacticalAudio) window.tacticalAudio.playSelect();
      });
    }
    if (elements.closeRulesBtn && elements.rulesModalBackdrop) {
      elements.closeRulesBtn.addEventListener('click', () => {
        elements.rulesModalBackdrop.classList.remove('show');
      });
    }
    if (elements.rulesModalBackdrop) {
      elements.rulesModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.rulesModalBackdrop) {
          elements.rulesModalBackdrop.classList.remove('show');
        }
      });
    }

    // Dev Testing Sandbox Panel Toggle (Test Mode vs Prod Mode)
    if (elements.toggleDevSandboxBtn && elements.devSandboxPanel) {
      elements.toggleDevSandboxBtn.addEventListener('click', () => {
        const isCurrentlyOpen = elements.devSandboxPanel.classList.contains('open');
        if (isCurrentlyOpen) {
          // Close panel
          elements.devSandboxPanel.classList.remove('open');
          elements.toggleDevSandboxBtn.classList.remove('active');
          showToast('DEVELOPER SANDBOX CLOSED', 'normal', 'check_circle');
        } else {
          // Open panel
          elements.devSandboxPanel.classList.add('open');
          elements.toggleDevSandboxBtn.classList.add('active');
          if (elements.devMockDateInput) {
            elements.devMockDateInput.value = getTodayDateString();
          }
          showToast('TEST MODE ACTIVE (DEVELOPER SANDBOX ONLINE)', 'normal', 'bug_report');
        }
        if (window.tacticalAudio) window.tacticalAudio.playSelect();
      });
    }
    if (elements.closeDevSandboxBtn && elements.devSandboxPanel) {
      elements.closeDevSandboxBtn.addEventListener('click', () => {
        elements.devSandboxPanel.classList.remove('open');
        if (elements.toggleDevSandboxBtn) elements.toggleDevSandboxBtn.classList.remove('active');
        showToast('DEVELOPER SANDBOX CLOSED', 'normal', 'check_circle');
      });
    }


    // Month Navigation Controls (Previous, Next, Current)
    if (elements.prevMonthBtn) {
      elements.prevMonthBtn.addEventListener('click', () => {
        const cur = getViewedDate();
        let m = cur.monthIndex - 1;
        let y = cur.year;
        if (m < 0) {
          m = 11;
          y--;
        }
        state.viewedYear = y;
        state.viewedMonthIndex = m;
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playSelect();
      });
    }

    if (elements.nextMonthBtn) {
      elements.nextMonthBtn.addEventListener('click', () => {
        const cur = getViewedDate();
        let m = cur.monthIndex + 1;
        let y = cur.year;
        if (m > 11) {
          m = 0;
          y++;
        }
        state.viewedYear = y;
        state.viewedMonthIndex = m;
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playSelect();
      });
    }

    if (elements.todayMonthBtn) {
      elements.todayMonthBtn.addEventListener('click', () => {
        state.viewedYear = null;
        state.viewedMonthIndex = null;
        state.selectedInspectionDate = null;
        state.selectedWeekNum = null;
        state.currentFilter = 'today';
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playFruitPickup();
        showToast("JUMPED TO CURRENT LIVE MONTH & TODAY'S QUESTS", 'normal', 'event');
      });
    }

    // Clickable Scoreboard Shields (Prompt Streak Recovery)
    if (elements.scoreBlockShields) {
      elements.scoreBlockShields.addEventListener('click', promptShieldUsage);
    }
    if (elements.shieldsSlotContainer) {
      elements.shieldsSlotContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        promptShieldUsage();
      });
    }

    // Streak Recovery Shield Alert Banner Actions
    if (elements.closeShieldAlertBtn && elements.streakShieldAlertBanner) {
      elements.closeShieldAlertBtn.addEventListener('click', () => {
        elements.streakShieldAlertBanner.style.display = 'none';
      });
    }
    if (elements.useShieldRecoverBtn) {
      elements.useShieldRecoverBtn.addEventListener('click', promptShieldUsage);
    }

    // Shield Recovery Confirmation Modal Actions (Popup like Rule Book)
    if (elements.closeShieldConfirmBtn) {
      elements.closeShieldConfirmBtn.addEventListener('click', closeShieldConfirmModal);
    }
    if (elements.shieldCancelBtn) {
      elements.shieldCancelBtn.addEventListener('click', closeShieldConfirmModal);
    }
    if (elements.shieldConfirmModalBackdrop) {
      elements.shieldConfirmModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.shieldConfirmModalBackdrop) closeShieldConfirmModal();
      });
    }
    if (elements.shieldApplyBtn) {
      elements.shieldApplyBtn.addEventListener('click', () => {
        closeShieldConfirmModal();
        useShieldToRecoverYesterday();
      });
    }
    if (elements.shieldRemoveBtn) {
      elements.shieldRemoveBtn.addEventListener('click', () => {
        closeShieldConfirmModal();
        removeShieldYesterday();
      });
    }

    // Export Data & Month Selector Modal
    if (elements.exportDataBtn) {
      elements.exportDataBtn.addEventListener('click', openExportModal);
    }
    if (elements.closeExportModalBtn) {
      elements.closeExportModalBtn.addEventListener('click', closeExportModal);
    }
    if (elements.exportCancelBtn) {
      elements.exportCancelBtn.addEventListener('click', closeExportModal);
    }
    if (elements.exportModalBackdrop) {
      elements.exportModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.exportModalBackdrop) closeExportModal();
      });
    }
    if (elements.exportSelectAllBtn) {
      elements.exportSelectAllBtn.addEventListener('click', () => {
        if (!elements.exportMonthsList) return;
        elements.exportMonthsList.querySelectorAll('.export-checkbox').forEach(cb => {
          cb.checked = true;
          const parentRow = cb.closest ? cb.closest('.export-month-row') : cb.parentElement?.parentElement;
          if (parentRow) parentRow.classList.add('selected');
        });
      });
    }
    if (elements.exportSelectCurrentBtn) {
      elements.exportSelectCurrentBtn.addEventListener('click', () => {
        if (!elements.exportMonthsList) return;
        const effective = getEffectiveDate();
        const currentMonthKey = `${effective.getFullYear()}-${String(effective.getMonth() + 1).padStart(2, '0')}`;
        elements.exportMonthsList.querySelectorAll('.export-month-row').forEach(row => {
          const cb = row.querySelector ? row.querySelector('.export-checkbox') : null;
          if (cb) {
            const isCur = (row.dataset.month === currentMonthKey);
            cb.checked = isCur;
            row.classList.toggle('selected', isCur);
          }
        });
      });
    }
    if (elements.exportDeselectAllBtn) {
      elements.exportDeselectAllBtn.addEventListener('click', () => {
        if (!elements.exportMonthsList) return;
        elements.exportMonthsList.querySelectorAll('.export-checkbox').forEach(cb => {
          cb.checked = false;
          const parentRow = cb.closest ? cb.closest('.export-month-row') : cb.parentElement?.parentElement;
          if (parentRow) parentRow.classList.remove('selected');
        });
      });
    }
    if (elements.exportConfirmDownloadBtn) {
      elements.exportConfirmDownloadBtn.addEventListener('click', generateSelectedMonthsCSV);
    }

    // ==========================================
    // Dev Sandbox: Time Machine & Simulators
    // ==========================================

    if (elements.devMockDateInput) {
      elements.devMockDateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          state.mockDate = e.target.value;
          saveState();
          renderArcadeHUD();
          renderProtocols();
          showToast(`VIRTUAL DATE SET TO ${state.mockDate}`, 'normal', 'schedule');
        }
      });
    }

    if (elements.devPrevDayBtn) {
      elements.devPrevDayBtn.addEventListener('click', () => {
        const curDate = getEffectiveDate();
        curDate.setDate(curDate.getDate() - 1);
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        state.mockDate = `${y}-${m}-${d}`;
        saveState();
        renderArcadeHUD();
        renderProtocols();
        showToast(`TIME MACHINE: JUMPED -1D TO ${state.mockDate}`, 'normal', 'arrow_back');
      });
    }

    if (elements.devNextDayBtn) {
      elements.devNextDayBtn.addEventListener('click', () => {
        const curDate = getEffectiveDate();
        curDate.setDate(curDate.getDate() + 1);
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        state.mockDate = `${y}-${m}-${d}`;
        saveState();
        renderArcadeHUD();
        renderProtocols();
        showToast(`TIME MACHINE: JUMPED +1D TO ${state.mockDate}`, 'normal', 'arrow_forward');
      });
    }

    if (elements.devResetDateBtn) {
      elements.devResetDateBtn.addEventListener('click', () => {
        state.mockDate = null;
        saveState();
        renderArcadeHUD();
        renderProtocols();
        showToast('TIME MACHINE: RESTORED LIVE DEVICE DATE', 'success', 'schedule');
      });
    }

    // a. Option: Fully Completed Day
    if (elements.devSimFullDayBtn) {
      elements.devSimFullDayBtn.addEventListener('click', () => {
        const curDate = getEffectiveDate();
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const scheduled = getScheduledForDate(todayStr);
        state.history[todayStr] = scheduled.map(p => p.id);
        state.dailyScores[todayStr] = 100;

        // Automatically advance Pac-Man to the next day (+1D)
        const nextDate = new Date(curDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextY = nextDate.getFullYear();
        const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextD = String(nextDate.getDate()).padStart(2, '0');
        state.mockDate = `${nextY}-${nextM}-${nextD}`;
        if (elements.devMockDateInput) {
          elements.devMockDateInput.value = state.mockDate;
        }

        saveState();
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playStageClear();
        showToast(`DAY FULLY COMPLETED (${todayStr}): 100% SCORE AWARDED // ADVANCED TO ${state.mockDate}`, 'success', 'check_circle');
      });
    }

    // b. Option: Partially Completed Day
    if (elements.devSimPartialDayBtn) {
      elements.devSimPartialDayBtn.addEventListener('click', () => {
        const curDate = getEffectiveDate();
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const scheduled = getScheduledForDate(todayStr);

        let completedIds = [];
        if (scheduled.length > 1) {
          // Choose random subset of size between 1 and scheduled.length - 1 (leave at least one incomplete)
          const numToComplete = Math.floor(Math.random() * (scheduled.length - 1)) + 1;
          const shuffled = [...scheduled].sort(() => 0.5 - Math.random());
          completedIds = shuffled.slice(0, numToComplete).map(p => p.id);
        } else {
          completedIds = []; // 0 completed to remain partial
          state.partialDays = state.partialDays || {};
          state.partialDays[todayStr] = 50;
        }

        state.history[todayStr] = completedIds;
        state.dailyScores[todayStr] = calculateDayScore(todayStr);

        // Automatically advance Pac-Man to the next day (+1D)
        const nextDate = new Date(curDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextY = nextDate.getFullYear();
        const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextD = String(nextDate.getDate()).padStart(2, '0');
        state.mockDate = `${nextY}-${nextM}-${nextD}`;
        if (elements.devMockDateInput) {
          elements.devMockDateInput.value = state.mockDate;
        }

        saveState();
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playPacmanChomp();
        showToast(`PARTIAL DAY SIMULATED ON ${todayStr} (${completedIds.length}/${scheduled.length} PROTOCOLS) // ADVANCED TO ${state.mockDate}`, 'normal', 'incomplete_circle');
      });
    }

    // c. Option: Fully Completed Week
    if (elements.devSimFullWeekBtn) {
      elements.devSimFullWeekBtn.addEventListener('click', () => {
        const effective = getEffectiveDate();
        const y = effective.getFullYear();
        const m = effective.getMonth();
        const curDay = effective.getDate();
        const weeks = getMonthWeeks(y, m);
        const curWeek = weeks.find(w => curDay >= w.start && curDay <= w.end) || weeks[0];

        if (curWeek) {
          for (let d = curWeek.start; d <= curWeek.end; d++) {
            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const sched = getScheduledForDate(dStr);
            state.history[dStr] = sched.map(p => p.id);
            state.dailyScores[dStr] = 100;
          }

          // Automatically advance virtual date past this week to next week start
          const nextDate = new Date(y, m, curWeek.end + 1);
          const nextY = nextDate.getFullYear();
          const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
          const nextD = String(nextDate.getDate()).padStart(2, '0');
          state.mockDate = `${nextY}-${nextM}-${nextD}`;
          if (elements.devMockDateInput) {
            elements.devMockDateInput.value = state.mockDate;
          }
        }

        saveState();
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playStageClear();
        showToast(`WEEK FULLY COMPLETED (${curWeek ? curWeek.name : 'THIS WEEK'}): 100% ALL DAYS // ADVANCED TO ${state.mockDate}`, 'success', 'bolt');
      });
    }

    // d. Option: Partially Completed Week
    if (elements.devSimPartialWeekBtn) {
      elements.devSimPartialWeekBtn.addEventListener('click', () => {
        const effective = getEffectiveDate();
        const y = effective.getFullYear();
        const m = effective.getMonth();
        const curDay = effective.getDate();
        const weeks = getMonthWeeks(y, m);
        const curWeek = weeks.find(w => curDay >= w.start && curDay <= w.end) || weeks[0];

        if (curWeek) {
          const daysArray = [];
          for (let d = curWeek.start; d <= curWeek.end; d++) {
            daysArray.push(d);
          }

          // Pick at least 1 day that MUST be partial/incomplete
          const guaranteedPartialDay = daysArray[Math.floor(Math.random() * daysArray.length)];

          daysArray.forEach(d => {
            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const sched = getScheduledForDate(dStr);

            if (d === guaranteedPartialDay || Math.random() < 0.5) {
              // Partial Day
              let completedIds = [];
              if (sched.length > 1) {
                const num = Math.floor(Math.random() * (sched.length - 1)) + 1;
                completedIds = sched.slice(0, num).map(p => p.id);
              } else {
                state.partialDays = state.partialDays || {};
                state.partialDays[dStr] = 50;
              }
              state.history[dStr] = completedIds;
              state.dailyScores[dStr] = calculateDayScore(dStr);
            } else {
              // Full Day
              state.history[dStr] = sched.map(p => p.id);
              state.dailyScores[dStr] = 100;
            }
          });

          // Automatically advance virtual date past this week to next week start
          const nextDate = new Date(y, m, curWeek.end + 1);
          const nextY = nextDate.getFullYear();
          const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
          const nextD = String(nextDate.getDate()).padStart(2, '0');
          state.mockDate = `${nextY}-${nextM}-${nextD}`;
          if (elements.devMockDateInput) {
            elements.devMockDateInput.value = state.mockDate;
          }
        }

        saveState();
        renderArcadeHUD();
        renderProtocols();
        if (window.tacticalAudio) window.tacticalAudio.playPacmanChomp();
        showToast(`PARTIAL WEEK SIMULATED (${curWeek ? curWeek.name : 'THIS WEEK'}) // ADVANCED TO ${state.mockDate}`, 'normal', 'pie_chart');
      });
    }

    if (elements.devSimMissedYesterdayBtn) {
      elements.devSimMissedYesterdayBtn.addEventListener('click', () => {
        const now = getEffectiveDate();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

        state.history[twoDaysAgoStr] = state.protocols.map(p => p.id);
        delete state.history[yStr];
        state.shields = Math.max(1, state.shields); // Ensure user has a shield to test

        saveState();
        renderArcadeHUD();
        renderProtocols();
        showToast(`SIMULATED MISSED YESTERDAY (${yStr}): STREAK RECOVERY ALERT TRIGGERED!`, 'normal', 'shield_with_heart');
      });
    }

    if (elements.devTriggerMidnightBtn) {
      elements.devTriggerMidnightBtn.addEventListener('click', () => {
        const todayStr = getTodayDateString();
        const score = calculateDayScore(todayStr);
        state.dailyScores[todayStr] = score;
        saveState();
        renderArcadeHUD();
        showToast(`11:59 PM FINALIZER: LOCKED IN ${score} PTS FOR ${todayStr}`, 'success', 'nightlight');
      });
    }

    if (elements.devClearHistoryBtn) {
      elements.devClearHistoryBtn.addEventListener('click', () => {
        if (confirm('PURGE ALL HISTORICAL RECORDS & RESTART SIMULATOR?')) {
          state.history = {};
          state.dailyScores = {};
          state.shieldedDates = {};
          state.usedShieldWeeks = {};
          state.shields = 0;
          state.consistencyBonus = 0;
          state.currentScore = 0;
          state.streak = 0;
          state.partialDays = {};
          state.shieldAppliedOn = null;
          state.mockDate = null;
          state.selectedWeekNum = null;
          state.selectedInspectionDate = null;
          state.protocols.forEach(p => p.completed = false);
          saveState();
          renderArcadeHUD();
          renderProtocols();
          showToast('HISTORY PURGED & REAL-TIME RESTORED', 'normal', 'delete_sweep');
        }
      });
    }


    // Filter Tabs (TODAY'S QUESTS / DAY, YEARLY ARCHIVE)
    elements.phaseFilters.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.phaseFilters.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentFilter = tab.dataset.filter;
        if (window.tacticalAudio) window.tacticalAudio.playSelect();
        renderArcadeHUD();
        renderProtocols();
      });
    });

    // Form: Category Parameter Matrix Selection
    elements.paramCards.forEach(card => {
      card.addEventListener('click', () => {
        elements.paramCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.selectedCategory = card.dataset.category;
        state.selectedCategoryIcon = card.dataset.icon;
      });
    });

    // Form: Start & End Date Inputs
    if (elements.startDateInput) {
      elements.startDateInput.addEventListener('change', () => {
        elements.startDateInput.classList.remove('error');
        const selectedStart = elements.startDateInput.value;
        if (selectedStart && elements.endDateInput) {
          elements.endDateInput.min = selectedStart;
          if (elements.endDateInput.value && elements.endDateInput.value < selectedStart) {
            elements.endDateInput.value = selectedStart;
          }
        }
        evaluateFrequencyAndLockDays();
      });
    }

    if (elements.endDateInput) {
      elements.endDateInput.addEventListener('change', () => {
        elements.endDateInput.classList.remove('error');
      });
    }

    // Form: Frequency Slider
    if (elements.freqSlider) {
      elements.freqSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.selectedFrequency = val;
        elements.freqDisplay.textContent = val === 1 ? '01 DAY/WEEK' : `0${val} DAYS/WEEK`;
        evaluateFrequencyAndLockDays();
      });
    }

    // Form: Day Chips Click Handlers
    elements.dayChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const day = parseInt(chip.dataset.day, 10);
        const startDayIndex = getDayIndexFromDateString(elements.startDateInput ? elements.startDateInput.value : getTodayDateString());

        if (day < startDayIndex) return;

        const idx = state.selectedDays.indexOf(day);
        if (idx > -1) {
          state.selectedDays.splice(idx, 1);
        } else {
          state.selectedDays.push(day);
        }

        hideAlert(elements.scheduleValidationAlert);
        updateDaysUI();
      });
    });

    // Form: Terminal Input typing
    if (elements.habitNameInput) {
      elements.habitNameInput.addEventListener('input', () => {
        elements.habitNameInput.classList.remove('error');
      });
      elements.habitNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleFormSubmission();
        }
      });
    }

    // Form Submit
    if (elements.submitBtn) {
      elements.submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleFormSubmission();
      });
    }

    // Window Resize Handler for Pixel-Perfect Maze Alignment
    window.addEventListener('resize', () => {
      renderArcadeHUD();
    });
  }

  // App Entrypoint
  function init() {
    loadState();
    setupEventListeners();
    renderArcadeHUD();
    renderProtocols();

    // Lightweight 10-second live date transition watcher (EOD 11:59:59 PM -> SOD 12:00:00 AM)
    let lastObservedDateStr = getTodayDateString();
    const liveWatcher = setInterval(() => {
      const curDateStr = getTodayDateString();
      if (curDateStr !== lastObservedDateStr && !state.mockDate) {
        lastObservedDateStr = curDateStr;
        renderArcadeHUD();
        renderProtocols();
      }
    }, 10000);
    if (liveWatcher && typeof liveWatcher.unref === 'function') {
      liveWatcher.unref();
    }
  }

  if (typeof window !== 'undefined') {
    window.__kuroganeRenderProtocols = renderProtocols;
    window.__kuroganeRenderArcadeHUD = renderArcadeHUD;
    window.__kuroganeUpdateScoringAndConsistency = updateScoringAndConsistency;
    window.__kuroganeUseShieldToRecoverYesterday = useShieldToRecoverYesterday;
    window.__kuroganeRemoveShieldYesterday = removeShieldYesterday;
    window.__kuroganeOpenQuestDetailsModal = openQuestDetailsModal;
    window.__kuroganeCloseQuestDetailsModal = closeQuestDetailsModal;
    window.__kuroganeSwitchView = switchView;
    window.__kuroganeHandleFormSubmission = handleFormSubmission;
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
