// init-db.js
// Questo script serve SOLO a preparare il database la prima volta.
// Non gira continuamente come il server. Lo lanci una volta e via.

const { Client } = require('pg');

// Configurazione connessione (la stessa di index.js)
const client = new Client({
  connectionString: 'postgresql://admin:password123@localhost:5432/b2ride'
});

async function init() {
  try {
    // 1. Apriamo la connessione
    await client.connect();
    console.log("🛠️  Connesso al DB per inizializzazione...");
    
    // 2. Creazione della Tabella (DDL - Data Definition Language)
    // IF NOT EXISTS: Fondamentale! Se rilanci lo script, non rompe tutto se la tabella c'è già.
    // PRIMARY KEY: L'ID dello scooter è unico. Non possono esserci due 'S01'.
    // TIMESTAMP DEFAULT CURRENT_TIMESTAMP: Se non gli dico l'ora, mette lui quella di adesso.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scooters (
        id VARCHAR(50) PRIMARY KEY,
        lat FLOAT,
        lng FLOAT,
        battery INT,
        status VARCHAR(20),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createTableQuery);
    console.log("✅ Tabella 'scooters' verificata (creata o esistente).");
    
    // 3. Inserimento Dati Finti (Seeding)
    // Serve per non avere il DB vuoto quando apriremo la dashboard.
    // ON CONFLICT (id) DO NOTHING: Se 'S01' esiste già, non fare nulla (ignora errore).
    const seedDataQuery = `
      INSERT INTO scooters (id, lat, lng, battery, status)
      VALUES ('S01', 45.4642, 9.1900, 100, 'AVAILABLE')
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await client.query(seedDataQuery);
    console.log("✅ Dati iniziali inseriti (Scooter S01 presente).");
    
  } catch (e) {
    console.error("❌ Errore durante l'inizializzazione:", e);
  } finally {
    // 4. Chiudiamo la connessione
    // Importante: Altrimenti lo script rimane appeso e non finisce mai.
    await client.end();
    console.log("👋 Connessione chiusa.");
  }
}

// Avvia la funzione
init();