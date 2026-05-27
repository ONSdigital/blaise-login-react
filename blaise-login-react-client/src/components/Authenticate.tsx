import { type ReactElement, type ReactNode } from "react";

import AuthUserHandler from "./AuthUserHandler";

import type { User } from "../types/user.types";

interface AuthenticateProps {
  title?: string;
  sessionKey: string;
  cookieDomain?: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => ReactNode;
}

export const Authenticate = ({
  title = "Blaise login",
  sessionKey,
  cookieDomain,
  children,
}: AuthenticateProps): ReactElement => {
  return (
    <AuthUserHandler
      title={title}
      sessionKey={sessionKey}
      cookieDomain={cookieDomain}
    >
      {children}
    </AuthUserHandler>
  );
};
