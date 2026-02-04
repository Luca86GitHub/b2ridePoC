// simulator.js
// Questo script simula il comportamento hardware di uno scooter IoT.

const mqtt = require('mqtt');

// 1. CONNESSIONE
// Lo scooter si connette al broker tramite la rete (qui simulata da localhost)
const client = mqtt.connect('mqtt://localhost:1883');

// Configurazione dello Scooter Finto
const SCOOTER_ID = 'S01'; // Deve corrispondere all'ID inserito nel DB
let currentLat = 45.4642; // Partiamo da Milano (Duomo)
let currentLng = 9.1900;
let batteryLevel = 100;   // Batteria piena

client.on('connect', () => {
    console.log(`🛴 Scooter ${SCOOTER_ID} connesso e pronto a partire!`);

    // 2. IL LOOP INFINITO (HEARTBEAT)
    // Ogni 30 secondi (30000 ms), lo scooter manda i suoi dati.
    setInterval(() => {
        simulateMovement();
        sendTelemetry();
    }, 3000);
});

// Funzione che calcola i nuovi dati finti
function simulateMovement() {
    // Spostiamo leggermente le coordinate (random walking)
    // Math.random() - 0.5 genera un numero tra -0.5 e 0.5
    // Moltiplichiamo per 0.001 per fare piccoli passi geografici
    currentLat += (Math.random() - 0.5) * 0.001;
    currentLng += (Math.random() - 0.5) * 0.001;

    // La batteria scende piano piano
    // Math.max(0, ...) serve a non andare sotto zero
    batteryLevel = Math.max(0, batteryLevel - 1);
}

// Funzione che impacchetta e spedisce i dati
function sendTelemetry() {
    // Creiamo il pacchetto dati (Payload) in formato JSON
    const payload = JSON.stringify({
        id: SCOOTER_ID,
        lat: currentLat.toFixed(6), // Limitiamo a 6 decimali come i GPS veri
        lng: currentLng.toFixed(6),
        battery: batteryLevel,
        status: 'AVAILABLE'
    });

    // 3. PUBBLICAZIONE (PUBLISH)
    // Inviamo il messaggio sul topic 'b2ride/telemetry'
    // Questo è il canale che il Server Backend dovrà ascoltare.
    client.publish('b2ride/telemetry', payload);
    
    console.log(`📡 Inviato: ${payload}`);
}