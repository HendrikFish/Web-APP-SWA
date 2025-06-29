const fs = require('fs').promises;
const path = require('path');
const User = require('../../../models/User'); // User-Modell importieren

const notificationsFilePath = path.join(__dirname, '../../../../shared/data/admin_notification/notifications.json');

const getAllNotifications = async (req, res) => {
    try {
        // 1. Lade sowohl Benachrichtigungen als auch alle Benutzer parallel
        const notificationsData = await fs.readFile(notificationsFilePath, 'utf-8');
        const notifications = JSON.parse(notificationsData);
        const allUsers = await User.find({});

        // 2. Erweitere jede Benachrichtigung um den berechneten Status
        const processedNotifications = notifications.map(notification => {
            let status = notification.active ? 'Aktiv' : 'Inaktiv';

            // Prüfe nur "einmalige" Benachrichtigungen auf den Empfangsstatus
            if (notification.trigger === 'once' && notification.active) {
                // Finde alle Benutzer, die diese Benachrichtigung erhalten sollten
                const targetUsers = allUsers.filter(user => 
                    notification.targetRoles.includes(user.role)
                );

                if (targetUsers.length > 0) {
                    // Prüfe, ob ALLE Zielbenutzer die Benachrichtigung gelesen haben
                    const allHaveRead = targetUsers.every(user => 
                        user.readNotificationIds.includes(notification.id)
                    );

                    if (allHaveRead) {
                        status = 'Empfangen';
                    }
                }
            }
            // Füge den Status als neues Feld hinzu (oder überschreibe bestehendes)
            return { ...notification, status };
        });

        res.status(200).json(processedNotifications);
    } catch (error) {
        console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
        res.status(500).json({ message: 'Fehler auf dem Server beim Abrufen der Benachrichtigungen.' });
    }
};

module.exports = getAllNotifications; 