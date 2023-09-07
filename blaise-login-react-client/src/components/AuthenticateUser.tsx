import { ONSPanel } from "blaise-design-system-react-components";
import React, { ReactElement } from "react";
import { useAsyncRequestWithTwoParams } from "../hooks/useAsyncRequest";
import AsyncContent from "./AsyncContent";
import AuthenticationApi from "../client/AuthenticationApi";
import LoginForm from "./LoginForm";
import LayoutTemplate from "./LayoutTemplate";

interface AuthenticateUserProps {
  title:string;
  authenticationApi:AuthenticationApi;
  setLoggedIn: (loggedIn: boolean) => void;
}

async function loginUserIfAlreadyAuthenticated(authenticationApi:AuthenticationApi, setLoggedIn: (loggedIn: boolean) => void) {
  const loggedIn = await authenticationApi.loggedIn();
  setLoggedIn(loggedIn);
}

export default function AuthenticateUser({ title, authenticationApi, setLoggedIn }: AuthenticateUserProps): ReactElement {
  const logInUser = useAsyncRequestWithTwoParams<void, AuthenticationApi, (loggedIn: boolean) => void>(loginUserIfAlreadyAuthenticated, authenticationApi, setLoggedIn);

  return (
    <AsyncContent content={logInUser}>
      {() => (
          <LayoutTemplate title={title}>
            <ONSPanel status="info">Enter your Blaise username and password</ONSPanel>
            <LoginForm authManager={authenticationApi} setLoggedIn={setLoggedIn} />
          </LayoutTemplate>
      )}

    </AsyncContent>
  );
}
