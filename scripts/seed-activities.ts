import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding activities...');

  // Récupérer les contacts, deals et user existants
  const contacts = await prisma.contacts.findMany();
  const deals = await prisma.deals.findMany();
  const user = await prisma.users.findFirst();

  if (!user) {
    console.error('❌ Aucun utilisateur trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  if (contacts.length === 0) {
    console.error('❌ Aucun contact trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  // Créer des activités variées
  const now = new Date();
  const activities = [
    {
      title: 'Appel de découverte',
      description: 'Premier contact pour comprendre les besoins',
      type: 'APPEL' as const,
      status: 'PLANIFIEE' as const,
      priority: 'HAUTE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0),
      duration: 30,
      contactId: contacts[0]?.id,
      dealId: deals[0]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Présentation commerciale',
      description: 'Présentation détaillée de notre offre et démo',
      type: 'REUNION' as const,
      status: 'PLANIFIEE' as const,
      priority: 'HAUTE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 30),
      duration: 60,
      contactId: contacts[1]?.id,
      dealId: deals[1]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Envoi proposition commerciale',
      description: 'Envoi du devis détaillé avec conditions',
      type: 'EMAIL' as const,
      status: 'COMPLETEE' as const,
      priority: 'MOYENNE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0),
      completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 15),
      contactId: contacts[2]?.id,
      dealId: deals[2]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Visioconférence technique',
      description: 'Atelier technique avec l\'équipe IT du client',
      type: 'VISIO' as const,
      status: 'PLANIFIEE' as const,
      priority: 'HAUTE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 15, 0),
      duration: 90,
      contactId: contacts[3]?.id,
      dealId: deals[3]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Relance téléphonique',
      description: 'Relance suite à l\'envoi de la proposition',
      type: 'APPEL' as const,
      status: 'PLANIFIEE' as const,
      priority: 'MOYENNE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
      duration: 15,
      contactId: contacts[4]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Réunion de kick-off',
      description: 'Lancement officiel du projet avec toute l\'équipe',
      type: 'REUNION' as const,
      status: 'COMPLETEE' as const,
      priority: 'HAUTE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 10, 0),
      duration: 120,
      completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 12, 10),
      contactId: contacts[5]?.id,
      dealId: deals[4]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Email de suivi projet',
      description: 'Point d\'avancement hebdomadaire',
      type: 'EMAIL' as const,
      status: 'COMPLETEE' as const,
      priority: 'BASSE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 30),
      completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 45),
      contactId: contacts[6]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Appel support client',
      description: 'Assistance technique sur une fonctionnalité',
      type: 'APPEL' as const,
      status: 'COMPLETEE' as const,
      priority: 'HAUTE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30),
      duration: 20,
      completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 50),
      contactId: contacts[7]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Visio formation utilisateur',
      description: 'Formation sur l\'utilisation de la plateforme',
      type: 'VISIO' as const,
      status: 'PLANIFIEE' as const,
      priority: 'MOYENNE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 14, 0),
      duration: 60,
      contactId: contacts[0]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Réunion de clôture',
      description: 'Validation finale et signature',
      type: 'REUNION' as const,
      status: 'PLANIFIEE' as const,
      priority: 'HAUTE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 11, 0),
      duration: 45,
      contactId: contacts[1]?.id,
      dealId: deals[6]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Email proposition de RDV',
      description: 'Proposition de créneaux pour rendez-vous',
      type: 'EMAIL' as const,
      status: 'PLANIFIEE' as const,
      priority: 'MOYENNE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0),
      contactId: contacts[2]?.id,
      assignedToId: user.id,
    },
    {
      title: 'Appel qualification lead',
      description: 'Qualification du besoin et du budget',
      type: 'APPEL' as const,
      status: 'PLANIFIEE' as const,
      priority: 'MOYENNE' as const,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 30),
      duration: 25,
      contactId: contacts[3]?.id,
      dealId: deals[8]?.id,
      assignedToId: user.id,
    },
  ];

  for (const activityData of activities) {
    await prisma.activities.create({ data: activityData as any });
  }

  console.log(`✅ ${activities.length} activités créées avec succès`);

  // Afficher les stats
  const planifiees = activities.filter(a => a.status === 'PLANIFIEE').length;
  const completees = activities.filter(a => a.status === 'COMPLETEE').length;
  console.log(`📅 Activités planifiées: ${planifiees}`);
  console.log(`✅ Activités terminées: ${completees}`);
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
