# WebMili — Requisitos

> **Estado:** cerrado para el MVP.
> **Última actualización:** 2026-11-21
> **Documento de entrada:** [`MEMORY.md`](MEMORY.md)
> **Plan técnico:** [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md)

---

## 1. Visión

WebMili es un lector local de documentos `.docx` que integra la reproducción de enlaces de YouTube y Spotify en un panel dentro de la misma página. El objetivo es evitar el cambio constante de pestañas y mantener el contexto de lectura cuando el documento incluye material audiovisual.

La app es estática, sin backend, sin cuentas y sin subida de archivos. El documento se procesa y se guarda (opcionalmente) solo en el navegador.

---

## 2. Objetivos y no objetivos

### Objetivos

- Abrir un `.docx` local de forma fiable y privada.
- Ofrecer una lectura cómoda, semántica y responsive.
- Detectar enlaces de YouTube y Spotify y reproducirlos sin salir de la app.
- Mantener el documento visible y utilizable mientras se reproduce el medio.
- Ofrecer una transición suave, comprensible y accesible entre los estados.
- Permitir volver al documento y detener el medio de forma inequívoca.
- Recordar el último documento y la posición de lectura.
- Funcionar como web estática en navegadores modernos.

### No objetivos

- Editar, anotar o convertir el `.docx` a otro formato.
- Reproducir el diseño exacto de Word.
- Ser un reproductor de música o video con biblioteca propia.
- Autenticar usuarios en YouTube/Spotify ni saltarse sus restricciones.
- Sincronizar documentos entre dispositivos.
- Funcionar como PWA instalable en el MVP.
- Abrir o colocar ventanas del sistema automáticamente.

---

## 3. Persona y casos de uso

### Persona principal

Una persona que recibe un `.docx` con enlaces a videos, listas de reproducción o pistas de audio y quiere leerlo mientras consume ese material, sin perder el hilo ni la posición.

### Casos de uso

1. **Apuntes con videos:** un documento de estudio enlaza a clases de YouTube; la persona abre un video mientras sigue leyendo el tema.
2. **Guía con música:** un documento de recetas, ejercicios o meditación enlaza a listas de Spotify; la persona pone la lista y sigue leyendo.
3. **Material compartido:** alguien envía un `.docx` con recursos; la persona lo abre en el navegador sin subirlo a un servicio.
4. **Lectura recurrente:** la persona cierra el navegador y, al volver, retoma el mismo documento en el mismo punto.

---

## 4. Decisiones de producto cerradas

| Tema | Decisión |
|---|---|
| Composición | Panel integrado; no ventanas del sistema |
| Móvil | Medio arriba, documento abajo |
| Render | Mammoth.js, lectura limpia |
| Persistencia | Último documento + scroll en IndexedDB; preferencias en `localStorage` |
| Extras | Índice, lista de medios, tema y tamaño de letra |
| Publicación | Web estática |
| Cierre | Botón + `Escape`; el cierre detiene el medio |
| Medios | Un solo medio activo |
| Seguridad | DOMPurify + protocolos permitidos + URLs de iframe validadas |

Las razones están en [`DECISIONS.md`](DECISIONS.md).

---

## 5. Alcance

### 5.1 Entra en el MVP

- Carga local de `.docx`.
- Render semántico y estilos de lectura.
- Enlaces internos, externos y multimedia.
- Panel de YouTube/Spotify con apertura y cierre animados.
- Composición responsive.
- Índice de contenidos.
- Lista de medios.
- Tema claro/oscuro.
- Tamaño de letra.
- Persistencia del último documento y scroll.
- Enlace externo de fallback.
- Accesibilidad básica y movimiento reducido.
- Manejo de errores y saneado de contenido.

### 5.2 Fuera del MVP

- PWA/offline instalable.
- TTS.
- Auto-detección de URLs en texto plano.
- Varios documentos en una biblioteca.
- Cola de reproducción.
- Mini-reproductor.
- Picture-in-Picture o ventana flotante.
- Ordenación automática de ventanas.
- `.doc`, PDF, documentos cifrados.
- Edición, búsqueda, anotaciones.
- Cuentas, sincronización, analítica.
- Divisor arrastrable.
- Pantalla completa propia.

---

## 6. Historias de usuario y criterios de aceptación

Prioridad: **Must** para todo lo listado. Los identificadores se usan en el roadmap y en el plan técnico.

### Épica A — Documento

#### A1 · Cargar un `.docx` local

**Como** lector/a, **quiero** elegir o arrastrar un `.docx` y verlo en la app, **para** leerlo sin subirlo a ningún servidor.

**Criterios de aceptación:**

- Hay un selector de archivo y una zona de arrastrar y soltar.
- Se aceptan archivos `.docx`; se rechazan `.doc`, PDF y otros formatos con un mensaje claro.
- Se puede cargar un archivo desde el selector o soltándolo sobre la ventana.
- Si se sueltan varios archivos, se usa el primero y se informa.
- El archivo se procesa localmente; no se realiza ninguna petición de subida.
- Se muestra un estado de carga mientras se procesa.
- Si el archivo está corrupto, vacío o protegido, se muestra un error comprensible y se permite elegir otro.
- Un archivo nuevo reemplaza al anterior; si había un medio abierto, se cierra y se detiene.
- El nombre del archivo se muestra en la barra superior.
- El tamaño del archivo no tiene un límite duro, pero se avisa a partir de ~20 MB de que puede tardar.

#### A2 · Render de lectura

**Como** lector/a, **quiero** ver el contenido del documento con una jerarquía clara, **para** leerlo cómodamente en cualquier pantalla.

**Criterios de aceptación:**

- Se renderizan títulos (`h1`–`h6`), párrafos, listas ordenadas y no ordenadas, negritas, cursivas, subrayados, tachados, superíndices, subíndices, citas, saltos de línea, tablas, imágenes y notas al pie si Mammoth las soporta.
- Las tablas se adaptan al ancho y tienen scroll horizontal cuando no caben.
- Las imágenes se ajustan al ancho del documento, conservan su proporción y usan `loading="lazy"` y `decoding="async"`.
- El HTML generado por Mammoth se sanea antes de insertarse en el DOM.
- Se aplican estilos de lectura propios; no se intenta replicar el diseño exacto de Word.
- El documento conserva el orden lógico y los encabezados originales.
- Los enlaces del documento siguen siendo clicables después del render.
- Las advertencias de conversión no bloquean la lectura; se registran en consola para diagnóstico.

#### A3 · Enlaces del documento

**Como** lector/a, **quiero** que los enlaces funcionen según su tipo, **para** navegar sin comportamientos inesperados.

**Criterios de aceptación:**

- Los enlaces internos (`#ancla`) desplazan el documento al destino dentro de la app.
- Los enlaces externos que no son multimedia abren una pestaña nueva con `target="_blank"` y `rel="noopener noreferrer"`.
- Los enlaces `mailto:` y `tel:` se dejan al comportamiento del navegador.
- Los protocolos no permitidos (`javascript:`, `data:` en enlaces, etc.) se neutralizan.
- Un clic con `Ctrl/Cmd`, `Shift` o `Alt`, o con el botón central, respeta la apertura nativa en otra pestaña y no se intercepta.
- Los enlaces multimedia se marcan visualmente y se gestionan en el panel (ver B1/B2).
- Un enlace interno roto no rompe la app; no hace nada o muestra un aviso discreto.

#### A4 · Privacidad

**Como** lector/a, **quiero** que mi documento no salga de mi dispositivo, **para** leer material personal con tranquilidad.

**Criterios de aceptación:**

- No hay backend, cuentas, cookies propias, analítica ni rastreo.
- El archivo no se sube a ningún servidor.
- No se usan CDNs ni fuentes externas para la app.
- YouTube y Spotify solo se cargan cuando la persona pulsa un enlace multimedia.
- La app explica de forma breve que el documento se procesa localmente.
- Si se guarda el último documento, se indica que es almacenamiento local y se puede borrar.
- Los iframes usan `youtube-nocookie.com` cuando el proveedor lo permite.

#### A5 · Persistencia del último documento y posición

**Como** lector/a recurrente, **quiero** retomar mi documento donde lo dejé, **para** no empezar de cero cada vez.

**Criterios de aceptación:**

- Si "Recordar en este dispositivo" está activo (por defecto), se guarda el `Blob` del último `.docx` y el `scrollTop` del documento en IndexedDB.
- Al recargar la app, se restaura el documento y la posición de lectura.
- La restauración del scroll ocurre después de insertar el contenido y de que las imágenes estén decodificadas, para evitar saltos.
- La posición se guarda con debounce (aprox. 300 ms) y se fuerza al ocultar/cerrar la página.
- Se puede desactivar "Recordar en este dispositivo"; al desactivarlo se borra el registro guardado.
- "Olvidar documento" borra el registro local, cierra el medio, vuelve a la pantalla inicial y muestra un aviso.
- Si la cuota de almacenamiento se agota, la app sigue funcionando en memoria y avisa de que no podrá recordar el documento.
- Si el documento guardado ya no se puede leer, se borra el registro y se muestra un error con opción de elegir otro.
- No se guarda el estado del reproductor: al recargar, el panel de medios empieza cerrado.
- No se guarda el HTML renderizado; se regenera desde el `Blob`.
- Se puede solicitar almacenamiento persistente al navegador para reducir el riesgo de desalojo.

#### A6 · Tema y tamaño de letra

**Como** lector/a, **quiero** ajustar el tema y el tamaño del texto, **para** leer con comodidad.

**Criterios de aceptación:**

- Hay tema claro y oscuro; el tema inicial sigue la preferencia del sistema.
- El cambio de tema es inmediato y se aplica a la interfaz, al documento y a los estados vacíos.
- Hay controles para aumentar y disminuir el tamaño del texto del documento entre 16 y 24 px.
- El tamaño por defecto es 18 px.
- Tema y tamaño se guardan en `localStorage` y se restauran al recargar.
- El contraste del texto y los controles cumple AA en ambos temas.
- El cambio de tamaño no afecta a la barra superior ni a los diálogos.
- Al llegar a los límites, los botones se deshabilitan o no hacen nada.

#### A7 · Índice de contenidos

**Como** lector/a, **quiero** un índice del documento, **para** saltar a las secciones sin desplazarme manualmente.

**Criterios de aceptación:**

- Se genera un índice a partir de los encabezados `h1`–`h6` del documento renderizado.
- Se asignan IDs únicos a los encabezados para poder enlazarlos.
- El índice se abre desde un botón de la barra superior.
- Se muestra en un diálogo lateral o panel con scroll propio.
- Al pulsar un elemento, se cierra el diálogo, se desplaza el documento al encabezado y se mueve el foco al encabezado.
- El índice respeta la jerarquía visual de niveles.
- Si no hay encabezados, muestra un estado vacío claro.
- Es navegable por teclado y se cierra con `Escape`.
- Si el medio está abierto, abrir el índice no lo detiene.

---

### Épica B — Medios

#### B1 · Detección de enlaces de YouTube y Spotify

**Como** lector/a, **quiero** que los enlaces multimedia se reconozcan y se distingan, **para** saber que se abrirán dentro de la app.

**Criterios de aceptación:**

- Se reconocen estas formas de YouTube:
  - `https://www.youtube.com/watch?v=ID`
  - `https://youtu.be/ID`
  - `https://www.youtube.com/shorts/ID`
  - `https://www.youtube.com/live/ID`
  - `https://www.youtube.com/embed/ID`
  - `https://music.youtube.com/watch?v=ID`
  - `https://www.youtube.com/playlist?list=ID`
- Se reconocen estas formas de Spotify:
  - `https://open.spotify.com/track/ID`
  - `https://open.spotify.com/album/ID`
  - `https://open.spotify.com/playlist/ID`
  - `https://open.spotify.com/episode/ID`
  - `https://open.spotify.com/show/ID`
  - `https://open.spotify.com/artist/ID`
  - Variantes con prefijo de idioma, por ejemplo `/intl-es/...`.
- Se respetan los parámetros de tiempo de YouTube `t` y `start`, en formatos como `90`, `90s`, `1m30s` o `1h2m3s`.
- Se ignoran parámetros de seguimiento como `si` o `utm_*`.
- Los enlaces multimedia se marcan con un icono o badge del proveedor y un nombre accesible.
- El enlace activo se resalta mientras su medio está abierto.
- Solo se procesan hipervínculos reales del `.docx`; las URLs en texto plano no se detectan en el MVP.
- Un enlace que no se puede parsear se trata como enlace externo normal.
- Los enlaces multimedia respetan los modificadores de teclado igual que los externos.

#### B2 · Panel de reproducción integrado

**Como** lector/a, **quiero** ver el video o audio dentro de la app, **para** no perder el contexto del documento.

**Criterios de aceptación:**

- Al pulsar un enlace multimedia, se evita la navegación y se abre el panel de medios.
- Solo hay un medio activo a la vez.
- Si se abre otro enlace, se destruye el `iframe` anterior y se crea el nuevo.
- Si se pulsa el enlace que ya está activo, no se recarga el medio; se mantiene el panel y se enfoca el botón de cerrar.
- El `iframe` se crea solo al abrir el medio, nunca al cargar la app.
- YouTube se muestra en 16:9 con `https://www.youtube-nocookie.com/embed/...`.
- Las playlists de YouTube se muestran con `videoseries?list=...`.
- Spotify se muestra con `https://open.spotify.com/embed/{tipo}/{id}` y una altura adecuada al tipo:
  - pista: 152 px;
  - episodio: 232 px;
  - álbum, playlist, show o artista: 352 px.
- El `iframe` de YouTube incluye `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"` y `allowfullscreen`.
- El `iframe` de Spotify incluye `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"`; `encrypted-media` es imprescindible para la reproducción completa.
- YouTube intenta autoplay; Spotify no fuerza autoplay y espera la pulsación del usuario.
- El panel muestra el proveedor, una etiqueta del enlace, el botón de cerrar y un enlace externo "Abrir en YouTube/Spotify".
- Mientras carga el `iframe`, se muestra un esqueleto o estado de carga; el contenido aparece con un fade breve.
- El panel no tapa por completo el documento en escritorio; en móvil, el documento queda visible debajo.
- El `iframe` se elimina al cerrar o al cambiar de documento, lo que detiene el audio/video.
- No se usan APIs de YouTube/Spotify para obtener títulos ni metadatos; la etiqueta sale del texto del enlace.

#### B3 · Fallback y falta de conexión

**Como** lector/a, **quiero** un plan B cuando el reproductor no funciona, **para** no quedarme bloqueado.

**Criterios de aceptación:**

- El enlace "Abrir en YouTube/Spotify" está siempre visible en el panel, aunque el embed cargue correctamente.
- Si `navigator.onLine` es `false`, se muestra un aviso de que el documento sigue disponible pero el medio necesita conexión.
- Si el `iframe` no carga en un tiempo razonable, se mantiene visible el enlace externo y se muestra una pista discreta.
- Si YouTube muestra su propio error de reproducción, el enlace externo sigue disponible.
- El documento nunca deja de ser usable por un fallo del medio.
- No se promete detección automática de todos los errores de embed en el MVP.

#### B4 · Lista de medios del documento

**Como** lector/a, **quiero** ver todos los enlaces multimedia del documento, **para** abrirlos sin buscarlos en el texto.

**Criterios de aceptación:**

- Se extraen los enlaces de YouTube/Spotify después del render.
- La lista conserva el orden de aparición en el documento.
- Se deduplica por proveedor, tipo e ID; se conserva la primera etiqueta y el primer tiempo.
- Cada elemento muestra proveedor, tipo y etiqueta (o una etiqueta generada si el texto del enlace está vacío).
- El botón "Medios" muestra el número de enlaces únicos.
- Al pulsar un elemento, se cierra el diálogo y se abre el panel con ese medio.
- Si no hay enlaces, se muestra un estado vacío.
- La lista es navegable por teclado y se cierra con `Escape`.
- Abrir la lista no detiene el medio que ya esté sonando.
- La lista no reproduce en cadena ni funciona como cola.

---

### Épica C — Composición y movimiento

#### C1 · Composición responsive

**Como** lector/a, **quiero** que el documento y el medio se acomoden a mi pantalla, **para** leer y ver el contenido con comodidad.

**Criterios de aceptación:**

- La app ocupa el alto del viewport (`100dvh`, con fallback a `100vh`) y no usa el scroll del `body`.
- En escritorio (ancho ≥ 900 px), el documento queda a la izquierda y el panel de medios a la derecha, con scroll interno en cada zona.
- En móvil (ancho < 900 px), el medio queda arriba y el documento abajo, también con scroll interno.
- El documento conserva al menos el 45 % de la altura útil en móvil cuando el medio está abierto.
- El panel de medios de escritorio tiene un ancho inicial de `clamp(360px, 40vw, 560px)`.
- La altura del panel en móvil se calcula según el tipo de medio y se limita al 55 % de la altura útil del workspace (sin la barra superior).
- Al abrir un medio se conserva la posición de lectura del documento; al cerrarlo también.
- La composición se recalcula al cambiar el tamaño de la ventana o la orientación, sin recargar el `iframe`.
- A 320 px de ancho no hay scroll horizontal de la interfaz.
- La barra superior sigue visible y utilizable en ambos layouts.

#### C2 · Animación de apertura y cierre

**Como** lector/a, **quiero** que el cambio entre documento y medio sea suave, **para** no perder la sensación de continuidad.

**Criterios de aceptación:**

- Al abrir, el documento se encoge y el panel de medios se revela con una transición de ~320 ms y una curva de salida suave.
- El contenido del panel aparece con un fade/slide breve, no con un salto.
- Al cerrar, la animación es inversa y el documento recupera su tamaño.
- El `iframe` se mantiene a su tamaño final dentro de un contenedor recortado; no se redimensiona durante la animación para evitar parpadeos.
- No hay animación en la carga inicial de la app.
- Si el usuario cambia el tamaño de la ventana mientras el panel está abierto, las transiciones se desactivan durante el recálculo.
- Si se cambia de medio con el panel abierto, no se repite la animación de apertura; solo se sustituye el contenido.
- Se respeta `prefers-reduced-motion`: la apertura y el cierre son instantáneos, sin fade ni desplazamiento.
- La animación no bloquea la interacción con el documento más de lo necesario.
- El foco y la posición de lectura se restauran al terminar.

#### C3 · Cierre, pausa y foco

**Como** lector/a, **quiero** volver al documento de forma clara, **para** detener el medio y seguir leyendo donde estaba.

**Criterios de aceptación:**

- El panel tiene un botón de cerrar siempre visible, con etiqueta accesible.
- `Escape` cierra el panel cuando el foco está en la app (fuera del `iframe`). Si el foco está dentro del reproductor, el navegador puede capturarlo; el botón de cerrar sigue siendo la vía garantizada.
- Al cerrar, el `iframe` se elimina inmediatamente, de modo que el audio/video se detiene.
- El foco vuelve al enlace que abrió el medio o, si ya no existe, al botón "Medios".
- El enlace activo pierde el estado de resaltado y `aria-expanded` vuelve a `false`.
- La posición de lectura del documento se conserva.
- Se anuncia el cambio con una región `aria-live` ("Reproductor de YouTube abierto" / "Reproductor cerrado").
- Hacer clic en el documento no cierra el medio.
- Cerrar el panel no borra el documento ni la posición guardada.

#### C4 · Cambio de tamaño y orientación

**Como** lector/a, **quiero** que el medio y el documento sigan funcionando al girar el móvil o redimensionar la ventana, **para** no perder lo que estaba viendo.

**Criterios de aceptación:**

- Al cambiar de orientación o tamaño, el medio sigue cargado y el documento conserva su posición.
- Si se cruza el punto de corte de 900 px, la composición cambia de columnas a filas o viceversa sin recargar el `iframe`.
- Las dimensiones del panel se recalculan y se aplican sin animación.
- El botón de cerrar y los controles siguen accesibles.
- No aparecen scrolls horizontales en la interfaz.
- Si el viewport se hace muy bajo, el panel se limita y el documento conserva espacio utilizable.

---

### Épica D — Calidad

#### D1 · Accesibilidad

**Como** lector/a con necesidades de accesibilidad, **quiero** usar la app con teclado y lector de pantalla, **para** leer y reproducir medios sin barreras.

**Criterios de aceptación:**

- Objetivo WCAG 2.1 AA en los criterios aplicables a la interfaz.
- Todos los controles son accesibles por teclado y tienen foco visible.
- Hay un enlace "Saltar al documento" al inicio.
- El documento usa HTML semántico y conserva la jerarquía de encabezados.
- Los diálogos usan `<dialog>` nativo o una gestión de foco equivalente, con cierre por `Escape` y retorno de foco.
- Los `iframe` tienen un `title` descriptivo.
- Los enlaces multimedia tienen un nombre accesible que incluye el proveedor.
- Los cambios de estado se anuncian con `aria-live` cuando corresponde.
- Los botones tienen etiquetas accesibles y áreas táctiles de al menos 44 × 44 px.
- El contraste de texto y controles cumple AA en ambos temas.
- La información no depende solo del color.
- Se respeta `prefers-reduced-motion`.
- El panel de medios no es modal: el documento sigue siendo accesible.
- El orden de tabulación es lógico. En móvil, el panel se coloca visualmente arriba con CSS, pero el documento sigue primero en el DOM; al abrir el medio, el foco se mueve al botón de cerrar para evitar desorientación.

#### D2 · Errores y seguridad

**Como** lector/a, **quiero** que la app falle de forma clara y segura, **para** saber qué hacer y no ejecutar contenido peligroso.

**Criterios de aceptación:**

- Los errores de archivo, almacenamiento, conexión y embed tienen mensajes en español y una acción de recuperación.
- El HTML de Mammoth se sanea con DOMPurify antes de insertarse.
- Se bloquean `javascript:`, `data:` en enlaces y otros protocolos no permitidos.
- Los enlaces externos usan `rel="noopener noreferrer"`.
- Las imágenes solo se aceptan como `data:image/...` generadas por Mammoth; no se permiten cargas externas no controladas.
- Los `iframe` se construyen solo a partir de URLs validadas de YouTube/Spotify; nunca se inserta un `src` arbitrario.
- No se usa `eval`, `new Function` ni HTML sin sanear.
- `externalFileAccess` de Mammoth permanece desactivado.
- No se habilitan scripts ni manejadores de eventos inline.
- El documento guardado es local y se puede borrar; la app lo explica.
- Se registran en consola los mensajes de conversión de Mammoth para diagnóstico, sin bloquear al usuario.
- Un enlace malicioso o desconocido no ejecuta código ni rompe la app.

#### D3 · Rendimiento

**Como** lector/a, **quiero** que la app responda con documentos normales y grandes, **para** no quedarme esperando frente a una pantalla congelada.

**Criterios de aceptación:**

- Antes de convertir un `.docx`, se muestra un estado de carga y se cede el hilo para que la interfaz pinte.
- Un documento de referencia de ~20 MB se abre o muestra un error en un tiempo razonable; no deja la interfaz bloqueada de forma permanente.
- Las imágenes usan carga diferida y decodificación asíncrona.
- El scroll del documento se guarda con debounce, no en cada evento.
- Abrir y cerrar el panel de medios repetidamente no deja `iframe`, listeners ni timers acumulados.
- La extracción de encabezados y enlaces se hace en una sola pasada sobre el DOM renderizado.
- La animación no usa propiedades costosas más allá de ancho, alto y opacidad.
- Si un documento grande bloquea la interfaz de forma perceptible, se evaluará mover Mammoth a un Worker en una mejora posterior.

#### D4 · Compatibilidad y entrega

**Como** responsable del proyecto, **quiero** que la app funcione en navegadores modernos y se pueda publicar fácilmente, **para** compartirla sin infraestructura.

**Criterios de aceptación:**

- Funciona en las últimas dos versiones estables de Chrome, Edge, Firefox y Safari de escritorio.
- Funciona en iOS Safari y Android Chrome actuales.
- No se soporta Internet Explorer.
- Se publica como sitio estático con rutas relativas.
- No requiere backend, base de datos ni variables de entorno.
- El desarrollo local se hace con un servidor estático (los módulos ES no funcionan con `file://`).
- El README explica cómo ejecutarla y desplegarla.
- Las licencias de Mammoth y DOMPurify se incluyen en `vendor/`.

---

## 7. Reglas de detección de enlaces

### 7.1 YouTube

Se aceptan hosts `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com` y `youtu.be`.

| Forma | Interpretación |
|---|---|
| `/watch?v=ID` | Video |
| `youtu.be/ID` | Video |
| `/shorts/ID` | Video |
| `/live/ID` | Video |
| `/embed/ID` | Video |
| `/playlist?list=ID` | Playlist |
| `/watch?v=ID&list=LISTA` | Video (se ignora la lista para el embed) |

- El ID de video debe tener 11 caracteres `[A-Za-z0-9_-]`.
- El ID de playlist debe ser válido y no vacío.
- `t` o `start` se convierten a segundos.
- Formatos de tiempo aceptados: `90`, `90s`, `1m30s`, `1h2m3s`.
- Los tiempos inválidos se ignoran.
- Se usa `https://www.youtube-nocookie.com/embed/...`.
- Para playlists: `https://www.youtube-nocookie.com/embed/videoseries?list=...`.

### 7.2 Spotify

Se acepta el host `open.spotify.com` con un prefijo opcional `/intl-xx/`.

| Ruta | Tipo | Altura del embed |
|---|---|---|
| `/track/ID` | Pista | 152 px |
| `/episode/ID` | Episodio | 232 px |
| `/album/ID` | Álbum | 352 px |
| `/playlist/ID` | Playlist | 352 px |
| `/show/ID` | Show | 352 px |
| `/artist/ID` | Artista | 352 px |

- El ID debe ser válido y no vacío.
- Se ignoran parámetros como `si` y `utm_*`.
- Se usa `https://open.spotify.com/embed/{tipo}/{id}`.
- No se usan timestamps de Spotify.
- Si el tipo no está soportado, se trata como enlace externo.

### 7.3 Comportamiento común

- Los enlaces se normalizan antes de deduplicar: proveedor + tipo + ID.
- La etiqueta visible sale del texto del enlace; si está vacío, se genera una etiqueta como "Video de YouTube" o "Pista de Spotify".
- Los enlaces multimedia no se abren en pestaña nueva al hacer clic normal.
- `Ctrl/Cmd/Shift/Alt + clic` y clic central se dejan al navegador.
- Los enlaces internos (`#...`) no se consideran multimedia.
- Los enlaces no reconocidos se abren en pestaña nueva si son `http(s)`.
- Los enlaces con protocolos no permitidos se neutralizan.

---

## 8. Composición y movimiento

### 8.1 Escritorio (≥ 900 px)

- Barra superior fija.
- `main` en fila: documento a la izquierda, panel de medios a la derecha.
- El documento tiene scroll interno; el panel de medios ocupa el alto disponible.
- Ancho inicial del panel: `clamp(360px, 40vw, 560px)`.
- El contenido del documento tiene un ancho máximo de lectura y se centra dentro de su panel.
- El panel de medios tiene borde/separador visual y su propio header.
- El panel cerrado no ocupa ancho útil ni recibe foco.

### 8.2 Móvil (< 900 px)

- Barra superior fija.
- `main` en columna: panel de medios arriba, documento abajo.
- El panel de medios tiene una altura calculada según el tipo de medio y un máximo del 55 % de la altura útil del workspace.
- El documento conserva al menos el 45 % de la altura útil.
- Ambos paneles tienen scroll interno si hace falta.
- No hay scroll del `body`.
- La barra superior no se solapa con el contenido; se respetan las safe areas.

### 8.3 Movimiento

- Apertura: ~320 ms, curva de salida suave; el documento se encoge y el panel se revela.
- Contenido: fade/slide breve.
- Cierre: inverso, ~250–320 ms.
- `prefers-reduced-motion: reduce`: sin transiciones ni desplazamientos.
- Sin animación en la primera carga.
- Sin transición durante el recálculo por resize/orientación.
- El `iframe` se mantiene estable; se anima el contenedor externo con `overflow: hidden`.

### 8.4 Scroll y foco

- Al abrir o cerrar, se conserva el bloque visible del documento.
- El foco se mueve al botón de cerrar al abrir.
- Al cerrar, vuelve al enlace de origen o al botón "Medios".
- El documento sigue siendo interactivo mientras el medio está abierto.
- El panel no es modal; no se atrapa el foco.

---

## 9. Persistencia y privacidad

### 9.1 Datos guardados

- **IndexedDB:**
  - último `Blob` del `.docx`;
  - nombre, tamaño y fecha del archivo;
  - `scrollTop` del documento;
  - fecha de actualización.
- **`localStorage`:**
  - tema (`system`, `light`, `dark` o preferencia efectiva);
  - tamaño de letra;
  - preferencia "Recordar en este dispositivo".

### 9.2 Comportamiento

- El guardado es local y opcional (activo por defecto).
- No se guarda el HTML renderizado ni el estado del reproductor.
- Al recargar, se restaura el documento y el scroll; el panel de medios empieza cerrado.
- "Olvidar documento" borra el registro de IndexedDB y vuelve al inicio.
- Si el guardado falla por cuota, se avisa y se sigue en memoria.
- Si el documento guardado falla al renderizar, se borra y se muestra un error.
- Se puede pedir almacenamiento persistente al navegador para reducir el desalojo.
- No se envía nada a un servidor.

### 9.3 Privacidad

- El archivo puede ser sensible; la app debe ser explícita sobre el almacenamiento local.
- YouTube/Spotify son terceros y pueden establecer cookies al cargarse; solo se cargan al pulsar.
- No se usan CDNs, fuentes externas, analítica ni píxeles de seguimiento.
- El enlace externo se abre con `noopener noreferrer`.

---

## 10. Accesibilidad

- Objetivo WCAG 2.1 AA en lo aplicable.
- HTML semántico: `header`, `main`, `article`, `nav`, `section`.
- Enlace de salto al documento.
- Foco visible y orden lógico.
- Diálogos con foco gestionado y `Escape`.
- `aria-expanded` y `aria-controls` en enlaces multimedia.
- `aria-live` para apertura/cierre y errores.
- `title` descriptivo en iframes.
- Etiquetas accesibles en botones e iconos.
- Texto alternativo de imágenes proveniente del `.docx` cuando exista.
- Contraste AA.
- Áreas táctiles de 44 × 44 px.
- Movimiento reducido.
- No depender del color para transmitir estado.
- El panel de medios no es un diálogo modal.
- El documento sigue siendo navegable con el panel abierto.
- Limitación documentada: `Escape` puede ser capturado dentro del iframe; el botón de cerrar siempre está visible.

---

## 11. Seguridad

- El HTML de Mammoth **nunca** se inserta sin sanear.
- DOMPurify se configura con una allowlist de etiquetas y atributos necesarios para el documento.
- Se permiten imágenes `data:image/...` generadas por Mammoth.
- Se bloquean `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `button` y similares dentro del documento.
- Se prohíben atributos de estilo inline y manejadores `on*`.
- Se validan los protocolos de los enlaces: `http`, `https`, `mailto`, `tel` e internos `#`.
- Los enlaces externos se abren con `noopener noreferrer`.
- Las URLs de los iframes se construyen desde IDs validados, no desde el `href` completo.
- Solo se permiten hosts de YouTube/Spotify en los iframes.
- `externalFileAccess` de Mammoth está desactivado.
- No se usa `eval` ni `new Function`.
- No se confía en el contenido del `.docx` aunque sea un archivo local.
- Las licencias y versiones de las librerías se mantienen actualizadas.

---

## 12. Errores y estados

| Situación | Mensaje orientativo | Recuperación |
|---|---|---|
| Archivo `.doc` | "Los archivos .doc antiguos no son compatibles. Guarda el documento como .docx." | Elegir otro archivo |
| Archivo corrupto o protegido | "No pudimos leer este documento. Puede estar dañado o protegido con contraseña." | Elegir otro archivo |
| Documento vacío | "El documento no contiene texto visible." | Elegir otro archivo |
| Archivo grande | "Este documento es grande; puede tardar unos segundos." | Esperar o cancelar |
| Cuota de almacenamiento | "El documento se abrió, pero no se pudo guardar para la próxima vez." | Seguir en memoria / olvidar |
| Documento guardado ilegible | "No pudimos recuperar el último documento." | Elegir otro archivo |
| Sin conexión | "Sin conexión. El documento sigue disponible, pero YouTube/Spotify no se pueden cargar." | Abrir enlace cuando vuelva la conexión |
| Embed bloqueado | "Si el reproductor no carga, ábrelo en YouTube/Spotify." | Enlace externo |
| Sin encabezados | "Este documento no tiene encabezados." | Cerrar el índice |
| Sin medios | "Este documento no contiene enlaces de YouTube o Spotify." | Cerrar la lista |
| Enlace no válido | Sin bloqueo; se trata como enlace externo | Abrir fuera |
| Documento olvidado | "Documento olvidado de este dispositivo." | Elegir otro archivo |

Estados visuales:

- **Landing:** zona de carga, privacidad y formatos admitidos.
- **Cargando:** overlay con spinner y mensaje.
- **Lector:** barra superior, documento, paneles cerrados.
- **Medio cargando:** esqueleto en el panel.
- **Medio abierto:** panel con iframe, header y cierre.
- **Sin conexión:** aviso discreto en el panel.
- **Error:** tarjeta con mensaje y acción.
- **Toasts:** avisos de guardado/olvido/cuota.

---

## 13. Requisitos no funcionales

### Rendimiento

- La app debe sentirse ágil en documentos normales (hasta ~20 MB de referencia).
- La conversión no debe bloquear la interfaz sin mostrar un estado de carga.
- La animación debe ser fluida en escritorio y móvil.
- No debe haber fugas al abrir/cerrar medios repetidamente.

### Compatibilidad

- Chrome, Edge, Firefox y Safari actuales de escritorio.
- iOS Safari y Android Chrome actuales.
- Sin Internet Explorer.
- Uso de `100dvh`, `<dialog>`, módulos ES e IndexedDB con degradación razonable.

### Responsive

- 320 px de ancho mínimo sin scroll horizontal.
- Punto de corte de 900 px.
- Safe areas en móvil.
- Sin scroll del `body`.

### Privacidad

- Sin backend, cuentas, analítica ni cookies propias.
- Terceros solo al pulsar un enlace.
- Almacenamiento local opcional y borrable.

### Mantenibilidad

- Vanilla JS con módulos pequeños y responsabilidades claras.
- Sin framework ni build.
- Librerías vendorizadas y documentadas.
- Código en español para la UI; nombres técnicos claros.
- README con limitaciones conocidas.

### Despliegue

- Sitio estático con rutas relativas.
- Sin variables de entorno ni backend.
- Compatible con GitHub Pages/Netlify.
- Servidor estático para desarrollo local.

---

## 14. Supuestos y limitaciones

- El documento es un `.docx` normal, no `.doc`, PDF, cifrado o protegido.
- Los enlaces multimedia son hipervínculos reales, no texto plano.
- El documento puede contener enlaces a YouTube/Spotify, pero no se garantiza que todos los embeds funcionen.
- Spotify puede mostrar vista previa si no hay sesión o si las cookies de terceros están bloqueadas.
- YouTube puede bloquear la incrustación por decisión del autor, región o edad.
- El autoplay puede requerir interacción adicional.
- Mammoth no conserva el diseño exacto de Word.
- No se soportan todos los elementos complejos de Word (formas, columnas, cuadros de texto complejos, etc.).
- El archivo guardado no está cifrado.
- El MVP no es una PWA; una carga desde cero requiere conexión.
- `Escape` dentro del iframe depende del proveedor.
- El panel móvil limita la altura del reproductor de Spotify en pantallas muy pequeñas; el contenido sigue siendo usable.

---

## 15. Checklist de aceptación del MVP

- [ ] Se abre un `.docx` con selector y con drag & drop.
- [ ] Se rechazan `.doc`, corruptos y protegidos con mensajes claros.
- [ ] Se renderizan títulos, listas, tablas, imágenes, notas y enlaces.
- [ ] El HTML se sanea con DOMPurify.
- [ ] Los enlaces internos funcionan.
- [ ] Los enlaces externos abren en pestaña nueva.
- [ ] Se detectan todos los formatos de YouTube/Spotify listados.
- [ ] Se respetan los timestamps de YouTube.
- [ ] Los enlaces multimedia se distinguen visualmente.
- [ ] El panel se abre con animación en escritorio y móvil.
- [ ] El `iframe` no parpadea durante la animación.
- [ ] Solo hay un medio activo.
- [ ] Cerrar elimina el `iframe` y detiene el audio/video.
- [ ] El foco vuelve al enlace o al botón "Medios".
- [ ] El documento conserva la posición de lectura.
- [ ] El índice se genera y navega correctamente.
- [ ] La lista de medios se genera, deduplica y abre medios.
- [ ] El tema y el tamaño de letra persisten.
- [ ] El último documento y el scroll se restauran.
- [ ] "Olvidar documento" borra el almacenamiento y vuelve al inicio.
- [ ] La app funciona sin scroll del `body` en escritorio y móvil.
- [ ] La app se usa solo con teclado.
- [ ] `prefers-reduced-motion` desactiva las animaciones.
- [ ] Los embeds bloqueados tienen enlace externo.
- [ ] La app no sube el documento a ningún servidor.
- [ ] Funciona en Chrome, Edge, Firefox y Safari actuales.
- [ ] Se puede desplegar como sitio estático.

---

## 16. Mejoras futuras

- PWA instalable con caché offline de la app.
- Lectura en voz alta con Web Speech API.
- Auto-detección de URLs en texto plano dentro del documento.
- Biblioteca de documentos recientes.
- Cola de reproducción y autoavance.
- Mini-reproductor para seguir escuchando mientras se lee a ancho completo.
- Picture-in-Picture o Document Picture-in-Picture.
- Divisor arrastrable y modo 50/50.
- Pantalla completa propia del medio.
- Búsqueda dentro del documento.
- Anotaciones y resaltados.
- Títulos de medios vía oEmbed.
- Detección automática de errores de embed de YouTube.
- Tests automatizados del parser y de la interfaz.
- CSP estricta probada con los embeds.
- Soporte de `.doc` mediante conversión externa (fuera del alcance actual).
- Sincronización opcional (requeriría backend; cambiaría el principio de privacidad).

---

## 17. Referencias

- [`MEMORY.md`](MEMORY.md) — visión y decisiones.
- [`TECHNICAL-PLAN.md`](TECHNICAL-PLAN.md) — implementación.
- [`ROADMAP.md`](ROADMAP.md) — orden de trabajo.
- [`DECISIONS.md`](DECISIONS.md) — ADRs.
- [`RISKS.md`](RISKS.md) — riesgos y mitigaciones.
