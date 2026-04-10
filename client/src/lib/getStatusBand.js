// Returns: 'action' | 'waiting' | 'accepted' | 'closed'
export function getStatusBand(status) {
  switch (status) {
    case "NOT_SUBMITTED":
    case "OFFER_RECEIVED":  return "action";
    case "SUBMITTED":
    case "INTERVIEWING":    return "waiting";
    case "OFFER_ACCEPTED":  return "accepted";
    case "REJECTED":
    case "WITHDRAWN":
    case "OFFER_DECLINED":  return "closed";
    default:                return "action";
  }
}
