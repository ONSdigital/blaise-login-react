import { type ReactElement, type ReactNode } from "react";

import AuthUserHandler from "./AuthUserHandler";

import type { User } from "../types/user.types";

interface AuthenticateProps {
  title?: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => ReactNode;
}

export const Authenticate = ({
  title = "Blaise login",
  children,
}: AuthenticateProps): ReactElement => {
  return <AuthUserHandler title={title}>{children}</AuthUserHandler>;
};
