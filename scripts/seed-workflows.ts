import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding workflows...');

  const workflowsData = [
    {
      name: 'Bienvenue Nouveau Client',
      description: 'Envoie automatiquement un email de bienvenue aux nouveaux contacts',
      trigger: 'Nouveau Contact',
      config: JSON.stringify({
        actions: [
          { type: 'email', template: 'welcome' },
          { type: 'assign', team: 'sales' },
          { type: 'tag', value: 'new-lead' },
        ],
      }),
      actionsCount: 3,
      executions: 145,
      successRate: 98.5,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Relance Devis Non Signé',
      description: 'Relance automatique après 3 jours si le devis n\'est pas signé',
      trigger: 'Devis Envoyé +3j',
      config: JSON.stringify({
        actions: [
          { type: 'email', template: 'quote-reminder' },
          { type: 'notification', to: 'owner' },
        ],
      }),
      actionsCount: 2,
      executions: 89,
      successRate: 95.2,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Onboarding Client',
      description: 'Processus d\'onboarding automatisé pour les nouveaux clients',
      trigger: 'Deal Gagné',
      config: JSON.stringify({
        actions: [
          { type: 'email', template: 'onboarding-step1' },
          { type: 'create-task', title: 'Préparer kick-off meeting' },
          { type: 'email', delay: '3d', template: 'onboarding-step2' },
          { type: 'email', delay: '7d', template: 'onboarding-step3' },
        ],
      }),
      actionsCount: 4,
      executions: 34,
      successRate: 100,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Réactivation Inactif',
      description: 'Tente de réengager les contacts inactifs depuis 30 jours',
      trigger: 'Inactif 30j',
      config: JSON.stringify({
        actions: [
          { type: 'email', template: 'reactivation' },
          { type: 'tag', value: 'inactive' },
        ],
      }),
      actionsCount: 2,
      executions: 56,
      successRate: 45.8,
      status: 'PAUSE' as const,
    },
    {
      name: 'Lead Scoring Auto',
      description: 'Calcule automatiquement le score du lead basé sur ses activités',
      trigger: 'Nouvelle Activité',
      config: JSON.stringify({
        actions: [
          { type: 'calculate-score' },
          { type: 'update-status', condition: 'score > 80' },
        ],
      }),
      actionsCount: 2,
      executions: 267,
      successRate: 99.1,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Rappel RDV',
      description: 'Rappelle automatiquement les rendez-vous 24h avant',
      trigger: 'RDV -24h',
      config: JSON.stringify({
        actions: [
          { type: 'email', template: 'meeting-reminder' },
          { type: 'sms', template: 'meeting-reminder-sms' },
        ],
      }),
      actionsCount: 2,
      executions: 198,
      successRate: 97.3,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Follow-up Post Demo',
      description: 'Suivi automatique après une démo produit',
      trigger: 'Demo Terminée',
      config: JSON.stringify({
        actions: [
          { type: 'email', delay: '2h', template: 'thank-you-demo' },
          { type: 'create-task', delay: '1d', title: 'Appeler pour feedback' },
          { type: 'email', delay: '3d', template: 'demo-followup' },
        ],
      }),
      actionsCount: 3,
      executions: 45,
      successRate: 91.7,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Notification Deal',
      description: 'Notifie l\'équipe lors de la création d\'un nouveau deal',
      trigger: 'Deal Créé',
      config: JSON.stringify({
        actions: [
          { type: 'notification', to: 'team' },
          { type: 'slack', channel: 'sales' },
        ],
      }),
      actionsCount: 2,
      executions: 112,
      successRate: 100,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Survey Satisfaction',
      description: 'Envoie un sondage de satisfaction après résolution d\'un ticket',
      trigger: 'Ticket Résolu',
      config: JSON.stringify({
        actions: [
          { type: 'email', delay: '1d', template: 'satisfaction-survey' },
        ],
      }),
      actionsCount: 1,
      executions: 78,
      successRate: 67.5,
      status: 'PAUSE' as const,
    },
    {
      name: 'Assignation Auto',
      description: 'Assigne automatiquement les nouveaux leads à un commercial',
      trigger: 'Nouveau Lead',
      config: JSON.stringify({
        actions: [
          { type: 'assign', method: 'round-robin' },
          { type: 'notification', to: 'assignee' },
        ],
      }),
      actionsCount: 2,
      executions: 156,
      successRate: 100,
      status: 'ACTIVE' as const,
    },
  ];

  let created = 0;
  for (const workflowData of workflowsData) {
    await prisma.workflows.create({
      data: workflowData as any,
    });
    created++;
  }

  console.log(`✅ ${created} workflows créés avec succès`);

  // Afficher des stats
  const stats = {
    total: created,
    active: workflowsData.filter((w) => w.status === 'ACTIVE').length,
    pause: workflowsData.filter((w) => w.status === 'PAUSE').length,
    totalExecutions: workflowsData.reduce((sum, w) => sum + w.executions, 0),
    avgSuccessRate: (
      workflowsData.reduce((sum, w) => sum + w.successRate, 0) / workflowsData.length
    ).toFixed(1),
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   \n   Par statut:`);
  console.log(`   - Actifs: ${stats.active}`);
  console.log(`   - En pause: ${stats.pause}`);
  console.log(`   \n   Exécutions totales: ${stats.totalExecutions}`);
  console.log(`   Taux de succès moyen: ${stats.avgSuccessRate}%`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
