import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding email campaigns...');

  const campaigns = [
    { subject: 'Newsletter Novembre - Nouveautés', sent: 2500, opened: 1250, clicked: 380, status: 'Envoyé' },
    { subject: 'Offre Spéciale Black Friday', sent: 0, opened: 0, clicked: 0, status: 'Brouillon' },
    { subject: 'Rappel: Webinaire SEO Demain', sent: 450, opened: 320, clicked: 180, status: 'Envoyé' },
    { subject: 'Nouveaux Services Marketing', sent: 3200, opened: 1600, clicked: 520, status: 'Envoyé' },
    { subject: 'Invitation Événement Décembre', sent: 0, opened: 0, clicked: 0, status: 'Planifié' },
    { subject: 'Conseils SEO - Édition 42', sent: 2800, opened: 1450, clicked: 420, status: 'Envoyé' },
    { subject: 'Réactivation Clients Inactifs', sent: 1500, opened: 450, clicked: 85, status: 'Envoyé' },
    { subject: 'Nouveauté: Dashboard Analytics', sent: 3500, opened: 1950, clicked: 680, status: 'Envoyé' },
    { subject: 'Sondage Satisfaction Client', sent: 2200, opened: 1100, clicked: 320, status: 'Envoyé' },
    { subject: 'Promotion Fin d\'Année', sent: 0, opened: 0, clicked: 0, status: 'Brouillon' },
  ];

  for (const data of campaigns) {
    await prisma.email_campaigns.create({ data: data as any });
  }

  console.log(`✅ ${campaigns.length} campagnes créées`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
