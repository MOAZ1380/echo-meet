type SameSite = "Strict" | "Lax" | "None";

type CookieOptions = {
  path?: string;
  sameSite?: SameSite;
  secure?: boolean;
  expiresDays?: number;
  maxAgeSeconds?: number;
};

function buildCookieOptions(options: CookieOptions = {}) {
  const path = options.path ?? "/";
  const sameSite = options.sameSite ?? "Lax";
  const secure = options.secure ?? window.location.protocol === "https:";

  let suffix = `; Path=${path}; SameSite=${sameSite}`;

  if (typeof options.maxAgeSeconds === "number") {
    suffix += `; Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`;
  } else if (typeof options.expiresDays === "number") {
    const expiresAt = new Date(
      Date.now() + options.expiresDays * 24 * 60 * 60 * 1000,
    );
    suffix += `; Expires=${expiresAt.toUTCString()}`;
  }

  if (secure) {
    suffix += "; Secure";
  }

  return suffix;
}

export function setCookie(
  name: string,
  value: string,
  options?: CookieOptions,
) {
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${encodedName}=${encodedValue}${buildCookieOptions(options)}`;
}

export function getCookie(name: string) {
  const encodedName = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const normalized = cookie.trim();
    if (normalized.startsWith(encodedName)) {
      return decodeURIComponent(normalized.slice(encodedName.length));
    }
  }

  return null;
}

export function deleteCookie(name: string, path = "/") {
  const encodedName = encodeURIComponent(name);
  document.cookie = `${encodedName}=; Path=${path}; Max-Age=0; SameSite=Lax`;
}

export function setJsonCookie<T>(
  name: string,
  value: T,
  options?: CookieOptions,
) {
  setCookie(name, JSON.stringify(value), options);
}

export function getJsonCookie<T>(name: string): T | null {
  const raw = getCookie(name);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
