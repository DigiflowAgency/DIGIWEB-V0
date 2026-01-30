DOCUMENTATION A PARTAGER AVEC L'EQUIPE

 ---
Guide Deploiement Digiflow - Regles Obligatoires

POURQUOI CE GUIDE ?

Le 28 janvier 2026, un push a casse 14 sites en production. Cause: un fichier ecosystem.config.cjs commite par erreur.

Ce guide explique les regles a suivre pour eviter ca.

 ---
REGLES CRITIQUES

1. NE JAMAIS creer/commiter ces fichiers:

- ecosystem.config.cjs
- ecosystem.config.js
- Tout fichier de config PM2

Pourquoi: PM2 est deja configure sur le serveur. Ajouter ces fichiers dans git casse le deploiement.

Erreur typique si vous le faites:
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
SyntaxError: missing ) after argument list

2. NE JAMAIS hardcoder de PORT

- Chaque app a un port unique (3001, 3030, 3045, etc.)
- Le port est gere par nginx + PM2 sur le serveur
- Pas de PORT: 3000 ou PORT: 8080 dans votre code

3. NE JAMAIS modifier .github/workflows/deploy.yml

- Ce workflow est genere par Digiflow Deploy
- Les modifications manuelles causent des problemes

 ---
CHECKLIST AVANT CHAQUE PUSH

[ ] 1. Installer les dependances
pnpm install   (si pnpm-lock.yaml existe)
npm install    (sinon)

[ ] 2. Verifier que le build passe
npm run build

[ ] 3. Verifier git status - PAS de fichiers interdits:
- ecosystem.config.cjs  ❌
- ecosystem.config.js   ❌
- .env                  ❌
- node_modules/         ❌

[ ] 4. Commit et push

 ---
SI VOUS UTILISEZ CLAUDE CODE

Ajoutez ces regles dans votre prompt ou CLAUDE.md:

REGLES SERVEUR DIGIFLOW:
- NE JAMAIS creer ecosystem.config.cjs ou ecosystem.config.js
- NE JAMAIS hardcoder de port (PORT: 3000, etc.)
- NE JAMAIS modifier .github/workflows/deploy.yml
- TOUJOURS faire pnpm install && npm run build avant de push

 ---
ARCHITECTURE SERVEUR

GitHub (push) --> GitHub Actions --> SSH sur VPS --> git pull + build + pm2 restart

- PM2: pm2 start npm --name "app-name" -- start -- -H 127.0.0.1 -p PORT
- Nginx: Reverse proxy domaine.com --> 127.0.0.1:PORT
- Ports: Chaque app a un port unique assigne (voir nginx config)

 ---
EN CAS DE SITE CASSE

1. NE PAS ajouter de fichiers de config PM2
2. NE PAS modifier le workflow de deploy
3. Contacter l'admin serveur (Ubuntu/Claude sur le VPS)
4. Verifier que le build passe en local d'abord

 ---
AJOUTER AU .gitignore

Ajoutez ces lignes a votre .gitignore:

# PM2 - NE JAMAIS COMMITER
ecosystem.config.cjs
ecosystem.config.js

 ---
RESUME

| Action                   | Autorise | Interdit |
 |--------------------------|----------|----------|
| Push du code             | OK       | -        |
| Modifier package.json    | OK       | -        |
| Creer ecosystem.config.* | -        | INTERDIT |
| Hardcoder un port        | -        | INTERDIT |
| Modifier deploy.yml      | -        | INTERDIT |
| Push sans build local    | -        | INTERDIT |

 ---