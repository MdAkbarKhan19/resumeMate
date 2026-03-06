/**
 * Fix duplicate skill categories (technical vs Technical, soft vs Soft)
 * Consolidates all variations into properly capitalized categories
 * Run: node scripts/fix-duplicate-skill-categories.js <resumeId>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSkillCategories() {
  const resumeId = process.argv[2];
  
  if (!resumeId) {
    console.error('❌ Please provide a resume ID');
    console.log('Usage: node scripts/fix-duplicate-skill-categories.js <resumeId>');
    process.exit(1);
  }

  try {
    console.log(`🔧 Fixing skill categories for resume: ${resumeId}\n`);

    // Get current resume
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { skills: true, title: true },
    });

    if (!resume) {
      console.error('❌ Resume not found');
      process.exit(1);
    }

    console.log(`📋 Resume: ${resume.title}`);
    console.log('\n📊 Before consolidation:');
    console.log(JSON.stringify(resume.skills, null, 2));

    // Consolidate skills by normalized category
    const skillsByCategory = {};
    
    if (Array.isArray(resume.skills)) {
      resume.skills.forEach((skillGroup) => {
        if (!skillGroup.category || !Array.isArray(skillGroup.items)) return;
        
        // Normalize category: lowercase first, then capitalize first letter
        const normalized = skillGroup.category.toLowerCase();
        const properCategory = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        
        if (!skillsByCategory[properCategory]) {
          skillsByCategory[properCategory] = new Set();
        }
        
        // Add all items (Set automatically deduplicates)
        skillGroup.items.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            skillsByCategory[properCategory].add(item.trim());
          }
        });
      });
    }

    // Convert back to API format
    const consolidatedSkills = Object.entries(skillsByCategory)
      .filter(([_, items]) => items.size > 0)
      .map(([category, items]) => ({
        category,
        items: Array.from(items).sort(), // Sort alphabetically
      }))
      .sort((a, b) => {
        // Sort categories: Technical first, then Soft, then others
        const order = { 'Technical': 0, 'Soft': 1 };
        return (order[a.category] ?? 99) - (order[b.category] ?? 99);
      });

    console.log('\n✨ After consolidation:');
    console.log(JSON.stringify(consolidatedSkills, null, 2));

    // Update database
    await prisma.resume.update({
      where: { id: resumeId },
      data: { skills: consolidatedSkills },
    });

    console.log('\n✅ Skills consolidated successfully!');
    
    // Summary
    const beforeCount = resume.skills?.length || 0;
    const afterCount = consolidatedSkills.length;
    const totalSkills = consolidatedSkills.reduce((sum, group) => sum + group.items.length, 0);
    
    console.log('\n📈 Summary:');
    console.log(`   Categories before: ${beforeCount}`);
    console.log(`   Categories after: ${afterCount}`);
    console.log(`   Total skills: ${totalSkills}`);
    
    consolidatedSkills.forEach(group => {
      console.log(`   • ${group.category}: ${group.items.length} skills`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSkillCategories();
