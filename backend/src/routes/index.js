// Central route index — mounts all route modules

const express = require("express");
const router = express.Router();

router.use("/vendors",    require("./vendorRoutes"));
router.use("/rfqs",       require("./rfqRoutes"));
router.use("/quotations", require("./quotationRoutes"));
router.use("/users",      require("./userRoutes"));

module.exports = router;
