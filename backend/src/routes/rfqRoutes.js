// RFQ routes

const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfqController");
const validate = require("../middleware/validate");

// Validation rules for creating an RFQ
const createRfqRules = {
  title:       { required: true, type: "string", min: 3 },
  createdById: { required: true, type: "string" },
};

router.get("/",    rfqController.getAll);
router.get("/:id", rfqController.getById);
router.post("/",   validate(createRfqRules), rfqController.create);
router.put("/:id", rfqController.update);
router.delete("/:id", rfqController.remove);

module.exports = router;
