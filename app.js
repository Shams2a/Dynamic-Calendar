// État de l'application
const appState = {
    events: [], // Tous les événements (parents + enfants)
    formations: [],
    selectedEvent: null,
    selectedOccurrences: [], // Toutes les occurrences d'un événement récurrent
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        await Promise.all([loadEvents(), loadFormations()]);
        renderEvents();
        renderCalendar();
        setupEventListeners();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showError('Impossible de charger les données. Veuillez réessayer.');
    }
}

// Fonction de sanitisation contre les attaques XSS
function sanitizeHTML(str) {
    if (!str) return '';

    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Sanitisation robuste pour les URLs
function sanitizeURL(url) {
    if (!url) return '#';

    // Autoriser uniquement http, https, et mailto
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    try {
        const parsed = new URL(url, window.location.origin);
        if (allowedProtocols.includes(parsed.protocol)) {
            return parsed.href;
        }
    } catch (e) {
        // URL invalide
    }
    return '#';
}

// Conversion du format de date DD/MM/YYYY vers YYYY-MM-DD
function convertDateFormat(dateStr) {
    if (!dateStr) return null;

    // Nettoyer les espaces et caractères invisibles
    const cleanedDate = dateStr.trim();

    const parts = cleanedDate.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        // Nettoyer aussi l'année qui peut contenir des espaces
        const cleanYear = year.trim();
        return `${cleanYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return cleanedDate;
}

// Récupérer les événements parents (pour affichage dans la liste)
function getParentEvents(events) {
    return events.filter(event => event.parent_id === null);
}

// Récupérer toutes les occurrences d'un événement récurrent
function getEventOccurrences(events, parentEvent) {
    if (!parentEvent.recurrence_enabled) {
        return [parentEvent];
    }

    // Trouver toutes les occurrences (enfants + parent)
    const occurrences = events.filter(event =>
        event.id === parentEvent.id || event.parent_id === parentEvent.id
    );

    // Trier par date
    return occurrences.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Obtenir le libellé de récurrence
function getRecurrenceLabel(event) {
    if (!event.recurrence_enabled || !event.periodicite) {
        return null;
    }

    const eventDate = new Date(event.date);
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = dayNames[eventDate.getDay()];

    switch (event.periodicite) {
        case 'by_week':
            return `Tous les ${dayName}s`;
        case 'by_day':
            return 'Tous les jours';
        case 'by_month':
            return 'Tous les mois';
        default:
            return 'Récurrent';
    }
}

// Mapping des données de l'API ERP vers le format de l'application
function mapEventFromAPI(apiEvent) {
    return {
        id: apiEvent.id,
        titre: apiEvent.title,
        date: convertDateFormat(apiEvent.date_start),
        heure: apiEvent.time_start ? apiEvent.time_start.substring(0, 5) : '', // Format HH:MM
        type: apiEvent.format === 'face_to_face' ? 'physique' : 'visio',
        description: apiEvent.formations && apiEvent.formations.length > 0
            ? apiEvent.formations.map(f => f.name).join(', ')
            : '',
        lieu: apiEvent.format === 'face_to_face'
            ? (apiEvent.location ||
               (apiEvent.training_organizations && apiEvent.training_organizations.length > 0
                   ? `${apiEvent.training_organizations[0].city || ''} ${apiEvent.training_organizations[0].cp || ''}`.trim()
                   : 'Non spécifié'))
            : apiEvent.metting_link || 'En ligne',
        max_person: apiEvent.max_person,
        number_participants: apiEvent.number_participants,
        // Données de récurrence
        parent_id: apiEvent.parent_id,
        recurrence_enabled: apiEvent.recurrence_enabled,
        periodicite: apiEvent.periodicite,
        // Données brutes pour le formulaire d'inscription
        formations: apiEvent.formations || [],
        training_organizations: apiEvent.training_organizations || []
    };
}

// Chargement des événements depuis l'API
async function loadEvents() {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';

    try {
        const response = await fetch(API.getEvents(), {
            method: 'GET',
            headers: API.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        const apiEvents = Array.isArray(data) ? data : (data.events || []);

        // Mapping des événements de l'API vers le format de l'application
        appState.events = apiEvents.map(mapEventFromAPI);

        loadingEl.style.display = 'none';
    } catch (error) {
        loadingEl.style.display = 'none';
        console.error('Erreur lors du chargement des événements:', error);
        showError('Impossible de charger les événements. Vérifiez la configuration de l\'API.');
        appState.events = [];
    }
}

// Chargement des formations depuis l'API
async function loadFormations() {
    try {
        const response = await fetch(API.getFormations(), {
            method: 'GET',
            headers: API.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        // L'API retourne {success, message, count, data: [...]}
        appState.formations = data.data || [];

        console.log(`${appState.formations.length} formations chargées`);
    } catch (error) {
        console.error('Erreur lors du chargement des formations:', error);
        appState.formations = [];
    }
}

// Affichage des événements
function renderEvents() {
    const eventsListEl = document.getElementById('events-list');
    eventsListEl.innerHTML = '';

    if (appState.events.length === 0) {
        eventsListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>Aucun événement disponible</h3>
                <p>Il n'y a actuellement aucune session d'admission planifiée.</p>
                <p class="empty-state-hint">Revenez consulter cette page prochainement pour découvrir nos prochaines dates.</p>
            </div>
        `;
        return;
    }

    // Afficher uniquement les événements parents
    const parentEvents = getParentEvents(appState.events);

    if (parentEvents.length === 0) {
        eventsListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>Aucun événement disponible</h3>
                <p>Il n'y a actuellement aucune session d'admission planifiée.</p>
                <p class="empty-state-hint">Revenez consulter cette page prochainement pour découvrir nos prochaines dates.</p>
            </div>
        `;
        return;
    }

    parentEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsListEl.appendChild(eventCard);
    });
}

// Formatage des formations pour l'affichage (max 2 + tooltip)
function formatFormationsDisplay(formations) {
    if (!formations || formations.length === 0) {
        return { html: '', hiddenFormations: null };
    }

    const formationNames = formations.map(f => f.name);

    if (formationNames.length <= 2) {
        return { html: formationNames.join(', '), hiddenFormations: null };
    }

    // Afficher les 2 premières + "..."
    const visibleFormations = formationNames.slice(0, 2).join(', ');
    const hiddenFormations = formationNames.slice(2);

    return {
        html: `${visibleFormations}... <span class="formations-tooltip">(+${hiddenFormations.length})</span>`,
        hiddenFormations: hiddenFormations
    };
}

// Création d'une carte d'événement
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.dataset.eventId = event.id;

    const eventDate = new Date(event.date);
    const recurrenceLabel = getRecurrenceLabel(event);

    // Pour un événement récurrent, afficher le libellé de récurrence au lieu de la date complète
    let dateDisplay;
    if (recurrenceLabel) {
        dateDisplay = `${recurrenceLabel} à ${event.heure}`;
    } else {
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateDisplay = formattedDate;
    }

    const formationsResult = event.formations && event.formations.length > 0
        ? formatFormationsDisplay(event.formations)
        : { html: event.description || '', hiddenFormations: null };

    // Badge de récurrence
    const recurrenceBadge = recurrenceLabel ? `<span class="recurrence-badge">🔁 Récurrent</span>` : '';

    // Sanitisation des données pour éviter les attaques XSS
    const sanitizedTitre = sanitizeHTML(event.titre);
    const sanitizedDateDisplay = sanitizeHTML(dateDisplay);
    const sanitizedHeure = sanitizeHTML(event.heure);
    const sanitizedLieu = sanitizeHTML(event.lieu || 'Non spécifié');
    const sanitizedType = sanitizeHTML(event.type);

    card.innerHTML = `
        <div class="event-title">${sanitizedTitre} ${recurrenceBadge}</div>
        <div class="event-details">
            <div>📅 ${sanitizedDateDisplay}</div>
            ${!recurrenceLabel ? `<div>🕐 ${sanitizedHeure}</div>` : ''}
            <div>📍 ${sanitizedLieu}</div>
            ${formationsResult.html ? `<div class="formations-line">📝 ${formationsResult.html}</div>` : ''}
        </div>
        <span class="event-type ${sanitizedType}">${sanitizedType === 'visio' ? '💻 Visio' : '🏢 Physique'}</span>
        <button class="event-register-btn">S'inscrire</button>
    `;

    // Gestionnaire de clic pour l'inscription
    const registerBtn = card.querySelector('.event-register-btn');
    registerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openRegistrationModal(event);
    });

    // Gestion du tooltip pour les formations
    if (formationsResult.hiddenFormations) {
        const tooltipSpan = card.querySelector('.formations-tooltip');
        if (tooltipSpan) {
            let tooltipElement = null;
            const hiddenFormations = formationsResult.hiddenFormations;

            tooltipSpan.addEventListener('mouseenter', (e) => {
                // Créer le tooltip
                tooltipElement = document.createElement('div');
                tooltipElement.className = 'formations-tooltip-content';
                tooltipElement.innerHTML = hiddenFormations.map(f => `<div>• ${sanitizeHTML(f)}</div>`).join('');

                document.body.appendChild(tooltipElement);

                // Positionner le tooltip
                const rect = e.target.getBoundingClientRect();
                tooltipElement.style.left = rect.left + (rect.width / 2) + 'px';
                tooltipElement.style.top = (rect.top - 10) + 'px';
            });

            tooltipSpan.addEventListener('mouseleave', () => {
                if (tooltipElement) {
                    tooltipElement.remove();
                    tooltipElement = null;
                }
            });
        }
    }

    return card;
}

// Rendu du calendrier
function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('current-month');

    // Affichage du mois courant
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    currentMonthEl.textContent = `${monthNames[appState.currentMonth]} ${appState.currentYear}`;

    // Nettoyage du calendrier
    calendarEl.innerHTML = '';

    // En-têtes des jours
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarEl.appendChild(header);
    });

    // Calcul des jours du mois
    const firstDay = new Date(appState.currentYear, appState.currentMonth, 1);
    const lastDay = new Date(appState.currentYear, appState.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajustement pour commencer le lundi (0 = dimanche, 1 = lundi, etc.)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Jours du mois précédent
    const prevMonthLastDay = new Date(appState.currentYear, appState.currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayEl = createCalendarDay(prevMonthLastDay - i, true, false);
        calendarEl.appendChild(dayEl);
    }

    // Jours du mois courant
    for (let day = 1; day <= daysInMonth; day++) {
        const eventsForDay = getEventsForDay(day);
        const dayEl = createCalendarDay(day, false, eventsForDay);
        calendarEl.appendChild(dayEl);
    }

    // Jours du mois suivant pour compléter la grille
    const totalCells = calendarEl.children.length - 7; // -7 pour les en-têtes
    const remainingCells = 42 - totalCells - 7; // Grille de 6 semaines
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createCalendarDay(day, true, false);
        calendarEl.appendChild(dayEl);
    }
}

// Création d'un jour du calendrier
function createCalendarDay(day, isOtherMonth, events) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
        return dayEl;
    }

    if (events && events.length > 0) {
        dayEl.classList.add('has-event');

        // Rendre le jour cliquable
        dayEl.style.cursor = 'pointer';

        // Créer le tooltip avec les noms des événements
        let tooltipElement = null;

        dayEl.addEventListener('mouseenter', (e) => {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'calendar-tooltip';

            const eventsList = events.map(event => {
                const sanitizedTitre = sanitizeHTML(event.titre);
                const sanitizedHeure = sanitizeHTML(event.heure);
                return `<div class="calendar-tooltip-item">
                    <strong>${sanitizedTitre}</strong>
                    <div>${sanitizedHeure}</div>
                </div>`;
            }).join('');

            tooltipElement.innerHTML = eventsList;
            document.body.appendChild(tooltipElement);

            // Positionner le tooltip
            const rect = e.target.getBoundingClientRect();
            tooltipElement.style.left = rect.left + (rect.width / 2) + 'px';
            tooltipElement.style.top = (rect.top - 10) + 'px';
        });

        dayEl.addEventListener('mouseleave', () => {
            if (tooltipElement) {
                tooltipElement.remove();
                tooltipElement = null;
            }
        });

        // Gestionnaire de clic pour ouvrir le formulaire d'inscription
        dayEl.addEventListener('click', () => {
            // Si plusieurs événements, ouvrir le premier
            // (on pourrait améliorer pour afficher une liste de choix)
            if (events.length > 0) {
                openRegistrationModal(events[0]);
            }
        });
    }

    return dayEl;
}

// Récupération des événements pour un jour donné
function getEventsForDay(day) {
    const dateToCheck = new Date(appState.currentYear, appState.currentMonth, day);

    return appState.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === dateToCheck.getDate() &&
               eventDate.getMonth() === dateToCheck.getMonth() &&
               eventDate.getFullYear() === dateToCheck.getFullYear();
    });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Navigation du calendrier
    document.getElementById('prev-month').addEventListener('click', () => {
        if (appState.currentMonth === 0) {
            appState.currentMonth = 11;
            appState.currentYear--;
        } else {
            appState.currentMonth--;
        }
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        if (appState.currentMonth === 11) {
            appState.currentMonth = 0;
            appState.currentYear++;
        } else {
            appState.currentMonth++;
        }
        renderCalendar();
    });

    // Modal
    const modal = document.getElementById('registration-modal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('.btn-cancel');

    closeBtn.addEventListener('click', closeRegistrationModal);
    cancelBtn.addEventListener('click', closeRegistrationModal);

    // Fermeture en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeRegistrationModal();
        }
    });

    // Formulaire d'inscription
    document.getElementById('registration-form').addEventListener('submit', handleRegistration);
}

// Ouverture du modal d'inscription
function openRegistrationModal(event) {
    appState.selectedEvent = event;

    // Récupérer toutes les occurrences si l'événement est récurrent
    appState.selectedOccurrences = getEventOccurrences(appState.events, event);

    const modal = document.getElementById('registration-modal');
    const eventInfoEl = document.getElementById('selected-event-info');

    const recurrenceLabel = getRecurrenceLabel(event);

    // Sanitisation pour le modal
    const sanitizedTitre = sanitizeHTML(event.titre);
    const sanitizedLieu = sanitizeHTML(event.lieu || 'Non spécifié');

    let eventInfo = `<h3>${sanitizedTitre}</h3>`;

    // Si événement récurrent, afficher le sélecteur de date
    if (recurrenceLabel && appState.selectedOccurrences.length > 1) {
        const sanitizedRecurrenceLabel = sanitizeHTML(recurrenceLabel);
        const sanitizedHeure = sanitizeHTML(event.heure);

        eventInfo += `
            <p>🔁 ${sanitizedRecurrenceLabel} de ${sanitizedHeure}</p>
            <div class="form-group">
                <label for="event-date-select">Choisissez une date :</label>
                <select id="event-date-select" required class="form-control">
                    <option value="">Sélectionnez une date...</option>
                    ${appState.selectedOccurrences.map(occ => {
                        const occDate = new Date(occ.date);
                        const formattedOccDate = occDate.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        const sanitizedOccId = sanitizeHTML(occ.id);
                        const sanitizedFormattedDate = sanitizeHTML(formattedOccDate);
                        const sanitizedOccHeure = sanitizeHTML(occ.heure);
                        return `<option value="${sanitizedOccId}">${sanitizedFormattedDate} à ${sanitizedOccHeure}</option>`;
                    }).join('')}
                </select>
            </div>
        `;
    } else {
        // Événement unique
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const sanitizedFormattedDate = sanitizeHTML(formattedDate);
        const sanitizedHeure = sanitizeHTML(event.heure);
        eventInfo += `<p>📅 ${sanitizedFormattedDate} à ${sanitizedHeure}</p>`;
    }

    const sanitizedType = sanitizeHTML(event.type);
    eventInfo += `
        <p>📍 ${sanitizedLieu}</p>
        <p>Type: ${sanitizedType === 'visio' ? '💻 Visioconférence' : '🏢 Présentiel'}</p>
    `;

    eventInfoEl.innerHTML = eventInfo;

    // Réinitialiser le formulaire
    document.getElementById('registration-form').reset();
    document.getElementById('success-message').classList.add('hidden');

    // Peupler le select des formations depuis l'API (APRÈS reset)
    const formationSelect = document.getElementById('formation');
    formationSelect.innerHTML = '<option value="">Sélectionnez une formation...</option>';

    // Filtrer uniquement les formations actives (status: 1)
    const formationsActives = appState.formations.filter(f => f.status === 1);

    if (formationsActives.length > 0) {
        formationsActives.forEach(formation => {
            const option = document.createElement('option');
            option.value = formation.code;
            option.textContent = formation.name;
            formationSelect.appendChild(option);
        });
    } else {
        formationSelect.innerHTML = '<option value="">Aucune formation disponible</option>';
    }

    modal.classList.add('show');
}

// Fermeture du modal
function closeRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    modal.classList.remove('show');
    appState.selectedEvent = null;
}

// Gestion de l'inscription
async function handleRegistration(e) {
    e.preventDefault();

    // Vérification du consentement RGPD
    const rgpdConsent = document.getElementById('rgpd-consent');
    if (!rgpdConsent.checked) {
        alert('Vous devez accepter la politique de confidentialité pour continuer.');
        return;
    }

    // Pour un événement récurrent, vérifier qu'une date est sélectionnée
    const eventDateSelect = document.getElementById('event-date-select');
    if (eventDateSelect && !eventDateSelect.value) {
        alert('Veuillez sélectionner une date pour cet événement récurrent.');
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Inscription en cours...';

    // Déterminer l'événement à utiliser pour l'inscription
    let eventToRegister = appState.selectedEvent;
    if (eventDateSelect && eventDateSelect.value) {
        // Trouver l'occurrence sélectionnée
        eventToRegister = appState.selectedOccurrences.find(occ => occ.id === eventDateSelect.value);
    }

    // Récupération de l'organisation (code) depuis l'événement sélectionné
    const orgaCode = eventToRegister.training_organizations &&
                     eventToRegister.training_organizations.length > 0
                     ? eventToRegister.training_organizations[0].code
                     : "";

    // Le sexe doit être "male" ou "female" (pas de majuscule)
    const sexeValue = document.getElementById('sexe').value;

    // Format JSON requis par l'API ERP
    const formData = {
        first_name: document.getElementById('prenom').value,
        last_name: document.getElementById('nom').value,
        birthday: document.getElementById('birthday').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('telephone').value,
        sexe: sexeValue,
        address: document.getElementById('address').value,
        cp: document.getElementById('cp').value,
        city: document.getElementById('city').value,
        formation: [document.getElementById('formation').value],
        orga: orgaCode,
        source: "SiteInternet",
        origine: ""
    };

    try {
        const response = await fetch(API.postRegistration(), {
            method: 'POST',
            headers: API.getHeaders(),
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Inscription réussie:', result);

        // Affichage du message de succès
        document.getElementById('registration-form').style.display = 'none';
        document.getElementById('success-message').classList.remove('hidden');

        setTimeout(() => {
            closeRegistrationModal();
            document.getElementById('registration-form').style.display = 'block';
        }, 3000);

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        alert('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Valider l\'inscription';
    }
}

// Affichage des erreurs
function showError(message) {
    const loadingEl = document.getElementById('loading');
    loadingEl.textContent = message;
    loadingEl.style.color = 'red';
}
