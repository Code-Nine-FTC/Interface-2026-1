// src/services/chatHistoricoService.ts

export interface MensagemHistorico {
  id: string;
  texto: string;
  tipo: "usuario" | "bot";
  autor?: string;
  fontes?: Array<{ nome: string; orgao: string; url: string }>;
  mapa?: any;
}

export async function buscarHistoricoChat(chat_id: string): Promise<MensagemHistorico[]> {
  const response = await fetch(`http://127.0.0.1:5000/chat/${chat_id}/historico`);
  if (!response.ok) {
    throw new Error("Erro ao buscar histórico do chat");
  }
  return response.json();
}
