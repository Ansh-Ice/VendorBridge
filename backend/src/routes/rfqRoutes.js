// RFQ routes

const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfqController");
const validate = require("../middleware/validate");

const { z } = require("zod");

const createRfqSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(140).trim(),
  description: z.string().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable().or(z.string().transform((v) => v ? parseFloat(v) : null)).or(z.literal("")),
  deadline: z.string().optional().nullable().or(z.date()),
  vendorIds: z.array(z.string()).optional(),
  categoryId: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  createdById: z.string().optional(),
  lineItems: z.array(
    z.object({
      name: z.string().min(1, "Item name is required").trim(),
      description: z.string().optional().nullable(),
      quantity: z.number().positive("Quantity must be positive").or(z.string().transform((v) => parseFloat(v))),
      unit: z.string().min(1, "Unit is required").trim(),
      targetPrice: z.number().nonnegative().optional().nullable().or(z.string().transform((v) => v ? parseFloat(v) : null)).or(z.literal("")),
      requiredBy: z.string().optional().nullable(),
    })
  ).optional(),
});

router.get("/",    rfqController.getAll);
router.get("/:id", rfqController.getById);
router.post("/",   validate(createRfqSchema), rfqController.create);
router.put("/:id", rfqController.update);
router.delete("/:id", rfqController.remove);

module.exports = router;
