import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initMap();
    setInterval(() => this.loadScooters(), 2000);
  }

  initMap() {
    this.map = L.map('map').setView([45.4642, 9.1900], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  loadScooters() {
    // Usa localhost:3000 o l'URL pubblico di Codespaces come visto prima
    this.http.get<any[]>('https://upgraded-space-memory-4q76xrv6pjcj9gv-3000.app.github.dev/api/scooters').subscribe({
      next: (data) => {
        this.scooters = data;
        this.updateMarkers();
      },
      error: (err) => console.error('Errore Backend:', err)
    });
  }

  updateMarkers() {
    this.scooters.forEach(s => {
      // Convertiamo stringhe in numeri (sicurezza)
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);

      if (this.markers[s.id]) {
        // Se il marker esiste già, SPOSTIAMOLO
        this.markers[s.id].setLatLng([lat, lng]);
      } else {
        // SE È NUOVO: Creiamo un CERCHIO ROSSO (invece dell'icona PNG)
        const marker = L.circleMarker([lat, lng], {
          radius: 10,             // Dimensione
          fillColor: '#ff0000',   // Rosso pieno
          color: '#fff',          // Bordo bianco
          weight: 2,              // Spessore bordo
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.map);
        
        // Aggiungiamo il popup con info batteria
        marker.bindPopup(`<b>Scooter: ${s.id}</b><br>🔋 ${s.battery}%`);
        
        // Salviamo il marker nella nostra lista per poterlo muovere dopo
        this.markers[s.id] = marker;
      }
    });
  }
}