const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resumes = await prisma.resume.findMany({
    select: {
      id: true,
      title: true,
      userId: true,
      personalInfo: true,
      experience: true,
      education: true,
      skills: true,
    },
  });

  console.log('All resumes:');
  resumes.forEach((resume) => {
    console.log(`\nID: ${resume.id}`);
    console.log(`Title: ${resume.title}`);
    console.log(`User ID: ${resume.userId}`);
    console.log(`Personal Info: ${resume.personalInfo ? 'Yes' : 'No'}`);
    console.log(`Experience: ${resume.experience?.length || 0} entries`);
    console.log(`Education: ${resume.education?.length || 0} entries`);
    console.log(`Skills: ${resume.skills?.length || 0} items`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
