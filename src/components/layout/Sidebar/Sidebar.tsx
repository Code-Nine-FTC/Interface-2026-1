import styles from "./Sidebar.module.css";

import logo from "../../../assets/logo.svg";
import chatbotIcon from "../../../assets/message-square-text 1.svg";
import reportIcon from "../../../assets/newspaper 1.svg";
import dashboardIcon from "../../../assets/chart-area 1.svg";
import filterIcon from "../../../assets/list-filter-plus 1.svg";


import { useTheme } from "../../../context/ThemeContext";

export default function Sidebar() {
    const { theme } = useTheme();

    return (
        <aside
            className={styles.sidebar}
            style={{ background: theme.background.secondary }}
        >
            <div className={styles.logoContainer}>
                <img src={logo} alt="Logo" />
            </div>

            <nav className={styles.nav}>
                <a
                    className={`${styles.link} ${styles.active}`}
                    style={{ color: theme.orange.secondary }}
                >
                    <img src={chatbotIcon} />
                    Chatbot
                </a>

                <a className={styles.link} style={{ color: theme.orange.main }}>
                    <img src={reportIcon} />
                    Relatório
                </a>

                <a className={styles.link} style={{ color: theme.orange.main }}>
                    <img src={dashboardIcon} />
                    Dashboard
                </a>

                <a className={styles.link} style={{ color: theme.orange.main }}>
                    <img src={filterIcon} />
                    Filtrar dados
                </a>
            </nav>
        </aside>
    );
}