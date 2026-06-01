// src/services/chatHistoricoService.ts

import { API_BASE_URL } from "../config/env";
import { headersAuthSomente } from "./authService";
import type { Mapa } from "./chatService";

export interface FeedbackHistorico {
  id: string;
  avaliacao: 1 | -1;
}

export interface MensagemHistorico {
  consulta_id: string;
  resposta_id?: string;
  pergunta?: string;
  resposta?: string;
  turno?: number;
  fontes?: Array<{ nome: string; orgao: string; url: string }>;
  mapa?: Mapa | null;
  feedback?: FeedbackHistorico | null;
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
  created_at?: string;
  mensagens: MensagemHistorico[];
  mapa?: Mapa | null;
  bbox?: number[];
  status?: string;
}

export async function buscarHistoricoChat(chat_id: string): Promise<HistoricoChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/${chat_id}/historico`, {
    headers: headersAuthSomente(),
  });
  if (!response.ok) {
    throw new Error("Erro ao buscar histórico do chat");
  }

  return response.json();
}


export interface ResumoRelatorioData {
  resumo: string;
  fontes: Array<{ nome: string; orgao?: string; url?: string }>;
}

export async function buscarResumoRelatorio(chatId: string): Promise<ResumoRelatorioData> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/${chatId}/resumo`, {
            headers: headersAuthSomente(),
        });
        if (!response.ok) throw new Error("Erro ao buscar resumo");
        return response.json();
    } catch (error) {
        console.error("Erro ao buscar o resumo condensado:", error);
        throw error;
    }
}