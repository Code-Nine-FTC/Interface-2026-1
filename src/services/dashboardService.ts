import type { RegionData } from "../components/ui/RegionCard/types";

export interface GeometriaSchema {
    id: string | number;
    nome?: string | null;
    geom: string;
    area_ha?: number | null;
    atributos_json?: Record<string, unknown> | null;
}

export interface ResponseMunicipal {
    id: number;
    nome: string;
    codigo_ibge: string;
    estado_sigla: string;
    geom: string;
    imoveis_rurais: GeometriaSchema[];
    unidades_conservacao: GeometriaSchema[];
    terras_indigenas: GeometriaSchema[];
    assentamentos: GeometriaSchema[];
    quilombolas: GeometriaSchema[];
    alertas_desmatamento: GeometriaSchema[];
}

export interface GeoJsonGeometry {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][][] | number[][][];
}

export interface MunicipalityFeature {
    type: "Feature";
    geometry: GeoJsonGeometry;
    properties: {
        id: string;
        nome: string;
        codigo_ibge: string;
        estado_sigla: string;
    };
}

export interface MunicipalityLayerResponse {
    type: "FeatureCollection";
    features: MunicipalityFeature[];
}

export interface MunicipalityMetricItem {
    label: string;
    valor: number;
}

export interface MunicipalityMetricsResponse {
    data?: {
        grupos?: MunicipalityMetricItem[];
        total?: number;
    };
}

type DashboardResponseShape =
    | RegionData[]
    | {
          data?: unknown;
          results?: unknown;
          items?: unknown;
          municipios?: unknown;
          municipalities?: unknown;
      };

const DASHBOARD_ENDPOINTS = [
    "/analytics/",
    "/analytics",
    "/municipal/",
    "/municipal",
];

const MUNICIPAL_LIST_ENDPOINTS = ["/municipal/geojson/layers/municipios"];
const FIRE_METRIC_ENDPOINTS = [
    "/analytics/queimadas/focos-por-municipio",
    "/analytics/queimadas/focos-por-estado",
];

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "sim", "yes"].includes(normalized)) return true;
        if (["false", "0", "nao", "não", "no"].includes(normalized)) return false;
    }
    return undefined;
}

function getString(value: unknown): string | undefined {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return undefined;
}

function extractArray(payload: DashboardResponseShape | unknown): unknown[] {
    if (Array.isArray(payload)) return payload;

    if (!payload || typeof payload !== "object") return [];

    const record = payload as Record<string, unknown>;
    for (const key of ["data", "results", "items", "municipios", "municipalities"]) {
        const value = record[key];
        if (Array.isArray(value)) return value;
    }

    return [];
}

function extractFeatures(payload: unknown): MunicipalityFeature[] {
    if (!payload || typeof payload !== "object") return [];

    const record = payload as Partial<MunicipalityLayerResponse> & Record<string, unknown>;
    if (Array.isArray(record.features)) {
        return record.features as MunicipalityFeature[];
    }

    return [];
}

function extractMunicipalityMetrics(payload: unknown): MunicipalityMetricItem[] {
    if (!payload || typeof payload !== "object") return [];

    const record = payload as MunicipalityMetricsResponse & Record<string, unknown>;
    const grupos = record.data?.grupos;

    if (Array.isArray(grupos)) {
        return grupos
            .map((item) => ({
                label: String(item?.label ?? ""),
                valor: Number(item?.valor ?? 0),
            }))
            .filter((item) => item.label.trim().length > 0 && Number.isFinite(item.valor));
    }

    return [];
}

function normalizeIndicators(raw: Record<string, unknown>): RegionData["indicators"] {
    const indicatorsSource =
        (raw.indicators as Record<string, unknown> | undefined) ??
        (raw.indicadores as Record<string, unknown> | undefined) ??
        raw;

    return {
        queimadas: toBoolean(indicatorsSource.queimadas ?? raw.queimadas),
        terrasIndigenas: toBoolean(
            indicatorsSource.terrasIndigenas ??
                indicatorsSource.terras_indigenas ??
                raw.terrasIndigenas ??
                raw.terras_indigenas
        ),
        unidadesConservacao: toBoolean(
            indicatorsSource.unidadesConservacao ??
                indicatorsSource.unidades_conservacao ??
                raw.unidadesConservacao ??
                raw.unidades_conservacao
        ),
        quilombolas: toBoolean(indicatorsSource.quilombolas ?? raw.quilombolas),
        assentamentos: toBoolean(indicatorsSource.assentamentos ?? raw.assentamentos),
    };
}

function normalizeRisk(value: unknown): RegionData["risk"] {
    const risk = getString(value)?.toLowerCase();

    if (risk === "baixo" || risk === "medio" || risk === "médio" || risk === "alto") {
        return risk === "médio" ? "medio" : risk;
    }

    return undefined;
}

function normalizeRegion(raw: unknown, index: number): RegionData | null {
    if (!raw || typeof raw !== "object") return null;

    const record = raw as Record<string, unknown>;
    const name =
        getString(record.name) ??
        getString(record.nome) ??
        getString(record.municipio) ??
        getString(record.municipio_nome) ??
        getString(record.label) ??
        `Município ${index + 1}`;

    return {
        id:
            getString(record.id) ??
            getString(record.municipio_id) ??
            getString(record.municipioId) ??
            getString(record.codigo) ??
            index,
        name,
        areaKm2:
            toNumber(record.areaKm2) ??
            toNumber(record.area_km2) ??
            toNumber(record.area) ??
            toNumber(record.area_total),
        burnedOccurrences:
            toNumber(record.burnedOccurrences) ??
            toNumber(record.burned_occurrences) ??
            toNumber(record.ocorrencias_queimadas) ??
            toNumber(record.ocorrencias) ??
            toNumber(record.queimadas) ??
            0,
        indicators: normalizeIndicators(record),
        score:
            toNumber(record.score) ??
            toNumber(record.pontuacao) ??
            toNumber(record.indice) ??
            toNumber(record.score_ambiental),
        risk:
            normalizeRisk(record.risk) ??
            normalizeRisk(record.risco) ??
            normalizeRisk(record.classificacao_risco),
    };
}

async function fetchJsonFromCandidates() {
    let lastError: unknown = null;

    for (const endpoint of DASHBOARD_ENDPOINTS) {
        try {
            const url = `http://127.0.0.1:5000${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                lastError = new Error(`Erro ao acessar ${url}: ${response.status}`);
                continue;
            }

            return (await response.json()) as DashboardResponseShape;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError ?? new Error("Erro ao buscar dados do dashboard");
}

async function fetchJsonFromEndpointCandidates(endpoints: string[]) {
    let lastError: unknown = null;

    for (const endpoint of endpoints) {
        try {
            const url = `http://127.0.0.1:5000${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                lastError = new Error(`Erro ao acessar ${url}: ${response.status}`);
                continue;
            }

            return await response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError ?? new Error("Erro ao buscar dados do dashboard");
}

export async function fetchDashboardMunicipalities(): Promise<MunicipalityFeature[]> {
    const payload = await fetchJsonFromEndpointCandidates(MUNICIPAL_LIST_ENDPOINTS);
    return extractFeatures(payload);
}

export async function fetchDashboardMunicipalityById(
    municipioId: number | string
): Promise<MunicipalityFeature | null> {
    const municipalities = await fetchDashboardMunicipalities();
    const found = municipalities.find(
        (feature) => feature.properties.id === String(municipioId) || feature.properties.codigo_ibge === String(municipioId)
    );

    return found ?? null;
}

export async function fetchDashboardMunicipalityMetrics(): Promise<MunicipalityMetricItem[]> {
    const payload = await fetchJsonFromEndpointCandidates(FIRE_METRIC_ENDPOINTS);
    return extractMunicipalityMetrics(payload);
}

function ringAreaKm2(ring: number[][]): number {
    if (ring.length < 3) return 0;

    const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
    const latFactor = 111.32;
    const lngFactor = 111.32 * Math.cos((meanLat * Math.PI) / 180);

    let area = 0;

    for (let index = 0; index < ring.length - 1; index += 1) {
        const [lng1, lat1] = ring[index];
        const [lng2, lat2] = ring[index + 1];
        const x1 = lng1 * lngFactor;
        const y1 = lat1 * latFactor;
        const x2 = lng2 * lngFactor;
        const y2 = lat2 * latFactor;
        area += x1 * y2 - x2 * y1;
    }

    return Math.abs(area / 2);
}

function geometryAreaKm2(geometry: GeoJsonGeometry): number | undefined {
    if (geometry.type === "Polygon") {
        const polygon = geometry.coordinates as number[][][];
        const area = polygon.reduce((sum, ring) => sum + ringAreaKm2(ring), 0);
        return area > 0 ? Number(area.toFixed(2)) : undefined;
    }

    if (geometry.type === "MultiPolygon") {
        const multiPolygon = geometry.coordinates as number[][][][];
        const area = multiPolygon.reduce(
            (sum, polygon) => sum + polygon.reduce((polygonSum, ring) => polygonSum + ringAreaKm2(ring), 0),
            0
        );
        return area > 0 ? Number(area.toFixed(2)) : undefined;
    }

    return undefined;
}

function getScoreFromFireCount(fireCount: number): number {
    const penalty = Math.min(fireCount * 2, 80);
    return Math.max(0, 100 - penalty);
}

function getRiskFromFireCount(fireCount: number): RegionData["risk"] {
    if (fireCount >= 30) return "alto";
    if (fireCount >= 10) return "medio";
    if (fireCount > 0) return "baixo";
    return "baixo";
}

export function getMunicipalityFireCount(
    municipalityName: string,
    metrics: MunicipalityMetricItem[]
): number {
    const normalizedName = municipalityName.trim().toLowerCase();

    const match = metrics.find((item) => {
        const normalizedLabel = item.label
            .toLowerCase()
            .replace(/\s*-\s*[a-z]{2}$/, "")
            .trim();

        return normalizedLabel === normalizedName;
    });

    return match?.valor ?? 0;
}

export function mapMunicipalToRegionData(
    region: MunicipalityFeature,
    fireCount = 0
): RegionData {
    const score = getScoreFromFireCount(fireCount);

    return {
        id: region.properties.id,
        name: region.properties.nome,
        areaKm2: geometryAreaKm2(region.geometry),
        burnedOccurrences: fireCount,
        indicators: {
            queimadas: fireCount > 0,
            terrasIndigenas: false,
            unidadesConservacao: false,
            quilombolas: false,
            assentamentos: false,
        },
        score,
        risk: getRiskFromFireCount(fireCount),
    };
}

export function buildFilterData(region: MunicipalityFeature | null) {
    if (!region) return [];

    return [
        { id: 1, label: "Queimadas (INPE)", checked: false },
        { id: 2, label: "Terras indígenas", checked: false },
        { id: 3, label: "Unidades de conservação", checked: false },
        { id: 4, label: "Quilombolas", checked: false },
        { id: 5, label: "Assentamentos", checked: false },
    ];
}

export function mapMunicipalitiesToSearchItems(municipalities: MunicipalityFeature[]) {
    return municipalities.map((municipality) => ({
        id: municipality.properties.id,
        label: municipality.properties.nome,
        meta: municipality,
    }));
}

export async function fetchDashboardRegions(): Promise<RegionData[]> {
    const payload = await fetchJsonFromCandidates();
    const records = extractArray(payload);

    return records
        .map((item, index) => normalizeRegion(item, index))
        .filter((item): item is RegionData => item !== null);
}