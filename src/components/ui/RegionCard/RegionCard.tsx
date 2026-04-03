import styles from "./RegionCard.module.css";

export type RegionData = {
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

type Props = {
    data?: RegionData | null;
};

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path
            d="M20 6 9 17l-5-5"
            stroke="var(--orange-main)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);

export default function RegionCard({ data }: Props) {
    if (!data) return null;

    const indicators = data.indicators ?? {};

    const indicatorList = [
        { label: "Queimadas (INPE)", value: indicators.queimadas },
        { label: "Terras indígenas", value: indicators.terrasIndigenas },
        { label: "Unidades de conservação", value: indicators.unidadesConservacao },
        { label: "Quilombolas", value: indicators.quilombolas },
        { label: "Assentamentos", value: indicators.assentamentos },
    ].filter(item => item.value);

    const score = data.score ?? 0;

    const riskWidth =
        data.risk === "baixo"
            ? "33%"
            : data.risk === "medio"
                ? "66%"
                : "100%";

    return (
        <div className={styles.card}>
            <div className={styles.left}>
                <h2 className={styles.title}>
                    {data.name ?? "Região não informada"}
                </h2>

                <div className={styles.indicators}>
                    {indicatorList.map((item, index) => (
                        <div key={index} className={styles.indicator}>
                            <CheckIcon />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.info}>
                    <p>
                        <strong>Área analisada:</strong>{" "}
                        {data.areaKm2 ? `${data.areaKm2} km²` : "—"}
                    </p>
                    <p>
                        <strong>Ocorrências de queimadas:</strong>{" "}
                        {data.burnedOccurrences ?? "—"}
                    </p>
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.right}>
                <h3 className={styles.sectionTitle}>Métricas gerais:</h3>

                <div className={styles.metric}>
                    <span>Score ambiental:</span>
                    <div className={styles.bar}>
                        <div
                            className={styles.fill}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                    <span className={styles.score}>{score}/100</span>
                </div>

                <div className={styles.metric}>
                    <span>Risco de queimadas:</span>
                    <div className={styles.bar}>
                        <div
                            className={styles.fill}
                            style={{ width: riskWidth }}
                        />
                    </div>

                    <div className={styles.riskLabels}>
                        <span>Baixo</span>
                        <span>Médio</span>
                        <span>Alto</span>
                    </div>
                </div>
            </div>
        </div>
    );
}