import { User } from "blaise-api-node-client";
import React, { Component, ReactElement } from "react";
interface AuthenticateProps {
    title?: string;
    children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}
export default class Authenticate extends Component<AuthenticateProps> {
    constructor(props: AuthenticateProps);
    render(): ReactElement;
}
export {};
