import { ONSPanel } from "blaise-design-system-react-components";
import { ReactElement, useCallback } from "react";
import { useAsyncRequest } from "../hooks/useAsyncRequest";
import AsyncContent from "./AsyncContent";
import type AuthenticationApi from "../services/AuthenticationApi";
import LoginForm from "./LoginForm";
import LayoutTemplate from "./LayoutTemplate";

interface AuthenticateUserProps {
  title: string;
  authenticationApi: AuthenticationApi;
  setLoggedIn: (loggedIn: boolean) => void;
}

export default function AuthenticateUser({
  title,
  authenticationApi,
  setLoggedIn,
}: AuthenticateUserProps): ReactElement {
  const checkAuthStatus = useCallback(async () => {
    const isLoggedIn = await authenticationApi.loggedIn();

    setLoggedIn(isLoggedIn);
  }, [authenticationApi, setLoggedIn]);

  const authState = useAsyncRequest<void>(checkAuthStatus);

  return (
    <AsyncContent content={authState}>
      {() => (
        <LayoutTemplate title={title}>
          <ONSPanel status="info">Enter your Blaise username and password</ONSPanel>
          <LoginForm
            authManager={authenticationApi}
            setLoggedIn={setLoggedIn}
          />
        </LayoutTemplate>
      )}
    </AsyncContent>
  );
}
