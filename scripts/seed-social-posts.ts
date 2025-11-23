import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding social posts...');

  const now = new Date();

  const socialPosts = [
    {
      content: 'Découvrez nos nouvelles solutions SEO pour booster votre visibilité en ligne ! 🚀\n\nNous vous accompagnons dans votre transformation digitale avec des stratégies personnalisées et efficaces.\n\n#SEO #MarketingDigital #TransformationDigitale',
      platform: 'FACEBOOK' as const,
      status: 'PUBLIE' as const,
      likes: 145,
      comments: 23,
      shares: 12,
      reach: 2800,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Guide complet du marketing digital en 2025 📊\n\nRetrouvez nos conseils d\'experts pour développer votre présence en ligne et maximiser votre ROI.\n\nLien dans les commentaires ⬇️\n\n#Marketing #DigitalStrategy #GrowthHacking',
      platform: 'LINKEDIN' as const,
      status: 'PUBLIE' as const,
      likes: 89,
      comments: 15,
      shares: 8,
      reach: 1250,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Transformation digitale réussie pour notre client ! 🎉\n\n✅ +300% de trafic web\n✅ +150% de conversions\n✅ ROI x5 en 6 mois\n\n#SuccessStory #WebMarketing #Results',
      platform: 'INSTAGRAM' as const,
      status: 'PUBLIE' as const,
      likes: 234,
      comments: 31,
      shares: 0,
      reach: 4200,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Tendances marketing 2025 🔥\n\n1️⃣ IA et automatisation\n2️⃣ Contenu vidéo court\n3️⃣ Marketing conversationnel\n4️⃣ Expérience personnalisée\n5️⃣ SEO vocal\n\n#MarketingTrends #Marketing2025 #AI',
      platform: 'TWITTER' as const,
      status: 'PUBLIE' as const,
      likes: 67,
      comments: 12,
      shares: 28,
      reach: 1680,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: '🎓 Webinaire GRATUIT la semaine prochaine !\n\nThème: "Comment augmenter votre taux de conversion de 200%"\n\n📅 Date: À venir\n⏰ Durée: 1h30\n\nInscription limitée à 100 places !\n\n#Webinar #Marketing #Conversion',
      platform: 'FACEBOOK' as const,
      status: 'PLANIFIE' as const,
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      publishedAt: null,
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Étude de cas: Comment un restaurant local a doublé son chiffre d\'affaires grâce au marketing digital 🍽️\n\nDécouvrez la stratégie complète que nous avons mise en place :\n\n• SEO local optimisé\n• Campagnes Facebook Ads ciblées\n• Programme de fidélité digital\n• Reviews management\n\nRésultats en 3 mois : CA x2 📈\n\n#CaseStudy #LocalBusiness #DigitalMarketing',
      platform: 'LINKEDIN' as const,
      status: 'PUBLIE' as const,
      likes: 112,
      comments: 19,
      shares: 15,
      reach: 1890,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Behind the scenes de notre agence 📸\n\nUne journée dans la vie de notre équipe créative !\n\n#TeamWork #Agency #BehindTheScenes #CreativeTeam',
      platform: 'INSTAGRAM' as const,
      status: 'PUBLIE' as const,
      likes: 187,
      comments: 28,
      shares: 0,
      reach: 3200,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: '💡 Tips SEO du jour:\n\nOptimisez vos meta descriptions !\n\n✅ 155-160 caractères max\n✅ Incluez votre mot-clé\n✅ Call-to-action clair\n✅ Description unique par page\n\n#SEOTips #SEO #DigitalMarketing',
      platform: 'TWITTER' as const,
      status: 'PUBLIE' as const,
      likes: 54,
      comments: 8,
      shares: 22,
      reach: 1120,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Témoignage client ⭐⭐⭐⭐⭐\n\n"Grâce à DigiWeb, nous avons enfin compris comment utiliser efficacement les réseaux sociaux pour notre entreprise. Les résultats sont au rendez-vous !"\n\n- Marie D., CEO StartupTech\n\n#Testimonial #ClientSatisfaction #DigitalMarketing',
      platform: 'FACEBOOK' as const,
      status: 'PUBLIE' as const,
      likes: 98,
      comments: 14,
      shares: 6,
      reach: 1850,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 9),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: '📢 Nous recrutons !\n\nPoste: Marketing Manager\n📍 Paris / Remote\n💼 CDI\n\nVous êtes passionné(e) par le marketing digital et l\'innovation ? Rejoignez notre équipe !\n\nCV + lettre de motivation à: jobs@digiweb.fr\n\n#Hiring #MarketingJobs #WeAreHiring',
      platform: 'LINKEDIN' as const,
      status: 'BROUILLON' as const,
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      scheduledAt: null,
      publishedAt: null,
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Top 5 des erreurs à éviter en marketing digital 🚫\n\n1. Négliger le mobile\n2. Ignorer l\'analyse des données\n3. Pas de stratégie de contenu\n4. Oublier le référencement local\n5. Négliger l\'expérience utilisateur\n\nÉvitez ces pièges ! 💪\n\n#MarketingMistakes #DigitalStrategy #Tips',
      platform: 'FACEBOOK' as const,
      status: 'PUBLIE' as const,
      likes: 156,
      comments: 21,
      shares: 18,
      reach: 2950,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Le pouvoir du storytelling en marketing 📖\n\nLes marques qui racontent des histoires authentiques créent des connexions émotionnelles durables avec leur audience.\n\nVotre histoire, c\'est votre différence.\n\n#Storytelling #BrandStrategy #Marketing',
      platform: 'LINKEDIN' as const,
      status: 'PUBLIE' as const,
      likes: 78,
      comments: 11,
      shares: 9,
      reach: 1340,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 11),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Statistiques Instagram 2025 📊\n\n• 2 milliards d\'utilisateurs actifs\n• 500M utilisent les Stories quotidiennement\n• Taux d\'engagement moyen: 1.22%\n• 71% des entreprises utilisent Instagram\n\nEt vous, optimisez-vous votre présence sur Instagram ?\n\n#Instagram #SocialMediaStats #Marketing',
      platform: 'INSTAGRAM' as const,
      status: 'PLANIFIE' as const,
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      publishedAt: null,
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: '🔥 Les réseaux sociaux ne se résument pas à poster du contenu.\n\nC\'est avant tout:\n\n💬 Créer des conversations\n🤝 Construire une communauté\n❤️ Générer de l\'engagement authentique\n📈 Analyser et optimiser\n\n#SocialMedia #CommunityManagement #Engagement',
      platform: 'TWITTER' as const,
      status: 'PUBLIE' as const,
      likes: 92,
      comments: 14,
      shares: 31,
      reach: 1890,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      imageUrl: null,
      videoUrl: null,
    },
    {
      content: 'Infographie: Le parcours client digital en 2025 🛤️\n\nDe la découverte à la fidélisation, chaque étape compte.\n\nTéléchargez notre guide gratuit pour optimiser votre tunnel de conversion !\n\nLien en bio 👆\n\n#CustomerJourney #Marketing #Conversion',
      platform: 'INSTAGRAM' as const,
      status: 'BROUILLON' as const,
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      scheduledAt: null,
      publishedAt: null,
      imageUrl: null,
      videoUrl: null,
    },
  ];

  let created = 0;
  for (const post of socialPosts) {
    await prisma.social_posts.create({
      data: post as any,
    });
    created++;
  }

  console.log(`✅ ${created} posts créés avec succès`);

  // Afficher des stats
  const stats = {
    total: created,
    publie: socialPosts.filter(p => p.status === 'PUBLIE').length,
    planifie: socialPosts.filter(p => p.status === 'PLANIFIE').length,
    brouillon: socialPosts.filter(p => p.status === 'BROUILLON').length,
    totalLikes: socialPosts.reduce((sum, p) => sum + p.likes, 0),
    totalComments: socialPosts.reduce((sum, p) => sum + p.comments, 0),
    totalShares: socialPosts.reduce((sum, p) => sum + p.shares, 0),
    totalReach: socialPosts.reduce((sum, p) => sum + p.reach, 0),
    byPlatform: {
      facebook: socialPosts.filter(p => p.platform === 'FACEBOOK').length,
      linkedin: socialPosts.filter(p => p.platform === 'LINKEDIN').length,
      instagram: socialPosts.filter(p => p.platform === 'INSTAGRAM').length,
      twitter: socialPosts.filter(p => p.platform === 'TWITTER').length,
    },
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Publié: ${stats.publie}`);
  console.log(`   Planifié: ${stats.planifie}`);
  console.log(`   Brouillon: ${stats.brouillon}`);
  console.log(`   Total Likes: ${stats.totalLikes.toLocaleString()}`);
  console.log(`   Total Commentaires: ${stats.totalComments}`);
  console.log(`   Total Partages: ${stats.totalShares}`);
  console.log(`   Portée totale: ${stats.totalReach.toLocaleString()}`);
  console.log('\n   Par plateforme:');
  console.log(`   - Facebook: ${stats.byPlatform.facebook}`);
  console.log(`   - LinkedIn: ${stats.byPlatform.linkedin}`);
  console.log(`   - Instagram: ${stats.byPlatform.instagram}`);
  console.log(`   - Twitter: ${stats.byPlatform.twitter}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
