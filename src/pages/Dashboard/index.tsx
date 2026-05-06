import { useEffect, useMemo, useState } from "react";
import { useTitle } from "../../context/TitleContext";

// SearchBar and RegionCard are unused in this page (kept out to avoid TS/ESLint warnings)
import Chart from "../../components/ui/Chart/Chart";
import { RankingBarChart } from "../../ui/Chart/RankingBarChart";

import styles from "./Dashboard.module.css";
import {
    fetchStateDashboard,
    mapEstadoToRegionData,
    type RankingItem,
    type StateDashboardResponse,
} from "../../services/dashboardService";

export default function Dashboard() {
    const { setTitle } = useTitle();

    const [stateDashboard, setStateDashboard] = useState<StateDashboardResponse | null>(null);
    const [selectedRankingType, setSelectedRankingType] = useState<"queimadas" | "desmatamento" | "terras_indigenas" | "quilombolas" | "unidades_conservacao" | "imoveis_rurais">("queimadas");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle("Dashboard do Sistema");
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadStateDashboard = async () => {
            try {
                setLoading(true);
                const data = await fetchStateDashboard("sp");

                if (cancelled) return;

                if (data) {
                    setStateDashboard(data);
                } else {
                    setStateDashboard(null);
                }
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


    const selectedRegion = useMemo(() => {
        if (!stateDashboard) return null;
        return mapEstadoToRegionData(stateDashboard.data.estado);
    }, [stateDashboard]);

    const chartData = useMemo(() => {
        if (!stateDashboard) return [];

        const ranking = stateDashboard.data.rankings[selectedRankingType];
        if (!ranking || !Array.isArray(ranking)) return [];
        
        return ranking.slice(0, 10).map((item) => ({
            name: item.municipio,
            value: item.valor,
        }));
    }, [stateDashboard, selectedRankingType]);

    const rankingData = useMemo(() => {
        if (!stateDashboard) return [];
        const ranking = stateDashboard.data.rankings[selectedRankingType];
        return (Array.isArray(ranking) ? ranking : []) || [];
    }, [stateDashboard, selectedRankingType]);

    if (loading || !selectedRegion) {
        return (
            <div className={styles.container}>
                <p>Carregando dados do dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>

            <div className={styles.topSection}>
                <div className={styles.filtersWrapper}>
                    {/* {selectedRegion && <RegionCard data={selectedRegion} />}

                    <h2 className={styles.metricsTitle}>
                        Métricas da região:
                    </h2> */}

                    <div className={styles.rankingSelector}>
                        <label htmlFor="ranking-select">Tipo de ranking:</label>
                        <select 
                            id="ranking-select"
                            value={selectedRankingType}
                            onChange={(e) => setSelectedRankingType(e.target.value as "queimadas" | "desmatamento" | "terras_indigenas" | "quilombolas" | "unidades_conservacao" | "imoveis_rurais")}
                        >
                            <option value="queimadas">Queimadas (focos)</option>
                            <option value="desmatamento">Desmatamento (ha)</option>
                            <option value="terras_indigenas">Terras Indígenas (ha)</option>
                            <option value="quilombolas">Terras Quilombolas (ha)</option>
                            <option value="unidades_conservacao">Unidades de Conservação (ha)</option>
                            <option value="imoveis_rurais">Imóveis Rurais (ha)</option>
                        </select>
                    </div>
                    <h3 style={{paddingBottom:"20px"}}>Ranking completo - {selectedRankingType.replace(/_/g, " ")}</h3>


                    <div className={styles.rankingTable}>
                        <table>
                            <thead>
                                <tr style={{position:"relative", backgroundColor:"#ffff"}}>
                                    <th>Posição</th>
                                    <th>Município</th>
                                    <th>Valor</th>
                                    <th>% do estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.map((item, index) => (
                                    <tr key={`${item.municipio}-${index}`}>
                                        <td>{index + 1}</td>
                                        <td>{item.municipio}</td>
                                        <td>{item.valor.toFixed(2)} {item.unidade}</td>
                                        <td>{item.percentual_do_estado.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={styles.bottomSection}>
                <h2>Gráficos por ranking</h2>
                <div className={styles.chartsGrid}>
                    {stateDashboard && (
                        (() => {
                            const r = stateDashboard.data.rankings;
                            const list = [
                                { key: 'queimadas', title: 'Queimadas', color: '#e57373' },
                                { key: 'desmatamento', title: 'Desmatamento', color: '#81c784' },
                                { key: 'terras_indigenas', title: 'Terras Indígenas', color: '#ffd54f' },
                                { key: 'quilombolas', title: 'Quilombolas', color: '#ba68c8' },
                                { key: 'unidades_conservacao', title: 'Unidades de Conservação', color: '#4fc3f7' },
                                { key: 'imoveis_rurais', title: 'Imóveis Rurais', color: '#a1887f' },
                            ];

                            return list.map((cfg) => {
                                const items = Array.isArray((r as any)[cfg.key]) ? (r as any)[cfg.key].slice(0, 10) : [];
                                return (
                                    <div key={cfg.key} className={styles.chartCard}>
                                        <RankingBarChart title={cfg.title} data={items} color={cfg.color} />
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>
            </div>
        </div>
    );
}