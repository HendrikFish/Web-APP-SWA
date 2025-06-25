const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');

// Test-App Setup
const authRoutes = require('../modules/auth/routes');
const { errorHandler } = require('../middleware/errorMiddleware');
const User = require('../models/User');

let mongoServer;
let app;

// Test-App konfigurieren
const createTestApp = () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/auth', authRoutes);
    testApp.use(errorHandler);
    return testApp;
};

describe('Authentication API', () => {
    beforeAll(async () => {
        // In-Memory MongoDB starten
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri);
        app = createTestApp();
        
        // Test-Umgebung setzen
        process.env.JWT_SECRET = 'test-secret-key';
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Datenbank vor jedem Test leeren
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('sollte einen neuen Benutzer registrieren', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'testPassword123',
                firstName: 'Test',
                lastName: 'User',
                role: 'extern'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            
            // Benutzer in DB prüfen
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            expect(user.email).toBe(userData.email);
            expect(user.isApproved).toBe(false); // Neue Benutzer sind nicht approved
        });

        it('sollte keine doppelten E-Mails erlauben', async () => {
            const userData = {
                email: 'duplicate@example.com',
                password: 'testPassword123',
                firstName: 'Test',
                lastName: 'User'
            };

            // Ersten Benutzer erstellen
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Zweiten Benutzer mit gleicher E-Mail versuchen
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('sollte Validierung für fehlende Felder durchführen', async () => {
            const incompleteData = {
                email: 'test@example.com'
                // Passwort und Name fehlen
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Approved Test-Benutzer erstellen (Passwort wird durch pre('save') gehashed)
            const approvedUser = new User({
                email: 'approved@example.com',
                password: 'testPassword123',
                firstName: 'Approved',
                lastName: 'User',
                role: 'Koch',
                isApproved: true
            });
            await approvedUser.save();

            // Nicht-approved Test-Benutzer erstellen (Passwort wird durch pre('save') gehashed)
            const pendingUser = new User({
                email: 'pending@example.com',
                password: 'testPassword123',
                firstName: 'Pending',
                lastName: 'User',
                role: 'extern',
                isApproved: false
            });
            await pendingUser.save();
        });

        it('sollte approved Benutzer einloggen', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'approved@example.com',
                    password: 'testPassword123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'approved@example.com');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('sollte nicht-approved Benutzer ablehnen', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'pending@example.com',
                    password: 'testPassword123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('genehmigt');
        });

        it('sollte falsches Passwort ablehnen', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'approved@example.com',
                    password: 'wrongPassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('sollte unbekannte E-Mail ablehnen', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'testPassword123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
}); 