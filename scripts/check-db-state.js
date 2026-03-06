const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const resumes = await prisma.resume.findMany();
  console.log(`\nTotal resumes in DB: ${resumes.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
