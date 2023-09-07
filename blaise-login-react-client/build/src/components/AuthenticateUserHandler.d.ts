import React, { ReactElement } from "react";
import { User } from "blaise-api-node-client";
interface AuthenticateUserHandlerProps {
    children: (user: User, loggedIn: boolean) => React.ReactNode;
}
export default function AuthenticateUserHandler({ children }: AuthenticateUserHandlerProps): ReactElement;
export {};
