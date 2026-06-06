// Vendor routes

const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const validate = require("../middleware/validate");

// Validation rules for creating a vendor
const createVendorRules = {
  name:  { required: true, type: "string", min: 2 },
  email: { required: true, type: "string", isEmail: true },
};

router.get("/",    vendorController.getAll);
router.get("/:id", vendorController.getById);
router.post("/",   validate(createVendorRules), vendorController.create);
router.put("/:id", vendorController.update);
router.delete("/:id", vendorController.remove);

module.exports = router;
