type EnvImportMeta = ImportMeta & {
  env: {
    VITE_API_URL?: string;
  };
};

export const API_BASE = `${(import.meta as EnvImportMeta).env.VITE_API_URL ?? ""}`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Executes an HTTP request against backend API and normalizes errors.
 *
 * @param path API path relative to configured base url.
 * @param options Fetch options object.
 * @returns Parsed JSON response typed as `T`.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) {
        message = data.message.join(", ");
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      // Keep default message for non-JSON errors.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

/**
 * Builds authorization headers for bearer token protected endpoints.
 *
 * @param token JWT access token.
 * @returns Headers object containing `Authorization` header.
 */
export function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}
