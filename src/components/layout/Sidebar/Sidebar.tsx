import { NavLink, useLocation, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logo from "../../../assets/logo.svg";
import { useTheme } from "../../../context/ThemeContext";
import { useLoading } from "../../../context/LoadingContext";
import Skeleton from "../../ui/SkeletonAnimation/Skeleton";

import { useEffect, useState } from "react";
import { buscarChats, excluirChat, ChatListItem } from "../../../services/chatListService";
import { useTitle } from "../../../context/TitleContext";

export default function Sidebar() {
    const { theme } = useTheme();
    const { isLoading } = useLoading();

    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const { setTitle } = useTitle();

    const currentChatId = new URLSearchParams(location.search).get("chat_id");

    useEffect(() => {
        buscarChats().then(setChats).catch(() => setChats([]));
    }, []);

    const handleExcluirChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        try {
            await excluirChat(chatId);
            setChats(prev => prev.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                navigate("/");
            }
        } catch {
           
        }
    };

    const activeStyle = { color: theme.orange.secondary };
    const normalStyle = { color: theme.orange.main };

    const menuItems = [
    { to: "/", label: "Chatbot", icon: <ChatbotIcon />, disabled: false },
    { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon />, disabled: false },
];

    return (
        <aside className={styles.sidebar} style={{ background: theme.background.secondary }}>
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
                        onClick={(e) => item.disabled && e.preventDefault()}
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
                {/* Lista de chats */}
                <div className={styles.chatsWrapper}>
    <hr className={styles.divider} />

    <span className={styles.historyTitle}>
        Histórico de chats
    </span>

            <div className={styles.chatsList}>
                {chats.length === 0 && (
                    <div className={styles.chatsListEmpty}>
                        Nenhum chat encontrado
                    </div>
                )}

                {chats.map(chat => (
                    <button
                        key={chat.id}
                        className={`${styles.chatListItem} ${
                            currentChatId === chat.id ? styles.chatListItemActive : ""
                        }`}
                        onClick={() => {
                            navigate(`/chatbot?chat_id=${chat.id}&view=${Date.now()}`);
                        }}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                        title={chat.title}
                    >
                        <span className={styles.chatListItemText}>
                            {chat.title}
                        </span>
                        {hoveredChatId === chat.id && (
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
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26.25 31.5H17.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M31.5 24.5H17.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 38.5H35C35.9283 38.5 36.8185 38.1313 37.4749 37.4749C38.1313 36.8185 38.5 35.9283 38.5 35V7C38.5 6.07174 38.1313 5.1815 37.4749 4.52513C36.8185 3.86875 35.9283 3.5 35 3.5H14C13.0717 3.5 12.1815 3.86875 11.5251 4.52513C10.8687 5.1815 10.5 6.07174 10.5 7V35C10.5 35.9283 10.1313 36.8185 9.47487 37.4749C8.8185 38.1313 7.92826 38.5 7 38.5ZM7 38.5C6.07174 38.5 5.1815 38.1313 4.52513 37.4749C3.86875 36.8185 3.5 35.9283 3.5 35V19.25C3.5 18.3217 3.86875 17.4315 4.52513 16.7751C5.1815 16.1187 6.07174 15.75 7 15.75H10.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M29.75 10.5H19.25C18.2835 10.5 17.5 11.2835 17.5 12.25V15.75C17.5 16.7165 18.2835 17.5 19.25 17.5H29.75C30.7165 17.5 31.5 16.7165 31.5 15.75V12.25C31.5 11.2835 30.7165 10.5 29.75 10.5Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const DashboardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.25 5.25V33.25C5.25 34.1783 5.61875 35.0685 6.27513 35.7249C6.9315 36.3813 7.82174 36.75 8.75 36.75H36.75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.25 19.6122C12.25 19.3806 12.3419 19.1585 12.5055 18.9945L16.0055 15.4945C16.0868 15.413 16.1833 15.3484 16.2896 15.3042C16.3959 15.2601 16.5099 15.2374 16.625 15.2374C16.7401 15.2374 16.8541 15.2601 16.9604 15.3042C17.0667 15.3484 17.1632 15.413 17.2445 15.4945L23.0055 21.2555C23.0868 21.337 23.1833 21.4016 23.2896 21.4457C23.3959 21.4898 23.5099 21.5126 23.625 21.5126C23.7401 21.5126 23.8541 21.4898 23.9604 21.4457C24.0667 21.4016 24.1632 21.337 24.2445 21.2555L31.7555 13.7445C31.8778 13.6219 32.0337 13.5384 32.2034 13.5044C32.3732 13.4705 32.5492 13.4876 32.7092 13.5538C32.8693 13.6199 33.006 13.732 33.1023 13.876C33.1986 14.0199 33.25 14.1891 33.25 14.3622V28C33.25 28.4641 33.0656 28.9092 32.7374 29.2374C32.4092 29.5656 31.9641 29.75 31.5 29.75H14C13.5359 29.75 13.0908 29.5656 12.7626 29.2374C12.4344 28.9092 12.25 28.4641 12.25 28V19.6122Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const FilterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 8.75H3.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 21H31.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.75 33.25H26.25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 8.75H38.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M33.25 14V3.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);