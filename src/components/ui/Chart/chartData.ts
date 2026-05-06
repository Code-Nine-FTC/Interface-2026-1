import type { RegionData } from "../RegionCard/types";

export type ChartDataItem = {
    name: string;
    value: number;
    unit?: string;
};

export function buildChartData(region: RegionData): ChartDataItem[] {
    const indicators = region.indicators ?? {
        queimadas: false,
        terrasIndigenas: false,
        unidadesConservacao: false,
        quilombolas: false,
        assentamentos: false
    };


    return [
        {
            name: "Queimadas",
            value: region.burnedOccurrences ?? 0,
        },
        {
            name: "T. Indígenas",
            value: indicators.terrasIndigenas ? 1 : 0,
        },
        {
            name: "U. Conservação",
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