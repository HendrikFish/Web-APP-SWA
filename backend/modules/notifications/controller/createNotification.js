const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Zur Erzeugung eindeutiger IDs

const notificationsFilePath = path.join(__dirname, '../../../../shared/data/notifications.json');

const createNotification = async (req, res) => {
    try {
        const { title, message, trigger, triggerValue, targetRoles, active } = req.body;

        if (!title || !message || !trigger || !targetRoles) {
            return res.status(400).json({ message: 'Fehlende erforderliche Felder.' });
        }
        
        const newNotification = {
            id: uuidv4(),
            title,
            message,
            trigger,
            triggerValue: triggerValue || null,
            targetRoles,
            active: active !== undefined ? active : true,
            createdAt: new Date().toISOString()
        };

        const data = await fs.readFile(notificationsFilePath, 'utf-8');
        const notifications = JSON.parse(data);
        
        notifications.push(newNotification);

        await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2), 'utf-8');

        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Fehler beim Erstellen der Benachrichtigung:', error);
        res.status(500).json({ message: 'Fehler auf dem Server beim Erstellen der Benachrichtigung.' });
    }
};

module.exports = createNotification; 