'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'buyer@vendorbridge.com';
  const password = 'password123';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User found:', user.email, '| hash:', user.password);
  const valid = await bcrypt.compare(password, user.password);
  console.log('Password match:', valid ? '✅ YES' : '❌ NO');

  if (!valid) {
    // Re-hash and fix all demo users
    console.log('\n🔧 Fixing passwords for all demo users...');
    const hash = await bcrypt.hash('password123', 12);
    const emails = ['admin@vendorbridge.com','buyer@vendorbridge.com','vendor@techsupply.com','approver@vendorbridge.com'];
    for (const em of emails) {
      await prisma.user.update({ where: { email: em }, data: { password: hash } });
      console.log('  Fixed:', em);
    }
    console.log('✅ All demo user passwords reset to password123');
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e.message); process.exit(1); });
