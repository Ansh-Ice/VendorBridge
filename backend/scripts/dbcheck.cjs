// Quick DB check — run with: node scripts/dbcheck.cjs
'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true, name: true, status: true }
    });
    console.log('✅ DB connected. Users in DB:');
    console.log(JSON.stringify(users, null, 2));
    
    const orgCount = await prisma.organization.count();
    console.log('Organizations:', orgCount);
    const vendorCount = await prisma.vendor.count();
    console.log('Vendors:', vendorCount);
  } catch (err) {
    console.error('❌ DB error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
