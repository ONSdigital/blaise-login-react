import { type ReactElement, useCallback, useEffect } from "react";

import { useAsyncRequest } from "../hooks/useAsyncRequest";

import AsyncContent from "./AsyncContent";

import type { AuthClient } from "../services/authClient";
import type { User } from "../types/user.types";

interface RenderAuthenticatedContentProps {
  authClient: AuthClient;
  setLoggedIn: (loggedIn: boolean) => void;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}

export default function RenderAuthenticatedContent({
  authClient,
  children,
  setLoggedIn,
}: RenderAuthenticatedContentProps): ReactElement {
  const fetchLoggedInUser = useCallback(() => authClient.getLoggedInUser(), [authClient]);

  const getUserState = useAsyncRequest<User>(fetchLoggedInUser);

  const logOutFunction = useCallback(
    () => authClient.logOut(setLoggedIn),
    [authClient, setLoggedIn],
  );

  return (
    <AsyncContent content={getUserState}>
      {(user) => (
        <UserSessionValidator
          user={user}
          logOutFunction={logOutFunction}
        >
          {children}
        </UserSessionValidator>
      )}
    </AsyncContent>
  );
}

interface UserSessionValidatorProps {
  user: User;
  logOutFunction: () => void;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}

function UserSessionValidator({
  user,
  logOutFunction,
  children,
}: UserSessionValidatorProps): ReactElement {
  useEffect(() => {
    if (!user.name) {
      logOutFunction();
    }
  }, [user.name, logOutFunction]);

  return <>{children(user, true, logOutFunction)}</>;
}
