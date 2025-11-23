'use client'
// Système de leasing avec engagement 24/36/48 mois
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Rocket, Trophy, Star, Heart, ChevronDown, ChevronUp,
  MapPin, Link2, Video, X, CheckCircle, ShoppingCart,
  Globe, Check, Target, Eye, EyeOff, Trash2, Shield, Search, TrendingUp, Camera, MessageSquare, Users, Mail, FileText, Calendar, BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { offersByChannel } from '@/components/loader'

// Données complètes des canaux (hors composant pour éviter recréation)
const channelsData = [
    {
      id: 'meta-ads',
      name: 'Meta Ads',
      icon: Target,
      angle: 0,
      color: { from: '#fb923c', to: '#ef4444' },
      gradient: 'from-orange to-red-500',
      description: 'Publicité sur Facebook et Instagram pour toucher votre audience cible avec une précision laser. Le canal d\'acquisition payant le plus performant pour générer des leads qualifiés rapidement.',
      details: 'Nos campagnes Meta Ads sont optimisées quotidiennement pour maximiser votre ROI. Nous utilisons des stratégies avancées de ciblage comportemental, lookalike audiences, et retargeting multi-étapes pour convertir vos visiteurs en clients.',
      stats: ['ROI moyen: 400%', 'CPL moyen: 8-15€', 'Reach: +2M utilisateurs', 'Conversion: 3-8%', 'Budget min: 300€/mois'],
      benefits: ['Ciblage ultra-précis par intérêts, comportements et données démographiques', 'Retargeting puissant pour récupérer les visiteurs perdus', 'Résultats mesurables dès les premières semaines', 'Scaling rapide des campagnes performantes', 'A/B testing automatisé des créas et audiences']
    },
    {
      id: 'google-ads',
      name: 'Google Ads',
      icon: Search,
      angle: 33,
      color: { from: '#ef4444', to: '#fb923c' },
      gradient: 'from-red-500 to-orange',
      description: 'Apparaissez en première position sur Google quand vos clients vous cherchent activement. Ciblez l\'intention d\'achat au moment précis où elle se manifeste.',
      details: 'Google Ads capture les prospects avec la plus haute intention d\'achat. Nos campagnes Search, Display et Shopping sont optimisées pour maximiser votre taux de conversion tout en réduisant votre coût par acquisition. Tracking avancé et reporting détaillé inclus.',
      stats: ['Conversion: 3-5%', 'CPL: 12-20€', 'Intention d\'achat: Très élevée', 'CTR moyen: 8-12%', 'Budget min: 400€/mois'],
      benefits: ['Trafic ultra-qualifié avec intention d\'achat immédiate', 'Visibilité instantanée en première page Google', 'Mesurable en temps réel avec ROI transparent', 'Contrôle total du budget et des enchères', 'Remarketing display sur tout le web Google']
    },
    {
      id: 'seo-naturel',
      name: 'SEO Naturel',
      icon: TrendingUp, Globe, Check, Target, Eye, EyeOff, Trash2, Shield,
      angle: 66,
      color: { from: '#22c55e', to: '#059669' },
      gradient: 'from-green-500 to-emerald-600',
      description: 'Positionnement organique durable sur Google pour générer un trafic gratuit, qualifié et pérenne. L\'investissement le plus rentable sur le long terme.',
      details: 'Notre méthodologie SEO combine optimisation technique, création de contenu stratégique, et netlinking de qualité. Résultats visibles dès 2-3 mois avec une croissance exponentielle sur 12 mois. 98% de nos clients atteignent la 1ère page sur leurs mots-clés principaux.',
      stats: ['+150% trafic/an', 'Coût: 0€/clic', 'Durabilité: 2-5 ans', 'ROI: x7 sur 12 mois', 'Taux de clic: 30%+'],
      benefits: ['Trafic gratuit et illimité une fois positionné', 'Crédibilité et confiance maximales', 'Effet boule de neige : croissance exponentielle du trafic', 'Investissement pérenne qui génère du ROI sur des années', 'Indépendance vis-à-vis des plateformes publicitaires']
    },
    {
      id: 'seo-local',
      name: 'SEO Local',
      icon: MapPin,
      angle: 99,
      color: { from: '#10b981', to: '#16a34a' },
      gradient: 'from-emerald-500 to-green-600',
      description: 'Dominez les recherches locales ("près de moi") et Google Maps pour attirer les clients de votre zone de chalandise. Essentiel pour les commerces locaux.',
      details: 'Optimisation complète de votre fiche Google Business, citations locales, avis clients, et SEO géolocalisé. Parfait pour les artisans, commerces, restaurants et professions libérales. 98% de nos clients atteignent le top 3 en recherche locale.',
      stats: ['1ère page: 98%', 'Appels entrants: +40%', 'Zone: 0-50km', 'Visites en magasin: +35%', 'Délai: 1-2 mois'],
      benefits: ['Clients qualifiés à proximité immédiate', 'Visibilité sur Google Maps avec itinéraire direct', 'Génération d\'avis clients 5 étoiles', 'Augmentation des appels et visites en point de vente', 'ROI rapide avec des leads locaux à forte intention']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Camera,
      angle: 132,
      color: { from: '#ec4899', to: '#a855f7' },
      gradient: 'from-pink-500 to-purple-500',
      description: 'Créez une communauté engagée autour de votre marque et convertissez via le contenu visuel. 2,5 milliards d\'utilisateurs actifs mensuels dont 26M en France.',
      details: 'Instagram est devenu incontournable pour le B2C. Notre stratégie combine posts organiques, stories, reels et collaborations influenceurs pour maximiser votre visibilité. Shopping intégré pour vendre directement depuis l\'application.',
      stats: ['Engagement: 3-6%', 'Reach organique: 10-20%', 'Stories vues: 70%', 'Shopping: +30% ventes', 'Utilisateurs FR: 26M'],
      benefits: ['Potentiel viral avec les Reels (500M utilisateurs/jour)', 'Communauté fidèle et engagée', 'Instagram Shopping intégré', 'Publicité ultra-performante (Meta Ads)', 'Format Stories idéal pour l\'authenticité']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: MessageSquare,
      angle: 165,
      color: { from: '#3b82f6', to: '#06b6d4' },
      gradient: 'from-blue-500 to-cyan-500',
      description: 'La plus grande audience mondiale (3 milliards d\'utilisateurs) pour votre visibilité de masse. Idéal pour toucher une audience mature et locale.',
      details: 'Facebook reste la plateforme avec le plus fort taux de conversion en B2C local. Groupes thématiques, marketplace, événements locaux : des outils puissants pour générer de l\'engagement et des leads qualifiés. 40M d\'utilisateurs actifs en France.',
      stats: ['Utilisateurs: 3B monde', 'Utilisateurs FR: 40M', 'Âge principal: 25-54 ans', 'Conversion: 2-4%', 'Groupes actifs: x10 engagement'],
      benefits: ['Audience mature avec pouvoir d\'achat élevé', 'Groupes thématiques pour créer une communauté', 'Marketplace pour vendre localement', 'Événements locaux pour booster votre visibilité', 'Ciblage géographique ultra-précis']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Users,
      angle: 198,
      color: { from: '#2563eb', to: '#6366f1' },
      gradient: 'from-blue-600 to-indigo-500',
      description: 'Le réseau B2B par excellence pour toucher les décideurs et générer des leads qualifiés. 1 milliard d\'utilisateurs professionnels dont 28M en France.',
      details: 'LinkedIn est LA plateforme pour le B2B. 80% des leads B2B viennent de LinkedIn. Notre stratégie combine personal branding, content marketing et prospection ciblée pour positionner votre entreprise comme experte de son secteur.',
      stats: ['Leads B2B: x2 vs autres canaux', 'CPL: 25-50€', 'Décideurs: 80%', 'Utilisateurs FR: 28M', 'Conversion B2B: 5-8%'],
      benefits: ['Cible professionnelle qualifiée et décisionnaire', 'Crédibilité et autorité B2B maximales', 'Networking et partenariats stratégiques', 'Contenu long-format pour démontrer votre expertise', 'LinkedIn Ads pour cibler par poste, secteur, entreprise']
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Video,
      angle: 231,
      color: { from: '#f472b6', to: '#22d3ee' },
      gradient: 'from-pink-400 to-cyan-400',
      description: 'La plateforme virale qui touche toutes les générations avec 27,8M d\'utilisateurs en France (70% ont 16-44 ans). Potentiel de croissance exponentiel.',
      details: 'TikTok a révolutionné le marketing avec son algorithme viral. Même avec 0 abonné, vous pouvez toucher des millions de personnes. Format court (15-60s), contenu authentique et storytelling : la recette du succès. ROI publicitaire comparable à Meta Ads.',
      stats: ['Viralité: Exponentielle', 'Vues moyennes: 10K+', 'Audience: 16-45+ ans', 'Temps moyen: 1h17/jour', 'Utilisateurs FR: 27,8M'],
      benefits: ['Potentiel viral inégalé même avec peu d\'abonnés', 'Toutes générations représentées (pas seulement les jeunes)', 'Contenus courts et faciles à produire', 'Algorithme favorisant le contenu organique', 'TikTok Ads avec CPM très compétitif']
    },
    {
      id: 'netlinking',
      name: 'Netlinking',
      icon: Link2,
      angle: 264,
      color: { from: '#7B61FF', to: '#9333ea' },
      gradient: 'from-violet to-purple-600',
      description: 'Augmentez l\'autorité de votre site avec des backlinks de qualité issus de sites à forte notoriété. Le pilier invisible mais essentiel du SEO.',
      details: 'Le netlinking représente 50% du poids du SEO selon Google. Nous créons des liens depuis des sites de qualité dans votre thématique pour augmenter votre autorité de domaine et booster votre positionnement. Stratégie white-hat uniquement.',
      stats: ['Autorité: +35 points', 'Backlinks: 50-100/mois', 'Ranking: +15 positions', 'Trafic référent: +25%', 'Impact SEO: 50%'],
      benefits: ['Autorité Google décuplée (Domain Authority)', 'Trafic référent qualifié depuis les liens', 'Rankings améliorés sur vos mots-clés stratégiques', 'Crédibilité et confiance renforcées', 'Stratégie white-hat durable et sans risque']
    },
    {
      id: 'mailing',
      name: 'Mailing',
      icon: Mail,
      angle: 297,
      color: { from: '#f59e0b', to: '#fb923c' },
      gradient: 'from-amber-500 to-orange',
      description: 'Fidélisez et convertissez grâce à l\'email marketing personnalisé. Le canal avec le meilleur ROI (4200%) et le plus de contrôle sur votre audience.',
      details: 'L\'email marketing reste le canal le plus rentable du digital. Contrairement aux réseaux sociaux, vous êtes propriétaire de votre base. Scénarios automatisés, segmentation fine, A/B testing : nous optimisons chaque email pour maximiser les conversions.',
      stats: ['ROI: 4200%', 'Taux d\'ouverture: 20-25%', 'Taux de clic: 2-5%', 'Conversion: 15-25%', 'Coût: 0,001€/email'],
      benefits: ['ROI maximal de tous les canaux digitaux', 'Automatisation complète (welcome, abandon panier, réengagement)', 'Relation client personnalisée et segmentée', 'Propriété totale de votre base de données', 'Mesurable et optimisable en temps réel']
    },
    {
      id: 'influence',
      name: 'Influence',
      icon: Star,
      angle: 330,
      color: { from: '#f43f5e', to: '#db2777' },
      gradient: 'from-rose-500 to-pink-600',
      description: 'Boostez votre notoriété grâce au marketing d\'influence avec BeHype. Recevez des influenceurs gratuitement en échange de visibilité sur leurs réseaux sociaux.',
      details: 'BeHype est notre SaaS de mise en relation entre influenceurs et établissements d\'expérience. Parfait pour les restaurants, hôtels, bars et lieux d\'expérience qui souhaitent augmenter leur notoriété sans budget publicitaire. L\'influenceur vit l\'expérience, la partage à sa communauté, et vous gagnez en visibilité.',
      stats: ['Coût: 0€', 'Reach moyen: 50K-500K', 'Engagement: 5-15%', 'ROI: Incalculable', 'Plus de 1000 établissements'],
      benefits: ['Visibilité massive sans budget publicitaire', 'Contenu authentique créé par les influenceurs', 'Touchez de nouvelles audiences qualifiées', 'Crédibilité et preuve sociale instantanée', 'Plateforme be-hype.com entièrement automatisée']
    }
  ]

// Données des indicateurs de la hero section
const heroStatsData = [
  {
    id: 'roi',
    value: '×7',
    title: 'ROI moyen',
    subtitle: 'après 1 an d\'accompagnement',
    color: 'violet',
    bgClass: 'from-violet/20 to-violet/10',
    borderClass: 'border-violet/30 hover:border-violet/60',
    textClass: 'text-violet',
    description: 'Un retour sur investissement moyen de x7 après un an d\'accompagnement DigiFlow.',
    details: 'Notre méthodologie data-driven combinée à notre expertise multi-canal nous permet d\'obtenir des résultats exceptionnels. En optimisant constamment vos campagnes publicitaires, votre SEO, et tous vos canaux d\'acquisition, nous maximisons chaque euro investi. Sur 50+ clients accompagnés, le ROI moyen constaté est de x7 après 12 mois d\'accompagnement.',
    benefits: [
      'Optimisation quotidienne de tous vos canaux marketing',
      'Stratégie multi-canal coordonnée pour des synergies maximales',
      'Tracking précis et reporting transparent sur chaque euro investi',
      'Expertise sectorielle pour maximiser les performances',
      'Accompagnement premium avec conseiller dédié'
    ],
    metrics: [
      'ROI minimum constaté: x3',
      'ROI maximum constaté: x15',
      'Délai moyen pour atteindre x7: 10-14 mois',
      'Taux de satisfaction: 100%'
    ]
  },
  {
    id: 'retention',
    value: '100%',
    title: 'Fidélisation',
    subtitle: 'après 1 an d\'accompagnement',
    color: 'green-500',
    bgClass: 'from-green-500/20 to-green-500/10',
    borderClass: 'border-green-500/30 hover:border-green-500/60',
    textClass: 'text-green-500',
    description: 'Zéro client perdu après un an d\'accompagnement : 100% de nos clients nous font confiance sur la durée.',
    details: '0% de churn après 1 an d\'accompagnement. Ce chiffre exceptionnel reflète notre engagement absolu envers la satisfaction et les résultats de nos clients. Notre approche premium, notre conseiller dédié et nos résultats mesurables font que nos clients restent avec nous sur le long terme. Nous ne sommes pas une agence parmi d\'autres : nous devenons un véritable partenaire de croissance.',
    benefits: [
      'Conseiller dédié qui connaît votre business sur le bout des doigts',
      'Réactivité et disponibilité maximale',
      'Recommandations proactives et personnalisées',
      'Résultats mesurables et reporting transparent',
      'Solution premium adaptée à chaque situation'
    ],
    metrics: [
      'Durée moyenne de collaboration: 2,5 ans',
      'Taux de recommandation: 98%',
      'NPS (Net Promoter Score): 85',
      'Clients depuis plus de 3 ans: 40%'
    ]
  },
  {
    id: 'cpl',
    value: '12€',
    title: 'CPL moyen',
    subtitle: 'Coût par lead optimisé',
    color: 'orange',
    bgClass: 'from-orange/20 to-orange/10',
    borderClass: 'border-orange/30 hover:border-orange/60',
    textClass: 'text-orange',
    description: 'Un coût par lead optimisé à 12€ en moyenne grâce à nos campagnes publicitaires ultra-performantes.',
    details: 'Le CPL (Coût Par Lead) est l\'indicateur clé de la performance publicitaire. Grâce à notre expertise Meta Ads et Google Ads, nous atteignons un CPL moyen de 12€ tous secteurs confondus. Notre méthodologie d\'optimisation continue, nos tests A/B systématiques et notre ciblage ultra-précis nous permettent de générer des leads qualifiés à un coût très compétitif.',
    benefits: [
      'Optimisation quotidienne des campagnes publicitaires',
      'Tests A/B automatisés des créas et audiences',
      'Ciblage comportemental avancé et lookalike audiences',
      'Retargeting multi-étapes pour maximiser les conversions',
      'Suivi et analyse en temps réel des performances'
    ],
    metrics: [
      'CPL Meta Ads: 8-15€',
      'CPL Google Ads: 12-20€',
      'Taux de conversion moyen: 3-8%',
      'ROI publicitaire moyen: 400%'
    ]
  },
  {
    id: 'seo',
    value: '98%',
    title: '1ère page Google',
    subtitle: 'dès le premier mois',
    color: 'blue-500',
    bgClass: 'from-blue-500/20 to-blue-500/10',
    borderClass: 'border-blue-500/30 hover:border-blue-500/60',
    textClass: 'text-blue-500',
    description: '98% de nos clients atteignent la première page Google dès le premier mois grâce à notre stratégie SEO local.',
    details: 'Notre stratégie SEO local combinée à l\'optimisation de votre fiche Google Business nous permet d\'atteindre la première page Google dans 98% des cas dès le premier mois. Pour le SEO national, les résultats prennent 2-3 mois mais sont tout aussi impressionnants. Le SEO est l\'investissement le plus rentable sur le long terme : une fois positionné, le trafic est gratuit et pérenne.',
    benefits: [
      'Optimisation technique complète du site',
      'Fiche Google Business optimisée et boostée',
      'Création de contenu SEO stratégique',
      'Netlinking de qualité avec des sites à forte autorité',
      'Suivi des positions et reporting détaillé'
    ],
    metrics: [
      'Taux de réussite 1ère page SEO local: 98%',
      'Taux de réussite 1ère page SEO national: 95%',
      'Délai moyen 1ère page (local): 1 mois',
      'Délai moyen 1ère page (national): 2-3 mois'
    ]
  },
  {
    id: 'traffic',
    value: '+900',
    title: 'Visiteurs/mois',
    subtitle: 'en moyenne sur le site',
    color: 'purple-500',
    bgClass: 'from-purple-500/20 to-purple-500/10',
    borderClass: 'border-purple-500/30 hover:border-purple-500/60',
    textClass: 'text-purple-500',
    description: 'Plus de 900 visiteurs qualifiés par mois en moyenne sur votre site web.',
    details: 'Grâce à notre stratégie multi-canal (SEO, Google Ads, Meta Ads, réseaux sociaux), nous générons en moyenne +900 visiteurs qualifiés par mois sur les sites de nos clients. Ce trafic est qualifié car il provient de personnes activement intéressées par vos produits ou services. Plus de trafic = plus de leads = plus de clients.',
    benefits: [
      'Trafic qualifié et à forte intention d\'achat',
      'Sources de trafic diversifiées pour réduire la dépendance',
      'Croissance exponentielle du trafic dans le temps',
      'Tracking précis de la provenance de chaque visiteur',
      'Optimisation continue pour améliorer le taux de conversion'
    ],
    metrics: [
      'Croissance moyenne du trafic: +150% par an',
      'Taux de rebond moyen: 45%',
      'Durée moyenne de session: 3min 20s',
      'Pages vues par session: 3,2'
    ]
  },
  {
    id: 'leads',
    value: '+35',
    title: 'Prospects/mois',
    subtitle: 'dès le premier mois',
    color: 'cyan-500',
    bgClass: 'from-cyan-500/20 to-cyan-500/10',
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
    textClass: 'text-cyan-500',
    description: 'Plus de 35 prospects qualifiés générés dès le premier mois d\'accompagnement.',
    details: 'Dès le premier mois de collaboration, nous générons en moyenne +35 prospects qualifiés pour nos clients. Ces leads proviennent de multiples canaux (formulaires de contact, appels téléphoniques, messages WhatsApp, Google Business) et sont prêts à acheter. Nous mettons en place des systèmes d\'acquisition rapides (Google Ads, Meta Ads, SEO local) pour obtenir des résultats immédiats.',
    benefits: [
      'Leads qualifiés prêts à acheter',
      'Diversification des sources de leads',
      'Formulaires optimisés pour maximiser les conversions',
      'Suivi et qualification automatisés des leads',
      'Intégration CRM pour un suivi optimal'
    ],
    metrics: [
      'Leads moyens mois 1: 35+',
      'Leads moyens mois 6: 80+',
      'Leads moyens mois 12: 150+',
      'Taux de conversion lead → client: 20-30%'
    ]
  },
  {
    id: 'sectors',
    value: '+15',
    title: 'Secteurs experts',
    subtitle: 'domaines d\'activité maîtrisés',
    color: 'pink-500',
    bgClass: 'from-pink-500/20 to-pink-500/10',
    borderClass: 'border-pink-500/30 hover:border-pink-500/60',
    textClass: 'text-pink-500',
    description: 'Une expertise reconnue dans plus de 15 secteurs d\'activité différents.',
    details: 'Notre équipe a développé une expertise approfondie dans plus de 15 secteurs d\'activité : restauration, immobilier, santé & bien-être, services professionnels, e-commerce, tourisme, et bien plus. Cette connaissance sectorielle nous permet de comprendre les enjeux spécifiques de votre marché, votre audience cible, et les leviers d\'acquisition qui fonctionnent le mieux dans votre domaine.',
    benefits: [
      'Connaissance approfondie de votre marché',
      'Stratégies adaptées aux spécificités de votre secteur',
      'Benchmarks et best practices sectorielles',
      'Réseau et partenariats dans votre domaine',
      'Expertise reconnue et certifiée'
    ],
    metrics: [
      'Secteurs: Restauration, Immobilier, Santé & Bien-être, Services Pro, E-commerce, Tourisme, Retail, Formation, BTP, Beauty, Sport & Fitness, Location & Services, Mode, Bijouterie, Mobilier',
      'Années d\'expérience moyenne: 7 ans',
      'Clients par secteur: 3-10 clients'
    ]
  },
  {
    id: 'clients',
    value: '+50',
    title: 'Clients accompagnés',
    subtitle: 'Clients avec un accompagnement premium',
    color: 'amber-500',
    bgClass: 'from-amber-500/20 to-amber-500/10',
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    textClass: 'text-amber-500',
    description: 'Plus de 50 entreprises nous font confiance et bénéficient de notre accompagnement premium.',
    details: 'Nous avons accompagné plus de 50 entreprises dans leur transformation digitale avec des résultats mesurables et exceptionnels. Notre approche premium garantit un conseiller dédié, des recommandations personnalisées régulières, et des solutions sur-mesure adaptées à chaque situation. Chaque client est unique et mérite une stratégie unique.',
    benefits: [
      'Accompagnement humain et personnalisé',
      'Conseiller dédié disponible et réactif',
      'Recommandations proactives basées sur les données',
      'Solutions adaptées à votre budget et vos objectifs',
      'Relation de confiance sur le long terme'
    ],
    metrics: [
      'Clients actifs: 50+',
      'Taux de satisfaction: 100%',
      'Durée moyenne de collaboration: 2,5 ans',
      'Taux de recommandation: 98%'
    ]
  }
]

// Processus global chronologique avec canaux associés
const globalProcess = [
  { step: "01", title: "RDV & Prise d'informations", description: "Rendez-vous découverte pour comprendre vos objectifs, votre activité, votre cible et définir ensemble la stratégie digitale complète", icon: Target, channels: ['always'] },
  { step: "02", title: "Création Site Web - Première Ébauche", description: "Développement de la première version de votre site web : maquettes, structure, pages principales et design personnalisé", icon: Globe, channels: ['always'] },
  { step: "03", title: "Retouches Définitives & Mise en Ligne", description: "Intégration de vos retours, ajustements finaux, tests de fonctionnement et mise en ligne officielle du site", icon: Rocket, channels: ['always'] },
  { step: "04", title: "Optimisation SEO Technique", description: "Configuration technique SEO : balises, vitesse, mobile-first, sitemap, robots.txt et structure optimale", icon: Search, channels: ['seo-naturel', 'seo-local'] },
  { step: "05", title: "Optimisation Fiche Google Business", description: "Configuration complète de votre profil Google Business avec photos, horaires, services et optimisation pour le référencement local", icon: MapPin, channels: ['seo-local'] },
  { step: "06", title: "Shooting Photos & Vidéos Professionnelles", description: "Réalisation d'un shooting photo et vidéo professionnel de votre établissement, produits, équipe pour contenu authentique", icon: Camera, channels: ['instagram', 'facebook', 'tiktok', 'linkedin'] },
  { step: "07", title: "Intégration Photos/Vidéos au Site Web", description: "Ajout des visuels professionnels sur le site, optimisation des images et mise à jour des contenus visuels", icon: Sparkles, channels: ['instagram', 'facebook', 'tiktok'] },
  { step: "08", title: "Création Contenu SEO & Pages Stratégiques", description: "Rédaction de contenus optimisés SEO pour les pages clés, articles de blog et landing pages pour améliorer le référencement", icon: FileText, channels: ['seo-naturel', 'netlinking'] },
  { step: "09", title: "Setup Réseaux Sociaux", description: "Configuration et optimisation de vos profils Instagram, Facebook, LinkedIn, TikTok avec visuels et informations cohérentes", icon: Users, channels: ['instagram', 'facebook', 'linkedin', 'tiktok'] },
  { step: "10", title: "Calendrier Éditorial & Premiers Posts", description: "Création du planning de publications 30 jours et publication des premiers contenus sur vos réseaux sociaux", icon: Calendar, channels: ['instagram', 'facebook', 'linkedin', 'tiktok'] },
  { step: "11", title: "Configuration Tracking & Analytics", description: "Installation Google Analytics, Meta Pixel, Tag Manager pour suivre les performances et conversions de tous vos canaux", icon: BarChart3, channels: ['meta-ads', 'google-ads'] },
  { step: "12", title: "Lancement Campagnes Meta Ads", description: "Mise en ligne des campagnes Meta Ads (Facebook & Instagram) avec audiences ciblées, visuels optimisés et budgets définis", icon: Target, channels: ['meta-ads'] },
  { step: "13", title: "Lancement Campagnes Google Ads", description: "Activation des campagnes Google Ads (Search, Display, Shopping) avec mots-clés stratégiques et enchères optimisées", icon: Search, channels: ['google-ads'] },
  { step: "14", title: "Setup Email Marketing & Automation", description: "Configuration plateforme emailing, création templates, scénarios automatisés (welcome, abandon panier) et première campagne", icon: Mail, channels: ['mailing'] },
  { step: "15", title: "Stratégie Netlinking & Backlinks", description: "Lancement de la stratégie d'acquisition de backlinks : guest posts, partenariats, annuaires pour renforcer l'autorité SEO", icon: Link2, channels: ['netlinking'] },
  { step: "16", title: "Marketing d'Influence & Partenariats", description: "Inscription sur BeHype, matching avec influenceurs pertinents et lancement des collaborations pour booster la notoriété", icon: Trophy, channels: ['influence'] },
  { step: "17", title: "Analyse & Optimisation Continue", description: "Suivi hebdomadaire/mensuel des performances, ajustements stratégiques, A/B tests et optimisations pour maximiser les résultats", icon: TrendingUp, Globe, Check, Target, Eye, EyeOff, Trash2, Shield, channels: ['always'] }
]

// Hub System Interactive Component
function HubSystemInteractive({
  activeChannels,
  setActiveChannels
}: {
  activeChannels: Record<string, boolean>,
  setActiveChannels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  const [selectedChannel, setSelectedChannel] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showReferencesModal, setShowReferencesModal] = useState(false)

  // Données des références
  const websiteReferences = [
    { name: "GROUPE FLIPPE DÉMÉNAGEMENTS", description: "Groupe de déménageur régional (13, 83, 84, 04, 05)", url: "https://demenagementsmillot.fr" },
    { name: "RIV'ENERGIES", description: "Artisan électricien à Gréasque (13)", url: "https://riv-energies.fr" },
    { name: "SELECT ELITE PROPERTIES", description: "Agence Immobilière à Dubaï (Dubaï)", url: "https://select-elite-properties.fr" },
    { name: "VIDA'M", description: "Restaurant à Paris (75)", url: "https://vida-m.fr/" },
    { name: "PAYSAGISTE JEAN", description: "Artisan Paysagiste à Villevaudé (77)", url: "https://paysagiste-jean.com" },
    { name: "BEHYPE", description: "Start-up dans le secteur du CHR (France)", url: "https://be-hype.com" },
    { name: "AU TEMPLE DU SUSHI", description: "Sushi à Bouc Bel Air (13)", url: "https://au-temple-du-sushi.fr" },
    { name: "PASTA DA NONNA MIA", description: "Traiteur Italien à Bouc Bel Air (13)", url: "https://pasta-da-nonna-mia.fr" },
    { name: "LE 58 RESTAURANT & TRAITEUR", description: "Restaurant & Traiteur à Rayersviller (57)", url: "https://le-58.fr/fr" },
    { name: "ARKANYS", description: "Jeu Vidéo dans le WEB.3.0 (Monde)", url: "https://arkanys.io" },
    { name: "L'ARTISAN NAPOLITAIN", description: "Pizzeria à Paris (75)", url: "https://artisan-napolitain.fr" },
    { name: "FREE ADDICT", description: "3 Centres de lasérothérapie dans le Nord de la France (62 & 76)", url: "https://free-addict.fr" },
    { name: "CROUSTY FUSION", description: "Street Food de Crousty à Paris (75)", url: "https://crousty-fusion.fr" },
    { name: "PREITY INDIA", description: "Restaurant Indien à Marseille (13)", url: "https://preity-india.com" },
    { name: "PASSION HABITAT", description: "Entreprise du bâtiment à Marseille (13)", url: "https://passion-habitat.com" },
    { name: "PROVENCAL PISCINE", description: "Pisciniste à Aubagne (13)", url: "https://provencal-piscine.fr" },
    { name: "SCPI PEINTURE", description: "Entreprise de peinture à Aubagne (13)", url: "https://sudcouleurpeinture.fr" },
    { name: "UN INSTANT CHEZ MOI", description: "Magasin de décoration intérieur à Gordes (84)", url: "https://un-instant-chez-moi.fr" },
    { name: "L'ITALIEN", description: "Restaurant Italien haut de gamme à Aix en Provence (13)", url: "https://litalien.fr" },
    { name: "LE BOCAGE", description: "Restaurant haut de gamme à Aix en Provence (13)", url: "https://restaurant-lebocage.fr" },
    { name: "HAPPY CURLY", description: "Coiffeuse experte cheveux bouclés à Paris (75)", url: "https://happy-curly-france.fr" },
    { name: "EN CORPS PRÉSENT", description: "Masseusse à Marseille (13)", url: "https://en-corps-present.fr/" }
  ]

  // Bloquer le scroll du body quand un modal est ouvert
  useEffect(() => {
    if (showModal || showReferencesModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup au démontage du composant
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal, showReferencesModal])

  // Toggle canal actif/inactif
  const toggleChannel = (channelId: string) => {
    setActiveChannels(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }))
  }

  // Ouvrir modal avec infos du canal
  const openChannelInfo = (channel: any) => {
    setSelectedChannel(channel)
    setShowModal(true)
  }

  // Toggle tous les canaux à la fois
  const toggleAllChannels = () => {
    const allActive = Object.values(activeChannels).every(v => v === true)
    const newState: Record<string, boolean> = {}
    channelsData.forEach(ch => {
      newState[ch.id] = !allActive
    })
    setActiveChannels(newState)
  }

  // Vérifier si tous les canaux sont actifs
  const allChannelsActive = Object.values(activeChannels).every(v => v === true)

  // Calcul de position en pixels
  const calculatePosition = (angle: number) => {
    const containerSize = 700
    const centerX = containerSize / 2
    const centerY = containerSize / 2
    const radius = 260
    const cardSize = 100

    const radian = (angle * Math.PI) / 180
    const x = centerX + Math.cos(radian) * radius - cardSize / 2
    const y = centerY + Math.sin(radian) * radius - cardSize / 2

    return { x, y }
  }

  // Position de fin de ligne (bord du cercle central)
  const calculateLineEnd = (angle: number) => {
    const containerSize = 700
    const centerX = containerSize / 2
    const centerY = containerSize / 2
    const centralRadius = 90 // Rayon du cercle central (180px / 2)

    const radian = (angle * Math.PI) / 180
    const x = centerX + Math.cos(radian) * centralRadius
    const y = centerY + Math.sin(radian) * centralRadius

    return { x, y }
  }

  return (
    <div className="relative w-full">
      {/* Container principal */}
      <div className="relative w-[700px] h-[700px] mx-auto bg-gradient-to-br from-dark-muted/50 to-dark/50 rounded-3xl border border-white/5 overflow-hidden">

        {/* Effets de fond */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet/10 rounded-full blur-3xl" />
        </div>

        {/* SVG pour toutes les lignes */}
        <svg className="absolute inset-0 pointer-events-none z-[25]" viewBox="0 0 700 700">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251, 146, 60, 0)" />
              <stop offset="50%" stopColor="rgba(251, 146, 60, 0.8)" />
              <stop offset="100%" stopColor="rgba(251, 146, 60, 0)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {channelsData.map((channel) => {
            const isActive = activeChannels[channel.id]
            if (!isActive) return null

            const { x: cardX, y: cardY } = calculatePosition(channel.angle)
            const { x: lineEndX, y: lineEndY } = calculateLineEnd(channel.angle)
            const cardCenterX = cardX + 50
            const cardCenterY = cardY + 50

            return (
              <line
                key={channel.id}
                x1={cardCenterX}
                y1={cardCenterY}
                x2={lineEndX}
                y2={lineEndY}
                stroke={channel.color.from}
                strokeWidth="2"
                opacity="0.3"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Cercle central "Site Web" */}
        <motion.div
          className="absolute left-[260px] top-[260px] w-[180px] h-[180px] z-20 cursor-pointer"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
          onContextMenu={(e) => {
            e.preventDefault()
            setShowReferencesModal(true)
          }}
        >
          {/* Glow animé */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet/30 to-orange/30 rounded-full blur-2xl animate-pulse" />

          {/* Cercle principal */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet via-purple-600 to-orange p-[3px]">
            <div className="w-full h-full rounded-full bg-dark flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-16 h-16 text-white mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-lg font-bold text-white">Site Web</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cartes des canaux */}
        {channelsData.map((channel, index) => {
          const { x, y } = calculatePosition(channel.angle)
          const isActive = activeChannels[channel.id]

          return (
            <motion.div
              key={channel.id}
              className="absolute w-[100px] h-[100px] z-10"
              style={{ left: x, top: y }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isActive ? 1 : 0.8,
                opacity: isActive ? 1 : 0.3
              }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              {/* Glow effect */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                  style={{
                    background: `linear-gradient(to bottom right, ${channel.color.from}, ${channel.color.to})`,
                    width: '120%',
                    height: '120%',
                    left: '-10%',
                    top: '-10%'
                  }}
                />
              )}

              {/* Carte */}
              <div
                className={`relative w-full h-full rounded-2xl p-[2px] cursor-pointer transition-all duration-300 ${
                  isActive ? 'hover:scale-110' : 'grayscale opacity-60 hover:opacity-80'
                }`}
                style={{
                  background: `linear-gradient(to bottom right, ${channel.color.from}, ${channel.color.to})`
                }}
                onClick={() => toggleChannel(channel.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  openChannelInfo(channel)
                }}
              >
                <div className="w-full h-full bg-dark/90 rounded-2xl flex flex-col items-center justify-center gap-1 relative">
                  <channel.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  <p className="text-xs font-bold text-white text-center px-1">{channel.name}</p>

                  {/* Indicateur actif/inactif */}
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            </motion.div>
          )
        })}

      </div>

      {/* Bouton On/Off global */}
      <div className="text-center mt-6">
        <button
          onClick={toggleAllChannels}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 ${
            allChannelsActive
              ? 'bg-gradient-to-r from-red-500 to-orange shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-r from-violet to-purple-600 shadow-lg shadow-violet/50'
          }`}
        >
          <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
            allChannelsActive ? 'bg-red-600' : 'bg-violet/30'
          }`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
              allChannelsActive ? 'left-6' : 'left-0.5'
            }`} />
          </div>
          <span>{allChannelsActive ? 'Désactiver tous les canaux' : 'Activer tous les canaux'}</span>
        </button>
      </div>

      {/* Instructions - en dehors du container pour éviter d'être derrière les canaux */}
      <div className="text-center mt-4 space-y-2">
        <p className="text-xs text-foreground-muted bg-dark/80 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 inline-block">
          <span className="font-bold text-white">Clic gauche</span> pour activer/désactiver • <span className="font-bold text-white">Clic droit</span> pour les détails
        </p>
        <p className="text-xs text-foreground-muted bg-dark/80 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 inline-block">
          <span className="font-bold text-white">Clic droit sur Site Web</span> pour voir nos références
        </p>
      </div>

      {/* Modal d'informations */}
      <AnimatePresence>
        {showModal && selectedChannel && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
              <div
                className="bg-dark border-2 rounded-2xl p-6 relative"
                style={{
                  borderColor: selectedChannel.color.from
                }}
              >
                {/* Bouton fermer */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to bottom right, ${selectedChannel.color.from}, ${selectedChannel.color.to})`
                    }}
                  >
                    <selectedChannel.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedChannel.name}</h3>
                    <p className="text-sm text-foreground-muted">{selectedChannel.description}</p>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-white mb-3">Statistiques clés</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedChannel.stats.map((stat: string, i: number) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-xs text-foreground-muted">{stat}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bénéfices */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-3">Avantages principaux</h4>
                  <div className="space-y-2">
                    {selectedChannel.benefits.map((benefit: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-foreground-muted">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      toggleChannel(selectedChannel.id)
                      setShowModal(false)
                    }}
                    className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                      activeChannels[selectedChannel.id]
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                    }`}
                  >
                    {activeChannels[selectedChannel.id] ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal des références site web */}
      <AnimatePresence>
        {showReferencesModal && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReferencesModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                className="w-full max-w-4xl max-h-[80vh] overflow-y-auto pointer-events-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="bg-dark border-2 border-violet rounded-2xl p-4 sm:p-6 relative">
                  {/* Bouton fermer */}
                  <button
                    onClick={() => setShowReferencesModal(false)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet to-orange">
                      <Globe className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Nos Références</h3>
                      <p className="text-xs sm:text-sm text-foreground-muted">Sites web que nous avons créés pour nos clients</p>
                    </div>
                  </div>

                  {/* Liste des références - avec scroll interne */}
                  <div className="max-h-[50vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {websiteReferences.map((ref, index) => (
                        <a
                          key={index}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-violet/50 transition-all hover:scale-[1.02] group"
                        >
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white mb-1 group-hover:text-violet transition-colors line-clamp-1">
                                {ref.name}
                              </h4>
                              <p className="text-xs text-foreground-muted line-clamp-2">
                                {ref.description}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-violet/20 to-orange/20 flex items-center justify-center group-hover:from-violet/40 group-hover:to-orange/40 transition-colors">
                                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet" />
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-4 sm:mt-6">
                    <button
                      onClick={() => setShowReferencesModal(false)}
                      className="w-full py-2.5 sm:py-3 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const [_scrolled, setScrolled] = useState(false)
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false)

  // States pour les popups des indicateurs de la hero section
  const [selectedStat, setSelectedStat] = useState<any>(null)
  const [showStatModal, setShowStatModal] = useState(false)

  // State pour gérer les services sélectionnés
  // Les 129€ d'hébergement sont toujours sélectionnés par défaut
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(['maintenance-hosting']))

  // State pour gérer les canaux actifs du hub system
  const [activeChannels, setActiveChannels] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    channelsData.forEach(ch => initial[ch.id] = false)
    return initial
  })

  // State pour gérer les canaux dépliants (accordion)
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set())

  // State pour gérer le modal de détails d'une offre
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)

  // State pour afficher/masquer les prix dans la barre sticky
  const [showPricesInBar, setShowPricesInBar] = useState(false)

  // State pour afficher/masquer le panier
  const [showCart, setShowCart] = useState(false)
  const [showCartDetails,_setShowCartDetails] = useState(true)
  const [showCartList, setShowCartList] = useState(false)

  // State pour les remises individuelles par service (id => pourcentage)
  const [serviceDiscounts, setServiceDiscounts] = useState<Map<string, number>>(new Map())

  // State pour la checkbox partenaire
  const [isPartner, setIsPartner] = useState(false)
  const [showPartnerModal, setShowPartnerModal] = useState(false)

  // State pour l'engagement (comptant, 24, 36, 48 mois)
  const [commitment, setCommitment] = useState<'comptant' | 24 | 36 | 48>('comptant')

  // Ref et state pour la hauteur de la barre sticky
  const stickyBarRef = useRef<HTMLDivElement>(null)
  const [stickyBarHeight, setStickyBarHeight] = useState(72)

  // Gérer le clic sur la checkbox partenaire
  const handlePartnerToggle = () => {
    if (!isPartner) {
      // Si on coche, afficher la modal
      setShowPartnerModal(true)
    } else {
      // Si on décoche, désactiver directement
      setIsPartner(false)
    }
  }

  // Confirmer le statut partenaire
  const confirmPartner = () => {
    setIsPartner(true)
    setShowPartnerModal(false)
  }

  // Annuler le statut partenaire
  const cancelPartner = () => {
    setIsPartner(false)
    setShowPartnerModal(false)
  }

  // Toggle selection d'un service
  const toggleServiceSelection = (serviceId: string) => {
    // Ne pas permettre de désélectionner l'hébergement de base (129€)
    if (serviceId === 'maintenance-hosting') {
      return
    }

    setSelectedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  // Toggle expansion d'un canal - permet ouverture simultanée
  const toggleChannelExpansion = (channelKey: string, channelIndex: number) => {
    console.log('🔍 Toggle channel:', channelKey, 'at index:', channelIndex)

    setExpandedChannels(prev => {
      const newSet = new Set(prev)
      console.log('📊 Previous expanded channels:', Array.from(prev))

      // Simple toggle : si ouvert, fermer ; si fermé, ouvrir
      if (newSet.has(channelKey)) {
        newSet.delete(channelKey)
        console.log('➖ Closing:', channelKey)
      } else {
        newSet.add(channelKey)
        console.log('➕ Opening:', channelKey)
      }

      console.log('📊 New expanded channels:', Array.from(newSet))
      return newSet
    })
  }

  // Calculer le total des services sélectionnés avec système de leasing
  const calculateTotal = () => {
    // Collecter toutes les offres de tous les canaux
    const allOffers: any[] = []
    Object.values(offersByChannel).forEach((channel: any) => {
      allOffers.push(...channel.offers)
    })

    let oneTimeTotal = 0 // Sites web, etc.
    let baseMaintenanceMonthly = 129 // Toujours inclus
    let additionalMonthly = 0 // Accompagnements supplémentaires et autres services mensuels

    // Vérifier si un site web est sélectionné
    const hasWebsite = Array.from(selectedServices).some(id =>
      ['site-vitrine', 'site-prestige', 'site-landing'].includes(id)
    )

    // Déterminer quelle formule de maintenance est sélectionnée (la plus élevée)
    let maintenanceUpgrade = 0
    let maintenanceUpgradeDiscount = 0

    if (selectedServices.has('maintenance-totale')) {
      // Formule Totale = 724€ total = 129€ (base) + 595€ (supplément qui inclut accompagnement)
      maintenanceUpgrade = 595
      maintenanceUpgradeDiscount = serviceDiscounts.get('maintenance-totale') || 0
    } else if (selectedServices.has('maintenance-accompagnement')) {
      // Formule Accompagnement = 389€ total = 129€ (base) + 260€ (supplément)
      maintenanceUpgrade = 260
      maintenanceUpgradeDiscount = serviceDiscounts.get('maintenance-accompagnement') || 0
    }

    // Appliquer la remise sur le supplément de maintenance
    const maintenanceUpgradeDiscountMultiplier = 1 - (maintenanceUpgradeDiscount / 100)
    additionalMonthly += Math.round(maintenanceUpgrade * maintenanceUpgradeDiscountMultiplier)

    selectedServices.forEach(serviceId => {
      const offer = allOffers.find(o => o.id === serviceId)
      if (offer) {
        // Récupérer la remise commerciale individuelle pour ce service
        const commercialDiscount = serviceDiscounts.get(serviceId) || 0
        const discountMultiplier = 1 - (commercialDiscount / 100)

        // Gérer l'hébergement de base (129€) - déjà compté
        if (serviceId === 'maintenance-hosting') {
          // Appliquer la remise commerciale sur l'hébergement
          baseMaintenanceMonthly = Math.round(129 * discountMultiplier)
          return
        }

        // Ignorer les formules accompagnement et totale car déjà gérées ci-dessus
        if (serviceId === 'maintenance-accompagnement' || serviceId === 'maintenance-totale') {
          return
        }

        // Autres services - Appliquer la remise commerciale
        if (offer.period) {
          // Services mensuels (Instagram, LinkedIn, etc.)
          additionalMonthly += Math.round(offer.priceValue * discountMultiplier)
        } else {
          // Services one-time (sites web, SEO, etc.)
          oneTimeTotal += Math.round(offer.priceValue * discountMultiplier)
        }
      }
    })

    // Calculer le total engagé (one-time + hébergement sur la période)
    const months = commitment === 'comptant' ? 0 : commitment
    const maintenanceTotalForPeriod = months > 0 ? baseMaintenanceMonthly * months : 0
    const engagedTotal = oneTimeTotal + maintenanceTotalForPeriod

    // Appliquer les remises selon l'engagement (uniquement sur le total engagé)
    let discount = 0
    if (commitment === 24) discount = 0.10
    else if (commitment === 36) discount = 0.20
    else if (commitment === 48) discount = 0.30

    // Remise partenaire de 20% sur tout
    const partnerDiscount = isPartner ? 0.20 : 0

    // Appliquer la remise d'engagement sur le total engagé
    const engagedTotalWithDiscount = engagedTotal * (1 - discount)

    // Appliquer la remise partenaire sur le total engagé
    const engagedTotalFinal = engagedTotalWithDiscount * (1 - partnerDiscount)

    // Appliquer la remise partenaire sur le mensuel
    const additionalMonthlyFinal = additionalMonthly * (1 - partnerDiscount)

    return {
      oneTimeTotal,
      baseMaintenanceMonthly,
      additionalMonthly: additionalMonthlyFinal,
      engagedTotal: engagedTotalFinal,
      discount: discount * 100,
      partnerDiscount: partnerDiscount * 100,
      hasWebsite,
      months
    }
  }

  // Get current month name in French
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' })
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  // Bloquer le scroll du body quand un modal est ouvert
  useEffect(() => {
    if (showStatModal || showOfferModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showStatModal, showOfferModal])

  // Handler pour ouvrir le modal d'un indicateur
  const handleStatClick = (stat: any) => {
    setSelectedStat(stat)
    setShowStatModal(true)
  }

  // Handler pour ouvrir le modal de détails d'une offre
  const handleOfferDetails = (offer: any, channel: any) => {
    setSelectedOffer({ ...offer, channel })
    setShowOfferModal(true)
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mesurer la hauteur de la barre sticky et mettre à jour le panier en temps réel
  useEffect(() => {
    if (!stickyBarRef.current) return

    // Mesurer immédiatement la hauteur initiale
    const initialHeight = stickyBarRef.current.getBoundingClientRect().height
    setStickyBarHeight(initialHeight)

    // Observer les changements de taille de la barre sticky
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.target.getBoundingClientRect().height
        setStickyBarHeight(height)
      }
    })

    resizeObserver.observe(stickyBarRef.current)

    // Cleanup
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // List of 50 business activities - Catégories larges pour ratisser large
  const targetActivities = [
    "Automobile & Mécanique", "Bâtiment & Rénovation", "Toiture & Couverture", "Menuiserie & Bois",
    "Plomberie & Chauffage", "Aménagement intérieur", "Métallerie & Serrurerie", "Vitrerie & Miroiterie",
    "Énergies renouvelables", "Isolation & Étanchéité", "Climatisation & Ventilation", "Jardinage & Espaces verts",
    "Piscines & Spas", "Carrelage & Revêtements", "Diagnostic immobilier", "Architecture & Design",
    "Études techniques", "Nettoyage professionnel", "Sécurité & Surveillance", "Déménagement & Transport",
    "Beauté & Coiffure", "Esthétique & Soins", "Restauration & Hôtellerie", "Commerce alimentaire",
    "Boulangerie-Pâtisserie", "Boucherie-Charcuterie", "Fleuriste & Décoration", "Optique & Lunetterie",
    "Santé & Paramédical", "Thérapies alternatives", "Médecine spécialisée", "Immobilier & Transaction",
    "Voyages & Tourisme", "Sport & Fitness", "Loisirs & Divertissement", "Événementiel & Animation",
    "Formation & Coaching", "Conseil & Expertise", "Marketing & Communication", "Informatique & Web",
    "Photographie & Vidéo", "Graphisme & Création", "Juridique & Comptabilité", "Assurance & Finance",
    "Location & Services", "Commerce de détail", "E-commerce & Vente en ligne", "Mode & Habillement",
    "Bijouterie & Horlogerie", "Mobilier & Décoration"
  ]

  // État pour afficher/masquer les prix
  const [showPrices, setShowPrices] = useState(false)

  // Les données du simulateur sont importées depuis @/data/simulator/loader
  // Pour modifier les canaux et offres, éditez le fichier data/simulator/channels.json

  const _results = [
    { metric: "+150%", label: "Augmentation du trafic", delay: 0.1 },
    { metric: "2-3x", label: "ROI moyen", delay: 0.2 },
    { metric: "95%", label: "Clients satisfaits", delay: 0.3 },
    { metric: "48h", label: "Support réactif", delay: 0.4 },
  ]

  const _testimonials = [
    {
      name: "Marie L.",
      role: "CEO @FashionBrand",
      content: "Après 3 mois, nous avons doublé notre trafic qualifié. Excellente équipe !",
      rating: 5,
      avatar: "ML"
    },
    {
      name: "Thomas B.",
      role: "Fondateur @TechStartup",
      content: "Le meilleur investissement pour notre croissance digitale. ROI incroyable.",
      rating: 5,
      avatar: "TB"
    },
    {
      name: "Sophie D.",
      role: "Directrice Marketing",
      content: "Des résultats concrets dès le premier mois. Je recommande à 200% !",
      rating: 5,
      avatar: "SD"
    }
  ]

  return (
    <>
      <style jsx global>{`
        .calendly-badge-widget,
        .calendly-badge-content,
        .calendly-popup-widget,
        .calendly-overlay,
        [class*="calendly-"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-b from-dark via-dark-muted to-dark">
        {/* Urgency Banner with Activities */}
        <div className="bg-gradient-to-r from-orange to-red-500 text-white relative z-50">
          <div className="py-2 px-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsActivitiesOpen(prev => !prev)
              }}
              className="w-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer relative z-50"
              style={{ pointerEvents: 'auto' }}
            >
              <Trophy className="w-4 h-4 animate-pulse flex-shrink-0 pointer-events-none" />
              <p className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 flex-wrap justify-center pointer-events-none">
                <span className="whitespace-nowrap">🎁 Pour {capitalizedMonth},</span>
                <span className="whitespace-nowrap">jusqu'à 30 000€ de prestation offerte (sous condition)</span>
                <span className="whitespace-nowrap">pour ces activités :</span>
              </p>
              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 pointer-events-none ${isActivitiesOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Activities List */}
            {isActivitiesOpen && (
              <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {targetActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs bg-white/10 rounded px-2 py-1.5 hover:bg-white/20 transition-colors"
                    >
                      <Check className="w-3 h-3 flex-shrink-0" />
                      <span className="text-left">{activity}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs mt-3 opacity-90">
                  ✨ Votre activité est dans la liste ? Profitez de notre offre exclusive !
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pas de navigation car on utilise celle du site principal */}

        {/* Hero Section */}
        <section className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-violet/20 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-orange/20 rounded-full filter blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-10 md:mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet/20 to-orange/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-5 md:mb-6 border border-white/10">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-orange" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  +50 entreprises nous font confiance
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-5 md:mb-6 px-4">
                <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                  Boostez votre visibilité en ligne
                </span>
                <br />
                <span className="text-white">
                  et générez plus de clients
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-foreground-muted mb-6 sm:mb-7 md:mb-8 max-w-3xl mx-auto px-4">
                Stratégie digitale sur-mesure pour développer votre entreprise durablement.
                Résultats mesurables et retour sur investissement en 2-3 mois.
              </p>

              {/* Statistics Grid */}
              <div className="max-w-5xl mx-auto mb-6 sm:mb-7 md:mb-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 px-4 text-center">
                  <span className="text-white">Chez DigiFlow on ne promet pas, </span>
                  <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">on prouve</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {heroStatsData.map((stat, index) => (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                      onClick={() => handleStatClick(stat)}
                      className={`bg-gradient-to-br ${stat.bgClass} backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border ${stat.borderClass} transition-all cursor-pointer hover:scale-105`}
                    >
                      <div className={`text-3xl sm:text-4xl md:text-5xl font-bold ${stat.textClass} mb-2`}>{stat.value}</div>
                      <p className="text-xs sm:text-sm text-white font-semibold mb-1">{stat.title}</p>
                      <p className="text-xs text-foreground-muted">{stat.subtitle}</p>
                    </motion.div>
                  ))}
                </div>

                {/* USP - Service Premium */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-4 sm:mt-5 md:mt-6 bg-gradient-to-r from-violet/10 to-orange/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/20"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-orange" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 sm:mb-2">
                        Accompagnement humain & premium
                      </h4>
                      <p className="text-xs sm:text-sm text-foreground-muted">
                        Un conseiller dédié, des recommandations personnalisées régulières, et des solutions adaptées à chaque situation.
                        <span className="text-white font-semibold"> Nous trouvons toujours la solution qui vous arrange !</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 md:gap-8 items-center px-4">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-violet to-orange flex items-center justify-center border-2 border-dark">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                    </div>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex gap-1 mb-1 justify-center sm:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-orange fill-orange" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground-muted">
                    <span className="font-bold text-white">4.9/5</span> basé sur 127 avis
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission & Objectif Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-dark relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange/10 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="container mx-auto max-w-5xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8 sm:mb-10"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange/20 to-red-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-orange/30">
                <Target className="w-4 h-4 text-orange" />
                <span className="text-sm font-semibold text-white">
                  Notre mission
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight px-4">
                L'objectif n'est pas d'avoir{' '}
                <span className="line-through text-foreground-muted opacity-50">un site vitrine sans visiteurs</span>
                <br />
                ni{' '}
                <span className="line-through text-foreground-muted opacity-50">un canal d'acquisition bancal</span>
              </h2>
            </motion.div>

            {/* Points négatifs barrés */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mb-10 sm:mb-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full filter blur-2xl" />
                  <div className="relative">
                    <X className="w-8 h-8 text-red-500 mb-3" />
                    <p className="text-base sm:text-lg text-foreground-muted">
                      Un <span className="text-red-400 font-semibold line-through">site web qui ne génère aucun trafic</span>, une présence digitale invisible qui ne sert qu'à remplir une case
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full filter blur-2xl" />
                  <div className="relative">
                    <X className="w-8 h-8 text-red-500 mb-3" />
                    <p className="text-base sm:text-lg text-foreground-muted">
                      Des <span className="text-red-400 font-semibold line-through">canaux d'acquisition mal optimisés</span> qui engloutissent votre budget sans retour mesurable
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* L'objectif réel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mb-8 sm:mb-10"
            >
              <div className="bg-gradient-to-br from-violet/20 to-orange/20 border-2 border-violet/50 rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet/5 to-orange/5" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet to-orange flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      Notre objectif
                    </h3>
                  </div>

                  <div className="space-y-4 text-base sm:text-lg md:text-xl text-white leading-relaxed">
                    <p>
                      <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent font-bold">
                        Trouver LA stratégie digitale la plus adaptée
                      </span>{' '}
                      à votre entreprise et votre secteur d'activité.
                    </p>
                    <p>
                      Permettre aux <span className="font-bold text-orange">dirigeants de reprendre le contrôle total</span> de leur communication et de leur acquisition client.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contexte économique */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="bg-dark-muted/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8">
                <div className="space-y-4">
                  <p className="text-base sm:text-lg md:text-xl text-foreground-muted leading-relaxed">
                    <span className="text-white font-bold">Attirer des clients est la mission numéro 1 d'une entreprise.</span>
                  </p>
                  <p className="text-base sm:text-lg text-foreground-muted leading-relaxed">
                    Le contexte économique actuel rend cela encore plus difficile.{' '}
                    <span className="text-white font-semibold">La différenciation n'est plus une option, c'est une nécessité.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Hub System Section - Conclusion */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-dark to-dark-muted relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet/10 rounded-full filter blur-3xl" />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12 md:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-4">
                <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                  Un système simple,
                </span>
                <br />
                <span className="text-white">une solution prouvée</span>
              </h2>
              <p className="text-base sm:text-lg text-foreground-muted max-w-3xl mx-auto px-4">
                Tous les canaux d'acquisition convergent vers un seul objectif : générer du trafic qualifié sur votre site web
              </p>
            </motion.div>

            {/* Hub Diagram - V2 Interactive */}
            <HubSystemInteractive activeChannels={activeChannels} setActiveChannels={setActiveChannels} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="text-center mt-32 md:mt-16 px-4"
            >
              <p className="text-sm sm:text-base text-foreground-muted italic max-w-3xl mx-auto">
                <span className="text-white font-semibold">Chaque canal d'acquisition travaille en synergie</span> pour maximiser votre visibilité et générer un flux constant de visiteurs qualifiés vers votre site web, votre véritable actif digital.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-dark-muted to-dark">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12 md:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4 mb-3 sm:mb-4">
                <span className="text-white">Construisez vous-même </span>
                <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                  votre solution
                </span>
                <br />
                <span className="text-white">en fonction de vos besoins</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-foreground-muted max-w-3xl mx-auto px-4">
                Nos expertises pour votre croissance digitale
              </p>
            </motion.div>

            {/* Section "Choisissez votre type d'accompagnement" - Site Web & Maintenance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">
                Choisissez votre type d'accompagnement :
              </h3>

              <div className="space-y-8">
                {/* Site Web */}
                {offersByChannel['site-web'] && (() => {
                  const channel = offersByChannel['site-web']
                  return (
                    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                      {/* Header du canal - Non cliquable */}
                      <div className="flex items-center gap-3 p-4 sm:p-5 bg-white/5">
                        <div className={`bg-gradient-to-r ${channel.gradient} p-2 sm:p-2.5 rounded-lg`}>
                          <channel.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className={`text-base sm:text-lg font-bold ${channel.textColor}`}>
                          {channel.channelName}
                        </h3>
                        <span className="text-xs text-foreground-muted bg-white/10 px-2 py-1 rounded-full font-semibold">
                          {channel.offers.length}
                        </span>
                      </div>

                      {/* Contenu toujours visible */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {channel.offers.map((offer: any, index: number) => {
                            const isSelected = selectedServices.has(offer.id)
                            const primaryColor = channel.textColor.replace('text-', '')

                            return (
                              <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => toggleServiceSelection(offer.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  handleOfferDetails(offer, channel)
                                }}
                                className={`bg-gradient-to-br backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 transition-all hover:scale-[1.03] cursor-pointer relative ${
                                  isSelected
                                    ? `from-${primaryColor}/40 to-${primaryColor}/30 border-${primaryColor} shadow-lg shadow-${primaryColor}/30`
                                    : offer.recommended
                                    ? `from-${primaryColor}/20 to-${primaryColor}/10 border-${primaryColor}/40`
                                    : `from-${primaryColor}/10 to-${primaryColor}/5 border-${primaryColor}/20 hover:border-${primaryColor}/40`
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute -top-2 -left-2 z-10">
                                    <CheckCircle className={`w-6 h-6 sm:w-7 sm:h-7 ${channel.textColor} fill-dark`} />
                                  </div>
                                )}

                                {offer.recommended && (
                                  <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${channel.gradient} px-2 py-1 rounded-full text-xs font-bold text-white z-10 shadow-lg`}>
                                    ⭐ TOP
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 sm:gap-3">
                                  <h4 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">{offer.title}</h4>

                                  {showPrices && (
                                    <div className="flex items-center gap-2">
                                      {offer.stars && (
                                        <div className="flex gap-0.5">
                                          {[...Array(offer.stars)].map((_: any, i: number) => (
                                            <Star key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${channel.textColor} fill-current`} />
                                          ))}
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-sm sm:text-base font-bold text-white">{offer.price}</span>
                                        {offer.period && <span className="text-xs text-foreground-muted ml-1">{offer.period}</span>}
                                      </div>
                                    </div>
                                  )}

                                  {!showPrices && (
                                    <div className="flex items-center gap-1.5 text-foreground-muted/60">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="text-xs italic">Masqué</span>
                                    </div>
                                  )}

                                  <span className={`text-xs sm:text-sm font-semibold ${channel.textColor} opacity-80`}>
                                    {offer.badge}
                                  </span>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Maintenance & Suivi */}
                {offersByChannel['maintenance'] && (() => {
                  const channel = offersByChannel['maintenance']
                  return (
                    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                      {/* Header du canal - Non cliquable */}
                      <div className="flex items-center gap-3 p-4 sm:p-5 bg-white/5">
                        <div className={`bg-gradient-to-r ${channel.gradient} p-2 sm:p-2.5 rounded-lg`}>
                          <channel.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className={`text-base sm:text-lg font-bold ${channel.textColor}`}>
                          {channel.channelName}
                        </h3>
                        <span className="text-xs text-foreground-muted bg-white/10 px-2 py-1 rounded-full font-semibold">
                          {channel.offers.length}
                        </span>
                      </div>

                      {/* Contenu toujours visible */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {channel.offers.map((offer: any, index: number) => {
                            const isSelected = selectedServices.has(offer.id)
                            const primaryColor = channel.textColor.replace('text-', '')

                            return (
                              <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => toggleServiceSelection(offer.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  handleOfferDetails(offer, channel)
                                }}
                                className={`bg-gradient-to-br backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 transition-all hover:scale-[1.03] cursor-pointer relative ${
                                  isSelected
                                    ? `from-${primaryColor}/40 to-${primaryColor}/30 border-${primaryColor} shadow-lg shadow-${primaryColor}/30`
                                    : offer.recommended
                                    ? `from-${primaryColor}/20 to-${primaryColor}/10 border-${primaryColor}/40`
                                    : `from-${primaryColor}/10 to-${primaryColor}/5 border-${primaryColor}/20 hover:border-${primaryColor}/40`
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute -top-2 -left-2 z-10">
                                    <CheckCircle className={`w-6 h-6 sm:w-7 sm:h-7 ${channel.textColor} fill-dark`} />
                                  </div>
                                )}

                                {offer.recommended && (
                                  <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${channel.gradient} px-2 py-1 rounded-full text-xs font-bold text-white z-10 shadow-lg`}>
                                    ⭐ TOP
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 sm:gap-3">
                                  <h4 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">{offer.title}</h4>

                                  {showPrices && (
                                    <div className="flex items-center gap-2">
                                      {offer.stars && (
                                        <div className="flex gap-0.5">
                                          {[...Array(offer.stars)].map((_: any, i: number) => (
                                            <Star key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${channel.textColor} fill-current`} />
                                          ))}
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-sm sm:text-base font-bold text-white">{offer.price}</span>
                                        {offer.period && <span className="text-xs text-foreground-muted ml-1">{offer.period}</span>}
                                      </div>
                                    </div>
                                  )}

                                  {!showPrices && (
                                    <div className="flex items-center gap-1.5 text-foreground-muted/60">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="text-xs italic">Masqué</span>
                                    </div>
                                  )}

                                  <span className={`text-xs sm:text-sm font-semibold ${channel.textColor} opacity-80`}>
                                    {offer.badge}
                                  </span>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>

            {/* Divider */}
            <div className="my-12 border-t border-white/10"></div>

            {/* Affichage des autres canaux - Accordion en 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(offersByChannel).filter(([channelKey]) => channelKey !== 'site-web' && channelKey !== 'maintenance').map(([channelKey, channel]: [string, any], channelIndex) => {
                const isExpanded = expandedChannels.has(channelKey)

                return (
                  <motion.div
                    key={channelKey}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: channelIndex * 0.05 }}
                    className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                  >
                    {/* Header du canal - Cliquable */}
                    <button
                      onClick={() => toggleChannelExpansion(channelKey, channelIndex)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors"
                    >   Arrêter le tunnel:  lsof -ti:3307 | xargs kill -9

                      <div className="flex items-center gap-3">
                        <div className={`bg-gradient-to-r ${channel.gradient} p-2 sm:p-2.5 rounded-lg`}>
                          <channel.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className={`text-base sm:text-lg font-bold ${channel.textColor}`}>
                          {channel.channelName}
                        </h3>
                        <span className="text-xs text-foreground-muted bg-white/10 px-2 py-1 rounded-full font-semibold">
                          {channel.offers.length}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Contenu dépliant */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 sm:p-6 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              {channel.offers.map((offer: any, index: number) => {
                                const isSelected = selectedServices.has(offer.id)
                                const primaryColor = channel.textColor.replace('text-', '')

                                return (
                                  <motion.div
                                    key={offer.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => toggleServiceSelection(offer.id)}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      handleOfferDetails(offer, channel)
                                    }}
                                    className={`bg-gradient-to-br backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 transition-all hover:scale-[1.03] cursor-pointer relative ${
                                      isSelected
                                        ? `from-${primaryColor}/40 to-${primaryColor}/30 border-${primaryColor} shadow-lg shadow-${primaryColor}/30`
                                        : offer.recommended
                                        ? `from-${primaryColor}/20 to-${primaryColor}/10 border-${primaryColor}/40`
                                        : `from-${primaryColor}/10 to-${primaryColor}/5 border-${primaryColor}/20 hover:border-${primaryColor}/40`
                                    }`}
                                  >
                                    {/* Checkmark pour sélection */}
                                    {isSelected && (
                                      <div className="absolute -top-2 -left-2 z-10">
                                        <CheckCircle className={`w-6 h-6 sm:w-7 sm:h-7 ${channel.textColor} fill-dark`} />
                                      </div>
                                    )}

                                    {/* Badge Recommandé */}
                                    {offer.recommended && (
                                      <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${channel.gradient} px-2 py-1 rounded-full text-xs font-bold text-white z-10 shadow-lg`}>
                                        ⭐ TOP
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-2 sm:gap-3">
                                      {/* Titre */}
                                      <h4 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">{offer.title}</h4>

                                      {/* Prix */}
                                      {showPrices && (
                                        <div className="flex items-center gap-2">
                                          {offer.stars && (
                                            <div className="flex gap-0.5">
                                              {[...Array(offer.stars)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${channel.textColor} fill-current`} />
                                              ))}
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-sm sm:text-base font-bold text-white">{offer.price}</span>
                                            {offer.period && <span className="text-xs text-foreground-muted ml-1">{offer.period}</span>}
                                          </div>
                                        </div>
                                      )}

                                      {/* Message si prix cachés */}
                                      {!showPrices && (
                                        <div className="flex items-center gap-1.5 text-foreground-muted/60">
                                          <Eye className="w-3.5 h-3.5" />
                                          <span className="text-xs italic">Masqué</span>
                                        </div>
                                      )}

                                      {/* Badge catégorie en bas */}
                                      <span className={`text-xs sm:text-sm font-semibold ${channel.textColor} opacity-80`}>
                                        {offer.badge}
                                      </span>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            {/* Bouton Dévoiler les tarifs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 sm:mt-12 flex justify-center px-4"
            >
              <button
                onClick={() => setShowPrices(!showPrices)}
                className="group relative bg-gradient-to-r from-violet to-orange px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-white hover:scale-105 transition-all shadow-lg hover:shadow-2xl hover:shadow-violet/50 flex items-center gap-3"
              >
                {showPrices ? (
                  <>
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg">Masquer les tarifs</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg">Dévoiler les tarifs</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Total des services sélectionnés - Sticky Bottom Bar */}
        <AnimatePresence>
          {selectedServices.size > 0 && (
            <>
              {/* Panier déroulant */}
              <AnimatePresence>
                {showCart && showCartList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed left-0 right-0 z-40 px-4 sm:px-6"
                    style={{ bottom: `${stickyBarHeight}px` }}
                  >
                    <div className="container mx-auto max-w-7xl">
                      <div className="bg-gradient-to-b from-dark via-dark to-dark/98 backdrop-blur-xl border-2 border-violet/30 border-b-0 shadow-2xl shadow-violet/20 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                              <ShoppingCart className="w-5 h-5" />
                              Mon panier
                            </h3>
                            <span className="text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet to-orange px-2.5 py-1 rounded-full">
                              {selectedServices.size} {selectedServices.size > 1 ? 'prestations' : 'prestation'}
                            </span>
                          </div>

                          {/* Liste des prestations */}
                          <div className="space-y-2 pb-16">
                            {(() => {
                              // Collecter toutes les offres de tous les canaux
                              const allOffers: any[] = []
                              Object.values(offersByChannel).forEach((channel: any) => {
                                allOffers.push(...channel.offers)
                              })

                              // Filtrer les offres sélectionnées
                              const selectedOffers = allOffers.filter(offer =>
                                selectedServices.has(offer.id)
                              )

                              return selectedOffers.map((offer) => {
                                const discount = serviceDiscounts.get(offer.id) || 0
                                const originalPrice = offer.priceValue
                                const discountedPrice = Math.round(originalPrice * (1 - discount / 100))
                                const isOffered = discount === 100

                                // Trouver le canal de cette offre
                                const offerChannel = Object.values(offersByChannel).find((ch: any) =>
                                  ch.offers.some((o: any) => o.id === offer.id)
                                )

                                return (
                                  <motion.div
                                    key={offer.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      if (offerChannel) {
                                        handleOfferDetails(offer, offerChannel)
                                      }
                                    }}
                                    className="p-2.5 bg-gradient-to-r from-white/10 to-white/5 rounded-lg hover:from-white/15 hover:to-white/10 transition-all border border-white/10 hover:border-violet/30 cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                            {offer.title}
                                          </h4>
                                          {isOffered && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white flex-shrink-0">
                                              OFFERT
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {discount > 0 && !isOffered && (
                                            <p className="text-[10px] text-foreground-muted line-through">
                                              {offer.price}
                                            </p>
                                          )}
                                          <p className={`text-xs font-semibold ${isOffered ? 'text-green-400' : 'text-violet'}`}>
                                            {isOffered ? 'Gratuit' : `${discountedPrice}€${offer.period || ''}`}
                                          </p>
                                          {discount > 0 && !isOffered && (
                                            <span className="text-[10px] font-semibold text-orange">
                                              -{discount}%
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Sélecteur de remise */}
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discount}
                                        onChange={(e) => {
                                          const newDiscount = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                          setServiceDiscounts(prev => {
                                            const newMap = new Map(prev)
                                            newMap.set(offer.id, newDiscount)
                                            return newMap
                                          })
                                        }}
                                        className="w-12 px-1.5 py-1 text-[10px] text-white bg-white/10 border border-white/20 rounded focus:outline-none focus:border-violet flex-shrink-0"
                                        placeholder="0"
                                      />

                                      {offer.id !== 'maintenance-hosting' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleServiceSelection(offer.id)
                                          }}
                                          className="p-1.5 rounded text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 transition-all border border-red-500/20 hover:border-red-500/50 flex-shrink-0"
                                          title="Retirer du panier"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {offer.id === 'maintenance-hosting' && (
                                        <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 flex-shrink-0">
                                          <span className="text-[10px] font-semibold text-green-400">Obligatoire</span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )
                              })
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Barre sticky */}
              <AnimatePresence>
              {showCart && (
              <motion.div
                ref={stickyBarRef}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-violet via-purple-600 to-orange p-1"
              >
                <div className="bg-dark/95 backdrop-blur-lg px-4 py-2 sm:px-6 sm:py-3 relative">
                  {/* Bouton croix pour fermer */}
                  <button
                    onClick={() => setShowCart(false)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
                    title="Fermer le panier"
                  >
                    <X className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
                  </button>

                  <div className="container mx-auto max-w-7xl pr-8">
                    {/* Ligne 1: Infos + Total + Actions principales */}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-2">
                      {/* Nombre de prestations */}
                      <p className="text-sm text-white font-semibold">
                        {selectedServices.size} prestation{selectedServices.size > 1 ? 's' : ''}
                      </p>

                      {/* Actions groupées */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowCartList(!showCartList)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
                        >
                          {showCartList ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Masquer</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Détail</span>
                            </>
                          )}
                        </button>

                        {showCartDetails && (
                          <button
                            onClick={() => {
                              setSelectedServices(new Set(['maintenance-hosting']))
                              setServiceDiscounts(new Map())
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            Réinitialiser
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ligne 2: Boutons engagement + Contrôles (conditionnels) */}
                    {showCartDetails && (
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Boutons d'engagement */}
                        {(['comptant', 24, 36, 48] as const).map((period) => (
                          <button
                            key={period}
                            onClick={() => setCommitment(period)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              commitment === period
                                ? 'bg-gradient-to-r from-violet to-orange text-white shadow-lg'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {period === 'comptant' ? 'Comptant' : `${period}m`}
                            {period !== 'comptant' && period === 24 && ' -10%'}
                            {period === 36 && ' -20%'}
                            {period === 48 && ' -30%'}
                          </button>
                        ))}

                        {/* Séparateur vertical */}
                        <div className="h-6 w-px bg-white/20"></div>

                        {/* Checkbox Partenaire */}
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPartner}
                            onChange={handlePartnerToggle}
                            className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-violet focus:ring-violet focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-white">Partenaire</span>
                        </label>

                        {/* Bouton afficher/masquer tarifs */}
                        <button
                          onClick={() => setShowPricesInBar(!showPricesInBar)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
                        >
                          {showPricesInBar ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Masquer prix</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Afficher prix</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Ligne 3: Prix détaillés (conditionnels) */}
                    {showCartDetails && showPricesInBar && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        {(() => {
                          const { engagedTotal, oneTimeTotal, baseMaintenanceMonthly: _baseMaintenanceMonthly, additionalMonthly, discount, partnerDiscount, hasWebsite, months } = calculateTotal()

                          return (
                            <>
                              {!hasWebsite && (
                                <p className="text-xs text-red-400 italic mb-2">⚠️ Vous devez sélectionner un site web</p>
                              )}

                              <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-xs">
                                {/* Montant engagé (24/36/48 mois) */}
                                {engagedTotal > 0 && months > 0 && (
                                  <div>
                                    <span className="text-foreground-muted block">
                                      Mensuel engagé ({months}m)
                                      {discount > 0 && ` -${discount}%`}
                                      {partnerDiscount > 0 && ` + Part. -${partnerDiscount}%`}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {discount > 0 && (
                                        <span className="text-sm font-bold text-foreground-muted line-through">
                                          {Math.round((engagedTotal / ((1 - discount / 100) * (1 - partnerDiscount / 100))) / months).toLocaleString('fr-FR')}€
                                        </span>
                                      )}
                                      <span className="text-base font-bold text-white">
                                        {Math.round(engagedTotal / months).toLocaleString('fr-FR')}€/mois
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Comptant : afficher le total one-time */}
                                {oneTimeTotal > 0 && months === 0 && (
                                  <div>
                                    <span className="text-foreground-muted block">
                                      Total comptant
                                      {partnerDiscount > 0 && ` (Part. -${partnerDiscount}%)`}
                                    </span>
                                    <span className="text-base font-bold text-white">
                                      {Math.round(oneTimeTotal * (1 - partnerDiscount / 100)).toLocaleString('fr-FR')}€
                                    </span>
                                  </div>
                                )}

                                {/* Hébergement 129€/mois (uniquement en comptant) */}
                                {months === 0 && (
                                  <div>
                                    <span className="text-foreground-muted block">+ Hébergement</span>
                                    <span className="text-base font-bold text-white">129€/mois</span>
                                  </div>
                                )}

                                {/* Autres services mensuels non engagés */}
                                {additionalMonthly > 0 && (
                                  <div>
                                    <span className="text-foreground-muted block">
                                      + Autres services
                                      {partnerDiscount > 0 && ` (-${partnerDiscount}%)`}
                                    </span>
                                    <span className="text-base font-bold text-white">
                                      {Math.round(additionalMonthly).toLocaleString('fr-FR')}€/mois
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              )}
              </AnimatePresence>

              {/* Bouton flottant pour ouvrir le panier */}
              {!showCart && selectedServices.size > 0 && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCart(true)}
                  className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-violet via-purple-600 to-orange shadow-2xl shadow-violet/50 flex items-center justify-center group hover:shadow-violet/70 transition-shadow"
                  title="Ouvrir le panier"
                >
                  <div className="relative">
                    <ShoppingCart className="w-7 h-7 text-white" />
                    {selectedServices.size > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {selectedServices.size}
                      </span>
                    )}
                  </div>
                </motion.button>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Process Section - Dynamique selon canaux actifs */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-dark-muted to-dark">
          <div className="container mx-auto max-w-7xl">
            {(() => {
              // Récupérer les canaux actifs
              const activeChannelsList = Object.entries(activeChannels)
                .filter(([_, isActive]) => isActive)
                .map(([channelId]) => channelId)

              // Filtrer les étapes à afficher
              const visibleSteps = globalProcess.filter(step => {
                // Toujours afficher les étapes "always"
                if (step.channels.includes('always')) return true

                // Afficher les étapes dont au moins un canal est actif
                return step.channels.some(channel => activeChannelsList.includes(channel))
              })

              // Si aucune étape à afficher (pas de canaux actifs), ne rien afficher
              if (visibleSteps.length === 0) {
                return null
              }

              // Renuméroter les étapes dynamiquement
              const stepsWithNewNumbers = visibleSteps.map((step, index) => ({
                ...step,
                displayStep: String(index + 1).padStart(2, '0')
              }))

              return (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10 sm:mb-12 md:mb-16"
                  >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-4">
                      <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                        Notre processus en {stepsWithNewNumbers.length} étape{stepsWithNewNumbers.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-white"> pour votre succès</span>
                    </h2>
                    <p className="text-sm sm:text-base text-foreground-muted max-w-2xl mx-auto">
                      {activeChannelsList.length > 0
                        ? `Processus personnalisé selon vos ${activeChannelsList.length} canal${activeChannelsList.length > 1 ? 'aux' : ''} sélectionné${activeChannelsList.length > 1 ? 's' : ''}`
                        : 'De la prise de contact à l\'optimisation continue, découvrez notre méthodologie complète'
                      }
                    </p>
                  </motion.div>

                  {/* Grille des étapes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                    {stepsWithNewNumbers.map((item, index) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-violet/50 transition-all duration-300 h-full">
                          <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent mb-3 sm:mb-4">
                            {item.displayStep}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-violet flex-shrink-0" />
                            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{item.title}</h3>
                          </div>
                          <p className="text-sm sm:text-base text-foreground-muted">{item.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        </section>

        {/* Guarantee Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-violet to-orange p-1 rounded-2xl sm:rounded-3xl"
            >
              <div className="bg-dark rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                <Shield className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-orange mx-auto mb-4 sm:mb-5 md:mb-6" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
                  Garantie Résultats Meta Ads
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-foreground-muted mb-6 sm:mb-7 md:mb-8 max-w-2xl mx-auto px-4">
                  Nous garantissons des résultats mesurables sur vos campagnes Meta Ads (Facebook & Instagram). Si après 3 mois d'optimisation vous n'obtenez pas de résultats, nous continuons gratuitement jusqu'à l'atteinte de vos objectifs.
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-white">Garantie 90 jours</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-white">ROI Garanti</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-white">Support illimité</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-dark-muted to-dark">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12 md:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-4">
                <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                  Questions fréquentes
                </span>
              </h2>
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  q: "Combien de temps avant de voir des résultats ?",
                  a: "Les premiers résultats apparaissent généralement après 1-2 mois. Un retour sur investissement solide est visible en 2-3 mois selon votre secteur."
                },
                {
                  q: "Quel est votre tarif ?",
                  a: "Nos solutions commencent à partir de 189€/mois. Le tarif exact dépend de vos besoins spécifiques, que nous définirons ensemble lors de l'audit gratuit."
                },
                {
                  q: "Y a-t-il un engagement ?",
                  a: "Cela dépend de l'offre choisie : nous avons des formules avec engagement pour maximiser les résultats, et d'autres sans engagement pour plus de flexibilité. Nous vous conseillons la meilleure option selon vos objectifs."
                },
                {
                  q: "Comment se passe l'audit gratuit ?",
                  a: "C'est un appel de 30 minutes où nous analysons votre situation actuelle et identifions les opportunités de croissance. Vous repartez avec un plan d'action, même si vous ne travaillez pas avec nous."
                },
                {
                  q: "Proposez-vous des facilités de paiement ?",
                  a: "Oui, nous sommes partenaires du Crédit Agricole. Vous pouvez étaler vos paiements sur 12, 24 ou 36 mois sans frais supplémentaires pour les projets de plus de 3000€."
                },
                {
                  q: "Quels sont les résultats garantis ?",
                  a: "Nous garantissons uniquement les résultats sur Meta Ads (Facebook & Instagram). Pour le SEO et les autres canaux, nous visons l'excellence mais les résultats dépendent de nombreux facteurs externes. C'est pourquoi nous offrons des révisions illimitées jusqu'à satisfaction."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/10"
                >
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-start gap-2">
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-violet flex-shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-sm sm:text-base text-foreground-muted pl-6 sm:pl-7">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Copywriting Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-dark relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet/10 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange/10 rounded-full filter blur-3xl" />
          </div>

          <div className="container mx-auto max-w-5xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8 sm:space-y-10 md:space-y-12"
            >
              {/* Opening Statement */}
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight px-4">
                  Chez DIGIFLOW, on aide les dirigeants à reprendre{' '}
                  <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                    le contrôle total
                  </span>{' '}
                  de leur entreprise.
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-foreground-muted italic px-4">
                  Beaucoup subissent leur marché — nous, on leur donne les outils pour le <span className="text-white font-semibold">dominer</span>.
                </p>
              </div>

              {/* Value Proposition */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-violet/10 to-orange/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10"
              >
                <p className="text-base sm:text-lg md:text-xl text-white leading-relaxed">
                  Notre force, c'est <span className="font-bold text-violet">l'accompagnement humain</span> : un conseiller dédié, des stratégies sur-mesure, et un suivi régulier pour guider chaque dirigeant vers sa situation idéale.
                </p>
                <p className="text-base sm:text-lg text-foreground-muted mt-4 italic">
                  Pour nous, c'est facile, c'est notre métier.
                </p>
              </motion.div>

              {/* Case Studies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <a
                    href="https://be-hype.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gradient-to-br from-violet/20 to-violet/5 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-violet/30 hover:border-violet/60 transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-violet flex-shrink-0 mt-1" />
                      <h3 className="text-lg sm:text-xl font-bold text-white">BeHype</h3>
                    </div>
                    <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
                      De <span className="text-white font-semibold">8 000 € de CA mensuel</span> à{' '}
                      <span className="text-violet font-semibold">10 millions de valorisation</span>
                    </p>
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <a
                    href="https://demenagementsmillot.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gradient-to-br from-orange/20 to-orange/5 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-orange/30 hover:border-orange/60 transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-orange flex-shrink-0 mt-1" />
                      <h3 className="text-lg sm:text-xl font-bold text-white">Groupe FLIPPE</h3>
                    </div>
                    <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
                      Leader du déménagement PACA •{' '}
                      <span className="text-orange font-semibold">ROI x7</span> •{' '}
                      <span className="text-white font-semibold">+12% post-Covid</span>
                    </p>
                  </a>
                </motion.div>
              </div>

              {/* Stats Highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-dark-muted to-dark border-2 border-violet/30 rounded-2xl p-6 sm:p-8 md:p-10"
              >
                <div className="space-y-3 sm:space-y-4 text-base sm:text-lg md:text-xl text-white leading-relaxed">
                  <p className="flex items-start gap-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-orange flex-shrink-0 mt-1" />
                    <span><span className="font-bold text-orange">98%</span> des sociétés accompagnées atteignent la première page Google dès le premier mois</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-orange flex-shrink-0 mt-1" />
                    <span><span className="font-bold text-orange">100%</span> de fidélisation après un an</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-orange flex-shrink-0 mt-1" />
                    <span>Coût moyen de <span className="font-bold text-orange">12€ par prospect</span></span>
                  </p>
                  <p className="flex items-start gap-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-orange flex-shrink-0 mt-1" />
                    <span>Plus de <span className="font-bold text-orange">900 visiteurs mensuels</span> sur nos sites</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-orange flex-shrink-0 mt-1" />
                    <span><span className="font-bold text-orange">+35 nouveaux clients</span> dès le premier mois d'accompagnement</span>
                  </p>
                </div>
              </motion.div>

              {/* Closing Statement */}
              <div className="text-center space-y-6 sm:space-y-8">
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-white px-4"
                >
                  Chez DIGIFLOW, on ne promet pas,{' '}
                  <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent">
                    on prouve.
                  </span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-3xl mx-auto"
                >
                  <p className="text-lg sm:text-xl md:text-2xl text-foreground-muted leading-relaxed px-4">
                    La communication n'est pas une dépense —<br />
                    <span className="text-white font-semibold">c'est le carburant de la croissance,</span><br />
                    et la clé pour reprendre le{' '}
                    <span className="bg-gradient-to-r from-violet to-orange bg-clip-text text-transparent font-bold">
                      contrôle total
                    </span>{' '}
                    de son entreprise.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-white/10">
          <div className="container mx-auto text-center">
            <p className="text-xs sm:text-sm md:text-base text-foreground-muted px-4">
              © 2024 DIGIFLOW Agency - Tous droits réservés |
              <Link href="/mentions-legales" className="ml-2 hover:text-violet transition-colors">
                Mentions légales
              </Link>
            </p>
          </div>
        </footer>
      </div>

      {/* Modal des indicateurs hero */}
      <AnimatePresence>
        {showStatModal && selectedStat && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div
                  className={`bg-dark border-2 rounded-2xl p-6 relative border-${selectedStat.color}`}
                >
                  {/* Bouton fermer */}
                  <button
                    onClick={() => setShowStatModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedStat.bgClass}`}
                    >
                      <div className={`text-2xl font-bold ${selectedStat.textClass}`}>
                        {selectedStat.value}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedStat.title}</h3>
                      <p className="text-sm text-foreground-muted">{selectedStat.description}</p>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-white mb-3">En détail</h4>
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      {selectedStat.details}
                    </p>
                  </div>

                  {/* Métriques */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-white mb-3">Métriques clés</h4>
                    <div className="space-y-2">
                      {selectedStat.metrics.map((metric: string, i: number) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-foreground-muted">{metric}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bénéfices */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3">Avantages principaux</h4>
                    <div className="space-y-2">
                      {selectedStat.benefits.map((benefit: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <p className="text-sm text-foreground-muted">{benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setShowStatModal(false)}
                      className="flex-1 py-3 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal des détails d'une offre (clic droit) */}
      <AnimatePresence>
        {showOfferModal && selectedOffer && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOfferModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="bg-dark border-2 rounded-2xl p-6 relative" style={{ borderColor: selectedOffer.channel.textColor.replace('text-', '') }}>
                  {/* Bouton fermer */}
                  <button
                    onClick={() => setShowOfferModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`bg-gradient-to-r ${selectedOffer.channel.gradient} p-4 rounded-xl`}>
                      <selectedOffer.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${selectedOffer.channel.textColor} bg-white/10 px-2 py-1 rounded-full`}>
                          {selectedOffer.channel.channelName}
                        </span>
                        <span className={`text-xs font-semibold ${selectedOffer.channel.textColor}`}>
                          {selectedOffer.badge}
                        </span>
                        {selectedOffer.recommended && (
                          <span className="text-xs font-bold text-white bg-gradient-to-r from-violet to-orange px-2 py-1 rounded-full">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedOffer.title}</h3>
                      {selectedOffer.salesPitch && (
                        <p className="text-sm text-white/80 italic font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                          {selectedOffer.salesPitch}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {selectedOffer.stars && (
                          <div className="flex gap-0.5">
                            {[...Array(selectedOffer.stars)].map((_: any, i: number) => (
                              <Star key={i} className={`w-4 h-4 ${selectedOffer.channel.textColor} fill-current`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Features complètes */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-white mb-3">Ce qui est inclus</h4>
                    <div className="space-y-2">
                      {selectedOffer.features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 ${selectedOffer.channel.textColor} flex-shrink-0 mt-0.5`} />
                          <p className="text-sm text-foreground-muted">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        toggleServiceSelection(selectedOffer.id)
                        setShowOfferModal(false)
                      }}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                        selectedServices.has(selectedOffer.id)
                          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                          : `bg-gradient-to-r ${selectedOffer.channel.gradient} text-white hover:shadow-lg`
                      }`}
                    >
                      {selectedServices.has(selectedOffer.id) ? 'Retirer de la sélection' : 'Ajouter à la sélection'}
                    </button>
                    <button
                      onClick={() => setShowOfferModal(false)}
                      className="px-6 py-3 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Conditions Partenaire */}
      <AnimatePresence>
        {showPartnerModal && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelPartner}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="bg-dark border-2 border-violet rounded-2xl p-6 sm:p-8 relative">
                  {/* Bouton fermer */}
                  <button
                    onClick={cancelPartner}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* Titre */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet to-orange text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                      <Shield className="w-4 h-4" />
                      CONDITIONS PARTENAIRE
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Êtes-vous sûr de respecter les conditions suivantes ?
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      Pour bénéficier de la remise partenaire de 20%, vous devez vous engager à respecter toutes ces conditions :
                    </p>
                  </div>

                  {/* Liste des conditions */}
                  <div className="space-y-4 mb-8">
                    {[
                      {
                        number: 1,
                        text: "Besoin de croissance, le projet du partenaire est viable."
                      },
                      {
                        number: 2,
                        text: "Besoin de reprendre la maîtrise totale de sa communication."
                      },
                      {
                        number: 3,
                        text: "Peut participer à des témoignages vidéos 1x par an pour expliquer son succès avec Digiflow."
                      },
                      {
                        number: 4,
                        text: "Peut apporter 5 contacts qui ont besoin de nos services."
                      },
                      {
                        number: 5,
                        text: "S'est engagé à ne pas divulguer les tarifs qui lui ont été proposés."
                      },
                      {
                        number: 6,
                        text: "S'engage à mettre toutes les chances de notre côté pour réussir sa communication."
                      }
                    ].map((condition) => (
                      <div key={condition.number} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-violet to-orange flex items-center justify-center text-white text-sm font-bold">
                          {condition.number}
                        </div>
                        <p className="text-sm text-white flex-1 pt-0.5">{condition.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Boutons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={cancelPartner}
                      className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmPartner}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet to-orange text-white font-semibold hover:shadow-lg hover:shadow-violet/50 transition-all"
                    >
                      Je confirme respecter ces conditions
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}