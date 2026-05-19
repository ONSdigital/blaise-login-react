import Cookies, { type CookieSetOptions } from "universal-cookie";

import { validateToken } from "./user";

const sessionKeyPrefix = "blaise-user";

export interface AuthManagerOptions {
  sessionKey: string;
  cookieDomain?: string;
}

function requiredValue(settingName: string, value: string | undefined): string {
  const normalisedValue = value?.trim() ?? "";

  if (!normalisedValue) {
    throw new Error(`${settingName} must be provided`);
  }

  return normalisedValue;
}

export function createSessionKey(environmentKey: string): string {
  return `${sessionKeyPrefix}-${requiredValue("environmentKey", environmentKey)}`;
}

export function normaliseCookieDomain(cookieDomain: string): string {
  const normalisedDomain = requiredValue("cookieDomain", cookieDomain).replace(/^\./, "");

  if (
    normalisedDomain.includes("://") ||
    normalisedDomain.includes("/") ||
    normalisedDomain.includes(":")
  ) {
    throw new Error("cookieDomain must be a bare domain name without a protocol, path, or port");
  }

  return normalisedDomain;
}

export class AuthManager {
  cookies: Cookies = new Cookies();
  readonly sessionKey: string;
  readonly cookieDomain?: string;

  constructor(options: AuthManagerOptions) {
    this.sessionKey = requiredValue("sessionKey", options.sessionKey);
    this.cookieDomain = options.cookieDomain
      ? normaliseCookieDomain(options.cookieDomain)
      : undefined;
  }

  public getToken = (): string | null => {
    return this.cookies.get(this.sessionKey);
  };

  public setToken = (token: string | null): void => {
    this.cookies.set(this.sessionKey, token, this.cookieSettings());
  };

  public clearToken = (): void => {
    this.setToken(null);
    this.cookies.remove(this.sessionKey, this.cookieSettings());
  };

  public loggedIn = async (): Promise<boolean> => {
    try {
      return await validateToken(this.getToken());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`Error checking logged in state: ${errorMessage}`);

      return false;
    }
  };

  public authHeader = (): Record<string, string> => {
    const token = this.getToken();

    if (!token) {
      return {};
    }

    return {
      authorization: token,
    };
  };

  public cookieSettings = (): CookieSetOptions => {
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";

    const settings: CookieSetOptions = {
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
      secure: secure,
      sameSite: "strict",
    };

    if (this.cookieDomain) {
      settings.domain = this.cookieDomain;
    }

    return settings;
  };
}
