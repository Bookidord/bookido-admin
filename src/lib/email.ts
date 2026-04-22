const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = "Bookido <hola@bookido.online>";

async function sendResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return null;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { message?: string }).message ?? "Resend error");
  console.log("[email] Sent to", to, "— id:", (data as { id: string }).id);
  return data;
}

export async function sendBookingConfirmation({
  to,
  customerName,
  businessName,
  serviceName,
  startsAt,
  notes,
}: {
  to: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  startsAt: Date;
  notes?: string | null;
}) {
  const firstName = customerName.split(" ")[0];

  const dateStr = startsAt.toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santo_Domingo",
  });
  const timeStr = startsAt.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santo_Domingo",
  });
  const dateCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding-bottom:32px;">
        <span style="font-size:20px;font-weight:500;color:#F5F5F7;letter-spacing:-0.3px;">Bookido</span>
      </td></tr>
      <tr><td style="background:#14141F;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">

        <p style="font-size:11px;font-weight:500;color:#71717A;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">Para ${firstName}</p>
        <h1 style="font-size:26px;font-weight:500;color:#F5F5F7;line-height:1.25;margin:0 0 8px;">Tu cita está confirmada</h1>
        <p style="font-size:15px;color:#A1A1AA;line-height:1.6;margin:0 0 32px;">
          Te esperamos en <strong style="color:#F5F5F7;font-weight:500;">${businessName}</strong>.
        </p>

        <!-- Detalle de la cita -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;margin-bottom:32px;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="font-size:11px;color:#71717A;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Servicio</p>
              <p style="font-size:15px;color:#F5F5F7;font-weight:500;margin:0;">${serviceName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="font-size:11px;color:#71717A;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Fecha</p>
              <p style="font-size:15px;color:#F5F5F7;font-weight:500;margin:0;">${dateCap}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <p style="font-size:11px;color:#71717A;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Hora</p>
              <p style="font-size:15px;color:#F5F5F7;font-weight:500;margin:0;">${timeStr}</p>
            </td>
          </tr>
        </table>

        ${notes ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="font-size:11px;color:#71717A;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px;">Tus notas</p>
            <p style="font-size:14px;color:#A1A1AA;font-style:italic;margin:0;">&ldquo;${notes}&rdquo;</p>
          </td></tr>
        </table>` : ""}
        <p style="font-size:13px;color:#71717A;line-height:1.6;margin:0;">
          Si necesitas cambiar o cancelar tu cita, contacta directamente al negocio.
        </p>

      </td></tr>
      <tr><td style="height:1px;background:rgba(255,255,255,0.06);"></td></tr>
      <tr><td style="padding-top:24px;">
        <p style="font-family:'Courier New',monospace;font-size:11px;color:#71717A;line-height:1.8;margin:0;">
          Bookido &middot; hola@bookido.online<br>
          Si no hiciste esta reserva, ignora este mensaje.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return sendResend({ to, subject: `Cita confirmada — ${businessName}`, html });
}

export async function sendWelcomeEmail({
  to,
  businessName,
  slug,
}: {
  to: string;
  businessName: string;
  slug: string;
}) {
  const panelUrl = `https://${slug}.bookido.online/panel`;
  const bookingUrl = `https://${slug}.bookido.online/reserva`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding-bottom:32px;">
        <span style="font-size:20px;font-weight:500;color:#F5F5F7;letter-spacing:-0.3px;">Bookido</span>
      </td></tr>
      <tr><td style="background:#14141F;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">

        <p style="font-size:11px;font-weight:500;color:#14F195;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">¡Bienvenido!</p>
        <h1 style="font-size:26px;font-weight:500;color:#F5F5F7;line-height:1.25;margin:0 0 8px;">Tu panel está listo</h1>
        <p style="font-size:15px;color:#A1A1AA;line-height:1.6;margin:0 0 32px;">
          <strong style="color:#F5F5F7;font-weight:500;">${businessName}</strong> ya tiene su sistema de reservas online. Tienes 14 días gratis para probarlo.
        </p>

        <!-- Links principales -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="padding-bottom:12px;">
            <a href="${panelUrl}" style="display:block;background:#14F195;color:#0A0A0F;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;">
              Ir a mi panel →
            </a>
          </td></tr>
          <tr><td>
            <a href="${bookingUrl}" style="display:block;border:1px solid rgba(255,255,255,0.12);color:#A1A1AA;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-size:14px;">
              Ver mi página de reservas
            </a>
          </td></tr>
        </table>

        <!-- Pasos -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:20px 20px 4px;">
            <p style="font-size:11px;color:#71717A;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 16px;">Primeros pasos</p>
          </td></tr>
          <tr><td style="padding:0 20px 8px;">
            <p style="font-size:14px;color:#A1A1AA;margin:0 0 10px;">1. <a href="${panelUrl}/servicios" style="color:#F5F5F7;text-decoration:none;">Añade tus servicios</a> con duración y precio.</p>
            <p style="font-size:14px;color:#A1A1AA;margin:0 0 10px;">2. Comparte tu enlace de reservas: <span style="color:#F5F5F7;font-family:'Courier New',monospace;font-size:13px;">${slug}.bookido.online/reserva</span></p>
            <p style="font-size:14px;color:#A1A1AA;margin:0 0 16px;">3. Recibe y gestiona citas desde tu panel.</p>
          </td></tr>
        </table>

        <p style="font-size:13px;color:#71717A;line-height:1.6;margin:0;">
          ¿Alguna duda? Escríbenos a <a href="mailto:hola@bookido.online" style="color:#A1A1AA;">hola@bookido.online</a>
        </p>

      </td></tr>
      <tr><td style="height:1px;background:rgba(255,255,255,0.06);"></td></tr>
      <tr><td style="padding-top:24px;">
        <p style="font-family:'Courier New',monospace;font-size:11px;color:#71717A;line-height:1.8;margin:0;">
          Bookido &middot; hola@bookido.online<br>
          bookido.online
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return sendResend({ to, subject: `Tu panel de reservas está listo — ${businessName}`, html });
}
