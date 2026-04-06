import type { RegionData } from "../RegionCard/types";

export type ChartDataItem = {
    name: string;
    value: number;
};

export function buildChartData(region: RegionData): ChartDataItem[] {
    const indicators = region.indicators ?? {};

    return [
        {
            name: "Queimadas (INPE)",
            value: region.burnedOccurrences ?? 0,
        },
        {
            name: "Terras indígenas",
            value: indicators.terrasIndigenas ? 1 : 0,
        },
        {
            name: "Unidades de conservação",
            value: indicators.unidadesConservacao ? 1 : 0,
        },
        {
            name: "Quilombolas",
            value: indicators.quilombolas ? 1 : 0,
        },
        {
            name: "Assentamentos",
            value: indicators.assentamentos ? 1 : 0,
        },
    ];
}