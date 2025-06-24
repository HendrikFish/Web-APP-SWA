/*
 * Siehe _FUNKTIONSWEISE.md für weitere Informationen zu diesem Feature.
 *
 * Verantwortlich für die Darstellung der Admin-Sidebar-Navigation.
 */

/**
 * Rendert die Sidebar-Navigation.
 * @param {HTMLElement} container - Das DOM-Element der Sidebar.
 * @param {Array<object>} features - Die Liste der zu rendernden Features aus der Config.
 * @param {number} pendingCount - Die Anzahl der ausstehenden Benutzergenehmigungen.
 * @param {Function} onNavigate - Callback-Funktion, die mit der Feature-ID aufgerufen wird, wenn ein Link geklickt wird.
 */
export function renderAdminNavigation(container, features, pendingCount, onNavigate) {
    if (!container) return;

    const navList = document.createElement('ul');
    navList.className = 'nav nav-pills flex-column mb-auto';

    features.forEach((feature, index) => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        const link = document.createElement('a');
        link.href = `#${feature.id}`;
        // Setzt den ersten Link standardmäßig als aktiv
        link.className = index === 0 ? 'nav-link active' : 'nav-link text-dark';
        link.dataset.featureId = feature.id;
        
        let featureName = feature.name;
        // Wenn es das "user-approval"-Feature ist und Anfragen ausstehen, Badge hinzufügen
        if (feature.id === 'user-approval' && pendingCount > 0) {
            featureName += ` <span class="badge bg-danger rounded-pill ms-auto">${pendingCount}</span>`;
        }

        // Fügt das Icon aus der Konfiguration hinzu.
        link.innerHTML = `<i class="bi ${feature.icon} me-2"></i>${featureName}`;

        li.appendChild(link);
        navList.appendChild(li);
    });

    container.innerHTML = '';
    container.appendChild(navList);

    // Event-Listener für die Navigation
    container.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;
        
        event.preventDefault();

        // Alle Links de-aktivieren
        container.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        container.querySelectorAll('a').forEach(a => a.classList.add('text-dark'));
        
        // Geklickten Link aktivieren
        link.classList.add('active');
        link.classList.remove('text-dark');
        
        const featureId = link.dataset.featureId;
        onNavigate(featureId);
    });
} 