const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// CONFIGURAZIONE FLOTTA
const fleet = [
    // S01: Parte dal DUOMO
    { id: 'S01', lat: 45.4642, lng: 9.1900, step: 0, side: 0, battery: 100 },
    
    // S02: Parte dal CASTELLO SFORZESCO (Molto distante!)
    { id: 'S02', lat: 45.4705, lng: 9.1793, step: 0, side: 0, battery: 95 }
];

// Parametri del "Quadrato" che percorrono
const LATO = 0.004; 
const STEPS_PER_SIDE = 5;
const DELTA = LATO / STEPS_PER_SIDE;

client.on('connect', () => {
    console.log("🛴 FLOTTA PRONTA E CONNESSA!");
    console.log("   - S01: Duomo");
    console.log("   - S02: Castello Sforzesco");

    // Loop infinito: Manda dati ogni 3 secondi
    setInterval(() => {
        fleet.forEach(scooter => {
            // 1. Calcola la nuova posizione (Movimento)
            moveInSquare(scooter);
            
            // 2. Prepara il pacchetto JSON
            const payload = JSON.stringify({
                id: scooter.id,
                lat: scooter.lat.toFixed(6),
                lng: scooter.lng.toFixed(6),
                battery: Math.round(scooter.battery),
                status: 'AVAILABLE'
            });

            // 3. Spedisce a Mosquitto
            client.publish('b2ride/telemetry', payload);
            console.log(`📡 Inviato ${scooter.id}: [${scooter.lat.toFixed(5)}, ${scooter.lng.toFixed(5)}]`);
        });
    }, 3000); 
});

// Logica matematica per il movimento a quadrato (non toccare)
function moveInSquare(s) {
    if (s.side === 0) s.lat += DELTA;      // Nord
    else if (s.side === 1) s.lng += DELTA; // Est
    else if (s.side === 2) s.lat -= DELTA; // Sud
    else if (s.side === 3) s.lng -= DELTA; // Ovest

    s.step++;
    if (s.step >= STEPS_PER_SIDE) {
        s.step = 0;
        s.side = (s.side + 1) % 4; 
    }
    // Ricarica batteria se scende troppo
    s.battery = s.battery > 5 ? s.battery - 1 : 100;
}