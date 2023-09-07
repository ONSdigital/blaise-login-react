import { User } from "blaise-api-node-client";
import React, { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
import { useAsyncRequestWithParam } from "../hooks/useAsyncRequest";
import AsyncContent from "./AsyncContent";

interface RenderAuthenticatedContentProps {
  authenticationApi: AuthenticationApi;
  children: (user: User, loggedIn:boolean) => React.ReactNode;
}

async function getLoggedInUser(authenticationApi: AuthenticationApi): Promise<User> {
  return authenticationApi.getLoggedInUser();
}

export default function RenderAuthenticatedContent({ authenticationApi, children }:RenderAuthenticatedContentProps): ReactElement {
  const getUser = useAsyncRequestWithParam<User, AuthenticationApi>(getLoggedInUser, authenticationApi);
  return (
   <AsyncContent content={getUser}>
      {(user) => (
        children(user, true)
      )}
    </AsyncContent> 
  );
}
