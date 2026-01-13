/**
 * Vercel Serverless Function - Inscription à un événement
 * POST /api/register
 */

// Limite de taille de la requête (50KB)
const MAX_REQUEST_SIZE = 50 * 1024;

// Validation robuste de l'email
function isValidEmail(email) {
    // RFC 5322 simplifié - rejette les emails malformés
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Validation du téléphone français (10 chiffres)
function isValidFrenchPhone(phone) {
    // Accepte: 0612345678, 06 12 34 56 78, 06-12-34-56-78, 06.12.34.56.78
    const cleaned = phone.replace(/[\s.-]/g, '');
    return /^0[1-9][0-9]{8}$/.test(cleaned);
}

// Validation de la date de naissance
function isValidBirthday(birthday) {
    if (!birthday) return false;

    const date = new Date(birthday);
    const now = new Date();

    // Vérifier que la date est valide
    if (isNaN(date.getTime())) return false;

    // Âge minimum: 16 ans
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 16);

    // Âge maximum: 100 ans
    const maxDate = new Date();
    maxDate.setFullYear(now.getFullYear() - 100);

    // La date de naissance ne peut pas être dans le futur
    if (date > now) return false;

    // Vérifier l'âge entre 16 et 100 ans
    return date <= minDate && date >= maxDate;
}

// Validation du code postal français
function isValidFrenchPostalCode(cp) {
    // Code postal français: 5 chiffres
    return /^[0-9]{5}$/.test(cp);
}

// Validation de la longueur des champs
function isValidLength(str, maxLength) {
    return typeof str === 'string' && str.length > 0 && str.length <= maxLength;
}

export default async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'evenements.ifcv.fr');
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
        // Vérification de la taille de la requête
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > MAX_REQUEST_SIZE) {
            return res.status(413).json({
                error: 'Requête trop volumineuse',
                message: 'La taille de la requête dépasse la limite autorisée'
            });
        }

        // Récupération de la clé API depuis les variables d'environnement
        const API_KEY = process.env.API_KEY;
        const API_URL = process.env.API_URL_POST_REGISTRATION;

        if (!API_KEY || !API_URL) {
            console.error('Variables d\'environnement manquantes');
            return res.status(500).json({ error: 'Configuration serveur incorrecte' });
        }

        // Validation robuste des données
        const { first_name, last_name, email, phone, birthday, sexe, address, cp, city, formation, orga, meeting_id } = req.body;

        // Vérifier les champs obligatoires
        if (!first_name || !last_name || !email || !phone || !birthday || !sexe || !address || !cp || !city) {
            return res.status(400).json({
                error: 'Données manquantes',
                message: 'Tous les champs sont obligatoires'
            });
        }

        // Vérifier que l'ID de l'événement est fourni
        if (!meeting_id) {
            return res.status(400).json({
                error: 'Événement manquant',
                message: 'L\'identifiant de l\'événement est requis'
            });
        }

        // Validation de la longueur des champs
        if (!isValidLength(first_name, 100)) {
            return res.status(400).json({ error: 'Prénom invalide' });
        }
        if (!isValidLength(last_name, 100)) {
            return res.status(400).json({ error: 'Nom invalide' });
        }
        if (!isValidLength(address, 200)) {
            return res.status(400).json({ error: 'Adresse invalide' });
        }
        if (!isValidLength(city, 100)) {
            return res.status(400).json({ error: 'Ville invalide' });
        }

        // Validation de l'email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: 'Email invalide',
                message: 'Veuillez fournir une adresse email valide'
            });
        }

        // Validation du téléphone
        if (!isValidFrenchPhone(phone)) {
            return res.status(400).json({
                error: 'Téléphone invalide',
                message: 'Veuillez fournir un numéro de téléphone français valide (10 chiffres)'
            });
        }

        // Validation de la date de naissance
        if (!isValidBirthday(birthday)) {
            return res.status(400).json({
                error: 'Date de naissance invalide',
                message: 'Vous devez avoir entre 16 et 100 ans'
            });
        }

        // Validation du code postal
        if (!isValidFrenchPostalCode(cp)) {
            return res.status(400).json({
                error: 'Code postal invalide',
                message: 'Veuillez fournir un code postal français valide (5 chiffres)'
            });
        }

        // Validation du sexe
        if (!['male', 'female'].includes(sexe)) {
            return res.status(400).json({
                error: 'Sexe invalide',
                message: 'Le sexe doit être "male" ou "female"'
            });
        }

        // ÉTAPE 1 : Créer le candidat
        // Note: meeting_id n'est PAS envoyé à l'API candidates, il est utilisé après
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
            source: req.body.source || "SiteInternet",
            origine: req.body.origine || ""
            // meeting_id est intentionnellement exclu ici
        };

        const candidateResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            },
            body: JSON.stringify(registrationData)
        });

        // Gérer les réponses de l'API
        const candidateData = await candidateResponse.json();

        // HTTP 409 = Candidat existant, mais la réponse contient quand même l'ID
        // HTTP 200/201 = Candidat créé avec succès
        if (!candidateResponse.ok && candidateResponse.status !== 409) {
            console.error(`Erreur création candidat: ${candidateResponse.status}`, candidateData);
            return res.status(candidateResponse.status).json({
                error: 'Erreur lors de l\'inscription',
                message: 'Une erreur est survenue lors de la création de votre profil'
            });
        }

        // Récupérer l'ID du candidat (nouveau ou existant)
        const candidateId = candidateData.data?.id;
        if (!candidateId) {
            console.error('ID candidat manquant dans la réponse:', candidateData);
            return res.status(500).json({
                error: 'Erreur serveur',
                message: 'Impossible de récupérer l\'identifiant du candidat'
            });
        }

        // ÉTAPE 2 : Inscrire le candidat à l'événement
        const API_BASE_URL = process.env.API_BASE_URL || 'https://groupeifcv.pyramideapp.fr/api';
        const meetingRegistrationUrl = `${API_BASE_URL}/candidate-meetings`;

        const meetingPayload = {
            meeting_id: meeting_id,
            candidate_id: candidateId,
            present: true
        };

        console.log('📍 URL inscription événement:', meetingRegistrationUrl);
        console.log('📦 Payload:', JSON.stringify(meetingPayload, null, 2));

        const meetingResponse = await fetch(meetingRegistrationUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            },
            body: JSON.stringify(meetingPayload)
        });

        if (!meetingResponse.ok) {
            const errorData = await meetingResponse.text();
            console.error(`Erreur inscription événement: ${meetingResponse.status}`, errorData);
            // Le candidat est créé mais pas inscrit à l'événement
            return res.status(207).json({
                success: true,
                warning: true,
                message: 'Profil créé mais erreur lors de l\'inscription à l\'événement',
                data: {
                    candidate: candidateData.data,
                    meetingRegistration: null
                }
            });
        }

        const meetingData = await meetingResponse.json();

        // Retourner le succès complet
        return res.status(200).json({
            success: true,
            message: 'Inscription réussie',
            data: {
                candidate: candidateData.data,
                meetingRegistration: meetingData
            }
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            message: 'Une erreur est survenue. Veuillez réessayer ultérieurement.'
        });
    }
}
