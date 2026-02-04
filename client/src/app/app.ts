import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div style="height: 100vh; display: flex; flex-direction: column;">
      <h1 style="text-align: center; margin: 10px;">🛴 B2-Ride Monitor</h1>
      <div id="map" style="flex: 1; width: 100%; min-height: 500px;"></div>
      <div style="position: absolute; bottom: 20px; left: 20px; z-index: 1000; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.2);">
        <div *ngFor="let s of scooters">
          <b>ID:</b> {{s.id}} | <b>Batt:</b> {{s.battery}}%
        </div>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  map!: L.Map;
//  markers: { [id: string]: L.Marker } = {};
  // Mettiamo 'any' così accetta sia Marker classici che CircleMarker
markers: { [id: string]: any } = {};
  scooters: any[] = [];
// NUOVO: Variabile per la socket
  private socket: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initMap();
    
    // 1. Carico lo stato iniziale via HTTP (una volta sola, all'avvio)
    this.loadInitialData();

    // 2. NUOVO: Mi connetto alla WebSocket per gli aggiornamenti live
    this.initSocket();
  }

  initMap() {
    this.map = L.map('map').setView([45.4642, 9.1900], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }
 
  loadInitialData() {
    // URL della tua API (controlla sempre che sia quello Public di Codespaces)
    const apiUrl = 'https://upgraded-space-memory-4q76xrv6pjcj9gv-3000.app.github.dev/api/scooters';
    this.http.get<any[]>(apiUrl).subscribe(data => {
      this.scooters = data;
      this.updateMarkers();
    });
  }

 initSocket() {
    // Connessione al server WebSocket
    // Nota: Socket.io rileva automaticamente l'URL se è lo stesso dominio, 
    // ma su Codespaces meglio essere espliciti.
    const socketUrl = 'https://upgraded-space-memory-4q76xrv6pjcj9gv-3000.app.github.dev'; 
    
    this.socket = io(socketUrl, {
      transports: ['websocket'] // Forziamo WebSocket per efficienza
    });

    console.log("Tentativo connessione Socket...");

    this.socket.on('connect', () => {
      console.log("✅ Connesso al server WebSocket!");
    });

    // ASCOLTO L'EVENTO 'scooter_update' (Lo stesso nome usato nel backend)
    this.socket.on('scooter_update', (data: any) => {
      console.log("⚡ Aggiornamento live ricevuto:", data);
      
      // Aggiorno l'array locale (opzionale, serve se hai una tabella dati)
      const index = this.scooters.findIndex(s => s.id === data.id);
      if (index !== -1) {
        this.scooters[index] = data;
      } else {
        this.scooters.push(data);
      }

      // Muovo il marker sulla mappa (la parte visuale)
      this.moveMarker(data);
    });
  }

  // Ho separato la logica del singolo marker per pulizia
  moveMarker(s: any) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lng);

    if (this.markers[s.id]) {
      this.markers[s.id].setLatLng([lat, lng]);
      this.markers[s.id].setPopupContent(`<b>${s.id}</b><br>🔋 ${s.battery}%`);
    } else {
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: '#ff0000',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8
      }).addTo(this.map);
      marker.bindPopup(`<b>${s.id}</b><br>🔋 ${s.battery}%`);
      this.markers[s.id] = marker;
    }
  }
/*
  loadScooters() {
    // Usa localhost:3000 o l'URL pubblico di Codespaces come visto prima
    this.http.get<any[]>('https://upgraded-space-memory-4q76xrv6pjcj9gv-3000.app.github.dev/api/scooters').subscribe({
      next: (data) => {
        this.scooters = data;
        this.updateMarkers();
      },
      error: (err) => console.error('Errore Backend:', err)
    });
  }*/

  // updateMarkers() massivo non serve più come prima, usiamo moveMarker
  updateMarkers() {
      this.scooters.forEach(s => this.moveMarker(s));
  }
}