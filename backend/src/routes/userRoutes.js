// User routes

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const validate = require("../middleware/validate");

const createUserRules = {
  name:  { required: true, type: "string", min: 2 },
  email: { required: true, type: "string", isEmail: true },
};

router.get("/",    userController.getAll);
router.get("/:id", userController.getById);
router.post("/",   validate(createUserRules), userController.create);

module.exports = router;
