import type { Mapa } from "../../services/chatService";
import { resolveFeatureNome } from "../../utils/geoFeatureLabels";

export type GeoReportStats = {
    total: number;
    areaTotalHa: number;
    areaMediaHa: number;
    areaMaxHa: number;
    areaMinHa: number;
    comArea: number;
    porTipo: Record<string, number>;
    top10: Array<{
        nome: string;
        codigoCar: string;
        areaHa: number;
        municipio: string;
    }>;
};

export const TIPO_LABELS: Record<string, string> = {
    imovel_rural_queimada: "Imóvel rural (queimada)",
    imovel_rural_desmatamento: "Imóvel rural (desmatamento)",
    imovel_rural_quilombo: "Imóvel rural (quilombo)",
    queimada_evento_relacionada: "Foco de queimada",
    desmatamento_alerta_relacionado: "Alerta de desmatamento",
    territorio_quilombola_relacionado: "Território quilombola",
};

export const METHODOLOGY_TEXT =
    "Este relatório foi gerado automaticamente a partir da consulta realizada no Atlas NLP, " +
    "com base em bases geoespaciais oficiais. Os polígonos e pontos exibidos representam recortes " +
    "espaciais da pergunta formulada; o cadastro no CAR não substitui documentação de propriedade. " +
    "Recomenda-se validar dados críticos diretamente nas fontes citadas e na data da consulta indicada no cabeçalho.";

export function formatHa(value: number, decimals = 2): string {
    return value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

export function labelTipo(tipo: string): string {
    return TIPO_LABELS[tipo] ?? tipo.replace(/_/g, " ");
}

export function computeGeoStats(mapa: Mapa): GeoReportStats {
    const areas: number[] = [];
    const porTipo: Record<string, number> = {};
    const rows: GeoReportStats["top10"] = [];

    for (const feature of mapa.features ?? []) {
        const props = feature.properties ?? {};
        const tipo = String(props.tipo ?? "outros");
        porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;

        const areaHa = typeof props.area_ha === "number" && Number.isFinite(props.area_ha) ? props.area_ha : null;
        if (areaHa != null) areas.push(areaHa);

        rows.push({
            nome: resolveFeatureNome(props as Record<string, unknown>),
            codigoCar: String(props.codigo_car ?? "—"),
            areaHa: areaHa ?? 0,
            municipio: String(props.municipio ?? "—"),
        });
    }

    const areaTotalHa = areas.reduce((acc, value) => acc + value, 0);
    const sorted = [...rows].sort((a, b) => b.areaHa - a.areaHa);

    return {
        total: mapa.features?.length ?? 0,
        areaTotalHa,
        areaMediaHa: areas.length ? areaTotalHa / areas.length : 0,
        areaMaxHa: areas.length ? Math.max(...areas) : 0,
        areaMinHa: areas.length ? Math.min(...areas) : 0,
        comArea: areas.length,
        porTipo,
        top10: sorted.slice(0, 10),
    };
}
