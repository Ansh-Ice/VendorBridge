const RFQ_TRANSITIONS = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["QUOTING", "CLOSED", "CANCELLED"],
  QUOTING: ["CLOSED", "CANCELLED"],
  CLOSED: ["COMPARISON", "CANCELLED"],
  COMPARISON: ["AWAITING_APPROVAL", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["AWARDED", "CANCELLED"],
  REJECTED: ["COMPARISON", "CANCELLED"],
  AWARDED: ["CANCELLED"],
  CANCELLED: []
};

const QUOTATION_TRANSITIONS = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["REVISED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  REVISED: ["SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: [],
  REJECTED: ["SHORTLISTED", "ACCEPTED"],
  WITHDRAWN: []
};

const PO_TRANSITIONS = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["SENT", "CANCELLED"],
  SENT: ["PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

const INVOICE_TRANSITIONS = {
  DRAFT: ["GENERATED", "VOID"],
  GENERATED: ["SENT", "VOID"],
  SENT: ["PAID", "OVERDUE", "VOID"],
  OVERDUE: ["PAID", "VOID"],
  PAID: [],
  VOID: []
};

/**
 * Validates if a state transition is legal.
 * 
 * @param {string} entityType - "RFQ", "QUOTATION", "PO", or "INVOICE"
 * @param {string} currentStatus - Current status value
 * @param {string} nextStatus - Desired next status value
 * @returns {boolean} True if legal, false otherwise
 */
function isValidTransition(entityType, currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;

  let allowed = [];
  switch (entityType.toUpperCase()) {
    case "RFQ":
      allowed = RFQ_TRANSITIONS[currentStatus];
      break;
    case "QUOTATION":
    case "QUOTE":
      allowed = QUOTATION_TRANSITIONS[currentStatus];
      break;
    case "PO":
    case "PURCHASE_ORDER":
      allowed = PO_TRANSITIONS[currentStatus];
      break;
    case "INVOICE":
      allowed = INVOICE_TRANSITIONS[currentStatus];
      break;
    default:
      return false;
  }

  return allowed ? allowed.includes(nextStatus) : false;
}

module.exports = { isValidTransition };
