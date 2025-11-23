/**
 * Types pour le simulateur de tarifs
 * Ces types définissent la structure des données pour les canaux et offres
 */

export interface Offer {
  /** Identifiant unique de l'offre (ex: "meta-setup") */
  id: string
  /** Nom de l'icône Lucide React (ex: "Rocket", "Target") */
  icon: string
  /** Titre de l'offre */
  title: string
  /** Prix affiché (ex: "1 600€", "Sur devis") */
  price: string
  /** Valeur numérique du prix pour les calculs (0 si sur devis) */
  priceValue: number
  /** Période si abonnement (ex: "/mois", "/an") - optionnel */
  period?: string
  /** Badge catégorie (ex: "Démarrage", "Croissance", "Performance") */
  badge: string
  /** Liste des fonctionnalités/avantages de l'offre */
  features: string[]
  /** Marquer comme offre recommandée (badge "Recommandé") */
  recommended?: boolean
  /** Nombre d'étoiles (optionnel, pour notation) */
  stars?: number
}

export interface Channel {
  /** Identifiant unique du canal (ex: "meta-ads") */
  id: string
  /** Nom du canal affiché (ex: "Meta Ads") */
  channelName: string
  /** Classes Tailwind pour le gradient (ex: "from-orange to-red-500") */
  gradient: string
  /** Classes Tailwind pour la couleur du texte (ex: "text-orange") */
  textColor: string
  /** Nom de l'icône Lucide React (ex: "Target", "Search") */
  icon: string
  /** Liste des offres pour ce canal */
  offers: Offer[]
}

export interface SimulatorData {
  /** Version des données (pour migration future) */
  version: string
  /** Date de dernière mise à jour */
  lastUpdated: string
  /** Liste de tous les canaux avec leurs offres */
  channels: Channel[]
}
