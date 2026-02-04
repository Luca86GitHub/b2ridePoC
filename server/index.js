const express = require('express'); // Ci servirà per le API tra poco
const mqtt = require('mqtt');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors()); // Abilita le chiamate dal Frontend
app.use(express.json());

console.log("--- SERVER BACKEND AVVIATO ---");

// 1. DATABASE CONNECTION
const db = new Client({
  connectionString: 'postgresql://admin:password123@localhost:5432/b2ride'
});
db.connect();

// 2. MQTT CONNECTION
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
    console.log("✅ MQTT Connected");
    // ORA ASCOLTIAMO IL CANALE GIUSTO!
    mqttClient.subscribe('b2ride/telemetry'); 
});

// 3. INGESTION LOGIC (Dallo Scooter al DB)
mqttClient.on('message', async (topic, message) => {
    // Trasformiamo i byte in testo, e il testo in Oggetto JSON
    const data = JSON.parse(message.toString());
    
    console.log(`📥 Ricevuto dati da ${data.id} - Batt: ${data.battery}%`);

    // QUERY DI "UPSERT" (Update or Insert)
    // Se l'ID esiste già (ON CONFLICT), aggiorna posizione e batteria.
    // Se non esiste, crea una nuova riga.
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
        // Non stampiamo "Salvato" ogni volta per non intasare i log, ma sta salvando.
    } catch (err) {
        console.error("Errore salvataggio DB:", err);
    }
});

// 4. API PER IL FRONTEND (L'ultima parte che ci mancava)
// Quando Angular chiederà "/api/scooters", noi rispondiamo con i dati del DB.
app.get('/api/scooters', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM scooters');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Avvia il server web sulla porta 3000
app.listen(3000, () => console.log('🚀 HTTP Server running on port 3000'));