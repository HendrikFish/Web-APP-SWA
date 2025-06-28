const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Test-App Setup
const informationenRoutes = require('../modules/informationen/routes');
const { errorHandler } = require('../middleware/errorMiddleware');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

let mongoServer;
let app;
let testUser;
let authToken;

// Test-Daten-Pfad
const testDataPath = path.join(__dirname, '../shared/data/portal/informationen/test');

// Mock für protect Middleware - vereinfacht für Tests
const mockProtect = (req, res, next) => {
    req.user = testUser;
    next();
};

// Test-App konfigurieren
const createTestApp = () => {
    const testApp = express();
    testApp.use(express.json());
    
    // Mock-Middleware für Authentifizierung in Tests
    testApp.use('/api/informationen', mockProtect, informationenRoutes);
    testApp.use(errorHandler);
    return testApp;
};

describe('🧪 Informationssystem API Tests', () => {
    beforeAll(async () => {
        jest.setTimeout(30000);
        
        // WICHTIG: Produktions-MongoDB-Verbindung trennen falls vorhanden
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        
        // In-Memory MongoDB starten (komplett isoliert von Produktion)
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferCommands: true,
        });
        
        await mongoose.connection.db.admin().ping();
        
        app = createTestApp();
        
        // Test-Umgebung setzen (ISOLIERT von Produktion)
        process.env.JWT_SECRET = 'test-secret-key-for-informationen-testing';
        process.env.NODE_ENV = 'test';
        process.env.BACKEND_PORT = '3001';
        
        // Test-User erstellen
        testUser = new User({
            email: 'test@informationen-test.com',
            password: 'testPassword123',
            firstName: 'Test',
            lastName: 'User',
            role: 'Koch',
            isApproved: true
        });
        await testUser.save();
        
        // Test-Daten-Verzeichnis erstellen
        await fs.mkdir(testDataPath, { recursive: true });
        await fs.mkdir(path.join(testDataPath, '2025'), { recursive: true });
        
        console.log('🧪 INFORMATIONEN-TEST-UMGEBUNG INITIALISIERT');
        console.log('📊 Test-MongoDB URI:', mongoUri);
        console.log('📁 Test-Daten-Pfad:', testDataPath);
    }, 30000);

    afterAll(async () => {
        console.log('🧹 INFORMATIONEN-TEST-UMGEBUNG CLEANUP...');
        
        // Test-Dateien löschen
        try {
            await fs.rm(testDataPath, { recursive: true, force: true });
        } catch (error) {
            console.log('Test-Dateien bereits gelöscht oder nicht vorhanden');
        }
        
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        
        // Umgebungsvariablen zurücksetzen
        delete process.env.JWT_SECRET;
        delete process.env.NODE_ENV;
        delete process.env.BACKEND_PORT;
        
        console.log('✅ INFORMATIONEN-TEST-UMGEBUNG SAUBER BEENDET');
    }, 30000);

    beforeEach(async () => {
        // Test-Daten-Verzeichnis vor jedem Test leeren
        try {
            const jahrDir = path.join(testDataPath, '2025');
            const files = await fs.readdir(jahrDir);
            for (const file of files) {
                await fs.unlink(path.join(jahrDir, file));
            }
        } catch (error) {
            // Verzeichnis existiert nicht, das ist OK
        }
    });

    describe('📋 GET /api/informationen - Informationen laden', () => {
        it('sollte leere Informationen für nicht-existierende Woche zurückgeben', async () => {
            const response = await request(app)
                .get('/api/informationen')
                .query({
                    jahr: 2025,
                    kalenderwoche: 26,
                    einrichtung_id: 'test-einrichtung-123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('informationen', {});
        });

        it('sollte Validierungsfehler für fehlende Parameter werfen', async () => {
            const response = await request(app)
                .get('/api/informationen')
                .query({
                    jahr: 2025
                    // kalenderwoche und einrichtung_id fehlen
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('sollte existierende Informationen korrekt laden', async () => {
            // Test-Daten erstellen
            const testData = {
                montag: [
                    {
                        id: 'info-123',
                        titel: 'Test Information',
                        inhalt: 'Dies ist eine Test-Information',
                        prioritaet: 'hoch',
                        ersteller_id: testUser.id,
                        ersteller_name: 'Test User',
                        einrichtung_id: 'test-einrichtung-123',
                        einrichtung_name: 'Test Einrichtung',
                        erstellt_am: new Date().toISOString(),
                        soft_deleted: false,
                        read: false
                    }
                ]
            };

            const testFilePath = path.join(testDataPath, '2025', '26.json');
            await fs.writeFile(testFilePath, JSON.stringify(testData, null, 2));

            const response = await request(app)
                .get('/api/informationen')
                .query({
                    jahr: 2025,
                    kalenderwoche: 26,
                    einrichtung_id: 'test-einrichtung-123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.informationen).toHaveProperty('montag');
            expect(response.body.informationen.montag).toHaveLength(1);
            expect(response.body.informationen.montag[0].titel).toBe('Test Information');
        });
    });

    describe('📝 POST /api/informationen - Information erstellen', () => {
        it('sollte neue Information erfolgreich erstellen', async () => {
            const newInformation = {
                jahr: 2025,
                kalenderwoche: 26,
                tag: 'montag',
                einrichtung_id: 'test-einrichtung-123',
                einrichtung_name: 'Test Einrichtung',
                titel: 'Neue Test Information',
                inhalt: 'Dies ist der Inhalt der neuen Information',
                prioritaet: 'normal'
            };

            const response = await request(app)
                .post('/api/informationen')
                .send(newInformation)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('information');
            expect(response.body.information.titel).toBe(newInformation.titel);
            expect(response.body.information).toHaveProperty('id');
            expect(response.body.information.ersteller_id).toBe(testUser.id);
        });

        it('sollte alle Prioritätsstufen korrekt verarbeiten', async () => {
            const prioritaeten = ['kritisch', 'hoch', 'normal', 'niedrig'];
            
            for (const prioritaet of prioritaeten) {
                const information = {
                    jahr: 2025,
                    kalenderwoche: 26,
                    tag: 'dienstag',
                    einrichtung_id: 'test-einrichtung-123',
                    einrichtung_name: 'Test Einrichtung',
                    titel: `Information ${prioritaet}`,
                    inhalt: `Inhalt mit Priorität ${prioritaet}`,
                    prioritaet: prioritaet
                };

                const response = await request(app)
                    .post('/api/informationen')
                    .send(information)
                    .expect(201);

                expect(response.body.information.prioritaet).toBe(prioritaet);
            }
        });
    });

    describe('✏️ PUT /api/informationen/:id - Information aktualisieren', () => {
        let existingInformation;

        beforeEach(async () => {
            // Existierende Information erstellen
            const createResponse = await request(app)
                .post('/api/informationen')
                .send({
                    jahr: 2025,
                    kalenderwoche: 26,
                    tag: 'mittwoch',
                    einrichtung_id: 'test-einrichtung-123',
                    einrichtung_name: 'Test Einrichtung',
                    titel: 'Original Titel',
                    inhalt: 'Original Inhalt',
                    prioritaet: 'normal'
                });

            existingInformation = createResponse.body.information;
        });

        it('sollte Information erfolgreich aktualisieren', async () => {
            const updateData = {
                titel: 'Aktualisierter Titel',
                inhalt: 'Aktualisierter Inhalt',
                prioritaet: 'hoch'
            };

            const response = await request(app)
                .put(`/api/informationen/${existingInformation.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.information.titel).toBe(updateData.titel);
            expect(response.body.information.inhalt).toBe(updateData.inhalt);
            expect(response.body.information.prioritaet).toBe(updateData.prioritaet);
            expect(response.body.information).toHaveProperty('aktualisiert_am');
        });

        it('sollte 404 für nicht-existierende Information werfen', async () => {
            const response = await request(app)
                .put('/api/informationen/nicht-existierende-id')
                .send({
                    titel: 'Update Versuch',
                    inhalt: 'Dies sollte fehlschlagen'
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('🗑️ DELETE /api/informationen/:id - Information löschen', () => {
        let existingInformation;

        beforeEach(async () => {
            const createResponse = await request(app)
                .post('/api/informationen')
                .send({
                    jahr: 2025,
                    kalenderwoche: 26,
                    tag: 'donnerstag',
                    einrichtung_id: 'test-einrichtung-123',
                    einrichtung_name: 'Test Einrichtung',
                    titel: 'Zu löschende Information',
                    inhalt: 'Diese Information wird gelöscht',
                    prioritaet: 'niedrig'
                });

            existingInformation = createResponse.body.information;
        });

        it('sollte Information erfolgreich soft-löschen', async () => {
            const response = await request(app)
                .delete(`/api/informationen/${existingInformation.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('gelöscht');
        });
    });

    describe('👁️ PATCH /api/informationen/:id/read - Als gelesen markieren', () => {
        let existingInformation;

        beforeEach(async () => {
            const createResponse = await request(app)
                .post('/api/informationen')
                .send({
                    jahr: 2025,
                    kalenderwoche: 26,
                    tag: 'freitag',
                    einrichtung_id: 'test-einrichtung-123',
                    einrichtung_name: 'Test Einrichtung',
                    titel: 'Zu markierende Information',
                    inhalt: 'Diese Information wird als gelesen markiert',
                    prioritaet: 'normal'
                });

            existingInformation = createResponse.body.information;
        });

        it('sollte Information erfolgreich als gelesen markieren', async () => {
            const response = await request(app)
                .patch(`/api/informationen/${existingInformation.id}/read`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('gelesen markiert');
        });
    });

    describe('🔧 Edge Cases und Datenintegrität', () => {
        it('sollte mehrere Informationen pro Tag korrekt verwalten', async () => {
            const informationen = [
                {
                    jahr: 2025, kalenderwoche: 26, tag: 'samstag',
                    einrichtung_id: 'test-einrichtung-123', einrichtung_name: 'Test Einrichtung',
                    titel: 'Kritische Info', inhalt: 'Kritischer Inhalt', prioritaet: 'kritisch'
                },
                {
                    jahr: 2025, kalenderwoche: 26, tag: 'samstag',
                    einrichtung_id: 'test-einrichtung-123', einrichtung_name: 'Test Einrichtung',
                    titel: 'Normale Info', inhalt: 'Normaler Inhalt', prioritaet: 'normal'
                }
            ];

            // Alle Informationen erstellen
            for (const info of informationen) {
                await request(app)
                    .post('/api/informationen')
                    .send(info)
                    .expect(201);
            }

            // Alle Informationen abrufen
            const response = await request(app)
                .get('/api/informationen')
                .query({
                    jahr: 2025,
                    kalenderwoche: 26,
                    einrichtung_id: 'test-einrichtung-123'
                })
                .expect(200);

            const samstagInfos = response.body.informationen.samstag;
            expect(samstagInfos).toHaveLength(2);

            // Prüfen ob IDs eindeutig sind
            const ids = samstagInfos.map(info => info.id);
            expect(new Set(ids).size).toBe(2);
        });

        it('sollte verschiedene Einrichtungen korrekt trennen', async () => {
            const info1 = {
                jahr: 2025, kalenderwoche: 26, tag: 'montag',
                einrichtung_id: 'einrichtung-a', einrichtung_name: 'Einrichtung A',
                titel: 'Info für A', inhalt: 'Inhalt für A', prioritaet: 'normal'
            };

            const info2 = {
                jahr: 2025, kalenderwoche: 26, tag: 'montag',
                einrichtung_id: 'einrichtung-b', einrichtung_name: 'Einrichtung B',
                titel: 'Info für B', inhalt: 'Inhalt für B', prioritaet: 'hoch'
            };

            await request(app).post('/api/informationen').send(info1).expect(201);
            await request(app).post('/api/informationen').send(info2).expect(201);

            // Nur Informationen für Einrichtung A abrufen
            const responseA = await request(app)
                .get('/api/informationen')
                .query({
                    jahr: 2025,
                    kalenderwoche: 26,
                    einrichtung_id: 'einrichtung-a'
                })
                .expect(200);

            const montagInfosA = responseA.body.informationen.montag || [];
            expect(montagInfosA).toHaveLength(1);
            expect(montagInfosA[0].titel).toBe('Info für A');
        });
    });
}); 