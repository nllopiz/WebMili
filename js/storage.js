/**
 * Preferencias locales de WebMili.
 * Solo se guardan tema y tamaño de texto. El documento nunca se almacena aquí.
 */

const PREFS_KEY = 'webmili:prefs:v1';
const THEMES = new Set(['system', 'light', 'dark']);

export const FONT_MIN = 16;
export const FONT_MAX = 24;
export const FONT_STEP = 2;
export const FONT_DEFAULT = 18;

function readRawPrefs() {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

/**
 * Ajusta un tamaño a la escala 16, 18, 20, 22, 24.
 */
export function normalizeFontSize(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return FONT_DEFAULT;
  }

  const rounded = Math.round((number - FONT_MIN) / FONT_STEP) * FONT_STEP + FONT_MIN;

  return Math.min(FONT_MAX, Math.max(FONT_MIN, rounded));
}

export function readPrefs() {
  const raw = readRawPrefs();

  return {
    theme: THEMES.has(raw.theme) ? raw.theme : 'system',
    fontSize: normalizeFontSize(raw.fontSize),
    remember: typeof raw.remember === 'boolean' ? raw.remember : true
  };
}

/**
 * Guarda las preferencias indicadas y devuelve el estado completo.
 * Si localStorage no está disponible, la app sigue funcionando en memoria.
 */
export function writePrefs(patch) {
  const current = readPrefs();
  const next = {
    theme: THEMES.has(patch.theme) ? patch.theme : current.theme,
    fontSize: normalizeFontSize(patch.fontSize ?? current.fontSize),
    remember: typeof patch.remember === 'boolean' ? patch.remember : current.remember
  };

  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch (error) {
    // Cuota, modo privado o almacenamiento bloqueado: no se interrumpe la lectura.
  }

  return next;
}
