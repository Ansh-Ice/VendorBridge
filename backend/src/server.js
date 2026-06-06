const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 VendorBridge API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Register:     POST http://localhost:${PORT}/api/register`);
  console.log(`🔑 Login:        POST http://localhost:${PORT}/api/login\n`);
});

