const NOME_PROPERTY_KEYS = [
    "nome_imovel",
    "nome",
    "denominacao",
    "denominacao_imovel",
    "nome_propriedade",
    "razao_social",
    "proprietario",
    "nm_imovel",
    "nom_imovel",
] as const;

/**
 * Rótulo exibível para feições do mapa/relatório.
 * O CAR frequentemente não traz nome do imóvel — nesse caso usa-se o código CAR completo.
 */
export function resolveFeatureNome(props: Record<string, unknown>): string {
    for (const key of NOME_PROPERTY_KEYS) {
        const value = props[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    const codigoCar = typeof props.codigo_car === "string" ? props.codigo_car.trim() : "";
    if (codigoCar) {
        return codigoCar;
    }

    const tipo = typeof props.tipo === "string" ? props.tipo : "";
    const municipio = typeof props.municipio === "string" ? props.municipio.trim() : "";

    if (tipo.includes("imovel") || tipo.includes("rural")) {
        return municipio ? `Imóvel rural · ${municipio}` : "Imóvel rural";
    }

    if (municipio) return municipio;

    return tipo ? tipo.replace(/_/g, " ") : "Registro geoespacial";
}
