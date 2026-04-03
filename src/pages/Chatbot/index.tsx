import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import MapComponent from "../../components/ui/MapComponent/MapComponent";
import styles from "./Chatbot.module.css";
import { enviarMensagemChat, ChatMensagemResponse, FonteCitada, Mapa } from "../../services/chatService";
import { useLocation } from "react-router-dom";
import { buscarHistoricoChat, MensagemHistorico } from "../../services/chatHistoricoService";

interface Mensagem {
    id: string;
    texto: string;
    tipo: "usuario" | "bot";
    autor?: string;
    fontes?: FonteCitada[];
    mapa?: Mapa;
}

export default function Chatbot() {
    const { theme } = useTheme();
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [input, setInput] = useState("");
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [digitando, setDigitando] = useState(false);
    const [chatIniciado, setChatIniciado] = useState(false);
    const [exitandoWelcome, setExitandoWelcome] = useState(false);
    const [dadosMapa, setDadosMapa] = useState<Mapa | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const chatRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    // Carregar histórico se chat_id vier na URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const chat_id = params.get("chat_id");
        if (chat_id) {
            setChatId(chat_id);
            buscarHistoricoChat(chat_id)
                .then((historico: MensagemHistorico[]) => {
                    setMensagens(historico.map(msg => ({
                        ...msg,
                        autor: msg.tipo === "bot" ? "Atlas" : undefined
                    })));
                    const ultimaComMapa = historico.reverse().find(msg => msg.mapa);
                    if (ultimaComMapa && ultimaComMapa.mapa) {
                        setMostrarMapa(true);
                        setDadosMapa(ultimaComMapa.mapa);
                    } else {
                        setMostrarMapa(false);
                        setDadosMapa(null);
                    }
                    setChatIniciado(true);
                })
                .catch(() => {
                    setMensagens([]);
                    setMostrarMapa(false);
                    setDadosMapa(null);
                    setChatIniciado(true);
                });
        }
    }, [location.search]);

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

        try {
            const resposta: ChatMensagemResponse = await enviarMensagemChat(input, chatId);
            setChatId(resposta.chat_id);
            const mensagemBot: Mensagem = {
                id: resposta.resposta_id,
                texto: resposta.texto_resposta,
                tipo: "bot",
                autor: "Atlas",
                fontes: resposta.fontes_citadas,
                mapa: resposta.mapa
            };
            setMensagens(prev => [...prev, mensagemBot]);
            setDigitando(false);
            if (resposta.mapa) {
                setMostrarMapa(true);
                setDadosMapa(resposta.mapa);
            } else {
                setMostrarMapa(false);
                setDadosMapa(null);
            }
        } catch (error: any) {
            setMensagens(prev => [...prev, {
                id: Date.now().toString(),
                texto: "Erro ao consultar o backend. Tente novamente.",
                tipo: "bot",
                autor: "Atlas"
            }]);
            setDigitando(false);
        }
    };

    // Removido processarMensagem pois agora a resposta vem do backend

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
                                        {/* Exibe fontes citadas se houver */}
                                        {msg.fontes && msg.fontes.length > 0 && (
                                            <div className={styles.fontesCitadas}>
                                                <strong>Fontes consultadas:</strong>
                                                <ul>
                                                    {msg.fontes.map((fonte, idx) => (
                                                        <li key={idx}>
                                                            <a href={fonte.url} target="_blank" rel="noopener noreferrer">{fonte.nome}</a> ({fonte.orgao})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
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
                    {mostrarMapa && dadosMapa && (
                        <div className={styles.mapContainer}>
                            <MapComponent
                                poluicaoLocalizacoes={[]}
                                queimadasLocalizacoes={dadosMapa.features?.map(f => ({
                                    lat: f.geometry.coordinates[1],
                                    lng: f.geometry.coordinates[0],
                                    casos: f.properties.intensidade,
                                    nome: f.properties.municipio
                                })) ?? []}
                                quilombosLocalizacoes={[]}
                            />
                        </div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
}