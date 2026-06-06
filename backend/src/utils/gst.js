/**
 * Calculates GST components based on states of customer and vendor.
 * 
 * @param {string} customerState - Customer state code (e.g. "MH")
 * @param {string} vendorState - Vendor state code (e.g. "KA")
 * @param {number} subtotal - The subtotal amount to calculate tax on
 * @param {number} rate - Tax rate percentage (e.g. 18.0)
 * @returns {Object} { cgst: number, sgst: number, igst: number, taxAmount: number, grandTotal: number }
 */
function calculateGST(customerState, vendorState, subtotal, rate = 18.0) {
  const customer = (customerState || "").trim().toUpperCase();
  const vendor = (vendorState || "").trim().toUpperCase();
  const sub = Number(subtotal) || 0;
  const r = Number(rate) || 0;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let taxAmount = 0;

  if (customer && vendor) {
    if (customer === vendor) {
      // Same-state: CGST + SGST
      const halfRate = r / 2;
      cgst = Number((sub * (halfRate / 100)).toFixed(2));
      sgst = Number((sub * (halfRate / 100)).toFixed(2));
      taxAmount = Number((cgst + sgst).toFixed(2));
    } else {
      // Different-state: IGST
      igst = Number((sub * (r / 100)).toFixed(2));
      taxAmount = igst;
    }
  } else {
    // Fallback if states are missing
    igst = Number((sub * (r / 100)).toFixed(2));
    taxAmount = igst;
  }

  const grandTotal = Number((sub + taxAmount).toFixed(2));

  return {
    cgst,
    sgst,
    igst,
    taxAmount,
    grandTotal
  };
}

module.exports = { calculateGST };
