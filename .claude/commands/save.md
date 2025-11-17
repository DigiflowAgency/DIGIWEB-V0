# Commande Save Session

Sauvegarde l'état actuel de la session de développement dans un fichier horodaté.

## Instructions pour Claude

Quand cette commande est exécutée :

1. **Créer un fichier de session** dans `.claude/sessions/` avec le format : `session-YYYY-MM-DD-HHmmss.md`

2. **Contenu du fichier de session** :
   - Date et heure de la sauvegarde
   - Résumé de ce qui a été fait pendant cette session
   - Liste des fichiers créés/modifiés (utiliser `git status` et `git diff --stat`)
   - Commandes importantes exécutées
   - Problèmes rencontrés et solutions
   - Prochaines étapes / TODO
   - État des données mockées vs réelles (consulter MOCK_DATA_TRACKER.md)

3. **Format Markdown** structuré et lisible

4. **Commiter les changements** si demandé par l'utilisateur

5. **Message de confirmation** avec le chemin du fichier sauvegardé

## Exemple de sortie

```
✅ Session sauvegardée : .claude/sessions/session-2024-11-17-143022.md

Résumé :
- 5 fichiers modifiés
- 3 API routes créées
- 120 lignes de code ajoutées
- 0 fausses données supprimées

Prochaine étape : Implémenter l'authentification NextAuth
```
