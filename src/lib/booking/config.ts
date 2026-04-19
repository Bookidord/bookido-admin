export { getTenantSlug } from "@/lib/tenant";

export function getScheduleConfig() {
  return {
    openHour: Number(process.env.BOOKIDO_OPEN_HOUR ?? 10),
    closeHour: Number(process.env.BOOKIDO_CLOSE_HOUR ?? 20),
    slotMinutes: Number(process.env.BOOKIDO_SLOT_MINUTES ?? 30),
  };
}
