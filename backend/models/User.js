const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Dieses Schema spiegelt die tatsächliche Struktur Ihrer MongoDB-Benutzerdokumente wider.
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Eine E-Mail-Adresse ist erforderlich.'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Bitte geben Sie eine gültige E-Mail-Adresse an.']
    },
    password: {
        type: String,
        required: [true, 'Ein Passwort ist erforderlich.'],
    },
    firstName: {
        type: String,
        required: [true, 'Ein Vorname ist erforderlich.'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Ein Nachname ist erforderlich.'],
        trim: true
    },
    role: {
        type: String,
        enum: [
            'admin',
            'co-admin',
            'Koch',
            'Service',
            'Stock',
            'Schule',
            'Kindergarten',
            'LH',
            'TZ',
            'ER',
            'extern'
        ],
        default: 'extern'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    readNotificationIds: {
        type: [String],
        default: []
    },
    einrichtungen: {
        type: [String],
        default: [],
        validate: {
            validator: function(einrichtungIds) {
                // Validierung dass alle IDs gültige UUIDs sind
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return einrichtungIds.every(id => uuidRegex.test(id));
            },
            message: 'Invalid einrichtung ID format'
        }
    },
    customFields: {
        type: Map,
        of: String
    }
    // Andere Felder aus Ihren Beispieldaten (phoneNumber, employer, etc.) 
    // können bei Bedarf hier hinzugefügt werden.
}, {
    timestamps: true // Fügt `createdAt` und `updatedAt` hinzu
});

// Virtuelles Feld für den vollständigen Namen hinzufügen
userSchema.virtual('name').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Sicherstellen, dass virtuelle Felder bei der Umwandlung in JSON berücksichtigt werden
userSchema.set('toJSON', {
  virtuals: true,
});

// Diese Middleware bleibt unverändert und ist entscheidend für die Sicherheit.
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Hinzufügen einer Methode zum Vergleichen von Passwörtern
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 