// Approval routes

const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");
const validate = require("../middleware/validate");
const { z } = require("zod");

const createApprovalSchema = z.object({
  rfqId: z.string().nonempty("rfqId is required"),
  quotationId: z.string().nonempty("quotationId is required"),
});

const decideApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Status must be APPROVED or REJECTED" }),
  }),
  remarks: z.string().optional().nullable(),
});

router.post("/",        validate(createApprovalSchema), approvalController.createRequest);
router.get("/",         approvalController.getAll);
router.get("/:id",      approvalController.getById);
router.post("/:id/decide", validate(decideApprovalSchema), approvalController.decideStep);

module.exports = router;
