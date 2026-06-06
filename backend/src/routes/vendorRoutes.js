// Vendor routes

const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const validate = require("../middleware/validate");

const { z } = require("zod");

const createVendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters").max(120).trim(),
  legalName: z.string().max(160).optional().nullable(),
  email: z.string().email("Enter a valid email").toLowerCase().trim(),
  phone: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  stateCode: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED", "PENDING_REVIEW"]).optional(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).trim(),
  description: z.string().optional().nullable(),
});

router.get("/categories", vendorController.getCategories);
router.post("/categories", validate(createCategorySchema), vendorController.createCategory);

router.get("/",    vendorController.getAll);
router.get("/:id", vendorController.getById);
router.post("/",   validate(createVendorSchema), vendorController.create);
router.put("/:id", vendorController.update);
router.delete("/:id", vendorController.remove);

module.exports = router;
