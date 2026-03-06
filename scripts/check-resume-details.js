const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'akbarkhan9108@gmail.com';
  
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  // Get resumes with full details
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          thumbnail: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  console.log(`📄 Found ${resumes.length} resume(s):\n`);
  
  resumes.forEach((resume, i) => {
    console.log(`Resume ${i + 1}:`);
    console.log(`  ID: ${resume.id}`);
    console.log(`  Title: ${resume.title}`);
    console.log(`  Template: ${resume.template.name}`);
    console.log(`  ATS Score: ${resume.atsScore}`);
    console.log(`  Created: ${resume.createdAt.toISOString()}`);
    console.log(`  Updated: ${resume.updatedAt.toISOString()}`);
    console.log(`  Personal Info:`, JSON.stringify(resume.personalInfo, null, 2));
    console.log(`  Summary: ${resume.summary ? resume.summary.substring(0, 100) + '...' : 'None'}`);
    console.log(`  Experience entries: ${Array.isArray(resume.experience) ? resume.experience.length : 0}`);
    console.log(`  Education entries: ${Array.isArray(resume.education) ? resume.education.length : 0}`);
    console.log(`  Skills entries: ${Array.isArray(resume.skills) ? resume.skills.length : 0}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
