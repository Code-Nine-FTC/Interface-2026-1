import { MapContainer, TileLayer, Marker, Popup, LayerGroup, GeoJSON, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapComponent.module.css';
import type { Mapa } from '../../../services/chatService';

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
  geoJsonData?: Mapa | null;
}

const SP_CENTER: [number, number] = [-23.5505, -46.6333];

function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function FitGeoJsonBounds({ data }: { data: Mapa }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.geoJSON(data as any).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [data, map]);

  return null;
}

function getGeoJsonStyle(feature: any) {
  const geometryType = feature?.geometry?.type;

  if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
    return {
      color: '#d35400',
      weight: 2,
      opacity: 1,
      fillColor: '#f39c12',
      fillOpacity: 0.25,
    };
  }

  if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
    return {
      color: '#2980b9',
      weight: 3,
      opacity: 0.9,
    };
  }

  return {
    color: '#7f8c8d',
    weight: 2,
    opacity: 0.8,
  };
}

function pointToLayer(feature: any, latlng: L.LatLng) {
  const rawIntensidade = feature?.properties?.intensidade;
  const intensidade = typeof rawIntensidade === 'number' && Number.isFinite(rawIntensidade) ? rawIntensidade : null;
  const radius = intensidade ? Math.max(5, Math.min(14, 5 + intensidade / 40)) : 6;

  return L.circleMarker(latlng, {
    radius,
    color: '#c0392b',
    weight: 1,
    fillColor: '#e74c3c',
    fillOpacity: 0.75,
  });
}

function bindFeaturePopup(feature: any, layer: L.Layer) {
  const properties = (feature?.properties ?? {}) as Record<string, unknown>;
  const nome = String(properties.nome ?? properties.municipio ?? 'Sem nome');
  const tipo = String(properties.tipo ?? 'Geometria');
  const intensidade = typeof properties.intensidade === 'number' ? `<br/>Intensidade: ${properties.intensidade}` : '';
  const fase = properties.fase ? `<br/>Fase: ${String(properties.fase)}` : '';

  layer.bindPopup(`<strong>${nome}</strong><br/>Tipo: ${tipo}${intensidade}${fase}`);
}

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
  geoJsonData,
}: MapComponentProps) {
  const hasGeoJson = Boolean(geoJsonData?.features?.length);

  return (
    <div className={styles.mapContainer}>
      <MapContainer center={SP_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {hasGeoJson && geoJsonData && (
          <>
            <FitGeoJsonBounds data={geoJsonData} />
            <GeoJSON
              data={geoJsonData as any}
              style={getGeoJsonStyle}
              pointToLayer={pointToLayer}
              onEachFeature={bindFeaturePopup}
            />
          </>
        )}

        <LayerGroup>
          {poluicaoLocalizacoes.map((localizacao, idx) => {
            if (!isValidLatLng(localizacao.lat, localizacao.lng)) return null;

            return (
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
            );
          })}
        </LayerGroup>
        <LayerGroup>
          {queimadasLocalizacoes.map((localizacao, idx) => {
            if (hasGeoJson) return null;
            if (!isValidLatLng(localizacao.lat, localizacao.lng)) return null;

            return (
              <Marker
                key={`queimadas-${idx}`}
                position={[localizacao.lat, localizacao.lng] as [number, number]}
                icon={fireIcon as any}
              >
                <Popup>
                  <strong>{localizacao.nome}</strong>
                </Popup>
              </Marker>
            );
          })}
        </LayerGroup>
        <LayerGroup>
          {quilombosLocalizacoes.map((localizacao, idx) => {
            if (!isValidLatLng(localizacao.lat, localizacao.lng)) return null;

            return (
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
            );
          })}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}
