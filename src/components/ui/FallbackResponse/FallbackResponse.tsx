import React from "react";
import styles from "./FallbackResponse.module.css";

export type TipoFallback = "nlp_fallback" | "data_fallback" | "connection_fallback" | "generic_fallback";

interface Props {
  tipo_fallback: TipoFallback;
  mensagem_usuario: string;
  sugestoes?: string[];
  onRetry?: () => void;
  onSelectSugestao?: (s: string) => void;
}

const tituloPorTipo: Record<TipoFallback, string> = {
  nlp_fallback: "Não consegui entender sua pergunta",
  data_fallback: "Não encontrei informações para esse pedido",
  connection_fallback: "Problema de conexão com os dados",
  generic_fallback: "Ocorreu um erro inesperado",
};

export default function FallbackResponse({
  tipo_fallback,
  mensagem_usuario,
  sugestoes = [],
  onRetry,
  onSelectSugestao,
}: Props) {
  return (
    <div className={styles.fallbackCard}>
      <div className={styles.header}>
        <strong>{tituloPorTipo[tipo_fallback]}</strong>
      </div>
      <div className={styles.body}>
        <div className={styles.userMessage}>"{mensagem_usuario}"</div>

        {sugestoes.length > 0 && (
          <div className={styles.suggestions}>
            <div className={styles.suggestionsLabel}>Sugestões para tentar:</div>
            <div className={styles.suggestionButtons}>
              {sugestoes.map((s, idx) => (
                <button
                  key={idx}
                  className={styles.suggestionBtn}
                  onClick={() => onSelectSugestao && onSelectSugestao(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {onRetry && (
            <button className={styles.retryBtn} onClick={onRetry}>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
