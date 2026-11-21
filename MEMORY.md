# WebMili — Memoria del proyecto

> **Documento de entrada.** Leer antes de trabajar en WebMili.
> **Última actualización:** 2026-11-21
> **Estado:** Hitos 0–4 implementados. Quedan pendientes las pruebas manuales multiplataforma y el cierre final de publicación.
> **Ubicación:** `C:\Users\norll\OneDrive\Documents\ProyectosSDD\WebMili`.
> **Próximo paso:** cierre final — pruebas manuales multiplataforma y lector de pantalla.

---

## 1. Qué es WebMili

WebMili es una aplicación web **estática y sin backend** para leer documentos `.docx` y reproducir los enlaces de **YouTube** y **Spotify** que contenga el documento.

La experiencia central:

1. La persona abre un `.docx` desde su dispositivo.
2. El documento se muestra como un lector cómodo.
3. Al pulsar un enlace de YouTube o Spotify, el documento se encoge suavemente y aparece un panel de medios al lado (escritorio) o arriba (móvil).
4. El video o audio se reproduce dentro de la misma pestaña, sin abrir otra ventana.
5. Al cerrar el panel, el `iframe` se destruye, el audio/video se detiene y el documento recupera su tamaño.

El archivo nunca se sube a un servidor. Todo el procesamiento y el almacenamiento ocurren en el navegador.

---

## 2. Principios del producto

- **Privacidad local primero:** sin cuentas, sin backend, sin analítica. El `.docx` no sale del dispositivo.
- **Lectura, no edición:** WebMili no modifica el documento; lo presenta con una jerarquía semántica limpia.
- **Una sola pestaña:** el panel integrado sustituye la idea de abrir y ordenar ventanas del sistema.
- **Móvil y escritorio con la misma lógica:** columnas en pantallas anchas, filas en pantallas estrechas.
- **Carga diferida de terceros:** YouTube y Spotify solo se cargan cuando la persona pulsa un enlace.
- **Degradación honesta:** si un embed no se puede reproducir, siempre hay un enlace externo claro.
- **Accesibilidad y movimiento reducido:** teclado, foco visible, contraste y respeto por `prefers-reduced-motion`.
- **Sin dependencias externas en tiempo de ejecución:** librerías vendorizadas, fuentes del sistema, sin CDN.

---

## 3. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Visualización | Panel dividido dentro de la misma pestaña. No se abren ni se ordenan ventanas del sistema. |
| Móvil | Medio arriba y documento abajo; cada zona con scroll propio. |
| Render del `.docx` | **Mammoth.js**: lectura limpia y fluida, no reproducción exacta del diseño de Word. |
| Persistencia | Último documento y posición de lectura en **IndexedDB**; preferencias en `localStorage`. |
| Extras del MVP | Índice de contenidos, lista de medios, tema claro/oscuro y tamaño de letra. |
| Publicación | Web estática: GitHub Pages, Netlify o similar. Sin backend. |
| Cierre del medio | Botón visible y `Escape`; al cerrar se elimina el `iframe` y se detiene la reproducción. |
| Librerías | Vanilla HTML/CSS/JS, módulos ES, sin framework y sin paso de build. Mammoth + DOMPurify vendorizados. |
| Seguridad | El HTML generado por Mammoth se sanea con DOMPurify antes de insertarse. |
| Medios | Un solo medio activo a la vez. Al abrir otro, se destruye el anterior. |
| Foco del lector | El foco pasa al panel del documento para permitir el scroll con teclado, sin anillo alrededor de toda la superficie; «saltar al documento» apunta al primer encabezado. |

---

## 4. Alcance del MVP

### Entra

- Abrir un `.docx` con selector de archivo o arrastrando y soltando.
- Validar el archivo y mostrar estados de carga y error.
- Renderizar títulos, párrafos, listas, tablas, imágenes, notas, negritas/cursivas y enlaces.
- Preservar enlaces internos y abrir enlaces externos en pestaña nueva.
- Detectar enlaces de YouTube y Spotify y distinguirlos visualmente.
- Reproducir el medio en un panel integrado con `iframe`.
- Animar la apertura y el cierre del panel.
- Mantener el documento legible y desplazable mientras el medio está abierto.
- Cerrar el medio y detener el audio/video.
- Diseño responsive: columnas en escritorio, filas en móvil.
- Índice generado desde los encabezados del documento.
- Lista de todos los enlaces multimedia del documento.
- Tema claro/oscuro y tamaño de letra, persistidos.
- Recordar el último documento y el scroll, con opción de desactivarlo y olvidarlo.
- Enlace externo "Abrir en YouTube/Spotify" siempre disponible.
- Accesibilidad por teclado, foco visible y avisos para lectores de pantalla.
- Errores claros y contenido del `.docx` saneado.

### No entra en el MVP

- PWA instalable o funcionamiento offline de la aplicación.
- Lectura en voz alta (TTS).
- Auto-detección de URLs escritas como texto plano.
- Biblioteca de varios documentos recientes.
- Cola de reproducción o autoavance.
- Mini-reproductor mientras se lee.
- Ventana flotante, Picture-in-Picture o Document Picture-in-Picture.
- Ordenación automática de ventanas del sistema.
- Soporte de `.doc`, PDF, documentos cifrados o protegidos con contraseña.
- Edición, búsqueda interna, anotaciones o resaltados.
- Cuentas, sincronización entre dispositivos, analítica.
- Ajuste manual del ancho del panel arrastrando un divisor.
- Pantalla completa gestionada por la app (el reproductor de YouTube conserva la suya).

Las mejoras futuras están listadas en [`REQUIREMENTS.md`](REQUIREMENTS.md) y [`ROADMAP.md`](ROADMAP.md).

---

## 5. Restricciones técnicas que no se pueden prometer

Estas limitaciones son reales y deben mencionarse si alguien propone cambiarlas:

1. **Los navegadores no pueden colocar ventanas del sistema automáticamente.** `window.moveTo()` y `resizeTo()` no son fiables, no existen en móvil y no hay API para poner una ventana a la izquierda y otra a la derecha. La solución es el panel integrado.
2. **YouTube puede bloquear la reproducción integrada** de ciertos videos (por decisión del autor, región o edad). El enlace externo es el plan B.
3. **Spotify puede requerir sesión** para reproducir pistas completas. Sin sesión, o con cookies de terceros bloqueadas, puede sonar solo una vista previa de unos 30 segundos. La app no autentica al usuario.
4. **El autoplay con sonido puede ser bloqueado** por el navegador. Se intenta en YouTube, pero siempre queda el botón de play del proveedor.
5. **Mammoth no reproduce el diseño exacto de Word.** Ignora fuentes, colores, saltos de página y bordes originales de tablas. WebMili aplica sus propios estilos de lectura.
6. **Solo se detectan hipervínculos reales.** Una URL escrita como texto plano no se convierte en enlace en el MVP.
7. **`Escape` no se puede garantizar dentro de un `iframe` cross-origin.** Si el foco está en el reproductor, el botón de cerrar del panel es la vía garantizada.
8. **El documento guardado es local, pero no cifrado.** En un equipo compartido se puede desactivar el guardado o usar "Olvidar documento".
9. **No hay PWA ni caché offline de la app.** El documento guardado se puede releer, pero una carga desde cero necesita conexión para traer los archivos de la app. YouTube/Spotify siempre necesitan conexión.

---

## 6. Arquitectura en una vista

- **Tipo:** web estática, sin backend.
- **Stack:** HTML5, CSS3, JavaScript moderno (módulos ES), sin framework.
- **Build:** ninguno. Las librerías se guardan en `vendor/`.
- **Hito 1:** `app.js` coordina la interfaz y el panel; `docx.js` concentra validación, Mammoth, DOMPurify y post-procesado; `storage.js` guarda preferencias. `links.js`, `media.js` y `ui.js` siguen pendientes.
- **Documento:** Mammoth.js convierte el `.docx` en HTML semántico; DOMPurify lo sanea.
- **Layout:** flexbox; el documento y el panel de medios tienen scroll interno.
- **Animación:** se anima el contenedor externo del panel; el `iframe` mantiene su tamaño final dentro de un contenedor recortado para evitar parpadeos.
- **Medios:** `iframe` de `youtube-nocookie.com` o `open.spotify.com/embed/...`; un solo medio activo.
- **Persistencia:** IndexedDB para el `Blob` del último `.docx` y el scroll; `localStorage` para tema y tamaño de letra.
- **Seguridad:** DOMPurify, protocolos permitidos, URLs de `iframe` construidas solo desde enlaces validados.
- **Accesibilidad:** HTML semántico, `<dialog>` nativo para índice/medios, foco gestionado, `aria-live`, movimiento reducido.

La estructura de archivos, el modelo de estado y los detalles de implementación están en [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md).

---

## 7. Documentación

| Archivo | Contenido |
|---|---|
| [`MEMORY.md`](MEMORY.md) | Este documento: visión, decisiones, estado y reglas para futuras sesiones. |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Historias de usuario, criterios de aceptación, alcance, reglas de enlaces, errores y checklist del MVP. |
| [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md) | Arquitectura, estructura de archivos, estado, animación, seguridad, accesibilidad, pruebas y despliegue. |
| [`ROADMAP.md`](ROADMAP.md) | Hitos de implementación, tareas, entregables y puertas de calidad. |
| [`DECISIONS.md`](DECISIONS.md) | Registro de decisiones (ADR) con contexto y consecuencias. |
| [`RISKS.md`](RISKS.md) | Riesgos técnicos y de producto, limitaciones conocidas y mitigaciones. |

---

## 8. Estado actual y próximo paso

### Hito 0 — implementado y validado (panel de medios)

- Archivos del Hito 0: `index.html`, `css/app.css`, `js/app.js`, `js/theme-init.js`, `assets/favicon.svg` y `README.md`.
- `vendor/` contiene Mammoth.js 1.9.1, DOMPurify 3.2.6 y sus licencias; el Hito 1 ya los carga desde `index.html`.
- El panel de medios se conserva en el código; la validación original usó un documento de ejemplo con dos enlaces multimedia reales, ya retirado de la landing.
- Escritorio en columnas y móvil en filas; panel arriba, documento abajo.
- Apertura y cierre animados; el `iframe` conserva su tamaño final dentro de un contenedor recortado.
- Al cerrar se destruye el `iframe`, se devuelve el foco al enlace y se conserva la posición de lectura.
- Tema claro/oscuro persistido en `webmili:prefs:v1`; `theme-init.js` evita el destello inicial.
- Se respetan `prefers-reduced-motion`, el cierre con `Escape` (cuando el foco está en la app), el enlace externo y los anuncios `aria-live`.
- Validación automatizada en Chrome headless:
  - **51/51** comprobaciones funcionales (apertura, cierre, cambio de medio, foco, scroll, tema, embeds y móvil).
  - **5/5** comprobaciones de persistencia del tema, incluido el fallback al tema del sistema.
  - **39/39** comprobaciones responsive en 320, 390, 768, 900, 1024 y 1440 px.
  - **0** violaciones automáticas de axe-core en cuatro estados (claro/oscuro, escritorio/móvil). Queda la revisión manual del iframe cross-origin y del contraste dentro de contenido recortado.
- El panel sigue en el código, pero los enlaces del `.docx` todavía no lo activan: eso llega con los Hitos 2 y 3.
- No hay `package.json` ni build: es un sitio estático con módulos ES.

### Hito 1 — implementado y validado (lector real)

- Archivos nuevos: `js/docx.js` (validación, Mammoth, DOMPurify y post-procesado), `js/storage.js` (preferencias) y `tests/fixtures/` (documentos ficticios y generador).
- Landing con selector, drag & drop, validación `.docx`/`.doc`/PDF/vacío, aviso por encima de 20 MB y uso del primer archivo cuando llegan varios.
- Mammoth 1.9.1 con `externalFileAccess: false`; DOMPurify 3.2.6 con allowlist; post-procesado solo con APIs del DOM.
- Tablas envueltas en `.table-scroll` con `role="region"` y `tabindex="0"`; imágenes data URI con `loading="lazy"` y `decoding="async"`.
- Encabezados con IDs únicos y `tabindex="-1"`; si un marcador vacío de Word coincide con el título, se reutiliza su ID y se retira el ancla redundante.
- Enlaces externos con `noopener noreferrer`; `mailto:` y `tel:`; internos con scroll y foco; protocolos peligrosos sin `href` y marcados; anclas rotas marcadas.
- Estados de carga, error y documento vacío; tema y tamaño de 16–24 px persistidos en `localStorage`.
- El foco del lector no dibuja un anillo alrededor de todo el panel; el enlace «saltar» apunta al primer encabezado. Cada aviso programa su propia salida.
- Fixtures: `lectura-basica.docx`, `enlaces-peligrosos.docx` y `documento-vacio.docx`; se regeneran con `python tests/fixtures/make_fixtures.py`.
- Validación: **11/11** pruebas Playwright en Chrome headless (landing, estructura, tabla, imagen, enlaces, protocolos peligrosos, ancla rota, vacío, PDF, varios archivos, persistencia, ausencia de subidas, drag & drop real, aviso de 20 MB, teclado y responsive 320/1440). **0** errores de página.
- Capturas revisadas a 1280, 390 y 320 px en tema claro/oscuro, estado vacío y error.
- Las pruebas Playwright viven fuera del repositorio, en `%TEMP%\opencode\webmili-tests`, para no añadir `package.json` ni build.

### Cierre pendiente y próximo paso

- Falta probar la fluidez, el scroll y la lectura en un **móvil real** y en **Safari/Firefox**, además de una prueba de humo con lector de pantalla. La validación actual es Chrome headless con viewports emulados.
- El Hito 1 está terminado en código y pruebas automatizadas; el siguiente paso es el **Hito 2 — navegación y detección**: índice jerárquico, parser puro de YouTube/Spotify, badges y lista de medios.
- **Bloqueo:** no hay aprobación para crear el primer commit de WebMili. El repositorio sigue con **0 commits** y todos los archivos sin trackear. No hacer push ni desplegar.
- No hay preguntas bloqueantes de producto.

### Cómo retomar el trabajo

1. Leer este documento.
2. Leer [`REQUIREMENTS.md`](REQUIREMENTS.md) para el comportamiento esperado.
3. Leer [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md) antes de tocar código.
4. Consultar [`ROADMAP.md`](ROADMAP.md) para saber en qué hito está el trabajo.
5. Revisar [`RISKS.md`](RISKS.md) antes de tomar atajos en embeds, almacenamiento o animación.
6. Actualizar este documento cuando cambie una decisión.

---

## 9. Cuestiones abiertas no bloqueantes

- **Estilo visual:** adoptado en el Hito 0 (interfaz sans-serif del sistema, documento serif Georgia, papel cálido en claro y grafito en oscuro). Puede recibir ajustes finos tras la prueba en dispositivos reales.
- **Destino de publicación:** se eligió web estática, pero no una plataforma concreta (GitHub Pages, Netlify u otra).
- **Dimensiones del panel:** ancho de `clamp(360px, 40vw, 560px)` en escritorio; en móvil, tope del 55 % de la altura útil del workspace (sin la barra superior), de modo que el documento conserve al menos el 45 %. Validado en la matriz responsive; falta confirmarlo en hardware real.
- **Detección automática de errores de embed:** mejora futura; en el MVP el enlace externo siempre está visible.
- **Auto-detección de URLs en texto plano:** mejora futura, fuera del MVP.
- **Pruebas automatizadas del parser:** recomendable; se decide al implementar el Hito 2.
- **Validación real:** falta un móvil físico, Safari, Firefox y una prueba con lector de pantalla para ambos hitos.
- **Pruebas del lector:** los 11 casos Playwright viven fuera del repositorio; los fixtures sí están dentro y deben seguir siendo ficticios y regenerables.

---

## 10. Reglas para futuras sesiones

1. **No prometer ordenación automática de ventanas.** Explicar la limitación y usar el panel integrado.
2. **No añadir backend, cuentas ni analítica** sin cambiar el alcance y este documento.
3. **No cargar YouTube/Spotify hasta que la persona pulse un enlace.**
4. **No insertar HTML de Mammoth sin DOMPurify** ni permitir protocolos peligrosos.
5. **Mantener la interfaz en español.**
6. **No usar CDNs ni fuentes externas**; vendorizar las librerías y usar fuentes del sistema.
7. **No prometer reproducción completa de Spotify ni autoplay garantizado.**
8. **No romper el patrón de un solo medio activo.** El cierre debe destruir el `iframe`.
9. **No cambiar el alcance del MVP sin actualizar** `REQUIREMENTS.md`, `ROADMAP.md` y `MEMORY.md`.
10. **Mantener el panel del Hito 0 como referencia.** Sus pruebas y criterios siguen vigentes; el Hito 3 lo conectará a enlaces reales sin romperlo.
11. **No commitear, hacer push ni desplegar sin aprobación explícita.** El primer commit local también requiere confirmación.
12. **No incorporar documentos personales al repositorio.** Los fixtures deben ser ficticios y regenerables.

---

## 11. Glosario

- **Panel de medios:** zona que aparece al abrir un enlace de YouTube/Spotify.
- **Lector:** vista del `.docx` convertido a HTML semántico.
- **Split:** composición documento + panel; columnas en escritorio, filas en móvil.
- **Embed:** contenido de YouTube/Spotify reproducido dentro de un `iframe`.
- **Fallback:** enlace externo que permite abrir el contenido si el embed falla.
- **TOC / Índice:** lista navegable generada desde los encabezados del documento.
- **Lista de medios:** inventario de enlaces de YouTube/Spotify extraídos del documento.
- **Último documento:** `Blob` del `.docx` guardado localmente para reabrirlo.
- **Posición de lectura:** `scrollTop` del panel del documento.
- **Hito 0:** prototipo técnico de la composición y la animación.

---

## 12. Criterio de éxito del MVP

Una persona puede abrir su `.docx`, pulsar un enlace de YouTube o Spotify, ver el medio aparecer con una transición suave sin salir de la app, seguir leyendo mientras se reproduce, cerrarlo con un botón o `Escape`, y volver exactamente al punto de lectura. Al recargar, encuentra el documento y su posición. Si un embed falla, entiende por qué y puede abrirlo fuera sin perder el contexto.
