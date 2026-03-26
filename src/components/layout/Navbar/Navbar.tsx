import styles from "./Navbar.module.css";
import { useTheme } from "../../../context/ThemeContext";
import { useLoading } from "../../../context/LoadingContext";
import Skeleton from "../../ui/SkeletonAnimation/Skeleton";

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { isLoading } = useLoading();

    const SunDimIcon = () => (
        <svg
            width="24" height="24" viewBox="0 0 42 42" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={toggleTheme}
            style={{ cursor: 'pointer' }}
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

    const LangIcon = () => (
        <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.75 14L19.25 24.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 24.5L17.5 14L21 8.75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 8.75H24.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.25 3.5H14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M38.5 38.5L29.75 21L21 38.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M24.5 31.5H35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    return (
        <header
            className={styles.container}
            style={{
                background: theme.background?.primary || "#fff",
                fontFamily: theme.font?.family,
            }}
        >
            <div className={styles.navbar}>
                <Skeleton isLoading={isLoading} variant="rectangular">
                    <h1
                        style={{
                            color: theme.orange?.main || "orange",
                            fontSize: theme.font?.size?.lg,
                        }}
                    >
                        Título do Chat
                    </h1>
                </Skeleton>

                <div className={styles.actions} style={{ color: theme.orange?.main || "orange" }}>
                    <Skeleton isLoading={isLoading} variant="rectangular">
                        <SunDimIcon />
                    </Skeleton>

                    <Skeleton isLoading={isLoading} variant="rectangular">
                        <LangIcon />
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