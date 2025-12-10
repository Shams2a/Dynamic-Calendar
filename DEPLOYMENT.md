# 🚀 Guide de Déploiement sur Vercel

Ce guide vous accompagne étape par étape pour déployer l'application sur Vercel en toute sécurité.

---

## 📋 Prérequis

- [ ] Un compte GitHub (gratuit)
- [ ] Un compte Vercel (gratuit - https://vercel.com)
- [ ] Git installé sur votre machine
- [ ] Vos clés API ERP

---

## 🗂️ Structure du Projet

```
Dynamic Calendar/
├── public/              # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── api/                 # Backend (Serverless Functions)
│   ├── events.js        # GET /api/events
│   ├── formations.js    # GET /api/formations
│   └── register.js      # POST /api/register
│
├── .env.example         # Template des variables d'env
├── .gitignore          # Fichiers à ignorer
├── vercel.json         # Configuration Vercel
├── package.json        # Dépendances
└── DEPLOYMENT.md       # Ce fichier
```

---

## 🔐 Étape 1 : Sécuriser la Clé API

### 1.1 Créer le fichier `.env.local`

Dans le dossier du projet, créez un fichier `.env.local` :

```bash
cp .env.example .env.local
```

### 1.2 Remplir les variables

Ouvrez `.env.local` et remplacez les valeurs :

```bash
API_KEY=rrQFJZQi5eFcbFrifKYIFiIsNWWUg+8ZDFg4PrNM1FmeJQvI/Kw5YR24oYZQojYztb/nGL/DhTkJGJ+gkhss
API_URL_GET_EVENTS=https://groupeifcv.pyramideapp.fr/api/meetings
API_URL_GET_FORMATIONS=https://groupeifcv.pyramideapp.fr/api/formations
API_URL_POST_REGISTRATION=https://groupeifcv.pyramideapp.fr/api/candidates
```

⚠️ **IMPORTANT** : Le fichier `.env.local` ne sera JAMAIS commité dans Git (protégé par `.gitignore`)

---

## 📦 Étape 2 : Créer le Repository Git

### 2.1 Initialiser Git (si pas déjà fait)

```bash
cd "/Users/aashams/Downloads/Dynamic Calendar"
git init
```

### 2.2 Ajouter les fichiers

```bash
git add .
git commit -m "Initial commit - Application prête pour Vercel"
```

### 2.3 Créer un repository sur GitHub

1. Allez sur https://github.com/new
2. Nom du repository : `dynamic-calendar` (ou autre nom)
3. Sélectionnez **Private** (recommandé)
4. **NE PAS** initialiser avec README, .gitignore, ou license
5. Cliquez sur "Create repository"

### 2.4 Pousser le code sur GitHub

```bash
git remote add origin https://github.com/VOTRE_USERNAME/dynamic-calendar.git
git branch -M main
git push -u origin main
```

---

## 🌐 Étape 3 : Déployer sur Vercel

### 3.1 Se connecter à Vercel

1. Allez sur https://vercel.com
2. Cliquez sur "Sign Up" (s'inscrire)
3. Connectez-vous avec votre compte GitHub
4. Autorisez Vercel à accéder à vos repositories

### 3.2 Importer le Projet

1. Sur le dashboard Vercel, cliquez sur **"Add New"** → **"Project"**
2. Sélectionnez votre repository `dynamic-calendar`
3. Cliquez sur **"Import"**

### 3.3 Configuration du Projet

**Framework Preset** : Sélectionnez **"Other"**

**Build Settings** :
- Build Command : (laisser vide)
- Output Directory : `public`
- Install Command : `npm install`

### 3.4 Ajouter les Variables d'Environnement

⚠️ **ÉTAPE CRITIQUE** - Cliquez sur **"Environment Variables"** :

Ajoutez les 4 variables suivantes :

| Name                          | Value                                                          |
|-------------------------------|----------------------------------------------------------------|
| `API_KEY`                     | `rrQFJZQi5eFcbFrifKYIFiIsNWWUg+8ZDFg4PrNM1FmeJQvI/Kw5YR24oYZQojYztb/nGL/DhTkJGJ+gkhss` |
| `API_URL_GET_EVENTS`          | `https://groupeifcv.pyramideapp.fr/api/meetings`              |
| `API_URL_GET_FORMATIONS`      | `https://groupeifcv.pyramideapp.fr/api/formations`            |
| `API_URL_POST_REGISTRATION`   | `https://groupeifcv.pyramideapp.fr/api/candidates`            |

Pour chaque variable :
1. Name : Copier le nom exactement
2. Value : Copier la valeur
3. Cocher **"Production"**, **"Preview"**, et **"Development"**
4. Cliquez "Add"

### 3.5 Déployer

1. Vérifiez que tout est correct
2. Cliquez sur **"Deploy"**
3. Attendez 1-2 minutes ⏱️

---

## ✅ Étape 4 : Vérification

### 4.1 Accéder au Site

Une fois déployé, Vercel vous donne une URL du type :
```
https://dynamic-calendar-xxxx.vercel.app
```

### 4.2 Tester l'Application

1. ✅ La page s'affiche correctement
2. ✅ Les événements se chargent depuis l'API
3. ✅ Le calendrier fonctionne
4. ✅ Le formulaire d'inscription fonctionne
5. ✅ Les tooltips apparaissent

### 4.3 Vérifier les Logs

Si quelque chose ne fonctionne pas :
1. Dashboard Vercel → Votre Projet
2. Onglet **"Functions"**
3. Cliquez sur une fonction (events, formations, register)
4. Consultez les logs d'erreur

---

## 🎨 Étape 5 : Domaine Personnalisé (Optionnel)

### 5.1 Ajouter votre domaine

1. Dashboard Vercel → Votre Projet
2. Onglet **"Settings"** → **"Domains"**
3. Ajoutez votre domaine (ex: `inscriptions.ifcv.fr`)
4. Suivez les instructions DNS de Vercel

### 5.2 Configuration DNS

Vercel vous donnera des enregistrements DNS à ajouter :
- Type **A** ou **CNAME**
- Pointant vers les serveurs Vercel

✅ HTTPS automatique activé !

---

## 🔄 Mises à Jour Futures

Pour mettre à jour l'application :

```bash
# 1. Faites vos modifications
# 2. Committez
git add .
git commit -m "Description de vos changements"

# 3. Poussez sur GitHub
git push

# 4. Vercel déploie automatiquement ! 🎉
```

---

## 🐛 Dépannage

### Problème : Les événements ne se chargent pas

**Solution** :
1. Vérifiez les variables d'environnement dans Vercel
2. Consultez les logs de la fonction `/api/events`
3. Vérifiez que l'API ERP est accessible

### Problème : Erreur 500 sur les API

**Solution** :
1. Dashboard Vercel → Functions → Logs
2. Regardez le message d'erreur exact
3. Vérifiez la clé API

### Problème : Formulaire ne soumet pas

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs JavaScript
3. Vérifiez que `/api/register` répond

---

## 📞 Support

- Documentation Vercel : https://vercel.com/docs
- Dashboard : https://vercel.com/dashboard
- Status : https://vercel-status.com

---

## 🎉 Félicitations !

Votre application est maintenant en production, sécurisée, et scalable ! 🚀

**URL de votre application** : https://votre-app.vercel.app

**Prochaines étapes recommandées** :
- [ ] Configurer un domaine personnalisé
- [ ] Configurer Google Analytics
- [ ] Mettre en place un monitoring d'erreurs (Sentry)
- [ ] Tester sur mobile
