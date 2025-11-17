import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding clients...');

  // Get existing users and companies
  const users = await prisma.user.findMany({
    take: 5,
  });

  const companies = await prisma.company.findMany({
    take: 10,
  });

  if (users.length === 0) {
    console.log('⚠️  No users found. Please seed users first.');
    return;
  }

  if (companies.length === 0) {
    console.log('⚠️  No companies found. Please seed companies/deals first.');
    return;
  }

  const clients = [
    {
      name: 'ACME Corporation',
      email: 'contact@acme-corp.com',
      status: 'ACTIF' as const,
      contractValue: 2500,
      healthScore: 92,
      upsellOpportunity: true,
      signedAt: new Date('2024-01-15'),
      renewalDate: new Date('2025-01-15'),
    },
    {
      name: 'TechStart',
      email: 'hello@techstart.io',
      status: 'ACTIF' as const,
      contractValue: 1800,
      healthScore: 78,
      upsellOpportunity: false,
      signedAt: new Date('2024-03-20'),
      renewalDate: new Date('2025-03-20'),
    },
    {
      name: 'Innovate Solutions',
      email: 'contact@innovate-solutions.fr',
      status: 'ACTIF' as const,
      contractValue: 3200,
      healthScore: 95,
      upsellOpportunity: true,
      signedAt: new Date('2023-11-10'),
      renewalDate: new Date('2024-11-10'),
    },
    {
      name: 'Digital Flow',
      email: 'info@digitalflow.net',
      status: 'CHURN' as const,
      contractValue: 1500,
      healthScore: 42,
      upsellOpportunity: false,
      signedAt: new Date('2024-05-05'),
      renewalDate: new Date('2025-05-05'),
    },
    {
      name: 'Creative Mind Agency',
      email: 'contact@creativemind.com',
      status: 'ACTIF' as const,
      contractValue: 2100,
      healthScore: 85,
      upsellOpportunity: true,
      signedAt: new Date('2024-02-12'),
      renewalDate: new Date('2025-02-12'),
    },
    {
      name: 'WebMaster Pro',
      email: 'admin@webmaster-pro.fr',
      status: 'ACTIF' as const,
      contractValue: 1900,
      healthScore: 71,
      upsellOpportunity: false,
      signedAt: new Date('2024-04-18'),
      renewalDate: new Date('2025-04-18'),
    },
    {
      name: 'Smart Business',
      email: 'contact@smartbiz.io',
      status: 'ACTIF' as const,
      contractValue: 2800,
      healthScore: 88,
      upsellOpportunity: true,
      signedAt: new Date('2023-12-01'),
      renewalDate: new Date('2024-12-01'),
    },
    {
      name: 'E-Commerce Plus',
      email: 'support@ecommerce-plus.com',
      status: 'ACTIF' as const,
      contractValue: 3500,
      healthScore: 81,
      upsellOpportunity: true,
      signedAt: new Date('2024-01-25'),
      renewalDate: new Date('2025-01-25'),
    },
    {
      name: 'Consulting Experts',
      email: 'contact@consulting-experts.fr',
      status: 'CHURN' as const,
      contractValue: 1200,
      healthScore: 55,
      upsellOpportunity: false,
      signedAt: new Date('2024-06-10'),
      renewalDate: new Date('2025-06-10'),
    },
    {
      name: 'Startup Hub',
      email: 'hello@startup-hub.net',
      status: 'ACTIF' as const,
      contractValue: 2400,
      healthScore: 97,
      upsellOpportunity: true,
      signedAt: new Date('2024-03-05'),
      renewalDate: new Date('2025-03-05'),
    },
  ];

  for (let i = 0; i < clients.length; i++) {
    await prisma.client.create({
      data: {
        ...clients[i],
        ownerId: users[i % users.length].id,
        companyId: i < companies.length ? companies[i].id : companies[0].id,
      },
    });
  }

  const count = await prisma.client.count();
  console.log(`✅ ${count} clients créés avec succès!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
