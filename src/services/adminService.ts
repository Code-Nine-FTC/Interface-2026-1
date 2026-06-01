import { obterToken } from "./authService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- INTERFACES DE RETORNO ---

export interface EtlTriggerResponse {
  message: string;
  task_id: string;
}

interface BasicResponse<T> {
  message?: string;
  data: T;
}

// Tipagem correta do status para eliminar o 'any'
export interface EtlStatusResponseData {
  status_atual: string; // Ex: "running", "success", "failed", "processando"
  last_run?: string;
  progress?: number;
  historico?: Array<{
    etapa: string;
    status: string;
    data_inicio: string;
    data_fim?: string;
  }>;
}

export type AtualizacaoManualResponse = EtlTriggerResponse;
export type StatusEtlResponse = BasicResponse<EtlStatusResponseData>;

type AtualizacaoManualPayload = {
  pipelines: string[] | null;
};


// --- FUNÇÕES AUXILIARES DE TRATAMENTO DE ERRO ---

function getErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const basicResponseMessage = (payload as Record<string, unknown>).message;
  if (typeof basicResponseMessage === "string") return basicResponseMessage;

  const detail = (payload as Record<string, unknown>).detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const message = (item as Record<string, unknown>).msg;
          return typeof message === "string" ? message : null;
        }
        return null;
      })
      .filter((item): item is string => !!item)
      .join("; ");
  }

  return null;
}

function extrairMensagemDeErro(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const basicResponseMessage = (payload as Record<string, unknown>).message;
    if (typeof basicResponseMessage === "string") return basicResponseMessage;
  }
  return getErrorDetail(payload) || `Erro na operação (${status}).`;
}


// --- REQUISIÇÕES BASE (API FETCH) ---

async function postAtualizacaoManual(
  payload: AtualizacaoManualPayload, 
  token: string
): Promise<Response> {
  return fetch(`${API_BASE}/admin/etl/atualizar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// ESSA É A FUNÇÃO QUE ESTAVA FALTANDO!
async function getStatusEtlRequest(token: string): Promise<Response> {
  return fetch(`${API_BASE}/admin/etl/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


// --- FUNÇÕES EXPORTADAS ---

/**
 * Dispara o início do processo de ETL
 */
export async function dispararAtualizacaoManual(
  pipelines: string[] | null = null
): Promise<AtualizacaoManualResponse> {
  const token = obterToken();
  if (!token) {
    throw new Error("Login de administrador necessario.");
  }

  let response = await postAtualizacaoManual({ pipelines }, token);

  if (response.status === 422 && pipelines === null) {
    response = await postAtualizacaoManual({ pipelines: [] }, token);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extrairMensagemDeErro(payload, response.status));
  }

  const result = payload as EtlTriggerResponse;

  if (response.status === 202 || result?.task_id) {
    return {
      message: result?.message || "Processo de atualização enfileirado com sucesso.",
      task_id: result?.task_id || "async_task_started"
    };
  }

  throw new Error("Resposta inesperada do servidor: task_id não encontrado.");
}

/**
 * Consulta o status atual do EaTL no backend
 */
export async function obterStatusEtl(): Promise<StatusEtlResponse> {
  const token = obterToken();
  if (!token) {
    throw new Error("Login de administrador necessario.");
  }

  const response = await getStatusEtlRequest(token);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extrairMensagemDeErro(payload, response.status));
  }

  return payload as StatusEtlResponse;
}