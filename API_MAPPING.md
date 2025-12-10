# Documentation du Mapping API ERP

## Format des Données Reçues (GET)

L'application reçoit les événements depuis votre API ERP au format suivant :

```json
[
    {
        "id": "4cb1b376-63b0-4104-bpd3badc7045gge",
        "title": "Ev1",
        "date_start": "06/12/2031",
        "time_start": "12:05:00",
        "date_end": "06/12/2031",
        "time_end": "12:00:00",
        "number_participants": 2225,
        "max_person": 44,
        "format": "face_to_face",
        "metting_link": null,
        "location": null,
        "formations": [...],
        "training_organizations": [...]
    }
]
```

## Mapping Automatique

L'application convertit automatiquement ces données vers son format interne :

| Champ API ERP | Champ Interne | Traitement |
|--------------|---------------|------------|
| `id` | `id` | Direct |
| `title` | `titre` | Direct |
| `date_start` | `date` | Converti de "DD/MM/YYYY" vers "YYYY-MM-DD" |
| `time_start` | `heure` | Tronqué à "HH:MM" (supprime les secondes) |
| `format` | `type` | "face_to_face" → "physique"<br>"online" → "visio" |
| `formations[].name` | `description` | Concaténation des noms de formations |
| `location` ou `training_organizations[0].city + cp` | `lieu` | Pour physique: location ou ville+CP<br>Pour visio: metting_link ou "En ligne" |
| `max_person` | `max_person` | Direct |
| `number_participants` | `number_participants` | Direct |

## Fonction de Mapping

La fonction `mapEventFromAPI()` dans `app.js` gère automatiquement cette conversion :

```javascript
function mapEventFromAPI(apiEvent) {
    return {
        id: apiEvent.id,
        titre: apiEvent.title,
        date: convertDateFormat(apiEvent.date_start),
        heure: apiEvent.time_start.substring(0, 5),
        type: apiEvent.format === 'face_to_face' ? 'physique' : 'visio',
        description: apiEvent.formations.map(f => f.name).join(', '),
        lieu: /* logique conditionnelle */,
        max_person: apiEvent.max_person,
        number_participants: apiEvent.number_participants
    };
}
```

## Gestion des Formats de Date

### Conversion Date
- **Entrée API** : `"06/12/2031"` (format DD/MM/YYYY)
- **Sortie Interne** : `"2031-12-06"` (format YYYY-MM-DD)
- **Fonction** : `convertDateFormat()`

### Conversion Heure
- **Entrée API** : `"12:05:00"` (format HH:MM:SS)
- **Sortie Interne** : `"12:05"` (format HH:MM)

## Gestion du Type d'Événement

### Format API → Type Interne
- `"face_to_face"` → `"physique"`
- `"online"` → `"visio"`
- Autre valeur → `"visio"` (par défaut)

## Gestion du Lieu

### Pour événements physiques (face_to_face)
1. Si `location` existe → utilise `location`
2. Sinon, si `training_organizations[0]` existe → utilise `city + cp`
3. Sinon → `"Non spécifié"`

### Pour événements en ligne (online/visio)
1. Si `metting_link` existe → utilise `metting_link`
2. Sinon → `"En ligne"`

## API Formations (GET)

L'application charge la liste complète des formations depuis l'API au démarrage.

**Endpoint** : `/formations`

**Format de réponse attendu** :
```json
{
    "success": true,
    "message": "Formations récupérées avec succès",
    "count": 23,
    "data": [
        {
            "id": "uuid",
            "name": "BAC PRO METIERS DE LA SECURITE",
            "code": "110",
            "abrege": "BAC PRO MS",
            "status": 1
        }
    ]
}
```

**Filtrage** :
- Seules les formations avec `status: 1` sont affichées dans le formulaire d'inscription
- Le champ `name` est affiché à l'utilisateur dans la liste déroulante
- Le champ `code` est envoyé dans le POST lors de l'inscription

## Format d'Envoi des Inscriptions (POST)

L'application envoie les inscriptions au format requis par votre API ERP :

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

### Champs du Formulaire d'Inscription

| Champ Formulaire | Champ API | Description |
|------------------|-----------|-------------|
| `prenom` | `first_name` | Prénom de l'utilisateur |
| `nom` | `last_name` | Nom de famille |
| `birthday` | `birthday` | Date de naissance (format YYYY-MM-DD) |
| `email` | `email` | Adresse email |
| `telephone` | `phone` | Numéro de téléphone |
| `sexe` | `sexe` | Sexe (Male/Female/Other) - Converti automatiquement |
| `cp` | `cp` | Code postal |
| `city` | `city` | Ville |
| `formation` (select) | `formation` | Array avec le code de la formation sélectionnée |
| - | `orga` | Code de l'organisation (récupéré depuis `training_organizations[0].code`) |
| - | `source` | Statique : "Site Internet" |
| - | `origine` | Statique : "" (vide) |

### Récupération Automatique des Données

- **Formation** : L'utilisateur sélectionne une formation parmi toutes les formations disponibles chargées depuis l'API `/formations`. Seules les formations avec `status: 1` sont affichées. Le `code` de la formation sélectionnée est envoyé dans le POST.
- **Sexe** : Converti automatiquement depuis les valeurs du formulaire ("male"/"female"/"other") vers les valeurs attendues par l'API ("Male"/"Female"/"Other")
- **Organisation** : Récupéré automatiquement depuis `training_organizations[0].code` de l'événement sélectionné
- **Source** : Valeur fixe "Site Internet"
- **Origine** : Valeur fixe "" (chaîne vide)

## Exemples de Personnalisation

### Exemple 1 : Ajouter des champs supplémentaires

```javascript
const formData = {
    eventId: appState.selectedEvent.id,
    nom: document.getElementById('nom').value,
    prenom: document.getElementById('prenom').value,
    email: document.getElementById('email').value,
    telephone: document.getElementById('telephone').value,
    // Champs additionnels
    date_inscription: new Date().toISOString(),
    source: "web_app"
};
```

### Exemple 2 : Format différent pour le type d'événement

Si votre API utilise d'autres valeurs pour `format`, modifiez la fonction `mapEventFromAPI()` :

```javascript
type: apiEvent.format === 'presentiel' ? 'physique' :
      apiEvent.format === 'distanciel' ? 'visio' : 'visio'
```

## Test avec Données de Démonstration

Le fichier `app.js` contient des données de démonstration au format API ERP.
Ces données sont automatiquement converties via `mapEventFromAPI()` pour tester le mapping.

Pour désactiver les données de démo, commentez la ligne dans la fonction `loadEvents()` :

```javascript
// appState.events = getDemoEvents();
```

## Debugging

Pour vérifier le mapping, ouvrez la console du navigateur (F12) et examinez :
- Les données brutes de l'API
- Les données après mapping
- Les erreurs éventuelles de conversion

Console logs utiles :
```javascript
console.log('Données API brutes:', data);
console.log('Données mappées:', appState.events);
```
