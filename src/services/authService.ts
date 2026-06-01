import { API_BASE_URL } from "../config/env";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UsuarioResponse {
  id: string;
  email: string;
  nome: string | null;
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail ?? "Credenciais inválidas");
  }

  return response.json();
}

export async function getMe(token: string): Promise<UsuarioResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Token inválido");
  }

  return response.json();
}

function notificarMudancaAuth(): void {
  window.dispatchEvent(new Event("authChanged"));
}

export function salvarToken(token: string): void {
  localStorage.setItem("atlas_token", token);
  notificarMudancaAuth();
}

export function obterToken(): string | null {
  return localStorage.getItem("atlas_token");
}

export function removerToken(): void {
  localStorage.removeItem("atlas_token");
  notificarMudancaAuth();
}

export function estaAutenticado(): boolean {
  return !!obterToken();
}

/** Headers com Content-Type; inclui Bearer apenas se houver token. */
export function headersComAuth(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra as Record<string, string>),
  };
  const token = obterToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Headers de autenticação opcional (GET/DELETE sem body). */
export function headersAuthSomente(): HeadersInit {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
