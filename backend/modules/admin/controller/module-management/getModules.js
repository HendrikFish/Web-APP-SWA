const fs = require('fs/promises');
const path = require('path');

// Robuster Pfad, ausgehend vom Ausführungsverzeichnis des Backend-Prozesses
const modulesConfigPath = path.resolve(process.cwd(), '../shared/config/module-config.json');

/**
 * Liest die Modulkonfiguration und sendet sie als JSON-Antwort.
 */
async function getModules(req, res) {
    try {
        const data = await fs.readFile(modulesConfigPath, 'utf-8');
        const modules = JSON.parse(data);
        res.status(200).json(modules);
    } catch (error) {
        console.error("Fehler beim Lesen der Modul-Konfigurationsdatei:", error);
        res.status(500).json({ message: "Serverfehler beim Abrufen der Modulkonfiguration." });
    }
}

module.exports = getModules;