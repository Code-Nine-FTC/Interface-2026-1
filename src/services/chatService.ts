

export interface ChatMensagemRequest {
  pergunta: string;
  chat_id: string | null;
}

export interface FonteCitada {
  nome: string;
  orgao: string;
  url: string;
}

export interface MapaFeatureProperties {
  tipo: string;
  data_ocorrencia: string;
  fonte_sensor: string;
  intensidade: number;
  municipio: string;
}

export interface MapaFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: MapaFeatureProperties;
}

export interface Mapa {
  type: "FeatureCollection";
  features: MapaFeature[];
}

export interface ChatMensagemResponse {
  chat_id: string;
  consulta_id: string;
  resposta_id: string;
  texto_resposta: string;
  fontes_citadas: FonteCitada[];
  mapa?: Mapa;
}

export async function enviarMensagemChat(
  pergunta: string,
  chat_id: string | null = null
): Promise<ChatMensagemResponse> {
  const response = await fetch("http://127.0.0.1:5000/chat/mensagem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pergunta, chat_id }),
  });
  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem para o backend");
  }
  const data = await response.json();
  console.log("Retorno do backend:", data);
  return data;
}
