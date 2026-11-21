/**
 * Carga, saneado y post-procesado de documentos .docx.
 * Mammoth y DOMPurify se cargan como scripts vendorizados antes que este módulo.
 */

import { parseMediaUrl, parseMediaTimeLabel } from './links.js';

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const LARGE_FILE_BYTES = 20 * 1024 * 1024;

const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'a', 'img',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'sup', 'sub',
  'blockquote', 'pre', 'code', 'span', 'div'
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'id', 'class',
  'colspan', 'rowspan', 'headers', 'scope', 'width', 'height', 'start', 'reversed'
];

const FORBID_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'textarea', 'select', 'option', 'link', 'meta', 'base', 'template',
  'svg', 'math', 'video', 'audio', 'source', 'track', 'canvas', 'noscript'
];

const FORBID_ATTR = [
  'style', 'srcset', 'formaction', 'action', 'ping', 'background', 'onerror', 'onload'
];

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const SAFE_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|bmp|avif);base64,/i;
const SAFE_EXTERNAL = new Set(['http:', 'https:']);
const SAFE_HANDLER = new Set(['mailto:', 'tel:']);

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function slugify(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * Valida extensión, MIME y tamaño antes de leer el archivo.
 * Devuelve { ok: true, large } o { ok: false, code, message }.
 */
export function validateDocxFile(file) {
  if (!file || typeof file.name !== 'string') {
    return {
      ok: false,
      code: 'missing',
      message: 'No se recibió ningún archivo. Elegí un documento .docx.'
    };
  }

  const name = file.name.trim();
  const lower = name.toLowerCase();
  const mime = String(file.type || '').toLowerCase();

  if (lower.endsWith('.doc')) {
    return {
      ok: false,
      code: 'doc',
      message:
        'Los archivos .doc antiguos no se pueden abrir. Guardá el documento como .docx y volvé a intentarlo.'
    };
  }

  if (lower.endsWith('.pdf') || mime === 'application/pdf') {
    return {
      ok: false,
      code: 'pdf',
      message:
        'Los PDF no se pueden abrir con WebMili. Elegí el archivo .docx original.'
    };
  }

  if (!lower.endsWith('.docx') && mime !== DOCX_MIME) {
    return {
      ok: false,
      code: 'format',
      message: 'Ese formato no es compatible. WebMili solo abre archivos .docx.'
    };
  }

  if (!Number.isFinite(file.size) || file.size === 0) {
    return {
      ok: false,
      code: 'empty-file',
      message: 'El archivo está vacío. Elegí un documento .docx con contenido.'
    };
  }

  return { ok: true, large: file.size > LARGE_FILE_BYTES };
}

/**
 * Sanea el HTML generado por Mammoth antes de insertarlo en el DOM.
 */
export function sanitizeDocxHtml(html) {
  const purifier = window.DOMPurify;

  if (!purifier || typeof purifier.sanitize !== 'function') {
    throw new Error('DOMPurify no está disponible.');
  }

  return purifier.sanitize(String(html ?? ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
    FORBID_ATTR,
    ADD_DATA_URI_TAGS: ['img'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  });
}

/**
 * Convierte un File .docx en HTML saneado.
 * Mammoth puede rechazar la promesa si el archivo está dañado o protegido.
 */
export async function convertDocx(file) {
  const mammoth = window.mammoth;

  if (!mammoth || typeof mammoth.convertToHtml !== 'function') {
    throw new Error('Mammoth no está disponible.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      externalFileAccess: false,
      includeDefaultStyleMap: true
    }
  );

  return {
    html: sanitizeDocxHtml(result && result.value),
    messages: Array.isArray(result && result.messages) ? result.messages : []
  };
}

function blockLink(link) {
  link.removeAttribute('href');
  link.removeAttribute('target');
  link.removeAttribute('rel');
  link.dataset.blockedLink = 'protocolo no permitido';
  link.classList.add('doc-link--blocked');
  link.setAttribute('title', 'Este enlace se bloqueó por seguridad.');

  const note = document.createElement('span');
  note.className = 'sr-only';
  note.textContent = ' (enlace bloqueado por seguridad)';
  link.append(note);
}

function enhanceExternalLink(link, url) {
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.referrerPolicy = 'strict-origin-when-cross-origin';
  link.classList.add('doc-link--external');

  const note = document.createElement('span');
  note.className = 'sr-only';
  note.textContent = ' (se abre en una pestaña nueva)';
  link.append(note);
}

function enhanceMediaLink(link, media) {
  link.href = media.href;
  link.dataset.media = '';
  link.dataset.provider = media.provider;
  link.dataset.type = media.type;
  link.dataset.id = media.id;
  link.dataset.embed = media.embedUrl;
  link.dataset.height = media.height ? String(media.height) : '';
  link.dataset.start = media.start ? String(media.start) : '';
  link.classList.add('media-link');

  const visibleText = cleanText(link.textContent);
  const label = visibleText || (
    media.provider === 'youtube'
      ? (media.type === 'playlist' ? 'Lista de YouTube' : 'Video de YouTube')
      : `${media.type.charAt(0).toUpperCase()}${media.type.slice(1)} de Spotify`
  );
  const timeLabel = parseMediaTimeLabel(media);

  link.dataset.label = timeLabel ? `${label} · ${timeLabel}` : label;
  link.setAttribute('aria-expanded', 'false');

  const badge = document.createElement('span');
  badge.className = `media-badge media-badge--${media.provider}`;
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = media.provider === 'youtube' ? 'YouTube' : 'Spotify';

  const text = document.createElement('span');
  text.className = 'media-link__text';
  text.textContent = visibleText;

  link.replaceChildren(badge);
  link.append(document.createTextNode(' '));
  link.append(text);
}

function markBrokenAnchor(link) {
  link.dataset.brokenAnchor = '';
  link.classList.add('doc-link--broken');
  link.setAttribute('title', 'El destino de este enlace no está en el documento.');
}

function wrapTables(container) {
  const tables = Array.from(container.querySelectorAll('table'));

  tables.forEach((table, index) => {
    if (table.parentElement && table.parentElement.classList.contains('table-scroll')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');

    const caption = cleanText(table.querySelector('caption')?.textContent);
    wrapper.setAttribute('aria-label', caption || `Tabla ${index + 1}`);

    table.before(wrapper);
    wrapper.append(table);
  });
}

function prepareImages(container) {
  for (const img of Array.from(container.querySelectorAll('img'))) {
    const src = img.getAttribute('src') || '';

    if (!SAFE_IMAGE.test(src)) {
      const alt = cleanText(img.getAttribute('alt'));
      const replacement = document.createElement('span');
      replacement.className = 'doc-image-blocked';
      replacement.setAttribute('role', 'note');
      replacement.textContent = alt
        ? `Imagen no disponible: ${alt}`
        : 'Imagen no disponible';
      img.replaceWith(replacement);
      continue;
    }

    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');

    if (!img.hasAttribute('alt')) {
      img.setAttribute('alt', '');
    }
  }
}

function prepareHeadings(container) {
  const usedIds = new Set();
  const reserved = new Map();

  // Los marcadores de Word conservan su id; las cabeceras se generan después.
  container.querySelectorAll('[id]').forEach((element) => {
    if (!element.matches(HEADINGS) && element.id) {
      reserved.set(element.id, element);
    }
  });

  const headings = [];

  for (const heading of container.querySelectorAll(HEADINGS)) {
    const text = cleanText(heading.textContent);
    let candidate = heading.getAttribute('id')?.trim() || slugify(text) || 'seccion';

    if (!/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(candidate)) {
      candidate = slugify(candidate) || 'seccion';
    }

    // Mammoth duplica el marcador de Word como un <a> vacío. Si la cabecera
    // puede quedarse con ese id, se retira el ancla redundante.
    const bookmark = reserved.get(candidate);

    if (bookmark && bookmark.tagName === 'A' && !cleanText(bookmark.textContent)) {
      bookmark.remove();
      reserved.delete(candidate);
    }

    let id = candidate;
    let suffix = 2;

    while (usedIds.has(id) || reserved.has(id)) {
      id = `${candidate}-${suffix}`;
      suffix += 1;
    }

    heading.id = id;
    heading.setAttribute('tabindex', '-1');
    usedIds.add(id);

    headings.push({
      id,
      text,
      level: Number(heading.tagName.charAt(1))
    });
  }

  return headings;
}

function prepareLinks(container) {
  for (const link of Array.from(container.querySelectorAll('a'))) {
    const raw = (link.getAttribute('href') || '').trim();

    if (!raw) {
      // DOMPurify retira href de protocolos peligrosos y deja el enlace sin destino.
      // Los marcadores de Word son anclas vacías; un enlace con texto se marca como bloqueado.
      if (cleanText(link.textContent)) {
        blockLink(link);
      }

      continue;
    }

    if (raw.startsWith('#')) {
      let targetId = raw.slice(1);

      try {
        targetId = decodeURIComponent(targetId);
      } catch (error) {
        // Si el fragmento no es decodificable, se conserva tal cual.
      }

      const target = document.getElementById(targetId);

      if (!target || !container.contains(target)) {
        markBrokenAnchor(link);
      }

      continue;
    }

    let url;

    try {
      url = new URL(raw, document.baseURI);
    } catch (error) {
      blockLink(link);
      continue;
    }

    if (SAFE_EXTERNAL.has(url.protocol)) {
      const media = parseMediaUrl(url.href);

      if (media) {
        enhanceMediaLink(link, media);
      } else {
        enhanceExternalLink(link, url);
      }
    } else if (SAFE_HANDLER.has(url.protocol)) {
      link.href = url.href;
    } else {
      blockLink(link);
    }
  }
}

/**
 * Post-procesa el HTML ya saneado e insertado en el contenedor.
 * Devuelve los encabezados encontrados para el futuro índice.
 */
export function prepareDocument(container) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError('Se esperaba un contenedor HTML.');
  }

  wrapTables(container);
  prepareImages(container);

  const headings = prepareHeadings(container);
  prepareLinks(container);

  return { headings };
}

export function hasVisibleContent(container) {
  if (!(container instanceof HTMLElement)) {
    return false;
  }

  if (container.querySelector('img, table, hr')) {
    return true;
  }

  return cleanText(container.textContent).length > 0;
}
