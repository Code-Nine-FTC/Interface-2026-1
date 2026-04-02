import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import MapComponent from "../../components/ui/MapComponent/MapComponent";
import styles from "./Chatbot.module.css";

interface Mensagem {
    id: string;
    texto: string;
    tipo: "usuario" | "bot";
    autor?: string;
    dados?: {
        poluicao?: Array<{ lat: number; lng: number; valor: number; local: string }>;
        queimadas?: Array<{ lat: number; lng: number; casos: number; local: string }>;
        quilombos?: Array<{ lat: number; lng: number; status: string; local: string }>;
    };
}

export default function Chatbot() {
    const { theme } = useTheme();
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [input, setInput] = useState("");
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [digitando, setDigitando] = useState(false);
    const [chatIniciado, setChatIniciado] = useState(false);
    const [exitandoWelcome, setExitandoWelcome] = useState(false);
    const [dadosMapa, setDadosMapa] = useState({
        poluicao: [] as any[],
        queimadas: [] as any[],
        quilombos: [] as any[]
    });
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [mensagens]);

    const handleEnviarMensagem = async () => {
        if (!input.trim()) return;

        if (!chatIniciado) {
            setExitandoWelcome(true);
            setTimeout(() => {
                setChatIniciado(true);
            }, 500);
        }

        const novaMensagem: Mensagem = {
            id: Date.now().toString(),
            texto: input,
            tipo: "usuario"
        };
        setMensagens(prev => [...prev, novaMensagem]);
        setInput("");
        setDigitando(true);

        setTimeout(() => {
            const respostaBot = processarMensagem(input);
            respostaBot.autor = "Atlas";
            setMensagens(prev => [...prev, respostaBot]);
            setDigitando(false);

            if (respostaBot.dados) {
                setMostrarMapa(true);
                setDadosMapa({
                    poluicao: respostaBot.dados.poluicao || [],
                    queimadas: respostaBot.dados.queimadas || [],
                    quilombos: respostaBot.dados.quilombos || []
                });
            }
        }, 1200);
    };

    const processarMensagem = (texto: string): Mensagem => {
        if (texto.toLowerCase().includes("queimada")) {
            return {
                id: Date.now().toString(),
                texto: "Aqui estão os dados de queimadas detectadas em SP:",
                tipo: "bot",
                dados: {
                    queimadas: [
                        { lat: -23.5505, lng: -46.6333, casos: 5, local: "São Paulo" },
                        { lat: -22.9068, lng: -43.1729, casos: 3, local: "Rio de Janeiro" },
                        { lat: -23.2237, lng: -49.6492, casos: 7, local: "Maringá" }
                    ]
                }
            };
        }

        if (texto.toLowerCase().includes("poluição")) {
            return {
                id: Date.now().toString(),
                texto: "Monitorando poluição em São Paulo. Veja no mapa:",
                tipo: "bot",
                dados: {
                    poluicao: [
                        { lat: -23.5505, lng: -46.6333, valor: 85, local: "Centro SP" },
                        { lat: -23.6345, lng: -46.7325, valor: 72, local: "Zona Leste" }
                    ]
                }
            };
        }

        if (texto.toLowerCase().includes("quilombo")) {
            return {
                id: Date.now().toString(),
                texto: "Quilombos registrados no estado:",
                tipo: "bot",
                dados: {
                    quilombos: [
                        { lat: -23.4, lng: -46.4, status: "ativo", local: "Quilombo A" },
                        { lat: -23.7, lng: -46.8, status: "ativo", local: "Quilombo B" }
                    ]
                }
            };
        }

        return {
            id: Date.now().toString(),
            texto: "Digite 'queimadas', 'poluição' ou 'quilombo' para ver dados no mapa!",
            tipo: "bot"
        };
    };

    return (
        <div
            className={styles.pageContainer}
            style={{
                backgroundColor: "var(--background-primary)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-family)"
            }}
        >
            {!chatIniciado ? (
                <div className={`${styles.welcomeContainer} ${exitandoWelcome ? styles.exiting : ''}`}>
                    <div className={styles.welcomeContent}>
                        <h1 className={styles.welcomeTitle}>Atlas</h1>
                        <p className={styles.welcomeText}>Seja bem-vindo ao Atlas, o que procura?</p>
                        <div className={styles.welcomeInputArea}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleEnviarMensagem()}
                                placeholder="Digite: queimadas, poluição ou quilombo..."
                                className={styles.welcomeInput}
                                autoFocus
                            />
                            <button
                                onClick={handleEnviarMensagem}
                                className={styles.welcomeSendButton}
                            >
                                ➤ Enviar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <h1>Consulte Dados Ambientais</h1>
                    <div className={styles.chatLayout}>
                <div className={styles.chatContainer}>
                    <div className={styles.messagesArea} ref={chatRef}>
                        {mensagens.map(msg => (
                            <div key={msg.id}>
                                {msg.tipo === "bot" && msg.autor && (
                                    <div className={styles.autorName}>{msg.autor}</div>
                                )}
                                <div className={`${styles.messageBubble} ${styles[msg.tipo]}`}>
                                    {msg.tipo === "usuario" && (
                                        <span className={styles.messageIcon}>👤</span>
                                    )}
                                    <div className={styles.messageContent}>
                                        {msg.texto}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {digitando && (
                            <div>
                                <div className={styles.autorName}>Atlas</div>
                                <div className={`${styles.messageBubble} ${styles.bot}`}>
                                    <div className={styles.messageContent}>
                                        <div className={styles.typingIndicator}>
                                            <span className={styles.typingDot}></span>
                                            <span className={styles.typingDot}></span>
                                            <span className={styles.typingDot}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleEnviarMensagem()}
                            placeholder="Digite: queimadas, poluição ou quilombo..."
                            className={styles.input}
                        />
                        <button
                            onClick={handleEnviarMensagem}
                            className={styles.sendButton}
                        >
                            ➤ Enviar
                        </button>
                    </div>
                </div>
                    {mostrarMapa && (
                        <div className={styles.mapContainer}>
                            <MapComponent
                                poluicaoLocalizacoes={dadosMapa.poluicao}
                                queimadasLocalizacoes={dadosMapa.queimadas}
                                quilombosLocalizacoes={dadosMapa.quilombos}
                            />
                        </div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
}