// src/services/chatHistoricoService.ts

import type { Mapa } from "./chatService";

export interface MensagemHistorico {
  consulta_id: string;
  pergunta?: string;
  resposta?: string;
  turno?: number;
  fontes?: Array<{ nome: string; orgao: string; url: string }>;
  mapa?: Mapa | null;
  coordinates?: unknown;
  coordenadas?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  nome?: string;
  municipio?: string;
  properties?: Record<string, unknown>;
}

export interface HistoricoChatResponse {
  chat_id: string;
  title?: string;
  mensagens: MensagemHistorico[];
}

export async function buscarHistoricoChat(chat_id: string): Promise<HistoricoChatResponse> {
  const response = await fetch(`http://127.0.0.1:5000/chat/${chat_id}/historico`);
  if (!response.ok) {
    throw new Error("Erro ao buscar histórico do chat");
  }

  return response.json();
}
