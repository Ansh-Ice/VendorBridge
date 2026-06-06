// User routes

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const validate = require("../middleware/validate");

const { z } = require("zod");

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).trim(),
  email: z.string().email("Enter a valid email").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "APPROVER"]).optional(),
  vendorId: z.string().optional().nullable(),
});

router.get("/",    userController.getAll);
router.get("/:id", userController.getById);
router.post("/",   validate(createUserSchema), userController.create);

module.exports = router;
