import { User } from "blaise-api-node-client";
import React, { ReactElement } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
interface RenderAuthenticatedContentProps {
    authenticationApi: AuthenticationApi;
    children: (user: User, loggedIn: boolean) => React.ReactNode;
}
export default function RenderAuthenticatedContent({ authenticationApi, children }: RenderAuthenticatedContentProps): ReactElement;
export {};
