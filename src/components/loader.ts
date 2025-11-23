/**
 * Loader pour les données du simulateur
 * Transforme les données JSON en format utilisable par React avec les icônes mappées
 */

import type { LucideIcon } from 'lucide-react'
import simulatorData from './channels.json'
import { getIcon } from './iconMapper'
import type { Channel, Offer } from './types'

// Types enrichis avec les icônes React
export interface OfferWithIcon extends Omit<Offer, 'icon'> {
  icon: LucideIcon
}

export interface ChannelWithIcon extends Omit<Channel, 'icon' | 'offers'> {
  icon: LucideIcon
  offers: OfferWithIcon[]
}

export interface OffersByChannel {
  [channelId: string]: ChannelWithIcon
}

/**
 * Charge et transforme les données du simulateur
 * Convertit les noms d'icônes (strings) en composants React
 */
export function loadSimulatorData(): OffersByChannel {
  const offersByChannel: OffersByChannel = {}

  simulatorData.channels.forEach((channel) => {
    // Transformer les offres avec les icônes mappées
    const offersWithIcons: OfferWithIcon[] = channel.offers.map((offer) => ({
      ...offer,
      icon: getIcon(offer.icon),
    }))

    // Créer le canal avec icône mappée
    offersByChannel[channel.id] = {
      ...channel,
      icon: getIcon(channel.icon),
      offers: offersWithIcons,
    }
  })

  return offersByChannel
}

/**
 * Récupère les métadonnées du simulateur
 */
export function getSimulatorMetadata() {
  return {
    version: simulatorData.version,
    lastUpdated: simulatorData.lastUpdated,
    channelsCount: simulatorData.channels.length,
    totalOffers: simulatorData.channels.reduce(
      (total, channel) => total + channel.offers.length,
      0
    ),
  }
}

// Export des données transformées (utilisable directement)
export const offersByChannel = loadSimulatorData()
export const simulatorMetadata = getSimulatorMetadata()