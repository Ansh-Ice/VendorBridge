// Invoice Routes

const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const validate = require("../middleware/validate");
const { z } = require("zod");

const generateInvoiceSchema = z.object({
  purchaseOrderId: z.string().nonempty("purchaseOrderId is required"),
  invoiceDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const updateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "GENERATED", "SENT", "PAID", "OVERDUE", "VOID"], {
    errorMap: () => ({ message: "Invalid invoice status value" }),
  }),
});

router.post("/",        validate(generateInvoiceSchema), invoiceController.generateInvoice);
router.get("/",         invoiceController.getAll);
router.get("/:id",      invoiceController.getById);
router.patch("/:id/status", validate(updateInvoiceStatusSchema), invoiceController.updateStatus);

module.exports = router;
