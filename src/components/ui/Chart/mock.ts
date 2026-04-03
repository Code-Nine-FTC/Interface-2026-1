import { RegionData } from "../RegionCard/Mock";
import { ChartDataItem } from "./types";

export function generateChartData(region: RegionData): ChartDataItem[] {
    return [
        {
            name: "Queimadas (INPE)",
            value: region.burnedOccurrences,
        },
        {
            name: "Terras indígenas",
            value: region.indicators.terrasIndigenas ? 1 : 0,
        },
        {
            name: "Unidades de conservação",
            value: region.indicators.unidadesConservacao ? 1 : 0,
        },
        {
            name: "Quilombolas",
            value: region.indicators.quilombolas ? 1 : 0,
        },
        {
            name: "Assentamentos",
            value: region.indicators.assentamentos ? 1 : 0,
        },
    ];
}