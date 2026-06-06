// Seed script — populates database with sample data for development
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...\n");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Acme Corporates Ltd",
      legalName: "Acme Corporates India Private Limited",
      gstin: "27AAAAA1111A1Z1",
      billingAddress: "101, Business Park, Bandra East, Mumbai, Maharashtra",
      stateCode: "MH", // Maharashtra
      currency: "INR",
    },
  });
  console.log("✅ Organization created:", org.name);

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Admin User",
      email: "admin@vendorbridge.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const buyer = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Procurement Officer",
      email: "buyer@vendorbridge.com",
      password: hashedPassword,
      role: "PROCUREMENT_OFFICER",
    },
  });

  const approver = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Finance Manager",
      email: "approver@vendorbridge.com",
      password: hashedPassword,
      role: "APPROVER",
    },
  });

  console.log("✅ Users created: Admin, Procurement Officer, Finance Manager");

  // 3. Create Vendor Categories
  const catIT = await prisma.vendorCategory.create({
    data: { organizationId: org.id, name: "IT Services", description: "Hardware, software, and IT consulting services" },
  });
  const catOffice = await prisma.vendorCategory.create({
    data: { organizationId: org.id, name: "Office Supplies", description: "Stationery, office pantry, and accessories" },
  });
  const catCloud = await prisma.vendorCategory.create({
    data: { organizationId: org.id, name: "Cloud Infrastructure", description: "Hosting, cloud services, and bandwidth" },
  });

  // 4. Create Vendors
  // TechSupply is in KA (Karnataka) -> Different state (IGST)
  const vendorTech = await prisma.vendor.create({
    data: {
      organizationId: org.id,
      name: "TechSupply Corp",
      legalName: "TechSupply Solutions Private Limited",
      email: "contact@techsupply.com",
      phone: "+91-9876543210",
      contactName: "Rohan Kumar",
      addressLine1: "12, IT Park, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      stateCode: "KA",
      postalCode: "560103",
      gstin: "29BBBBB2222B2Z2",
      pan: "BBBBB2222B",
      categoryId: catIT.id,
      status: "ACTIVE",
      rating: 4.5,
      paymentTerms: "NET30",
    },
  });

  // OfficeMax is in MH (Maharashtra) -> Same state (CGST + SGST)
  const vendorOffice = await prisma.vendor.create({
    data: {
      organizationId: org.id,
      name: "OfficeMax Solutions",
      legalName: "OfficeMax Retail Ventures",
      email: "sales@officemax.com",
      phone: "+91-8765432109",
      contactName: "Priya Sharma",
      addressLine1: "54, Link Road, Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "MH",
      postalCode: "400053",
      gstin: "27CCCCC3333C3Z3",
      pan: "CCCCC3333C",
      categoryId: catOffice.id,
      status: "ACTIVE",
      rating: 4.2,
      paymentTerms: "NET15",
    },
  });

  const vendorCloud = await prisma.vendor.create({
    data: {
      organizationId: org.id,
      name: "CloudSystems Inc",
      legalName: "CloudSystems Hosting Services",
      email: "info@cloudsystems.io",
      phone: "+91-7654321098",
      contactName: "Amit Patel",
      addressLine1: "Suite 404, Cyber City",
      city: "Gurugram",
      state: "Haryana",
      stateCode: "HR",
      postalCode: "122002",
      gstin: "06DDDDD4444D4Z4",
      pan: "DDDDD4444D",
      categoryId: catCloud.id,
      status: "ACTIVE",
      rating: 4.8,
      paymentTerms: "IMMEDIATE",
    },
  });

  console.log("✅ Vendors created: TechSupply, OfficeMax, CloudSystems");

  // 5. Link a VENDOR User
  const vendorUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      vendorId: vendorTech.id,
      name: "TechSupply Vendor Portal",
      email: "vendor@techsupply.com",
      password: hashedPassword,
      role: "VENDOR",
    },
  });
  console.log("✅ Vendor Portal User created:", vendorUser.email);

  // 6. Initialize Document Counters
  await prisma.documentCounter.createMany({
    data: [
      { organizationId: org.id, type: "RFQ", financialYear: "FY26", nextNumber: 1 },
      { organizationId: org.id, type: "QUOTE", financialYear: "FY26", nextNumber: 1 },
      { organizationId: org.id, type: "PO", financialYear: "FY26", nextNumber: 1 },
      { organizationId: org.id, type: "INVOICE", financialYear: "FY26", nextNumber: 1 },
    ],
  });
  console.log("✅ Sequential numbering counters initialized");

  // 7. Create Approval Rule
  await prisma.approvalRule.create({
    data: {
      organizationId: org.id,
      name: "Standard Procurement Rule",
      minAmount: 0.0,
      maxAmount: null,
      approversJson: JSON.stringify([approver.id]),
      active: true,
    },
  });
  console.log("✅ Standard Approval Rule created");

  // 8. Create sample RFQ
  const rfq = await prisma.rFQ.create({
    data: {
      organizationId: org.id,
      rfqNumber: "RFQ-FY26-0001",
      title: "Q3 Laptop Procurement",
      description: "Need business-grade laptops for the engineering team. Looking for 16GB RAM minimum, 512GB SSD.",
      categoryId: catIT.id,
      budget: 750000, // ₹7,50,000
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: "PUBLISHED",
      createdById: buyer.id,
      rfqVendors: {
        create: [
          { vendorId: vendorTech.id, status: "INVITED" },
          { vendorId: vendorOffice.id, status: "INVITED" },
        ],
      },
      lineItems: {
        create: [
          { name: "Developer Laptops", description: "14-inch screen, 16GB RAM, 512GB SSD, Core i7 or M2", quantity: 8, unit: "units", targetPrice: 85000, sortOrder: 1 },
          { name: "External Monitors", description: "27-inch 4K IPS monitors with USB-C PD", quantity: 10, unit: "units", targetPrice: 20000, sortOrder: 2 },
        ],
      },
    },
    include: {
      lineItems: true,
    },
  });
  console.log("✅ Sample RFQ created:", rfq.rfqNumber);

  // 9. Create a sample quotation from TechSupply (Karnataka -> Different state, IGST)
  // Quantities: Laptops = 8 * 80000 = 640000. Monitors = 10 * 19000 = 190000.
  // Subtotal = 830000. Tax (18% IGST) = 149400. Grand Total = 979400.
  const quote = await prisma.quotation.create({
    data: {
      organizationId: org.id,
      rfqId: rfq.id,
      vendorId: vendorTech.id,
      quoteNumber: "QT-FY26-0001",
      subtotal: 830000,
      taxAmount: 149400,
      shippingAmount: 5000,
      discountAmount: 10000,
      grandTotal: 974400, // 830000 + 149400 + 5000 - 10000
      deliveryDays: 10,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: "NET30",
      notes: "Can deliver all monitors in 5 days, laptops will take 10 days. 3-year warranty included.",
      status: "SUBMITTED",
      submittedAt: new Date(),
      lineItems: {
        create: [
          { rfqLineItemId: rfq.lineItems[0].id, unitPrice: 80000, quantity: 8, taxRate: 18.0, lineSubtotal: 640000, lineTax: 115200, lineTotal: 755200, deliveryDays: 10, notes: "Lenovo ThinkPad L14 Gen 4" },
          { rfqLineItemId: rfq.lineItems[1].id, unitPrice: 19000, quantity: 10, taxRate: 18.0, lineSubtotal: 190000, lineTax: 34200, lineTotal: 224200, deliveryDays: 5, notes: "Dell 27\" U2723QE" },
        ],
      },
    },
  });
  console.log("✅ Sample Quotation submitted by TechSupply");

  // 10. Update RFQ vendor invite status
  await prisma.rFQVendor.update({
    where: { rfqId_vendorId: { rfqId: rfq.id, vendorId: vendorTech.id } },
    data: { status: "QUOTED", respondedAt: new Date() },
  });

  console.log("\n🎉 Seed complete successfully!");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
