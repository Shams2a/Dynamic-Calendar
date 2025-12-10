// Configuration de l'API
// =======================
// ⚠️  FICHIER GÉNÉRÉ AUTOMATIQUEMENT - NE PAS MODIFIER DIRECTEMENT
// Pour modifier la configuration, éditez le fichier .env puis exécutez: node build-config.js

const CONFIG = {
    // === Configuration du serveur proxy ===
    // Pour éviter les problèmes CORS, l'application passe par un proxy local
    // Le proxy ajoute automatiquement l'authentification et les headers CORS
    USE_PROXY: true,
    PROXY_URL: 'http://localhost:3001',

    // === URLs complètes des API (utilisées par le proxy) ===
    // Ces URLs sont utilisées par le serveur proxy uniquement
    // L'application front-end utilise les routes /api/* du proxy
    API_URL_GET_EVENTS: 'https://groupeifcv.pyramideapp.fr/api/meetings',
    API_URL_GET_FORMATIONS: 'https://groupeifcv.pyramideapp.fr/api/formations',
    API_URL_POST_REGISTRATION: 'https://groupeifcv.pyramideapp.fr/api/candidates',

    // === Authentification ===
    // Ces valeurs sont gérées automatiquement par le proxy
    API_KEY: 'rrQFJZQi5eFcbFrifKYIFiIsNWWUg+8ZDFg4PrNM1FmeJQvI/Kw5YR24oYZQojYztb/nGL/DhTkJGJ+gkhss',
    USE_API_KEY: true
};

// Objet API avec méthodes utilitaires
const API = {
    // Retourne l'URL à utiliser pour les événements
    getEvents: () => {
        if (CONFIG.USE_PROXY) {
            return `${CONFIG.PROXY_URL}/api/meetings`;
        }
        return CONFIG.API_URL_GET_EVENTS;
    },

    // Retourne l'URL à utiliser pour les formations
    getFormations: () => {
        if (CONFIG.USE_PROXY) {
            return `${CONFIG.PROXY_URL}/api/formations`;
        }
        return CONFIG.API_URL_GET_FORMATIONS;
    },

    // Retourne l'URL à utiliser pour les inscriptions
    postRegistration: () => {
        if (CONFIG.USE_PROXY) {
            return `${CONFIG.PROXY_URL}/api/candidates`;
        }
        return CONFIG.API_URL_POST_REGISTRATION;
    },

    // Headers par défaut pour les requêtes
    getHeaders: () => {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Si on utilise le proxy, l'authentification est gérée côté serveur
        // Sinon, on ajoute le header Authorization
        if (!CONFIG.USE_PROXY && CONFIG.USE_API_KEY) {
            headers['Authorization'] = `Bearer ${CONFIG.API_KEY}`;
        }

        return headers;
    }
};
