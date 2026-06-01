import { useEffect, useState, useCallback } from "react";
import styles from "./Navbar.module.css";
import { useTheme } from "../../../context/ThemeContext";
import { useLoading } from "../../../context/LoadingContext";
import Skeleton from "../../ui/SkeletonAnimation/Skeleton";
import { useTitle } from "../../../context/TitleContext";
import {
    AUTH_CHANGED_EVENT,
    AUTH_TOKEN_KEY,
    getMe,
    obterToken,
    removerToken,
    usuarioEhAdmin,
} from "../../../services/authService";
import { dispararAtualizacaoManual, obterStatusEtl } from "../../../services/adminService";

type NavbarProps = {
    pageTitle?: string;
    isLoggedIn?: boolean;
    onLoginClick?: () => void;
    onMenuClick?: () => void;
    isMobileMenuOpen?: boolean;
};

export default function Navbar({
    pageTitle,
    isLoggedIn = false,
    onLoginClick,
    onMenuClick,
    isMobileMenuOpen = false,
}: NavbarProps) {
    const { theme, toggleTheme, mode } = useTheme();
    const { isLoading } = useLoading();
    const { title } = useTitle();

    const [isSpinning, setIsSpinning] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Estados de controle de status e notificações visuais
    const [etlStatusText, setEtlStatusText] = useState<string | null>(null);
    const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: "sucesso" | "erro" } | null>(null);

    // Função para checar o status atual do banco de dados (Sincronizada com o Python)
    const checarStatusAtual = useCallback(async () => {
        const token = obterToken();
        if (!token || !isAdmin) return;

        try {
            const resposta = await obterStatusEtl();
            
            // Tratamos a string em minúsculo para evitar incompatibilidade ("RUNNING" vs "running")
            const statusDoServidor = resposta?.data?.status_atual?.toLowerCase() || "";

            if (statusDoServidor === "running" || statusDoServidor === "em_processamento") {
                setIsUpdating(true);
                setEtlStatusText("Processando ETL...");
            } else if (statusDoServidor === "completed" || statusDoServidor === "sucesso") {
                setIsUpdating(false);
                setEtlStatusText("Atualização concluída!");
                setTimeout(() => setEtlStatusText(null), 5000);
            } else if (statusDoServidor === "failed" || statusDoServidor === "erro") {
                setIsUpdating(false);
                setEtlStatusText("Falha na última sincronização.");
                setTimeout(() => setEtlStatusText(null), 5000);
            } else {
                setIsUpdating(false);
                setEtlStatusText(null);
            }
        } catch (err) {
            console.error("Erro ao checar status do ETL:", err);
        }
    }, [isAdmin]);

    // Inicialização do estado de administrador
    useEffect(() => {
        let isMounted = true;

        const loadAdminStatus = async () => {
            const token = obterToken();

            if (!token) {
                if (isMounted) setIsAdmin(false);
                return;
            }

            try {
                const usuario = await getMe(token);
                if (isMounted) {
                    setIsAdmin(usuarioEhAdmin(usuario, token));
                }
            } catch {
                if (isMounted) setIsAdmin(false);
                removerToken();
            }
        };

        const handleAuthChanged = () => { void loadAdminStatus(); };
        const handleStorageChanged = (event: StorageEvent) => {
            if (event.key === AUTH_TOKEN_KEY) { void loadAdminStatus(); }
        };

        void loadAdminStatus();
        window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
        window.addEventListener("storage", handleStorageChanged);

        return () => {
            isMounted = false;
            window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
            window.removeEventListener("storage", handleStorageChanged);
        };
    }, []);

    // Polling ativo: Fica perguntando ao banco a cada 5 segundos enquanto estiver rodando
    useEffect(() => {
        if (!isUpdating || !isAdmin) return;

        const interval = setInterval(() => {
            void checarStatusAtual();
        }, 60000);

        return () => clearInterval(interval);
    }, [isUpdating, isAdmin, checarStatusAtual]);

    // Primeira checagem proativa assim que o usuário é validado como admin
    useEffect(() => {
        if (isAdmin) {
            void checarStatusAtual();
        }
    }, [isAdmin, checarStatusAtual]);

    const handleToggleTheme = () => {
        setIsSpinning(true);
        toggleTheme();
        setTimeout(() => setIsSpinning(false), 600);
    };

    const mostraFeedbackTemporario = (mensagem: string, tipo: "sucesso" | "erro") => {
        setNotificacao({ mensagem, tipo });
        setTimeout(() => setNotificacao(null), 6000);
    };

    const handleManualUpdate = async () => {
        if (isUpdating) return;

        setIsUpdating(true);
        setEtlStatusText("Iniciando...");

        try {
            const response = await dispararAtualizacaoManual();
            setEtlStatusText("Processando ETL...");
            mostraFeedbackTemporario(`${response.message} ID da Task: ${response.task_id}`, "sucesso");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao iniciar atualização.";
            mostraFeedbackTemporario(message, "erro");
            setIsUpdating(false);
            setEtlStatusText(null);
        }
    };

    // --- ÍCONES INTERNOS (SVG) ---

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
            style={{ cursor: "pointer" }}
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
            style={{ cursor: "pointer" }}
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

    const RefreshCcwDotIcon = ({ className = "" }: { className?: string }) => (
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
            className={className}
            aria-hidden="true"
        >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
            <circle cx="12" cy="12" r="1" />
        </svg>
    );

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
                    {/* Texto informativo de Status Inline */}
                    {isAdmin && etlStatusText && (
                        <span className={styles.statusBadge}>
                            {etlStatusText}
                        </span>
                    )}

                    {isAdmin && (
                        <Skeleton isLoading={isLoading} variant="rectangular">
                            <button
                                type="button"
                                className={`${styles.iconButton} ${isUpdating ? styles.disabledBtn : ""}`}
                                onClick={handleManualUpdate}
                                disabled={isUpdating}
                                title={isUpdating ? "Sincronização em andamento" : "Atualizar base de dados"}
                            >
                                <RefreshCcwDotIcon className={isUpdating ? styles.spin : ""} />
                            </button>
                        </Skeleton>
                    )}

                    <Skeleton isLoading={isLoading} variant="rectangular">
                        {mode === "light" ? <SunLightIcon /> : <SunDimIcon />}
                    </Skeleton>

                    <Skeleton isLoading={isLoading} variant="rectangular">
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={onLoginClick}
                        >
                            <UserIcon />
                        </button>
                    </Skeleton>
                </div>
            </div>

            {/* Notificação Toast moderna flutuante */}
            {notificacao && (
                <div className={`${styles.toast} ${styles[notificacao.tipo]}`}>
                    <p>{notificacao.mensagem}</p>
                    <button type="button" onClick={() => setNotificacao(null)}>×</button>
                </div>
            )}

            <div
                className={styles.hr}
                style={{ backgroundColor: theme.shared?.hr || "#ccc" }}
            />
        </header>
    );
}