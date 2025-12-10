/**
 * Vercel Serverless Function - Inscription à un événement
 * POST /api/register
 */

export default async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Gestion de la requête OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Vérifier que c'est une requête POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Récupération de la clé API depuis les variables d'environnement
        const API_KEY = process.env.API_KEY;
        const API_URL = process.env.API_URL_POST_REGISTRATION;

        if (!API_KEY || !API_URL) {
            console.error('Variables d\'environnement manquantes');
            return res.status(500).json({ error: 'Configuration serveur incorrecte' });
        }

        // Validation basique des données
        const { first_name, last_name, email, phone, birthday, sexe, address, cp, city, formation, orga } = req.body;

        if (!first_name || !last_name || !email || !phone) {
            return res.status(400).json({
                error: 'Données manquantes',
                message: 'Les champs nom, prénom, email et téléphone sont obligatoires'
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email invalide',
                message: 'Veuillez fournir une adresse email valide'
            });
        }

        // Validation du sexe
        if (sexe && !['male', 'female'].includes(sexe)) {
            return res.status(400).json({
                error: 'Sexe invalide',
                message: 'Le sexe doit être "male" ou "female"'
            });
        }

        // Préparer les données pour l'API ERP
        const registrationData = {
            first_name,
            last_name,
            birthday,
            email,
            phone,
            sexe,
            address,
            cp,
            city,
            formation,
            orga,
            source: req.body.source || "Site Internet",
            origine: req.body.origine || ""
        };

        // Appel à l'API ERP
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Erreur API ERP: ${response.status}`, errorData);
            return res.status(response.status).json({
                error: 'Erreur lors de l\'inscription',
                message: 'Une erreur est survenue lors de l\'enregistrement de votre inscription'
            });
        }

        const data = await response.json();

        // Retourner le succès
        return res.status(200).json({
            success: true,
            message: 'Inscription réussie',
            data: data
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            message: error.message
        });
    }
}
