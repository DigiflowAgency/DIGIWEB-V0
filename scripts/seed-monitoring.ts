import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding monitoring data...');

  // Get existing clients
  const clients = await prisma.client.findMany({
    take: 10,
  });

  if (clients.length === 0) {
    console.log('⚠️  No clients found. Please seed clients first.');
    return;
  }

  const monitoringData = [
    {
      domain: 'acme-corp.com',
      uptime: 99.98,
      cpu: 45,
      memory: 62,
      ssl: true,
      lastBackup: '2025-11-15',
      nps: 9,
      status: 'healthy',
    },
    {
      domain: 'techstart.io',
      uptime: 99.85,
      cpu: 72,
      memory: 81,
      ssl: true,
      lastBackup: '2025-11-16',
      nps: 8,
      status: 'warning',
    },
    {
      domain: 'innovate-solutions.fr',
      uptime: 99.99,
      cpu: 32,
      memory: 48,
      ssl: true,
      lastBackup: '2025-11-17',
      nps: 10,
      status: 'healthy',
    },
    {
      domain: 'digitalflow.net',
      uptime: 97.5,
      cpu: 89,
      memory: 94,
      ssl: false,
      lastBackup: '2025-11-10',
      nps: 5,
      status: 'critical',
    },
    {
      domain: 'creativemind.com',
      uptime: 99.92,
      cpu: 55,
      memory: 68,
      ssl: true,
      lastBackup: '2025-11-16',
      nps: 8,
      status: 'healthy',
    },
    {
      domain: 'webmaster-pro.fr',
      uptime: 99.7,
      cpu: 61,
      memory: 75,
      ssl: true,
      lastBackup: '2025-11-15',
      nps: 7,
      status: 'warning',
    },
    {
      domain: 'smartbiz.io',
      uptime: 99.95,
      cpu: 38,
      memory: 52,
      ssl: true,
      lastBackup: '2025-11-17',
      nps: 9,
      status: 'healthy',
    },
    {
      domain: 'ecommerce-plus.com',
      uptime: 99.88,
      cpu: 68,
      memory: 79,
      ssl: true,
      lastBackup: '2025-11-16',
      nps: 8,
      status: 'healthy',
    },
    {
      domain: 'consulting-experts.fr',
      uptime: 98.2,
      cpu: 85,
      memory: 91,
      ssl: true,
      lastBackup: '2025-11-12',
      nps: 6,
      status: 'warning',
    },
    {
      domain: 'startup-hub.net',
      uptime: 99.99,
      cpu: 28,
      memory: 41,
      ssl: true,
      lastBackup: '2025-11-17',
      nps: 10,
      status: 'healthy',
    },
  ];

  for (let i = 0; i < Math.min(clients.length, monitoringData.length); i++) {
    await prisma.clientMonitoring.create({
      data: {
        clientId: clients[i].id,
        ...monitoringData[i],
      },
    });
  }

  const count = await prisma.clientMonitoring.count();
  console.log(`✅ ${count} monitoring records created successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
