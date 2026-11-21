# WebMili — Riesgos y limitaciones

> **Última actualización:** 2026-11-21
> **Estado:** actualizado tras el Hito 0; la validación en hardware real sigue pendiente.
> **Referencias:** [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md) · [`REQUIREMENTS.md`](REQUIREMENTS.md)

---

## 1. Cómo leer este documento

- **Probabilidad / impacto:** Alta, Media, Baja.
- **Estado:** Abierto, Mitigado, Aceptado, Cerrado.
- Los riesgos aceptados son limitaciones conocidas del MVP, no fallos ocultos.
- Cada hito revisa los riesgos relacionados antes de considerarse terminado.

---

## 2. Riesgos técnicos

| ID | Riesgo | Prob. | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|
| R-01 | Un video de YouTube no permite incrustación | Alta | Medio | Enlace externo siempre visible; mensaje claro; no prometer reproducción integrada | Aceptado |
| R-02 | Spotify reproduce solo una vista previa sin sesión o con cookies de terceros bloqueadas | Alta | Medio | Copy honesto; enlace externo; no autenticar; probar ambos estados | Aceptado |
| R-03 | Spotify tiene fallos intermitentes de embed/CSP | Media | Medio | Enlace externo; reintento manual; no depender del embed | Aceptado |
| R-04 | El navegador bloquea el autoplay con sonido | Alta | Bajo | YouTube intenta autoplay; siempre queda el play del proveedor | Aceptado |
| R-05 | El iframe parpadea o se redimensiona durante la animación | Media | Alto | Contenedor interno a tamaño fijo; animar solo el externo; validado en Hito 0 | Mitigado |
| R-06 | El scroll del documento salta al cambiar el ancho | Media | Medio | Anclaje manual del primer bloque visible durante la transición; validado al abrir y cerrar | Mitigado |
| R-07 | Safari iOS tiene problemas con `100dvh`, scroll interno o safe areas | Media | Alto | Probar en dispositivo real; fallback de altura; corregir scroll; no depender de `overflow-anchor` | Abierto |
| R-08 | El panel de Spotify ocupa demasiado en móviles pequeños | Media | Medio | Tope del 55 % de la altura útil; iframe ajustado; validado a 320 y 390 px en Chrome headless | Mitigado |
| R-09 | El reflow continuo del documento durante la animación causa jank | Media | Medio | Animar solo tamaño/opacidad; validado en Chrome headless; falta medir en móvil de gama baja | Abierto |
| R-10 | Mammoth tarda o bloquea con documentos grandes | Media | Alto | Overlay, ceder el hilo, aviso de tamaño; evaluar Worker si es necesario | Abierto |
| R-11 | Las imágenes base64 inflan la memoria en documentos con muchas imágenes | Media | Medio | Aviso de tamaño; no guardar HTML; probar ~20 MB; evaluar límites | Abierto |
| R-12 | IndexedDB se queda sin cuota o el navegador desaloja el registro | Media | Medio | Fallback en memoria; aviso; `navigator.storage.persist()`; borrar registro inválido | Mitigado por diseño |
| R-13 | El documento guardado es sensible en un equipo compartido | Baja | Alto | Toggle "Recordar"; "Olvidar documento"; aviso de almacenamiento local; no cifrar | Aceptado |
| R-14 | DOMPurify elimina imágenes data URI o IDs internos | Media | Medio | Allowlist específica; `ADD_DATA_URI_TAGS`; fixtures de imágenes y anclas | Abierto |
| R-15 | Un enlace malicioso (`javascript:`) se ejecuta | Baja | Alto | DOMPurify + allowlist de protocolos + `noopener`; test de seguridad | Mitigado por diseño |
| R-16 | Una URL de iframe no validada permite cargar contenido arbitrario | Baja | Alto | Construir el `src` solo desde IDs validados; allowlist de hosts | Mitigado por diseño |
| R-17 | `Escape` no cierra el panel porque el foco está dentro del iframe | Alta | Bajo | Botón de cerrar siempre visible; foco inicial en el cierre; documentar | Aceptado |
| R-18 | El orden DOM/visual en móvil confunde a lectores de pantalla | Media | Medio | Documento primero en DOM; foco al cierre al abrir; probar con lector de pantalla | Aceptado |
| R-19 | Los diálogos `<dialog>` se ven o comportan distinto en Safari/Firefox | Media | Bajo | Probar; estilos propios; fallback si fuera necesario | Abierto |
| R-20 | Las librerías vendorizadas quedan desactualizadas o tienen una CVE | Baja | Medio | Registro de versiones; revisión periódica; licencias; actualizar manualmente | Abierto |
| R-21 | Las regresiones pasan desapercibidas | Media | Medio | Pruebas unitarias del parser y preferencias con `node:test`; matriz E2E manual en Chrome | Mitigado |
| R-22 | La app no funciona offline en una carga desde cero | Alta | Bajo | Documentar; PWA fuera del MVP; el documento guardado se puede releer si la app ya está cargada | Aceptado |
| R-23 | Las URLs en texto plano no se detectan | Alta | Bajo | Documentar; mejora futura de auto-link | Aceptado |
| R-24 | Cambios en las políticas de YouTube/Spotify rompen embeds | Baja | Alto | Enlace externo; diseño desacoplado; revisar en pruebas | Aceptado |
| R-25 | El parser de enlaces acepta una URL ambigua o rechaza una válida | Media | Medio | Casos de prueba exhaustivos; fallback a enlace externo | Abierto |

---

## 3. Riesgos de producto y experiencia

| ID | Riesgo | Prob. | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|
| P-01 | La persona espera que el documento se vea exactamente como en Word | Alta | Medio | Comunicar "modo lectura"; estilos claros; no prometer fidelidad | Aceptado |
| P-02 | La persona espera que Spotify reproduzca siempre la canción completa | Alta | Medio | Aviso en la ayuda/README; enlace externo; no prometerlo | Aceptado |
| P-03 | La persona espera que el video se abra en otra ventana | Media | Bajo | La propuesta de panel integrado está explicada; no hay ordenación de ventanas | Aceptado |
| P-04 | La persona quiere leer y escuchar, pero cierra el panel sin querer | Baja | Bajo | Cierre solo con botón/`Escape`; no cerrar al tocar el documento | Mitigado |
| P-05 | El índice no aparece porque el documento no usa estilos de encabezado | Media | Bajo | Estado vacío claro; documentar que se basa en encabezados reales | Aceptado |
| P-06 | La lista de medios no incluye URLs en texto plano | Alta | Bajo | Documentar; mejora futura | Aceptado |
| P-07 | El guardado automático sorprende o preocupa | Media | Medio | Indicador/toggle; "Olvidar"; explicación de privacidad | Mitigado por diseño |
| P-08 | La app se siente pesada en móviles de gama baja | Media | Medio | Animaciones simples; lazy images; medir; limitar panel | Abierto |

---

## 3.1 Validación del Hito 0

**Alcance:** Chrome estable en Windows, modo headless, viewports emulados; sin dispositivo físico ni lector de pantalla.

- **51/51** comprobaciones funcionales: iframe estable durante la animación, cierre que destruye el iframe, foco, `Escape`, cambio de medio, scroll, tema, carga real de embeds y `prefers-reduced-motion`.
- **5/5** comprobaciones de persistencia del tema, incluido el fallback al tema del sistema.
- **39/39** comprobaciones responsive en 320×568, 390×844, 768×1024, 900×800, 1024×768 y 1440×900, sin scroll horizontal.
- **0** violaciones automáticas de axe-core en cuatro estados.
- **Mitigados con evidencia:** R-05 (estabilidad del iframe), R-06 (scroll) y R-08 (tamaño del panel móvil).
- **Siguen abiertos:** R-07 y R-09 por falta de hardware real.
- **Aceptado y documentado:** R-17, porque `Escape` puede quedar capturado dentro del `iframe` cross-origin; el botón Cerrar sigue siendo la vía garantizada.
- **Revisión manual pendiente:** Safari iOS, Firefox, un móvil Android real, contraste dentro de contenido recortado, iframe cross-origin y lector de pantalla.

---

## 4. Limitaciones conocidas del MVP

Estas limitaciones son decisiones conscientes, no bugs pendientes:

1. **No se ordenan ventanas del sistema.** El panel integrado es la solución.
2. **No hay reproducción garantizada de YouTube/Spotify.** El enlace externo es el fallback.
3. **Spotify puede sonar solo 30 s** sin sesión o con cookies de terceros bloqueadas.
4. **El autoplay puede bloquearse.**
5. **Mammoth no reproduce el diseño exacto de Word.** No hay fuentes, colores, saltos de página ni bordes originales.
6. **Solo se detectan hipervínculos reales.** Las URLs en texto plano no se convierten.
7. **No hay PWA ni offline de la app.** El documento guardado se puede releer, pero una carga desde cero requiere conexión.
8. **No hay TTS, biblioteca de documentos, cola, mini-reproductor ni PiP.**
9. **El documento guardado no está cifrado.**
10. **`Escape` puede ser capturado dentro del iframe.**
11. **No se soportan `.doc`, PDF, documentos cifrados o protegidos.**
12. **No hay edición, búsqueda ni anotaciones.**
13. **No hay sincronización entre dispositivos.**
14. **La lista de medios no es una cola de reproducción.**
15. **El panel móvil limita la altura del reproductor de Spotify en pantallas pequeñas.**

---

## 5. Incógnitas abiertas

Estas no bloquean el inicio, pero deben resolverse durante el desarrollo:

- **Rendimiento real de Mammoth con ~20 MB** y muchas imágenes. ¿Basta con overlay o hace falta Worker?
- **Comportamiento de Safari iOS** con `100dvh`, teclado, safe areas y scroll interno.
- **Estabilidad de los embeds de Spotify** en sesiones con y sin login, y con cookies de terceros bloqueadas.
- **Tamaño ideal del panel** en 900–1100 px: ¿el video queda demasiado pequeño?
- **Altura del panel de Spotify** en móviles de 320–390 px de ancho.
- **Compatibilidad de `<dialog>` y animaciones** en Safari/Firefox.
- **Efectividad del anclaje manual de scroll** durante el reflow.
- **Configuración exacta de DOMPurify** para conservar imágenes y anclas internas sin abrir agujeros.
- **Plataforma de despliegue** definitiva.
- **Necesidad de tests automatizados** en el MVP o solo parser + matriz manual.

---

## 6. Disparadores de revisión

Revisar este documento si:

- Se cambia el proveedor de render (Mammoth → otro).
- Se decide añadir PWA, mini-reproductor o PiP.
- Se añade un nuevo proveedor de medios.
- Se cambia el mecanismo de persistencia.
- Se detecta un fallo de seguridad.
- Se cambia el breakpoint o el layout.
- Se recibe feedback repetido sobre el tamaño del panel o la reproducción.
- Se actualiza una librería vendorizada.

---

## 7. Riesgos aceptados y comunicación

Los riesgos **Aceptado** deben comunicarse en el README o en la propia interfaz cuando afecten a la expectativa del usuario:

- YouTube/Spotify pueden no reproducirse integrados.
- Spotify puede requerir sesión.
- El documento se guarda localmente y sin cifrar (si "Recordar" está activo).
- La lectura es semántica, no una copia visual de Word.
- Las URLs en texto plano no se detectan.
- La app no es offline en una carga desde cero.

No ocultar estas limitaciones en el copy de la landing ni en la ayuda.
