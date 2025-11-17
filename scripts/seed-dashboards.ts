import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dashboards...');

  const dashboards = [
    { name: 'Vue Commerciale', description: 'KPIs ventes et deals', widgets: 8, favorite: true },
    { name: 'Performance Marketing', description: 'Campagnes et ROI', widgets: 12, favorite: true },
    { name: 'Support Client', description: 'Tickets et satisfaction', widgets: 6, favorite: false },
    { name: 'Vue Financière', description: 'CA et facturation', widgets: 10, favorite: false },
    { name: 'Pipeline Ventes', description: 'Deals et conversions', widgets: 7, favorite: true },
    { name: 'Analytics Web', description: 'Trafic et conversions', widgets: 9, favorite: false },
    { name: 'Email Marketing', description: 'Campagnes email', widgets: 5, favorite: false },
    { name: 'Vue Executive', description: 'KPIs direction', widgets: 15, favorite: true },
  ];

  for (const data of dashboards) {
    await prisma.customDashboard.create({ data });
  }

  console.log(`✅ ${dashboards.length} dashboards créés`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
