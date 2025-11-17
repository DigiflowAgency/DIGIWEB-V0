import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding campaigns...');

  const now = new Date();

  const campaigns = [
    {
      name: 'Campagne Email - Nouvelles Solutions SEO',
      type: 'EMAIL' as const,
      status: 'ACTIVE' as const,
      budget: 5000,
      spent: 3200,
      reach: 15000,
      clicks: 1250,
      conversions: 87,
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 30),
    },
    {
      name: 'Facebook Ads - Webinaire Marketing Digital',
      type: 'PAID_ADS' as const,
      status: 'ACTIVE' as const,
      budget: 8000,
      spent: 5600,
      reach: 45000,
      clicks: 3200,
      conversions: 156,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
    },
    {
      name: 'LinkedIn Ads - Recrutement Développeurs',
      type: 'SOCIAL_MEDIA' as const,
      status: 'ACTIVE' as const,
      budget: 3000,
      spent: 1800,
      reach: 12000,
      clicks: 890,
      conversions: 45,
      startDate: new Date(now.getFullYear(), now.getMonth(), 10),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 20),
    },
    {
      name: 'Newsletter - Guide Marketing 2025',
      type: 'EMAIL' as const,
      status: 'TERMINEE' as const,
      budget: 2000,
      spent: 1950,
      reach: 25000,
      clicks: 4200,
      conversions: 312,
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    },
    {
      name: 'Google Ads - Consulting SEO',
      type: 'PAID_ADS' as const,
      status: 'TERMINEE' as const,
      budget: 10000,
      spent: 9800,
      reach: 78000,
      clicks: 5600,
      conversions: 289,
      startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() - 1, 30),
    },
    {
      name: 'Instagram Stories - Transformation Digitale',
      type: 'SOCIAL_MEDIA' as const,
      status: 'TERMINEE' as const,
      budget: 4000,
      spent: 3850,
      reach: 32000,
      clicks: 2100,
      conversions: 98,
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    },
    {
      name: 'Conférence Marketing Digital 2025',
      type: 'EVENT' as const,
      status: 'PLANIFIEE' as const,
      budget: 15000,
      spent: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 17),
    },
    {
      name: 'Email Automation - Lead Nurturing',
      type: 'EMAIL' as const,
      status: 'PLANIFIEE' as const,
      budget: 6000,
      spent: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, 30),
    },
    {
      name: 'TikTok Ads - Jeunes Entrepreneurs',
      type: 'SOCIAL_MEDIA' as const,
      status: 'BROUILLON' as const,
      budget: 5000,
      spent: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      startDate: null,
      endDate: null,
    },
    {
      name: 'Webinaire - Stratégies Growth Hacking',
      type: 'EVENT' as const,
      status: 'BROUILLON' as const,
      budget: 3500,
      spent: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      startDate: null,
      endDate: null,
    },
    {
      name: 'Twitter Ads - Thought Leadership',
      type: 'SOCIAL_MEDIA' as const,
      status: 'ACTIVE' as const,
      budget: 4500,
      spent: 2200,
      reach: 28000,
      clicks: 1890,
      conversions: 67,
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 25),
    },
    {
      name: 'Campagne Retargeting - Anciens Visiteurs',
      type: 'PAID_ADS' as const,
      status: 'ACTIVE' as const,
      budget: 7000,
      spent: 4300,
      reach: 18000,
      clicks: 2500,
      conversions: 198,
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
    },
  ];

  let created = 0;
  for (const campaign of campaigns) {
    await prisma.campaign.create({
      data: campaign,
    });
    created++;
  }

  console.log(`✅ ${created} campagnes créées avec succès`);

  // Afficher des stats
  const stats = {
    total: created,
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    planifiee: campaigns.filter(c => c.status === 'PLANIFIEE').length,
    terminee: campaigns.filter(c => c.status === 'TERMINEE').length,
    brouillon: campaigns.filter(c => c.status === 'BROUILLON').length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalReach: campaigns.reduce((sum, c) => sum + c.reach, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Active: ${stats.active}`);
  console.log(`   Planifiée: ${stats.planifiee}`);
  console.log(`   Terminée: ${stats.terminee}`);
  console.log(`   Brouillon: ${stats.brouillon}`);
  console.log(`   Budget total: ${stats.totalBudget.toLocaleString()}€`);
  console.log(`   Dépensé: ${stats.totalSpent.toLocaleString()}€`);
  console.log(`   Portée totale: ${stats.totalReach.toLocaleString()}`);
  console.log(`   Total clics: ${stats.totalClicks.toLocaleString()}`);
  console.log(`   Total conversions: ${stats.totalConversions}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
