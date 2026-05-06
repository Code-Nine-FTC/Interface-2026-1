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
  renderKey?: string | number;
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

const STYLE_BY_TIPO: Record<string, L.PathOptions> = {
  imovel_rural_queimada: { color: '#2d6a4f', weight: 1.5, fillColor: '#52b788', fillOpacity: 0.25 },
  imovel_rural_desmatamento: { color: '#2d6a4f', weight: 1.5, fillColor: '#52b788', fillOpacity: 0.25 },
  imovel_rural_quilombo: { color: '#2d6a4f', weight: 1.5, fillColor: '#52b788', fillOpacity: 0.25 },
  desmatamento_alerta_relacionado: { color: '#bc4749', weight: 1.5, fillColor: '#e76f51', fillOpacity: 0.45 },
  territorio_quilombola_relacionado: { color: '#1d7874', weight: 1.5, fillColor: '#71a6a4', fillOpacity: 0.35 },
};

function getGeoJsonStyle(feature: any) {
  const tipo = feature?.properties?.tipo as string | undefined;
  if (tipo && STYLE_BY_TIPO[tipo]) return STYLE_BY_TIPO[tipo];

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
  const tipo = feature?.properties?.tipo as string | undefined;
  const rawIntensidade = feature?.properties?.intensidade;
  const intensidade = typeof rawIntensidade === 'number' && Number.isFinite(rawIntensidade) ? rawIntensidade : null;
  const radius = intensidade ? Math.max(5, Math.min(14, 5 + intensidade / 40)) : 5;

  if (tipo === 'queimada_evento_relacionada') {
    return L.circleMarker(latlng, {
      radius,
      color: '#d00000',
      weight: 1,
      fillColor: '#e63946',
      fillOpacity: 0.85,
    });
  }

  return L.circleMarker(latlng, {
    radius: radius || 6,
    color: '#c0392b',
    weight: 1,
    fillColor: '#e74c3c',
    fillOpacity: 0.75,
  });
}

function formatarData(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('pt-BR');
}

function escapeHtml(valor: unknown): string {
  return String(valor).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}

function linhaPopup(label: string, valor: unknown): string {
  return `<div class="atlas-popup-row"><span class="atlas-popup-label">${escapeHtml(label)}</span><span class="atlas-popup-value">${escapeHtml(valor)}</span></div>`;
}

function bindFeaturePopup(feature: any, layer: L.Layer) {
  const properties = (feature?.properties ?? {}) as Record<string, unknown>;
  const tipo = String(properties.tipo ?? 'Geometria');
  let titulo = 'Geometria';
  const linhas: string[] = [];

  switch (tipo) {
    case 'imovel_rural_queimada': {
      titulo = String(properties.nome_imovel ?? 'Imóvel rural');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${properties.area_ha} ha`));
      if (typeof properties.num_queimadas === 'number') linhas.push(linhaPopup('Focos relacionados', properties.num_queimadas));
      if (typeof properties.dist_min_m === 'number') linhas.push(linhaPopup('Distância mínima', `${Math.round(properties.dist_min_m)} m`));
      if (properties.nivel_risco_ambiental) linhas.push(linhaPopup('Risco', properties.nivel_risco_ambiental));
      break;
    }
    case 'queimada_evento_relacionada': {
      titulo = 'Foco de queimada';
      const data = formatarData(properties.data_ocorrencia);
      if (data) linhas.push(linhaPopup('Data', data));
      if (properties.sensor) linhas.push(linhaPopup('Sensor', properties.sensor));
      else if (properties.fonte_sensor) linhas.push(linhaPopup('Sensor', properties.fonte_sensor));
      if (typeof properties.intensidade === 'number') linhas.push(linhaPopup('Intensidade', properties.intensidade));
      if (typeof properties.risco_fogo === 'number') linhas.push(linhaPopup('Risco fogo', properties.risco_fogo));
      break;
    }
    case 'imovel_rural_desmatamento':
    case 'imovel_rural_quilombo': {
      titulo = String(properties.nome_imovel ?? 'Imóvel rural');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${properties.area_ha} ha`));
      break;
    }
    case 'desmatamento_alerta_relacionado': {
      titulo = 'Alerta de desmatamento';
      if (properties.tipo_alerta) linhas.push(linhaPopup('Tipo', properties.tipo_alerta));
      const data = formatarData(properties.data_ocorrencia);
      if (data) linhas.push(linhaPopup('Data', data));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${properties.area_ha} ha`));
      break;
    }
    case 'territorio_quilombola_relacionado': {
      titulo = String(properties.nome ?? 'Território quilombola');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${properties.area_ha} ha`));
      break;
    }
    default: {
      titulo = String(properties.nome ?? properties.municipio ?? 'Sem nome');
      linhas.push(linhaPopup('Tipo', tipo));
      if (typeof properties.intensidade === 'number') linhas.push(linhaPopup('Intensidade', properties.intensidade));
      if (properties.fase) linhas.push(linhaPopup('Fase', properties.fase));
    }
  }

  const html = `<div class="atlas-popup"><div class="atlas-popup-title">${escapeHtml(titulo)}</div>${linhas.join('')}</div>`;
  layer.bindPopup(html);
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
  renderKey,
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
              key={renderKey ?? 'geojson-default'}
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
