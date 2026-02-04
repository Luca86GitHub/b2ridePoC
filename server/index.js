const express = require('express');
const http = require('http');           // <--- MANCAVA QUESTO!
const { Server } = require("socket.io"); // <--- MANCAVA ANCHE QUESTO!
const mqtt = require('mqtt');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

console.log("--- SERVER BACKEND AVVIATO ---");

// 1. Creiamo un server HTTP esplicito (necessario per Socket.io)
const server = http.createServer(app);

// 2. Configuriamo Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Accetta connessioni da ovunque
    methods: ["GET", "POST"]
  }
});

// DATABASE CONNECTION
// NOTA: Credenziali hardcodate per PoC. In prod usare process.env
const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/b2ride'
});
db.connect();

// MQTT CONNECTION
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
    console.log("✅ MQTT Connected");
    mqttClient.subscribe('b2ride/telemetry'); 
});

// INGESTION LOGIC
mqttClient.on('message', async (topic, message) => {
    const data = JSON.parse(message.toString());
    
    console.log(`📥 Ricevuto dati da ${data.id} - Batt: ${data.battery}%`);

    const query = `
        INSERT INTO scooters (id, lat, lng, battery, status, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET lat = EXCLUDED.lat, 
            lng = EXCLUDED.lng, 
            battery = EXCLUDED.battery,
            last_updated = NOW();
    `;

    try {
        await db.query(query, [data.id, data.lat, data.lng, data.battery, data.status]);
    } catch (err) {
        console.error("Errore salvataggio DB:", err);
    }

    // 🚀 REAL-TIME MAGIC: Spariamo il dato via Socket
    io.emit('scooter_update', data);
    // console.log(`⚡ WebSocket sent: ${data.id}`); // Decommenta se vuoi vedere troppi log
});

// API HTTP (Serve per il caricamento iniziale della mappa)
app.get('/api/scooters', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM scooters');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// IMPORTANTE: Usiamo 'server.listen' (che include socket.io) invece di 'app.listen'
server.listen(3000, () => console.log('🚀 Real-Time Server running on port 3000'));