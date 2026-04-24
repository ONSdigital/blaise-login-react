import Cookies, { CookieSetOptions } from "universal-cookie";
import { validateToken } from "./user";

const sessionKey = "blaise-user";

export class AuthManager {
  cookies: Cookies = new Cookies();

  public getToken = (): string | null => {
    return this.cookies.get(sessionKey);
  };

  public setToken = (token: string | null): void => {
    this.cookies.set(sessionKey, token, this.cookieSettings());
  };

  public clearToken = (): void => {
    this.setToken(null);
    this.cookies.remove(sessionKey, this.cookieSettings());
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
    const host = window.location.hostname;
    const domain = host.substring(host.indexOf(".") + 1);
    const secure = window.location.protocol === "https:";

    return {
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
      domain: domain,
      secure: secure,
      sameSite: "strict",
    };
  };
}
