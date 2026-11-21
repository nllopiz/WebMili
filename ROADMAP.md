# WebMili — Roadmap de implementación

> **Estado:** Hitos 0 y 1 implementados y validados en Chrome headless. Cierre formal de ambos pendiente de prueba manual en dispositivo real.
> **Última actualización:** 2026-11-21
> **Próximo hito:** Hito 2 — navegación y detección.
> **Referencias:** [`REQUIREMENTS.md`](REQUIREMENTS.md) · [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md) · [`RISKS.md`](RISKS.md)

---

## 1. Estrategia

- Construir en **rebanadas verticales**: cada hito deja una versión usable y desplegable.
- Validar primero lo más arriesgado: la convivencia del documento con un `iframe` y la animación del panel.
- No empezar por la persistencia ni por los detalles visuales.
- Cada hito termina con una revisión de accesibilidad, rendimiento y compatibilidad proporcional a lo añadido.
- Actualizar [`MEMORY.md`](MEMORY.md) al cerrar cada hito.

---

## 2. Hito 0 — Prototipo de composición

**Objetivo:** validar la experiencia central antes de construir el lector real.

### Tareas

- [x] Crear el shell estático: barra superior, zona de documento de ejemplo y panel de medios.
- [x] Implementar el layout de escritorio en columnas y el de móvil en filas (medio arriba).
- [x] Insertar un video real de YouTube con `youtube-nocookie` y una tarjeta real de Spotify.
- [x] Implementar la apertura y el cierre del panel con la animación de ~320 ms.
- [x] Mantener el `iframe` a tamaño fijo dentro de un contenedor recortado.
- [x] Implementar el cierre con botón y `Escape`; destruir el `iframe` al cerrar.
- [x] Probar `prefers-reduced-motion`.
- [x] Medir el comportamiento a 320 px, 390 px, 768 px, 900 px, 1024 px y 1440 px.
- [x] Ajustar dimensiones iniciales del panel y el punto de corte (900 px).
- [x] Documentar cualquier ajuste en `MEMORY.md` y `TECHNICAL-PLAN.md`.

### Entregable

Prototipo navegable que demuestra la composición y la animación con contenido real de YouTube/Spotify.

### Criterios de aceptación

- [x] El documento se encoge y el panel aparece sin saltos visibles.
- [x] El `iframe` no se redimensiona ni parpadea durante la animación.
- [x] En móvil el medio queda arriba y el documento abajo, ambos usables.
- [x] El cierre detiene el audio/video.
- [x] `Escape` funciona cuando el foco está en la app.
- [x] No hay scroll horizontal a 320 px.
- [x] La animación se desactiva con movimiento reducido.
- [ ] El prototipo se siente fluido en al menos un móvil real y un escritorio.

**Pendiente para cerrar:** la última casilla requiere una prueba manual fuera de Chrome headless (móvil físico, Safari/Firefox y, deseablemente, lector de pantalla).

### Validación automatizada

- **51/51** comprobaciones funcionales en Chrome headless: apertura, cierre, `Escape`, cambio de medio, foco, scroll, tema, embeds y layouts móviles.
- **5/5** comprobaciones de persistencia del tema, incluido el fallback al tema del sistema.
- **39/39** comprobaciones responsive en 320×568, 390×844, 768×1024, 900×800, 1024×768 y 1440×900.
- **0** violaciones automáticas de axe-core en cuatro estados. Queda la revisión manual del iframe cross-origin.
- Capturas y scripts de prueba fuera del repositorio, en el directorio temporal de validación.

### Riesgo principal

Si la animación no es fluida o el iframe parpadea, se ajusta antes de invertir en el lector. No se avanza al Hito 1 con una base inestable.

---

## 3. Hito 1 — Lector real

**Objetivo:** abrir un `.docx` local y leerlo con una experiencia limpia y segura.

**Historias:** A1, A2, A3, A4, A6; parte de D2 y D3.

**Estado:** implementado y validado automáticamente; cierre formal pendiente de prueba manual en móvil real, Safari/Firefox y lector de pantalla.

### Tareas

- [x] Implementar la landing con selector de archivo y drag & drop.
- [x] Validar `.docx`, tamaño y archivos múltiples.
- [x] Integrar Mammoth vendorizado y convertir el `.docx`.
- [x] Integrar DOMPurify y sanear el HTML antes de insertarlo.
- [x] Renderizar el documento con estilos de lectura.
- [x] Post-procesar tablas, imágenes, encabezados y enlaces.
- [x] Implementar enlaces internos y externos.
- [x] Neutralizar protocolos peligrosos.
- [x] Implementar tema claro/oscuro y tamaño de letra.
- [x] Mostrar estados de carga, error y documento vacío.
- [x] Crear documentos de prueba básicos.
- [x] Verificar que el documento no se sube a ningún servidor.

### Entregable

Lector funcional de `.docx` con estilos, enlaces y preferencias.

### Criterios de aceptación

- [x] Se abre un `.docx` real con títulos, listas, tablas, imágenes y enlaces.
- [x] El documento se ve bien en escritorio y móvil.
- [x] Los enlaces internos y externos funcionan.
- [x] Un enlace `javascript:` no ejecuta código.
- [x] El tema y el tamaño de letra persisten.
- [x] Los errores de archivo son comprensibles.
- [x] La interfaz sigue siendo usable con teclado.

### Validación automatizada

- **11/11** pruebas Playwright en Chrome headless: landing, apertura, estructura, tabla, imagen, enlaces, `javascript:`/`data:`, ancla rota, documento vacío, PDF, varios archivos, persistencia, ausencia de subidas, drag & drop real, aviso de 20 MB, teclado y responsive a 320/1440 px.
- **0** errores de página durante las pruebas.
- Capturas revisadas a 1280, 390 y 320 px en tema claro, oscuro, estado vacío y error.
- Los fixtures son ficticios y se regeneran con `tests/fixtures/make_fixtures.py`.
- Las pruebas Playwright viven fuera del repositorio para no añadir build ni dependencias.

**Pendiente para cerrar:** prueba manual en móvil real, Safari/Firefox y lector de pantalla. El criterio de escritorio/móvil está validado en viewports emulados, no en hardware real.

---

## 4. Hito 2 — Navegación y detección

**Objetivo:** permitir saltar por el documento y descubrir todos sus medios.

**Historias:** A7, B1, B4.

### Tareas

- [x] Asignar IDs únicos a los encabezados durante el post-procesado.
- [x] Construir el índice jerárquico.
- [x] Implementar el diálogo del índice con foco y `Escape`.
- [x] Implementar el parser puro de YouTube/Spotify.
- [x] Añadir badges y estados visuales a los enlaces multimedia.
- [x] Extraer y deduplicar los enlaces para la lista de medios.
- [x] Implementar el diálogo de la lista de medios.
- [x] Mostrar estados vacíos.
- [x] Añadir pruebas del parser con `node:test`.
- [x] Cubrir timestamps, playlists, idiomas de Spotify y enlaces inválidos.

### Entregable

Documento navegable con índice y lista de medios; enlaces multimedia reconocidos, aunque todavía sin reproductor real.

### Criterios de aceptación

- [x] El índice refleja los encabezados y navega al punto correcto.
- [x] La lista de medios conserva el orden y deduplica.
- [x] Los enlaces multimedia se distinguen visualmente.
- [x] Los timestamps de YouTube se interpretan bien.
- [x] Los enlaces no soportados se tratan como externos.
- [x] Los estados vacíos son claros.
- [x] Los diálogos son accesibles.

---

## 5. Hito 3 — Reproductor y composición completa

**Objetivo:** conectar los enlaces multimedia con el panel y cerrar la experiencia central.

**Historias:** B2, B3, C1, C2, C3, C4; refuerzo de D1.

### Tareas

- [x] Integrar el panel de medios del prototipo con los enlaces reales.
- [x] Construir URLs de embed de YouTube y Spotify.
- [x] Crear y destruir iframes correctamente.
- [x] Implementar el header del panel, el enlace externo y el esqueleto de carga.
- [x] Implementar la sustitución de un medio por otro sin repetir la animación.
- [x] Implementar el cierre que detiene el audio/video.
- [x] Gestionar foco, `aria-expanded` y anuncios.
- [x] Conservar el scroll al abrir/cerrar.
- [x] Implementar el fallback sin conexión y el enlace externo.
- [x] Recalcular layout en resize y rotación.
- [ ] Probar YouTube normal, shorts, directo, playlist y embed bloqueado.
- [ ] Probar Spotify track, episodio, álbum, playlist, show y artista.
- [ ] Probar Spotify con y sin sesión.
- [ ] Verificar que no se carga ningún iframe al inicio.
- [ ] Verificar que no queda audio al cerrar.

### Entregable

Experiencia central completa: leer, abrir medios, seguir leyendo, cerrar y volver.

### Criterios de aceptación

- [x] Un enlace de YouTube o Spotify abre el panel con animación.
- [x] Solo hay un medio activo.
- [ ] El iframe no parpadea al abrir/cerrar. Pendiente de hardware real.
- [x] El cierre detiene la reproducción eliminando el iframe.
- [x] El foco vuelve al enlace.
- [x] El documento conserva la posición de lectura.
- [x] El layout cambia correctamente entre escritorio y móvil.
- [x] El enlace externo está siempre disponible.
- [x] La app sigue siendo usable con teclado.
- [x] `prefers-reduced-motion` funciona.
- [ ] No hay fugas al abrir/cerrar repetidamente. Pendiente de matriz repetida.

---

## 6. Hito 4 — Persistencia, calidad y entrega

**Objetivo:** convertir el prototipo funcional en un MVP publicable.

**Historias:** A5, D1, D2, D3, D4.

### Tareas

- [x] Implementar IndexedDB para el último documento y el scroll.
- [x] Restaurar documento y posición al recargar.
- [x] Implementar "Recordar en este dispositivo" y "Olvidar documento".
- [x] Manejar cuota, errores de almacenamiento y documentos ilegibles.
- [x] Solicitar almacenamiento persistente si está disponible.
- [x] Revisar accesibilidad básica: teclado, foco, diálogos, iframes y movimiento reducido.
- [ ] Probar con lector de pantalla.
- [x] Revisar seguridad básica: DOMPurify, protocolos, imágenes e iframes.
- [ ] Probar documentos grandes y fugas de memoria.
- [ ] Probar en Chrome, Edge, Firefox, Safari, iOS y Android.
- [x] Crear README con uso, despliegue, limitaciones y licencias.
- [x] Desplegar en GitHub Pages.
- [ ] Completar el checklist de aceptación final del MVP.

### Entregable

MVP desplegado y documentado.

### Criterios de aceptación

- [x] El documento y el scroll se restauran al recargar.
- [x] "Olvidar documento" borra el almacenamiento y vuelve al inicio.
- [ ] La app funciona con teclado y lector de pantalla en los flujos principales.
- [x] No hay errores de consola en los flujos normales locales probados.
- [ ] Un documento de ~20 MB se abre o falla de forma controlada.
- [x] No quedan iframes al cerrar o cambiar de medio.
- [x] La app funciona desde una URL estática.
- [ ] El checklist del MVP está completo.

---

## 7. Definición de terminado global

Una historia se considera terminada cuando:

- [ ] Cumple sus criterios de aceptación.
- [ ] Funciona en escritorio y móvil.
- [ ] Se puede usar con teclado.
- [ ] Respeta `prefers-reduced-motion`.
- [ ] No introduce peticiones de red no previstas.
- [ ] No inserta HTML sin sanear.
- [ ] No deja errores de consola en el flujo normal.
- [ ] Está documentada si cambia una decisión.
- [ ] Se probó con al menos un documento real.
- [ ] No rompe hitos anteriores.

Para el MVP completo, además:

- [ ] Checklist de [`REQUIREMENTS.md`](REQUIREMENTS.md#15-checklist-de-aceptación-del-mvp) completo.
- [ ] Revisión de [`RISKS.md`](RISKS.md) con estados actualizados.
- [ ] README y licencias incluidos.
- [ ] Despliegue estático funcionando.
- [ ] [`MEMORY.md`](MEMORY.md) actualizado con el estado final.

---

## 8. Puertas de calidad por hito

### Hito 0

- Animación fluida y sin parpadeo del iframe.
- Móvil y escritorio.
- Cierre detiene el medio.

### Hito 1

- Documento real renderizado.
- Sanitización efectiva.
- Enlaces correctos.
- Sin subida de archivos.

### Hito 2

- Parser correcto para todos los formatos.
- Índice y lista accesibles.
- Estados vacíos.

### Hito 3

- Ciclo de vida de iframes impecable.
- Foco y scroll estables.
- Fallback claro.
- Responsive completo.

### Hito 4

- Persistencia robusta.
- A11y y seguridad revisadas.
- Rendimiento aceptable.
- Despliegue y documentación.

---

## 9. Después del MVP

Orden sugerido, sujeto a uso real:

1. Pruebas automatizadas del parser y de flujos críticos.
2. Detección de errores de YouTube con la IFrame API.
3. PWA instalable y caché offline de la app.
4. Auto-detección de URLs en texto plano.
5. Mini-reproductor para seguir escuchando mientras se lee a ancho completo.
6. Divisor arrastrable y modo 50/50.
7. Picture-in-Picture / Document Picture-in-Picture.
8. TTS.
9. Biblioteca de documentos recientes.
10. Cola de reproducción.
11. Búsqueda y anotaciones.
12. Títulos de medios vía oEmbed.
13. CSP estricta probada con embeds.

Cualquier mejora que cambie el alcance debe pasar por `REQUIREMENTS.md`, `DECISIONS.md` y `MEMORY.md`.

---

## 10. Registro de avance

| Fecha | Hito | Estado | Notas |
|---|---|---|---|
| 2026-11-20 | Planificación | Completada | Requisitos, arquitectura, decisiones y riesgos documentados |
| 2026-11-21 | Hito 0 | Implementado; cierre manual pendiente | Prototipo, 51/51 funcionales, 5/5 preferencias, 39/39 responsive y 0 violaciones axe |
| — | Hito 1 | Pendiente | |
| — | Hito 2 | Pendiente | |
| — | Hito 3 | Pendiente | |
| — | Hito 4 | Pendiente | |
