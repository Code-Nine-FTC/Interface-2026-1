
export interface ChatListItem {
  id: string;
  title: string;
}

export async function buscarChats(): Promise<ChatListItem[]> {
  const response = await fetch("http://127.0.0.1:5000/chat/");
  if (!response.ok) {
    throw new Error("Erro ao buscar lista de chats");
  }
  return response.json();
}
