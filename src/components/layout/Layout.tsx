import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../layout/Sidebar/Sidebar";
import Navbar from "../layout/Navbar/Navbar";
import Login from "../../pages/Login";

export default function Layout() {
    const location = useLocation();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const pageTitles: Record<string, string> = {
        "/chatbot": "Chatbot",
        "/dashboard": "Dashboard",
        "/relatorio": "Relatório",
        "/filtros": "Filtrar dados",
    };

    const pageTitle = pageTitles[location.pathname] || "Página";

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Navbar pageTitle={pageTitle} onLoginClick={() => setIsLoginOpen(true)} />
                <div style={{ padding: "20px" }}>
                    <Outlet />
                </div>
                <Login isModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            </div>
        </div>
    );
}