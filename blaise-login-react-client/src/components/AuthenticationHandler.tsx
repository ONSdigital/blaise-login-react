import { User } from "blaise-api-node-client";
import React, { Component, ReactElement, useState } from "react";
import Authentication from "./Authentication";

interface AuthenticationProps {
  children: (user: User) => React.ReactNode;
}

export default class AuthenticationHandler extends Component<AuthenticationProps> {
  constructor(props: AuthenticationProps) {
    super(props);
  }

  render(): ReactElement {

  return (
    <Authentication>
      {this.props.children}
    </Authentication>
  );
    }
}