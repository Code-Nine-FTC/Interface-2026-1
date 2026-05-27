import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import logo from "../../assets/logo.svg";
import styles from "./Login.module.css";

type LoginProps = {
    isModal?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
};

function LoginContent({ onSubmit, onClose, showCloseButton = false }: {
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose?: () => void;
    showCloseButton?: boolean;
}) {
    const { theme, toggleTheme, mode } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <>
            <div
                className={styles.brandPanel}
                style={{
                    background: `linear-gradient(160deg, ${theme.orange.main} 0%, ${theme.orange.secondary} 100%)`,
                }}
            >
                <div className={styles.brandBadge}>
                    <img src={logo} alt="Atlas" className={styles.brandLogo} />
                </div>

                <div className={styles.brandCopy}>
                    <span className={styles.kicker}>Interface Ambiental</span>
                    <h1>Entre para acompanhar dados, mapas e relatórios em um só lugar.</h1>
                    <p>
                        Uma entrada direta para a operação do painel, com a mesma linguagem visual do restante da aplicação.
                    </p>
                </div>

                <div className={styles.featureList}>
                    <div className={styles.featureItem}>Consulta de chats e histórico</div>
                    <div className={styles.featureItem}>Mapas e filtros por município</div>
                    <div className={styles.featureItem}>Dashboard e relatórios centralizados</div>
                </div>
            </div>

            <div className={styles.formPanel}>
                {showCloseButton && (
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Fechar login"
                    >
                        ×
                    </button>
                )}

                <div className={styles.mobileBrand}>
                    <img src={logo} alt="Atlas" className={styles.mobileLogo} />
                </div>

                <button
                    type="button"
                    className={styles.themeToggle}
                    onClick={toggleTheme}
                    aria-label="Alternar tema"
                >
                    {mode === "light" ? "Tema escuro" : "Tema claro"}
                </button>

                <div className={styles.formHeader}>
                    <span className={styles.formEyebrow}>Acesso restrito</span>
                    <h2>Entrar no Atlas</h2>
                    <p>Use suas credenciais para acessar o ambiente de monitoramento.</p>
                </div>

                <form className={styles.form} onSubmit={onSubmit}>
                    <label className={styles.field}>
                        <span>E-mail</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="seu.email@exemplo.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Senha</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Digite sua senha"
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    <button type="button" className={styles.linkButton}>
                        Esqueceu a senha?
                    </button>

                    <button type="submit" className={styles.submitButton}>
                        Entrar
                    </button>
                </form>
            </div>
        </>
    );
}

export default function Login({ isModal = false, isOpen = true, onClose }: LoginProps) {
    const navigate = useNavigate();
    const { theme } = useTheme();

    useEffect(() => {
        if (!isModal) {
            document.title = "Atlas | Login";
        }
    }, [isModal]);

    useEffect(() => {
        if (!isModal || !isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isModal, isOpen, onClose]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onClose?.();
        navigate("/chatbot");
    };

    if (isModal && !isOpen) {
        return null;
    }

    return (
        <main
            className={isModal ? styles.modalPage : styles.page}
            style={{
                background: isModal
                    ? "transparent"
                    : `radial-gradient(circle at top left, ${theme.orange.light} 0%, transparent 32%), radial-gradient(circle at bottom right, ${theme.orange.main}18 0%, transparent 28%), linear-gradient(135deg, ${theme.background.secondary} 0%, ${theme.background.primary} 100%)`,
                color: theme.text.primary,
                fontFamily: theme.font.family,
            }}
            onClick={isModal ? onClose : undefined}
        >
            {isModal ? (
                <div className={styles.modalBackdrop}>
                    <section className={`${styles.shell} ${styles.modalShell}`} onClick={(event) => event.stopPropagation()}>
                        <LoginContent onSubmit={handleSubmit} onClose={onClose} showCloseButton />
                    </section>
                </div>
            ) : (
                <>
                    <div className={styles.backgroundGlow} />
                    <section className={styles.shell}>
                        <LoginContent onSubmit={handleSubmit} />
                    </section>
                </>
            )}
        </main>
    );
}