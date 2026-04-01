import { useEffect } from "react";
import { useTitle } from "../../context/TitleContext";
import SearchBar from "../../components/ui/SearchBar/SearchBar";
import Filters from "../../components/ui/Filters/Filters";

export default function Dashboard() {
    const { setTitle } = useTitle();

    useEffect(() => {
        setTitle("Dashboard do Sistema");
    }, []);

    return (
        <div>
            <SearchBar size="md" />

            <Filters />
        </div>
    );
}