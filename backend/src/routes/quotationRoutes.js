// Quotation routes

const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const validate = require("../middleware/validate");

const createQuotationRules = {
  amount:   { required: true, type: "number" },
  rfqId:    { required: true, type: "string" },
  vendorId: { required: true, type: "string" },
};

router.get("/",    quotationController.getAll);
router.post("/",   validate(createQuotationRules), quotationController.create);
router.patch("/:id/status", quotationController.updateStatus);

module.exports = router;
