// Quotation routes

const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const validate = require("../middleware/validate");

const { z } = require("zod");

const createQuotationSchema = z.object({
  rfqId: z.string().nonempty("RFQ ID is required"),
  amount: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  shippingAmount: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  grandTotal: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
  vendorId: z.string().optional(),
  deliveryDays: z.number().int().nonnegative().optional(),
  validUntil: z.string().optional(),
  paymentTerms: z.string().optional().nullable(),
  lineItems: z.array(z.object({
    rfqLineItemId: z.string(),
    unitPrice: z.number().nonnegative(),
    quantity: z.number().positive(),
    taxRate: z.number().nonnegative().default(18.0),
    notes: z.string().optional().nullable(),
  })).optional(),
});

router.get("/",    quotationController.getAll);
router.get("/:id", quotationController.getById);
router.post("/",   validate(createQuotationSchema), quotationController.create);
router.patch("/:id/status", quotationController.updateStatus);

module.exports = router;
