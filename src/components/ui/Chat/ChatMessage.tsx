import React from "react";
import ReactMarkdown from "react-markdown";
import styles from "./ChatMessage.module.css";
import { FonteCitada, Mapa } from "../../../services/chatService";

export interface Mensagem {
    id: string;
    texto: string;
    tipo: "usuario" | "bot";
    autor?: string;
    fontes?: FonteCitada[];
    mapa?: Mapa;
}

interface ChatMessageProps {
    msg: Mensagem;
    feedbackDoHistorico: Set<string>;
    feedbackEnviado: Record<string, 1 | -1>;
    onFeedback: (id: string, avaliacao: 1 | -1) => void;
}

export default function ChatMessage({
    msg,
    feedbackDoHistorico,
    feedbackEnviado,
    onFeedback
}: ChatMessageProps) {
    const [copiadoQgis, setCopiadoQgis] = React.useState(false);

    const copiarQgisUrl = () => {
        const url = "http://localhost:5000/chat/resposta/" + msg.id + "/geojson";
        navigator.clipboard.writeText(url).then(() => {
            setCopiadoQgis(true);
            setTimeout(() => setCopiadoQgis(false), 2000);
        });
    };
    if (msg.tipo === "bot") {
        return (
            <div className={styles.botResponseCard}>
                <div className={styles.botCardBody}>
                    <div className={styles.markdownContent}>
                        <ReactMarkdown>
                            {msg.fontes && msg.fontes.length > 0
                                ? msg.texto.replace(/\*{0,2}Fontes?\s*consultadas:?\*{0,2}[\s\S]*/i, '').trim()
                                : msg.texto}
                        </ReactMarkdown>
                        <button
                            onClick={copiarQgisUrl}
                            className={styles.qgisLink}
                            title="Copiar URL para utilizar no QGIS"
                        >
                            {copiadoQgis ? "Copiado!" : "Copiar Link QGIS"}
                        </button>
                    </div>
                    {msg.fontes && msg.fontes.length > 0 && (
                        <div className={styles.fontesCitadas}>
                            <span className={styles.fontesLabel}>📚 Fontes consultadas</span>
                            <div className={styles.fontesList}>
                                {msg.fontes.map((fonte, idx) => (
                                    fonte.url ? (
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
                                    ) : (
                                        <span key={idx} className={styles.fonteBadge}>
                                            <span className={styles.fonteNome}>{fonte.nome}</span>
                                            <span className={styles.fonteOrgao}>{fonte.orgao}</span>
                                        </span>
                                    )
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
                                        onClick={() => onFeedback(msg.id, 1)}
                                        title="Boa resposta"
                                    >
                                        Sim
                                    </button>
                                    <button
                                        className={`${styles.feedbackBtn} ${styles.feedbackBtnNeg}`}
                                        onClick={() => onFeedback(msg.id, -1)}
                                        title="Resposta ruim"
                                    >
                                        Não
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`${styles.messageBubble} ${styles.usuario}`}>
            <div className={styles.messageContent}>
                {msg.texto}
            </div>
        </div>
    );
}