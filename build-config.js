#!/usr/bin/env node

/**
 * Script pour générer config.js depuis le fichier .env
 *
 * Usage: node build-config.js
 */

const fs = require('fs');
const path = require('path');

// Lecture du fichier .env
function loadEnv() {
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
        console.error('❌ Erreur: Le fichier .env est introuvable');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        // Ignorer les commentaires et lignes vides
        if (line.trim() === '' || line.trim().startsWith('#')) {
            return;
        }

        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
        }
    });

    return envVars;
}

// Génération du fichier config.js
function generateConfig(envVars) {
    const useApiKey = envVars.USE_API_KEY === 'true';

    const configContent = `// Configuration de l'API
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
    API_URL_GET_EVENTS: '${envVars.API_URL_GET_EVENTS || 'https://votre-erp.com/api/events'}',
    API_URL_GET_FORMATIONS: '${envVars.API_URL_GET_FORMATIONS || 'https://votre-erp.com/api/formations'}',
    API_URL_POST_REGISTRATION: '${envVars.API_URL_POST_REGISTRATION || 'https://votre-erp.com/api/registrations'}',

    // === Authentification ===
    // Ces valeurs sont gérées automatiquement par le proxy
    API_KEY: '${envVars.API_KEY || 'votre_cle_api_ici'}',
    USE_API_KEY: ${useApiKey}
};

// Objet API avec méthodes utilitaires
const API = {
    // Retourne l'URL à utiliser pour les événements
    getEvents: () => {
        if (CONFIG.USE_PROXY) {
            return \`\${CONFIG.PROXY_URL}/api/meetings\`;
        }
        return CONFIG.API_URL_GET_EVENTS;
    },

    // Retourne l'URL à utiliser pour les formations
    getFormations: () => {
        if (CONFIG.USE_PROXY) {
            return \`\${CONFIG.PROXY_URL}/api/formations\`;
        }
        return CONFIG.API_URL_GET_FORMATIONS;
    },

    // Retourne l'URL à utiliser pour les inscriptions
    postRegistration: () => {
        if (CONFIG.USE_PROXY) {
            return \`\${CONFIG.PROXY_URL}/api/candidates\`;
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
            headers['Authorization'] = \`Bearer \${CONFIG.API_KEY}\`;
        }

        return headers;
    }
};
`;

    return configContent;
}

// Exécution
try {
    console.log('🔄 Lecture du fichier .env...');
    const envVars = loadEnv();

    console.log('⚙️  Génération de config.js...');
    const configContent = generateConfig(envVars);

    const configPath = path.join(__dirname, 'config.js');
    fs.writeFileSync(configPath, configContent, 'utf-8');

    console.log('✅ Fichier config.js généré avec succès !');
    console.log('\nConfiguration chargée:');
    console.log(`  • Événements: ${envVars.API_URL_GET_EVENTS || 'Non défini'}`);
    console.log(`  • Formations: ${envVars.API_URL_GET_FORMATIONS || 'Non défini'}`);
    console.log(`  • Inscriptions: ${envVars.API_URL_POST_REGISTRATION || 'Non défini'}`);
    console.log(`  • Authentification: ${envVars.USE_API_KEY === 'true' ? 'Activée' : 'Désactivée'}`);

} catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    process.exit(1);
}
