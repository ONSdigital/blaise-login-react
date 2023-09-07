import { User } from "blaise-api-node-client";
import React, { Component, ReactElement } from "react";
interface AuthenticateProps {
    children: (user: User, loggedIn: boolean) => React.ReactNode;
}
export default class Authenticate extends Component<AuthenticateProps> {
    constructor(props: AuthenticateProps);
    render(): ReactElement;
}
export {};
