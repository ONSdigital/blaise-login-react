import React, { ReactElement, useState } from "react";
import { User } from "blaise-api-node-client";
import AuthenticationApi from "../client/AuthenticationApi";
import RenderAuthenticatedContent from "./RenderAuthenticatedContent";
import AuthenticateUser from "./AuthenticateUser";

interface AuthenticateUserHandlerProps {
  children: (user: User, loggedIn:boolean) => React.ReactNode;
}

export default function AuthenticateUserHandler({ children }:AuthenticateUserHandlerProps): ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);
  const authenticationApi = new AuthenticationApi();

  return (
    <>
      {
        loggedIn
          ? <RenderAuthenticatedContent authenticationApi={authenticationApi}>{children}</RenderAuthenticatedContent>
          : <AuthenticateUser authenticationApi={authenticationApi} setLoggedIn={setLoggedIn} />
      }
    </>
  );
}