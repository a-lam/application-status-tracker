import { differenceInCalendarDays, startOfDay } from "date-fns";

/**
 * Returns the urgency band for an application based on its due date.
 * Uses the client's local date — the threshold flip happens at local midnight.
 *
 * delta = dueDate (start of day) − today (start of day), in whole calendar days
 *   delta ≤ -1  → 'past'    (due date was yesterday or earlier)
 *   delta 0–3   → 'urgent'  (due today through 3 days from now)
 *   delta 4–7   → 'soon'
 *   delta ≥ 8   → 'future'
 *
 * @param {string|Date} dueDate
 * @returns {'past'|'urgent'|'soon'|'future'}
 */
export function getUrgencyBand(dueDate) {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const delta = differenceInCalendarDays(due, today);

  if (delta <= -1) return "past";
  if (delta <= 3) return "urgent";
  if (delta <= 7) return "soon";
  return "future";
}
