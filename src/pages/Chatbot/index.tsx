import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import MapComponent from "../../components/ui/MapComponent/MapComponent";
import styles from "./Chatbot.module.css";
import { enviarMensagemChat, ChatMensagemResponse, FonteCitada, Mapa } from "../../services/chatService";
import { useLocation } from "react-router-dom";
import { buscarHistoricoChat, MensagemHistorico } from "../../services/chatHistoricoService";
import { useTitle } from "../../context/TitleContext";

interface Mensagem {
    id: string;
    texto: string;
    tipo: "usuario" | "bot";
    autor?: string;
    fontes?: FonteCitada[];
    mapa?: Mapa;
}

interface CoordenadaMapa {
    lat: number;
    lng: number;
}

function isNumeroValido(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function coordenadaValida(coord: unknown): coord is [number, number] {
    return Array.isArray(coord) && coord.length >= 2 && isNumeroValido(coord[0]) && isNumeroValido(coord[1]);
}

function coletarParesCoordenadas(coordinates: unknown, acc: [number, number][] = []): [number, number][] {
    if (coordenadaValida(coordinates)) {
        acc.push(coordinates);
        return acc;
    }

    if (!Array.isArray(coordinates)) return acc;

    for (const item of coordinates) {
        coletarParesCoordenadas(item, acc);
    }

    return acc;
}

function coordenadaDoFeature(feature: Mapa["features"][number]): CoordenadaMapa | null {
    const pares = coletarParesCoordenadas(feature?.geometry?.coordinates) ?? [];
    if (pares.length === 0) return null;

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of pares) {
        if (!isNumeroValido(lat) || !isNumeroValido(lng)) continue;
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
    }

    if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
        return null;
    }

    return {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
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
    const [dadosMapa, setDadosMapa] = useState<Mapa | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const chatRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const { setTitle } = useTitle(); 
    const possuiGeoJson = Boolean(dadosMapa?.features?.length);
    const geoJsonParaRenderizar = possuiGeoJson ? dadosMapa : null;
    const queimadasLocalizacoes = dadosMapa?.features
        ?.map((f) => {
            const coord = coordenadaDoFeature(f);
            if (!coord) return null;

            return {
                lat: coord.lat,
                lng: coord.lng,
                casos: Number.isFinite(f?.properties?.intensidade) ? f.properties.intensidade : 0,
                nome: f?.properties?.nome || f?.properties?.municipio || "Sem nome"
            };
        })
        .filter((item): item is { lat: number; lng: number; casos: number; nome: string } => item !== null) ?? [];
                // Carregar histórico se chat_id vier na URL
            useEffect(() => {
                const params = new URLSearchParams(location.search);
                const chat_id = params.get("chat_id");

                // 👉 CASO 1: tem chat_id → carregar histórico
                if (chat_id) {
                    setChatId(chat_id);

                    buscarHistoricoChat(chat_id)
                        .then((data: any) => {
                            if (data && Array.isArray(data.mensagens)) {
                                const msgs: Mensagem[] = [];

                                data.mensagens.forEach((item: any) => {
                                    if (item.pergunta) {
                                        msgs.push({
                                            id: item.consulta_id + "-user",
                                            texto: item.pergunta,
                                            tipo: "usuario"
                                        });
                                    }

                                    if (item.resposta) {
                                        msgs.push({
                                            id: item.consulta_id + "-bot",
                                            texto: item.resposta,
                                            tipo: "bot",
                                            autor: "Atlas",
                                            fontes: item.fontes?.length ? item.fontes : undefined,
                                            mapa: item.mapa
                                        });
                                    }
                                });

                                setMensagens(msgs);

                                const primeira = msgs.find(m => m.tipo === "usuario");

                                if (primeira?.texto) {
                                    setTitle(primeira.texto.slice(0, 40));
                                } else {
                                    setTitle("Chat");
                                }

                                const ultimaComMapa = msgs.slice().reverse().find(msg => msg.mapa);

                                if (ultimaComMapa?.mapa) {
                                    setMostrarMapa(true);
                                    setDadosMapa(ultimaComMapa.mapa);
                                } else {
                                    setMostrarMapa(false);
                                    setDadosMapa(null);
                                }
                            } else {
                                setMensagens([]);
                            }

                            setChatIniciado(true);
                        })
                        .catch(() => {
                            setMensagens([]);
                            setChatIniciado(true);
                        });

                // 👉 CASO 2: NÃO tem chat_id → novo chat
                } else {
                    setChatId(null);
                    setMensagens([]);
                    setMostrarMapa(false);
                    setDadosMapa(null);
                    setChatIniciado(false); // volta pro welcome

                    setTitle("Novo chat");
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
                                    queimadasLocalizacoes={possuiGeoJson ? [] : queimadasLocalizacoes}
                                    quilombosLocalizacoes={[]}
                                    geoJsonData={geoJsonParaRenderizar}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}