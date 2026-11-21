# WebMili

Lector local de documentos `.docx` con reproductor integrado de YouTube y Spotify. Aplicación web estática, sin backend, sin cuentas y sin subida de archivos.

> **Estado actual: Hitos 0–4 implementados.**
> La app abre un `.docx`, genera el índice de encabezados, reconoce enlaces de YouTube y Spotify, reproduce medios en el panel integrado y puede recordar el último documento con su posición.

---

## Qué puedes probar ahora

- Elegir un `.docx` con el selector o arrastrarlo y soltarlo sobre la ventana.
- Validación de formato: rechaza `.doc`, PDF, archivos vacíos y otros formatos con un mensaje claro.
- Aviso no bloqueante para archivos de más de 20 MB; si se sueltan varios, se abre el primero y se informa.
- Conversión local con Mammoth.js y saneado con DOMPurify antes de insertar el HTML.
- Títulos, párrafos, listas, tablas, imágenes, énfasis y enlaces.
- Tablas con desplazamiento horizontal accesible por teclado e imágenes con carga diferida.
- Enlaces externos en pestaña nueva; enlaces internos con desplazamiento al encabezado.
- Enlaces con `javascript:`, `data:` u otros protocolos no permitidos se neutralizan y avisan al pulsarlos; las anclas rotas se marcan.
- Estados de carga, documento vacío y error comprensible.
- Tema claro/oscuro y tamaño de letra de 16 a 24 px, persistidos en `localStorage`.
- Recordar el último `.docx` y su posición de lectura mediante IndexedDB.
- Ajustes locales para desactivar el guardado o olvidar el documento.
- Respeto por `prefers-reduced-motion`.
- Navegación por teclado, enlace «saltar al documento» y anuncios `aria-live`.

## Qué no incluye todavía

- Persistencia de varios documentos: solo se recuerda el último.
- Sincronización entre dispositivos.
- Anotaciones, búsqueda interna, edición o cola de reproducción.
- Modo PWA/offline completo.
- Prueba manual en móvil real, Safari/Firefox y lector de pantalla.

Los documentos de ejemplo son ficticios y viven en `tests/fixtures/`. El orden de trabajo está en [`ROADMAP.md`](ROADMAP.md).

---

## Cómo ejecutarlo en local

Los módulos ES no funcionan al abrir `index.html` con `file://`. Hace falta un servidor estático.

Con Python:

```powershell
python -m http.server 8080
```

Con Node.js:

```powershell
npx serve .
```

Después abre <http://localhost:8080>.

Para probar el lector, arrastra uno de los documentos ficticios de `tests/fixtures/`:

- `lectura-basica.docx`: títulos, listas, tabla, imagen, enlaces internos y externos.
- `enlaces-peligrosos.docx`: protocolos peligrosos, ancla rota y enlaces permitidos.
- `documento-vacio.docx`: estado sin contenido visible.
- `medios.docx`: enlaces de YouTube, playlist y Spotify para probar el reproductor.

Se regeneran con `python tests/fixtures/make_fixtures.py`. No contienen datos personales.

### Probar el comportamiento responsive

1. Abre la página a 1440 px de ancho y carga `tests/fixtures/lectura-basica.docx`.
2. Comprueba la tabla y la imagen; la tabla se desplaza en horizontal si no cabe.
3. Reduce la ventana hasta 320 px: no debe aparecer scroll horizontal y el texto debe seguir siendo legible.
4. Prueba el tema oscuro y el tamaño de letra; recarga y comprueba que se recuerdan.
5. Activa la emulación de `prefers-reduced-motion` y repite la apertura y los saltos internos: no debe haber animación.
6. Recorre la interfaz con `Tab`, activa el enlace «saltar» y los enlaces internos con `Enter`.

> El documento se procesa dentro de la pestaña. La prueba automatizada verifica que no hay peticiones POST ni cuerpos de subida.

### Validación del Hito 1

Última pasada: **2026-11-21**, Chrome headless en Windows.

- **11/11** pruebas Playwright: landing, apertura, estructura, tabla, imagen, enlaces, `javascript:`/`data:`, ancla rota, documento vacío, PDF, varios archivos, persistencia, ausencia de subidas, drag & drop real, aviso de 20 MB, teclado y responsive a 320/1440 px.
- **0** errores de página durante las pruebas.
- Capturas revisadas a 1280, 390 y 320 px en tema claro, oscuro, estado vacío y error.
- Los fixtures son ficticios y se regeneran con `tests/fixtures/make_fixtures.py`.
- Las pruebas Playwright viven fuera del repositorio para no añadir build ni dependencias.

### Validación heredada del Hito 0

Última pasada del panel: **2026-11-20**, Chrome estable en Windows, modo headless.

- **51/51** comprobaciones funcionales: apertura, cierre, `Escape`, cambio de medio, foco, scroll, tema, carga de YouTube/Spotify, movimiento reducido y layouts de 390×844 y 320×568.
- **5/5** comprobaciones de persistencia del tema, incluido el fallback al tema del sistema.
- **39/39** comprobaciones responsive en 320, 390, 768, 900, 1024 y 1440 px, sin scroll horizontal.
- **0** violaciones automáticas de axe-core en cuatro estados (claro/oscuro, panel abierto/cerrado, escritorio/móvil).
- El iframe mantiene dimensiones constantes durante la animación y el documento conserva al menos el 45 % de la altura útil en móvil.

**Pendiente:** probar ambos hitos en un móvil real, Safari, Firefox y con lector de pantalla. La emulación de Chrome no sustituye esas comprobaciones.

---

## Estructura

```text
WebMili/
├─ index.html          # Landing, lector, panel y estados
├─ css/
│  └─ app.css          # Tokens, layout responsive, lector, animación y tema
├─ js/
│  ├─ app.js           # Carga, estados, preferencias, enlaces y panel
│  ├─ docx.js          # Validación, Mammoth, DOMPurify y post-procesado
│  ├─ storage.js       # Preferencias de tema y tamaño
│  └─ theme-init.js    # Tema inicial antes del primer pintado
├─ assets/
│  └─ favicon.svg
├─ vendor/             # Mammoth 1.9.1 y DOMPurify 3.2.6 con licencias
├─ tests/
│  └─ fixtures/        # .docx ficticios y generador reproducible
├─ MEMORY.md           # Visión, decisiones y estado del proyecto
├─ REQUIREMENTS.md     # Historias, criterios de aceptación y alcance
├─ TECHNICAL-PLAN.md   # Arquitectura y detalles de implementación
├─ ROADMAP.md          # Hitos 0–4
├─ DECISIONS.md        # ADRs
└─ RISKS.md            # Riesgos y limitaciones
```

No hay dependencias externas en tiempo de ejecución: todo se sirve desde el repositorio. `index.html` carga Mammoth y DOMPurify desde `vendor/`; no se usan CDNs ni fuentes externas.

---

## Cómo se abre un medio

El panel de medios del Hito 0 sigue en `js/app.js`. Cuando el Hito 2 detecte enlaces de YouTube/Spotify, el Hito 3 les añadirá estos datos:

```html
<a class="media-link media-link--youtube"
   href="https://www.youtube.com/watch?v=…"
   data-media
   data-provider="youtube"
   data-type="video"
   data-id="…"
   data-label="…"
   data-embed="https://www.youtube-nocookie.com/embed/…"
   aria-controls="media-panel"
   aria-expanded="false">…</a>
```

`js/app.js` valida el proveedor y la URL de embed, mide el panel, crea el `iframe` y lo destruye al cerrar. Mientras tanto, los enlaces de YouTube y Spotify de un `.docx` se tratan como enlaces externos normales: se abren en una pestaña nueva. El `iframe` permanece fuera del orden de tabulación hasta que termina de cargar.

---

## Decisiones que conviene recordar

- El navegador no puede ordenar ventanas del sistema de forma fiable. Por eso el reproductor vive en un panel dentro de la misma pestaña.
- El documento se coloca primero en el DOM. En móvil, el panel se coloca arriba con CSS; al abrirlo, el foco pasa al botón Cerrar.
- El panel no es modal: el documento sigue siendo legible y navegable mientras el medio está abierto.
- Solo se detectan hipervínculos reales. Las URLs escritas como texto plano no se convierten en enlaces en el MVP.
- Spotify puede requerir sesión para reproducir contenido completo; sin sesión puede sonar solo una vista previa.
- `Escape` no se puede garantizar cuando el foco está dentro del `iframe` de otro origen; el botón Cerrar siempre está visible.

Los detalles completos están en [`MEMORY.md`](MEMORY.md), [`DECISIONS.md`](DECISIONS.md) y [`RISKS.md`](RISKS.md).

---

## Documentación

| Archivo | Contenido |
|---|---|
| [`MEMORY.md`](MEMORY.md) | Documento de entrada, decisiones cerradas y estado |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Historias de usuario, criterios de aceptación y checklist del MVP |
| [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md) | Arquitectura, flujo de render, seguridad y pruebas |
| [`ROADMAP.md`](ROADMAP.md) | Hitos, tareas y puertas de calidad |
| [`DECISIONS.md`](DECISIONS.md) | ADRs con contexto y consecuencias |
| [`RISKS.md`](RISKS.md) | Riesgos técnicos, limitaciones y mitigaciones |

---

## Créditos

- **Mammoth.js 1.9.1** (BSD) y **DOMPurify 3.2.6** (Apache 2.0 / MPL 2.0) están vendorizados con sus licencias en `vendor/`.
- Tipografías del sistema; no se carga ninguna fuente externa.
