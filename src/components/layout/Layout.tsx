
import Sidebar from "../layout/Sidebar/Sidebar";
import Navbar from "../layout/Navbar/Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }: any) {
    const location = useLocation();
    const pageTitles: Record<string, string> = {
        "/": "Chatbot",
        "/dashboard": "Dashboard",
        "/relatorio": "Relatório",
        "/filtros": "Filtrar dados",
    };
    
    const pageTitle = pageTitles[location.pathname] || "Página";

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Navbar pageTitle={pageTitle} />
                <div style={{ padding: "20px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}