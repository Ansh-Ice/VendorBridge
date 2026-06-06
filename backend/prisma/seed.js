// Seed script — populates database with sample data for development

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...\n");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@vendorbridge.com" },
    update: {},
    create: { name: "Admin User", email: "admin@vendorbridge.com", password: hashedPassword, role: "ADMIN" },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@vendorbridge.com" },
    update: {},
    create: { name: "Procurement Lead", email: "buyer@vendorbridge.com", password: hashedPassword, role: "BUYER" },
  });

  console.log("✅ Users created:", admin.name, ",", buyer.name);

  // Create vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { email: "contact@techsupply.com" },
      update: {},
      create: {
        name: "TechSupply Corp",
        email: "contact@techsupply.com",
        phone: "+1-555-0101",
        address: "123 Tech Blvd, San Francisco, CA",
        category: "IT Services",
      },
    }),
    prisma.vendor.upsert({
      where: { email: "sales@officemax.com" },
      update: {},
      create: {
        name: "OfficeMax Solutions",
        email: "sales@officemax.com",
        phone: "+1-555-0102",
        address: "456 Commerce St, New York, NY",
        category: "Office Supplies",
      },
    }),
    prisma.vendor.upsert({
      where: { email: "info@cloudsystems.io" },
      update: {},
      create: {
        name: "CloudSystems Inc",
        email: "info@cloudsystems.io",
        phone: "+1-555-0103",
        address: "789 Cloud Ave, Seattle, WA",
        category: "Cloud Infrastructure",
      },
    }),
  ]);

  console.log(`✅ ${vendors.length} vendors created`);

  // Create sample RFQ
  const rfq = await prisma.rFQ.create({
    data: {
      title: "Q3 Laptop Procurement",
      description: "Need 50 laptops for the engineering team. Looking for business-grade machines with 16GB RAM minimum.",
      budget: 75000,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: "PUBLISHED",
      createdById: buyer.id,
      rfqVendors: {
        create: [{ vendorId: vendors[0].id }, { vendorId: vendors[2].id }],
      },
    },
  });

  console.log("✅ Sample RFQ created:", rfq.title);

  // Create a sample quotation
  await prisma.quotation.create({
    data: {
      amount: 68500,
      notes: "We can deliver within 10 business days. Includes 3-year warranty.",
      rfqId: rfq.id,
      vendorId: vendors[0].id,
    },
  });

  console.log("✅ Sample quotation created\n");
  console.log("🎉 Seed complete!");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
