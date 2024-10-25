import { User } from "blaise-api-node-client";
import React, { Component, ReactElement } from "react";
import AuthenticateUserHandler from "./AuthenticateUserHandler";

interface AuthenticateProps {
  title?: string;
  children: (user: User, loggedIn: boolean, logOutFunction: () => void) => React.ReactNode;
}

export default class Authenticate extends Component<AuthenticateProps> {
  constructor(props: AuthenticateProps) {
    super(props);
  }

  render(): ReactElement {
    return (
      <AuthenticateUserHandler title={this.props.title ?? "Blaise login"}>
        {this.props.children}
      </AuthenticateUserHandler>
    );
  }
}