import { API_BASE_URL } from "../config/env";
import { headersAuthSomente } from "./authService";

export interface ChatListItem {
        id: string;
        title: string;
        created_at: string; 
        ativo: boolean;
    }

export async function buscarChats(): Promise<ChatListItem[]> {
  const response = await fetch(`${API_BASE_URL}/chat/`, {
    headers: headersAuthSomente(),
  });
  if (!response.ok) {
    throw new Error("Erro ao buscar lista de chats");
  }
  return response.json();
}

export async function excluirChat(chatId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
    method: "DELETE",
    headers: headersAuthSomente(),
  });
  if (!response.ok) {
    throw new Error("Erro ao excluir chat");
  }
}
