import { ReactElement, ReactNode } from "react";
import type { User } from "blaise-api-node-client";
import AuthenticateUserHandler from "./AuthenticateUserHandler";

interface AuthenticateProps {
  title?: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => ReactNode;
}

const Authenticate = ({ title = "Blaise login", children }: AuthenticateProps): ReactElement => {
  return <AuthenticateUserHandler title={title}>{children}</AuthenticateUserHandler>;
};

export default Authenticate;
