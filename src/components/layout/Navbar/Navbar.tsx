import styles from "./Navbar.module.css";
import sunIcon from "../../../assets/sun-dim 1.svg";
import langIcon from "../../../assets/languages 1.svg";

import { useTheme } from "../../../context/ThemeContext";

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div
            className={styles.container}
            style={{
                background: theme.background.primary,
                fontFamily: theme.font.family,
            }}
        >
            <div className={styles.navbar}>
                <h1
                    style={{
                        color: theme.orange.main,
                        fontSize: theme.font.size.lg,
                    }}
                >
                    Título do Chat
                </h1>

                <div className={styles.actions}>
                    <img src={sunIcon} onClick={toggleTheme} />
                    <img src={langIcon} />
                </div>
            </div>

            <hr
                className={styles.hr}
                style={{ borderTop: `0.1rem solid ${theme.shared.hr}` }}
            />
        </div>
    );
}