/**
 * Skript zum Korrigieren der Speiseplan-Logik in bestehenden Einrichtungen
 * Sorgt dafür, dass wenn Suppe oder Dessert ausgewählt ist, automatisch auch die Hauptspeise ausgewählt wird
 */

// Simulation der API-Calls für das Beispiel
async function fixEinrichtungenSpeiseplanLogic() {
    try {
        console.log('🔧 Starte Korrektur der Speiseplan-Logik für alle Einrichtungen...');
        
        // 1. Alle Einrichtungen laden
        const response = await fetch('/api/einrichtungen');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Einrichtungen');
        }
        
        const einrichtungen = await response.json();
        console.log(`📋 ${einrichtungen.length} Einrichtungen gefunden`);
        
        let korrekturen = 0;
        let gesamtKorrekturen = 0;
        
        // 2. Jede Einrichtung prüfen und korrigieren
        for (const einrichtung of einrichtungen) {
            console.log(`\n🏢 Prüfe Einrichtung: ${einrichtung.name} (${einrichtung.kuerzel})`);
            
            let einrichtungGeaendert = false;
            const korrekturDetails = [];
            
            // Jeden Tag im Speiseplan prüfen
            Object.keys(einrichtung.speiseplan).forEach(tag => {
                const tagData = einrichtung.speiseplan[tag];
                const hatSuppe = tagData.suppe;
                const hatDessert = tagData.dessert;
                const hatHauptspeise = tagData.hauptspeise;
                
                // Wenn Suppe oder Dessert aktiv ist, aber Hauptspeise fehlt
                if ((hatSuppe || hatDessert) && !hatHauptspeise) {
                    console.log(`  📝 ${tag}: Hauptspeise automatisch hinzufügen (Suppe: ${hatSuppe}, Dessert: ${hatDessert})`);
                    einrichtung.speiseplan[tag].hauptspeise = true;
                    korrekturDetails.push(`${tag}: Hauptspeise hinzugefügt`);
                    einrichtungGeaendert = true;
                    gesamtKorrekturen++;
                }
            });
            
            // 3. Wenn Änderungen vorhanden, Einrichtung aktualisieren
            if (einrichtungGeaendert) {
                console.log(`  💾 Speichere Korrekturen für ${einrichtung.name}:`);
                korrekturDetails.forEach(detail => console.log(`    - ${detail}`));
                
                const updateResponse = await fetch(`/api/einrichtungen/${einrichtung.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(einrichtung)
                });
                
                if (!updateResponse.ok) {
                    console.error(`❌ Fehler beim Aktualisieren von ${einrichtung.name}`);
                    continue;
                }
                
                console.log(`  ✅ ${einrichtung.name} erfolgreich aktualisiert`);
                korrekturen++;
            } else {
                console.log(`  ✅ ${einrichtung.name} - keine Korrekturen nötig`);
            }
        }
        
        // 4. Zusammenfassung
        console.log(`\n📊 Korrektur abgeschlossen:`);
        console.log(`  - ${korrekturen} von ${einrichtungen.length} Einrichtungen aktualisiert`);
        console.log(`  - ${gesamtKorrekturen} Tage insgesamt korrigiert`);
        
        if (korrekturen > 0) {
            // Toast-Benachrichtigung für Benutzer
            if (typeof showToast !== 'undefined') {
                showToast(
                    `Speiseplan-Korrektur abgeschlossen`,
                    `${korrekturen} Einrichtungen mit ${gesamtKorrekturen} Korrekturen aktualisiert`,
                    'success'
                );
            }
        }
        
        return {
            einrichtungenGesamt: einrichtungen.length,
            einrichtungenKorrigiert: korrekturen,
            tageKorrigiert: gesamtKorrekturen
        };
        
    } catch (error) {
        console.error('❌ Fehler bei der Speiseplan-Korrektur:', error);
        
        if (typeof showToast !== 'undefined') {
            showToast('Fehler bei Speiseplan-Korrektur', error.message, 'error');
        }
        
        throw error;
    }
}

/**
 * Hilfsfunktion zum manuellen Ausführen der Korrektur
 * Kann in der Browser-Konsole aufgerufen werden
 */
window.fixSpeiseplanLogic = async function() {
    console.log('🚀 Manuelle Speiseplan-Korrektur gestartet...');
    try {
        const result = await fixEinrichtungenSpeiseplanLogic();
        console.log('✅ Korrektur erfolgreich abgeschlossen:', result);
        return result;
    } catch (error) {
        console.error('❌ Korrektur fehlgeschlagen:', error);
        return null;
    }
};

/**
 * Automatische Korrektur beim Laden des Einrichtungs-Moduls
 * Wird nur einmal ausgeführt, um bestehende Daten zu korrigieren
 */
export async function autoFixSpeiseplanOnLoad() {
    // Prüfe ob eine automatische Korrektur schon durchgeführt wurde
    const hasAutoFixed = localStorage.getItem('speiseplan-auto-fix-completed');
    
    if (!hasAutoFixed) {
        console.log('🔄 Führe einmalige automatische Speiseplan-Korrektur durch...');
        
        try {
            const result = await fixEinrichtungenSpeiseplanLogic();
            
            // Markiere als abgeschlossen
            localStorage.setItem('speiseplan-auto-fix-completed', new Date().toISOString());
            console.log('✅ Automatische Korrektur abgeschlossen und markiert');
            
            return result;
        } catch (error) {
            console.warn('⚠️ Automatische Korrektur fehlgeschlagen - wird beim nächsten Laden erneut versucht');
            return null;
        }
    } else {
        console.log('✅ Automatische Speiseplan-Korrektur bereits durchgeführt am:', hasAutoFixed);
        return null;
    }
}

/**
 * Reset-Funktion für Entwicklung/Test-Zwecke
 */
window.resetAutoFixFlag = function() {
    localStorage.removeItem('speiseplan-auto-fix-completed');
    console.log('🔄 Auto-Fix Flag zurückgesetzt - Korrektur wird beim nächsten Laden erneut ausgeführt');
};

// Export für manuelle Nutzung
export { fixEinrichtungenSpeiseplanLogic }; 