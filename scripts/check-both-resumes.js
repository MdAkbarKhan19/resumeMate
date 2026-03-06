const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resumes = await prisma.resume.findMany({
    where: { 
      userId: '7777b0b9-78de-463a-84f5-5502755eab69' 
    },
    select: {
      id: true,
      title: true,
      summary: true,
      skills: true,
    },
  });

  resumes.forEach((resume, i) => {
    console.log(`\n=== Resume ${i + 1}: ${resume.title} ===`);
    console.log(`ID: ${resume.id}`);
    console.log(`Summary: ${resume.summary || '(empty)'}`);
    console.log(`Skills: ${resume.skills?.length || 0} skill categories`);
    if (resume.skills && resume.skills.length > 0) {
      resume.skills.forEach(skill => {
        console.log(`  - ${skill.category}: ${skill.items.join(', ')}`);
      });
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
