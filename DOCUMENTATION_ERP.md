# Documentation DigiWeb ERP - Mode Démo

## 📋 Table des matières

1. [Architecture & Rôles](#architecture--rôles)
2. [Système de Permissions](#système-de-permissions)
3. [Modules par Équipe](#modules-par-équipe)
4. [Espace Personnel Commercial](#espace-personnel-commercial)
5. [Fonctionnalités Admin](#fonctionnalités-admin)
6. [Module Suivi Client Analytics](#module-suivi-client-analytics)
7. [Plan d'Implémentation](#plan-dimplémentation)

---

## 🏗️ Architecture & Rôles

### Rôles utilisateurs

| Rôle | Accès | Permissions |
|------|-------|-------------|
| **Admin** | Tous les modules | Toutes les permissions + gestion équipe + APIs |
| **Équipe Vente** | CRM, Ventes, Espace Personnel | Lecture/Écriture sur ses deals, lecture sur l'équipe |
| **Équipe Marketing** | Marketing | Campagnes, Analytics marketing |
| **Équipe Account Management** | Services | Tickets, Satisfaction, Base de connaissances |

---

## 🔐 Système de Permissions

### Matrice d'accès par module

| Module | Admin | Vente | Marketing | Account Mgmt |
|--------|-------|-------|-----------|--------------|
| **Dashboard** | ✅ Complet | ✅ Personnel | ✅ Marketing | ✅ Support |
| **CRM** | ✅ | ✅ | ❌ | ❌ |
| **Ventes** | ✅ | ✅ | ❌ | ❌ |
| **Marketing** | ✅ | ❌ | ✅ | ❌ |
| **Service** | ✅ | ❌ | ❌ | ✅ |
| **Automatisation** | ✅ | ❌ | ❌ | ❌ |
| **Rapports** | ✅ | ❌ | ❌ | ❌ |
| **Espace Personnel** | ✅ | ✅ | ✅ | ✅ |
| **Settings** | ✅ | ⚠️ Limité | ⚠️ Limité | ⚠️ Limité |

---

## 📦 Modules par Équipe

### 1. CRM & Ventes (Admin + Équipe Vente)

#### **CRM → Contacts**
**Fonctionnalités :**
- Liste complète des contacts avec recherche et filtres
- Statut : Lead, Prospect, Client
- Assignation aux commerciaux
- Historique des interactions
- Score de qualité
- Vue KANBAN & Liste
- Voir pour connecter différents APIs comme PAPPERS (POUR DATAS ENTREPRISES)& COFACE (POUR SCORING SOLVABILITÉ)

**Permissions :**
- **Admin** : Voir tous les contacts, assigner, modifier, supprimer
- **Vente** : Voir ses contacts assignés + contacts non assignés, créer, modifier ses contacts

**Données affichées :**
- Nom, email, téléphone, entreprise
- Localisation, score de qualité
- Commercial assigné
- Date de création
- SIRET
- GÉRANT

---

#### **CRM → Entreprises**
**Fonctionnalités :**
- Vue en grille de cartes
- Détails : industrie, effectif, chiffre d'affaires
- Nombre de contacts et deals liés
- Statut : Client, Prospect, Lead
- VOIR SI ON PEUT FAIRE UNE VUE "CARTE DE FRANCE" AVEC EMPLACEMENT DES CLIENTS

**Permissions :**
- **Admin** : Toutes les entreprises
- **Vente** : Entreprises avec contacts assignés

---

#### **CRM → Deals**
**Fonctionnalités :**
- Pipeline kanban avec 5 étapes :
  1. Découverte
  2. Qualification
  3. Proposition
  4. Négociation
  5. Gagné
  6. PERDUS
- Vue liste alternative
- Probabilité de closing (scoring manuel du commercial)

**Permissions :**
- **Admin** : Tous les deals, modifier propriétaire
- **Vente** : Ses deals uniquement, créer de nouveaux deals

---

#### **CRM → Activités**
**Fonctionnalités :**
- Timeline des activités
- Types : Appel, Email, Réunion, Visio
- Priorité : Haute, Moyenne, Basse
- Statut : Planifiée, Complétée, Annulée
- Durée et notes
- Voir pour connecter différents APIs comme AIRCALL pour suivi automatique

**Permissions :**
- **Admin** : Toutes les activités de l'équipe
- **Vente** : Ses activités uniquement

---

#### **Ventes → Pipeline**
**Fonctionnalités :**
- Dashboard visuel du pipeline de ventes
- Deals par étape avec valeurs
- Taux de conversion entre étapes
- Graphique de funnel
- Objectifs mensuels

**KPIs affichés :**
- Valeur totale du pipeline
- Nombre de deals actifs
- Taux de conversion
- Objectif vs réalisé

---

#### **Ventes → Devis**
**Fonctionnalités :**
- Liste des devis avec statuts
- Statuts : Brouillon, Envoyé, Accepté, Refusé
- Génération de PDF
- Envoi par email
- Duplication de devis
- Suivi de validité
- Connecter APIs comme YOUSIGN pour signature du contrat interne avant signature LOCAM (ou non s'il n'est pas éligible) et le service MAIL pour envoyer la proposition ou devis par mail au client 

**Actions :**
- Créer, modifier, supprimer
- Envoyer au client
- Télécharger PDF
- Convertir en client

---

#### **Ventes → Facturation**
**Fonctionnalités :**
- Gestion des factures
- Statuts : Payée, En attente, En retard
- Relances automatiques
- Historique des paiements
- Export comptable

**Données :**
- Numéro de facture
- Client
- Montant HT/TTC
- Date d'émission et échéance
- Statut de paiement

---

#### **Ventes → Suivi commercial**
**Fonctionnalités :**
- Analytics de performance commerciale
- Graphiques de CA mensuel
- Top performers
- Activités par commercial
- Objectifs vs réalisé

**Métriques :**
- CA total et par commercial
- Nombre de deals gagnés
- Taux de conversion
- Durée moyenne du cycle de vente

---

### 2. Marketing (Admin + Équipe Marketing)

#### **Marketing → Campagnes**
**Fonctionnalités :**
- Liste des campagnes tous canaux
- Types : Email, Social Media, Ads, Événements
- Budget et ROI
- Statut : Active, Planifiée, Terminée, Pause

**Métriques :**
- Reach (portée)
- Clics
- Conversions
- Budget dépensé
- ROI calculé

---

#### **Marketing → Email**
**Fonctionnalités :**
- Campagnes email marketing
- Éditeur de templates
- Segmentation des listes
- A/B testing
- Statistiques détaillées
- Voir pour la connection aux APIs META et GOOGLE

**Métriques :**
- Envoyés
- Taux d'ouverture
- Taux de clic
- Désabonnements
- Bounce rate

---

#### **Marketing → Réseaux sociaux**
**Fonctionnalités :**
- Gestion multi-plateformes (Facebook, LinkedIn, Instagram, Twitter) c'est CANON ça !!!!!!
- Planification de posts
- Engagement tracking
- Réponses aux commentaires

**Métriques :**
- Likes, commentaires, partages
- Reach
- Engagement rate
- Croissance d'audience

---

#### **Marketing → Analytics**
**Fonctionnalités :**
- Dashboard analytics marketing
- Sources de trafic
- Pages populaires
- Taux de rebond
- Conversion funnel
- Ici il doit s'agir de l'analytic du site digiflow-agency.fr et be-hype.com (nos sociétés)

**Intégrations :**
- Google Analytics
- Facebook Pixel
- LinkedIn Insights

---

### 3. Service (Admin + Équipe Account Management)

#### **Service → Tickets**
**Fonctionnalités :**
- Système de ticketing support
- Priorités : Haute, Moyenne, Basse
- Statuts : Ouvert, En cours, En attente, Résolu
- Assignation automatique
- SLA tracking

**Données :**
- Numéro de ticket
- Sujet et description
- Client
- Agent assigné
- Temps de résolution

Dans ce module, voir s'il s'agit de tickets internes (collaborateurs) ou de tickets clients clients que l'équipe AM (account management) fait remonter

---

#### **Service → Base de connaissances** -> ce module là s'apparente à de la formation, je préfére qu'on le mette un espace ADMIN et qu'on attribues au salariés dans leur espace FORMATION (par exemple on ne mettra pas de formation intégrations tierces aux commerciaux)
**Fonctionnalités :**
- Articles d'aide et documentation
- Catégories
- Recherche full-text
- Statistiques de consultation
- Système de feedback (utile/pas utile)

**Métriques :**
- Vues par article
- Taux d'utilité
- Articles populaires

---

#### **Service → Satisfaction**
**Fonctionnalités :**
- Scores de satisfaction client (CSAT, NPS)
- Avis et feedback
- Distribution des notes
- Performance par agent
- Tendances dans le temps
 - Connecter les plateformes de reception d'avis (Google, Pages jaunes, Tripadvisor, Truspilot) des 2 sociétés DIGIFLOW AGENCY et BE HYPE

**KPIs :**
- Score moyen
- Taux de satisfaction
- NPS (Net Promoter Score)
- Taux de recommandation

---

### 4. Automatisation (Admin uniquement) -> ce module on peut le griser pour le moment il ne sera pas disponibles, on peut à la limite juste laisser une fonctionnalité APIs pour voir tous les apis connectés et ceux qu'on doit connecter

#### **Automatisation → Workflows**
**Fonctionnalités :**
- Création de workflows automatisés
- Déclencheurs : Email reçu, Deal créé, Contact créé, etc.
- Actions : Envoyer email, Créer tâche, Assigner, Notifier
- Conditions et branches
- Statistiques d'exécution

**Exemples de workflows :**
- Assignation automatique de leads
- Email de bienvenue aux nouveaux contacts
- Relance automatique devis
- Notification deal gagné

---

#### **Automatisation → Séquences**
**Fonctionnalités :**
- Séquences d'emails automatisées
- Multi-steps (plusieurs emails)
- Délais configurables
- A/B testing
- Désabonnement automatique si réponse

**Métriques :**
- Inscrits
- Complétés
- Taux d'ouverture
- Taux de réponse
- Désabonnements

---

### 5. Rapports (Admin uniquement)

#### **Rapports → Analytics**
**Fonctionnalités :**
- Vue d'ensemble de toutes les métriques
- Graphiques de CA
- Top produits/services
- Activité récente
- Trends et prévisions

**Exportation :**
- PDF
- Excel
- Google Sheets

---

#### **Rapports → Tableaux de bord**
**Fonctionnalités :**
- Création de dashboards personnalisés
- Widgets configurables
- Partage avec l'équipe
- Refresh automatique
- Favoris

**Widgets disponibles :**
- Graphiques (ligne, barre, camembert)
- KPIs
- Tableaux
- Cartes

---

## 👤 Espace Personnel Commercial

### Accessible à tous les membres de l'équipe Vente

#### **Mon Dashboard Personnel**
- Vue d'ensemble de mes performances
- Mes objectifs du mois
- Mes deals en cours
- Mes prochaines activités

---

#### **🎓 Formations**
**Fonctionnalités :**
- Bibliothèque de vidéos de formation
- Catégories :
  - Techniques de vente
  - Produits/Services
  - Outils CRM
  - Soft skills
  - Onboarding nouveaux
- Tracking de progression
- Vidéos avec Vimeo/YouTube embed
- Quiz de validation
- Certificats

**Données affichées :**
- Titre de la formation
- Durée
- Catégorie
- Progression (%)
- Date de dernière consultation
- Statut : Non commencée, En cours, Complétée

**Exemple de structure :**
```
Formations/
├── Onboarding/
│   ├── Présentation de l'entreprise (15min)
│   ├── Tour du CRM (20min)
│   └── Processus de vente (25min)
├── Techniques de vente/
│   ├── Cold calling (30min)
│   ├── Gestion des objections (45min)
│   └── Closing techniques (35min)
├── Produits/
│   ├── Formation Produit A (40min)
│   └── Formation Produit B (30min)
└── Outils/
    ├── Maîtriser le CRM (60min)
    └── LinkedIn Sales Navigator (40min)
```

---

#### **📊 Mes Statistiques**
**KPIs personnels :**
- CA généré (mois, trimestre, année)
- Nombre de deals gagnés
- Taux de conversion
- Valeur moyenne des deals
- Pipeline actuel
- Ranking dans l'équipe

**Graphiques :**
- Évolution du CA mensuel
- Deals par statut
- Activités complétées
- Performance vs objectifs

**Comparaison :**
- Mes performances vs moyenne de l'équipe
- Progression vs mois précédent
- Objectifs atteints (%)

---

#### **👥 Mes Clients Actifs**
**Fonctionnalités :**
- Liste des clients signés par ce commercial
- Statut : Actif, Inactif, Churné
- Détails du contrat
- Historique des interactions
- Opportunités d'upsell/cross-sell
- Alertes de renouvellement

**Données affichées :**
- Nom du client
- Entreprise
- Date de signature
- Valeur du contrat (MRR/ARR)
- Date de renouvellement
- Santé du compte (Health Score)
- Dernier contact
- Prochaine action

**Actions possibles :**
- Voir le détail du client
- Créer une activité
- Envoyer un email
- Planifier un appel
- Créer une opportunité d'upsell

**Filtres :**
- Par statut
- Par valeur de contrat
- Par date de renouvellement
- Par health score

---

## 🔧 Fonctionnalités Admin

### Accessibles uniquement aux utilisateurs avec rôle Admin

#### **1. Gestion des APIs**
**Localisation :** Settings → Intégrations

**APIs disponibles :**
- **CRM & Sales :**
  - HubSpot
  - Salesforce
  - Pipedrive

- **Communication :**
  - Gmail API
  - Outlook API
  - Slack
  - WhatsApp Business

- **Marketing :**
  - Mailchimp
  - SendGrid
  - Google Ads
  - Facebook Ads

- **Analytics :**
  - Google Analytics
  - Haloscan
  - Hotjar

- **Paiement :**
  - Stripe
  - PayPal

- **Productivité :**
  - Zapier
  - Make (Integromat)

**Fonctionnalités :**
- Connexion/Déconnexion d'API
- Configuration des webhooks
- Gestion des tokens
- Logs de synchronisation
- Test de connexion
- Mapping des champs personnalisés

**Interface :**
```
[API Logo] Google Analytics
Status: ✅ Connecté
Dernière sync: Il y a 5 minutes
Actions: [Configurer] [Déconnecter] [Logs]

[API Logo] Haloscan
Status: ❌ Non connecté
Actions: [Connecter]
```

---

#### **2. Import de Prospects (CSV)**
**Localisation :** CRM → Contacts → Importer

**Fonctionnalités :**
- Upload de fichier CSV
- Mapping des colonnes
- Validation des données
- Aperçu avant import
- Import en arrière-plan (async)
- Rapport d'import (succès/échecs)
- Dédoublonnage automatique

**Format CSV accepté :**
```csv
prenom,nom,email,telephone,entreprise,poste,ville,pays,statut,source
Jean,Dupont,jean@example.com,0612345678,Acme Corp,CEO,Paris,France,Lead,Site web
Marie,Martin,marie@example.com,0623456789,Tech Inc,CTO,Lyon,France,Prospect,LinkedIn
```

**Étapes d'import :**
1. Upload du fichier CSV
2. Mapping des colonnes (automatique + manuel)
3. Prévisualisation (10 premières lignes)
4. Configuration :
   - Dédoublonnage (email/téléphone)
   - Assignation automatique aux commerciaux
   - Tags à ajouter
5. Lancement de l'import
6. Rapport détaillé :
   - ✅ Importés : 245
   - ⚠️ Doublons ignorés : 12
   - ❌ Erreurs : 3

**Validation des données :**
- Email valide (format)
- Téléphone valide (format)
- Champs obligatoires remplis
- Limites de caractères

---

#### **3. Gestion de l'Équipe**
**Localisation :** Settings → Team

**Fonctionnalités :**

##### **3.1. Liste des membres**
- Tableau de tous les membres
- Données : Nom, Email, Rôle, Statut, Date d'ajout
- Filtres par rôle et statut
- Recherche

##### **3.2. Ajouter un membre**
**Formulaire :**
- Prénom
- Nom
- Email
- Rôle (Admin, Vente, Marketing, Account Management)
- Équipe/Département
- Manager (optionnel)
- Date de début
- Photo de profil

**Actions après création :**
- Email d'invitation automatique
- Création des accès
- Assignation au manager

##### **3.3. Modifier un membre**
**Champs modifiables :**
- Informations personnelles
- Rôle et permissions
- Équipe/Manager
- Statut (Actif/Inactif)
- Objectifs mensuels (pour les commerciaux)

##### **3.4. Supprimer un membre**
**Process de suppression :**
1. Confirmation avec pop-up
2. Réassignation obligatoire de ses contacts/deals
3. Archive des données (RGPD compliant)
4. Désactivation immédiate des accès
5. Email de notification au manager

**Options :**
- Supprimer définitivement (hard delete)
- Désactiver (soft delete) - recommandé

##### **3.5. Permissions granulaires**
**Par rôle, configurer :**
- Modules accessibles
- Actions autorisées (CRUD)
- Données visibles (siennes, équipe, toutes)
- Exports autorisés
- Limites d'API calls

---

## 📈 Module Suivi Client Analytics

### Nouveau module dans Admin → Suivi Client

#### **Vue d'ensemble**
Dashboard complet d'analytics client avec intégration Google Analytics et Haloscan.

---

#### **1. Configuration des Intégrations**

##### **Google Analytics**
- Connexion via OAuth 2.0
- Sélection de la propriété GA4
- Configuration des événements trackés
- Mapping des objectifs

##### **Haloscan**
- API Key configuration
- Sélection des domaines trackés
- Configuration des heatmaps
- Session recording settings

---

#### **2. Analyse Hebdomadaire Automatique**

**Fonctionnalités :**
- Rapport généré tous les lundis à 8h00
- Email envoyé aux admins
- Dashboard avec highlights de la semaine
- Comparaison vs semaine précédente
- Insights automatiques (IA)

**Contenu du rapport hebdomadaire :**
- Visiteurs uniques
- Pages vues
- Taux de rebond
- Durée moyenne de session
- Top 10 pages
- Sources de trafic
- Conversions
- Nouveaux vs retours
- Appareils (desktop/mobile/tablet)
- Pays et villes

**Alertes automatiques :**
- Baisse de trafic > 20%
- Hausse du taux de rebond > 15%
- Conversion en baisse
- Erreurs 404 en hausse
- Temps de chargement dégradé

---

#### **3. Statistiques en Live**

**Vue en temps réel :**
- Visiteurs actifs en ce moment
- Pages vues en temps réel
- Événements en cours
- Carte géographique des visiteurs
- Sources actives

**Rafraîchissement :**
- Auto-refresh toutes les 30 secondes
- Bouton de refresh manuel
- Indicateur de dernière mise à jour

---

#### **4. Analytics Avancées**

##### **4.1. Comportement Utilisateur**
- Heatmaps (Haloscan)
- Click tracking
- Scroll depth
- Session recordings
- Funnels de conversion
- Parcours utilisateur

##### **4.2. Performance**
- Core Web Vitals
- Temps de chargement par page
- Erreurs JavaScript
- Broken links
- Images non optimisées

##### **4.3. Acquisition**
**Sources de trafic :**
- Organique (SEO)
- Payant (Ads)
- Social Media
- Référent
- Direct
- Email

**Campagnes :**
- UTM tracking
- ROI par campagne
- Coût par acquisition (CPA)
- Conversion rate par source

##### **4.4. Engagement**
- Pages par session
- Taux de rebond par page
- Durée moyenne
- Événements personnalisés
- Scroll engagement
- Downloads/Clics

##### **4.5. Conversions**
- Objectifs configurés
- Funnels de conversion
- Étapes d'abandon
- Taux de conversion
- Valeur des conversions

##### **4.6. Audience**
**Démographie :**
- Âge
- Genre
- Localisation
- Langue
- Intérêts

**Technologie :**
- Navigateur
- Système d'exploitation
- Résolution d'écran
- Fournisseur réseau

**Comportement :**
- Nouveaux vs récurrents
- Fréquence de visite
- Engagement récent
- Lifetime value

---

#### **5. Exports et Rapports**

**Formats d'export :**
- PDF (rapport formaté)
- Excel (données brutes)
- Google Sheets (sync)
- CSV

**Rapports personnalisés :**
- Sélection de métriques
- Période personnalisée
- Filtres avancés
- Planification d'envoi (quotidien, hebdo, mensuel)
- Destinataires multiples

---

#### **6. Insights IA**

**Analyses automatiques :**
- Détection d'anomalies
- Prédictions de trafic
- Recommandations d'optimisation
- Identification des pages à problèmes
- Opportunités de conversion
- Suggestions de contenu

**Exemple d'insight :**
```
🔍 Insight détecté
La page "/pricing" a un taux de rebond de 75%,
20% supérieur à la moyenne du site.

💡 Recommandation :
Analysez la heatmap et les enregistrements de session
pour identifier les points de friction.
```

---

## 🚀 Plan d'Implémentation

### Phase 1 : Système de Rôles et Permissions ✅ PRIORITAIRE

**Tâches :**
1. Créer le système d'authentification avec rôles
2. Middleware de vérification des permissions
3. Adapter la navigation selon le rôle
4. Restreindre l'accès aux pages selon le rôle
5. Créer des vues différentes par rôle (ex: Dashboard Admin vs Dashboard Commercial)

**Fichiers à créer/modifier :**
- `/lib/auth.ts` - Gestion des rôles
- `/middleware.ts` - Vérification des permissions
- `/lib/permissions.ts` - Matrice des permissions
- Modifier le `layout.tsx` pour adapter la nav

**Durée estimée :** 3-4 heures

---

### Phase 2 : Espace Personnel Commercial ✅ PRIORITAIRE

**Tâches :**
1. Créer la page Dashboard Personnel
2. Module Formations (avec vidéos)
3. Module Mes Statistiques
4. Module Mes Clients Actifs
5. Données mockées pour le mode démo

**Fichiers à créer :**
- `/app/dashboard/mon-espace/page.tsx`
- `/app/dashboard/mon-espace/formations/page.tsx`
- `/app/dashboard/mon-espace/statistiques/page.tsx`
- `/app/dashboard/mon-espace/clients/page.tsx`

**Durée estimée :** 4-5 heures

---

### Phase 3 : Fonctionnalités Admin

**Tâches :**
1. Page Gestion des APIs
2. Page Import CSV
3. Amélioration de la page Team avec CRUD complet
4. Système de réassignation lors de la suppression

**Fichiers à créer/modifier :**
- `/app/dashboard/settings/integrations/page.tsx` (déjà existant, à améliorer)
- `/app/dashboard/crm/contacts/import/page.tsx`
- `/app/dashboard/settings/team/page.tsx` (améliorer l'existant)

**Durée estimée :** 5-6 heures

---

### Phase 4 : Module Suivi Client Analytics ✅ PRIORITAIRE

**Tâches :**
1. Créer la page principale Suivi Client
2. Configuration Google Analytics (mock)
3. Configuration Haloscan (mock)
4. Dashboard avec métriques en temps réel
5. Rapport hebdomadaire (UI + logique de génération)
6. Système d'alertes
7. Exports

**Fichiers à créer :**
- `/app/dashboard/suivi-client-analytics/page.tsx`
- `/app/dashboard/suivi-client-analytics/configuration/page.tsx`
- `/app/dashboard/suivi-client-analytics/rapports/page.tsx`
- `/lib/analytics-integration.ts` (mock)

**Durée estimée :** 6-7 heures

---

### Phase 5 : Améliorations UI/UX

**Tâches :**
1. Améliorer les transitions et animations
2. Skeleton loaders
3. Toasts de notifications
4. Modals de confirmation
5. Empty states améliorés
6. Responsive mobile final
7. Dark mode (optionnel)

**Durée estimée :** 3-4 heures

---

### Phase 6 : Mode Démo Complet

**Tâches :**
1. Générer des données mockées cohérentes
2. Interactions simulées (ex: envoyer un email ne fait rien mais affiche un toast)
3. Bannière "MODE DÉMO" visible
4. Désactiver les vrais appels API
5. Documentation inline

**Durée estimée :** 2-3 heures

---

### Phase 7 : Passage en Production

**Tâches :**
1. Configuration de la BDD (Prisma schema)
2. Authentification réelle (NextAuth)
3. API Routes pour toutes les fonctionnalités
4. Intégrations réelles (Google Analytics, Haloscan, etc.)
5. Tests
6. Déploiement

**Durée estimée :** 15-20 heures (backend complet)

---

## 📊 Estimation Totale

**Mode Démo Complet :** ~23-29 heures
**Passage en Production :** +15-20 heures
**TOTAL :** 38-49 heures

---

## ✅ Priorités Recommandées

1. **Phase 1** - Rôles et permissions (URGENT)
2. **Phase 2** - Espace personnel commercial (HIGH)
3. **Phase 4** - Suivi Client Analytics (HIGH)
4. **Phase 3** - Fonctionnalités Admin (MEDIUM)
5. **Phase 5** - Améliorations UI/UX (MEDIUM)
6. **Phase 6** - Finalisation mode démo (LOW)
7. **Phase 7** - Production (FUTURE)

---

## 📝 Notes Importantes

### Sécurité
- Toutes les routes doivent vérifier les permissions
- Validation côté serveur obligatoire
- Pas de données sensibles en localStorage
- RGPD compliant (droit à l'oubli, export données)

### Performance
- Pagination sur toutes les listes
- Lazy loading des images
- Code splitting par route
- Caching intelligent

### UX
- Feedback immédiat sur toutes les actions
- Confirmation avant suppression
- Undo sur les actions critiques
- États de chargement clairs

---

**Dernière mise à jour :** 2025-11-04
**Version :** 1.0 - Mode Démo
