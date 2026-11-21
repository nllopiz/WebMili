import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  localStorage: {
    values: new Map(),
    getItem(key) {
      return this.values.has(key) ? this.values.get(key) : null;
    },
    setItem(key, value) {
      this.values.set(key, value);
    }
  }
};

const {
  FONT_DEFAULT,
  FONT_MAX,
  FONT_MIN,
  normalizeFontSize,
  readPrefs,
  writePrefs
} = await import('../js/storage.js');

test('font size normalization stays inside 16–24 px', () => {
  assert.equal(normalizeFontSize(10), FONT_MIN);
  assert.equal(normalizeFontSize(19), 20);
  assert.equal(normalizeFontSize(40), FONT_MAX);
  assert.equal(normalizeFontSize('invalid'), FONT_DEFAULT);
});

test('readPrefs enables remember by default', () => {
  window.localStorage.values.clear();
  assert.equal(readPrefs().remember, true);
});

test('remember preference persists alongside theme and font', () => {
  window.localStorage.values.clear();
  writePrefs({ theme: 'dark', fontSize: 22, remember: false });

  const prefs = readPrefs();
  assert.equal(prefs.theme, 'dark');
  assert.equal(prefs.fontSize, 22);
  assert.equal(prefs.remember, false);
});
