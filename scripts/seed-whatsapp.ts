import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WhatsApp conversations...');

  const conversationsData = [
    {
      name: 'Pierre Martin',
      phone: '+33612345678',
      avatar: 'PM',
      score: 95,
      messages: [
        { text: 'Bonjour, je cherche un site web pour mon restaurant', sender: 'client' },
        { text: 'Bonjour Pierre ! Excellent timing, nous avons des offres spéciales pour les restaurants. Quel type de site recherchez-vous ?', sender: 'user' },
        { text: 'Un site vitrine avec menu en ligne et réservation', sender: 'client' },
        { text: 'Parfait ! Nous proposons un package complet : site responsive, module réservation, menu dynamique et SEO local à partir de 4 500€. Vous avez un moment cette semaine pour en discuter ?', sender: 'user' },
        { text: 'Parfait, je suis intéressé par votre offre', sender: 'client' },
      ],
    },
    {
      name: 'Sophie Dubois',
      phone: '+33623456789',
      avatar: 'SD',
      score: 88,
      messages: [
        { text: 'Bonjour, j\'ai une boutique de mode et je veux un e-commerce', sender: 'client' },
        { text: 'Bonjour Sophie ! Nous sommes spécialisés dans les e-commerce pour la mode. Combien de produits environ ?', sender: 'user' },
        { text: 'Environ 200 produits pour commencer', sender: 'client' },
        { text: 'Je peux voir des exemples ?', sender: 'client' },
      ],
    },
    {
      name: 'Jean Dupont',
      phone: '+33634567890',
      avatar: 'JD',
      score: 82,
      messages: [
        { text: 'Bonjour, je suis avocat et j\'ai besoin d\'un site vitrine', sender: 'client' },
        { text: 'Bonjour Jean ! Pour un cabinet d\'avocat, nous recommandons un site sobre et professionnel avec présentation des domaines de compétence. Budget envisagé ?', sender: 'user' },
        { text: 'D\'accord, merci', sender: 'client' },
      ],
    },
    {
      name: 'Marie Laurent',
      phone: '+33645678901',
      avatar: 'ML',
      score: 76,
      messages: [
        { text: 'Salut, j\'ai un salon de coiffure', sender: 'client' },
        { text: 'Bonjour Marie ! Parfait, nous avons une solution avec prise de RDV en ligne. Vous utilisez déjà un logiciel de gestion ?', sender: 'user' },
        { text: 'Oui pourquoi pas', sender: 'client' },
      ],
    },
    {
      name: 'Luc Bernard',
      phone: '+33656789012',
      avatar: 'LB',
      score: 70,
      messages: [
        { text: 'Bonjour, je cherche un site pour mon garage', sender: 'client' },
        { text: 'Bonjour Luc ! Site vitrine avec présentation des services, galerie photos et formulaire de contact ?', sender: 'user' },
        { text: 'Combien ça coûte ?', sender: 'client' },
      ],
    },
  ];

  let created = 0;
  const now = new Date();

  for (let i = 0; i < conversationsData.length; i++) {
    const convData = conversationsData[i];
    const lastMessage = convData.messages[convData.messages.length - 1];

    // Calculer le timestamp pour chaque conversation (plus récent = plus haut dans la liste)
    const hoursAgo = i * 2; // Espacer de 2 heures
    const lastMessageAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const conversation = await prisma.whatsAppConversation.create({
      data: {
        name: convData.name,
        phone: convData.phone,
        avatar: convData.avatar,
        score: convData.score,
        lastMessage: lastMessage.text,
        lastMessageAt,
        unread: lastMessage.sender === 'client' ? Math.floor(Math.random() * 3) : 0,
      },
    });

    // Créer les messages
    for (let j = 0; j < convData.messages.length; j++) {
      const msgData = convData.messages[j];
      const minutesAgo = (i * 60) + (j * 5); // Espacer les messages
      const sentAt = new Date(now.getTime() - minutesAgo * 60 * 1000);

      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          text: msgData.text,
          sender: msgData.sender,
          sentAt,
        },
      });
    }

    created++;
  }

  console.log(`✅ ${created} conversations créées avec succès`);

  const totalMessages = conversationsData.reduce((sum, c) => sum + c.messages.length, 0);
  console.log(`✅ ${totalMessages} messages créés`);

  console.log('\n📊 Statistiques:');
  console.log(`   Conversations: ${created}`);
  console.log(`   Messages: ${totalMessages}`);
  console.log(`   Score moyen: ${(conversationsData.reduce((sum, c) => sum + c.score, 0) / created).toFixed(1)}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
