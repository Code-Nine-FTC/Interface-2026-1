import { useEffect, useMemo, useRef, useState } from "react"
import { useTitle } from "../../context/TitleContext"
import { useFilter } from "../../context/FilterContext"

import Chart from "../../components/ui/Chart/Chart"

import styles from "./Dashboard.module.css"
import {
    fetchStateDashboard,
    fetchFullMunicipalityData,
    type RankingItem,
    type StateDashboardResponse,
    type ResponseMunicipal,
} from "../../services/dashboardService"

const rankingLabels: Record<keyof StateDashboardResponse["data"]["rankings"], string> = {
    queimadas: "Queimadas",
    desmatamento: "Desmatamento",
    terras_indigenas: "Terras Indígenas",
    quilombolas: "Quilombolas",
    unidades_conservacao: "Unidades de Conservação",
    imoveis_rurais: "Imóveis Rurais",
};

const LAYER_LABELS: Record<string, string> = {
    imoveis_rurais: "Imóveis Rurais",
    unidades_conservacao: "Unidades de Conservação",
    terras_indigenas: "Terras Indígenas",
    assentamentos: "Assentamentos",
    quilombolas: "Quilombolas",
    alertas_desmatamento: "Alertas de Desmatamento",
};

export default function Dashboard() {
    const { setTitle } = useTitle();
    const { selectedMunicipioNome, selectedMunicipioId } = useFilter();
    const [stateDashboard, setStateDashboard] = useState<StateDashboardResponse | null>(null);
    const [municipioData, setMunicipioData] = useState<ResponseMunicipal | null>(null);
    const [selectedRankingType, setSelectedRankingType] = useState<keyof StateDashboardResponse["data"]["rankings"]>("queimadas");
    const [loading, setLoading] = useState(true);
    const tableRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!selectedMunicipioId) {
            setMunicipioData(null);
            return;
        }
        let cancelled = false;
        const load = async () => {
            const data = await fetchFullMunicipalityData(selectedMunicipioId);
            if (!cancelled) setMunicipioData(data);
        };
        void load();
        return () => { cancelled = true; };
    }, [selectedMunicipioId]);

    const rankingData = useMemo(() => {
        if (!stateDashboard) return [];
        const ranking = stateDashboard.data.rankings[selectedRankingType];
        return Array.isArray(ranking) ? ranking : [];
    }, [stateDashboard, selectedRankingType]);

    const chartData = useMemo(() => {
        return rankingData.slice(0, 10).map((item) => ({
            name: item.municipio.substring(0, 12),
            value: Number(item.valor.toFixed(1)),
            unit: item.unidade,
        }));
    }, [rankingData]);

    const filteredIndex = useMemo(() => {
        if (!selectedMunicipioNome) return -1;
        const nome = selectedMunicipioNome.toLowerCase();
        return rankingData.findIndex((item) =>
            item.municipio.toLowerCase().includes(nome)
        );
    }, [rankingData, selectedMunicipioNome]);

    useEffect(() => {
        if (filteredIndex >= 0 && tableRef.current) {
            const rows = tableRef.current.querySelectorAll("tbody tr");
            const targetRow = rows[filteredIndex];
            if (targetRow) {
                targetRow.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }
    }, [filteredIndex]);

    const formattedTotal = (value: number, suffix = "") =>
        `${value.toLocaleString("pt-BR")} ${suffix}`.trim();

    const formatArea = (areaHa: number) => ({
        ha: formattedTotal(Number(areaHa.toFixed(0))),
        km2: formattedTotal(Number((areaHa / 100).toFixed(2))),
    });

    const formatRankingValue = (item: RankingItem) => {
        const unit = item.unidade?.trim() ?? "";

        if (/ha|hect/i.test(unit)) {
            return `${item.valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha (${(item.valor / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km²)`;
        }

        return `${item.valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ""}`;
    };

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
    const protectedArea = formatArea(stateInfo.area_protegida_total_ha);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>São Paulo — Monitoramento Ambiental</h1>
                    <p className={styles.subtitle}>Indicadores ambientais e rankings municipais</p>
                    {selectedMunicipioNome && (
                        <span className={styles.filterChip}>
                            Filtrando por: {selectedMunicipioNome}
                        </span>
                    )}
                </div>

                {municipioData && (
                    <div className={styles.municipioDetail}>
                        <strong>{municipioData.nome}</strong> — camadas disponíveis:
                        <div className={styles.layerChips}>
                            {Object.entries(LAYER_LABELS).map(([key, label]) => {
                                const count = (municipioData as any)[key]?.length ?? 0;
                                return (
                                    <span
                                        key={key}
                                        className={`${styles.layerChip} ${count > 0 ? styles.layerChipActive : ""}`}
                                    >
                                        {label} ({count})
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{stateInfo.total_municipios}</span>
                        <span className={styles.statName}>Municípios</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNum}>{protectedArea.ha} ha</span>
                        <span className={styles.statSecondary}>{protectedArea.km2} km²</span>
                        <span className={styles.statName}>Área protegida</span>
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
                        <div className={styles.tableWrapper} ref={tableRef}>
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
                                    {rankingData.map((item, idx) => {
                                        const isHighlighted = selectedMunicipioNome &&
                                            item.municipio.toLowerCase().includes(selectedMunicipioNome.toLowerCase());
                                        return (
                                            <tr
                                                key={`${item.municipio}-${idx}`}
                                                className={isHighlighted ? styles.highlightedRow : undefined}
                                            >
                                                <td className={styles.position}>{idx + 1}</td>
                                                <td>{item.municipio}</td>
                                                <td className={styles.value}>{formatRankingValue(item)}</td>
                                                <td className={styles.percent}>{item.percentual_do_estado.toFixed(1)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
