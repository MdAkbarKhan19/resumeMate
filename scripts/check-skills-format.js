const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resume = await prisma.resume.findFirst({
    where: { id: '4331666a-f5cd-4b42-89a7-7b097d2af6db' },
    select: {
      skills: true,
      summary: true,
    },
  });

  console.log('Skills structure:');
  console.log(JSON.stringify(resume.skills, null, 2));
  console.log('\nSummary:');
  console.log(resume.summary || 'No summary');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
