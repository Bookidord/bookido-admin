import { addMinutes, isAfter, setHours, setMinutes, startOfDay } from "date-fns";

export function generateSlots(
  day: Date,
  durationMinutes: number,
  busy: { starts_at: string; ends_at: string }[],
  openHour: number,
  closeHour: number,
  slotMinutes: number,
): Date[] {
  const dayStart = startOfDay(day);
  const closeBoundary = setMinutes(setHours(dayStart, closeHour), 0);
  let t = setMinutes(setHours(dayStart, openHour), 0);
  const out: Date[] = [];

  while (true) {
    const slotEnd = addMinutes(t, durationMinutes);
    if (isAfter(slotEnd, closeBoundary)) break;

    const overlaps = busy.some((b) => {
      const bs = new Date(b.starts_at);
      const be = new Date(b.ends_at);
      return t < be && slotEnd > bs;
    });
    if (!overlaps) out.push(t);
    t = addMinutes(t, slotMinutes);
  }

  return out;
}
