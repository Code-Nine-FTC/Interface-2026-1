import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../layout/Sidebar/Sidebar";
import Navbar from "../layout/Navbar/Navbar";
import Login from "../../pages/Login";
import { estaAutenticado } from "../../services/authService";
import styles from "./Layout.module.css";

export default function Layout() {
    const location = useLocation();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(estaAutenticado);

    useEffect(() => {
        const syncAuth = () => setIsLoggedIn(estaAutenticado());
        window.addEventListener("authChanged", syncAuth);
        return () => window.removeEventListener("authChanged", syncAuth);
    }, []);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const pageTitles: Record<string, string> = {
        "/chatbot": "Chatbot",
        "/dashboard": "Dashboard",
        "/relatorio": "Relatório",
    };

    const pageTitle = pageTitles[location.pathname] || "Página";

    return (
        <div className={styles.layoutRoot}>
            <Sidebar
                isMobileMenuOpen={isMobileSidebarOpen}
                onMobileMenuOpenChange={setIsMobileSidebarOpen}
            />
            <div className={styles.mainColumn}>
                <Navbar
                    pageTitle={pageTitle}
                    isLoggedIn={isLoggedIn}
                    onLoginClick={() => setIsLoginOpen(true)}
                    onMenuClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                    isMobileMenuOpen={isMobileSidebarOpen}
                />
                <div className={styles.contentArea}>
                    <Outlet />
                </div>
                <Login isModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            </div>
        </div>
    );
}
