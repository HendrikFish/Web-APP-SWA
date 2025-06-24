const fs = require('fs').promises;
const path = require('path');
const User = require('../../../models/User'); // Das User-Modell für DB-Zugriff

const notificationsFilePath = path.join(__dirname, '../../../../shared/data/notifications.json');

const getUnreadNotifications = async (req, res) => {
    try {
        // 1. Alle Benachrichtigungen aus der JSON-Datei laden
        const data = await fs.readFile(notificationsFilePath, 'utf-8');
        const allNotifications = JSON.parse(data);

        // 2. Den angemeldeten Benutzer aus der Datenbank holen (req.user wird von der 'protect'-Middleware gesetzt)
        const user = await User.findById(req.user.id).select('role readNotificationIds');
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        // 3. Filtern der für den Benutzer relevanten und ungelesenen Benachrichtigungen
        const unreadNotifications = allNotifications.filter(notification => {
            const isActive = notification.active;
            const isRoleMatch = notification.targetRoles.includes(user.role);
            const isUnread = !user.readNotificationIds.includes(notification.id);
            
            return isActive && isRoleMatch && isUnread;
        });

        res.status(200).json(unreadNotifications);

    } catch (error) {
        console.error('Fehler beim Abrufen der ungelesenen Benachrichtigungen:', error);
        res.status(500).json({ message: 'Serverfehler beim Abrufen der Benachrichtigungen.' });
    }
};

module.exports = getUnreadNotifications; 