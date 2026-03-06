const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resumes = await prisma.resume.findMany({
    where: { userId: 'a7bb8b05-3ed9-437c-8cc0-a06d0c5dbaed' },
    select: {
      id: true,
      title: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
    },
  });

  console.log('Resumes with content:');
  resumes.forEach((resume) => {
    console.log(`\n${resume.title} (${resume.id}):`);
    console.log(`  Experience entries: ${resume.experience?.length || 0}`);
    console.log(`  Education entries: ${resume.education?.length || 0}`);
    console.log(`  Skills: ${resume.skills?.length || 0}`);
    console.log(`  Projects: ${resume.projects?.length || 0}`);
    console.log(`  Certifications: ${resume.certifications?.length || 0}`);
    
    if (resume.experience?.[0]) {
      console.log(`  Latest job: ${resume.experience[0].jobTitle || 'N/A'} at ${resume.experience[0].company || 'N/A'}`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
