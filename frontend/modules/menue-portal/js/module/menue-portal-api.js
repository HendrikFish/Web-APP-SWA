// menue-portal-api.js - API-Funktionen für das Menü-Portal
// Verwaltet alle Kommunikation mit dem Backend

/**
 * Initialisiert die Menü-Portal API
 */
export function initMenuePortalAPI() {
    console.log('🔗 Menü-Portal API initialisiert');
}

/**
 * Lädt Portal-Stammdaten
 * @returns {Promise<{success: boolean, stammdaten?: object, message?: string}>}
 */
export async function loadPortalStammdaten() {
    try {
        const response = await fetch('/api/portal/stammdaten', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Fehler beim Laden der Portal-Stammdaten');
        }
        
        return {
            success: true,
            stammdaten: data.stammdaten
        };
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Portal-Stammdaten:', error);
        return {
            success: false,
            message: 'Fehler beim Laden der Portal-Stammdaten'
        };
    }
}

/**
 * Lädt einen Menüplan für eine bestimmte Einrichtung
 * @param {string} einrichtungId - ID der Einrichtung
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Promise<{success: boolean, menuplan?: object, einrichtung?: object, message?: string}>}
 */
export async function loadMenuplan(einrichtungId, year, week) {
    try {
        console.log(`📅 Lade Menüplan: Einrichtung ${einrichtungId}, KW ${week}/${year}`);
        
        const response = await fetch(`/api/menueplan?einrichtung=${einrichtungId}&year=${year}&week=${week}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Prüfe ob es sich um eine Fehlermeldung handelt
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Menüplan strukturieren und validieren
        const menuplan = validateAndStructureMenuplan(data, year, week);
        const recipeCount = countRecipes(menuplan);
        
        console.log(`✅ Menüplan geladen: ${recipeCount} Rezepte für ${data.einrichtung?.name || 'Unbekannte Einrichtung'}`);
        
        return {
            success: true,
            menuplan: menuplan,
            einrichtung: data.einrichtung
        };
        
    } catch (error) {
        console.error('❌ Fehler beim Laden des Menüplans:', error);
        return {
            success: false,
            message: 'Fehler beim Laden des Menüplans. Bitte versuchen Sie es erneut.'
        };
    }
}

/**
 * Lädt Rezept-Details für eine Liste von Rezept-IDs
 * @param {string[]} rezeptIds - Array von Rezept-IDs
 * @returns {Promise<{success: boolean, rezepte?: object[], message?: string}>}
 */
export async function loadRezepte(rezeptIds) {
    try {
        if (!rezeptIds || rezeptIds.length === 0) {
            return {
                success: true,
                rezepte: []
            };
        }
        
        console.log(`🍽️ Lade ${rezeptIds.length} Rezept(e)...`);
        
        const response = await fetch('/api/rezepte', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const allRezepte = await response.json();
        
        // Nur angeforderte Rezepte filtern
        const requestedRezepte = allRezepte.filter(rezept => 
            rezeptIds.includes(rezept.id)
        );
        
        console.log(`✅ ${requestedRezepte.length} Rezept(e) geladen`);
        
        return {
            success: true,
            rezepte: requestedRezepte
        };
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Rezepte:', error);
        return {
            success: false,
            message: 'Fehler beim Laden der Rezepte'
        };
    }
}

/**
 * Erstellt einen leeren Menüplan für eine bestimmte KW
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {object} Leerer Menüplan
 */
function createEmptyMenuplan(year, week) {
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const categories = ['suppe', 'menu1', 'menu2', 'dessert', 'abend'];
    
    const menuplan = {
        id: `${year}-${week}`,
        year: year,
        week: week,
        days: {}
    };
    
    days.forEach(day => {
        menuplan.days[day] = {};
        categories.forEach(category => {
            menuplan.days[day][category] = [];
        });
    });
    
    return menuplan;
}

/**
 * Validiert und strukturiert einen Menüplan
 * @param {object} rawMenuplan - Roher Menüplan von der API
 * @param {number} year - Erwartetes Jahr
 * @param {number} week - Erwartete KW
 * @returns {object} Strukturierter Menüplan
 */
function validateAndStructureMenuplan(rawMenuplan, year, week) {
    // Fallback für leeren/ungültigen Menüplan
    if (!rawMenuplan || !rawMenuplan.menuplan || !rawMenuplan.menuplan.days) {
        return createEmptyMenuplan(year, week);
    }
    
    const actualMenuplan = rawMenuplan.menuplan;
    const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    
    // Ermittle sichtbare Kategorien aus den tatsächlichen Daten
    const categories = new Set();
    days.forEach(day => {
        if (actualMenuplan.days[day] && actualMenuplan.days[day].Mahlzeiten) {
            Object.keys(actualMenuplan.days[day].Mahlzeiten).forEach(cat => {
                categories.add(cat);
            });
        }
    });
    
    const categoryArray = Array.from(categories);
    
    const menuplan = {
        id: actualMenuplan.id || `${year}-${week}`,
        year: actualMenuplan.year || year,
        week: actualMenuplan.week || week,
        einrichtungstyp: rawMenuplan.einrichtung?.isIntern ? 'intern' : 'extern',
        sichtbare_kategorien: categoryArray,
        kategorien: rawMenuplan.kategorien || {},
        isPlaceholder: rawMenuplan.isPlaceholder || false,
        days: {}
    };
    
    // Jeden Tag strukturieren
    days.forEach(day => {
        menuplan.days[day] = {};
        
        categoryArray.forEach(category => {
            // Bestehende Rezepte aus Mahlzeiten übernehmen oder leeres Array
            if (actualMenuplan.days[day] && 
                actualMenuplan.days[day].Mahlzeiten && 
                Array.isArray(actualMenuplan.days[day].Mahlzeiten[category])) {
                menuplan.days[day][category] = actualMenuplan.days[day].Mahlzeiten[category];
            } else {
                menuplan.days[day][category] = [];
            }
        });
    });
    
    return menuplan;
}

/**
 * Zählt die Gesamtanzahl der Rezepte in einem Menüplan
 * @param {object} menuplan - Der zu zählende Menüplan
 * @returns {number} Anzahl der Rezepte
 */
function countRecipes(menuplan) {
    let count = 0;
    const days = Object.keys(menuplan.days || {});
    
    days.forEach(day => {
        const categories = Object.keys(menuplan.days[day] || {});
        categories.forEach(category => {
            const recipes = menuplan.days[day][category] || [];
            count += recipes.length;
        });
    });
    
    return count;
}

/**
 * Extrahiert alle einzigartigen Rezept-IDs aus einem Menüplan
 * @param {object} menuplan - Der Menüplan
 * @returns {string[]} Array von Rezept-IDs
 */
export function extractRecipeIds(menuplan) {
    const recipeIds = new Set();
    const days = Object.keys(menuplan.days || {});
    
    days.forEach(day => {
        const categories = Object.keys(menuplan.days[day] || {});
        categories.forEach(category => {
            const recipes = menuplan.days[day][category] || [];
            recipes.forEach(recipe => {
                if (recipe && recipe.id) {
                    recipeIds.add(recipe.id);
                }
            });
        });
    });
    
    return Array.from(recipeIds);
}

/**
 * Hilfsfunktion: Berechnet den aktuellen Montag einer Kalenderwoche
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Date} Montag der angegebenen KW
 */
export function getMondayOfWeek(year, week) {
    // 4. Januar ist immer in KW 1
    const jan4 = new Date(year, 0, 4);
    const daysToMonday = 1 - jan4.getDay() || -6; // Montag = 1
    const firstMonday = new Date(jan4.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
    
    // Gewünschte KW berechnen
    const targetMonday = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    
    return targetMonday;
}

/**
 * Hilfsfunktion: Formatiert Datum für die Anzeige
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} Formatiertes Datum (DD.MM.YYYY)
 */
export function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Hilfsfunktion: Gibt den deutschen Wochentag zurück
 * @param {string} dayKey - Der Tagesschlüssel (montag, dienstag, ...)
 * @returns {string} Deutscher Tagesname
 */
export function getDayName(dayKey) {
    const dayNames = {
        'montag': 'Montag',
        'dienstag': 'Dienstag',
        'mittwoch': 'Mittwoch',
        'donnerstag': 'Donnerstag',
        'freitag': 'Freitag',
        'samstag': 'Samstag',
        'sonntag': 'Sonntag'
    };
    
    return dayNames[dayKey] || dayKey;
}

/**
 * Hilfsfunktion: Gibt den deutschen Kategorienamen zurück
 * @param {string} categoryKey - Der Kategorieschlüssel (suppe, menu1, ...)
 * @param {object} stammdaten - Portal-Stammdaten (optional)
 * @returns {string} Deutsche Kategorienbezeichnung
 */
export function getCategoryName(categoryKey, stammdaten = null) {
    // Zuerst aus Stammdaten versuchen
    if (stammdaten?.kategorie_namen?.namen?.[categoryKey]) {
        return stammdaten.kategorie_namen.namen[categoryKey];
    }
    
    // Fallback-Namen
    const categoryNames = {
        'suppe': 'Suppe',
        'menu1': 'Menü 1',
        'menu2': 'Menü 2',
        'menu': 'Menü', // Vereinte Kategorie für externe Einrichtungen
        'dessert': 'Dessert',
        'abend': 'Abendessen',
        'abend-suppe': 'Abend-Suppe',
        'milchspeise': 'Milchspeise',
        'normalkost': 'Normalkost',
        'kalte-platte': 'Kalte Platte',
        'wurstbrot-toast': 'Wurstbrot (Toast)',
        'wurstbrot-schwarzbrot': 'Wurstbrot (Schwarzbrot)',
        'kaesebrot-toast': 'Käsebrot (Toast)',
        'kaesebrot-schwarzbrot': 'Käsebrot (Schwarzbrot)'
    };
    
    return categoryNames[categoryKey] || categoryKey;
}

/**
 * Hilfsfunktion: Gibt das Kategorie-Icon zurück
 * @param {string} categoryKey - Der Kategorieschlüssel
 * @param {object} stammdaten - Portal-Stammdaten (optional)
 * @returns {string} Emoji-Icon für die Kategorie
 */
export function getCategoryIcon(categoryKey, stammdaten = null) {
    // Zuerst aus Stammdaten versuchen
    if (stammdaten?.kategorie_icons?.icons?.[categoryKey]) {
        return stammdaten.kategorie_icons.icons[categoryKey];
    }
    
    // Fallback-Icons
    const categoryIcons = {
        'suppe': '🍲',
        'menu1': '🍽️',
        'menu2': '🥘',
        'menu': '🍽️', // Vereinte Kategorie für externe Einrichtungen
        'dessert': '🍰',
        'abend': '🍴',
        'abend-suppe': '🍲',
        'milchspeise': '🥛',
        'normalkost': '🥗',
        'kalte-platte': '🧀',
        'wurstbrot-toast': '🥪',
        'wurstbrot-schwarzbrot': '🥖',
        'kaesebrot-toast': '🧀',
        'kaesebrot-schwarzbrot': '🧀'
    };
    
    return categoryIcons[categoryKey] || '🍽️';
} 