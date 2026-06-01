import { API_BASE_URL } from "../config/env";

export const AUTH_TOKEN_KEY = "atlas_token";
export const AUTH_CHANGED_EVENT = "atlas_auth_changed";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UsuarioResponse {
  id: string;
  email: string;
  nome: string | null;
  role?: string | null;
  roles?: string[] | null;
  perfil?: string | null;
  papel?: string | null;
  tipo?: string | null;
  tipo_usuario?: string | null;
  nivel_acesso?: string | null;
  is_admin?: boolean | null;
  admin?: boolean | null;
  is_superuser?: boolean | null;
  superuser?: boolean | null;
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
  notifyAuthChanged();
}
function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}


export function obterToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function removerToken(): void {
  localStorage.removeItem("atlas_token");
  notificarMudancaAuth();
  notifyAuthChanged();
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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const parsed: unknown = JSON.parse(decoded);

    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function isAdminValue(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.some(isAdminValue);

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["admin", "administrator", "administrador"].includes(normalized)) {
      return true;
    }

    return normalized
      .split(/[^a-z0-9]+/)
      .some((part) => ["admin", "administrator", "administrador"].includes(part));
  }

  return false;
}

function hasAdminClaim(source: Record<string, unknown> | null): boolean {
  if (!source) return false;

  return [
    "admin",
    "is_admin",
    "isAdmin",
    "is_superuser",
    "isSuperuser",
    "superuser",
    "role",
    "roles",
    "perfil",
    "perfis",
    "papel",
    "tipo",
    "tipo_usuario",
    "tipoUsuario",
    "nivel_acesso",
    "nivelAcesso",
    "scope",
    "scopes",
    "permissions",
    "permissoes",
  ].some((key) => isAdminValue(source[key]));
}

export function usuarioEhAdmin(usuario?: UsuarioResponse | null, token?: string | null): boolean {
  const tokenPayload = token ? decodeJwtPayload(token) : null;

  return (
    hasAdminClaim(usuario as Record<string, unknown> | null) ||
    hasAdminClaim(tokenPayload)
  );
}
