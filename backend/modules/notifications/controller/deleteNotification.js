const fs = require('fs').promises;
const path = require('path');

const notificationsFilePath = path.join(__dirname, '../../../../shared/data/notifications.json');

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await fs.readFile(notificationsFilePath, 'utf-8');
        let notifications = JSON.parse(data);

        const filteredNotifications = notifications.filter(n => n.id !== id);

        if (notifications.length === filteredNotifications.length) {
            return res.status(404).json({ message: 'Benachrichtigung nicht gefunden.' });
        }

        await fs.writeFile(notificationsFilePath, JSON.stringify(filteredNotifications, null, 2), 'utf-8');

        res.status(200).json({ message: 'Benachrichtigung erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Fehler beim Löschen der Benachrichtigung:', error);
        res.status(500).json({ message: 'Fehler auf dem Server beim Löschen der Benachrichtigung.' });
    }
};

module.exports = deleteNotification; 