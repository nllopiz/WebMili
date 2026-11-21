# WebMili — Registro de decisiones (ADR)

> **Última actualización:** 2026-11-21
> **Estado:** todas las decisiones listadas están aceptadas para el MVP.
> **Referencias:** [`MEMORY.md`](MEMORY.md) · [`REQUIREMENTS.md`](REQUIREMENTS.md) · [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md)

Formato: contexto → decisión → consecuencias. Si una decisión cambia, se añade una nueva ADR que reemplace a la anterior; no se reescribe la historia.

---

## ADR-001 — Panel integrado en lugar de ventanas del sistema

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

La idea original era abrir YouTube/Spotify en una ventana nueva y colocar las dos ventanas en paralelo (horizontal en PC, vertical en móvil).

Los navegadores no permiten posicionar ventanas del sistema de forma fiable. `window.moveTo()` y `resizeTo()` no funcionan en móvil, suelen ignorarse y no existe una API para ordenar dos ventanas. Una ventana abierta con `window.open()` tendría que ser colocada manualmente por la persona.

### Decisión

Implementar un **panel de medios integrado** en la misma pestaña. En escritorio, el documento queda a la izquierda y el medio a la derecha. En móvil, el medio queda arriba y el documento abajo.

### Consecuencias

- La experiencia es consistente en todos los dispositivos.
- La app controla el layout y puede animarlo.
- YouTube/Spotify se cargan en `iframe`, con sus restricciones de embed.
- No se ofrece ordenación automática de ventanas.
- Picture-in-Picture o una ventana flotante quedan como mejoras futuras, no como solución principal.

### Alternativas descartadas

- `window.open()` + `moveTo/resizeTo`: no fiable, especialmente en móvil.
- Instrucciones para que el usuario coloque las ventanas: mala experiencia.
- Extensión de navegador: fuera del alcance.

---

## ADR-002 — Mammoth.js como renderizador del `.docx`

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

Se evaluaron dos enfoques:

- **Mammoth.js:** convierte el `.docx` en HTML semántico limpio; ideal para lectura fluida y responsive.
- **docx-preview:** intenta reproducir el diseño de Word con páginas, estilos y márgenes; puede necesitar zoom o scroll horizontal en un panel estrecho.

El panel de medios reduce el ancho del documento, por lo que un diseño de página fijo sería incómodo.

### Decisión

Usar **Mammoth.js** y aplicar estilos de lectura propios. No se intenta replicar el diseño exacto de Word.

### Consecuencias

- El documento se adapta bien al split y al móvil.
- Se conservan títulos, listas, tablas, imágenes, notas y enlaces, pero no fuentes, colores, saltos de página ni bordes originales.
- Es necesario sanear el HTML porque Mammoth no lo hace.
- Las tablas se estilizan y se envuelven para scroll horizontal.
- No hay vista de impresión fiel.

### Alternativas descartadas

- docx-preview: fidelidad visual a costa de un layout rígido.
- Ambos modos: más desarrollo y pruebas; queda para una mejora futura.

---

## ADR-003 — Web estática, sin backend y sin build

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

El requisito es HTML, CSS y JavaScript sin backend. La app debe ser fácil de publicar y no debe recibir archivos en un servidor.

### Decisión

- Sitio estático de una sola página.
- Vanilla JavaScript con módulos ES.
- Sin framework.
- Sin paso de build.
- Librerías vendorizadas en `vendor/`.
- Publicación en GitHub Pages, Netlify o similar.

### Consecuencias

- No hay dependencias de servidor ni variables de entorno.
- El desarrollo local requiere un servidor estático; los módulos ES no funcionan con `file://`.
- Las librerías se actualizan manualmente.
- No hay renderizado en servidor ni almacenamiento remoto.
- La app puede inspeccionarse y desplegarse fácilmente.

### Alternativas descartadas

- Framework con build: complejidad innecesaria para el alcance.
- CDNs: dependencia externa, latencia y privacidad.
- Backend: contradice el requisito y el principio de privacidad.

---

## ADR-004 — Persistir solo el último documento y su posición

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

La persona quiere retomar la lectura. Guardar múltiples documentos añade interfaz, gestión de cuota y decisiones de privacidad.

### Decisión

Guardar en **IndexedDB** el `Blob` del último `.docx` y el `scrollTop`. Guardar tema, tamaño de letra y "Recordar en este dispositivo" en `localStorage`.

### Consecuencias

- Al recargar se restaura el documento y la posición.
- No hay biblioteca de documentos.
- El archivo se guarda localmente, sin cifrar; se ofrece desactivar el guardado y "Olvidar documento".
- Se manejan cuota y errores; si falla, la app sigue en memoria.
- No se guarda el estado del reproductor.
- No se guarda el HTML renderizado.

### Alternativas descartadas

- Solo memoria: obliga a elegir el archivo en cada visita.
- Biblioteca de recientes: más alcance y más almacenamiento; queda para después.
- File System Access API: permisos inconsistentes entre navegadores.

---

## ADR-005 — Un solo medio activo y destrucción del iframe al cerrar

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

La app debe detener el audio/video al volver al documento. Mantener varios iframes ocultos desperdicia memoria y puede dejar audio en segundo plano. Pausar mediante APIs de terceros es poco fiable entre proveedores.

### Decisión

- Solo un medio activo.
- Al abrir otro, destruir el iframe anterior y crear el nuevo.
- Al cerrar, eliminar el iframe inmediatamente.
- Si se pulsa el enlace activo, no recargar.

### Consecuencias

- El cierre detiene la reproducción de forma fiable.
- No hay reproducción en segundo plano ni mini-reproductor.
- Al reabrir, el medio se carga de nuevo.
- No se necesita integrar las APIs de YouTube/Spotify para pausar.

### Alternativas descartadas

- Mantener el iframe oculto: audio no deseado y fugas.
- IFrame API de ambos proveedores: más complejidad y comportamiento inconsistente.
- Varios medios simultáneos: fuera del alcance.

---

## ADR-006 — Cierre explícito, medio arriba en móvil y sin cierre por clic fuera

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

La persona quiere leer mientras el medio se reproduce. Cerrar al tocar el documento impediría esa convivencia. En móvil, el espacio vertical es limitado y el video debe quedar visible.

### Decisión

- El panel permanece abierto mientras se lee.
- Se cierra con un botón visible y con `Escape` (cuando el foco está en la app).
- Hacer clic en el documento no lo cierra.
- En móvil, el panel se coloca arriba.
- No hay mini-reproductor en el MVP.

### Consecuencias

- Se puede leer y escuchar a la vez.
- El cierre es explícito y predecible.
- En móvil, el documento queda en la mitad inferior.
- La altura del panel está limitada para que el documento siga siendo usable.
- `Escape` no funciona si el foco está dentro del iframe; el botón es la vía garantizada.

### Alternativas descartadas

- Cerrar al tocar el documento: impide la lectura simultánea.
- Mini-reproductor: más desarrollo; queda para después.
- Panel a pantalla completa en móvil: rompe la idea de documento visible.

---

## ADR-007 — Extras del MVP: índice, lista de medios, tema y tamaño de letra

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

La persona seleccionó tres extras además del núcleo. También se aclaró que "Ninguno extra" había sido una selección contradictoria.

### Decisión

Incluir en el MVP:

- Índice de contenidos.
- Lista de medios del documento.
- Tema claro/oscuro.
- Tamaño de letra.

No incluir:

- PWA/offline.
- TTS.
- Auto-detección de URLs en texto plano.
- Biblioteca de documentos.
- Cola de reproducción.

### Consecuencias

- El MVP es más útil para documentos largos.
- La lista de medios no es una cola; solo abre enlaces.
- El alcance sigue siendo controlable.
- Las mejoras excluidas quedan documentadas para después.

---

## ADR-008 — Saneado obligatorio con DOMPurify

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

Mammoth documenta explícitamente que **no sanea** el HTML generado. Un `.docx` puede contener enlaces `javascript:` u otro contenido peligroso. Aunque el archivo sea local, puede haber sido compartido por terceros.

### Decisión

Sanear siempre el HTML con **DOMPurify** antes de insertarlo en el DOM. Después del saneado:

- Permitir solo protocolos `http`, `https`, `mailto`, `tel` e internos.
- Permitir solo imágenes `data:image/...`.
- Construir los iframes solo desde IDs validados de YouTube/Spotify.
- Añadir `noopener noreferrer` a enlaces externos.

### Consecuencias

- Se añade una dependencia vendorizada.
- Hay que ajustar la allowlist para no romper imágenes, IDs internos ni tablas.
- Se necesitan fixtures de seguridad.
- El contenido del documento se trata como no confiable.

### Alternativas descartadas

- Confiar en Mammoth: documentación explícita en contra.
- Sanitizador casero: mayor riesgo.
- Renderizar en un iframe aislado: complica el layout y la integración; no necesario para el MVP.

---

## ADR-009 — Animación del contenedor con iframe de tamaño fijo

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

Animar el ancho/alto del `iframe` durante la apertura provoca reflows del reproductor, parpadeos y saltos. El documento sí debe reflowar para encogerse.

### Decisión

- Animar el contenedor externo del panel (`width`/`height`).
- Mantener el contenido interno y el `iframe` a su tamaño final.
- Recortar el contenido con `overflow: hidden`.
- Al cerrar, eliminar el iframe inmediatamente y animar el contenedor vacío.

### Consecuencias

- El reproductor no se redimensiona durante la transición.
- La animación se siente estable.
- Hay que calcular el tamaño final en JS.
- El iframe se revela como una cortina; el contenido interno puede hacer fade.
- El cierre detiene el audio al instante.

### Alternativas descartadas

- Animar el iframe directamente: parpadeos.
- Cargar el iframe después de la animación: añade latencia.
- Sustituir por una captura del reproductor: no es viable cross-origin.

---

## ADR-010 — Solo hipervínculos reales y proveedores soportados

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

El documento puede contener URLs escritas como texto plano, enlaces a otros proveedores o enlaces internos. Convertir automáticamente texto en enlaces puede falsear el contenido y añade complejidad.

### Decisión

- Detectar solo hipervínculos reales del `.docx`.
- Soportar YouTube y Spotify en las formas documentadas.
- Tratar otros enlaces como externos.
- No auto-detectar URLs en texto plano en el MVP.

### Consecuencias

- El comportamiento es predecible.
- Si el documento tiene URLs sin hipervínculo, no se abrirán en el panel.
- Los enlaces de proveedores no soportados se abren fuera.
- La detección se puede ampliar en el futuro.

### Alternativas descartadas

- Auto-link de texto: riesgo de falsos positivos y más alcance.
- Soportar todos los proveedores: iframes y reglas distintas; fuera del MVP.

---

## ADR-011 — Punto de corte de 900 px, scroll interno y medio arriba en móvil

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

La app necesita una composición clara en escritorio y móvil, sin depender del scroll de la página, para que la animación no mueva toda la interfaz.

### Decisión

- Escritorio a partir de 900 px: columnas, documento izquierda, medio derecha.
- Menos de 900 px: filas, medio arriba, documento abajo.
- La app ocupa `100dvh`; cada panel tiene su propio scroll.
- El panel móvil se limita al 55 % de la altura útil del workspace (sin la barra superior); el documento conserva al menos el 45 %.
- El panel usa `order` para colocarse arriba visualmente; el documento sigue primero en el DOM.

### Consecuencias

- La experiencia es consistente en tablets y móviles.
- No hay scroll del `body`.
- El foco se mueve al cierre al abrir el medio para compensar el orden visual.
- Hay que probar Safari iOS y la barra de direcciones dinámica.

### Alternativas descartadas

- Depender del ancho del dispositivo: menos predecible que el ancho de la ventana.
- Scroll de página: complica la animación y la posición.
- Medio abajo en móvil: el video quedaría fuera de la vista al abrir.

---

## ADR-012 — Privacidad local y terceros solo bajo demanda

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

El documento puede ser personal o sensible. La app no necesita backend ni analítica. YouTube/Spotify son terceros que pueden establecer cookies.

### Decisión

- El archivo se procesa en el navegador y nunca se sube.
- No hay cuentas, analítica ni cookies propias.
- YouTube/Spotify solo se cargan al pulsar un enlace.
- Las librerías y fuentes son locales.
- El último documento se guarda localmente, con opción de desactivarlo y borrarlo.
- Los iframes usan `youtube-nocookie` cuando es posible.

### Consecuencias

- La app funciona sin infraestructura.
- La privacidad depende del navegador y del equipo; el almacenamiento local no está cifrado.
- Se debe explicar al usuario qué se guarda.
- Los embeds de terceros pueden rastrear al reproducirse; se cargan solo por acción del usuario.

### Alternativas descartadas

- Backend con cifrado: contradice el requisito.
- Cargar iframes al inicio: peor privacidad y rendimiento.
- Analítica: no es necesaria.

---

## ADR-013 — Diálogos nativos para índice y lista de medios

**Fecha:** 2026-11-20
**Estado:** Aceptada

### Contexto

El índice y la lista de medios necesitan un contenedor con foco gestionado, cierre por `Escape` y backdrop. Implementar un modal casero añade trabajo de accesibilidad.

### Decisión

Usar el elemento nativo `<dialog>` con `showModal()` para ambos, con estilos propios y retorno de foco al botón que los abrió.

### Consecuencias

- Se obtiene foco atrapado, `Escape` y backdrop de forma nativa.
- Hay que probar el estilo y las animaciones en Safari/Firefox.
- No se reutiliza el mismo diálogo para ambas cosas; cada uno tiene su contenido y su título.
- El panel de medios no es un diálogo modal.

### Alternativas descartadas

- Modal casero: más código y más riesgo de accesibilidad.
- Panel lateral permanente: resta espacio al documento; no necesario.

---

## Resumen

| ADR | Decisión |
|---|---|
| 001 | Panel integrado, no ventanas del sistema |
| 002 | Mammoth, lectura limpia |
| 003 | Web estática, vanilla, sin build |
| 004 | Último documento + scroll en IndexedDB |
| 005 | Un medio activo; iframe destruido al cerrar |
| 006 | Cierre explícito; medio arriba en móvil |
| 007 | Índice, lista de medios, tema y tamaño en el MVP |
| 008 | DOMPurify obligatorio |
| 009 | Animación del contenedor; iframe a tamaño fijo |
| 010 | Solo hipervínculos reales; YouTube/Spotify |
| 011 | Breakpoint 900 px; scroll interno |
| 012 | Privacidad local; terceros bajo demanda |
| 013 | `<dialog>` nativo para índice y medios |
