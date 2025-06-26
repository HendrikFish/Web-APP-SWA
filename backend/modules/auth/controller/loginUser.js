const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

// Hilfsfunktion zum Erstellen eines JWT
const generateToken = (id) => {
    // Stellen Sie sicher, dass eine JWT_SECRET in Ihrer .env-Datei definiert ist
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * Authentifiziert einen Benutzer anhand von E-Mail und Passwort.
 */
async function loginUser(req, res) {
    console.log('🚀 LOGIN REQUEST RECEIVED:', {
        email: req.body.email,
        hasPassword: !!req.body.password,
        JWT_SECRET: !!process.env.JWT_SECRET,
        MONGODB_URI: !!process.env.MONGODB_URI
    });

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Bitte geben Sie E-Mail und Passwort an.' 
        });
    }

    try {
        // Finde den Benutzer anhand der E-Mail
        console.log('🔍 Suche User mit Email:', email);
        const user = await User.findOne({ email });
        
        console.log('🔍 USER LOOKUP RESULT:', {
            email,
            userFound: !!user,
            userApproved: user ? user.isApproved : 'N/A',
            hashedPassword: user ? user.password.substring(0, 20) + '...' : 'N/A'
        });

        // Überprüfe, ob der Benutzer existiert UND das Passwort übereinstimmt
        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role, // Einzelne Rolle statt Array
                token: generateToken(user._id),
            });
        } else {
            // Aus Sicherheitsgründen eine generische Fehlermeldung
            res.status(401).json({ 
                success: false,
                message: 'Ungültige Anmeldedaten.' 
            });
        }
    } catch (error) {
        console.error("❌ DETAILED LOGIN ERROR:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            success: false,
            message: "Serverfehler beim Login." 
        });
    }
}

module.exports = loginUser; 