import { useEffect, useMemo, useState } from "react";
import { useTitle } from "../../context/TitleContext";
import { buildChartData } from "../../components/ui/Chart/chartData";
import SearchBar, { SearchItem } from "../../components/ui/SearchBar/SearchBar";
import RegionCard from "../../components/ui/RegionCard/RegionCard";
import Chart from "../../components/ui/Chart/Chart";
import MapComponent from "../../components/ui/MapComponent/MapComponent";

import styles from "./Dashboard.module.css";
import { enviarMensagemChat, type Mapa } from "../../services/chatService";
import {
    fetchDashboardMunicipalityMetrics,
    fetchDashboardMunicipalities,
    fetchFullMunicipalityData,
    getMunicipalityFireCount,
    mapMunicipalToRegionData,
    mapMunicipalitiesToSearchItems,
    type MunicipalityFeature,
    type MunicipalityMetricItem,
} from "../../services/dashboardService";

const DASHBOARD_CHAT_UUID = "7f51f8c8-aac2-4f3e-a066-95f538f58ac1";
const DASHBOARD_CHAT_STORAGE_KEY = "dashboard_chat_id";

function getDashboardChatId(): string {
    if (typeof window === "undefined") return DASHBOARD_CHAT_UUID;
    const stored = window.localStorage.getItem(DASHBOARD_CHAT_STORAGE_KEY);
    if (stored && stored.trim().length > 0) return stored;
    return DASHBOARD_CHAT_UUID;
}

function saveDashboardChatId(chatId: string) {
    if (typeof window === "undefined") return;
    if (!chatId || !chatId.trim()) return;
    window.localStorage.setItem(DASHBOARD_CHAT_STORAGE_KEY, chatId);
}

function normalizeText(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function municipalityFeatureToMap(feature: MunicipalityFeature | null): Mapa | null {
    if (!feature) return null;
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: feature.geometry,
                properties: {
                    nome: feature.properties.nome,
                    municipio: feature.properties.nome,
                    tipo: "Limite municipal",
                },
            },
        ],
    };
}

function filterMapByMunicipality(map: Mapa | null, municipalityName: string): Mapa | null {
    if (!map?.features?.length) return map;
    const target = normalizeText(municipalityName);
    const filtered = map.features.filter((feature) => {
        const properties = (feature?.properties ?? {}) as Record<string, unknown>;
        const candidateValues = [
            properties.municipio, properties.nome, properties.municipality,
            properties.cidade, properties.label, properties.estado, properties.uf,
        ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

        return candidateValues.some((candidate) => {
            const normalizedCandidate = normalizeText(candidate);
            return normalizedCandidate === target || normalizedCandidate.includes(target) || target.includes(normalizedCandidate);
        });
    });
    return filtered.length === 0 ? map : { ...map, features: filtered };
}

export default function Dashboard() {
    const { setTitle } = useTitle();
    const [municipalities, setMunicipalities] = useState<MunicipalityFeature[]>([]);
    const [municipalityMetrics, setMunicipalityMetrics] = useState<MunicipalityMetricItem[]>([]);
    const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityFeature | null>(null);
    const [dashboardMap, setDashboardMap] = useState<Mapa | null>(null);
    const [dashboardChatId, setDashboardChatId] = useState<string>(getDashboardChatId);
    const [loading, setLoading] = useState(true);
    const [fullData, setFullData] = useState<ResponseMunicipal | null>(null);

    useEffect(() => { setTitle("Dashboard do Sistema"); }, []);

    useEffect(() => {
        if (!selectedMunicipality) {
            setFullData(null);
            return;
        }

        let cancelled = false;
        const loadFullData = async () => {
            try {
                const data = await fetchFullMunicipalityData(selectedMunicipality.properties.id);
                if (!cancelled) {
                    setFullData(data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados completos do município", error);
            }
        };

        loadFullData();

        return () => { cancelled = true; };
    }, [selectedMunicipality]);

    useEffect(() => {
        let cancelled = false;
        const loadData = async () => {
            try {
                setLoading(true);
                const [list, metrics] = await Promise.all([
                    fetchDashboardMunicipalities(),
                    fetchDashboardMunicipalityMetrics(),
                ]);
                if (cancelled) return;
                setMunicipalities(list);
                setMunicipalityMetrics(metrics);

                if (list.length > 0) {
                    const first = list[0];
                    setSelectedMunicipality(first);
                    const resp = await enviarMensagemChat(`Queimadas em ${first.properties.nome}`, dashboardChatId);
                    if (!cancelled) {
                        if (resp.chat_id) { setDashboardChatId(resp.chat_id); saveDashboardChatId(resp.chat_id); }
                        const filtered = filterMapByMunicipality(resp.mapa ?? null, first.properties.nome);
                        setDashboardMap(filtered?.features?.length ? filtered : municipalityFeatureToMap(first));
                    }
                }
            } catch { /* erro silencioso */ } finally { if (!cancelled) setLoading(false); }
        };
        loadData();
        return () => { cancelled = true; };
    }, []);

    const searchItems = useMemo(() => mapMunicipalitiesToSearchItems(municipalities), [municipalities]);
    const mapRenderKey = useMemo(() => `${selectedMunicipality?.properties.id}-${dashboardMap?.features?.length ?? 0}`, [dashboardMap, selectedMunicipality]);

    const selectedRegion = useMemo(() => {
            if (!selectedMunicipality) return null;
            const count = getMunicipalityFireCount(selectedMunicipality.properties.nome, municipalityMetrics);

            const matchesData = fullData && (
                fullData.nome === selectedMunicipality.properties.nome ||
                String(fullData.codigo_ibge) === String(selectedMunicipality.properties.codigo_ibge)
            );

            if (matchesData) {
                const mappedData = mapMunicipalToRegionData(fullData, count);
             
                return {
                    ...mappedData,
                    areaKm2: mapMunicipalToRegionData(selectedMunicipality, count).areaKm2 
                };
            }

            
            return mapMunicipalToRegionData(selectedMunicipality, count);
        }, [municipalityMetrics, selectedMunicipality, fullData]);

    const chartData = useMemo(() => {
        if (!selectedRegion) return [];
        return buildChartData(selectedRegion);
    }, [selectedRegion]);

    const handleSelectRegion = async (item: SearchItem) => {
        const fromList = municipalities.find(r => r.properties.id === String(item.id) || r.properties.nome === item.label);
        if (!fromList) return;
        setSelectedMunicipality(fromList);
        try {
            const resp = await enviarMensagemChat(`Queimadas em ${fromList.properties.nome}`, dashboardChatId);
            const filtered = filterMapByMunicipality(resp.mapa ?? null, fromList.properties.nome);
            setDashboardMap(filtered?.features?.length ? filtered : municipalityFeatureToMap(fromList));
        } catch { setDashboardMap(municipalityFeatureToMap(fromList)); }
    };

    if (loading && !selectedRegion) return <div className={styles.container}><p>Carregando...</p></div>;

return (
        <div className={styles.container}>
            <SearchBar size="md" data={searchItems} onSelect={handleSelectRegion} />

            <section className={styles.section}>
                <h3 className={styles.sectionTitleMain}>
                    Visualização de métricas gerais por cidade
                </h3>
                {selectedRegion && <RegionCard data={selectedRegion} />}
            </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitleMain}>
                        Visualização gráfica especializada
                    </h3>
                    
                    <div className={styles.mainContent}>
                        
                        <div className={styles.chartWrapper}>
                            <Chart
                                region={selectedRegion ?? undefined} 
                                data={chartData}
                                title={`Análise de ${selectedMunicipality?.properties.nome || 'Dados'}`}
                            />
                        </div>

                        
                        <div className={styles.mapWrapper}>
                            <MapComponent
                                poluicaoLocalizacoes={[]}
                                queimadasLocalizacoes={[]}
                                quilombosLocalizacoes={[]}
                                geoJsonData={dashboardMap}
                                renderKey={mapRenderKey}
                            />
                        </div>
                    </div>
                </section>
        </div>
    );
}