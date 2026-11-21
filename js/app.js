/**
 * WebMili · Lector local de .docx
 * Coordina la carga del archivo, el render, las preferencias y el panel de medios.
 */

import {
  convertDocx,
  DOCX_MIME,
  hasVisibleContent,
  prepareDocument,
  validateDocxFile
} from './docx.js';

import {
  FONT_MAX,
  FONT_MIN,
  FONT_STEP,
  normalizeFontSize,
  readPrefs,
  writePrefs
} from './storage.js';

import {
  deleteLastDocument,
  readLastDocument,
  saveLastDocument
} from './persistence.js';

const landing = document.getElementById('landing');
const landingError = document.getElementById('landing-error');
const landingErrorText = document.getElementById('landing-error-text');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const openFileButton = document.getElementById('open-file');
const emptyChoose = document.getElementById('empty-choose');
const docPane = document.getElementById('doc-pane');
const docSheet = document.getElementById('doc-sheet');
const docContent = document.getElementById('doc-content');
const docEmpty = document.getElementById('doc-empty');
const docInfo = document.getElementById('doc-info');
const docName = document.getElementById('doc-name');
const docMeta = document.getElementById('doc-meta');
const fontControls = document.getElementById('font-controls');
const fontDecrease = document.getElementById('font-decrease');
const fontIncrease = document.getElementById('font-increase');
const tocButton = document.getElementById('toc-button');
const mediaButton = document.getElementById('media-button');
const mediaCount = document.getElementById('media-count');
const tocDialog = document.getElementById('toc-dialog');
const mediaDialog = document.getElementById('media-dialog');
const tocList = document.getElementById('toc-list');
const mediaList = document.getElementById('media-list');
const skipLink = document.getElementById('skip-link');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingDetail = document.getElementById('loading-detail');
const dropOverlay = document.getElementById('drop-overlay');
const toastRegion = document.getElementById('toasts');
const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const liveRegion = document.getElementById('sr-status');

const workspace = document.getElementById('workspace');
const mediaPanel = document.getElementById('media-panel');
const mediaPanelInner = mediaPanel.querySelector('.media-panel__inner');
const mediaBar = mediaPanel.querySelector('.media-panel__bar');
const mediaStage = document.getElementById('media-stage');
const mediaProvider = document.getElementById('media-provider');
const mediaLabel = document.getElementById('media-label');
const mediaExternal = document.getElementById('media-external');
const mediaClose = document.getElementById('media-close');
const mediaNote = document.getElementById('media-note');
const settingsButton = document.getElementById('settings-button');
const settingsDialog = document.getElementById('settings-dialog');
const rememberToggle = document.getElementById('remember-toggle');
const forgetButton = document.getElementById('forget-document');

const desktopQuery = window.matchMedia('(min-width: 900px)');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const TITLE_LANDING = 'WebMili · Lector local de .docx';

const state = {
  view: 'landing',
  loading: false,
  doc: null,
  headings: [],
  media: [],
  prefs: readPrefs()
};

const PROVIDERS = {
  youtube: {
    name: 'YouTube',
    externalLabel: 'Abrir en YouTube',
    frameTitle: 'Reproductor de YouTube',
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  },
  spotify: {
    name: 'Spotify',
    externalLabel: 'Abrir en Spotify',
    frameTitle: 'Reproductor de Spotify',
    allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
  }
};

const TYPE_LABELS = {
  video: 'Video de YouTube',
  playlist: 'Lista de YouTube',
  track: 'Pista de Spotify',
  album: 'Álbum de Spotify',
  episode: 'Episodio de Spotify',
  show: 'Programa de Spotify',
  artist: 'Artista de Spotify'
};

let activeMedia = null;
let activeTrigger = null;
let currentIframe = null;
let isOpen = false;
let loadTimer = 0;
let closeCleanupTimer = 0;
let resizeTimer = 0;
let resizeFrame = 0;
let announceTimer = 0;
let anchorFrame = 0;
let dragDepth = 0;
let scrollSaveTimer = 0;
let restoringDocument = false;

/* ---------- Utilidades ---------- */

function announce(message) {
  window.clearTimeout(announceTimer);
  liveRegion.textContent = '';

  announceTimer = window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 80);
}

function showToast(message, tone = 'info', duration = 6500) {
  const toast = document.createElement('div');
  const text = document.createElement('p');

  toast.className = `toast toast--${tone}`;
  toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  text.textContent = message;
  toast.append(text);
  toastRegion.append(toast);

  // Cada aviso programa su propia salida; uno nuevo no cancela los anteriores.
  window.setTimeout(() => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), motionQuery.matches ? 0 : 240);
  }, duration);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(kb)} KB`;
  }

  return `${new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(kb / 1024)} MB`;
}

function nextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

/* ---------- Vistas ---------- */

function clearLandingError() {
  landingError.hidden = true;
  landingErrorText.textContent = '';
}

function showLandingError(message) {
  landingErrorText.textContent = message;
  landingError.hidden = false;
  landingError.scrollIntoView({ block: 'nearest' });
}

function setView(view, { focus = true } = {}) {
  const reader = view === 'reader';

  state.view = view;
  landing.hidden = reader;
  docPane.hidden = !reader;
  docInfo.hidden = !reader;
  fontControls.hidden = !reader;
  tocButton.hidden = !reader;
  mediaButton.hidden = !reader;
  openFileButton.hidden = !reader;

  // El enlace «saltar» apunta al primer encabezado cuando existe, para que el
  // foco visible quede sobre el título y no sobre toda la superficie de lectura.
  const firstHeading = reader ? state.headings[0] : null;
  skipLink.setAttribute('href', reader ? `#${firstHeading ? firstHeading.id : 'doc-pane'}` : '#landing');
  document.title = reader && state.doc ? `${state.doc.name} · WebMili` : TITLE_LANDING;

  if (!focus) {
    return;
  }

  if (reader) {
    docPane.focus({ preventScroll: true });
  } else {
    landing.focus({ preventScroll: true });
  }
}

function updateDocInfo(doc) {
  docName.textContent = doc.name;
  docName.title = doc.name;
  docMeta.textContent = doc.size > 0
    ? `${formatBytes(doc.size)} · Procesado en este dispositivo`
    : 'Procesado en este dispositivo';
}

function showReader(doc, headings, { restoreScroll = 0 } = {}) {
  state.doc = doc;
  state.headings = headings;
  enhanceMediaLinks();
  updateNavigation();

  docContent.hidden = false;
  docEmpty.hidden = true;
  docSheet.classList.remove('has-empty');
  updateDocInfo(doc);
  setView('reader', { focus: false });
  docPane.scrollTop = 0;
  docPane.focus({ preventScroll: true });

  if (restoreScroll > 0) {
    restoringDocument = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const images = Array.from(docContent.querySelectorAll('img'));
        Promise.all(images.map((image) => image.decode ? image.decode().catch(() => {}) : Promise.resolve()))
          .finally(() => {
            docPane.scrollTop = restoreScroll;
            window.requestAnimationFrame(() => {
              restoringDocument = false;
            });
          });
      });
    });
  }

  announce(`Documento abierto: ${doc.name}.`);
}

function showEmptyDocument(doc) {
  state.doc = doc;
  state.headings = [];
  state.media = [];
  updateNavigation();

  docContent.innerHTML = '';
  docContent.hidden = true;
  docSheet.classList.add('has-empty');
  docEmpty.hidden = false;
  updateDocInfo(doc);
  setView('reader', { focus: false });
  docPane.scrollTop = 0;
  emptyChoose.focus({ preventScroll: true });
  announce('El documento no tiene contenido visible. Puedes elegir otro archivo.');
}

/* ---------- Persistencia local ---------- */

async function persistCurrentDocument(scrollTop = docPane.scrollTop) {
  if (!state.doc || !(state.doc instanceof Blob) || !state.prefs.remember) {
    return;
  }

  try {
    await saveLastDocument({
      blob: state.doc,
      name: state.doc.name,
      size: state.doc.size,
      scrollTop: Math.max(0, Math.round(scrollTop)),
      savedAt: Date.now()
    });
  } catch (error) {
    state.prefs = writePrefs({ ...state.prefs, remember: false });
    if (rememberToggle) {
      rememberToggle.checked = false;
    }
    showToast(
      'No se pudo guardar el documento en este dispositivo. La lectura seguirá funcionando, pero no podrá restaurarse.',
      'warning',
      9000
    );
  }
}

function scheduleScrollSave() {
  if (restoringDocument || !state.prefs.remember || state.view !== 'reader') {
    return;
  }

  window.clearTimeout(scrollSaveTimer);
  scrollSaveTimer = window.setTimeout(() => {
    persistCurrentDocument(docPane.scrollTop);
  }, 300);
}

async function restoreLastDocument() {
  if (!state.prefs.remember) {
    return;
  }

  try {
    const record = await readLastDocument();

    if (!record || !(record.blob instanceof Blob)) {
      return;
    }

    const file = new File([record.blob], record.name || 'Documento recuperado.docx', {
      type: DOCX_MIME,
      lastModified: record.savedAt || Date.now()
    });

    await handleFile(file, { restoring: true, restoreScroll: Number(record.scrollTop) || 0 });
  } catch (error) {
    await deleteLastDocument().catch(() => {});
    showLandingError('No pudimos restaurar el documento guardado. Puede haberse eliminado o estar dañado.');
  }
}

/* ---------- Índice y lista de medios ---------- */

function extractMedia() {
  const unique = new Map();

  docContent.querySelectorAll('.media-link[data-media]').forEach((link) => {
    const media = mediaFromLink(link);

    if (!media) {
      return;
    }

    if (!unique.has(media.key)) {
      unique.set(media.key, media);
    }
  });

  return Array.from(unique.values());
}

function renderToc() {
  tocList.replaceChildren();

  if (!state.headings.length) {
    const empty = document.createElement('p');
    empty.className = 'navigation-empty';
    empty.textContent = 'Este documento no tiene encabezados.';
    tocList.append(empty);
    return;
  }

  for (const heading of state.headings) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'toc-item';
    item.dataset.level = String(heading.level);
    item.dataset.headingId = heading.id;

    const level = document.createElement('span');
    level.className = 'toc-item__level';
    level.textContent = `H${heading.level}`;

    const label = document.createElement('span');
    label.className = 'toc-item__label';
    label.textContent = heading.text || 'Sección sin título';

    item.append(level, label);
    tocList.append(item);
  }
}

function renderMediaList() {
  mediaList.replaceChildren();

  if (!state.media.length) {
    const empty = document.createElement('p');
    empty.className = 'navigation-empty';
    empty.textContent = 'Este documento no contiene enlaces de YouTube o Spotify.';
    mediaList.append(empty);
    return;
  }

  state.media.forEach((media, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'media-list-item';
    item.dataset.mediaIndex = String(index);

    const provider = document.createElement('span');
    provider.className = `media-list-item__provider media-list-item__provider--${media.provider}`;
    provider.textContent = media.provider === 'youtube' ? 'YouTube' : 'Spotify';

    const copy = document.createElement('span');
    copy.className = 'media-list-item__copy';

    const label = document.createElement('span');
    label.className = 'media-list-item__label';
    label.textContent = media.label;

    const type = document.createElement('span');
    type.className = 'media-list-item__type';
    type.textContent = TYPE_LABELS[media.type] || media.type;

    copy.append(label, type);
    item.append(provider, copy);
    mediaList.append(item);
  });
}

function updateNavigation() {
  state.media = extractMedia();
  renderToc();
  renderMediaList();

  mediaCount.textContent = String(state.media.length);
  mediaCount.hidden = state.media.length === 0;
  mediaButton.setAttribute(
    'aria-label',
    `Abrir lista de medios. ${state.media.length} ${state.media.length === 1 ? 'enlace único' : 'enlaces únicos'}`
  );
}

function openNavigationDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
  }
}

function closeNavigationDialog(dialog) {
  if (dialog.open) {
    dialog.close();
  }
}

tocButton.addEventListener('click', () => openNavigationDialog(tocDialog));
mediaButton.addEventListener('click', () => openNavigationDialog(mediaDialog));

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog =
      button.dataset.closeDialog === 'toc-dialog'
        ? tocDialog
        : button.dataset.closeDialog === 'media-dialog'
          ? mediaDialog
          : settingsDialog;
    closeNavigationDialog(dialog);
  });
});

[tocDialog, mediaDialog, settingsDialog].forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeNavigationDialog(dialog);
    }
  });
});

tocList.addEventListener('click', (event) => {
  const item = event.target.closest('.toc-item');

  if (!item) {
    return;
  }

  const target = document.getElementById(item.dataset.headingId);

  if (!target || !docContent.contains(target)) {
    return;
  }

  closeNavigationDialog(tocDialog);
  target.scrollIntoView({
    behavior: motionQuery.matches ? 'auto' : 'smooth',
    block: 'start'
  });
  target.focus({ preventScroll: true });
  announce(`Sección: ${target.textContent.trim().slice(0, 90)}`);
});

mediaList.addEventListener('click', (event) => {
  const item = event.target.closest('.media-list-item');

  if (!item) {
    return;
  }

  const media = state.media[Number(item.dataset.mediaIndex)];

  if (!media) {
    return;
  }

  closeNavigationDialog(mediaDialog);
  openMedia(media, media.trigger);
});

/* ---------- Carga de archivos ---------- */

function showLoading(file) {
  loadingDetail.textContent = `${file.name} · ${formatBytes(file.size)}`;
  loadingOverlay.hidden = false;
}

function hideLoading() {
  loadingOverlay.hidden = true;
  loadingDetail.textContent = '';
}

function chooseFile() {
  fileInput.value = '';
  fileInput.click();
}

function handleFiles(fileList) {
  const files = Array.from(fileList || []);

  if (!files.length) {
    return;
  }

  if (state.loading) {
    showToast('Espera a que termine la conversión actual antes de abrir otro archivo.', 'warning');
    announce('Todavía se está procesando un documento.');
    return;
  }

  if (files.length > 1) {
    showToast(`Se recibieron ${files.length} archivos. Se usó ${files[0].name}.`, 'info', 7500);
  }

  handleFile(files[0]);
}

async function handleFile(file, { restoring = false, restoreScroll = 0 } = {}) {
  if (state.loading) {
    return;
  }

  const validation = validateDocxFile(file);

  if (!validation.ok) {
    if (state.view === 'reader') {
      showToast(validation.message, 'error', 8500);
    } else {
      showLandingError(validation.message);
    }

    announce(validation.message);
    return;
  }

  clearLandingError();

  if (isOpen) {
    closeMedia();
  }

  state.loading = true;
  showLoading(file);

  if (validation.large) {
    showToast(
      `El archivo pesa ${formatBytes(file.size)}. La conversión puede tardar unos segundos.`,
      'warning',
      8500
    );
  }

  try {
    await nextPaint();

    const { html, messages } = await convertDocx(file);

    if (messages.length) {
      console.info('[WebMili] Advertencias de Mammoth:', messages);
    }

    if (!html.trim()) {
      showEmptyDocument(file);
      return;
    }

    docContent.innerHTML = html;

    const { headings } = prepareDocument(docContent);

    if (!hasVisibleContent(docContent)) {
      showEmptyDocument(file);
      return;
    }

    showReader(file, headings, { restoreScroll });

    if (!restoring && state.prefs.remember) {
      await persistCurrentDocument(restoreScroll);
    }
  } catch (error) {
    console.error('[WebMili] No se pudo convertir el documento:', error);

    const message =
      'No pudimos leer el documento. Puede estar dañado, protegido con contraseña o no ser un .docx válido.';

    if (state.view === 'reader' && state.doc) {
      showToast(message, 'error', 9000);
    } else {
      showLandingError(message);
    }

    announce(message);
  } finally {
    hideLoading();
    state.loading = false;
  }
}

/* ---------- Drag & drop ---------- */

function eventHasFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

function showDropOverlay() {
  dropOverlay.hidden = false;
  dropzone.classList.add('is-over');
}

function hideDropOverlay() {
  dragDepth = 0;
  dropOverlay.hidden = true;
  dropzone.classList.remove('is-over');
}

window.addEventListener('dragenter', (event) => {
  if (!eventHasFiles(event)) {
    return;
  }

  event.preventDefault();
  dragDepth += 1;

  if (!state.loading) {
    showDropOverlay();
  }
});

window.addEventListener('dragover', (event) => {
  if (!eventHasFiles(event)) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = state.loading ? 'none' : 'copy';
});

window.addEventListener('dragleave', (event) => {
  if (!eventHasFiles(event)) {
    return;
  }

  dragDepth = Math.max(0, dragDepth - 1);

  if (dragDepth === 0) {
    hideDropOverlay();
  }
});

window.addEventListener('drop', (event) => {
  if (!eventHasFiles(event)) {
    return;
  }

  event.preventDefault();
  hideDropOverlay();

  if (state.loading) {
    showToast('Espera a que termine la conversión actual antes de abrir otro archivo.', 'warning');
    return;
  }

  handleFiles(event.dataTransfer.files);
});

window.addEventListener('dragend', hideDropOverlay);
window.addEventListener('blur', hideDropOverlay);

/* ---------- Enlaces internos del documento ---------- */

docContent.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const link = event.target.closest('a');

  if (!(link instanceof HTMLAnchorElement) || !docContent.contains(link)) {
    return;
  }

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  if (link.hasAttribute('data-blocked-link')) {
    event.preventDefault();
    showToast('Ese enlace se bloqueó por seguridad.', 'warning');
    return;
  }

  const href = link.getAttribute('href');

  if (!href || !href.startsWith('#')) {
    return;
  }

  event.preventDefault();

  let targetId = href.slice(1);

  try {
    targetId = decodeURIComponent(targetId);
  } catch (error) {
    targetId = href.slice(1);
  }

  if (!targetId) {
    docPane.scrollTo({ top: 0, behavior: motionQuery.matches ? 'auto' : 'smooth' });
    return;
  }

  const target = document.getElementById(targetId);

  if (!target || !docContent.contains(target)) {
    showToast('Ese enlace interno no tiene destino en el documento.', 'warning');
    announce('El enlace interno no tiene destino.');
    return;
  }

  target.setAttribute('tabindex', '-1');
  target.scrollIntoView({
    behavior: motionQuery.matches ? 'auto' : 'smooth',
    block: 'start'
  });
  target.focus({ preventScroll: true });
  announce(`Sección: ${target.textContent.trim().slice(0, 90) || targetId}`);
});

/* ---------- Preferencias: tema y tamaño ---------- */

function syncThemeButton() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const nextLabel = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  themeToggle.setAttribute('aria-label', nextLabel);
  themeToggle.title = nextLabel;

  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#181d1a' : '#fbf8f1');
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  syncThemeButton();
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  applyTheme(nextTheme);
  state.prefs = writePrefs({ ...state.prefs, theme: nextTheme });
  announce(nextTheme === 'dark' ? 'Tema oscuro activado.' : 'Tema claro activado.');
}

function applyFontSize(size) {
  const normalized = normalizeFontSize(size);

  state.prefs.fontSize = normalized;
  docSheet.style.setProperty('--reader-size', `${normalized}px`);
  fontDecrease.disabled = normalized <= FONT_MIN;
  fontIncrease.disabled = normalized >= FONT_MAX;
}

function changeFontSize(delta) {
  const next = normalizeFontSize(state.prefs.fontSize + delta);

  if (next === state.prefs.fontSize) {
    announce(
      delta < 0
        ? `El tamaño mínimo es ${FONT_MIN} píxeles.`
        : `El tamaño máximo es ${FONT_MAX} píxeles.`
    );
    return;
  }

  applyFontSize(next);
  state.prefs = writePrefs({ ...state.prefs, fontSize: next });
  announce(`Tamaño del texto: ${next} píxeles.`);
}

darkQuery.addEventListener('change', (event) => {
  if (state.prefs.theme === 'system') {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

/* ---------- Anclaje del scroll ---------- */

function beginScrollAnchor() {
  if (docPane.scrollTop <= 1 || docContent.hidden) {
    return null;
  }

  const paneTop = docPane.getBoundingClientRect().top;
  const blocks = Array.from(docContent.children);

  for (const block of blocks) {
    const rect = block.getBoundingClientRect();

    if (rect.height === 0) {
      continue;
    }

    if (rect.bottom > paneTop + 1) {
      return {
        element: block,
        offset: rect.top - paneTop
      };
    }
  }

  return null;
}

function runScrollAnchor(anchor, duration) {
  const token = ++anchorFrame;

  if (!anchor) {
    return;
  }

  const end = performance.now() + duration;

  const adjust = () => {
    if (!anchor.element.isConnected) {
      return;
    }

    const paneTop = docPane.getBoundingClientRect().top;
    const delta = anchor.element.getBoundingClientRect().top - paneTop - anchor.offset;

    if (Math.abs(delta) > 0.5) {
      docPane.scrollTop += delta;
    }
  };

  const step = () => {
    if (token !== anchorFrame) {
      return;
    }

    adjust();

    if (performance.now() < end) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

/* ---------- Panel de medios (Hito 0 conservado) ---------- */

function mediaFromLink(link) {
  const provider = link.dataset.provider;
  const type = link.dataset.type;
  const id = link.dataset.id;
  const embedUrl = link.dataset.embed;

  if (!PROVIDERS[provider] || !type || !id || !embedUrl) {
    return null;
  }

  return {
    key: `${provider}:${type}:${id}`,
    provider,
    type,
    id,
    label: (link.dataset.label || TYPE_LABELS[type] || 'Contenido multimedia').trim(),
    href: link.href,
    embedUrl,
    height: Number(link.dataset.height) || null,
    trigger: link
  };
}

function isAllowedEmbed(url, provider) {
  try {
    const parsed = new URL(url, document.baseURI);

    if (parsed.protocol !== 'https:') {
      return false;
    }

    if (provider === 'youtube') {
      return (
        parsed.hostname === 'www.youtube-nocookie.com' &&
        parsed.pathname.startsWith('/embed/')
      );
    }

    if (provider === 'spotify') {
      return parsed.hostname === 'open.spotify.com' && parsed.pathname.startsWith('/embed/');
    }

    return false;
  } catch (error) {
    return false;
  }
}

function safeExternalUrl(url) {
  try {
    const parsed = new URL(url, document.baseURI);

    if (parsed.protocol !== 'https:') {
      return null;
    }

    const allowedHosts = new Set([
      'www.youtube.com',
      'youtube.com',
      'm.youtube.com',
      'music.youtube.com',
      'youtu.be',
      'open.spotify.com'
    ]);

    return allowedHosts.has(parsed.hostname) ? parsed.href : null;
  } catch (error) {
    return null;
  }
}

function transitionDuration(opening) {
  if (motionQuery.matches) {
    return 0;
  }

  return opening ? 360 : 320;
}

function stageHeightFor(media, availableWidth) {
  if (media.provider === 'youtube') {
    return Math.round((availableWidth * 9) / 16);
  }

  return media.height || 352;
}

function updateMediaSize() {
  if (!activeMedia) {
    return;
  }

  const width = mediaPanelInner.getBoundingClientRect().width;

  if (!width) {
    return;
  }

  const barHeight = mediaBar.getBoundingClientRect().height;
  const noteHeight = mediaNote.hidden ? 0 : mediaNote.getBoundingClientRect().height;
  const isDesktop = desktopQuery.matches;

  let stageHeight = stageHeightFor(activeMedia, width);

  if (isDesktop) {
    const maxStage = Math.max(160, window.innerHeight - barHeight - 36);
    stageHeight = Math.min(stageHeight, maxStage);
    mediaPanel.style.setProperty('--stage-h', `${Math.round(stageHeight)}px`);
    mediaPanel.style.removeProperty('--media-h');
    return;
  }

  const maxPanelHeight = Math.round(workspace.clientHeight * 0.55);
  const availableForStage = Math.max(80, maxPanelHeight - barHeight - noteHeight);

  stageHeight = Math.min(stageHeight, availableForStage);

  const panelHeight = Math.min(barHeight + stageHeight + noteHeight, maxPanelHeight);

  mediaPanel.style.setProperty('--stage-h', `${Math.round(stageHeight)}px`);
  mediaPanel.style.setProperty('--media-h', `${Math.round(panelHeight)}px`);
}

function destroyIframe() {
  window.clearTimeout(loadTimer);
  loadTimer = 0;

  if (currentIframe) {
    currentIframe.remove();
    currentIframe = null;
  }

  mediaStage.classList.remove('is-ready');
  mediaStage.setAttribute('aria-busy', 'false');
}

function createIframe(media) {
  const provider = PROVIDERS[media.provider];
  const iframe = document.createElement('iframe');

  iframe.src = media.embedUrl;
  iframe.title = `${provider.frameTitle}: ${media.label}`;
  iframe.allow = provider.allow;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.loading = 'eager';

  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');

  mediaStage.classList.remove('is-ready');
  mediaStage.setAttribute('aria-busy', 'true');

  iframe.addEventListener(
    'load',
    () => {
      if (iframe !== currentIframe) {
        return;
      }

      window.clearTimeout(loadTimer);
      loadTimer = 0;
      iframe.removeAttribute('tabindex');
      iframe.removeAttribute('aria-hidden');
      mediaStage.classList.add('is-ready');
      mediaStage.setAttribute('aria-busy', 'false');
    },
    { once: true }
  );

  currentIframe = iframe;
  mediaStage.append(iframe);

  loadTimer = window.setTimeout(() => {
    if (iframe !== currentIframe) {
      return;
    }

    mediaStage.setAttribute('aria-busy', 'false');
  }, 12000);
}

function clearActiveLink() {
  document.querySelectorAll('.media-link[data-media]').forEach((link) => {
    link.classList.remove('is-active');
    link.setAttribute('aria-expanded', 'false');
  });
}

function enhanceMediaLinks() {
  docContent.querySelectorAll('.media-link[data-media]').forEach((link) => {
    const media = mediaFromLink(link);

    if (!media) {
      return;
    }

    const provider = PROVIDERS[media.provider];
    const visibleText = link.textContent.replace(/\s+/g, ' ').trim();

    link.setAttribute(
      'aria-label',
      `${visibleText}. Abrir en el reproductor de ${provider.name}.`
    );
  });
}

function openMedia(media, trigger) {
  if (!media) {
    return;
  }

  if (!isAllowedEmbed(media.embedUrl, media.provider)) {
    console.error('WebMili: se rechazó una URL de embed no permitida.', media.embedUrl);
    announce('No se pudo abrir el reproductor.');
    return;
  }

  if (isOpen && activeMedia && activeMedia.key === media.key) {
    mediaClose.focus({ preventScroll: true });
    announce(`El reproductor de ${PROVIDERS[media.provider].name} ya está abierto.`);
    return;
  }

  window.clearTimeout(closeCleanupTimer);

  const wasOpen = isOpen;
  const anchor = beginScrollAnchor();
  const provider = PROVIDERS[media.provider];

  mediaPanel.classList.remove('is-closing');
  destroyIframe();
  clearActiveLink();

  activeMedia = media;
  activeTrigger = trigger;
  isOpen = true;

  mediaProvider.dataset.provider = media.provider;
  mediaProvider.textContent = provider.name;
  mediaLabel.textContent = media.label;
  mediaLabel.title = media.label;

  const externalUrl = safeExternalUrl(media.href);

  if (externalUrl) {
    mediaExternal.hidden = false;
    mediaExternal.href = externalUrl;
    mediaExternal.querySelector('span').textContent = provider.externalLabel;
    mediaExternal.setAttribute('aria-label', `${provider.externalLabel}: ${media.label}`);
  } else {
    mediaExternal.hidden = true;
    mediaExternal.removeAttribute('href');
  }

  mediaNote.hidden = navigator.onLine;
  mediaNote.textContent = navigator.onLine
    ? ''
    : 'Sin conexión. El documento sigue disponible, pero YouTube o Spotify no se pueden cargar.';

  mediaStage.dataset.provider = media.provider;

  mediaPanel.inert = false;
  mediaPanel.removeAttribute('inert');
  mediaPanel.removeAttribute('aria-hidden');

  trigger.classList.add('is-active');
  trigger.setAttribute('aria-expanded', 'true');

  updateMediaSize();
  createIframe(media);

  if (!wasOpen) {
    mediaPanel.classList.remove('is-open');
    void mediaPanel.offsetWidth;
  }

  mediaPanel.classList.add('is-open');

  runScrollAnchor(anchor, transitionDuration(!wasOpen));

  announce(`Reproductor de ${provider.name} abierto.`);

  window.requestAnimationFrame(() => {
    mediaClose.focus({ preventScroll: true });
  });
}

function closeMedia() {
  if (!isOpen) {
    return;
  }

  const anchor = beginScrollAnchor();
  const focusTarget = activeTrigger;

  isOpen = false;

  mediaPanel.classList.add('is-closing');
  destroyIframe();
  mediaPanel.classList.remove('is-open');
  mediaPanel.setAttribute('inert', '');
  mediaPanel.setAttribute('aria-hidden', 'true');

  clearActiveLink();

  activeMedia = null;
  activeTrigger = null;

  runScrollAnchor(anchor, transitionDuration(false));

  const fallback = docContent.querySelector('.media-link[data-media]');

  if (focusTarget && focusTarget.isConnected) {
    focusTarget.focus({ preventScroll: true });
  } else if (fallback) {
    fallback.focus({ preventScroll: true });
  } else {
    docPane.focus({ preventScroll: true });
  }

  announce('Reproductor cerrado. Vuelves al documento.');

  window.clearTimeout(closeCleanupTimer);
  closeCleanupTimer = window.setTimeout(() => {
    if (isOpen) {
      return;
    }

    mediaPanel.classList.remove('is-closing');
    mediaLabel.textContent = '';
    mediaLabel.removeAttribute('title');
    mediaExternal.removeAttribute('href');
    mediaNote.hidden = true;
    mediaNote.textContent = '';
    mediaStage.removeAttribute('data-provider');
    mediaStage.classList.remove('is-ready');
    mediaStage.setAttribute('aria-busy', 'false');
  }, motionQuery.matches ? 0 : 320);
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const link = event.target.closest('.media-link[data-media]');

  if (!link) {
    return;
  }

  if (event.defaultPrevented || event.button !== 0) {
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const media = mediaFromLink(link);

  if (!media) {
    return;
  }

  event.preventDefault();
  openMedia(media, link);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || event.defaultPrevented || !isOpen) {
    return;
  }

  event.preventDefault();
  closeMedia();
});

mediaClose.addEventListener('click', closeMedia);

function handleResize() {
  if (!isOpen || resizeFrame) {
    return;
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0;

    if (!isOpen) {
      return;
    }

    const anchor = beginScrollAnchor();

    mediaPanel.classList.add('is-resizing');
    updateMediaSize();
    runScrollAnchor(anchor, 0);

    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      mediaPanel.classList.remove('is-resizing');
    }, 180);
  });
}

window.addEventListener('resize', handleResize, { passive: true });

function updateConnectionNote() {
  if (!isOpen) {
    return;
  }

  const offline = !navigator.onLine;

  mediaNote.hidden = !offline;
  mediaNote.textContent = offline
    ? 'Sin conexión. El documento sigue disponible, pero YouTube o Spotify no se pueden cargar.'
    : '';

  updateMediaSize();
}

window.addEventListener('online', updateConnectionNote);
window.addEventListener('offline', updateConnectionNote);

/* ---------- Eventos de la interfaz ---------- */

rememberToggle.checked = state.prefs.remember;

settingsButton.addEventListener('click', () => {
  rememberToggle.checked = state.prefs.remember;
  openNavigationDialog(settingsDialog);
});

rememberToggle.addEventListener('change', async () => {
  state.prefs = writePrefs({ ...state.prefs, remember: rememberToggle.checked });

  if (!rememberToggle.checked) {
    try {
      await deleteLastDocument();
      showToast('El documento guardado se olvidó.', 'info');
      announce('Recordar en este dispositivo desactivado.');
    } catch (error) {
      showToast('No se pudo borrar el documento guardado.', 'error');
    }
  } else {
    await persistCurrentDocument(docPane.scrollTop);
    announce('Recordar en este dispositivo activado.');
  }
});

forgetButton.addEventListener('click', async () => {
  try {
    await deleteLastDocument();
  } catch (error) {
    showToast('No se pudo borrar el documento guardado.', 'error');
  }

  if (isOpen) {
    closeMedia();
  }

  state.doc = null;
  state.headings = [];
  state.media = [];
  docContent.innerHTML = '';
  docPane.scrollTop = 0;
  closeNavigationDialog(settingsDialog);
  clearLandingError();
  setView('landing');
  showToast('Documento olvidado.', 'info');
  announce('Documento olvidado. Has vuelto a la pantalla inicial.');
});

docPane.addEventListener('scroll', scheduleScrollSave, { passive: true });

window.addEventListener('beforeunload', () => {
  if (state.prefs.remember && state.view === 'reader' && state.doc) {
    persistCurrentDocument(docPane.scrollTop);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && state.prefs.remember && state.view === 'reader') {
    persistCurrentDocument(docPane.scrollTop);
  }
});

dropzone.addEventListener('click', chooseFile);
openFileButton.addEventListener('click', chooseFile);
emptyChoose.addEventListener('click', chooseFile);

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files || []);
  fileInput.value = '';

  if (files.length) {
    handleFiles(files);
  }
});

themeToggle.addEventListener('click', toggleTheme);
fontDecrease.addEventListener('click', () => changeFontSize(-FONT_STEP));
fontIncrease.addEventListener('click', () => changeFontSize(FONT_STEP));

/* ---------- Arranque ---------- */

applyFontSize(state.prefs.fontSize);
syncThemeButton();
setView('landing', { focus: false });
enhanceMediaLinks();
restoreLastDocument();

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transitions');
  });
});
