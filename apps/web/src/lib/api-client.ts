const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, token }),
};

export type UserRole = "seller" | "supplier" | "agent" | "manager" | "admin";
export type AccountStatus = "pending_review" | "active" | "rejected" | "suspended" | "banned";

export interface UserPublic {
  id: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
  full_name: string;
  email: string;
  phone: string;
  company_name?: string | null;
  fiscal_number?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

export interface RegisterResponse {
  user: UserPublic;
  message: string;
}

export const authApi = {
  login: (username_or_email: string, password: string) =>
    apiClient.post<TokenResponse>("/auth/login", { username_or_email, password }),
  me: (token: string) => apiClient.get<UserPublic>("/auth/me", token),
  registerSeller: (payload: Record<string, unknown>) =>
    apiClient.post<RegisterResponse>("/auth/register/seller", payload),
  registerSupplier: (payload: Record<string, unknown>) =>
    apiClient.post<RegisterResponse>("/auth/register/supplier", payload),
};
