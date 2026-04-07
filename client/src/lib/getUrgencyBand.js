import { differenceInCalendarDays, startOfDay } from "date-fns";

const GREY_STATUSES = ["REJECTED", "WITHDRAWN", "OFFER_DECLINED"];

/**
 * Returns the urgency band for an application based on its status and due date.
 * Status takes priority over deadline. Uses the client's local date.
 *
 * 1. REJECTED, WITHDRAWN, OFFER_DECLINED → 'past' (grey) — resolved unfavourably
 * 2. Any status other than NOT_SUBMITTED  → 'future' (green) — active in the pipeline
 * 3. NOT_SUBMITTED — deadline-driven:
 *      delta ≤ -1  → 'urgent' (red)    — past the deadline, still not submitted
 *      delta 0–3   → 'soon'   (yellow) — submit within 3 days
 *      delta ≥ 4   → 'future' (green)  — plenty of time
 *
 * @param {string|Date} dueDate
 * @param {string} status
 * @returns {'past'|'urgent'|'soon'|'future'}
 */
export function getUrgencyBand(dueDate, status) {
  if (GREY_STATUSES.includes(status)) return "past";

  if (status !== "NOT_SUBMITTED") return "future";

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const delta = differenceInCalendarDays(due, today);

  if (delta <= -1) return "urgent";
  if (delta <= 3) return "soon";
  return "future";
}
