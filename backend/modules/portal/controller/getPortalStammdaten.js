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
        const data = await fs.readFile(stammdatenPath, 'utf8');
        const stammdaten = JSON.parse(data);
        
        console.log('✅ Portal-Stammdaten erfolgreich geladen');
        
        res.status(200).json({
            success: true,
            stammdaten: stammdaten
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

module.exports = { getPortalStammdaten }; 