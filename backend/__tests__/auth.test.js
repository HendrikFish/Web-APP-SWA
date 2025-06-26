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
        // Timeout für CI-Umgebung erhöhen
        jest.setTimeout(30000);
        
        // In-Memory MongoDB starten
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Robustere Verbindung mit Retry-Logic
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        // Warten bis Verbindung wirklich bereit ist
        await mongoose.connection.db.admin().ping();
        
        app = createTestApp();
        
        // Test-Umgebung setzen
        process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
        process.env.NODE_ENV = 'test';
        
        // JWT_SECRET prüfen
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET ist nicht gesetzt für Tests');
        }
        console.log('JWT_SECRET für Tests gesetzt:', process.env.JWT_SECRET.substring(0, 10) + '...');
    }, 30000);

    afterAll(async () => {
        // Graceful shutdown
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    }, 30000);

    beforeEach(async () => {
        // Datenbank vor jedem Test leeren und warten bis fertig
        await User.deleteMany({});
        
        // Sicherstellen dass Löschvorgang abgeschlossen ist
        const count = await User.countDocuments();
        expect(count).toBe(0);
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
            
            // Prüfen dass Passwort gehashed wurde
            const savedApprovedUser = await User.findOne({ email: 'approved@example.com' });
            if (savedApprovedUser.password === 'testPassword123') {
                throw new Error('Passwort wurde nicht gehashed für approved user');
            }

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
            
            // Prüfen dass Passwort gehashed wurde
            const savedPendingUser = await User.findOne({ email: 'pending@example.com' });
            if (savedPendingUser.password === 'testPassword123') {
                throw new Error('Passwort wurde nicht gehashed für pending user');
            }
        });

        it('sollte approved Benutzer einloggen', async () => {
            // Vorher prüfen dass der User wirklich existiert und approved ist
            const existingUser = await User.findOne({ email: 'approved@example.com' });
            expect(existingUser).toBeTruthy();
            expect(existingUser.isApproved).toBe(true);
            
            // Password-Matching testen (Debug für CI)
            const passwordMatches = await existingUser.matchPassword('testPassword123');
            if (!passwordMatches) {
                console.log('PASSWORD MISMATCH DEBUG:');
                console.log('Stored password hash:', existingUser.password);
                console.log('Password match result:', passwordMatches);
                throw new Error('Password matching failed in test setup');
            }
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'approved@example.com',
                    password: 'testPassword123'
                });

            // Debug info für CI
            if (response.status !== 200) {
                console.log('Login failed. Status:', response.status);
                console.log('Response body:', JSON.stringify(response.body, null, 2));
                console.log('User in DB:', JSON.stringify(existingUser, null, 2));
            }

            expect(response.status).toBe(200);
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