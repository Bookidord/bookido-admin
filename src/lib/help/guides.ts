export type Guide = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  body: string; // markdown
};

// ─── Lightweight markdown → HTML renderer ────────────────────────────────────
// Handles the subset used by these guides: h2/h3, bold, italic, inline-code,
// fenced code blocks, unordered lists, ordered lists, blockquotes, paragraphs.

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineRender(text: string): string {
  return escHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderMd(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inPre = false;
  let preLang = "";
  const preBuf: string[] = [];

  const closeList = () => {
    if (listType) {
      out.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  };

  for (const line of lines) {
    // ── fenced code block ──────────────────────────────────────────────────
    if (line.startsWith("```")) {
      if (!inPre) {
        closeList();
        inPre = true;
        preLang = line.slice(3).trim();
        preBuf.length = 0;
      } else {
        const langClass = preLang ? ` class="language-${preLang}"` : "";
        out.push(
          `<pre><code${langClass}>${escHtml(preBuf.join("\n"))}</code></pre>`,
        );
        inPre = false;
        preLang = "";
      }
      continue;
    }
    if (inPre) {
      preBuf.push(line);
      continue;
    }

    // ── headings ───────────────────────────────────────────────────────────
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${inlineRender(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${inlineRender(line.slice(3))}</h2>`);
      continue;
    }

    // ── blockquote ─────────────────────────────────────────────────────────
    if (line.startsWith("> ")) {
      closeList();
      out.push(`<blockquote>${inlineRender(line.slice(2))}</blockquote>`);
      continue;
    }

    // ── unordered list ─────────────────────────────────────────────────────
    if (/^[-*] /.test(line)) {
      if (listType === "ol") closeList();
      if (!listType) {
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inlineRender(line.slice(2))}</li>`);
      continue;
    }

    // ── ordered list ───────────────────────────────────────────────────────
    if (/^\d+\. /.test(line)) {
      if (listType === "ul") closeList();
      if (!listType) {
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inlineRender(line.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    // ── blank line ─────────────────────────────────────────────────────────
    if (line.trim() === "") {
      closeList();
      continue;
    }

    // ── paragraph ──────────────────────────────────────────────────────────
    closeList();
    out.push(`<p>${inlineRender(line)}</p>`);
  }

  closeList();
  return out.join("\n");
}

// ─── Guide content ────────────────────────────────────────────────────────────

export const guides: Guide[] = [
  {
    slug: "configurar-negocio",
    title: "Cómo configurar tu negocio",
    description: "Ponle tu nombre, horario y número de WhatsApp al panel.",
    icon: "⚙️",
    body: `## ¿Qué es la Configuración?

En la sección **Configuración** de tu panel puedes personalizar todo lo que tus clientes ven cuando entran a reservar: el nombre de tu negocio, tu número de WhatsApp, tu horario de atención y una descripción breve.

## Cómo llegar ahí

1. Entra a tu panel en **/panel**
2. En el menú del lado izquierdo (o en el menú de hamburguesa si estás en el celular), toca **Configuración**
3. Ahí verás todos los campos que puedes editar

## Qué puedes cambiar

- **Nombre del negocio** — el nombre que aparece en la página pública de reservas
- **Descripción** — una línea breve sobre tu negocio (por ejemplo: *"Nail salon en Santo Domingo"*)
- **WhatsApp** — tu número con código de país, sin guiones ni espacios (ejemplo: *18096106459*)
- **Horario de apertura y cierre** — las horas en que aceptas reservas
- **Color principal** — el color de acento que aparece en los botones de tu página pública

## Guardar los cambios

Cuando termines de editar, toca el botón **Guardar cambios**. Verás un mensaje de confirmación y los cambios se aplican de inmediato.

## Tu enlace público

En la misma página de Configuración encontrarás tu **enlace de reservas** — la dirección que le das a tus clientes para que reserven en línea. Puedes copiarlo con un solo toque y compartirlo por WhatsApp, Instagram o como quieras.

> **Consejo:** Pon tu enlace de reservas en la bio de Instagram para que tus seguidores puedan agendar sin escribirte primero.`,
  },

  {
    slug: "agregar-servicios",
    title: "Cómo agregar y editar servicios",
    description: "Agrega, edita y organiza los servicios que ofreces.",
    icon: "✂️",
    body: `## ¿Dónde están los servicios?

Tus servicios aparecen en la página pública de reservas para que los clientes elijan cuál quieren. Puedes agregar, editar, desactivar o eliminar servicios directamente desde el panel.

## Cómo agregar un servicio nuevo

1. En el menú de tu panel, ve a **Servicios**
2. Toca el botón **Agregar servicio**
3. Rellena el nombre del servicio (por ejemplo: *Manicura gel*)
4. Escribe la duración en minutos (por ejemplo: *60*)
5. Toca **Guardar** — el servicio aparece de inmediato en tu página de reservas

## Cómo editar un servicio existente

1. En la lista de servicios, toca el nombre del servicio que quieres cambiar
2. Edita el nombre o la duración
3. Toca **Guardar**

## Ocultar un servicio sin borrarlo

Si no quieres ofrecer un servicio por un tiempo, puedes **desactivarlo** en lugar de borrarlo. El servicio desaparece de la página de reservas pero queda guardado para después.

Para desactivarlo, toca el interruptor que aparece al lado del servicio en la lista.

## Eliminar un servicio

Para borrar un servicio permanentemente, toca el botón de eliminar (ícono de basura) al lado del servicio. Las reservas ya agendadas para ese servicio no se borran — quedan en tu historial.

## Ordenar los servicios

Los servicios aparecen en la página de reservas en el mismo orden en que los ves en tu panel. Puedes reorganizarlos arrastrándolos de arriba a abajo.

> **Consejo:** Pon primero los servicios que más vendes. La mayoría de los clientes eligen el primero que ven en la lista.`,
  },

  {
    slug: "ver-reservas",
    title: "Cómo ver y gestionar tus reservas",
    description: "Consulta, filtra y actualiza el estado de todas tus reservas.",
    icon: "📅",
    body: `## Dónde ver tus reservas

En el menú de tu panel, toca **Reservas**. Ahí verás todas las reservas que tus clientes han agendado, ordenadas de la más reciente a la más próxima.

## Información de cada reserva

Cada reserva te muestra:

- **Nombre del cliente**
- **Servicio elegido**
- **Día y hora**
- **Teléfono** del cliente (si lo dejó)
- **Notas** que escribió al reservar
- **Estado**: Confirmada, Completada, Cancelada o No se presentó

## Filtrar reservas

Usa los botones de filtro en la parte superior para ver solo las reservas que te interesan:

- **Todas** — muestra el historial completo
- **Confirmadas** — las que están activas y pendientes
- **Completadas** — las que ya ocurrieron
- **No-show** — clientes que no se presentaron
- **Canceladas** — las que fueron canceladas

También puedes filtrar por período: últimos **7, 30 o 90 días**.

## El menú de acciones ···

Cada reserva tiene un botón **···** (tres puntos) en la parte derecha. Al tocarlo aparecen las opciones disponibles según el estado de la reserva:

Si la reserva está **Confirmada**:
- **✓ Completada** — marca la cita como realizada
- **👻 No se presentó** — registra que el cliente no vino
- **✕ Cancelar** — cancela la reserva

Si la reserva está en cualquier otro estado:
- **↩ Restaurar** — la vuelve a Confirmada

## Agendar una reserva manual

Si una clienta te escribe por WhatsApp y quieres registrar su reserva tú misma:

1. Toca el botón **Nueva reserva** en la parte superior
2. Escribe el nombre y teléfono de la clienta
3. Elige el servicio, el día y la hora disponible
4. Toca **Confirmar** — queda registrada y el horario se bloquea

## Reenviar el email de confirmación

Cada reserva tiene un ícono de sobre ✉ que te permite reenviarle el email de confirmación al cliente con un solo toque.

> **Consejo:** Revisa tus reservas confirmadas cada mañana. Si ves que alguien tiene cita en unas horas, puedes prepararle los materiales con tiempo.`,
  },

  {
    slug: "calendario",
    title: "Cómo usar el Calendario",
    description: "Ve todas tus reservas del mes en una vista de calendario.",
    icon: "🗓️",
    body: `## ¿Qué es el Calendario?

El **Calendario** te da una vista mensual de todas tus reservas. En lugar de ver una lista, ves un cuadrícula con los días del mes donde cada punto de color representa una reserva.

## Cómo acceder

En el menú de tu panel, toca **Calendario**.

## Leer el calendario

Cada día del mes puede mostrar:

- **Puntos de color** — cada punto es una reserva (verde = confirmada, azul = completada, ámbar = no-show, gris = cancelada)
- **Número en verde** — cuántas reservas confirmadas tiene ese día
- **Día resaltado** — el día de hoy aparece destacado automáticamente

## Ver el detalle de un día

Toca cualquier día del calendario y en el panel de la derecha (o abajo en el celular) verás la lista completa de reservas de ese día con:

- Hora y duración de cada reserva
- Nombre del cliente y servicio
- Estado de la reserva
- Teléfono con enlace directo a WhatsApp

## Navegar entre meses

Usa las flechas **←** y **→** en la parte superior del calendario para ir al mes anterior o al siguiente. La página se actualiza con las reservas de ese mes.

> **Consejo:** Usa el calendario al inicio de cada semana para tener una foto clara de qué tan ocupados estarás y si hay días con espacio para más reservas.`,
  },

  {
    slug: "clientes",
    title: "Cómo ver el historial de tus clientes",
    description: "Conoce a tus mejores clientes y revisa su historial de visitas.",
    icon: "👥",
    body: `## ¿Qué es la vista de Clientes?

La sección **Clientes** agrupa automáticamente todas las personas que han reservado contigo, mostrando cuántas veces han venido y cuándo fue su última visita. No tienes que hacer nada extra — se construye solo con tus reservas existentes.

## Cómo acceder

En el menú de tu panel, toca **Clientes**.

## La lista de clientes

Verás una tabla con todos tus clientes únicos. Cada fila muestra:

- **Nombre y email** del cliente
- **Total de reservas** que ha hecho
- **Tag automático** según su frecuencia:
  - **Nuevo** — menos de 4 reservas
  - **Regular** — 4 o más reservas
  - **VIP ⭐** — 10 o más reservas
- **Última visita** en tiempo relativo (ej: *hace 3 días*)
- **Teléfono** con enlace directo a WhatsApp

## Buscar un cliente

Usa el buscador en la parte superior para encontrar a alguien por nombre, email o teléfono.

## Ver el historial completo de un cliente

Toca el botón **Ver historial →** en cualquier fila para abrir la página de detalle del cliente. Ahí verás:

- Sus estadísticas: total de reservas, completadas, confirmadas, canceladas y no-shows
- Fecha de primera y última visita
- Historial completo de todas sus reservas con fecha, servicio y estado

## Contactar por WhatsApp

Tanto en la lista como en el detalle, si el cliente dejó su teléfono hay un botón de **WhatsApp** para escribirle directamente.

> **Consejo:** Revisa tus clientes VIP de vez en cuando. Si alguno lleva tiempo sin venir, un mensaje de WhatsApp recordándole que tienes su servicio favorito puede traerlo de vuelta.`,
  },

  {
    slug: "mensajes-whatsapp",
    title: "Cómo usar el botón de WhatsApp",
    description: "Tu número ya está conectado — así funciona el botón de reservas.",
    icon: "💬",
    body: `## ¿Cómo funciona el botón de WhatsApp?

En tu página pública de reservas hay un botón que dice **Reservar por WhatsApp**. Cuando una clienta lo toca, WhatsApp se abre directamente con tu número y un mensaje ya escrito. Ella solo tiene que tocar "Enviar".

Esto hace que sea muy fácil para las clientas contactarte, aunque no quieran usar el sistema de reservas en línea.

## Cambiar tu número de WhatsApp

Tu número de WhatsApp se guarda en **Configuración**. Para cambiarlo:

1. Ve al menú → **Configuración**
2. Edita el campo **WhatsApp**
3. Escribe tu número con el código del país al inicio, sin espacios ni guiones
   - Ejemplo para República Dominicana: **18096106459** (el 1 es el código de RD)
4. Toca **Guardar cambios**

El botón de WhatsApp en tu página pública se actualiza automáticamente.

## Botón de WhatsApp en cada reserva

En la lista de reservas, si una clienta dejó su número verás un botón **WA** al lado de su reserva. Al tocarlo se abre WhatsApp con un mensaje pre-escrito que incluye su nombre y la hora de la cita — ideal para recordatorios rápidos.

## Verificar que funciona

Para probar que todo está bien:

1. Abre tu enlace público de reservas (lo encuentras en Configuración)
2. Toca el botón **Reservar por WhatsApp**
3. Comprueba que se abre WhatsApp con tu número correcto

Si el número no es el correcto, vuelve a Configuración y corrígelo.

> **Consejo:** Asegúrate de que tu número de WhatsApp tenga la cuenta activa y puedas recibir mensajes. Pruébalo desde otro celular si tienes dudas.`,
  },

  {
    slug: "cancelaciones-no-shows",
    title: "Cómo manejar cancelaciones y no-shows",
    description: "Cancela reservas, registra ausencias y reduce los no-shows.",
    icon: "🚫",
    body: `## Cancelar una reserva

Cuando una clienta te avisa que no puede venir:

1. Ve al menú → **Reservas**
2. Busca la reserva de esa clienta
3. Toca el botón **···** (tres puntos) en su reserva
4. Selecciona **✕ Cancelar**

El horario queda libre de inmediato y ese turno vuelve a estar disponible para otras reservas.

## Registrar un no-show

Cuando la clienta tenía cita pero no apareció y no avisó:

1. Busca la reserva en la lista
2. Toca el botón **···**
3. Selecciona **👻 No se presentó**

La reserva queda marcada como no-show en tu historial. Esto te ayuda a llevar un registro de clientes que fallan con frecuencia y verlo en su perfil en la sección **Clientes**.

## Marcar una reserva como completada

Cuando la cita ya ocurrió y todo fue bien:

1. Toca el botón **···** en la reserva
2. Selecciona **✓ Completada**

Las reservas completadas aparecen en el historial del cliente y en las estadísticas de tu panel.

## Restaurar una reserva cancelada

Si cancelaste por error o la clienta cambió de opinión:

1. Busca la reserva cancelada (filtra por "Canceladas" en la barra de filtros)
2. Toca **···** → **↩ Restaurar**
3. La reserva vuelve a estar Confirmada y el horario queda bloqueado

## Cómo reducir los no-shows

- **Recordatorio por WhatsApp:** el día anterior toca el botón **WA** en la reserva para enviarle un mensaje rápido con su horario
- **Pide confirmación:** en el mensaje de recordatorio pídele que te confirme si viene — así sabes con tiempo si el turno quedará libre
- **Revisa el historial:** en la sección **Clientes** puedes ver cuántos no-shows tiene cada persona antes de aceptarle una nueva reserva

> **Consejo:** Un recordatorio por WhatsApp la noche anterior reduce los no-shows a casi cero. La mayoría de las clientas agradecen el mensaje y confirman.`,
  },

  {
    slug: "usar-desde-celular",
    title: "Cómo usar el panel desde el celular",
    description: "Instala Bookido en tu pantalla de inicio y gestiona todo desde el móvil.",
    icon: "📱",
    body: `## El panel funciona en el celular

Bookido está diseñado para usarse cómodamente desde el teléfono. Puedes ver las reservas del día, agendar reservas nuevas, cancelar turnos y editar tu configuración — todo sin necesitar una computadora.

## Añadir el panel a tu pantalla de inicio

Puedes dejar un ícono en tu pantalla como si fuera una app, para entrar con un solo toque.

### En iPhone (Safari)

1. Abre tu panel en Safari: **tu-dominio.com/panel**
2. Inicia sesión con tu correo y contraseña
3. Toca el ícono de **Compartir** (el cuadrado con la flecha hacia arriba, en la barra de abajo)
4. Desliza hacia abajo y toca **Añadir a pantalla de inicio**
5. Ponle un nombre como *"Mi Panel"* y toca **Añadir**

### En Android (Chrome)

1. Abre tu panel en Chrome: **tu-dominio.com/panel**
2. Inicia sesión
3. Toca el menú (los tres puntitos arriba a la derecha)
4. Toca **Añadir a pantalla de inicio** o **Instalar app**
5. Confirma con **Añadir**

Listo. Ahora tienes el ícono en tu pantalla de inicio y al tocarlo entras directo al panel.

## Consejos para usar el panel en el celular

- **Menú:** en el celular el menú aparece como un ícono de tres líneas. Tócalo para navegar entre Reservas, Clientes, Calendario, Servicios y Configuración.
- **Nueva reserva rápida:** desde Reservas hay un botón directo a "Nueva reserva" para cuando una clienta te llama y quieres registrar la cita al momento.
- **Gira el teléfono si necesitas espacio:** algunos formularios se ven mejor en horizontal cuando hay que elegir una hora.

> **Consejo:** Deja el panel como la primera pantalla que abres en la mañana. Un vistazo rápido y ya sabes cómo estará tu día.`,
  },
];

export const guidesBySlug = Object.fromEntries(guides.map((g) => [g.slug, g]));
export const defaultSlug = guides[0].slug;
