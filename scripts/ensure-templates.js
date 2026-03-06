const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating templates...');

  // Create default template if none exist
  const existingTemplates = await prisma.template.findMany();
  
  if (existingTemplates.length === 0) {
    await prisma.template.create({
      data: {
        name: 'Modern Two-Column',
        description: 'A visually engaging template with a splash of color and two-column layout',
        category: 'MODERN',
        htmlTemplate: `<!-- Template HTML -->`,
        cssStyles: `/* Template CSS */`,
        isActive: true,
        isPremium: false,
      }
    });
    console.log('✅ Created default template');
  } else {
    console.log(`✅ Found ${existingTemplates.length} existing templates`);
    existingTemplates.forEach(t => console.log(`  - ${t.name} (${t.id})`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
