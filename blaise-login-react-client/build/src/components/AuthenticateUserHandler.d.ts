import React, { ReactElement } from "react";
import { User } from "blaise-api-node-client";
interface AuthenticateUserHandlerProps {
    title: string;
    children: (user: User | null, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}
export default function AuthenticateUserHandler({ title, children }: AuthenticateUserHandlerProps): ReactElement;
export {};
