import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding deals...');

  // Récupérer les contacts et companies existants
  const contacts = await prisma.contacts.findMany();
  const companies = await prisma.companies.findMany();
  const user = await prisma.users.findFirst();

  if (!user) {
    console.error('❌ Aucun utilisateur trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  if (contacts.length === 0 || companies.length === 0) {
    console.error('❌ Aucun contact ou entreprise trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  // Créer des deals variés
  const deals = [
    {
      title: 'Site Web E-commerce',
      description: 'Développement d\'un site e-commerce avec panier et paiement en ligne',
      value: 12000,
      stage: 'PROPOSITION' as const,
      probability: 75,
      expectedCloseDate: new Date('2024-12-15'),
      contactId: contacts[0].id,
      companyId: contacts[0].companyId || companies[0].id,
      ownerId: user.id,
    },
    {
      title: 'Refonte Site Vitrine',
      description: 'Refonte complète du site vitrine avec nouveau design moderne',
      value: 6500,
      stage: 'NEGOCIATION' as const,
      probability: 80,
      expectedCloseDate: new Date('2024-12-10'),
      contactId: contacts[1]?.id,
      companyId: contacts[1]?.companyId || companies[0].id,
      ownerId: user.id,
    },
    {
      title: 'Application Mobile',
      description: 'Développement application mobile iOS et Android',
      value: 25000,
      stage: 'DECOUVERTE' as const,
      probability: 30,
      expectedCloseDate: new Date('2025-01-20'),
      contactId: contacts[2]?.id,
      companyId: contacts[2]?.companyId || companies[1].id,
      ownerId: user.id,
    },
    {
      title: 'SEO + Google Ads',
      description: 'Optimisation SEO et gestion campagnes Google Ads (6 mois)',
      value: 4500,
      stage: 'PROPOSITION' as const,
      probability: 70,
      expectedCloseDate: new Date('2024-12-05'),
      contactId: contacts[3]?.id,
      companyId: contacts[3]?.companyId || companies[1].id,
      ownerId: user.id,
    },
    {
      title: 'Maintenance Annuelle',
      description: 'Contrat de maintenance annuel pour le site web',
      value: 3000,
      stage: 'GAGNE' as const,
      probability: 100,
      expectedCloseDate: new Date('2024-11-10'),
      contactId: contacts[4]?.id,
      companyId: contacts[4]?.companyId || companies[2].id,
      ownerId: user.id,
    },
    {
      title: 'Formation WordPress',
      description: 'Formation équipe sur WordPress et gestion de contenu',
      value: 1500,
      stage: 'QUALIFICATION' as const,
      probability: 50,
      expectedCloseDate: new Date('2024-12-20'),
      contactId: contacts[5]?.id,
      companyId: contacts[5]?.companyId || companies[2].id,
      ownerId: user.id,
    },
    {
      title: 'API Integration',
      description: 'Intégration API CRM avec le site web existant',
      value: 8000,
      stage: 'NEGOCIATION' as const,
      probability: 65,
      expectedCloseDate: new Date('2024-12-12'),
      contactId: contacts[6]?.id,
      companyId: contacts[6]?.companyId || companies[0].id,
      ownerId: user.id,
    },
    {
      title: 'Portail Client',
      description: 'Développement portail client avec espace membre sécurisé',
      value: 15000,
      stage: 'PROPOSITION' as const,
      probability: 60,
      expectedCloseDate: new Date('2025-01-05'),
      contactId: contacts[7]?.id,
      companyId: contacts[7]?.companyId || companies[1].id,
      ownerId: user.id,
    },
    {
      title: 'Refonte Logo + Charte',
      description: 'Refonte identité visuelle complète',
      value: 3500,
      stage: 'DECOUVERTE' as const,
      probability: 40,
      expectedCloseDate: new Date('2025-01-15'),
      contactId: contacts[0]?.id,
      companyId: companies[2].id,
      ownerId: user.id,
    },
    {
      title: 'Site Web Multilingue',
      description: 'Site web corporate avec versions FR/EN/ES',
      value: 18000,
      stage: 'QUALIFICATION' as const,
      probability: 55,
      expectedCloseDate: new Date('2024-12-28'),
      contactId: contacts[1]?.id,
      companyId: companies[1].id,
      ownerId: user.id,
    },
  ];

  for (const dealData of deals) {
    await prisma.deals.create({ data: dealData as any });
  }

  console.log(`✅ ${deals.length} deals créés avec succès`);

  // Afficher les stats
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals.filter(d => d.stage === 'GAGNE').reduce((sum, d) => sum + d.value, 0);
  console.log(`💰 Valeur totale pipeline: ${totalValue.toLocaleString()}€`);
  console.log(`✅ Valeur gagnée: ${wonValue.toLocaleString()}€`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
