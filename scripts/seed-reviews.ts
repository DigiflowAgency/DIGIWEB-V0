import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reviews...');

  const now = new Date();

  const reviewsData = [
    // DigiFlow Agency - Avis positifs
    {
      source: 'GOOGLE' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 5,
      author: 'Marie Dubois',
      content: 'Excellente agence web ! L\'équipe est très professionnelle et à l\'écoute. Notre site e-commerce a été livré dans les délais avec un design moderne et une navigation fluide. Je recommande vivement.',
      reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Il y a 15 jours
      response: 'Merci Marie pour ce retour très positif ! Nous sommes ravis d\'avoir contribué au succès de votre boutique en ligne. Toute l\'équipe vous souhaite une excellente continuation.',
      respondedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'GOOGLE' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 5,
      author: 'Thomas Martin',
      content: 'Site vitrine réalisé pour mon cabinet d\'avocat. Résultat impeccable, SEO bien optimisé. Mes clients trouvent facilement mes coordonnées et mes services. Équipe réactive et disponible.',
      reviewDate: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
      response: 'Merci Thomas pour votre confiance. Nous sommes heureux que votre site réponde parfaitement à vos attentes et contribue à votre visibilité en ligne.',
      respondedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'GOOGLE' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 4,
      author: 'Sophie Leroy',
      content: 'Très bon travail sur la refonte de notre site internet. Quelques petits ajustements ont été nécessaires mais l\'équipe a été réactive pour les corrections. Bonne communication tout au long du projet.',
      reviewDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      response: 'Merci Sophie pour votre retour constructif. Nous sommes toujours à l\'écoute de nos clients pour garantir leur satisfaction. N\'hésitez pas à nous contacter si besoin.',
      respondedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'PAGES_JAUNES' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 5,
      author: 'Pierre Durand',
      content: 'Prestation de qualité pour la création du site de mon restaurant. Design élégant, menu en ligne avec photos appétissantes. Mes réservations en ligne ont augmenté de 40% ! Merci DigiFlow.',
      reviewDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'PAGES_JAUNES' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 5,
      author: 'Isabelle Bernard',
      content: 'Je recommande cette agence pour leur expertise technique et leur créativité. Site web pour ma boutique de mode, intégration e-commerce parfaite, gestion des stocks simplifiée.',
      reviewDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
      response: 'Merci Isabelle ! C\'est un plaisir de travailler avec des entrepreneurs passionnés comme vous. Nous restons disponibles pour tout accompagnement futur.',
      respondedAt: new Date(now.getTime() - 48 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'TRUSTPILOT' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 5,
      author: 'Jean-Luc Moreau',
      content: 'Agence sérieuse et compétente. Développement d\'une application web sur mesure pour notre PME. Fonctionnalités avancées, interface intuitive, formation complète fournie. Excellent rapport qualité/prix.',
      reviewDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      response: 'Merci Jean-Luc pour cette excellente évaluation ! Nous sommes fiers d\'avoir développé une solution qui répond précisément à vos besoins métiers.',
      respondedAt: new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'TRUSTPILOT' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 4,
      author: 'Catherine Petit',
      content: 'Bonne expérience globale. Site web pour mon salon de coiffure, design moderne et système de prise de RDV en ligne très pratique. Délai de livraison respecté. Un point d\'amélioration : davantage d\'explications sur la maintenance.',
      reviewDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
      response: 'Merci Catherine pour vos retours. Nous prenons note de votre remarque et améliorerons notre accompagnement sur la maintenance. Nous restons à votre disposition pour toute question.',
      respondedAt: new Date(now.getTime() - 73 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'GOOGLE' as const,
      company: 'DIGIFLOW_AGENCY' as const,
      rating: 3,
      author: 'Laurent Rousseau',
      content: 'Résultat correct mais quelques retards dans la livraison. La qualité du site est bonne une fois terminé. Communication perfectible en cours de projet.',
      reviewDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      response: 'Bonjour Laurent, nous vous remercions pour votre retour. Nous sommes désolés pour les retards rencontrés. Nous travaillons activement à améliorer notre gestion de projet et notre communication.',
      respondedAt: new Date(now.getTime() - 88 * 24 * 60 * 60 * 1000),
    },

    // Be Hype - Avis positifs
    {
      source: 'GOOGLE' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'Nathalie Girard',
      content: 'Be Hype a transformé notre stratégie digitale ! Campagne réseaux sociaux exceptionnelle, notre visibilité a explosé. Créativité au rendez-vous, équipe jeune et dynamique.',
      reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      response: 'Merci Nathalie ! Votre enthousiasme nous motive encore plus. Hâte de continuer à faire grandir votre marque ensemble ! 🚀',
      respondedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'GOOGLE' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'Marc Fontaine',
      content: 'Campagne Google Ads gérée de main de maître. ROI impressionnant dès le premier mois. L\'équipe Be Hype comprend vraiment les enjeux du marketing digital moderne.',
      reviewDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      response: 'Merci Marc ! Voir nos clients réussir, c\'est notre plus belle récompense. Continuons sur cette lancée ! 💪',
      respondedAt: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'GOOGLE' as const,
      company: 'BE_HYPE' as const,
      rating: 4,
      author: 'Élodie Blanchard',
      content: 'Bonne agence de marketing digital. Contenus créatifs pour nos réseaux sociaux, engagement en hausse. Tarifs un peu élevés mais qualité au rendez-vous.',
      reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      response: 'Merci Élodie pour ce retour ! Nous mettons tout en œuvre pour offrir le meilleur rapport qualité/prix. Votre satisfaction est notre priorité !',
      respondedAt: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'TRUSTPILOT' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'Julien Mercier',
      content: 'Stratégie de contenu excellente pour notre startup. Be Hype a su capter l\'essence de notre marque et la transmettre à notre audience. Trafic web multiplié par 3 en 6 mois.',
      reviewDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      response: 'Julien, merci infiniment ! C\'est un plaisir de travailler avec des entrepreneurs visionnaires. On continue comme ça ! 🎯',
      respondedAt: new Date(now.getTime() - 34 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'TRUSTPILOT' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'Sandrine Lefebvre',
      content: 'Campagne d\'influence réussie pour le lancement de nos nouveaux produits. Sélection pertinente d\'influenceurs, contenu authentique. Nos ventes ont dépassé nos prévisions !',
      reviewDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'PAGES_JAUNES' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'Olivier Simon',
      content: 'Gestion complète de nos réseaux sociaux par Be Hype. Ligne éditoriale cohérente, visuels de qualité, planification optimale. Notre communauté grandit chaque jour.',
      reviewDate: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000),
      response: 'Merci Olivier ! Faire grandir votre communauté, c\'est notre passion. On reste mobilisés pour vous ! 🔥',
      respondedAt: new Date(now.getTime() - 53 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'PAGES_JAUNES' as const,
      company: 'BE_HYPE' as const,
      rating: 4,
      author: 'Valérie Roux',
      content: 'Agence créative et efficace. Campagne email marketing bien ciblée avec un taux d\'ouverture excellent. Peut-être un peu plus de suivi post-campagne serait apprécié.',
      reviewDate: new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000),
      response: 'Merci Valérie pour vos retours constructifs ! Nous allons renforcer notre suivi post-campagne. Merci de nous aider à nous améliorer !',
      respondedAt: new Date(now.getTime() - 63 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'TRIPADVISOR' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'François Gauthier',
      content: 'Be Hype a boosté la visibilité de notre hôtel avec une stratégie marketing digitale sur mesure. Réservations en hausse constante, retour sur investissement dépassé. Équipe passionnée et disponible.',
      reviewDate: new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000),
      response: 'François, quel plaisir de lire cet avis ! Merci de nous faire confiance. Continuons à faire briller votre établissement ! ⭐',
      respondedAt: new Date(now.getTime() - 68 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'TRIPADVISOR' as const,
      company: 'BE_HYPE' as const,
      rating: 5,
      author: 'Céline Barbier',
      content: 'Marketing digital de premier plan pour notre restaurant gastronomique. Be Hype a su mettre en valeur notre cuisine avec des visuels époustouflants et une stratégie Instagram parfaite.',
      reviewDate: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000),
    },
    {
      source: 'GOOGLE' as const,
      company: 'BE_HYPE' as const,
      rating: 4,
      author: 'David Lambert',
      content: 'Bonne prestation globale. Campagne Facebook Ads performante. Quelques ajustements nécessaires en cours de route mais équipe réactive. Résultats au rendez-vous.',
      reviewDate: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000),
      response: 'Merci David ! L\'agilité et la réactivité font partie de notre ADN. Ravis que les résultats soient là ! 🎉',
      respondedAt: new Date(now.getTime() - 93 * 24 * 60 * 60 * 1000),
    },
  ];

  let created = 0;
  for (const reviewData of reviewsData) {
    await prisma.review.create({
      data: reviewData,
    });
    created++;
  }

  console.log(`✅ ${created} avis créés avec succès`);

  // Afficher des stats
  const stats = {
    total: created,
    digiflow: reviewsData.filter(r => r.company === 'DIGIFLOW_AGENCY').length,
    behype: reviewsData.filter(r => r.company === 'BE_HYPE').length,
    google: reviewsData.filter(r => r.source === 'GOOGLE').length,
    pagesJaunes: reviewsData.filter(r => r.source === 'PAGES_JAUNES').length,
    trustpilot: reviewsData.filter(r => r.source === 'TRUSTPILOT').length,
    tripadvisor: reviewsData.filter(r => r.source === 'TRIPADVISOR').length,
    rating5: reviewsData.filter(r => r.rating === 5).length,
    rating4: reviewsData.filter(r => r.rating === 4).length,
    rating3: reviewsData.filter(r => r.rating === 3).length,
    withResponse: reviewsData.filter(r => r.response).length,
    avgRatingDigiflow: (reviewsData.filter(r => r.company === 'DIGIFLOW_AGENCY').reduce((sum, r) => sum + r.rating, 0) / reviewsData.filter(r => r.company === 'DIGIFLOW_AGENCY').length).toFixed(1),
    avgRatingBehype: (reviewsData.filter(r => r.company === 'BE_HYPE').reduce((sum, r) => sum + r.rating, 0) / reviewsData.filter(r => r.company === 'BE_HYPE').length).toFixed(1),
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   \n   Par entreprise:`);
  console.log(`   - DigiFlow Agency: ${stats.digiflow} avis (moyenne: ${stats.avgRatingDigiflow}/5)`);
  console.log(`   - Be Hype: ${stats.behype} avis (moyenne: ${stats.avgRatingBehype}/5)`);
  console.log(`   \n   Par source:`);
  console.log(`   - Google: ${stats.google}`);
  console.log(`   - Pages Jaunes: ${stats.pagesJaunes}`);
  console.log(`   - TrustPilot: ${stats.trustpilot}`);
  console.log(`   - TripAdvisor: ${stats.tripadvisor}`);
  console.log(`   \n   Par note:`);
  console.log(`   - 5 étoiles: ${stats.rating5}`);
  console.log(`   - 4 étoiles: ${stats.rating4}`);
  console.log(`   - 3 étoiles: ${stats.rating3}`);
  console.log(`   \n   Avec réponse: ${stats.withResponse}/${stats.total}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
