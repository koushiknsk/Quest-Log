# Kurogane Personal Assistant - Business Requirements Document (BRD)

---

## 📌 Architectural Overview & Roadmap
* **Target Platforms**: Web App, PWA (Mobile iOS/Android), Desktop App (Electron/Tauri).
* **Core Philosophy**: Tactical Cyberpunk HUD meets Retro Gamification. High performance, zero latency, local-first data integrity.
* **Modular Expansions (Roadmap)**:
  * **V1.0**: Tactical Protocol HUD & Initialization (Completed).
  * **V2.0**: Pac-Man Retro-Arcade Dashboard, Lifetime Tracking & Shield Engine (Current).
  * **V3.0+**: Integrated Tactical Finance & Expense Tracker (Future Backlog).
  * **App Conversion TODO**: Re-introduce **1UP High Score** display into mobile/desktop app UI layout.

---

## 🚀 Version 1.0 (V1) - Tactical Protocol HUD [COMPLETED]

### 1. Page: Pilot Dashboard (`#view-dashboard`)
* **HUD Header**:
  * Real-time military clock (`HH:MM:SS`).
  * Sound effects toggle button (Audio Engine ON/OFF).
  * Reset demo data trigger.
* **Telemetry & Radar (Legacy)**:
  * Radial SVG "Sync Level" ring reflecting overall completion percentage.
  * Pilot Level readout (e.g., `LVL.42`).
  * Telemetry grid cards: Integrity (Streak in days) & Capacity (Completed vs Total directives).
* **Directive Management**:
  * Phase filter tabs: `ALL DIRECTIVES`, `PENDING`, `COMPLETED`.
  * Directive card stream: Checkbox toggle to mark completed/pending with instant visual state update.
  * Inline directive deletion with animated sound feedback.
  * Directives dynamic counter.
  * "INITIALIZE" quick-action button navigating to the Protocol Creation page.

### 2. Page: Protocol Initialization (`#view-init`)
* **Header & Navigation**:
  * Return / Back button to Dashboard with dirty-state safety.
  * Tactical screen title: `NEW PROTOCOL`.
* **Tactical Form Fields**:
  * **Protocol Name**: Terminal-styled text input with dot indicators (max 36 chars).
  * **Category Selector**: 4 selectable cards (Hydration, Fitness, Cardio, Deep Focus) with unique icons.
  * **Frequency Range Slider**: Interactive range slider (1 to 7 days per week) with dynamic number display.
  * **Day Selector Matrix**: 7 toggleable chips (SUN through SAT) with count matching frequency.
  * **Frequency & Schedule Validation**: Real-time validation warning if selected days do not match target frequency.
  * **Date Pickers**: Tactical Start Date (defaults to today) and optional End Date with constraint checking.
  * **Tactical Directives / Notes**: Multi-line terminal textarea for action protocols.
* **Form Action**:
  * "DEPLOY DIRECTIVE" button with dynamic state, validation guards, and audio feedback.

### 3. System Services (V1)
* **Audio Engine (`audio.js`)**: Procedural Web Audio API sound synthesizer (Clicks, Beeps, Success chords, Execute sweeps).
* **Storage (`app.js`)**: `localStorage` state management with automatic persistence.
* **Local Web Server (`server.js`)**: Standalone Node.js HTTP server.

---

## 🕹️ Version 2.0 (V2) - Pac-Man Arcade Dashboard & Lifetime Data [CURRENT]

### 1. Page: Pac-Man Arcade Dashboard (`#view-dashboard`)
* **Top HUD Header**:
  * Cleaned up cockpit telemetry without clock.
  * Right Actions: `[ 📖 Rule Book ]`, `[ 🐞 Dev Testing Sandbox ]`, `[ 🔊 Sound FX Toggle ]`, `[ 📊 Export Data (.CSV) ]`.
* **Arcade Scoreboard (Unified Pink Bezels & Labels, Clean White Values)**:
  * Equal 4-column grid (`repeat(4, 1fr)`) with dark CRT gradient bezels and matching heights:
  * **SCORE**: Arcade Pink (`#FFB8DE`) header & top bezel. Value in crisp white (`000000`).
  * **SHIELDS**: Arcade Pink (`#FFB8DE`) header & top bezel. 3 visual shield icon slots in pure white (`🛡️ 🛡️ 🛡️`) (Max 3). Breathes with a subtle ambient ready pulse when $\ge 1$ shield is available.
  * **REWARD**: Arcade Pink (`#FFB8DE`) header & top bezel. Value in crisp white (`+0 PTS`).
  * **STREAK**: Arcade Pink (`#FFB8DE`) header & top bezel. Value in crisp white (`0 DAYS`).
* **Month Navigation & Dynamic Date Header**:
  * `< PREV`, `MONTH YEAR`, `NEXT >`, `TODAY` navigation buttons in maze header.
  * **Dynamic Day Counter**: Header displays current date out of total days in month (e.g., `02/30 DAYS` on Day 2, `03/30 DAYS` on Day 3).
* **Pac-Man Monthly Maze Track**:
  * Visual glowing neon maze progress bar representing the selected month.
  * **Flat Classic Pac-Man & Relative Positioning**: Pure flat yellow `#FFE600` arcade profile with open mouth facing pellets.
    * **Always positioned on the active day's dot**: If today is Wednesday, earlier days are behind him, and Wednesday's dot is at his mouth.
    * **Completion Advance**: When today's directives are 100% completed, Pac-Man moves forward to tomorrow's dot.
  * **Dynamic Month-Weeks & Dots Structure**:
    * Dynamically calculated based on calendar weeks culminating on **Sunday**.
    * **4 Big Dots** (Sunday Week Culminations) + **Small Dots** for regular days (Mon–Sat).
  * **Dot Saturation Visual System**:
    * **Muted / Low Contrast (`.dot-muted`)**: Applied to all future dates and untouched days.
    * **Partial Saturation (`.dot-partial`)**: Vibrant orange (`#FF9500`, 100% saturation) for partially finished days.
    * **Full Saturation (`.dot-complete`)**: 100% vibrant arcade gold (`#FFE600`) for fully completed days.
    * **Big Sunday Milestone Dots**: Saturated as vibrant orange (`.big-dot.dot-partial`, 12px, orange shadow) when partially completed, and golden yellow (`.big-dot.dot-complete`, 12px, gold shadow) when 100% completed.
    * **Shield Icon (`.shield-dot`)**: Clean non-glowing white shield icon replacing the pellet on days protected by a 1UP Shield (adaptive size: 16px big shield on Sunday, 11px on weekdays).
  * **Fruit Milestone Checkpoints Row (Full Saturation Telemetry)**:
    * Fruit badges (🍒, 🍓, 🍊, 🍈, 🍇, 🏆) dynamically align to calendar weeks:
    * **Current Week In-Progress**: Cyan-blue (`#5CADFF`) with **100% full saturation** (`opacity: 1`, `filter: grayscale(0)`).
    * **Fully Completed Week**: Vibrant gold (`#FFE600`) with **100% full saturation**.
    * **Partially Completed Week**: Orange (`#FF9500`) with **100% full saturation**.
    * **Future Unreached Weeks**: Muted grey (`opacity: 0.35`, `grayscale(0.8)`).
    * **Week Selection**: Clean yellow bottom underline indicator (`2px solid #FFE600`) without yellow glow.
  * **Tactical Scoring & Shield Engine**:
    * **Rule A: Daily Score (Max 100 PTS/day) & Active Streak**:
      * `Daily Score = (Completed Protocols / Scheduled Protocols) × 100 PTS`.
      * If 0 protocols are scheduled for a date (rest day), it is considered 100% completed at EOD.
      * Calculated and finalized strictly at End of Day (**11:59:59 PM**).
      * Start of Day (**12:00:00 AM**) initializes clean protocol states and checks early shield warnings.
      * During the active day (Day N in progress), the active streak from previous days is preserved and does not reset to 0.
    * **Rule B: 1UP Shields (Max 3) & Non-Destructive Recovery**:
      * Awarded after **2 consecutive organic perfect weeks (14 days with 100 PTS without shield usage)**.
      * **Inventory Visual Display**: Up to 3 shield slots (`🛡️ 🛡️ 🛡️`).
      * **No Idle Glow**: Active earned shields have **no glow** under normal conditions (`filter: none`).
      * **Actionable Static Warning Glow**: When Day N was partial or a no-show, available shields display a **static neon glow** on Day N+1 (`filter: drop-shadow(...)`). Shields **never animate with dynamic pulsing/breathing** in any case.
      * **Day N+1 Muted Inventory State**: When a shield is deployed on Day N+1, it remains visible in the inventory slot but **muted with color** (`applied-today`, opacity 0.45, `#7A8099`).
      * **Day N+2 Removal**: On Day N+2, the consumed shield is permanently removed from the inventory slot (`muted`, unearned outline).
      * **1-Day Miss Rule**: A shield can ONLY be used if exactly 1 day was missed in that week.
      * **Non-Destructive Application**: Applying a shield does NOT alter or fake raw protocol completion history. Day N keeps its actual raw score points, but the streak and consistency multiplier are protected from resetting to 0.
      * **Dynamic Select/Deselect Toggle on Day N+1**: Throughout Day N+1, the user can apply or deselect (refund +1) the shield as many times as desired. Shield state permanently locks in at 11:59:59 PM of Day N+1.
      * **Single Shield Per Week Limit**: Maximum 1 shield can be used in any single calendar week. Calendar weeks are strictly scoped with month isolation via `YYYY-MM-WXX` (e.g. `2026-09-W03` vs `2026-10-W04`), preventing cross-month week key collisions.
      * **Shield Generation Exclusion**: Any week where a shield was utilized is **excluded** from counting towards the 14-day streak for generating new shields.
      * **2 Consecutive Missed Days**: If 2 consecutive days are missed, shields cannot restore the consistency; streak breaks and consistency multiplier `x` resets to 0.
    * **Rule C: Weekly Consistency Compounding Bonus (`x`)**:
      * Evaluated at the end of each calendar week (on **Saturday**).
      * Week 1 100% Perfect = `+10 PTS` bonus (`x = 10`).
      * Week 2 100% Perfect = `+15 PTS` bonus (`x = 15`).
      * Week 3 100% Perfect = `+20 PTS` bonus (`x = 20`).
      * Compounding by `+5 PTS` each consecutive perfect week.
      * **Shielded Week**: Streak preserved, `x` multiplier maintained (does not reset to 0), but `x` bonus points are not added for that shielded week.
      * **Unshielded Break (2+ days missed)**: `x` resets to 0.
    * **Quests Tabs, Header Labels & Navigation Focus**:
      * **`TODAY'S QUESTS`**: Active default tab showing directives scheduled for today. Fully interactive.
        * **Streamlined Card Layout**: Strictly formatted as `[Symbol] NAME` and `CATEGORY` alongside the completion checkbox tick. All dates, scheduled day text, and extra bullet symbols are removed from the card surface.
      * **Inspected Day (`${dayNum}${ord} ${Month} Quests`)**: When clicking a specific dot in the progress bar, the tab displays with date, ordinal, and month (e.g., **`16th Oct Quests`**, **`4th Sep Quests`**). Read-only for past/future days with `PAST DAY` / `PARTIAL` / `MISSED` visual badges.
      * **`YEARLY ARCHIVE (YYYY)`**: Comprehensive archive of all unique quests across the year.
        * **Streamlined Card Layout**: Strictly formatted as `[Symbol] NAME` and meta sub-line `CATEGORY • {frequency}D/WK` (e.g. `CARDIO • 4D/WK`). Surface date displays and `0 DAYS CLEARED` badges are removed. Includes retire/delete button `✕`.
        * **Read-Only Quest Specification Modal (`#quest-details-modal`)**: Clicking any card in the Yearly Archive opens a tactical read-only specification popup modal displaying: Hero icon, Quest Name, Category Pill, Frequency Pill, Yearly Cleared Count Pill, Scheduled Days, Start/End Timeline, Directive Notes briefing, and Close buttons.
      * **Context-Aware `NEW QUEST` Form**:
        * **When accessed from `TODAY'S QUESTS`**: The form hides Timeline/Date inputs (`#form-timeline-group`), Frequency slider, and Days-of-Week chips (`#form-frequency-group`). User only inputs Quest Name, Category, and optional Notes; submitting automatically deploys an active quest for today with `startDate = today`, `endDate = today`, `frequency = 1`, and `selectedDays = [todayDayIndex]`.
        * **When accessed from `YEARLY ARCHIVE`**: The form displays full configuration options (Start/End dates, Frequency slider, and Days-of-Week matrix).
      * **Pre-Login Boundary Protection on Progress Bar**:
        * System tracks user's `firstLoginDate` (the date of first initialization).
        * Progress bar renders all pellets in the calendar month, but pellets prior to `firstLoginDate` are marked with `.pre-login-disabled`, muted opacity (`0.25`), and `cursor: not-allowed`.
        * Clicking a pre-login dot triggers a warning notice and prevents inspection.
        * Inspecting any date prior to `firstLoginDate` renders a clean `// PRE-INITIALIZATION PERIOD` notice with all actions disabled and no quest cards.
      * **Streak Protection Alert Banner & Dynamic Labels**:
        * **Streak At Risk (1-Day Miss Detected)**: Title displays **`STREAK IS AT RISK // 1-DAY MISS DETECTED`**. Action button displays **`PROTECT`** with shield icon (`🛡️`).
        * **Streak Protected (Shield Active)**: Title displays **`STREAK PROTECTED AND SHIELD ACTIVATED`**. Action button displays **`DEACTIVATE SHIELD`** with `restart_alt` icon (`↺`).
      * **Month Header Navigation Transformation (`RETURN TO TODAY`)**:
        * Beside the month title, `#today-month-btn` dynamically toggles:
          * Default label: **`TODAY`** when focused on current live today.
          * Away label: **`RETURN TO TODAY`** with green accent styling (`.return-mode`) when inspecting any other date, week drill-down, or navigating other months.
          * Clicking it immediately clears inspection/drill-down, focuses live today, and reverts the button label to `TODAY`.
        * The duplicate/redundant `✕ RESET TO TODAY` button inside the quest list banner has been completely removed.
  * **Dynamic Multi-Month Data Export (`#export-modal-backdrop`)**:
    * Located in header actions as `[ 📊 ]`.
    * Opens an interactive modal prompting the user to select which specific calendar months they want exported (with quick buttons: SELECT ALL, CURRENT MONTH, DESELECT ALL).
    * Dynamically compiles and downloads a structured CSV file for all selected months.

### 2. Pac-Man Procedural Audio Engine (`audio.js`)
* **8-bit Authentic Synthesizers**:
  * `playPacmanChomp()`: Classic retro "Waka-Waka" dual-pitch square wave on protocol toggle.
  * `playFruitPickup()`: Bright 8-bit arcade chime on daily goal completion and data export.
  * `playStageClear()`: Retro fanfare arpeggio on monthly target completion.

### 3. Developer Testing Sandbox (`#dev-sandbox-panel`)
* **Fast Scoring & Streak Simulators**:
  * **`FULLY COMPLETED DAY`**: Automatically marks all protocols for the active day completed, awards 100% score, advances streak, updates UI, and advances Pac-Man.
  * **`PARTIALLY COMPLETED DAY`**: Automatically marks a random subset of protocols for the active day (leaving at least one incomplete), updates score/streak, updates dot saturation to amber.
  * **`FULLY COMPLETED WEEK`**: Automatically marks all scheduled protocols for every day in the current week as 100% completed, updates UI, and moves Pac-Man forward.
  * **`PARTIALLY COMPLETED WEEK`**: Simulates a mix of full and partial days across the week (leaving at least one protocol incomplete), updates weekly status and dot saturation.
  * **`SIM MISSED YESTERDAY (ALERT)`**: Simulates missing yesterday to test interactive recovery prompt and shield application.
  * **`LOCK IN 11:59 PM SCORE`**: Triggers daily midnight finalizer.
  * **`PURGE HISTORY`**: Clears all simulated history and restores live device time.
* **Time Machine**: Allows jumping `-1D`, `+1D`, `SUN`, or picking custom virtual date.

### 4. Progress Bar & Gamification Enhancements [TODO - FUTURE SPRINT]
1. **Shield Dot Telemetry**:
   * When a shield is used to recover a missed day, that specific day's dot in the progress bar stream should visually display a **Shield icon (`🛡️`)** instead of a regular dot.
2. **Weekly Perfection Sunday Cherry Reward**:
   * When a pilot completes 100% of all scheduled directives across all days of an entire week, the following Sunday's milestone dot should render the **Cherries (`🍒`)** milestone reward instead of the standard big dot. (This occurs only if all days present in that week were 100% completed).

---

## 🔮 Version 3.0 (V3) - Future Expansions [BACKLOG]

### 1. Page: Tactical Finance & Expense Tracker (`#view-finance`)
* **Income & Expense Directives**:
  * Monthly budget allocation and expense categorization.
  * Gamified savings milestones (e.g. Coin Chests, Cash Power-Ups).
  * Weekly spending burn-rate telemetry.
  * Multi-currency support.
* **Unified HUD Integration**:
  * Quick-switch navigation tab between `PROTOCOLS` and `FINANCES`.
  * Combined Lifetime Export (Protocols + Financial ledger).
