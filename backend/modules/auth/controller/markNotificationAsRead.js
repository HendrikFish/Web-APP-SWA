const User = require('../../../models/User');

const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body;

        if (!notificationId) {
            return res.status(400).json({ message: 'notificationId ist erforderlich.' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { readNotificationIds: notificationId } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        res.status(200).json({ message: 'Benachrichtigung als gelesen markiert.' });
    } catch (error) {
        console.error('Fehler beim Markieren der Benachrichtigung als gelesen:', error);
        res.status(500).json({ message: 'Serverfehler.' });
    }
};

module.exports = markNotificationAsRead; 