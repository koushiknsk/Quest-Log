// Kurogane Tactical Assistant - Permanent Test Harness
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectDir = path.resolve(__dirname, '..');
const htmlSource = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
const jsSource = fs.readFileSync(path.join(projectDir, 'app.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(projectDir, 'styles.css'), 'utf8');

function createMockElement(tag = 'div', id = '', classStr = '') {
  const classes = new Set(classStr.split(' ').filter(Boolean));
  const listeners = {};
  const dataset = {};
  const children = [];
  const style = {};

  const el = {
    tagName: tag.toUpperCase(),
    id: id,
    dataset: dataset,
    style: style,
    value: '',
    title: '',
    disabled: false,
    textContent: '',
    _html: '',
    focus() {},
    blur() {},
    parentElement: null,
    children: children,
    classList: {
      _classes: classes,
      add(...c) { c.forEach(x => { if (x) classes.add(x); }); },
      remove(...c) { c.forEach(x => { if (x) classes.delete(x); }); },
      toggle(c, force) {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c);
          else classes.add(c);
        } else if (force) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
      },
      contains(c) { return classes.has(c); },
      toString() { return Array.from(classes).join(' '); }
    },
    get className() {
      return Array.from(classes).join(' ');
    },
    set className(val) {
      classes.clear();
      (val || '').split(' ').filter(Boolean).forEach(c => classes.add(c));
    },
    get textContent() {
      return this._text !== undefined ? this._text : (this._html ? this._html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');
    },
    set textContent(val) {
      this._text = val;
      this._html = val;
      this.children.length = 0;
    },
    get innerHTML() {
      if (this.children && this.children.length > 0) {
        return this.children.map(c => {
          const inner = c.innerHTML || c._html || '';
          return `<${(c.tagName || 'div').toLowerCase()} class="${c.className}" id="${c.id || ''}">${inner}</${(c.tagName || 'div').toLowerCase()}>`;
        }).join('');
      }
      return this._html || '';
    },
    set innerHTML(val) {
      this._html = val;
      this.children.length = 0;
      if (!val) return;
      const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>(.*?)<\/\1>|<([a-zA-Z0-9]+)([^>]*)\/?>/gs;
      let tm;
      while ((tm = tagRegex.exec(val)) !== null) {
        const tagName = tm[1] || tm[4];
        const attrs = tm[2] || tm[5] || '';
        const inner = tm[3] || '';
        const childEl = createMockElement(tagName);
        const classMatch = attrs.match(/class=["']([^"']+)["']/);
        if (classMatch) childEl.className = classMatch[1];
        const idMatch = attrs.match(/id=["']([^"']+)["']/);
        if (idMatch) childEl.id = idMatch[1];
        const valMatch = attrs.match(/value=["']([^"']+)["']/);
        if (valMatch) childEl.value = valMatch[1];
        if (/\bchecked\b/.test(attrs)) childEl.checked = true;
        childEl._text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (inner && inner.includes('<')) {
          childEl.innerHTML = inner;
        } else {
          childEl._html = inner;
        }
        childEl.parentElement = el;
        children.push(childEl);
      }
    },
    appendChild(child) {
      child.parentElement = el;
      children.push(child);
      return child;
    },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      child.parentElement = null;
      return child;
    },
    addEventListener(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener(event, handler) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    },
    setAttribute(attr, val) {
      if (!this._attrs) this._attrs = {};
      this._attrs[attr] = String(val);
    },
    getAttribute(attr) {
      return (this._attrs && this._attrs[attr] !== undefined) ? this._attrs[attr] : null;
    },
    removeAttribute(attr) {
      if (this._attrs) delete this._attrs[attr];
    },
    closest(selector) {
      let cur = el;
      while (cur) {
        if (selector.startsWith('.') && cur.classList && cur.classList.contains(selector.slice(1))) return cur;
        if (selector.startsWith('#') && cur.id === selector.slice(1)) return cur;
        if (cur.tagName && cur.tagName.toLowerCase() === selector.toLowerCase()) return cur;
        cur = cur.parentElement;
      }
      return null;
    },
    click() {
      this.dispatchEvent('click');
    },
    dispatchEvent(eventObj) {
      const type = typeof eventObj === 'string' ? eventObj : eventObj.type;
      const ev = typeof eventObj === 'string' ? { type, stopPropagation: () => {} } : eventObj;
      if (!ev.stopPropagation) ev.stopPropagation = () => {};
      ev.target = ev.target || el;
      if (listeners[type]) {
        listeners[type].forEach(h => h.call(el, ev));
      }
    },
    querySelector(selector) {
      return findInSubtree(el, selector);
    },
    querySelectorAll(selector) {
      const results = [];
      findAllInSubtree(el, selector, results);
      return results;
    }
  };

  return el;
}

function matchesSelector(el, selector) {
  if (!el || !selector) return false;
  let s = selector;
  let requireChecked = false;
  if (s.endsWith(':checked')) {
    requireChecked = true;
    s = s.replace(':checked', '');
  }
  if (requireChecked && !el.checked) return false;

  if (s.startsWith('#')) {
    return el.id === s.slice(1);
  }
  if (s.startsWith('.')) {
    const cls = s.slice(1);
    return el.classList && el.classList.contains(cls);
  }
  if (s.startsWith('[data-filter=')) {
    const m = s.match(/\[data-filter="?([^"\]]+)"?\]/);
    return m && el.dataset && el.dataset.filter === m[1];
  }
  return el.tagName && el.tagName.toLowerCase() === s.toLowerCase();
}

function findInSubtree(root, selector) {
  for (const child of root.children) {
    if (matchesSelector(child, selector)) return child;
    const res = findInSubtree(child, selector);
    if (res) return res;
  }
  return null;
}

function findAllInSubtree(root, selector, results) {
  for (const child of root.children) {
    if (matchesSelector(child, selector)) results.push(child);
    findAllInSubtree(child, selector, results);
  }
}

function setupTestEnvironment(initialLocalStorage = {}) {
  const store = Object.assign({ kurogane_first_login_date: '2026-01-01' }, initialLocalStorage);
  const elementsById = {};

  // Extract all IDs from HTML
  const idRegex = /id=["']([^"']+)["']/g;
  let m;
  while ((m = idRegex.exec(htmlSource)) !== null) {
    elementsById[m[1]] = createMockElement('div', m[1]);
  }

  // Pre-seed known phase-tabs and filter buttons
  const phaseTabDay = elementsById['phase-tab-day'] || createMockElement('button', 'phase-tab-day', 'phase-tab active');
  phaseTabDay.dataset.filter = 'today';
  phaseTabDay.textContent = "TODAY'S QUESTS";

  const phaseTabAll = elementsById['phase-tab-all'] || createMockElement('button', 'phase-tab-all', 'phase-tab');
  phaseTabAll.dataset.filter = 'all';
  phaseTabAll.textContent = 'YEARLY ARCHIVE';

  elementsById['phase-tab-day'] = phaseTabDay;
  elementsById['phase-tab-all'] = phaseTabAll;
  elementsById['protocols-list'] = elementsById['protocols-list-container'];

  const mockWindow = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => { cb(); return 1; },
    cancelAnimationFrame: () => {},
    location: { reload: () => {} },
    alert: () => {},
    confirm: () => true,
    tacticalAudio: {
      playSuccess: () => {},
      playChomp: () => {},
      playSelect: () => {},
      playFruitPickup: () => {},
      playBonusUnlocked: () => {},
      playGhostAlarm: () => {},
      playPurgeAlarm: () => {},
      playWarningSweep: () => {}
    }
  };

  const mockDocument = {
    readyState: 'complete',
    body: createMockElement('body'),
    getElementById: (id) => {
      if (!elementsById[id]) {
        elementsById[id] = createMockElement('div', id);
      }
      return elementsById[id];
    },
    createElement: (tag) => createMockElement(tag),
    querySelectorAll: (selector) => {
      if (selector === '.phase-tab') return [phaseTabDay, phaseTabAll];
      if (selector === '.param-card') return [];
      if (selector === '.day-pill') return [];
      return [];
    },
    querySelector: (selector) => {
      if (selector === '#phase-tab-day') return phaseTabDay;
      if (selector === '#phase-tab-all') return phaseTabAll;
      return null;
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const mockLocalStorage = {
    getItem: (key) => (store[key] !== undefined ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };

  global.window = mockWindow;
  global.document = mockDocument;
  global.localStorage = mockLocalStorage;

  // Run app.js
  eval(jsSource);

  const state = mockWindow.__kuroganeState;

  return {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    elementsById: elementsById,
    state: state,
    htmlSource: htmlSource,
    cssSource: cssSource
  };
}

module.exports = {
  setupTestEnvironment,
  htmlSource,
  jsSource,
  cssSource,
  assert
};
