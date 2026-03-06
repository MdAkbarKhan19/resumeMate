const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'akbarkhan9108@gmail.com';
  
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, planType: true }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:', user);
  console.log('');
  
  // Get resumes for this user
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      template: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`📄 Found ${resumes.length} resume(s):`);
  resumes.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.title} (${r.template.name})`);
    console.log(`     ID: ${r.id}`);
    console.log(`     Created: ${r.createdAt.toISOString()}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
