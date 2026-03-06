const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'akbarkhan9108@gmail.com';
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        planType: 'TIER2',
        subscriptionActive: true,
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        resumeCredits: 999,
        resumesCreated: 0,
      },
    });
    
    console.log('✅ User updated successfully:');
    console.log({
      email: user.email,
      planType: user.planType,
      subscriptionActive: user.subscriptionActive,
      subscriptionExpiry: user.subscriptionExpiry,
      resumeCredits: user.resumeCredits,
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
