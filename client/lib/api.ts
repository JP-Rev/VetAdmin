const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || `Error ${res.status}`);
  }
  return body as T;
}

const request = <T>(path: string, init?: RequestInit): Promise<T> =>
  fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body && !(init?.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  }).then((res) => handleResponse<T>(res));

export const apiGet = <T>(path: string): Promise<T> => request<T>(path);

export const apiPost = <T>(path: string, data?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined });

export const apiPut = <T>(path: string, data?: unknown): Promise<T> =>
  request<T>(path, { method: 'PUT', body: data !== undefined ? JSON.stringify(data) : undefined });

export const apiPatch = <T>(path: string, data?: unknown): Promise<T> =>
  request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined });

// Algunos borrados piden confirmacion (por ejemplo, la contraseña del usuario),
// por eso DELETE admite cuerpo opcional.
export const apiDelete = <T>(path: string, data?: unknown): Promise<T> =>
  request<T>(path, { method: 'DELETE', body: data !== undefined ? JSON.stringify(data) : undefined });

export const apiUpload = <T>(path: string, file: File): Promise<T> => {
  const formData = new FormData();
  formData.append('file', file);
  return request<T>(path, { method: 'POST', body: formData });
};
