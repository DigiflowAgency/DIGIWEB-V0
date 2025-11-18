# 🚀 TODO Liste - Production DigiWeb ERP

**Objectif :** Passer du mode démo à une application production complète et fonctionnelle

**Dernière mise à jour :** 2025-11-18

---

## 📊 Vue d'ensemble

- **Total des tâches :** 127
- **✅ Tâches complétées :** ~65 (51%)
- **Durée restante estimée :** 40-50 heures
- **Phases :** 12
- **Priorité :** High → Medium → Low

---

## 🎉 PHASE 0 : Élimination Boutons Factices ✅ TERMINÉ

**Date de complétion :** 18 Novembre 2025
**Durée réelle :** 6 heures

### Objectif Accompli
Éliminer 100% des boutons factices dans l'application en implémentant de vraies fonctionnalités.

### Pages Implémentées
- [x] **Settings** - États réels + API calls complets
  - États pour profil, entreprise, mot de passe
  - Handlers avec fetch API
  - Tous les inputs connectés onChange

- [x] **CRM/Contacts** - CRUD Complet
  - Modal édition avec formulaire
  - Fonction handleEdit + handleEditSubmit
  - Fonction handleDelete avec confirmation
  - Pagination fonctionnelle
  - 9 boutons connectés

- [x] **Sales/Quotes** - Toutes Actions
  - Modal détails (handleView)
  - Modal édition (handleEdit)
  - Duplication (handleDuplicate)
  - Téléchargement PDF (handleDownload)
  - Envoi email (handleSend)
  - 7 boutons + 3 modals

- [x] **Sales/Invoices** - Gestion Complète
  - Modal détails facture
  - Téléchargement PDF
  - Envoi facture
  - Marquer comme payée
  - 3 boutons + 1 modal

- [x] **CRM/Companies** - Edit & Delete
  - Modal édition entreprise
  - handleEdit + handleEditSubmit
  - handleDelete avec confirmation
  - 5 boutons connectés

- [x] **CRM/Deals** - Pipeline Complet
  - handleView pour détails
  - handleEdit + handleEditSubmit
  - handleDelete avec confirmation
  - handleMoveStage pour Kanban
  - Vues Kanban et Liste
  - 4 boutons connectés

- [x] **CRM/Activities** - Gestion Activités
  - handleViewActivity
  - handleMarkComplete
  - 2 boutons connectés

- [x] **Pages Marketing** - Modals Fonctionnels
  - Marketing/Campaigns - Création/Édition
  - Marketing/Email - Modal création
  - Marketing/Social - Modal post

- [x] **Pages Automation** - Toggle Status
  - Automation/Workflows - updateWorkflowStatus
  - Automation/Sequences - updateSequenceStatus

- [x] **Pages Service & Admin**
  - Service/Knowledge - Modal article
  - Admin - 5 modals (user, role, permissions, logs, backup)
  - Reports/Dashboards - Modal dashboard

### Pattern Technique Établi
```typescript
// États pour modals
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<any>(null);
const [formData, setFormData] = useState({...});

// Hooks mutations
const { createItem, updateItem, deleteItem, loading, error } = useItemMutations();

// Handlers
const handleEdit = (item) => {...};
const handleEditSubmit = async (e) => {...};
const handleDelete = async (item) => {...};

// Boutons connectés
<button onClick={() => handleEdit(item)}>Modifier</button>
```

### Statistiques
- **Fichiers modifiés :** 33
- **Lignes ajoutées :** +3,080
- **Lignes supprimées :** -290
- **Net :** +2,790 lignes
- **Boutons factices éliminés :** 100%

---

## 🎯 PHASE 1 : Infrastructure & Base Technique (12-15h)

### 1.1 Base de données ✅ TERMINÉ
- [x] Finaliser le schema Prisma complet
  - [x] Table `users` avec rôles (Admin, Vente, Marketing, AccountMgmt)
  - [x] Table `contacts` avec SIRET, gérant, scoring
  - [x] Table `companies` avec données complètes
  - [x] Table `deals` avec 6 étapes (+ Perdus)
  - [x] Table `activities` avec types et statuts
  - [x] Table `quotes` avec statuts et signature
  - [x] Table `invoices` avec paiements
  - [x] Table `tickets` avec type (interne/client)
  - [x] Table `formations` avec vidéos et progression
  - [x] Table `reviews` (avis clients multi-plateformes)
  - [x] Table `integrations` (APIs connectées)
  - [x] Table `analytics_reports` (rapports hebdo)
  - [x] Relations entre toutes les tables (30 tables au total)
- [x] Configuration de la base de données
  - [x] Créer la BDD MySQL en production
  - [x] Variables d'environnement (.env)
  - [x] Tester la connexion Prisma
- [x] Migrations initiales
  - [x] `npx prisma db push` (production)
  - [x] Données de test disponibles
  - [x] Intégrité vérifiée

**✅ Durée réelle :** 3 heures

---

### 1.2 Authentification & Autorisation ✅ TERMINÉ
- [x] Installer et configurer NextAuth.js
  - [x] `npm install next-auth @auth/prisma-adapter bcryptjs`
  - [x] Créer `/app/api/auth/[...nextauth]/route.ts`
  - [x] Configuration Credentials Provider
  - [x] Configuration Prisma Adapter
- [x] Système de rôles
  - [x] Enum des rôles (Admin, Vente, Marketing, AccountMgmt)
  - [x] Vérification dans authorize()
  - [x] Callbacks JWT et session
- [x] Système de permissions
  - [x] Configuration auth dans `/lib/auth.ts`
  - [x] Helper `getServerSession()` et `getCurrentUser()`
  - [x] Vérification statut utilisateur (ACTIVE/INACTIVE/SUSPENDED)
- [x] Pages d'authentification
  - [x] Page de login avec formulaire (`/login`)
  - [x] Validation email/password
  - [x] Gestion des erreurs
  - [ ] Page d'inscription (non prioritaire)
  - [ ] Page mot de passe oublié (non prioritaire)
- [x] Session management
  - [x] Configuration JWT strategy
  - [x] Durée de session (30 jours)
  - [x] Cookies sécurisés

**✅ Durée réelle :** 4 heures

---

### 1.3 Configuration Environnement ✅ TERMINÉ
- [x] Variables d'environnement
  - [x] `DATABASE_URL` (production + tunnel SSH)
  - [x] `NEXTAUTH_URL` et `NEXTAUTH_SECRET`
  - [x] Fichiers `.env.production.example` et `.env.preprod.example`
  - [ ] `SMTP_*` (pour emails - non prioritaire)
  - [ ] Clés API (à configurer selon besoins)
- [x] Configuration Next.js
  - [x] `next.config.mjs` configuré
  - [ ] Headers de sécurité (à ajouter)
  - [ ] CORS (non nécessaire pour l'instant)
- [x] Configuration TypeScript
  - [x] Paths aliases configurés (`@/`)
  - [x] Types strictes activées
  - [x] Types générés par Prisma

**✅ Durée réelle :** 1 heure

---

### 1.4 API Routes Structure ✅ TERMINÉ
- [x] Créer la structure des API routes
  - [x] `/api/contacts/*` (GET, POST, PUT, DELETE)
  - [x] `/api/companies/*` (GET, POST, PUT, DELETE)
  - [x] `/api/deals/*` (GET, POST, PUT, DELETE)
  - [x] `/api/activities/*` (GET, POST, PUT, DELETE)
  - [x] `/api/quotes/*` (GET, POST, PUT, DELETE)
  - [x] `/api/invoices/*` (GET, POST, PUT, DELETE)
  - [x] `/api/tickets/*` (GET, POST, PUT, DELETE)
  - [x] `/api/campaigns/*` (GET, POST, PUT, DELETE)
  - [x] `/api/users/*` (GET)
  - [ ] `/api/formations/*` (à faire)
  - [ ] `/api/analytics/*` (à faire)
  - [ ] `/api/integrations/*` (à faire)
- [x] Helpers API
  - [x] Error handling standardisé
  - [x] Validation Zod dans chaque route
  - [x] Prisma client configuré (`/lib/prisma.ts`)
  - [ ] Rate limiting (non prioritaire)

**✅ Durée réelle :** 2 heures

---

## 🎨 PHASE 2 : Système de Rôles & Navigation (6-8h)

### 2.1 Navigation Dynamique par Rôle
- [ ] Modifier `/app/dashboard/layout.tsx`
  - [ ] Récupérer le rôle de l'utilisateur connecté
  - [ ] Filtrer `navigationCategories` selon le rôle
  - [ ] Cacher les modules non autorisés
- [ ] Créer les dashboards par rôle
  - [ ] `/app/dashboard/page.tsx` → Dashboard Admin
  - [ ] `/app/dashboard/vente/page.tsx` → Dashboard Vente
  - [ ] `/app/dashboard/marketing/page.tsx` → Dashboard Marketing
  - [ ] `/app/dashboard/account-mgmt/page.tsx` → Dashboard AM
- [ ] Redirection automatique selon le rôle
  - [ ] Admin → Dashboard complet
  - [ ] Vente → Dashboard personnel
  - [ ] Marketing → Dashboard marketing
  - [ ] AM → Dashboard support

**Durée estimée :** 3-4 heures

---

### 2.2 Protection des Routes
- [ ] Créer middleware Next.js (`/middleware.ts`)
  - [ ] Vérifier l'authentification
  - [ ] Vérifier les permissions par route
  - [ ] Rediriger si non autorisé
- [ ] Protéger toutes les pages
  - [ ] Ajouter les vérifications de rôle
  - [ ] Pages 403 Forbidden personnalisées
  - [ ] Logs des tentatives d'accès non autorisées

**Durée estimée :** 2-3 heures

---

### 2.3 UI Conditionnelle
- [ ] Boutons/Actions selon permissions
  - [ ] Cacher "Supprimer" si pas admin
  - [ ] Cacher "Assigner à" si pas admin
  - [ ] Afficher "Mes contacts" vs "Tous les contacts"
- [ ] Filtres de données automatiques
  - [ ] Commercial voit uniquement ses données
  - [ ] Admin voit tout
  - [ ] Implémenter au niveau API

**Durée estimée :** 1 heure

---

## 👤 PHASE 3 : Espace Personnel Commercial (8-10h)

### 3.1 Dashboard Personnel
- [ ] Créer `/app/dashboard/mon-espace/page.tsx`
  - [ ] KPIs personnels (CA, deals, objectifs)
  - [ ] Graphique CA mensuel
  - [ ] Mes prochaines activités (5)
  - [ ] Mes deals en cours (kanban mini)
  - [ ] Classement dans l'équipe
- [ ] API routes
  - [ ] `GET /api/users/me/stats`
  - [ ] `GET /api/users/me/activities`
  - [ ] `GET /api/users/me/deals`

**Durée estimée :** 3-4 heures

---

### 3.2 Module Formations
- [ ] Créer `/app/dashboard/mon-espace/formations/page.tsx`
  - [ ] Liste des formations par catégorie
  - [ ] Filtres (Toutes, En cours, Complétées)
  - [ ] Barre de progression globale
  - [ ] Système de recherche
- [ ] Page détail formation `/app/dashboard/mon-espace/formations/[id]/page.tsx`
  - [ ] Player vidéo (Vimeo/YouTube embed)
  - [ ] Tracking de progression (% visionné)
  - [ ] Bouton "Marquer comme complétée"
  - [ ] Quiz de validation (optionnel)
  - [ ] Certificat de complétion (PDF)
- [ ] Gestion admin des formations
  - [ ] `/app/dashboard/admin/formations/page.tsx`
  - [ ] CRUD formations (Créer, Modifier, Supprimer)
  - [ ] Upload vidéo (lien externe pour démo)
  - [ ] Assigner aux rôles spécifiques
  - [ ] Statistiques de complétion par équipe
- [ ] API routes
  - [ ] `GET /api/formations` (liste + filtres par rôle)
  - [ ] `GET /api/formations/[id]`
  - [ ] `POST /api/formations` (admin only)
  - [ ] `PUT /api/formations/[id]` (admin only)
  - [ ] `DELETE /api/formations/[id]` (admin only)
  - [ ] `POST /api/formations/[id]/progress` (update progression)
  - [ ] `GET /api/users/me/formations` (mes formations)

**Durée estimée :** 3-4 heures

---

### 3.3 Mes Statistiques
- [ ] Créer `/app/dashboard/mon-espace/statistiques/page.tsx`
  - [ ] KPIs personnels détaillés
    - [ ] CA généré (mois, trimestre, année)
    - [ ] Nombre de deals gagnés/perdus
    - [ ] Taux de conversion
    - [ ] Valeur moyenne des deals
    - [ ] Pipeline actuel
  - [ ] Graphiques
    - [ ] Évolution CA (12 mois)
    - [ ] Deals par statut (donut)
    - [ ] Activités complétées vs planifiées
  - [ ] Comparaisons
    - [ ] Moi vs moyenne équipe
    - [ ] Moi vs mois dernier
    - [ ] Objectifs atteints (%)
  - [ ] Classement dans l'équipe (podium)
- [ ] API routes
  - [ ] `GET /api/users/me/statistics`
  - [ ] `GET /api/users/me/performance`
  - [ ] `GET /api/users/me/ranking`

**Durée estimée :** 2-3 heures

---

### 3.4 Mes Clients Actifs
- [ ] Créer `/app/dashboard/mon-espace/clients/page.tsx`
  - [ ] Tableau des clients signés par le commercial
  - [ ] Colonnes : Nom, Entreprise, Date signature, Valeur contrat, Renouvellement, Health Score
  - [ ] Filtres : Statut (Actif, Inactif, Churné), Valeur, Date
  - [ ] Recherche
  - [ ] Actions : Voir détail, Créer activité, Upsell
- [ ] Page détail client `/app/dashboard/mon-espace/clients/[id]/page.tsx`
  - [ ] Informations complètes
  - [ ] Historique des interactions
  - [ ] Contrats actifs
  - [ ] Opportunités d'upsell/cross-sell
  - [ ] Notes privées du commercial
  - [ ] Health score détaillé
- [ ] API routes
  - [ ] `GET /api/users/me/clients`
  - [ ] `GET /api/clients/[id]`
  - [ ] `POST /api/clients/[id]/notes`

**Durée estimée :** 2-3 heures (seulement la partie "mes clients")

---

## 📇 PHASE 4 : Modules CRM & Ventes (15-18h)

### 4.1 CRM → Contacts
- [ ] Améliorer la page `/app/dashboard/crm/contacts/page.tsx`
  - [ ] Ajouter vue KANBAN (par statut : Lead, Prospect, Client)
  - [ ] Toggle vue Kanban/Liste
  - [ ] Ajouter colonnes SIRET et GÉRANT
  - [ ] Filtres avancés (par commercial, par statut, par score)
  - [ ] Tri par colonne
  - [ ] Pagination (50 par page)
  - [ ] Sélection multiple pour actions groupées
- [ ] Modal Détail Contact (drawer)
  - [ ] Toutes les infos du contact
  - [ ] Entreprise liée (lien cliquable)
  - [ ] Deals liés
  - [ ] Activités récentes
  - [ ] Notes et historique
  - [ ] Fichiers attachés
- [ ] Modal Créer/Éditer Contact
  - [ ] Formulaire complet
  - [ ] Validation Zod
  - [ ] Assignation au commercial
  - [ ] Recherche entreprise (API PAPPERS)
  - [ ] Auto-completion adresse
- [ ] Import CSV
  - [ ] Page `/app/dashboard/crm/contacts/import/page.tsx`
  - [ ] Upload fichier
  - [ ] Mapping colonnes
  - [ ] Preview
  - [ ] Import async avec progress bar
  - [ ] Rapport d'import (succès/erreurs)
- [ ] API Routes
  - [ ] `GET /api/contacts` (pagination, filtres)
  - [ ] `GET /api/contacts/[id]`
  - [ ] `POST /api/contacts`
  - [ ] `PUT /api/contacts/[id]`
  - [ ] `DELETE /api/contacts/[id]`
  - [ ] `POST /api/contacts/import` (CSV)
  - [ ] `GET /api/contacts/export` (CSV/Excel)

**Durée estimée :** 4-5 heures

---

### 4.2 CRM → Entreprises
- [ ] Améliorer la page `/app/dashboard/crm/companies/page.tsx`
  - [ ] Vue carte (actuelle)
  - [ ] Vue carte de France interactive
    - [ ] Utiliser une lib de carte (Leaflet, Mapbox)
    - [ ] Markers par entreprise (géolocalisation via adresse)
    - [ ] Popup avec infos entreprise
    - [ ] Filtres géographiques (région, département)
    - [ ] Clustering pour performance
  - [ ] Toggle entre vue grille et carte
  - [ ] Filtres : statut, industrie, taille, localisation
- [ ] Modal Détail Entreprise
  - [ ] Infos complètes (SIRET, CA, effectifs, etc.)
  - [ ] Contacts liés (liste)
  - [ ] Deals en cours
  - [ ] Documents (Kbis, etc.)
  - [ ] Notes
- [ ] API Routes
  - [ ] `GET /api/companies` (avec géolocalisation)
  - [ ] `GET /api/companies/[id]`
  - [ ] `POST /api/companies`
  - [ ] `PUT /api/companies/[id]`
  - [ ] `DELETE /api/companies/[id]`

**Durée estimée :** 4-5 heures

---

### 4.3 CRM → Deals
- [ ] Améliorer la page `/app/dashboard/crm/deals/page.tsx`
  - [ ] Ajouter colonne "Perdus" dans le kanban
  - [ ] Drag & drop entre colonnes
  - [ ] Modifier "Probabilité" en "Scoring manuel" (0-100)
  - [ ] Vue liste avec tous les deals
  - [ ] Filtres : commercial, montant, probabilité, date
- [ ] Modal Détail Deal
  - [ ] Toutes les infos du deal
  - [ ] Contact et entreprise liés
  - [ ] Activités liées
  - [ ] Historique des changements
  - [ ] Produits/Services du deal
  - [ ] Notes et fichiers
- [ ] Modal Créer/Éditer Deal
  - [ ] Formulaire complet
  - [ ] Sélection contact/entreprise
  - [ ] Produits/Services avec montants
  - [ ] Scoring manuel (slider 0-100)
  - [ ] Date de closing estimée
  - [ ] Assignation commercial
- [ ] API Routes
  - [ ] `GET /api/deals`
  - [ ] `GET /api/deals/[id]`
  - [ ] `POST /api/deals`
  - [ ] `PUT /api/deals/[id]`
  - [ ] `PUT /api/deals/[id]/stage` (changer l'étape)
  - [ ] `DELETE /api/deals/[id]`

**Durée estimée :** 3-4 heures

---

### 4.4 CRM → Activités
- [ ] Améliorer la page `/app/dashboard/crm/activities/page.tsx`
  - [ ] Calendrier mensuel (en plus de la timeline)
  - [ ] Filtres : type, statut, commercial, date
  - [ ] Vue jour/semaine/mois
- [ ] Modal Créer/Éditer Activité
  - [ ] Type : Appel, Email, Réunion, Visio
  - [ ] Date et heure
  - [ ] Durée
  - [ ] Contact/Entreprise lié
  - [ ] Deal lié (optionnel)
  - [ ] Priorité et statut
  - [ ] Notes
  - [ ] Rappel (notification)
- [ ] Notifications d'activités
  - [ ] Rappels 15min avant
  - [ ] Liste des activités du jour au login
- [ ] API Routes
  - [ ] `GET /api/activities`
  - [ ] `GET /api/activities/[id]`
  - [ ] `POST /api/activities`
  - [ ] `PUT /api/activities/[id]`
  - [ ] `DELETE /api/activities/[id]`
  - [ ] `GET /api/activities/calendar` (format calendrier)

**Durée estimée :** 2-3 heures

---

### 4.5 Ventes → Devis
- [ ] Améliorer la page `/app/dashboard/sales/quotes/page.tsx`
  - [ ] Liste des devis avec actions
  - [ ] Statuts : Brouillon, Envoyé, Accepté, Refusé
  - [ ] Bouton "Convertir en client" (si accepté)
  - [ ] Bouton "Envoyer par email"
  - [ ] Télécharger PDF
- [ ] Modal Créer/Éditer Devis
  - [ ] Sélection client
  - [ ] Produits/Services avec quantités et prix
  - [ ] Calcul automatique HT/TTC
  - [ ] Conditions de paiement
  - [ ] Validité du devis (jours)
  - [ ] Notes et CGV
- [ ] Génération PDF
  - [ ] Template PDF professionnel
  - [ ] Logo entreprise
  - [ ] Toutes les infos du devis
  - [ ] Footer avec mentions légales
- [ ] Envoi par email
  - [ ] Template email
  - [ ] PDF en pièce jointe
  - [ ] Tracking d'ouverture (optionnel)
- [ ] Conversion en client
  - [ ] Créer le client dans la BDD
  - [ ] Lier au commercial
  - [ ] Générer la facture automatiquement
  - [ ] Notification au commercial
- [ ] API Routes
  - [ ] `GET /api/quotes`
  - [ ] `GET /api/quotes/[id]`
  - [ ] `POST /api/quotes`
  - [ ] `PUT /api/quotes/[id]`
  - [ ] `DELETE /api/quotes/[id]`
  - [ ] `POST /api/quotes/[id]/send` (email)
  - [ ] `GET /api/quotes/[id]/pdf`
  - [ ] `POST /api/quotes/[id]/convert-to-client`

**Durée estimée :** 3-4 heures

---

### 4.6 Ventes → Facturation
- [ ] API Routes complètes
  - [ ] `GET /api/invoices`
  - [ ] `POST /api/invoices`
  - [ ] `PUT /api/invoices/[id]`
  - [ ] `GET /api/invoices/[id]/pdf`
  - [ ] `POST /api/invoices/[id]/send`
  - [ ] `POST /api/invoices/[id]/payment` (marquer comme payée)
- [ ] Relances automatiques
  - [ ] Cron job pour détecter factures en retard
  - [ ] Envoi email automatique J+7, J+15, J+30
  - [ ] Notifications admin

**Durée estimée :** 2-3 heures

---

## 📢 PHASE 5 : Module Marketing (8-10h)

### 5.1 Marketing → Campagnes
- [ ] Rendre fonctionnel avec données réelles
- [ ] API Routes
  - [ ] `GET /api/campaigns`
  - [ ] `POST /api/campaigns`
  - [ ] `PUT /api/campaigns/[id]`
  - [ ] `DELETE /api/campaigns/[id]`
- [ ] Tracking des conversions
  - [ ] Lien avec Google Analytics
  - [ ] Attribution des deals aux campagnes

**Durée estimée :** 2-3 heures

---

### 5.2 Marketing → Analytics
- [ ] Connecter à digiflow-agency.fr et be-hype.com
  - [ ] Deux onglets (un par site)
  - [ ] Configuration Google Analytics pour chaque
  - [ ] Variables d'env pour les GA IDs
- [ ] Afficher les métriques
  - [ ] Visiteurs, pages vues, taux de rebond
  - [ ] Sources de trafic
  - [ ] Top pages
  - [ ] Graphiques de tendance
- [ ] API Routes
  - [ ] `GET /api/analytics/digiflow`
  - [ ] `GET /api/analytics/behype`

**Durée estimée :** 3-4 heures

---

### 5.3 Marketing → Réseaux Sociaux
- [ ] Planification de posts
  - [ ] Calendrier visuel
  - [ ] Formulaire de création de post
  - [ ] Sélection multi-plateformes
  - [ ] Prévisualisation
  - [ ] Programmation date/heure
- [ ] Stockage en BDD
  - [ ] Table `social_posts` avec statut (draft, scheduled, published)
- [ ] API Routes
  - [ ] `GET /api/social/posts`
  - [ ] `POST /api/social/posts`
  - [ ] `PUT /api/social/posts/[id]`
  - [ ] `DELETE /api/social/posts/[id]`

**Durée estimée :** 3-4 heures

---

## 🎟️ PHASE 6 : Module Service / Account Management (6-8h)

### 6.1 Service → Tickets
- [ ] Clarifier le type de tickets (décision requise)
  - [ ] Option A : Tickets clients (support externe)
  - [ ] Option B : Tickets internes (collaborateurs)
  - [ ] Option C : Les deux (type = "client" ou "internal")
- [ ] Implémenter selon la décision
  - [ ] Formulaire de création adapté
  - [ ] Assignation automatique selon le type
  - [ ] SLA différent selon le type
- [ ] API Routes
  - [ ] `GET /api/tickets`
  - [ ] `POST /api/tickets`
  - [ ] `PUT /api/tickets/[id]`
  - [ ] `POST /api/tickets/[id]/reply`
  - [ ] `PUT /api/tickets/[id]/close`

**Durée estimée :** 3-4 heures

---

### 6.2 Service → Base de Connaissances → Formations
- [ ] Déplacer dans Admin → Formations
  - [ ] Déjà fait dans Phase 3.2
  - [ ] Retirer de la navigation "Service"
  - [ ] Ajouter dans navigation "Admin" (onglet Paramètres)

**Durée estimée :** 30 minutes

---

### 6.3 Service → Satisfaction
- [ ] Connecter aux plateformes d'avis
  - [ ] Google My Business API
  - [ ] Pages Jaunes API (si disponible)
  - [ ] Tripadvisor API
  - [ ] Trustpilot API
- [ ] Agrégation des avis
  - [ ] Table `reviews` avec source (Google, Trustpilot, etc.)
  - [ ] Entreprise (DIGIFLOW AGENCY ou BE HYPE)
  - [ ] Note, commentaire, date, auteur
  - [ ] Import régulier (cron job)
- [ ] Dashboard satisfaction
  - [ ] Deux onglets (DIGIFLOW / BE HYPE)
  - [ ] Score moyen par plateforme
  - [ ] Évolution dans le temps
  - [ ] Derniers avis
  - [ ] Réponses aux avis
- [ ] API Routes
  - [ ] `GET /api/reviews/digiflow`
  - [ ] `GET /api/reviews/behype`
  - [ ] `POST /api/reviews/import` (cron job)

**Durée estimée :** 3-4 heures

---

## ⚙️ PHASE 7 : Fonctionnalités Admin (10-12h)

### 7.1 Gestion des APIs / Intégrations
- [ ] Créer `/app/dashboard/settings/integrations/page.tsx`
  - [ ] Liste de toutes les APIs disponibles
  - [ ] Statut : Connectée / Non connectée
  - [ ] Boutons Connecter/Déconnecter/Configurer
  - [ ] Dernière synchronisation
  - [ ] Logs d'erreurs
- [ ] APIs à intégrer :
  - [ ] **PAPPERS** (données entreprises)
    - [ ] Configuration API Key
    - [ ] Test de connexion
    - [ ] Recherche entreprise par SIRET
    - [ ] Auto-completion dans formulaires
  - [ ] **COFACE** (scoring solvabilité)
    - [ ] Configuration API Key
    - [ ] Vérification solvabilité entreprise
    - [ ] Affichage score dans fiche entreprise
  - [ ] **AIRCALL** (téléphonie)
    - [ ] Configuration OAuth
    - [ ] Sync automatique des appels
    - [ ] Création activité auto après appel
  - [ ] **YOUSIGN** (signature électronique)
    - [ ] Configuration API Key
    - [ ] Envoi devis pour signature
    - [ ] Webhook de retour (signé/refusé)
  - [ ] **Google Analytics** (déjà prévu)
  - [ ] **Haloscan** (déjà prévu)
  - [ ] **META Ads** (Facebook/Instagram)
    - [ ] OAuth configuration
    - [ ] Récupération métriques campagnes
  - [ ] **Google Ads**
    - [ ] OAuth configuration
    - [ ] Récupération métriques campagnes
  - [ ] **Platformes d'avis**
    - [ ] Google My Business
    - [ ] Trustpilot
    - [ ] Tripadvisor
- [ ] Page de configuration par API
  - [ ] Formulaire de config (API Key, OAuth, etc.)
  - [ ] Test de connexion
  - [ ] Mapping des champs si nécessaire
  - [ ] Fréquence de synchronisation
- [ ] Webhooks
  - [ ] Configuration des webhooks entrants
  - [ ] Endpoints pour chaque API
  - [ ] Logs des webhooks reçus
- [ ] API Routes
  - [ ] `GET /api/integrations`
  - [ ] `POST /api/integrations/[name]/connect`
  - [ ] `DELETE /api/integrations/[name]/disconnect`
  - [ ] `GET /api/integrations/[name]/config`
  - [ ] `PUT /api/integrations/[name]/config`
  - [ ] `POST /api/integrations/[name]/test`
  - [ ] `GET /api/integrations/[name]/logs`

**Durée estimée :** 5-6 heures

---

### 7.2 Gestion de l'Équipe
- [ ] Améliorer `/app/dashboard/settings/team/page.tsx`
  - [ ] Liste complète des membres
  - [ ] Filtres par rôle et statut
  - [ ] Recherche
- [ ] Modal Ajouter un membre
  - [ ] Formulaire complet
  - [ ] Email d'invitation automatique
  - [ ] Génération mot de passe temporaire
- [ ] Modal Éditer un membre
  - [ ] Modifier infos
  - [ ] Changer rôle
  - [ ] Activer/Désactiver
  - [ ] Définir objectifs (si commercial)
- [ ] Modal Supprimer un membre
  - [ ] Confirmation
  - [ ] Réassignation de ses contacts/deals
  - [ ] Interface de sélection du nouveau propriétaire
  - [ ] Archive ou suppression définitive
- [ ] API Routes
  - [ ] `GET /api/users` (admin only)
  - [ ] `POST /api/users` (admin only)
  - [ ] `PUT /api/users/[id]` (admin only)
  - [ ] `DELETE /api/users/[id]` (admin only)
  - [ ] `POST /api/users/[id]/reassign` (réassigner données)

**Durée estimée :** 3-4 heures

---

### 7.3 Module Suivi Client Analytics
- [ ] Créer `/app/dashboard/suivi-client-analytics/page.tsx`
  - [ ] Vue d'ensemble avec KPIs
  - [ ] Graphiques temps réel
  - [ ] Alertes et anomalies
- [ ] Configuration Google Analytics
  - [ ] Connexion OAuth
  - [ ] Sélection des propriétés
  - [ ] Configuration événements
- [ ] Configuration Haloscan
  - [ ] API Key setup
  - [ ] Sélection domaines
  - [ ] Configuration heatmaps
- [ ] Rapport hebdomadaire
  - [ ] Génération automatique (cron tous les lundis 8h)
  - [ ] Email aux admins
  - [ ] Dashboard avec highlights
  - [ ] Comparaison semaine précédente
- [ ] Vue en temps réel
  - [ ] Visiteurs actifs
  - [ ] Pages vues live
  - [ ] Événements en cours
  - [ ] Carte géographique
  - [ ] Auto-refresh 30s
- [ ] Analytics avancées
  - [ ] Heatmaps (Haloscan)
  - [ ] Session recordings
  - [ ] Funnels de conversion
  - [ ] Comportement utilisateur
- [ ] Exports
  - [ ] PDF, Excel, Google Sheets
  - [ ] Rapports personnalisés
  - [ ] Planification d'envoi
- [ ] API Routes
  - [ ] `GET /api/analytics/overview`
  - [ ] `GET /api/analytics/realtime`
  - [ ] `GET /api/analytics/reports/weekly`
  - [ ] `POST /api/analytics/reports/generate`
  - [ ] `GET /api/analytics/export`

**Durée estimée :** 6-7 heures (déjà prévu en Phase 4 du doc initial)

---

## 🤖 PHASE 8 : Automatisation (Optionnel - Phase Future)

**Note :** Module grisé pour le moment, non prioritaire.

- [ ] Créer la page avec message "Bientôt disponible"
- [ ] Sous-page APIs uniquement
  - [ ] Liste des APIs connectées (lecture seule)
  - [ ] Statut de chaque API
  - [ ] Dernière synchronisation
  - [ ] Pas de configuration (rediriger vers Settings → Intégrations)

**Durée estimée :** 1 heure

---

## 🎨 PHASE 9 : Améliorations UI/UX (8-10h)

### 9.1 Composants Réutilisables
- [ ] Créer `/components/ui/*` avec tous les composants
  - [ ] Button variants (primary, secondary, danger, etc.)
  - [ ] Modal/Dialog
  - [ ] Drawer (side panel)
  - [ ] Dropdown
  - [ ] Table avec tri et pagination
  - [ ] Form inputs (Text, Select, Date, etc.)
  - [ ] Toast notifications
  - [ ] Loading spinners/skeletons
  - [ ] Empty states
  - [ ] Error states
  - [ ] Badge/Tag
  - [ ] Avatar
  - [ ] Card
  - [ ] Tabs

**Durée estimée :** 3-4 heures

---

### 9.2 Notifications & Feedback
- [ ] Système de toasts
  - [ ] Installer `react-hot-toast` ou `sonner`
  - [ ] Wrapper global
  - [ ] Toasts pour succès/erreur/info
  - [ ] Position configurable
- [ ] Confirmations
  - [ ] Modal de confirmation pour suppressions
  - [ ] Modal de confirmation pour actions critiques
- [ ] Loading states
  - [ ] Skeletons pour les listes
  - [ ] Spinners pour les boutons
  - [ ] Progress bars pour uploads

**Durée estimée :** 2 heures

---

### 9.3 Responsive Mobile
- [ ] Tester toutes les pages sur mobile
- [ ] Ajuster la sidebar mobile (déjà fait)
- [ ] Tables responsive (scroll horizontal ou cartes)
- [ ] Formulaires adaptés mobile
- [ ] Navigation bottom bar (optionnel)

**Durée estimée :** 2-3 heures

---

### 9.4 Animations & Transitions
- [ ] Transitions de page fluides
- [ ] Animations des modals (slide-in)
- [ ] Hover effects cohérents
- [ ] Loading animations
- [ ] Micro-interactions

**Durée estimée :** 1-2 heures

---

## 🔧 PHASE 10 : Tests & Optimisations (8-10h)

### 10.1 Tests
- [ ] Tests E2E (Playwright)
  - [ ] Login/Logout
  - [ ] Création contact
  - [ ] Création deal
  - [ ] Envoi devis
- [ ] Tests API (Jest)
  - [ ] Authentification
  - [ ] CRUD contacts
  - [ ] CRUD deals
  - [ ] Permissions
- [ ] Tests unitaires des helpers

**Durée estimée :** 4-5 heures

---

### 10.2 Performance
- [ ] Optimisation des images (next/image)
- [ ] Lazy loading des composants lourds
- [ ] Code splitting par route
- [ ] Caching des API calls
- [ ] Pagination sur toutes les listes
- [ ] Indexes BDD sur colonnes fréquentes
- [ ] Lighthouse audit et corrections

**Durée estimée :** 2-3 heures

---

### 10.3 Sécurité
- [ ] Audit de sécurité
  - [ ] Validation des inputs partout
  - [ ] Protection CSRF
  - [ ] Rate limiting sur APIs
  - [ ] Sanitization des données
  - [ ] Headers de sécurité (CSP, etc.)
- [ ] Protection contre injections SQL (Prisma protège déjà)
- [ ] XSS protection
- [ ] Tests de pénétration basiques

**Durée estimée :** 2-3 heures

---

## 🚀 PHASE 11 : Déploiement Production - Setup Base de Données

**Note** : Les autres étapes (code, PM2, Nginx, SSL) sont déjà maîtrisées ✅

### 11.1 Créer Base de Données MySQL sur le Serveur
- [ ] **Se connecter au serveur**
  ```bash
  ssh user@votre-serveur.com
  ```

- [ ] **Créer la BDD vide + user**
  ```bash
  sudo mysql -u root -p

  CREATE DATABASE digiweb_erp_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'digiweb_prod'@'localhost' IDENTIFIED BY 'MotDePasseSecurise123!';
  GRANT ALL PRIVILEGES ON digiweb_erp_prod.* TO 'digiweb_prod'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
  ```

- [ ] **Tester la connexion**
  ```bash
  mysql -u digiweb_prod -p digiweb_erp_prod
  SHOW TABLES;  # Devrait être vide pour l'instant
  EXIT;
  ```

---

### 11.2 Créer Toutes les Tables avec Prisma (30 tables automatiquement!)
- [ ] **Dans le dossier du projet sur le serveur**
  ```bash
  cd /var/www/digiweb-erp  # ou ton chemin
  ```

- [ ] **Configurer DATABASE_URL dans .env**
  ```bash
  nano .env
  # Ajouter/modifier :
  DATABASE_URL="mysql://digiweb_prod:MotDePasseSecurise123!@localhost:3306/digiweb_erp_prod"
  ```

- [ ] **Push le schéma Prisma → Crée les 30 tables automatiquement !**
  ```bash
  npx prisma db push
  ```

- [ ] **Vérifier que toutes les tables sont créées**
  ```bash
  mysql -u digiweb_prod -p digiweb_erp_prod
  SHOW TABLES;  # Tu verras : users, contacts, companies, deals, activities, etc. (30 tables!)
  EXIT;
  ```

- [ ] **Créer user admin initial** (optionnel)
  ```bash
  npx prisma db seed
  # OU créer manuellement le premier user dans Prisma Studio / MySQL
  ```

**Durée totale : 15-20 minutes max** ⚡

---

## 📚 PHASE 12 : Documentation & Formation (4-6h)

### 12.1 Documentation Utilisateur
- [ ] Guide d'utilisation par rôle
  - [ ] Guide Admin
  - [ ] Guide Commercial
  - [ ] Guide Marketing
  - [ ] Guide Account Manager
- [ ] Vidéos tutoriels
  - [ ] Comment créer un contact
  - [ ] Comment créer un deal
  - [ ] Comment envoyer un devis
  - [ ] etc.
- [ ] FAQ

**Durée estimée :** 2-3 heures

---

### 12.2 Documentation Technique
- [ ] README complet
  - [ ] Installation locale
  - [ ] Variables d'environnement
  - [ ] Commandes utiles
  - [ ] Architecture du projet
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Schema BDD documenté
- [ ] Guide de contribution

**Durée estimée :** 2-3 heures

---

## 📋 Récapitulatif par Priorité

### ✅ TERMINÉ
0. ✅ **Phase 0 : Élimination Boutons Factices** (6h / 6h estimées) ⭐ NOUVEAU
   - 100% des boutons factices éliminés
   - Settings, CRM (Contacts, Companies, Deals, Activities)
   - Sales (Quotes, Invoices)
   - Marketing (Campaigns, Email, Social)
   - Automation (Workflows, Sequences)
   - Service & Admin (Knowledge, Admin modals, Dashboards)

1. ✅ Phase 1 : Infrastructure & Base (10h / 12-15h estimées)
   - Base de données (30 tables Prisma)
   - Authentification NextAuth.js
   - Configuration environnement
   - API Routes principales

### 🔴 URGENT (1-2 semaines)
2. Phase 2 : Rôles & Navigation (6-8h) - **En partie fait**
3. Phase 3 : Espace Personnel Commercial (8-10h)
4. Phase 4.1-4.4 : Modals CRM ✅ **100% TERMINÉ**

**Total URGENT restant :** 14-18 heures

---

### 🟠 HIGH (2-3 semaines)
4. Phase 4 : CRM & Ventes (15-18h)
5. Phase 5 : Marketing (8-10h)
6. Phase 6 : Service / AM (6-8h)

**Total HIGH :** 29-36 heures

---

### 🟡 MEDIUM (1-2 semaines)
7. Phase 7 : Fonctionnalités Admin (10-12h)
9. Phase 9 : UI/UX (8-10h)
10. Phase 10 : Tests & Optimisations (8-10h)

**Total MEDIUM :** 26-32 heures

---

### 🟢 LOW (1 semaine)
8. Phase 8 : Automatisation (1h - version minimale)
11. Phase 11 : Déploiement (6-8h)
12. Phase 12 : Documentation (4-6h)

**Total LOW :** 11-15 heures

---

## 📊 TOTAL GÉNÉRAL

**Durée totale estimée :** 92-116 heures

**Répartition :**
- Backend/API : 40-50h (43%)
- Frontend/UI : 35-45h (38%)
- Tests/Optimisations : 8-10h (9%)
- Déploiement/Infra : 6-8h (7%)
- Documentation : 4-6h (5%)

---

## 🎯 Planning Recommandé (2 mois)

### Semaine 1-2 : URGENT
- Jour 1-3 : Infrastructure & BDD (Phase 1)
- Jour 4-5 : Authentification & Rôles (Phase 1 & 2)
- Jour 6-10 : Espace Personnel Commercial (Phase 3)

### Semaine 3-5 : HIGH
- Jour 11-17 : CRM & Ventes complet (Phase 4)
- Jour 18-22 : Marketing (Phase 5)
- Jour 23-25 : Service / AM (Phase 6)

### Semaine 6-7 : MEDIUM
- Jour 26-30 : Admin features (Phase 7)
- Jour 31-35 : UI/UX polish (Phase 9)
- Jour 36-40 : Tests & Optimisations (Phase 10)

### Semaine 8 : LOW & FINALISATION
- Jour 41-43 : Déploiement (Phase 11)
- Jour 44-45 : Documentation (Phase 12)
- Jour 46-47 : Tests finaux et corrections
- Jour 48 : 🚀 LANCEMENT PRODUCTION

---

## ✅ Checklist Pré-Production

Avant de lancer en production, vérifier :

- [ ] Toutes les fonctionnalités critiques testées
- [ ] Aucun bug bloquant
- [ ] Performance optimale (< 3s de chargement)
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Sécurité auditée
- [ ] Backup BDD configuré
- [ ] Monitoring actif
- [ ] Documentation à jour
- [ ] Équipe formée
- [ ] Plan de rollback en cas de problème
- [ ] Support client prêt

---

**Prêt à démarrer ? Par quoi veux-tu commencer ? 🚀**

Je recommande de commencer par la **Phase 1 : Infrastructure**, c'est la fondation de tout le reste.
