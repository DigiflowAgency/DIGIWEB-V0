import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour générer un numéro de ticket unique
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count({
    where: { number: { startsWith: `TK-${year}-` } },
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `TK-${year}-${nextNumber}`;
}

async function main() {
  console.log('Seeding tickets...');

  // Récupérer un utilisateur existant
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('Aucun utilisateur trouvé. Veuillez d\'abord créer un utilisateur.');
  }

  const now = new Date();

  const ticketsData = [
    {
      subject: 'Problème de connexion au dashboard',
      description: 'Le client ne parvient pas à se connecter à son tableau de bord. Message d\'erreur: "Identifiants invalides". Compte vérifié, le mot de passe semble correct.',
      type: 'CLIENT' as const,
      status: 'OUVERT' as const,
      priority: 'HAUTE' as const,
      clientName: 'Restaurant Le Gourmet',
      clientEmail: 'contact@legourmet.fr',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Il y a 2 heures
    },
    {
      subject: 'Question sur la facturation mensuelle',
      description: 'Le client souhaite des clarifications sur sa facture du mois dernier. Questions concernant les frais additionnels pour le stockage de fichiers.',
      type: 'CLIENT' as const,
      status: 'EN_COURS' as const,
      priority: 'MOYENNE' as const,
      clientName: 'Boutique Mode Élégance',
      clientEmail: 'admin@modeelegance.fr',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // Il y a 5 heures
    },
    {
      subject: 'Demande de modification du site web',
      description: 'Le client demande l\'ajout d\'une nouvelle section "Témoignages clients" sur la page d\'accueil avec carrousel d\'images.',
      type: 'CLIENT' as const,
      status: 'RESOLU' as const,
      priority: 'BASSE' as const,
      clientName: 'Cabinet Avocat Dupont',
      clientEmail: 'secretariat@avocat-dupont.fr',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
      resolvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
      responseTime: 2880, // 48 heures en minutes
    },
    {
      subject: 'Bug formulaire de contact',
      description: 'Le formulaire de contact ne fonctionne pas. Les messages ne sont pas envoyés et aucun message d\'erreur n\'apparaît. Urgent car c\'est la période de forte affluence.',
      type: 'CLIENT' as const,
      status: 'ESCALADE' as const,
      priority: 'HAUTE' as const,
      clientName: 'Salon de Coiffure Tendance',
      clientEmail: 'info@salon-tendance.fr',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // Il y a 4 heures
    },
    {
      subject: 'Support technique pour le référencement SEO',
      description: 'Le client souhaite comprendre pourquoi son site n\'apparaît pas dans les premiers résultats Google pour ses mots-clés ciblés.',
      type: 'CLIENT' as const,
      status: 'EN_COURS' as const,
      priority: 'MOYENNE' as const,
      clientName: 'Garage Auto Pro',
      clientEmail: 'contact@autopro-garage.fr',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
    },
    {
      subject: 'Mise à jour du contenu de la page "À propos"',
      description: 'Le client a envoyé un nouveau texte pour la section "À propos" et des photos de l\'équipe mises à jour.',
      type: 'CLIENT' as const,
      status: 'RESOLU' as const,
      priority: 'BASSE' as const,
      clientName: 'Boulangerie Tradition',
      clientEmail: 'boulangerie.tradition@gmail.com',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // Il y a 4 jours
      resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
      responseTime: 2880, // 48 heures
    },
    {
      subject: 'Problème de réception des emails',
      description: 'Les emails envoyés via le formulaire de contact ne sont plus reçus depuis hier matin. Boîte mail vérifiée, le problème semble venir du serveur.',
      type: 'CLIENT' as const,
      status: 'EN_ATTENTE' as const,
      priority: 'HAUTE' as const,
      clientName: 'Pharmacie Santé Plus',
      clientEmail: 'pharmacie.santeplus@orange.fr',
      createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000), // Il y a 20 heures
    },
    {
      subject: 'Question sur l\'hébergement du site',
      description: 'Le client envisage de passer à un plan d\'hébergement supérieur et souhaite connaître les options disponibles.',
      type: 'CLIENT' as const,
      status: 'RESOLU' as const,
      priority: 'BASSE' as const,
      clientName: 'Fleuriste Jardin Fleuri',
      clientEmail: 'contact@jardinfleuri.fr',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
      resolvedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // Il y a 4 jours
      responseTime: 1440, // 24 heures
    },
    {
      subject: 'Demande de formation pour l\'utilisation du CMS',
      description: 'Le client souhaite une formation pour apprendre à mettre à jour le contenu de son site de manière autonome.',
      type: 'CLIENT' as const,
      status: 'EN_ATTENTE' as const,
      priority: 'MOYENNE' as const,
      clientName: 'Restaurant Le Bistrot Gourmand',
      clientEmail: 'bistrot.gourmand@wanadoo.fr',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
    },
    {
      subject: 'Optimisation des performances du site',
      description: 'Le site se charge lentement. Le client demande une analyse et une optimisation des performances, notamment pour les images et le temps de chargement.',
      type: 'CLIENT' as const,
      status: 'EN_COURS' as const,
      priority: 'MOYENNE' as const,
      clientName: 'Librairie Lecture et Culture',
      clientEmail: 'librairie.lc@hotmail.com',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // Il y a 6 heures
    },
    {
      subject: 'Mise à jour serveur interne',
      description: 'Planification de la migration vers le nouveau serveur. Nécessite coordination avec l\'équipe infrastructure.',
      type: 'INTERNAL' as const,
      status: 'EN_COURS' as const,
      priority: 'HAUTE' as const,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // Il y a 12 heures
    },
    {
      subject: 'Revue des processus de backup',
      description: 'Audit annuel des systèmes de sauvegarde. Vérification de l\'intégrité des backups et test de restauration.',
      type: 'INTERNAL' as const,
      status: 'FERME' as const,
      priority: 'MOYENNE' as const,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
      resolvedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
      responseTime: 2880, // 48 heures
    },
  ];

  let created = 0;
  for (const ticketData of ticketsData) {
    const number = await generateTicketNumber();
    await prisma.ticket.create({
      data: {
        ...ticketData,
        number,
        createdById: user.id,
        assignedToId: ticketData.status !== 'OUVERT' ? user.id : null,
      },
    });
    created++;
  }

  console.log(`✅ ${created} tickets créés avec succès`);

  // Afficher des stats
  const stats = {
    total: created,
    ouvert: ticketsData.filter(t => t.status === 'OUVERT').length,
    enCours: ticketsData.filter(t => t.status === 'EN_COURS').length,
    enAttente: ticketsData.filter(t => t.status === 'EN_ATTENTE').length,
    escalade: ticketsData.filter(t => t.status === 'ESCALADE').length,
    resolu: ticketsData.filter(t => t.status === 'RESOLU').length,
    ferme: ticketsData.filter(t => t.status === 'FERME').length,
    client: ticketsData.filter(t => t.type === 'CLIENT').length,
    internal: ticketsData.filter(t => t.type === 'INTERNAL').length,
    haute: ticketsData.filter(t => t.priority === 'HAUTE').length,
    moyenne: ticketsData.filter(t => t.priority === 'MOYENNE').length,
    basse: ticketsData.filter(t => t.priority === 'BASSE').length,
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   \n   Par statut:`);
  console.log(`   - Ouvert: ${stats.ouvert}`);
  console.log(`   - En cours: ${stats.enCours}`);
  console.log(`   - En attente: ${stats.enAttente}`);
  console.log(`   - Escaladé: ${stats.escalade}`);
  console.log(`   - Résolu: ${stats.resolu}`);
  console.log(`   - Fermé: ${stats.ferme}`);
  console.log(`   \n   Par type:`);
  console.log(`   - Client: ${stats.client}`);
  console.log(`   - Interne: ${stats.internal}`);
  console.log(`   \n   Par priorité:`);
  console.log(`   - Haute: ${stats.haute}`);
  console.log(`   - Moyenne: ${stats.moyenne}`);
  console.log(`   - Basse: ${stats.basse}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
