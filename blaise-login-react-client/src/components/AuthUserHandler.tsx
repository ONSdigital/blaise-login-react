import { type ReactElement, useMemo, useState } from "react";

import { AuthClient } from "../services/authClient";

import AuthUser from "./AuthUser";
import RenderAuthenticatedContent from "./RenderAuthenticatedContent";

import type { User } from "../types/user.types";

interface AuthUserHandlerProps {
  title: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}

export default function AuthUserHandler({ title, children }: AuthUserHandlerProps): ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);

  const authClient = useMemo(() => new AuthClient(), []);

  return (
    <>
      {loggedIn ? (
        <RenderAuthenticatedContent
          authClient={authClient}
          setLoggedIn={setLoggedIn}
        >
          {children}
        </RenderAuthenticatedContent>
      ) : (
        <AuthUser
          title={title}
          authClient={authClient}
          setLoggedIn={setLoggedIn}
        />
      )}
    </>
  );
}
