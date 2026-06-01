
import { headersComAuth } from "./authService";

export interface ChatMensagemRequest {
  pergunta: string;
  chat_id: string | null;
  municipio?: string | null;
}

export interface FonteCitada {
  nome: string;
  orgao: string;
  url: string | null;
}

export type TipoFeatureMapa =
  | "imovel_rural_queimada"
  | "queimada_evento_relacionada"
  | "imovel_rural_desmatamento"
  | "desmatamento_alerta_relacionado"
  | "imovel_rural_quilombo"
  | "territorio_quilombola_relacionado";

export interface MapaFeatureProperties {
  tipo?: TipoFeatureMapa | string;
  data_ocorrencia?: string;
  fonte_sensor?: string;
  sensor?: string;
  intensidade?: number;
  risco_fogo?: number;
  municipio?: string | null;
  nome?: string | null;
  nome_imovel?: string | null;
  fase?: string | null;
  area_ha?: number;
  codigo_car?: string;
  num_queimadas?: number;
  dist_media_m?: number;
  dist_min_m?: number;
  nivel_risco_ambiental?: "baixo" | "medio" | "alto" | string;
  tipo_alerta?: string;
}

export interface MapaFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: unknown;
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
  bbox?: number[];
  status?: string;
}

export interface FallbackInfo {
  tipo_fallback: "nlp_fallback" | "data_fallback" | "connection_fallback" | "generic_fallback";
  mensagem_usuario: string;
  sugestoes?: string[];
  retry_count?: number;
}

export interface ChatMensagemResponseWithFallback extends ChatMensagemResponse {
  fallback_info?: FallbackInfo | null;
  eh_fallback?: boolean;
  tipo_fallback?: string | null;
}

export async function enviarMensagemChat(
  pergunta: string,
  chat_id: string | null = null,
  municipio?: string | null
): Promise<ChatMensagemResponse> {
  const body: ChatMensagemRequest = { pergunta, chat_id };
  if (municipio) {
    body.municipio = municipio;
  }
  const response = await fetch("http://127.0.0.1:5000/chat/mensagem", {
    method: "POST",
    headers: headersComAuth(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem para o backend");
  }
  const data = await response.json();
  console.log("Retorno do backend:", data);
  return data;
}

export async function feedbackChat(
  resposta_sistema_id: string,
  avaliacao: 1 | -1
): Promise<void> {
  const response = await fetch("http://127.0.0.1:5000/chat/feedback", {
    method: "POST",
    headers: headersComAuth(),
    body: JSON.stringify({ resposta_sistema_id, avaliacao }),
  });
  if (!response.ok) {
    throw new Error("Erro ao enviar feedback para o backend");
  }
}

export async function enviarMensagemComFallback(
  pergunta: string,
  chat_id: string | null = null,
  municipio?: string | null
): Promise<ChatMensagemResponseWithFallback> {
  try {
    const resposta = await enviarMensagemChat(pergunta, chat_id, municipio);

    // Detecta se o backend incluiu informações de fallback
    const maybe = resposta as any;
    if (maybe && maybe.fallback_info) {
      return {
        ...resposta,
        fallback_info: maybe.fallback_info,
        eh_fallback: true,
        tipo_fallback: maybe.fallback_info.tipo_fallback,
      };
    }

    return { ...resposta, eh_fallback: false };
  } catch (err: any) {
    // Em caso de erro de comunicação, retorna um fallback genérico
    const now = Date.now().toString();
    return {
      chat_id: now,
      consulta_id: now,
      resposta_id: now,
      texto_resposta: "Desculpe, ocorreu um erro ao comunicar com o backend. Tente novamente.",
      fontes_citadas: [],
      status: "erro",
      eh_fallback: true,
      tipo_fallback: "generic_fallback",
      fallback_info: {
        tipo_fallback: "generic_fallback",
        mensagem_usuario: pergunta,
        sugestoes: [],
        retry_count: 0,
      },
    };
  }
}