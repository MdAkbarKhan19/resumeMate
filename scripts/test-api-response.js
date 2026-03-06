const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'akbarkhan9108@gmail.com';
  
  // Simulate what the API does
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const page = 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  
  const where = { userId: user.id };
  
  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        personalInfo: true,
        template: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
          },
        },
        atsScore: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.resume.count({ where }),
  ]);
  
  const response = {
    success: true,
    data: {
      resumes: resumes.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
  
  console.log('API Response Structure:');
  console.log(JSON.stringify(response, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
