import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import MapComponent from "../../components/ui/MapComponent/MapComponent";
import ChatInput from "../../components/ui/ChatInput/ChatInput";
import ReactMarkdown from "react-markdown";
import styles from "./Chatbot.module.css";
import logoAtlas from "../../assets/logo.svg";
import { enviarMensagemChat, feedbackChat, ChatMensagemResponse, FonteCitada, Mapa } from "../../services/chatService";
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
    const [chatIniciado, setChatIniciado] = useState(true);
    const [exitandoWelcome, setExitandoWelcome] = useState(false);
    const [dadosMapa, setDadosMapa] = useState<Mapa | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [feedbackEnviado, setFeedbackEnviado] = useState<Record<string, 1 | -1>>({});
    const [feedbackDoHistorico, setFeedbackDoHistorico] = useState<Set<string>>(new Set());
    const [createdAt, setCreatedAt] = useState<string | null>(null);
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
                            if (data.created_at) {
                                setCreatedAt(data.created_at);
                            }
                            if (data && Array.isArray(data.mensagens)) {
                                const msgs: Mensagem[] = [];

                                const feedbackCarregado: Record<string, 1 | -1> = {};

                                data.mensagens.forEach((item: any) => {
                                    if (item.pergunta) {
                                        msgs.push({
                                            id: item.consulta_id + "-user",
                                            texto: item.pergunta,
                                            tipo: "usuario"
                                        });
                                    }

                                    if (item.resposta) {
                                        const botId = item.resposta_id || item.consulta_id + "-bot";

                                        let mapaItem = item.mapa || undefined;
                                        if (!mapaItem && (item.coordinates || item.coordenadas || (item.latitude && item.longitude))) {
                                            const coords = item.coordinates || item.coordenadas || [item.longitude, item.latitude];
                                            mapaItem = {
                                                type: "FeatureCollection" as const,
                                                features: [{
                                                    type: "Feature" as const,
                                                    geometry: { type: "Point", coordinates: coords },
                                                    properties: {
                                                        nome: item.nome || item.municipio || null,
                                                        municipio: item.municipio || null,
                                                        ...(item.properties || {})
                                                    }
                                                }]
                                            };
                                        }

                                        msgs.push({
                                            id: botId,
                                            texto: item.resposta,
                                            tipo: "bot",
                                            autor: "Atlas",
                                            fontes: item.fontes?.length ? item.fontes : undefined,
                                            mapa: mapaItem
                                        });

                                        if (item.feedback && item.feedback.avaliacao) {
                                            feedbackCarregado[botId] = item.feedback.avaliacao;
                                        }
                                    }
                                });

                                setMensagens(msgs);
                                setFeedbackEnviado(feedbackCarregado);
                                setFeedbackDoHistorico(new Set(Object.keys(feedbackCarregado)));

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
                                } else if (data.mapa && data.mapa.features?.length) {
                                    setMostrarMapa(true);
                                    setDadosMapa(data.mapa);
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
                    setCreatedAt(null);

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


    const handleFeedback = async (respostaId: string, avaliacao: 1 | -1) => {
        if (feedbackEnviado[respostaId]) return;
        try {
            await feedbackChat(respostaId, avaliacao);
            setFeedbackEnviado(prev => ({ ...prev, [respostaId]: avaliacao }));
        } catch {
            // não bloqueia a interface
        }
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
            <>
                
                    <div className={styles.chatHeader}>
                        {createdAt && (
                            <span className={styles.chatDate}>
                                Criado em: {new Date(createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                        )}
                    </div>
                    <div className={styles.chatLayout}>
                        <div className={styles.chatContainer}>
                            <div className={styles.messagesArea} ref={chatRef}>
                                {mensagens.map(msg => (
                                    <div key={msg.id}>
                                        {msg.tipo === "bot" ? (
                                            <div className={styles.botResponseCard}>
                                                <div className={styles.botCardHeader}>
                                                    <img src={logoAtlas} alt="Atlas" className={styles.botHeaderLogo} />
                                                </div>
                                                <div className={styles.botCardBody}>
                                                    <div className={styles.markdownContent}>
                                                        <ReactMarkdown>{
                                                            msg.fontes && msg.fontes.length > 0
                                                                ? msg.texto.replace(/\*{0,2}Fontes?\s*consultadas:?\*{0,2}[\s\S]*/i, '').trim()
                                                                : msg.texto
                                                        }</ReactMarkdown>
                                                    </div>
                                                    {msg.fontes && msg.fontes.length > 0 && (
                                                        <div className={styles.fontesCitadas}>
                                                            <span className={styles.fontesLabel}>📚 Fontes consultadas</span>
                                                            <div className={styles.fontesList}>
                                                                {msg.fontes.map((fonte, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={fonte.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={styles.fonteBadge}
                                                                    >
                                                                        <span className={styles.fonteNome}>{fonte.nome}</span>
                                                                        <span className={styles.fonteOrgao}>{fonte.orgao}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {msg.id && !feedbackDoHistorico.has(msg.id) && (
                                                    <div className={styles.botCardFooter}>
                                                        {feedbackEnviado[msg.id] ? (
                                                            <span className={styles.feedbackAgradecimento}>
                                                                ✓ Obrigado pelo feedback!
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className={styles.feedbackTexto}>
                                                                    Esta resposta foi útil?
                                                                </span>
                                                                <div className={styles.feedbackActions}>
                                                                    <button
                                                                        className={styles.feedbackBtn}
                                                                        onClick={() => handleFeedback(msg.id, 1)}
                                                                        title="Boa resposta"
                                                                    >
                                                                        👍 Sim
                                                                    </button>
                                                                    <button
                                                                        className={`${styles.feedbackBtn} ${styles.feedbackBtnNeg}`}
                                                                        onClick={() => handleFeedback(msg.id, -1)}
                                                                        title="Resposta ruim"
                                                                    >
                                                                        👎 Não
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`${styles.messageBubble} ${styles.usuario}`}>
                                                <span className={styles.messageIcon}>👤</span>
                                                <div className={styles.messageContent}>
                                                    {msg.texto}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {digitando && (
                                    <div className={styles.botResponseCard}>
                                        <div className={styles.botCardHeader}>
                                            <img src={logoAtlas} alt="Atlas" className={styles.botHeaderLogo} />
                                        </div>
                                        <div className={styles.botCardBody}>
                                            <div className={styles.typingIndicator}>
                                                <span className={styles.typingDot}></span>
                                                <span className={styles.typingDot}></span>
                                                <span className={styles.typingDot}></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <ChatInput
                                value={input}
                                onChange={setInput}
                                onSend={handleEnviarMensagem}
                                />
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
            
        </div>
    );
}