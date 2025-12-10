# Application d'Inscription aux Événements

Application web permettant de visualiser et s'inscrire aux événements provenant de votre ERP.

## Structure du Projet

```
Dynamic Calendar/
├── index.html          # Page principale
├── styles.css          # Styles de l'application
├── config.js           # Configuration de l'API (généré depuis .env)
├── app.js              # Logique de l'application
├── .env                # Variables d'environnement (URLs des API)
├── build-config.js     # Script pour générer config.js depuis .env
├── API_MAPPING.md      # Documentation du mapping API ERP
├── .gitignore          # Fichiers à ignorer par Git
└── README.md           # Ce fichier
```

## Configuration

### 1. Configurer le fichier .env

Modifiez le fichier `.env` avec les URLs complètes de votre API ERP :

```env
# URL complète pour récupérer les événements (sessions d'admission)
API_URL_GET_EVENTS=https://votre-erp.com/api/events

# URL complète pour récupérer les formations
API_URL_GET_FORMATIONS=https://votre-erp.com/api/formations

# URL complète pour envoyer les inscriptions
API_URL_POST_REGISTRATION=https://votre-erp.com/api/registrations

# Clé API (si nécessaire pour l'authentification)
API_KEY=votre_cle_api_ici

# Utiliser la clé API dans les headers (true/false)
USE_API_KEY=false
```

### 2. Générer le fichier config.js

Une fois le `.env` configuré, générez automatiquement le fichier `config.js` :

```bash
node build-config.js
```

Vous verrez un message de confirmation :

```
✅ Fichier config.js généré avec succès !

Configuration chargée:
  • Événements: https://votre-erp.com/api/events
  • Formations: https://votre-erp.com/api/formations
  • Inscriptions: https://votre-erp.com/api/registrations
  • Authentification: Désactivée
```

**Méthode alternative** : Vous pouvez aussi modifier directement le fichier `config.js` si vous préférez.

## Format des Données API

L'application est compatible avec le format JSON de votre API ERP.

**Mapping automatique** : L'application convertit automatiquement les données de votre API ERP vers son format interne :
- `title` → `titre`
- `date_start` (DD/MM/YYYY) → `date` (YYYY-MM-DD)
- `time_start` (HH:MM:SS) → `heure` (HH:MM)
- `format` ("face_to_face"/"online") → `type` ("physique"/"visio")
- `formations[].name` → `description`
- `location` / `training_organizations` → `lieu`

### Événements (GET)

Votre API ERP retourne les événements au format :

```json
[
  {
    "id": "uuid",
    "title": "Titre de l'événement",
    "date_start": "06/12/2031",
    "time_start": "12:05:00",
    "format": "face_to_face",
    "location": "Adresse",
    "formations": [...],
    "training_organizations": [...]
  }
]
```

**Pour plus de détails sur le mapping, consultez [API_MAPPING.md](API_MAPPING.md)**

### Inscription (POST)

L'application envoie les inscriptions au format requis par l'API ERP :

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "birthday": "1990-01-01",
  "email": "example@example.com",
  "phone": "0123456789",
  "sexe": "male",
  "cp": "12345",
  "city": "CityName",
  "formation": ["2990"],
  "orga": "26",
  "source": "Site Internet",
  "origine": ""
}
```

**Champs du formulaire :**
- Nom, Prénom
- Email, Téléphone
- Date de naissance
- Sexe (homme/femme/autre)
- Code postal, Ville
- Formation souhaitée (sélection parmi les formations de l'événement)

## Utilisation

### Lancement de l'application

1. **Avec un serveur local :**
   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000

   # Node.js (avec http-server)
   npx http-server
   ```

2. Ouvrez votre navigateur et accédez à `http://localhost:8000`

### Fonctionnalités

1. **Visualisation des événements :**
   - Liste des événements à gauche
   - Calendrier à droite avec dates en surbrillance

2. **Navigation du calendrier :**
   - Utilisez les flèches < > pour changer de mois
   - Les jours avec événements sont en surbrillance orange

3. **Inscription :**
   - Cliquez sur "S'inscrire" sur un événement
   - Remplissez le formulaire
   - Validez l'inscription

## Connexion à l'API

L'application se connecte directement à votre API ERP configurée dans le fichier `.env`. Si l'API n'est pas accessible ou mal configurée, un message d'erreur s'affichera.

Assurez-vous que :
- Les URLs dans `.env` sont correctes
- Votre API est accessible depuis le navigateur
- Les CORS sont correctement configurés sur votre serveur (voir section Support CORS ci-dessous)

## Personnalisation

### Couleurs

Modifiez les couleurs principales dans `styles.css` :

```css
/* Couleur principale */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Couleur des événements */
.calendar-day.has-event {
    background: #fff3e0;
    border: 2px solid #ff9800;
}
```

### Champs du formulaire

Pour ajouter des champs, modifiez :
1. Le HTML dans `index.html` (section formulaire)
2. La fonction `handleRegistration()` dans `app.js`

## Gestion des Erreurs

L'application gère automatiquement :
- Échec de connexion à l'API
- Erreurs d'inscription
- Validation des formulaires

## Compatibilité

- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Responsive design pour mobile et tablette

## Support CORS

Si vous rencontrez des erreurs CORS, vous devez configurer votre serveur API pour autoriser les requêtes depuis votre domaine :

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Améliorations Futures

- [ ] Système de pagination pour les événements
- [ ] Filtres par type d'événement (visio/physique)
- [ ] Recherche d'événements
- [ ] Confirmation par email automatique
- [ ] Gestion des inscriptions multiples
- [ ] Export des inscriptions

## Sécurité

**Important :** Ne commitez jamais le fichier `.env` dans un dépôt public. Ajoutez-le à votre `.gitignore`.

Pour une utilisation en production, utilisez un backend pour gérer les appels API et protéger vos clés.
