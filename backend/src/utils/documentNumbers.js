const prisma = require("../config/db");

/**
 * Generates a unique, transaction-safe document number.
 * Must be executed within a Prisma transaction block or it will run inside a new transaction.
 * 
 * @param {string} organizationId - The organization ID
 * @param {string} type - "RFQ", "QUOTE", "PO", or "INVOICE"
 * @param {Object} [tx] - Optional Prisma transaction client
 * @returns {Promise<string>} The generated document number (e.g. "RFQ-FY26-0001")
 */
async function generateDocumentNumber(organizationId, type, tx = prisma) {
  const financialYear = `FY${new Date().getFullYear().toString().slice(-2)}`;

  // Find or create the counter
  let counter = await tx.documentCounter.findUnique({
    where: {
      organizationId_type_financialYear: {
        organizationId,
        type,
        financialYear,
      },
    },
  });

  if (!counter) {
    counter = await tx.documentCounter.create({
      data: {
        organizationId,
        type,
        financialYear,
        nextNumber: 1,
      },
    });
  }

  const currentNumber = counter.nextNumber;

  // Increment the counter
  await tx.documentCounter.update({
    where: {
      id: counter.id,
    },
    data: {
      nextNumber: currentNumber + 1,
    },
  });

  // Prefix mapping
  let prefix = type;
  if (type === "QUOTE") prefix = "QT";
  if (type === "INVOICE") prefix = "INV";

  const paddedNum = currentNumber.toString().padStart(4, "0");
  return `${prefix}-${financialYear}-${paddedNum}`;
}

module.exports = { generateDocumentNumber };
