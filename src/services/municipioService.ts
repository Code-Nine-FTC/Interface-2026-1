const API_BASE = "http://127.0.0.1:5000";

export interface MunicipioSearchItem {
    id: number;
    nome: string;
    codigo_ibge: string;
    estado_sigla: string;
}

export async function searchMunicipios(
    query: string,
    estadoSigla?: string
): Promise<MunicipioSearchItem[]> {
    if (!query.trim() && !estadoSigla) return [];

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (estadoSigla) params.set("estado_sigla", estadoSigla);

    const response = await fetch(`${API_BASE}/municipal/search?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar municípios");
    }

    const json = await response.json();
    return json.data ?? [];
}

export interface MunicipioFeatureCollection {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        id?: string | number;
        geometry: any;
        properties: Record<string, any>;
    }>;
}

export async function fetchMunicipioBoundary(
    municipioId: number
): Promise<MunicipioFeatureCollection | null> {
    const response = await fetch(`${API_BASE}/municipal/geojson/layers/municipios`);
    if (!response.ok) return null;

    const json: MunicipioFeatureCollection = await response.json();
    const feature = json.features?.find((f) => String(f.id ?? f.properties?.id) === String(municipioId));

    if (!feature) return null;

    return {
        type: "FeatureCollection",
        features: [feature],
    };
}

export async function fetchLayerByMunicipio(
    layerName: string,
    municipioId: number
): Promise<MunicipioFeatureCollection> {
    const response = await fetch(
        `${API_BASE}/municipal/geojson/layers/${layerName}?municipio_id=${municipioId}`
    );
    if (!response.ok) return { type: "FeatureCollection", features: [] };
    return response.json();
}
