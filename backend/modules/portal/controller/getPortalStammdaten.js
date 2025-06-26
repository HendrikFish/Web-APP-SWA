const fs = require('fs').promises;
const path = require('path');

/**
 * Lädt die Portal-Stammdaten
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 */
const getPortalStammdaten = async (req, res) => {
    try {
        console.log('📊 Portal-Stammdaten werden geladen...');
        
        const stammdatenPath = path.join(__dirname, '../../../../shared/data/portal/portal-stammdaten.json');
        const menuStammdatenPath = path.join(__dirname, '../../../../shared/data/menueplaene/stammdaten.json');
        
        // Portal-Stammdaten laden
        const portalData = await fs.readFile(stammdatenPath, 'utf8');
        const portalStammdaten = JSON.parse(portalData);
        
        // Menüplan-Stammdaten für Kategorien laden
        const menuData = await fs.readFile(menuStammdatenPath, 'utf8');
        const menuStammdaten = JSON.parse(menuData);
        
        // Kategorien zu einem Object mit Icons umwandeln
        const kategorien = {};
        menuStammdaten.kategorien.forEach(kategorie => {
            kategorien[kategorie.id] = {
                name: kategorie.name,
                icon: getKategorieIcon(kategorie.id)
            };
        });
        
        // Sicherstellen, dass alle wichtigen Kategorien vorhanden sind (auch wenn nicht in stammdaten.json)
        const wichtigeKategorien = {
            'menu1': { name: 'Menü 1', icon: getKategorieIcon('menu1') },
            'menu2': { name: 'Menü 2', icon: getKategorieIcon('menu2') },
            'menu': { name: 'Hauptspeise', icon: getKategorieIcon('menu') }
        };
        
        Object.entries(wichtigeKategorien).forEach(([key, info]) => {
            if (!kategorien[key]) {
                kategorien[key] = info;
                console.log(`✅ Wichtige Kategorie hinzugefügt: ${key} -> ${info.name}`);
            }
        });
        
        // Kombinierte Stammdaten erstellen
        const combinedStammdaten = {
            ...portalStammdaten,
            kategorien: kategorien
        };
        
        console.log('✅ Portal-Stammdaten erfolgreich geladen mit', Object.keys(kategorien).length, 'Kategorien');
        console.log('📋 Verfügbare Kategorien:', Object.keys(kategorien));
        
        res.status(200).json({
            success: true,
            stammdaten: combinedStammdaten
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Portal-Stammdaten:', error);
        
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'Portal-Stammdaten nicht gefunden',
                error: 'FILE_NOT_FOUND'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Laden der Portal-Stammdaten',
            error: 'SERVER_ERROR'
        });
    }
};

/**
 * Ermittelt das bunte Emoji-Icon für eine Kategorie (wie ursprünglich)
 * @param {string} kategorieId - ID der Kategorie
 * @returns {string} Emoji-Icon
 */
function getKategorieIcon(kategorieId) {
    const iconMapping = {
        'suppe': '🍲',
        'menu1': '🍽️',
        'menu2': '🥘',
        'menu': '🍽️',
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
    
    return iconMapping[kategorieId] || '🍽️';
}

module.exports = { getPortalStammdaten };