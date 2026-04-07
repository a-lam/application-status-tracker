export const STATUS_TRANSITIONS = {
  NOT_SUBMITTED:  ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED:      ["INTERVIEWING", "REJECTED", "WITHDRAWN"],
  INTERVIEWING:   ["OFFER_RECEIVED", "REJECTED", "WITHDRAWN"],
  OFFER_RECEIVED: ["OFFER_ACCEPTED", "OFFER_DECLINED", "WITHDRAWN"],
  OFFER_ACCEPTED: ["NOT_SUBMITTED"],
  OFFER_DECLINED: ["NOT_SUBMITTED"],
  REJECTED:       ["NOT_SUBMITTED"],
  WITHDRAWN:      ["NOT_SUBMITTED"],
};

export const STATUS_LABELS = {
  NOT_SUBMITTED:  "Not Submitted",
  SUBMITTED:      "Submitted",
  INTERVIEWING:   "Interviewing",
  OFFER_RECEIVED: "Offer Received",
  OFFER_ACCEPTED: "Offer Accepted",
  OFFER_DECLINED: "Offer Declined",
  REJECTED:       "Rejected",
  WITHDRAWN:      "Withdrawn",
};

const TERMINAL_STATES = new Set(["OFFER_ACCEPTED", "OFFER_DECLINED", "REJECTED", "WITHDRAWN"]);

export function isTerminal(status) {
  return TERMINAL_STATES.has(status);
}
