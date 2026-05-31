import { obterToken } from "./authService";

const API_BASE = "http://127.0.0.1:5000";

export interface AtualizacaoManualResponse {
  message: string;
  task_id: string;
}

type AtualizacaoManualPayload = {
  pipelines: string[] | null;
};

function getErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

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

async function extractErrorMessage(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null);
  return getErrorDetail(payload) || `Erro ao iniciar atualizacao (${response.status}).`;
}

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

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return response.json();
}
