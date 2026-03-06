/**
 * Quick script to check if resume skills are saved in database
 * Run: node scripts/check-resume-skills.js <resumeId>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResumeSkills() {
  const resumeId = process.argv[2];
  
  if (!resumeId) {
    console.error('❌ Please provide a resume ID');
    console.log('Usage: node scripts/check-resume-skills.js <resumeId>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Checking resume: ${resumeId}\n`);

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        title: true,
        skills: true,
        updatedAt: true,
      },
    });

    if (!resume) {
      console.error('❌ Resume not found');
      process.exit(1);
    }

    console.log('📋 Resume Details:');
    console.log(`   Title: ${resume.title}`);
    console.log(`   Last Updated: ${resume.updatedAt}`);
    console.log('\n📊 Skills in Database:');
    console.log(JSON.stringify(resume.skills, null, 2));
    
    // Parse and display in readable format
    if (Array.isArray(resume.skills)) {
      console.log('\n✨ Skills by Category:');
      resume.skills.forEach((skillGroup) => {
        if (skillGroup.category && skillGroup.items) {
          console.log(`\n   ${skillGroup.category}:`);
          skillGroup.items.forEach(item => {
            console.log(`      • ${item}`);
          });
        }
      });
      
      const totalSkills = resume.skills.reduce((sum, group) => 
        sum + (group.items?.length || 0), 0
      );
      console.log(`\n📈 Total Skills: ${totalSkills}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkResumeSkills();
