import { useEffect } from "react";
import { useTitle } from "../../context/TitleContext";
import SearchBar from "../../components/ui/SearchBar/SearchBar";

export default function Dashboard() {
    const { setTitle } = useTitle();

    useEffect(() => {
        setTitle("Dashboard do Sistema");
    }, []);

    return (
        <div>

            <SearchBar size="md" />


        </div>
    );
}