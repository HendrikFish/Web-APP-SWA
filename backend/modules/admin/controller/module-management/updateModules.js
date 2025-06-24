const fs = require('fs/promises');
const path = require('path');

// Robuster Pfad, ausgehend vom Ausführungsverzeichnis des Backend-Prozesses
const modulesConfigPath = path.resolve(process.cwd(), '../shared/config/module-config.json');

/**
 * Aktualisiert die Modulkonfigurationsdatei mit den vom Admin gesendeten Daten.
 */
async function updateModules(req, res) {
    const newModulesConfig = req.body;

    // Einfache Validierung: Stellen Sie sicher, dass wir ein Array erhalten.
    if (!Array.isArray(newModulesConfig)) {
        return res.status(400).json({ message: 'Ungültiges Datenformat. Es wird ein Array von Modulen erwartet.' });
    }

    try {
        // Die Konfiguration wird formatiert (mit 4 Leerzeichen Einrückung) gespeichert, um die Lesbarkeit zu erhalten.
        const data = JSON.stringify(newModulesConfig, null, 4);
        await fs.writeFile(modulesConfigPath, data, 'utf-8');
        res.status(200).json({ message: 'Modulberechtigungen erfolgreich aktualisiert.' });
    } catch (error) {
        console.error("Fehler beim Schreiben der Modul-Konfigurationsdatei:", error);
        res.status(500).json({ message: "Serverfehler beim Aktualisieren der Modulkonfiguration." });
    }
}

module.exports = updateModules; 