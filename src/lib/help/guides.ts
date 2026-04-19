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
- **Horario de apertura y cierre** — las horas en que aceptas citas (se muestra en formato 12 h)
- **Color principal** — el color de acento que aparece en los botones de tu página pública

## Guardar los cambios

Cuando termines de editar, toca el botón **Guardar cambios**. Verás un mensaje de confirmación y los cambios se aplican de inmediato, sin necesidad de hacer nada más.

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

Si no quieres ofrecer un servicio por un tiempo (por ejemplo, en vacaciones), puedes **desactivarlo** en lugar de borrarlo. El servicio desaparece de la página de reservas, pero queda guardado por si lo vuelves a necesitar después.

Para desactivarlo, toca el interruptor que aparece al lado del servicio en la lista.

## Eliminar un servicio

Para borrar un servicio permanentemente, toca el botón de eliminar (ícono de basura) al lado del servicio. Las citas ya agendadas para ese servicio no se borran — quedan en tu historial.

## Ordenar los servicios

Los servicios aparecen en la página de reservas en el mismo orden en que los ves en tu panel. Puedes reorganizarlos arrastrándolos de arriba a abajo.

> **Consejo:** Pon primero los servicios que más vendes. La mayoría de los clientes eligen el primero que ven en la lista.`,
  },

  {
    slug: "ver-reservas",
    title: "Cómo ver tus reservas del día",
    description: "Consulta, filtra y gestiona todas tus citas desde el panel.",
    icon: "📅",
    body: `## Dónde ver tus reservas

En el menú de tu panel, toca **Reservas**. Ahí verás todas las citas que tus clientes han agendado, ordenadas de la más reciente a la más próxima.

## Información de cada cita

Cada reserva te muestra:

- **Nombre del cliente**
- **Servicio elegido** (manicura, pedicura, etc.)
- **Día y hora** de la cita
- **Teléfono** del cliente (si lo dejó)
- **Notas** que escribió el cliente al reservar
- **Estado**: confirmada o cancelada

## Ver solo las citas de hoy

Usa el **filtro de fecha** en la parte superior de la lista para ver únicamente las citas de hoy. Así empiezas el día con una vista limpia de tu agenda.

## Agendar una cita manual

Si una clienta te escribe por WhatsApp y quieres registrar su cita tú misma:

1. Toca el botón **Nueva cita** en la parte superior de Reservas
2. Escribe el nombre y teléfono de la clienta
3. Elige el servicio
4. Selecciona el día y la hora disponible
5. Toca **Confirmar cita** — queda registrada y el horario se bloquea automáticamente

## Cancelar una cita

Si una clienta te avisa que no puede venir, toca el botón **Cancelar** en su reserva. El horario queda libre de inmediato y otra persona puede reservar ese turno.

> **Consejo:** Revisa tus reservas cada mañana antes de empezar. Si ves que alguien tiene una cita en una hora, puedes prepararle los materiales con tiempo.`,
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

## ¿Qué mensaje recibe la clienta?

El mensaje que aparece pre-escrito en WhatsApp es algo así:

*"Hola, me gustaría reservar una cita en [nombre de tu negocio]."*

La clienta puede editarlo antes de enviarlo si quiere añadir algo más.

## Verificar que funciona

Para probar que todo está bien:

1. Abre tu enlace público de reservas (lo encuentras en Configuración)
2. Toca el botón **Reservar por WhatsApp**
3. Comprueba que se abre WhatsApp con tu número correcto y el mensaje pre-escrito

Si el número no es el correcto, vuelve a Configuración y corrígelo.

> **Consejo:** Asegúrate de que tu número de WhatsApp tenga la cuenta activa y que puedas recibir mensajes. Pruébalo desde otro celular si tienes dudas.`,
  },

  {
    slug: "cancelaciones-no-shows",
    title: "Cómo manejar cancelaciones y no-shows",
    description: "Cancela citas, libera horarios y reduce las ausencias.",
    icon: "🚫",
    body: `## Cancelar una cita desde el panel

Cuando una clienta te avisa que no puede venir:

1. Ve al menú → **Reservas**
2. Busca la cita de esa clienta
3. Toca el botón **Cancelar** en su reserva
4. Confirma la cancelación

El horario queda libre de inmediato. Si alguien intenta reservar a esa misma hora, el sistema ya mostrará ese turno disponible.

## ¿Qué es un no-show?

Un no-show es cuando la clienta tiene una cita pero no aparece y no avisó. En ese caso:

- Si ya pasó la hora, la cita queda en tu historial como **confirmada**
- El horario pasado no afecta tu agenda futura — solo los turnos de hoy en adelante están bloqueados

Por ahora puedes marcarla mentalmente o escribir una nota en WhatsApp para recordarlo la próxima vez que esa clienta quiera reservar.

## Cómo reducir las ausencias

Estas son las cosas que más ayudan:

- **Pide el teléfono:** cuando una clienta reserva y deja su número, puedes escribirle la noche anterior para recordarle la cita
- **Recordatorio por WhatsApp:** el día antes de la cita, envíale un mensaje rápido: *"Hola [nombre], te recuerdo que tienes cita mañana a las [hora] en [tu negocio]. ¡Te esperamos!"*
- **Política clara:** cuando las clientas reservan, puedes pedirles en las notas que avisen si no pueden venir. La mayoría respeta eso si se lo pides amablemente

## Restaurar una cita cancelada

Si cancelaste una cita por error o la clienta cambió de opinión:

1. Busca la reserva cancelada en la lista (puedes verlas cambiando el filtro a "Canceladas")
2. Toca **Restaurar**
3. La cita vuelve a estar activa y el horario queda bloqueado nuevamente

> **Consejo:** Si una clienta cancela con frecuencia o no aparece varias veces, considera pedirle que te contacte por WhatsApp para coordinar antes de agendar en línea.`,
  },

  {
    slug: "usar-desde-celular",
    title: "Cómo usar el panel desde el celular",
    description: "Instala Bookido en tu pantalla de inicio y gestiona todo desde el móvil.",
    icon: "📱",
    body: `## El panel funciona en el celular

Bookido está diseñado para usarse cómodamente desde el teléfono. Puedes ver las reservas del día, agendar citas nuevas, cancelar turnos y editar tu configuración — todo sin necesitar una computadora.

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

## También puedes agregar la página de reservas

Haz lo mismo con tu **enlace público de reservas** (el que les das a tus clientes). Así puedes ver exactamente lo que ven ellas cuando van a reservar.

## Consejos para usar el panel en el celular

- **Menú:** en el celular el menú aparece como un ícono de tres líneas arriba a la izquierda. Tócalo para navegar entre Reservas, Servicios y Configuración.
- **Nueva cita rápida:** desde la pantalla de inicio del panel hay un botón directo a "Nueva cita" para cuando una clienta te llama y quieres registrar la cita al momento.
- **Gira el teléfono si necesitas espacio:** algunos formularios se ven mejor en horizontal, especialmente cuando hay que elegir una hora.

> **Consejo:** Deja el panel como la primera pantalla que abres en la mañana. Un vistazo rápido y ya sabes cómo estará tu día.`,
  },
];

export const guidesBySlug = Object.fromEntries(guides.map((g) => [g.slug, g]));
export const defaultSlug = guides[0].slug;
