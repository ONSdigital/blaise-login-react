import { Panel } from "blaise-design-system-react-components";
import { type ReactElement, useCallback } from "react";

import { useAsyncRequest } from "../hooks/useAsyncRequest";

import AsyncContent from "./AsyncContent";
import LayoutTemplate from "./LayoutTemplate";
import { LoginForm } from "./LoginForm";

import type { AuthClient } from "../services/authClient";

interface AuthUserProps {
  title: string;
  authClient: AuthClient;
  setLoggedIn: (loggedIn: boolean) => void;
}

export default function AuthUser({ title, authClient, setLoggedIn }: AuthUserProps): ReactElement {
  const checkAuthStatus = useCallback(async () => {
    const isLoggedIn = await authClient.loggedIn();

    setLoggedIn(isLoggedIn);
  }, [authClient, setLoggedIn]);

  const authState = useAsyncRequest<void>(checkAuthStatus);

  return (
    <AsyncContent content={authState}>
      {() => (
        <LayoutTemplate title={title}>
          <Panel status="info">Enter your Blaise username and password</Panel>
          <LoginForm
            authManager={authClient}
            setLoggedIn={setLoggedIn}
          />
        </LayoutTemplate>
      )}
    </AsyncContent>
  );
}
