// Purchase Order Routes

const express = require("express");
const router = express.Router();
const poController = require("../controllers/poController");
const validate = require("../middleware/validate");
const { z } = require("zod");

const generatePoSchema = z.object({
  approvalRequestId: z.string().nonempty("approvalRequestId is required"),
});

const updatePoStatusSchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "SENT", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"], {
    errorMap: () => ({ message: "Invalid PO status value" }),
  }),
});

router.post("/",        validate(generatePoSchema), poController.generatePO);
router.get("/",         poController.getAll);
router.get("/:id",      poController.getById);
router.patch("/:id/status", validate(updatePoStatusSchema), poController.updateStatus);

module.exports = router;
