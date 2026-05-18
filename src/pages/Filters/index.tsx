import { useState, useEffect, useCallback } from "react"
import { useTitle } from "../../context/TitleContext"
import { useFilter } from "../../context/FilterContext"
import SearchBar from "../../components/ui/SearchBar/SearchBar"
import Filters from "../../components/ui/Filters/Filters"
import MapComponent from "../../components/ui/MapComponent/MapComponent"
import {
    searchMunicipios,
    fetchMunicipioBoundary,
    fetchLayerByMunicipio,
    type MunicipioSearchItem,
    type MunicipioFeatureCollection,
} from "../../services/municipioService"
import { buildFilterData, fetchFullMunicipalityData } from "../../services/dashboardService"
import type { Filter } from "../../components/ui/Filters/Filters"
import styles from "./Filters.module.css"

const LAYER_MAP: Record<number, string> = {
    1: "imoveis_rurais",
    2: "unidades_conservacao",
    3: "terras_indigenas",
    4: "assentamentos",
    5: "quilombolas",
    6: "alertas_desmatamento",
}

export default function FiltersPage() {
    const { setTitle } = useTitle()
    const { setSelectedMunicipio: setContextMunicipio, setActiveFilters: setContextFilters, clearFilters } = useFilter()
    const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipioSearchItem | null>(null)
    const [activeFilters, setActiveFilters] = useState<Filter[]>([])
    const [loading, setLoading] = useState(false)
    const [municipioBoundary, setMunicipioBoundary] = useState<MunicipioFeatureCollection | null>(null)
    const [layerGeojsons, setLayerGeojsons] = useState<Record<string, MunicipioFeatureCollection>>({})
    const [mapRenderKey, setMapRenderKey] = useState<number>(Date.now())

    useEffect(() => {
        setTitle("Filtrar dados")
    }, [setTitle])

    const handleMunicipioSelected = async (item: { id?: string | number; label: string; meta?: unknown }) => {
        const meta = item.meta as MunicipioSearchItem
        setSelectedMunicipio(meta)
        setContextMunicipio(meta.id, meta.nome)
        setLayerGeojsons({})
        setLoading(true)

        const boundary = await fetchMunicipioBoundary(meta.id)
        setMunicipioBoundary(boundary)
        setMapRenderKey(Date.now())

        try {
            const data = await fetchFullMunicipalityData(meta.id)
            if (data) {
                const filters = [
                    { id: 1, label: "Imóveis Rurais", checked: data.imoveis_rurais.length > 0 },
                    { id: 2, label: "Unidades de Conservação", checked: data.unidades_conservacao.length > 0 },
                    { id: 3, label: "Terras Indígenas", checked: data.terras_indigenas.length > 0 },
                    { id: 4, label: "Assentamentos", checked: data.assentamentos.length > 0 },
                    { id: 5, label: "Quilombolas", checked: data.quilombolas.length > 0 },
                    { id: 6, label: "Alertas de Desmatamento", checked: data.alertas_desmatamento.length > 0 },
                ]
                setActiveFilters(filters)
                setContextFilters(filters)

                const initialLayers: Record<string, MunicipioFeatureCollection> = {}
                for (const f of filters) {
                    const layerName = LAYER_MAP[f.id]
                    if (!layerName || !f.checked) continue
                    const geojson = await fetchLayerByMunicipio(layerName, meta.id)
                    initialLayers[layerName] = geojson
                }
                setLayerGeojsons(initialLayers)
                setMapRenderKey(Date.now())
            } else {
                setActiveFilters(buildFilterData(null))
            }
        } catch {
            setActiveFilters(buildFilterData(null))
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = useCallback(async (filters: Filter[]) => {
        setActiveFilters(filters)
        setContextFilters(filters)
        if (!selectedMunicipio) return

        const newLayers: Record<string, MunicipioFeatureCollection> = {}
        for (const f of filters) {
            const layerName = LAYER_MAP[f.id]
            if (!layerName) continue
            if (f.checked) {
                const geojson = await fetchLayerByMunicipio(layerName, selectedMunicipio.id)
                newLayers[layerName] = geojson
            }
        }
        setLayerGeojsons(newLayers)
        setMapRenderKey(Date.now())
    }, [selectedMunicipio, setContextFilters])

    const handleClearFilter = () => {
        setSelectedMunicipio(null)
        setMunicipioBoundary(null)
        setLayerGeojsons({})
        setActiveFilters([])
        clearFilters()
        setMapRenderKey(Date.now())
    }

    const mergedGeoJson: MunicipioFeatureCollection | null = (() => {
        const allFeatures = []
        if (municipioBoundary) {
            allFeatures.push(...municipioBoundary.features)
        }
        for (const gc of Object.values(layerGeojsons)) {
            if (gc?.features) {
                allFeatures.push(...gc.features)
            }
        }
        if (allFeatures.length === 0) return municipioBoundary
        return { type: "FeatureCollection", features: allFeatures }
    })()

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Filtros por Município</h1>
                    <p className={styles.subtitle}>
                        Selecione um município e refine as camadas ambientais e territoriais
                    </p>
                </div>
            </header>

            <div className={styles.mainPanel}>
                <div className={styles.searchSection}>
                    <span className={styles.searchLabel}>Município</span>
                    <SearchBar
                        size="lg"
                        onSearch={async (value) => {
                            const results = await searchMunicipios(value)
                            return results.map((m) => ({
                                id: m.id,
                                label: m.nome,
                                meta: m,
                            }))
                        }}
                        onSelect={handleMunicipioSelected}
                    />
                </div>

                {selectedMunicipio && (
                    <div className={styles.municipioInfo}>
                        <p className={styles.municipioName}>{selectedMunicipio.nome}</p>
                        <div className={styles.municipioMeta}>
                            <span>IBGE: {selectedMunicipio.codigo_ibge}</span>
                            <span>UF: {selectedMunicipio.estado_sigla}</span>
                        </div>
                        <button
                            className={styles.clearButton}
                            onClick={handleClearFilter}
                            type="button"
                        >
                            Limpar filtro
                        </button>
                    </div>
                )}

                {selectedMunicipio && (
                    <div className={styles.mapFiltersGrid}>
                        <div className={styles.mapSection}>
                            {mergedGeoJson && (
                                <MapComponent
                                    poluicaoLocalizacoes={[]}
                                    queimadasLocalizacoes={[]}
                                    quilombosLocalizacoes={[]}
                                    geoJsonData={mergedGeoJson as any}
                                    renderKey={mapRenderKey}
                                />
                            )}
                        </div>

                        <div className={styles.filterSection}>
                            <p className={styles.filterTitle}>Camadas disponíveis</p>
                            {loading ? (
                                <div className={styles.placeholder}>Carregando dados do município...</div>
                            ) : (
                                <Filters
                                    data={activeFilters}
                                    onChange={handleFilterChange}
                                />
                            )}
                        </div>
                    </div>
                )}

                {!selectedMunicipio && (
                    <div className={styles.placeholder}>
                        Pesquise e selecione um município acima para visualizar os filtros disponíveis
                    </div>
                )}
            </div>
        </div>
    )
}
