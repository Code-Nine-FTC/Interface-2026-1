import { useEffect, useMemo, useState } from "react"
import { useTitle } from "../../context/TitleContext"

import Chart from "../../components/ui/Chart/Chart"

import styles from "./Dashboard.module.css"
import {
    fetchStateDashboard,
    type StateDashboardResponse,
} from "../../services/dashboardService"

const rankingLabels: Record<keyof StateDashboardResponse["data"]["rankings"], string> = {
    queimadas: "Queimadas",
    desmatamento: "Desmatamento",
    terras_indigenas: "Terras Indígenas",
    quilombolas: "Quilombolas",
    unidades_conservacao: "Unidades de Conservação",
    imoveis_rurais: "Imóveis Rurais",
};

export default function Dashboard() {
    const { setTitle } = useTitle();
    const [stateDashboard, setStateDashboard] = useState<StateDashboardResponse | null>(null);
    const [selectedRankingType, setSelectedRankingType] = useState<keyof StateDashboardResponse["data"]["rankings"]>("queimadas");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle("Dashboard de São Paulo");
    }, [setTitle]);

    useEffect(() => {
        let cancelled = false;

        const loadStateDashboard = async () => {
            try {
                setLoading(true);
                const data = await fetchStateDashboard("sp");
                if (cancelled) return;
                setStateDashboard(data);
            } catch {
                if (!cancelled) {
                    setStateDashboard(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadStateDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const rankingData = useMemo(() => {
        if (!stateDashboard) return [];
        const ranking = stateDashboard.data.rankings[selectedRankingType];
        return Array.isArray(ranking) ? ranking : [];
    }, [stateDashboard, selectedRankingType]);

    const chartData = useMemo(() => {
        return rankingData.slice(0, 10).map((item) => ({
            name: item.municipio.substring(0, 12),
            value: Number(item.valor.toFixed(1)),
        }));
    }, [rankingData]);

    const formattedTotal = (value: number, suffix = "") =>
        `${value.toLocaleString("pt-BR")} ${suffix}`.trim();

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <span>Carregando dados...</span>
            </div>
        );
    }

    if (!stateDashboard) {
        return (
            <div className={styles.loadingContainer}>
                <span>Erro ao carregar dados.</span>
            </div>
        );
    }

    const stateInfo = stateDashboard.data.estado;
    const selectedLabel = rankingLabels[selectedRankingType];
    const topMunicipio = rankingData[0];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>São Paulo — Monitoramento Ambiental</h1>
                    <p className={styles.subtitle}>Indicadores ambientais e rankings municipais</p>
                </div>
                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{stateInfo.total_municipios}</span>
                        <span className={styles.statName}>Municípios</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{formattedTotal(Number(stateInfo.area_protegida_total_ha.toFixed(0)))}</span>
                        <span className={styles.statName}>ha protegidas</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{stateInfo.focos_queimada_periodo}</span>
                        <span className={styles.statName}>Focos</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{formattedTotal(stateInfo.total_alertas_desmatamento)}</span>
                        <span className={styles.statName}>Alertas</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{formattedTotal(stateInfo.total_imoveis_rurais)}</span>
                        <span className={styles.statName}>Imóveis rurais</span>
                    </div>
                </div>
            </header>

            <section className={styles.mainPanel}>
                <div className={styles.tabsBar}>
                    {Object.entries(rankingLabels).map(([key, label]) => (
                        <button
                            key={key}
                            className={`${styles.tab} ${selectedRankingType === key ? styles.tabActive : ""}`}
                            onClick={() => setSelectedRankingType(key as keyof StateDashboardResponse["data"]["rankings"])}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className={styles.contentGrid}>
                    <div className={styles.chartSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Top 10 — {selectedLabel}</h3>
                            <span className={styles.count}>{rankingData.length} municípios</span>
                        </div>
                        <div className={styles.chart}>
                            <Chart data={chartData} title="" />
                        </div>
                    </div>

                    <div className={styles.tableSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Ranking Completo</h3>
                            <span className={styles.topMunicipio}>{topMunicipio?.municipio}</span>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Município</th>
                                        <th>Valor</th>
                                        <th>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankingData.map((item, idx) => (
                                        <tr key={`${item.municipio}-${idx}`}>
                                            <td className={styles.position}>{idx + 1}</td>
                                            <td>{item.municipio}</td>
                                            <td className={styles.value}>{item.valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</td>
                                            <td className={styles.percent}>{item.percentual_do_estado.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
