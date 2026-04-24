import { ReactElement, useState, useMemo } from "react";
import type { User } from "blaise-api-node-client";
import AuthenticationApi from "../services/AuthenticationApi";
import RenderAuthenticatedContent from "./RenderAuthenticatedContent";
import AuthenticateUser from "./AuthenticateUser";

interface AuthenticateUserHandlerProps {
  title: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}

export default function AuthenticateUserHandler({
  title,
  children,
}: AuthenticateUserHandlerProps): ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);

  const authenticationApi = useMemo(() => new AuthenticationApi(), []);

  return (
    <>
      {loggedIn ? (
        <RenderAuthenticatedContent
          authenticationApi={authenticationApi}
          setLoggedIn={setLoggedIn}
        >
          {children}
        </RenderAuthenticatedContent>
      ) : (
        <AuthenticateUser
          title={title}
          authenticationApi={authenticationApi}
          setLoggedIn={setLoggedIn}
        />
      )}
    </>
  );
}
