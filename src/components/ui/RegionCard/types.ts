export type RegionData = {
    id?: string | number;
    name?: string;
    areaKm2?: number;
    burnedOccurrences?: number;

    indicators?: {
        queimadas?: boolean;
        terrasIndigenas?: boolean;
        unidadesConservacao?: boolean;
        quilombolas?: boolean;
        assentamentos?: boolean;
    };

    score?: number;
    risk?: "baixo" | "medio" | "alto";
};