import { useTheme } from "../../context/ThemeContext";
import styles from "./Chatbot.module.css";

export default function Chatbot() {
    const { theme } = useTheme();

    return (
        <div
            className={styles.pageContainer}
            style={{
                backgroundColor: "var(--background-primary)",
                color: "var(--text-primary)",
                minHeight: "100vh",
                fontFamily: "var(--font-family)"
            }}
        >
            <h1>Chatbot Page</h1>
            <p style={{ color: "var(--text-secondary)" }}>
                Este texto mudará de cor automaticamente.
            </p>

            <div style={{
                backgroundColor: "var(--background-textBox)",
                padding: "20px",
                borderRadius: "8px"
            }}>
                Área de chat
            </div>
        </div>
    );
}