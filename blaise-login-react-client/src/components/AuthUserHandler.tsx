import { LoadingPanel, Panel } from "blaise-design-system-react-components";
import { type ReactElement, type ReactNode, useEffect, useState } from "react";

import { AuthClient } from "../services/authClient";

import LayoutTemplate from "./LayoutTemplate";
import LoginView from "./LoginView";

import type { User } from "../types/user.types";

interface AuthUserHandlerProps {
  title: string;
  sessionKey: string;
  cookieDomain?: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => ReactNode;
}

type AuthState =
  | { state: "authenticated"; user: User }
  | { state: "error"; message: string }
  | { state: "loading" }
  | { state: "unauthenticated" };

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to check sign in status";
}

export default function AuthUserHandler({
  title,
  sessionKey,
  cookieDomain,
  children,
}: AuthUserHandlerProps): ReactElement {
  const [authState, setAuthState] = useState<AuthState>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    // Changed: load the current user once per shared session config so the UI uses one source of truth instead of separate validation and user fetch requests.
    async function loadCurrentUser(): Promise<void> {
      setAuthState({ state: "loading" });

      try {
        const user = await new AuthClient({ sessionKey, cookieDomain }).getLoggedInUser();

        if (cancelled) {
          return;
        }

        setAuthState(user ? { state: "authenticated", user } : { state: "unauthenticated" });
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        setAuthState({ state: "error", message: getAuthErrorMessage(error) });
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [cookieDomain, sessionKey]);

  async function handleAuthenticated(token: string): Promise<void> {
    const authClient = new AuthClient({ sessionKey, cookieDomain });

    authClient.setToken(token);

    try {
      const user = await authClient.getLoggedInUser();

      if (!user) {
        authClient.clearToken();
        setAuthState({ state: "unauthenticated" });

        return;
      }

      setAuthState({ state: "authenticated", user });
    } catch (error: unknown) {
      authClient.clearToken();
      setAuthState({ state: "error", message: getAuthErrorMessage(error) });
    }
  }

  function handleLogOut(): void {
    new AuthClient({ sessionKey, cookieDomain }).logOut();
    setAuthState({ state: "unauthenticated" });
  }

  if (authState.state === "authenticated") {
    return <>{children(authState.user, true, handleLogOut)}</>;
  }

  if (authState.state === "loading") {
    return (
      <LayoutTemplate title={title}>
        <LoadingPanel />
      </LayoutTemplate>
    );
  }

  if (authState.state === "error") {
    return (
      <LayoutTemplate title={title}>
        <Panel status="error">{authState.message}</Panel>
      </LayoutTemplate>
    );
  }

  return (
    <LoginView
      title={title}
      onAuthenticated={handleAuthenticated}
    />
  );
}
