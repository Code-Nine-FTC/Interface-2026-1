
import { MapContainer, TileLayer, LayerGroup, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
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

const STYLE_BY_TIPO: Record<string, L.PathOptions> = {
  imovel_rural: { color: '#1b4332', weight: 1.5, fillColor: '#52b788', fillOpacity: 0.2 },
  imovel_rural_queimada: { color: '#9d4e15', weight: 2, fillColor: '#e76f51', fillOpacity: 0.35 },
  imovel_rural_desmatamento: { color: '#780000', weight: 2, fillColor: '#c1121f', fillOpacity: 0.35 },
  imovel_rural_quilombo: { color: '#023e8a', weight: 2, fillColor: '#0077b6', fillOpacity: 0.35 },
  imovel_rural_ti: { color: '#6a0572', weight: 2, fillColor: '#9c4dcc', fillOpacity: 0.35 },
  imovel_com_camada_ambiental: { color: '#1b4332', weight: 1.5, fillColor: '#40916c', fillOpacity: 0.2 },
  unidade_conservacao: { color: '#155724', weight: 2.5, fillColor: '#28a745', fillOpacity: 0.35 },
  terra_indigena: { color: '#4a0066', weight: 2.5, fillColor: '#8e44ad', fillOpacity: 0.35 },
  territorio_quilombola: { color: '#7a3000', weight: 2.5, fillColor: '#d4660a', fillOpacity: 0.35 },
  territorio_quilombola_relacionado: { color: '#1d7874', weight: 2, fillColor: '#71a6a4', fillOpacity: 0.35 },
  desmatamento_alerta_relacionado: { color: '#bc4749', weight: 2, fillColor: '#e76f51', fillOpacity: 0.5 },
  assentamento_rural: { color: '#5c4a1e', weight: 2, fillColor: '#a07840', fillOpacity: 0.3 },
  camada_estadual_ambiental: { color: '#1a3a5c', weight: 1.5, fillColor: '#2980b9', fillOpacity: 0.25 },
  ranking_criticidade: { color: '#7b0000', weight: 2, fillColor: '#c0392b', fillOpacity: 0.25 },
  densidade_volumetrica: { color: '#1a1a2e', weight: 1.5, fillColor: '#8d99ae', fillOpacity: 0.25 },
  sobreposicao_ti_uc: { color: '#003566', weight: 2.5, fillColor: '#0077b6', fillOpacity: 0.3 },
  queimada: { color: '#d00000', weight: 1, fillColor: '#e63946', fillOpacity: 0.85 },
  queimada_evento_relacionada: { color: '#d00000', weight: 1, fillColor: '#e63946', fillOpacity: 0.85 },
  queimada_em_quilombola: { color: '#7a0000', weight: 1.5, fillColor: '#ff4d6d', fillOpacity: 0.9 },
};

const LEGEND_LABELS: Record<string, string> = {
  imovel_rural: 'Imóvel rural',
  imovel_rural_queimada: 'Imóvel com queimada',
  imovel_rural_desmatamento: 'Imóvel com desmatamento',
  imovel_rural_quilombo: 'Imóvel em território quilombola',
  imovel_rural_ti: 'Imóvel em Terra Indígena',
  imovel_com_camada_ambiental: 'Imóvel em camada ambiental',
  unidade_conservacao: 'Unidade de Conservação',
  terra_indigena: 'Terra Indígena',
  territorio_quilombola: 'Território Quilombola',
  territorio_quilombola_relacionado: 'Território Quilombola',
  desmatamento_alerta_relacionado: 'Alerta de desmatamento',
  queimada_evento_relacionada: 'Foco de queimada',
  queimada_em_quilombola: 'Queimada em quilombola',
  queimada: 'Evento de queimada',
  desmatamento: 'Alerta de desmatamento',
  assentamento_rural: 'Assentamento rural',
  camada_estadual_ambiental: 'Camada estadual',
  ranking_criticidade: 'Ranking de criticidade',
  densidade_volumetrica: 'Densidade volumétrica',
  sobreposicao_ti_uc: 'Sobreposição TI + UC',
};

const POINT_TIPOS = new Set([
  'queimada_evento_relacionada',
  'queimada_em_quilombola',
  'queimada',
]);

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

function getGeoJsonStyle(feature: any) {
  const tipo = feature?.properties?.tipo as string | undefined;
  if (tipo && STYLE_BY_TIPO[tipo]) return STYLE_BY_TIPO[tipo];

  const geometryType = feature?.geometry?.type;
  if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
    return { color: '#d35400', weight: 2, opacity: 1, fillColor: '#f39c12', fillOpacity: 0.25 };
  }
  if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
    return { color: '#2980b9', weight: 3, opacity: 0.9 };
  }
  return { color: '#7f8c8d', weight: 2, opacity: 0.8 };
}

function pointToLayer(feature: any, latlng: L.LatLng) {
  const tipo = feature?.properties?.tipo as string | undefined;
  const rawIntensidade = feature?.properties?.intensidade;
  const intensidade = typeof rawIntensidade === 'number' && Number.isFinite(rawIntensidade) ? rawIntensidade : null;
  const radius = intensidade ? Math.max(5, Math.min(14, 5 + intensidade / 40)) : 5;

  if (tipo === 'queimada_em_quilombola') {
    return L.circleMarker(latlng, {
      radius: radius + 1,
      color: '#7a0000',
      weight: 1.5,
      fillColor: '#ff4d6d',
      fillOpacity: 0.9,
    });
  }

  if (tipo === 'queimada_evento_relacionada' || tipo === 'queimada') {
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
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
  return String(valor).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
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
  return {
    score_geral: scoreGeral,
    ...(toFiniteNumber(properties.score_ambiental) !== null ? { score_ambiental: toFiniteNumber(properties.score_ambiental)! } : {}),
    ...(toFiniteNumber(properties.score_social) !== null ? { score_social: toFiniteNumber(properties.score_social)! } : {}),
    ...(toFiniteNumber(properties.score_governanca) !== null ? { score_governanca: toFiniteNumber(properties.score_governanca)! } : {}),
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
  scoresPorImovel: Map<string, ScoreAmbientalPopup>,
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
  if (properties.classificacao) linhas.push(linhaPopup('Classificação ASG', properties.classificacao));
  const scoreAmbiental = toFiniteNumber(properties.score_ambiental);
  if (scoreAmbiental !== null) linhas.push(linhaPopup('Ambiental', formatNum(scoreAmbiental, 1)));
  const scoreSocial = toFiniteNumber(properties.score_social);
  if (scoreSocial !== null) linhas.push(linhaPopup('Social', formatNum(scoreSocial, 1)));
  const scoreGovernanca = toFiniteNumber(properties.score_governanca);
  if (scoreGovernanca !== null) linhas.push(linhaPopup('Governança', formatNum(scoreGovernanca, 1)));
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
    case 'queimada_evento_relacionada':
    case 'queimada':
    case 'queimada_em_quilombola': {
      titulo = tipo === 'queimada_em_quilombola' ? 'Queimada em território quilombola' : 'Foco de queimada';
      const data = formatarData(properties.data_ocorrencia);
      if (data) linhas.push(linhaPopup('Data', data));
      if (properties.sensor) linhas.push(linhaPopup('Sensor', properties.sensor));
      else if (properties.fonte_sensor) linhas.push(linhaPopup('Sensor', properties.fonte_sensor));
      if (typeof properties.intensidade === 'number') linhas.push(linhaPopup('Intensidade', formatNum(properties.intensidade)));
      if (typeof properties.risco_fogo === 'number') linhas.push(linhaPopup('Risco fogo', formatNum(properties.risco_fogo)));
      if (properties.bioma) linhas.push(linhaPopup('Bioma', properties.bioma));
      if (tipo === 'queimada_em_quilombola' && properties.territorio_quilombola) {
        linhas.push(linhaPopup('Território', properties.territorio_quilombola));
      }
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      break;
    }
    case 'imovel_rural_desmatamento': {
      titulo = resolveFeatureNome(properties);
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (typeof properties.num_alertas_desmatamento === 'number') linhas.push(linhaPopup('Alertas', formatNum(properties.num_alertas_desmatamento, 0)));
      if (typeof properties.area_total_intersecao_ha === 'number') linhas.push(linhaPopup('Área desmatada', `${formatNum(properties.area_total_intersecao_ha, 2)} ha`));
      if (typeof properties.percentual_max_sobreposicao === 'number') linhas.push(linhaPopup('Sobreposição máx.', `${formatNum(properties.percentual_max_sobreposicao, 1)} %`));
      break;
    }
    case 'imovel_rural_quilombo': {
      titulo = resolveFeatureNome(properties);
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (properties.territorio_quilombola) linhas.push(linhaPopup('Território', properties.territorio_quilombola));
      if (typeof properties.percentual_sobreposicao === 'number') linhas.push(linhaPopup('Sobreposição', `${formatNum(properties.percentual_sobreposicao, 1)} %`));
      break;
    }
    case 'imovel_rural_ti': {
      titulo = resolveFeatureNome(properties);
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (properties.terra_indigena) linhas.push(linhaPopup('Terra Indígena', properties.terra_indigena));
      if (typeof properties.percentual_sobreposicao === 'number') linhas.push(linhaPopup('Sobreposição', `${formatNum(properties.percentual_sobreposicao, 1)} %`));
      break;
    }
    case 'imovel_rural': {
      titulo = resolveFeatureNome(properties);
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.codigo_car) linhas.push(linhaPopup('CAR', properties.codigo_car));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (properties.situacao_cadastral) linhas.push(linhaPopup('Situação', properties.situacao_cadastral));
      break;
    }
    case 'desmatamento_alerta_relacionado':
    case 'desmatamento': {
      titulo = 'Alerta de desmatamento';
      if (properties.tipo_alerta) linhas.push(linhaPopup('Tipo', properties.tipo_alerta));
      const dataDemat = formatarData(properties.data_ocorrencia);
      if (dataDemat) linhas.push(linhaPopup('Data', dataDemat));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      break;
    }
    case 'territorio_quilombola_relacionado':
    case 'territorio_quilombola':
    case 'quilombo': {
      titulo = String(properties.nome ?? 'Território quilombola');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (typeof properties.area_intersecao_ha === 'number') linhas.push(linhaPopup('Intersecção', `${formatNum(properties.area_intersecao_ha, 2)} ha`));
      if (typeof properties.percentual_sobreposicao === 'number') linhas.push(linhaPopup('Sobreposição', `${formatNum(properties.percentual_sobreposicao, 1)} %`));
      break;
    }
    case 'terra_indigena': {
      titulo = String(properties.nome ?? 'Terra Indígena');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.fase) linhas.push(linhaPopup('Fase', properties.fase));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (typeof properties.area_intersecao_ha === 'number') linhas.push(linhaPopup('Intersecção', `${formatNum(properties.area_intersecao_ha, 2)} ha`));
      if (typeof properties.percentual_sobreposicao === 'number') linhas.push(linhaPopup('Sobreposição', `${formatNum(properties.percentual_sobreposicao, 1)} %`));
      break;
    }
    case 'unidade_conservacao': {
      titulo = String(properties.nome ?? 'Unidade de Conservação');
      if (properties.categoria) linhas.push(linhaPopup('Categoria', properties.categoria));
      if (properties.esfera) linhas.push(linhaPopup('Esfera', properties.esfera));
      if (properties.grupo_snuc) linhas.push(linhaPopup('Grupo SNUC', properties.grupo_snuc));
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (typeof properties.area_intersecao_ha === 'number') linhas.push(linhaPopup('Intersecção', `${formatNum(properties.area_intersecao_ha, 2)} ha`));
      if (typeof properties.percentual_sobreposicao === 'number') linhas.push(linhaPopup('Sobreposição', `${formatNum(properties.percentual_sobreposicao, 1)} %`));
      break;
    }
    case 'sobreposicao_ti_uc': {
      titulo = String(properties.nome ?? 'Município');
      const numTi = toFiniteNumber(properties.num_ti);
      const numUc = toFiniteNumber(properties.num_uc);
      if (numTi !== null) linhas.push(linhaPopup('Terras Indígenas', formatNum(numTi, 0)));
      if (numUc !== null) linhas.push(linhaPopup('Unidades de Conservação', formatNum(numUc, 0)));
      if (properties.analise) linhas.push(linhaPopup('Análise', properties.analise));
      break;
    }
    case 'ranking_criticidade':
    case 'densidade_volumetrica': {
      titulo = String(properties.nome ?? 'Município');
      if (properties.analise) linhas.push(linhaPopup('Análise', properties.analise));
      break;
    }
    case 'camada_estadual_ambiental':
    case 'imovel_com_camada_ambiental': {
      titulo = String(properties.nome ?? properties.nome_imovel ?? 'Camada ambiental');
      if (properties.tema) linhas.push(linhaPopup('Tema', properties.tema));
      if (properties.subtipo) linhas.push(linhaPopup('Subtipo', properties.subtipo));
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (typeof properties.area_ha === 'number') linhas.push(linhaPopup('Área', `${formatNum(properties.area_ha, 4)} ha`));
      if (typeof properties.area_intersecao_ha === 'number') linhas.push(linhaPopup('Intersecção', `${formatNum(properties.area_intersecao_ha, 2)} ha`));
      break;
    }
    case 'assentamento_rural': {
      titulo = String(properties.nome ?? 'Assentamento rural');
      if (properties.municipio) linhas.push(linhaPopup('Município', properties.municipio));
      if (properties.modalidade) linhas.push(linhaPopup('Modalidade', properties.modalidade));
      if (typeof properties.familias === 'number') linhas.push(linhaPopup('Famílias', formatNum(properties.familias, 0)));
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

function MapLegend({ data }: { data: Mapa }) {
  const tiposPresentes = useMemo(() => {
    const tipos = new Set<string>();
    for (const feature of data.features ?? []) {
      const tipo = feature?.properties?.tipo as string | undefined;
      if (tipo && (LEGEND_LABELS[tipo] || STYLE_BY_TIPO[tipo])) tipos.add(tipo);
    }
    return Array.from(tipos);
  }, [data]);

  if (tiposPresentes.length === 0) return null;

  return (
    <div className={styles.mapLegend}>
      <div className={styles.legendTitle}>Legenda</div>
      {tiposPresentes.map((tipo) => {
        const style = STYLE_BY_TIPO[tipo];
        const label = LEGEND_LABELS[tipo] || tipo.replace(/_/g, ' ');
        const isPoint = POINT_TIPOS.has(tipo);
        const fillColor = (style?.fillColor as string) || '#ccc';
        const borderColor = (style?.color as string) || '#999';

        return (
          <div key={tipo} className={styles.legendItem}>
            {isPoint ? (
              <span className={styles.legendDot} style={{ backgroundColor: fillColor }} />
            ) : (
              <span
                className={styles.legendSwatch}
                style={{ backgroundColor: fillColor, borderColor }}
              />
            )}
            <span className={styles.legendLabel}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const poluicaoIcon = L.divIcon({
  html: '<div style="background-color:#9b59b6;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">🌍</div>',
  className: '',
  iconSize: [32, 32],
});

const fireIcon = L.divIcon({
  html: '<div style="background-color:#e74c3c;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">🔥</div>',
  className: '',
  iconSize: [32, 32],
});

const quilomboIcon = L.divIcon({
  html: '<div style="background-color:#16a085;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">🏘️</div>',
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
                position={[localizacao.lat, localizacao.lng]}
                icon={poluicaoIcon as any}
              >
                <Popup>
                  <strong>{localizacao.nome}</strong>
                  <br />
                  Índice: {localizacao.indice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} µg/m³
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
                position={[localizacao.lat, localizacao.lng]}
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
                position={[localizacao.lat, localizacao.lng]}
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

      {hasGeoJson && geoJsonData && <MapLegend data={geoJsonData} />}
    </div>
  );
}
