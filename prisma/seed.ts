import { PrismaClient, TemplateCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create sample templates
  const templates = [
    {
      name: 'Modern Two-Column',
      description: 'A visually engaging template with a splash of color and two-column layout',
      category: 'MODERN' as TemplateCategory,
      htmlTemplate: `<!-- Template HTML will be filled in during implementation -->`,
      cssStyles: `/* Template CSS will be filled in during implementation */`,
      isActive: true,
      isPremium: false,
    },
    {
      name: 'Minimalist Single-Column',
      description: 'A simple, elegant design with black-and-white color scheme',
      category: 'MINIMALIST' as TemplateCategory,
      htmlTemplate: `<!-- Template HTML will be filled in during implementation -->`,
      cssStyles: `/* Template CSS will be filled in during implementation */`,
      isActive: true,
      isPremium: false,
    },
    {
      name: 'Professional Corporate',
      description: 'A traditional look with clear section separators',
      category: 'PROFESSIONAL' as TemplateCategory,
      htmlTemplate: `<!-- Template HTML will be filled in during implementation -->`,
      cssStyles: `/* Template CSS will be filled in during implementation */`,
      isActive: true,
      isPremium: false,
    },
    {
      name: 'Creative ATS-Optimized',
      description: 'Design-forward template that maintains ATS compatibility',
      category: 'CREATIVE' as TemplateCategory,
      htmlTemplate: `<!-- Template HTML will be filled in during implementation -->`,
      cssStyles: `/* Template CSS will be filled in during implementation */`,
      isActive: true,
      isPremium: true,
    },
    {
      name: 'Hybrid Flexible',
      description: 'Versatile format adaptable between one and two columns',
      category: 'HYBRID' as TemplateCategory,
      htmlTemplate: `<!-- Template HTML will be filled in during implementation -->`,
      cssStyles: `/* Template CSS will be filled in during implementation */`,
      isActive: true,
      isPremium: false,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name },
    });
    
    if (!existing) {
      await prisma.template.create({
        data: template,
      });
    }
  }

  console.log('✅ Created templates');

  // Create a test user (for development)
  if (process.env.NODE_ENV === 'development') {
    const testUser = await prisma.user.upsert({
      where: { email: 'test@resumemate.com' },
      update: {},
      create: {
        email: 'test@resumemate.com',
        name: 'Test User',
        passwordHash: '$2a$10$XQlK5xqJZLF1Xq3YxQHqX.VvKZqXqZqXqZqXqZqXqZqXqZqXqZqXq', // "password123"
        emailVerified: true,
        planType: 'FREE',
      },
    });

    console.log('✅ Created test user:', testUser.email);
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
