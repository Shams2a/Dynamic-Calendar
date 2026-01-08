#!/usr/bin/env node

/**
 * Serveur Proxy pour contourner les problèmes CORS
 *
 * Ce serveur agit comme intermédiaire entre votre application web
 * et l'API ERP, en ajoutant les headers CORS nécessaires.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration du port
const PORT = 3001;

// Chargement de la configuration depuis .env
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ Erreur: Le fichier .env est introuvable');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
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

const ENV = loadEnv();

// Mapping des routes locales vers les API externes
const API_ROUTES = {
    '/api/meetings': ENV.API_URL_GET_EVENTS,
    '/api/formations': ENV.API_URL_GET_FORMATIONS,
    '/api/candidates': ENV.API_URL_POST_REGISTRATION
};

// Types MIME pour les fichiers statiques
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Fonction pour faire une requête proxy vers l'API
function proxyRequest(targetUrl, method, requestBody, callback) {
    const url = new URL(targetUrl);
    const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // L'API utilise juste la clé sans "Bearer"
            'Authorization': ENV.API_KEY
        }
    };

    console.log(`   → Requête vers: ${url.hostname}${url.pathname}`);

    if (requestBody && method !== 'GET') {
        options.headers['Content-Length'] = Buffer.byteLength(requestBody);
    }

    const protocol = url.protocol === 'https:' ? https : http;

    const proxyReq = protocol.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            console.log(`   ← Réponse: ${proxyRes.statusCode}`);
            if (proxyRes.statusCode !== 200) {
                console.log(`   ⚠️  Erreur: ${data.substring(0, 200)}`);
            }
            callback(null, {
                statusCode: proxyRes.statusCode,
                headers: proxyRes.headers,
                body: data
            });
        });
    });

    proxyReq.on('error', (error) => {
        callback(error);
    });

    if (requestBody && method !== 'GET') {
        proxyReq.write(requestBody);
    }

    proxyReq.end();
}

// Fonction pour servir les fichiers statiques
function serveStaticFile(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// Création du serveur
const server = http.createServer((req, res) => {
    // Ajout des headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Gestion des requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${req.method} ${req.url}`);

    // Vérification si c'est une route API
    const apiRoute = API_ROUTES[req.url.split('?')[0]];

    if (apiRoute) {
        // Récupération du body pour les requêtes POST
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            proxyRequest(apiRoute, req.method, body, (error, response) => {
                if (error) {
                    console.error('❌ Erreur proxy:', error.message);
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erreur de connexion à l\'API' }));
                    return;
                }

                res.writeHead(response.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(response.body);
            });
        });
    } else {
        // Servir les fichiers statiques
        let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

        // Sécurité : empêcher l'accès aux fichiers en dehors du dossier
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        serveStaticFile(filePath, res);
    }
});

// Démarrage du serveur
server.listen(PORT, () => {
    console.log('🚀 Serveur proxy démarré !\n');
    console.log(`   URL locale: http://localhost:${PORT}\n`);
    console.log('Configuration API:');
    console.log(`   • Événements: ${ENV.API_URL_GET_EVENTS}`);
    console.log(`   • Formations: ${ENV.API_URL_GET_FORMATIONS}`);
    console.log(`   • Inscriptions: ${ENV.API_URL_POST_REGISTRATION}`);
    console.log(`   • Authentification: ${ENV.USE_API_KEY === 'true' ? '✓ Activée' : '✗ Désactivée'}\n`);
    console.log('Le proxy contourne automatiquement les problèmes CORS.');
    console.log('Appuyez sur Ctrl+C pour arrêter le serveur.\n');
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n\n👋 Arrêt du serveur proxy...');
    server.close(() => {
        console.log('✓ Serveur arrêté');
        process.exit(0);
    });
});
