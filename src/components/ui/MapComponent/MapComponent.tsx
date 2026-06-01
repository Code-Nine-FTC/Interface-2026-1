import { MapContainer, TileLayer, Marker, Popup, LayerGroup, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapComponent.module.css';
import { resolveFeatureNome } from '../../../utils/geoFeatureLabels';
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

function GeoJsonLayer({ data }: { data: Mapa }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    const layer = L.geoJSON(data as any, {
      style: getGeoJsonStyle,
      pointToLayer,
      onEachFeature: bindFeaturePopupComScores(buildScoresPorImovel(data)),
    });
    layer.addTo(map);
    layerRef.current = layer;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
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

function formatNum(value: number, decimals: number = 2): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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

type ScoreAmbientalPopup = {
  score_ambiental?: number;
  score_social?: number;
  score_governanca?: number;
  score_geral?: number;
  classificacao?: unknown;
};

function chaveImovel(properties: Record<string, unknown>): string | null {
  const id = properties.imovel_id;
  if (typeof id === 'string' && id.trim()) return id;
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  return null;
}

function extrairScoreAmbiental(properties: Record<string, unknown>): ScoreAmbientalPopup | null {
  const scoreGeral = toFiniteNumber(properties.score_geral);
  if (scoreGeral === null) return null;

  const scoreAmbiental = toFiniteNumber(properties.score_ambiental);
  const scoreSocial = toFiniteNumber(properties.score_social);
  const scoreGovernanca = toFiniteNumber(properties.score_governanca);

  return {
    score_geral: scoreGeral,
    ...(scoreAmbiental !== null ? { score_ambiental: scoreAmbiental } : {}),
    ...(scoreSocial !== null ? { score_social: scoreSocial } : {}),
    ...(scoreGovernanca !== null ? { score_governanca: scoreGovernanca } : {}),
    ...(properties.classificacao ? { classificacao: properties.classificacao } : {}),
  };
}

function buildScoresPorImovel(data: Mapa): Map<string, ScoreAmbientalPopup> {
  const scores = new Map<string, ScoreAmbientalPopup>();

  for (const feature of data.features ?? []) {
    const properties = (feature?.properties ?? {}) as Record<string, unknown>;
    const key = chaveImovel(properties);
    const score = extrairScoreAmbiental(properties);
    if (key && score) scores.set(key, score);
  }

  return scores;
}

function propriedadesComScoreRelacionado(
  properties: Record<string, unknown>,
  scoresPorImovel: Map<string, ScoreAmbientalPopup>
): Record<string, unknown> {
  if (extrairScoreAmbiental(properties)) return properties;

  const key = chaveImovel(properties);
  if (!key) return properties;

  const score = scoresPorImovel.get(key);
  return score ? { ...properties, ...score } : properties;
}

function adicionarScoreAmbiental(linhas: string[], properties: Record<string, unknown>) {
  const scoreGeral = toFiniteNumber(properties.score_geral);
  if (scoreGeral === null) return;

  linhas.push(linhaPopup('Score geral', formatNum(scoreGeral, 1)));

  if (properties.classificacao) {
    linhas.push(linhaPopup('Classificação ASG', properties.classificacao));
  }

  const scoreAmbiental = toFiniteNumber(properties.score_ambiental);
  if (scoreAmbiental !== null) {
    linhas.push(linhaPopup('Ambiental', formatNum(scoreAmbiental, 1)));
  }

  const scoreSocial = toFiniteNumber(properties.score_social);
  if (scoreSocial !== null) {
    linhas.push(linhaPopup('Social', formatNum(scoreSocial, 1)));
  }

  const scoreGovernanca = toFiniteNumber(properties.score_governanca);
  if (scoreGovernanca !== null) {
    linhas.push(linhaPopup('Governança', formatNum(scoreGovernanca, 1)));
  }
}

function bindFeaturePopup(feature: any, layer: L.Layer, scoresPorImovel = new Map<string, ScoreAmbientalPopup>()) {
  const propertiesBase = (feature?.properties ?? {}) as Record<string, unknown>;
  const properties = propriedadesComScoreRelacionado(propertiesBase, scoresPorImovel);
  const tipo = String(properties.tipo ?? 'Geometria');
  let titulo = 'Geometria';
  const linhas: string[] = [];

  switch (tipo) {
    case 'imovel_rural_queimada': {
      titulo = resolveFeatureNome(properties);
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (typeof properties.num_queimadas === 'number') linhas.push(linhaPopup('Focos relacionados', formatNum(properties.num_queimadas, 0)));
      if (typeof properties.dist_min_m === 'number') linhas.push(linhaPopup('Distância mínima', `${formatNum(properties.dist_min_m)} m`));
      if (properties.nivel_risco_ambiental) linhas.push(linhaPopup('Risco', properties.nivel_risco_ambiental));
      break;
    }
    case 'queimada_evento_relacionada': {
      titulo = 'Foco de queimada';
      const data = formatarData(properties.data_ocorrencia);
      if (data) linhas.push(linhaPopup('Data', data));
      if (properties.sensor) linhas.push(linhaPopup('Sensor', properties.sensor));
      else if (properties.fonte_sensor) linhas.push(linhaPopup('Sensor', properties.fonte_sensor));
      if (typeof properties.intensidade === 'number') linhas.push(linhaPopup('Intensidade', formatNum(properties.intensidade)));
      if (typeof properties.risco_fogo === 'number') linhas.push(linhaPopup('Risco fogo', formatNum(properties.risco_fogo)));
      break;
    }
    case 'imovel_rural_desmatamento':
    case 'imovel_rural_quilombo': {
      titulo = resolveFeatureNome(properties);
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      break;
    }
    case 'desmatamento_alerta_relacionado': {
      titulo = 'Alerta de desmatamento';
      if (properties.tipo_alerta) linhas.push(linhaPopup('Tipo', properties.tipo_alerta));
      const data = formatarData(properties.data_ocorrencia);
      if (data) linhas.push(linhaPopup('Data', data));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      break;
    }
    case 'territorio_quilombola_relacionado': {
      titulo = String(properties.nome ?? 'Território quilombola');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      break;
    }
    default: {
      titulo = resolveFeatureNome(properties);
      linhas.push(linhaPopup('Tipo', tipo));
      if (typeof properties.intensidade === 'number') linhas.push(linhaPopup('Intensidade', formatNum(properties.intensidade)));
      if (properties.fase) linhas.push(linhaPopup('Fase', properties.fase));
    }
  }

  adicionarScoreAmbiental(linhas, properties);

  const html = `<div class="atlas-popup"><div class="atlas-popup-title">${escapeHtml(titulo)}</div>${linhas.join('')}</div>`;
  layer.bindPopup(html);
}

function bindFeaturePopupComScores(scoresPorImovel: Map<string, ScoreAmbientalPopup>) {
  return (feature: any, layer: L.Layer) => bindFeaturePopup(feature, layer, scoresPorImovel);
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
          <GeoJsonLayer key={renderKey ?? 'geojson-default'} data={geoJsonData} />
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
                  Índice: {localizacao.indice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} µg/m³
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
