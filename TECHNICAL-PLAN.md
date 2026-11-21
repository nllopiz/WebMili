# WebMili — Plan técnico

> **Estado:** Hito 0 implementado y validado; plan vivo para los hitos 1–4.
> **Última actualización:** 2026-11-21
> **Requisitos:** [`REQUIREMENTS.md`](REQUIREMENTS.md)
> **Memoria:** [`MEMORY.md`](MEMORY.md)

---

## 1. Resumen

WebMili será una aplicación estática de una sola página, sin backend ni paso de build. El navegador carga el `.docx` elegido por la persona, lo convierte a HTML semántico con Mammoth, lo sanea con DOMPurify y lo muestra en un lector propio. Los enlaces de YouTube/Spotify se interceptan y se reproducen en un panel integrado mediante `iframe`.

La prioridad técnica es que la composición y la animación se sientan estables, que el documento nunca salga del dispositivo y que el cierre del medio detenga realmente la reproducción.

> **Implementación actual (Hito 1):** `index.html`, `css/app.css`, `js/app.js`, `js/docx.js`, `js/storage.js` y `js/theme-init.js`. `index.html` carga Mammoth y DOMPurify desde `vendor/`; `docx.js` valida, convierte y sanea el documento, y `app.js` conserva el ciclo del panel, el layout, el tema y el scroll. La separación de `links.js`, `media.js` y `ui.js` sigue pendiente para los Hitos 2 y 3.

---

## 2. Restricciones y principios técnicos

- Sin backend, sin base de datos, sin autenticación.
- Sin framework y sin build. HTML, CSS y JavaScript moderno con módulos ES.
- Librerías vendorizadas; sin CDNs ni fuentes externas en runtime.
- Un solo documento activo a la vez.
- Un solo medio activo a la vez.
- El `iframe` se crea al abrir el medio y se destruye al cerrarlo.
- El HTML del `.docx` se considera no confiable y se sanea siempre.
- La app debe funcionar con teclado y con movimiento reducido.
- No se promete ordenar ventanas del sistema ni reproducción garantizada de terceros.

---

## 3. Stack y dependencias

### Runtime

- HTML5.
- CSS3: custom properties, flexbox, `clamp()`, `dvh`, `prefers-reduced-motion`, `<dialog>`.
- JavaScript ES2020+ con módulos ES.
- APIs del navegador: File API, Blob, IndexedDB, localStorage, `<dialog>`, `matchMedia`, `navigator.onLine`, `navigator.storage`.

### Librerías vendorizadas

| Librería | Uso | Formato |
|---|---|---|
| Mammoth.js (`mammoth.browser.min.js`) | Convertir `.docx` a HTML semántico | UMD; expone `window.mammoth` |
| DOMPurify (`purify.min.js`) | Sanear el HTML generado | UMD; expone `window.DOMPurify` |

Mammoth incluye sus dependencias (incluido JSZip) en el build de navegador. No se necesita instalar nada en runtime. Las librerías y sus licencias están en `vendor/` y `index.html` las carga antes de `js/app.js`.

### Herramientas de desarrollo

- Cualquier servidor estático local: VS Code Live Server, `python -m http.server`, `npx serve` o similar.
- No se necesita Node para ejecutar la app.
- Opcional: `node --test` para pruebas del parser puro, sin dependencias.

### Navegadores objetivo

- Últimas dos versiones estables de Chrome, Edge, Firefox y Safari de escritorio.
- iOS Safari y Android Chrome actuales.
- Sin Internet Explorer.

---

## 4. Estructura de archivos propuesta

```text
WebMili/
├─ index.html
├─ css/
│  └─ app.css
├─ js/
│  ├─ app.js            # arranque, estado global y coordinación
│  ├─ docx.js           # carga, Mammoth, saneado, render, índice y extracción
│  ├─ links.js          # parser puro de YouTube/Spotify
│  ├─ media.js          # panel, iframes, URLs de embed y limpieza
│  ├─ storage.js        # IndexedDB y preferencias
│  ├─ ui.js             # layout, animación, foco, diálogos y toasts
│  └─ theme-init.js     # tema inicial en <head>, sin parpadeo
├─ vendor/
│  ├─ mammoth.browser.min.js
│  ├─ purify.min.js
│  ├─ LICENSE-mammoth.txt
│  └─ LICENSE-dompurify.txt
├─ assets/
│  ├─ favicon.svg
│  └─ icons.svg         # sprite SVG opcional
└─ README.md
```

**Estado del Hito 1:** existen `index.html`, `css/app.css`, `js/app.js`, `js/docx.js`, `js/storage.js`, `js/theme-init.js`, `assets/favicon.svg`, `vendor/` (Mammoth, DOMPurify y licencias, ya cargados), `tests/fixtures/` y los documentos del proyecto. `app.js` asume todavía las responsabilidades de `media.js` y `ui.js`; el desglose se hará al conectar los medios en el Hito 3, sin cambiar el comportamiento validado.

### Responsabilidades

- **`app.js`**: inicializa la app, carga preferencias, restaura el documento, conecta eventos y mantiene el estado de alto nivel. No implementa parseo de `.docx` ni construcción de iframes.
- **`docx.js`**: lee el archivo, llama a Mammoth, sanea, inserta el HTML, envuelve tablas, asigna IDs a encabezados, extrae encabezados y enlaces multimedia, y devuelve metadatos.
- **`links.js`**: funciones puras `parseMediaLink(url)` y `parseYouTubeTime(value)`. Sin DOM, fácil de testear.
- **`media.js`**: construye URLs de embed, crea/destruye iframes, actualiza el header del panel, gestiona el estado de carga y el fallback.
- **`storage.js`**: CRUD del último documento en IndexedDB, lectura/escritura de preferencias y manejo de errores de cuota.
- **`ui.js`**: abre/cierra el panel, calcula dimensiones, ejecuta la animación, conserva el scroll, gestiona foco, diálogos, tema, tamaño de letra y toasts.
- **`theme-init.js`**: script clásico mínimo en `<head>` que aplica el tema guardado antes del primer pintado.

---

## 5. Arranque de la aplicación

`index.html` contiene (objetivo al final del MVP):

- `theme-init.js` en `<head>`.
- Barra superior.
- Pantalla inicial con dropzone.
- Layout del lector con panel de documento y panel de medios.
- Dos diálogos (`<dialog>`): índice y lista de medios.
- Región `aria-live`.
- Contenedor de toasts.
- Scripts vendorizados al final del `<body>`.
- Módulo principal `js/app.js`.

**Hito 1:** la landing, el lector, el enlace «Saltar al documento», el panel de medios, los toasts, la región `aria-live` y los scripts vendorizados ya están en el HTML. Faltan los diálogos de índice y lista de medios (Hito 2).

Orden de carga:

1. `theme-init.js` lee `localStorage` y aplica `data-theme` en `<html>`.
2. Se cargan Mammoth y DOMPurify.
3. `app.js` espera a que el DOM esté listo.
4. Carga preferencias, aplica tema y tamaño.
5. Intenta restaurar el último documento si "Recordar" está activo.
6. Si no hay documento, muestra la landing.
7. Tras el primer frame, elimina la clase `no-transitions`.

Los scripts vendorizados se cargan antes del módulo para garantizar que `window.mammoth` y `window.DOMPurify` existan.

---

## 6. Modelo de estado

Estado en memoria, no persistido tal cual:

```js
const state = {
  view: 'landing' | 'reader',
  doc: {
    name: '',
    size: 0,
    lastModified: 0,
    blob: null,
    headings: [],      // [{ id, text, level }]
    mediaLinks: [],    // [{ key, href, provider, type, id, start, label }]
    scrollTop: 0
  },
  activeMedia: null,   // { key, href, provider, type, id, start, label, embedUrl, triggerEl }
  prefs: {
    theme: 'system',   // 'system' | 'light' | 'dark'
    fontSize: 18,      // 16..24
    rememberDocument: true
  },
  layout: {
    isDesktop: true,   // media query >= 900px
    mediaOpen: false
  },
  storage: {
    available: true,
    canPersist: false
  }
};
```

Notas:

- `activeMedia.triggerEl` es una referencia DOM para devolver el foco; no se persiste.
- `doc.blob` vive en memoria y también puede estar en IndexedDB.
- Los encabezados y enlaces se derivan del DOM renderizado después de cada carga.
- El HTML renderizado no se guarda en el estado ni en almacenamiento.

---

## 7. Flujo de carga y render

```text
Selección/drag & drop
  -> validar extensión y tamaño
  -> leer arrayBuffer
  -> mostrar loading
  -> mammoth.convertToHtml({ arrayBuffer }, { externalFileAccess: false })
  -> DOMPurify.sanitize(html)
  -> insertar en <.doc-content>
  -> post-procesar DOM
  -> extraer encabezados y enlaces
  -> construir índice y lista de medios
  -> guardar Blob + metadatos en IndexedDB (si "Recordar")
  -> mostrar lector
  -> restaurar scroll (si viene de almacenamiento)
```

### 7.1 Validación

- Extensión `.docx` o MIME `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- Si es `.doc`, PDF u otro: error específico.
- Si el archivo supera ~20 MB: aviso de que puede tardar, sin bloquear.
- Si el usuario suelta varios archivos: se usa el primero y se muestra un aviso.
- Si el archivo nuevo reemplaza a uno existente: cerrar el medio antes de cargar.

### 7.2 Conversión

- Mostrar el overlay de carga antes de llamar a Mammoth.
- Ceder el hilo con `requestAnimationFrame` o `setTimeout(0)` para que el navegador pinte el overlay.
- Llamar a `mammoth.convertToHtml` con `externalFileAccess: false`.
- Guardar `result.messages` para diagnóstico en consola.
- Si la promesa rechaza, mostrar error de documento corrupto/protegido.
- Si el HTML resultante no tiene contenido visible, mostrar estado de documento vacío.

### 7.3 Saneado

- Sanear el HTML con DOMPurify antes de insertarlo.
- La allowlist debe conservar las etiquetas que Mammoth produce para el contenido.
- Después del saneado, hacer el post-procesado solo con APIs del DOM, no concatenando HTML.
- Ver sección 14 para la configuración de seguridad.

### 7.4 Post-procesado del DOM

- Envolver cada `<table>` en un `div.table-scroll` para permitir scroll horizontal.
- Añadir `loading="lazy"`, `decoding="async"` y estilos de imagen a los `<img>`.
- Asignar IDs únicos a los encabezados mediante slug del texto, con sufijo numérico si hay duplicados.
- Al navegar desde el índice, dar foco temporal al encabezado con `tabindex="-1"` (sin añadirlo al orden normal de tabulación).
- Recopilar encabezados para el índice.
- Recorrer los `<a>`:
  - Normalizar el `href`.
  - Resolver enlaces internos.
  - Añadir `target="_blank"` y `rel="noopener noreferrer"` a los externos.
  - Detectar multimedia con `parseMediaLink`.
  - Añadir clase, badge y texto accesible del proveedor.
  - Añadir `aria-controls="media-panel"` y `aria-expanded="false"`.
  - Neutralizar protocolos no permitidos.
- Recopilar enlaces multimedia únicos para la lista.
- Devolver metadatos al estado.

### 7.5 Restauración del scroll

- Al cargar desde IndexedDB, renderizar primero; después esperar a que las imágenes estén decodificadas (`img.decode()` con `Promise.allSettled`) o a un timeout corto.
- Aplicar `scrollTop` guardado.
- Si el documento cambia de tamaño por fuentes/imágenes, hacer una segunda corrección tras un frame.
- Guardar el scroll con debounce de ~300 ms y al ocultar/cerrar la página.

---

## 8. Detección de enlaces

### 8.1 Contrato del parser

`js/links.js` exporta:

```js
parseMediaLink(url, baseUrl) -> MediaLink | null
parseYouTubeTime(value) -> number | null
```

`baseUrl` lo aporta quien llama (por ejemplo, `document.baseURI`), para que el parser siga siendo puro y testeable.

`MediaLink`:

```js
{
  provider: 'youtube' | 'spotify',
  type: 'video' | 'playlist' | 'track' | 'album' | 'episode' | 'show' | 'artist',
  id: string,
  start: number | null,
  key: string,       // provider:type:id, para deduplicar
  embedUrl: string,
  height: number | null
}
```

### 8.2 YouTube

- Hosts aceptados: `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com`, `youtu.be`.
- Formas:
  - `/watch?v=ID`
  - `youtu.be/ID`
  - `/shorts/ID`
  - `/live/ID`
  - `/embed/ID`
  - `/playlist?list=ID`
- Si hay `v`, se usa el video; si además hay `list`, se ignora para el embed.
- Si solo hay `list`, se crea un embed de playlist.
- Validar ID de video con `^[A-Za-z0-9_-]{11}$`.
- Validar ID de playlist no vacío y con caracteres seguros.
- Tiempo: `t` o `start`; aceptar entero, `90s`, `1m30s`, `1h2m3s`; devolver segundos.
- Embed de video:
  `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&playsinline=1&rel=0&start={segundos}`
- Embed de playlist:
  `https://www.youtube-nocookie.com/embed/videoseries?list={id}&autoplay=1&playsinline=1&rel=0`

### 8.3 Spotify

- Host: `open.spotify.com`.
- Aceptar prefijo `/intl-xx/`.
- Tipos: `track`, `album`, `playlist`, `episode`, `show`, `artist`.
- Validar ID no vacío con caracteres seguros.
- Ignorar `si`, `utm_*` y otros parámetros.
- Embed: `https://open.spotify.com/embed/{type}/{id}`.
- Alturas:
  - track: 152;
  - episode: 232;
  - album, playlist, show, artist: 352.
- No hay timestamps.

### 8.4 Deduplicación para la lista de medios

- Clave: `provider:type:id`.
- Conservar la primera aparición, su etiqueta y su tiempo.
- No deduplicar los enlaces del documento: cada enlace conserva su comportamiento.
- La lista de medios muestra los únicos.

---

## 9. Panel de medios y ciclo de vida de los iframes

### 9.1 Estructura del panel

```html
<aside id="media-panel" class="media-panel" aria-label="Reproductor multimedia" aria-hidden="true" inert>
  <div class="media-panel__inner">
    <header class="media-panel__bar">
      <span class="media-provider"></span>
      <span class="media-label"></span>
      <button class="media-close" aria-label="Cerrar reproductor y volver al documento">Cerrar</button>
      <a class="media-external" target="_blank" rel="noopener noreferrer">Abrir en …</a>
    </header>
    <div class="media-stage" aria-busy="false">
      <div class="media-skeleton" aria-hidden="true">Cargando reproductor…</div>
      <!-- iframe se inserta aquí -->
    </div>
    <p class="media-note" role="status" hidden>Sin conexión. El documento sigue disponible.</p>
  </div>
</aside>
```

- `inert` + `aria-hidden="true"` mientras está cerrado.
- Al abrir se retiran ambos atributos; al cerrar se aplican de inmediato, antes de que termine la animación.
- `aria-expanded` en el enlace que lo abrió.
- `aria-live` anuncia apertura/cierre; `aria-busy` refleja la carga del medio.
- El panel no es modal; el documento sigue accesible.

### 9.2 Abrir un medio

1. Guardar el elemento que disparó la acción (`triggerEl`).
2. Si ya hay un medio activo con la misma `key`, no recargar; enfocar el botón de cerrar.
3. Si hay otro medio, destruir su `iframe` sin cerrar el panel.
4. Actualizar header (proveedor, etiqueta, enlace externo).
5. Calcular dimensiones finales del panel.
6. Quitar `inert`/`aria-hidden` y crear el `iframe` ya en el contenedor de tamaño final.
7. Mostrar el esqueleto hasta `load`; luego hacer fade del iframe.
8. Si el panel estaba cerrado, forzar un reflow y añadir la clase `is-open` para animar.
9. Enfocar el botón de cerrar y anunciar.
10. Marcar el enlace activo y `aria-expanded="true"`.

### 9.3 Cerrar un medio

1. Quitar el `iframe` inmediatamente para detener el audio/video.
2. Aplicar `inert` y `aria-hidden="true"` al panel en el acto, para que nada pueda enfocar su contenido durante el cierre.
3. Quitar la clase `is-open` para iniciar la animación de cierre.
4. Quitar el estado activo y `aria-expanded="false"`.
5. Devolver el foco a `triggerEl`.
6. Anunciar el cierre.
7. Al terminar la animación, limpiar header, esqueleto y notas.
8. Conservar la posición del documento.

### 9.4 Atributos de los iframes

**YouTube:**

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/…"
  title="Reproductor de YouTube"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin">
</iframe>
```

**Spotify:**

```html
<iframe
  src="https://open.spotify.com/embed/…"
  title="Reproductor de Spotify"
  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  referrerpolicy="strict-origin-when-cross-origin">
</iframe>
```

- No usar `sandbox`; los reproductores necesitan scripts y, en Spotify, login/popups.
- No inyectar `src` arbitrarios. Solo URLs construidas por `media.js` y validadas contra los hosts permitidos.
- El `iframe` se crea con `tabindex="-1"` y `aria-hidden="true"`; al disparar `load` se retiran ambos atributos. Así un reproductor que aún no se ve no recibe foco.
- No se cargan los iframes al iniciar la app.

### 9.5 Autoplay y reproducción

- YouTube: `autoplay=1` y `allow="autoplay"`. Puede ser bloqueado; queda el play del reproductor.
- Spotify: no se fuerza autoplay; la persona pulsa play. Forzar reproducción programática puede provocar vista previa y comportamiento inconsistente.
- No se usa la IFrame Player API en el MVP. Si se necesita detectar errores de YouTube, se evaluará después.
- El enlace externo está siempre presente.

### 9.6 Falta de conexión y errores

- Escuchar `online`/`offline` y actualizar la nota del panel.
- Si `navigator.onLine === false`, mostrar "Sin conexión. El documento sigue disponible, pero YouTube o Spotify no se pueden cargar."
- Si el iframe no dispara `load` en 12 s, retirar `aria-busy` y dejar de anunciar la carga. El reproductor sigue oculto y fuera del orden de tabulación; el enlace externo es el fallback.
- No se promete detección automática de errores de embed.

---

## 10. Layout responsive

### 10.1 Shell

```css
html, body { height: 100%; }
body {
  min-height: 100dvh;
  overflow: hidden;
}
.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}
main {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
.doc-pane {
  flex: 1 1 0;
  min-width: 0;
  overflow-y: auto;
}
.media-panel {
  flex: 0 0 auto;
  width: 0;
  overflow: hidden;
}
```

- `100dvh` con fallback `100vh`.
- Cada panel tiene su propio scroll.
- La barra superior no forma parte del scroll del documento.

### 10.2 Escritorio (≥ 900 px)

- `main` en fila.
- Documento a la izquierda; panel a la derecha.
- Ancho del panel: `--media-w: clamp(360px, 40vw, 560px)`.
- El panel cerrado tiene `width: 0`.
- El contenido interno del panel tiene el ancho final fijo (`var(--media-w)`) mientras el contenedor externo anima; así el iframe no cambia de tamaño.
- El documento centra su contenido con un ancho máximo de lectura.

### 10.3 Móvil (< 900 px)

- `main` en columna.
- Panel de medios visualmente arriba (`order: -1` o equivalente), documento abajo.
- El documento sigue primero en el DOM; al abrir el medio se mueve el foco al cierre para evitar desorientación.
- `--media-h` se calcula según el tipo:
  - YouTube: `ancho * 9/16` + barra del panel + nota opcional.
  - Spotify: altura del embed (352 px por defecto para listas) + barra + nota.
- `--media-h` se limita al **55 % de la altura útil del workspace** (sin la barra superior), no al 55 % del viewport completo. El documento conserva así al menos el 45 % de esa altura útil.
- El contenedor interno mantiene el alto final fijo mientras el externo anima.
- Safe areas con `env(safe-area-inset-*)`.

### 10.4 Recálculo

- `updateMediaSize()` calcula `--media-w` o `--media-h` al abrir y al cambiar el viewport.
- Al redimensionar, el handler se limita con `requestAnimationFrame`: añade `is-resizing` para desactivar transiciones, recalcula y vuelve a activarlas 180 ms después.
- No recrear el iframe al cambiar de layout.
- Usar `matchMedia('(min-width: 900px)')` para el estado `isDesktop`.
- El anclaje de scroll se recalcula en cada frame durante la transición para que el bloque visible no salte.

### 10.5 Decisiones adoptadas en el Hito 0

- Punto de corte definitivo del prototipo: **900 px**.
- Ancho del panel de escritorio: 360 px a 900 px, 410 px a 1024 px y 560 px a 1440 px, con la fórmula `clamp(360px, 40vw, 560px)`.
- En móvil, el tope se calcula con `workspace.clientHeight`, no con `window.innerHeight`; así la barra superior no se descuenta dos veces.
- Medidas observadas: 390×844 con YouTube → panel 310 px y documento 474 px; 320×568 con Spotify → panel 279 px y documento 229 px. En ambos casos se respeta el 55/45.
- La transición CSS es de 320 ms al abrir y 280 ms al cerrar. El anclaje de scroll se mantiene activo 360/320 ms para cubrir la transición completa.
- El `iframe` se crea ya con el tamaño final; el panel externo anima `width` (escritorio) o `height` (móvil) con `overflow: hidden`.

---

## 11. Animación

### 11.1 Tokens

```css
:root {
  --dur-open: 320ms;
  --dur-close: 280ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --media-w: clamp(360px, 40vw, 560px);
  --media-h: 0px;
}
```

### 11.2 Apertura

1. Calcular dimensiones finales.
2. Quitar `inert`; preparar contenido; mantener opacidad del contenido en 0.
3. Añadir `is-open` para animar el ancho/alto del contenedor externo.
4. Animar opacidad del contenido con un pequeño retraso.
5. Al terminar, enfocar el cierre.

### 11.3 Cierre

1. Eliminar el `iframe` inmediatamente (detiene el audio).
2. Quitar `is-open`; animar el contenedor a 0.
3. Quitar estados activos y devolver el foco.
4. Al terminar, limpiar y aplicar `inert`.

### 11.4 Estabilidad del iframe

- No animar el ancho del `iframe` ni su altura.
- El contenedor externo (`media-panel`) recorta; el contenedor interno (`media-panel__inner`) tiene el tamaño final.
- El `iframe` ocupa el 100 % del stage, que también tiene tamaño final.
- Esto evita reflows y parpadeos del reproductor durante la transición.

### 11.5 Movimiento reducido

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- Sin desplazamientos ni fades en modo reducido.
- Sin `scroll-behavior: smooth` en ese modo.
- La app sigue siendo comprensible.

### 11.6 Primera carga

- `<html class="no-transitions">` al inicio.
- Se retira después del primer `requestAnimationFrame`.
- Evita que el layout inicial anime el panel o el tema.

---

## 12. Scroll y foco

### 12.1 Conservación del scroll al abrir/cerrar

El cambio de ancho del documento provoca reflow. Para que la lectura no salte:

1. Antes de abrir/cerrar, localizar el primer bloque visible del documento (párrafo, encabezado, tabla o imagen).
2. Guardar su posición relativa al borde superior del panel.
3. Durante la transición, ajustar `scrollTop` en cada frame para mantener ese bloque en el mismo lugar visual.
4. Al terminar, detener el bucle y hacer una última corrección.
5. En `prefers-reduced-motion`, hacer una sola corrección tras el cambio instantáneo.

Esto evita depender del soporte de scroll anchoring de cada navegador. El panel del documento tendrá `overflow-anchor: none` para evitar una doble corrección.

### 12.2 Foco

- Al abrir: guardar el trigger; enfocar el botón de cerrar.
- Al cerrar: devolver el foco al trigger si sigue en el DOM; si no, al botón "Medios".
- Los diálogos usan `<dialog>` con foco atrapado y retorno al botón que los abrió.
- `Escape` cierra el panel solo si no hay un diálogo abierto.
- Si el foco está dentro del iframe, el evento no llega a la app; el botón de cerrar está siempre visible.
- No cerrar el panel al hacer clic en el documento.
- El panel abierto no atrapa el foco.

### 12.3 Anuncios

- Región `aria-live="polite"` para "Reproductor de YouTube abierto", "Reproductor cerrado", "Documento cargado", "Documento olvidado".
- Errores con `role="alert"` o región asertiva según gravedad.
- No anunciar cada scroll ni cada cambio de tamaño.

---

## 13. Persistencia

### 13.1 IndexedDB

- Base de datos: `webmili`.
- Versión: `1`.
- Store: `documents`, keyPath `id`.
- Registro:

```js
{
  id: 'last',
  name: 'documento.docx',
  size: 123456,
  lastModified: 1700000000000,
  blob: Blob,
  scrollTop: 0,
  updatedAt: Date.now()
}
```

Operaciones:

- `saveLastDocument(record)`.
- `getLastDocument()`.
- `updateScroll(scrollTop)`.
- `deleteLastDocument()`.
- Manejo de `QuotaExceededError`, `SecurityError` y errores de apertura.

### 13.2 Preferencias

`localStorage` clave `webmili:prefs:v1`:

```json
{
  "theme": "dark",
  "fontSize": 18,
  "rememberDocument": true
}
```

- El Hito 0 solo escribe `theme` (`"light"` o `"dark"`). `fontSize` y `rememberDocument` se añadirán en hitos posteriores.
- `theme-init.js` lee la clave antes del primer pintado y tolera JSON inválido, almacenamiento bloqueado o valores desconocidos; en ese caso usa la preferencia del sistema.
- Lectura tolerante a JSON inválido o almacenamiento bloqueado.
- Escritura envuelta en `try/catch`.
- Si `localStorage` no está disponible, usar valores por defecto en memoria.

### 13.3 Flujo de guardado

- Al cargar un documento con "Recordar" activo: guardar el Blob.
- Al hacer scroll: debounce ~300 ms.
- Al cerrar/ocultar la página: guardar el scroll actual.
- Al abrir/cerrar el medio: guardar el scroll del documento.
- Al desactivar "Recordar": borrar el registro.
- Al pulsar "Olvidar documento": borrar, cerrar el medio, volver a la landing y avisar.
- `navigator.storage.persist()` se solicita después del primer guardado exitoso, si está disponible.
- No se guarda el estado del medio ni el HTML renderizado.

### 13.4 Restauración

1. Leer preferencias.
2. Si `rememberDocument` es `true`, leer el registro.
3. Si existe, validar el Blob y renderizar.
4. Esperar imágenes; aplicar `scrollTop`.
5. Si falla el render, borrar el registro y mostrar la landing con un error.
6. Si no hay registro, mostrar la landing.

---

## 14. Seguridad

### 14.1 Sanitización

Configuración inicial de DOMPurify (ajustar con fixtures reales):

- Etiquetas permitidas: párrafos, encabezados, listas, tablas, imágenes, enlaces, énfasis, citas, código, notas, contenedores semánticos.
- Atributos permitidos: `href`, `src`, `alt`, `title`, `id`, `class`, `colspan`, `rowspan`, `headers`, `scope`, `width`, `height`, `start`, `reversed`.
- `ADD_DATA_URI_TAGS: ['img']` para conservar las imágenes de Mammoth.
- Prohibir: `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `textarea`, `select`, `option`, `link`, `meta`, `base`, `template`.
- Prohibir atributos `style`, `srcset`, `formaction`, `action` y cualquier `on*`.
- No habilitar `externalFileAccess` en Mammoth.

### 14.2 Enlaces

Después del saneado, recorrer los `<a>` y:

- Permitir `http:`, `https:`, `mailto:`, `tel:` e internos `#`.
- Si el protocolo no está permitido, eliminar `href` o neutralizarlo.
- Añadir `target="_blank"` y `rel="noopener noreferrer"` a los externos.
- Los enlaces multimedia se gestionan con el panel; no se abre la URL original.
- Los enlaces internos se resuelven con `#id` dentro del documento.

### 14.3 Imágenes

- Aceptar solo `src` que empiece por `data:image/`.
- Si aparece una imagen externa no controlada, retirarla.
- Añadir `alt` vacío si falta, para evitar lecturas confusas.
- No permitir `srcset`.

### 14.4 Iframes

- Solo se crean desde `media.js`.
- Hosts permitidos: `www.youtube-nocookie.com`, `open.spotify.com`.
- El `src` se construye con IDs validados, no con el `href` original.
- No se aceptan URLs de otros proveedores.
- No usar `sandbox` (rompería los reproductores).
- `referrerpolicy="strict-origin-when-cross-origin"`.

### 14.5 Otras reglas

- No usar `eval`, `new Function`, `document.write`.
- No insertar HTML concatenado; usar `DOMPurify.sanitize` y luego APIs del DOM.
- No cargar scripts de terceros.
- No cargar analítica.
- No habilitar `externalFileAccess`.
- Mantener actualizadas las versiones vendorizadas.
- Opcional futuro: CSP estricta probada con YouTube/Spotify; no forma parte del MVP.

---

## 15. Accesibilidad

- Landmarks: `header`, `main`, `article`, `nav` para el índice, `section` para el reproductor.
- Enlace "Saltar al documento".
- Jerarquía de encabezados intacta.
- Foco visible con `:focus-visible`.
- Orden de tabulación lógico.
- `<dialog>` nativo para índice y medios; retorno de foco.
- `aria-expanded` y `aria-controls` en enlaces multimedia.
- `aria-live` para apertura/cierre y mensajes.
- El nombre accesible de un enlace multimedia incluye su texto visible; se completa con la acción ("Abrir en el reproductor de…").
- `title` descriptivo en iframes, incluyendo la etiqueta del medio.
- Badges de proveedor con texto oculto para lectores de pantalla.
- Botones con `aria-label` cuando son solo icono.
- Áreas táctiles de 44 × 44 px.
- Contraste AA.
- `prefers-reduced-motion`.
- No depender del color para estados.
- El panel no es modal; el documento sigue accesible.
- El panel se marca `inert` en cuanto empieza el cierre.
- Un `iframe` que todavía no ha cargado queda fuera del orden de tabulación y del árbol de accesibilidad.
- Las regiones con desplazamiento horizontal (la tabla del prototipo) reciben `tabindex="0"`, `role="region"` y un `aria-label`.
- Documentar la limitación de `Escape` dentro del iframe.

### 15.1 Orden visual y DOM en móvil

- El documento va primero en el DOM (contenido principal).
- En móvil, el panel de medios se coloca arriba visualmente con `order`.
- Al abrir el medio, el foco se mueve al botón de cerrar, por lo que la persona no tiene que recorrer el documento para llegar al reproductor.
- Esta decisión prioriza el contenido principal en lectores de pantalla y evita mover el iframe en el DOM (lo que podría recargarlo).

---

## 16. Rendimiento

### 16.1 Carga y conversión

- Mostrar el overlay antes de convertir.
- Ceder el hilo antes de Mammoth.
- Evitar duplicar el HTML en memoria.
- Medir con un `.docx` de ~20 MB y con muchas imágenes.
- Si la conversión bloquea de forma perceptible, evaluar un Worker; no es requisito del MVP.

### 16.2 Render

- Extraer encabezados y enlaces en una sola pasada.
- Envolver tablas una sola vez.
- Evitar observadores innecesarios.
- Imágenes con `loading="lazy"` y `decoding="async"`.
- No usar `IntersectionObserver` para todo el documento si no aporta.

### 16.3 Animación

- Animar solo ancho, alto y opacidad.
- Evitar `box-shadow`, `filter` y `transform` costosos en elementos grandes.
- Usar `will-change` solo durante la transición y retirarlo después.
- `contain: layout paint` en el contenido del documento si no rompe el scroll.
- Medir en móvil de gama media.

### 16.4 Memoria

- Destruir iframes y limpiar referencias.
- No guardar HTML renderizado en IndexedDB.
- Revocar object URLs si se usaran en el futuro (el MVP usa data URIs).
- Cancelar timers y rAF al cerrar.
- Evitar listeners duplicados al cambiar de documento.

---

## 17. Estilos y diseño

### 17.1 Tokens

```css
:root {
  --font-ui: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-doc: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
  --reader-size: 18px;
  --topbar-h: 56px;
  --media-w: clamp(360px, 40vw, 560px);
  --dur: 320ms;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --radius: 12px;
  --focus: 2px solid var(--accent);
}
```

Paletas propuestas:

- **Claro:** fondo papel cálido, texto grafito, superficies blancas, bordes suaves, acento azul/verde.
- **Oscuro:** fondo grafito, texto marfil, superficies elevadas, bordes sutiles, mismo acento.
- **YouTube:** rojo para el badge.
- **Spotify:** verde para el badge.

### 17.2 Documento

- Ancho máximo de lectura: ~68–72 caracteres.
- Interlineado: 1.7.
- Párrafos con margen inferior.
- Encabezados con `scroll-margin-top`.
- Tablas con bordes suaves, cabecera diferenciada y scroll horizontal.
- Imágenes con `max-width: 100%`, `height: auto`, borde redondeado y pie si existe.
- Enlaces con subrayado visible y color de acento.
- Enlaces multimedia con badge discreto.
- Notas al pie con tipografía menor y separador.

### 17.3 Interfaz

- Barra superior con nombre del archivo truncado y título completo en `title`.
- Botones: Índice, Medios, tema, tamaño, menú.
- Diálogos laterales con backdrop y cierre.
- Toasts discretos, no bloqueantes.
- Landing centrada con dropzone y nota de privacidad.
- Sin fuentes externas.
- Sin imágenes decorativas pesadas.

### 17.4 Temas

- Tema inicial: sistema.
- Toggle claro/oscuro; persistir la elección.
- `theme-init.js` aplica el tema antes del primer pintado.
- Los colores de YouTube/Spotify se usan solo en badges, no en grandes superficies.
- Contraste AA en ambos temas.

---

## 18. Estados y copy

- **Landing:** "Abre tu documento", "Arrastra aquí tu archivo .docx o elígelo", "Tu documento no se sube a ningún servidor".
- **Cargando:** "Preparando tu documento…".
- **Lector:** barra superior con "Índice", "Medios", "Tema", "Tamaño".
- **Medio cargando:** esqueleto con el color del proveedor.
- **Medio abierto:** "Abrir en YouTube/Spotify", "Cerrar".
- **Sin conexión:** "Sin conexión. El documento sigue disponible, pero el medio no se puede cargar."
- **Sin índice:** "Este documento no tiene encabezados."
- **Sin medios:** "Este documento no contiene enlaces de YouTube o Spotify."
- **Guardado:** "Documento guardado en este dispositivo."
- **Olvidado:** "Documento olvidado de este dispositivo."
- **Cuota:** "El documento se abrió, pero no se pudo guardar para la próxima vez."
- **Error de archivo:** mensajes de la tabla de [`REQUIREMENTS.md`](REQUIREMENTS.md#12-errores-y-estados).

---

## 19. Pruebas

### 19.1 Parser de enlaces

Casos mínimos:

- YouTube watch con y sin tiempo.
- `youtu.be` con y sin tiempo.
- Shorts, live, embed.
- Playlist de YouTube.
- YouTube Music.
- Spotify track, album, playlist, episode, show, artist.
- Spotify con `/intl-es/`.
- Enlaces con parámetros `si`, `utm_*`.
- Enlaces inválidos, IDs vacíos, hosts falsos.
- Tiempos `90`, `90s`, `1m30s`, `1h2m3s`, inválidos.
- Enlaces internos, `mailto:`, `tel:`, `javascript:`.

Opcional: `tests/links.test.mjs` con `node:test`. Para importar un módulo ES `.js` desde Node sin build, añadir un `package.json` mínimo con `"type": "module"` o usar una página de pruebas en el navegador.

### 19.2 Documentos de prueba

- Documento básico con párrafos y títulos.
- Documento sin encabezados.
- Documento sin enlaces.
- Documento con tablas, imágenes y notas.
- Documento largo.
- Documento con todos los formatos de enlaces.
- Documento con un enlace `javascript:`.
- Documento corrupto.
- Documento `.doc` renombrado.
- Documento protegido con contraseña.
- Documento de ~20 MB.
- Documento con muchas imágenes.

### 19.3 Matriz de navegadores

- Chrome escritorio.
- Edge escritorio.
- Firefox escritorio.
- Safari escritorio.
- iOS Safari.
- Android Chrome.

### 19.4 Interacciones

- Abrir/cerrar el panel en escritorio y móvil.
- Cambiar de medio con el panel abierto.
- Cerrar con botón y con `Escape`.
- Foco al cerrar.
- Scroll conservado.
- Resize y rotación.
- `prefers-reduced-motion`.
- Teclado only.
- Lector de pantalla (smoke test).
- Tema claro/oscuro.
- Tamaño de letra.
- Restauración de documento y scroll.
- "Olvidar documento".
- Cuota llena (simulada).
- Sin conexión.
- Embed bloqueado.
- Spotify con y sin sesión.
- Enlaces con modificadores.

### 19.5 Seguridad

- Enlace `javascript:` neutralizado.
- HTML con etiquetas prohibidas eliminado.
- Imagen externa no controlada eliminada.
- Iframe solo con hosts permitidos.
- Sin errores de consola por contenido del documento.

### 19.6 Criterio de salida

- Checklist de [`REQUIREMENTS.md`](REQUIREMENTS.md#15-checklist-de-aceptación-del-mvp) completo.
- Sin errores de consola en flujos normales.
- Sin scroll horizontal a 320 px.
- Sin fugas evidentes al abrir/cerrar medios repetidamente.
- La app se despliega y funciona desde una URL estática.

### 19.7 Validación del Hito 0

**Entorno:** Chrome estable en Windows, modo headless, sin dispositivo físico.

- **51/51** comprobaciones E2E: panel cerrado e inerte al cargar, un solo iframe, tamaño estable durante la animación, cambio de medio, `Escape`, foco, `aria-expanded`, scroll, tema, announces, carga real de YouTube/Spotify, `prefers-reduced-motion` y layouts de 390×844 y 320×568.
- **5/5** comprobaciones de persistencia del tema: guardado JSON, aplicación tras recarga y fallback a `prefers-color-scheme` cuando no hay preferencia.
- **39/39** comprobaciones responsive en 320, 390, 768, 900, 1024 y 1440 px: sin scroll horizontal, composición correcta, iframe 16:9 y límites 55/45 en móvil.
- **0 violaciones automáticas** de axe-core en panel cerrado (claro), panel abierto (claro y oscuro) y móvil (oscuro).
- Análisis manual pendiente: contraste dentro de contenido parcialmente recortado, contenido del iframe cross-origin y prueba con lector de pantalla.
- Pruebas y capturas viven en el directorio temporal de validación, no en el repositorio.

---

## 20. Despliegue

- Sitio estático; `index.html` en la raíz.
- Rutas relativas para funcionar en un subdirectorio de GitHub Pages.
- Sin build, sin variables de entorno, sin backend.
- Servidor estático local para desarrollo; no abrir con `file://` porque los módulos ES no funcionan.
- GitHub Pages o Netlify.
- Incluir `README.md` con:
  - cómo ejecutar en local;
  - cómo desplegar;
  - limitaciones conocidas;
  - créditos y licencias.
- No se añade service worker en el MVP.
- HTTPS recomendado para el comportamiento normal de iframes y almacenamiento.

---

## 21. Riesgos técnicos y mitigaciones

Resumen; detalle en [`RISKS.md`](RISKS.md).

| Riesgo | Mitigación |
|---|---|
| Iframe parpadea al animar | Contenedor interno de tamaño fijo; se anima el externo |
| Salto de scroll al reflow | Anclaje manual durante la transición |
| Safari con scroll interno/dvh | Probar; fallback de layout y corrección de scroll |
| Documento grande bloquea | Overlay, ceder el hilo, medir; evaluar Worker |
| Embed bloqueado | Enlace externo siempre visible |
| Spotify solo preview | Copy honesto; no prometer reproducción completa |
| Autoplay bloqueado | Botón de play del proveedor |
| `Escape` dentro del iframe | Botón de cerrar siempre visible |
| Cuota de IndexedDB | Fallback en memoria + aviso |
| Documento sensible almacenado | Toggle y "Olvidar documento" |
| DOMPurify rompe imágenes/enlaces internos | Fixtures y configuración ajustada |
| Orden DOM/visual en móvil | Foco al cierre; documentar el tradeoff |
| Sin tests automatizados | Parser testeable + matriz manual |

---

## 22. Decisiones de implementación abiertas

No bloquean el inicio:

- Paleta, tipografía y dimensiones del panel: adoptadas y validadas en el Hito 0; solo se ajustarán si la prueba en hardware real lo exige.
- Plataforma de despliegue concreta.
- ¿Añadir detección de errores de YouTube con la IFrame API? Mejora posterior.
- ¿Añadir Worker para documentos grandes? Solo si las pruebas lo justifican.
- ¿Pruebas automatizadas del parser con `node:test`? Recomendado en el Hito 2.
- Ubicación del toggle "Recordar en este dispositivo": menú de ajustes o barra superior.

---

## 23. Referencias

- [`MEMORY.md`](MEMORY.md)
- [`REQUIREMENTS.md`](REQUIREMENTS.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`DECISIONS.md`](DECISIONS.md)
- [`RISKS.md`](RISKS.md)
