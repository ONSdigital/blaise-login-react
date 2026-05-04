import type { User } from "../types/User";
import { ReactElement, useCallback, useEffect } from "react";
import type AuthenticationApi from "../services/AuthenticationApi";
import { useAsyncRequest } from "../hooks/useAsyncRequest";
import AsyncContent from "./AsyncContent";

interface RenderAuthenticatedContentProps {
  authenticationApi: AuthenticationApi;
  setLoggedIn: (loggedIn: boolean) => void;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}

export default function RenderAuthenticatedContent({
  authenticationApi,
  children,
  setLoggedIn,
}: RenderAuthenticatedContentProps): ReactElement {
  const fetchLoggedInUser = useCallback(
    () => authenticationApi.getLoggedInUser(),
    [authenticationApi],
  );

  const getUserState = useAsyncRequest<User>(fetchLoggedInUser);

  const logOutFunction = useCallback(
    () => authenticationApi.logOut(setLoggedIn),
    [authenticationApi, setLoggedIn],
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
