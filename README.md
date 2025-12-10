# 📅 Dynamic Calendar - Application d'Inscription aux Événements

Application web moderne permettant de visualiser et s'inscrire aux sessions d'admission de l'IFCV.

**✅ Production Ready** - Prêt pour le déploiement sur Vercel

---

## 🎯 Fonctionnalités

- ✅ **Calendrier interactif** avec navigation mois par mois
- ✅ **Liste des événements** avec détails complets
- ✅ **Tooltips au survol** des dates et formations
- ✅ **Formulaire d'inscription** avec validation RGPD
- ✅ **Responsive design** (mobile, tablet, desktop)
- ✅ **Intégration API ERP** sécurisée
- ✅ **Backend serverless** (Vercel Functions)

---

## 🏗️ Architecture

```
Frontend (Static)          Backend (Serverless)        API ERP
┌────────────────┐         ┌─────────────────┐        ┌──────────────┐
│  HTML/CSS/JS   │  ───→   │  /api/events    │  ───→  │   Meetings   │
│  dans public/  │         │  /api/formations│  ───→  │  Formations  │
│                │  ←───   │  /api/register  │  ───→  │  Candidates  │
└────────────────┘         └─────────────────┘        └──────────────┘
  Vercel CDN              Vercel Functions           groupeifcv API
```

**Sécurité** : La clé API est stockée côté serveur uniquement (variables d'environnement Vercel).

---

## 🚀 Déploiement Rapide

### Option 1 : Déploiement Automatique (Recommandé)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VOTRE_USERNAME/dynamic-calendar)

1. Cliquez sur le bouton ci-dessus
2. Connectez votre compte GitHub
3. Ajoutez les 4 variables d'environnement requises
4. Déployez ! 🎉

### Option 2 : Déploiement Manuel

Suivez le guide détaillé : **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 🛠️ Développement Local

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/VOTRE_USERNAME/dynamic-calendar.git
cd dynamic-calendar

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env.local
cp .env.example .env.local
# Éditer .env.local avec vos vraies valeurs

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrez http://localhost:3000

---

## 📝 Variables d'Environnement

| Variable                      | Description                          | Exemple                                              |
|-------------------------------|--------------------------------------|------------------------------------------------------|
| `API_KEY`                     | Clé d'authentification API ERP       | `rrQFJZQi5eFcbFr...`                                |
| `API_URL_GET_EVENTS`          | URL pour récupérer les événements   | `https://groupeifcv.pyramideapp.fr/api/meetings`    |
| `API_URL_GET_FORMATIONS`      | URL pour récupérer les formations   | `https://groupeifcv.pyramideapp.fr/api/formations`  |
| `API_URL_POST_REGISTRATION`   | URL pour envoyer les inscriptions   | `https://groupeifcv.pyramideapp.fr/api/candidates`  |

⚠️ **Ne JAMAIS commiter le fichier `.env.local` dans Git !**

---

## 📂 Structure des Fichiers

```
Dynamic Calendar/
├── public/                  # Frontend statique
│   ├── index.html          # Page principale
│   ├── styles.css          # Styles CSS
│   └── app.js              # Logique frontend (sans clé API)
│
├── api/                    # Backend Serverless Functions
│   ├── events.js           # GET /api/events
│   ├── formations.js       # GET /api/formations
│   └── register.js         # POST /api/register
│
├── .env.example            # Template des variables
├── .env.local              # Variables locales (gitignored)
├── .gitignore             # Fichiers ignorés
├── vercel.json            # Configuration Vercel
├── package.json           # Dépendances
├── DEPLOYMENT.md          # Guide de déploiement
└── README.md              # Ce fichier
```

---

## 🔐 Sécurité

- ✅ **Clé API côté serveur** uniquement
- ✅ **HTTPS obligatoire** en production
- ✅ **CORS configuré** correctement
- ✅ **Validation des données** côté backend
- ✅ **Consentement RGPD** obligatoire
- ✅ **Variables d'environnement** protégées

---

## 🎨 Personnalisation

### Modifier les couleurs

Éditez `public/styles.css` :

```css
/* Couleur principale */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Couleur des événements dans le calendrier */
.calendar-day.has-event {
    background: #3498db;
}
```

### Ajouter des champs au formulaire

1. **HTML** : Ajoutez le champ dans `public/index.html`
2. **Backend** : Modifiez `api/register.js` pour traiter le nouveau champ
3. **Frontend** : Mettez à jour `public/app.js` pour envoyer la donnée

---

## 🐛 Dépannage

### Les événements ne se chargent pas

1. Vérifiez les variables d'environnement dans Vercel
2. Consultez les logs : Dashboard Vercel → Functions → events.js
3. Vérifiez que l'API ERP est accessible

### Erreur CORS

- Assurez-vous que `vercel.json` est présent
- Vérifiez les headers CORS dans les fonctions API

### Formulaire ne soumet pas

- Ouvrez la console du navigateur (F12)
- Vérifiez les erreurs JavaScript
- Testez la route `/api/register` avec Postman

---

## 📊 API Endpoints

### GET /api/events
Récupère la liste des événements

**Réponse** :
```json
[
  {
    "id": "uuid",
    "title": "Session Admission",
    "date_start": "05/01/2026",
    "time_start": "14:00:00",
    "format": "face_to_face",
    "location": "70 Rue Marius Aufan...",
    "formations": [...],
    "training_organizations": [...]
  }
]
```

### GET /api/formations
Récupère la liste des formations

### POST /api/register
Enregistre une inscription

**Body** :
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "birthday": "1990-01-01",
  "sexe": "male",
  "address": "123 rue Example",
  "cp": "75001",
  "city": "Paris",
  "formation": ["103"],
  "orga": "26",
  "source": "Site Internet",
  "origine": ""
}
```

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/ma-feature`)
3. Committez (`git commit -m 'Ajout de ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrez une Pull Request

---

## 📄 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👤 Auteur

**IFCV** - Institut de Formation de la CCI de Paris Île-de-France

- Site web : https://www.ifcv.fr
- Mentions légales : https://www.ifcv.fr/mentions-legales/

---

## 🙏 Remerciements

- [Vercel](https://vercel.com) pour l'hébergement
- [Pyramide App](https://pyramideapp.fr) pour l'API ERP

---

**Prêt à déployer ?** Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) 🚀
