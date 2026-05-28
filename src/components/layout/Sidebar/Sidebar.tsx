import { NavLink, useLocation, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logo from "../../../assets/logo.svg";
import { useTheme } from "../../../context/ThemeContext";
import { useLoading } from "../../../context/LoadingContext";
import Skeleton from "../../ui/SkeletonAnimation/Skeleton";
import { useEffect, useState } from "react";
import { buscarChats, excluirChat, ChatListItem } from "../../../services/chatListService";

const MOBILE_BREAKPOINT = 900;

type SidebarProps = {
    isMobileMenuOpen: boolean;
    onMobileMenuOpenChange: (isOpen: boolean) => void;
};

export default function Sidebar({ isMobileMenuOpen, onMobileMenuOpenChange }: SidebarProps) {
    const { theme } = useTheme();
    const { isLoading } = useLoading();

    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(() =>
        typeof window !== "undefined"
            ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
            : false
    );
    const navigate = useNavigate();
    const location = useLocation();

    const currentChatId = new URLSearchParams(location.search).get("chat_id");

    const refreshChats = () => {
        buscarChats()
            .then((data: ChatListItem[]) => {
                const ordenados = [...data].sort((a, b) => {
                    const dataA = new Date(a.created_at).getTime();
                    const dataB = new Date(b.created_at).getTime();
                    return dataB - dataA;
                });
                setChats(ordenados);
            })
            .catch(() => setChats([]));
    };

    useEffect(() => {
        refreshChats();

        window.addEventListener("chatUpdated", refreshChats);
        return () => window.removeEventListener("chatUpdated", refreshChats);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

        const handleViewportChange = (event: MediaQueryListEvent) => {
            setIsMobileViewport(event.matches);
            if (!event.matches) {
                onMobileMenuOpenChange(false);
            }
        };

        setIsMobileViewport(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleViewportChange);

        return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }, [onMobileMenuOpenChange]);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onMobileMenuOpenChange(false);
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isMobileMenuOpen, onMobileMenuOpenChange]);

    useEffect(() => {
        if (!(isMobileViewport && isMobileMenuOpen)) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileViewport, isMobileMenuOpen]);

    useEffect(() => {
        onMobileMenuOpenChange(false);
    }, [location.pathname, location.search, onMobileMenuOpenChange]);

    const handleExcluirChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        try {
            await excluirChat(chatId);
            setChats((prev) => prev.filter((c) => c.id !== chatId));
            if (currentChatId === chatId) {
                navigate("/");
            }
        } catch {
        }
    };

    const closeMobileMenu = () => onMobileMenuOpenChange(false);

    const activeStyle = { color: theme.orange.secondary };
    const normalStyle = { color: theme.orange.main };

    const menuItems = [
        { to: "/", label: "Chatbot", icon: <ChatbotIcon />, disabled: false },
        { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon />, disabled: false },
        { to: "/relatorio", label: "Relatorio", icon: <ReportIcon />, disabled: false },
    ];

    return (
        <>
            <div
                className={`${styles.mobileBackdrop} ${isMobileMenuOpen ? styles.mobileBackdropVisible : ""}`}
                onClick={closeMobileMenu}
                aria-hidden={!isMobileMenuOpen}
            />

            <aside
                id="app-sidebar"
                className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}
                style={{ background: theme.background.secondary }}
            >
                <div className={styles.logoContainer}>
                    <Skeleton isLoading={isLoading} variant="rectangular">
                        <img src={logo} alt="Logo" />
                    </Skeleton>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.disabled ? "#" : item.to}
                            onClick={(e) => {
                                if (item.disabled) {
                                    e.preventDefault();
                                    return;
                                }

                                if (isMobileViewport) {
                                    closeMobileMenu();
                                }
                            }}
                            className={({ isActive }) => {
                                const baseClass = isActive && !item.disabled ? `${styles.link} ${styles.active}` : styles.link;
                                return item.disabled ? `${baseClass} ${styles.disabled}` : baseClass;
                            }}
                            style={({ isActive }) => (isActive && !item.disabled ? activeStyle : normalStyle)}
                        >
                            <Skeleton isLoading={isLoading} variant="rectangular">
                                {item.icon}
                            </Skeleton>

                            <Skeleton isLoading={isLoading}>
                                <span>{item.label}</span>
                            </Skeleton>
                        </NavLink>
                    ))}

                    <div className={styles.chatsWrapper}>
                        <hr className={styles.divider} />

                        <span className={styles.historyTitle}>Historico de chats</span>

                        <div className={styles.chatsList}>
                            {chats.length === 0 && (
                                <div className={styles.chatsListEmpty}>Nenhum chat encontrado</div>
                            )}

                            {chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    className={`${styles.chatListItem} ${
                                        currentChatId === chat.id ? styles.chatListItemActive : ""
                                    }`}
                                    onClick={() => {
                                        navigate(`/chatbot?chat_id=${chat.id}&view=${Date.now()}`);
                                        if (isMobileViewport) {
                                            closeMobileMenu();
                                        }
                                    }}
                                    onMouseEnter={() => setHoveredChatId(chat.id)}
                                    onMouseLeave={() => setHoveredChatId(null)}
                                    title={chat.title}
                                >
                                    <span className={styles.chatListItemText}>{chat.title}</span>
                                    {(isMobileViewport ? currentChatId === chat.id : hoveredChatId === chat.id) && (
                                        <span
                                            className={styles.deleteBtn}
                                            onClick={(e) => handleExcluirChat(e, chat.id)}
                                            title="Excluir chat"
                                            role="button"
                                            aria-label="Excluir chat"
                                        >
                                            <TrashIcon />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}

const ChatbotIcon = () => (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M38.5 29.75C38.5 30.6783 38.1313 31.5685 37.4749 32.2249C36.8185 32.8813 35.9283 33.25 35 33.25H11.949C11.0208 33.2502 10.1307 33.6191 9.4745 34.2755L5.621 38.129C5.44723 38.3027 5.22586 38.421 4.98486 38.469C4.74386 38.5169 4.49405 38.4923 4.26704 38.3983C4.04002 38.3042 3.84598 38.145 3.70945 37.9407C3.57292 37.7364 3.50003 37.4962 3.5 37.2505V8.75C3.5 7.82174 3.86875 6.9315 4.52513 6.27513C5.1815 5.61875 6.07174 5.25 7 5.25H35C35.9283 5.25 36.8185 5.61875 37.4749 6.27513C38.1313 6.9315 38.5 7.82174 38.5 8.75V29.75Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.25 19.25H29.75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.25 26.25H22.75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.25 12.25H26.25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18h-5" />
        <path d="M18 14h-8" />
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
        <rect width="8" height="4" x="10" y="6" rx="1" />
    </svg>
);

const DashboardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.25 5.25V33.25C5.25 34.1783 5.61875 35.0685 6.27513 35.7249C6.9315 36.3813 7.82174 36.75 8.75 36.75H36.75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.25 19.6122C12.25 19.3806 12.3419 19.1585 12.5055 18.9945L16.0055 15.4945C16.0868 15.413 16.1833 15.3484 16.2896 15.3042C16.3959 15.2601 16.5099 15.2374 16.625 15.2374C16.7401 15.2374 16.8541 15.2601 16.9604 15.3042C17.0667 15.3484 17.1632 15.413 17.2445 15.4945L23.0055 21.2555C23.0868 21.337 23.1833 21.4016 23.2896 21.4457C23.3959 21.4898 23.5099 21.5126 23.625 21.5126C23.7401 21.5126 23.8541 21.4898 23.9604 21.4457C24.0667 21.4016 24.1632 21.337 24.2445 21.2555L31.7555 13.7445C31.8778 13.6219 32.0337 13.5384 32.2034 13.5044C32.3732 13.4705 32.5492 13.4876 32.7092 13.5538C32.8693 13.6199 33.006 13.732 33.1023 13.876C33.1986 14.0199 33.25 14.1891 33.25 14.3622V28C33.25 28.4641 33.0656 28.9092 32.7374 29.2374C32.4092 29.5656 31.9641 29.75 31.5 29.75H14C13.5359 29.75 13.0908 29.5656 12.7626 29.2374C12.4344 28.9092 12.25 28.4641 12.25 28V19.6122Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
