import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapComponent.module.css';

interface PoluicaoLocalizacao {
  lat: number;
  lng: number;
  nome: string;
  indice: number;
}

interface QueimadasLocalizacao {
  lat: number;
  lng: number;
  nome: string;
  casos: number;
}

interface QuilombosLocalizacao {
  lat: number;
  lng: number;
  nome: string;
  status: string;
}

interface MapComponentProps {
  poluicaoLocalizacoes: PoluicaoLocalizacao[];
  queimadasLocalizacoes: QueimadasLocalizacao[];
  quilombosLocalizacoes: QuilombosLocalizacao[];
}

const SP_CENTER: [number, number] = [-23.5505, -46.6333];

const poluicaoIcon = L.divIcon({
  html: '<div style="background-color: #9b59b6; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">🌍</div>',
  className: '',
  iconSize: [32, 32],
});

const fireIcon = L.divIcon({
  html: '<div style="background-color: #e74c3c; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">🔥</div>',
  className: '',
  iconSize: [32, 32],
});

const quilomboIcon = L.divIcon({
  html: '<div style="background-color: #16a085; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">🏘️</div>',
  className: '',
  iconSize: [32, 32],
});

export default function MapComponent({
  poluicaoLocalizacoes,
  queimadasLocalizacoes,
  quilombosLocalizacoes,
}: MapComponentProps) {
  return (
    <div className={styles.mapContainer}>
      <MapContainer center={SP_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <LayerGroup>
          {poluicaoLocalizacoes.map((localizacao, idx) => (
            <Marker
              key={`poluicao-${idx}`}
              position={[localizacao.lat, localizacao.lng] as [number, number]}
              icon={poluicaoIcon as any}
            >
              <Popup>
                <strong>{localizacao.nome}</strong>
                <br />
                Índice: {localizacao.indice} µg/m³
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
        <LayerGroup>
          {queimadasLocalizacoes.map((localizacao, idx) => (
            <Marker
              key={`queimadas-${idx}`}
              position={[localizacao.lat, localizacao.lng] as [number, number]}
              icon={fireIcon as any}
            >
              <Popup>
                <strong>{localizacao.nome}</strong>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
        <LayerGroup>
          {quilombosLocalizacoes.map((localizacao, idx) => (
            <Marker
              key={`quilombos-${idx}`}
              position={[localizacao.lat, localizacao.lng] as [number, number]}
              icon={quilomboIcon as any}
            >
              <Popup>
                <strong>{localizacao.nome}</strong>
                <br />
                Status: {localizacao.status}
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}
