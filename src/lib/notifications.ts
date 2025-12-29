/**
 * Service centralisé pour la création de notifications
 * Toutes les notifications passent par ce service pour garantir la cohérence
 */

import { prisma } from '@/lib/prisma';
import { notifications_type } from '@prisma/client';

// Types d'événements supportés
export type NotificationEvent =
  // Deals
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_CLOSED_WON'
  | 'DEAL_CLOSED_LOST'
  | 'DEAL_ASSIGNED'
  | 'DEAL_UNASSIGNED'
  | 'DEAL_NOTE_ADDED'
  // Contacts
  | 'CONTACT_CREATED'
  | 'CONTACT_STATUS_CHANGED'
  // Quotes
  | 'QUOTE_CREATED'
  | 'QUOTE_SENT'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REFUSED'
  // Invoices
  | 'INVOICE_CREATED'
  | 'INVOICE_SENT'
  | 'INVOICE_PAID'
  // Activities
  | 'ACTIVITY_CREATED'
  | 'ACTIVITY_COMPLETED'
  // Reminders
  | 'REMINDER_CREATED'
  // Messages
  | 'MESSAGE_RECEIVED'
  // Meta Leads
  | 'META_LEADS_IMPORTED';

interface CreateNotificationParams {
  userId: string;
  type: notifications_type;
  title: string;
  message: string;
  link?: string;
}

export interface NotificationContext {
  actorId?: string;
  actorName?: string;
  entityId?: string;
  entityName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Génère un ID unique pour une notification
 */
function generateNotificationId(): string {
  return `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Crée une notification pour un utilisateur (fire-and-forget)
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  prisma.notifications.create({
    data: {
      id: generateNotificationId(),
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    },
  }).catch((error) => {
    console.error('[Notifications] Erreur création:', error);
  });
}

/**
 * Crée des notifications pour plusieurs utilisateurs (fire-and-forget)
 */
export async function createNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  const uniqueUserIds = Array.from(new Set(userIds));

  if (uniqueUserIds.length === 0) return;

  prisma.notifications.createMany({
    data: uniqueUserIds.map(userId => ({
      id: `${generateNotificationId()}-${userId.slice(-4)}`,
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    })),
  }).catch((error) => {
    console.error('[Notifications] Erreur création multiple:', error);
  });
}

/**
 * Récupère les IDs des utilisateurs admin
 */
export async function getAdminIds(): Promise<string[]> {
  const admins = await prisma.users.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  return admins.map(a => a.id);
}

/**
 * Helper principal pour déclencher une notification selon l'événement
 * Exclut automatiquement l'acteur des destinataires
 */
export async function notifyEvent(
  event: NotificationEvent,
  context: NotificationContext,
  recipientIds: string[]
): Promise<void> {
  const config = getNotificationConfig(event, context);
  if (!config) return;

  // Exclure l'acteur des destinataires (on ne se notifie pas soi-même)
  const filteredRecipients = recipientIds.filter(id => id !== context.actorId);
  if (filteredRecipients.length === 0) return;

  await createNotifications(filteredRecipients, config);
}

/**
 * Configuration des messages par type d'événement
 */
function getNotificationConfig(
  event: NotificationEvent,
  ctx: NotificationContext
): Omit<CreateNotificationParams, 'userId'> | null {
  const configs: Record<NotificationEvent, Omit<CreateNotificationParams, 'userId'>> = {
    // === DEALS ===
    DEAL_CREATED: {
      type: 'DEAL',
      title: 'Nouveau deal créé',
      message: `${ctx.actorName || 'Un utilisateur'} a créé le deal "${ctx.entityName}"`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },
    DEAL_STAGE_CHANGED: {
      type: 'DEAL',
      title: 'Deal déplacé',
      message: `Le deal "${ctx.entityName}" est passé de ${ctx.oldValue} à ${ctx.newValue}`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },
    DEAL_CLOSED_WON: {
      type: 'DEAL',
      title: 'Deal gagné !',
      message: `Félicitations ! Le deal "${ctx.entityName}" a été conclu`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },
    DEAL_CLOSED_LOST: {
      type: 'DEAL',
      title: 'Deal perdu',
      message: `Le deal "${ctx.entityName}" a été refusé`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },
    DEAL_ASSIGNED: {
      type: 'DEAL',
      title: 'Nouveau deal assigné',
      message: `${ctx.actorName || 'Un utilisateur'} vous a assigné au deal "${ctx.entityName}"`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },
    DEAL_UNASSIGNED: {
      type: 'DEAL',
      title: "Retrait d'un deal",
      message: `Vous avez été retiré du deal "${ctx.entityName}"`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },
    DEAL_NOTE_ADDED: {
      type: 'DEAL',
      title: 'Nouvelle note',
      message: `${ctx.actorName || 'Un utilisateur'} a ajouté une note sur "${ctx.entityName}"`,
      link: `/dashboard/crm/deals?dealId=${ctx.entityId}`,
    },

    // === CONTACTS ===
    CONTACT_CREATED: {
      type: 'ACTIVITY',
      title: 'Nouveau contact',
      message: `${ctx.actorName || 'Un utilisateur'} a créé le contact "${ctx.entityName}"`,
      link: `/dashboard/crm/contacts/${ctx.entityId}`,
    },
    CONTACT_STATUS_CHANGED: {
      type: 'ACTIVITY',
      title: 'Statut contact modifié',
      message: `"${ctx.entityName}" est passé de ${ctx.oldValue} à ${ctx.newValue}`,
      link: `/dashboard/crm/contacts/${ctx.entityId}`,
    },

    // === QUOTES ===
    QUOTE_CREATED: {
      type: 'QUOTE',
      title: 'Nouveau devis',
      message: `${ctx.actorName || 'Un utilisateur'} a créé le devis "${ctx.entityName}"`,
      link: `/dashboard/sales/quotes/${ctx.entityId}`,
    },
    QUOTE_SENT: {
      type: 'QUOTE',
      title: 'Devis envoyé',
      message: `Le devis "${ctx.entityName}" a été envoyé au client`,
      link: `/dashboard/sales/quotes/${ctx.entityId}`,
    },
    QUOTE_ACCEPTED: {
      type: 'QUOTE',
      title: 'Devis accepté !',
      message: `Le devis "${ctx.entityName}" a été accepté par le client`,
      link: `/dashboard/sales/quotes/${ctx.entityId}`,
    },
    QUOTE_REFUSED: {
      type: 'QUOTE',
      title: 'Devis refusé',
      message: `Le devis "${ctx.entityName}" a été refusé par le client`,
      link: `/dashboard/sales/quotes/${ctx.entityId}`,
    },

    // === INVOICES ===
    INVOICE_CREATED: {
      type: 'INVOICE',
      title: 'Nouvelle facture',
      message: `${ctx.actorName || 'Un utilisateur'} a créé la facture "${ctx.entityName}"`,
      link: `/dashboard/sales/invoices/${ctx.entityId}`,
    },
    INVOICE_SENT: {
      type: 'INVOICE',
      title: 'Facture envoyée',
      message: `La facture "${ctx.entityName}" a été envoyée au client`,
      link: `/dashboard/sales/invoices/${ctx.entityId}`,
    },
    INVOICE_PAID: {
      type: 'INVOICE',
      title: 'Facture payée !',
      message: `La facture "${ctx.entityName}" a été réglée`,
      link: `/dashboard/sales/invoices/${ctx.entityId}`,
    },

    // === ACTIVITIES ===
    ACTIVITY_CREATED: {
      type: 'ACTIVITY',
      title: 'Nouvelle activité',
      message: `${ctx.actorName || 'Un utilisateur'} a planifié "${ctx.entityName}"`,
      link: `/dashboard/activities`,
    },
    ACTIVITY_COMPLETED: {
      type: 'ACTIVITY',
      title: 'Activité terminée',
      message: `"${ctx.entityName}" a été complétée`,
      link: `/dashboard/activities`,
    },

    // === REMINDERS ===
    REMINDER_CREATED: {
      type: 'ACTIVITY',
      title: 'Nouveau rappel',
      message: `Rappel créé: "${ctx.entityName}"`,
      link: ctx.metadata?.dealId
        ? `/dashboard/crm/deals?dealId=${ctx.metadata.dealId}`
        : '/dashboard',
    },

    // === MESSAGES ===
    MESSAGE_RECEIVED: {
      type: 'MENTION',
      title: 'Nouveau message',
      message: `${ctx.actorName || 'Un utilisateur'} vous a envoyé un message`,
      link: `/dashboard/messages?conversation=${ctx.entityId}`,
    },

    // === META LEADS ===
    META_LEADS_IMPORTED: {
      type: 'SYSTEM',
      title: 'Leads importés',
      message: `${ctx.metadata?.count || 0} nouveaux leads Meta ont été importés`,
      link: '/dashboard/meta-leads',
    },
  };

  return configs[event] || null;
}
