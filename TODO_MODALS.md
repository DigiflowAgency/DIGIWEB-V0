# 📝 TODO - Modals de Création

**Date** : 17 novembre 2025
**Objectif** : Implémenter tous les boutons "+" avec modals fonctionnels

---

## 🎯 Objectif : ZÉRO BOUTONS FACTICES

Actuellement, tous les boutons "Nouveau X" dans l'application ne font rien.
Il faut créer des modals avec formulaires complets + validation + API pour chaque.

---

## ✅ Composant Base

- [x] **Modal.tsx** - Composant réutilisable créé dans `src/components/Modal.tsx`

---

## 📋 Modals à Implémenter

### 🔴 Priorité Haute (Core CRM)

- [ ] **Nouveau Contact** (30-40 min)
  - Page: `src/app/dashboard/crm/contacts/page.tsx`
  - API: `POST /api/contacts`
  - Champs requis: firstName, lastName
  - Champs optionnels: email, phone, position, companyId, address, etc.
  - Statut: LEAD (défaut)

- [ ] **Nouveau Deal** (30-40 min)
  - Page: `src/app/dashboard/crm/deals/page.tsx`
  - API: `POST /api/deals`
  - Champs requis: title, value, contactId
  - Champs optionnels: description, stage, probability, closeDate

- [ ] **Nouvelle Activité** (30-40 min)
  - Page: `src/app/dashboard/crm/activities/page.tsx`
  - API: `POST /api/activities`
  - Champs requis: title, type, scheduledAt
  - Champs optionnels: description, contactId, dealId, duration, priority

- [ ] **Nouvelle Entreprise** (30-40 min)
  - Page: `src/app/dashboard/crm/companies/page.tsx`
  - API: `POST /api/companies`
  - Champs requis: name
  - Champs optionnels: siret, industry, size, address, etc.

### 🟡 Priorité Moyenne (Ventes)

- [ ] **Nouveau Devis** (40-50 min)
  - Page: `src/app/dashboard/offres/page.tsx` ou `src/app/dashboard/sales/quotes/page.tsx`
  - API: `POST /api/quotes`
  - Champs requis: contactId, validUntil
  - Champs complexes: products (array), total calculé

- [ ] **Nouvelle Facture** (40-50 min)
  - Page: `src/app/dashboard/sales/invoices/page.tsx`
  - API: `POST /api/invoices`
  - Champs requis: contactId, dueDate
  - Champs complexes: items (array), total calculé

### 🟢 Priorité Basse (Support & Marketing)

- [ ] **Nouveau Ticket** (30-40 min)
  - Page: `src/app/dashboard/service/tickets/page.tsx`
  - API: `POST /api/tickets`
  - Champs requis: title, type, priority
  - Champs optionnels: description, contactId, category

- [ ] **Nouvelle Campagne** (30-40 min)
  - Page: `src/app/dashboard/marketing/campaigns/page.tsx`
  - API: `POST /api/campaigns`
  - Champs requis: name, type, startDate
  - Champs optionnels: description, budget, targetAudience

---

## 🛠️ Architecture Technique

### Pattern à Suivre (pour chaque modal)

1. **État du modal**
   ```tsx
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [formData, setFormData] = useState({...});
   const [errors, setErrors] = useState({});
   const [loading, setLoading] = useState(false);
   ```

2. **Bouton d'ouverture**
   ```tsx
   <button onClick={() => setIsModalOpen(true)}>
     <Plus /> Nouveau X
   </button>
   ```

3. **Composant Modal**
   ```tsx
   <Modal
     isOpen={isModalOpen}
     onClose={() => setIsModalOpen(false)}
     title="Nouveau X"
   >
     <form onSubmit={handleSubmit}>
       {/* Formulaire */}
     </form>
   </Modal>
   ```

4. **Soumission avec API**
   ```tsx
   const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);

     try {
       const response = await fetch('/api/x', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData),
       });

       if (!response.ok) throw new Error('...');

       // Revalider les données avec SWR
       mutate();

       // Fermer le modal
       setIsModalOpen(false);

       // Toast de succès (optionnel)
     } catch (err) {
       setErrors({ submit: err.message });
     } finally {
       setLoading(false);
     }
   };
   ```

5. **Utiliser le hook de mutations existant**
   ```tsx
   import { useContactMutations } from '@/hooks/useContacts';
   const { createContact, loading, error } = useContactMutations();
   ```

---

## 📊 Estimation Totale

| Priorité | Modals | Temps Estimé |
|----------|--------|--------------|
| 🔴 Haute | 4 | 2h - 2h40 |
| 🟡 Moyenne | 2 | 1h20 - 1h40 |
| 🟢 Basse | 2 | 1h - 1h20 |
| **TOTAL** | **8** | **4h20 - 5h40** |

---

## ✅ Checklist Qualité (pour chaque modal)

- [ ] Validation côté client (Zod ou formulaire HTML5)
- [ ] Gestion des erreurs API
- [ ] Loading state pendant la soumission
- [ ] Désactiver le bouton submit pendant loading
- [ ] Revalider les données après création (mutate SWR)
- [ ] Fermer le modal après succès
- [ ] Réinitialiser le formulaire après fermeture
- [ ] Accessibilité (Escape pour fermer, focus trap)
- [ ] Messages d'erreur clairs en français

---

## 🚀 Plan d'Action

### Session 1 (2h) - CRM Core
1. Nouveau Contact
2. Nouveau Deal
3. Nouvelle Activité
4. Nouvelle Entreprise

### Session 2 (1h30) - Ventes
5. Nouveau Devis
6. Nouvelle Facture

### Session 3 (1h) - Support & Marketing
7. Nouveau Ticket
8. Nouvelle Campagne

---

## 📝 Notes

- Tous les hooks de mutations existent déjà dans `src/hooks/`
- Toutes les API routes sont fonctionnelles
- Le composant Modal.tsx est prêt à l'emploi
- Chaque schéma Zod est déjà défini dans les API routes

**Prochaine session : Attaquer les 4 modals priorité haute** 🎯
