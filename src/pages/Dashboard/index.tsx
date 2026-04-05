import { useEffect, useMemo, useState } from "react";
import { useTitle } from "../../context/TitleContext";

import SearchBar, { SearchItem } from "../../components/ui/SearchBar/SearchBar";
import RegionCard from "../../components/ui/RegionCard/RegionCard";
import Chart from "../../components/ui/Chart/Chart";
import MapComponent from "../../components/ui/MapComponent/MapComponent";

import styles from "./Dashboard.module.css";
import { enviarMensagemChat, type Mapa } from "../../services/chatService";
import {
    fetchDashboardMunicipalityMetrics,
    fetchDashboardMunicipalities,
    getMunicipalityFireCount,
    mapMunicipalToRegionData,
    mapMunicipalitiesToSearchItems,
    type MunicipalityFeature,
    type MunicipalityMetricItem,
} from "../../services/dashboardService";

function normalizeText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
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
            properties.municipio,
            properties.nome,
            properties.municipality,
            properties.cidade,
            properties.label,
            properties.estado,
            properties.uf,
        ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

        return candidateValues.some((candidate) => {
            const normalizedCandidate = normalizeText(candidate);
            return (
                normalizedCandidate === target ||
                normalizedCandidate.includes(target) ||
                target.includes(normalizedCandidate)
            );
        });
    });

    if (filtered.length === 0 || filtered.length === map.features.length) {
        return map;
    }

    return {
        ...map,
        features: filtered,
    };
}

export default function Dashboard() {
    const { setTitle } = useTitle();

    const [municipalities, setMunicipalities] = useState<MunicipalityFeature[]>([]);
    const [municipalityMetrics, setMunicipalityMetrics] = useState<MunicipalityMetricItem[]>([]);
    const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityFeature | null>(null);
    const [dashboardMap, setDashboardMap] = useState<Mapa | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle("Dashboard do Sistema");
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadMunicipalities = async () => {
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
                    setSelectedMunicipality(list[0]);
                    const response = await enviarMensagemChat(
                        `Queimadas em ${list[0].properties.nome}`,
                        null
                    );

                    if (!cancelled) {
                        setChatId(response.chat_id);
                        const filteredMap = filterMapByMunicipality(response.mapa ?? null, list[0].properties.nome);
                        setDashboardMap(filteredMap?.features?.length ? filteredMap : municipalityFeatureToMap(list[0]));
                    }
                } else {
                    setSelectedMunicipality(null);
                    setDashboardMap(null);
                }
            } catch {
                if (!cancelled) {
                    setMunicipalities([]);
                    setMunicipalityMetrics([]);
                    setSelectedMunicipality(null);
                    setDashboardMap(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadMunicipalities();

        return () => {
            cancelled = true;
        };
    }, []);

    const searchItems = useMemo(() => mapMunicipalitiesToSearchItems(municipalities), [municipalities]);
    const mapRenderKey = useMemo(() => {
        if (!selectedMunicipality) return "dashboard-map-empty";

        return `${selectedMunicipality.properties.id}-${dashboardMap?.features?.length ?? 0}`;
    }, [dashboardMap?.features?.length, selectedMunicipality]);

    const selectedRegion = useMemo(() => {
        if (!selectedMunicipality) return null;

        const fireCount = getMunicipalityFireCount(
            selectedMunicipality.properties.nome,
            municipalityMetrics
        );

        return mapMunicipalToRegionData(selectedMunicipality, fireCount);
    }, [municipalityMetrics, selectedMunicipality]);

    const chartData = useMemo(() => {
        if (!selectedMunicipality) return [];

        const fireCount = getMunicipalityFireCount(
            selectedMunicipality.properties.nome,
            municipalityMetrics
        );

        return [
            {
                name: selectedMunicipality.properties.nome,
                value: fireCount,
            },
        ];
    }, [municipalityMetrics, selectedMunicipality]);

    const handleSelectRegion = async (item: SearchItem) => {
        const fromMeta = item.meta as MunicipalityFeature | undefined;
        const fromList = fromMeta ?? municipalities.find(
            (region) => region.properties.id === String(item.id) || region.properties.nome === item.label
        );

        if (!fromList) {
            return;
        }

        setSelectedMunicipality(fromList);

        try {
            const response = await enviarMensagemChat(
                `Queimadas em ${fromList.properties.nome}`,
                chatId
            );

            setChatId(response.chat_id);
            const filteredMap = filterMapByMunicipality(response.mapa ?? null, fromList.properties.nome);
            setDashboardMap(filteredMap?.features?.length ? filteredMap : municipalityFeatureToMap(fromList));
        } catch {
            setDashboardMap(municipalityFeatureToMap(fromList));
        }
    };

    if (loading && !selectedRegion) {
        return (
            <div className={styles.container}>
                <p>Carregando dados do dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SearchBar
                size="md"
                data={searchItems}
                onSelect={handleSelectRegion}
            />


            <div className={styles.topSection}>

                <div className={styles.mapWrapper}>
                    <MapComponent
                        poluicaoLocalizacoes={[]}
                        queimadasLocalizacoes={[]}
                        quilombosLocalizacoes={[]}
                        geoJsonData={dashboardMap}
                        renderKey={mapRenderKey}
                    />
                </div>

                <div className={styles.filtersWrapper}>
                    {selectedRegion && <RegionCard data={selectedRegion} />}

                    <h2 className={styles.metricsTitle}>
                        Métricas da região:
                    </h2>

                    <Chart
                        region={selectedRegion ?? undefined}
                        data={chartData}
                        title="Focos de incêndio do município selecionado"
                    />
                </div>
            </div>

        </div>
    );
}