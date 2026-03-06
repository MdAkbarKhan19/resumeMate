const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resumes = await prisma.resume.findMany({
    where: { userId: 'a7bb8b05-3ed9-437c-8cc0-a06d0c5dbaed' },
  });

  console.log(`Found ${resumes.length} resumes`);
  console.log(JSON.stringify(resumes, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
