# WebMili

Lector local de documentos `.docx` con reproductor integrado de YouTube y Spotify. Aplicación web estática, sin backend, sin cuentas y sin subida de archivos.

> **Estado actual: Hito 0 — prototipo de composición implementado y validado automáticamente.**
> Todavía no se abren archivos `.docx`. Esta versión valida la pieza más arriesgada: la convivencia del documento con un `iframe` y la animación del panel. Falta la prueba manual en dispositivos reales.

---

## Qué puedes probar ahora

- Documento de ejemplo con texto, listas, tabla y enlaces multimedia.
- Enlace real de YouTube (`Big Buck Bunny`, Blender Foundation).
- Enlace real de Spotify (`Deep Focus`, lista de reproducción).
- Panel integrado que se abre al pulsar un enlace.
- En escritorio: documento a la izquierda, reproductor a la derecha.
- En móvil: reproductor arriba, documento abajo, con scroll propio.
- Transición de apertura y cierre de ~320 ms.
- El `iframe` mantiene su tamaño final dentro de un contenedor recortado para no parpadear.
- Cierre con el botón **Cerrar** o con `Esc`; al cerrar se destruye el `iframe` y se detiene el audio/video.
- Cambio de medio sin repetir la animación de apertura. Solo hay un medio activo.
- Tema claro/oscuro persistido en `localStorage` (`webmili:prefs:v1`), sin destello al cargar.
- Respeto por `prefers-reduced-motion`.
- Tabla con desplazamiento horizontal accesible por teclado.

## Qué no incluye todavía

- Carga de archivos `.docx` (selector o arrastrar y soltar).
- Integración de Mammoth.js y DOMPurify: las librerías ya están en `vendor/`, pero el prototipo no las carga.
- Índice de contenidos y lista de medios.
- Persistencia del documento y de la posición de lectura en IndexedDB.
- Controles de tamaño de letra.
- Reproductor conectado a enlaces reales de un documento: los dos enlaces del prototipo están definidos en el HTML.

El orden de trabajo está en [`ROADMAP.md`](ROADMAP.md). El lector real empieza en el Hito 1.

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

También puedes usar la extensión Live Server de VS Code.

### Probar el comportamiento responsive

1. Abre la página a 1440 px de ancho y pulsa el enlace de YouTube.
2. Reduce la ventana hasta cruzar los 900 px: la composición pasa de columnas a filas sin recargar el reproductor.
3. Prueba a 320 px: no debe aparecer scroll horizontal.
4. En móvil, comprueba que el reproductor queda arriba y el documento abajo.
5. Activa la emulación de `prefers-reduced-motion` en las herramientas de desarrollo y repite la apertura: no debe haber animación.
6. Cierra con `Esc` y con el botón; en ambos casos el audio/video debe detenerse.

> YouTube y Spotify necesitan conexión. Los embeds pueden estar limitados por el autor, la región, la edad o la configuración de cookies del navegador. El enlace externo del panel es el plan B.

### Validación del prototipo

Última pasada: **2026-11-20**, Chrome estable en Windows, modo headless.

- **51/51** comprobaciones funcionales: apertura, cierre, `Escape`, cambio de medio, foco, scroll, tema, carga de YouTube/Spotify, movimiento reducido y layouts de 390×844 y 320×568.
- **5/5** comprobaciones de persistencia del tema, incluido el fallback al tema del sistema.
- **39/39** comprobaciones responsive en 320, 390, 768, 900, 1024 y 1440 px, sin scroll horizontal.
- **0** violaciones automáticas de axe-core en cuatro estados (claro/oscuro, panel abierto/cerrado, escritorio/móvil).
- El iframe mantiene dimensiones constantes durante la animación y el documento conserva al menos el 45 % de la altura útil en móvil.

**Pendiente:** probar en un móvil real, Safari, Firefox y con lector de pantalla. La emulación de Chrome no sustituye esas comprobaciones.

---

## Estructura

```text
WebMili/
├─ index.html          # Shell, documento de ejemplo y panel
├─ css/
│  └─ app.css          # Tokens, layout responsive, animación y tema
├─ js/
│  ├─ app.js           # Apertura/cierre, iframes, tamaño, scroll y foco
│  └─ theme-init.js    # Tema inicial antes del primer pintado
├─ assets/
│  └─ favicon.svg
├─ vendor/             # Librerías para el Hito 1 (aún no cargadas)
│  ├─ mammoth.browser.min.js
│  ├─ purify.min.js
│  └─ LICENSE-*.txt
├─ MEMORY.md           # Visión, decisiones y estado del proyecto
├─ REQUIREMENTS.md     # Historias, criterios de aceptación y alcance
├─ TECHNICAL-PLAN.md   # Arquitectura y detalles de implementación
├─ ROADMAP.md          # Hitos 0–4
├─ DECISIONS.md        # ADRs
└─ RISKS.md            # Riesgos y limitaciones
```

No hay dependencias externas en tiempo de ejecución: todo se sirve desde el repositorio. No se usan CDNs ni fuentes externas. `index.html` todavía no carga las librerías de `vendor/`.

---

## Cómo se abre un medio

Cada enlace del documento lleva sus datos en atributos:

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

`js/app.js` valida el proveedor y la URL de embed, mide el panel, crea el `iframe` y lo destruye al cerrar. En el Hito 1, estos atributos se generarán desde los hipervínculos reales del `.docx`. El `iframe` permanece fuera del orden de tabulación hasta que termina de cargar.

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

- **Big Buck Bunny** © Blender Foundation, licencia [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Video de ejemplo alojado en YouTube.
- **Deep Focus** es una lista editorial de Spotify. La reproducción y disponibilidad dependen de Spotify.
- **Mammoth.js** (BSD) y **DOMPurify 3.2.6** (Apache 2.0 / MPL 2.0) están vendorizados con sus licencias en `vendor/`.
- Tipografías del sistema; no se carga ninguna fuente externa.
