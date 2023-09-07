import { User } from "blaise-api-node-client";
import React, { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
import { useAsyncRequestWithParam } from "../hooks/useAsyncRequest";
import AsyncContent from "./AsyncContent";

interface RenderAuthenticatedContentProps {
  authenticationApi: AuthenticationApi;
  setLoggedIn: (loggedIn: boolean) => void;
  children: (user: User, loggedIn:boolean, 
  logOutFunction: () => void) => React.ReactNode;
}

async function getLoggedInUser(authenticationApi: AuthenticationApi): Promise<User> {
  return authenticationApi.getLoggedInUser();
}

export default function RenderAuthenticatedContent({ authenticationApi, children, setLoggedIn }:RenderAuthenticatedContentProps): ReactElement {
  const getUser = useAsyncRequestWithParam<User, AuthenticationApi>(getLoggedInUser, authenticationApi);
  return (
   <AsyncContent content={getUser}>
      {(user) => (
        children(user, true, () => authenticationApi.logOut(setLoggedIn))
      )}
    </AsyncContent> 
  );
}
