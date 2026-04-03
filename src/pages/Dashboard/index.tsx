import { useEffect, useState } from "react";
import { useTitle } from "../../context/TitleContext";

import SearchBar, { SearchItem } from "../../components/ui/SearchBar/SearchBar";
import Filters from "../../components/ui/Filters/Filters";
import RegionCard from "../../components/ui/RegionCard/RegionCard";
import Chart from "../../components/ui/Chart/Chart";
import MapComponent from "../../components/ui/MapComponent/MapComponent";

import styles from "./Dashboard.module.css";

import { mockRegions, RegionData } from "../../components/ui/RegionCard/Mock";

export default function Dashboard() {
    const { setTitle } = useTitle();

    const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(
        mockRegions[0]
    );

    useEffect(() => {
        setTitle("Dashboard do Sistema");
    }, []);

    const handleSelectRegion = (item: SearchItem) => {
        const found = mockRegions.find(
            (region) => region.name === item.label
        );

        if (found) {
            setSelectedRegion(found);
        }
    };

    
    const poluicao = [
        { lat: -23.55, lng: -46.63, nome: "Centro", indice: 80 },
        { lat: -23.57, lng: -46.65, nome: "Pinheiros", indice: 65 },
    ];

    const queimadas = [
        { lat: -22.9, lng: -47.06, nome: "Campinas", casos: 12 },
    ];

    const quilombos = [
        { lat: -24.0, lng: -47.0, nome: "Vale do Ribeira", status: "Regularizado" },
    ];

    return (
        <div className={styles.container}>
            
            <SearchBar
                size="md"
                data={mockRegions.map((region) => ({
                    label: region.name,
                }))}
                onSelect={handleSelectRegion}
            />


            <div className={styles.topSection}>

                <div className={styles.mapWrapper}>
                    <MapComponent
                        poluicaoLocalizacoes={poluicao}
                        queimadasLocalizacoes={queimadas}
                        quilombosLocalizacoes={quilombos}
                    />
                </div>

                <div className={styles.filtersWrapper}>
                    <Filters />
                </div>

            </div>

            {/* 📍 Region */}
            {selectedRegion && <RegionCard data={selectedRegion} />}

            {/* 📊 Title */}
            <h2 className={styles.metricsTitle}>
                Métricas da região:
            </h2>

            {/* 📈 Charts */}
            <Chart region={selectedRegion} />

        </div>
    );
}