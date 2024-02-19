import { User } from "blaise-api-node-client";
import React, { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
interface RenderAuthenticatedContentProps {
    authenticationApi: AuthenticationApi;
    setLoggedIn: (loggedIn: boolean) => void;
    children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}
export default function RenderAuthenticatedContent({ authenticationApi, children, setLoggedIn }: RenderAuthenticatedContentProps): ReactElement;
export {};
