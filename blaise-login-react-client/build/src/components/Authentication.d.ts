import { User } from "blaise-api-node-client";
import React, { Component, ReactElement } from "react";
interface AuthenticationProps {
    children: (user: User) => React.ReactNode;
}
export default class Authentication extends Component<AuthenticationProps> {
    constructor(props: AuthenticationProps);
    render(): ReactElement;
}
export {};
