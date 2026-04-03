import { useEffect, useState } from "react";
import { useTitle } from "../../context/TitleContext";

import SearchBar, { SearchItem } from "../../components/ui/SearchBar/SearchBar";
import Filters from "../../components/ui/Filters/Filters";
import RegionCard from "../../components/ui/RegionCard/RegionCard";
import Chart from "../../components/ui/Chart/Chart";

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

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <SearchBar
                size="md"
                data={mockRegions.map((region) => ({
                    label: region.name,
                }))}
                onSelect={handleSelectRegion}
            />

            <Filters />

            {selectedRegion && <RegionCard data={selectedRegion} />}
            <Chart region={selectedRegion} />
        </div>
    );
}