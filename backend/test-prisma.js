const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function main() {
  console.log('Attempting to connect to database using Prisma Client...');
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('[SUCCESS] Query completed successfully:', users);
  } catch (error) {
    console.error('[ERROR] Prisma query failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
