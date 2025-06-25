// In dieser Datei werden die Pfade für die Menüplan-API und Daten definiert.

export const menueplanPaths = {
    api: {
        getPlan: (year, week) => `/api/menueplan/${year}/${week}`,
        savePlan: (year, week) => `/api/menueplan/${year}/${week}`,
        updateSnapshot: (year, week) => `/api/menueplan/${year}/${week}/snapshot`,
    },
    data: {
        stammdaten: '/shared/data/menueplaene/stammdaten.json'
    }
}; 