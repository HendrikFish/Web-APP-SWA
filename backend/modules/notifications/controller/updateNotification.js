const fs = require('fs').promises;
const path = require('path');

const notificationsFilePath = path.join(__dirname, '../../../../shared/data/notifications.json');

const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const data = await fs.readFile(notificationsFilePath, 'utf-8');
        let notifications = JSON.parse(data);

        const index = notifications.findIndex(n => n.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Benachrichtigung nicht gefunden.' });
        }

        // Stelle sicher, dass die ID nicht überschrieben wird
        updatedData.id = id;
        notifications[index] = { ...notifications[index], ...updatedData };

        await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2), 'utf-8');

        res.status(200).json(notifications[index]);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Benachrichtigung:', error);
        res.status(500).json({ message: 'Fehler auf dem Server beim Aktualisieren der Benachrichtigung.' });
    }
};

module.exports = updateNotification; 