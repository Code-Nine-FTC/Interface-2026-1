import { useState } from "react";
import styles from "./Navbar.module.css";
import { useTheme } from "../../../context/ThemeContext";
import { useLoading } from "../../../context/LoadingContext";
import Skeleton from "../../ui/SkeletonAnimation/Skeleton";
import { useTitle } from "../../../context/TitleContext";

type NavbarProps = {
    pageTitle?: string;
    onLoginClick?: () => void;
    onMenuClick?: () => void;
    isMobileMenuOpen?: boolean;
};

export default function Navbar({
    pageTitle,
    onLoginClick,
    onMenuClick,
    isMobileMenuOpen = false,
}: NavbarProps) {
    const { theme, toggleTheme, mode } = useTheme();
    const { isLoading } = useLoading();

    const [isSpinning, setIsSpinning] = useState(false);

    const handleToggleTheme = () => {
        setIsSpinning(true);
        toggleTheme();
        setTimeout(() => setIsSpinning(false), 600);
    };

    const SunLightIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={handleToggleTheme}
            className={isSpinning ? styles.spin : ""}
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
    );

    const SunDimIcon = () => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={handleToggleTheme}
            className={isSpinning ? styles.spin : ""}
        >
            <path d="M21 28C24.866 28 28 24.866 28 21C28 17.134 24.866 14 21 14C17.134 14 14 17.134 14 21C14 24.866 17.134 28 21 28Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 7H21.0175" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M35 21H35.0175" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 35H21.0175" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 21H7.0175" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M30.8998 11.1003H30.9173" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M30.8998 30.8997H30.9173" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.1002 30.8997H11.1177" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.1002 11.1003H11.1177" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    const UserIcon = () => (
        <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="15.75" r="6.75" stroke="currentColor" strokeWidth="4" />
            <path d="M9 35C9 28.3726 14.3726 23 21 23C27.6274 23 33 28.3726 33 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const { title } = useTitle();
    
    return (
        <header
            className={styles.container}
            style={{
                background: theme.background?.primary || "#fff",
                fontFamily: theme.font?.family,
            }}
        >
            <div className={styles.navbar}>
                <div className={styles.titleArea}>
                    <button
                        type="button"
                        className={styles.menuButton}
                        onClick={onMenuClick}
                        aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="app-sidebar"
                    >
                        <HamburgerIcon isOpen={isMobileMenuOpen} />
                    </button>

                    <Skeleton isLoading={isLoading} variant="rectangular" fullWidth>
                        <h1
                            className={styles.pageTitle}
                            style={{
                                color: theme.orange?.main || "orange",
                                fontSize: theme.font?.size?.lg,
                            }}
                        >
                            {title || pageTitle || "Chatbot"}
                        </h1>
                    </Skeleton>
                </div>

                <div
                    className={styles.actions}
                    style={{ color: theme.orange?.main || "orange" }}
                >
                    <Skeleton isLoading={isLoading} variant="rectangular">
                        {mode === "light" ? <SunLightIcon /> : <SunDimIcon />}
                    </Skeleton>

                    <Skeleton isLoading={isLoading} variant="rectangular">
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={onLoginClick}
                            aria-label="Abrir login"
                        >
                            <UserIcon />
                        </button>
                    </Skeleton>
                </div>
            </div>

            <div
                className={styles.hr}
                style={{ backgroundColor: theme.shared?.hr || "#ccc" }}
            />
        </header>
    );
}

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {isOpen ? (
            <>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </>
        ) : (
            <>
                <path d="M4 7H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M4 12H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M4 17H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </>
        )}
    </svg>
);
