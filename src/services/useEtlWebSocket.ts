import { useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/env";
import { obterToken } from "./authService";

// Converte http(s):// → ws(s)://
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

export interface EtlWsMessage {
  status_atual: string;
  ultima_atualizacao: string;
}

interface UseEtlWebSocketOptions {
  /** Habilita a conexão. Passe `false` enquanto o usuário não for admin ou não estiver logado. */
  enabled: boolean;
  onMessage: (msg: EtlWsMessage) => void;
  /** Chamado quando o servidor rejeita por autenticação (códigos 4001/4003). */
  onAuthError?: () => void;
}

const MAX_RETRIES = 6;
const BASE_DELAY_MS = 2_000;

/**
 * Hook que abre (e mantém) uma conexão WebSocket com o endpoint de status do ETL.
 * Substitui o polling via setInterval — o servidor envia mensagens sempre que
 * o status muda.
 *
 * Reconecta automaticamente com backoff exponencial em caso de queda.
 * Encerra a conexão ao desmontar o componente ou quando `enabled` vira `false`.
 */
export function useEtlWebSocket({
  enabled,
  onMessage,
  onAuthError,
}: UseEtlWebSocketOptions): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const mountedRef = useRef(false);

  // Estabiliza referências de callbacks para não recriar o WS a cada render
  const onMessageRef = useRef(onMessage);
  const onAuthErrorRef = useRef(onAuthError);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onAuthErrorRef.current = onAuthError; }, [onAuthError]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // evita reconexão ao fechar intencionalmente
      wsRef.current.close(1000, "Component unmounted or disabled");
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    const token = obterToken();
    if (!token) return;

    const url = `${WS_BASE_URL}/admin/etl/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as EtlWsMessage;
        onMessageRef.current(msg);
        retriesRef.current = 0; // reset backoff após mensagem bem-sucedida
      } catch {
        // ignora mensagens malformadas
      }
    };

    ws.onclose = (event: CloseEvent) => {
      wsRef.current = null;
      if (!mountedRef.current) return;

      // Fechamento por erro de autenticação — não reconectar
      if (event.code === 4001 || event.code === 4003) {
        onAuthErrorRef.current?.();
        return;
      }

      // Fechamento intencional (1000) — não reconectar
      if (event.code === 1000) return;

      if (retriesRef.current >= MAX_RETRIES) return;

      // Backoff exponencial: 2s, 4s, 8s … até 30s
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retriesRef.current), 30_000);
      retriesRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose será chamado em seguida — lógica de reconexão fica lá
    };
  }, [enabled]); // `connect` só muda se `enabled` mudar

  useEffect(() => {
    mountedRef.current = true;
    retriesRef.current = 0;

    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [enabled, connect, disconnect]);
}
