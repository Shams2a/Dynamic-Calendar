/**
 * Vercel Serverless Function - Récupération des événements
 * GET /api/events
 */

export default async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'evenements.ifcv.fr');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Gestion de la requête OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Vérifier que c'est une requête GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Récupération de la clé API depuis les variables d'environnement
        const API_KEY = process.env.API_KEY;
        const API_URL = process.env.API_URL_GET_EVENTS;

        if (!API_KEY || !API_URL) {
            console.error('Variables d\'environnement manquantes');
            return res.status(500).json({ error: 'Configuration serveur incorrecte' });
        }

        // Appel à l'API ERP
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            }
        });

        if (!response.ok) {
            console.error(`Erreur API ERP: ${response.status}`);
            return res.status(response.status).json({
                error: 'Erreur lors de la récupération des événements'
            });
        }

        const data = await response.json();

        // Retourner les données
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            message: error.message
        });
    }
}
