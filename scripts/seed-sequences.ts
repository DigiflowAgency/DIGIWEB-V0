import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sequences...');

  const sequencesData = [
    {
      name: 'Prospection Cold Email',
      description: 'Séquence de prospection à froid en 5 étapes',
      emailsCount: 5,
      config: JSON.stringify({
        emails: [
          { subject: 'Bonjour {firstName}', delay: 0 },
          { subject: 'Re: Notre solution pour {company}', delay: '3d' },
          { subject: 'Dernière tentative', delay: '7d' },
          { subject: 'Étude de cas similaire', delay: '10d' },
          { subject: 'Démonstration gratuite ?', delay: '14d' },
        ],
      }),
      enrolled: 234,
      completed: 145,
      openRate: 67,
      replyRate: 23,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Nurturing Leads',
      description: 'Nurturing progressif sur 3 semaines',
      emailsCount: 7,
      config: JSON.stringify({
        emails: [
          { subject: 'Bienvenue dans notre communauté', delay: 0 },
          { subject: 'Guide complet pour démarrer', delay: '2d' },
          { subject: 'Cas client: Success Story', delay: '4d' },
          { subject: 'Fonctionnalités avancées', delay: '7d' },
          { subject: 'Webinar exclusif', delay: '10d' },
          { subject: 'Offre spéciale', delay: '14d' },
          { subject: 'Dernière chance', delay: '21d' },
        ],
      }),
      enrolled: 189,
      completed: 98,
      openRate: 72,
      replyRate: 34,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Follow-up Demo',
      description: 'Suivi après démonstration produit',
      emailsCount: 4,
      config: JSON.stringify({
        emails: [
          { subject: 'Merci pour votre temps', delay: '2h' },
          { subject: 'Réponses à vos questions', delay: '1d' },
          { subject: 'Proposition commerciale', delay: '3d' },
          { subject: 'Êtes-vous prêt à démarrer ?', delay: '7d' },
        ],
      }),
      enrolled: 156,
      completed: 112,
      openRate: 81,
      replyRate: 45,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Onboarding Client',
      description: 'Accompagnement des nouveaux clients',
      emailsCount: 6,
      config: JSON.stringify({
        emails: [
          { subject: 'Bienvenue chez DigiFlow !', delay: 0 },
          { subject: 'Vos premiers pas', delay: '1d' },
          { subject: 'Configuration de votre compte', delay: '3d' },
          { subject: 'Ressources et tutoriels', delay: '7d' },
          { subject: 'Check-in: Tout va bien ?', delay: '14d' },
          { subject: 'Maximisez votre ROI', delay: '30d' },
        ],
      }),
      enrolled: 89,
      completed: 67,
      openRate: 78,
      replyRate: 12,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Réactivation',
      description: 'Réengagement des contacts inactifs',
      emailsCount: 3,
      config: JSON.stringify({
        emails: [
          { subject: 'Vous nous manquez !', delay: 0 },
          { subject: 'Nouveautés depuis votre absence', delay: '5d' },
          { subject: 'Offre de retour exclusive', delay: '10d' },
        ],
      }),
      enrolled: 245,
      completed: 178,
      openRate: 58,
      replyRate: 28,
      status: 'PAUSE' as const,
    },
    {
      name: 'Upsell Existing',
      description: 'Montée en gamme pour clients existants',
      emailsCount: 5,
      config: JSON.stringify({
        emails: [
          { subject: 'Découvrez nos nouvelles fonctionnalités', delay: 0 },
          { subject: 'Success story: Client premium', delay: '3d' },
          { subject: 'Démo des fonctionnalités avancées', delay: '7d' },
          { subject: 'Offre upgrade limitée', delay: '10d' },
          { subject: 'Dernier jour pour profiter', delay: '14d' },
        ],
      }),
      enrolled: 134,
      completed: 87,
      openRate: 65,
      replyRate: 31,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Event Invitation',
      description: 'Invitation et rappels pour événements',
      emailsCount: 4,
      config: JSON.stringify({
        emails: [
          { subject: 'Save the date: Événement exclusif', delay: 0 },
          { subject: 'Programme détaillé', delay: '7d' },
          { subject: 'Plus que 3 jours !', delay: '18d' },
          { subject: 'Rappel: C\'est demain', delay: '20d' },
        ],
      }),
      enrolled: 312,
      completed: 289,
      openRate: 84,
      replyRate: 67,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Survey Request',
      description: 'Demande de feedback client',
      emailsCount: 2,
      config: JSON.stringify({
        emails: [
          { subject: 'Votre avis compte pour nous', delay: 0 },
          { subject: 'Rappel: 5 minutes pour nous aider', delay: '5d' },
        ],
      }),
      enrolled: 456,
      completed: 398,
      openRate: 76,
      replyRate: 198,
      status: 'ACTIVE' as const,
    },
  ];

  let created = 0;
  for (const sequenceData of sequencesData) {
    await prisma.sequences.create({
      data: sequenceData as any,
    });
    created++;
  }

  console.log(`✅ ${created} séquences créées avec succès`);

  // Afficher des stats
  const totalEnrolled = sequencesData.reduce((sum, s) => sum + s.enrolled, 0);
  const totalCompleted = sequencesData.reduce((sum, s) => sum + s.completed, 0);

  const stats = {
    total: created,
    active: sequencesData.filter((s) => s.status === 'ACTIVE').length,
    pause: sequencesData.filter((s) => s.status === 'PAUSE').length,
    totalEnrolled,
    totalCompleted,
    avgOpenRate: (
      sequencesData.reduce((sum, s) => sum + s.openRate, 0) / sequencesData.length
    ).toFixed(1),
    avgReplyRate: (
      sequencesData.reduce((sum, s) => sum + s.replyRate, 0) / sequencesData.length
    ).toFixed(1),
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   \n   Par statut:`);
  console.log(`   - Actives: ${stats.active}`);
  console.log(`   - En pause: ${stats.pause}`);
  console.log(`   \n   Contacts inscrits: ${stats.totalEnrolled}`);
  console.log(`   Contacts terminés: ${stats.totalCompleted}`);
  console.log(`   Taux d'ouverture moyen: ${stats.avgOpenRate}%`);
  console.log(`   Taux de réponse moyen: ${stats.avgReplyRate}%`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
