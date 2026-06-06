// Prisma client singleton
// Prevents multiple instances during hot-reload in development

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

module.exports = prisma;
