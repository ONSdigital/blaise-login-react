import { User } from "blaise-api-node-client";
import React, { Component, ReactElement, useState } from "react";
import AuthenticationApi from "../client/AuthenticationApi";
import LayoutTemplate from "./LayoutTemplate";
import AuthenticationContent from "./AuthenticationContent";
import Login from "./Login";

interface AuthenticationProps {
  children: (user: User) => React.ReactNode;
}

export default class Authentication extends Component<AuthenticationProps> {
  constructor(props: AuthenticationProps) {
    super(props);
  }

  render(): ReactElement {
  //const [loggedIn, setLoggedIn] = useState(false);
  //const authenticationApi = new AuthenticationApi();

  return (
    <LayoutTemplate showSignOutButton={false} signOut={() => {}}>
      {
        <Login />
/*           loggedIn
            ? <AuthenticationContent authenticationApi={authenticationApi}>{this.props.children}</AuthenticationContent>
            : <Login authenticationApi={authenticationApi} setLoggedIn={setLoggedIn} /> */
      }
    </LayoutTemplate>
  );
    }
}